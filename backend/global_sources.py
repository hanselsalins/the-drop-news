"""
Global News Sources Database — 5 Countries, 50 Sources
Each country has: country_code, country_name, flag_emoji, primary_language,
crawl_schedule, local_priority, city_tier_1[5], city_tier_2[5], sources[10]
"""

GLOBAL_SOURCES = [
    # ━━━━━━━━━━━━━━━━━━━ 1. UNITED STATES ━━━━━━━━━━━━━━━━━━━
    {
        "country_code": "US",
        "country_name": "United States",
        "flag_emoji": "\U0001F1FA\U0001F1F8",
        "primary_language": "English",
        "crawl_schedule": "every_2_hours",
        "local_priority": 1,
        "city_tier_1": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
        "city_tier_2": ["Austin", "Nashville", "Denver", "Portland", "Charlotte"],
        "sources": [
            {"name": "AP News", "url": "https://apnews.com", "rss_url": "https://rsshub.app/apnews/topics/apf-topnews", "feed_type": "rss", "category_tags": ["world", "tech", "money"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "NPR", "url": "https://npr.org", "rss_url": "https://feeds.npr.org/1001/rss.xml", "feed_type": "rss", "category_tags": ["world", "tech", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "CNN", "url": "https://cnn.com", "rss_url": "http://rss.cnn.com/rss/cnn_topstories.rss", "feed_type": "rss", "category_tags": ["world", "money", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Axios", "url": "https://axios.com", "rss_url": "https://api.axios.com/feed/", "feed_type": "rss", "category_tags": ["world", "tech", "money"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Washington Post", "url": "https://washingtonpost.com", "rss_url": "https://feeds.washingtonpost.com/rss/world", "feed_type": "rss", "category_tags": ["world", "power"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "USA Today", "url": "https://usatoday.com", "rss_url": "http://rssfeeds.usatoday.com/usatoday-NewsTopStories", "feed_type": "rss", "category_tags": ["world", "entertainment", "sports"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "CBS News", "url": "https://cbsnews.com", "rss_url": "https://www.cbsnews.com/latest/rss/main", "feed_type": "rss", "category_tags": ["world", "money", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "ABC News", "url": "https://abcnews.go.com", "rss_url": "https://abcnews.go.com/abcnews/topstories", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "PBS NewsHour", "url": "https://pbs.org/newshour", "rss_url": "https://www.pbs.org/newshour/feeds/rss/headlines", "feed_type": "rss", "category_tags": ["world", "tech"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Reuters US", "url": "https://reuters.com", "rss_url": "https://www.reutersagency.com/feed/", "feed_type": "rss", "category_tags": ["world", "money", "tech"], "language": "English", "logo_url": "", "status": "active"},
        ],
    },
    # ━━━━━━━━━━━━━━━━━━━ 2. UNITED KINGDOM ━━━━━━━━━━━━━━━━━━━
    {
        "country_code": "GB",
        "country_name": "United Kingdom",
        "flag_emoji": "\U0001F1EC\U0001F1E7",
        "primary_language": "English",
        "crawl_schedule": "every_2_hours",
        "local_priority": 1,
        "city_tier_1": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"],
        "city_tier_2": ["Bristol", "Liverpool", "Leeds", "Cardiff", "Belfast"],
        "sources": [
            {"name": "BBC News", "url": "https://bbc.co.uk/news", "rss_url": "https://feeds.bbci.co.uk/news/rss.xml", "feed_type": "rss", "category_tags": ["world", "tech", "money", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "The Guardian", "url": "https://theguardian.com", "rss_url": "https://www.theguardian.com/world/rss", "feed_type": "rss", "category_tags": ["world", "environment", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Sky News", "url": "https://news.sky.com", "rss_url": "https://news.sky.com/feeds/rss/home.xml", "feed_type": "rss", "category_tags": ["world", "money", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "The Independent", "url": "https://independent.co.uk", "rss_url": "https://www.independent.co.uk/news/rss", "feed_type": "rss", "category_tags": ["world", "tech"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Daily Mail", "url": "https://dailymail.co.uk", "rss_url": "https://www.dailymail.co.uk/news/index.rss", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "inactive"},
            {"name": "ITV News", "url": "https://itv.com/news", "rss_url": "https://www.itv.com/news/rss", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Metro UK", "url": "https://metro.co.uk", "rss_url": "https://metro.co.uk/feed/", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Evening Standard", "url": "https://standard.co.uk", "rss_url": "https://www.standard.co.uk/rss", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Reuters UK", "url": "https://uk.reuters.com", "rss_url": "https://www.reutersagency.com/feed/", "feed_type": "rss", "category_tags": ["world", "money"], "language": "English", "logo_url": "", "status": "active"},
        ],
    },
    # ━━━━━━━━━━━━━━━━━━━ 3. INDIA ━━━━━━━━━━━━━━━━━━━
    {
        "country_code": "IN",
        "country_name": "India",
        "flag_emoji": "\U0001F1EE\U0001F1F3",
        "primary_language": "English",
        "crawl_schedule": "every_2_hours",
        "local_priority": 1,
        "city_tier_1": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"],
        "city_tier_2": ["Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"],
        "sources": [
            {"name": "Times of India", "url": "https://timesofindia.indiatimes.com", "rss_url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", "feed_type": "rss", "category_tags": ["world", "money", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "NDTV", "url": "https://ndtv.com", "rss_url": "https://feeds.feedburner.com/ndtvnews-top-stories", "feed_type": "rss", "category_tags": ["world", "power", "money"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "The Hindu", "url": "https://thehindu.com", "rss_url": "https://www.thehindu.com/news/feeder/default.rss", "feed_type": "rss", "category_tags": ["world", "tech"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Hindustan Times", "url": "https://hindustantimes.com", "rss_url": "https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Indian Express", "url": "https://indianexpress.com", "rss_url": "https://indianexpress.com/section/india/feed/", "feed_type": "rss", "category_tags": ["world", "power"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Mint", "url": "https://livemint.com", "rss_url": "https://www.livemint.com/rss/news", "feed_type": "rss", "category_tags": ["money", "tech"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "India Today", "url": "https://indiatoday.in", "rss_url": "https://www.indiatoday.in/rss/home", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "News18", "url": "https://news18.com", "rss_url": "https://www.news18.com/rss/india.xml", "feed_type": "rss", "category_tags": ["world", "sports"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Economic Times", "url": "https://economictimes.indiatimes.com", "rss_url": "https://economictimes.indiatimes.com/rssfeedstopstories.cms", "feed_type": "rss", "category_tags": ["money", "tech"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Deccan Herald", "url": "https://deccanherald.com", "rss_url": "https://www.deccanherald.com/rss", "feed_type": "rss", "category_tags": ["world", "environment"], "language": "English", "logo_url": "", "status": "active"},
        ],
    },
    # ━━━━━━━━━━━━━━━━━━━ 4. AUSTRALIA ━━━━━━━━━━━━━━━━━━━
    {
        "country_code": "AU",
        "country_name": "Australia",
        "flag_emoji": "\U0001F1E6\U0001F1FA",
        "primary_language": "English",
        "crawl_schedule": "every_2_hours",
        "local_priority": 2,
        "city_tier_1": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
        "city_tier_2": ["Gold Coast", "Canberra", "Hobart", "Darwin", "Newcastle"],
        "sources": [
            {"name": "ABC Australia", "url": "https://abc.net.au/news", "rss_url": "https://www.abc.net.au/news/feed/2942460/rss.xml", "feed_type": "rss", "category_tags": ["world", "tech", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "News.com.au", "url": "https://news.com.au", "rss_url": "https://www.news.com.au/content-feeds/latest-news-national/", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "SBS News", "url": "https://sbs.com.au/news", "rss_url": "https://www.sbs.com.au/news/feed", "feed_type": "rss", "category_tags": ["world", "environment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "9News Australia", "url": "https://9news.com.au", "rss_url": "https://www.9news.com.au/rss", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Guardian Australia", "url": "https://theguardian.com/au", "rss_url": "https://www.theguardian.com/au/rss", "feed_type": "rss", "category_tags": ["world", "environment"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Sky News Australia", "url": "https://skynews.com.au", "rss_url": "https://www.skynews.com.au/feed", "feed_type": "rss", "category_tags": ["world", "money"], "language": "English", "logo_url": "", "status": "active"},
        ],
    },
    # ━━━━━━━━━━━━━━━━━━━ 5. UAE ━━━━━━━━━━━━━━━━━━━
    {
        "country_code": "AE",
        "country_name": "United Arab Emirates",
        "flag_emoji": "\U0001F1E6\U0001F1EA",
        "primary_language": "English",
        "crawl_schedule": "every_2_hours",
        "local_priority": 2,
        "city_tier_1": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
        "city_tier_2": ["Fujairah", "Umm Al Quwain", "Al Ain", "Khor Fakkan", "Dibba"],
        "sources": [
            {"name": "The National UAE", "url": "https://thenationalnews.com", "rss_url": "https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml", "feed_type": "rss", "category_tags": ["world", "tech", "money"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Al Jazeera English", "url": "https://aljazeera.com", "rss_url": "https://www.aljazeera.com/xml/rss/all.xml", "feed_type": "rss", "category_tags": ["world", "power"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "BBC Middle East", "url": "https://bbc.co.uk/news/world/middle_east", "rss_url": "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", "feed_type": "rss", "category_tags": ["world", "money"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Middle East Eye", "url": "https://middleeasteye.net", "rss_url": "https://www.middleeasteye.net/rss", "feed_type": "rss", "category_tags": ["world", "power"], "language": "English", "logo_url": "", "status": "active"},
            {"name": "Gulf News", "url": "https://gulfnews.com", "rss_url": "https://gulfnews.com/rss", "feed_type": "rss", "category_tags": ["world", "money", "entertainment"], "language": "English", "logo_url": "", "status": "inactive"},
            {"name": "Khaleej Times", "url": "https://khaleejtimes.com", "rss_url": "https://www.khaleejtimes.com/rss", "feed_type": "rss", "category_tags": ["world", "money"], "language": "English", "logo_url": "", "status": "inactive"},
            {"name": "Arabian Business", "url": "https://arabianbusiness.com", "rss_url": "https://www.arabianbusiness.com/rss", "feed_type": "rss", "category_tags": ["money", "tech"], "language": "English", "logo_url": "", "status": "inactive"},
            {"name": "Al Arabiya English", "url": "https://english.alarabiya.net", "rss_url": "https://english.alarabiya.net/tools/rss", "feed_type": "rss", "category_tags": ["world", "entertainment"], "language": "English", "logo_url": "", "status": "inactive"},
            {"name": "WAM", "url": "https://wam.ae/en", "rss_url": "https://www.wam.ae/en/rss/all", "feed_type": "rss", "category_tags": ["world", "money"], "language": "English", "logo_url": "", "status": "inactive"},
            {"name": "Zawya", "url": "https://zawya.com", "rss_url": "https://www.zawya.com/rss.xml", "feed_type": "rss", "category_tags": ["money"], "language": "English", "logo_url": "", "status": "inactive"},
        ],
    },
]


# Utility: Get country config by country code
def get_country_by_code(code: str) -> dict:
    for c in GLOBAL_SOURCES:
        if c["country_code"] == code:
            return c
    return None


# Utility: Get all active sources for a country
def get_active_sources(country_code: str) -> list:
    country = get_country_by_code(country_code)
    if not country:
        return []
    return [s for s in country["sources"] if s.get("status") == "active"]


# Utility: Get all country codes
def get_all_country_codes() -> list:
    return [c["country_code"] for c in GLOBAL_SOURCES]


# Utility: Get country list for frontend
def get_countries_list() -> list:
    return [
        {
            "country_code": c["country_code"],
            "country_name": c["country_name"],
            "flag_emoji": c["flag_emoji"],
            "primary_language": c["primary_language"],
        }
        for c in GLOBAL_SOURCES
    ]
