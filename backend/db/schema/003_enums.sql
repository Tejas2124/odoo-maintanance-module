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
