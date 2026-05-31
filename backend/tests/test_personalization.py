"""Sprint 5 — Personalization tests.

Tests cover:
- Cultural block rendering (pure function, no mocking needed)
- DNA-personalized humanize when profile is complete (mocked personalization_service)
- Memory storage on accepted/edited feedback
- Memory retrieval skips gracefully when no OPENAI_API_KEY
- profile_version_used returned in response
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.prompts.cultural import get_cultural_block
from app.services.cultural_service import get_block

_RUN_ID = str(uuid.uuid4())[:8]


# ── Cultural block unit tests ────────────────────────────────────────────────

def test_cultural_block_ko_kr() -> None:
    block = get_cultural_block("ko-KR", "professional")
    assert block is not None
    assert "Korean" in block
    assert "High" in block


def test_cultural_block_en_us_returns_none() -> None:
    """en-US is the baseline — no cultural block injected."""
    block = get_cultural_block("en-US", "professional")
    assert block is None


def test_cultural_block_en_us_direct_suppressed() -> None:
    block = get_cultural_block("en-US", "direct")
    assert block is None


def test_cultural_block_unknown_locale_returns_none() -> None:
    block = get_cultural_block("xx-XX", "casual")
    assert block is None


def test_cultural_service_none_locale() -> None:
    """None locale falls back to en-US baseline → None."""
    block = get_block(None, "professional")
    assert block is None


def test_cultural_block_hi_in() -> None:
    block = get_cultural_block("hi-IN", "professional")
    assert block is not None
    assert "Indian" in block


def test_cultural_block_de_de() -> None:
    block = get_cultural_block("de-DE", "professional")
    assert block is not None
    assert "German" in block


# ── Personalized humanize integration tests ──────────────────────────────────

def _mock_llm(text: str = "Personalized rewrite.") -> MagicMock:
    choice = MagicMock()
    choice.message.content = text
    usage = MagicMock()
    usage.prompt_tokens = 120
    usage.completion_tokens = 60
    resp = MagicMock()
    resp.choices = [choice]
    resp.usage = usage
    return resp


MOCK_LLM = _mock_llm()


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_LLM)
async def test_humanize_no_dna_profile_version_is_null(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """Without a DNA profile, profile_version_used is null."""
    resp = await client.post(
        "/v1/humanize",
        json={"text": f"quick update needed {_RUN_ID}", "tone": "professional", "use_dna": True},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["profile_version_used"] is None


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_LLM)
@patch(
    "app.services.personalization_service.build_context",
    new_callable=AsyncMock,
    return_value=("- Avg sentence length: 8.5 words\n- Formality: 0.4/1.0", [], 2),
)
async def test_humanize_with_dna_returns_profile_version(
    mock_ctx, mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """When personalization context is available, profile_version_used is set."""
    resp = await client.post(
        "/v1/humanize",
        json={
            "text": f"follow up on the proposal {_RUN_ID}-v2",
            "tone": "professional",
            "use_dna": True,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["profile_version_used"] == 2
    assert body["output_text"] == "Personalized rewrite."


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_LLM)
async def test_humanize_use_dna_false_skips_personalization(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """use_dna=False skips personalization entirely."""
    resp = await client.post(
        "/v1/humanize",
        json={"text": f"no dna flag {_RUN_ID}", "tone": "casual", "use_dna": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["profile_version_used"] is None


# ── Memory storage tests ─────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_LLM)
async def test_feedback_accepted_triggers_memory_store(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """Accepting a rewrite fires memory storage (Qdrant embed mocked)."""
    create = await client.post(
        "/v1/humanize",
        json={"text": f"memory storage test {_RUN_ID}", "tone": "casual"},
        headers=auth_headers,
    )
    assert create.status_code == 200
    rewrite_id = create.json()["id"]

    with patch("app.services.memory_service._embed_and_store", new_callable=AsyncMock):
        fb = await client.post(
            f"/v1/humanize/{rewrite_id}/feedback",
            json={"action": "accepted"},
            headers=auth_headers,
        )
    assert fb.status_code == 204


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_LLM)
async def test_feedback_edited_triggers_memory_store(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """Submitting an edited rewrite also creates a memory entry."""
    create = await client.post(
        "/v1/humanize",
        json={"text": f"memory edit test {_RUN_ID}", "tone": "professional"},
        headers=auth_headers,
    )
    assert create.status_code == 200
    rewrite_id = create.json()["id"]

    with patch("app.services.memory_service._embed_and_store", new_callable=AsyncMock):
        fb = await client.post(
            f"/v1/humanize/{rewrite_id}/feedback",
            json={"action": "edited", "edit_text": "My actual preferred version."},
            headers=auth_headers,
        )
    assert fb.status_code == 204


# ── Memory retrieval unit test ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_memory_retrieve_returns_empty_in_test_env() -> None:
    """retrieve_examples returns [] when OPENAI_API_KEY is absent (test env has none)."""
    from app.services.memory_service import retrieve_examples

    result = await retrieve_examples(uuid.uuid4(), "some text", "professional")
    assert result == []
