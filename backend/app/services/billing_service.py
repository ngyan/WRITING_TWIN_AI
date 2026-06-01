"""BillingService — Stripe Checkout + Customer Portal + webhook lifecycle."""
import asyncio
import json
from datetime import date, datetime, timezone
from uuid import uuid4

import stripe
import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.rewrite import Rewrite
from app.models.subscription import Subscription
from app.models.user import User

log = structlog.get_logger()


def _configure() -> None:
    stripe.api_key = settings.STRIPE_API_KEY


def _plan_from_price(price_id: str) -> str:
    if price_id in (settings.STRIPE_PRICE_PRO_MONTHLY, settings.STRIPE_PRICE_PRO_YEARLY):
        return "pro"
    if price_id == settings.STRIPE_PRICE_TEAM_MONTHLY:
        return "team"
    return "pro"


async def get_or_create_customer(db: AsyncSession, user: User) -> str:
    """Return existing stripe_customer_id or create a new one."""
    if user.stripe_customer_id:
        return user.stripe_customer_id
    _configure()
    customer = await asyncio.to_thread(
        stripe.Customer.create,
        email=user.email,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    await db.commit()
    log.info("billing.customer_created", user_id=str(user.id), customer_id=customer.id)
    return customer.id


async def create_checkout_session(
    db: AsyncSession,
    user: User,
    price_id: str,
    success_url: str,
    cancel_url: str,
) -> str:
    """Create a Stripe Checkout session and return the redirect URL."""
    _configure()
    customer_id = await get_or_create_customer(db, user)
    session = await asyncio.to_thread(
        stripe.checkout.Session.create,
        customer=customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        allow_promotion_codes=True,
    )
    log.info("billing.checkout_created", user_id=str(user.id), session_id=session.id)
    return session.url


async def create_portal_session(db: AsyncSession, user: User, return_url: str) -> str:
    """Create a Stripe Customer Portal session and return the redirect URL."""
    _configure()
    customer_id = await get_or_create_customer(db, user)
    session = await asyncio.to_thread(
        stripe.billing_portal.Session.create,
        customer=customer_id,
        return_url=return_url,
    )
    log.info("billing.portal_created", user_id=str(user.id))
    return session.url


async def handle_webhook(db: AsyncSession, payload: bytes, sig_header: str) -> None:
    """Verify Stripe signature and process subscription lifecycle events."""
    _configure()
    if not settings.STRIPE_WEBHOOK_SECRET:
        # Dev mode: skip signature check
        event = json.loads(payload)
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as exc:
            log.warning("billing.webhook_invalid_signature", error=str(exc))
            raise ValueError("Invalid webhook signature") from exc

    event_type: str = event["type"]
    if event_type not in (
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        return

    sub_obj = event["data"]["object"]
    deleted = event_type == "customer.subscription.deleted"
    await _upsert_subscription(db, sub_obj, deleted=deleted)


async def _upsert_subscription(db: AsyncSession, sub_obj: dict, *, deleted: bool) -> None:
    stripe_sub_id: str = sub_obj["id"]
    stripe_customer_id: str = sub_obj["customer"]
    price_id: str = sub_obj["items"]["data"][0]["price"]["id"]
    status: str = "canceled" if deleted else sub_obj["status"]
    period_end = datetime.fromtimestamp(sub_obj["current_period_end"], tz=timezone.utc)
    cancel_at_period_end: bool = sub_obj.get("cancel_at_period_end", False)

    result = await db.execute(select(User).where(User.stripe_customer_id == stripe_customer_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        log.warning("billing.webhook_unknown_customer", customer_id=stripe_customer_id)
        return

    plan = "free" if deleted else _plan_from_price(price_id)

    result2 = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub: Subscription | None = result2.scalar_one_or_none()
    if sub is None:
        sub = Subscription(
            id=uuid4(),
            user_id=user.id,
            stripe_subscription_id=stripe_sub_id,
            stripe_price_id=price_id,
            plan=plan,
            status=status,
            current_period_end=period_end,
            cancel_at_period_end=cancel_at_period_end,
        )
        db.add(sub)
    else:
        sub.stripe_subscription_id = stripe_sub_id
        sub.stripe_price_id = price_id
        sub.plan = plan
        sub.status = status
        sub.current_period_end = period_end
        sub.cancel_at_period_end = cancel_at_period_end

    user.plan = plan
    await db.commit()
    log.info("billing.subscription_upserted", user_id=str(user.id), plan=plan, status=status)


async def get_usage(db: AsyncSession, user: User) -> dict:
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(
        tzinfo=timezone.utc
    )
    month_start = today_start.replace(day=1)

    today_result = await db.execute(
        select(func.count(Rewrite.id)).where(
            Rewrite.user_id == user.id,
            Rewrite.created_at >= today_start,
        )
    )
    monthly_result = await db.execute(
        select(func.count(Rewrite.id)).where(
            Rewrite.user_id == user.id,
            Rewrite.created_at >= month_start,
        )
    )

    today_count: int = today_result.scalar() or 0
    monthly_count: int = monthly_result.scalar() or 0

    monthly_limit: int | None
    if user.plan == "free":
        monthly_limit = settings.FREE_MONTHLY_LIMIT
    elif user.plan == "pro":
        monthly_limit = settings.PRO_MONTHLY_LIMIT
    else:
        monthly_limit = None

    return {
        "plan": user.plan,
        "today_count": today_count,
        "monthly_count": monthly_count,
        "monthly_limit": monthly_limit,
    }
