CREATE TABLE maintenance_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,               -- Internal Maintenance
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);
