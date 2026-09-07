-- =====================================================================
-- COMPLETE FIX: Patient names showing as "Patient" in receptionist queue
-- =====================================================================
-- Problem: User record with mobile 9999999999 has name = NULL in database
-- Impact: Queue shows "Patient" instead of actual name
-- Root cause: Registration might not capture name, or name was never set
-- =====================================================================

-- STEP 1: Verify the problem
-- Expected: name should be populated, but currently is NULL
SELECT 
  id, 
  name, 
  mobile,
  role,
  "createdAt",
  CASE 
    WHEN name IS NULL THEN '❌ NULL (Will show "Patient" in UI)'
    WHEN name = '' THEN '❌ EMPTY (Will show "Patient" in UI)'
    WHEN name = 'Patient' THEN '⚠️  Default value'
    ELSE '✅ Has proper name'
  END as name_status
FROM users 
WHERE mobile = '9999999999';

-- STEP 2: Fix the specific user (mobile 9999999999)
-- Set name to "Sakshi" as requested by user
UPDATE users 
SET 
  name = 'Sakshi',
  "updatedAt" = NOW()
WHERE mobile = '9999999999'
AND (name IS NULL OR name = '' OR name = 'Patient');

-- STEP 3: Verify the fix worked
SELECT 
  id, 
  name, 
  mobile,
  'After fix' as status
FROM users 
WHERE mobile = '9999999999';

-- STEP 4: Find and list ALL users with missing/default names
-- These will all show as "Patient" in the queue
SELECT 
  id,
  mobile,
  name,
  role,
  "createdAt"
FROM users
WHERE (name IS NULL OR name = '' OR name = 'Patient')
  AND role = 'PATIENT'
ORDER BY "createdAt" DESC
LIMIT 20;

-- STEP 5: (Optional) Fix all users with mobile 9380328154
-- This mobile already has name "Sahil" so should be fine
SELECT 
  id, 
  name, 
  mobile
FROM users 
WHERE mobile = '9380328154';

-- STEP 6: Verify queue will now show correct names
-- Join queue_items with users to see what names will display
SELECT 
  qi."queueNumber",
  qi."patientId",
  u.name as patient_name,
  u.mobile as patient_mobile,
  COALESCE(u.name, 'Patient') as displayed_name,
  qi.status,
  qi."createdAt"
FROM queue_items qi
LEFT JOIN users u ON u.id = qi."patientId"
WHERE qi."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY qi."queueNumber";

-- =====================================================================
-- NOTES:
-- =====================================================================
-- 1. Frontend code uses: item.patient?.name || 'Patient'
--    - If name is NULL, empty, or undefined → shows "Patient"
--    - If name has value → shows the actual name
--
-- 2. Backend API correctly includes patient names in response:
--    - patient: { select: { id: true, name: true, mobile: true } }
--    - The JOIN is working correctly
--
-- 3. Root cause is data quality:
--    - Some users register without providing their name
--    - Or the registration form doesn't require name field
--    - Name field should be required during registration
--
-- 4. The admin dashboard shows "Unknown" for NULL names, not "Sakshi"
--    - Admin code: patientName: p.patient?.name || 'Unknown'
--    - So admin never displayed "Sakshi" for this user
--
-- 5. After this fix:
--    - Mobile 9999999999 will show "Sakshi" in queue
--    - Mobile 9380328154 already shows "Sahil" correctly
--    - Other users with NULL names will still show "Patient"
-- =====================================================================
