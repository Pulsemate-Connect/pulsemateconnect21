# Multi-Role Account Merge Fix

## Problem

When a user tried to register as a clinic owner using an **email-first** flow, but the **mobile number already existed** on a PATIENT account, the system created **TWO separate accounts**:

1. **User 1**: PATIENT role with mobile `9999999999` (Verified)
2. **User 2**: CLINIC_OWNER role with email `infopulsemateconnect@gmail.com` (DRAFT, temp mobile)

This violates the multi-role principle where one user should have multiple roles.

## Root Cause

The OTP verification logic was checking if a mobile already exists and **returning an error** instead of **merging the accounts**.

```javascript
// ❌ OLD CODE - Returns error
if (existingMobileUser) {
  return sendError(res, 'This mobile number is already registered to another account.', 409);
}
```

## Solution

### 1. Updated OTP Verification Logic

The code now **merges accounts** when mobile verification finds an existing user:

```javascript
// ✅ NEW CODE - Merges accounts
if (existingMobileUser) {
  // Get DRAFT user's email
  const draftUser = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { email: true, name: true, id: true }
  });
  
  // Add CLINIC_OWNER role to existing user
  const updatedRoles = existingMobileUser.roles || [existingMobileUser.role];
  if (!updatedRoles.includes('CLINIC_OWNER')) {
    updatedRoles.push('CLINIC_OWNER');
  }
  
  // Update existing user
  user = await prisma.user.update({
    where: { id: existingMobileUser.id },
    data: {
      email: draftUser.email, // Transfer email
      isEmailVerified: true,
      role: 'CLINIC_OWNER',
      roles: updatedRoles, // Multi-role array
      primaryRole: 'CLINIC_OWNER',
      approvalStatus: 'DRAFT',
    },
  });
  
  // Delete DRAFT user (cleanup)
  await prisma.user.delete({
    where: { id: decoded.userId }
  });
}
```

### 2. Cleanup Script

Created `backend/merge-duplicate-user.js` to fix existing duplicate accounts:

```bash
node backend/merge-duplicate-user.js
```

This script:
- Finds DRAFT CLINIC_OWNER with temp mobile
- Finds existing PATIENT with real mobile
- Merges them into one user with multi-role support
- Deletes the DRAFT duplicate

## Results

### Before Fix
```
User 1: dd1615cf-af9b-4d1c-ad43-82e9a9654d64
- Role: PATIENT
- Mobile: 9999999999
- Email: null

User 2: 2cb66d99-6b64-4e64-8c08-ffc368c3caf2
- Role: CLINIC_OWNER
- Mobile: TEMP_1788721642642_wj1e4yqpv
- Email: infopulsemateconnect@gmail.com
```

### After Fix
```
User: dd1615cf-af9b-4d1c-ad43-82e9a9654d64
- Role: CLINIC_OWNER (legacy field)
- Roles: ["PATIENT", "CLINIC_OWNER"] (multi-role array)
- Primary Role: CLINIC_OWNER
- Mobile: 9999999999
- Email: infopulsemateconnect@gmail.com
- Approval Status: DRAFT (ready for onboarding)
```

## How It Works Now

### Clinic Owner Registration Flow

1. **User enters email** → Email OTP sent
2. **User verifies email** → DRAFT user created with temp mobile
3. **User enters mobile** → Mobile OTP sent
4. **User verifies mobile** → System checks:
   - If mobile exists on another user → **MERGE accounts**
   - If mobile is new → **Update DRAFT user** with real mobile
5. **Continue onboarding** with merged/updated user

### Multi-Role Support

The system now properly supports users having multiple roles:

- `role`: Legacy single role field (for backward compatibility)
- `roles`: Array of all roles user has [`PATIENT`, `CLINIC_OWNER`]
- `primaryRole`: The main role user is currently using

## Benefits

✅ **No more duplicate accounts**  
✅ **Seamless identity linking** (email + mobile)  
✅ **Multi-role support** (one user, multiple roles)  
✅ **Better user experience** (no "already registered" errors)  
✅ **Clean data** (one account per person)

## Files Changed

1. `backend/src/controllers/auth.controller.js`
   - Updated mobile verification logic (lines ~3510-3600)
   - Updated production OTP verification (lines ~3960-4050)

2. `backend/merge-duplicate-user.js`
   - New cleanup script for existing duplicates

## Testing

Test the flow:
1. Create a PATIENT account with mobile `9999999999`
2. Start clinic owner registration with email `test@example.com`
3. Verify email → DRAFT user created
4. Verify mobile `9999999999` → Accounts merged automatically
5. Check database → Only one user exists with both roles

## Deployment

✅ Pushed to GitHub: Commits `3dcd360` and `c313ea1`  
✅ Render deployment triggered automatically  
✅ Changes will be live in ~5-10 minutes

## Future Improvements

- [ ] Support merging in reverse (mobile-first, then email)
- [ ] Add UI to show user their roles
- [ ] Role switching in frontend
- [ ] Admin panel to view multi-role users
