"""
RewriteQAAgent — post-rewrite quality gate for The Drop.

For each article that has been fully rewritten (rewrite_status == "rewritten")
but not yet QA'd (qa_status absent), this agent:

  1. Runs structural checks (word count, required fields) without any API call.
     Structural failures are immediately flagged as "major".

  2. Sends structurally-passing rewrites to Claude for a semantic QA review
     covering factual accuracy, age-appropriateness, completeness, and tone.
     Claude returns JSON: {pass, issues, severity}
     severity: "none" | "minor" | "major" | "critical"

  3. Acts on the result:
     - "critical"      → remove rewrite ($unset), reset article to "selected"
     - "major"         → flag, keep rewrite
     - "minor"/"none"  → pass

  4. Updates each article with qa_status ("passed"|"flagged"|"rejected")
     and qa_issues dict keyed by age group.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

AGE_GROUPS = ("8-10", "11-13", "14-16", "17-20")

# Minimum body word counts per age group
MIN_WORD_COUNTS: dict[str, int] = {
    "8-10":  120,
    "11-13": 140,
    "14-16": 150,
    "17-20": 150,
}

REQUIRED_REWRITE_FIELDS = ("title", "summary", "body", "wonder_question")

MODEL = "claude-sonnet-4-5"

QA_SYSTEM_PROMPT = """\
You are a quality assurance editor for The Drop, a youth news platform.
Your job is to review a rewritten article for a specific age group against the original article.

Evaluate the rewrite on four criteria:
1. Factual accuracy — does the rewrite preserve the key facts from the original without distortion?
2. Age-appropriateness — is the vocabulary, sentence complexity, and tone suitable for the target age group?
3. Completeness — does the rewrite cover the essential information from the original (no critical omissions)?
4. Tone — is it engaging, neutral, and appropriate for young readers (avoids alarming, biased, or adult language)?

Respond with a JSON object only — no explanation text outside the JSON:
{
  "pass": true | false,
  "issues": ["<issue description>", ...],
  "severity": "none" | "minor" | "major" | "critical"
}

Severity guide:
- "none"     — excellent quality, no issues
- "minor"    — small issues that don't compromise the rewrite (e.g., slightly stiff phrasing)
- "major"    — significant issues that should be reviewed before publishing (e.g., important fact omitted, poor age-targeting)
- "critical" — serious problems that require a full rewrite (e.g., factual errors, wildly inappropriate content)

Always use severity "none" when pass is true and there are no issues.
Use severity "critical" only for genuinely problematic content.
"""


class RewriteQAAgent(BaseAgent):
    name = "rewrite_qa"
    description = (
        "Post-rewrite quality gate: structural checks and Claude-powered semantic "
        "review of article rewrites for factual accuracy, age-appropriateness, "
        "completeness, and tone."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)
        cutoff = (now - timedelta(hours=6)).isoformat()
        anthropic = clients["anthropic"]

        # Find up to 20 articles: rewritten but not yet QA'd, crawled in last 6 hours
        cursor = db.articles.find(
            {
                "rewrite_status": "rewritten",
                "qa_status": {"$exists": False},
                "crawled_at": {"$gte": cutoff},
            },
            limit=20,
        )

        stats = {
            "articles_checked": 0,
            "passed": 0,
            "flagged": 0,
            "rejected": 0,
            "structural_failures": 0,
            "claude_reviews": 0,
        }

        async for article in cursor:
            stats["articles_checked"] += 1
            article_id = article.get("id")
            rewrites = article.get("rewrites") or {}

            # Per-age-group QA results accumulated before writing
            all_issues: dict[str, dict] = {}
            overall_max_severity = "none"

            for age_group in AGE_GROUPS:
                rewrite = rewrites.get(age_group)
                if not rewrite:
                    # Age group not present — skip (self_healing handles partial rewrites)
                    continue

                if rewrite.get("rewrite_status") != "rewritten":
                    continue

                # ------------------------------------------------------------------
                # Step 1: Structural checks (no API call)
                # ------------------------------------------------------------------
                structural_issues = self._structural_check(age_group, rewrite)

                if structural_issues:
                    stats["structural_failures"] += 1
                    all_issues[age_group] = {
                        "severity": "major",
                        "issues": structural_issues,
                        "source": "structural",
                    }
                    overall_max_severity = self._max_severity(overall_max_severity, "major")
                    await self.log_event(db, run_id, "structural_failure", {
                        "article_id": article_id,
                        "age_group": age_group,
                        "issues": structural_issues,
                    })
                    continue

                # ------------------------------------------------------------------
                # Step 2: Claude QA review
                # ------------------------------------------------------------------
                stats["claude_reviews"] += 1
                claude_result = await self._claude_review(
                    anthropic, article, age_group, rewrite
                )

                severity = claude_result.get("severity", "none")
                issues_list = claude_result.get("issues", [])

                all_issues[age_group] = {
                    "severity": severity,
                    "issues": issues_list,
                    "source": "claude",
                    "pass": claude_result.get("pass", True),
                }
                overall_max_severity = self._max_severity(overall_max_severity, severity)

                await self.log_event(db, run_id, "claude_qa_result", {
                    "article_id": article_id,
                    "age_group": age_group,
                    "severity": severity,
                    "pass": claude_result.get("pass", True),
                    "issues": issues_list,
                })

            # ------------------------------------------------------------------
            # Step 3: Determine final outcome and update MongoDB
            # ------------------------------------------------------------------
            qa_status, mongo_update = self._build_update(
                article_id, overall_max_severity, all_issues, rewrites
            )

            await db.articles.update_one({"id": article_id}, mongo_update)

            if qa_status == "passed":
                stats["passed"] += 1
            elif qa_status == "flagged":
                stats["flagged"] += 1
            else:
                stats["rejected"] += 1

            await self.log_event(db, run_id, "qa_outcome", {
                "article_id": article_id,
                "qa_status": qa_status,
                "max_severity": overall_max_severity,
            })
            logger.info(
                f"[{self.name}] article_id={article_id} "
                f"qa_status={qa_status} max_severity={overall_max_severity}"
            )

        await self.log_event(db, run_id, "summary", stats)
        logger.info(f"[{self.name}] Completed: {stats}")
        return stats

    # ------------------------------------------------------------------
    # Structural checks
    # ------------------------------------------------------------------

    def _structural_check(self, age_group: str, rewrite: dict) -> list[str]:
        issues = []

        # Required fields
        for field in REQUIRED_REWRITE_FIELDS:
            if not rewrite.get(field):
                issues.append(f"Missing required field: {field}")

        # Word count check
        body = rewrite.get("body") or ""
        word_count = len(body.split())
        minimum = MIN_WORD_COUNTS[age_group]
        if word_count < minimum:
            issues.append(
                f"Body too short: {word_count} words (minimum {minimum} for age group {age_group})"
            )

        return issues

    # ------------------------------------------------------------------
    # Claude QA review
    # ------------------------------------------------------------------

    async def _claude_review(
        self, anthropic, article: dict, age_group: str, rewrite: dict
    ) -> dict:
        original_title = article.get("title", "")
        original_body = article.get("body") or article.get("content") or ""
        original_summary = article.get("summary") or ""

        rewrite_title = rewrite.get("title", "")
        rewrite_summary = rewrite.get("summary", "")
        rewrite_body = rewrite.get("body", "")
        wonder_question = rewrite.get("wonder_question", "")

        user_message = f"""\
Original article (source material):
Title: {original_title}
Summary: {original_summary}
Body: {original_body}

---

Rewritten version for age group {age_group}:
Title: {rewrite_title}
Summary: {rewrite_summary}
Body: {rewrite_body}
Wonder question: {wonder_question}

Please review the rewrite against the original and respond with a JSON object only.
"""

        try:
            response = await anthropic.messages.create(
                model=MODEL,
                max_tokens=512,
                system=QA_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )

            raw_text = response.content[0].text.strip()

            # Strip markdown code fences if present
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                raw_text = "\n".join(
                    line for line in lines
                    if not line.startswith("```")
                ).strip()

            result = json.loads(raw_text)

            # Validate shape
            if not isinstance(result, dict):
                raise ValueError("Claude returned non-dict JSON")
            result.setdefault("pass", True)
            result.setdefault("issues", [])
            result.setdefault("severity", "none")
            return result

        except Exception as exc:
            logger.warning(
                f"[{self.name}] Claude QA failed for age_group={age_group}: {exc}"
            )
            # On error, treat as minor so we don't block publication
            return {"pass": True, "issues": [f"QA review error: {exc}"], "severity": "minor"}

    # ------------------------------------------------------------------
    # Determine outcome and build MongoDB update
    # ------------------------------------------------------------------

    def _build_update(
        self,
        article_id: str,
        max_severity: str,
        all_issues: dict,
        rewrites: dict,
    ) -> tuple[str, dict]:
        """Return (qa_status, mongo_update_doc)."""

        if max_severity == "critical":
            qa_status = "rejected"
            # Find which age groups have critical severity and remove them;
            # reset article rewrite_status to "selected" so rewrite agent picks it up again
            unset_fields: dict[str, str] = {}
            for age_group, result in all_issues.items():
                if result.get("severity") == "critical":
                    unset_fields[f"rewrites.{age_group}"] = ""

            update: dict = {
                "$set": {
                    "qa_status": "rejected",
                    "qa_issues": all_issues,
                    "rewrite_status": "selected",
                },
            }
            if unset_fields:
                update["$unset"] = unset_fields

        elif max_severity == "major":
            qa_status = "flagged"
            update = {
                "$set": {
                    "qa_status": "flagged",
                    "qa_issues": all_issues,
                },
            }
        else:
            # "minor" or "none" — pass
            qa_status = "passed"
            update = {
                "$set": {
                    "qa_status": "passed",
                    "qa_issues": all_issues,
                },
            }

        return qa_status, update

    # ------------------------------------------------------------------
    # Severity ordering helper
    # ------------------------------------------------------------------

    @staticmethod
    def _max_severity(current: str, new: str) -> str:
        order = {"none": 0, "minor": 1, "major": 2, "critical": 3}
        if order.get(new, 0) > order.get(current, 0):
            return new
        return current


register(RewriteQAAgent())
