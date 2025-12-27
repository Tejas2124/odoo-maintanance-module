CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core identity
  name TEXT NOT NULL,                               -- "Samsung Monitor 15'"
  category TEXT NOT NULL,                           -- "Monitors"
  company TEXT,                                     -- "True Fish"
  
  -- Ownership / usage
  used_by_type TEXT CHECK (used_by_type IN ('EMPLOYEE', 'DEPARTMENT')),
  used_by_user_id UUID,                             -- Abigail Peterson
  used_in_location TEXT,                            -- "Used in location?"
  work_center TEXT,                                 -- "Work Center?"

  -- Maintenance responsibility
  maintenance_team_id UUID REFERENCES maintenance_teams(id),
  default_technician_id UUID,                       -- Mitchell Admin

  -- Lifecycle dates
  assigned_date DATE,                               -- 12/24/2025
  scrap_date DATE,

  -- Status
  is_scrapped BOOLEAN DEFAULT FALSE,

  -- Extra
  description TEXT,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
