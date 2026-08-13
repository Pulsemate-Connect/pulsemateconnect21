# Unified Multi-Role OTP Authentication — Spec Overview

## 🎯 Goal

Migrate PulseMate Connect from password-based single-role authentication to a unified OTP-based multi-role system where:
- **One mobile number = One user identity**
- **One user = Multiple roles** (Patient, Doctor, Receptionist, Clinic Owner, Admin)
- **OTP-only authentication** (no passwords)
- **Workspace switching** for multi-role users

## 📊 Current State

**Problems:**
- ❌ Users can only have ONE role (Doctor cannot be Patient without duplicate account)
- ❌ Password-based auth for staff roles (security risk)
- ❌ Multiple auth flows (Firebase, Message Central, Email+Password) create complexity
- ❌ Same mobile number can create duplicate users

**Current Architecture:**
```
users table
  ├── role: ENUM (single value)
  ├── passwordHash: String
  └── profiles (1:1 relations)
```

## 🎯 Target State

**Solutions:**
- ✅ Multi-role support via `user_roles` junction table
- ✅ OTP-only authentication (Message Central)
- ✅ Workspace switching UI
- ✅ Unified identity (one mobile = one user, regardless of roles)

**Target Architecture:**
```
users table
  ├── mobile: String UNIQUE (+91XXXXXXXXXX normalized)
  └── roles: UserRole[] (many-to-many)
      ├── PATIENT
      ├── DOCTOR
      ├── CLINIC_OWNER
      ├── RECEPTIONIST
      └── ADMIN

Authentication Flow:
Mobile → OTP → Verify → Find/Create User → Load Roles → Redirect to Workspace
```

## 📁 Spec Files

| File | Description |
|------|-------------|
| `.config.kiro` | Spec configuration (design-first workflow) |
| `design.md` | **High-level & low-level design** (architecture, database schema, API contracts, services) |
| `tasks.md` | **Actionable implementation tasks** broken down into epics and subtasks |
| `README.md` | This overview document |

## 🏗️ Architecture Highlights

### Database Changes

**New Table: `user_roles`**
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- PATIENT, DOCTOR, etc.
  created_at TIMESTAMP,
  UNIQUE(user_id, role)
);
```

**Mobile Normalization:**
- All mobile numbers converted to `+91XXXXXXXXXX` format
- Duplicates identified and resolved before migration

**Backward Compatibility:**
- Keep `users.role` and `users.passwordHash` during transition
- Remove after 100% OTP adoption (3-6 months)

### Backend Services

1. **RoleService** — Manage multi-role operations
   - `getUserRoles(userId)` — Get all roles for a user
   - `addUserRole(userId, role)` — Add role (idempotent)
   - `ensurePatientProfile(userId)` — Create Patient role + profile
   - `getPrimaryRole(userId)` — Get default/highest priority role

2. **PatientEnrollmentService** — Allow staff to become patients
   - `enrollAsPatient(userId)` — One-click patient enrollment
   - `canBookAppointments(userId)` — Check patient access

3. **Unified OTP Authentication**
   - `sendOtpHandler` — Send OTP via Message Central
   - `verifyOtpHandler` — Verify OTP, create/login user, load roles

### Frontend Components

1. **Updated Auth Store** — Multi-role state management
   ```javascript
   {
     user: { ... },
     roles: ['DOCTOR', 'PATIENT'],
     primaryRole: 'DOCTOR',
     activeWorkspace: '/doctor/dashboard',
     switchWorkspace(role),
     hasRole(role)
   }
   ```

2. **OTP Login Page** — Replace password login
   - Mobile number input
   - OTP verification (6 digits)
   - Auto-redirect to correct workspace

3. **Workspace Switcher** — Dropdown in navigation
   - Only visible for multi-role users
   - Switch between Doctor/Patient/Clinic Owner workspaces
   - Updates JWT and navigates to new workspace

## 🔐 Security

- **OTP Verification:** Message Central (production) + Test mode (fixed OTP 123456)
- **Rate Limiting:** 5 OTP requests/hour per mobile
- **JWT Tokens:** Include roles array, 15-min expiry
- **Authorization Middleware:** Check `req.userRoles` array
- **RLS Policies:** PostgreSQL row-level security (optional, recommended)

## 📋 Implementation Phases

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1: Foundation** | Week 1-2 | Database schema, migrations, mobile normalization |
| **Phase 2: Backend OTP** | Week 3-4 | Unified OTP handlers, RoleService, auth middleware |
| **Phase 3: Frontend** | Week 5-6 | Multi-role auth store, OTP login UI, workspace switcher |
| **Phase 4: Deprecation** | Week 7-8 | Disable password login, user notifications |
| **Phase 5: Cleanup** | Month 3+ | Remove passwordHash column, final cleanup |

**Total Estimated Time:** ~120 hours (3 weeks with 2 developers)

## ✅ Acceptance Criteria

1. ✅ New user → OTP login → PATIENT role created
2. ✅ Existing Doctor → OTP login → can enroll as Patient
3. ✅ Same mobile never creates duplicate users
4. ✅ Multi-role user can switch workspaces
5. ✅ Password login disabled (deprecated)
6. ✅ OTP delivery >99% success rate
7. ✅ Zero unauthorized cross-role access
8. ✅ All existing permissions continue working

## 🚀 Getting Started

### For Developers

1. **Read the design document:**
   ```
   .kiro/specs/unified-multi-role-otp-auth/design.md
   ```
   Understand the architecture, database schema, and service contracts.

2. **Review the task breakdown:**
   ```
   .kiro/specs/unified-multi-role-otp-auth/tasks.md
   ```
   See all implementation tasks organized by epic.

3. **Start with Phase 1:**
   - Task 1.1: Create `user_roles` table
   - Task 1.2: Migrate existing data
   - Task 1.3: Normalize mobile numbers

### For Project Managers

- **Timeline:** 3 weeks (2 developers)
- **Critical Path:** Database → Backend Services → Frontend → Testing → Deployment
- **Risks:** Duplicate mobiles, OTP delivery failures, user access issues
- **Mitigation:** Backups, rollback plan, gradual rollout, monitoring

### For QA Engineers

- Run manual test checklist in `tasks.md` (Task 4.4)
- Focus on multi-role scenarios and duplicate prevention
- Test OTP delivery on multiple carriers

## 📊 Success Metrics

**Technical:**
- 100% users can login via OTP
- Zero duplicate accounts
- <2s OTP delivery (95th percentile)
- >99.5% OTP success rate

**Business:**
- Reduced "forgot password" support tickets
- Faster login time
- Higher user satisfaction (NPS)

## 🔄 Rollback Plan

If critical issues arise:

1. **Immediate** (< 1 hour): Re-enable password login routes
2. **Database Rollback**: Restore from pre-migration backup
3. **Communication**: Email users about temporary rollback

## 📞 Support

- **Slack:** #pulsemateconnect-auth-migration
- **Email:** dev-team@pulsemateconnect.com
- **On-Call:** [Deployment lead phone]

## 📝 Next Steps

1. ✅ Spec approved by stakeholders
2. ⏳ Set up development environment
3. ⏳ Create feature branch: `feature/unified-multi-role-otp-auth`
4. ⏳ Begin Task 1.1 (Create user_roles table)
5. ⏳ Daily standup to track progress

---

**Last Updated:** August 12, 2026  
**Spec Owner:** Development Team  
**Status:** Design Complete, Ready for Implementation
