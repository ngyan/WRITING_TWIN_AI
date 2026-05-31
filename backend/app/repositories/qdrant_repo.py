"""Qdrant repository — vector storage for writing samples and semantic cache."""
from uuid import UUID

import structlog

from app.core.config import settings

log = structlog.get_logger()

COLLECTION_DNA = "user_writing_samples"
VECTOR_SIZE = 1536  # text-embedding-3-small


async def ensure_dna_collection() -> None:
    """Create user_writing_samples collection if it doesn't exist."""
    if not settings.OPENAI_API_KEY:
        return
    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import Distance, VectorParams

        qc = AsyncQdrantClient(url=settings.QDRANT_URL)
        existing = await qc.get_collections()  # type: ignore[attr-defined]
        names = {c.name for c in existing.collections}
        if COLLECTION_DNA not in names:
            await qc.create_collection(  # type: ignore[attr-defined]
                collection_name=COLLECTION_DNA,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
            log.info("qdrant.collection_created", name=COLLECTION_DNA)
        await qc.close()
    except Exception as exc:
        log.warning("qdrant.ensure_collection_failed", error=str(exc))


async def upsert_sample_vectors(
    user_id: UUID, samples: list[dict], vectors: list[list[float]]
) -> None:
    """Store writing sample embeddings in Qdrant."""
    if not settings.OPENAI_API_KEY:
        return
    try:
        from uuid import uuid4

        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import PointStruct

        qc = AsyncQdrantClient(url=settings.QDRANT_URL)
        points = [
            PointStruct(
                id=str(uuid4()),
                vector=vector,
                payload={
                    "user_id": str(user_id),
                    "source": s.get("source", "email"),
                    "text": s.get("body", "")[:500],  # truncate for payload size
                    "sent_at": s.get("sent_at"),
                },
            )
            for s, vector in zip(samples, vectors)
        ]
        await qc.upsert(collection_name=COLLECTION_DNA, points=points)  # type: ignore[attr-defined]
        await qc.close()
        log.info("qdrant.samples_upserted", user_id=str(user_id), count=len(points))
    except Exception as exc:
        log.warning("qdrant.upsert_failed", error=str(exc))


async def delete_user_vectors(user_id: UUID) -> None:
    """Delete all vectors belonging to a user (GDPR)."""
    if not settings.OPENAI_API_KEY:
        return
    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        qc = AsyncQdrantClient(url=settings.QDRANT_URL)
        await qc.delete(  # type: ignore[attr-defined]
            collection_name=COLLECTION_DNA,
            points_selector=Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))]
            ),
        )
        await qc.close()
    except Exception as exc:
        log.warning("qdrant.delete_failed", error=str(exc))


async def embed_texts(texts: list[str]) -> list[list[float]] | None:
    """Embed texts using text-embedding-3-small. Returns None if no API key."""
    if not settings.OPENAI_API_KEY:
        return None
    try:
        from openai import AsyncOpenAI

        oai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        resp = await oai.embeddings.create(model="text-embedding-3-small", input=texts)
        return [item.embedding for item in resp.data]
    except Exception as exc:
        log.warning("qdrant.embed_failed", error=str(exc))
        return None
