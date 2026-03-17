"""
DeduplicationAgent — detects and marks duplicate stories across sources.

Strategy:
  - Only processes articles from the last 24 hours with status "raw" or "selected".
  - Groups articles by (source_country, category) to limit comparison scope.
  - Normalises titles to keyword sets (lowercase, no punctuation, no stop words).
  - Uses Jaccard similarity with a threshold of 0.55 to identify duplicates.
  - Clusters duplicates and keeps the article with the longest original_content.
  - Marks the shorter duplicates as "duplicate" only when their rewrite_status is "raw".
"""

from __future__ import annotations

import logging
import re
import string
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from itertools import combinations

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# English stop words (common short words that carry no title signal)
# ---------------------------------------------------------------------------
_STOP_WORDS: frozenset[str] = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "this",
    "that", "these", "those", "it", "its", "not", "no", "nor", "so",
    "yet", "both", "either", "whether", "after", "before", "since",
    "until", "while", "about", "against", "between", "into", "through",
    "during", "up", "down", "out", "off", "over", "under", "again",
    "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "each", "more", "most", "other", "some", "such", "than",
    "too", "very", "just", "also", "new", "says", "say", "said",
})

JACCARD_THRESHOLD = 0.55


def _normalize_title(title: str) -> frozenset[str]:
    """Return a frozenset of meaningful keywords extracted from *title*."""
    # Lowercase and strip punctuation
    title = title.lower()
    title = title.translate(str.maketrans("", "", string.punctuation))
    # Split on whitespace
    words = title.split()
    # Remove stop words and short tokens
    keywords = {w for w in words if w not in _STOP_WORDS and len(w) > 1}
    return frozenset(keywords)


def _jaccard(set_a: frozenset, set_b: frozenset) -> float:
    """Return the Jaccard similarity coefficient for two sets."""
    if not set_a and not set_b:
        return 1.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union else 0.0


def _cluster_duplicates(articles: list[dict]) -> list[list[dict]]:
    """
    Given a list of articles (already filtered to a single country+category
    bucket), return a list of clusters where each cluster contains articles
    that are mutually similar above the Jaccard threshold.

    Uses Union-Find for efficient clustering.
    """
    n = len(articles)
    if n == 0:
        return []

    # Pre-compute normalised keyword sets
    kw_sets = [_normalize_title(a.get("original_title", "")) for a in articles]

    # Union-Find
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x: int, y: int) -> None:
        parent[find(x)] = find(y)

    for i, j in combinations(range(n), 2):
        if _jaccard(kw_sets[i], kw_sets[j]) >= JACCARD_THRESHOLD:
            union(i, j)

    # Group by root
    groups: dict[int, list[dict]] = defaultdict(list)
    for idx, article in enumerate(articles):
        groups[find(idx)].append(article)

    return [cluster for cluster in groups.values() if len(cluster) > 1]


class DeduplicationAgent(BaseAgent):
    name = "deduplication"
    description = (
        "Detects duplicate news stories within the same country and category "
        "using Jaccard title similarity, keeping the longest version and marking "
        "shorter raw duplicates as 'duplicate'."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

        # Fetch all candidate articles from the last 24 hours
        cursor = db.articles.find({
            "rewrite_status": {"$in": ["raw", "selected"]},
            "crawled_at": {"$gte": cutoff},
        })
        all_articles: list[dict] = await cursor.to_list(length=None)

        articles_checked = len(all_articles)
        duplicates_found = 0
        duplicates_removed = 0

        if articles_checked == 0:
            await self.log_event(db, run_id, "no_articles", {
                "message": "No raw/selected articles in the last 24 hours."
            })
            return {
                "articles_checked": 0,
                "duplicates_found": 0,
                "duplicates_removed": 0,
            }

        # Group by (source_country, category)
        buckets: dict[tuple, list[dict]] = defaultdict(list)
        for article in all_articles:
            key = (
                article.get("source_country", ""),
                article.get("category", ""),
            )
            buckets[key].append(article)

        logger.info(
            f"[{self.name}] Checking {articles_checked} articles across "
            f"{len(buckets)} country/category buckets."
        )

        for (country, category), bucket_articles in buckets.items():
            clusters = _cluster_duplicates(bucket_articles)

            for cluster in clusters:
                # Sort by content length descending; keep the longest
                cluster.sort(
                    key=lambda a: len(a.get("original_content") or ""),
                    reverse=True,
                )
                keeper = cluster[0]
                duplicates = cluster[1:]

                duplicates_found += len(duplicates)

                for dup in duplicates:
                    if dup.get("rewrite_status") == "raw":
                        result = await db.articles.update_one(
                            {"id": dup["id"]},
                            {"$set": {"rewrite_status": "duplicate"}},
                        )
                        if result.modified_count:
                            duplicates_removed += 1
                            logger.debug(
                                f"[{self.name}] Marked duplicate: id={dup['id']} "
                                f"title={dup.get('original_title', '')!r} "
                                f"(keeper={keeper['id']})"
                            )

        await self.log_event(db, run_id, "deduplication_complete", {
            "articles_checked": articles_checked,
            "duplicates_found": duplicates_found,
            "duplicates_removed": duplicates_removed,
        })

        logger.info(
            f"[{self.name}] Done — checked={articles_checked} "
            f"found={duplicates_found} removed={duplicates_removed}"
        )

        return {
            "articles_checked": articles_checked,
            "duplicates_found": duplicates_found,
            "duplicates_removed": duplicates_removed,
        }


register(DeduplicationAgent())
