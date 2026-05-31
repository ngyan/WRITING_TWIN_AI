from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    email: EmailStr
    full_name: str | None
    is_active: bool
    is_verified: bool
    plan: str
    created_at: datetime
    last_active_at: datetime | None


class UserCreate(BaseModel):
    email: EmailStr
    hashed_password: str
    full_name: str | None = None
