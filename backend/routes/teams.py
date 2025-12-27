"""Maintenance team routes - Admin only."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dbs import User, get_async_session
from auth.users import current_admin
from models import MaintenanceTeam, MaintenanceTeamMember
from schema import MaintenanceTeamCreate, MaintenanceTeamRead

router = APIRouter(prefix="/teams", tags=["maintenance-teams"])


# ============ Team CRUD (Admin Only) ============

@router.get("/", response_model=list[MaintenanceTeamRead])
async def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """List all maintenance teams (Admin only)."""
    query = select(MaintenanceTeam).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/", response_model=MaintenanceTeamRead, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: MaintenanceTeamCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Create a maintenance team (Admin only)."""
    # Check if team name already exists
    existing = await session.execute(
        select(MaintenanceTeam).where(MaintenanceTeam.name == team_data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Team name already exists")
    
    team = MaintenanceTeam(**team_data.model_dump())
    session.add(team)
    await session.commit()
    await session.refresh(team)
    return team


@router.get("/{team_id}", response_model=MaintenanceTeamRead)
async def get_team(
    team_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Get team by ID (Admin only)."""
    result = await session.execute(
        select(MaintenanceTeam).where(MaintenanceTeam.id == team_id)
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Delete a team (Admin only)."""
    result = await session.execute(
        select(MaintenanceTeam).where(MaintenanceTeam.id == team_id)
    )
    team = result.scalar_one_or_none()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    await session.delete(team)
    await session.commit()


# ============ Team Members ============

@router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member_to_team(
    team_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str = "TECHNICIAN",
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Add a user as member of a team (Admin only)."""
    # Verify team exists
    team_result = await session.execute(
        select(MaintenanceTeam).where(MaintenanceTeam.id == team_id)
    )
    if not team_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if already a member
    existing = await session.execute(
        select(MaintenanceTeamMember).where(
            MaintenanceTeamMember.team_id == team_id,
            MaintenanceTeamMember.user_id == user_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already a member of this team")
    
    member = MaintenanceTeamMember(
        user_id=user_id,
        team_id=team_id,
        role=role
    )
    session.add(member)
    await session.commit()
    
    return {"message": "Member added", "user_id": str(user_id), "team_id": str(team_id)}


@router.get("/{team_id}/members")
async def list_team_members(
    team_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """List members of a team (Admin only)."""
    result = await session.execute(
        select(MaintenanceTeamMember).where(MaintenanceTeamMember.team_id == team_id)
    )
    members = result.scalars().all()
    return [{"user_id": str(m.user_id), "role": m.role} for m in members]
