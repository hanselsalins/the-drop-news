"""
TrendingAgent — detects story convergence across sources.

Algorithm on each run:
  1. Extract keywords from article titles (strip punctuation, lowercase,
     remove stop words, keep words longer than 2 chars).
  2. Cluster articles published in the last 6 hours by Jaccard keyword
     overlap (threshold >= 0.5).
  3. Identify trending clusters: 3+ articles from unique sources.
     Identify breaking clusters: 5+ articles from unique sources.
  4. Tag matching articles with trending_tag ("trending" | "breaking")
     and trending_source_count.

Returns stats: articles_scanned, trending_stories, articles_tagged.
"""

from __future__ import annotations

import logging
import re
import string
from datetime import datetime, timezone, timedelta
from itertools import combinations

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------

LOOKBACK_HOURS = 6
JACCARD_THRESHOLD = 0.5
TRENDING_MIN_SOURCES = 3
BREAKING_MIN_SOURCES = 5

STOP_WORDS = {
    # Articles / determiners
    "a", "an", "the", "this", "that", "these", "those", "some", "any",
    "each", "every", "both", "all", "few", "more", "most", "other",
    "another", "such", "no", "not", "nor",
    # Prepositions
    "at", "by", "for", "from", "in", "into", "of", "on", "onto", "out",
    "over", "per", "since", "than", "through", "to", "toward", "under",
    "until", "up", "via", "with", "within", "without", "about", "above",
    "across", "after", "against", "along", "amid", "among", "around",
    "as", "before", "behind", "below", "beneath", "beside", "between",
    "beyond", "during", "except", "inside", "near", "off", "outside",
    "past", "regarding", "throughout", "upon",
    # Conjunctions
    "and", "but", "or", "nor", "so", "yet", "although", "because",
    "if", "unless", "while", "whereas", "though", "even", "whether",
    "when", "where", "how", "why", "who", "whom", "whose", "which",
    "that", "what",
    # Pronouns
    "i", "me", "my", "we", "our", "you", "your", "he", "him", "his",
    "she", "her", "it", "its", "they", "them", "their", "theirs",
    # Common verbs / auxiliaries
    "is", "are", "was", "were", "be", "been", "being", "am",
    "has", "have", "had", "do", "does", "did", "will", "would",
    "shall", "should", "may", "might", "must", "can", "could",
    "get", "got", "say", "said", "says", "make", "makes", "made",
    "go", "goes", "went", "gone", "come", "comes", "came",
    "take", "takes", "took", "taken", "give", "gives", "gave",
    "know", "knew", "known", "think", "thought", "see", "saw",
    "look", "looking", "looks", "looked", "use", "used", "using",
    # Common news filler words
    "report", "reports", "reported", "says", "said", "according",
    "amid", "following", "after", "new", "latest", "update", "updates",
    "now", "today", "week", "month", "year", "day", "time", "days",
    "just", "also", "first", "two", "one", "three", "four", "five",
    "six", "seven", "eight", "nine", "ten", "than", "then", "still",
    "back", "much", "many", "well", "very", "only", "here", "there",
    "could", "would", "should", "like", "way",
}


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _extract_keywords(title: str) -> set:
    """Return a set of meaningful lowercase words from a title."""
    if not title:
        return set()
    # Strip punctuation (keep spaces and hyphens inside words temporarily)
    text = title.lower()
    text = re.sub(r"[^\w\s-]", " ", text)
    # Split on whitespace and hyphens
    tokens = re.split(r"[\s\-]+", text)
    return {
        tok
        for tok in tokens
        if len(tok) > 2 and tok not in STOP_WORDS and tok.isalpha()
    }


def _jaccard(set_a: set, set_b: set) -> float:
    """Jaccard similarity between two sets."""
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union else 0.0


def _build_clusters(articles_with_keywords: list) -> list:
    """
    Build clusters of similar articles using single-linkage: an article
    joins a cluster if it has Jaccard >= threshold with ANY existing member.

    Each cluster is a list of article dicts (with injected 'keywords' key).
    """
    # Union-Find for efficient clustering
    n = len(articles_with_keywords)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        parent[find(x)] = find(y)

    for i, j in combinations(range(n), 2):
        kw_i = articles_with_keywords[i]["keywords"]
        kw_j = articles_with_keywords[j]["keywords"]
        if _jaccard(kw_i, kw_j) >= JACCARD_THRESHOLD:
            union(i, j)

    # Group by root
    groups: dict[int, list] = {}
    for idx, article in enumerate(articles_with_keywords):
        root = find(idx)
        groups.setdefault(root, []).append(article)

    return list(groups.values())


# ------------------------------------------------------------------
# Agent
# ------------------------------------------------------------------

class TrendingAgent(BaseAgent):
    name = "trending"
    description = (
        "Detects trending and breaking news by clustering articles from the "
        "last 6 hours that share high keyword overlap across multiple sources."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)
        cutoff = (now - timedelta(hours=LOOKBACK_HOURS)).isoformat()

        # ------------------------------------------------------------------
        # 1. Fetch recent articles
        # ------------------------------------------------------------------
        cursor = db.articles.find(
            {"crawled_at": {"$gte": cutoff}},
            {
                "_id": 0,
                "id": 1,
                "original_title": 1,
                "source_name": 1,
                "source_country": 1,
                "category": 1,
                "crawled_at": 1,
                "rewrite_status": 1,
            },
        )

        articles = []
        async for doc in cursor:
            articles.append(doc)

        articles_scanned = len(articles)
        logger.info(f"[{self.name}] Scanned {articles_scanned} articles from last {LOOKBACK_HOURS}h")

        if not articles:
            stats = {
                "articles_scanned": 0,
                "trending_stories": 0,
                "articles_tagged": 0,
            }
            await self.log_event(db, run_id, "summary", stats)
            return stats

        # ------------------------------------------------------------------
        # 2. Attach extracted keywords to each article
        # ------------------------------------------------------------------
        for article in articles:
            article["keywords"] = _extract_keywords(article.get("original_title", ""))

        # ------------------------------------------------------------------
        # 3. Cluster by keyword similarity
        # ------------------------------------------------------------------
        clusters = _build_clusters(articles)

        # ------------------------------------------------------------------
        # 4. Identify trending / breaking clusters and tag articles
        # ------------------------------------------------------------------
        trending_stories = 0
        articles_tagged = 0

        for cluster in clusters:
            unique_sources = {a.get("source_name") for a in cluster if a.get("source_name")}
            source_count = len(unique_sources)

            if source_count < TRENDING_MIN_SOURCES:
                continue

            tag = "breaking" if source_count >= BREAKING_MIN_SOURCES else "trending"
            trending_stories += 1

            await self.log_event(
                db,
                run_id,
                "cluster_detected",
                {
                    "tag": tag,
                    "source_count": source_count,
                    "article_count": len(cluster),
                    "sources": sorted(unique_sources),
                    "sample_title": cluster[0].get("original_title", ""),
                },
            )
            logger.info(
                f"[{self.name}] {tag.upper()} cluster: {source_count} sources, "
                f"{len(cluster)} articles — '{cluster[0].get('original_title', '')}'"
            )

            for article in cluster:
                article_id = article.get("id")
                if not article_id:
                    continue

                await db.articles.update_one(
                    {"id": article_id},
                    {
                        "$set": {
                            "trending_tag": tag,
                            "trending_source_count": source_count,
                        }
                    },
                )
                articles_tagged += 1

        stats = {
            "articles_scanned": articles_scanned,
            "trending_stories": trending_stories,
            "articles_tagged": articles_tagged,
        }

        await self.log_event(db, run_id, "summary", stats)
        logger.info(f"[{self.name}] Completed: {stats}")
        return stats


register(TrendingAgent())
