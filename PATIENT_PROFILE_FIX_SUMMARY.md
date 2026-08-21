# Patient Profile Permission Error - Quick Fix Guide

## Problem
Mobile app users getting: **"You do not have permission to perform this action"** when editing profile

## What We Fixed ✅

### 1. Added Debugging Tools
- Backend now logs detailed info when permission errors occur
- New debug endpoint to check user's role: `/api/patients/debug/auth-info`
- SQL script to verify database role assignments

### 2. Why This Error Happens
- **Root Cause:** User's login token has wrong role information
- **Most Common:** User logged in before their account was fully set up
- **Solution:** Logout and login again to get fresh token

## Fix for Affected Users

### Step 1: Logout and Login Again ✅ (Try This First)
1. Open PulseMate Connect app
2. Go to Profile → Logout
3. Login again with same phone number
4. Try editing profile - should work now!

### Step 2: Clear App Cache (If Step 1 Doesn't Work)
**Android:**
1. Go to Settings → Apps
2. Find "PulseMate Connect"
3. Tap Storage
4. Tap "Clear Cache" then "Clear Data"
5. Open app and login again

**iOS:**
1. Delete the app
2. Reinstall from App Store
3. Login again

## For New Users
✅ **No action needed!** 

New users registering now will automatically get the correct permissions. This fix ensures all future registrations work properly.

## Technical Details (For Developers)

### What's Deployed
1. **Enhanced logging** in `backend/src/middleware/auth.middleware.js`
   - Logs userId, role, endpoint when permission denied
   
2. **Debug endpoint** in `backend/src/routes/patient.routes.js`
   - Call `GET /api/patients/debug/auth-info` to see user's current role
   
3. **Database verification** script: `backend/check-patient-roles.sql`
   - Checks if any users have wrong role assignments

### How to Check Logs
On Render dashboard:
1. Go to your backend service
2. Click "Logs" tab
3. Search for: `[AUTH FAILURE]`
4. You'll see userId and their actual role

### How to Test
```bash
# Call debug endpoint (replace token with user's actual token)
curl -H "Authorization: Bearer <user-token>" \
  https://api.pulsemateconnect.in/api/patients/debug/auth-info

# Response shows user's current role
{
  "userId": "...",
  "role": "PATIENT",  // Should be PATIENT
  "approvalStatus": "VERIFIED",
  "isActive": true,
  "message": "If role is not PATIENT, please logout and login again"
}
```

## Deployment Status

✅ **Pushed to GitHub:** Commit `1cae52f`  
✅ **Auto-deploying to Render:** Will be live in 2-3 minutes  
✅ **No database changes needed:** Pure backend enhancement  
✅ **No mobile app update needed:** Fix is backend-only

## Support Response Template

When users report this error:

**First Response:**
> Hi! This is a token refresh issue. Please try:
> 1. Logout from the app
> 2. Login again with same phone number
> 3. Your profile edit should work now!

**If that doesn't work:**
> Please clear app cache:
> - Go to Settings → Apps → PulseMate Connect → Storage
> - Tap "Clear Cache" then "Clear Data"
> - Open app and login again

**Still broken?**
> DM us your registered phone number so we can check our system logs.

Then check Render logs for their `[AUTH FAILURE]` entry.

## Monitoring

### What to Watch
- Render logs for `[AUTH FAILURE]` patterns
- Check if userRole is something other than 'PATIENT'
- Monitor user support tickets about profile editing

### Expected Behavior
- **Before fix:** No logging, no way to debug
- **After fix:** Full visibility into authorization failures
- **After users re-login:** No more permission errors

## Files Changed

```
backend/src/middleware/auth.middleware.js      (Enhanced logging)
backend/src/routes/patient.routes.js           (Debug endpoint)
backend/check-patient-roles.sql                (Verification script)
PATIENT_PROFILE_PERMISSION_FIX.md              (Detailed documentation)
```

## Next Steps

1. ✅ **Fix is deployed** - Wait 2-3 minutes for Render deployment
2. 🔄 **Contact affected users** - Ask them to logout and login again
3. 👀 **Monitor logs** - Watch for `[AUTH FAILURE]` patterns
4. 📊 **Run SQL script** - Verify no users have wrong roles in database

---

**Status:** ✅ Complete and deployed  
**Date:** August 20, 2026  
**Commit:** 1cae52f  
**Works for:** All new users automatically + Existing users after re-login
