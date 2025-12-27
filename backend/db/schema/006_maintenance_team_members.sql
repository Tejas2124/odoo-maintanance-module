CREATE TABLE maintenance_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,                   -- users.id
  team_id UUID NOT NULL REFERENCES maintenance_teams(id),
  role TEXT DEFAULT 'TECHNICIAN',           -- TECHNICIAN | MANAGER
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, team_id)
);
