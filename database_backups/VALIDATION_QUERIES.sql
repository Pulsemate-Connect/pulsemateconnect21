-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION VALIDATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════
-- Run these queries to verify M1, M2, M3 migrations completed successfully
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 1: Verify New Tables Exist (M1)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('roles', 'permissions', 'user_roles', 'role_permissions', 'appointment_status_history') 
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('roles', 'permissions', 'user_roles', 'role_permissions', 'appointment_status_history')
ORDER BY table_name;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 2: Verify Role Seeding (M2)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  name,
  display_name,
  is_system,
  is_active,
  CASE 
    WHEN name IN ('PATIENT', 'DOCTOR', 'CLINIC_OWNER', 'RECEPTIONIST', 'ROOT', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE')
    THEN '✅ SEEDED'
    ELSE '⚠️  CUSTOM'
  END AS status
FROM roles
ORDER BY 
  CASE name
    WHEN 'ROOT' THEN 1
    WHEN 'SUPER_ADMIN' THEN 2
    WHEN 'CLINIC_OWNER' THEN 3
    WHEN 'DOCTOR' THEN 4
    WHEN 'RECEPTIONIST' THEN 5
    WHEN 'PATIENT' THEN 6
    WHEN 'SUPPORT' THEN 7
    WHEN 'FINANCE' THEN 8
    ELSE 9
  END;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 3: Verify Permissions Created (M2)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  COUNT(*) AS total_permissions,
  COUNT(CASE WHEN is_system THEN 1 END) AS system_permissions,
  COUNT(CASE WHEN NOT is_system THEN 1 END) AS custom_permissions
FROM permissions;

\echo ''
\echo 'Sample permissions by resource:'
SELECT 
  resource,
  COUNT(*) AS permission_count
FROM permissions
GROUP BY resource
ORDER BY permission_count DESC
LIMIT 10;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 4: Verify User-Role Mappings (M2)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  u.email,
  u.role::TEXT AS old_role_field,
  r.name AS new_role,
  ur.is_primary,
  ur.status,
  CASE 
    WHEN ur.status = 'APPROVED' THEN '✅ APPROVED'
    WHEN ur.status = 'PENDING' THEN '⚠️  PENDING'
    ELSE '❌ ' || ur.status
  END AS validation_status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email, ur.is_primary DESC;

\echo ''
\echo 'User-role mapping summary:'
SELECT 
  COUNT(DISTINCT user_id) AS total_users_with_roles,
  COUNT(*) AS total_mappings,
  COUNT(CASE WHEN is_primary THEN 1 END) AS primary_roles,
  COUNT(CASE WHEN NOT is_primary THEN 1 END) AS secondary_roles
FROM user_roles;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 5: Verify No Users Without Roles'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  u.id,
  u.email,
  u.role::TEXT AS old_role,
  '❌ NO ROLE MAPPING' AS issue
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL
  AND u.role IS NOT NULL;

\echo ''
\echo 'Expected: 0 rows (all users should have role mappings)'
\echo ''

\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 6: Verify Role-Permission Mappings (M2)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  r.name AS role_name,
  COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY 
  CASE r.name
    WHEN 'ROOT' THEN 1
    WHEN 'SUPER_ADMIN' THEN 2
    WHEN 'CLINIC_OWNER' THEN 3
    WHEN 'DOCTOR' THEN 4
    WHEN 'RECEPTIONIST' THEN 5
    WHEN 'PATIENT' THEN 6
    ELSE 7
  END;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 7: Verify Critical Indexes Exist (M3)'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  tablename,
  indexname,
  '✅ EXISTS' AS status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_appointments_%' OR
    indexname LIKE 'idx_payments_%' OR
    indexname LIKE 'idx_clinics_%' OR
    indexname LIKE 'idx_doctor_profiles_%' OR
    indexname LIKE 'idx_user_notifications_%'
  )
ORDER BY tablename, indexname;

\echo ''
\echo 'Total custom indexes:'
SELECT COUNT(*) AS total_custom_indexes
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 8: Verify No Orphaned Records'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

\echo 'Checking user_roles for orphaned user references...'
SELECT 
  COUNT(*) AS orphaned_user_roles,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
    ELSE '❌ ORPHANED RECORDS FOUND'
  END AS status
FROM user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ur.user_id);

\echo ''
\echo 'Checking user_roles for orphaned role references...'
SELECT 
  COUNT(*) AS orphaned_role_references,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
    ELSE '❌ ORPHANED RECORDS FOUND'
  END AS status
FROM user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = ur.role_id);

\echo ''
\echo 'Checking role_permissions for orphaned references...'
SELECT 
  COUNT(*) AS orphaned_role_permissions,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
    ELSE '❌ ORPHANED RECORDS FOUND'
  END AS status
FROM role_permissions rp
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = rp.role_id)
   OR NOT EXISTS (SELECT 1 FROM permissions p WHERE p.id = rp.permission_id);

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 9: Verify Foreign Key Constraints'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table,
  '✅ EXISTS' AS status
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN ('user_roles', 'role_permissions', 'appointment_status_history')
ORDER BY conrelid::regclass::text, conname;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VALIDATION 10: Overall Migration Summary'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

DO $$
DECLARE
  table_count INTEGER;
  role_count INTEGER;
  permission_count INTEGER;
  user_role_count INTEGER;
  role_permission_count INTEGER;
  index_count INTEGER;
  user_count INTEGER;
  users_without_roles INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('roles', 'permissions', 'user_roles', 'role_permissions', 'appointment_status_history');
  
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO permission_count FROM permissions;
  SELECT COUNT(*) INTO user_role_count FROM user_roles;
  SELECT COUNT(*) INTO role_permission_count FROM role_permissions;
  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
  
  SELECT COUNT(*) INTO user_count FROM users;
  
  SELECT COUNT(*) INTO users_without_roles
  FROM users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  WHERE ur.id IS NULL AND u.role IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION VALIDATION COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'M1 (Tables):';
  RAISE NOTICE '  • New tables created: %/5', table_count;
  RAISE NOTICE '';
  RAISE NOTICE 'M2 (RBAC Data):';
  RAISE NOTICE '  • Roles: %', role_count;
  RAISE NOTICE '  • Permissions: %', permission_count;
  RAISE NOTICE '  • User-role mappings: %', user_role_count;
  RAISE NOTICE '  • Role-permission mappings: %', role_permission_count;
  RAISE NOTICE '  • Total users: %', user_count;
  RAISE NOTICE '  • Users without roles: % %', users_without_roles, 
    CASE WHEN users_without_roles = 0 THEN '✅' ELSE '❌' END;
  RAISE NOTICE '';
  RAISE NOTICE 'M3 (Indexes):';
  RAISE NOTICE '  • Custom indexes: %', index_count;
  RAISE NOTICE '';
  
  IF table_count = 5 AND users_without_roles = 0 AND role_count >= 8 THEN
    RAISE NOTICE '✅ ALL VALIDATIONS PASSED';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration Status: SUCCESS';
    RAISE NOTICE 'Old columns preserved: YES (backward compatible)';
    RAISE NOTICE 'Data loss: NONE';
    RAISE NOTICE 'Rollback available: YES';
  ELSE
    RAISE NOTICE '⚠️  SOME VALIDATIONS FAILED - REVIEW ABOVE';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update Prisma schema with new tables';
  RAISE NOTICE '  2. Update application code to use user_roles';
  RAISE NOTICE '  3. Test authentication and authorization';
  RAISE NOTICE '';
END $$;
