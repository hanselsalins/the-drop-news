"""
SensitivityAgent — second-pass safety review for youth audiences.

For each article that has been rewritten but not yet safety-reviewed, sends
every age-group rewrite to Claude for a structured content assessment.

Actions taken per rewrite based on Claude's recommendation:
  approve       — no changes
  add_warning   — sets rewrites.<age_group>.content_warning
  rewrite       — removes the rewrite entry, resets article to "selected"
  suppress      — sets rewrites.<age_group>.suppressed = True

After all rewrites for an article are reviewed the article is marked with
  safety_reviewed: True
  safety_details:  {<age_group>: <review result>, ...}
"""

import json
import logging
from datetime import datetime, timezone, timedelta

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

AGE_GROUPS = ("8-10", "11-13", "14-16", "17-20")
CRAWL_WINDOW_HOURS = 6
ARTICLE_LIMIT = 20
MODEL = "claude-sonnet-4-5"

# Per-age-group system prompts — strictness increases toward younger audiences
_SYSTEM_PROMPTS = {
    "8-10": (
        "You are a child-safety content reviewer for a news platform aimed at children aged 8–10. "
        "Apply the strictest possible standards. Even mild references to violence, death, fear, "
        "mental health struggles, sexual topics, substance use, political bias, or discrimination "
        "must be flagged. Content should feel completely safe and reassuring for a young child. "
        "Respond ONLY with a JSON object (no markdown fences) with these exact keys:\n"
        "  safe            (boolean)\n"
        "  flags           (list of strings — concern categories found)\n"
        "  risk_level      (\"none\"|\"low\"|\"medium\"|\"high\")\n"
        "  recommendation  (\"approve\"|\"add_warning\"|\"rewrite\"|\"suppress\")\n"
        "  suggested_warning (string or null — short parent/reader advisory if needed)"
    ),
    "11-13": (
        "You are a content safety reviewer for a youth news platform targeting readers aged 11–13. "
        "Apply strict standards appropriate for early adolescents. Flag graphic violence, "
        "explicit mental-health distress, sexual content, strong political bias, significant "
        "fear-inducing content, and discrimination. Age-appropriate mentions of conflict or "
        "challenge are acceptable if handled sensitively. "
        "Respond ONLY with a JSON object (no markdown fences) with these exact keys:\n"
        "  safe            (boolean)\n"
        "  flags           (list of strings — concern categories found)\n"
        "  risk_level      (\"none\"|\"low\"|\"medium\"|\"high\")\n"
        "  recommendation  (\"approve\"|\"add_warning\"|\"rewrite\"|\"suppress\")\n"
        "  suggested_warning (string or null — short reader advisory if needed)"
    ),
    "14-16": (
        "You are a content safety reviewer for a youth news platform targeting readers aged 14–16. "
        "Apply moderate standards suitable for teenagers. Flag graphic violence, explicit sexual "
        "content, content that glorifies self-harm, extreme political bias, and overt discrimination. "
        "Discussion of difficult real-world topics (conflict, inequality, mental health) is acceptable "
        "when handled responsibly. "
        "Respond ONLY with a JSON object (no markdown fences) with these exact keys:\n"
        "  safe            (boolean)\n"
        "  flags           (list of strings — concern categories found)\n"
        "  risk_level      (\"none\"|\"low\"|\"medium\"|\"high\")\n"
        "  recommendation  (\"approve\"|\"add_warning\"|\"rewrite\"|\"suppress\")\n"
        "  suggested_warning (string or null — short reader advisory if needed)"
    ),
    "17-20": (
        "You are a content safety reviewer for a youth news platform targeting readers aged 17–20. "
        "Apply lenient but responsible standards suitable for young adults. Only flag content that "
        "is gratuitously violent, explicitly sexual, promotes self-harm, or contains blatant "
        "hate speech or discrimination. Mature and complex topics handled in a journalistic manner "
        "are generally acceptable. "
        "Respond ONLY with a JSON object (no markdown fences) with these exact keys:\n"
        "  safe            (boolean)\n"
        "  flags           (list of strings — concern categories found)\n"
        "  risk_level      (\"none\"|\"low\"|\"medium\"|\"high\")\n"
        "  recommendation  (\"approve\"|\"add_warning\"|\"rewrite\"|\"suppress\")\n"
        "  suggested_warning (string or null — short reader advisory if needed)"
    ),
}


class SensitivityAgent(BaseAgent):
    name = "sensitivity"
    description = (
        "Second-pass safety review: sends each age-group rewrite to Claude for "
        "structured content assessment and takes appropriate action (approve, "
        "add warning, trigger rewrite, or suppress)."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)
        cutoff = (now - timedelta(hours=CRAWL_WINDOW_HOURS)).isoformat()

        anthropic = clients["anthropic"]

        # Find articles that are rewritten but not yet safety-reviewed,
        # crawled within the last 6 hours.
        cursor = db.articles.find(
            {
                "rewrite_status": "rewritten",
                "safety_reviewed": {"$ne": True},
                "crawled_at": {"$gte": cutoff},
            },
            {"_id": 0},
        ).limit(ARTICLE_LIMIT)

        articles = await cursor.to_list(length=ARTICLE_LIMIT)

        stats = {
            "articles_reviewed": 0,
            "approved": 0,
            "warnings_added": 0,
            "sent_for_rewrite": 0,
            "suppressed": 0,
        }

        for article in articles:
            article_id = article.get("id")
            rewrites = article.get("rewrites") or {}

            if not rewrites:
                logger.debug(
                    f"[{self.name}] Skipping article {article_id} — no rewrites found"
                )
                continue

            safety_details: dict = {}
            needs_full_rewrite = False  # any age group triggered "rewrite"

            for age_group in AGE_GROUPS:
                rewrite = rewrites.get(age_group)
                if not rewrite:
                    continue

                # Skip already-suppressed or already-warned rewrites to avoid
                # double-processing on a re-run.
                if rewrite.get("suppressed"):
                    logger.debug(
                        f"[{self.name}] article={article_id} age_group={age_group} "
                        "already suppressed, skipping"
                    )
                    continue

                content = rewrite.get("rewritten_content") or rewrite.get("content") or ""
                title = article.get("title", "")

                review = await self._review_content(
                    anthropic, age_group, title, content, article_id
                )
                safety_details[age_group] = review

                recommendation = review.get("recommendation", "approve")
                logger.info(
                    f"[{self.name}] article={article_id} age_group={age_group} "
                    f"risk={review.get('risk_level')} recommendation={recommendation}"
                )

                if recommendation == "approve":
                    stats["approved"] += 1

                elif recommendation == "add_warning":
                    warning = review.get("suggested_warning") or "Contains mature themes."
                    await db.articles.update_one(
                        {"id": article_id},
                        {"$set": {f"rewrites.{age_group}.content_warning": warning}},
                    )
                    stats["warnings_added"] += 1
                    await self.log_event(
                        db, run_id, "warning_added",
                        {
                            "article_id": article_id,
                            "age_group": age_group,
                            "warning": warning,
                            "flags": review.get("flags", []),
                        },
                    )

                elif recommendation == "rewrite":
                    # Remove this age-group rewrite so the rewrite agent retries it
                    await db.articles.update_one(
                        {"id": article_id},
                        {"$unset": {f"rewrites.{age_group}": ""}},
                    )
                    stats["sent_for_rewrite"] += 1
                    needs_full_rewrite = True
                    await self.log_event(
                        db, run_id, "sent_for_rewrite",
                        {
                            "article_id": article_id,
                            "age_group": age_group,
                            "flags": review.get("flags", []),
                        },
                    )

                elif recommendation == "suppress":
                    await db.articles.update_one(
                        {"id": article_id},
                        {"$set": {f"rewrites.{age_group}.suppressed": True}},
                    )
                    stats["suppressed"] += 1
                    await self.log_event(
                        db, run_id, "suppressed",
                        {
                            "article_id": article_id,
                            "age_group": age_group,
                            "flags": review.get("flags", []),
                            "risk_level": review.get("risk_level"),
                        },
                    )

            # If any age-group rewrite was flagged for a full rewrite, push the
            # article status back to "selected" so all rewrites are regenerated.
            if needs_full_rewrite:
                await db.articles.update_one(
                    {"id": article_id},
                    {"$set": {"rewrite_status": "selected"}},
                )

            # Mark the article as safety-reviewed regardless of outcome
            await db.articles.update_one(
                {"id": article_id},
                {
                    "$set": {
                        "safety_reviewed": True,
                        "safety_details": safety_details,
                    }
                },
            )

            stats["articles_reviewed"] += 1

        await self.log_event(db, run_id, "summary", stats)
        logger.info(f"[{self.name}] Completed: {stats}")
        return stats

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _review_content(
        self,
        anthropic,
        age_group: str,
        title: str,
        content: str,
        article_id: str,
    ) -> dict:
        """
        Ask Claude to review a single rewrite for content safety.
        Returns a dict with keys: safe, flags, risk_level, recommendation,
        suggested_warning.  On any error, returns a safe default that
        approves the content so as not to accidentally suppress valid stories.
        """
        system_prompt = _SYSTEM_PROMPTS[age_group]
        user_message = (
            f"Please review the following news article rewrite for an audience aged {age_group}.\n\n"
            f"Title: {title}\n\n"
            f"Content:\n{content}"
        )

        try:
            response = await anthropic.messages.create(
                model=MODEL,
                max_tokens=512,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            raw = response.content[0].text.strip()

            # Claude may occasionally wrap JSON in markdown code fences — strip them
            if raw.startswith("```"):
                lines = raw.splitlines()
                raw = "\n".join(
                    line for line in lines if not line.startswith("```")
                ).strip()

            review = json.loads(raw)

            # Normalise: ensure required keys are present
            review.setdefault("safe", True)
            review.setdefault("flags", [])
            review.setdefault("risk_level", "none")
            review.setdefault("recommendation", "approve")
            review.setdefault("suggested_warning", None)

            return review

        except json.JSONDecodeError as exc:
            logger.warning(
                f"[{self.name}] JSON parse error for article={article_id} "
                f"age_group={age_group}: {exc}"
            )
            return {
                "safe": True,
                "flags": [],
                "risk_level": "none",
                "recommendation": "approve",
                "suggested_warning": None,
                "parse_error": str(exc),
            }
        except Exception as exc:
            logger.error(
                f"[{self.name}] Claude API error for article={article_id} "
                f"age_group={age_group}: {exc}",
                exc_info=True,
            )
            return {
                "safe": True,
                "flags": [],
                "risk_level": "none",
                "recommendation": "approve",
                "suggested_warning": None,
                "api_error": str(exc),
            }


register(SensitivityAgent())
