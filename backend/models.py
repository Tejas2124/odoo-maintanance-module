"""SQLAlchemy models for GearGuard entities."""
import enum
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum as SQLAlchemyEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from auth.dbs import Base


# ============ Enums ============

class EquipmentUsedByType(str, enum.Enum):
    """Who uses the equipment."""
    EMPLOYEE = "EMPLOYEE"
    DEPARTMENT = "DEPARTMENT"


class MaintenanceRequestType(str, enum.Enum):
    """Type of maintenance request."""
    CORRECTIVE = "CORRECTIVE"
    PREVENTIVE = "PREVENTIVE"


class MaintenanceRequestStatus(str, enum.Enum):
    """Status of a maintenance request."""
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    REPAIRED = "REPAIRED"
    SCRAP = "SCRAP"


# ============ Models ============

class MaintenanceTeam(Base):
    """Maintenance team that handles equipment repairs."""
    __tablename__ = "maintenance_teams"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    equipment: Mapped[list["Equipment"]] = relationship("Equipment", back_populates="maintenance_team")
    members: Mapped[list["MaintenanceTeamMember"]] = relationship("MaintenanceTeamMember", back_populates="team")


class MaintenanceTeamMember(Base):
    """Member of a maintenance team (technicians)."""
    __tablename__ = "maintenance_team_members"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    team_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("maintenance_teams.id"), nullable=False)
    role: Mapped[str] = mapped_column(String, default="TECHNICIAN")  # TECHNICIAN | MANAGER
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    team: Mapped["MaintenanceTeam"] = relationship("MaintenanceTeam", back_populates="members")


class Equipment(Base):
    """Equipment that can be maintained."""
    __tablename__ = "equipment"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core identity
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Ownership / usage
    used_by_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    used_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    used_in_location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    work_center: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Maintenance responsibility
    maintenance_team_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("maintenance_teams.id"), nullable=True
    )
    default_technician_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    # Lifecycle dates
    assigned_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    scrap_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Status
    is_scrapped: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Extra
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    maintenance_team: Mapped[Optional["MaintenanceTeam"]] = relationship("MaintenanceTeam", back_populates="equipment")
    maintenance_requests: Mapped[list["MaintenanceRequest"]] = relationship("MaintenanceRequest", back_populates="equipment")


class MaintenanceRequest(Base):
    """Maintenance request for equipment."""
    __tablename__ = "maintenance_requests"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Core
    subject: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relations
    equipment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False
    )
    maintenance_team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("maintenance_teams.id"), nullable=False
    )
    
    # Assignment
    assigned_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    # Request metadata
    request_type: Mapped[MaintenanceRequestType] = mapped_column(
        SQLAlchemyEnum(MaintenanceRequestType, name="maintenance_request_type"),
        nullable=False
    )
    status: Mapped[MaintenanceRequestStatus] = mapped_column(
        SQLAlchemyEnum(MaintenanceRequestStatus, name="maintenance_request_status"),
        default=MaintenanceRequestStatus.NEW
    )
    
    # Dates & tracking
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_hours: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Context
    company: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    priority: Mapped[int] = mapped_column(default=0)
    
    # Audit
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    equipment: Mapped["Equipment"] = relationship("Equipment", back_populates="maintenance_requests")
    maintenance_team: Mapped["MaintenanceTeam"] = relationship("MaintenanceTeam")
