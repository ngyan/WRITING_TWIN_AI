"""CacheService — exact (Redis) + semantic (Qdrant) cache."""
import hashlib
import json
from uuid import UUID

import redis.asyncio as aioredis
import structlog

from app.core.config import settings

log = structlog.get_logger()

_EXACT_TTL = 86_400  # 24h


def compute_input_hash(tone: str, text: str) -> str:
    normalized = text.strip().lower()
    return hashlib.sha256(f"{tone}:{normalized}".encode()).hexdigest()


def _redis() -> aioredis.Redis:
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


def _exact_key(input_hash: str) -> str:
    return f"cache:humanize:{input_hash}"


async def lookup_exact(input_hash: str) -> dict | None:
    try:
        r = _redis()
        raw = await r.get(_exact_key(input_hash))
        await r.aclose()
        if raw:
            return json.loads(raw)
    except Exception as exc:
        log.warning("cache.exact.miss", error=str(exc))
    return None


async def store_exact(input_hash: str, payload: dict) -> None:
    try:
        r = _redis()
        await r.set(_exact_key(input_hash), json.dumps(payload), ex=_EXACT_TTL)
        await r.aclose()
    except Exception as exc:
        log.warning("cache.exact.store_failed", error=str(exc))


async def lookup_semantic(text: str, tone: str) -> dict | None:
    """Semantic cache via Qdrant cosine similarity.

    Gracefully skips when OPENAI_API_KEY is unset — returns None (cache miss).
    Full implementation requires text-embedding-3-small embeddings.
    """
    if not settings.OPENAI_API_KEY:
        return None

    try:
        from openai import AsyncOpenAI
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        oai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        embed_resp = await oai.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        vector = embed_resp.data[0].embedding

        qc = AsyncQdrantClient(url=settings.QDRANT_URL)
        results = await qc.search(  # type: ignore[attr-defined]
            collection_name="semantic_cache",
            query_vector=vector,
            query_filter=Filter(
                must=[FieldCondition(key="tone", match=MatchValue(value=tone))]
            ),
            limit=1,
            score_threshold=0.93,
        )
        await qc.close()

        if results:
            return results[0].payload
    except Exception as exc:
        log.warning("cache.semantic.miss", error=str(exc))

    return None


async def store_semantic(text: str, tone: str, rewrite_id: UUID, output_text: str) -> None:
    """Store output in semantic cache. Silently fails if OpenAI key missing."""
    if not settings.OPENAI_API_KEY:
        return

    try:
        from openai import AsyncOpenAI
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import PointStruct

        oai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        embed_resp = await oai.embeddings.create(
            model="text-embedding-3-small", input=text
        )
        vector = embed_resp.data[0].embedding

        qc = AsyncQdrantClient(url=settings.QDRANT_URL)
        await qc.upsert(
            collection_name="semantic_cache",
            points=[
                PointStruct(
                    id=str(rewrite_id),
                    vector=vector,
                    payload={
                        "tone": tone,
                        "output_text": output_text,
                        "rewrite_id": str(rewrite_id),
                    },
                )
            ],
        )
        await qc.close()
    except Exception as exc:
        log.warning("cache.semantic.store_failed", error=str(exc))
