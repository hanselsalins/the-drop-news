"""
DailyOpsReportAgent — generates a comprehensive daily operations digest.

Report sections:
  1. Pipeline health   — article counts by rewrite_status
  2. Today's production — articles crawled and rewritten today
  3. User engagement   — total users, DAU, WAU, streak distribution
  4. Reactions today   — total reaction count for today
  5. Agent health      — runs, failures, avg duration per agent today

The report is upserted into the `daily_reports` collection keyed by date,
and the full report dict is returned as the agent result.
"""

import logging
from datetime import datetime, timedelta, timezone

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

# Streak bucket boundaries used in $bucket aggregation
STREAK_BOUNDARIES = [1, 3, 7, 14, 30, 100, 1000]


class DailyOpsReportAgent(BaseAgent):
    name = "daily_ops_report"
    description = (
        "Generates a comprehensive daily operations digest covering pipeline health, "
        "today's production, user engagement, reactions, and agent run health."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")

        # Midnight UTC boundaries for "today"
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        seven_days_ago = today_start - timedelta(days=6)  # inclusive of today = 7 days

        # ------------------------------------------------------------------
        # 1. Pipeline health — article counts by rewrite_status
        # ------------------------------------------------------------------
        pipeline_pipeline = [
            {
                "$group": {
                    "_id": "$rewrite_status",
                    "count": {"$sum": 1},
                }
            }
        ]
        pipeline_cursor = db.articles.aggregate(pipeline_pipeline)
        pipeline_raw = await pipeline_cursor.to_list(length=None)

        expected_statuses = ["raw", "selected", "rewritten", "failed", "expired", "duplicate"]
        pipeline_health: dict[str, int] = {s: 0 for s in expected_statuses}
        for doc in pipeline_raw:
            status = doc["_id"] or "unknown"
            pipeline_health[status] = doc["count"]

        total_articles = sum(pipeline_health.values())

        await self.log_event(db, run_id, "pipeline_health", pipeline_health)

        # ------------------------------------------------------------------
        # 2. Today's production
        # ------------------------------------------------------------------
        crawled_today = await db.articles.count_documents({
            "crawled_at": {"$gte": today_start, "$lt": today_end},
        })
        rewritten_today = await db.articles.count_documents({
            "rewrite_status": "rewritten",
            "rewritten_at":   {"$gte": today_start, "$lt": today_end},
        })

        todays_production = {
            "crawled_today":  crawled_today,
            "rewritten_today": rewritten_today,
        }

        await self.log_event(db, run_id, "todays_production", todays_production)

        # ------------------------------------------------------------------
        # 3. User engagement
        # ------------------------------------------------------------------
        total_users = await db.users.count_documents({})

        # Active today: last_read_date == today (stored as date string YYYY-MM-DD)
        active_today = await db.users.count_documents({
            "last_read_date": today_str,
        })

        # Active last 7 days: last_read_date >= 7 days ago
        seven_days_ago_str = seven_days_ago.strftime("%Y-%m-%d")
        active_last_7_days = await db.users.count_documents({
            "last_read_date": {"$gte": seven_days_ago_str},
        })

        dau_pct = round((active_today / total_users * 100), 2) if total_users else 0.0
        wau_pct = round((active_last_7_days / total_users * 100), 2) if total_users else 0.0

        # Streak distribution using $bucket aggregation
        streak_distribution: list[dict] = []
        try:
            streak_pipeline = [
                {
                    "$bucket": {
                        "groupBy":    "$current_streak",
                        "boundaries": STREAK_BOUNDARIES,
                        "default":    "other",
                        "output":     {"count": {"$sum": 1}},
                    }
                }
            ]
            streak_cursor = db.users.aggregate(streak_pipeline)
            streak_raw = await streak_cursor.to_list(length=None)
            streak_distribution = [
                {"bucket": doc["_id"], "count": doc["count"]}
                for doc in streak_raw
            ]
        except Exception as exc:
            logger.warning(f"[{self.name}] Streak aggregation failed: {exc}")
            streak_distribution = []

        user_engagement = {
            "total_users":       total_users,
            "active_today":      active_today,
            "active_last_7_days": active_last_7_days,
            "dau_pct":           dau_pct,
            "wau_pct":           wau_pct,
            "streak_distribution": streak_distribution,
        }

        await self.log_event(db, run_id, "user_engagement", {
            "total_users":  total_users,
            "active_today": active_today,
            "dau_pct":      dau_pct,
            "wau_pct":      wau_pct,
        })

        # ------------------------------------------------------------------
        # 4. Reactions today
        # ------------------------------------------------------------------
        reactions_today = await db.reactions.count_documents({
            "created_at": {"$gte": today_start, "$lt": today_end},
        })

        await self.log_event(db, run_id, "reactions_today", {"reactions_today": reactions_today})

        # ------------------------------------------------------------------
        # 5. Agent health — aggregate today's agent_runs
        # ------------------------------------------------------------------
        agent_health_pipeline = [
            {
                "$match": {
                    "started_at": {
                        "$gte": today_start.isoformat(),
                        "$lt":  today_end.isoformat(),
                    }
                }
            },
            {
                "$group": {
                    "_id":           "$agent_name",
                    "runs":          {"$sum": 1},
                    "failures":      {
                        "$sum": {
                            "$cond": [{"$eq": ["$status", "failed"]}, 1, 0]
                        }
                    },
                    "avg_duration_ms": {
                        "$avg": "$duration_ms"
                    },
                }
            },
            {"$sort": {"_id": 1}},
        ]
        agent_health_cursor = db.agent_runs.aggregate(agent_health_pipeline)
        agent_health_raw = await agent_health_cursor.to_list(length=None)

        agent_health: list[dict] = [
            {
                "agent_name":      doc["_id"],
                "runs":            doc["runs"],
                "failures":        doc["failures"],
                "avg_duration_ms": round(doc["avg_duration_ms"], 1) if doc["avg_duration_ms"] is not None else None,
            }
            for doc in agent_health_raw
        ]

        await self.log_event(db, run_id, "agent_health", {
            "agents_with_runs": len(agent_health),
        })

        # ------------------------------------------------------------------
        # Assemble full report
        # ------------------------------------------------------------------
        report = {
            "date":              today_str,
            "generated_at":      now.isoformat(),
            "pipeline_health":   pipeline_health,
            "total_articles":    total_articles,
            "todays_production": todays_production,
            "user_engagement":   user_engagement,
            "reactions_today":   reactions_today,
            "agent_health":      agent_health,
        }

        # ------------------------------------------------------------------
        # Upsert into daily_reports collection
        # ------------------------------------------------------------------
        await db.daily_reports.update_one(
            {"date": today_str},
            {"$set": report},
            upsert=True,
        )

        logger.info(
            f"[{self.name}] Daily ops report generated for {today_str} — "
            f"total_articles={total_articles} total_users={total_users} "
            f"reactions_today={reactions_today}"
        )

        return report


register(DailyOpsReportAgent())
