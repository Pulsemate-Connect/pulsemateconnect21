-- =====================================================================
-- Mark Migration as Complete in Prisma
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Insert the migration record into Prisma's tracking table
INSERT INTO "_prisma_migrations" (
  id,
  checksum,
  finished_at,
  migration_name,
  logs,
  rolled_back_at,
  started_at,
  applied_steps_count
)
VALUES (
  gen_random_uuid(),
  '8e5f7a9c3d2b1e6f4a8c5d9e7f2b3a6c1d8e4f9a2b5c8d1e4f7a9c2b5d8e1f4a7',
  NOW(),
  '20260906_add_production_session_fields',
  NULL,
  NULL,
  NOW(),
  1
)
ON CONFLICT (migration_name) DO NOTHING;

-- Verify it was added
SELECT migration_name, finished_at, applied_steps_count 
FROM "_prisma_migrations" 
WHERE migration_name = '20260906_add_production_session_fields';
