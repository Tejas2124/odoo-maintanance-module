from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI

from auth.dbs import User, create_db_and_tables
from auth.schema import UserCreate, UserRead, UserUpdate
from auth.users import (
    auth_backend,
    current_active_user,
    current_admin,
    fastapi_users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Not needed if you setup a migration system like Alembic
    await create_db_and_tables()
    yield


router = APIRouter()


# app = FastAPI(lifespan=lifespan)

router.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/cookie", tags=["auth"]
)
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


# ============ Protected Route Examples ============

@router.get("/authenticated-route")
async def authenticated_route(user: User = Depends(current_active_user)):  # noqa: B008
    """Any authenticated user can access this route."""
    return {"message": f"Hello {user.email}!", "role": user.role}


@router.get("/admin-only", tags=["admin"])
async def admin_only_route(user: User = Depends(current_admin)):  # noqa: B008
    """Only admin users can access this route."""
    return {
        "message": "Welcome, Admin!",
        "user_id": str(user.id),
        "email": user.email
    }


@router.get("/me", tags=["users"])
async def get_current_user_info(user: User = Depends(current_active_user)):  # noqa: B008
    """Get current user's information including role."""
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "is_superuser": user.is_superuser
    }

