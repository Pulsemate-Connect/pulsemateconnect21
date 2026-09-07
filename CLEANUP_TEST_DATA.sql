-- Clean up test data
-- Run this in Supabase SQL Editor before re-running seed script

-- Delete users with test numbers (99999999XX)
DELETE FROM users WHERE mobile LIKE '99999999%';

-- Delete test clinics
DELETE FROM clinics WHERE name LIKE 'Test %';

-- Verify cleanup
SELECT 'Users deleted' as action, COUNT(*) as remaining FROM users WHERE mobile LIKE '99999999%';
SELECT 'Clinics deleted' as action, COUNT(*) as remaining FROM clinics WHERE name LIKE 'Test %';
