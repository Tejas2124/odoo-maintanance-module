"""Pydantic schemas for GearGuard API."""
import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from models import EquipmentUsedByType, MaintenanceRequestStatus, MaintenanceRequestType


# ============ Maintenance Team Schemas ============

class MaintenanceTeamBase(BaseModel):
    name: str
    description: Optional[str] = None


class MaintenanceTeamCreate(MaintenanceTeamBase):
    pass


class MaintenanceTeamRead(MaintenanceTeamBase):
    id: uuid.UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============ Equipment Schemas ============

class EquipmentBase(BaseModel):
    """Base equipment fields - shared by create/update/read."""
    name: str
    category: str
    company: Optional[str] = None
    description: Optional[str] = None
    used_by_type: Optional[str] = None
    used_in_location: Optional[str] = None
    work_center: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    """Admin creates equipment with ownership and maintenance assignment."""
    used_by_user_id: Optional[uuid.UUID] = None
    maintenance_team_id: Optional[uuid.UUID] = None
    default_technician_id: Optional[uuid.UUID] = None
    assigned_date: Optional[date] = None


class EquipmentUpdate(BaseModel):
    """Admin can update any equipment field."""
    name: Optional[str] = None
    category: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    used_by_type: Optional[str] = None
    used_by_user_id: Optional[uuid.UUID] = None
    used_in_location: Optional[str] = None
    work_center: Optional[str] = None
    maintenance_team_id: Optional[uuid.UUID] = None
    default_technician_id: Optional[uuid.UUID] = None
    assigned_date: Optional[date] = None
    is_scrapped: Optional[bool] = None
    scrap_date: Optional[date] = None


class EquipmentRead(EquipmentBase):
    """Equipment response with all fields."""
    id: uuid.UUID
    used_by_user_id: Optional[uuid.UUID] = None
    maintenance_team_id: Optional[uuid.UUID] = None
    default_technician_id: Optional[uuid.UUID] = None
    assigned_date: Optional[date] = None
    scrap_date: Optional[date] = None
    is_scrapped: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============ Maintenance Request Schemas ============

class MaintenanceRequestBase(BaseModel):
    """Base fields for maintenance request."""
    subject: str
    description: Optional[str] = None


class MaintenanceRequestUserCreate(MaintenanceRequestBase):
    """User creates ticket - only needs equipment_id, rest is auto-filled."""
    equipment_id: uuid.UUID
    request_type: MaintenanceRequestType = MaintenanceRequestType.CORRECTIVE


class MaintenanceRequestAdminCreate(MaintenanceRequestBase):
    """Admin can set all fields when creating."""
    equipment_id: uuid.UUID
    maintenance_team_id: Optional[uuid.UUID] = None
    assigned_user_id: Optional[uuid.UUID] = None
    request_type: MaintenanceRequestType = MaintenanceRequestType.CORRECTIVE
    status: MaintenanceRequestStatus = MaintenanceRequestStatus.NEW
    priority: int = 0
    scheduled_date: Optional[datetime] = None


class MaintenanceRequestAdminUpdate(BaseModel):
    """Admin can update all fields."""
    subject: Optional[str] = None
    description: Optional[str] = None
    equipment_id: Optional[uuid.UUID] = None
    maintenance_team_id: Optional[uuid.UUID] = None
    assigned_user_id: Optional[uuid.UUID] = None
    status: Optional[MaintenanceRequestStatus] = None
    priority: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    duration_hours: Optional[float] = None
    completed_at: Optional[datetime] = None


class MaintenanceRequestRead(MaintenanceRequestBase):
    """Full maintenance request response."""
    id: uuid.UUID
    equipment_id: uuid.UUID
    maintenance_team_id: uuid.UUID
    assigned_user_id: Optional[uuid.UUID] = None
    request_type: MaintenanceRequestType
    status: MaintenanceRequestStatus
    priority: int
    scheduled_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_hours: Optional[float] = None
    company: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
