-- ═════════════════════════════════════════════════════════════════════════════
--  FIX PRODUCTION DATABASE - "Fully Booked" Issue
-- ═════════════════════════════════════════════════════════════════════════════
--  
--  ISSUE: Clinic sessions have incorrect timing (Morning Session at 4:51 PM)
--         Doctor availability not configured → slots API returns empty array
--
--  RUN THIS AGAINST PRODUCTION DATABASE: pulsemate_db
--  
--  BACKUP FIRST: pg_dump pulsemate_db > backup_before_session_fix.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 1: Diagnostic Queries (View Current State)
-- ───────────────────────────────────────────────────────────────────────────

SELECT '=== CURRENT CLINIC SESSIONS ===' AS section;
SELECT 
  cs.id,
  c.name AS clinic_name,
  cs."sessionType",
  cs.name AS session_name,
  cs."startTime",
  cs."endTime",
  cs."maxPatients",
  cs.enabled,
  cs."createdAt"
FROM clinic_sessions cs
JOIN clinics c ON cs."clinicId" = c.id
ORDER BY c.name, cs."sortOrder";

SELECT '=== CURRENT DOCTOR AVAILABILITY ===' AS section;
SELECT 
  da.id,
  u.name AS doctor_name,
  c.name AS clinic_name,
  CASE da."dayOfWeek"
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END AS day,
  da."startTime",
  da."endTime",
  da."slotDurationMin",
  da."maxPatients",
  da."isActive"
FROM "DoctorAvailability" da
JOIN "DoctorProfile" dp ON da."doctorId" = dp.id
JOIN users u ON dp."userId" = u.id
JOIN clinics c ON da."clinicId" = c.id
ORDER BY u.name, c.name, da."dayOfWeek";

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 2: Fix Clinic Session Timings
-- ───────────────────────────────────────────────────────────────────────────

-- Fix Morning Sessions (should be 8 AM - 12 PM, not 4:51 PM - 6:53 PM)
UPDATE clinic_sessions
SET 
  "startTime" = '08:00',
  "endTime" = '12:00',
  "updatedAt" = NOW()
WHERE "sessionType" = 'MORNING'
  AND ("startTime" NOT BETWEEN '06:00' AND '10:00' 
       OR "endTime" NOT BETWEEN '11:00' AND '14:00');

-- Fix Afternoon Sessions (should be 12 PM - 5 PM)
UPDATE clinic_sessions
SET 
  "startTime" = '12:00',
  "endTime" = '17:00',
  "updatedAt" = NOW()
WHERE "sessionType" = 'AFTERNOON'
  AND ("startTime" NOT BETWEEN '11:00' AND '14:00' 
       OR "endTime" NOT BETWEEN '16:00' AND '19:00');

-- Fix Evening Sessions (should be 5 PM - 9 PM)
UPDATE clinic_sessions
SET 
  "startTime" = '17:00',
  "endTime" = '21:00',
  "updatedAt" = NOW()
WHERE "sessionType" = 'EVENING'
  AND ("startTime" NOT BETWEEN '16:00' AND '19:00' 
       OR "endTime" NOT BETWEEN '20:00' AND '23:00');

-- Report what was fixed
SELECT 
  '✅ Fixed ' || COUNT(*) || ' clinic sessions' AS result
FROM clinic_sessions
WHERE "updatedAt" > NOW() - INTERVAL '1 minute';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 3: Create Doctor Availability (If Missing)
-- ───────────────────────────────────────────────────────────────────────────

-- First, check which doctors need availability configured
SELECT 
  '⚠️ Doctors without DoctorAvailability:' AS section;
SELECT 
  dp.id AS doctor_id,
  u.name AS doctor_name,
  c.id AS clinic_id,
  c.name AS clinic_name
FROM "DoctorProfile" dp
JOIN users u ON dp."userId" = u.id
CROSS JOIN LATERAL (
  SELECT dc."clinicId"
  FROM "DoctorClinic" dc
  WHERE dc."doctorId" = dp.id AND dc."isActive" = true
) dc_active
JOIN clinics c ON dc_active."clinicId" = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM "DoctorAvailability" da
  WHERE da."doctorId" = dp.id AND da."clinicId" = c.id
)
ORDER BY u.name, c.name;

-- Create DoctorAvailability for all active doctor-clinic pairs (all 7 days)
-- This creates Monday-Friday 9 AM - 6 PM with 15-minute slots
INSERT INTO "DoctorAvailability" (
  "id", "doctorId", "clinicId", "dayOfWeek",
  "startTime", "endTime", "slotDurationMin",
  "maxPatients", "isActive", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  dp.id AS "doctorId",
  dc."clinicId",
  days.day_num AS "dayOfWeek",
  '09:00' AS "startTime",
  '18:00' AS "endTime",
  15 AS "slotDurationMin",
  30 AS "maxPatients",
  true AS "isActive",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM "DoctorProfile" dp
JOIN "DoctorClinic" dc ON dc."doctorId" = dp.id AND dc."isActive" = true
CROSS JOIN (
  SELECT generate_series(1, 5) AS day_num  -- Monday to Friday
) days
WHERE NOT EXISTS (
  SELECT 1 FROM "DoctorAvailability" da
  WHERE da."doctorId" = dp.id 
    AND da."clinicId" = dc."clinicId"
    AND da."dayOfWeek" = days.day_num
);

-- Report results
SELECT 
  '✅ Created ' || COUNT(*) || ' DoctorAvailability records' AS result
FROM "DoctorAvailability"
WHERE "createdAt" > NOW() - INTERVAL '1 minute';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 4: Ensure DoctorClinic Fallback is Configured
-- ───────────────────────────────────────────────────────────────────────────

-- Update DoctorClinic records to have proper schedule fallback
UPDATE "DoctorClinic"
SET 
  "startTime" = COALESCE("startTime", '09:00'),
  "endTime" = COALESCE("endTime", '18:00'),
  "avgConsultationMins" = COALESCE("avgConsultationMins", 15),
  "availableDays" = COALESCE(
    "availableDays", 
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  ),
  "updatedAt" = NOW()
WHERE "isActive" = true
  AND ("startTime" IS NULL OR "endTime" IS NULL OR "avgConsultationMins" IS NULL);

SELECT 
  '✅ Updated ' || COUNT(*) || ' DoctorClinic records' AS result
FROM "DoctorClinic"
WHERE "updatedAt" > NOW() - INTERVAL '1 minute';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 5: Verification (Check Final State)
-- ───────────────────────────────────────────────────────────────────────────

SELECT '=== VERIFICATION: CLINIC SESSIONS ===' AS section;
SELECT 
  c.name AS clinic,
  cs."sessionType",
  cs."startTime" || ' - ' || cs."endTime" AS time_range,
  CASE 
    WHEN cs."sessionType" = 'MORNING' AND cs."startTime" BETWEEN '06:00' AND '10:00' THEN '✅'
    WHEN cs."sessionType" = 'AFTERNOON' AND cs."startTime" BETWEEN '11:00' AND '14:00' THEN '✅'
    WHEN cs."sessionType" = 'EVENING' AND cs."startTime" BETWEEN '16:00' AND '19:00' THEN '✅'
    ELSE '⚠️ CHECK TIMING'
  END AS status
FROM clinic_sessions cs
JOIN clinics c ON cs."clinicId" = c.id
WHERE cs.enabled = true
ORDER BY c.name, cs."sortOrder";

SELECT '=== VERIFICATION: DOCTOR AVAILABILITY COUNT ===' AS section;
SELECT 
  u.name AS doctor,
  c.name AS clinic,
  COUNT(da.id) AS days_configured
FROM "DoctorProfile" dp
JOIN users u ON dp."userId" = u.id
JOIN "DoctorClinic" dc ON dc."doctorId" = dp.id AND dc."isActive" = true
JOIN clinics c ON dc."clinicId" = c.id
LEFT JOIN "DoctorAvailability" da ON da."doctorId" = dp.id AND da."clinicId" = c.id
GROUP BY u.name, c.name
ORDER BY u.name, c.name;

SELECT '=== VERIFICATION: DOCTOR CLINIC FALLBACK ===' AS section;
SELECT 
  u.name AS doctor,
  c.name AS clinic,
  dc."startTime",
  dc."endTime",
  dc."avgConsultationMins",
  array_length(dc."availableDays", 1) AS num_days,
  CASE 
    WHEN dc."startTime" IS NOT NULL AND dc."endTime" IS NOT NULL THEN '✅ Configured'
    ELSE '⚠️ Missing Schedule'
  END AS status
FROM "DoctorClinic" dc
JOIN "DoctorProfile" dp ON dc."doctorId" = dp.id
JOIN users u ON dp."userId" = u.id
JOIN clinics c ON dc."clinicId" = c.id
WHERE dc."isActive" = true
ORDER BY u.name, c.name;

-- ───────────────────────────────────────────────────────────────────────────
-- EXPECTED RESULTS
-- ───────────────────────────────────────────────────────────────────────────
--
-- After running this script, you should see:
--
-- ✅ Clinic sessions have correct timings:
--    - Morning: 08:00 - 12:00
--    - Afternoon: 12:00 - 17:00  
--    - Evening: 17:00 - 21:00
--
-- ✅ Doctor availability configured for Monday-Friday (or all days as needed)
--
-- ✅ DoctorClinic fallback schedules are set
--
-- ✅ Slots API will now return available time slots
--
-- ✅ Booking screen will show "Slot: 9:15 AM" instead of "Fully Booked"
--
-- ───────────────────────────────────────────────────────────────────────────

