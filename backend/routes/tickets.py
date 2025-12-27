"""Maintenance request routes - User creates, Admin manages full lifecycle."""
import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dbs import Role, User, get_async_session
from auth.users import current_active_user, current_admin
from models import Equipment, MaintenanceRequest, MaintenanceRequestStatus
from schema import (
    MaintenanceRequestAdminCreate,
    MaintenanceRequestAdminUpdate,
    MaintenanceRequestRead,
    MaintenanceRequestUserCreate,
)

router = APIRouter(prefix="/tickets", tags=["maintenance-tickets"])


# ============ Auto-fill Logic ============

async def auto_fill_from_equipment(
    session: AsyncSession, equipment_id: uuid.UUID
) -> dict:
    """
    Auto-fill maintenance_team_id, assigned_user_id, company from equipment.
    This is the CRITICAL auto-fill logic mentioned in the plan.
    """
    result = await session.execute(
        select(Equipment).where(Equipment.id == equipment_id)
    )
    equipment = result.scalar_one_or_none()
    
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if equipment.is_scrapped:
        raise HTTPException(status_code=400, detail="Equipment is scrapped")
    
    return {
        "maintenance_team_id": equipment.maintenance_team_id,
        "assigned_user_id": equipment.default_technician_id,
        "company": equipment.company,
    }


# ============ User Routes ============

@router.post("/", response_model=MaintenanceRequestRead, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: MaintenanceRequestUserCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),  # noqa: B008
):
    """
    User creates a ticket for their equipment.
    Auto-fills: maintenance_team_id, assigned_user_id, company from equipment.
    Status defaults to NEW.
    """
    # Verify user owns this equipment
    result = await session.execute(
        select(Equipment).where(Equipment.id == ticket_data.equipment_id)
    )
    equipment = result.scalar_one_or_none()
    
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Non-admins can only create tickets for their own equipment
    if user.role != Role.ADMIN and equipment.used_by_user_id != user.id:
        raise HTTPException(
            status_code=403, 
            detail="You can only create tickets for equipment assigned to you"
        )
    
    # Auto-fill from equipment
    auto_filled = await auto_fill_from_equipment(session, ticket_data.equipment_id)
    
    # Validate maintenance team exists
    if not auto_filled["maintenance_team_id"]:
        raise HTTPException(
            status_code=400, 
            detail="Equipment has no maintenance team assigned"
        )
    
    ticket = MaintenanceRequest(
        subject=ticket_data.subject,
        description=ticket_data.description,
        equipment_id=ticket_data.equipment_id,
        request_type=ticket_data.request_type,
        maintenance_team_id=auto_filled["maintenance_team_id"],
        assigned_user_id=auto_filled["assigned_user_id"],
        company=auto_filled["company"],
        created_by=user.id,
        status=MaintenanceRequestStatus.NEW,
    )
    
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    return ticket


@router.get("/my", response_model=list[MaintenanceRequestRead])
async def list_my_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[MaintenanceRequestStatus] = None,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),  # noqa: B008
):
    """List tickets created by current user."""
    query = select(MaintenanceRequest).where(MaintenanceRequest.created_by == user.id)
    
    if status_filter:
        query = query.where(MaintenanceRequest.status == status_filter)
    
    query = query.order_by(MaintenanceRequest.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


# ============ Admin Routes ============

@router.get("/", response_model=list[MaintenanceRequestRead])
async def list_all_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[MaintenanceRequestStatus] = None,
    equipment_id: Optional[uuid.UUID] = None,
    team_id: Optional[uuid.UUID] = None,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """List all tickets (Admin only) with optional filters."""
    query = select(MaintenanceRequest)
    
    if status_filter:
        query = query.where(MaintenanceRequest.status == status_filter)
    if equipment_id:
        query = query.where(MaintenanceRequest.equipment_id == equipment_id)
    if team_id:
        query = query.where(MaintenanceRequest.maintenance_team_id == team_id)
    
    query = query.order_by(MaintenanceRequest.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/admin", response_model=MaintenanceRequestRead, status_code=status.HTTP_201_CREATED)
async def admin_create_ticket(
    ticket_data: MaintenanceRequestAdminCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Admin creates a ticket with full control over all fields."""
    # Get auto-fill values but admin can override
    auto_filled = await auto_fill_from_equipment(session, ticket_data.equipment_id)
    
    ticket = MaintenanceRequest(
        subject=ticket_data.subject,
        description=ticket_data.description,
        equipment_id=ticket_data.equipment_id,
        request_type=ticket_data.request_type,
        status=ticket_data.status,
        priority=ticket_data.priority,
        scheduled_date=ticket_data.scheduled_date,
        # Use provided values or fall back to auto-fill
        maintenance_team_id=ticket_data.maintenance_team_id or auto_filled["maintenance_team_id"],
        assigned_user_id=ticket_data.assigned_user_id or auto_filled["assigned_user_id"],
        company=auto_filled["company"],
        created_by=user.id,
    )
    
    if not ticket.maintenance_team_id:
        raise HTTPException(
            status_code=400,
            detail="maintenance_team_id required (equipment has no team assigned)"
        )
    
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", response_model=MaintenanceRequestRead)
async def get_ticket(
    ticket_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),  # noqa: B008
):
    """Get ticket by ID (Admin: any, User: only their own)."""
    result = await session.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Users can only view their own tickets
    if user.role != Role.ADMIN and ticket.created_by != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ticket


@router.put("/{ticket_id}", response_model=MaintenanceRequestRead)
async def update_ticket(
    ticket_id: uuid.UUID,
    ticket_data: MaintenanceRequestAdminUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """
    Admin updates ticket (full control).
    Handles status transitions and scrap logic.
    """
    result = await session.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = ticket_data.model_dump(exclude_unset=True)
    
    # Handle SCRAP status - mark equipment as scrapped
    if update_data.get("status") == MaintenanceRequestStatus.SCRAP:
        equipment_result = await session.execute(
            select(Equipment).where(Equipment.id == ticket.equipment_id)
        )
        equipment = equipment_result.scalar_one_or_none()
        if equipment:
            equipment.is_scrapped = True
            equipment.scrap_date = date.today()
    
    # Handle REPAIRED status - set completed_at if not provided
    if update_data.get("status") == MaintenanceRequestStatus.REPAIRED:
        if "completed_at" not in update_data:
            update_data["completed_at"] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(ticket, field, value)
    
    await session.commit()
    await session.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_admin),  # noqa: B008
):
    """Delete a ticket (Admin only)."""
    result = await session.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    await session.delete(ticket)
    await session.commit()
