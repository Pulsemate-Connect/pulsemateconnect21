-- ═══════════════════════════════════════════════════════════════════════════
-- Clear All Data Except Admin Accounts
-- ═══════════════════════════════════════════════════════════════════════════
-- This script removes all user data (patients, doctors, clinic owners)
-- while preserving the 2 SUPER_ADMIN accounts:
-- 1. shubham27052002@gmail.com
-- 2. sahilnaik1515@gmail.com
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Identify Admin User IDs (These will be preserved)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM users
    WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
      AND role = 'SUPER_ADMIN';
    
    IF admin_count < 2 THEN
        RAISE EXCEPTION 'ERROR: Less than 2 admin accounts found. Aborting to prevent data loss.';
    END IF;
    
    RAISE NOTICE '✅ Found % admin accounts to preserve', admin_count;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Delete Related Data for Non-Admin Users
-- ─────────────────────────────────────────────────────────────────────────────

-- Delete appointments and related data
DELETE FROM appointment_notes
WHERE "appointmentId" IN (
    SELECT id FROM appointments
    WHERE "patientId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM appointment_cancellations
WHERE "appointmentId" IN (
    SELECT id FROM appointments
    WHERE "patientId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM queue_entries
WHERE "appointmentId" IN (
    SELECT id FROM appointments
    WHERE "patientId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM payments
WHERE "appointmentId" IN (
    SELECT id FROM appointments
    WHERE "patientId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM appointments
WHERE "patientId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- Delete clinic-related data
DELETE FROM clinic_doctors
WHERE "clinicId" IN (
    SELECT id FROM clinics
    WHERE "ownerId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM clinic_receptionists
WHERE "clinicId" IN (
    SELECT id FROM clinics
    WHERE "ownerId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM clinic_reviews
WHERE "clinicId" IN (
    SELECT id FROM clinics
    WHERE "ownerId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM clinic_schedule_breaks
WHERE "clinicScheduleId" IN (
    SELECT id FROM clinic_schedules
    WHERE "clinicId" IN (
        SELECT id FROM clinics
        WHERE "ownerId" NOT IN (
            SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
        )
    )
);

DELETE FROM clinic_schedule_sessions
WHERE "clinicScheduleId" IN (
    SELECT id FROM clinic_schedules
    WHERE "clinicId" IN (
        SELECT id FROM clinics
        WHERE "ownerId" NOT IN (
            SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
        )
    )
);

DELETE FROM clinic_schedules
WHERE "clinicId" IN (
    SELECT id FROM clinics
    WHERE "ownerId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM clinics
WHERE "ownerId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- Delete doctor-related data
DELETE FROM doctor_unavailabilities
WHERE "doctorId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

DELETE FROM doctor_schedules
WHERE "doctorProfileId" IN (
    SELECT id FROM doctor_profiles
    WHERE "userId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM doctor_schedule_exceptions
WHERE "doctorProfileId" IN (
    SELECT id FROM doctor_profiles
    WHERE "userId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM doctor_invitations
WHERE "clinicId" IN (
    SELECT id FROM clinics
    WHERE "ownerId" NOT IN (
        SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
    )
);

DELETE FROM doctor_profiles
WHERE "userId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- Delete patient-related data
DELETE FROM patient_medical_history
WHERE "patientId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

DELETE FROM patient_profiles
WHERE "userId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- Delete receptionist profiles
DELETE FROM receptionist_profiles
WHERE "userId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- Delete notifications
DELETE FROM notifications
WHERE "userId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

DELETE FROM notification_preferences
WHERE "userId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- Delete sessions (except admin sessions)
DELETE FROM sessions
WHERE "userId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- Delete audit logs for non-admin users (optional - keep if you want history)
-- Uncomment the following line if you want to delete audit logs too:
-- DELETE FROM audit_logs WHERE "userId" NOT IN (SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com'));

-- Delete password reset tokens
DELETE FROM password_reset_tokens
WHERE "userId" NOT IN (
    SELECT id FROM users WHERE email IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Delete Non-Admin Users
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM users
WHERE email NOT IN ('shubham27052002@gmail.com', 'sahilnaik1515@gmail.com');

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Verify Data Cleanup
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    remaining_users INTEGER;
    remaining_admins INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_users FROM users;
    SELECT COUNT(*) INTO remaining_admins FROM users WHERE role = 'SUPER_ADMIN';
    
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Data Cleanup Complete';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE 'Remaining users: %', remaining_users;
    RAISE NOTICE 'Admin accounts preserved: %', remaining_admins;
    RAISE NOTICE '';
    RAISE NOTICE '👤 Admin Accounts:';
    RAISE NOTICE '   1. shubham27052002@gmail.com';
    RAISE NOTICE '   2. sahilnaik1515@gmail.com';
    RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Post-Cleanup Verification Queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify admin accounts
SELECT 
    id,
    name,
    email,
    role,
    "approvalStatus",
    "isActive",
    "isEmailVerified",
    "isPhoneVerified"
FROM users
WHERE role = 'SUPER_ADMIN'
ORDER BY email;

-- Check total records in key tables
SELECT 
    'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'clinics', COUNT(*) FROM clinics
UNION ALL
SELECT 'doctors', COUNT(*) FROM doctor_profiles
UNION ALL
SELECT 'patients', COUNT(*) FROM patient_profiles
UNION ALL
SELECT 'receptionists', COUNT(*) FROM receptionist_profiles
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;
