"""Sprint 7 — Billing tests: entitlements + Stripe Checkout/Portal/Webhook/Usage."""
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

_RUN_ID = str(uuid.uuid4())[:8]
_FUTURE_TS = int(datetime(2030, 1, 1, tzinfo=timezone.utc).timestamp())


def _stripe_sub(
    stripe_sub_id: str = "sub_test",
    customer_id: str = "cus_test",
    price_id: str = "price_pro_monthly",
    status: str = "active",
    cancel_at_period_end: bool = False,
) -> dict:
    return {
        "id": stripe_sub_id,
        "customer": customer_id,
        "status": status,
        "current_period_end": _FUTURE_TS,
        "cancel_at_period_end": cancel_at_period_end,
        "items": {"data": [{"price": {"id": price_id}}]},
    }


# ── Entitlement gate ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("litellm.acompletion", new_callable=AsyncMock)
async def test_free_user_under_limit_can_rewrite(
    mock_llm, client: AsyncClient, auth_headers: dict
) -> None:
    """Free user with 0 rewrites today should get through."""
    choice = MagicMock()
    choice.message.content = "Under limit."
    usage = MagicMock()
    usage.prompt_tokens = 10
    usage.completion_tokens = 5
    resp_mock = MagicMock()
    resp_mock.choices = [choice]
    resp_mock.usage = usage
    mock_llm.return_value = resp_mock

    resp = await client.post(
        "/v1/humanize",
        json={"text": f"quota ok {_RUN_ID}", "tone": "casual", "use_dna": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_free_user_at_limit_unit() -> None:
    """Unit: require_rewrite_quota raises 429 when daily count >= FREE_DAILY_LIMIT."""
    import uuid as _uuid
    from fastapi import HTTPException

    from app.deps.entitlements import require_rewrite_quota

    user = MagicMock()
    user.plan = "free"
    user.id = _uuid.uuid4()

    mock_result = MagicMock()
    mock_result.scalar.return_value = 30  # at limit
    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result

    with pytest.raises(HTTPException) as exc_info:
        await require_rewrite_quota(user=user, db=mock_db)
    assert exc_info.value.status_code == 429
    assert "Daily limit" in exc_info.value.detail


@pytest.mark.asyncio
async def test_pro_user_bypasses_limit_unit() -> None:
    """Unit: pro users are not subject to the daily rewrite limit."""
    from app.deps.entitlements import require_rewrite_quota

    user = MagicMock()
    user.plan = "pro"
    mock_db = AsyncMock()

    result = await require_rewrite_quota(user=user, db=mock_db)
    assert result is user
    mock_db.execute.assert_not_called()


# ── Usage endpoint ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_usage_returns_plan_and_counts(
    client: AsyncClient, auth_headers: dict
) -> None:
    resp = await client.get("/v1/billing/usage", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["plan"] == "free"
    assert isinstance(body["today_count"], int)
    assert isinstance(body["monthly_count"], int)
    assert body["daily_limit"] == 30  # free plan


# ── Checkout ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("app.services.billing_service.get_or_create_customer", new_callable=AsyncMock, return_value="cus_existing")
@patch("app.services.billing_service.asyncio.to_thread", new_callable=AsyncMock)
async def test_checkout_returns_url(
    mock_thread: AsyncMock,
    mock_customer: AsyncMock,
    client: AsyncClient,
    auth_headers: dict,
) -> None:
    """POST /v1/billing/checkout should return a Stripe Checkout URL."""
    mock_thread.return_value = MagicMock(id="cs_test", url="https://checkout.stripe.com/pay/test")

    resp = await client.post(
        "/v1/billing/checkout",
        json={
            "price_id": "price_pro_monthly",
            "success_url": "https://app.example.com/success",
            "cancel_url": "https://app.example.com/cancel",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["checkout_url"] == "https://checkout.stripe.com/pay/test"


# ── Portal ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("app.services.billing_service.get_or_create_customer", new_callable=AsyncMock, return_value="cus_existing")
@patch("app.services.billing_service.asyncio.to_thread", new_callable=AsyncMock)
async def test_portal_returns_url(
    mock_thread: AsyncMock,
    mock_customer: AsyncMock,
    client: AsyncClient,
    auth_headers: dict,
) -> None:
    """POST /v1/billing/portal should return a Stripe Portal URL."""
    mock_thread.return_value = MagicMock(url="https://billing.stripe.com/session/test")

    resp = await client.post(
        "/v1/billing/portal",
        json={"return_url": "https://app.example.com/settings"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["portal_url"] == "https://billing.stripe.com/session/test"


# ── Webhook ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_webhook_subscription_created_upgrades_plan(
    client: AsyncClient, auth_headers: dict
) -> None:
    """subscription.created event should upgrade user plan to pro."""
    # First: grab the user's id by calling /v1/auth/me
    me_resp = await client.get("/v1/auth/me", headers=auth_headers)
    assert me_resp.status_code == 200

    # Seed a stripe_customer_id directly via billing_service internals (dev webhook mode)
    from app.deps.db import get_db
    from app.services.billing_service import _plan_from_price  # noqa: F401

    # Use dev webhook mode (STRIPE_WEBHOOK_SECRET is empty in tests)
    with patch("app.core.config.settings.STRIPE_PRICE_PRO_MONTHLY", "price_pro_monthly"):
        event_payload = json.dumps({
            "type": "customer.subscription.created",
            "data": {"object": _stripe_sub(customer_id="cus_webhook_test")},
        }).encode()

        # Seed the stripe_customer_id on the fixture user via a direct DB call
        from tests.conftest import _TestSessionLocal
        from app.models.user import User
        from sqlalchemy import select, update

        async with _TestSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.email == "fixture@example.com")
            )
            user = result.scalar_one_or_none()
            if user:
                user.stripe_customer_id = "cus_webhook_test"
                await db.commit()

        resp = await client.post(
            "/v1/billing/webhook",
            content=event_payload,
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 200

    # Verify plan was upgraded
    async with _TestSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "fixture@example.com"))
        user = result.scalar_one_or_none()
    assert user is not None
    assert user.plan == "pro"


@pytest.mark.asyncio
async def test_webhook_subscription_deleted_downgrades_plan(
    client: AsyncClient, auth_headers: dict
) -> None:
    """subscription.deleted event should downgrade user plan to free."""
    from tests.conftest import _TestSessionLocal
    from app.models.user import User
    from sqlalchemy import select

    # Ensure user has a customer_id
    async with _TestSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "fixture@example.com"))
        user = result.scalar_one_or_none()
        if user:
            user.stripe_customer_id = "cus_webhook_test"
            user.plan = "pro"
            await db.commit()

    event_payload = json.dumps({
        "type": "customer.subscription.deleted",
        "data": {"object": _stripe_sub(customer_id="cus_webhook_test", status="canceled")},
    }).encode()

    resp = await client.post(
        "/v1/billing/webhook",
        content=event_payload,
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 200

    async with _TestSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "fixture@example.com"))
        user = result.scalar_one_or_none()
    assert user is not None
    assert user.plan == "free"


@pytest.mark.asyncio
async def test_webhook_invalid_signature_returns_400(client: AsyncClient) -> None:
    """Webhook with invalid Stripe signature should return 400."""
    with patch("app.core.config.settings.STRIPE_WEBHOOK_SECRET", "whsec_real_secret"):
        resp = await client.post(
            "/v1/billing/webhook",
            content=b"{}",
            headers={"Stripe-Signature": "t=bad,v1=badsig", "Content-Type": "application/json"},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_webhook_unknown_event_type_ignored(client: AsyncClient) -> None:
    """Unknown Stripe event types should be silently ignored (200)."""
    event_payload = json.dumps({
        "type": "payment_intent.succeeded",
        "data": {"object": {}},
    }).encode()
    resp = await client.post(
        "/v1/billing/webhook",
        content=event_payload,
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 200
