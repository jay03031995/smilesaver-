from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, json, logging, uuid, time, re
import requests
import sqlite3
import threading
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from collections import defaultdict, deque

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
except ImportError:
    LlmChat = None
    UserMessage = None
    ImageContent = None

try:
    import psycopg2
    from psycopg2.extras import Json
except ImportError:
    psycopg2 = None
    Json = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = None
local_db_conn = None
postgres_conn = None


class LocalResult:
    def __init__(self, matched_count=0, deleted_count=0):
        self.matched_count = matched_count
        self.deleted_count = deleted_count


class LocalCursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, key, direction):
        reverse = direction == -1
        self.docs = sorted(self.docs, key=lambda doc: doc.get(key, ""), reverse=reverse)
        return self

    async def to_list(self, limit):
        return self.docs[:limit]


class SQLiteCollection:
    def __init__(self, conn, lock, name):
        self.conn = conn
        self.lock = lock
        self.name = name

    def _matches(self, doc, query):
        return all(doc.get(key) == value for key, value in query.items())

    def _storage_key(self, doc):
        return str(doc.get("id") or doc.get("slug") or uuid.uuid4())

    def _project(self, doc, projection):
        base_doc = {k: v for k, v in doc.items() if k != "_storage_key"}
        if not projection:
            return base_doc
        projected = dict(base_doc)
        if projection.get("_id") == 0:
            projected.pop("_id", None)
        for key, value in projection.items():
            if key != "_id" and value == 0:
                projected.pop(key, None)
        return projected

    def _load_all_docs(self):
        with self.lock:
            rows = self.conn.execute(
                "SELECT storage_key, doc_json FROM documents WHERE collection_name = ?",
                (self.name,),
            ).fetchall()
        docs = []
        for storage_key, doc_json in rows:
            doc = json.loads(doc_json)
            doc["_storage_key"] = storage_key
            docs.append(doc)
        return docs

    async def count_documents(self, query):
        return sum(1 for doc in self._load_all_docs() if self._matches(doc, query))

    async def insert_many(self, docs):
        for doc in docs:
            await self.insert_one(doc)

    async def insert_one(self, doc):
        payload = dict(doc)
        storage_key = self._storage_key(payload)
        with self.lock:
            self.conn.execute(
                """
                INSERT OR REPLACE INTO documents (collection_name, storage_key, doc_json)
                VALUES (?, ?, ?)
                """,
                (self.name, storage_key, json.dumps(payload)),
            )
            self.conn.commit()

    def find(self, query=None, projection=None):
        query = query or {}
        return LocalCursor([
            self._project(doc, projection)
            for doc in self._load_all_docs()
            if self._matches(doc, query)
        ])

    async def find_one(self, query, projection=None):
        for doc in self._load_all_docs():
            if self._matches(doc, query):
                return self._project(doc, projection)
        return None

    async def update_one(self, query, update):
        for doc in self._load_all_docs():
            if self._matches(doc, query):
                updated_doc = {k: v for k, v in doc.items() if k != "_storage_key"}
                updated_doc.update(update.get("$set", {}))
                storage_key = doc["_storage_key"]
                with self.lock:
                    self.conn.execute(
                        """
                        UPDATE documents
                        SET doc_json = ?
                        WHERE collection_name = ? AND storage_key = ?
                        """,
                        (json.dumps(updated_doc), self.name, storage_key),
                    )
                    self.conn.commit()
                return LocalResult(matched_count=1)
        return LocalResult()

    async def delete_one(self, query):
        for doc in self._load_all_docs():
            if self._matches(doc, query):
                with self.lock:
                    self.conn.execute(
                        "DELETE FROM documents WHERE collection_name = ? AND storage_key = ?",
                        (self.name, doc["_storage_key"]),
                    )
                    self.conn.commit()
                return LocalResult(deleted_count=1)
        return LocalResult()


class SQLiteDB:
    def __init__(self, db_path):
        self.lock = threading.Lock()
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        with self.lock:
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    collection_name TEXT NOT NULL,
                    storage_key TEXT NOT NULL,
                    doc_json TEXT NOT NULL,
                    PRIMARY KEY (collection_name, storage_key)
                )
                """
            )
            self.conn.commit()
        self.blog_posts = SQLiteCollection(self.conn, self.lock, "blog_posts")
        self.bookings = SQLiteCollection(self.conn, self.lock, "bookings")
        self.contact_messages = SQLiteCollection(self.conn, self.lock, "contact_messages")
        self.smile_analyses = SQLiteCollection(self.conn, self.lock, "smile_analyses")


class PostgresCollection:
    def __init__(self, conn, lock, name):
        self.conn = conn
        self.lock = lock
        self.name = name

    def _matches(self, doc, query):
        return all(doc.get(key) == value for key, value in query.items())

    def _storage_key(self, doc):
        return str(doc.get("id") or doc.get("slug") or uuid.uuid4())

    def _project(self, doc, projection):
        base_doc = {k: v for k, v in doc.items() if k != "_storage_key"}
        if not projection:
            return base_doc
        projected = dict(base_doc)
        if projection.get("_id") == 0:
            projected.pop("_id", None)
        for key, value in projection.items():
            if key != "_id" and value == 0:
                projected.pop(key, None)
        return projected

    def _load_all_docs(self):
        with self.lock:
            with self.conn.cursor() as cur:
                cur.execute(
                    "SELECT storage_key, doc_json FROM documents WHERE collection_name = %s",
                    (self.name,),
                )
                rows = cur.fetchall()
        docs = []
        for storage_key, doc_json in rows:
            doc = dict(doc_json)
            doc["_storage_key"] = storage_key
            docs.append(doc)
        return docs

    async def count_documents(self, query):
        return sum(1 for doc in self._load_all_docs() if self._matches(doc, query))

    async def insert_many(self, docs):
        for doc in docs:
            await self.insert_one(doc)

    async def insert_one(self, doc):
        payload = dict(doc)
        storage_key = self._storage_key(payload)
        with self.lock:
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO documents (collection_name, storage_key, doc_json)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (collection_name, storage_key)
                    DO UPDATE SET doc_json = EXCLUDED.doc_json
                    """,
                    (self.name, storage_key, Json(payload)),
                )
            self.conn.commit()

    def find(self, query=None, projection=None):
        query = query or {}
        return LocalCursor([
            self._project(doc, projection)
            for doc in self._load_all_docs()
            if self._matches(doc, query)
        ])

    async def find_one(self, query, projection=None):
        for doc in self._load_all_docs():
            if self._matches(doc, query):
                return self._project(doc, projection)
        return None

    async def update_one(self, query, update):
        for doc in self._load_all_docs():
            if self._matches(doc, query):
                updated_doc = {k: v for k, v in doc.items() if k != "_storage_key"}
                updated_doc.update(update.get("$set", {}))
                storage_key = doc["_storage_key"]
                with self.lock:
                    with self.conn.cursor() as cur:
                        cur.execute(
                            """
                            UPDATE documents
                            SET doc_json = %s
                            WHERE collection_name = %s AND storage_key = %s
                            """,
                            (Json(updated_doc), self.name, storage_key),
                        )
                    self.conn.commit()
                return LocalResult(matched_count=1)
        return LocalResult()

    async def delete_one(self, query):
        for doc in self._load_all_docs():
            if self._matches(doc, query):
                with self.lock:
                    with self.conn.cursor() as cur:
                        cur.execute(
                            "DELETE FROM documents WHERE collection_name = %s AND storage_key = %s",
                            (self.name, doc["_storage_key"]),
                        )
                    self.conn.commit()
                return LocalResult(deleted_count=1)
        return LocalResult()


class PostgresDB:
    def __init__(self, database_url):
        self.lock = threading.Lock()
        self.conn = psycopg2.connect(database_url)
        self.conn.autocommit = False
        with self.lock:
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS documents (
                        collection_name TEXT NOT NULL,
                        storage_key TEXT NOT NULL,
                        doc_json JSONB NOT NULL,
                        PRIMARY KEY (collection_name, storage_key)
                    )
                    """
                )
            self.conn.commit()
        self.blog_posts = PostgresCollection(self.conn, self.lock, "blog_posts")
        self.bookings = PostgresCollection(self.conn, self.lock, "bookings")
        self.contact_messages = PostgresCollection(self.conn, self.lock, "contact_messages")
        self.smile_analyses = PostgresCollection(self.conn, self.lock, "smile_analyses")


mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
supabase_db_url = os.environ.get("SUPABASE_DB_URL")
if supabase_db_url:
    if psycopg2 is None:
        raise RuntimeError("SUPABASE_DB_URL is set but psycopg2 is not installed.")
    logging.info("Using Supabase Postgres database.")
    pg_db = PostgresDB(supabase_db_url)
    postgres_conn = pg_db.conn
    db = pg_db
elif mongo_url and db_name:
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
else:
    local_db_path = os.environ.get("LOCAL_DB_PATH", str(ROOT_DIR / "local_data.sqlite3"))
    logging.warning("MONGO_URL/DB_NAME not set; using SQLite local database at %s.", local_db_path)
    sqlite_db = SQLiteDB(local_db_path)
    local_db_conn = sqlite_db.conn
    db = sqlite_db

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'smilesavers2026')
CLINIC_NAME = "Smile Saver Dental Clinic"
CLINIC_PHONE = "9711146547"
CLINIC_WHATSAPP = "919711146547"
GOOGLE_REVIEW_SHARE_URL = "https://share.google/V39Bd2wU5NoGvSl86"
DEFAULT_GOOGLE_RATING = "4.9"
DEFAULT_GOOGLE_REVIEW_COUNT = 443
_review_summary_cache = {"value": None, "expires_at": 0}
CLINIC_HOURS = "10:00 AM to 8:00 PM"

app = FastAPI(title="Smile Savers Dental Clinic API")
api_router = APIRouter(prefix="/api")


def require_admin(x_admin_token: Optional[str] = Header(None)):
    if not x_admin_token or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(401, "Invalid admin token")
    return True


# ---------- Models ----------
class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    service: str
    preferred_date: str
    preferred_time: str
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BookingCreate(BaseModel):
    name: str; phone: str; email: Optional[str] = None
    service: str; preferred_date: str; preferred_time: str
    notes: Optional[str] = ""


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str; email: str; phone: Optional[str] = ""; message: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContactCreate(BaseModel):
    name: str; email: str; phone: Optional[str] = ""; message: str


class ChatRequest(BaseModel):
    session_id: str; message: str

class ChatResponse(BaseModel):
    reply: str


class SmileAnalysisRequest(BaseModel):
    name: Optional[str] = ""
    image_base64: str

class SmileAnalysisResponse(BaseModel):
    analysis: str
    recommendations: List[str]
    suggested_services: List[str]


class ReviewSummary(BaseModel):
    clinic_name: str
    rating: str
    review_count: int
    source_url: str
    live: bool = False
    fetched_at: str


class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    excerpt: str
    cover: str
    category: str
    tags: List[str] = []
    author_name: str = "Dr. Prateek Aggarwal"
    author_credentials: str = "BDS, MDS · 16+ years"
    author_bio: str = "Founder of Smile Savers Dental Clinic, Ghaziabad. NABH-accredited cosmetic dentist & implantologist."
    author_avatar: str = ""
    date_published: str
    date_updated: str
    read_time: str = "6 min"
    key_takeaways: List[str] = []
    content_md: str
    faqs: List[dict] = []
    related_services: List[str] = []
    references: List[str] = []
    is_published: bool = True


class BlogPostCreate(BaseModel):
    slug: str; title: str; excerpt: str; cover: str; category: str
    tags: List[str] = []
    author_name: Optional[str] = "Dr. Prateek Aggarwal"
    author_credentials: Optional[str] = "BDS, MDS · 16+ years"
    author_bio: Optional[str] = ""
    author_avatar: Optional[str] = ""
    date_published: Optional[str] = None
    date_updated: Optional[str] = None
    read_time: Optional[str] = "6 min"
    key_takeaways: List[str] = []
    content_md: str
    faqs: List[dict] = []
    related_services: List[str] = []
    references: List[str] = []
    is_published: bool = True


def _review_summary_fallback():
    return ReviewSummary(
        clinic_name=CLINIC_NAME,
        rating=DEFAULT_GOOGLE_RATING,
        review_count=DEFAULT_GOOGLE_REVIEW_COUNT,
        source_url=GOOGLE_REVIEW_SHARE_URL,
        live=False,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )


def _extract_google_review_summary(html: str):
    rating_match = (
        re.search(r'"ratingValue":"([0-9.]+)"', html)
        or re.search(r'([0-9.]+)\s*(?:/|out of)\s*5', html, re.IGNORECASE)
    )
    count_match = (
        re.search(r'"reviewCount":"([\d,]+)"', html)
        or re.search(r'([\d,]+)\s+Google\s+reviews', html, re.IGNORECASE)
        or re.search(r'([\d,]+)\s+reviews', html, re.IGNORECASE)
    )
    if not rating_match or not count_match:
        return None

    review_count = int(count_match.group(1).replace(",", ""))
    return ReviewSummary(
        clinic_name=CLINIC_NAME,
        rating=rating_match.group(1),
        review_count=review_count,
        source_url=GOOGLE_REVIEW_SHARE_URL,
        live=True,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )


def _fetch_google_review_summary():
    now = time.time()
    cached = _review_summary_cache["value"]
    if cached and _review_summary_cache["expires_at"] > now:
        return cached

    summary = _review_summary_fallback()
    try:
        response = requests.get(
            GOOGLE_REVIEW_SHARE_URL,
            timeout=10,
            allow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
                ),
                "Accept-Language": "en-IN,en;q=0.9",
            },
        )
        response.raise_for_status()
        parsed = _extract_google_review_summary(response.text)
        if parsed:
            summary = parsed
    except Exception as exc:
        logging.warning("Could not fetch Google review summary: %s", exc)

    _review_summary_cache["value"] = summary
    _review_summary_cache["expires_at"] = now + 60 * 30
    return summary


def _normalize_text(value: str):
    return re.sub(r"[^a-z0-9\s]", " ", (value or "").lower())


def _find_relevant_service(message: str):
    msg = _normalize_text(message)
    for service in SERVICES:
        haystacks = [
            service.get("title", ""),
            service.get("slug", "").replace("-", " "),
            service.get("tagline", ""),
            service.get("summary", ""),
        ]
        for hay in haystacks:
            hay_norm = _normalize_text(hay)
            if hay_norm and (hay_norm in msg or msg in hay_norm):
                return service
        tokens = [token for token in haystacks[1].split() if len(token) > 3]
        if tokens and any(token in msg for token in tokens):
            return service
    return None


def _local_chat_reply(message: str):
    msg = _normalize_text(message)
    service = _find_relevant_service(message)

    if any(term in msg for term in ["hour", "timing", "open", "close"]):
        return f"{CLINIC_NAME} is open daily from {CLINIC_HOURS}. You can call {CLINIC_PHONE} or book online to confirm your preferred slot."

    if any(term in msg for term in ["phone", "call", "contact", "number", "whatsapp"]):
        return f"You can reach {CLINIC_NAME} at {CLINIC_PHONE}. WhatsApp is also available on the same number for appointment coordination."

    if any(term in msg for term in ["book", "appointment", "consultation", "slot"]):
        return f"You can book through the website booking form or call {CLINIC_PHONE}. Share your preferred date, time, and treatment, and the clinic will confirm the slot."

    if "nabh" in msg or "accredit" in msg:
        return f"Yes, {CLINIC_NAME} is NABH accredited. The clinic also highlights patient safety, sterilisation protocols, and specialist-led treatment planning."

    if any(term in msg for term in ["where", "address", "location", "ghaziabad", "sahibabad"]):
        return f"{CLINIC_NAME} is located at S 28, opp. Gurdwara Sahib, Shubham Apartment, Shalimar Garden Extension I, Sahibabad, Ghaziabad 201006."

    if service:
        price = service.get("starting_price", "available on consultation")
        duration = service.get("duration", "depends on the case")
        summary = service.get("summary", service.get("details", ""))
        return f"{service['title']} starts at {price} and typically takes {duration}. {summary} If you want, I can also help you choose the right treatment before you book."

    if any(term in msg for term in ["price", "cost", "fees", "charge"]):
        return "Pricing depends on the treatment. Common starting points are Root Canal Treatment from ₹3,500, Teeth Whitening from ₹8,000, Dental Implants from ₹25,000, and Smile Makeover from ₹15,000 per tooth."

    if any(term in msg for term in ["child", "kid", "kids", "pediatric"]):
        return "Yes, the clinic offers pediatric dentistry for children, including preventive care, fillings, habit correction, and early orthodontic guidance. You can book a consultation and mention the child’s age."

    return f"I can help with treatments, pricing, timings, location, and booking at {CLINIC_NAME}. You can also call {CLINIC_PHONE} if you want the clinic team to assist directly."


# ---------- Static seed data ----------
SERVICES = [
    {"slug": "smile-makeover", "title": "Smile Makeover", "tagline": "Craft your dream smile in 4 days",
     "icon": "Sparkles", "image": "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80",
     "summary": "A complete cosmetic transformation combining veneers, whitening and contouring.",
     "details": "Smile Makeovers are our signature treatments at Smile Savers Dental Clinic. We blend art and dentistry — using Emax porcelain veneers, gum sculpting, and Zoom whitening — to engineer a natural, radiant smile customised to your facial features. Most cases complete within 4-7 days.",
     "benefits": ["Personalised digital smile design", "Premium Emax / Zirconia materials", "Pain-free, minimal-prep approach", "Lifetime aftercare"],
     "duration": "4 to 7 days", "starting_price": "₹15,000 / tooth"},
    {"slug": "dental-implants", "title": "Dental Implants", "tagline": "Replace missing teeth in 1 week",
     "icon": "Drill", "image": "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&q=80",
     "summary": "Permanent titanium-rooted replacements that look, feel and function like natural teeth.",
     "details": "We use Nobel Biocare, Straumann, Osstem and Alpha Bio implants — chosen by our specialists based on your bone density and budget. Same-day immediate-load implants available for select cases.",
     "benefits": ["Single-visit immediate implants", "Globally trusted brands", "CBCT-guided precision placement", "10-year warranty"],
     "duration": "1 visit (3-6 months osseointegration)", "starting_price": "₹25,000"},
    {"slug": "root-canal-treatment", "title": "Root Canal Treatment", "tagline": "Painless single-sitting RCT",
     "icon": "Activity", "image": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80",
     "summary": "Single-sitting root canal therapy that saves your natural tooth — without pain.",
     "details": "Our endodontists use rotary NiTi files and apex locators to complete most root canals in a single 60-90 minute sitting under local anesthesia.",
     "benefits": ["Single-sitting procedure", "Latest rotary endodontics", "100% pain managed", "Tooth saved for life"],
     "duration": "60-90 minutes", "starting_price": "₹3,500"},
    {"slug": "teeth-whitening", "title": "Teeth Whitening", "tagline": "Up to 8 shades brighter in one visit",
     "icon": "Sun", "image": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80",
     "summary": "Zoom WhiteSpeed (USA) in-office whitening for an instantly luminous smile.",
     "details": "We use Philips Zoom WhiteSpeed — clinically proven to lighten teeth up to 8 shades in 45 minutes. Safe, enamel-friendly, and longer-lasting than over-the-counter solutions.",
     "benefits": ["Up to 8 shades brighter", "FDA cleared", "Enamel-safe formula", "Take-home maintenance kit included"],
     "duration": "45-60 minutes", "starting_price": "₹8,000"},
    {"slug": "braces-aligners", "title": "Braces & Invisalign", "tagline": "Straighten teeth invisibly",
     "icon": "AlignCenter", "image": "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80",
     "summary": "Clear aligners and modern ceramic braces for discreet, comfortable orthodontics.",
     "details": "Choose from Invisalign clear aligners, ceramic braces, lingual braces or self-ligating metal — fitted by our orthodontists with 3D treatment planning.",
     "benefits": ["Invisalign Diamond provider", "3D digital treatment planning", "Faster results with self-ligating tech", "Kids & adults welcome"],
     "duration": "6-24 months", "starting_price": "₹35,000"},
    {"slug": "pediatric-dentistry", "title": "Pediatric Dentistry", "tagline": "Gentle, child-friendly dental care",
     "icon": "Baby", "image": "https://images.unsplash.com/photo-1581585504113-3d712eb5e0a6?auto=format&fit=crop&q=80",
     "summary": "Specialised dental care for children — from first tooth to teen years.",
     "details": "Our pediatric specialists create a calm, playful environment. Services include fluoride application, sealants, fillings, habit-breaking appliances and early orthodontic intervention.",
     "benefits": ["Child-friendly clinic environment", "Behaviour-management trained team", "Painless laser treatments", "Parent education sessions"],
     "duration": "30-45 minutes", "starting_price": "₹500"},
    {"slug": "veneers", "title": "Ceramic Veneers", "tagline": "Hollywood smile with Emax porcelain",
     "icon": "Layers", "image": "https://images.unsplash.com/photo-1559059714-04ff5e98a04b?auto=format&fit=crop&q=80",
     "summary": "Ultra-thin Emax porcelain shells bonded to the front of your teeth.",
     "details": "Emax veneers (Ivoclar Vivadent, Germany) deliver lifelike translucency and strength. Minimal-prep technique preserves your natural enamel.",
     "benefits": ["No-prep / minimal-prep options", "Stain-resistant porcelain", "10+ year lifespan", "Lifelike translucency"],
     "duration": "2 visits over 7 days", "starting_price": "₹18,000 / tooth"},
    {"slug": "gum-treatment", "title": "Gum Treatment", "tagline": "Periodontics & laser gum care",
     "icon": "Heart", "image": "https://images.unsplash.com/photo-1615886753866-79396abc446e?auto=format&fit=crop&q=80",
     "summary": "Laser-assisted gum disease treatment, depigmentation and gummy-smile correction.",
     "details": "From routine deep cleaning to advanced flap surgery and laser gum sculpting — our periodontists treat gum disease at every stage with precision tools.",
     "benefits": ["Laser-assisted, suture-free", "Same-day gum recontouring", "Treats bleeding & receding gums", "Painless follow-ups"],
     "duration": "60 minutes", "starting_price": "₹4,000"},
    {"slug": "crowns-bridges", "title": "Crowns & Bridges", "tagline": "Zirconia & Emax restorations",
     "icon": "Crown", "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80",
     "summary": "Full-ceramic crowns and bridges that match your natural teeth perfectly.",
     "details": "We use Dentsply Cercon HT zirconia cores layered with Emax porcelain — the same materials used in our veneers — for unmatched aesthetics and strength.",
     "benefits": ["Metal-free options", "Digital impressions (no goop)", "Same-day temporaries", "5-year quality assurance"],
     "duration": "5-7 days", "starting_price": "₹8,000"},
    {"slug": "wisdom-tooth-extraction", "title": "Wisdom Tooth Extraction", "tagline": "Painless surgical removal",
     "icon": "Scissors", "image": "https://images.unsplash.com/photo-1606811951341-1abf3f3f5c7c?auto=format&fit=crop&q=80",
     "summary": "Minimally-invasive wisdom tooth removal — even for impacted cases.",
     "details": "Our oral surgeons handle all third-molar cases — from simple eruptions to deep impactions — with piezo surgery and 3D CBCT planning for minimal swelling.",
     "benefits": ["Piezo surgery (no drilling)", "Same-day return to routine", "Sedation options available", "All complexity levels"],
     "duration": "30-60 minutes", "starting_price": "₹4,500"},
    {"slug": "dentures", "title": "Dentures", "tagline": "Comfortable, natural-looking dentures",
     "icon": "Smile", "image": "https://images.unsplash.com/photo-1588776813677-77aaf5595b83?auto=format&fit=crop&q=80",
     "summary": "Flexible, BPS premium and implant-supported dentures.",
     "details": "Choose from flexible Valplast, premium BPS Ivoclar or implant-supported overdentures — fitted by prosthodontists for a stable, confident smile.",
     "benefits": ["Implant-supported options", "Premium BPS dentures", "Natural appearance", "Better chewing efficiency"],
     "duration": "2-3 weeks", "starting_price": "₹12,000"},
    {"slug": "full-mouth-rehabilitation", "title": "Full Mouth Rehabilitation", "tagline": "Complete smile reconstruction",
     "icon": "Star", "image": "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80",
     "summary": "Comprehensive rebuild combining implants, crowns, veneers and gum work.",
     "details": "Our signature treatment for severely worn, missing or compromised teeth. We coordinate implantology, prosthodontics, periodontics and orthodontics in one master plan.",
     "benefits": ["Single coordinated treatment plan", "Multidisciplinary team", "Phased payment plans", "Restored function & aesthetics"],
     "duration": "1-3 months", "starting_price": "On consultation"},
]

DOCTORS = [
    {
        "name": "Dr. Prateek Aggarwal",
        "designation": "Founder · Dentist & Implantologist",
        "experience": "16+ years",
        "qualifications": "BDS, MDS - Oral & Maxillofacial Surgery",
        "specialisation": "Dental Implants, Smile Makeovers, Oral Surgery, Cosmetic Dentistry",
        "image": "https://customer-assets.emergentagent.com/job_dental-ghaziabad/artifacts/gsy52duo_ChatGPT%20Image%20May%206%2C%202026%2C%2008_22_07%20PM.png",
        "bio": "Dr. Prateek Aggarwal is a leading dentist and implantologist with over 16 years of clinical experience. As the founder of Smile Savers Dental Clinic in Ghaziabad, he has placed over 2,500 implants and crafted thousands of smile transformations. Trained in advanced oral surgery and cosmetic dentistry, his patient-first philosophy and meticulous craftsmanship have earned the clinic strong patient trust and a coveted NABH accreditation.",
        "credentials": [
            "Member · Indian Dental Association (IDA)",
            "Certified Implantologist · Nobel Biocare & Straumann",
            "Advanced training in Cosmetic & Aesthetic Dentistry",
            "Featured on Practo · Verified Top Dentist in Ghaziabad",
        ],
        "expertise": [
            "Dental Implants (Single & Multiple)",
            "Full Mouth Rehabilitation",
            "Smile Designing & Veneers",
            "Wisdom Tooth Surgery",
            "Root Canal Treatment",
            "Cosmetic Dentistry",
        ],
    }
]

TESTIMONIALS = [
    {"name": "Ananya Rao", "location": "Ghaziabad", "rating": 5, "service": "Smile Makeover",
     "text": "Dr. Prateek gave me the smile I had only dreamed of. The clinic is spotless, the team is warm, and every detail of my veneers was explained beforehand. Worth every rupee.",
     "avatar": "https://i.pravatar.cc/150?img=47"},
    {"name": "Rahul Singh", "location": "Sahibabad", "rating": 5, "service": "Dental Implant",
     "text": "I was terrified of implants but the team made it completely painless. Walked in with a missing tooth, walked out with a permanent solution that looks natural.",
     "avatar": "https://i.pravatar.cc/150?img=12"},
    {"name": "Meera Kapoor", "location": "Shalimar Garden", "rating": 5, "service": "Teeth Whitening",
     "text": "8 shades brighter in 45 minutes — I couldn't believe the difference. The Zoom whitening at Smile Savers Dental Clinic is genuinely the best I've experienced.",
     "avatar": "https://i.pravatar.cc/150?img=44"},
    {"name": "Vikram Joshi", "location": "Vasundhara", "rating": 5, "service": "Root Canal",
     "text": "Single-sitting root canal — zero pain, zero stress. They explained every step and the cost upfront. Highly recommend for anyone scared of dentists.",
     "avatar": "https://i.pravatar.cc/150?img=33"},
    {"name": "Kavita Verma", "location": "Indirapuram", "rating": 5, "service": "Invisalign",
     "text": "After 14 months with Invisalign here, my teeth are perfectly aligned. The 3D treatment plan they showed me on day 1 came true exactly. NABH accreditation really shows.",
     "avatar": "https://i.pravatar.cc/150?img=49"},
    {"name": "Aditya Malhotra", "location": "Vaishali", "rating": 5, "service": "Full Mouth Rehab",
     "text": "Brought my 70-year-old father here for full mouth rehabilitation. The team coordinated implants, crowns and gum work flawlessly. He smiles with confidence again.",
     "avatar": "https://i.pravatar.cc/150?img=68"},
]

GALLERY = [
    {"category": "Clinic", "image": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80", "caption": "Reception"},
    {"category": "Clinic", "image": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80", "caption": "Treatment Suite"},
    {"category": "Patients", "image": "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&q=80", "caption": "Smile Transformation"},
    {"category": "Awards", "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80", "caption": "NABH Recognition"},
    {"category": "Patients", "image": "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80", "caption": "Veneer Case"},
    {"category": "Clinic", "image": "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&q=80", "caption": "Dental Equipment"},
    {"category": "Patients", "image": "https://images.unsplash.com/photo-1611690061822-b707a67bfebb?auto=format&fit=crop&q=80", "caption": "Happy Patient"},
    {"category": "Awards", "image": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80", "caption": "ISO 9001 Certified"},
    {"category": "Clinic", "image": "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80", "caption": "Sterilisation Zone"},
]

# Common service helpers
COMMON_PROCESS = [
    {"step": "Consultation & Smile Analysis", "desc": "Dr. Prateek conducts a complete oral exam, digital X-rays/CBCT and a personalised smile analysis."},
    {"step": "Custom Treatment Plan", "desc": "You receive a transparent, written plan with timeline, materials, and a fixed quote — no hidden surprises."},
    {"step": "Treatment Day", "desc": "Performed in our NABH-accredited suite using sterilised, internationally-certified materials and pain-managed protocols."},
    {"step": "Aftercare & Follow-up", "desc": "Take-home care kit, scheduled follow-ups, and direct WhatsApp access to the clinic for any concerns."},
]
COMMON_FAQS = [
    {"q": "Is the procedure painful?", "a": "We use modern anesthesia, sedation options and laser-assisted protocols to keep procedures virtually painless."},
    {"q": "How many visits will it take?", "a": "It depends on the case. Many treatments finish in one visit; complex cases span 1-3 months."},
    {"q": "What materials do you use?", "a": "Only globally-trusted brands — Ivoclar Vivadent, 3M, Nobel Biocare/Straumann, Dentsply Cercon zirconia. Never local substitutes."},
    {"q": "Are there any payment plans?", "a": "Yes. No-cost EMI on cards and phased payment options for high-value treatments."},
    {"q": "Is Smile Savers Dental Clinic really NABH-accredited?", "a": "Yes — continuously NABH accredited and ISO 9001:2015 certified."},
]
COMMON_MATERIALS = ["Ivoclar Vivadent (Germany)", "3M ESPE (USA)", "Nobel Biocare (Sweden)", "Straumann (USA)", "Dentsply Cercon HT Zirconia"]
for _s in SERVICES:
    _s["process"] = COMMON_PROCESS
    _s["faqs"] = COMMON_FAQS
    _s["materials"] = COMMON_MATERIALS


# ---------- Blog seed data with E-E-A-T ----------
def _b(slug, title, excerpt, cover, category, tags, takeaways, content_md, faqs, related, refs, date_pub, date_upd, read_time):
    return {
        "id": str(uuid.uuid4()), "slug": slug, "title": title, "excerpt": excerpt, "cover": cover,
        "category": category, "tags": tags, "key_takeaways": takeaways, "content_md": content_md,
        "faqs": faqs, "related_services": related, "references": refs,
        "author_name": "Dr. Prateek Aggarwal",
        "author_credentials": "BDS, MDS · Implantologist · 16+ years",
        "author_bio": "Founder of Smile Savers Dental Clinic, Ghaziabad. NABH-accredited cosmetic dentist & implantologist with 2,500+ implants placed and 10,000+ smile transformations.",
        "author_avatar": "https://customer-assets.emergentagent.com/job_dental-ghaziabad/artifacts/gsy52duo_ChatGPT%20Image%20May%206%2C%202026%2C%2008_22_07%20PM.png",
        "date_published": date_pub, "date_updated": date_upd, "read_time": read_time, "is_published": True,
    }

BLOG_SEED = [
    _b(
        "how-long-do-teeth-whitening-results-last",
        "How Long Do Teeth Whitening Results Last? A Dentist's Honest Guide (2026)",
        "Professional whitening can last 12–36 months — but only if you do these 7 things. A 16-year veteran cosmetic dentist shares the truth.",
        "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80",
        "Cosmetic Dentistry",
        ["teeth whitening", "zoom whitening", "cosmetic dentistry", "smile care"],
        [
            "Professional in-office whitening lasts 12–36 months on average.",
            "Touch-up kits and dietary care can extend results to 3+ years.",
            "Zoom WhiteSpeed (USA) used at Smile Savers Dental Clinic is FDA-cleared and enamel-safe.",
            "Coffee, tea, red wine and tobacco are the top four re-staining culprits.",
            "Whitening toothpaste alone cannot replicate professional results.",
        ],
        """## A Quick Answer (For Featured Snippets)

Professionally whitened teeth typically stay bright for **12 to 36 months**. With diligent care — twice-yearly touch-ups, avoiding staining foods, and using a take-home maintenance kit — many of our patients at [Smile Savers Dental Clinic](/) maintain their results for **3+ years**.

## Why Whitening Fades Over Time

Tooth enamel is microscopically porous. Over time, the pigments in coffee, black tea, red wine, soy sauce, dark berries and tobacco re-deposit into these pores. This is normal — even the strongest whitening agents cannot permanently change tooth structure.

How quickly results fade depends on three factors:

- **Your habits** — daily coffee drinkers will see fading in 9–14 months; non-coffee drinkers can stretch results to 24+ months.
- **Your enamel condition** — thinner or eroded enamel re-stains faster.
- **The whitening method used** — in-office whitening like our [Zoom Teeth Whitening](/services/teeth-whitening) penetrates deeper than DIY strips.

## In-Office vs Take-Home vs OTC: A Comparison

| Method | Average Duration | Shade Lift |
|---|---|---|
| In-office (Zoom WhiteSpeed) | 18–36 months | 6–8 shades |
| Custom take-home trays | 12–18 months | 4–6 shades |
| OTC strips/toothpaste | 1–3 months | 1–2 shades |

This is why Indian dental councils consistently recommend **professional in-office whitening** as the first choice for visible, long-lasting results. At Smile Savers Dental Clinic we exclusively use Philips Zoom WhiteSpeed — the only system independently shown to deliver 8 shades of brightening in 45 minutes without enamel damage.

## 7 Habits That Extend Whitening Results

1. **Rinse with water** after coffee, tea or wine.
2. **Use a straw** for darker beverages.
3. **Brush gently with a whitening toothpaste** twice a week (not daily — too abrasive).
4. **Floss daily** to prevent inter-dental staining.
5. **Quit tobacco** — by far the worst offender.
6. **Schedule a 6-monthly hygiene cleaning** to remove surface stains.
7. **Use your take-home maintenance kit** for one night every 6 weeks.

## When You Should Avoid Whitening

Whitening is not recommended if you have:

- Untreated [gum disease](/services/gum-treatment) — bleach can aggravate inflamed gums.
- Active cavities (treat them first).
- Hyper-sensitive teeth (we offer desensitising pre-treatment).
- Crowns or [veneers](/services/veneers) on visible front teeth — these don't whiten.
- Pregnancy or breastfeeding (out of caution, not proven harm).

## What to Expect at Smile Savers Dental Clinic

A typical Zoom whitening visit lasts 60–75 minutes:

1. **Pre-assessment** — shade record, gum protection, sensitivity check.
2. **Three 15-minute light cycles** with hydrogen peroxide gel.
3. **Final shade comparison** + custom take-home kit.
4. **Follow-up call at 7 days** to check sensitivity.

Most patients walk in with a B2 shade and walk out at A1 — about 6 to 8 shades brighter. The transformation in a single afternoon is remarkable.

## The Bottom Line

If your goal is a longer-lasting, dramatic result, professional in-office whitening is the only proven path. With reasonable care, the results last 18–36 months — and a 30-minute touch-up keeps you fresh for another year.

Ready to brighten your smile? [Book a free consultation](/booking) at our NABH-accredited Ghaziabad clinic, or chat with our AI smile assistant for an instant personalised recommendation.
""",
        [
            {"q": "How long does in-office teeth whitening last?", "a": "Typically 12–36 months. With take-home kits and avoidance of staining foods, many patients hold results for 3+ years."},
            {"q": "Is teeth whitening safe for enamel?", "a": "Yes. FDA-cleared systems like Zoom WhiteSpeed use buffered hydrogen peroxide that does not erode enamel. We screen every patient before treatment."},
            {"q": "Will whitening work on crowns or veneers?", "a": "No. Whitening only lightens natural enamel. If you have crowns or veneers in your smile zone, we recommend whitening before fitting them."},
            {"q": "How much does Zoom whitening cost in Ghaziabad?", "a": "At Smile Savers Dental Clinic, Zoom WhiteSpeed starts at ₹8,000 including a take-home maintenance kit. Final cost is fixed after consultation."},
            {"q": "How soon can I drink coffee after whitening?", "a": "We recommend a 'white diet' for 48 hours — avoid all dark beverages. After that, normal consumption with a straw is fine."},
            {"q": "Is whitening painful?", "a": "Most patients feel nothing. Some report mild zings during treatment which we manage with a desensitising gel — typically gone within 24 hours."},
        ],
        ["teeth-whitening", "smile-makeover", "veneers"],
        [
            "American Dental Association. Whitening: 5 Things to Know About Getting a Brighter Smile. https://www.mouthhealthy.org/all-topics-a-z/whitening",
            "Philips Zoom WhiteSpeed Clinical Data. https://www.philips.com/zoom",
            "NABH Standards for Dental Healthcare Providers, 2024.",
        ],
        "2026-05-01", "2026-05-04", "7 min"
    ),
    _b(
        "single-sitting-root-canal",
        "Single-Sitting Root Canal Treatment: Is It Really Painless? (2026)",
        "Modern endodontics has changed root canal treatment forever. Learn how single-visit RCT works, who qualifies and what to expect.",
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80",
        "Endodontics",
        ["root canal", "RCT", "endodontics", "single sitting RCT"],
        [
            "Single-sitting RCT completes in 60–90 minutes for most cases.",
            "Success rates exceed 95% when performed with rotary endodontics.",
            "Modern anesthesia + apex locators make the procedure virtually painless.",
            "Saves your natural tooth — no extraction or implant needed.",
        ],
        """## Quick Answer

A single-sitting root canal treatment (RCT) is a one-visit procedure that removes infected pulp from inside a tooth, disinfects the canals and seals them — typically completed in **60 to 90 minutes** under local anesthesia. At Smile Savers Dental Clinic, our endodontist performs this routinely with a 95%+ long-term success rate.

## Why Old-School RCTs Took 3 Visits

Traditional root canal treatment was performed manually with stainless steel hand files. Each canal had to be cleaned over multiple sittings — typically three or four — to ensure full disinfection. Patients dreaded the long appointments, the rubber dam discomfort and the in-between flare-ups.

Modern endodontics, in contrast, uses:

- **Rotary NiTi files** — flexible, super-elastic instruments that shape canals 4× faster.
- **Apex locators** — electronic devices that pinpoint the exact canal length within 0.1 mm.
- **Bioceramic sealers** — modern materials that seal canals far more reliably than old-style gutta-percha alone.
- **Operating microscopes** — for visualising calcified or curved canals invisible to the naked eye.

Together, these tools allow our endodontist to safely complete most [root canal treatments](/services/root-canal-treatment) in a single sitting.

## Is Single-Sitting RCT Right For Everyone?

Most cases qualify. We may extend to two visits if:

- The tooth is severely infected with active pus drainage.
- The patient has a compromised immune system.
- The canal anatomy is unusually complex (e.g., heavily curved or calcified).

In these scenarios, a 7-day medication phase between visits dramatically improves outcomes.

## What Does It Feel Like?

Honestly? Most patients are surprised at how comfortable it is. We use:

1. **Topical anesthetic gel** before the injection.
2. **Computer-controlled local anesthesia** — slow, painless delivery.
3. **A rubber dam** that isolates the tooth and protects your throat.
4. **Frequent comfort checks** during the procedure.

Most patients describe it as 'sitting through a long filling'. Many fall asleep mid-procedure.

## After the RCT — What to Expect

- **First 24 hours**: mild tenderness when biting, manageable with paracetamol.
- **Day 2–7**: completely normal function.
- **Within 2–4 weeks**: place a [crown](/services/crowns-bridges) on the tooth. RCT-treated teeth become brittle without one.

Skipping the crown is the single biggest reason RCT-treated teeth fail later. We strongly recommend a zirconia or Emax crown to seal and reinforce the tooth.

## Cost & Time at Smile Savers Dental Clinic

| Procedure | Duration | Starting Price |
|---|---|---|
| Single-sitting RCT (1 canal) | 45 min | ₹3,500 |
| Single-sitting RCT (3 canals) | 90 min | ₹6,500 |
| RCT + Zirconia Crown bundle | 2 visits | ₹14,000 |

We provide written quotes after a quick examination. No surprise charges mid-treatment.

## When to Suspect You Need a Root Canal

See us promptly if you experience:

- Sharp pain on biting or chewing.
- Lingering sensitivity to hot or cold (>30 seconds).
- Spontaneous throbbing pain at night.
- Visible swelling or a 'pimple' on your gum.
- Tooth discolouration after trauma.

Early diagnosis often saves a tooth that would otherwise need extraction.

## The Bottom Line

A single-sitting root canal is one of modern dentistry's quiet miracles — a 90-minute visit that saves your tooth for a lifetime. There's no reason to fear it anymore.

If you've been putting off treatment, [book a free consultation](/booking) or chat with our AI assistant. The longer you wait, the harder the case becomes.
""",
        [
            {"q": "How long does a single-sitting root canal take?", "a": "Most cases complete in 60–90 minutes. Front teeth (single canal) take ~45 minutes; molars (3–4 canals) take up to 90 minutes."},
            {"q": "Is a single-visit RCT as effective as multi-visit?", "a": "Yes. Modern research shows comparable or higher success rates (95%+) with single-visit RCT when performed with rotary endodontics and apex locators."},
            {"q": "Do I need a crown after a root canal?", "a": "Yes — strongly recommended. RCT-treated teeth become brittle. A zirconia or Emax crown protects the tooth from fracture."},
            {"q": "What is the cost of root canal in Ghaziabad?", "a": "At Smile Savers Dental Clinic, single-sitting RCT starts at ₹3,500 per canal. We provide a fixed written quote after examination."},
            {"q": "Can a tooth be saved without a root canal?", "a": "If pulp infection is confirmed, no. Alternatives are extraction + implant, but saving the natural tooth is always preferred when possible."},
            {"q": "Is RCT painful?", "a": "No. With modern anesthesia and rubber-dam isolation, most patients report no pain during the procedure and only mild tenderness for 24 hours after."},
        ],
        ["root-canal-treatment", "crowns-bridges", "dental-implants"],
        [
            "American Association of Endodontists. Root Canal Explained. https://www.aae.org/patients/root-canal-treatment/",
            "International Endodontic Journal, 'Single-visit vs Multiple-visit Endodontic Treatment: A Cochrane Systematic Review'.",
            "NABH Standards for Dental Healthcare Providers, 2024.",
        ],
        "2026-04-22", "2026-05-02", "8 min"
    ),
    _b(
        "dental-implants-1-week",
        "Dental Implants in 1 Week: A Complete Guide for Indian Patients (2026)",
        "Same-day implants, immediate-load protocols, and what's actually possible. From a 2,500-implant veteran.",
        "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&q=80",
        "Implants",
        ["dental implants", "immediate load", "implantology"],
        [
            "Same-day temporary crowns are real — but only for the right candidates.",
            "Final permanent crowns are placed after 3–6 months of osseointegration.",
            "Premium implant brands (Nobel Biocare, Straumann) offer the highest success rates.",
            "CBCT-guided surgery dramatically reduces complications.",
        ],
        """## Quick Answer

You can leave Smile Savers Dental Clinic with a fully-functional **temporary implant crown in a single visit** — but the *permanent* crown is fitted 3 to 6 months later, after the implant fully fuses with your jawbone. This is called the immediate-load (or 'teeth in a day') protocol.

## How [Dental Implants](/services/dental-implants) Actually Work

A dental implant is a three-part replacement for a missing tooth:

1. **The implant body** — a titanium screw placed into the jawbone.
2. **The abutment** — a small connector that sits at gum level.
3. **The crown** — the visible tooth, custom-made to match your smile.

The titanium body fuses with bone over 3–6 months in a process called *osseointegration*. Once fully fused, the implant is stronger and longer-lasting than a natural tooth root.

## Who Qualifies for Same-Day Implants?

Not everyone. The ideal candidate has:

- **Adequate bone density** — confirmed via CBCT scan.
- **Healthy gums** — no active periodontitis.
- **Good general health** — diabetes well-controlled, no recent chemotherapy.
- **A non-smoking habit** — or willingness to quit pre-surgery.

For patients with low bone, we may recommend bone grafting first, then implant placement after 4–6 months.

## The Premium Brand Difference

We work exclusively with internationally-recognised implant systems:

- **Nobel Biocare (Sweden)** — the world's first dental implant brand. 99% 10-year success rate.
- **Straumann (Switzerland)** — research-backed, used by elite clinics globally.
- **Osstem (South Korea)** — excellent value with strong clinical data.
- **Alpha Bio (Israel)** — affordability without compromise.

Cheaper, locally-produced implants exist — but their long-term data is limited. We don't use them.

## What Happens On Implant Day

A typical single-implant procedure at Smile Savers Dental Clinic:

1. **CBCT scan + digital planning** (separate appointment).
2. **Surgical placement** — 30–45 minutes under local anesthesia.
3. **Immediate temporary crown** — same day, if bone quality permits.
4. **Healing period** — 3–6 months of normal function.
5. **Final permanent crown** — 30 minutes, no anesthesia needed.

## What About Multiple Missing Teeth?

For 4+ missing teeth, we offer **All-on-4** or **All-on-6** protocols — fixed full-arch teeth on as few as 4 implants. Total treatment: 1 surgical day + 3 follow-ups over 4 months. This is genuinely life-changing for [denture](/services/dentures) wearers.

## Cost in Ghaziabad

| Implant System | Implant + Abutment | Final Crown | Total |
|---|---|---|---|
| Alpha Bio (Israel) | ₹25,000 | ₹8,000 | ₹33,000 |
| Osstem (Korea) | ₹30,000 | ₹8,000 | ₹38,000 |
| Straumann (Swiss) | ₹50,000 | ₹12,000 | ₹62,000 |
| Nobel Biocare (Sweden) | ₹55,000 | ₹12,000 | ₹67,000 |

All bundles include the temporary crown, follow-ups and a 10-year limited warranty.

## Maintenance for Life

Implants don't decay — but the surrounding gums can develop *peri-implantitis* if hygiene slips. We recommend:

- Twice-daily brushing with a soft brush.
- Daily flossing or interdental brushes.
- Professional cleaning every 6 months at our [hygiene clinic](/services/gum-treatment).
- Annual implant health check.

With proper care, implants routinely last 25+ years — many for life.

## The Bottom Line

For most missing-tooth scenarios, dental implants are now the gold standard. Same-day temporary crowns make the experience faster and easier than ever. The only thing standing between you and a complete smile is a 30-minute consultation.

Ready to explore your options? [Book a free implant consultation](/booking) at Smile Savers Dental Clinic — we'll provide a 3D treatment plan, written quote and timeline at your first visit.
""",
        [
            {"q": "Can I get a dental implant in one day?", "a": "Yes — a temporary crown on the same day if your bone quality permits (immediate-load protocol). The permanent crown is placed 3–6 months later."},
            {"q": "How much does a dental implant cost in Ghaziabad?", "a": "At Smile Savers Dental Clinic, total implant + crown bundles range from ₹33,000 (Alpha Bio) to ₹67,000 (Nobel Biocare), depending on brand and complexity."},
            {"q": "How long do dental implants last?", "a": "With proper hygiene and 6-monthly check-ups, 25+ years is typical. Many of our patients have implants now into their 3rd decade."},
            {"q": "Are dental implants painful?", "a": "No. Surgery is performed under local anesthesia; most patients return to work the next day. Mild swelling for 2–3 days is normal."},
            {"q": "Can diabetics get implants?", "a": "Yes — provided HbA1c is well-controlled (<7%). We coordinate with your physician for optimal outcomes."},
            {"q": "What if I don't have enough bone?", "a": "Bone grafting (ridge augmentation or sinus lift) builds up the area, then implants are placed 4–6 months later. We offer all common grafting techniques."},
        ],
        ["dental-implants", "full-mouth-rehabilitation", "crowns-bridges"],
        [
            "International Team for Implantology (ITI). 2024 Consensus Conference Statements.",
            "Nobel Biocare. Clinical Evidence Library. https://www.nobelbiocare.com",
            "Indian Society of Oral Implantologists, Treatment Guidelines 2024.",
        ],
        "2026-04-15", "2026-05-03", "9 min"
    ),
    _b(
        "nabh-accreditation-importance",
        "NABH Accreditation: Why It Matters When Choosing a Dental Clinic in 2026",
        "NABH is India's gold standard for healthcare quality. Here's exactly what it means — and why it should matter to you.",
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80",
        "About Us",
        ["NABH", "patient safety", "dental clinic standards"],
        [
            "NABH-accredited clinics meet India's highest patient-safety standards.",
            "Quarterly external audits cover sterilisation, patient rights and clinical outcomes.",
            "Less than 2% of Indian dental clinics are NABH accredited.",
            "Smile Savers Dental Clinic has held continuous NABH accreditation along with ISO 9001:2015.",
        ],
        """## What Is NABH?

The National Accreditation Board for Hospitals & Healthcare Providers (NABH) is India's apex body for healthcare quality, established under the Quality Council of India. NABH accreditation is recognised internationally and is considered the **gold standard for clinical excellence in India**.

For dental clinics specifically, NABH evaluates over 100 standards across:

- Sterilisation and infection control
- Patient rights and informed consent
- Medication safety
- Clinical record management
- Emergency preparedness
- Staff qualification and continuous training
- Outcome monitoring and audit

## Why NABH Matters For You

Most patients can't tell a sterile clinic from a dirty one — until an infection happens. NABH does the inspecting *for* you, ensuring:

1. **Single-use disposables** — needles, gloves, swabs, masks, suction tips.
2. **Autoclave sterilisation at 121°C for 45 minutes** with sealed UV-stored pouches.
3. **Distilled dental-grade water** in every patient procedure.
4. **Surface disinfection between every patient.**
5. **Biomedical waste disposal** as per WHO guidelines.

In a country where dental hepatitis B and HIV transmissions still occasionally make headlines, NABH compliance is not a luxury — it's protection.

## How Hard Is It To Get NABH Accreditation?

Very. The process involves:

- Self-assessment against NABH standards (~6 months).
- Document submission and gap analysis.
- Pre-assessment visit by NABH assessors.
- Final assessment with surprise inspection.
- Quarterly surveillance audits to maintain status.

Less than **2% of Indian dental clinics** hold this certification. We're proud that [Smile Savers Dental Clinic](/about) has maintained continuous NABH accreditation along with ISO 9001:2015 certification.

## What To Ask Your Dentist

When evaluating any dental clinic, ask:

1. *Are you NABH accredited?* Ask to see the certificate.
2. *Show me your sterilisation protocol.* They should be proud to demonstrate.
3. *What materials do you use?* Brand names matter — see our [services](/services) for what we use.
4. *Are surgeries performed by specialists?* Generalists handling complex cases is a red flag.
5. *Can I see your patient consent forms?* Transparent paperwork = transparent practice.

## Beyond NABH

Accreditation is necessary but not sufficient. Look also for:

- **Specialist team** — endodontist for [root canals](/services/root-canal-treatment), implantologist for [implants](/services/dental-implants), orthodontist for [Invisalign](/services/braces-aligners).
- **Internationally-traceable materials** — Ivoclar, 3M, Nobel Biocare.
- **Strong online reviews** — we maintain a consistently high Google rating.
- **Transparent pricing** — fixed written quotes, not 'rate cards'.

## The Bottom Line

NABH is your shortcut to a safer, higher-quality dental experience. When you're choosing where to entrust your teeth, gums and smile — it matters.

Ready to experience NABH-accredited dentistry? [Book a free consultation](/booking) at Smile Savers Dental Clinic, or [chat with our AI smile assistant](/smile-analysis) to see what's possible.
""",
        [
            {"q": "What is NABH accreditation?", "a": "NABH (National Accreditation Board for Hospitals & Healthcare Providers) is India's gold-standard healthcare quality certification, evaluating clinics on 100+ patient-safety standards."},
            {"q": "How many dental clinics are NABH accredited?", "a": "Less than 2% of Indian dental clinics. It requires rigorous documentation, audits and quarterly surveillance."},
            {"q": "Is Smile Savers Dental Clinic NABH accredited?", "a": "Yes. We maintain continuous NABH accreditation along with ISO 9001:2015 certification."},
            {"q": "Why does NABH matter for dental patients?", "a": "It guarantees sterilisation protocols, patient rights, traceable materials and clinical accountability — protecting you from preventable infections and substandard care."},
            {"q": "Does NABH affect treatment cost?", "a": "Slightly — NABH clinics invest in higher-quality materials and protocols. The cost difference is minimal, but the safety difference is significant."},
        ],
        ["smile-makeover", "dental-implants", "root-canal-treatment"],
        [
            "National Accreditation Board for Hospitals & Healthcare Providers (NABH). Standards for Dental Healthcare Service Providers, 5th Edition.",
            "Quality Council of India. https://www.qcin.org",
            "Indian Dental Association, Position Statement on Patient Safety.",
        ],
        "2026-03-10", "2026-04-28", "6 min"
    ),
]


# ---------- Startup migration ----------
@app.on_event("startup")
async def seed_blog():
    count = await db.blog_posts.count_documents({})
    if count == 0:
        await db.blog_posts.insert_many([dict(p) for p in BLOG_SEED])
        logging.info(f"Seeded {len(BLOG_SEED)} blog posts")


# ---------- Public Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Smile Savers Dental Clinic API", "status": "online"}


@api_router.get("/services")
async def get_services():
    return SERVICES


@api_router.get("/services/{slug}")
async def get_service(slug: str):
    for s in SERVICES:
        if s["slug"] == slug:
            return s
    raise HTTPException(404, "Service not found")


@api_router.get("/doctors")
async def get_doctors():
    return DOCTORS


@api_router.get("/testimonials")
async def get_testimonials():
    return TESTIMONIALS


@api_router.get("/gallery")
async def get_gallery():
    return GALLERY


@api_router.get("/reviews-summary", response_model=ReviewSummary)
async def get_reviews_summary():
    return _fetch_google_review_summary()


@api_router.get("/blog")
async def get_blog():
    posts = await db.blog_posts.find({"is_published": True}, {"_id": 0, "content_md": 0}).sort("date_published", -1).to_list(200)
    return posts


@api_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    p = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Post not found")
    return p


@api_router.post("/bookings", response_model=Booking)
async def create_booking(payload: BookingCreate):
    booking = Booking(**payload.model_dump())
    await db.bookings.insert_one(booking.model_dump())
    return booking


@api_router.post("/contact", response_model=ContactMessage)
async def create_contact(payload: ContactCreate):
    msg = ContactMessage(**payload.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
    return msg


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(payload: ChatRequest):
    if not EMERGENT_LLM_KEY or LlmChat is None:
        return ChatResponse(reply=_local_chat_reply(payload.message))

    system_prompt = (
        "You are 'Smile' — the friendly AI assistant for Smile Saver Dental Clinic in Ghaziabad, "
        "Uttar Pradesh (NABH accredited, with a consistently strong Google rating). "
        f"Phone: {CLINIC_PHONE}. Hours: opens 10 AM. "
        "Help visitors with dental queries, service info, and guide them to book an appointment. "
        "Be warm, concise (2-4 sentences), and always end with a helpful next step."
    )
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=payload.session_id, system_message=system_prompt
                       ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        reply = await chat.send_message(UserMessage(text=payload.message))
        return ChatResponse(reply=str(reply))
    except Exception as e:
        logging.error(f"AI chat error: {e}")
        return ChatResponse(reply=_local_chat_reply(payload.message))


@api_router.post("/smile-analysis", response_model=SmileAnalysisResponse)
async def smile_analysis(payload: SmileAnalysisRequest):
    if not EMERGENT_LLM_KEY or LlmChat is None:
        raise HTTPException(500, "AI key not configured")

    system_prompt = (
        "You are a senior cosmetic dentist at Smile Savers Dental Clinic, Ghaziabad. "
        "Look at the smile photo and produce a warm, professional analysis. "
        "Return ONLY a JSON object with these EXACT keys: "
        "  'analysis' (string, 2-4 sentences), "
        "  'recommendations' (array of 3-5 short bullet strings), "
        "  'suggested_services' (array of 2-4 service titles strictly from: "
        "['Smile Makeover','Dental Implants','Root Canal Treatment','Teeth Whitening','Braces & Invisalign','Pediatric Dentistry','Ceramic Veneers','Gum Treatment','Crowns & Bridges','Wisdom Tooth Extraction','Dentures','Full Mouth Rehabilitation']). "
        "Do NOT diagnose disease. Always end the analysis encouraging an in-person consultation. "
        "Return STRICT JSON only — no markdown, no code fences, no preamble."
    )
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"smile-{uuid.uuid4().hex[:10]}", system_message=system_prompt
                       ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        b64 = payload.image_base64.split(",", 1)[1] if "," in payload.image_base64 else payload.image_base64
        user_msg = UserMessage(
            text=f"Patient name: {payload.name or 'Guest'}. Please analyse this smile photo and respond with strict JSON only.",
            file_contents=[ImageContent(image_base64=b64)],
        )
        reply_text = str(await chat.send_message(user_msg)).strip()
        if reply_text.startswith("```"):
            reply_text = reply_text.strip("`")
            if reply_text.lower().startswith("json"):
                reply_text = reply_text[4:].strip()
        try:
            data = json.loads(reply_text)
        except Exception:
            start = reply_text.find("{"); end = reply_text.rfind("}")
            data = json.loads(reply_text[start:end+1]) if start >= 0 and end > start else {}

        await db.smile_analyses.insert_one({
            "id": str(uuid.uuid4()),
            "name": payload.name or "",
            "analysis": data.get("analysis", ""),
            "recommendations": data.get("recommendations", []),
            "suggested_services": data.get("suggested_services", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return SmileAnalysisResponse(
            analysis=data.get("analysis", "We've reviewed your smile. Book a consultation for a detailed plan."),
            recommendations=data.get("recommendations", []),
            suggested_services=data.get("suggested_services", []),
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Smile analysis error: {e}")
        raise HTTPException(500, "Could not analyse the photo. Please try a clearer front-facing smile photo.")


# ---------- Admin Routes ----------
# Simple in-memory sliding-window rate limiter for /api/admin/login
# 5 attempts per IP per 15 minutes; lock = 15 min after threshold breached.
_LOGIN_WINDOW_SEC = 15 * 60
_LOGIN_MAX_ATTEMPTS = 5
_login_attempts: dict = defaultdict(deque)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@api_router.post("/admin/login")
async def admin_login(payload: dict, request: Request):
    ip = _client_ip(request)
    now = time.time()
    bucket = _login_attempts[ip]
    # drop expired
    while bucket and now - bucket[0] > _LOGIN_WINDOW_SEC:
        bucket.popleft()
    if len(bucket) >= _LOGIN_MAX_ATTEMPTS:
        retry_in = int(_LOGIN_WINDOW_SEC - (now - bucket[0]))
        raise HTTPException(
            429,
            f"Too many login attempts. Try again in {max(retry_in, 1)} seconds.",
        )

    token = payload.get("token", "")
    if token != ADMIN_TOKEN:
        bucket.append(now)
        remaining = _LOGIN_MAX_ATTEMPTS - len(bucket)
        raise HTTPException(401, f"Invalid token. {remaining} attempts remaining.")

    # success → clear the bucket for this IP
    _login_attempts.pop(ip, None)
    return {"ok": True, "token": token}


@api_router.get("/admin/bookings", dependencies=[Depends(require_admin)])
async def admin_list_bookings():
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/admin/contacts", dependencies=[Depends(require_admin)])
async def admin_list_contacts():
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/admin/smile-analyses", dependencies=[Depends(require_admin)])
async def admin_list_smile_analyses():
    return await db.smile_analyses.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.get("/admin/blog", dependencies=[Depends(require_admin)])
async def admin_list_blog():
    return await db.blog_posts.find({}, {"_id": 0}).sort("date_published", -1).to_list(500)


@api_router.post("/admin/blog", dependencies=[Depends(require_admin)])
async def admin_create_blog(payload: BlogPostCreate):
    existing = await db.blog_posts.find_one({"slug": payload.slug})
    if existing:
        raise HTTPException(400, "Slug already exists")
    now = datetime.now(timezone.utc).date().isoformat()
    data = payload.model_dump()
    data["id"] = str(uuid.uuid4())
    data["date_published"] = data.get("date_published") or now
    data["date_updated"] = data.get("date_updated") or now
    data["author_avatar"] = data.get("author_avatar") or "https://customer-assets.emergentagent.com/job_dental-ghaziabad/artifacts/gsy52duo_ChatGPT%20Image%20May%206%2C%202026%2C%2008_22_07%20PM.png"
    await db.blog_posts.insert_one(data)
    return {"ok": True, "slug": data["slug"]}


@api_router.put("/admin/blog/{slug}", dependencies=[Depends(require_admin)])
async def admin_update_blog(slug: str, payload: BlogPostCreate):
    update = payload.model_dump()
    update["date_updated"] = datetime.now(timezone.utc).date().isoformat()
    res = await db.blog_posts.update_one({"slug": slug}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Post not found")
    return {"ok": True}


@api_router.delete("/admin/blog/{slug}", dependencies=[Depends(require_admin)])
async def admin_delete_blog(slug: str):
    res = await db.blog_posts.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(404, "Post not found")
    return {"ok": True}


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
    if postgres_conn is not None:
        postgres_conn.close()
    if local_db_conn is not None:
        local_db_conn.close()
