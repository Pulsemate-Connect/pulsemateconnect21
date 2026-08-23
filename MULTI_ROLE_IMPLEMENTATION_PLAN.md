# Multi-Role User System - Implementation Plan

## 🎯 Goal
Allow one user to have multiple roles (e.g., DOCTOR + CLINIC_OWNER + PATIENT) using the same mobile number.

---

## 📊 Current vs Proposed Architecture

### Current (Single Role)
```prisma
model User {
  mobile  String   @unique
  role    UserRole @default(PATIENT)  // Single role
}

enum UserRole {
  PATIENT
  CLINIC_OWNER
  DOCTOR
  RECEPTIONIST
  SUPER_ADMIN
}
```

**Behavior:**
- One mobile = One user = One role
- Login determines portal based on single role
- Error if mobile already exists with different role

### Proposed (Multi-Role)
```prisma
model User {
  mobile       String     @unique
  roles        UserRole[] @default([PATIENT])  // Array of roles
  primaryRole  UserRole   @default(PATIENT)    // Default/main role
}
```

**Behavior:**
- One mobile = One user = Multiple roles
- Login shows role selector if user has multiple roles
- Same user can access different portals
- Data linked by userId (not role)

---

## 🔧 Phase 1: Database Schema Changes

### 1.1 Update User Model
```prisma
model User {
  id                        String                       @id @default(uuid())
  name                      String?
  mobile                    String                       @unique
  email                     String?                      @unique
  
  // ✅ NEW: Multi-role support
  roles                     UserRole[]                   @default([PATIENT])
  primaryRole               UserRole                     @default(PATIENT)
  
  // ❌ DEPRECATED: Will be removed after migration
  role                      UserRole?                    @default(PATIENT)
  
  approvalStatus            ApprovalStatus               @default(VERIFIED)
  // ... rest of fields
}
```

### 1.2 Create RoleApprovalStatus Model (NEW)
```prisma
model RoleApprovalStatus {
  id              String         @id @default(uuid())
  userId          String
  role            UserRole
  approvalStatus  ApprovalStatus @default(PENDING)
  approvedAt      DateTime?
  approvedBy      String?        // Admin who approved
  rejectedAt      DateTime?
  rejectionReason String?
  requestedAt     DateTime       @default(now())
  
  user            User           @relation(fields: [userId], references: [id])
  
  @@unique([userId, role])
  @@index([userId])
  @@index([role, approvalStatus])
  @@map("role_approval_status")
}
```

**Why separate table?**
- Each role can have different approval status
- Doctor approved, Clinic Owner pending
- Audit trail per role

### 1.3 Migration Strategy

**Step 1: Add new fields (non-breaking)**
```sql
ALTER TABLE users ADD COLUMN roles TEXT[];
ALTER TABLE users ADD COLUMN primary_role TEXT;
```

**Step 2: Migrate existing data**
```sql
UPDATE users SET 
  roles = ARRAY[role::TEXT],
  primary_role = role
WHERE roles IS NULL;
```

**Step 3: Create new table**
```sql
CREATE TABLE role_approval_status (...);

INSERT INTO role_approval_status (user_id, role, approval_status)
SELECT id, role, approval_status FROM users;
```

**Step 4: Drop old column (after testing)**
```sql
ALTER TABLE users DROP COLUMN role;
ALTER TABLE users DROP COLUMN approval_status;
```

---

## 🔐 Phase 2: Authentication Changes

### 2.1 Login Flow Changes

**Current Flow:**
```
Enter mobile → Verify OTP → Detect role → Redirect to portal
```

**New Flow:**
```
Enter mobile → Verify OTP → Check roles
  ├─ Single role → Redirect to portal
  └─ Multiple roles → Show role selector → Choose role → Redirect to portal
```

### 2.2 Session Management

**JWT Payload (Current):**
```javascript
{
  userId: "...",
  role: "CLINIC_OWNER"  // Single role
}
```

**JWT Payload (Proposed):**
```javascript
{
  userId: "...",
  roles: ["CLINIC_OWNER", "DOCTOR"],     // All roles user has
  activeRole: "CLINIC_OWNER",            // Current role in session
  primaryRole: "CLINIC_OWNER"            // User's main role
}
```

### 2.3 Role Switching

**New Feature: Switch Role Without Re-login**

```javascript
POST /api/auth/switch-role
Body: { targetRole: "DOCTOR" }

Response:
{
  success: true,
  activeRole: "DOCTOR",
  redirectTo: "/doctor/dashboard"
}
```

### 2.4 Portal Authorization

**Update middleware:**
```javascript
// OLD
const requireClinicOwner = (req, res, next) => {
  if (req.user.role !== 'CLINIC_OWNER') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// NEW
const requireClinicOwner = (req, res, next) => {
  const { activeRole, roles } = req.user;
  
  // Check active role first
  if (activeRole === 'CLINIC_OWNER') return next();
  
  // Or check if user has the role
  if (roles.includes('CLINIC_OWNER')) return next();
  
  return res.status(403).json({ error: 'Access denied' });
};
```

---

## 🎨 Phase 3: Frontend Changes

### 3.1 Role Selector Component (NEW)

**After OTP verification, if user has multiple roles:**

```jsx
<RoleSelector
  roles={['CLINIC_OWNER', 'DOCTOR']}
  onSelect={(role) => {
    // Set active role in session
    // Redirect to appropriate portal
  }}
/>
```

**Display:**
```
┌─────────────────────────────────────┐
│  Choose Your Role                   │
├─────────────────────────────────────┤
│  [🏥] Clinic Owner                  │
│       Manage your clinic            │
├─────────────────────────────────────┤
│  [👨‍⚕️] Doctor                        │
│       See patients & appointments   │
├─────────────────────────────────────┤
│  [🧑] Patient                        │
│       Book appointments             │
└─────────────────────────────────────┘
```

### 3.2 Role Switcher in Navbar (NEW)

**For logged-in users with multiple roles:**

```jsx
<Dropdown>
  <DropdownTrigger>
    Current: Clinic Owner ▼
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownItem onClick={switchToDoctor}>
      Switch to Doctor
    </DropdownItem>
    <DropdownItem onClick={switchToPatient}>
      Switch to Patient
    </DropdownItem>
  </DropdownMenu>
</Dropdown>
```

### 3.3 Registration Flow Changes

**Clinic Owner Registration:**

1. Enter mobile: 7022818878
2. System checks: User exists with roles [SUPER_ADMIN]
3. Instead of error, show:
   ```
   ✅ You already have an account
   
   Do you want to add CLINIC_OWNER role to your existing account?
   
   [Yes, Add Role]  [No, Use Different Number]
   ```
4. If Yes: Request approval for new role
5. If No: Allow different mobile number

---

## 📝 Phase 4: Backend API Changes

### 4.1 New Endpoints

```javascript
// Add role to existing user
POST /api/auth/request-role
Body: { role: "CLINIC_OWNER" }

// Approve role (Admin only)
POST /api/admin/approve-role
Body: { userId: "...", role: "CLINIC_OWNER" }

// Switch active role
POST /api/auth/switch-role
Body: { targetRole: "DOCTOR" }

// Get user roles
GET /api/auth/my-roles
```

### 4.2 Updated Endpoints

**All existing endpoints that check `user.role` need updates:**

```javascript
// BEFORE
const user = await prisma.user.findUnique({
  where: { mobile },
  select: { id: true, role: true }
});

if (user.role !== 'CLINIC_OWNER') {
  return error('Wrong portal');
}

// AFTER
const user = await prisma.user.findUnique({
  where: { mobile },
  select: { id: true, roles: true, primaryRole: true }
});

if (!user.roles.includes('CLINIC_OWNER')) {
  return error('Access denied');
}
```

**Affected Files (Estimated 50+ files):**
- All controllers (auth, clinic, doctor, patient, etc.)
- All middleware (authorization, role checks)
- All services (user, clinic, appointment, etc.)
- All queries using `role` field

---

## 🔒 Phase 5: Authorization & Security

### 5.1 Permission Matrix

```javascript
const PERMISSIONS = {
  SUPER_ADMIN: ['*'],  // All permissions
  
  CLINIC_OWNER: [
    'clinic:create',
    'clinic:update',
    'clinic:delete',
    'doctor:invite',
    'staff:manage',
    'appointments:view',
  ],
  
  DOCTOR: [
    'appointments:view',
    'appointments:manage',
    'patients:view',
    'prescriptions:create',
    'queue:manage',
  ],
  
  PATIENT: [
    'appointments:book',
    'appointments:view-own',
    'profile:update-own',
  ],
  
  RECEPTIONIST: [
    'appointments:book',
    'patients:create',
    'queue:manage',
  ],
};
```

### 5.2 Role-Based Access Control

```javascript
const checkPermission = (user, permission) => {
  const { activeRole, roles } = user;
  
  // Check active role permissions
  const rolePermissions = PERMISSIONS[activeRole] || [];
  
  if (rolePermissions.includes('*')) return true;
  if (rolePermissions.includes(permission)) return true;
  
  // Check if user has role with this permission in any role
  for (const role of roles) {
    if (PERMISSIONS[role].includes(permission)) return true;
  }
  
  return false;
};
```

---

## 🧪 Phase 6: Testing Strategy

### 6.1 Database Migration Testing

```javascript
// Test: Migrate single-role user
const user = await prisma.user.findUnique({
  where: { mobile: '7022818878' }
});

expect(user.roles).toEqual([user.role]);
expect(user.primaryRole).toBe(user.role);
```

### 6.2 Multi-Role Scenarios

**Test Case 1: User with DOCTOR + CLINIC_OWNER**
- Login with mobile
- See role selector
- Choose DOCTOR → Access doctor dashboard
- Switch to CLINIC_OWNER → Access clinic dashboard

**Test Case 2: Add CLINIC_OWNER to existing SUPER_ADMIN**
- Register clinic with mobile 7022818878
- System recognizes existing SUPER_ADMIN
- Request CLINIC_OWNER role
- Admin approves
- User now has [SUPER_ADMIN, CLINIC_OWNER]

**Test Case 3: Different approval statuses**
- User has DOCTOR (approved) + CLINIC_OWNER (pending)
- Can access doctor portal
- Cannot access clinic portal until approved

### 6.3 Regression Testing

**Test existing functionality:**
- Patient registration still works
- Doctor registration still works
- Admin operations still work
- Appointments still work
- All existing users can login

---

## 📦 Phase 7: Deployment Strategy

### 7.1 Rollout Plan

**Stage 1: Development**
- Implement changes
- Local testing
- Unit tests

**Stage 2: Staging**
- Deploy to staging
- Full migration test
- Test all portals
- Test role switching

**Stage 3: Production Preparation**
- Database backup
- Rollback plan ready
- Migration scripts tested

**Stage 4: Production Deployment**
- Maintenance window
- Run migrations
- Deploy backend
- Deploy frontend
- Monitor for errors

### 7.2 Rollback Plan

**If issues occur:**

```sql
-- Restore old schema
ALTER TABLE users ADD COLUMN role TEXT;
UPDATE users SET role = primary_role;
ALTER TABLE users DROP COLUMN roles;
ALTER TABLE users DROP COLUMN primary_role;
```

**Code rollback:**
- Revert to previous commit
- Keep database in multi-role state
- Single-role code reads `primaryRole`

---

## ⚠️ Risks & Challenges

### Technical Risks

1. **Data Migration Complexity**
   - Risk: Data loss or corruption
   - Mitigation: Full backup, test migration on staging first

2. **Breaking Changes**
   - Risk: Existing code relies on single role
   - Mitigation: Gradual migration, dual support (role + roles)

3. **Performance Impact**
   - Risk: Array queries slower than single field
   - Mitigation: Proper indexing, query optimization

4. **Session Management**
   - Risk: JWT size increases with multiple roles
   - Mitigation: Store roles array in JWT, refresh on role switch

### Business Risks

1. **User Confusion**
   - Risk: Users don't understand role switching
   - Mitigation: Clear UI, tooltips, help docs

2. **Approval Workflow**
   - Risk: Admin workload increases (approve each role separately)
   - Mitigation: Batch approval, auto-approve for trusted roles

3. **Data Isolation**
   - Risk: Doctor sees own patient data when switching to patient role
   - Mitigation: Privacy settings, clear data boundaries

---

## 📊 Estimated Effort

### Development Time

| Phase | Estimated Time | Priority |
|-------|----------------|----------|
| Phase 1: Database Schema | 2 days | High |
| Phase 2: Authentication | 3 days | High |
| Phase 3: Frontend | 4 days | High |
| Phase 4: Backend API | 5 days | High |
| Phase 5: Authorization | 3 days | Medium |
| Phase 6: Testing | 4 days | High |
| Phase 7: Deployment | 1 day | High |
| **Total** | **22 days** | |

### Risk Assessment

- **Complexity:** ⚠️⚠️⚠️⚠️ Very High
- **Breaking Changes:** ⚠️⚠️⚠️⚠️ Very High
- **Testing Effort:** ⚠️⚠️⚠️⚠️ Very High
- **Rollback Difficulty:** ⚠️⚠️⚠️ High

---

## 🤔 Alternative: Simpler Approach

### Option 2B: Add Role Without Full Migration

**Compromise:**
- Keep `role` as primary
- Add `additionalRoles` array
- Less breaking changes

```prisma
model User {
  role            UserRole    @default(PATIENT)     // Primary role
  additionalRoles UserRole[]  @default([])          // Secondary roles
}
```

**Pros:**
- Less breaking changes
- Faster implementation (5-7 days)
- Easier rollback

**Cons:**
- Two fields to check (role + additionalRoles)
- Less clean architecture

---

## ✅ What I Need From You

**Before I implement this, please confirm:**

### Question 1: Scope
- [ ] **Option 2A:** Full multi-role (22 days, complex, clean)
- [ ] **Option 2B:** Simpler additional roles (7 days, easier, less clean)

### Question 2: Approval Workflow
- [ ] Every new role requires admin approval
- [ ] Some roles auto-approved (e.g., PATIENT)
- [ ] First role requires approval, additional roles auto-approved

### Question 3: Current User (7022818878)
- [ ] This is test user - delete and start fresh
- [ ] This is real SUPER_ADMIN - add CLINIC_OWNER role to it
- [ ] Create separate account with different mobile

### Question 4: Timeline
- [ ] This is urgent (implement now, accept risks)
- [ ] This can wait (test thoroughly, deploy carefully)
- [ ] Let's start with Phase 1-2 only (authentication first)

### Question 5: Backward Compatibility
- [ ] Break existing API (faster, cleaner)
- [ ] Maintain backward compatibility (slower, more complex)

---

## 📝 Recommendation

**My honest recommendation:**

If your clinic onboarding is currently blocked by this issue with mobile 7022818878, I suggest:

### **QUICK FIX (Now):**
1. Delete the existing SUPER_ADMIN test user (7022818878)
2. Allow clinic registration to proceed
3. Get clinic onboarding working with fixed OTP issue

### **LONG-TERM (Later):**
1. Plan multi-role implementation carefully
2. Test thoroughly on staging
3. Deploy during maintenance window
4. 2-3 weeks of development time

**Reason:** Multi-role is a major feature that needs careful planning. Don't rush it while you have a critical bug (OTP) to fix first.

---

## 🎯 Your Decision?

Please tell me:
1. Which option you want (2A or 2B)?
2. Should I delete user 7022818878 for now?
3. Implement multi-role now or later?
4. Answers to Questions 1-5 above

I will NOT make any changes until you confirm!
