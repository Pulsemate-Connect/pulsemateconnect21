# PulseMate — Missing & Incomplete Features Report
> Generated: June 7, 2026  
> Covers: Backend · Web Frontend · Mobile App (PulseMateApp)

---

## 🔴 CRITICAL — Broken UX (Must Fix Before Launch)

### 1. Prescription Download & Share (Mobile) — FAKE ALERTS
**Where:** `PulseMateApp/src/screens/PrescriptionsScreen.jsx` + `PrescriptionDetailScreen.jsx`  
**Problem:** Both the Download and Share buttons call `Alert("Downloaded")` / `Alert("Share")` — they do absolutely nothing functional.  
**Backend is ready:** `GET /api/prescriptions/:id/pdf` fully works and streams a professional A4 PDF.  
**Fix needed:**
- Install `expo-file-system` and `expo-sharing` in PulseMateApp
- Wire Download button → fetch PDF → save to device storage
- Wire Share button → download PDF → open OS share sheet

---

### 2. Appointment Cancellation Notification NOT Sent
**Where:** `backend/src/controllers/patient.controller.js` → `cancelAppointment()`  
**Problem:** When a patient cancels, no push notification is sent to them or the doctor.  
`notifyAppointmentCancelled` exists in `fcm.service.js` but is never called on cancel.  
`notifyDoctorNewBooking` is also never called in `payment.controller.js` after queue assignment.

---

### 3. Web Frontend Has No Notifications Page
**Where:** `frontend/src/` — the page doesn't exist  
**Problem:** `notification.api.js` has all the API functions (`getMyNotifications`, `markNotificationRead`, `markAllNotificationsRead`) but nothing in the UI calls them. There is no notifications page, panel, or dropdown anywhere in the web frontend.  
**Backend is ready:** `GET /notifications/my` returns smart derived notifications with categories.

---

### 4. Notification Bell Dot (Mobile) — Hardcoded Red Dot
**Where:** `PulseMateApp/src/screens/HomeScreen.jsx`  
**Problem:** The red dot on the notifications bell is hardcoded static — it shows for every user regardless of whether they have unread notifications.  
**Fix needed:** Call `GET /notifications/my` and use the `unreadCount` field to conditionally show/hide the dot.

---

### 5. "View All" Past Appointments Button Does Nothing (Mobile)
**Where:** `PulseMateApp/src/screens/AppointmentsScreen.jsx`  
**Problem:** The "View All" button in the past appointments section renders fine but has an empty `onPress` handler — tapping it does nothing.

---

### 6. Appointments Screen Has No Pull-to-Refresh (Mobile)
**Where:** `PulseMateApp/src/screens/AppointmentsScreen.jsx`  
**Problem:** The screen only loads data on mount via `useEffect`. No `RefreshControl` — users cannot manually refresh without navigating away and back.

---

### 7. Notification Settings Icon Wired to Wrong Action (Mobile)
**Where:** `PulseMateApp/src/screens/NotificationsScreen.jsx`  
**Problem:** The settings gear icon (top right) calls `markAll()` instead of opening a notification settings view. This is a wrong wiring — tapping settings silently marks all notifications as read.

---

### 8. Notification Read State Doesn't Persist
**Where:** Backend + Mobile + Web  
**Problem:** `PATCH /notifications/:id/read` and `PATCH /notifications/read-all` both return 200 OK but are no-ops — notifications are derived from DB data at request time, not stored, so there is no row to mark as read. Read state is tracked client-side only and resets on every page reload.  
**Fix needed:** Either store notifications in a DB table, or implement a separate `read_notification_ids` user preference table.

---

## 🟠 HIGH — Incomplete Features

### 9. Doctor Availability Schedule UI Missing (Web)
**Where:** `frontend/src/pages/doctor/DoctorProfilePage.jsx`  
**Problem:** The doctor can toggle online/offline status but there is **no per-day schedule UI** — no day-of-week grid, no start/end time inputs, no slot duration setting.  
**Backend is fully ready:** `POST /api/doctor/availability` and `PUT /api/doctor/availability/:id` exist and work.  
The doctor has no way to configure their weekly schedule through the web dashboard.

---

### 10. Dynamic Booking Slots — Falls Back to Hardcoded (Mobile)
**Where:** `PulseMateApp/src/screens/BookingScreen.jsx`  
**Problem:** The app does call `getAvailableSlots` from the backend, but when the doctor has no availability configured (or on any API error), it silently falls back to hardcoded `MORNING_SLOTS` / `AFTERNOON_SLOTS` / `EVENING_SLOTS` arrays.  
Most doctors in the system don't have `DoctorAvailability` rows yet → most users always see fake hardcoded slots.

---

### 11. Mobile FCM Push Notifications Not Wired
**Where:** `PulseMateApp/src/` — file doesn't exist  
**Problem:** There is no `usePushNotifications.js` hook in the mobile app.  
- App never requests notification permissions  
- App never registers an FCM/Expo push token with the backend  
- App never handles incoming push notifications (foreground, background, or tap-to-navigate)  
**Backend is fully ready:** FCM service sends real push notifications when `FIREBASE_SERVICE_ACCOUNT_JSON` is set.

---

### 12. Refund Flow — Completely Missing
**Where:** Backend + Web + Mobile  
**Problem:** There is no refund functionality anywhere in the system.  
- No `POST /api/payments/refund` endpoint  
- No refund UI on the mobile Payments screen  
- No refund UI on any web dashboard  
- Razorpay refund API is not wired  
Patients have no way to request or receive refunds.

---

### 13. Patient File / Report Upload — Not Implemented
**Where:** `PulseMateApp/src/screens/PrescriptionsScreen.jsx`  
**Problem:** An upload reports banner exists in the component styles but is **not rendered** in the JSX — the feature was started but never completed.  
No backend endpoint exists for patient-uploaded medical documents either.

---

### 14. Doctor "Book Follow-up" Shortcut Missing (Web)
**Where:** `frontend/src/pages/doctor/` — prescription and consultation views  
**Problem:** After completing a consultation or writing a prescription, there is no "Book Follow-up" button on the doctor's side. The receptionist can add follow-ups, but the doctor cannot initiate one directly from the prescription or consultation flow.

---

### 15. Daily Owner Digest Push Notification — Not Implemented
**Where:** `backend/src/jobs/appointmentReminder.job.js`  
**Problem:** The production tasks spec defines a daily 8PM IST cron job that sends clinic owners a summary (total appointments, completed, revenue). This job does not exist in the codebase.

---

### 16. Web Push Notifications Completely Disabled
**Where:** `frontend/src/hooks/useFcm.js`  
**Problem:** The entire Firebase initialization block in `useFcm.js` is commented out. Web push notifications are completely disabled.  
**Fix needed:** Set `VITE_FIREBASE_*` environment variables and uncomment the Firebase block.

---

### 17. "Offers" Notification Category Missing (Mobile Filter)
**Where:** `PulseMateApp/src/screens/NotificationsScreen.jsx`  
**Problem:** The backend generates "Offers" category notifications, but the mobile filter chip list doesn't include an "Offers" tab. These notifications only appear under "All" — users can't filter to see them.

---

### 18. Real-Time Socket Notifications — Not Implemented
**Where:** Backend + Mobile + Web  
**Problem:** Socket.io only handles queue room events. There is no socket channel for live notification delivery. Users must manually pull-to-refresh the notifications screen to see new notifications.

---

## 🟡 MEDIUM — Incorrect / Misleading UI

### 19. Verified Badge Always Shows (Mobile Profile)
**Where:** `PulseMateApp/src/screens/ProfileScreen.jsx`  
**Problem:** The green "Verified" badge is hardcoded — it shows for every single user regardless of their actual email/phone verification status. Unverified accounts appear verified.

---

### 20. Admin 2FA Security Code — Placeholder Field
**Where:** `frontend/src/pages/admin/AdminLoginPage.jsx`  
**Problem:** There is a "Security Code" input field on the admin login page with a note saying *"This field is a placeholder for the next admin security step and is not required yet."* It is not wired to anything. Admin accounts have no 2FA protection.

---

## 🔵 LOW — Dead Code (Safe to Delete)

| File | Reason |
|------|--------|
| `PulseMateApp/src/screens/EditProfileScreen.jsx` | Never navigated to — `ProfileScreen` uses an embedded `EditSheet` instead |
| `frontend/src/pages/admin/ClinicApprovals.jsx` | Not imported or routed anywhere in `App.jsx` |
| `frontend/src/pages/auth/SelectRolePage.jsx` | No route registered for it in `App.jsx` |

---

## ⚙️ CONFIGURATION REQUIRED (Code Ready, Needs Env Vars)

These features are **fully coded** but disabled because environment variables are not set:

| Feature | Required Env Var(s) | Where to Set |
|---------|-------------------|--------------|
| Real Razorpay payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | `backend/.env` |
| Backend FCM push notifications | `FIREBASE_SERVICE_ACCOUNT_JSON` | `backend/.env` |
| Web push notifications | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | `frontend/.env` |
| Appointment reminder emails (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | `backend/.env` |
| Twilio SMS (OTP fallback) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | `backend/.env` |

---

## ✅ FULLY WORKING END-TO-END (For Reference)

These complete user journeys work with no issues:

1. Patient books appointment → Search → Doctor detail → Booking → Pay (dev mode) → Queue assigned → Success
2. Profile wizard → return to booking → wizard completes → booking resumes with valid profile
3. Clinic owner onboarding → register → pending → admin verifies → features unlock
4. Doctor consultation flow → dashboard → start consultation → complete → write prescription
5. Receptionist walk-in → add patient → queue entry created → doctor sees in queue
6. Admin clinic approval → review → approve/reject with reason → owner sees status update
7. Password reset → forgot password → email → reset link → new password set
8. Appointment cancellation → cancel from Appointments screen → status updates
9. Revenue analytics (owner) → real revenue from payment records, broken down by doctor
10. Appointment reminders → cron job runs hourly, deduplicates, fires FCM when configured
11. Live queue (web) → socket updates work in real-time for web patients and doctors
12. Prescription PDF → backend generates professional A4 PDF (only needs mobile download wiring)
13. Dynamic slots → backend returns real unbooked slots (only needs doctor availability to be configured)

---

## Priority Order for Fixes

| Priority | Item | Effort |
|----------|------|--------|
| 🔴 1 | Wire prescription PDF download/share on mobile | Medium |
| 🔴 2 | Add web notifications page | Medium |
| 🔴 3 | Fire cancellation + doctor booking notifications | Small |
| 🔴 4 | Fix notification bell dot count (mobile) | Small |
| 🔴 5 | Fix "View All" past appointments button | Small |
| 🔴 6 | Add pull-to-refresh to AppointmentsScreen | Small |
| 🔴 7 | Fix notification settings icon wiring | Small |
| 🟠 8 | Build doctor availability schedule UI (web) | Large |
| 🟠 9 | Create `usePushNotifications` hook (mobile FCM) | Large |
| 🟠 10 | Build refund flow (backend + UI) | Large |
| 🟠 11 | Fix dynamic slots fallback behavior | Small |
| 🟠 12 | Implement daily owner digest cron | Medium |
| 🟠 13 | Enable web push (uncomment + set env vars) | Small |
| 🟡 14 | Fix hardcoded verified badge | Small |
| 🟡 15 | Add "Offers" filter chip (mobile notifications) | Small |
| 🟡 16 | Add socket notification channel | Large |
| 🟡 17 | Implement Admin 2FA | Large |
| 🔵 18 | Delete 3 dead files | Trivial |
