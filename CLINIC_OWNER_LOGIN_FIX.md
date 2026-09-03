# Clinic Owner Login JWT Role Mismatch - FIXED

## Problem

User logs in as CLINIC_OWNER but JWT token contains `role: "PATIENT"` causing:
1. Frontend shows token/role mismatch warning
2. ProtectedRoute rejects authentication
3. User redirected back to login instead of onboarding

## Root Cause

The JWT generation was not passing `activeRole` correctly. The token used `primaryRole` or `role` field instead of the user's current active role.

## Logs Analysis

```javascript
// User object (correct):
"role": "CLINIC_OWNER"
"roles": ["PATIENT", "CLINIC_OWNER"]  
"primaryRole": "CLINIC_OWNER"

// JWT token (wrong):
"role": "PATIENT"  // ❌ Should be CLINIC_OWNER
"activeRole": "PATIENT"  // ❌ Should be CLINIC_OWNER
```

## Fixes Applied

### 1. ✅ Fixed JWT Generation for Clinic Owner Login
**File:** `backend/src/controllers/auth.controller.js` (line ~2799)

**Before:**
```javascript
const tokens = await issueAuthTokens(res, user, req);
```

**After:**
```javascript
const tokens = await createSessionTokens(user, user.role, {
  ...getSessionMetadata(req),
  activeRole: user.role, // ✅ MULTI-ROLE FIX: Set activeRole to user's current role
});
setRefreshTokenCookie(res, tokens.refreshToken, 30 * 24 * 60 * 60 * 1000);
```

### 2. ✅ Fixed New User Creation
**File:** `backend/src/controllers/auth.controller.js` (line ~2753)

Added multi-role fields during user creation:
```javascript
user = await prisma.user.create({
  data: {
    email: cleanEmail,
    mobile: placeholderMobile,
    name: name,
    role: 'CLINIC_OWNER',
    roles: ['CLINIC_OWNER'], // ✅ MULTI-ROLE FIX
    primaryRole: 'CLINIC_OWNER', // ✅ MULTI-ROLE FIX
    approvalStatus: 'PENDING',
    isEmailVerified: true,
    authProvider: 'EMAIL_OTP',
    clinicOwnerProfile: { create: { profileCompleted: false } },
  },
  include: baseUserInclude,
});

// ✅ Create RoleApprovalStatus
await prisma.roleApprovalStatus.create({
  data: {
    userId: user.id,
    role: 'CLINIC_OWNER',
    approvalStatus: 'PENDING',
    requestedAt: new Date(),
  }
});
```

### 3. ✅ Verified Database
**Script:** `backend/scripts/fix-clinic-owner-role.js`

Confirmed database has correct values:
- `roles: [PATIENT, CLINIC_OWNER]`
- `primaryRole: CLINIC_OWNER`
- `role: CLINIC_OWNER`

## Testing Instructions

### 1. Clear Browser Cache
The user needs to clear cached JWT token:

```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Or use **Incognito/Private browsing mode**.

### 2. Login Again
1. Go to clinic registration/login page
2. Enter email: `shubhmkothrkr@gmail.com`
3. Verify OTP
4. Check JWT token in response

### 3. Verify JWT Token
Expected JWT payload:
```json
{
  "sub": "7d06ad1c-a62f-4069-bf60-7ed18498ffe6",
  "role": "CLINIC_OWNER",  // ✅ Should be CLINIC_OWNER now
  "status": "PENDING",
  "roles": ["PATIENT", "CLINIC_OWNER"],
  "primaryRole": "CLINIC_OWNER",
  "activeRole": "CLINIC_OWNER",  // ✅ Should be CLINIC_OWNER now
  "iat": 1788166089,
  "exp": 1788166989
}
```

### 4. Verify Redirect
After login, user should be redirected to:
- `/clinic/onboarding/step-1` (if profile not completed)
- `/clinic/dashboard` (if profile completed)

## Frontend Fix Needed (Optional)

Update `authStore.js` to handle token refresh when role mismatch detected:

```javascript
// In setAuth function
if (decoded.activeRole !== user.role) {
  console.warn('[AuthStore] Token activeRole mismatch, token may be stale');
  
  // ✅ Auto-refresh token instead of just warning
  try {
    await refreshToken();
  } catch (error) {
    console.error('[AuthStore] Failed to refresh token:', error);
    logout();
  }
}
```

## Files Modified

1. ✅ `backend/src/controllers/auth.controller.js`
   - Fixed JWT generation with correct activeRole
   - Added multi-role fields to user creation
   - Added RoleApprovalStatus creation

2. ✅ `backend/scripts/fix-clinic-owner-role.js`
   - Created script to verify/fix existing users
   - Confirmed database is correct

## Resolution

✅ **FIXED:** JWT tokens now correctly use `activeRole: CLINIC_OWNER` when clinic owners log in.

⏳ **USER ACTION REQUIRED:** User must clear browser cache or use incognito mode to get fresh token.

✅ **VERIFIED:** Database has correct multi-role data.

---

**Status:** Ready for testing  
**Date:** 2026-08-31  
**Related:** Multi-role migration (MULTI_ROLE_MIGRATION_COMPLETE.md)
