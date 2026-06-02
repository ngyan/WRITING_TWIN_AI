from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure all ORM models are registered with Base.metadata before alembic / test DB setup
import app.models.audit_log  # noqa: F401
import app.models.communication_memory  # noqa: F401
import app.models.feature_flag  # noqa: F401
import app.models.rewrite  # noqa: F401
import app.models.subscription  # noqa: F401
import app.models.usage_event  # noqa: F401
import app.models.user  # noqa: F401
import app.models.voice_session  # noqa: F401
import app.models.writing_profile  # noqa: F401
from app.core.config import settings
from app.routers import auth, health
from app.routers import billing as billing_router
from app.routers import dna as dna_router
from app.routers import humanize as humanize_router
from app.routers import voice as voice_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    structlog.configure(
        wrapper_class=structlog.make_filtering_bound_logger(
            20 if settings.APP_ENV == "production" else 10
        )
    )
    from app.services.router_service import configure_keys
    configure_keys()
    logger.info("startup", env=settings.APP_ENV)
    yield
    logger.info("shutdown")


_CORS_ORIGINS = [
    # Chrome extension (wildcard — specific IDs added after Web Store publish)
    "chrome-extension://*",
    # Local development
    "http://localhost:3000",
    "http://localhost:3001",
    "https://writingtwinai.com",
    "https://www.writingtwinai.com",
]


def create_app() -> FastAPI:
    application = FastAPI(
        title="Writing Twin AI API",
        version="0.1.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"chrome-extension://.*",
        allow_origins=_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(humanize_router.router)
    application.include_router(dna_router.router)
    application.include_router(billing_router.router)
    application.include_router(voice_router.router)
    return application


app = create_app()  # type: ignore[assignment]
