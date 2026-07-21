# Receptionist Side — Full Audit & Status
> Branch: `feature/receptionist` | Last updated: July 2026

---

## 1. Pages Overview

| Page | Route | File |
|------|-------|------|
| Reception Dashboard | `/reception` → `/receptionist/dashboard` | `src/pages/receptionist/ReceptionDashboard.jsx` |
| Today's Queue | `/reception/queue` → `/receptionist/queue` | `src/pages/receptionist/TodayQueue.jsx` |
| Walk-in Patient | `/reception/walk-in` → `/receptionist/walk-in` | `src/pages/receptionist/WalkInBooking.jsx` |
| Follow-up Return | `/reception/follow-up` → `/receptionist/follow-up` | `src/pages/receptionist/FollowUpBooking.jsx` |

---

## 2. What Each Page Does

### ReceptionDashboard
- Welcome screen showing receptionist's name and assigned clinic (name + city)
- Two quick-action cards: **Today's Queue** and **Walk-in Patient**
- No stats, no metrics — purely navigational
- Data source: `GET /auth/me` → reads `user.clinicStaff[].clinic`

### TodayQueue
The core operational screen.
- Loads clinic + doctors + sessions on mount
- **Session tabs** — auto-selects current active session by time (Morning 🌅 / Afternoon ☀️ / Evening 🌙)
- **Doctor selector** — button group to switch between doctors
- **Stats bar**: Waiting / Completed / Total counts
- **Currently Serving** — banner showing `#queueNumber — Patient Name`
- **Queue paused banner** when queue status is `PAUSED`
- **Controls**: Call Next Patient | Pause / Resume
- **Queue item cards** per patient:
  - Queue number badge, patient name + mobile, symptoms snippet
  - Status badge, estimated appointment time, position number
  - Per-item actions: Check In (while WAITING), Skip, Complete
  - Cash payment button after COMPLETED (if not yet paid)
- **Cash Payment Modal**: records cash, pre-fills consultation fee
- Real-time updates via **Socket.IO** (`queue:updated` event)

### WalkInBooking
- Doctor selector (dropdown)
- Session selector (toggle buttons, auto-selects current session)
- Patient mobile (`+91` prefixed, blocks deleting prefix, max 10 digits)
- Patient name (optional — defaults to "Walk-in Patient")
- Symptoms / reason (optional textarea)
- On success: shows queue number and resets form
- If mobile doesn't exist → backend auto-creates patient account

### FollowUpBooking
- Doctor selector (dropdown)
- **Original Appointment ID** — manual UUID paste input (⚠️ UX issue — see Known Issues)
- Reason for return (optional)
- Follow-up patients are placed **before** regular waiting patients in the queue
- Shows priority queue explanation box

---

## 3. API Calls

### Reception-specific (`/api/reception/*`)
| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/reception/queue/:doctorId?clinicId=&sessionId=` | TodayQueue |
| POST | `/reception/walk-in` | WalkInBooking |
| POST | `/reception/follow-up` | FollowUpBooking |
| PATCH | `/reception/queue/:queueItemId/check-in` | TodayQueue |
| PATCH | `/reception/queue/:queueId/call-next` | TodayQueue |
| PATCH | `/reception/queue-item/:id/skip` | TodayQueue |
| PATCH | `/reception/queue-item/:id/complete` | TodayQueue |
| PATCH | `/reception/queue/:queueId/pause` | TodayQueue |
| PATCH | `/reception/queue/:queueId/resume` | TodayQueue |

### Other APIs used
| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/auth/me` | All pages (loads clinic + user) |
| GET | `/clinics/:id/staff` | TodayQueue, WalkInBooking, FollowUpBooking |
| GET | `/clinics/:id/sessions` | TodayQueue, WalkInBooking |
| POST | `/payments/cash` | TodayQueue (cash payment modal) |

---

## 4. Backend Routes

**File**: `backend/src/routes/reception.routes.js`

**Auth chain**:
1. `authenticate` — verifies JWT
2. `authorize('RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN')` — role gate
3. Custom middleware — checks user `approvalStatus === 'VERIFIED'` AND clinic `approvalStatus === 'VERIFIED' && isActive`

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/queue/:doctorId` | `getQueue` |
| POST | `/walk-in` | `addWalkIn` |
| POST | `/follow-up` | `addFollowUp` |
| PATCH | `/queue/:queueItemId/check-in` | `checkIn` |
| PATCH | `/queue/:queueId/call-next` | `callNext` |
| PATCH | `/queue-item/:id/skip` | `skipPatient` |
| PATCH | `/queue-item/:id/complete` | `completePatient` |
| PATCH | `/queue/:queueId/pause` | `pauseQueue` |
| PATCH | `/queue/:queueId/resume` | `resumeQueue` |
| GET | `/session-stats/:clinicId` | `getSessionQueueStats` |

---

## 5. What the Receptionist CAN Do ✅

- ✅ Log in via email + password (staff login)
- ✅ View assigned clinic info
- ✅ View today's live queue per doctor + session
- ✅ Switch between clinic sessions
- ✅ Switch between doctors
- ✅ Add walk-in patients (auto-creates account if new mobile)
- ✅ Add follow-up patients with queue priority
- ✅ Check in a booked patient
- ✅ Call the next patient
- ✅ Skip a patient (marks as NO_SHOW)
- ✅ Manually complete a patient
- ✅ Pause and resume the queue
- ✅ Record cash payments for completed appointments
- ✅ See estimated appointment times per patient
- ✅ See real-time queue updates (Socket.IO)
- ✅ Receive push notifications

---

## 6. What the Receptionist CANNOT Do ❌

- ❌ Search/lookup patient or appointment — FollowUpBooking requires raw UUID paste
- ❌ Cancel a booked appointment
- ❌ View today's pre-booked appointments as a list before they arrive
- ❌ View or edit patient profile
- ❌ Process UPI/Razorpay payments — cash only
- ❌ Book future appointments for patients
- ❌ View clinic analytics or reports
- ❌ Close the queue for the day (only pause/resume)
- ❌ Switch clinics if assigned to more than one (hardcoded to `clinicStaff[0]`)
- ❌ View prescriptions

---

## 7. Known Issues & Bugs 🐛

### Critical UX
1. **FollowUpBooking requires UUID paste** — The receptionist has to manually paste the `originalAppointmentId` (a 36-character UUID). There is no patient search, mobile lookup, or appointment history dropdown. This makes the feature nearly unusable in practice.

### Logic Bugs
2. **`checkIn` doesn't update QueueItem status** — The handler only updates the *Appointment* status to `CHECKED_IN` but the `QueueItem` stays `WAITING`. Checked-in patients look the same as unchecked patients in the queue view.

3. **`skipPatient` uses hardcoded `avgMins = 10`** — Ignores the session's actual `avgConsultationMins`. Position estimates after a skip will be wrong if the session has a different avg.

4. **`getQueue` session filter edge case** — Empty string `sessionId` vs undefined behaves differently in the where-clause. Can return wrong queue in legacy (sessionless) mode.

### UI/UX
5. **Dashboard has no stats** — The reception dashboard is just a nav screen. No live queue count, no today's appointment count, no quick stats.

6. **No queue CLOSED status handling** — The `TodayQueue` UI handles `PAUSED` but not `CLOSED`. If a queue is closed, the UI incorrectly shows it as active.

7. **Multi-clinic always uses first clinic** — All three pages do `staffClinics[0].clinic`. No clinic switcher for receptionists assigned to multiple clinics.

### Code Quality
8. **Debug `console.log` in WalkInBooking** — Multiple `console.log('[WalkIn] ...')` statements left in the `init()` function.

9. **`getSessionQueueStats` unnecessary query** — Runs `prisma.clinic.findFirst({ where: { ownerId: req.user.id } })` for receptionists even though it will always fail (receptionist is never the owner).

---

## 8. Data Models (Receptionist-relevant)

| Model | Key Fields |
|-------|-----------|
| `ReceptionistProfile` | `userId`, `assignedClinicId`, `createdByOwnerId` |
| `ClinicStaff` | `clinicId`, `userId`, `role: RECEPTIONIST`, `isActive` |
| `Queue` | `clinicId`, `doctorId`, `sessionId`, `date`, `status (ACTIVE/PAUSED/CLOSED)` |
| `QueueItem` | `queueId`, `patientId`, `appointmentId`, `queueNumber`, `position`, `status`, `isFollowUp`, `followUpOf`, `calledAt`, `completedAt` |
| `Appointment` | `patientId`, `doctorId`, `clinicId`, `sessionId`, `status`, `queueNumber`, `slotTime`, `estimatedWaitMinutes`, `symptoms` |
| `ClinicSession` | `sessionType (MORNING/AFTERNOON/EVENING)`, `startTime`, `endTime`, `maxPatients`, `avgConsultationMins`, `enabled` |
| `Payment` | `appointmentId`, `amount`, `status (PAID/PENDING)`, `method (CASH/RAZORPAY/UPI)` |

---

## 9. Suggested Improvements (Priority Order)

### High Priority
1. **Patient/appointment search in FollowUpBooking** — Search by patient mobile or name to find appointment ID
2. **Fix `checkIn` to also update QueueItem status** — Currently inconsistent
3. **Add stats to ReceptionDashboard** — Live queue count, today's totals, appointments arriving soon
4. **Fix `skipPatient` avgMins** — Read from session instead of hardcoded 10

### Medium Priority
5. **Today's Booked Appointments list** — View all pre-booked patients arriving today with check-in button
6. **Queue close action** — Button to close queue at end of day
7. **Fix CLOSED queue status in TodayQueue UI** — Show closed state properly
8. **Multi-clinic support** — Clinic switcher if receptionist is assigned to more than one

### Low Priority
9. **Remove debug console.logs** from WalkInBooking
10. **Clean up `getSessionQueueStats` unnecessary owner query**
11. **Patient quick-view** — Click patient name to see basic profile (age, blood group, allergies)
