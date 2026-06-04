"""
app/rag.py
──────────
Retrieval-Augmented Generation core.
Shared by the FastAPI backend and the Streamlit app.

Caching strategy:
- Production (Render): Redis via REDIS_URL env var
- Local development: shelve file at ./data/response_cache

FIXES applied:
1. chat_with_textbook now caches Q&A pairs (keyed by query text, case-normalized)
2. Redis URL sanitized — trailing whitespace/CR stripped
3. from_cache flag surfaced in API response so frontend can show cache badge
4. Cache key normalizes query (lowercase, strip) so "Same Question" == "same question"
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
# Strip whitespace/CR from REDIS_URL — common source of connection failures
REDIS_URL          = os.getenv("REDIS_URL", "").strip()
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

def _get_redis():
    """Lazy-load Redis client only if REDIS_URL is configured."""
    global _redis_client
    if _redis_client is None and REDIS_URL:
        try:
            import redis
            _redis_client = redis.from_url(REDIS_URL, decode_responses=True,
                                           socket_connect_timeout=3,
                                           socket_timeout=3)
            _redis_client.ping()
            log.info("✅ Redis cache connected to %s", REDIS_URL[:30])
        except Exception as e:
            log.warning("Redis unavailable, falling back to local shelve cache: %s", e)
            _redis_client = None
    return _redis_client


def cache_key(feature: str, **kwargs) -> str:
    """
    Deterministic MD5 key from feature name + parameters.
    Strings are normalized (lowercased, stripped) so the same question asked
    with different casing/spacing still hits the cache.
    """
    normalized = {
        k: v.lower().strip() if isinstance(v, str) else v
        for k, v in kwargs.items()
    }
    payload = json.dumps({"feature": feature, **normalized}, sort_keys=True)
    return "prime:" + hashlib.md5(payload.encode()).hexdigest()


def cache_get(key: str) -> Optional[dict]:
    """Try Redis first, fall back to shelve."""
    r = _get_redis()

    if r:
        try:
            raw = r.get(key)
            if raw:
                log.info("🔵 Redis cache HIT: %s", key)
                return json.loads(raw)
            log.info("⚪ Redis cache MISS: %s", key)
        except Exception as e:
            log.warning("Redis get failed: %s", e)
    else:
        try:
            os.makedirs("./data", exist_ok=True)
            with shelve.open(LOCAL_CACHE_PATH) as db:
                value = db.get(key)
                if value:
                    log.info("🟡 Local shelve cache HIT: %s", key[:16])
                    return value
                log.info("⚪ Local shelve cache MISS: %s", key[:16])
        except Exception as e:
            log.warning("Local cache get failed: %s", e)

    return None


def cache_set(key: str, value: dict):
    """Save to Redis (with TTL) or local shelve."""
    r = _get_redis()

    if r:
        try:
            serialized = json.dumps(value)
            if CACHE_TTL == 0:
                r.set(key, serialized)
            else:
                r.setex(key, CACHE_TTL, serialized)
            log.info("🔵 Saved to Redis (TTL=%ss): %s", CACHE_TTL, key)
        except Exception as e:
            log.warning("Redis set failed: %s", e)
    else:
        try:
            os.makedirs("./data", exist_ok=True)
            with shelve.open(LOCAL_CACHE_PATH) as db:
                db[key] = value
            log.info("🟡 Saved to local shelve: %s", key[:16])
        except Exception as e:
            log.warning("Local cache set failed: %s", e)


def cache_clear(feature: Optional[str] = None):
    r = _get_redis()
    if r:
        try:
            keys = r.keys("prime:*")
            if keys:
                r.delete(*keys)
            log.info("🔵 Redis cache cleared (%d keys)", len(keys))
        except Exception as e:
            log.warning("Redis clear failed: %s", e)
    else:
        try:
            import glob
            for f in glob.glob(f"{LOCAL_CACHE_PATH}*"):
                os.remove(f)
            log.info("🟡 Local shelve cache cleared")
        except Exception as e:
            log.warning("Local cache clear failed: %s", e)


def cache_stats() -> dict:
    """Return cache statistics — used by /cache/stats endpoint."""
    r = _get_redis()
    if r:
        try:
            keys  = r.keys("prime:*")
            info  = r.info("memory")
            return {
                "backend":       "redis",
                "total_keys":    len(keys),
                "used_memory":   info.get("used_memory_human", "?"),
                "redis_url":     REDIS_URL[:30] + "..." if len(REDIS_URL) > 30 else REDIS_URL,
                "ttl_seconds":   CACHE_TTL,
            }
        except Exception as e:
            return {"backend": "redis", "error": str(e)}
    else:
        try:
            import glob
            files = glob.glob(f"{LOCAL_CACHE_PATH}*")
            return {"backend": "local_shelve", "files": len(files)}
        except Exception:
            return {"backend": "local_shelve"}


# ── Retrieval ─────────────────────────────────────────────────────────────────

def embed_query(query: str) -> list[float]:
    resp = get_openai_client().embeddings.create(
        model=EMBEDDING_MODEL, input=[query]
    )
    return resp.data[0].embedding


def retrieve(query: str, n_results: int = 6, topic_filter: Optional[str] = None) -> list[dict]:
    collection = get_collection()
    doc_count  = collection.count()

    if doc_count == 0:
        log.warning("⚠️  ChromaDB collection is EMPTY — no documents indexed yet!")
        return []

    where   = {"topic": topic_filter} if topic_filter else None
    q_embed = embed_query(query)
    kwargs  = dict(
        query_embeddings=[q_embed],
        n_results=min(n_results, doc_count),
        include=["documents", "metadatas", "distances"],
    )
    if where:
        kwargs["where"] = where
    results = collection.query(**kwargs)

    chunks = [
        {"text": doc, "metadata": meta, "distance": dist}
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ]

    # Log distances so you can see if RAG is actually finding relevant content
    for c in chunks:
        log.info("  📄 Page %s | Topic: %s | Distance: %.3f",
                 c["metadata"].get("page", "?"),
                 c["metadata"].get("topic", "?"),
                 c["distance"])

    return chunks


def build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "(No textbook content found — answering from general knowledge)"
    parts = []
    for i, c in enumerate(chunks, 1):
        meta  = c["metadata"]
        label = f"[Chunk {i} | Page {meta.get('page','?')} | Topic: {meta.get('topic','?')} | Type: {meta.get('type','text')}]"
        parts.append(f"{label}\n{c['text']}")
    return "\n\n---\n\n".join(parts)


# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_BASE = """You are Prime AI, an expert Grade 11 Mathematics tutor for Ethiopian students.
You have access to the official Grade 11 Math textbook content.
Always be clear, step-by-step, and encouraging. Use LaTeX notation for equations (wrap in $ or $$).
Cite page numbers when referencing textbook content.
If the provided textbook content does not cover the question, say so clearly and answer from general Grade 11 Math knowledge."""


# ── Feature functions — ALL cached (including chat) ──────────────────────────

def generate_lesson_notes(topic: str, subtopic: str = "") -> dict:
    key    = cache_key("lesson_notes", topic=topic, subtopic=subtopic)
    cached = cache_get(key)
    if cached:
        return {**cached, "from_cache": True}

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
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page"), "topic": c["metadata"].get("topic")} for c in chunks],
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

Format EACH question EXACTLY as shown below (one option per line):
Q[N]: [Question text with LaTeX equations where needed]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
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
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page")} for c in chunks],
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
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page")} for c in chunks],
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
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result


def chat_with_textbook(query: str, history: list[dict] = None) -> dict:
    """
    Chat Q&A — NOW CACHED.
    Cache key = query only (history ignored for cache lookup).
    This means the same question always returns the cached answer instantly,
    regardless of conversation history, saving OpenAI API costs.
    New or follow-up questions (different text) go through the API normally.
    """
    key    = cache_key("chat", query=query)
    cached = cache_get(key)
    if cached:
        log.info("💬 Chat cache HIT for query: %s...", query[:50])
        return {**cached, "from_cache": True}

    log.info("💬 Chat cache MISS — calling OpenAI for: %s...", query[:50])
    chunks   = retrieve(query, n_results=6)
    context  = build_context(chunks)
    messages = [{"role": "system", "content": SYSTEM_BASE}]

    if history:
        for h in history[-6:]:  # only last 6 turns to keep context window small
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
    result = {
        "content":    resp.choices[0].message.content,
        "sources":    [{"page": c["metadata"].get("page"), "topic": c["metadata"].get("topic")} for c in chunks],
        "from_cache": False,
    }
    cache_set(key, result)
    return result
