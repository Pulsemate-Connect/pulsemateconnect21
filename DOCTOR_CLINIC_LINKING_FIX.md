# Doctor-Clinic Linking Fix

## Problem
Doctors added through the clinic dashboard and verified by admin are not appearing in:
1. Clinic dashboard doctor section
2. Mobile app clinic doctor list

## Root Cause
When admin approves a doctor, the system needs to create a `clinic_doctors` entry to link the doctor to the clinic. This was failing in some cases where:
1. The doctor profile's `invitationId` field was not set
2. The `DoctorClinic` (clinic_doctors) relationship was not created during approval

## Solution Implemented

### 1. Backend Code Fix
Updated `backend/src/controllers/admin.controller.js` - `approveDoctor()` function:
- ✅ Added fallback logic to find invitation by `doctorUserId` if `invitationId` is missing
- ✅ Automatically links the invitation to the profile if found
- ✅ Ensures `DoctorClinic` entry is always created when doctor is approved

### 2. Database Migration Fix
Created SQL scripts to retroactively fix existing approved doctors:

#### Quick Fix (Recommended)
Run this to fix all existing doctors:

```powershell
cd backend
Get-Content ../FIX_DOCTOR_CLINIC_LINKING.sql | npx prisma db execute --stdin
```

#### Detailed Fix with Verification
For detailed output and verification:

```powershell
cd backend
Get-Content ../FIX_DOCTOR_CLINIC_LINKING_COMPLETE.sql | psql $env:DATABASE_URL
```

## What the Fix Does

### Step 1: Link Missing Invitations
- Finds doctor profiles with missing `invitationId`
- Links them to their corresponding `doctor_invitations` record

### Step 2: Create Missing Clinic-Doctor Relationships
- Finds approved doctors with a valid invitation and clinic
- Creates `clinic_doctors` entries with:
  - `inviteStatus`: 'ACCEPTED'
  - `isActive`: true
  - `joinedAt`: date of approval
  - `roleAtClinic`: from invitation specialization

## Verification

After running the fix, verify doctors appear correctly:

### 1. Check Database
```sql
-- Count verified doctors with proper links
SELECT 
  COUNT(*) as total_verified,
  COUNT(CASE WHEN dc.id IS NOT NULL THEN 1 END) as linked,
  COUNT(CASE WHEN dc.id IS NULL THEN 1 END) as still_missing
FROM users u
JOIN doctor_profiles dp ON u.id = dp."userId"
LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
WHERE u.role = 'DOCTOR' AND u."approvalStatus" = 'VERIFIED';
```

### 2. Test Clinic Dashboard
1. Log in as clinic owner
2. Navigate to "Doctors" section
3. Approved doctors should now appear in the list

### 3. Test Mobile App
1. Open clinic details in mobile app
2. Doctors section should show all approved doctors for that clinic

## API Endpoints Affected

### Clinic Dashboard
- `GET /api/clinic/doctors` - Returns doctors via `DoctorClinic` relationships
- `GET /api/clinics/:id/staff` - Combines staff and doctors

### Mobile App
- `GET /api/clinics/:id` - Includes `doctorClinics` with all linked doctors
- `GET /api/clinics/:id/staff` - Same as dashboard, returns combined staff/doctors

## Flow After Fix

1. **Clinic invites doctor** → `DoctorInvitation` created with `clinicId`
2. **Doctor accepts** → User account created, linked to invitation
3. **Doctor verifies phone/email** → OTP verification
4. **Doctor completes profile** → `DoctorProfile` created with `invitationId`
5. **Admin approves** → 
   - ✅ Finds invitation (via `invitationId` or `doctorUserId`)
   - ✅ Creates `DoctorClinic` entry linking doctor to clinic
   - ✅ Sets `inviteStatus` = 'ACCEPTED', `isActive` = true
6. **Doctor appears in clinic dashboard and app** ✅

## Preventing Future Issues

The code fix ensures that:
1. If `invitationId` is missing, the system searches for invitation by `doctorUserId`
2. When found, the invitation is automatically linked to the profile
3. The `DoctorClinic` relationship is always created during approval
4. Proper error logging helps diagnose any remaining issues

## Testing

To test the complete flow:

1. Create a new clinic (or use existing verified clinic)
2. As clinic owner, invite a doctor via dashboard
3. As doctor, accept invitation via email link
4. Complete profile and submit for verification
5. As admin, approve the doctor
6. Verify doctor appears in:
   - Admin dashboard (verified doctors list)
   - Clinic dashboard (doctors section)
   - Mobile app (clinic details → doctors)

## Rollback

If issues occur, the changes can be rolled back:

```sql
-- Remove clinic_doctors entries created by the fix
DELETE FROM clinic_doctors
WHERE "createdAt" > '2026-09-09' 
  AND "inviteStatus" = 'ACCEPTED'
  AND "adminVerifiedAt" IS NOT NULL;

-- Note: Keep timestamp of when fix was run for precise rollback
```

## Support

If doctors still don't appear after running the fix:
1. Check backend logs for any errors during approval
2. Verify the doctor's `approvalStatus` is 'VERIFIED'
3. Verify the doctor has a valid `invitationId` in their profile
4. Check if `clinic_doctors` entry exists for the doctor-clinic pair
5. Contact development team with specific doctor/clinic IDs for investigation
