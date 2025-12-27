import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, models
from fastapi_users.authentication import (
    AuthenticationBackend,
    CookieTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

from auth.dbs import Role, User, get_user_db

SECRET = "SECRET"


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request: Request | None = None):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Request | None = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Request | None = None
    ):
        print(f"Verification requested for user {user.id}. Verification token: {token}")


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):  # noqa: B008
    """
    Provide a UserManager instance for dependency injection.

    Parameters:
        user_db (SQLAlchemyUserDatabase): The SQLAlchemy-backed user database used to construct the manager.

    Returns:
        user_manager (UserManager): A UserManager instance initialized with the given user_db, yielded for use as a FastAPI dependency.
    """
    yield UserManager(user_db)


cookie_transport = CookieTransport(
    cookie_max_age=3600, cookie_secure=True, cookie_samesite="none"
)


def get_jwt_strategy() -> JWTStrategy[models.UP, models.ID]:
    """
    Create a JWT strategy configured with the module SECRET and a 3600-second token lifetime.

    Returns:
        JWTStrategy[models.UP, models.ID]: JWT strategy instance that signs tokens with SECRET and sets tokens to expire after 3600 seconds.
    """
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)


async def current_admin(user: User = Depends(current_active_user)) -> User:  # noqa: B008
    """
    Dependency that requires the current user to be an admin.
    
    Raises:
        HTTPException: 403 if user is not an admin.
    """
    if user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


def require_role(*allowed_roles: Role):
    """
    Factory that creates a dependency requiring specific roles.
    
    Usage:
        @router.get("/route")
        async def route(user: User = Depends(require_role(Role.ADMIN, Role.USER))):
            ...
    """
    async def role_checker(user: User = Depends(current_active_user)) -> User:  # noqa: B008
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {[r.value for r in allowed_roles]}"
            )
        return user
    return role_checker

