# Phase 1: Multi-Role Database Schema - READY TO DEPLOY

## ✅ What Was Done

### 1. Database Schema Changes

**Updated User Model:**
```prisma
model User {
  // ✅ NEW: Multi-role fields
  roles       UserRole[]  @default([PATIENT])   // Array of all roles
  primaryRole UserRole    @default(PATIENT)     // Main/default role
  
  // ⚠️ DEPRECATED: Legacy fields (kept for backward compatibility)
  role            UserRole        @default(PATIENT)
  approvalStatus  ApprovalStatus  @default(VERIFIED)
  
  // ✅ NEW: Role approval tracking
  roleApprovals   RoleApprovalStatus[]  @relation("UserRoleApprovals")
}
```

**Created RoleApprovalStatus Model:**
```prisma
model RoleApprovalStatus {
  id              String         @id
  userId          String
  role            UserRole
  approvalStatus  ApprovalStatus @default(PENDING)
  requestedAt     DateTime
  approvedAt      DateTime?
  approvedBy      String?
  rejectedBy      String?
  rejectionReason String?
  requestData     Json?
  notes           String?
}
```

### 2. Migration Files Created

- ✅ `prisma/migrations/PHASE1_add_multi_role_support/migration.sql`
- ✅ `prisma/migrations/PHASE1_add_multi_role_support/rollback.sql`

### 3. Helper Scripts Created

- ✅ `scripts/add-clinic-owner-role-to-super-admin.js`

### 4. Database Functions Created

- ✅ `user_has_role(user_id, role)` - Check if user has specific role
- ✅ `get_approved_roles(user_id)` - Get all approved roles for user

---

## 🚀 How to Deploy Phase 1

### Step 1: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 2: Run Migration
```bash
# Development/staging first
npx prisma migrate dev --name add_multi_role_support

# Production (when ready)
npx prisma migrate deploy
```

### Step 3: Verify Migration
```bash
# Check schema
npx prisma studio

# Run verification queries
psql $DATABASE_URL -c "SELECT id, mobile, role, roles, \"primaryRole\" FROM users LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM role_approval_status LIMIT 5;"
```

### Step 4: Add CLINIC_OWNER Role to User 7022818878
```bash
node scripts/add-clinic-owner-role-to-super-admin.js
```

---

## 🧪 Testing Phase 1

### Test 1: Verify Schema
```javascript
const user = await prisma.user.findUnique({
  where: { mobile: '+917022818878' },
  include: { roleApprovals: true },
});

console.log('Roles:', user.roles);           // Should be array
console.log('Primary:', user.primaryRole);   // Should be string
console.log('Legacy role:', user.role);      // Still exists
console.log('Role approvals:', user.roleApprovals);
```

### Test 2: Check Multi-Role User
```javascript
// After running add-clinic-owner script
const user = await prisma.user.findUnique({
  where: { mobile: '+917022818878' },
});

expect(user.roles).toContain('SUPER_ADMIN');
expect(user.roles).toContain('CLINIC_OWNER');
expect(user.primaryRole).toBe('SUPER_ADMIN');
```

### Test 3: Role Approval Status
```javascript
const approval = await prisma.roleApprovalStatus.findUnique({
  where: {
    userId_role: {
      userId: user.id,
      role: 'CLINIC_OWNER',
    },
  },
});

expect(approval.approvalStatus).toBe('PENDING');
```

---

## 📋 What's Next - Phase 2

Phase 2 will implement:
1. Authentication changes (login with role selector)
2. JWT payload updates (include roles array)
3. Role switching API endpoint
4. Session management updates

**DO NOT PROCEED TO PHASE 2 UNTIL:**
- ✅ Phase 1 migration successful
- ✅ All tests pass
- ✅ Database verified
- ✅ User 7022818878 has both roles

---

## ⚠️ Backward Compatibility

**Phase 1 is 100% backward compatible:**

| Old Code | Still Works? |
|----------|--------------|
| `user.role` | ✅ Yes |
| `user.approvalStatus` | ✅ Yes |
| `WHERE role = 'PATIENT'` | ✅ Yes |
| Existing queries | ✅ Yes |

**New code can use:**
| New Code | Available? |
|----------|------------|
| `user.roles` | ✅ Yes |
| `user.primaryRole` | ✅ Yes |
| `user.roleApprovals` | ✅ Yes |
| `user_has_role()` function | ✅ Yes |

---

## 🔄 Rollback Instructions

If Phase 1 causes issues:

```bash
# Run rollback SQL
psql $DATABASE_URL -f backend/prisma/migrations/PHASE1_add_multi_role_support/rollback.sql

# Regenerate Prisma client
cd backend
npx prisma generate
```

**Rollback is safe:**
- ❌ Removes `roles`, `primaryRole` columns
- ❌ Removes `role_approval_status` table
- ✅ Keeps original `role` column intact
- ✅ No data loss (original role preserved)

---

## 📊 Migration Impact

### Database Changes
- **New columns:** 2 (`roles`, `primaryRole`)
- **New table:** 1 (`role_approval_status`)
- **New indexes:** 5
- **New functions:** 2
- **Breaking changes:** 0 (backward compatible)

### Application Impact
- **Backend files to change:** 0 (Phase 1 only)
- **Frontend files to change:** 0 (Phase 1 only)
- **API changes:** 0 (Phase 1 only)

**Phase 1 is database-only!**

---

## ✅ Acceptance Criteria - Phase 1

Phase 1 is complete when:

- [x] Schema updated with new fields
- [x] Migration SQL created
- [x] Rollback SQL created
- [x] Helper scripts created
- [ ] Migration run successfully
- [ ] All existing users have `roles` array populated
- [ ] All existing users have matching role approval records
- [ ] User 7022818878 has CLINIC_OWNER role added
- [ ] Database functions work correctly
- [ ] No errors in application logs
- [ ] All existing features still work
- [ ] Prisma Studio shows new fields correctly

---

## 🎯 Current Status

**Phase 1: READY TO DEPLOY** ✅

**Files Created:**
1. ✅ `backend/prisma/schema.prisma` (updated)
2. ✅ `backend/prisma/migrations/PHASE1_add_multi_role_support/migration.sql`
3. ✅ `backend/prisma/migrations/PHASE1_add_multi_role_support/rollback.sql`
4. ✅ `backend/scripts/add-clinic-owner-role-to-super-admin.js`

**Next Steps:**
1. Review the schema changes
2. Run `npx prisma generate`
3. Run migration
4. Test database changes
5. Add role to user 7022818878
6. Verify everything works
7. **Then** we start Phase 2 (authentication)

---

**🛑 STOP HERE AND TEST PHASE 1 FIRST**

Do not proceed to Phase 2 until Phase 1 is fully tested and working!
