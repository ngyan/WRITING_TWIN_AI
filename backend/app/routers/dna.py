from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import current_user
from app.deps.db import get_db
from app.models.user import User
from app.schemas.dna import DNASamplesRequest, DNASamplesResponse, WritingProfileRead
from app.services import dna_service

router = APIRouter(prefix="/v1/dna", tags=["dna"])


@router.post("/samples", response_model=DNASamplesResponse, status_code=202)
async def submit_samples(
    req: DNASamplesRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> DNASamplesResponse:
    return await dna_service.submit_samples(db, user, req)


@router.get("/profile", response_model=WritingProfileRead)
async def get_profile(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> WritingProfileRead:
    return await dna_service.get_profile(db, user)


@router.post("/profile/refine", response_model=DNASamplesResponse, status_code=202)
async def refine_profile(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> DNASamplesResponse:
    return await dna_service.refine_profile(db, user)


@router.delete("/profile", status_code=204)
async def delete_profile(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await dna_service.delete_profile(db, user)
