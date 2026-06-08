# Implementation Plan: PulseMate Phase 1 – Production Readiness Sprint

## Overview

Fix all critical production blockers across five phases. No new features — only production hardening.

---

## Tasks

- [x] 1. Phase 1.1 — Live Queue Socket.io (Mobile)
  - [x] 1.1 Fix LiveQueueScreen socket connection lifecycle
    - Remove `socketState === 'connecting'` guard that blocks reconnect after `roomName` arrives
    - Connect socket immediately once `roomName` is available from first fetch
    - Disconnect and reconnect cleanly on `appointmentId` change
    - Prevent duplicate `socket.on` listeners using `socket.off` before re-registering
    - _Requirements: queue updates < 2s, no manual refresh needed_

  - [~] 1.2 Add fallback polling every 30 seconds when socket disconnects
    - Replace existing 15s poll with 30s interval
    - Start polling only after socket disconnect or connect_error
    - Stop polling when socket reconnects (socketState becomes 'live')
    - _Requirements: fallback works on Android and Web_

  - [~] 1.3 Add connection status indicator (LIVE / CONNECTING / OFFLINE)
    - LIVE: green animated dot when socket connected
    - CONNECTING: spinner while establishing
    - OFFLINE: amber dot + SYNC label when on polling fallback
    - Tap indicator to manually refresh
    - _Requirements: user always knows connection state_

  - [~] 1.4 Enhance backend `getLiveQueue` response with full room data
    - Ensure `roomName` is always returned even when `queueItem` is null (compute from appointment.clinicId, appointment.doctorId, today's date)
    - Add `appointmentDate` ISO string to `queueInfo` so mobile can compute correct room date
    - _Requirements: socket room join always has correct date_

  - [~] 1.5 Add backend socket emission for `queue:positionUpdated` with patient-facing payload
    - After `recalculatePositions` in reception controller, emit `queue:positionUpdated` with `{ updatedPositions: [{ patientId, newPosition, estimatedWaitMinutes }] }`
    - Emit from: callNext, skipPatient, addFollowUp, completePatient
    - _Requirements: position updates automatically without refresh_

  - [~] 1.6 Write unit tests for socket connection logic
    - Test: connects with valid token
    - Test: reconnects after disconnect
    - Test: falls back to polling on connect_error
    - Test: cleans up listeners on unmount
    - File: `PulseMateApp/src/__tests__/liveQueue.socket.test.js`

  - [~] 1.7 Write integration test for end-to-end queue update flow
    - Test: patient joins room → receptionist calls next → patient receives `queue:called` event within 2s
    - File: `backend/src/__tests__/queue.socket.integration.test.js`

- [x] 2. Phase 1.2 — Firebase Push Notifications
  - [~] 2.1 Configure Firebase Admin SDK in backend
    - Install `firebase-admin` package: `npm install firebase-admin@12.0.0`
    - Update `fcm.service.js` to use Firebase Admin SDK via `FIREBASE_SERVICE_ACCOUNT_JSON` env var
    - Add fallback: if env var not set, log notification to console (dev mode)
    - _Requirements: push arrives within 10 seconds_

  - [~] 2.2 Register FCM token on mobile app login
    - Install `expo-notifications` and `expo-device`: add to `PulseMateApp/package.json`
    - Create `PulseMateApp/src/hooks/usePushNotifications.js`
    - On app launch (authenticated): request permission, get Expo push token, register with backend via `POST /notifications/fcm-token`
    - On logout: call `DELETE /notifications/fcm-token` to remove token
    - Handle Android notification channel setup
    - _Requirements: works foreground, background, and app closed_

  - [~] 2.3 Implement all patient push notification triggers in backend
    - Appointment booked → `notifyAppointmentBooked` (already called in payment.controller — verify it works)
    - Appointment cancelled → add `notifyCancellation` call in `cancelAppointment` in patient.controller
    - Queue called → `notifyQueueCalled` (already in reception.controller — verify)
    - Queue paused → `notifyQueuePaused` (already in reception.controller — verify)
    - Queue resumed → add `notifyQueueResumed` in reception.controller `resumeQueue`
    - Follow-up reminder → `notifyFollowUpReminder` (already in prescription.controller — verify)
    - _Requirements: each trigger tested individually_

  - [~] 2.4 Implement doctor and receptionist push notifications
    - New appointment booked: notify doctor via `notifyDoctorNewBooking` in payment.controller after queue assign
    - Follow-up added: notify doctor via `notifyDoctorFollowUp` in reception.controller `addFollowUp`
    - New walk-in: notify receptionist via `notifyReceptionistWalkIn` in reception.controller `addWalkIn`
    - _Requirements: staff notified within 10 seconds_

  - [~] 2.5 Add FCM notification handler in mobile app
    - In `usePushNotifications.js`: handle foreground notifications via `Notifications.addNotificationReceivedListener`
    - Handle background tap: `Notifications.addNotificationResponseReceivedListener` → navigate to relevant screen
    - Map notification `data.type` to navigation target (QUEUE_CALLED → LiveQueue, APPOINTMENT_BOOKED → Appointments, etc.)
    - _Requirements: works in all app states_

  - [~] 2.6 Add daily summary notification for clinic owners (cron)
    - In `appointmentReminder.job.js`: add daily 8PM IST cron job
    - Query total appointments, completed, revenue for each owner's clinic
    - Send via `sendNotification` with summary payload
    - _Requirements: owners receive daily digest_

  - [~] 2.7 Write unit tests for FCM notification service
    - Test: `sendNotification` calls Firebase Admin when configured
    - Test: `sendNotification` logs to console when not configured
    - Test: invalid tokens are cleaned up after send
    - File: `backend/src/__tests__/fcm.service.test.js`

- [x] 3. Phase 1.3 — Prescription PDF Generation
  - [~] 3.1 Install PDF generation library in backend
    - Install `pdfkit@0.15.0`: `npm install pdfkit@0.15.0` in backend/
    - Install `@types/pdfkit` as devDependency if TypeScript types needed
    - _Requirements: PDF generation service available_

  - [~] 3.2 Create `backend/src/services/pdf.service.js`
    - Function: `generatePrescriptionPDF(prescription, doctor, patient, clinic)` → returns Buffer
    - PDF layout (A4):
      - Header: clinic name, address, doctor name, qualification, registration number
      - Patient section: name, age, gender, date
      - Diagnosis section
      - Medicines table: name, dosage, frequency, duration, instructions per medicine
      - General instructions
      - Follow-up date (if set)
      - Footer: signature line, "This is a computer-generated prescription"
    - _Requirements: printable A4 format, professional layout_

  - [~] 3.3 Add `GET /api/prescriptions/:id/pdf` endpoint
    - In `prescription.controller.js`: add `getPrescriptionPDF` controller
    - Fetch full prescription with doctor profile (qualification, medicalRegistrationNumber), patient, clinic
    - Call `generatePrescriptionPDF` service
    - Set headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="prescription-{id}.pdf"`
    - Stream PDF buffer in response
    - Access control: same as `getPrescription`
    - Register route in `prescription.routes.js`
    - _Requirements: PDF opens correctly, download works_

  - [~] 3.4 Wire mobile Download button to real PDF download
    - Install `expo-file-system@~18.0.0` and `expo-sharing@~13.0.0` in PulseMateApp
    - In `PrescriptionsScreen.jsx` and `PrescriptionDetailScreen.jsx`:
      - Download button: call `GET /api/prescriptions/:id/pdf`, save to `FileSystem.documentDirectory`, open with `IntentLauncher` (Android) or `Sharing.shareAsync` (iOS)
      - Share button: download PDF then call `Sharing.shareAsync(fileUri)`
    - Show loading state during download
    - Handle errors gracefully (show Alert on failure)
    - _Requirements: download works, share works_

  - [~] 3.5 Write unit tests for PDF service
    - Test: generated PDF is a valid Buffer with content
    - Test: PDF contains doctor name, patient name, medicines
    - Test: PDF with no follow-up date does not include follow-up section header with empty value
    - File: `backend/src/__tests__/pdf.service.test.js`

- [x] 4. Phase 1.4 — Dynamic Doctor Time Slots
  - [~] 4.1 Create `DoctorAvailability` schema and migration
    - Add model to `prisma/schema.prisma`:
      ```
      model DoctorAvailability {
        id              String   @id @default(uuid())
        doctorId        String
        clinicId        String
        dayOfWeek       Int      // 0=Sun, 1=Mon ... 6=Sat
        startTime       String   // "09:00"
        endTime         String   // "17:00"
        slotDuration    Int      @default(15) // minutes
        maxPatients     Int      @default(20)
        isActive        Boolean  @default(true)
        createdAt       DateTime @default(now())
        updatedAt       DateTime @updatedAt

        doctor DoctorProfile @relation(fields: [doctorId], references: [id])
        clinic Clinic        @relation(fields: [clinicId], references: [id])

        @@unique([doctorId, clinicId, dayOfWeek])
        @@map("doctor_availabilities")
      }
      ```
    - Run migration: `npx prisma migrate dev --name doctor_availability`
    - _Requirements: availability model persists correctly_

  - [~] 4.2 Create `backend/src/controllers/availability.controller.js`
    - `GET /api/doctor/availability?doctorId=&clinicId=&date=YYYY-MM-DD` → return available slots
      - Get doctor's availability for that day of week
      - Generate all slots between startTime and endTime at slotDuration intervals
      - Exclude slots that already have a confirmed appointment (BOOKED/CHECKED_IN/IN_QUEUE/CALLED/IN_CONSULTATION)
      - Exclude past slots when date is today
      - Return: `{ slots: ["09:00", "09:15", ...], slotDuration, maxPatients, bookedCount }`
    - `POST /api/doctor/availability` (doctor auth) → create/update availability schedule
    - `PUT /api/doctor/availability/:id` (doctor auth) → update specific day's schedule
    - Register routes in a new `availability.routes.js` and mount in `server.js`
    - _Requirements: patients see only valid slots, no double booking_

  - [~] 4.3 Update BookingScreen to fetch and display real slots
    - Add `getAvailableSlots(doctorId, clinicId, date)` to `PulseMateApp/src/api/patient.js`
    - In `BookingScreen.jsx`: when date is selected, call `getAvailableSlots` API
    - Replace hardcoded `MORNING_SLOTS`, `AFTERNOON_SLOTS`, `EVENING_SLOTS` arrays
    - Group returned slots by time-of-day (Morning: before 12:00, Afternoon: 12–17:00, Evening: 17+)
    - Show loading spinner while slots load
    - Show "No slots available" when empty
    - Disable "Proceed to Pay" if no slot selected and slots exist
    - _Requirements: patients see only valid unbooked slots_

  - [~] 4.4 Add availability management UI to Doctor web dashboard
    - In `frontend/src/pages/doctor/DoctorProfilePage.jsx`: add "Availability Schedule" section
    - Day-of-week grid: for each day, show start/end time + slot duration
    - Toggle each day on/off
    - Save calls `POST /api/doctor/availability`
    - _Requirements: doctor can configure their schedule_

  - [~] 4.5 Write unit tests for slot generation logic
    - Test: slots generated correctly between 09:00 and 17:00 at 15-min intervals
    - Test: booked slots excluded from available list
    - Test: past slots excluded when date is today
    - Test: returns empty array when doctor has no availability set for that day
    - File: `backend/src/__tests__/availability.controller.test.js`

- [x] 5. Phase 1.5 — End-to-End Test Suite
  - [~] 5.1 Set up Jest test infrastructure for backend
    - Install: `jest@29.7.0`, `supertest@6.3.4`, `@jest/globals@29.7.0` in backend devDependencies
    - Create `backend/jest.config.js` with `testEnvironment: 'node'`, `testMatch: ['**/__tests__/**/*.test.js']`
    - Create `backend/src/__tests__/setup.js`: mock Prisma client with `jest.mock`
    - Add `"test": "jest --coverage"` script to `backend/package.json`
    - _Requirements: test runner works, coverage report generated_

  - [~] 5.2 Write unit tests — Auth module
    - Test OTP send: rate limit enforced, OTP stored hashed, returns 200
    - Test OTP verify: wrong OTP returns 401, expired OTP returns 401, correct OTP returns JWT
    - Test password login: wrong password returns 401, correct returns token
    - Test `authenticate` middleware: missing token returns 401, expired token returns 401, valid token sets `req.user`
    - Coverage target: 80%+ on auth.controller.js and auth.middleware.js
    - File: `backend/src/__tests__/auth.test.js`

  - [~] 5.3 Write unit tests — Booking & Payment module
    - Test `initiatePayment`: duplicate booking returns 409, invalid doctor-clinic returns 400, creates PENDING_PAYMENT appointment
    - Test `verifyPayment`: dev mode mock order auto-confirms, invalid signature returns 400, double-verify returns 409
    - Test `cancelAppointment`: cancels BOOKED appointment, rejects cancellation of IN_CONSULTATION
    - Coverage target: 80%+ on payment.controller.js
    - File: `backend/src/__tests__/payment.test.js`

  - [~] 5.4 Write unit tests — Queue & Reception module
    - Test `addWalkIn`: creates patient if not exists, assigns correct queue number
    - Test `callNext`: calls follow-up patients before regular patients, emits socket event
    - Test `pauseQueue`/`resumeQueue`: updates queue status, emits correct socket events
    - Test `recalculatePositions`: positions reassigned correctly after skip/call
    - Coverage target: 80%+ on reception.controller.js
    - File: `backend/src/__tests__/queue.test.js`

  - [~] 5.5 Write unit tests — Prescription module
    - Test `createPrescription`: duplicate prescription returns 409, creates with correct fields
    - Test `getPrescription`: patient can only access own prescription (403 on others)
    - Test `getPrescriptionPDF`: returns PDF buffer with correct content-type header
    - Coverage target: 80%+ on prescription.controller.js
    - File: `backend/src/__tests__/prescription.test.js`

  - [~] 5.6 Write integration tests — Patient Journey (full flow)
    - Test flow: Send OTP → Verify OTP (get token) → Update profile → Search doctors → Initiate payment → Verify payment (dev mode) → Check appointment status = BOOKED → Fetch live queue → Cancel appointment
    - Use `supertest` against real Express app with test database (or mocked Prisma)
    - File: `backend/src/__tests__/patient.journey.integration.test.js`

  - [~] 5.7 Write integration tests — Doctor Journey
    - Test flow: Doctor login → Get today's appointments → Start consultation → Complete consultation → Write prescription → Verify prescription is accessible by patient
    - File: `backend/src/__tests__/doctor.journey.integration.test.js`

  - [~] 5.8 Write integration tests — Reception Journey
    - Test flow: Receptionist login → Add walk-in → Check patient in queue → Call next → Mark complete
    - Verify socket events emitted at each step
    - File: `backend/src/__tests__/reception.journey.integration.test.js`

  - [~] 5.9 Write security tests
    - Test JWT: tampered token returns 401
    - Test rate limiting: >500 requests/min blocked (skip in dev — verify config)
    - Test OTP abuse: >5 failed attempts returns 429
    - Test authorization: patient cannot access doctor routes (403)
    - Test IDOR: patient A cannot view patient B's appointment
    - File: `backend/src/__tests__/security.test.js`

  - [~] 5.10 Set up CI/CD test pipeline
    - Create `.github/workflows/ci.yml` (update existing or create)
    - Steps: checkout → install backend deps → run `npm test -- --coverage` → upload coverage report
    - Set threshold: fail CI if coverage drops below 70%
    - Add mobile lint step: `cd PulseMateApp && npx expo-doctor`
    - _Requirements: CI runs on every push to main_

  - [~] 5.11 Generate production readiness report
    - Create `PRODUCTION_READINESS_REPORT.md` at repo root
    - Sections: Executive Summary, Phase completion status, Test coverage by module, Known bugs with severity (Critical/High/Medium/Low), Environment variables required for production, Deployment checklist
    - _Requirements: report documents all acceptance criteria pass/fail_

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4", "2.1", "3.1", "4.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "3.2", "4.2", "5.2"] },
    { "id": 2, "tasks": ["1.5", "2.3", "3.3", "4.3", "5.3", "5.4"] },
    { "id": 3, "tasks": ["1.6", "2.4", "3.4", "4.4", "5.5"] },
    { "id": 4, "tasks": ["1.7", "2.5", "2.6", "3.5", "4.5", "5.6"] },
    { "id": 5, "tasks": ["2.7", "5.7", "5.8", "5.9"] },
    { "id": 6, "tasks": ["5.10"] },
    { "id": 7, "tasks": ["5.11"] }
  ]
}
```
