CREATE INDEX idx_requests_status ON maintenance_requests(status);
CREATE INDEX idx_requests_team ON maintenance_requests(maintenance_team_id);
CREATE INDEX idx_requests_equipment ON maintenance_requests(equipment_id);
CREATE INDEX idx_requests_scheduled ON maintenance_requests(scheduled_date);

CREATE INDEX idx_equipment_team ON equipment(maintenance_team_id);
CREATE INDEX idx_equipment_used_by ON equipment(used_by_user_id);
