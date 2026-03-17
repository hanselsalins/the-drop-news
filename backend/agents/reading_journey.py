"""
ReadingJourneyAgent — tracks reading patterns and generates topic recommendations.

Strategy:
  - Finds users who have reacted to at least one article in the last 7 days.
  - Builds a category affinity profile from their reaction history:
      positive reactions (mind_blown, inspiring, surprising) are weighted 2x,
      neutral/negative reactions (angry, sad) are weighted 1x.
  - Skips users with fewer than 3 total reactions (insufficient data).
  - Upserts a reading_journeys document per user with:
      top_categories (top 3), category_affinity (full dict),
      total_reactions, and updated_at.
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

POSITIVE_REACTIONS = {"mind_blown", "inspiring", "surprising"}
POSITIVE_WEIGHT = 2
NEUTRAL_WEIGHT = 1
MIN_REACTIONS = 3
ACTIVE_DAYS = 7
TOP_N = 3


class ReadingJourneyAgent(BaseAgent):
    name = "reading_journey"
    description = (
        "Tracks each user's reading patterns by analysing their article reactions, "
        "builds a category affinity profile, and upserts a reading_journeys document "
        "with top topic recommendations for users active in the last 7 days."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=ACTIVE_DAYS)

        # ------------------------------------------------------------------
        # 1. Find active users: those who have at least one reaction in the
        #    last 7 days, using last_read_date on the user document.
        # ------------------------------------------------------------------
        active_user_cursor = db.users.find(
            {"last_read_date": {"$gte": cutoff}},
            {"id": 1, "_id": 0},
        )
        active_users: list[dict] = await active_user_cursor.to_list(length=None)
        active_user_ids = [u["id"] for u in active_users]

        if not active_user_ids:
            await self.log_event(db, run_id, "no_active_users", {
                "message": f"No users with last_read_date >= {cutoff.isoformat()}"
            })
            logger.info(f"[{self.name}] No active users found — nothing to do.")
            return {"users_profiled": 0, "journeys_updated": 0}

        logger.info(f"[{self.name}] Found {len(active_user_ids)} active user(s).")

        # ------------------------------------------------------------------
        # 2. Fetch all reactions for active users in one query.
        # ------------------------------------------------------------------
        reactions_cursor = db.reactions.find(
            {"user_id": {"$in": active_user_ids}},
            {"user_id": 1, "article_id": 1, "reaction": 1, "_id": 0},
        )
        all_reactions: list[dict] = await reactions_cursor.to_list(length=None)

        # Group reactions by user_id
        reactions_by_user: dict[str, list[dict]] = defaultdict(list)
        for r in all_reactions:
            reactions_by_user[r["user_id"]].append(r)

        # ------------------------------------------------------------------
        # 3. For each user, build affinity profile and upsert journey doc.
        # ------------------------------------------------------------------
        users_profiled = 0
        journeys_updated = 0

        for user_id in active_user_ids:
            user_reactions = reactions_by_user.get(user_id, [])
            total_reactions = len(user_reactions)

            if total_reactions < MIN_REACTIONS:
                logger.debug(
                    f"[{self.name}] Skipping user={user_id} — "
                    f"only {total_reactions} reaction(s) (min={MIN_REACTIONS})"
                )
                continue

            # Collect article IDs this user reacted to
            article_ids = list({r["article_id"] for r in user_reactions})

            # Fetch the corresponding articles to get their categories
            articles_cursor = db.articles.find(
                {"id": {"$in": article_ids}},
                {"id": 1, "category": 1, "_id": 0},
            )
            articles: list[dict] = await articles_cursor.to_list(length=None)
            category_by_article: dict[str, str] = {
                a["id"]: a.get("category", "unknown") for a in articles
            }

            # Accumulate weighted affinity scores
            affinity: dict[str, float] = defaultdict(float)
            for r in user_reactions:
                category = category_by_article.get(r["article_id"])
                if not category:
                    continue  # article not found / no category
                weight = (
                    POSITIVE_WEIGHT
                    if r.get("reaction") in POSITIVE_REACTIONS
                    else NEUTRAL_WEIGHT
                )
                affinity[category] += weight

            if not affinity:
                logger.debug(
                    f"[{self.name}] Skipping user={user_id} — "
                    "no matched article categories."
                )
                continue

            # Top-3 categories by score (descending)
            sorted_categories = sorted(
                affinity.items(), key=lambda kv: kv[1], reverse=True
            )
            top_categories = [cat for cat, _ in sorted_categories[:TOP_N]]

            now = datetime.now(timezone.utc)
            journey_doc = {
                "user_id":          user_id,
                "top_categories":   top_categories,
                "category_affinity": dict(affinity),
                "total_reactions":  total_reactions,
                "updated_at":       now,
            }

            result = await db.reading_journeys.update_one(
                {"user_id": user_id},
                {"$set": journey_doc},
                upsert=True,
            )

            users_profiled += 1
            if result.upserted_id or result.modified_count:
                journeys_updated += 1

            logger.debug(
                f"[{self.name}] Profiled user={user_id} "
                f"top_categories={top_categories} "
                f"total_reactions={total_reactions}"
            )

        await self.log_event(db, run_id, "reading_journey_complete", {
            "active_users_found": len(active_user_ids),
            "users_profiled":     users_profiled,
            "journeys_updated":   journeys_updated,
        })

        logger.info(
            f"[{self.name}] Done — active={len(active_user_ids)} "
            f"profiled={users_profiled} updated={journeys_updated}"
        )

        return {
            "users_profiled":  users_profiled,
            "journeys_updated": journeys_updated,
        }


register(ReadingJourneyAgent())
