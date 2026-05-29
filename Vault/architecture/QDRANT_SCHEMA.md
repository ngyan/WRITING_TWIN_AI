# Qdrant Vector Database Schema

> Schema definitions for the two Writing Twin AI Qdrant collections.
> See `core/03-ARCHITECTURE.md` for the full architecture context.
> **Last Updated:** 2026-05-30

---

## Overview

| Collection | Purpose | Vectors | Sprint |
|---|---|---|---|
| `user_dna` | Writing DNA embeddings — user writing style samples | 1536-d (text-embedding-3-small) | Sprint 4 |
| `user_memory` | Communication Memory — approved outputs + edits | 1536-d (text-embedding-3-small) | Sprint 5 |

---

## Collection: `user_dna`

**Purpose:** Store embeddings of the user's writing samples. Used during DNA-aware rewrites to retrieve closest past phrasings and style examples.

### Vector Config
```python
from qdrant_client.models import VectorParams, Distance

user_dna_config = VectorParams(
    size=1536,              # text-embedding-3-small dimensions
    distance=Distance.COSINE
)
```

### Payload Schema
```json
{
    "user_id": "uuid-string",
    "sample_id": "uuid-string",
    "sample_text": "The original writing sample (truncated to 500 chars for payload)",
    "word_count": 312,
    "tone": "professional",
    "context": "email",
    "dna_traits": {
        "warmth": 0.7,
        "directness": 0.8,
        "formality": 0.6,
        "vocabulary_complexity": 0.5
    },
    "created_at": "2026-05-30T00:00:00Z"
}
```

### Indexing Strategy
```python
# Filter by user_id (mandatory on all searches)
# Index user_id for fast filtered search
await qdrant_client.create_payload_index(
    collection_name="user_dna",
    field_name="user_id",
    field_schema="keyword"
)

# Index tone for tone-filtered retrieval
await qdrant_client.create_payload_index(
    collection_name="user_dna",
    field_name="tone",
    field_schema="keyword"
)
```

### Query Pattern (Retrieval)
```python
# During DNA-aware rewrite: retrieve 5 most similar past samples
results = await qdrant_client.search(
    collection_name="user_dna",
    query_vector=embed(input_text),
    query_filter=Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=str(user_id))),
            FieldCondition(key="tone", match=MatchValue(value=requested_tone))
        ]
    ),
    limit=5,
    with_payload=True
)
```

### Upsert Pattern
```python
await qdrant_client.upsert(
    collection_name="user_dna",
    points=[
        PointStruct(
            id=str(sample_id),
            vector=embedding,
            payload={
                "user_id": str(user_id),
                "sample_id": str(sample_id),
                # ... rest of payload
            }
        )
    ]
)
```

---

## Collection: `user_memory`

**Purpose:** Store embeddings of approved rewrites, user edits, and accepted/rejected outputs. The Communication Memory Engine queries this to inject the user's best past phrasings into new rewrites.

### Vector Config
```python
user_memory_config = VectorParams(
    size=1536,
    distance=Distance.COSINE
)
```

### Payload Schema
```json
{
    "user_id": "uuid-string",
    "memory_id": "uuid-string",
    "rewrite_id": "uuid-string",
    "memory_type": "approved",
    "final_text": "The text the user actually kept and used",
    "tone": "professional",
    "context": "email",
    "edit_distance": 0.08,
    "created_at": "2026-05-30T00:00:00Z"
}
```

**`memory_type` values:**
| Value | Meaning |
|---|---|
| `approved` | User accepted rewrite with no edits (strong positive signal) |
| `edited` | User edited rewrite before using (moderate positive signal, `final_text` = edited version) |
| `accepted_edited` | User made minor edits (< 10% edit distance) |
| `rejected` | User dismissed rewrite entirely (negative signal — do NOT embed these) |
| `preference` | Manually added preference from user settings |

> **Note:** Only embed `approved`, `edited`, and `preference` types. Do NOT embed `rejected` — embedding negatives in cosine space creates noise.

### Indexing Strategy
```python
# Filter by user_id always
await qdrant_client.create_payload_index(
    collection_name="user_memory",
    field_name="user_id",
    field_schema="keyword"
)

# Filter by memory_type (exclude rejected in queries)
await qdrant_client.create_payload_index(
    collection_name="user_memory",
    field_name="memory_type",
    field_schema="keyword"
)

# Filter by tone
await qdrant_client.create_payload_index(
    collection_name="user_memory",
    field_name="tone",
    field_schema="keyword"
)
```

### Query Pattern (Memory-Aware Rewrite)
```python
# Retrieve 3 closest approved phrasings for in-context injection
memory_examples = await qdrant_client.search(
    collection_name="user_memory",
    query_vector=embed(input_text),
    query_filter=Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=str(user_id))),
        ],
        must_not=[
            FieldCondition(key="memory_type", match=MatchValue(value="rejected"))
        ]
    ),
    limit=3,
    with_payload=True,
    score_threshold=0.75   # Only high-similarity memories
)
```

---

## Qdrant Client Setup

```python
# app/core/qdrant.py
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams
from app.core.config import settings

qdrant_client: AsyncQdrantClient | None = None

async def get_qdrant_client() -> AsyncQdrantClient:
    global qdrant_client
    if qdrant_client is None:
        qdrant_client = AsyncQdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            prefer_grpc=True,   # gRPC is faster than REST for high-frequency ops
        )
    return qdrant_client

async def ensure_collections_exist(client: AsyncQdrantClient) -> None:
    existing = {c.name for c in await client.get_collections().collections}
    
    if "user_dna" not in existing:
        await client.create_collection(
            collection_name="user_dna",
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )
    
    if "user_memory" not in existing:
        await client.create_collection(
            collection_name="user_memory",
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )
```

Call `ensure_collections_exist()` during app lifespan startup (`app/main.py`).

---

## Environment Variables

```env
QDRANT_HOST=qdrant          # Docker service name
QDRANT_PORT=6333            # REST port (use 6334 for gRPC via prefer_grpc=True)
QDRANT_API_KEY=             # Leave empty for local Docker deployment
```

---

## Data Retention & Privacy

- **User delete request:** Call `qdrant_client.delete(collection_name, filter={"user_id": user_id})` on both collections.
- **Memory cap:** Maximum 1,000 points per user per collection (enforced by `MemoryService`). Evict oldest on overflow.
- **DNA cap:** Maximum 50 samples per user (enforced by `DNAService`). Warn user when approaching limit.
- **No plaintext user content** stored in Qdrant beyond the `final_text` field in `user_memory`. The `sample_text` in `user_dna` is truncated to 500 characters for payload display — full sample text is in PostgreSQL.
