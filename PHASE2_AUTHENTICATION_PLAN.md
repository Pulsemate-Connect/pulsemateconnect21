# Phase 2: Authentication Changes - Implementation Plan

**Status:** 🚀 STARTING NOW  
**Goal:** Enable multi-role authentication and role switching  
**Approach:** Incremental, backward compatible, tested at each step

---

## 🎯 Phase 2 Overview

**What we're building:**
1. JWT tokens with `roles[]` and `activeRole`
2. Auth middleware that validates roles
3. Role switching API endpoint
4. Role selector UI component
5. Update existing code to support multi-role

**Backward compatibility:**
- Keep existing `role` field in JWT (deprecated)
- Support both old and new token formats
- Gradual migration of existing code

---

## 📋 Implementation Steps

### Step 1: Update JWT Token Structure ✅ NEXT
**File:** `backend/src/utils/jwt.utils.js`

**Current JWT payload:**
```javascript
{
  userId: user.id,
  role: user.role,  // Single role (string)
  email: user.email,
  mobile: user.mobile
}
```

**New JWT payload:**
```javascript
{
  userId: user.id,
  role: user.primaryRole,      // Keep for backward compatibility (deprecated)
  roles: user.roles,            // Array of all roles
  activeRole: user.primaryRole, // Current active role
  primaryRole: user.primaryRole,
  email: user.email,
  mobile: user.mobile
}
```

**Changes needed:**
- Update `generateAccessToken()` to include new fields
- Update `generateRefreshToken()` to include new fields
- Keep backward compatibility for old tokens

---

### Step 2: Update Auth Middleware
**File:** `backend/src/middleware/auth.middleware.js`

**Changes needed:**
- Read `roles[]` and `activeRole` from JWT
- Fall back to `role` if new fields don't exist (backward compatibility)
- Add `req.user.roles` and `req.user.activeRole`
- Update role validation to check `activeRole`

**New middleware functions:**
- `requireRole(allowedRoles)` - Check if activeRole is in allowedRoles
- `requireAnyRole(allowedRoles)` - Check if user has any of the roles
- Keep existing `requireAdmin()`, `requireDoctor()`, etc.

---

### Step 3: Update Login/Signup Flow
**Files:** 
- `backend/src/controllers/auth.controller.js` (login, signup)
- `backend/src/services/auth.service.js`

**Changes needed:**
- Include `roles[]` when querying user
- Generate token with new fields
- Return user's roles in response
- Add `availableRoles` field to response

**Response format:**
```javascript
{
  accessToken: "...",
  refreshToken: "...",
  user: {
    id: "...",
    role: "PATIENT",         // Deprecated, for compatibility
    roles: ["PATIENT", "CLINIC_OWNER"],
    primaryRole: "PATIENT",
    activeRole: "PATIENT",   // Initially set to primaryRole
    // ... other fields
  }
}
```

---

### Step 4: Create Role Switching API
**File:** `backend/src/routes/auth.routes.js` (new endpoint)

**New endpoint:**
```
POST /api/auth/switch-role
Body: { newRole: "CLINIC_OWNER" }
```

**Logic:**
1. Verify user is authenticated
2. Check if user has the requested role in `roles[]`
3. Check if role is approved (status = VERIFIED)
4. Generate new JWT with updated `activeRole`
5. Return new tokens

**Response:**
```javascript
{
  accessToken: "...",
  refreshToken: "...",
  activeRole: "CLINIC_OWNER"
}
```

---

### Step 5: Create Role Selector Component
**File:** `frontend/src/components/RoleSelector.jsx` (new)

**Component features:**
- Show current active role
- Display all available roles
- Switch role button for each role
- Pending approval badge for unapproved roles
- Redirect to appropriate dashboard after switch

**UI mockup:**
```
┌─────────────────────────────────┐
│  Select Your Role               │
├─────────────────────────────────┤
│  ● Patient                      │  ← Current active
│  ○ Clinic Owner (Pending)      │  ← Can't select yet
│                                 │
│  [Continue as Patient]          │
└─────────────────────────────────┘
```

---

### Step 6: Update Frontend Auth Context
**File:** `frontend/src/context/AuthContext.jsx`

**Changes needed:**
- Store `roles[]` and `activeRole` in state
- Add `switchRole()` function
- Update `login()` to handle multi-role response
- Check role approval status

**New context methods:**
```javascript
const {
  user,              // Current user
  activeRole,        // Current active role
  availableRoles,    // All roles user has
  switchRole,        // Function to switch role
  canSwitchTo,       // Function to check if can switch to role
} = useAuth();
```

---

### Step 7: Update Existing Code (Gradual)
**Files to update (not all at once):**
- Replace `user.role` with `user.activeRole` or `user.primaryRole`
- Replace role checks: `role === "DOCTOR"` → `roles.includes("DOCTOR")`
- Update API endpoints to send `activeRole` instead of `role`

**Priority updates:**
1. Dashboard routing (check activeRole to redirect)
2. Navigation (show menu based on activeRole)
3. Permission checks (use activeRole for authorization)
4. API calls (send activeRole in requests)

---

### Step 8: Add Role Approval Flow (Optional)
**Files:**
- `backend/src/controllers/admin.controller.js` (approve/reject)
- `frontend/src/pages/admin/RoleApprovals.jsx` (UI)

**Admin features:**
1. View pending role requests
2. Approve role request
3. Reject role request with reason
4. View role history

---

## 🧪 Testing Strategy

**After each step:**
1. Run backend: `npm run dev`
2. Test existing features (should still work)
3. Test new features (multi-role specific)
4. Check for errors in logs

**Test cases:**
1. ✅ Old tokens still work (backward compatibility)
2. ✅ New tokens include all fields
3. ✅ Can login with single role
4. ✅ Can login with multiple roles
5. ✅ Can switch between roles
6. ✅ Can't switch to unapproved role
7. ✅ Can't switch to role user doesn't have
8. ✅ Dashboard redirects based on activeRole

---

## 🚨 Backward Compatibility Rules

1. **Always include `role` field** - For old code that still uses it
2. **Default activeRole to primaryRole** - On first login
3. **Support old JWT format** - Check if `roles` exists, fall back to `role`
4. **Don't break existing APIs** - Add new fields, don't remove old ones
5. **Gradual code updates** - Update files one by one, not all at once

---

## 📝 Implementation Order

**Today (Phase 2A):**
- ✅ Step 1: Update JWT structure
- ✅ Step 2: Update auth middleware
- ✅ Step 3: Update login/signup flow
- ✅ Step 4: Create role switching API

**Next (Phase 2B):**
- Step 5: Role selector component
- Step 6: Update auth context
- Step 7: Update existing code (critical paths)

**Later (Phase 2C):**
- Step 7: Continue updating existing code
- Step 8: Admin approval flow
- Full testing and QA

---

## 🎯 Success Criteria

**Phase 2A Complete when:**
- ✅ JWT includes roles array and activeRole
- ✅ Can login and get multi-role token
- ✅ Can switch role via API
- ✅ Old tokens still work
- ✅ No breaking changes

**Phase 2B Complete when:**
- ✅ UI shows role selector
- ✅ Can switch role from UI
- ✅ Dashboard redirects correctly
- ✅ All critical paths updated

**Phase 2 Complete when:**
- ✅ All code uses activeRole
- ✅ No more references to old `role` field
- ✅ Admin can approve roles
- ✅ Full end-to-end testing passes

---

## 🚀 Let's Start!

**Starting with Step 1: Update JWT Token Structure**

Ready to implement! 🎉
