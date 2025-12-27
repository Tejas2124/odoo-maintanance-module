-- User roles for access control
CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'USER'
);

CREATE TYPE equipment_used_by_type AS ENUM (
  'EMPLOYEE',
  'DEPARTMENT'
);

CREATE TYPE maintenance_request_type AS ENUM (
  'CORRECTIVE',
  'PREVENTIVE'
);

CREATE TYPE maintenance_request_status AS ENUM (
  'NEW',
  'IN_PROGRESS',
  'REPAIRED',
  'SCRAP'
);

