"""Background task — extract Writing DNA from a batch of samples."""
import json
import re
from uuid import UUID

import structlog

from app.core.db import AsyncSessionLocal
from app.prompts.dna import extract_v1
from app.repositories import dna_repo, qdrant_repo
from app.services import router_service

log = structlog.get_logger()


async def run_extraction(user_id: UUID, samples: list[dict]) -> None:
    """
    Full DNA extraction pipeline:
      1. Embed samples + store in Qdrant (skipped if no OPENAI_API_KEY)
      2. Call LLM with dna.extract.v1 prompt
      3. Parse JSON response → update WritingProfile
    """
    async with AsyncSessionLocal() as db:
        try:
            await _embed_and_store(user_id, samples)
            await _extract_and_persist(db, user_id, samples)
        except Exception as exc:
            log.error("dna.extraction_failed", user_id=str(user_id), error=str(exc))
            await dna_repo.mark_failed(db, user_id, str(exc))


async def _embed_and_store(user_id: UUID, samples: list[dict]) -> None:
    await qdrant_repo.ensure_dna_collection()
    texts = [s.get("body", "") for s in samples]
    vectors = await qdrant_repo.embed_texts(texts)
    if vectors:
        await qdrant_repo.upsert_sample_vectors(user_id, samples, vectors)


async def _extract_and_persist(db, user_id: UUID, samples: list[dict]) -> None:
    samples_block = extract_v1.build_samples_block(samples)
    messages = extract_v1.build_messages(samples_block)

    # Use Claude Haiku for reliable JSON output — fallback to Gemini
    mc = router_service.MODELS.get("claude-haiku") or router_service.MODELS["gemini-flash"]
    raw, _, _ = await router_service.complete(mc, messages, max_tokens=1024)

    data = _parse_dna_json(raw)
    if not data:
        raise ValueError("LLM returned unparseable DNA JSON")

    profile = await dna_repo.get_by_user_id(db, user_id)
    if profile:
        await dna_repo.update_scores(db, profile, data)
        log.info("dna.extracted", user_id=str(user_id), status="complete")


def _parse_dna_json(raw: str) -> dict | None:
    """Parse LLM output — strips markdown fences if present."""
    text = raw.strip()
    # Remove ```json ... ``` wrapper
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object within the response
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None
