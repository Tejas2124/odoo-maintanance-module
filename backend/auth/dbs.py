import enum
import os
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from fastapi import Depends
from fastapi_users_db_sqlalchemy import (
    SQLAlchemyBaseUserTableUUID,
    SQLAlchemyUserDatabase,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

load_dotenv()

DB_PASSWORD = os.environ.get("DB_PASSWORD")
DATABASE_URL = f"postgresql+asyncpg://postgres:{DB_PASSWORD}@localhost:5432/oddox"


class Role(str, enum.Enum):
    """User roles for access control."""
    ADMIN = "ADMIN"
    USER = "USER"


class Base(DeclarativeBase):
    pass


class User(SQLAlchemyBaseUserTableUUID, Base):
    """User model with role-based access control."""
    role: Mapped[Role] = mapped_column(
        SQLAlchemyEnum(Role, name="user_role", create_constraint=True),
        default=Role.USER,
        nullable=False
    )


engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def create_db_and_tables():
    # Import models to register them with Base.metadata
    import models  # noqa: F401
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Verify database connection
        result = await conn.execute(text("SELECT current_database()"))
        print("CONNECTED DB:", result.scalar())


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        print(f"DEBUG REQUEST: Engine is connected to: {engine.url.database}", flush=True)
        yield session


async def get_user_db(session: AsyncSession = Depends(get_async_session)):  # noqa: B008
    yield SQLAlchemyUserDatabase(session, User)
