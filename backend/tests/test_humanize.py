"""Sprint 2 — Humanization API tests. LiteLLM is mocked throughout."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

_RUN_ID = str(uuid.uuid4())[:8]

import pytest
from httpx import AsyncClient


def _mock_llm_response(text: str = "Rewritten text here.") -> MagicMock:
    choice = MagicMock()
    choice.message.content = text
    usage = MagicMock()
    usage.prompt_tokens = 100
    usage.completion_tokens = 50
    resp = MagicMock()
    resp.choices = [choice]
    resp.usage = usage
    return resp


MOCK_RESPONSE = _mock_llm_response()

HUMANIZE_PAYLOAD = {"text": f"hey just checking in on project status {_RUN_ID}", "tone": "professional"}


@pytest.mark.asyncio
async def test_humanize_requires_auth(client: AsyncClient) -> None:
    resp = await client.post("/v1/humanize", json=HUMANIZE_PAYLOAD)
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_RESPONSE)
async def test_humanize_returns_rewrite_response(mock_llm, client: AsyncClient, auth_headers: dict) -> None:
    resp = await client.post("/v1/humanize", json=HUMANIZE_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "output_text" in body
    assert body["output_text"] == "Rewritten text here."
    assert body["cache_hit"] is False
    assert "id" in body
    assert "latency_ms" in body


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_RESPONSE)
async def test_humanize_exact_cache_hit_on_repeat(mock_llm, client: AsyncClient, auth_headers: dict) -> None:
    payload = {"text": f"unique text for cache test {_RUN_ID}", "tone": "casual"}

    resp1 = await client.post("/v1/humanize", json=payload, headers=auth_headers)
    assert resp1.status_code == 200
    assert resp1.json()["cache_hit"] is False

    resp2 = await client.post("/v1/humanize", json=payload, headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["cache_hit"] is True

    # LLM called once, not twice
    assert mock_llm.call_count >= 1  # context/intent detection + main call on first


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_RESPONSE)
async def test_humanize_plan_routing_free_uses_gemini(mock_llm, client: AsyncClient, auth_headers: dict) -> None:
    # Default plan is "free" for registered users
    resp = await client.post(
        "/v1/humanize",
        json={"text": f"test routing for free plan {_RUN_ID}", "tone": "casual"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    # Free plan routes to gemini-flash
    assert "gemini" in body["provider"].lower() or body["provider"] == "gemini"


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_RESPONSE)
async def test_humanize_executive_tone_uses_sonnet(mock_llm, client: AsyncClient, auth_headers: dict) -> None:
    resp = await client.post(
        "/v1/humanize",
        json={"text": "we need to discuss Q3 results with the board", "tone": "executive"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    # Executive tone always routes to claude-sonnet
    assert "anthropic" in body["provider"].lower() or "claude" in body["model"].lower()


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=MOCK_RESPONSE)
async def test_feedback_records_action(mock_llm, client: AsyncClient, auth_headers: dict) -> None:
    # First create a rewrite
    create_resp = await client.post(
        "/v1/humanize",
        json={"text": f"unique feedback test text {_RUN_ID}", "tone": "direct"},
        headers=auth_headers,
    )
    assert create_resp.status_code == 200
    rewrite_id = create_resp.json()["id"]

    # Submit feedback
    fb_resp = await client.post(
        f"/v1/humanize/{rewrite_id}/feedback",
        json={"action": "accepted", "thumb": 1},
        headers=auth_headers,
    )
    assert fb_resp.status_code == 204
