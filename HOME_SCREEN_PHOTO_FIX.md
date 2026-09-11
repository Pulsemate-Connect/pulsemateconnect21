# Home Screen Doctor Photos Fix

## Issue
Doctor profile photos were NOT showing in the **Home screen's "Top Doctors" section**. 
- ✅ Photos WERE showing in "Find a Doctor" screen (SearchScreen)
- ❌ Photos were NOT showing in Home screen (showing initials "G" and "D" instead)

## Root Cause
The `TopDoctorsSection.jsx` component was only checking:
```javascript
const photo = doctor.profilePhotoUrl || doctor.photoUrl || null;
```

But it was missing the `profileImage` fallback that the working SearchScreen was using.

## Backend Data Structure
The backend `/api/patient/doctors` endpoint returns:
```javascript
{
  profilePhotoUrl: d.profilePhotoUrl || d.profileImage || null
}
```

So the API tries to return `profilePhotoUrl` first, but some doctors might have the photo stored in `profileImage` field.

## Solution

### 1. Updated TopDoctorsSection.jsx
Changed line 73-80 from:
```javascript
const photo = doctor.profilePhotoUrl || doctor.photoUrl || null;
```

To:
```javascript
// ✅ FIX: Check all possible photo field names
const photo = doctor.profilePhotoUrl || doctor.profileImage || doctor.photoUrl || null;

// Debug logging to see what we're receiving
if (!photo) {
  console.log(`[TopDoctorsSection] No photo for ${name}:`, {
    hasProfilePhotoUrl: !!doctor.profilePhotoUrl,
    hasProfileImage: !!doctor.profileImage,
    hasPhotoUrl: !!doctor.photoUrl,
    doctorId: doctor.id,
  });
}
```

### 2. Added Debug Logging to HomeScreen.jsx
Added logging to trace what data is being received:
```javascript
console.log('[HomeScreen] Doctor data received:', {
  count: doctorData.length,
  firstDoctor: doctorData[0] ? {
    name: doctorData[0].user?.name,
    hasProfilePhotoUrl: !!doctorData[0].profilePhotoUrl,
    profilePhotoUrl: doctorData[0].profilePhotoUrl,
    hasProfileImage: !!doctorData[0].profileImage,
    profileImage: doctorData[0].profileImage,
  } : null,
});
```

## Verification
This matches the **working pattern** from SearchScreen.jsx (line 117):
```javascript
const photo = doc.profilePhotoUrl || doc.profileImage || null;
```

## Files Modified
- ✅ `src/screens/Home/components/TopDoctorsSection.jsx` - Added profileImage fallback check
- ✅ `src/screens/HomeScreen.jsx` - Added debug logging

## Testing
1. **Rebuild the mobile app** (React Native code changed)
2. **Open Home screen**
3. **Scroll to "Top Doctors" section**
4. **Photos should now display** for both Gourish Naik and Dr Arjun Upadhyay

## Database Verification
Both doctors have photos in database:
- Gourish Naik: `https://api.pulsemateconnect.in/uploads/4615608f-515b-49d4-8fbe-3cc1fcab48ed.jpg`
- Dr Arjun Upadhyay: `https://api.pulsemateconnect.in/uploads/92cd25dd-1d9c-4cf7-a13c-7ee6b8936403.jpeg`

Both URLs are accessible (HTTP 200 OK).

## Status
✅ Fixed and pushed to GitHub (commit: 5aa7e1c)
