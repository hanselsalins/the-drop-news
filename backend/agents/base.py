"""
BaseAgent — abstract base class for all Drop agents.

Every concrete agent must:
  1. Inherit from BaseAgent
  2. Set `name` and `description` class attributes
  3. Implement `execute(run_id, db, clients) -> dict`
  4. Call `register(self)` at module level after the class definition

Run document schema stored in `agent_runs`:
    {
        "id":           str (UUID4),
        "agent_name":   str,
        "status":       "running" | "completed" | "failed",
        "started_at":   str (ISO 8601),
        "finished_at":  str (ISO 8601) | None,
        "duration_ms":  int | None,
        "result":       dict | None,
        "error":        str | None,
        "events":       list[dict],
    }
"""

from __future__ import annotations

import uuid
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all Drop agents."""

    name: str = ""
    description: str = ""
    default_enabled: bool = True

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    async def run(self, db, clients: dict) -> dict:
        """
        Entry point called by the scheduler or the manual-trigger API.

        Creates a run document, delegates to execute(), then updates the
        document with the outcome.  Always returns the final run document.
        """
        run_id = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc)

        run_doc = {
            "id":          run_id,
            "agent_name":  self.name,
            "status":      "running",
            "started_at":  started_at.isoformat(),
            "finished_at": None,
            "duration_ms": None,
            "result":      None,
            "error":       None,
            "events":      [],
        }

        await db.agent_runs.insert_one({**run_doc})  # insert a copy (no _id leak)
        logger.info(f"[{self.name}] Run started  run_id={run_id}")

        try:
            result = await self.execute(run_id, db, clients)
            finished_at = datetime.now(timezone.utc)
            duration_ms = int((finished_at - started_at).total_seconds() * 1000)

            await db.agent_runs.update_one(
                {"id": run_id},
                {"$set": {
                    "status":      "completed",
                    "finished_at": finished_at.isoformat(),
                    "duration_ms": duration_ms,
                    "result":      result,
                }},
            )
            logger.info(
                f"[{self.name}] Run completed  run_id={run_id}  duration_ms={duration_ms}"
            )
            run_doc.update(
                status="completed",
                finished_at=finished_at.isoformat(),
                duration_ms=duration_ms,
                result=result,
            )

        except Exception as exc:
            finished_at = datetime.now(timezone.utc)
            duration_ms = int((finished_at - started_at).total_seconds() * 1000)
            error_str = str(exc)

            await db.agent_runs.update_one(
                {"id": run_id},
                {"$set": {
                    "status":      "failed",
                    "finished_at": finished_at.isoformat(),
                    "duration_ms": duration_ms,
                    "error":       error_str,
                }},
            )
            logger.error(
                f"[{self.name}] Run failed  run_id={run_id}  error={error_str}",
                exc_info=True,
            )
            run_doc.update(
                status="failed",
                finished_at=finished_at.isoformat(),
                duration_ms=duration_ms,
                error=error_str,
            )

        return run_doc

    async def log_event(self, db, run_id: str, event_type: str, detail: Any) -> None:
        """
        Append a structured event to the run document's `events` array.

        Agents should call this during execute() to record meaningful
        milestones or sub-task results without having to wait until the
        end of the run.
        """
        event = {
            "timestamp":  datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "detail":     detail,
        }
        await db.agent_runs.update_one(
            {"id": run_id},
            {"$push": {"events": event}},
        )

    # ------------------------------------------------------------------
    # Abstract interface — must be implemented by each agent
    # ------------------------------------------------------------------

    @abstractmethod
    async def execute(self, run_id: str, db, clients: dict) -> dict:
        """
        Agent-specific logic.

        Parameters
        ----------
        run_id  : str   — UUID of the current run (use with log_event)
        db      : AsyncIOMotorDatabase
        clients : dict  — {"anthropic": AsyncAnthropic, "openai": OpenAI}

        Returns
        -------
        dict    — arbitrary result payload stored on the run document
        """
