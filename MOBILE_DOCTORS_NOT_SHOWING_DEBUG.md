# Mobile App - Doctors Not Showing - Debug Guide

## Current Status

✅ **Database Fixed**: Doctor is properly linked with `clinic_doctors` entry
✅ **Backend API Fixed**: Controller now uses correct `staff` relation name
✅ **Verification Done**: Database query confirms doctor is linked

### Database Verification Result
```
Clinic: SPINE (ID: 0bce7374-e4c1-4f0f-a219-b3fe9c76a226)
Doctors: 1
  - Dr Arjun
    - inviteStatus: ACCEPTED
    - isActive: true
```

## Problem Areas to Check

### 1. Mobile App API Endpoint

The mobile app likely uses one of these endpoints to fetch doctors:

#### Option A: Public Doctor Search API
```
GET /api/patient/doctors
GET /api/patient/doctors/:id
```
**Status**: ✅ These endpoints properly filter for:
- `inviteStatus: 'ACCEPTED'`
- `isActive: true`
- `clinic.approvalStatus: 'VERIFIED'`

#### Option B: Authenticated Clinic Details API
```
GET /api/clinics/:id
```
**Status**: ✅ Fixed - Changed `clinicStaff` to `staff` (was causing API error)
**Requires**: Authentication token

### 2. Check Mobile App Code

#### Where to Look:
1. `src/screens/DoctorDetailScreen.jsx` - Shows doctor with clinics
2. `src/api/patient.js` - API calls
3. Search for where clinic doctors are displayed

#### What to Check:
```javascript
// Does the mobile app properly handle doctorClinics array?
doctor.doctorClinics?.map(dc => ...)

// Check if filtering by inviteStatus
doctor.doctorClinics.filter(dc => dc.inviteStatus === 'ACCEPTED')
```

### 3. Backend Server Running?

Make sure backend is running and accessible:
```powershell
cd backend
npm start
```

Check if API is responding:
```powershell
curl http://localhost:5000/api/patient/doctors
```

### 4. Mobile App Cache

The mobile app might be caching old data. Try:
1. Close and reopen the app
2. Clear app data/cache
3. Uninstall and reinstall app (if needed)

### 5. Network Issues

Check if mobile can reach the backend:
- Verify `BACKEND_URL` in mobile app config
- Check if device is on same network (for local dev)
- Check for any proxy/firewall issues

## Quick Test Scripts

### Test 1: Check Database Directly
```powershell
cd backend
node check-mobile-clinic-data.js
```
Expected: Should show 1 doctor for SPINE clinic ✅

### Test 2: Test API Endpoint (Requires Auth)
```powershell
cd backend
# You need to add auth token to this script
node test-mobile-clinic-api.js
```

### Test 3: Test Public Doctor Search
```powershell
# From PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/patient/doctors" -Method GET
```

Should return doctors with their `doctorClinics` array populated.

## Most Likely Issues

### Issue 1: Mobile App Not Showing `doctorClinics`
**Symptom**: API returns correct data but mobile doesn't display it
**Fix**: Check mobile app component that renders clinic/doctor list

### Issue 2: Mobile App Using Wrong Endpoint
**Symptom**: Mobile might be calling a deprecated or wrong endpoint
**Fix**: Check `src/api/patient.js` and search for clinic-related API calls

### Issue 3: Filtering on Mobile Side
**Symptom**: Mobile receives data but filters it out
**Fix**: Check if mobile has additional filters like:
```javascript
.filter(dc => dc.inviteStatus === 'VERIFIED') // ❌ Wrong - should be 'ACCEPTED'
```

### Issue 4: Backend Not Restarted
**Symptom**: Code changes not taking effect
**Fix**: Restart backend server
```powershell
cd backend
# Stop current server (Ctrl+C)
npm start
```

## Step-by-Step Troubleshooting

### Step 1: Verify Database (Already Done ✅)
```powershell
cd backend
node check-mobile-clinic-data.js
```
**Result**: ✅ Doctor is properly linked

### Step 2: Test Doctor Search API
```powershell
# Open PowerShell
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/patient/doctors?city=pune" -Method GET
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected**: Should show Dr Arjun with `doctorClinics` array containing SPINE clinic

### Step 3: Check Specific Doctor Profile
```powershell
# Replace {doctorId} with actual doctor ID: fd03af76-a64d-4843-9a0d-c45fe5212863
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/patient/doctors/fd03af76-a64d-4843-9a0d-c45fe5212863" -Method GET
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected**: Should show Dr Arjun's full profile with clinics

### Step 4: Check Mobile App Logs
1. Open mobile app with dev tools
2. Check console for API errors
3. Look for network requests to backend
4. Verify what data is being received

### Step 5: Check Mobile App Code
Look for:
```javascript
// src/api/patient.js or similar
export const getDoctorProfile = (id) => api.get(`/patient/doctors/${id}`);

// src/screens/DoctorDetailScreen.jsx or similar  
const clinics = doctor.doctorClinics || [];
```

## What We've Fixed

### 1. Database Issue ✅
**Before**: Approved doctors had no `clinic_doctors` entry
**After**: Running `fix-doctor-clinic-links.js` created the missing link

**Result**:
```sql
SELECT * FROM clinic_doctors WHERE "doctorId" = 'fd03af76-a64d-4843-9a0d-c45fe5212863';
-- Returns 1 row with inviteStatus='ACCEPTED', isActive=true
```

### 2. Backend Controller Issue ✅
**Before**: `getClinic()` used incorrect `clinicStaff` relation name
**After**: Changed to `staff` (correct relation name from schema)

**File Changed**: `backend/src/controllers/clinic.controller.js`

### 3. Future Approvals ✅
**Before**: Doctor approval might not create clinic link
**After**: Added fallback logic to find invitation and create link

**File Changed**: `backend/src/controllers/admin.controller.js`

## Next Steps

1. **Restart Backend Server** (if not already done)
   ```powershell
   cd backend
   npm start
   ```

2. **Test API Endpoints** (Run Step 2 & 3 from troubleshooting)

3. **Check Mobile App**
   - Close and reopen app
   - Check if doctors appear now
   - If not, check mobile app console logs

4. **If Still Not Working**
   - Share mobile app logs/errors
   - Share exact API endpoint mobile is calling
   - Share mobile app code that displays doctors

## API Response Examples

### Correct Response (Doctor with Clinics)
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "fd03af76-a64d-4843-9a0d-c45fe5212863",
      "user": {
        "name": "Dr Arjun"
      },
      "specialization": "Physiotherapy",
      "doctorClinics": [
        {
          "id": "7a00fa19-7cd3-4167-8a4a-80171614c80e",
          "inviteStatus": "ACCEPTED",
          "isActive": true,
          "clinic": {
            "id": "0bce7374-e4c1-4f0f-a219-b3fe9c76a226",
            "name": "SPINE",
            "city": "Pune",
            "approvalStatus": "VERIFIED"
          }
        }
      ]
    }
  }
}
```

### Wrong Response (Empty Clinics)
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "fd03af76-a64d-4843-9a0d-c45fe5212863",
      "doctorClinics": []  // ❌ This is the problem
    }
  }
}
```

## Contact/Support

If doctors still don't appear after:
1. ✅ Database is verified
2. ✅ Backend is restarted
3. ✅ API endpoints return correct data
4. ❌ Mobile still shows no doctors

Then the issue is in the **mobile app code** itself. Share:
- Mobile app console logs
- Exact API endpoint being called
- Mobile app code that displays the doctors
