# Doctor Profile Photo Fix - Mobile App

## Issue
Doctor profile photos were not displaying in the mobile app when doctors viewed their own profile (My Profile screen).

## Root Cause
The mobile app was using `/api/patient/profile` endpoint for ALL users (including doctors), which only returns patient profile data without the doctor's `profilePhotoUrl`.

## Solution

### 1. Created Doctor API Module (`src/api/doctor.js`)
- Added `getMyProfile()` function that calls `/api/doctor/me/profile`
- This endpoint returns complete doctor profile including:
  - `profilePhotoUrl` - the doctor's profile photo
  - `specialization`, `qualification`, `experienceYears`
  - Associated clinics with acceptance status
  - All professional details

### 2. Updated ProfileScreen.jsx
**Changes made:**
- ✅ Import Image component from React Native
- ✅ Import doctor API: `import { getMyProfile as getDoctorProfile } from '../api/doctor'`
- ✅ Modified `load()` function to check user role:
  ```javascript
  const isDoctorRole = user?.role === 'DOCTOR';
  const profRes = isDoctorRole ? getDoctorProfile() : getPatientProfile();
  ```
- ✅ Transform doctor profile response to match UI structure
- ✅ Display profile photo if available:
  ```javascript
  {profile?.doctorProfile?.profilePhotoUrl ? (
    <Image source={{ uri: profile.doctorProfile.profilePhotoUrl }} ... />
  ) : (
    <View><Text>{initials}</Text></View>
  )}
  ```
- ✅ Added "Professional Details" section showing:
  - Specialization
  - Qualification  
  - Experience years
- ✅ Added "Associated Clinics" section showing:
  - Clinic name, location
  - Invite status (ACCEPTED/PENDING)
  - Active status
  - Consultation fee

## Database Verification
Confirmed both verified doctors have profile photos in database:
```
1. Gourish Naik (Sports Physiotherapy)
   Photo: https://api.pulsemateconnect.in/uploads/4615608f-515b-49d4-8fbe-3cc1fcab48ed.jpg

2. Dr Arjun Upadhyay (Physiotherapy)
   Photo: https://api.pulsemateconnect.in/uploads/92cd25dd-1d9c-4cf7-a13c-7ee6b8936403.jpeg
```

Both URLs are accessible (verified with HTTP 200 OK response).

## Testing
1. Launch mobile app
2. Login as a doctor (e.g., Gourish Naik)
3. Navigate to "Profile" tab
4. Profile photo should now display
5. "Professional Details" section shows specialization, qualification, experience
6. "Associated Clinics" section shows Spine Clinic (ACCEPTED, Active)

## Files Modified
- ✅ `src/api/doctor.js` (created)
- ✅ `src/screens/ProfileScreen.jsx` (updated)

## Backend Endpoint Used
```
GET /api/doctor/me/profile
Authorization: Bearer <token>
Response includes: profilePhotoUrl, clinics[], all doctor profile fields
```

## Notes
- Patient users still use `/api/patient/profile` (no changes for patients)
- Doctor profile photos work in search/browse screens (already implemented)
- This fix specifically addresses the "My Profile" view for doctor role users
- Photo URLs are served from: `https://api.pulsemateconnect.in/uploads/`
