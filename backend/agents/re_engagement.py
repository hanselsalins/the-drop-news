"""
ReEngagementAgent — identifies at-risk users and creates personalized nudges.

Three categories of nudge:
  1. streak_warning  — read yesterday but not today, streak >= 3.
  2. gone_quiet      — last read 2 days ago, streak >= 2.
  3. churning        — no activity for 7+ days (age-group-aware message).

Users who opted out via notification_prefs.streak_reminders == False are skipped.
Churning users who already received a nudge this week are skipped.

Notifications are inserted into `notification_log` with type "re_engagement".
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

# Age-group buckets
YOUNG_GROUPS  = {"8-10", "11-13", "8-13"}   # fun tone
MATURE_GROUPS = {"14-16", "17-20", "14-20"}  # mature tone

CHURNING_MSG_YOUNG = (
    "Hey! The world is still happening — and it's actually pretty wild right now. "
    "Come see what you've missed!"
)
CHURNING_MSG_MATURE = (
    "It's been a while. Stay informed — there's a lot going on that matters to you."
)


def _is_young(age_group: str) -> bool:
    """Return True for the 8-13 range, False for 14-20."""
    if age_group in YOUNG_GROUPS:
        return True
    # Handle numeric prefix, e.g. "8-10", "11-13"
    try:
        lower = int(age_group.split("-")[0])
        return lower < 14
    except (ValueError, IndexError):
        return False


class ReEngagementAgent(BaseAgent):
    name = "re_engagement"
    description = (
        "Identifies at-risk users (lapsing streaks, gone quiet, churning) "
        "and inserts personalised re-engagement notifications."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)
        today_str     = now.date().isoformat()
        yesterday_str = (now.date() - timedelta(days=1)).isoformat()
        two_days_str  = (now.date() - timedelta(days=2)).isoformat()
        week_ago_str  = (now.date() - timedelta(days=7)).isoformat()
        week_start    = (now.date() - timedelta(days=7)).isoformat()

        users_analyzed  = 0
        at_risk_users   = 0
        nudges_created  = 0
        streak_warnings = 0

        notifications_to_insert = []

        cursor = db.users.find({}, {"_id": 0})
        async for user in cursor:
            users_analyzed += 1

            # --- opt-out check ---
            prefs = user.get("notification_prefs") or {}
            if prefs.get("streak_reminders") is False:
                continue

            user_id      = user.get("id")
            streak       = user.get("current_streak") or 0
            last_read    = user.get("last_read_date") or ""
            age_group    = user.get("age_group") or ""

            nudge_type = None
            subtype    = None
            message    = None

            # --- 1. Streak warning ---
            # Read yesterday but not today, streak >= 3
            if last_read == yesterday_str and streak >= 3:
                nudge_type = "re_engagement"
                subtype    = "streak_warning"
                message    = (
                    f"🔥 Your {streak}-day streak is on the line! "
                    "Read one story to keep it alive."
                )
                streak_warnings += 1

            # --- 2. Gone quiet ---
            # Last read 2 days ago, streak >= 2
            elif last_read == two_days_str and streak >= 2:
                nudge_type = "re_engagement"
                subtype    = "gone_quiet"
                message    = (
                    "📰 We saved some stories for you! Your streak misses you."
                )

            # --- 3. Churning ---
            # No activity for 7+ days (last_read <= week_ago or never)
            elif last_read and last_read <= week_ago_str:
                # Don't spam — skip if already nudged this week
                already_nudged = await db.notification_log.find_one({
                    "user_id":    user_id,
                    "type":       "re_engagement",
                    "subtype":    "churning",
                    "created_at": {"$gte": week_start},
                })
                if already_nudged:
                    continue

                nudge_type = "re_engagement"
                subtype    = "churning"
                message    = (
                    CHURNING_MSG_YOUNG if _is_young(age_group) else CHURNING_MSG_MATURE
                )

            if nudge_type is None:
                continue

            at_risk_users += 1

            notification = {
                "id":         str(uuid.uuid4()),
                "user_id":    user_id,
                "type":       nudge_type,
                "subtype":    subtype,
                "message":    message,
                "created_at": now.isoformat(),
                "delivered":  False,
            }
            notifications_to_insert.append(notification)
            nudges_created += 1

            await self.log_event(db, run_id, "nudge_queued", {
                "user_id":  user_id,
                "subtype":  subtype,
                "streak":   streak,
                "last_read": last_read,
            })

        # Bulk-insert all notifications in one call when possible
        if notifications_to_insert:
            await db.notification_log.insert_many(notifications_to_insert)

        stats = {
            "users_analyzed":  users_analyzed,
            "at_risk_users":   at_risk_users,
            "nudges_created":  nudges_created,
            "streak_warnings": streak_warnings,
        }

        await self.log_event(db, run_id, "summary", stats)
        logger.info(f"[{self.name}] Completed: {stats}")
        return stats


register(ReEngagementAgent())
