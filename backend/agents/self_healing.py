"""
SelfHealingAgent — monitors the content pipeline for failures and auto-recovers.

Checks performed on each run:
  1. Stuck articles      — "selected" with 0 rewrites for >6 hours. (logged)
  2. Partial rewrites    — "selected" with some but not all 4 age-groups written. (logged)
  3. Failed rewrites     — any rewrites.{age_group}.rewrite_status == "failed".
                           Removes that entry via $unset so the rewrite job retries it.
  4. Stale raw articles  — "raw" with crawled_at older than 72 hours → "expired".
"""

import logging
from datetime import datetime, timezone, timedelta

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

AGE_GROUPS = ("8-10", "11-13", "14-16", "17-20")
STUCK_HOURS = 6
STALE_HOURS = 72


class SelfHealingAgent(BaseAgent):
    name = "self_healing"
    description = (
        "Monitors the content pipeline for stuck, partial, failed, and stale "
        "articles, and auto-recovers where possible."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)

        stuck_count = await self._handle_stuck(db, run_id, now)
        partial_count = await self._handle_partial(db, run_id)
        failed_count = await self._handle_failed(db, run_id)
        expired_count = await self._handle_stale(db, run_id, now)

        stats = {
            "stuck_articles": stuck_count,
            "partial_rewrites": partial_count,
            "failed_rewrites_cleared": failed_count,
            "stale_articles_expired": expired_count,
        }

        await self.log_event(db, run_id, "summary", stats)
        logger.info(f"[{self.name}] Completed: {stats}")
        return stats

    # ------------------------------------------------------------------
    # 1. Stuck articles — "selected", no rewrites, older than 6 hours
    # ------------------------------------------------------------------

    async def _handle_stuck(self, db, run_id: str, now: datetime) -> int:
        cutoff = (now - timedelta(hours=STUCK_HOURS)).isoformat()

        cursor = db.articles.find(
            {
                "rewrite_status": "selected",
                "$or": [
                    {"rewrites": {"$exists": False}},
                    {"rewrites": {}},
                ],
                "crawled_at": {"$lt": cutoff},
            },
            {"_id": 0, "id": 1, "title": 1, "crawled_at": 1},
        )

        count = 0
        async for article in cursor:
            count += 1
            await self.log_event(
                db,
                run_id,
                "stuck_article",
                {
                    "article_id": article.get("id"),
                    "title": article.get("title"),
                    "crawled_at": article.get("crawled_at"),
                },
            )
            logger.warning(
                f"[{self.name}] Stuck article id={article.get('id')} "
                f"crawled_at={article.get('crawled_at')}"
            )

        return count

    # ------------------------------------------------------------------
    # 2. Partial rewrites — "selected" with 1-3 age groups completed
    # ------------------------------------------------------------------

    async def _handle_partial(self, db, run_id: str) -> int:
        # Fetch all "selected" articles that have at least one rewrite entry
        cursor = db.articles.find(
            {
                "rewrite_status": "selected",
                "rewrites": {"$exists": True, "$ne": {}},
            },
            {"_id": 0, "id": 1, "title": 1, "rewrites": 1},
        )

        count = 0
        async for article in cursor:
            rewrites = article.get("rewrites") or {}
            missing = [g for g in AGE_GROUPS if g not in rewrites]
            if 0 < len(missing) < len(AGE_GROUPS):
                count += 1
                await self.log_event(
                    db,
                    run_id,
                    "partial_rewrite",
                    {
                        "article_id": article.get("id"),
                        "title": article.get("title"),
                        "missing_groups": missing,
                    },
                )
                logger.warning(
                    f"[{self.name}] Partial rewrite id={article.get('id')} "
                    f"missing={missing}"
                )

        return count

    # ------------------------------------------------------------------
    # 3. Failed rewrites — remove failed entries so the job retries them
    # ------------------------------------------------------------------

    async def _handle_failed(self, db, run_id: str) -> int:
        count = 0

        for age_group in AGE_GROUPS:
            field = f"rewrites.{age_group}.rewrite_status"

            cursor = db.articles.find(
                {field: "failed"},
                {"_id": 0, "id": 1, "title": 1},
            )

            async for article in cursor:
                unset_key = f"rewrites.{age_group}"
                await db.articles.update_one(
                    {"id": article.get("id")},
                    {"$unset": {unset_key: ""}},
                )
                count += 1
                await self.log_event(
                    db,
                    run_id,
                    "failed_rewrite_cleared",
                    {
                        "article_id": article.get("id"),
                        "title": article.get("title"),
                        "age_group": age_group,
                    },
                )
                logger.info(
                    f"[{self.name}] Cleared failed rewrite id={article.get('id')} "
                    f"age_group={age_group}"
                )

        return count

    # ------------------------------------------------------------------
    # 4. Stale raw articles — "raw" older than 72 hours → "expired"
    # ------------------------------------------------------------------

    async def _handle_stale(self, db, run_id: str, now: datetime) -> int:
        cutoff = (now - timedelta(hours=STALE_HOURS)).isoformat()

        result = await db.articles.update_many(
            {
                "rewrite_status": "raw",
                "crawled_at": {"$lt": cutoff},
            },
            {"$set": {"rewrite_status": "expired"}},
        )

        count = result.modified_count
        if count:
            await self.log_event(
                db,
                run_id,
                "stale_articles_expired",
                {"count": count, "cutoff": cutoff},
            )
            logger.info(f"[{self.name}] Expired {count} stale raw articles (cutoff={cutoff})")

        return count


register(SelfHealingAgent())
