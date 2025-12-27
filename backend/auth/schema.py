import uuid
from typing import Optional

from fastapi_users import schemas

from auth.dbs import Role


class UserRead(schemas.BaseUser[uuid.UUID]):
    """Schema for reading user data (includes role)."""
    role: Role


class UserCreate(schemas.BaseUserCreate):
    """Schema for creating a new user (role defaults to USER)."""
    role: Role = Role.USER


class UserUpdate(schemas.BaseUserUpdate):
    """Schema for updating user data (role is optional)."""
    role: Optional[Role] = None
