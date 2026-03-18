"""
CoverageBalanceAgent — monitors geographic and topical diversity of today's content.

On each run:
  1. Count today's rewritten articles by category and country.
  2. Detect gaps: any category or country with 0 articles today.
  3. Detect imbalances:
       - Any category representing >40% of total articles.
       - Any country representing >50% of total articles.
  4. Store a dated report in the `agent_config` collection.

Returns:
    total_articles_today    int
    category_distribution   dict[str, int]
    country_distribution    dict[str, int]
    gaps                    dict with "categories" and "countries" lists
    imbalances              dict with "categories" and "countries" lists
"""

import logging
from datetime import datetime, timezone

from agents.base import BaseAgent
from agents import register

logger = logging.getLogger(__name__)

CATEGORIES = ["world", "power", "money", "tech", "sports", "entertainment", "environment"]
COUNTRIES   = ["US", "GB", "IN", "AU", "AE"]

CATEGORY_IMBALANCE_THRESHOLD = 0.40   # >40% of total
COUNTRY_IMBALANCE_THRESHOLD  = 0.50   # >50% of total


class CoverageBalanceAgent(BaseAgent):
    name = "coverage_balance"
    description = (
        "Monitors geographic and topical diversity of rewritten articles published "
        "today, detecting gaps (zero coverage) and imbalances (over-concentration) "
        "by category and country."
    )

    async def execute(self, run_id: str, db, clients: dict) -> dict:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        await self.log_event(db, run_id, "coverage_balance_start", {
            "date": today_start.date().isoformat(),
        })

        # ------------------------------------------------------------------
        # 1. Count today's rewritten articles by category and country
        # ------------------------------------------------------------------
        cursor = db.articles.find(
            {
                "rewrite_status": "rewritten",
                "crawled_at": {"$gte": today_start},
            },
            {"category": 1, "source_country": 1, "_id": 0},
        )
        articles: list[dict] = await cursor.to_list(length=None)

        total = len(articles)

        category_distribution: dict[str, int] = {cat: 0 for cat in CATEGORIES}
        country_distribution:  dict[str, int] = {c: 0 for c in COUNTRIES}

        for article in articles:
            cat     = article.get("category", "")
            country = article.get("source_country", "")

            if cat in category_distribution:
                category_distribution[cat] += 1

            if country in country_distribution:
                country_distribution[country] += 1

        logger.info(
            f"[{self.name}] Today's rewritten articles: {total}  "
            f"categories={category_distribution}  countries={country_distribution}"
        )

        # ------------------------------------------------------------------
        # 2. Detect gaps (zero articles)
        # ------------------------------------------------------------------
        gap_categories = [cat for cat, count in category_distribution.items() if count == 0]
        gap_countries  = [c   for c,   count in country_distribution.items()  if count == 0]

        gaps = {
            "categories": gap_categories,
            "countries":  gap_countries,
        }

        # ------------------------------------------------------------------
        # 3. Detect imbalances
        # ------------------------------------------------------------------
        imbalanced_categories: list[dict] = []
        imbalanced_countries:  list[dict] = []

        if total > 0:
            for cat, count in category_distribution.items():
                pct = count / total
                if pct > CATEGORY_IMBALANCE_THRESHOLD:
                    imbalanced_categories.append({
                        "category":   cat,
                        "count":      count,
                        "percentage": round(pct * 100, 1),
                    })

            for country, count in country_distribution.items():
                pct = count / total
                if pct > COUNTRY_IMBALANCE_THRESHOLD:
                    imbalanced_countries.append({
                        "country":    country,
                        "count":      count,
                        "percentage": round(pct * 100, 1),
                    })

        imbalances = {
            "categories": imbalanced_categories,
            "countries":  imbalanced_countries,
        }

        # ------------------------------------------------------------------
        # 4. Store report in agent_config
        # ------------------------------------------------------------------
        report = {
            "agent_name":             self.name,
            "report_type":            "coverage_balance",
            "date":                   today_start.date().isoformat(),
            "generated_at":           now.isoformat(),
            "total_articles_today":   total,
            "category_distribution":  category_distribution,
            "country_distribution":   country_distribution,
            "gaps":                   gaps,
            "imbalances":             imbalances,
        }

        await db.agent_config.update_one(
            {"agent_name": self.name},
            {"$set": report},
            upsert=True,
        )

        await self.log_event(db, run_id, "coverage_balance_complete", {
            "total_articles_today":  total,
            "gap_categories":        gap_categories,
            "gap_countries":         gap_countries,
            "imbalanced_categories": [i["category"] for i in imbalanced_categories],
            "imbalanced_countries":  [i["country"]  for i in imbalanced_countries],
        })

        result = {
            "total_articles_today":  total,
            "category_distribution": category_distribution,
            "country_distribution":  country_distribution,
            "gaps":                  gaps,
            "imbalances":            imbalances,
        }

        logger.info(f"[{self.name}] Done — {result}")
        return result


register(CoverageBalanceAgent())
