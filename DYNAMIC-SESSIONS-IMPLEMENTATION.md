# Dynamic Session Management Implementation

## Overview
PulseMate now supports dynamic clinic session management, allowing clinic owners to define custom appointment sessions (e.g., Morning, Evening, Night) with specific time ranges instead of using hardcoded sessions.

## Implementation Summary

### Backend Changes

#### 1. Database Schema
- **Model**: `ClinicSession` (already existed in schema)
- **Fields**:
  - `id`: UUID primary key
  - `clinicId`: Foreign key to Clinic
  - `name`: Session name (e.g., "Morning Session")
  - `startTime`: Session start time (HH:mm format)
  - `endTime`: Session end time (HH:mm format)
  - `maxPatients`: Maximum patients per session (default: 30)
  - `enabled`: Boolean flag to enable/disable session
  - `sortOrder`: Display order (default: 0)
  - `createdAt`, `updatedAt`: Timestamps

#### 2. API Endpoints

**Controller**: `backend/src/controllers/clinicSession.controller.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/clinics/:clinicId/sessions` | Public | Fetch all enabled sessions for a clinic |
| GET | `/api/clinic/my-sessions` | Clinic Owner | Fetch sessions for authenticated owner's clinics |
| POST | `/api/clinic/:clinicId/sessions` | Clinic Owner | Create new session |
| PUT | `/api/clinic/sessions/:sessionId` | Clinic Owner | Update existing session |
| DELETE | `/api/clinic/sessions/:sessionId` | Clinic Owner | Soft delete session (set enabled=false) |

**Features**:
- Time conflict validation (prevents overlapping sessions)
- Clinic ownership verification
- Soft delete (disabled sessions retained in database)

**Routes**:
- Public route: `backend/src/routes/clinicSession.routes.js`
- Owner routes: Added to `backend/src/routes/clinic.routes.js`
- Server integration: Added to `backend/src/server.js`

### Frontend Changes

#### 1. Mobile App (React Native)

**File**: `src/screens/BookingScreen.jsx`

**Changes**:
- Added `clinicSessions` state to store dynamic sessions
- Added `useEffect` hook to fetch clinic sessions on mount
- Updated session rendering logic:
  - **Dynamic mode**: When `clinicSessions.length > 0`, render sessions from database
  - **Fallback mode**: When no sessions configured, use hardcoded Morning/Evening
- Updated slot filtering to match session time ranges
- Dynamic icon selection based on session time (☀️ morning, 🌤️ afternoon, 🌙 evening)

**API Function**: Already existed in `src/api/patient.js`:
```javascript
export const getClinicSessions = (clinicId) => api.get(`/clinics/${clinicId}/sessions`);
```

#### 2. Web Frontend (React)

**New Page**: `frontend/src/pages/owner/SessionManagement.jsx`

**Features**:
- View all sessions for owner's clinics
- Create new sessions with form validation
- Edit existing sessions
- Delete sessions (soft delete)
- Enable/disable sessions toggle
- Multi-clinic support (dropdown selector if owner has multiple clinics)
- Time conflict detection
- Responsive UI with modals
- Toast notifications

**Route**: `/clinic/sessions` (Clinic Owner only)

**Route Integration**: Updated `frontend/src/App.jsx` to include SessionManagement route

## Usage

### For Clinic Owners

#### Web Portal
1. Login as Clinic Owner
2. Navigate to **Sessions** (add to sidebar navigation)
3. Click "Add Session" to create a new session
4. Fill in:
   - Session name (e.g., "Morning Session")
   - Start time (e.g., "08:00")
   - End time (e.g., "14:00")
   - Max patients (default: 30)
   - Sort order (controls display order)
   - Enabled checkbox (allow bookings)
5. Click "Create"

#### Editing Sessions
- Click "Edit" on any session card
- Update fields and click "Update"

#### Disabling Sessions
- Click the "Enabled/Disabled" toggle button
- Disabled sessions won't appear in booking flow

#### Deleting Sessions
- Click "Delete" button
- Confirm deletion
- Session is soft-deleted (enabled=false)

### For Patients (Mobile App)

#### Booking Flow
1. Select a doctor and clinic
2. Choose appointment date
3. **Select Session**: 
   - If clinic has configured sessions → Display custom sessions
   - If no sessions configured → Display default Morning/Evening sessions
4. Sessions show:
   - Icon (dynamic based on time)
   - Session name
   - Time range
   - Availability status
   - Selected slot time

## Migration & Deployment

### Database Migration
The `ClinicSession` table already exists in the database schema. No migration needed.

### Backward Compatibility
✅ **Fully backward compatible**
- Apps work without any clinic sessions configured
- Falls back to hardcoded Morning (8 AM–2 PM) and Evening (4 PM–9 PM) sessions
- Existing bookings unaffected

### Rollout Strategy
1. Deploy backend first (API available but not used)
2. Deploy web frontend (clinic owners can configure sessions)
3. Deploy mobile app update (dynamic sessions enabled)
4. Gradual clinic onboarding

## Testing Checklist

### Backend
- [ ] Create session with valid data
- [ ] Create session with time conflicts (should fail)
- [ ] Update session
- [ ] Delete session (soft delete)
- [ ] Fetch public sessions for clinic
- [ ] Fetch owner's sessions across multiple clinics

### Mobile App
- [ ] Booking with dynamic sessions
- [ ] Booking with fallback sessions (no sessions configured)
- [ ] Session slot filtering works correctly
- [ ] Icons display correctly based on time
- [ ] Selected session displays slot time

### Web Frontend
- [ ] Session list displays correctly
- [ ] Create new session
- [ ] Edit existing session
- [ ] Delete session
- [ ] Enable/disable toggle
- [ ] Multi-clinic selector (if owner has multiple clinics)
- [ ] Form validation
- [ ] Time conflict error messages

## Technical Notes

### Time Format
- Database stores time as `STRING` in `HH:mm` format (24-hour)
- Frontend displays in 12-hour format with AM/PM
- Conversion handled by helper functions

### Slot-Session Matching
- Backend provides slots via `/api/doctor/:doctorId/slots`
- Frontend filters slots based on session time ranges
- Slot time (minutes since midnight) compared against session start/end

### Performance
- Sessions fetched once on BookingScreen mount
- Minimal overhead (typically 2-5 sessions per clinic)
- Public endpoint (no auth required for session fetching)

## Future Enhancements

1. **Doctor-Specific Sessions**: Link sessions to specific doctors
2. **Day-Specific Sessions**: Different sessions for different days
3. **Capacity Tracking**: Real-time patient count per session
4. **Session Templates**: Predefined session templates (Morning, Afternoon, Evening, Night)
5. **Bulk Operations**: Copy sessions across multiple clinics
6. **Analytics**: Session utilization reports

## Files Modified/Created

### Backend
- ✅ Created: `backend/src/controllers/clinicSession.controller.js`
- ✅ Created: `backend/src/routes/clinicSession.routes.js`
- ✅ Modified: `backend/src/routes/clinic.routes.js` (added owner routes)
- ✅ Modified: `backend/src/server.js` (registered routes)

### Mobile App
- ✅ Modified: `src/screens/BookingScreen.jsx` (dynamic session logic)
- ✅ Existing: `src/api/patient.js` (getClinicSessions function already present)

### Web Frontend
- ✅ Created: `frontend/src/pages/owner/SessionManagement.jsx`
- ✅ Modified: `frontend/src/App.jsx` (route registration)

### Documentation
- ✅ Created: `DYNAMIC-SESSIONS-IMPLEMENTATION.md` (this file)

## Support & Maintenance

### Common Issues

**Issue**: Sessions not appearing in booking screen
- **Solution**: Verify `enabled=true` for sessions in database
- Check API endpoint returns sessions: `GET /api/clinics/:clinicId/sessions`

**Issue**: Time conflict error when creating session
- **Solution**: Check existing session times, ensure no overlap

**Issue**: Fallback to hardcoded sessions
- **Solution**: This is expected when no sessions configured. Create sessions via web portal.

### Database Queries

Check sessions for a clinic:
```sql
SELECT * FROM clinic_sessions 
WHERE "clinicId" = 'your-clinic-id' 
AND enabled = true 
ORDER BY "sortOrder";
```

Enable all sessions for a clinic:
```sql
UPDATE clinic_sessions 
SET enabled = true 
WHERE "clinicId" = 'your-clinic-id';
```

---

**Implementation Date**: June 26, 2026
**Version**: 1.0.0
**Status**: ✅ Complete & Ready for Testing
