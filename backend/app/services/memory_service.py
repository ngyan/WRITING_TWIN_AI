"""MemoryService — Communication Memory Engine.

Stores approved/edited rewrites in PostgreSQL + Qdrant `user_memory` collection.
Retrieves similar past phrasings for in-context examples during personalized rewrites.
"""
import difflib
from uuid import UUID, uuid4

import structlog

from app.repositories import memory_repo

log = structlog.get_logger()

COLLECTION_MEMORY = "user_memory"
VECTOR_SIZE = 1536


def _edit_distance_ratio(original: str, edited: str) -> float:
    """0.0 = identical (pure accept), 1.0 = completely different."""
    if not original:
        return 0.0
    matcher = difflib.SequenceMatcher(None, original, edited)
    return 1.0 - matcher.ratio()


async def store_memory(
    user_id: UUID,
    rewrite_id: UUID,
    action: str,
    final_text: str,
    original_output: str,
    tone: str,
    context: str | None,
) -> None:
    """Persist a CommunicationMemory row and embed into Qdrant user_memory (best-effort).

    Opens its own DB session — safe to call from asyncio.create_task.
    """
    if action == "rejected":
        memory_type = "rejected"
        edit_distance = None
    elif action == "edited":
        memory_type = "edited"
        edit_distance = _edit_distance_ratio(original_output, final_text)
    else:
        memory_type = "approved"
        edit_distance = 0.0

    point_id = str(uuid4())
    from app.core.db import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        row = await memory_repo.create(
            db,
            user_id=user_id,
            rewrite_id=rewrite_id,
            memory_type=memory_type,
            final_text=final_text,
            original_output=original_output,
            tone=tone,
            context=context,
            edit_distance=edit_distance,
            qdrant_point_id=point_id,
        )

    # Embed + store in Qdrant (best-effort — never fail the request)
    try:
        await _embed_and_store(user_id, row.id, point_id, final_text, tone, context, edit_distance)
    except Exception as exc:
        log.warning("memory.embed_failed", user_id=str(user_id), error=str(exc))


async def retrieve_examples(user_id: UUID, text: str, tone: str, limit: int = 3) -> list[str]:
    """Fetch past approved/edited phrasings similar to the current input from Qdrant."""
    from app.core.config import settings

    if not settings.OPENAI_API_KEY:
        return []
    try:
        from app.repositories.qdrant_repo import embed_texts

        vectors = await embed_texts([text])
        if not vectors:
            return []
        return await _search_memory(user_id, vectors[0], tone, limit)
    except Exception as exc:
        log.warning("memory.retrieve_failed", user_id=str(user_id), error=str(exc))
        return []


async def _search_memory(
    user_id: UUID, query_vector: list[float], tone: str, limit: int
) -> list[str]:
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import FieldCondition, Filter, MatchAny, MatchValue

    from app.core.config import settings

    qc = AsyncQdrantClient(url=settings.QDRANT_URL)
    results = await qc.search(  # type: ignore[attr-defined]
        collection_name=COLLECTION_MEMORY,
        query_vector=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(key="user_id", match=MatchValue(value=str(user_id))),
                FieldCondition(key="tone", match=MatchValue(value=tone)),
                FieldCondition(
                    key="memory_type", match=MatchAny(any=["approved", "edited"])
                ),
            ]
        ),
        limit=limit,
        score_threshold=0.80,
    )
    await qc.close()
    return [r.payload.get("final_text", "") for r in results if r.payload]


async def _embed_and_store(
    user_id: UUID,
    memory_id: UUID,
    point_id: str,
    final_text: str,
    tone: str,
    context: str | None,
    edit_distance: float | None,
) -> None:
    from app.core.config import settings

    if not settings.OPENAI_API_KEY:
        return
    from qdrant_client import AsyncQdrantClient
    from qdrant_client.models import Distance, PointStruct, VectorParams

    from app.repositories.qdrant_repo import embed_texts

    vectors = await embed_texts([final_text])
    if not vectors:
        return

    qc = AsyncQdrantClient(url=settings.QDRANT_URL)
    existing = await qc.get_collections()
    names = {c.name for c in existing.collections}
    if COLLECTION_MEMORY not in names:
        await qc.create_collection(
            collection_name=COLLECTION_MEMORY,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )

    await qc.upsert(
        collection_name=COLLECTION_MEMORY,
        points=[
            PointStruct(
                id=point_id,
                vector=vectors[0],
                payload={
                    "user_id": str(user_id),
                    "memory_id": str(memory_id),
                    "final_text": final_text[:500],
                    "tone": tone,
                    "context": context,
                    "edit_distance": edit_distance,
                },
            )
        ],
    )
    await qc.close()
