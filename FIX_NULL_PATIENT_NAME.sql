-- Fix: Patient name is NULL in database even though admin shows "Sakshi"
-- Root cause: The name field is actually NULL in the users table

-- Step 1: Verify the current state
SELECT 
  id, 
  name, 
  mobile,
  CASE 
    WHEN name IS NULL THEN '❌ NULL'
    WHEN name = '' THEN '❌ EMPTY'
    ELSE '✅ Has value'
  END as name_status
FROM users 
WHERE mobile = '9999999999';

-- Step 2: Update the name to "Sakshi"
UPDATE users 
SET name = 'Sakshi'
WHERE mobile = '9999999999';

-- Step 3: Verify the fix
SELECT 
  id, 
  name, 
  mobile,
  'After update' as status
FROM users 
WHERE mobile = '9999999999';

-- Step 4: Check if there are other users with NULL names
SELECT 
  id,
  mobile,
  name,
  role,
  "createdAt"
FROM users
WHERE name IS NULL OR name = '' OR name = 'Patient'
ORDER BY "createdAt" DESC
LIMIT 10;
