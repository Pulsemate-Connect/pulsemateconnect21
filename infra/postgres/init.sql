-- PulseMate PostgreSQL Production Init
-- Runs only on first DB container start

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Read-only user for monitoring/reporting
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pulsemate_readonly') THEN
    CREATE USER pulsemate_readonly WITH PASSWORD 'CHANGE_ME_READONLY_PASSWORD';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE pulsemate_db TO pulsemate_readonly;
GRANT USAGE ON SCHEMA public TO pulsemate_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pulsemate_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO pulsemate_readonly;
