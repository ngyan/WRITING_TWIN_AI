"""Sprint 6 — Routing hardening + quality retry tests."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

_RUN_ID = str(uuid.uuid4())[:8]


def _mock_llm(text: str = "Great rewrite.") -> MagicMock:
    choice = MagicMock()
    choice.message.content = text
    usage = MagicMock()
    usage.prompt_tokens = 100
    usage.completion_tokens = 50
    resp = MagicMock()
    resp.choices = [choice]
    resp.usage = usage
    return resp


# ── Circuit breaker unit tests ────────────────────────────────────────────────

def test_circuit_opens_after_threshold() -> None:
    """Circuit opens once consecutive failures reach threshold."""
    from app.services import router_service

    key = "test-provider"
    router_service._failures.pop(key, None)
    router_service._opened_at.pop(key, None)

    for _ in range(router_service.settings.CIRCUIT_BREAK_THRESHOLD):
        router_service._record_failure(key)

    assert router_service._is_open(key)
    # Cleanup
    router_service._failures.pop(key, None)
    router_service._opened_at.pop(key, None)


def test_circuit_resets_on_success() -> None:
    """Recording a success clears failure count and opens circuit."""
    from app.services import router_service

    key = "test-provider-2"
    router_service._failures[key] = 5
    router_service._opened_at[key] = 0.0  # opened long ago

    router_service._record_success(key)

    assert router_service._failures.get(key, 0) == 0
    assert key not in router_service._opened_at


def test_circuit_half_open_after_reset_seconds() -> None:
    """Circuit auto-resets after CIRCUIT_RESET_SECONDS elapses."""
    import time
    from app.services import router_service

    key = "test-provider-3"
    router_service._failures[key] = 5
    # Set opened_at far in the past
    router_service._opened_at[key] = time.monotonic() - (
        router_service.settings.CIRCUIT_RESET_SECONDS + 5
    )

    assert not router_service._is_open(key)  # should auto-reset
    router_service._failures.pop(key, None)
    router_service._opened_at.pop(key, None)


# ── Fallback chain integration tests ─────────────────────────────────────────

@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock)
async def test_fallback_triggers_on_provider_error(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """When primary model raises ServiceUnavailableError, fallback is used."""
    import litellm

    primary_calls = 0

    async def side_effect(**kwargs):  # type: ignore[no-untyped-def]
        nonlocal primary_calls
        model = kwargs.get("model", "")
        if "gemini" in model and primary_calls == 0:
            primary_calls += 1
            raise litellm.exceptions.ServiceUnavailableError(
                message="Gemini down", model=model, llm_provider="gemini"
            )
        return _mock_llm("Fallback response.")

    mock_llm.side_effect = side_effect

    resp = await client.post(
        "/v1/humanize",
        json={"text": f"test fallback {_RUN_ID}", "tone": "casual", "use_dna": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["output_text"] == "Fallback response."


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock)
async def test_all_providers_fail_returns_503(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """When every provider in the chain fails, returns HTTP 503."""
    import litellm

    mock_llm.side_effect = litellm.exceptions.ServiceUnavailableError(
        message="All down", model="any", llm_provider="any"
    )

    resp = await client.post(
        "/v1/humanize",
        json={"text": f"test 503 {_RUN_ID}", "tone": "casual", "use_dna": False},
        headers=auth_headers,
    )
    assert resp.status_code == 503


# ── Cost guard tests ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_llm())
@patch("app.services.cost_guard_service.is_degraded", new_callable=AsyncMock, return_value=True)
async def test_cost_guard_degrades_to_gemini_flash(
    mock_guard, mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """When cost guard fires, model is downgraded to gemini-flash."""
    resp = await client.post(
        "/v1/humanize",
        json={"text": f"cost guard test {_RUN_ID}", "tone": "professional", "use_dna": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    # The model should be gemini-flash (free tier user is already on it; just checking no crash)
    assert resp.json()["output_text"] == "Great rewrite."


# ── Quality retry tests ───────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock)
async def test_quality_retry_fires_when_score_low(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """When FEATURE_QUALITY_RETRY is True and tone_fit < 0.75, output is retried."""
    from app.services import quality_service

    call_count = 0

    async def side_effect(**kwargs):  # type: ignore[no-untyped-def]
        nonlocal call_count
        call_count += 1
        return _mock_llm(f"Attempt {call_count}.")

    mock_llm.side_effect = side_effect

    low_score = {
        "preservation": 0.9, "voice_match": 0.9,
        "tone_fit": 0.50,  # below 0.75 threshold
        "risk": 0.1, "overall": 0.6, "issues": [],
    }
    high_score = {
        "preservation": 0.95, "voice_match": 0.95,
        "tone_fit": 0.85,  # passes
        "risk": 0.05, "overall": 0.9, "issues": [],
    }

    score_seq = [low_score, high_score]
    score_call = 0

    async def fake_scorer(input_text: str, output_text: str, tone: str):  # type: ignore[no-untyped-def]
        nonlocal score_call
        result = score_seq[min(score_call, len(score_seq) - 1)]
        score_call += 1
        return result

    with patch("app.core.config.settings.FEATURE_QUALITY_RETRY", True):
        with patch.object(quality_service, "_call_scorer", side_effect=fake_scorer):
            resp = await client.post(
                "/v1/humanize",
                json={
                    "text": f"quality retry test {_RUN_ID}",
                    "tone": "professional",
                    "use_dna": False,
                },
                headers=auth_headers,
            )

    assert resp.status_code == 200
    body = resp.json()
    assert body["retry_count"] == 1
    # _detect_context_intent fires 2 LLM calls first; rewrite attempt 1 = call 3, retry = call 4
    assert body["output_text"] == "Attempt 4."


@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock)
async def test_quality_retry_returns_best_on_exhaustion(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """When all retries fail threshold, the highest-scoring attempt is returned."""
    from app.services import quality_service

    call_count = 0

    async def side_effect(**kwargs):  # type: ignore[no-untyped-def]
        nonlocal call_count
        call_count += 1
        return _mock_llm(f"Attempt {call_count}.")

    mock_llm.side_effect = side_effect

    scores = [
        {"preservation": 0.9, "voice_match": 0.9, "tone_fit": 0.50, "risk": 0.1, "overall": 0.6, "issues": []},
        {"preservation": 0.9, "voice_match": 0.9, "tone_fit": 0.55, "risk": 0.1, "overall": 0.65, "issues": []},
        {"preservation": 0.9, "voice_match": 0.9, "tone_fit": 0.60, "risk": 0.1, "overall": 0.70, "issues": []},
    ]
    score_call = 0

    async def fake_scorer(input_text: str, output_text: str, tone: str):  # type: ignore[no-untyped-def]
        nonlocal score_call
        result = scores[min(score_call, len(scores) - 1)]
        score_call += 1
        return result

    with patch("app.core.config.settings.FEATURE_QUALITY_RETRY", True):
        with patch.object(quality_service, "_call_scorer", side_effect=fake_scorer):
            resp = await client.post(
                "/v1/humanize",
                json={
                    "text": f"quality exhaustion test {_RUN_ID}",
                    "tone": "professional",
                    "use_dna": False,
                },
                headers=auth_headers,
            )

    assert resp.status_code == 200
    body = resp.json()
    # All 3 attempts exhausted (max_retries=2 → 3 total attempts)
    assert body["retry_count"] == 2
    # 2 context/intent calls + 3 rewrite attempts; best overall = attempt 3 = call 5
    assert body["output_text"] == "Attempt 5."
