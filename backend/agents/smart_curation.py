"""
SmartCurationAgent — analyzes engagement to compute article quality scores.

Strategy:
  - Aggregates reactions from the last 7 days grouped by article_id.
  - Scores each rewritten article using weighted reactions and a trending boost.
  - Reaction weights: mind_blown=3, inspiring=3, surprising=2, angry=1, sad=1.
  - Trending boost: breaking=2.0x, trending=1.5x, none=1.0x.
  - engagement_score = (weighted_reactions + total_reactions) * trending_boost
  - Stores engagement_score on each article document.
  - Computes average engagement score per category.
  - Saves category scores to agent_config for other agents to reference.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Scoring constants
# ---------------------------------------------------------------------------

REACTION_WEIGHTS: dict[str, int] = {
    "mind_blown": 3,
    "inspiring":  3,
    "surprising": 2,
    "angry":      1,
    "sad":        1,
}

TRENDING_BOOSTS: dict[str, float] = {
    "breaking": 2.0,
    "trending": 1.5,
}

CATEGORY_SCORES_CONFIG_KEY = "smart_curation_category_scores"


def _compute_engagement_score(
    reaction_counts: dict[str, int],
    trending_tag: str | None,
) -> float:
    """
    Return the engagement score for a single article.

    Parameters
    ----------
    reaction_counts : dict mapping reaction name -> count
    trending_tag    : "breaking", "trending", or None / any other value
    """
    weighted = sum(
        REACTION_WEIGHTS.get(reaction, 0) * count
        for reaction, count in reaction_counts.items()
    )
    total = sum(reaction_counts.values())
    boost = TRENDING_BOOSTS.get(trending_tag or "", 1.0)
    return (weighted + total) * boost


class SmartCurationAgent(BaseAgent):
    name = "smart_curation"
    description = (
        "Scores rewritten articles by weighted reaction engagement and trending "
        "boost, then computes per-category averages and saves them for other agents."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        # ------------------------------------------------------------------
        # 1. Aggregate reactions from the last 7 days grouped by article_id
        # ------------------------------------------------------------------
        reaction_pipeline = [
            {"$match": {"created_at": {"$gte": cutoff}}},
            {
                "$group": {
                    "_id": {
                        "article_id": "$article_id",
                        "reaction":   "$reaction",
                    },
                    "count": {"$sum": 1},
                }
            },
        ]

        reaction_cursor = db.reactions.aggregate(reaction_pipeline)
        raw_reactions = await reaction_cursor.to_list(length=None)

        # Build a nested map: article_id -> {reaction: count}
        reactions_by_article: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        for doc in raw_reactions:
            article_id = doc["_id"]["article_id"]
            reaction   = doc["_id"]["reaction"]
            reactions_by_article[article_id][reaction] += doc["count"]

        await self.log_event(db, run_id, "reactions_aggregated", {
            "distinct_articles_with_reactions": len(reactions_by_article),
        })

        # ------------------------------------------------------------------
        # 2. Fetch rewritten articles from the last 7 days and score them
        # ------------------------------------------------------------------
        article_cursor = db.articles.find({
            "rewrite_status": "rewritten",
            "crawled_at":     {"$gte": cutoff},
        })
        articles: list[dict] = await article_cursor.to_list(length=None)

        articles_scored = 0
        category_totals: dict[str, list[float]] = defaultdict(list)

        for article in articles:
            article_id = article.get("id", "")

            # Merge DB-stored reaction_counts with live aggregation
            stored_counts: dict[str, int] = article.get("reaction_counts") or {}
            live_counts: dict[str, int]   = dict(reactions_by_article.get(article_id, {}))

            # Union of both sources; live counts take precedence where they exist
            merged_counts: dict[str, int] = {**stored_counts, **live_counts}

            trending_tag = article.get("trending_tag") or ""
            score = _compute_engagement_score(merged_counts, trending_tag)

            # Persist score back to the article document
            await db.articles.update_one(
                {"id": article_id},
                {"$set": {"engagement_score": score}},
            )
            articles_scored += 1

            category = article.get("category") or "uncategorized"
            category_totals[category].append(score)

            logger.debug(
                f"[{self.name}] Scored article id={article_id} "
                f"score={score:.2f} category={category!r} trending={trending_tag!r}"
            )

        await self.log_event(db, run_id, "articles_scored", {
            "articles_scored": articles_scored,
        })

        # ------------------------------------------------------------------
        # 3. Compute average engagement score per category
        # ------------------------------------------------------------------
        top_categories: dict[str, float] = {
            category: round(sum(scores) / len(scores), 4)
            for category, scores in category_totals.items()
            if scores
        }

        # Sort descending by average score for convenience
        top_categories = dict(
            sorted(top_categories.items(), key=lambda kv: kv[1], reverse=True)
        )

        # ------------------------------------------------------------------
        # 4. Save category scores in agent_config for other agents
        # ------------------------------------------------------------------
        await db.agent_config.update_one(
            {"agent_name": CATEGORY_SCORES_CONFIG_KEY},
            {
                "$set": {
                    "agent_name":       CATEGORY_SCORES_CONFIG_KEY,
                    "category_scores":  top_categories,
                    "updated_at":       datetime.now(timezone.utc).isoformat(),
                    "window_days":      7,
                }
            },
            upsert=True,
        )

        await self.log_event(db, run_id, "category_scores_saved", {
            "categories": list(top_categories.keys()),
        })

        logger.info(
            f"[{self.name}] Done — articles_scored={articles_scored} "
            f"categories={len(top_categories)}"
        )

        return {
            "articles_scored": articles_scored,
            "top_categories":  top_categories,
        }


register(SmartCurationAgent())
