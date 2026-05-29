"""
app/rag.py
──────────
Retrieval-Augmented Generation core.
Shared by the FastAPI backend and the Streamlit app.

Caching strategy:
- Production (Render): Redis via REDIS_URL env var
- Local development: shelve file at ./data/response_cache
"""

import os
import json
import hashlib
import logging
import shelve
from typing import Optional

import chromadb
from chromadb.config import Settings
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)

OPENAI_API_KEY     = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL       = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL    = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-large")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
CHROMA_COLLECTION  = os.getenv("CHROMA_COLLECTION_NAME", "grade11_math")
REDIS_URL          = os.getenv("REDIS_URL", "")           # set on Render, empty locally
CACHE_TTL          = int(os.getenv("CACHE_TTL_SECONDS", 86400 * 7))  # 7 days default
LOCAL_CACHE_PATH   = "./data/response_cache"

_openai_client = None
_collection    = None
_redis_client  = None


# ── OpenAI & ChromaDB singletons ─────────────────────────────────────────────

def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


def get_collection():
    global _collection
    if _collection is None:
        chroma = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        _collection = chroma.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


# ── Cache layer ───────────────────────────────────────────────────────────────
# Two backends — Redis (production) or shelve file (local).
# The rest of the code never needs to know which one is active.

def _get_redis():
    """Lazy-load Redis client only if REDIS_URL is configured."""
    global _redis_client
    if _redis_client is None and REDIS_URL:
        try:
            import redis
            _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()   # confirm connection works
            log.info("✅ Redis cache connected")
        except Exception as e:
            log.warning(f"Redis unavailable, falling back to local cache: {e}")
            _redis_client = None
    return _redis_client


def cache_key(feature: str, **kwargs) -> str:
    """Deterministic MD5 key from feature name + parameters."""
    payload = json.dumps({"feature": feature, **kwargs}, sort_keys=True)
    return hashlib.md5(payload.encode()).hexdigest()


def cache_get(key: str) -> Optional[dict]:
    """Try Redis first, fall back to shelve."""
    r = _get_redis()

    if r:
        # ── Redis path ──
        try:
            raw = r.get(key)
            if raw:
                log.info(f"🔵 Redis cache hit: {key[:12]}...")
                return json.loads(raw)
        except Exception as e:
            log.warning(f"Redis get failed: {e}")

    else:
        # ── Local shelve path ──
        try:
            os.makedirs("./data", exist_ok=True)
            with shelve.open(LOCAL_CACHE_PATH) as db:
                value = db.get(key)
                if value:
                    log.info(f"🟡 Local cache hit: {key[:12]}...")
                    return value
        except Exception as e:
            log.warning(f"Local cache get failed: {e}")

    return None


def cache_set(key: str, value: dict):
    """Save to Redis (with TTL) or local shelve."""
    r = _get_redis()

    if r:
        # ── Redis path — expires after CACHE_TTL seconds ──
        try:
            if CACHE_TTL == 0:
                r.set(key, json.dumps(value))   # no expiry
            else:
                r.setex(key, CACHE_TTL, json.dumps(value))
            log.info(f"🔵 Saved to Redis cache (TTL {CACHE_TTL}s): {key[:12]}...")
        except Exception as e:
            log.warning(f"Redis set failed: {e}")

    else:
        # ── Local shelve path — no expiry, persists until deleted ──
        try:
            os.makedirs("./data", exist_ok=True)
            with shelve.open(LOCAL_CACHE_PATH) as db:
                db[key] = value
            log.info(f"🟡 Saved to local cache: {key[:12]}...")
        except Exception as e:
            log.warning(f"Local cache set failed: {e}")


def cache_clear(feature: Optional[str] = None):
    """
    Clear cache entries.
    feature=None clears everything.
    feature='lesson_notes' clears only lesson note entries (Redis only).
    """
    r = _get_redis()
    if r:
        try:
            keys = r.keys("*")
            r.delete(*keys) if keys else None
            log.info(f"🔵 Redis cache cleared ({len(keys)} keys)")
        except Exception as e:
            log.warning(f"Redis clear failed: {e}")
    else:
        try:
            import glob
            for f in glob.glob(f"{LOCAL_CACHE_PATH}*"):
                os.remove(f)
            log.info("🟡 Local cache cleared")
        except Exception as e:
            log.warning(f"Local cache clear failed: {e}")


# ── Retrieval ─────────────────────────────────────────────────────────────────

def embed_query(query: str) -> list[float]:
    resp = get_openai_client().embeddings.create(
        model=EMBEDDING_MODEL, input=[query]
    )
    return resp.data[0].embedding


def retrieve(query: str, n_results: int = 6, topic_filter: Optional[str] = None) -> list[dict]:
    collection = get_collection()
    where      = {"topic": topic_filter} if topic_filter else None
    q_embed    = embed_query(query)
    kwargs     = dict(
        query_embeddings=[q_embed],
        n_results=min(n_results, collection.count() or 1),
        include=["documents", "metadatas", "distances"],
    )
    if where:
        kwargs["where"] = where
    results = collection.query(**kwargs)
    return [
        {"text": doc, "metadata": meta, "distance": dist}
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ]


def build_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        meta  = c["metadata"]
        label = f"[Chunk {i} | Page {meta.get('page','?')} | Topic: {meta.get('topic','?')} | Type: {meta.get('type','text')}]"
        parts.append(f"{label}\n{c['text']}")
    return "\n\n---\n\n".join(parts)


# ── Shared system prompt ──────────────────────────────────────────────────────

SYSTEM_BASE = """You are Prime AI, an expert Grade 11 Mathematics tutor for Ethiopian students.
You have access to the official Grade 11 Math textbook content.
Always be clear, step-by-step, and encouraging. Use LaTeX notation for equations (wrap in $ or $$).
Cite page numbers when referencing textbook content."""


# ── Feature functions — all cached except chat ───────────────────────────────

def generate_lesson_notes(topic: str, subtopic: str = "") -> dict:
    # ── Cache check ──
    key    = cache_key("lesson_notes", topic=topic, subtopic=subtopic)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    # ── Generate ──
    chunks  = retrieve(f"{topic} {subtopic} definition formula examples", n_results=8)
    context = build_context(chunks)
    prompt  = f"""Using the textbook content below, generate comprehensive LESSON NOTES for:
Topic: {topic}
Subtopic: {subtopic or 'General Overview'}

Structure your notes as:
1. **Learning Objectives** (3-5 bullet points)
2. **Key Concepts & Definitions** (with LaTeX formulas)
3. **Worked Examples** (at least 3, step-by-step)
4. **Important Rules / Theorems**
5. **Common Mistakes to Avoid**
6. **Summary**

TEXTBOOK CONTENT:
{context}"""

    resp   = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.3,
    )
    result = {
        "content": resp.choices[0].message.content,
        "sources": [{"page": c["metadata"].get("page"), "topic": c["metadata"].get("topic")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def generate_quiz(topic: str, difficulty: str = "medium", num_questions: int = 5) -> dict:
    key    = cache_key("quiz", topic=topic, difficulty=difficulty, num_questions=num_questions)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    chunks  = retrieve(f"{topic} problems exercises questions", n_results=8)
    context = build_context(chunks)
    prompt  = f"""Using the textbook content below, create a {difficulty.upper()} difficulty quiz on: {topic}
Generate exactly {num_questions} questions.

Format each question as:
Q[N]: [Question text with LaTeX equations where needed]
A) [Option]  B) [Option]  C) [Option]  D) [Option]
✓ Correct: [Letter] — [Brief explanation]

TEXTBOOK CONTENT:
{context}"""

    resp   = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.5,
    )
    result = {
        "content": resp.choices[0].message.content,
        "sources": [{"page": c["metadata"].get("page")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def generate_lesson_plan(topic: str, duration_minutes: int = 80) -> dict:
    key    = cache_key("lesson_plan", topic=topic, duration_minutes=duration_minutes)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    chunks  = retrieve(f"{topic} lesson objectives activities", n_results=6)
    context = build_context(chunks)
    prompt  = f"""Create a detailed LESSON PLAN for a Grade 11 Math teacher on:
Topic: {topic} | Duration: {duration_minutes} minutes

Structure:
1. **Lesson Information** (grade, subject, topic, duration)
2. **Learning Objectives** (Bloom's Taxonomy verbs)
3. **Materials & Resources**
4. **Lesson Outline** (time-boxed sections)
5. **Assessment Strategies**
6. **Differentiation** (struggling and advanced students)
7. **Homework Assignment**

TEXTBOOK CONTENT:
{context}"""

    resp   = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.3,
    )
    result = {
        "content": resp.choices[0].message.content,
        "sources": [{"page": c["metadata"].get("page")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def generate_real_life_examples(topic: str, context_country: str = "Ethiopia") -> dict:
    key    = cache_key("real_life", topic=topic, context_country=context_country)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

    chunks  = retrieve(f"{topic} application real world", n_results=5)
    context = build_context(chunks)
    prompt  = f"""Generate 5 compelling REAL-LIFE EXAMPLES of how "{topic}" from Grade 11 Mathematics
is used in the real world, with special relevance to {context_country} and East Africa.

For each example:
- **Example [N]: [Catchy Title]**
- 🌍 **Context**: Where/how it appears in real life
- 📐 **The Math**: The actual mathematical connection (with equations)
- 💡 **Why It Matters**: Practical significance
- 🔢 **Mini Problem**: A simple real-world problem to solve

TEXTBOOK CONTENT:
{context}"""

    resp   = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_BASE},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.7,
    )
    result = {
        "content": resp.choices[0].message.content,
        "sources": [{"page": c["metadata"].get("page")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def chat_with_textbook(query: str, history: list[dict] = None) -> dict:
    """Chat is NOT cached — every conversation is unique."""
    chunks   = retrieve(query, n_results=6)
    context  = build_context(chunks)
    messages = [{"role": "system", "content": SYSTEM_BASE}]
    if history:
        for h in history[-6:]:
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({
        "role": "user",
        "content": f"""Answer this Grade 11 Math question using the textbook content:

QUESTION: {query}

RELEVANT TEXTBOOK CONTENT:
{context}

Provide a clear, step-by-step answer. Show all working. Use LaTeX for equations."""
    })
    resp = get_openai_client().chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        max_tokens=1500,
        temperature=0.2,
    )
    return {
        "content": resp.choices[0].message.content,
        "sources": [{"page": c["metadata"].get("page"), "topic": c["metadata"].get("topic")} for c in chunks],
        "from_cache": False,
    }
