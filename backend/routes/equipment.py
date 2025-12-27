"""Equipment routes - Admin CRUD + User read-only access."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dbs import Role, User, get_async_session
from auth.users import current_active_user, current_admin
from models import Equipment
from schema import EquipmentCreate, EquipmentRead, EquipmentUpdate

router = APIRouter(prefix="/equipment", tags=["equipment"])


# ============ Admin Routes ============

@router.get("/", response_model=list[EquipmentRead])
async def list_all_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_scrapped: Optional[bool] = None,
    category: Optional[str] = None,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """List all equipment (Admin only)."""
    query = select(Equipment)
    
    if is_scrapped is not None:
        query = query.where(Equipment.is_scrapped == is_scrapped)
    if category:
        query = query.where(Equipment.category == category)
    
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/", response_model=EquipmentRead, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    equipment_data: EquipmentCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Create new equipment (Admin only). Requires owner and maintenance assignment."""
    from models import MaintenanceTeam, MaintenanceTeamMember
    
    # Validate maintenance team exists
    team_result = await session.execute(
        select(MaintenanceTeam).where(MaintenanceTeam.id == equipment_data.maintenance_team_id)
    )
    if not team_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Maintenance team {equipment_data.maintenance_team_id} not found"
        )
    
    # Validate technician is member of the team
    member_result = await session.execute(
        select(MaintenanceTeamMember).where(
            MaintenanceTeamMember.user_id == equipment_data.default_technician_id,
            MaintenanceTeamMember.team_id == equipment_data.maintenance_team_id
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Technician {equipment_data.default_technician_id} is not a member of team {equipment_data.maintenance_team_id}"
        )
    
    equipment = Equipment(**equipment_data.model_dump())
    session.add(equipment)
    await session.commit()
    await session.refresh(equipment)
    return equipment


@router.get("/{equipment_id}", response_model=EquipmentRead)
async def get_equipment(
    equipment_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),  # noqa: B008
):
    """Get equipment by ID (Admin: any, User: only owned)."""
    result = await session.execute(
        select(Equipment).where(Equipment.id == equipment_id)
    )
    equipment = result.scalar_one_or_none()
    
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Users can only view their own equipment
    if user.role != Role.ADMIN and equipment.used_by_user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentRead)
async def update_equipment(
    equipment_id: uuid.UUID,
    equipment_data: EquipmentUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Update equipment (Admin only)."""
    result = await session.execute(
        select(Equipment).where(Equipment.id == equipment_id)
    )
    equipment = result.scalar_one_or_none()
    
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Update only provided fields
    update_data = equipment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)
    
    await session.commit()
    await session.refresh(equipment)
    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Delete equipment (Admin only)."""
    result = await session.execute(
        select(Equipment).where(Equipment.id == equipment_id)
    )
    equipment = result.scalar_one_or_none()
    
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    await session.delete(equipment)
    await session.commit()


# ============ User Routes ============

@router.get("/my/list", response_model=list[EquipmentRead])
async def list_my_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),  # noqa: B008
):
    """List equipment assigned to current user."""
    query = (
        select(Equipment)
        .where(Equipment.used_by_user_id == user.id)
        .where(Equipment.is_scrapped == False)  # noqa: E712
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(query)
    return result.scalars().all()
