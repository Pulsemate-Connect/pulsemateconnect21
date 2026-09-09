# 🚨 URGENT: Run This Now to Fix Missing Doctors

## Problem
Doctors approved by admin are not showing in clinic dashboard or mobile app.

## Quick Fix

Run this command now:

```powershell
cd backend
Get-Content ../FIX_DOCTOR_CLINIC_LINKING.sql | npx prisma db execute --stdin
```

## What This Does
1. Links doctor profiles to their invitations (if missing)
2. Creates `clinic_doctors` entries for all approved doctors
3. Makes approved doctors visible in clinic dashboard and mobile app

## After Running
1. Refresh clinic dashboard - doctors should appear
2. Reload mobile app - doctors should appear in clinic details
3. All future doctor approvals will work correctly (code is already fixed)

## If It Doesn't Work
Check the detailed instructions in: `DOCTOR_CLINIC_LINKING_FIX.md`

## What Was Fixed in Code
- Updated `backend/src/controllers/admin.controller.js`
- Added fallback logic to find invitations even when `invitationId` is missing
- Ensures clinic-doctor link is always created during approval

## Verification
After running, check:
```sql
SELECT COUNT(*) FROM clinic_doctors WHERE "isActive" = true;
```
This should show all your approved doctors.
