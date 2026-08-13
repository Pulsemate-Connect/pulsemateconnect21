# Tasks: Unified Multi-Role OTP Authentication

## Epic 1: Database Schema Migration

### Task 1.1: Create user_roles Table
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `2 hours`

Create the new `user_roles` table to support multiple roles per user.

**Subtasks:**
- [ ] Create Prisma migration file for `user_roles` table
- [ ] Add `RoleEnum` type with values: PATIENT, DOCTOR, RECEPTIONIST, CLINIC_OWNER, ADMIN
- [ ] Add unique constraint on `(userId, role)` pair
- [ ] Add indexes on `userId` and `role` columns
- [ ] Test migration on local database
- [ ] Verify table structure matches design spec

**Acceptance Criteria:**
- `user_roles` table exists with correct schema
- Unique constraint prevents duplicate role assignments
- Indexes are created for performance
- Migration runs without errors

**Files to Create/Modify:**
- `backend/prisma/migrations/[timestamp]_create_user_roles/migration.sql`
- `backend/prisma/schema.prisma`

---

### Task 1.2: Data Migration Script
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `3 hours`

Migrate existing `users.role` data into `user_roles` table.

**Subtasks:**
- [ ] Create data migration script
- [ ] Map existing role enum values to new RoleEnum
- [ ] Insert records into `user_roles` for all existing users
- [ ] Handle edge cases (null roles, invalid roles)
- [ ] Verify data integrity after migration
- [ ] Create rollback script

**Acceptance Criteria:**
- All existing users have their role in `user_roles` table
- No data loss during migration
- Row count matches: `SELECT COUNT(*) FROM users` = `SELECT COUNT(*) FROM user_roles`
- Rollback script can restore original state

**Files to Create/Modify:**
- `backend/prisma/migrations/[timestamp]_migrate_user_roles_data/migration.sql`
- `backend/scripts/migrate-user-roles.js`
- `backend/scripts/rollback-user-roles.js`

---

### Task 1.3: Normalize Mobile Numbers
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `4 hours`

Normalize all mobile numbers to +91XXXXXXXXXX format and resolve duplicates.

**Subtasks:**
- [ ] Audit existing mobile number formats
- [ ] Create backup table `users_backup_20260812`
- [ ] Write normalization UPDATE query
- [ ] Identify duplicate mobile numbers
- [ ] Manually resolve duplicates (merge or mark inactive)
- [ ] Run normalization script
- [ ] Verify all mobiles match +91XXXXXXXXXX pattern
- [ ] Document duplicate resolution decisions

**Acceptance Criteria:**
- All mobile numbers start with +91 and have exactly 12 characters
- No duplicate mobile numbers exist
- Backup table created before modifications
- Documentation of any merged/deactivated accounts

**Files to Create/Modify:**
- `backend/scripts/normalize-mobile-numbers.js`
- `backend/scripts/find-duplicate-mobiles.js`
- `MOBILE_NUMBER_MIGRATION_REPORT.md`

---

### Task 1.4: Add Indexes for Performance
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `1 hour`

Add database indexes to optimize multi-role queries.

**Subtasks:**
- [ ] Create index on `user_roles(user_id)`
- [ ] Create index on `user_roles(role)`
- [ ] Create index on `users(mobile)`
- [ ] Create composite index on `otp_verifications(mobile, created_at DESC)`
- [ ] Test query performance before/after indexes
- [ ] Document index strategy

**Acceptance Criteria:**
- All specified indexes exist
- Query performance improved (measure with EXPLAIN ANALYZE)
- No performance regression on writes

**Files to Create/Modify:**
- `backend/prisma/migrations/[timestamp]_add_performance_indexes/migration.sql`

---

## Epic 2: Backend Services Implementation

### Task 2.1: Create RoleService
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `4 hours`

Implement the RoleService to manage multi-role operations.

**Subtasks:**
- [ ] Create `backend/src/services/role.service.js`
- [ ] Implement `getUserRoles(userId)` method
- [ ] Implement `addUserRole(userId, role)` method (idempotent)
- [ ] Implement `userHasRole(userId, role)` method
- [ ] Implement `ensurePatientProfile(userId)` method
- [ ] Implement `getPrimaryRole(userId)` method
- [ ] Add JSDoc documentation for all methods
- [ ] Write unit tests for all methods

**Acceptance Criteria:**
- All methods work correctly
- `addUserRole` is idempotent (calling twice doesn't create duplicates)
- `ensurePatientProfile` creates both role and profile
- Test coverage > 90%

**Files to Create/Modify:**
- `backend/src/services/role.service.js`
- `backend/tests/services/role.service.test.js`

---

### Task 2.2: Create PatientEnrollmentService
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `2 hours`

Service to allow staff roles to enroll as patients.

**Subtasks:**
- [ ] Create `backend/src/services/patient-enrollment.service.js`
- [ ] Implement `enrollAsPatient(userId)` method
- [ ] Implement `canBookAppointments(userId)` method
- [ ] Add logging for audit trail
- [ ] Write unit tests

**Acceptance Criteria:**
- Doctor/Clinic Owner can enroll as Patient
- Enrollment is idempotent
- Audit logs created for enrollment actions

**Files to Create/Modify:**
- `backend/src/services/patient-enrollment.service.js`
- `backend/tests/services/patient-enrollment.service.test.js`

---

### Task 2.3: Update Mobile Normalization Utility
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `2 hours`

Update or create mobile number normalization utility.

**Subtasks:**
- [ ] Check if `backend/src/utils/mobile.js` exists
- [ ] Implement `normalizeMobileNumber(mobile)` function
- [ ] Implement `isValidIndianMobile(mobile)` function
- [ ] Handle edge cases (null, empty, invalid formats)
- [ ] Write comprehensive unit tests
- [ ] Update existing code to use this utility

**Acceptance Criteria:**
- Normalizes 9876543210 → +919876543210
- Normalizes 919876543210 → +919876543210
- Returns +919876543210 unchanged
- Validates Indian mobile format correctly

**Files to Create/Modify:**
- `backend/src/utils/mobile.js`
- `backend/tests/utils/mobile.test.js`

---

### Task 2.4: Implement Unified OTP Send Handler
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `5 hours`

Update sendOtpHandler to work for all roles using Message Central.

**Subtasks:**
- [ ] Update `sendOtpHandler` in `auth.controller.js`
- [ ] Add mobile number normalization
- [ ] Integrate Message Central API for production
- [ ] Support test mode with fixed OTP (123456) for test numbers
- [ ] Store OTP hash in `otp_verifications` table
- [ ] Add rate limiting per mobile number
- [ ] Add comprehensive error handling
- [ ] Write integration tests

**Acceptance Criteria:**
- OTP sent via Message Central in production
- Test mode works with test numbers (9999999999, etc.)
- OTP hash stored securely (bcrypt)
- Rate limiting prevents abuse
- Returns verificationId to frontend

**Files to Create/Modify:**
- `backend/src/controllers/auth.controller.js` (sendOtpHandler)
- `backend/src/services/messagecentral.service.js`
- `backend/tests/integration/auth/send-otp.test.js`

---

### Task 2.5: Implement Unified OTP Verify Handler
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `6 hours`

Update verifyOtpHandler to support multi-role unified identity.

**Subtasks:**
- [ ] Update `verifyOtpHandler` in `auth.controller.js`
- [ ] Find latest non-expired OTP for mobile
- [ ] Verify OTP against stored hash
- [ ] Find existing user OR create new user with PATIENT role
- [ ] Load all user roles from `user_roles` table
- [ ] Create patient profile for new users
- [ ] Generate JWT with roles array
- [ ] Update lastLoginAt timestamp
- [ ] Create audit log entry
- [ ] Return user with all roles and profiles
- [ ] Write comprehensive tests (new user, existing user, invalid OTP)

**Acceptance Criteria:**
- New users created with PATIENT role by default
- Existing users login without creating duplicates
- JWT contains all user roles
- Same mobile never creates duplicate accounts
- Invalid OTP returns 400 error
- Expired OTP returns 400 error

**Files to Create/Modify:**
- `backend/src/controllers/auth.controller.js` (verifyOtpHandler)
- `backend/tests/integration/auth/verify-otp.test.js`

---

### Task 2.6: Update Authentication Middleware
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `4 hours`

Update auth middleware to support multi-role checks.

**Subtasks:**
- [ ] Update `authenticateUser` to load user roles
- [ ] Attach `req.userRoles` array to request
- [ ] Update `requireRole` to check against array
- [ ] Keep existing role check functions (requireDoctor, requireClinicOwner, etc.)
- [ ] Add backward compatibility for legacy `req.user.role`
- [ ] Write unit tests for all middleware functions

**Acceptance Criteria:**
- Multi-role users pass appropriate role checks
- Single-role users still work (backward compatible)
- Admin role has access to all protected routes
- Unauthorized access returns 403

**Files to Create/Modify:**
- `backend/src/middleware/auth.middleware.js`
- `backend/tests/middleware/auth.middleware.test.js`

---

### Task 2.7: Create Workspace Switching Endpoint
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `3 hours`

API endpoint for users to switch between workspaces (roles).

**Subtasks:**
- [ ] Create `POST /api/auth/switch-workspace` route
- [ ] Validate requested role exists for user
- [ ] Issue new JWT with updated primary role
- [ ] Return workspace path for navigation
- [ ] Add audit log entry
- [ ] Write integration tests

**Acceptance Criteria:**
- User can switch to any role they possess
- Attempting invalid role returns 403
- New JWT issued with updated role
- Workspace path returned correctly

**Files to Create/Modify:**
- `backend/src/controllers/auth.controller.js` (switchWorkspaceHandler)
- `backend/src/routes/auth.routes.js`
- `backend/tests/integration/auth/switch-workspace.test.js`

---

### Task 2.8: Update /auth/me Endpoint
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `2 hours`

Update the /auth/me endpoint to return multi-role information.

**Subtasks:**
- [ ] Update `getMeHandler` to include roles array
- [ ] Return all profile objects (patient, doctor, clinicOwner, etc.)
- [ ] Return available workspaces list
- [ ] Update response format per design spec
- [ ] Write integration tests

**Acceptance Criteria:**
- Response includes `roles` array
- Response includes all profiles
- Response includes `availableWorkspaces`
- Backward compatible with existing clients

**Files to Create/Modify:**
- `backend/src/controllers/auth.controller.js` (getMeHandler)
- `backend/tests/integration/auth/me.test.js`

---

### Task 2.9: Deprecate Password Login
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `2 hours`

Add deprecation warning to password login endpoint.

**Subtasks:**
- [ ] Add warning message in `loginHandler` response
- [ ] Log password login usage for monitoring
- [ ] Create admin dashboard metric for password vs OTP usage
- [ ] Prepare communication email template
- [ ] Document deprecation timeline

**Acceptance Criteria:**
- Password login still works but returns deprecation warning
- Usage metrics collected
- Email template ready for user communication

**Files to Create/Modify:**
- `backend/src/controllers/auth.controller.js` (loginHandler)
- `backend/src/services/metrics.service.js`
- `EMAIL_TEMPLATES/password-deprecation.html`

---

## Epic 3: Frontend Implementation

### Task 3.1: Update Auth Store for Multi-Role
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `4 hours`

Update Zustand auth store to support multiple roles and workspaces.

**Subtasks:**
- [ ] Add `roles` array to store state
- [ ] Add `primaryRole` field
- [ ] Add `activeWorkspace` field
- [ ] Implement `switchWorkspace(role)` action
- [ ] Implement `hasRole(role)` helper
- [ ] Implement `getAvailableWorkspaces()` helper
- [ ] Update `setAuth` to handle roles array
- [ ] Update localStorage persistence
- [ ] Write unit tests for store actions

**Acceptance Criteria:**
- Store correctly manages multiple roles
- Workspace switching updates state
- Persistence works across page reloads
- All helper functions work correctly

**Files to Create/Modify:**
- `frontend/src/store/authStore.js`
- `frontend/src/store/__tests__/authStore.test.js`

---

### Task 3.2: Create Unified OTP Login Page
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `5 hours`

Replace password login with OTP-only login flow.

**Subtasks:**
- [ ] Create/update `frontend/src/pages/auth/OTPLogin.jsx`
- [ ] Implement mobile number input step
- [ ] Implement OTP verification step
- [ ] Add mobile number validation
- [ ] Add OTP input (6 digits)
- [ ] Call `/api/auth/send-otp` endpoint
- [ ] Call `/api/auth/verify-otp` endpoint
- [ ] Handle loading states
- [ ] Handle error messages
- [ ] Redirect to appropriate workspace after login
- [ ] Add "Resend OTP" functionality
- [ ] Write component tests

**Acceptance Criteria:**
- Mobile number normalized before sending
- OTP sent successfully
- User logged in on valid OTP
- Redirected to correct workspace based on primary role
- Errors displayed clearly

**Files to Create/Modify:**
- `frontend/src/pages/auth/OTPLogin.jsx`
- `frontend/src/__tests__/pages/OTPLogin.test.jsx`

---

### Task 3.3: Create Workspace Switcher Component
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `4 hours`

Dropdown component for multi-role users to switch workspaces.

**Subtasks:**
- [ ] Create `frontend/src/components/WorkspaceSwitcher.jsx`
- [ ] Display current workspace label
- [ ] List all available workspaces
- [ ] Handle workspace switch click
- [ ] Call `/api/auth/switch-workspace` endpoint
- [ ] Update auth store with new role
- [ ] Navigate to new workspace route
- [ ] Only show if user has multiple roles
- [ ] Style with consistent design system
- [ ] Add icons for each workspace type
- [ ] Write component tests

**Acceptance Criteria:**
- Component only visible for multi-role users
- All available workspaces listed correctly
- Switching updates role and navigates
- UI matches design system

**Files to Create/Modify:**
- `frontend/src/components/WorkspaceSwitcher.jsx`
- `frontend/src/components/icons/WorkspaceIcons.jsx`
- `frontend/src/__tests__/components/WorkspaceSwitcher.test.jsx`

---

### Task 3.4: Update Navigation with Workspace Switcher
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `2 hours`

Add workspace switcher to main navigation bar.

**Subtasks:**
- [ ] Update header/navigation component
- [ ] Place WorkspaceSwitcher in appropriate location
- [ ] Ensure responsive design (mobile/desktop)
- [ ] Test with single-role users (should not show)
- [ ] Test with multi-role users (should show dropdown)

**Acceptance Criteria:**
- Workspace switcher visible in navigation
- Responsive on all screen sizes
- No layout issues

**Files to Create/Modify:**
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Navigation.jsx`

---

### Task 3.5: Remove Password Input Fields
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `3 hours`

Remove all password input fields from frontend.

**Subtasks:**
- [ ] Search codebase for password input fields
- [ ] Remove password fields from login forms
- [ ] Remove password fields from registration forms
- [ ] Remove "Forgot Password" links
- [ ] Remove password reset pages
- [ ] Update routing to remove password-related routes
- [ ] Update API calls to remove password parameters
- [ ] Test all auth flows still work

**Acceptance Criteria:**
- No password input fields visible anywhere
- All auth flows use OTP only
- No broken routes or components

**Files to Create/Modify:**
- Multiple files (search for "password", "forgot-password", etc.)
- Update routing configuration

---

### Task 3.6: Update Protected Routes for Multi-Role
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `3 hours`

Update route protection to check user roles array.

**Subtasks:**
- [ ] Update `ProtectedRoute` component
- [ ] Check against `userRoles` array instead of single `role`
- [ ] Update role-based route guards
- [ ] Test navigation for multi-role users
- [ ] Test unauthorized access blocked correctly

**Acceptance Criteria:**
- Multi-role users can access all their permitted routes
- Single-role users still work (backward compatible)
- Unauthorized routes redirect correctly

**Files to Create/Modify:**
- `frontend/src/components/routing/ProtectedRoute.jsx`
- `frontend/src/routes/index.js`

---

### Task 3.7: Add Patient Enrollment UI
**Status:** `not-started`
**Priority:** `low`
**Estimated:** `4 hours`

UI for Doctor/Clinic Owner to enroll as Patient to book appointments.

**Subtasks:**
- [ ] Create prompt when Doctor tries to book appointment
- [ ] Show "Enroll as Patient" modal/dialog
- [ ] Call `/api/users/enroll-patient` endpoint
- [ ] Update auth store after enrollment
- [ ] Show success message
- [ ] Auto-navigate to patient booking flow
- [ ] Write component tests

**Acceptance Criteria:**
- Modal appears when non-patient tries to book
- Enrollment successful with API call
- User can immediately book appointment after enrollment

**Files to Create/Modify:**
- `frontend/src/components/modals/PatientEnrollmentModal.jsx`
- `frontend/src/pages/appointments/BookAppointment.jsx`

---

## Epic 4: Testing & Quality Assurance

### Task 4.1: Write Unit Tests for Backend Services
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `6 hours`

Comprehensive unit tests for all new services.

**Subtasks:**
- [ ] Tests for RoleService
- [ ] Tests for PatientEnrollmentService
- [ ] Tests for mobile normalization utils
- [ ] Tests for OTP generation/verification
- [ ] Aim for >90% code coverage
- [ ] Use mocks for Prisma calls

**Acceptance Criteria:**
- All services have test coverage >90%
- All edge cases tested
- Tests pass in CI/CD pipeline

**Files to Create/Modify:**
- Multiple test files in `backend/tests/services/`
- Multiple test files in `backend/tests/utils/`

---

### Task 4.2: Write Integration Tests for Auth Endpoints
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `8 hours`

End-to-end tests for authentication flows.

**Subtasks:**
- [ ] Test POST /auth/send-otp (valid, invalid, rate-limited)
- [ ] Test POST /auth/verify-otp (new user, existing user, invalid OTP)
- [ ] Test GET /auth/me (with multiple roles)
- [ ] Test POST /auth/switch-workspace
- [ ] Test POST /users/enroll-patient
- [ ] Test multi-role authorization
- [ ] Test duplicate mobile prevention

**Acceptance Criteria:**
- All auth endpoints tested
- Multi-role scenarios covered
- Tests run against test database
- Tests pass in CI/CD

**Files to Create/Modify:**
- `backend/tests/integration/auth/otp-flow.test.js`
- `backend/tests/integration/auth/multi-role.test.js`

---

### Task 4.3: Write E2E Tests for Frontend Auth Flows
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `6 hours`

Cypress/Playwright E2E tests for user authentication.

**Subtasks:**
- [ ] Test OTP login flow (mobile → OTP → dashboard)
- [ ] Test workspace switching
- [ ] Test multi-role navigation
- [ ] Test patient enrollment from doctor account
- [ ] Test logout and re-login

**Acceptance Criteria:**
- All critical user paths tested
- Tests run in CI/CD
- Tests pass on staging environment

**Files to Create/Modify:**
- `frontend/cypress/e2e/auth/otp-login.cy.js`
- `frontend/cypress/e2e/auth/workspace-switching.cy.js`

---

### Task 4.4: Manual QA Testing Checklist
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `4 hours`

Manual testing on staging environment.

**Test Cases:**
1. [ ] New user can sign up via OTP and gets PATIENT role
2. [ ] Existing PATIENT can login via OTP
3. [ ] Existing DOCTOR can login via OTP
4. [ ] Existing CLINIC_OWNER can login via OTP
5. [ ] Doctor can enroll as Patient
6. [ ] Clinic Owner can enroll as Patient
7. [ ] Multi-role user can switch workspaces
8. [ ] Single-role user does not see workspace switcher
9. [ ] Same mobile number does not create duplicate accounts
10. [ ] Invalid OTP shows error message
11. [ ] Expired OTP shows error message
12. [ ] Resend OTP works correctly
13. [ ] Rate limiting prevents OTP spam
14. [ ] Role-based access control works (e.g., Patient cannot access clinic dashboard)
15. [ ] Logout clears session correctly
16. [ ] Page refresh preserves auth state
17. [ ] Mobile number normalization works (test with 10 digits, 12 digits, +91 prefix)
18. [ ] OTP works on mobile browsers
19. [ ] OTP works on desktop browsers
20. [ ] Workspace switching persists across page reload

**Acceptance Criteria:**
- All test cases pass
- No critical bugs found
- UX is smooth and intuitive

---

### Task 4.5: Performance Testing
**Status:** `not-started`
**Priority:** `low`
**Estimated:** `3 hours`

Load testing for OTP endpoints.

**Subtasks:**
- [ ] Use k6 or Artillery for load testing
- [ ] Test /auth/send-otp under load (100 req/sec)
- [ ] Test /auth/verify-otp under load
- [ ] Measure database query performance
- [ ] Identify bottlenecks
- [ ] Document performance benchmarks

**Acceptance Criteria:**
- OTP endpoints handle expected load
- Response time <500ms at 95th percentile
- No database connection issues
- Rate limiting works under load

**Files to Create/Modify:**
- `backend/tests/load/otp-load-test.js`
- `PERFORMANCE_TEST_REPORT.md`

---

## Epic 5: Deployment & Migration

### Task 5.1: Prepare Staging Environment
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `3 hours`

Set up staging with production-like data.

**Subtasks:**
- [ ] Clone production database to staging (anonymized)
- [ ] Run all migrations on staging
- [ ] Configure Message Central API keys for staging
- [ ] Enable test OTP mode for staging
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Smoke test all features

**Acceptance Criteria:**
- Staging environment mirrors production
- All migrations successful
- OTP works on staging

---

### Task 5.2: Database Backup & Rollback Plan
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `2 hours`

Create backup and rollback procedures.

**Subtasks:**
- [ ] Document backup procedure
- [ ] Create pre-migration backup script
- [ ] Create rollback SQL script
- [ ] Test backup/restore process
- [ ] Document emergency contact procedures

**Acceptance Criteria:**
- Backup script works
- Rollback script tested and works
- Documentation clear and complete

**Files to Create/Modify:**
- `backend/scripts/backup-database.sh`
- `backend/scripts/rollback-migration.sql`
- `ROLLBACK_PROCEDURE.md`

---

### Task 5.3: Production Deployment
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `4 hours`

Deploy to production during off-peak hours.

**Subtasks:**
- [ ] Schedule maintenance window (off-peak hours)
- [ ] Notify users of maintenance (24 hours advance)
- [ ] Backup production database
- [ ] Deploy backend with migrations
- [ ] Run data migration scripts
- [ ] Deploy frontend
- [ ] Run smoke tests on production
- [ ] Monitor error rates for 2 hours
- [ ] Send "system restored" notification

**Acceptance Criteria:**
- Zero downtime or minimal downtime (<5 min)
- All migrations successful
- No critical errors in logs
- Users can login successfully

---

### Task 5.4: Post-Deployment Monitoring
**Status:** `not-started`
**Priority:** `high`
**Estimated:** `Ongoing (1 week)`

Monitor system health after deployment.

**Subtasks:**
- [ ] Monitor OTP delivery success rate
- [ ] Monitor login success rate
- [ ] Monitor error logs
- [ ] Monitor database query performance
- [ ] Monitor API response times
- [ ] Set up alerts for anomalies
- [ ] Check support ticket volume

**Acceptance Criteria:**
- OTP delivery >99% success rate
- Login success rate >95%
- No critical errors
- Response times within SLA

---

### Task 5.5: User Communication & Documentation
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `4 hours`

Communicate changes to users and update docs.

**Subtasks:**
- [ ] Send email announcing OTP-only login
- [ ] Create user guide for OTP login
- [ ] Create user guide for workspace switching
- [ ] Update help documentation
- [ ] Create FAQ for common issues
- [ ] Train support team on new features
- [ ] Update API documentation

**Acceptance Criteria:**
- All users notified
- Documentation complete and accessible
- Support team trained

**Files to Create/Modify:**
- `DOCS/USER_GUIDE_OTP_LOGIN.md`
- `DOCS/WORKSPACE_SWITCHING.md`
- `DOCS/FAQ.md`

---

### Task 5.6: Password Login Deprecation
**Status:** `not-started`
**Priority:** `medium`
**Estimated:** `2 hours`

Disable password login after 2-week grace period.

**Subtasks:**
- [ ] Wait 2 weeks after OTP deployment
- [ ] Analyze password login usage (should be near zero)
- [ ] Disable password login routes
- [ ] Return 410 Gone for password login attempts
- [ ] Monitor support tickets
- [ ] Send final deprecation email

**Acceptance Criteria:**
- Password login disabled
- No increase in support tickets
- Clear error message for users attempting password login

**Files to Create/Modify:**
- `backend/src/controllers/auth.controller.js` (disable loginHandler)

---

### Task 5.7: Remove Password Fields (Future)
**Status:** `not-started`
**Priority:** `low`
**Estimated:** `3 hours`

Remove passwordHash column after 3 months of OTP-only.

**Subtasks:**
- [ ] Wait 3 months to ensure stability
- [ ] Create migration to drop passwordHash column
- [ ] Drop password_reset_tokens table
- [ ] Remove password-related code from codebase
- [ ] Update database documentation

**Acceptance Criteria:**
- passwordHash column dropped
- No code references to passwords remain
- System works without any password functionality

**Files to Create/Modify:**
- `backend/prisma/migrations/[timestamp]_remove_password_fields/migration.sql`

---

## Summary

**Total Estimated Time:** ~120 hours (3 weeks with 2 developers)

**Critical Path:**
1. Database migrations (Tasks 1.1, 1.2, 1.3)
2. Backend services (Tasks 2.1, 2.3, 2.4, 2.5)
3. Frontend auth store & OTP login (Tasks 3.1, 3.2)
4. Testing (Tasks 4.1, 4.2, 4.4)
5. Deployment (Tasks 5.1, 5.2, 5.3)

**Risk Mitigation:**
- Backup before every migration
- Rollback plan documented and tested
- Gradual rollout (staging → production)
- Monitor metrics closely post-deployment
- Support team on standby during deployment
