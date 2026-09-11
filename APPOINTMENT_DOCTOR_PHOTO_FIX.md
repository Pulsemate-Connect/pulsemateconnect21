# Appointment Doctor Photo Fix - Backend API

## Issue
Doctor profile photos were NOT showing in the **Appointments screen** after booking/payment. The mobile app was showing placeholder initials instead of doctor photos.

## Screenshots Analysis
- ✅ **Live Queue screen** - Photo showing correctly (Gourish Naik photo visible)
- ❌ **Appointments screen** - Photos NOT showing (reported by user: "after payment only it not showing")

## Root Cause
The backend API endpoint `/api/patient/appointments` (function `getMyAppointments`) had a comment saying:
```javascript
// include profileImage so avatars can be shown
```

**BUT it wasn't actually including the photo fields!** It was only returning:
```javascript
doctor: {
  include: {
    user: { select: { id: true, name: true } }  // ❌ No photo fields
  }
}
```

The mobile app component was correctly checking for photos:
```javascript
photoUrl={appt.doctor?.profileImage || appt.doctor?.profilePhotoUrl}
```

But the backend wasn't sending these fields, so photos couldn't display.

## Solution

### Fixed 3 Backend Functions:

**1. getMyAppointments** (Line ~505)
- Returns list of appointments for "My Appointments" screen
- **Fixed:** Added `profilePhotoUrl` and `profileImage` to doctor select

**2. getAppointmentDetails** (Line ~533)
- Returns single appointment details for "Appointment Detail" screen
- **Fixed:** Added `profilePhotoUrl` and `profileImage` to doctor select

**3. getLiveQueue** (Line ~566)
- Returns live queue data for "Live Queue" screen
- **Fixed:** Added `profilePhotoUrl` and `profileImage` to doctor select

### Changes Made:
Changed from:
```javascript
doctor: {
  include: {
    user: { select: { id: true, name: true } }
  }
}
```

To:
```javascript
doctor: {
  select: {
    id: true,
    userId: true,
    specialization: true,
    qualification: true,
    experienceYears: true,
    consultationFee: true,
    profilePhotoUrl: true,  // ✅ FIX: Include photo
    profileImage: true,      // ✅ FIX: Include legacy photo field
    user: { 
      select: { 
        id: true, 
        name: true,
      } 
    },
  },
}
```

## Why This Happened
The backend was using `include` instead of `select`, which by default includes ALL fields from the relation EXCEPT nested relations. However, when you nest another `include` inside, Prisma requires you to explicitly `select` the fields you want from the parent model.

## Files Modified
- ✅ `backend/src/controllers/patient.controller.js` - Fixed 3 functions

## Testing
1. **Deploy backend** (Render will auto-deploy from GitHub)
2. **Book an appointment** (or use existing appointment)
3. **Open mobile app**
4. **Navigate to Appointments tab**
5. **Photos should now display** for all appointments

## Expected Behavior After Fix
✅ Appointments screen - Doctor photos display
✅ Appointment Detail screen - Doctor photos display  
✅ Live Queue screen - Doctor photos display (already working)

## Database Verification
Both doctors have photos stored:
- Gourish Naik: `https://api.pulsemateconnect.in/uploads/4615608f-515b-49d4-8fbe-3cc1fcab48ed.jpg`
- Dr Arjun Upadhyay: `https://api.pulsemateconnect.in/uploads/92cd25dd-1d9c-4cf7-a13c-7ee6b8936403.jpeg`

Both URLs are accessible (HTTP 200 OK).

## Additional Fields Included
While fixing this, I also added other useful doctor fields that were missing:
- `specialization` - for showing doctor's specialty
- `qualification` - for showing MBBS, etc.
- `experienceYears` - for showing years of experience
- `consultationFee` - for showing fee
- `bio` - for doctor description (in detail view)
- `languagesKnown` - for showing languages (in detail view)
- `avgConsultationMins` - for calculating wait time (in queue view)

These fields make the appointment screens more informative.
