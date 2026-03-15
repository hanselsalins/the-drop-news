from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
from openai import OpenAI
import anthropic
import httpx
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, date, timedelta
import feedparser
import asyncio
import bcrypt
import jwt
import json as json_module
import re
import string
import random
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from global_sources import GLOBAL_SOURCES, get_country_by_code, get_active_sources, get_countries_list
from admin import admin_router, init_admin

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
anthropic_client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

JWT_SECRET = os.environ.get('JWT_SECRET', 'thedrop-nocap-secret-2026')
JWT_ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# --- Helpers ---
def calculate_age_group(dob_str: str) -> str:
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if age <= 10:
            return "8-10"
        elif age <= 13:
            return "11-13"
        elif age <= 16:
            return "14-16"
        else:
            return "17-20"
    except Exception:
        return "14-16"


def create_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc).timestamp() + 86400 * 30}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def age_group_from_age(age: int) -> str:
    if age <= 10:
        return "8-10"
    elif age <= 13:
        return "11-13"
    elif age <= 16:
        return "14-16"
    else:
        return "17-20"


def generate_invite_code() -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))


async def ensure_unique_username(base: str) -> str:
    clean = re.sub(r'[^a-z0-9_]', '', base.lower())
    if len(clean) < 3:
        clean = clean + ''.join(random.choices(string.ascii_lowercase, k=3 - len(clean)))
    username = clean[:20]
    exists = await db.users.find_one({"username": username})
    if not exists:
        return username
    for _ in range(10):
        candidate = f"{clean[:16]}{random.randint(100, 9999)}"
        exists = await db.users.find_one({"username": candidate})
        if not exists:
            return candidate
    return f"{clean[:14]}{uuid.uuid4().hex[:6]}"


def mock_send_parent_email(parent_email: str, child_name: str):
    """Mock email send — ready to connect to Resend later."""
    logger.info(f"[MOCK EMAIL] To: {parent_email}")
    logger.info(f"[MOCK EMAIL] Subject: You just set up {child_name} on The Drop")
    logger.info(f"[MOCK EMAIL] Body: Hi! You've created a safe news account for {child_name} on The Drop. "
                f"All content is age-appropriate and AI-curated. Visit your profile to manage settings.")


def mock_send_parent_email_friend_request(parent_email: str, child_name: str, friend_name: str):
    """Mock parent notification for friend request involving a child account."""
    logger.info(f"[MOCK PARENT NOTIFICATION] To: {parent_email}")
    logger.info(f"[MOCK PARENT NOTIFICATION] Subject: {child_name} has a new friend on The Drop")
    logger.info(f"[MOCK PARENT NOTIFICATION] Body: Hi! {friend_name} just connected with {child_name} on The Drop via invite link. "
                f"All interactions are safe — no direct messaging is allowed.")


def today_str():
    return date.today().isoformat()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    except Exception:
        pass
    return None


# --- Models ---
class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    dob: str
    gender: str
    city: str
    country: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None


class RegisterChildRequest(BaseModel):
    parent_name: str
    parent_email: str
    parent_password: str
    child_name: str
    child_age: int
    child_country: str
    child_city: str = ""
    avatar_url: str = ""


class RegisterSelfRequest(BaseModel):
    full_name: str
    email: str
    password: str
    age: int
    country: str
    city: str = ""
    username: str
    avatar_url: str = ""

class ReactionRequest(BaseModel):
    reaction: str  # "mind_blown", "surprising", "angry", "sad", "inspiring"

class PromptUpdate(BaseModel):
    prompt: str

class NotificationSettingsUpdate(BaseModel):
    streak_reminders: Optional[bool] = None
    milestone_alerts: Optional[bool] = None
    daily_news_alerts: Optional[bool] = None

class DeviceTokenRequest(BaseModel):
    token: str
    platform: str = "web"  # "web", "ios", "android"


VALID_REACTIONS = ["mind_blown", "surprising", "angry", "sad", "inspiring"]
REACTION_EMOJIS = {
    "mind_blown": "🤯",
    "surprising": "😮",
    "angry": "😡",
    "sad": "😢",
    "inspiring": "💪",
}

CATEGORIES = [
    {"id": "world", "name": "World", "icon": "globe", "color": "#3A86FF"},
    {"id": "power", "name": "Power", "icon": "zap", "color": "#FF6B35"},
    {"id": "money", "name": "Money", "icon": "coins", "color": "#FFD60A"},
    {"id": "tech", "name": "Tech", "icon": "cpu", "color": "#39FF14"},
    {"id": "sports", "name": "Sports", "icon": "trophy", "color": "#FF006E"},
    {"id": "entertainment", "name": "Entertainment", "icon": "music", "color": "#FF69B4"},
    {"id": "environment", "name": "Environment", "icon": "leaf", "color": "#00E5CC"},
]

# All tabs shown in the feed UI, including Today's Drop as the first tab
ALL_TABS = [
    {"id": "todays_drop", "name": "Today's Drop", "icon": "star", "color": "#CCFF00"},
    {"id": "world", "name": "World", "icon": "globe", "color": "#3A86FF"},
    {"id": "power", "name": "Power", "icon": "zap", "color": "#FF6B35"},
    {"id": "money", "name": "Money", "icon": "coins", "color": "#FFD60A"},
    {"id": "tech", "name": "Tech", "icon": "cpu", "color": "#39FF14"},
    {"id": "sports", "name": "Sports", "icon": "trophy", "color": "#FF006E"},
    {"id": "entertainment", "name": "Entertainment", "icon": "music", "color": "#FF69B4"},
    {"id": "environment", "name": "Environment", "icon": "leaf", "color": "#00E5CC"},
]

# Hard content caps — never overridable by query params
TODAYS_DROP_CAP = 5
CATEGORY_TAB_CAP = 3

# --- Source Logos ---
SOURCE_LOGOS = {
    "BBC News": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/200px-BBC_News_2019.svg.png",
    "BBC Science": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/200px-BBC_News_2019.svg.png",
    "BBC Business": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/200px-BBC_News_2019.svg.png",
    "BBC Entertainment": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/200px-BBC_News_2019.svg.png",
    "NY Times": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Nytimes_hq.jpg/200px-Nytimes_hq.jpg",
    "Reuters": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Reuters_Logo.svg/200px-Reuters_Logo.svg.png",
    "AP News": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Associated_Press_logo_2012.svg/200px-Associated_Press_logo_2012.svg.png",
}

# ===== PROMPTS =====
DEFAULT_AGE_GROUP_PROMPTS = {
    "8-10": {
        "label": "Kid Mode",
        "prompt": """You are a friendly news helper for young kids aged 8-10. Your job is to take a real news story and explain it in a way that a curious 9-year-old would understand and enjoy.

RULES:
- Use very simple words. If a word is hard, explain it immediately in brackets. Example: 'The government (the people who run the country) made a new rule.'
- Write in short sentences. Maximum 15 words per sentence.
- Maximum 150 words for the full article.
- Start with one sentence that tells the child WHY this matters to them or their world.
- Use at least one fun comparison or analogy to something kids know (school, food, games, animals, family).
- Use 2-3 relevant emojis naturally within the text, where they add meaning - not just as decoration at the end.
- End with one simple 'wonder question' - a curious question that makes the child think.
- Never use scary language. If the topic involves conflict or danger, describe it calmly and focus on what people are doing to help.
- Tone: warm, excited, like a favourite teacher explaining something.

OUTPUT FORMAT:
Headline: [Simple, fun headline - max 8 words]
Summary: [1 sentence - what happened, in the simplest terms]
Story: [Full rewritten article - max 150 words]
Wonder Question: [1 curious question for the child]"""
    },
    "11-13": {
        "label": "Tween Mode",
        "prompt": """You are a news writer for middle schoolers aged 11-13. Your job is to take a real news story and make it genuinely interesting and easy to understand for a 12-year-old who doesn't usually read the news.

RULES:
- Use simple, clear language. Avoid jargon or overly academic words.
- Sentences should be mostly short, but you can vary them slightly for rhythm. Maximum 20 words per sentence.
- Maximum 200 words for the full article.
- Start by explaining why this news is relevant to the audience's lives.
- Use at least one clear analogy or comparison to something relatable to their world.
- Use 1-2 relevant emojis naturally within the text.
- End with a 'wonder question' that encourages critical thinking or reflection.
- Avoid overly sensational or alarmist language. Focus on clear, factual reporting.
- Tone: Engaging, informative, slightly informal, relatable.

OUTPUT FORMAT:
Headline: [Catchy and informative headline - max 10 words]
Summary: [1-2 sentences summarizing the main point]
Story: [Rewritten article - max 200 words]
Wonder Question: [A thought-provoking question for the reader]"""
    },
    "14-16": {
        "label": "Teen Mode",
        "prompt": """You are a news writer for teenagers aged 14-16. Your job is to take a real news story and make it compelling, informative, and relevant to their interests and understanding of the world.

RULES:
- Use clear and contemporary language, appropriate for the age group.
- Sentence length can be more varied, but aim for clarity and flow. Maximum 25 words per sentence.
- Maximum 300 words for the full article.
- Begin by highlighting the hook or main point and why it matters to their generation.
- Use analogies or comparisons that resonate with their experiences.
- You can use emojis sparingly (0-1) if they genuinely enhance understanding.
- End with a 'wonder question' that prompts deeper thought.
- Maintain a balanced and objective tone, while still being engaging.
- Tone: Knowledgeable, engaging, relevant, slightly more mature.

OUTPUT FORMAT:
Headline: [Intriguing headline that captures attention - max 12 words]
Summary: [2-3 sentences providing context and key information]
Story: [Rewritten article - max 300 words]
Wonder Question: [A question that encourages critical thinking or speculation]"""
    },
    "17-20": {
        "label": "Young Adult",
        "prompt": """You are a news writer for young adults aged 17-20. Your job is to take a real news story and present it in a way that is insightful, comprehensive, and encourages critical engagement with current events.

RULES:
- Use sophisticated and precise language, suitable for an educated young adult audience.
- Sentence structure can be complex and varied to convey nuanced ideas.
- Maximum 400 words for the full article.
- Start with a strong introduction that establishes the significance and complexity of the news.
- Where appropriate, draw parallels to historical events, theoretical concepts, or wider societal trends.
- Emojis are generally not appropriate for this audience.
- End with a 'wonder question' that challenges assumptions or explores implications.
- Maintain an objective and analytical tone.
- Tone: Insightful, analytical, sophisticated, authoritative.

OUTPUT FORMAT:
Headline: [Sophisticated and informative headline - max 15 words]
Summary: [2-3 sentences providing essential context and analysis]
Story: [Rewritten article - max 400 words]
Wonder Question: [A question that provokes deep thought, debate, or analysis]"""
    }
}

DEFAULT_SAFETY_WRAPPER = """SAFETY RULES (non-negotiable):
- Never include graphic violence descriptions
- No political bias - present facts neutrally
- No inappropriate content for the target age group
- If the article is about sensitive topics, handle with age-appropriate care
- Do not sensationalize or create fear
- Focus on facts and understanding, not shock value"""


async def seed_system_prompts():
    for age_group, data in DEFAULT_AGE_GROUP_PROMPTS.items():
        await db.system_prompts.update_one(
            {"age_range": age_group, "type": "rewrite"},
            {"$set": {"id": f"rewrite_{age_group}", "type": "rewrite", "age_range": age_group,
                       "label": data["label"], "prompt": data["prompt"],
                       "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True)
    await db.system_prompts.update_one(
        {"type": "safety"},
        {"$set": {"id": "safety_wrapper", "type": "safety", "label": "Content Safety Wrapper",
                   "prompt": DEFAULT_SAFETY_WRAPPER, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True)


async def seed_source_logos():
    for name, url in SOURCE_LOGOS.items():
        await db.source_logos.update_one(
            {"source": name},
            {"$set": {"source": name, "logo_url": url, "visible": True}},
            upsert=True)
    logger.info(f"Seeded {len(SOURCE_LOGOS)} source logos")


async def seed_global_sources():
    """Seed the global_sources collection with 20 countries and their news sources."""
    count = 0
    for country in GLOBAL_SOURCES:
        await db.global_sources.update_one(
            {"country_code": country["country_code"]},
            {"$set": {
                "country_code": country["country_code"],
                "country_name": country["country_name"],
                "flag_emoji": country["flag_emoji"],
                "primary_language": country["primary_language"],
                "crawl_schedule": country["crawl_schedule"],
                "local_priority": country["local_priority"],
                "city_tier_1": country["city_tier_1"],
                "city_tier_2": country["city_tier_2"],
                "sources": country["sources"],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )
        count += 1
        # Also seed each source into source_logos for quick lookup
        for src in country["sources"]:
            if src.get("logo_url"):
                await db.source_logos.update_one(
                    {"source": src["name"]},
                    {"$set": {"source": src["name"], "logo_url": src["logo_url"], "visible": True}},
                    upsert=True,
                )
    logger.info(f"Seeded {count} countries with global news sources.")


async def get_prompt_for_age_group(age_group: str) -> str:
    doc = await db.system_prompts.find_one({"age_range": age_group, "type": "rewrite"}, {"_id": 0})
    return doc["prompt"] if doc else DEFAULT_AGE_GROUP_PROMPTS.get(age_group, {}).get("prompt", "")

async def get_safety_wrapper() -> str:
    doc = await db.system_prompts.find_one({"type": "safety"}, {"_id": 0})
    return doc["prompt"] if doc else DEFAULT_SAFETY_WRAPPER

async def get_source_logo(source_name: str) -> str:
    doc = await db.source_logos.find_one({"source": source_name}, {"_id": 0})
    return doc.get("logo_url", "") if doc else SOURCE_LOGOS.get(source_name, "")


RSS_FEEDS = {
    "world": [
        {"url": "https://feeds.bbci.co.uk/news/world/rss.xml", "source": "BBC News"},
        {"url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "source": "NY Times"},
    ],
    "power": [
        {"url": "https://feeds.bbci.co.uk/news/politics/rss.xml", "source": "BBC News"},
        {"url": "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml", "source": "NY Times"},
    ],
    "money": [
        {"url": "https://feeds.bbci.co.uk/news/business/rss.xml", "source": "BBC Business"},
        {"url": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", "source": "NY Times"},
    ],
    "tech": [
        {"url": "https://feeds.bbci.co.uk/news/technology/rss.xml", "source": "BBC News"},
        {"url": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", "source": "NY Times"},
    ],
    "sports": [
        {"url": "https://feeds.bbci.co.uk/sport/rss.xml", "source": "BBC Sport"},
        {"url": "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml", "source": "NY Times"},
    ],
    "entertainment": [
        {"url": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "source": "BBC Entertainment"},
        {"url": "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml", "source": "NY Times"},
    ],
    "environment": [
        {"url": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "source": "BBC News"},
        {"url": "https://rss.nytimes.com/services/xml/rss/nyt/Climate.xml", "source": "NY Times"},
    ],
}

CATEGORY_IMAGES = {
    "world": "https://images.unsplash.com/photo-1633421878925-ac220d8f6e4f?w=800&q=80",
    "power": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
    "money": "https://images.unsplash.com/photo-1726825779715-b47ced2411a7?w=800&q=80",
    "tech": "https://images.unsplash.com/photo-1730266718522-ff6d21f3a91f?w=800&q=80",
    "sports": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80",
    "entertainment": "https://images.unsplash.com/photo-1620245446020-879dc5cf2414?w=800&q=80",
    "environment": "https://images.unsplash.com/photo-1559038452-c182e478b3e4?w=800&q=80",
}


# ===== NOTIFICATION SYSTEM =====

STREAK_REMINDER_MESSAGES = [
    {"emoji": "🔥", "text": "Don't lose your streak! Today's Drop is waiting."},
    {"emoji": "⚡", "text": "Your streak is on the line. Catch today's Drop."},
    {"emoji": "📰", "text": "One story. That's all it takes. Keep your streak alive."},
    {"emoji": "🔥", "text": "{streak}-day streak at risk. Open The Drop before midnight."},
]

MILESTONE_MESSAGES = {
    7: {"emoji": "🏆", "text": "7-day streak! You're on fire. Keep The Drop going."},
    30: {"emoji": "🔥", "text": "30 days straight. You actually know what's happening in the world. No cap."},
    50: {"emoji": "💎", "text": "50-day streak. You're a news legend in the making."},
    100: {"emoji": "💎", "text": "100-day streak. You are The Drop. Legendary."},
}

MILESTONES = [7, 30, 50, 100]

DEFAULT_NOTIFICATION_PREFS = {
    "streak_reminders": True,
    "milestone_alerts": True,
    "daily_news_alerts": True,
}


async def log_notification(user_id: str, notif_type: str, message: str, delivered: bool = True):
    await db.notification_log.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "message": message,
        "delivered": delivered,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


async def get_notifications_sent_today(user_id: str) -> int:
    today = today_str()
    count = await db.notification_log.count_documents({
        "user_id": user_id,
        "timestamp": {"$regex": f"^{today}"},
    })
    return count


async def check_milestone(user_id: str, streak_count: int) -> dict:
    """Check if the user just hit a milestone. Returns milestone info or None."""
    if streak_count not in MILESTONES:
        return None

    # Check if we already notified this milestone
    existing = await db.notification_log.find_one({
        "user_id": user_id,
        "type": "milestone",
        "message": {"$regex": f"^{streak_count}-day"},
    })
    if existing:
        return None

    msg_data = MILESTONE_MESSAGES.get(streak_count)
    if not msg_data:
        return None

    return {
        "milestone": streak_count,
        "emoji": msg_data["emoji"],
        "message": f"{streak_count}-day streak! {msg_data['text']}",
    }


async def get_streak_reminder_message(user: dict) -> str:
    """Get a random streak reminder message, personalized with streak count."""
    streak = user.get("current_streak", 0)
    msg = random.choice(STREAK_REMINDER_MESSAGES)
    text = msg["text"].replace("{streak}", str(streak))
    return f"{msg['emoji']} {text}"


# ===== ARTICLE SCRAPING =====

_ARTICLE_CONTAINER_SELECTORS = [
    "article",
    '[class*="article-body"]',
    '[class*="article-content"]',
    '[class*="story-body"]',
    '[class*="post-body"]',
    '[class*="entry-content"]',
    '[class*="content-body"]',
    '[class*="article__body"]',
    '[class*="ArticleBody"]',
]


def _is_clean_paragraph(text: str) -> bool:
    """Return False for nav items, CSS blobs, and symbol-heavy strings."""
    if len(text) < 40:
        return False
    if '{' in text or '.css-' in text:
        return False
    alpha = sum(c.isalpha() for c in text)
    if len(text) > 0 and alpha / len(text) < 0.70:
        return False
    return True


async def scrape_article_body(url: str) -> str:
    """Fetch full article body from URL. Returns up to 4000 chars of clean <p> text, or '' on error."""
    try:
        from bs4 import BeautifulSoup

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        }
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            html = resp.text

        soup = BeautifulSoup(html, "lxml")

        # Remove script/style noise before searching
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()

        # Try article content containers in priority order
        container = None
        for selector in _ARTICLE_CONTAINER_SELECTORS:
            container = soup.select_one(selector)
            if container:
                break

        paragraphs = (container if container else soup).find_all("p")

        clean_paras = [
            p.get_text(" ", strip=True)
            for p in paragraphs
            if _is_clean_paragraph(p.get_text(" ", strip=True))
        ]

        return " ".join(clean_paras)[:4000]
    except Exception as e:
        logger.debug(f"scrape_article_body failed for {url}: {e}")
        return ""


# ===== CLAUDE REWRITE =====
_claude_semaphore = asyncio.Semaphore(3)

async def rewrite_with_claude(system_prompt: str, user_prompt: str) -> str:
    """Call Claude Sonnet for article rewriting. Returns response text or '' on error."""
    async with _claude_semaphore:
        try:
            message = await anthropic_client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return message.content[0].text
        except Exception as e:
            logger.error(f"rewrite_with_claude failed: {e}")
            return ""


# ===== AI REWRITING =====
_AGE_SYSTEM_PROMPTS = {
    "8-10":  "You are a children's news writer who makes complex news simple and fun for 8-10 year olds.",
    "11-13": "You are a youth news writer who makes complex news clear and engaging for 11-13 year olds.",
    "14-16": "You are a news writer who makes complex news accessible and informative for 14-16 year olds.",
    "17-20": "You are a news writer who makes complex news clear and informative for 17-20 year olds.",
}

_PARAGRAPH_FORMATTING = (
    "Format the body field with proper paragraphs. Use this rule: if the story is around 150 words use "
    "2 paragraphs, if around 200 words use 3 paragraphs, if 250+ words use 4-5 paragraphs. "
    r"Separate paragraphs with a blank line (\n\n). Never write one big block of text."
)

_AGE_USER_INSTRUCTIONS = {
    "8-10": (
        "Rewrite this news article for a 8-10 year old child. Use very simple words (maximum 2 syllables "
        "where possible). Keep sentences short — maximum 12 words each. Explain any difficult concepts like "
        "you would to a young child. Make it engaging and fun to read. "
        "The body field must contain at least 150 words of actual story content written in simple paragraphs. "
        + _PARAGRAPH_FORMATTING
    ),
    "11-13": (
        "Rewrite this news article for an 11-13 year old. Use clear simple language. Explain what happened, "
        "why it matters, and any background context they need. "
        "The body field must contain at least 150 words written in 3-4 engaging paragraphs. "
        + _PARAGRAPH_FORMATTING
    ),
    "14-16": (
        "Rewrite this news article for a 14-16 year old. Use plain English, explain any technical terms, "
        "and give background context. Cover the full story. "
        "The body field must contain at least 200 words written in 4-5 clear paragraphs. "
        + _PARAGRAPH_FORMATTING
    ),
    "17-20": (
        "Rewrite this news article for a 17-20 year old. Write clearly and informatively like a good "
        "newspaper but accessible to a young adult. Cover the full story with context. "
        "The body field must contain at least 200 words written in 4-5 paragraphs. "
        + _PARAGRAPH_FORMATTING
    ),
}

async def rewrite_article_for_age_group(title: str, content: str, age_group: str, category: str,
                                         source_language: str = "English",
                                         source_country: str = "US") -> dict:
    safety = await get_safety_wrapper()

    system_prompt = _AGE_SYSTEM_PROMPTS.get(age_group, _AGE_SYSTEM_PROMPTS["17-20"]) + "\n" + safety
    age_instruction = _AGE_USER_INSTRUCTIONS.get(age_group, _AGE_USER_INSTRUCTIONS["17-20"])

    confidence_instruction = ""
    if source_language in ("Urdu", "Bangla"):
        confidence_instruction = (
            f"\n\nIMPORTANT: This article is in {source_language}. After rewriting, assess your confidence "
            "in the accuracy of the translation/rewrite. Add a \"confidence\" key to your JSON response "
            "with value \"HIGH\" or \"LOW\". Rate \"LOW\" if the source text was ambiguous, contained "
            "idioms you're unsure about, or if the meaning might be lost in translation."
        )

    conf_key = ', confidence' if source_language in ('Urdu', 'Bangla') else ''
    prompt = f"""{age_instruction}

The source language is {source_language}. Rewrite the output entirely in English regardless of the source language.

Source Language: {source_language}
Source Country: {source_country}
Category: {category}
Original Title: {title}
Original Content: {content[:4000]}

Respond in valid JSON only with keys: title, summary, body, wonder_question, reading_time, country_relevance, impact_flags{conf_key}.
- title: rewritten headline
- summary: 1-2 sentence summary
- body: full rewritten article (meet the minimum word count stated above)
- wonder_question: a thought-provoking question for the reader
- reading_time: estimated reading time (e.g. "2 min read")
- country_relevance: array of ISO2 country codes this story directly affects (e.g. ["IN", "US"]), or ["GLOBAL"]
- impact_flags: array from: global_economic_impact, global_environmental_impact, global_entertainment_crossover, country_participant_sports. Use [] if none apply.
Return ONLY valid JSON, no markdown, no code blocks.{confidence_instruction}"""

    # Retry logic: attempt once, if fails retry, then mark for manual review
    for attempt in range(2):
        try:
            raw = await rewrite_with_claude(system_prompt, prompt)
            if not raw:
                raise ValueError("Empty response from Claude")

            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                clean = clean.strip()
            # Fix invalid escape sequences OpenAI occasionally emits (e.g. \' or \-)
            clean = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', clean)
            result = json_module.loads(clean)

            # Handle low_confidence_flag for Urdu/Bangla
            if source_language in ("Urdu", "Bangla"):
                confidence = result.pop("confidence", "HIGH").upper()
                result["low_confidence_flag"] = confidence == "LOW"
            else:
                result["low_confidence_flag"] = False

            result["rewrite_status"] = "complete"
            return result
        except Exception as e:
            logger.error(f"AI rewrite attempt {attempt + 1} failed for age_group={age_group}, lang={source_language}: {e}")

    # Both attempts failed — flag for manual review
    logger.error(f"Rewrite failed after 2 attempts: title='{title[:50]}', lang={source_language}")
    return {"title": title, "summary": content[:150], "body": content[:500],
            "reading_time": "2 min", "rewrite_status": "failed",
            "country_relevance": ["GLOBAL"], "impact_flags": [],
            "low_confidence_flag": source_language in ("Urdu", "Bangla")}


# ===== MICRO-FACTS GENERATION =====
async def generate_micro_facts(age_group: str):
    # Get today's top article titles for context
    articles = await db.articles.find({}, {"_id": 0, "original_title": 1, "category": 1}).sort("crawled_at", -1).to_list(10)
    titles_context = "\n".join([f"- [{a.get('category','general')}] {a['original_title']}" for a in articles[:8]])

    prompt_intro = {
        "8-10": "You write fun facts for kids aged 8-10. Use very simple words, max 20 words per fact. Make it exciting!",
        "11-13": "You write interesting facts for tweens aged 11-13. Keep it cool and relatable, max 25 words per fact.",
        "14-16": "You write engaging facts for teens aged 14-16. Be informative and slightly edgy, max 30 words per fact.",
        "17-20": "You write insightful facts for young adults aged 17-20. Be sophisticated, max 35 words per fact.",
    }

    msg = f"""Generate 6 surprising "Did You Know?" micro-facts loosely related to today's news topics.

Today's news topics:
{titles_context}

Return ONLY a valid JSON array of objects with keys: "fact" (the micro-fact text), "category" (which news category it relates to: world/power/money/tech/sports/entertainment/environment).
No markdown, no code blocks. Just the JSON array."""

    try:
        if openai_client is None:
            logger.error("OpenAI client is not configured; skipping micro-fact generation.")
            return

        model = os.environ.get("OPENAI_MODEL_DEFAULT", "gpt-4o-mini")

        response = await asyncio.to_thread(
            openai_client.chat.completions.create,
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": prompt_intro.get(age_group, prompt_intro["14-16"]),
                },
                {
                    "role": "user",
                    "content": msg,
                },
            ],
        )

        clean = response.choices[0].message.content.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
        facts = json_module.loads(clean)

        today = today_str()
        for f in facts:
            await db.micro_facts.update_one(
                {"fact": f["fact"], "date": today, "age_group": age_group},
                {"$set": {"fact": f["fact"], "category": f.get("category", "general"),
                           "date": today, "age_group": age_group, "id": str(uuid.uuid4())}},
                upsert=True)
        logger.info(f"Generated {len(facts)} micro-facts for age_group={age_group}")
    except Exception as e:
        logger.error(f"Micro-fact generation failed: {e}")


# ===== WHY THIS STORY =====
def generate_why_reason(article: dict, user: dict = None) -> str:
    category = article.get("category", "")
    user_country = user.get("country", "") if user else ""
    user_city = user.get("city", "") if user else ""

    reasons = {
        "world": "This story is a major global event everyone's talking about.",
        "power": f"This story affects how {user_country or 'your country'} is governed and who holds power." if user_country else "This story is about politics and the people who hold power.",
        "money": "This is a key story about the economy that affects everyday life.",
        "tech": "This story is trending in Tech globally.",
        "sports": f"This story covers sports action relevant to {user_country or 'your region'}." if user_country else "This is a top sports story today.",
        "entertainment": "This story is trending in Entertainment and Culture.",
        "environment": "This story covers how our planet and climate are changing.",
    }

    return reasons.get(category, "This is part of today's balanced mix across all topics.")


# ===== RSS CRAWLING =====
def _entry_published_iso(entry) -> str:
    """Return the entry's publish date as an ISO 8601 UTC string, falling back to now."""
    import time as _time
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        try:
            return datetime.fromtimestamp(_time.mktime(parsed), tz=timezone.utc).isoformat()
        except Exception:
            pass
    return datetime.now(timezone.utc).isoformat()


def _entry_is_recent(entry, max_age_days: int = 7) -> bool:
    """Return True if the entry's publish date is within max_age_days. Skip if unparseable."""
    import time as _time
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return False  # no date at all — skip
    try:
        pub_dt = datetime.fromtimestamp(_time.mktime(parsed), tz=timezone.utc)
        return (datetime.now(timezone.utc) - pub_dt).days <= max_age_days
    except Exception:
        return False


async def cleanup_old_articles(max_age_days: int = 7) -> int:
    """Delete articles with published_at older than max_age_days. Returns deleted count."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=max_age_days)).isoformat()
    result = await db.articles.delete_many({"published_at": {"$lt": cutoff}})
    logger.info(f"cleanup_old_articles: deleted {result.deleted_count} articles older than {max_age_days} days")
    return result.deleted_count


async def crawl_rss_feeds(country_code: str = None):
    """Crawl RSS feeds. If country_code is provided, crawl only that country.
    Otherwise, crawl all countries from global_sources."""
    logger.info(f"Starting RSS crawl... (country={country_code or 'ALL'})")
    articles_added = 0

    if country_code:
        countries = await db.global_sources.find(
            {"country_code": country_code.upper()}, {"_id": 0}
        ).to_list(1)
    else:
        countries = await db.global_sources.find({}, {"_id": 0}).to_list(50)

    # If no global_sources seeded yet, fall back to legacy feeds
    if not countries:
        return await _crawl_legacy_feeds()

    for country in countries:
        for src in country.get("sources", []):
            if src.get("status") != "active" or src.get("feed_type") != "rss":
                continue
            rss_url = src.get("rss_url", "")
            if not rss_url:
                continue
            try:
                feed = await asyncio.wait_for(
                    asyncio.to_thread(feedparser.parse, rss_url), timeout=15
                )
                if not feed.entries:
                    continue
                for entry in feed.entries[:5]:
                    link = entry.get("link", "")
                    if not link:
                        continue
                    if not _entry_is_recent(entry):
                        logger.debug(f"Skipping old/undated article: {entry.get('title','')[:60]}")
                        continue
                    image_url = ""
                    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
                        image_url = entry.media_thumbnail[0].get('url', '')
                    elif hasattr(entry, 'media_content') and entry.media_content:
                        image_url = entry.media_content[0].get('url', '')
                    if not image_url:
                        image_url = CATEGORY_IMAGES.get(
                            src.get("category_tags", ["world"])[0], CATEGORY_IMAGES.get("world", ""))

                    content = entry.get('summary', entry.get('description', entry.get('title', '')))
                    published = _entry_published_iso(entry)
                    article_id = str(uuid.uuid4())
                    logo_url = src.get("logo_url", "") or await get_source_logo(src["name"])

                    # Determine category using AI classification, with fallback to source's category_tags
                    category = src.get("category_tags", ["world"])[0]
                    try:
                        if openai_client is not None:
                            model = os.environ.get("OPENAI_MODEL_DEFAULT", "gpt-4o-mini")
                            title = entry.get('title', '')
                            classify_prompt = (
                                "Given this news headline: '{title}'\n"
                                "Classify it into exactly one of these categories: world, power, money, "
                                "tech, sports, entertainment, environment\n"
                                "Reply with only the single category word, nothing else."
                            ).format(title=title.replace("'", "\\'"))

                            response = await asyncio.to_thread(
                                openai_client.chat.completions.create,
                                model=model,
                                messages=[
                                    {
                                        "role": "user",
                                        "content": classify_prompt,
                                    }
                                ],
                            )
                            ai_category = response.choices[0].message.content.strip().lower()
                            allowed_categories = {"world", "power", "money", "tech", "sports", "entertainment", "environment"}
                            if ai_category in allowed_categories:
                                category = ai_category
                    except Exception as e:
                        logger.error(f"AI category classification failed for '{entry.get('title','')}', "
                                     f"falling back to source category: {e}")

                    result = await db.articles.update_one(
                        {"original_url": link},
                        {"$setOnInsert": {
                            "id": article_id,
                            "article_id": article_id,
                            "source_name": src["name"],
                            "source": src["name"],
                            "source_country": country["country_code"],
                            "source_language": src.get("language", country.get("primary_language", "English")),
                            "source_url": link,
                            "original_headline": entry.get('title', 'Untitled'),
                            "original_title": entry.get('title', 'Untitled'),
                            "original_body": content,
                            "original_content": content,
                            "original_url": link,
                            "source_logo": logo_url,
                            "category": category,
                            "category_tags": src.get("category_tags", ["world"]),
                            "image_url": image_url,
                            "published_at": published,
                            "crawled_at": datetime.now(timezone.utc).isoformat(),
                            "safety_status": "safe",
                            "rewrite_status": "pending",
                            "low_confidence_flag": False,
                            "rewrites": {},
                            "reaction_counts": {},
                        }},
                        upsert=True,
                    )
                    if result.upserted_id:
                        articles_added += 1
            except Exception as e:
                logger.error(f"Error crawling {src['name']} ({rss_url}): {e}")
                if src.get("status") == "active":
                    await db.global_sources.update_one(
                        {"country_code": country["country_code"], "sources.name": src["name"]},
                        {"$set": {"sources.$.last_error": str(e),
                                  "sources.$.last_error_at": datetime.now(timezone.utc).isoformat()}}
                    )

    logger.info(f"Crawl complete. Added {articles_added} new articles.")
    return articles_added


async def _crawl_legacy_feeds():
    """Fallback: crawl from hardcoded RSS_FEEDS if global_sources not yet seeded."""
    articles_added = 0
    for category, feeds in RSS_FEEDS.items():
        for feed_info in feeds:
            try:
                feed = await asyncio.wait_for(
                    asyncio.to_thread(feedparser.parse, feed_info["url"]), timeout=15
                )
                for entry in feed.entries[:3]:
                    if not _entry_is_recent(entry):
                        logger.debug(f"Skipping old/undated article: {entry.get('title','')[:60]}")
                        continue
                    image_url = ""
                    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
                        image_url = entry.media_thumbnail[0].get('url', '')
                    elif hasattr(entry, 'media_content') and entry.media_content:
                        image_url = entry.media_content[0].get('url', '')
                    if not image_url:
                        image_url = CATEGORY_IMAGES.get(category, "")

                    content = entry.get('summary', entry.get('description', entry.get('title', '')))
                    published = _entry_published_iso(entry)
                    article_id = str(uuid.uuid4())
                    logo_url = await get_source_logo(feed_info["source"])
                    link = entry.get('link', '')

                    result = await db.articles.update_one(
                        {"original_url": link},
                        {"$setOnInsert": {
                            "id": article_id, "article_id": article_id,
                            "source_name": feed_info["source"], "source": feed_info["source"],
                            "source_country": "US", "source_language": "English",
                            "source_url": link,
                            "original_headline": entry.get('title', 'Untitled'),
                            "original_title": entry.get('title', 'Untitled'),
                            "original_body": content, "original_content": content,
                            "original_url": link,
                            "source_logo": logo_url, "category": category,
                            "category_tags": [category],
                            "image_url": image_url, "published_at": published,
                            "crawled_at": datetime.now(timezone.utc).isoformat(),
                            "safety_status": "safe", "rewrite_status": "pending",
                            "low_confidence_flag": False,
                            "rewrites": {}, "reaction_counts": {}
                        }},
                        upsert=True,
                    )
                    if result.upserted_id:
                        articles_added += 1
            except Exception as e:
                logger.error(f"Error crawling {feed_info['url']}: {e}")
    return articles_added


async def rewrite_pending_articles(age_group: str):
    logger.info(f"Starting rewrites for age_group={age_group}...")
    cursor = db.articles.find(
        {f"rewrites.{age_group}": {"$exists": False}},
        {"_id": 0, "id": 1, "original_title": 1, "original_headline": 1,
         "original_content": 1, "original_body": 1, "original_url": 1, "category": 1,
         "source_language": 1, "source_country": 1}
    )
    articles = await cursor.to_list(50)
    for article in articles:
        title = article.get("original_headline") or article.get("original_title", "")
        content = article.get("original_body") or article.get("original_content", "")
        source_lang = article.get("source_language", "English")
        source_country = article.get("source_country", "US")

        # If RSS body is thin, try to scrape the full article
        if len(content) < 200:
            original_url = article.get("original_url", "")
            if original_url:
                scraped = await scrape_article_body(original_url)
                if len(scraped) > len(content):
                    content = scraped
                    logger.info(f"Scraped full body for article {article['id']} ({len(content)} chars)")

        rewrite = await rewrite_article_for_age_group(
            title, content, age_group, article["category"],
            source_language=source_lang, source_country=source_country)

        update_fields = {f"rewrites.{age_group}": rewrite}
        # Update article-level fields from rewrite result
        if rewrite.get("rewrite_status"):
            update_fields["rewrite_status"] = rewrite["rewrite_status"]
        if rewrite.get("low_confidence_flag") is not None:
            update_fields["low_confidence_flag"] = rewrite["low_confidence_flag"]
        # Store AI-tagged geolocation fields at article level
        update_fields["country_relevance"] = rewrite.get("country_relevance", ["GLOBAL"])
        update_fields["impact_flags"] = rewrite.get("impact_flags", [])

        await db.articles.update_one({"id": article["id"]}, {"$set": update_fields})
    logger.info(f"Rewrites complete for {len(articles)} articles, age_group={age_group}")


# ========== AUTH ROUTES ==========
@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    age_group = calculate_age_group(req.dob)
    password_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())
    invite_code = generate_invite_code()
    now = datetime.now(timezone.utc).isoformat()
    base_username = re.sub(r'[^a-z0-9_]', '', req.full_name.lower().replace(" ", ""))
    username = await ensure_unique_username(base_username)
    doc = {
        "id": user_id, "full_name": req.full_name.strip(), "email": req.email.lower().strip(),
        "password_hash": password_hash, "dob": req.dob, "gender": req.gender,
        "city": req.city.strip(), "country": req.country.strip(), "age_group": age_group,
        "account_type": "self", "username": username,
        "avatar_url": f"https://api.dicebear.com/9.x/adventurer/svg?seed={username}",
        "invite_code": invite_code, "knowledge_score": 0,
        "member_since": now, "created_at": now,
        "current_streak": 0, "longest_streak": 0, "last_read_date": "",
        "notification_prefs": DEFAULT_NOTIFICATION_PREFS.copy(),
        "device_tokens": [], "timezone": "UTC",
        "stories_read_count": 0, "reactions_given_count": 0, "days_active": [],
    }
    await db.users.insert_one(doc)
    token = create_token(user_id)
    user_resp = {k: v for k, v in doc.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": user_resp}


@api_router.post("/auth/register-child")
async def register_child(req: RegisterChildRequest):
    """Parent-led signup for under-14 users."""
    existing = await db.users.find_one({"email": req.parent_email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if req.child_age >= 14:
        raise HTTPException(status_code=400, detail="Use self-signup for age 14+")
    if len(req.parent_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    age_group = age_group_from_age(req.child_age)
    password_hash = bcrypt.hashpw(req.parent_password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())
    invite_code = generate_invite_code()
    now = datetime.now(timezone.utc).isoformat()
    base_username = re.sub(r'[^a-z0-9_]', '', req.child_name.lower().replace(" ", ""))
    username = await ensure_unique_username(base_username)
    approx_dob = f"{date.today().year - req.child_age}-06-15"

    doc = {
        "id": user_id, "full_name": req.child_name.strip(),
        "email": req.parent_email.lower().strip(),
        "password_hash": password_hash,
        "dob": approx_dob, "age": req.child_age, "gender": "",
        "city": req.child_city.strip(), "country": req.child_country.strip(),
        "age_group": age_group, "account_type": "child",
        "parent_name": req.parent_name.strip(),
        "parent_email": req.parent_email.lower().strip(),
        "username": username,
        "avatar_url": req.avatar_url or f"https://api.dicebear.com/9.x/adventurer/svg?seed={username}",
        "invite_code": invite_code, "knowledge_score": 0,
        "member_since": now, "created_at": now,
        "current_streak": 0, "longest_streak": 0, "last_read_date": "",
        "notification_prefs": DEFAULT_NOTIFICATION_PREFS.copy(),
        "device_tokens": [], "timezone": "UTC",
        "stories_read_count": 0, "reactions_given_count": 0, "days_active": [],
    }
    await db.users.insert_one(doc)
    mock_send_parent_email(req.parent_email, req.child_name)
    token = create_token(user_id)
    user_resp = {k: v for k, v in doc.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": user_resp}


@api_router.post("/auth/register-self")
async def register_self(req: RegisterSelfRequest):
    """Self signup for age 14+."""
    existing = await db.users.find_one({"email": req.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if req.age < 14:
        raise HTTPException(status_code=400, detail="Under-14 users must use parent signup")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    username_clean = req.username.lower().strip().lstrip("@")
    if not re.match(r'^[a-z0-9_]{3,20}$', username_clean):
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters, letters, numbers, underscores only")
    existing_username = await db.users.find_one({"username": username_clean})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    age_group = age_group_from_age(req.age)
    password_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())
    invite_code = generate_invite_code()
    now = datetime.now(timezone.utc).isoformat()
    approx_dob = f"{date.today().year - req.age}-06-15"

    doc = {
        "id": user_id, "full_name": req.full_name.strip(),
        "email": req.email.lower().strip(),
        "password_hash": password_hash,
        "dob": approx_dob, "age": req.age, "gender": "",
        "city": req.city.strip(), "country": req.country.strip(),
        "age_group": age_group, "account_type": "self",
        "username": username_clean,
        "avatar_url": req.avatar_url or f"https://api.dicebear.com/9.x/adventurer/svg?seed={username_clean}",
        "invite_code": invite_code, "knowledge_score": 0,
        "member_since": now, "created_at": now,
        "current_streak": 0, "longest_streak": 0, "last_read_date": "",
        "notification_prefs": DEFAULT_NOTIFICATION_PREFS.copy(),
        "device_tokens": [], "timezone": "UTC",
        "stories_read_count": 0, "reactions_given_count": 0, "days_active": [],
    }
    await db.users.insert_one(doc)
    token = create_token(user_id)
    user_resp = {k: v for k, v in doc.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": user_resp}


@api_router.get("/auth/check-username/{username}")
async def check_username(username: str):
    """Check if a username is available."""
    clean = username.lower().strip().lstrip("@")
    if not re.match(r'^[a-z0-9_]{3,20}$', clean):
        return {"available": False, "username": clean, "reason": "Must be 3-20 chars, letters/numbers/underscores only"}
    existing = await db.users.find_one({"username": clean})
    return {"available": existing is None, "username": clean}


@api_router.get("/auth/user-by-invite/{invite_code}")
async def get_user_by_invite(invite_code: str):
    """Look up a user by invite code for the invite landing page."""
    user = await db.users.find_one({"invite_code": invite_code}, {"_id": 0, "password_hash": 0})
    if not user:
        # Also try username lookup
        user = await db.users.find_one({"username": invite_code.lower().strip()}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "full_name": user.get("full_name", ""),
        "username": user.get("username", ""),
        "avatar_url": user.get("avatar_url", ""),
        "knowledge_score": user.get("knowledge_score", 0),
        "current_streak": user.get("current_streak", 0),
        "invite_code": user.get("invite_code", ""),
    }

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower().strip()})
    if not user or not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    user_resp = {k: v for k, v in user.items() if k != "password_hash" and k != "_id"}
    return {"token": token, "user": user_resp}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user

@api_router.put("/auth/me")
async def update_me(req: UserUpdate, user=Depends(get_current_user)):
    updates = {}
    if req.full_name is not None: updates["full_name"] = req.full_name.strip()
    if req.gender is not None: updates["gender"] = req.gender
    if req.city is not None: updates["city"] = req.city.strip()
    if req.country is not None: updates["country"] = req.country.strip()
    if req.avatar_url is not None: updates["avatar_url"] = req.avatar_url
    if req.username is not None:
        username_clean = req.username.lower().strip().lstrip("@")
        if not re.match(r'^[a-z0-9_]{3,20}$', username_clean):
            raise HTTPException(status_code=400, detail="Invalid username format")
        existing = await db.users.find_one({"username": username_clean, "id": {"$ne": user["id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        updates["username"] = username_clean
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    return await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})


# ========== STREAK ROUTES ==========
@api_router.post("/streak/read")
async def record_read(user=Depends(get_current_user)):
    today = today_str()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    last_read = user.get("last_read_date", "")
    current = user.get("current_streak", 0)
    longest = user.get("longest_streak", 0)

    if last_read == today:
        return {"current_streak": current, "longest_streak": longest, "last_read_date": today}

    if last_read == yesterday:
        current += 1
    else:
        current = 1

    longest = max(longest, current)
    # Track stories read count and days active
    updates = {
        "current_streak": current, "longest_streak": longest, "last_read_date": today
    }
    await db.users.update_one({"id": user["id"]}, {
        "$set": updates,
        "$inc": {"stories_read_count": 1},
        "$addToSet": {"days_active": today},
    })

    # Check for milestone
    milestone = await check_milestone(user["id"], current)
    if milestone and user.get("notification_prefs", {}).get("milestone_alerts", True):
        await log_notification(user["id"], "milestone", milestone["message"])

    return {"current_streak": current, "longest_streak": longest, "last_read_date": today,
            "milestone": milestone}

@api_router.get("/streak")
async def get_streak(user=Depends(get_current_user)):
    today = today_str()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    last_read = user.get("last_read_date", "")
    current = user.get("current_streak", 0)
    longest = user.get("longest_streak", 0)

    # If missed today AND yesterday, streak is broken
    if last_read and last_read != today and last_read != yesterday:
        current = 0
        await db.users.update_one({"id": user["id"]}, {"$set": {"current_streak": 0}})

    return {"current_streak": current, "longest_streak": longest, "last_read_date": last_read,
            "read_today": last_read == today}


# ========== PROFILE STATS ==========
@api_router.get("/profile/stats")
async def get_profile_stats(user=Depends(get_current_user)):
    """Get comprehensive profile stats for the current user."""
    user_id = user["id"]
    today = today_str()
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1).isoformat()[:10]
    week_start = (now - timedelta(days=now.weekday())).isoformat()[:10]

    # Stories read
    stories_read_total = user.get("stories_read_count", 0)
    days_active = user.get("days_active", [])
    days_active_this_month = [d for d in days_active if d >= month_start]
    days_active_this_week = [d for d in days_active if d >= week_start]

    # Reaction stats
    total_reactions = await db.reactions.count_documents({"user_id": user_id})
    reactions_this_month = await db.reactions.count_documents({
        "user_id": user_id, "created_at": {"$gte": month_start}
    })

    # Most used reaction
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$reaction", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    most_used = await db.reactions.aggregate(pipeline).to_list(1)
    most_used_reaction = most_used[0]["_id"] if most_used else None

    # Favourite category this month
    cat_pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": month_start}}},
        {"$lookup": {"from": "articles", "localField": "article_id", "foreignField": "id", "as": "article"}},
        {"$unwind": {"path": "$article", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$article.category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    fav_cat = await db.reactions.aggregate(cat_pipeline).to_list(1)
    favourite_category = fav_cat[0]["_id"] if fav_cat and fav_cat[0]["_id"] else "world"

    # Streak data
    current_streak = user.get("current_streak", 0)
    longest_streak = user.get("longest_streak", 0)

    # Knowledge Score calculation
    knowledge_score = int(
        (stories_read_total * 1)
        + (current_streak * 2)
        + (total_reactions * 0.5)
        + (len(days_active_this_month) * 3)
    )

    # Rank label
    if knowledge_score >= 501:
        rank_label = "No Cap Legend"
    elif knowledge_score >= 301:
        rank_label = "Sharp"
    elif knowledge_score >= 151:
        rank_label = "Switched On"
    elif knowledge_score >= 51:
        rank_label = "Informed"
    else:
        rank_label = "Curious"

    # Update knowledge score in user doc
    await db.users.update_one({"id": user_id}, {"$set": {"knowledge_score": knowledge_score}})

    # Log knowledge score
    await db.knowledge_score_log.update_one(
        {"user_id": user_id, "calculated_at": today},
        {"$set": {
            "user_id": user_id, "score": knowledge_score, "calculated_at": today,
            "stories_read": stories_read_total, "streak_days": current_streak,
            "reactions_given": total_reactions, "days_active": len(days_active_this_month),
        }},
        upsert=True,
    )

    # Countries covered this week
    countries_pipeline = [
        {"$match": {"source_country": {"$exists": True}, "crawled_at": {"$gte": week_start}}},
        {"$group": {"_id": "$source_country"}},
    ]
    countries_covered = len(await db.articles.aggregate(countries_pipeline).to_list(30))

    return {
        "streak": {
            "current": current_streak,
            "longest": longest_streak,
            "read_today": user.get("last_read_date", "") == today,
        },
        "stories_read": {
            "total": stories_read_total,
            "this_week": len(days_active_this_week),
            "this_month": len(days_active_this_month),
        },
        "reactions": {
            "total": total_reactions,
            "this_month": reactions_this_month,
            "most_used": most_used_reaction,
        },
        "favourite_category": favourite_category,
        "knowledge_score": {
            "score": knowledge_score,
            "rank_label": rank_label,
        },
        "countries_covered": countries_covered,
        "member_since": user.get("member_since", user.get("created_at", "")),
    }


@api_router.post("/knowledge-score/calculate-all")
async def calculate_all_knowledge_scores():
    """Batch calculate knowledge scores for all users. Designed for daily cron job."""
    today = today_str()
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1).isoformat()[:10]
    users = await db.users.find({}, {"_id": 0, "id": 1, "current_streak": 1,
                                      "stories_read_count": 1, "days_active": 1}).to_list(10000)
    updated = 0
    for u in users:
        user_id = u["id"]
        stories_read = u.get("stories_read_count", 0)
        streak = u.get("current_streak", 0)
        days_active = u.get("days_active", [])
        days_active_month = len([d for d in days_active if d >= month_start])
        total_reactions = await db.reactions.count_documents({"user_id": user_id})

        score = int((stories_read * 1) + (streak * 2) + (total_reactions * 0.5) + (days_active_month * 3))
        await db.users.update_one({"id": user_id}, {"$set": {"knowledge_score": score}})
        await db.knowledge_score_log.update_one(
            {"user_id": user_id, "calculated_at": today},
            {"$set": {"user_id": user_id, "score": score, "calculated_at": today,
                       "stories_read": stories_read, "streak_days": streak,
                       "reactions_given": total_reactions, "days_active": days_active_month}},
            upsert=True)
        updated += 1
    return {"updated": updated, "date": today}


@api_router.post("/articles/{article_id}/react")
async def toggle_reaction(article_id: str, body: ReactionRequest, user=Depends(get_current_user)):
    if body.reaction not in VALID_REACTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid reaction. Must be one of {VALID_REACTIONS}")

    existing = await db.reactions.find_one({"article_id": article_id, "user_id": user["id"]}, {"_id": 0})

    if existing and existing.get("reaction") == body.reaction:
        # Remove reaction (toggle off)
        await db.reactions.delete_one({"article_id": article_id, "user_id": user["id"]})
        await db.articles.update_one({"id": article_id},
            {"$inc": {f"reaction_counts.{body.reaction}": -1}})
        await db.users.update_one({"id": user["id"]}, {"$inc": {"reactions_given_count": -1}})
        return {"action": "removed", "reaction": body.reaction}
    else:
        # If had different reaction, decrement old
        if existing:
            old_reaction = existing["reaction"]
            await db.articles.update_one({"id": article_id},
                {"$inc": {f"reaction_counts.{old_reaction}": -1}})
        else:
            # Only increment if it's a new reaction (not changing)
            await db.users.update_one({"id": user["id"]}, {"$inc": {"reactions_given_count": 1}})

        # Set new reaction
        await db.reactions.update_one(
            {"article_id": article_id, "user_id": user["id"]},
            {"$set": {"article_id": article_id, "user_id": user["id"],
                       "reaction": body.reaction, "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True)
        await db.articles.update_one({"id": article_id},
            {"$inc": {f"reaction_counts.{body.reaction}": 1}})
        return {"action": "added", "reaction": body.reaction}

@api_router.get("/articles/{article_id}/reactions")
async def get_article_reactions(article_id: str, user=Depends(get_optional_user)):
    article = await db.articles.find_one({"id": article_id}, {"_id": 0, "reaction_counts": 1})
    counts = article.get("reaction_counts", {}) if article else {}
    # Clean up negative counts
    counts = {k: max(0, v) for k, v in counts.items()}
    user_reaction = None
    if user:
        doc = await db.reactions.find_one({"article_id": article_id, "user_id": user["id"]}, {"_id": 0})
        user_reaction = doc.get("reaction") if doc else None
    return {"counts": counts, "user_reaction": user_reaction}


# ========== FRIENDS SYSTEM ==========
class FriendRequest(BaseModel):
    target_username: str


@api_router.post("/friends/request")
async def send_friend_request(body: FriendRequest, user=Depends(get_current_user)):
    """Send a friend request to another user by username."""
    target = await db.users.find_one({"username": body.target_username.lower().strip()}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    # Check if under-14 target (can't be found via search, only invite link)
    if target.get("account_type") == "child":
        raise HTTPException(status_code=403, detail="This user can only be added via invite link")

    # Check existing friendship
    existing = await db.friendships.find_one({
        "$or": [
            {"user_id_1": user["id"], "user_id_2": target["id"]},
            {"user_id_1": target["id"], "user_id_2": user["id"]},
        ]
    }, {"_id": 0})

    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        if existing["status"] == "pending":
            raise HTTPException(status_code=400, detail="Friend request already pending")
        if existing["status"] == "blocked":
            raise HTTPException(status_code=400, detail="Unable to send request")

    friendship_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.friendships.insert_one({
        "id": friendship_id,
        "user_id_1": user["id"],
        "user_id_2": target["id"],
        "status": "pending",
        "initiated_by": user["id"],
        "created_at": now,
        "accepted_at": None,
    })

    # Log notification for target
    await log_notification(target["id"], "friend_request",
                           f"{user.get('full_name', 'Someone')} wants to read The Drop with you.")

    return {"message": "Friend request sent", "friendship_id": friendship_id}


@api_router.post("/friends/accept/{friendship_id}")
async def accept_friend_request(friendship_id: str, user=Depends(get_current_user)):
    friendship = await db.friendships.find_one({"id": friendship_id}, {"_id": 0})
    if not friendship:
        raise HTTPException(status_code=404, detail="Request not found")
    if friendship["user_id_2"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your request to accept")
    if friendship["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {friendship['status']}")

    now = datetime.now(timezone.utc).isoformat()
    await db.friendships.update_one({"id": friendship_id}, {"$set": {"status": "accepted", "accepted_at": now}})
    return {"message": "Friend request accepted"}


@api_router.post("/friends/decline/{friendship_id}")
async def decline_friend_request(friendship_id: str, user=Depends(get_current_user)):
    friendship = await db.friendships.find_one({"id": friendship_id}, {"_id": 0})
    if not friendship:
        raise HTTPException(status_code=404, detail="Request not found")
    if friendship["user_id_2"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your request to decline")
    await db.friendships.delete_one({"id": friendship_id})
    return {"message": "Friend request declined"}


@api_router.get("/friends")
async def get_friends(user=Depends(get_current_user)):
    """Get all accepted friends with their stats."""
    friendships = await db.friendships.find({
        "$or": [{"user_id_1": user["id"]}, {"user_id_2": user["id"]}],
        "status": "accepted",
    }, {"_id": 0}).to_list(100)

    friend_ids = []
    for f in friendships:
        friend_id = f["user_id_2"] if f["user_id_1"] == user["id"] else f["user_id_1"]
        friend_ids.append(friend_id)

    friends = []
    for fid in friend_ids:
        friend = await db.users.find_one({"id": fid}, {"_id": 0, "password_hash": 0})
        if friend:
            friends.append({
                "id": friend["id"],
                "full_name": friend.get("full_name", ""),
                "username": friend.get("username", ""),
                "avatar_url": friend.get("avatar_url", ""),
                "current_streak": friend.get("current_streak", 0),
                "knowledge_score": friend.get("knowledge_score", 0),
                "last_read_date": friend.get("last_read_date", ""),
            })

    # Sort by streak descending
    friends.sort(key=lambda x: x["current_streak"], reverse=True)
    return friends


@api_router.get("/friends/requests")
async def get_friend_requests(user=Depends(get_current_user)):
    """Get pending friend requests received by the current user."""
    requests = await db.friendships.find({
        "user_id_2": user["id"], "status": "pending"
    }, {"_id": 0}).to_list(50)

    result = []
    for r in requests:
        sender = await db.users.find_one({"id": r["user_id_1"]}, {"_id": 0, "password_hash": 0})
        if sender:
            result.append({
                "friendship_id": r["id"],
                "sender": {
                    "id": sender["id"],
                    "full_name": sender.get("full_name", ""),
                    "username": sender.get("username", ""),
                    "avatar_url": sender.get("avatar_url", ""),
                    "knowledge_score": sender.get("knowledge_score", 0),
                },
                "created_at": r["created_at"],
            })
    return result


@api_router.get("/friends/leaderboard")
async def get_friends_leaderboard(user=Depends(get_current_user)):
    """Get friends-only leaderboard ranked by knowledge score. Resets monthly."""
    friendships = await db.friendships.find({
        "$or": [{"user_id_1": user["id"]}, {"user_id_2": user["id"]}],
        "status": "accepted",
    }, {"_id": 0}).to_list(100)

    friend_ids = [user["id"]]  # Include self
    for f in friendships:
        friend_id = f["user_id_2"] if f["user_id_1"] == user["id"] else f["user_id_1"]
        friend_ids.append(friend_id)

    leaderboard = []
    for fid in friend_ids:
        u = await db.users.find_one({"id": fid}, {"_id": 0, "password_hash": 0})
        if u:
            score = u.get("knowledge_score", 0)
            if score >= 501: rank_label = "No Cap Legend"
            elif score >= 301: rank_label = "Sharp"
            elif score >= 151: rank_label = "Switched On"
            elif score >= 51: rank_label = "Informed"
            else: rank_label = "Curious"

            leaderboard.append({
                "id": u["id"],
                "full_name": u.get("full_name", ""),
                "username": u.get("username", ""),
                "avatar_url": u.get("avatar_url", ""),
                "knowledge_score": score,
                "current_streak": u.get("current_streak", 0),
                "rank_label": rank_label,
                "is_self": u["id"] == user["id"],
            })

    leaderboard.sort(key=lambda x: x["knowledge_score"], reverse=True)

    # Add rank numbers
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    # Get previous month's winner
    now = datetime.now(timezone.utc)
    prev_month_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1).isoformat()[:10]
    prev_month_end = now.replace(day=1).isoformat()[:10]
    prev_winner = None
    for fid in friend_ids:
        log = await db.knowledge_score_log.find_one(
            {"user_id": fid, "calculated_at": {"$gte": prev_month_start, "$lt": prev_month_end}},
            {"_id": 0},
            sort=[("score", -1)]
        )
        if log and (not prev_winner or log["score"] > prev_winner["score"]):
            winner_user = await db.users.find_one({"id": fid}, {"_id": 0, "password_hash": 0})
            if winner_user:
                prev_winner = {
                    "username": winner_user.get("username", ""),
                    "full_name": winner_user.get("full_name", ""),
                    "score": log["score"],
                }

    return {"leaderboard": leaderboard, "previous_month_winner": prev_winner}


@api_router.get("/friends/search")
async def search_friends(q: str, user=Depends(get_current_user)):
    """Search users by username. Under-14 accounts are not searchable."""
    clean = q.lower().strip().lstrip("@")
    if len(clean) < 2:
        return []
    results = await db.users.find({
        "username": {"$regex": f"^{re.escape(clean)}", "$options": "i"},
        "account_type": {"$ne": "child"},  # Under-14 not searchable
        "id": {"$ne": user["id"]},
    }, {"_id": 0, "password_hash": 0}).limit(10).to_list(10)

    return [{
        "id": r["id"],
        "full_name": r.get("full_name", ""),
        "username": r.get("username", ""),
        "avatar_url": r.get("avatar_url", ""),
        "knowledge_score": r.get("knowledge_score", 0),
    } for r in results]


@api_router.post("/friends/block/{target_user_id}")
async def block_user(target_user_id: str, user=Depends(get_current_user)):
    """Block a user. Removes friendship silently."""
    # Remove any existing friendship
    await db.friendships.delete_many({
        "$or": [
            {"user_id_1": user["id"], "user_id_2": target_user_id},
            {"user_id_1": target_user_id, "user_id_2": user["id"]},
        ]
    })
    # Create block record
    await db.friendships.insert_one({
        "id": str(uuid.uuid4()),
        "user_id_1": user["id"],
        "user_id_2": target_user_id,
        "status": "blocked",
        "initiated_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "accepted_at": None,
    })
    return {"message": "User blocked"}


# ========== INVITE LINKS ==========
@api_router.get("/invite/my-link")
async def get_my_invite_link(user=Depends(get_current_user)):
    """Get the current user's invite link."""
    username = user.get("username", "")
    invite_code = user.get("invite_code", "")
    return {
        "invite_url": f"/join/@{username}",
        "username": username,
        "invite_code": invite_code,
    }


@api_router.get("/invite/lookup/{username}")
async def lookup_invite(username: str):
    """Look up an inviting user's public profile for the invite landing page."""
    clean = username.lower().strip().lstrip("@")
    target = await db.users.find_one({"username": clean}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    score = target.get("knowledge_score", 0)
    if score >= 501: rank = "No Cap Legend"
    elif score >= 301: rank = "Sharp"
    elif score >= 151: rank = "Switched On"
    elif score >= 51: rank = "Informed"
    else: rank = "Curious"

    # Track click
    await db.invite_links.update_one(
        {"owner_user_id": target["id"]},
        {"$inc": {"clicks": 1}, "$setOnInsert": {
            "id": str(uuid.uuid4()), "owner_user_id": target["id"],
            "invite_code": target.get("invite_code", ""), "signups": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    return {
        "id": target["id"],
        "full_name": target.get("full_name", ""),
        "username": target.get("username", ""),
        "avatar_url": target.get("avatar_url", ""),
        "knowledge_score": score,
        "rank_label": rank,
        "current_streak": target.get("current_streak", 0),
    }


@api_router.post("/invite/connect/{inviter_username}")
async def connect_via_invite(inviter_username: str, user=Depends(get_current_user)):
    """Auto-connect the current user with the inviter after signup via invite link."""
    clean = inviter_username.lower().strip().lstrip("@")
    inviter = await db.users.find_one({"username": clean}, {"_id": 0})
    if not inviter or inviter["id"] == user["id"]:
        return {"message": "Skipped"}

    # Check if already connected
    existing = await db.friendships.find_one({
        "$or": [
            {"user_id_1": user["id"], "user_id_2": inviter["id"]},
            {"user_id_1": inviter["id"], "user_id_2": user["id"]},
        ]
    })
    if existing:
        return {"message": "Already connected"}

    now = datetime.now(timezone.utc).isoformat()

    # If either user is a child account, need parent approval (mock notification)
    if user.get("account_type") == "child":
        parent_email = user.get("parent_email", "")
        mock_send_parent_email_friend_request(parent_email, user.get("full_name", ""), inviter.get("full_name", ""))
        # Still auto-connect for invite links (per spec: no friend request needed for invite-link signups)

    if inviter.get("account_type") == "child":
        parent_email = inviter.get("parent_email", "")
        mock_send_parent_email_friend_request(parent_email, inviter.get("full_name", ""), user.get("full_name", ""))

    await db.friendships.insert_one({
        "id": str(uuid.uuid4()),
        "user_id_1": inviter["id"],
        "user_id_2": user["id"],
        "status": "accepted",
        "initiated_by": inviter["id"],
        "created_at": now,
        "accepted_at": now,
    })

    # Track signup conversion
    await db.invite_links.update_one(
        {"owner_user_id": inviter["id"]},
        {"$inc": {"signups": 1}},
    )

    return {"message": "Connected as friends"}


# ========== NOTIFICATION ROUTES ==========
@api_router.get("/notifications/settings")
async def get_notification_settings(user=Depends(get_current_user)):
    prefs = user.get("notification_prefs", DEFAULT_NOTIFICATION_PREFS)
    return {
        "streak_reminders": prefs.get("streak_reminders", True),
        "milestone_alerts": prefs.get("milestone_alerts", True),
        "daily_news_alerts": prefs.get("daily_news_alerts", True),
        "has_device_token": bool(user.get("device_tokens")),
        "timezone": user.get("timezone", "UTC"),
    }

@api_router.put("/notifications/settings")
async def update_notification_settings(body: NotificationSettingsUpdate, user=Depends(get_current_user)):
    prefs = user.get("notification_prefs", DEFAULT_NOTIFICATION_PREFS.copy())
    if body.streak_reminders is not None:
        prefs["streak_reminders"] = body.streak_reminders
    if body.milestone_alerts is not None:
        prefs["milestone_alerts"] = body.milestone_alerts
    if body.daily_news_alerts is not None:
        prefs["daily_news_alerts"] = body.daily_news_alerts

    await db.users.update_one({"id": user["id"]}, {"$set": {"notification_prefs": prefs}})
    return prefs

@api_router.post("/notifications/register-device")
async def register_device(body: DeviceTokenRequest, user=Depends(get_current_user)):
    """Register a push notification token for the user's device."""
    tokens = user.get("device_tokens", [])
    # Remove duplicate, add new
    tokens = [t for t in tokens if t.get("token") != body.token]
    tokens.append({"token": body.token, "platform": body.platform, "registered_at": datetime.now(timezone.utc).isoformat()})
    await db.users.update_one({"id": user["id"]}, {"$set": {"device_tokens": tokens}})
    return {"message": "Device registered", "token_count": len(tokens)}

@api_router.post("/notifications/update-timezone")
async def update_timezone(tz: str, user=Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"timezone": tz}})
    return {"timezone": tz}

@api_router.get("/notifications/log")
async def get_notification_log(user=Depends(get_current_user), limit: int = 20):
    """Get recent notifications for the user."""
    logs = await db.notification_log.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return logs

@api_router.get("/notifications/pending-milestone")
async def get_pending_milestone(user=Depends(get_current_user)):
    """Check if user has an unacknowledged milestone notification."""
    streak = user.get("current_streak", 0)
    for m in MILESTONES:
        if streak >= m:
            existing = await db.notification_log.find_one({
                "user_id": user["id"], "type": "milestone",
                "message": {"$regex": f"^{m}-day"},
            })
            if existing and not existing.get("acknowledged"):
                return {"milestone": m, "message": MILESTONE_MESSAGES[m]["text"],
                        "emoji": MILESTONE_MESSAGES[m]["emoji"], "notification_id": existing.get("id")}
    return None

@api_router.post("/notifications/acknowledge/{notification_id}")
async def acknowledge_notification(notification_id: str, user=Depends(get_current_user)):
    await db.notification_log.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"acknowledged": True}})
    return {"acknowledged": True}

@api_router.post("/notifications/check-streaks")
async def check_streak_reminders():
    """Cron-callable endpoint: Check all users who haven't read today and queue reminders.
    Should be called around 6 PM. Rate limited to 2 notifications per user per day."""
    today = today_str()
    users_cursor = db.users.find(
        {"last_read_date": {"$ne": today},
         "notification_prefs.streak_reminders": True,
         "current_streak": {"$gt": 0}},
        {"_id": 0, "password_hash": 0}
    )
    users = await users_cursor.to_list(1000)

    sent = 0
    for u in users:
        # Rate limit: max 2 per day
        sent_today = await get_notifications_sent_today(u["id"])
        if sent_today >= 2:
            continue

        msg = await get_streak_reminder_message(u)
        await log_notification(u["id"], "streak_reminder", msg)
        sent += 1

    return {"checked": len(users), "reminders_queued": sent}


# ========== CORE ROUTES ==========
@api_router.get("/")
async def root():
    return {"message": "The Drop API - No Cap News"}

@api_router.get("/categories")
async def get_categories():
    return ALL_TABS

def _build_localised_query(category: str, user_country_code: str) -> dict:
    """Build a MongoDB query filter for category localisation rules."""
    c = user_country_code.upper() if user_country_code else ""
    if category == "world":
        return {"$or": [
            {"country_relevance": "GLOBAL"},
            {"$expr": {"$gt": [{"$size": {"$ifNull": ["$country_relevance", []]}}, 2]}},
        ]}
    elif category == "power":
        if not c:
            return {"country_relevance": "GLOBAL"}
        return {"country_relevance": c}
    elif category == "money":
        return {"$or": [
            {"country_relevance": c} if c else {"country_relevance": "GLOBAL"},
            {"impact_flags": "global_economic_impact"},
        ]}
    elif category == "tech":
        return {}  # always include all
    elif category == "sports":
        return {"$or": [
            {"country_relevance": c} if c else {"country_relevance": "GLOBAL"},
            {"impact_flags": "country_participant_sports"},
        ]}
    elif category == "entertainment":
        return {"$or": [
            {"country_relevance": c} if c else {"country_relevance": "GLOBAL"},
            {"impact_flags": "global_entertainment_crossover"},
        ]}
    elif category == "environment":
        return {"$or": [
            {"country_relevance": c} if c else {"country_relevance": "GLOBAL"},
            {"impact_flags": "global_environmental_impact"},
        ]}
    return {}


def _compute_engagement_score(article: dict) -> float:
    counts = article.get("reaction_counts", {})
    reaction_count = sum(counts.values())
    read_count = article.get("read_count", 0)
    source_coverage = article.get("source_coverage", 1)
    return (reaction_count * 3) + (read_count * 1) + (source_coverage * 2)


def _compute_tab_score(article: dict) -> float:
    """Score for category tab ranking: (source_coverage×2) + recency_score."""
    sc = article.get("source_coverage", 1)
    try:
        pub_str = article.get("crawled_at", "") or article.get("published_at", "")
        pub = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
        if pub.tzinfo is None:
            pub = pub.replace(tzinfo=timezone.utc)
        hours_ago = (datetime.now(timezone.utc) - pub).total_seconds() / 3600
    except Exception:
        hours_ago = 24
    recency = max(0.0, 24.0 - hours_ago)
    return (sc * 2) + recency


async def _resolve_user_country_code(user: dict, override: str = None) -> str:
    """Return ISO2 country code for the user, or override if provided."""
    if override:
        return override.upper()
    if not user:
        return ""
    user_country = user.get("country", "")
    if not user_country:
        return ""
    country_doc = await db.global_sources.find_one(
        {"country_name": {"$regex": f"^{user_country}$", "$options": "i"}},
        {"_id": 0, "country_code": 1}
    )
    return country_doc["country_code"] if country_doc else ""


async def _format_article(a: dict, age_group: str, user: dict, category_override: str = None,
                           extra: dict = None) -> dict:
    rewrite = a.get("rewrites", {}).get(age_group)
    counts = a.get("reaction_counts", {})
    counts = {k: max(0, v) for k, v in counts.items()}
    why = generate_why_reason(a, user)
    logo = a.get("source_logo", "") or await get_source_logo(a.get("source", ""))
    out = {
        "id": a["id"], "original_title": a["original_title"],
        "original_url": a.get("original_url", ""), "source": a.get("source", ""),
        "source_logo": logo,
        "source_country": a.get("source_country", ""),
        "source_language": a.get("source_language", "English"),
        "category": category_override or a.get("category", ""),
        "image_url": a.get("image_url", ""),
        "published_at": a.get("published_at", ""), "rewrite": rewrite,
        "reaction_counts": counts, "why_reason": why,
        "low_confidence_flag": a.get("low_confidence_flag", False),
        "country_relevance": a.get("country_relevance", []),
        "impact_flags": a.get("impact_flags", []),
    }
    if extra:
        out.update(extra)
    return out


async def _get_or_generate_todays_drop(age_group: str, user: dict, user_country_code: str) -> dict:
    """Return Today's Drop for the user, generating and caching if needed."""
    today = today_str()
    user_id = user["id"] if user else "anonymous"
    cache_key = f"{user_id}_{today}_{age_group}"

    cached = await db.daily_drop_progress.find_one({"cache_key": cache_key}, {"_id": 0})
    if cached and cached.get("articles"):
        return {"articles": cached["articles"][:TODAYS_DROP_CAP], "cached": True, "date": today}

    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    category_ids = [c["id"] for c in CATEGORIES]

    scored = []
    for cat in category_ids:
        base_query = {
            "category": cat,
            f"rewrites.{age_group}": {"$exists": True},
            "crawled_at": {"$gte": since},
        }
        loc_filter = _build_localised_query(cat, user_country_code)
        if loc_filter:
            base_query.update(loc_filter)

        candidates = await db.articles.find(base_query, {"_id": 0}).sort("crawled_at", -1).to_list(20)

        if not candidates and cat == "power" and user_country_code:
            fallback_query = {
                "category": cat,
                f"rewrites.{age_group}": {"$exists": True},
                "crawled_at": {"$gte": since},
                "country_relevance": "GLOBAL",
            }
            candidates = await db.articles.find(fallback_query, {"_id": 0}).sort("crawled_at", -1).to_list(20)

        if candidates:
            best = max(candidates, key=_compute_engagement_score)
            scored.append((cat, _compute_engagement_score(best), best))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:TODAYS_DROP_CAP]

    result = []
    for cat, score, a in top:
        result.append(await _format_article(a, age_group, user,
                                            category_override=cat,
                                            extra={"engagement_score": score}))

    await db.daily_drop_progress.update_one(
        {"cache_key": cache_key},
        {"$set": {"cache_key": cache_key, "articles": result, "date": today,
                  "user_id": user_id, "age_group": age_group,
                  "cached_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"articles": result, "cached": False, "date": today}


@api_router.get("/articles")
async def get_articles(category: Optional[str] = None, age_group: str = "14-16",
                       country_code: Optional[str] = None,
                       user=Depends(get_optional_user)):
    effective_country = await _resolve_user_country_code(user, country_code)

    # "for_you" and "todays_drop" both serve Today's Drop repackaged as a feed list
    if category in ("for_you", "todays_drop"):
        drop = await _get_or_generate_todays_drop(age_group, user, effective_country)
        return drop["articles"]  # already capped at TODAYS_DROP_CAP

    # Category tab — apply localisation rules
    cat = category if category and category != "all" else "world"
    query = {
        "category": cat,
        f"rewrites.{age_group}": {"$exists": True},
    }
    loc_filter = _build_localised_query(cat, effective_country)
    if loc_filter:
        query.update(loc_filter)

    # Fetch enough candidates to score and trim
    candidates = await db.articles.find(
        query, {"_id": 0, "original_content": 0}
    ).sort("crawled_at", -1).to_list(50)

    # Exclude articles already in today's drop for this user
    today = today_str()
    user_id = user["id"] if user else "anonymous"
    cache_key = f"{user_id}_{today}_{age_group}"
    cached_drop = await db.daily_drop_progress.find_one({"cache_key": cache_key},
                                                         {"_id": 0, "articles": 1})
    drop_ids = {a["id"] for a in (cached_drop.get("articles") or [])} if cached_drop else set()
    candidates = [a for a in candidates if a["id"] not in drop_ids]

    # Score and hard-cap at CATEGORY_TAB_CAP
    candidates.sort(key=_compute_tab_score, reverse=True)
    top = candidates[:CATEGORY_TAB_CAP]

    result = []
    for a in top:
        result.append(await _format_article(a, age_group, user))
    return result


@api_router.get("/todays-drop")
async def get_todays_drop(age_group: str = "14-16", user=Depends(get_optional_user)):
    effective_country = await _resolve_user_country_code(user)
    drop = await _get_or_generate_todays_drop(age_group, user, effective_country)
    return drop


@api_router.get("/articles/{article_id}")
async def get_article(article_id: str, age_group: str = "14-16", user=Depends(get_optional_user)):
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    rewrite = article.get("rewrites", {}).get(age_group)
    counts = article.get("reaction_counts", {})
    counts = {k: max(0, v) for k, v in counts.items()}
    why = generate_why_reason(article, user)
    logo = article.get("source_logo", "") or await get_source_logo(article.get("source", ""))
    return {
        "id": article["id"], "original_title": article["original_title"],
        "original_url": article.get("original_url", ""),
        "original_content": article.get("original_content", ""),
        "source": article.get("source", ""), "source_logo": logo,
        "source_country": article.get("source_country", ""),
        "source_language": article.get("source_language", "English"),
        "category": article.get("category", ""), "image_url": article.get("image_url", ""),
        "published_at": article.get("published_at", ""), "rewrite": rewrite,
        "reaction_counts": counts, "why_reason": why,
        "rewrite_status": article.get("rewrite_status", "pending"),
        "low_confidence_flag": article.get("low_confidence_flag", False),
        "safety_status": article.get("safety_status", "safe"),
    }


# ========== MICRO-FACTS ROUTES ==========
@api_router.get("/micro-facts")
async def get_micro_facts(age_group: str = "14-16"):
    today = today_str()
    facts = await db.micro_facts.find({"date": today, "age_group": age_group}, {"_id": 0}).to_list(10)
    if not facts:
        # Fallback: try any date
        facts = await db.micro_facts.find({"age_group": age_group}, {"_id": 0}).sort("date", -1).to_list(6)
    return facts

@api_router.post("/micro-facts/generate")
async def trigger_micro_facts(background_tasks: BackgroundTasks, age_group: str = "14-16"):
    background_tasks.add_task(generate_micro_facts, age_group)
    return {"message": f"Generating micro-facts for {age_group} in background"}


# ========== OTHER ROUTES ==========
@api_router.post("/crawl")
async def trigger_crawl(background_tasks: BackgroundTasks, country_code: str = None):
    async def crawl_and_rewrite():
        count = await crawl_rss_feeds(country_code=country_code)
        logger.info(f"Background crawl done: {count} articles for country={country_code or 'ALL'}")
        for ag in ["8-10", "11-13", "14-16", "17-20"]:
            await rewrite_pending_articles(ag)
        await generate_micro_facts("14-16")
    background_tasks.add_task(crawl_and_rewrite)
    return {"message": f"Crawl started for country={country_code or 'ALL'}. Processing in background."}

@api_router.post("/crawl/{country_code}")
async def trigger_country_crawl(country_code: str, background_tasks: BackgroundTasks):
    async def crawl_and_rewrite():
        count = await crawl_rss_feeds(country_code=country_code)
        logger.info(f"Background crawl done: {count} articles for {country_code}")
        for ag in ["8-10", "11-13", "14-16", "17-20"]:
            await rewrite_pending_articles(ag)
    background_tasks.add_task(crawl_and_rewrite)
    return {"message": f"Crawl started for {country_code}. Processing in background."}

@api_router.post("/rewrite")
async def trigger_rewrite(background_tasks: BackgroundTasks):
    async def _rewrite_all():
        for ag in ["8-10", "11-13", "14-16", "17-20"]:
            await rewrite_pending_articles(ag)
    background_tasks.add_task(_rewrite_all)
    return {"message": "Rewrites started for all age groups (8-10, 11-13, 14-16, 17-20) in background"}

@api_router.get("/stats")
async def get_stats():
    total_articles = await db.articles.count_documents({})
    total_users = await db.users.count_documents({})
    categories_count = {}
    for cat in CATEGORIES:
        categories_count[cat["id"]] = await db.articles.count_documents({"category": cat["id"]})
    countries_count = await db.global_sources.count_documents({})
    return {"total_articles": total_articles, "total_users": total_users,
            "by_category": categories_count, "countries_configured": countries_count}


@api_router.get("/countries")
async def list_countries():
    """List all configured countries with their info for frontend selectors."""
    countries = await db.global_sources.find(
        {}, {"_id": 0, "country_code": 1, "country_name": 1, "flag_emoji": 1,
             "primary_language": 1, "city_tier_1": 1, "city_tier_2": 1}
    ).sort("country_name", 1).to_list(50)
    return countries


@api_router.get("/countries/{country_code}/sources")
async def get_country_sources(country_code: str):
    """Get all configured news sources for a specific country."""
    country = await db.global_sources.find_one(
        {"country_code": country_code.upper()}, {"_id": 0}
    )
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country


# ========== SOURCE LOGOS ==========
@api_router.get("/source-logos")
async def get_source_logos():
    logos = await db.source_logos.find({}, {"_id": 0}).to_list(50)
    return logos

@api_router.put("/source-logos/{source_name}")
async def update_source_logo(source_name: str, logo_url: str = "", visible: bool = True):
    await db.source_logos.update_one(
        {"source": source_name},
        {"$set": {"logo_url": logo_url, "visible": visible}},
        upsert=True)
    return await db.source_logos.find_one({"source": source_name}, {"_id": 0})


# ========== SYSTEM PROMPTS ==========
@api_router.get("/system-prompts")
async def get_system_prompts():
    return await db.system_prompts.find({}, {"_id": 0}).to_list(20)

@api_router.get("/system-prompts/{prompt_id}")
async def get_system_prompt(prompt_id: str):
    doc = await db.system_prompts.find_one({"id": prompt_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return doc

@api_router.put("/system-prompts/{prompt_id}")
async def update_system_prompt(prompt_id: str, body: PromptUpdate):
    result = await db.system_prompts.update_one(
        {"id": prompt_id}, {"$set": {"prompt": body.prompt, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return await db.system_prompts.find_one({"id": prompt_id}, {"_id": 0})


# ========== HEALTH CHECK ==========
@app.get("/health")
async def health_check():
    count = await db.articles.estimated_document_count()
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "articles_count": count,
        "version": "1.0.0",
    }


# ========== SCHEDULED JOB FUNCTIONS ==========
async def job_crawl_all_countries():
    logger.info("[Scheduler] job_crawl_all_countries: starting")
    try:
        for cc in ["IN", "US", "GB", "AU", "AE"]:
            added = await crawl_rss_feeds(country_code=cc)
            logger.info(f"[Scheduler] Crawled {cc}: {added} new articles")
    except Exception as e:
        logger.error(f"[Scheduler] job_crawl_all_countries failed: {e}")


async def job_cleanup_old_articles():
    logger.info("[Scheduler] job_cleanup_old_articles: removing articles older than 7 days")
    try:
        deleted = await cleanup_old_articles(max_age_days=7)
        logger.info(f"[Scheduler] job_cleanup_old_articles: done, deleted={deleted}")
    except Exception as e:
        logger.error(f"[Scheduler] job_cleanup_old_articles failed: {e}")


async def job_rewrite_pending():
    logger.info("[Scheduler] job_rewrite_pending: processing all age groups")
    try:
        for ag in ["8-10", "11-13", "14-16", "17-20"]:
            await rewrite_pending_articles(ag)
    except Exception as e:
        logger.error(f"[Scheduler] job_rewrite_pending failed: {e}")


async def job_generate_todays_drop_all_users():
    logger.info("[Scheduler] job_generate_todays_drop_all_users: starting")
    try:
        users = await db.users.find({}, {"_id": 0, "id": 1, "country": 1, "age_group": 1}).to_list(10000)
        generated = 0
        for user in users:
            ag = user.get("age_group", "14-16")
            try:
                country_doc = None
                if user.get("country"):
                    country_doc = await db.global_sources.find_one(
                        {"country_name": {"$regex": f"^{user['country']}$", "$options": "i"}},
                        {"_id": 0, "country_code": 1}
                    )
                cc = country_doc["country_code"] if country_doc else ""
                await _get_or_generate_todays_drop(ag, user, cc)
                generated += 1
            except Exception as e:
                logger.error(f"[Scheduler] Drop gen failed for user {user.get('id', '?')}: {e}")
        logger.info(f"[Scheduler] Today's Drop generated for {generated}/{len(users)} users")
    except Exception as e:
        logger.error(f"[Scheduler] job_generate_todays_drop_all_users failed: {e}")


async def job_health_ping():
    count = await db.articles.estimated_document_count()
    logger.info(f"[Scheduler] server alive — articles in DB: {count}")


# ========== STARTUP ==========
scheduler = AsyncIOScheduler(timezone="UTC")

@app.on_event("startup")
async def startup_event():
    # Ensure indexes
    await db.users.create_index("username", unique=True, sparse=True)
    await db.users.create_index("email", unique=True, sparse=True)
    await db.articles.create_index("original_url", unique=True, sparse=True)
    await db.articles.create_index("source_country")
    await db.articles.create_index("category")
    await db.reactions.create_index("user_id")
    await db.reactions.create_index([("article_id", 1), ("user_id", 1)], unique=True)
    logger.info("MongoDB indexes ensured.")

    await seed_system_prompts()
    await seed_source_logos()
    await seed_global_sources()
    logger.info("System prompts, source logos & global sources seeded.")

    count = await db.articles.count_documents({})
    if count == 0:
        logger.info("No articles. Triggering initial crawl in background...")
        asyncio.create_task(_initial_crawl())
    else:
        today = today_str()
        facts_count = await db.micro_facts.count_documents({"date": today})
        if facts_count == 0:
            asyncio.create_task(generate_micro_facts("14-16"))

    # Register and start APScheduler — after DB is ready
    scheduler.add_job(job_crawl_all_countries,         IntervalTrigger(hours=3),                              id="crawl_all_countries",    replace_existing=True)
    scheduler.add_job(job_rewrite_pending,             IntervalTrigger(minutes=60),                           id="rewrite_pending",        replace_existing=True)
    scheduler.add_job(job_generate_todays_drop_all_users, CronTrigger(hour=0, minute=0, timezone="UTC"),      id="todays_drop_all_users",  replace_existing=True)
    scheduler.add_job(job_cleanup_old_articles,        CronTrigger(hour=1, minute=0, timezone="UTC"),         id="cleanup_old_articles",   replace_existing=True)
    scheduler.add_job(job_health_ping,                 IntervalTrigger(minutes=5),                            id="health_ping",            replace_existing=True)
    scheduler.start()

    jobs = scheduler.get_jobs()
    logger.info(f"APScheduler started with {len(jobs)} jobs:")
    for j in jobs:
        logger.info(f"  [{j.id}]  next run: {j.next_run_time}")

    # Mount admin dashboard — after DB is ready
    admin_pwd = os.environ.get("ADMIN_PASSWORD", "admin")
    init_admin(db, admin_pwd, crawl=crawl_rss_feeds, rewrite=rewrite_pending_articles)
    logger.info("Admin dashboard ready at /admin")


async def _initial_crawl():
    """Initial crawl on startup — runs in background to not block startup."""
    try:
        for cc in ["US", "GB", "IN", "AU", "AE"]:
            await crawl_rss_feeds(country_code=cc)
        for ag in ["8-10", "11-13", "14-16", "17-20"]:
            await rewrite_pending_articles(ag)
        await generate_micro_facts("8-10")
        await generate_micro_facts("14-16")
    except Exception as e:
        logger.error(f"Initial crawl failed: {e}")

app.include_router(api_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down.")
    client.close()
