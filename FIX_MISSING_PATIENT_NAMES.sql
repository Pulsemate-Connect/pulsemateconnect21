-- Fix missing patient names in users table

-- Step 1: Check how many users have NULL or empty names
SELECT 
  role,
  COUNT(*) as count_with_missing_name
FROM users
WHERE name IS NULL OR name = '' OR name = 'Patient'
GROUP BY role;

-- Step 2: Find patients with mobile numbers but no names
SELECT 
  id,
  name,
  mobile,
  email,
  role,
  "createdAt"
FROM users
WHERE role = 'PATIENT' 
  AND (name IS NULL OR name = '' OR name = 'Patient')
ORDER BY "createdAt" DESC
LIMIT 20;

-- Step 3: Update specific patient (mobile 9380328154)
-- Replace 'ACTUAL_NAME_HERE' with the real patient name
UPDATE users
SET name = 'Patient Name Here'  -- ← CHANGE THIS
WHERE mobile LIKE '%9380328154%' OR mobile LIKE '%380328154%';

-- Step 4: Verify the update
SELECT id, name, mobile, role
FROM users
WHERE mobile LIKE '%9380328154%' OR mobile LIKE '%380328154%';

-- Step 5 (Optional): Set default name for all patients with missing names
-- This will set "Patient - <mobile>" as the name
UPDATE users
SET name = CONCAT('Patient - ', SUBSTRING(mobile, -10, 10))
WHERE role = 'PATIENT' 
  AND (name IS NULL OR name = '' OR name = 'Patient')
  AND mobile IS NOT NULL;

-- Step 6: Verify all patients now have names
SELECT 
  COUNT(*) as patients_with_names
FROM users
WHERE role = 'PATIENT' AND name IS NOT NULL AND name != '';
