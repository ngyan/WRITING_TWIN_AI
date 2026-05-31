from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI

from app.core.config import settings
from app.routers import auth, health

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    structlog.configure(
        wrapper_class=structlog.make_filtering_bound_logger(
            20 if settings.APP_ENV == "production" else 10
        )
    )
    logger.info("startup", env=settings.APP_ENV)
    yield
    logger.info("shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Writing Twin AI API",
        version="0.1.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )
    app.include_router(health.router)
    app.include_router(auth.router)
    return app


app = create_app()
