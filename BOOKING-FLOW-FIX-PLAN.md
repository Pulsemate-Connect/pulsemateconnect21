# Booking Flow Fix - Implementation Plan

**Date:** June 28, 2026  
**Status:** 🔵 PLANNING  
**Priority:** 🔴 URGENT

---

## 🎯 Current Issues

### Critical Problems
1. ❌ Booking screen shows sessions as "Fully Booked" incorrectly
2. ❌ No real-time slot availability calculation
3. ❌ No slot counter (e.g., "7 slots available")
4. ❌ Session status not based on actual bookings
5. ❌ Web booking modal doesn't show sessions at all
6. ❌ No auto-refresh of availability
7. ❌ Concurrent booking race conditions possible
8. ❌ No validation of slot capacity before booking

### Current Implementation Gaps
- ✅ `ClinicSession` model exists in database
- ✅ Sessions can be created by clinic owners
- ✅ Public API to fetch sessions (`GET /clinics/:clinicId/sessions`)
- ❌ **NO API to calculate real-time slot availability per session**
- ❌ **NO endpoint to check if session is fully booked**
- ❌ **NO booking validation against session capacity**
- ❌ **Frontend doesn't calculate/display slot counts**

---

## 📋 Requirements Analysis

### Session Availability Calculation

**Formula:**
```
Total Slots = (Session End Time - Session Start Time) / Slot Duration
Booked Slots = COUNT(appointments WHERE status NOT IN ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'])
Available Slots = Total Slots - Booked Slots
```

**Example:**
```
Morning Session: 9:00 AM - 12:00 PM (180 minutes)
Slot Duration: 15 minutes
Total Slots: 180 / 15 = 12 slots
Booked: 5 appointments confirmed
Available: 12 - 5 = 7 slots
Display: "7 Slots Available"
```

### Session Status Logic

| Available Slots | Status | UI | Action |
|----------------|--------|-----|---------|
| > 5 | Available | 🟢 Green | "X Slots Available" |
| 1-5 | Almost Full | 🟠 Orange | "X Slots Left" |
| 0 | Fully Booked | 🔴 Red | "Fully Booked" (disabled) |
| N/A | Disabled | ⚫ Grey | "Clinic Closed" |

### Required API Endpoints

1. **GET `/api/clinics/:clinicId/sessions/availability?date=YYYY-MM-DD`**
   - Returns all sessions with slot calculations
   - Input: clinicId, date, optional doctorId
   - Output: Array of sessions with totalSlots, bookedSlots, availableSlots

2. **GET `/api/doctor/:doctorId/sessions/availability?clinicId=&date=YYYY-MM-DD`**
   - Doctor-specific session availability
   - Considers doctor's schedule from DoctorAvailability table

3. **POST `/api/patient/appointments` (Enhanced)**
   - Add session validation before creating appointment
   - Check available slots > 0
   - Return 409 Conflict if fully booked
   - Atomic transaction to prevent overbooking

---

## 🏗️ Implementation Plan

### Phase 1: Backend API Enhancements

#### 1.1 Create Session Availability Controller
**File:** `backend/src/controllers/sessionAvailability.controller.js`

```javascript
/**
 * GET /api/clinics/:clinicId/sessions/availability
 * Calculate real-time slot availability for all sessions on a date
 */
exports.getClinicSessionAvailability = async (req, res) => {
  const { clinicId } = req.params;
  const { date, doctorId } = req.query; // doctorId optional
  
  // 1. Fetch all enabled sessions for clinic
  // 2. For each session, calculate:
  //    - totalSlots (based on session duration and slot duration)
  //    - bookedSlots (count confirmed appointments in time range)
  //    - availableSlots (totalSlots - bookedSlots)
  // 3. Filter by doctor schedule if doctorId provided
  // 4. Return enriched session data
};

/**
 * GET /api/doctor/:doctorId/sessions/availability
 * Doctor-specific session availability
 */
exports.getDoctorSessionAvailability = async (req, res) => {
  const { doctorId } = req.params;
  const { clinicId, date } = req.query;
  
  // 1. Check doctor's DoctorAvailability for this date
  // 2. Get clinic sessions
  // 3. Filter sessions that overlap with doctor's working hours
  // 4. Calculate slot availability
  // 5. Return only sessions doctor is available for
};
```

#### 1.2 Enhance Booking Validation
**File:** `backend/src/controllers/payment.controller.js`

```javascript
// In initiatePayment function, add BEFORE creating appointment:

// Validate session capacity (if slotTime provided)
if (slotTime) {
  const sessionValidation = await validateSessionCapacity({
    clinicId,
    doctorId,
    appointmentDate,
    slotTime,
  });
  
  if (!sessionValidation.available) {
    return sendError(res, 
      'This time slot is no longer available. Please select another time.',
      409
    );
  }
}
```

#### 1.3 Add Slot Duration Configuration
**Options:**
1. Add `slotDurationMin` to ClinicSession model (per-session setting)
2. Use doctor's `avgConsultationMins` from DoctorProfile
3. Use clinic-wide default (15 minutes)

**Recommended:** Use doctor's `avgConsultationMins` as primary, fallback to 15 min

---

### Phase 2: Frontend (Web) Enhancement

#### 2.1 Update BookAppointmentModal
**File:** `frontend/src/pages/patient/BookAppointmentModal.jsx`

**Changes:**
1. Add session selection UI (currently missing!)
2. Fetch sessions with availability when date is selected
3. Display session cards with status badges
4. Show slot counter
5. Auto-refresh every 30 seconds
6. Disable fully booked sessions

**New State:**
```javascript
const [sessions, setSessions] = useState([]);
const [selectedSession, setSelectedSession] = useState(null);
const [sessionsLoading, setSessionsLoading] = useState(false);
const [lastRefresh, setLastRefresh] = useState(null);
```

**New Functions:**
```javascript
const fetchSessionAvailability = async () => {
  if (!form.appointmentDate) return;
  setSessionsLoading(true);
  try {
    const res = await getClinicSessionAvailability(clinic.id, {
      date: form.appointmentDate,
      doctorId: doctor.id,
    });
    setSessions(res.data.data.sessions || []);
    setLastRefresh(new Date());
  } catch (err) {
    toast.error('Failed to load session availability');
  } finally {
    setSessionsLoading(false);
  }
};

// Auto-refresh every 30 seconds
useEffect(() => {
  if (!form.appointmentDate) return;
  fetchSessionAvailability();
  const interval = setInterval(fetchSessionAvailability, 30000);
  return () => clearInterval(interval);
}, [form.appointmentDate, doctor.id, clinic.id]);
```

#### 2.2 Session Card Component
```jsx
const SessionCard = ({ session, selected, onSelect }) => {
  const { availableSlots, totalSlots, sessionType, name, startTime, endTime } = session;
  
  const isFullyBooked = availableSlots === 0;
  const isAlmostFull = availableSlots > 0 && availableSlots <= 5;
  
  const statusColor = isFullyBooked ? 'red' : isAlmostFull ? 'orange' : 'green';
  const statusText = isFullyBooked 
    ? 'Fully Booked' 
    : `${availableSlots} Slot${availableSlots !== 1 ? 's' : ''} Available`;
  
  return (
    <button
      onClick={() => !isFullyBooked && onSelect(session)}
      disabled={isFullyBooked}
      className={`session-card ${selected ? 'selected' : ''} ${isFullyBooked ? 'disabled' : ''}`}
    >
      <span className="session-icon">{getSessionIcon(sessionType)}</span>
      <span className="session-name">{name}</span>
      <span className="session-time">{startTime} - {endTime}</span>
      <span className={`session-status status-${statusColor}`}>
        {statusText}
      </span>
    </button>
  );
};
```

---

### Phase 3: Mobile (React Native) Enhancement

#### 3.1 Update BookingScreen.jsx
**File:** `src/screens/BookingScreen.jsx`

**Current Implementation:**
- ✅ Already fetches sessions
- ❌ Doesn't calculate slot availability
- ❌ Shows "Fully Booked" based on slot array length (wrong!)

**Required Changes:**
1. Replace `getAvailableSlots` with `getClinicSessionAvailability`
2. Remove slot time picker (use session-based booking)
3. Display slot counter on each session card
4. Add auto-refresh
5. Disable fully booked sessions

**Code Changes:**
```javascript
// BEFORE (current):
const getSessionSlots = (sessionId) => {
  const sess = clinicSessions.find(s => s.id === sessionId);
  if (!sess) return [];
  // ... returns slot array
};

// AFTER (new):
const getSessionStatus = (session) => {
  const { availableSlots, totalSlots } = session;
  if (availableSlots === 0) {
    return { text: 'Fully Booked', color: '#DC2626', disabled: true };
  }
  if (availableSlots <= 5) {
    return { text: `${availableSlots} Slots Left`, color: '#F59E0B', disabled: false };
  }
  return { text: `${availableSlots} Slots Available`, color: '#10B981', disabled: false };
};
```

---

### Phase 4: Real-time Updates & Concurrency

#### 4.1 Socket.IO Events
**Add new events:**
```javascript
// backend/src/socket/index.js

// When appointment is booked
io.to(`clinic:${clinicId}:sessions`).emit('session:booking', {
  clinicId,
  doctorId,
  date,
  sessionId,
  availableSlots,
});

// When appointment is cancelled
io.to(`clinic:${clinicId}:sessions`).emit('session:cancelled', {
  clinicId,
  doctorId,
  date,
  sessionId,
  availableSlots,
});
```

#### 4.2 Frontend Socket Listeners
```javascript
// Subscribe to session updates
useEffect(() => {
  if (!clinic?.id) return;
  
  socket.on('session:booking', handleSessionUpdate);
  socket.on('session:cancelled', handleSessionUpdate);
  
  return () => {
    socket.off('session:booking');
    socket.off('session:cancelled');
  };
}, [clinic?.id]);

const handleSessionUpdate = (data) => {
  // Update sessions state with new availability
  setSessions(prev => prev.map(s => 
    s.id === data.sessionId 
      ? { ...s, availableSlots: data.availableSlots }
      : s
  ));
};
```

#### 4.3 Atomic Booking Transaction
```javascript
// Prevent race condition when 2 users book last slot simultaneously
const result = await prisma.$transaction(async (tx) => {
  // 1. Re-check slot availability inside transaction
  const bookedCount = await tx.appointment.count({
    where: {
      clinicId,
      doctorId,
      appointmentDate: { gte: sessionStart, lt: sessionEnd },
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] },
    },
  });
  
  if (bookedCount >= session.maxPatients) {
    throw new Error('SESSION_FULLY_BOOKED');
  }
  
  // 2. Create appointment
  const appointment = await tx.appointment.create({ ... });
  
  return appointment;
});
```

---

### Phase 5: Testing & Verification

#### 5.1 Backend API Tests
```bash
# Test session availability endpoint
curl http://localhost:5000/api/clinics/{clinicId}/sessions/availability?date=2026-06-29

# Expected response:
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "sessionType": "MORNING",
        "name": "Morning Session",
        "startTime": "09:00",
        "endTime": "12:00",
        "maxPatients": 30,
        "slotDurationMin": 15,
        "totalSlots": 12,
        "bookedSlots": 5,
        "availableSlots": 7,
        "enabled": true
      }
    ]
  }
}
```

#### 5.2 Frontend Tests
- [ ] Sessions load on date selection
- [ ] Slot counters display correctly
- [ ] Fully booked sessions are disabled
- [ ] Available sessions show green status
- [ ] Almost full sessions show orange status
- [ ] Auto-refresh works (check after 30 seconds)
- [ ] Booking updates slot count immediately
- [ ] Concurrent booking prevented

#### 5.3 Mobile Tests
- [ ] Same session data as web
- [ ] Same slot counters
- [ ] Same booking validation
- [ ] Socket updates work
- [ ] Offline mode handled gracefully

---

## 📦 File Changes Required

### New Files
1. `backend/src/controllers/sessionAvailability.controller.js`
2. `backend/src/routes/sessionAvailability.routes.js`
3. `backend/src/validators/sessionAvailability.validator.js`
4. `frontend/src/components/booking/SessionCard.jsx`
5. `frontend/src/api/sessionAvailability.api.js`

### Modified Files
1. `backend/src/controllers/payment.controller.js` - Add session validation
2. `backend/src/routes/patient.routes.js` - Mount new routes
3. `backend/src/socket/index.js` - Add session update events
4. `frontend/src/pages/patient/BookAppointmentModal.jsx` - Add session UI
5. `frontend/src/api/patient.api.js` - Add new API calls
6. `src/screens/BookingScreen.jsx` - Update slot calculation
7. `src/api/patient.js` - Add new API calls

---

## 🚀 Deployment Steps

### Backend
1. Create sessionAvailability controller & routes
2. Add session validation to payment controller
3. Update socket events
4. Test API endpoints
5. Deploy to staging

### Frontend (Web)
1. Update BookAppointmentModal with session UI
2. Add API calls
3. Add socket listeners
4. Test booking flow
5. Deploy to staging

### Mobile (Android)
1. Update BookingScreen slot calculation
2. Update API calls
3. Add socket listeners
4. Test on device
5. Build new APK/AAB

### Database
- No schema changes required ✅
- All tables already exist

---

## ⏱️ Implementation Timeline

| Phase | Task | Est. Time | Status |
|-------|------|-----------|--------|
| 1 | Backend API | 3-4 hours | 🔵 Pending |
| 2 | Frontend Web | 2-3 hours | 🔵 Pending |
| 3 | Mobile App | 2-3 hours | 🔵 Pending |
| 4 | Socket.IO | 1-2 hours | 🔵 Pending |
| 5 | Testing | 2-3 hours | 🔵 Pending |
| **Total** | | **10-15 hours** | |

---

## 🎯 Success Criteria

- [ ] ✅ Session availability API returns correct slot counts
- [ ] ✅ Web booking modal shows session cards
- [ ] ✅ Mobile booking screen shows session cards
- [ ] ✅ Slot counters match actual availability
- [ ] ✅ "Fully Booked" only shows when availableSlots = 0
- [ ] ✅ Booking validates session capacity
- [ ] ✅ Concurrent bookings prevented
- [ ] ✅ Auto-refresh works (30 seconds)
- [ ] ✅ Socket updates work in real-time
- [ ] ✅ Web and Mobile show identical data
- [ ] ✅ No cache issues
- [ ] ✅ Morning/Afternoon/Evening sorted correctly
- [ ] ✅ Past time slots handled correctly
- [ ] ✅ No sessions = proper empty state

---

**Next Step:** Start Phase 1 - Backend API Implementation

This is a comprehensive rebuild of the booking flow. Shall I proceed with implementation?
