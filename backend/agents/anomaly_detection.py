"""
AnomalyDetectionAgent — watches for unusual patterns and raises proactive alerts.

Checks performed on each run:
  1. Pipeline stall     — no articles crawled in last 3 hours            → severity "high"
  2. Rewrite failure    — >10 articles selected but 0 rewritten in 6h    → severity "high"
  3. Engagement drop    — 0 active users today vs >5 yesterday            → severity "medium"
                          (only evaluated after 12:00 UTC)
  4. DB growth          — >10,000 articles in collection                  → severity "low"
  5. Agent failures     — >=3 failed agent runs in last 6h               → severity "high"
  6. Country blackout   — any country with 0 articles crawled in 6h      → severity "medium"

Alerts are stored in `anomaly_alerts`:
    {
        "id":           str (run_id),
        "alerts":       list[{type, severity, message}],
        "created_at":   str (ISO 8601),
        "acknowledged": false,
    }
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

COUNTRIES = ["US", "GB", "IN", "AU", "AE"]

PIPELINE_STALL_HOURS   = 3
REWRITE_WINDOW_HOURS   = 6
REWRITE_SELECTED_MIN   = 10
AGENT_FAILURE_WINDOW_H = 6
AGENT_FAILURE_MIN      = 3
COUNTRY_BLACKOUT_HOURS = 6
DB_GROWTH_THRESHOLD    = 10_000
ENGAGEMENT_HOUR_UTC    = 12   # only check engagement after this hour


class AnomalyDetectionAgent(BaseAgent):
    name = "anomaly_detection"
    description = (
        "Watches the content pipeline, user engagement, database size, agent run "
        "history, and per-country coverage for anomalies, raising structured alerts "
        "when thresholds are breached."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)
        alerts: list[dict] = []

        checks = [
            self._check_pipeline_stall,
            self._check_rewrite_failure,
            self._check_engagement_drop,
            self._check_db_growth,
            self._check_agent_failures,
            self._check_country_blackout,
        ]

        checks_run = 0
        for check_fn in checks:
            alert = await check_fn(db, run_id, now)
            checks_run += 1
            if alert:
                alerts.append(alert)
                await self.log_event(db, run_id, "alert_raised", alert)
                logger.warning(
                    f"[{self.name}] Alert [{alert['severity'].upper()}] "
                    f"{alert['type']}: {alert['message']}"
                )

        # Persist the full alert set regardless of whether any alerts fired
        await db.anomaly_alerts.insert_one({
            "id":           run_id,
            "alerts":       alerts,
            "created_at":   now.isoformat(),
            "acknowledged": False,
        })

        await self.log_event(db, run_id, "anomaly_detection_complete", {
            "checks_run":    checks_run,
            "alerts_raised": len(alerts),
        })

        logger.info(
            f"[{self.name}] Done — checks_run={checks_run} alerts_raised={len(alerts)}"
        )

        return {
            "alerts":        alerts,
            "checks_run":    checks_run,
            "alerts_raised": len(alerts),
        }

    # ------------------------------------------------------------------
    # 1. Pipeline stall — no articles crawled in the last 3 hours
    # ------------------------------------------------------------------

    async def _check_pipeline_stall(
        self, db, run_id: str, now: datetime
    ) -> dict | None:
        cutoff = (now - timedelta(hours=PIPELINE_STALL_HOURS)).isoformat()
        count = await db.articles.count_documents({"crawled_at": {"$gte": cutoff}})

        if count == 0:
            return {
                "type":     "pipeline_stall",
                "severity": "high",
                "message":  (
                    f"No articles have been crawled in the last {PIPELINE_STALL_HOURS} hours."
                ),
            }
        return None

    # ------------------------------------------------------------------
    # 2. Rewrite failure — >10 selected articles but 0 rewritten in 6h
    # ------------------------------------------------------------------

    async def _check_rewrite_failure(
        self, db, run_id: str, now: datetime
    ) -> dict | None:
        cutoff = (now - timedelta(hours=REWRITE_WINDOW_HOURS)).isoformat()

        selected_count = await db.articles.count_documents({
            "rewrite_status": "selected",
            "crawled_at":     {"$gte": cutoff},
        })

        rewritten_count = await db.articles.count_documents({
            "rewrite_status": "rewritten",
            "crawled_at":     {"$gte": cutoff},
        })

        if selected_count > REWRITE_SELECTED_MIN and rewritten_count == 0:
            return {
                "type":     "rewrite_failure",
                "severity": "high",
                "message":  (
                    f"{selected_count} articles selected but 0 rewritten in the "
                    f"last {REWRITE_WINDOW_HOURS} hours. Rewrite pipeline may be stalled."
                ),
            }
        return None

    # ------------------------------------------------------------------
    # 3. Engagement drop — 0 active users today vs >5 yesterday
    #    Only checked after 12:00 UTC
    # ------------------------------------------------------------------

    async def _check_engagement_drop(
        self, db, run_id: str, now: datetime
    ) -> dict | None:
        if now.hour < ENGAGEMENT_HOUR_UTC:
            return None

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)

        today_active = await db.user_sessions.count_documents({
            "last_active": {"$gte": today_start.isoformat()},
        })

        yesterday_active = await db.user_sessions.count_documents({
            "last_active": {
                "$gte": yesterday_start.isoformat(),
                "$lt":  today_start.isoformat(),
            },
        })

        if today_active == 0 and yesterday_active > 5:
            return {
                "type":     "engagement_drop",
                "severity": "medium",
                "message":  (
                    f"0 active users today (after {ENGAGEMENT_HOUR_UTC:02d}:00 UTC) "
                    f"versus {yesterday_active} active users yesterday."
                ),
            }
        return None

    # ------------------------------------------------------------------
    # 4. DB growth — more than 10,000 articles in the collection
    # ------------------------------------------------------------------

    async def _check_db_growth(
        self, db, run_id: str, now: datetime
    ) -> dict | None:
        total = await db.articles.count_documents({})

        if total > DB_GROWTH_THRESHOLD:
            return {
                "type":     "db_growth",
                "severity": "low",
                "message":  (
                    f"Articles collection has {total:,} documents, "
                    f"exceeding the {DB_GROWTH_THRESHOLD:,} threshold."
                ),
            }
        return None

    # ------------------------------------------------------------------
    # 5. Agent failures — >=3 failed runs in the last 6 hours
    # ------------------------------------------------------------------

    async def _check_agent_failures(
        self, db, run_id: str, now: datetime
    ) -> dict | None:
        cutoff = (now - timedelta(hours=AGENT_FAILURE_WINDOW_H)).isoformat()

        failed_count = await db.agent_runs.count_documents({
            "status":     "failed",
            "started_at": {"$gte": cutoff},
        })

        if failed_count >= AGENT_FAILURE_MIN:
            return {
                "type":     "agent_failures",
                "severity": "high",
                "message":  (
                    f"{failed_count} agent runs failed in the last "
                    f"{AGENT_FAILURE_WINDOW_H} hours."
                ),
            }
        return None

    # ------------------------------------------------------------------
    # 6. Country blackout — any country with 0 articles crawled in 6h
    # ------------------------------------------------------------------

    async def _check_country_blackout(
        self, db, run_id: str, now: datetime
    ) -> dict | None:
        cutoff = (now - timedelta(hours=COUNTRY_BLACKOUT_HOURS)).isoformat()
        dark_countries: list[str] = []

        for country in COUNTRIES:
            count = await db.articles.count_documents({
                "source_country": country,
                "crawled_at":     {"$gte": cutoff},
            })
            if count == 0:
                dark_countries.append(country)

        if dark_countries:
            return {
                "type":     "country_blackout",
                "severity": "medium",
                "message":  (
                    f"No articles crawled in the last {COUNTRY_BLACKOUT_HOURS} hours "
                    f"for: {', '.join(dark_countries)}."
                ),
            }
        return None


register(AnomalyDetectionAgent())
