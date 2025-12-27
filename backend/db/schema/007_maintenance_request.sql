CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core
  subject TEXT NOT NULL,                   -- Test activity
  description TEXT,

  -- Relations
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  maintenance_team_id UUID NOT NULL REFERENCES maintenance_teams(id),

  -- Assignment
  assigned_user_id UUID,                   -- Technician

  -- Request metadata
  request_type maintenance_request_type NOT NULL,
  status maintenance_request_status DEFAULT 'NEW',

  -- Dates & tracking
  scheduled_date TIMESTAMP,                -- Calendar
  completed_at TIMESTAMP,
  duration_hours NUMERIC(5,2),

  -- Context
  company TEXT,                            -- My Company (San Francisco)
  priority INTEGER DEFAULT 0,

  created_by UUID NOT NULL,                -- users.id
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
