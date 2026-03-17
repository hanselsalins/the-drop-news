"""
Source Quality Monitor Agent — evaluates RSS feed health across all countries.

Checks each active source for:
  - Feed accessibility  (can feedparser parse it within 15 s?)
  - Feed freshness      (is the most recent entry within 48 h?)
  - Article yield       (how many articles has each source produced in 24 h?)

Returns:
    {
        "sources_checked":    int,
        "dead_feeds":         [{"source": str, "country": str, "reason": str}, ...],
        "stale_feeds":        [{"source": str, "country": str, "latest_entry": str}, ...],
        "healthy":            int,
        "source_yields_24h":  {"<source_name>": int, ...},
    }
"""

from __future__ import annotations

import asyncio
import logging
import time as _time
from datetime import datetime, timezone, timedelta

import feedparser

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

_FETCH_TIMEOUT_S = 15      # seconds before a feed is considered dead
_STALE_THRESHOLD_H = 48    # hours — feeds with no entry newer than this are stale
_YIELD_WINDOW_H = 24       # hours — look-back window for article yield aggregation


def _parse_feed_sync(rss_url: str) -> feedparser.FeedParserDict:
    """
    Blocking feedparser call — intended to be run in a thread-pool executor
    so it doesn't block the event loop.
    """
    return feedparser.parse(rss_url)


def _entry_published_utc(entry) -> datetime | None:
    """
    Return the published/updated time of a feed entry as a UTC-aware datetime,
    or None if no parseable timestamp is available.
    """
    ts = None
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        ts = entry.published_parsed
    elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
        ts = entry.updated_parsed

    if ts is None:
        return None

    try:
        # time.struct_time from feedparser is always in UTC
        epoch = _time.mktime(ts)  # local-time interpretation — correct for struct_time in UTC
        return datetime.fromtimestamp(epoch, tz=timezone.utc)
    except (OSError, OverflowError, ValueError):
        return None


async def _check_feed(
    loop: asyncio.AbstractEventLoop,
    source_name: str,
    country_code: str,
    rss_url: str,
) -> dict:
    """
    Fetch and evaluate a single RSS feed.

    Returns a status dict:
        {
            "source":       str,
            "country":      str,
            "status":       "healthy" | "dead" | "stale",
            "reason":       str | None,   # populated when dead
            "latest_entry": str | None,   # ISO timestamp of newest entry
        }
    """
    result = {
        "source": source_name,
        "country": country_code,
        "status": "healthy",
        "reason": None,
        "latest_entry": None,
    }

    # --- fetch with timeout ---
    try:
        feed = await asyncio.wait_for(
            loop.run_in_executor(None, _parse_feed_sync, rss_url),
            timeout=_FETCH_TIMEOUT_S,
        )
    except asyncio.TimeoutError:
        result["status"] = "dead"
        result["reason"] = f"timeout after {_FETCH_TIMEOUT_S}s"
        return result
    except Exception as exc:
        result["status"] = "dead"
        result["reason"] = f"fetch error: {exc}"
        return result

    # feedparser sets bozo=True on malformed XML but may still return entries
    if feed.get("bozo") and not feed.entries:
        exc = feed.get("bozo_exception")
        result["status"] = "dead"
        result["reason"] = f"parse error: {exc}"
        return result

    if not feed.entries:
        result["status"] = "dead"
        result["reason"] = "no entries in feed"
        return result

    # --- freshness check ---
    now_utc = datetime.now(timezone.utc)
    stale_cutoff = now_utc - timedelta(hours=_STALE_THRESHOLD_H)

    latest_dt: datetime | None = None
    for entry in feed.entries:
        dt = _entry_published_utc(entry)
        if dt and (latest_dt is None or dt > latest_dt):
            latest_dt = dt

    if latest_dt is not None:
        result["latest_entry"] = latest_dt.isoformat()
        if latest_dt < stale_cutoff:
            result["status"] = "stale"
    # If no timestamps found at all we still consider it "healthy" (feed exists,
    # entries exist — we just can't confirm freshness).

    return result


class SourceQualityAgent(BaseAgent):
    name = "source_quality"
    description = (
        "Evaluates RSS feed health: checks accessibility, freshness (48 h), "
        "and 24-hour article yield for every active source across all countries."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        loop = asyncio.get_event_loop()
        now_utc = datetime.now(timezone.utc)
        yield_cutoff = now_utc - timedelta(hours=_YIELD_WINDOW_H)

        # ------------------------------------------------------------------
        # 1. Collect all active sources from the DB
        # ------------------------------------------------------------------
        country_docs = await db.global_sources.find({}).to_list(length=None)

        all_active: list[tuple[str, str, str]] = []  # (source_name, country_code, rss_url)
        for doc in country_docs:
            country_code = doc.get("country_code", "??")
            for src in doc.get("sources", []):
                if src.get("status") == "active" and src.get("rss_url"):
                    all_active.append((src["name"], country_code, src["rss_url"]))

        await self.log_event(db, run_id, "sources_discovered", {
            "count": len(all_active),
        })

        # ------------------------------------------------------------------
        # 2. Check every feed concurrently
        # ------------------------------------------------------------------
        tasks = [
            _check_feed(loop, name, country, url)
            for name, country, url in all_active
        ]
        feed_results: list[dict] = await asyncio.gather(*tasks, return_exceptions=False)

        # ------------------------------------------------------------------
        # 3. Categorise results
        # ------------------------------------------------------------------
        dead_feeds: list[dict] = []
        stale_feeds: list[dict] = []
        healthy_count = 0

        for res in feed_results:
            if res["status"] == "dead":
                dead_feeds.append({
                    "source":  res["source"],
                    "country": res["country"],
                    "reason":  res["reason"],
                })
            elif res["status"] == "stale":
                stale_feeds.append({
                    "source":       res["source"],
                    "country":      res["country"],
                    "latest_entry": res["latest_entry"],
                })
            else:
                healthy_count += 1

        await self.log_event(db, run_id, "feed_checks_done", {
            "healthy":  healthy_count,
            "dead":     len(dead_feeds),
            "stale":    len(stale_feeds),
        })

        # ------------------------------------------------------------------
        # 4. Article yield — last 24 h, grouped by source_name
        # ------------------------------------------------------------------
        pipeline = [
            {"$match": {"crawled_at": {"$gte": yield_cutoff}}},
            {"$group": {"_id": "$source_name", "count": {"$sum": 1}}},
        ]
        cursor = db.articles.aggregate(pipeline)
        source_yields_24h: dict[str, int] = {}
        async for doc in cursor:
            if doc.get("_id"):
                source_yields_24h[doc["_id"]] = doc["count"]

        await self.log_event(db, run_id, "article_yield_aggregated", {
            "sources_with_articles": len(source_yields_24h),
            "total_articles_24h":    sum(source_yields_24h.values()),
        })

        # ------------------------------------------------------------------
        # 5. Return final stats
        # ------------------------------------------------------------------
        return {
            "sources_checked":   len(all_active),
            "dead_feeds":        dead_feeds,
            "stale_feeds":       stale_feeds,
            "healthy":           healthy_count,
            "source_yields_24h": source_yields_24h,
        }


register(SourceQualityAgent())
