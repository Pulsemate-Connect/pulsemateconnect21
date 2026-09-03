-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION M2: MIGRATE USERS TO RBAC SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════
-- Status: CRITICAL ONLY
-- Risk: MEDIUM (data migration, but keeps old columns)
-- Rollback: Truncate new tables, application uses old user.role field
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: SEED SYSTEM ROLES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "roles" ("name", "display_name", "description", "is_system", "is_active") VALUES
  ('PATIENT', 'Patient', 'Healthcare patient', true, true),
  ('DOCTOR', 'Doctor', 'Healthcare provider', true, true),
  ('CLINIC_OWNER', 'Clinic Owner', 'Clinic business owner', true, true),
  ('RECEPTIONIST', 'Receptionist', 'Clinic front desk staff', true, true),
  ('ROOT', 'Root Admin', 'System root administrator', true, true),
  ('SUPER_ADMIN', 'Super Admin', 'Platform administrator', true, true),
  ('SUPPORT', 'Support', 'Customer support staff', true, true),
  ('FINANCE', 'Finance', 'Finance team member', true, true)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: SEED CORE PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "permissions" ("resource", "action", "scope", "display_name", "description", "is_system") VALUES
  -- Patient permissions
  ('appointment', 'create', 'OWN', 'Create Appointment', 'Create own appointment', true),
  ('appointment', 'read', 'OWN', 'View Appointments', 'View own appointments', true),
  ('appointment', 'cancel', 'OWN', 'Cancel Appointment', 'Cancel own appointment', true),
  ('profile', 'update', 'OWN', 'Update Profile', 'Update own profile', true),
  ('prescription', 'read', 'OWN', 'View Prescriptions', 'View own prescriptions', true),
  
  -- Doctor permissions
  ('appointment', 'read', 'CLINIC', 'View Clinic Appointments', 'View clinic appointments', true),
  ('appointment', 'update', 'CLINIC', 'Update Appointments', 'Update appointment status', true),
  ('prescription', 'create', 'CLINIC', 'Create Prescriptions', 'Create prescriptions', true),
  ('queue', 'manage', 'CLINIC', 'Manage Queue', 'Manage clinic queue', true),
  ('patient', 'read', 'CLINIC', 'View Patients', 'View patient records', true),
  
  -- Clinic Owner permissions
  ('clinic', 'create', 'OWN', 'Create Clinic', 'Create clinic', true),
  ('clinic', 'update', 'OWN', 'Update Clinic', 'Update own clinic', true),
  ('clinic', 'read', 'OWN', 'View Clinic', 'View own clinic details', true),
  ('staff', 'manage', 'CLINIC', 'Manage Staff', 'Manage clinic staff', true),
  ('doctor', 'invite', 'CLINIC', 'Invite Doctors', 'Invite doctors to clinic', true),
  ('appointment', 'read', 'CLINIC', 'View Appointments', 'View clinic appointments', true),
  ('payment', 'read', 'CLINIC', 'View Payments', 'View clinic payments', true),
  
  -- Receptionist permissions
  ('patient', 'create', 'CLINIC', 'Register Patients', 'Register new patients', true),
  ('appointment', 'create', 'CLINIC', 'Book Appointments', 'Book appointments for patients', true),
  ('queue', 'manage', 'CLINIC', 'Manage Queue', 'Manage clinic queue', true),
  ('appointment', 'read', 'CLINIC', 'View Appointments', 'View clinic appointments', true),
  
  -- Admin permissions (ROOT, SUPER_ADMIN)
  ('user', 'read', 'ALL', 'View All Users', 'View all users', true),
  ('user', 'update', 'ALL', 'Update Users', 'Update any user', true),
  ('user', 'delete', 'ALL', 'Delete Users', 'Delete users', true),
  ('clinic', 'approve', 'ALL', 'Approve Clinics', 'Approve clinic registrations', true),
  ('clinic', 'read', 'ALL', 'View All Clinics', 'View all clinics', true),
  ('doctor', 'approve', 'ALL', 'Approve Doctors', 'Approve doctor registrations', true),
  ('payment', 'read', 'ALL', 'View All Payments', 'View all payments', true),
  ('system', 'admin', 'ALL', 'System Admin', 'Full system administration', true)
ON CONFLICT (resource, action, scope) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: ASSIGN PERMISSIONS TO ROLES
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  patient_role_id UUID;
  doctor_role_id UUID;
  owner_role_id UUID;
  receptionist_role_id UUID;
  root_role_id UUID;
  super_admin_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO patient_role_id FROM roles WHERE name = 'PATIENT';
  SELECT id INTO doctor_role_id FROM roles WHERE name = 'DOCTOR';
  SELECT id INTO owner_role_id FROM roles WHERE name = 'CLINIC_OWNER';
  SELECT id INTO receptionist_role_id FROM roles WHERE name = 'RECEPTIONIST';
  SELECT id INTO root_role_id FROM roles WHERE name = 'ROOT';
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN';
  
  -- PATIENT permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT patient_role_id, id FROM permissions 
  WHERE (resource = 'appointment' AND action IN ('create', 'read', 'cancel') AND scope = 'OWN')
     OR (resource = 'profile' AND action = 'update' AND scope = 'OWN')
     OR (resource = 'prescription' AND action = 'read' AND scope = 'OWN')
  ON CONFLICT DO NOTHING;
  
  -- DOCTOR permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT doctor_role_id, id FROM permissions 
  WHERE (resource IN ('appointment', 'prescription', 'queue', 'patient') AND scope = 'CLINIC')
  ON CONFLICT DO NOTHING;
  
  -- CLINIC_OWNER permissions (inherits some doctor permissions + management)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT owner_role_id, id FROM permissions 
  WHERE (resource IN ('clinic', 'staff', 'doctor', 'appointment', 'payment') AND scope IN ('OWN', 'CLINIC'))
  ON CONFLICT DO NOTHING;
  
  -- RECEPTIONIST permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT receptionist_role_id, id FROM permissions 
  WHERE (resource IN ('patient', 'appointment', 'queue') AND scope = 'CLINIC')
  ON CONFLICT DO NOTHING;
  
  -- ROOT gets ALL permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT root_role_id, id FROM permissions
  ON CONFLICT DO NOTHING;
  
  -- SUPER_ADMIN gets ALL permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT super_admin_role_id, id FROM permissions
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '✅ Step 3: Permissions assigned to roles';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: MIGRATE EXISTING USERS TO user_roles TABLE
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  -- Migrate users.role → user_roles (primary role)
  INSERT INTO "user_roles" (
    "user_id",
    "role_id",
    "is_primary",
    "status",
    "requested_at",
    "approved_at"
  )
  SELECT 
    u.id AS user_id,
    r.id AS role_id,
    true AS is_primary,
    CASE 
      WHEN u."approvalStatus"::TEXT = 'VERIFIED' THEN 'APPROVED'
      WHEN u."approvalStatus"::TEXT = 'PENDING' THEN 'PENDING'
      WHEN u."approvalStatus"::TEXT = 'UNDER_REVIEW' THEN 'UNDER_REVIEW'
      WHEN u."approvalStatus"::TEXT = 'REJECTED' THEN 'REJECTED'
      ELSE 'APPROVED'
    END AS status,
    u."createdAt" AS requested_at,
    CASE 
      WHEN u."approvalStatus"::TEXT = 'VERIFIED' THEN u."updatedAt"
      ELSE NULL
    END AS approved_at
  FROM users u
  JOIN roles r ON r.name = u.role::TEXT
  WHERE u.role IS NOT NULL
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE '✅ Step 4: Migrated % user-role mappings from users.role', migrated_count;
  
  -- Migrate users.roles[] array → user_roles (secondary roles)
  INSERT INTO "user_roles" (
    "user_id",
    "role_id",
    "is_primary",
    "status",
    "requested_at",
    "approved_at"
  )
  SELECT DISTINCT
    u.id AS user_id,
    r.id AS role_id,
    CASE WHEN role_name = u."primaryRole" THEN true ELSE false END AS is_primary,
    'APPROVED' AS status,
    u."createdAt" AS requested_at,
    u."updatedAt" AS approved_at
  FROM users u
  CROSS JOIN LATERAL unnest(u.roles) AS role_name
  JOIN roles r ON r.name = role_name
  WHERE u.roles IS NOT NULL 
    AND array_length(u.roles, 1) > 0
    AND NOT EXISTS (
      -- Don't create duplicate if already exists from step above
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = u.id AND ur.role_id = r.id
    );
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE '✅ Step 4b: Migrated % secondary roles from users.roles[]', migrated_count;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  role_count INTEGER;
  permission_count INTEGER;
  user_role_count INTEGER;
  role_permission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO permission_count FROM permissions;
  SELECT COUNT(*) INTO user_role_count FROM user_roles;
  SELECT COUNT(*) INTO role_permission_count FROM role_permissions;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ M2 MIGRATION COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Roles created: %', role_count;
  RAISE NOTICE '  • Permissions created: %', permission_count;
  RAISE NOTICE '  • User-role mappings: %', user_role_count;
  RAISE NOTICE '  • Role-permission mappings: %', role_permission_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: Old columns (role, roles, primaryRole) still exist';
  RAISE NOTICE '   Application can read from both old and new tables during transition';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Update application code to use user_roles table';
END $$;

-- Show user-role mappings
SELECT 
  u.email,
  u.role::TEXT AS old_role,
  r.name AS new_role,
  ur.is_primary,
  ur.status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email, ur.is_primary DESC;
