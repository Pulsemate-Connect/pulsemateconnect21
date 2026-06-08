# PulseMate — Full Feature Audit
> Updated: June 7, 2026  
> Covers: Mobile App (PulseMateApp) · Web Frontend (frontend/) · Backend (backend/)  
> Note: Prescription feature has been fully removed from all three layers.

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Fully working end-to-end |
| ⚠️ | Partially working — known gap or limitation |
| ❌ | Not working / broken / missing |
| 🔧 | Code ready, needs env var / config to activate |

---

## 1. MOBILE APP (PulseMateApp — React Native / Expo)

### 1.1 Authentication
| Feature | Status | Notes |
|---------|--------|-------|
| OTP login (phone number) | ✅ | LoginScreen → OtpScreen → JWT in SecureStore |
| Password login | ✅ | `loginPass()` API wired |
| Logout | ✅ | Clears SecureStore, resets auth state, removes FCM token |
| Session restore on app restart | ✅ | `authStore` restores via `getMe()` on mount |
| Welcome / Onboarding screens | ✅ | WelcomeScreen and OnboardingScreen navigable |

---

### 1.2 Home Screen
| Feature | Status | Notes |
|---------|--------|-------|
| Greeting with user name | ✅ | Reads from authStore |
| Live appointment hero card (active queue) | ✅ | Fetches active appointment + live queue data |
| Queue stats (ahead / wait / serving) | ✅ | Real data from `getLiveQueue` API |
| Upcoming appointments list | ✅ | Fetched from `getMyAppointments` |
| Quick action grid (Book, Appointments, Profile) | ✅ | Prescription action removed; remaining 3 navigate correctly |
| Notifications bell | ✅ | Navigates to NotificationsScreen |
| Notification bell red dot | ❌ | **Hardcoded** — always shows regardless of unread count |
| Pull-to-refresh | ✅ | Works via `RefreshControl` |
| Nearby Clinics (GPS) | ✅ | Opt-in location; calls `getNearby` API |
| Search bar | ✅ | Tap navigates to SearchScreen |

---

### 1.3 Search / Find Doctors
| Feature | Status | Notes |
|---------|--------|-------|
| Search by name / specialization | ✅ | Calls `/patient/doctors` |
| Filter by specialization chip | ✅ | Client-side filter |
| Doctor listing (fee, spec, clinic) | ✅ | Fully rendered |
| Navigate to DoctorDetailScreen | ✅ | Passes doctorId |
| Empty state | ✅ | Shown correctly |

---

### 1.4 Doctor Detail Screen
| Feature | Status | Notes |
|---------|--------|-------|
| Doctor profile (name, spec, fee, clinic) | ✅ | Via `getDoctorProfile` |
| Clinic info | ✅ | Address, timings shown |
| Book Appointment button | ✅ | Navigates to BookingScreen |
| Doctor availability status | ✅ | Online/Offline shown |

---

### 1.5 Booking Screen
| Feature | Status | Notes |
|---------|--------|-------|
| Appointment type (In-Clinic / Online) | ✅ | Toggle works |
| Date picker (14-day carousel) | ✅ | Works correctly |
| Time slot selection | ✅ | Fetches real slots from backend; shows "Not Available" empty state if none — **no hardcoded fallback** |
| Symptom chips + free text | ✅ | Works |
| Patient profile auto-fill | ✅ | Name, gender, age, blood group shown |
| Profile incomplete warning + gate | ✅ | Blocks booking, redirects to ProfileWizard |
| Profile complete → back to Booking | ✅ | `returnTo` flow works |
| Payment summary | ✅ | Shows fee breakdown |
| Booking in dev mode (mock Razorpay) | ✅ | Works without real keys |
| Booking with real Razorpay | 🔧 | Code ready; `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` not set |
| Duplicate booking prevention | ✅ | Backend blocks same doctor+date duplicate |
| Success overlay | ✅ | Shows doctor name, date, queue token |

---

### 1.6 Appointments Screen
| Feature | Status | Notes |
|---------|--------|-------|
| List all appointments (upcoming + past) | ✅ | Fetched from backend |
| Filter tabs (All / Booked / In Queue / Completed) | ✅ | Works |
| Queue strip (position, wait time) | ✅ | Shown for active appointments |
| Cancel appointment | ✅ | BOOKED/IN_QUEUE can be cancelled |
| Navigate to AppointmentDetail | ✅ | Works |
| Book Again (from past appointment) | ✅ | One-tap rebook |
| Pull-to-refresh | ❌ | No `RefreshControl` — data only loads once on mount |
| "View All" past appointments button | ❌ | Renders but `onPress` is empty — does nothing |

---

### 1.7 Appointment Detail Screen
| Feature | Status | Notes |
|---------|--------|-------|
| Full appointment details | ✅ | Doctor, clinic, date, time, queue number |
| Status badge | ✅ | Color-coded |
| Follow-up card | ❌ | **Removed** — was driven by prescription data (prescription feature deleted) |
| View Prescription button | ❌ | **Removed** — prescription feature deleted |
| Live queue button | ✅ | Navigates to LiveQueueScreen |
| Cancel button | ✅ | BOOKED/IN_QUEUE appointments |
| Call clinic / Directions buttons | ✅ | Link to phone + maps |

---

### 1.8 Live Queue Screen
| Feature | Status | Notes |
|---------|--------|-------|
| Queue number (large display) | ✅ | Shows token number |
| Queue position / patients ahead | ✅ | From `getLiveQueue` API |
| Estimated wait time | ✅ | Shown |
| Currently serving number | ✅ | Shown |
| Status badge | ✅ | Live status |
| Real-time socket updates | ✅ | `useQueueSocket` hook handles Socket.io connection |
| Polling fallback (30s) | ✅ | Falls back to polling if socket disconnects |

---

### 1.9 Payments Screen
| Feature | Status | Notes |
|---------|--------|-------|
| Payment history list | ✅ | From `/payments/my` |
| Total paid / transaction count / pending summary | ✅ | Calculated client-side |
| Payment status badge | ✅ | Color-coded (PAID / PENDING / FAILED / REFUNDED) |
| Razorpay transaction ID | ✅ | Shown when available |
| Refund flow | ❌ | No refund API or UI anywhere in the system |

---

### 1.10 Profile Screen
| Feature | Status | Notes |
|---------|--------|-------|
| Display name, mobile, avatar initials | ✅ | Works |
| Verified badge | ❌ | **Hardcoded** — always shows green "Verified Account" regardless of actual verification status |
| Appointment stats | ✅ | Total/Completed/Upcoming/Cancelled from appointment list |
| Recent appointments list | ✅ | Shows last 3 |
| Edit Profile (inline bottom sheet) | ✅ | Saves to backend |
| Logout | ✅ | Alert confirmation → clears session |

---

### 1.11 EditProfileScreen (Legacy)
| Feature | Status | Notes |
|---------|--------|-------|
| Screen registered in navigator | ✅ | Exists in ProfileStack |
| Actually navigated to | ❌ | ProfileScreen uses inline EditSheet — nothing navigates to EditProfileScreen |

---

### 1.12 Profile Wizard (First-time setup)
| Feature | Status | Notes |
|---------|--------|-------|
| 6-step profile flow | ✅ | Name, Gender, DOB, City, Emergency Contact, Medical |
| Animated progress bar + step dots | ✅ | Works |
| Step validation | ✅ | Continue blocked until valid |
| Pre-fill from existing profile | ✅ | Via `route.params.profile` |
| Save to backend | ✅ | Calls `updatePatientProfile` |
| Return to Booking after completion | ✅ | `returnTo: 'Booking'` param flow works |

---

### 1.13 Notifications Screen
| Feature | Status | Notes |
|---------|--------|-------|
| List notifications | ✅ | Fetches from `/notifications/my` |
| Today / Earlier grouping | ✅ | Client-side grouping |
| Filter chips (All / Appointments / Queue / Reminders) | ⚠️ | Works but "Offers" category from backend not in filter list — only visible under "All" |
| Mark single notification as read | ⚠️ | Local `Set` only — resets on every reload, not saved to backend |
| Mark all read | ⚠️ | Same — local only |
| Settings icon | ❌ | Visually a settings gear but wired to `markAll()` — wrong action |
| Navigate to appointment from tap | ✅ | Tapping appointment notification goes to AppointmentDetail |
| Pull-to-refresh | ✅ | `RefreshControl` works |
| Push notifications (FCM) | 🔧 | `usePushNotifications` is fully built and wired in App.js; needs `FIREBASE_SERVICE_ACCOUNT_JSON` on backend |

---

### 1.14 Push Notifications Hook
| Feature | Status | Notes |
|---------|--------|-------|
| `usePushNotifications` hook exists | ✅ | Full implementation in `hooks/usePushNotifications.js` |
| Wired in App.js | ✅ | Called with `navigationRef` and `!!user` |
| Permission request | ✅ | iOS + Android handled |
| Android notification channel | ✅ | Created on setup |
| Expo push token registered with backend | ✅ | `POST /notifications/fcm-token` called |
| Foreground notification handling | ✅ | Banner + sound via `setNotificationHandler` |
| Background / killed state tap-to-navigate | ✅ | Navigates to correct screen based on `data.type` |
| Cold start (launched from notification) | ✅ | `getLastNotificationResponseAsync` handled with polling |
| Token removed on logout | ✅ | Registered as signOut callback |
| PRESCRIPTION_READY navigation case | ❌ | **Removed** — prescription feature deleted |

---

## 2. WEB FRONTEND (React + Vite)

### 2.1 Public / Auth Pages
| Feature | Status | Notes |
|---------|--------|-------|
| Public home page | ✅ | `/` landing page |
| Portal landing | ✅ | `/portal` |
| Patient login (OTP) | ✅ | `/login` |
| Patient registration | ✅ | `/register` |
| Doctor registration | ✅ | `/register/doctor` and `/portal/apply-doctor` |
| Clinic owner registration | ✅ | `/register/clinic-owner` |
| Staff login | ✅ | `/staff/login` |
| Role-based login | ✅ | `/login/:role` |
| Admin login | ✅ | `/admin` |
| Admin 2FA (security code) | ❌ | Field exists as placeholder — not wired to anything |
| Forgot password | ✅ | Email reset flow works |
| Reset password | ✅ | Token-based reset works |
| Pending verification page | ✅ | Shown to unverified doctors/clinics |
| SelectRolePage | ❌ | File exists but **no route in App.jsx** — unreachable dead code |

---

### 2.2 Patient Web Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Patient dashboard | ✅ | Stats, 3-card quick actions, recent appointments |
| Quick actions grid | ✅ | Find a Doctor, Appointments, My Profile (Prescriptions removed) |
| Doctor search | ✅ | Full search with filters |
| Doctor profile page | ✅ | Full detail view |
| Book appointment (modal) | ✅ | Date, type, symptoms |
| Payment page | ✅ | `/patient/payment/:id` — Razorpay or dev mode |
| My appointments list | ✅ | Status, cancel, detail view |
| Live queue tracking (web) | ✅ | Socket listener works — real-time updates |
| Patient profile | ✅ | Full management |
| My Prescriptions page | ❌ | **Removed** — prescription feature deleted |
| Write Prescription (doctor) | ❌ | **Removed** — prescription feature deleted |
| Notifications page (web) | ❌ | **Does not exist** — API is ready but no UI consumes it |
| Notification bell (header) | ❌ | Static icon — no page, no popover, no badge count |
| FCM push notifications (web) | 🔧 | `useFcm.js` exists but **Firebase block is commented out** entirely |

---

### 2.3 Doctor Web Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Doctor dashboard | ✅ | Today's appointments, stats, approval gate |
| Availability toggle (online/offline) | ✅ | Calls `updateAvailability` API |
| Today's appointment list | ✅ | With queue numbers |
| Start consultation | ✅ | Button per appointment card |
| Complete consultation (with notes) | ✅ | Notes modal, marks COMPLETED |
| All appointments list | ✅ | `/doctor/appointments` |
| Live queue management | ✅ | `/doctor/queue` with real-time socket updates |
| Write Prescription | ❌ | **Removed** — prescription feature deleted |
| Post-completion prescription prompt | ❌ | **Removed** — prescription feature deleted |
| Doctor schedule (per-day availability) | ✅ | `/doctor/schedule` — full day-of-week UI with time, slot duration, max patients |
| Doctor profile page | ✅ | Edit specialization, fee, bio |
| Approval / rejection gate | ✅ | `AccountApprovalState` for non-VERIFIED doctors |

---

### 2.4 Receptionist Web Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Reception dashboard | ✅ | Quick links, clinic info |
| Today's queue management | ✅ | Check-in, call, status update |
| Walk-in booking | ✅ | Adds patient directly to queue |
| Follow-up booking | ✅ | Priority queue insertion |
| Cash payment recording | ✅ | `POST /payments/cash` called |
| `/reception/*` redirects | ✅ | Old paths redirect to `/receptionist/*` |

---

### 2.5 Clinic Owner Web Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Owner dashboard | ✅ | Status banner, stats, revenue |
| Approval status flow (all states) | ✅ | PENDING/UNDER_REVIEW/VERIFIED/REJECTED/CHANGES_REQUIRED/SUSPENDED |
| Revenue analytics (today/week/month/all) | ✅ | Real revenue from payment records, by doctor |
| Manage clinic profile | ✅ | `/clinic/profile` |
| Edit & resubmit clinic | ✅ | `/clinic/edit-resubmit` |
| Manage doctors | ✅ | `/clinic/doctors` |
| Manage receptionists | ✅ | `/clinic/receptionists` |
| Appointment overview | ✅ | `/clinic/appointments` |
| Queue overview | ✅ | `/clinic/queue` |
| Multiple clinics support | ✅ | Dropdown selector when >1 clinic |

---

### 2.6 Admin Web Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Admin login | ✅ | `/admin` |
| Admin dashboard (stats) | ✅ | `/admin/dashboard` |
| Users management | ✅ | List, search, enable/disable users |
| Clinic verification list | ✅ | `/admin/clinics/verify` |
| Clinic verification detail + approve/reject | ✅ | Full detail with document review |
| Admin level permissions | ✅ | ROOT/SUPER_ADMIN/SUPPORT/FINANCE enforced on routes |
| `ClinicApprovals.jsx` | ❌ | File exists but **not routed** — dead code duplicating ClinicVerification |

---

## 3. BACKEND (Node.js / Express / Prisma)

### 3.1 Authentication & Security
| Feature | Status | Notes |
|---------|--------|-------|
| OTP login | ✅ | Redis-backed OTP with expiry |
| Password login | ✅ | bcrypt hashed |
| JWT access + refresh tokens | ✅ | Short-lived access, long-lived refresh in cookie |
| Email verification | ✅ | Token-based flow |
| Password reset via email | ✅ | SMTP email sending |
| Session management | ✅ | `/api/sessions` list/revoke |
| Rate limiting | ✅ | Applied globally |
| Role-based auth middleware | ✅ | `authorize()` checks roles |

---

### 3.2 Notifications
| Feature | Status | Notes |
|---------|--------|-------|
| `GET /notifications/my` | ✅ | Derived from real DB data — today's appts, recent appts, welcome message |
| Notification categories | ✅ | Appointments, Queue Updates, Reminders, Offers generated |
| `PATCH /notifications/:id/read` | ⚠️ | Returns 200 but **no-op** — notifications not stored, can't persist read state |
| `PATCH /notifications/read-all` | ⚠️ | Same — no-op |
| FCM token registration/removal | ✅ | Saves/deletes from DB |
| Push notification sending | 🔧 | Code complete; real pushes when `FIREBASE_SERVICE_ACCOUNT_JSON` set |
| Prescription follow-up reminders in notifications | ❌ | **Removed** — prescription feature deleted |

---

### 3.3 Appointment Reminders (Cron Job)
| Feature | Status | Notes |
|---------|--------|-------|
| 24-hour reminder | ✅ | Cron runs hourly |
| 2-hour reminder | ✅ | Same job |
| Deduplication | ✅ | `ReminderSent` table prevents double-send |
| FCM push delivery | 🔧 | Dependent on `FIREBASE_SERVICE_ACCOUNT_JSON` |
| Daily owner digest | ❌ | **Does not exist** — not implemented |

---

### 3.4 Queue & Socket System
| Feature | Status | Notes |
|---------|--------|-------|
| Queue creation on first booking | ✅ | Auto-created in payment controller |
| Queue number assignment | ✅ | Incremental per doctor+clinic+date |
| Estimated wait time | ✅ | Based on `avgConsultationMins` |
| Socket room join (patient / staff) | ✅ | `patient:joinQueueRoom` / `staff:joinQueueRoom` |
| Socket emit on booking | ✅ | `queue:updated` after payment verify |
| Socket emit on queue advance | ✅ | On check-in / call / complete |
| Mobile socket connection | ✅ | `useQueueSocket` hook in LiveQueueScreen |
| Web patient live queue | ✅ | `useSocket` hook in web LiveQueue page |
| Real-time notification delivery over socket | ❌ | Not implemented — socket handles queue only |

---

### 3.5 Payments
| Feature | Status | Notes |
|---------|--------|-------|
| Initiate payment (create order) | ✅ | Dev mode works; real Razorpay when keys set |
| Verify payment (confirm appointment) | ✅ | HMAC signature check |
| Dev mode | ✅ | Mock order auto-confirmed |
| Cash payment (receptionist) | ✅ | `POST /payments/cash` |
| Refunds | ❌ | No refund endpoint, no refund UI — completely missing |
| Notify doctor on new booking | ❌ | `notifyDoctorNewBooking` exists but never called from payment controller |
| Get my payments | ✅ | Paginated payment history |

---

### 3.6 Appointment Lifecycle Notifications
| Feature | Status | Notes |
|---------|--------|-------|
| Notify patient on booking confirmed | ✅ | `notifyAppointmentBooked` called in notification.service |
| Notify patient on cancellation | ❌ | `notifyAppointmentCancelled` exists in fcm.service but **never called** from cancelAppointment |
| Notify doctor on new booking | ❌ | `notifyDoctorNewBooking` exists in fcm.service but **never called** |
| Notify doctor on follow-up | ✅ | `notifyDoctorFollowUp` called in reception controller |
| Notify patient on queue called | ✅ | `notifyQueueCalled` called in queue/doctor controllers |
| Notify patient queue resumed | ✅ | `notifyQueueResumed` called |
| Notify receptionist on walk-in | ✅ | `notifyReceptionistNewWalkIn` called |

---

### 3.7 Doctor Availability
| Feature | Status | Notes |
|---------|--------|-------|
| Create/update availability slots | ✅ | `POST /api/doctor/availability` |
| Get doctor slots (patient booking) | ✅ | `GET /api/doctor/:id/slots` — returns unbooked real slots |
| Get availability (doctor view) | ✅ | `GET /api/doctor/:id/availability` |
| Web UI for availability management | ✅ | DoctorSchedulePage fully implemented |

---

### 3.8 Prescriptions
> **Prescription feature has been fully removed.**

All prescription routes, controller, service, schema model, and UI components have been deleted. A migration (`20260607100000_remove_prescriptions`) drops the `prescriptions` table. No remaining references exist in any file.

---

## 4. CRITICAL GAPS SUMMARY

### 🔴 Broken / Missing (Must Fix Before Launch)
| # | Issue | Layer |
|---|-------|-------|
| 1 | No notifications page anywhere in web frontend | Web |
| 2 | Notification bell dot hardcoded (always red) | Mobile |
| 3 | `cancelAppointment` sends no notification to patient or doctor | Backend |
| 4 | `notifyDoctorNewBooking` never called after booking | Backend |
| 5 | AppointmentsScreen has no pull-to-refresh | Mobile |
| 6 | "View All" past appointments button does nothing | Mobile |
| 7 | Notification settings icon wired to wrong action | Mobile |

### 🟠 Incomplete Features
| # | Issue | Layer |
|---|-------|-------|
| 8 | Refund flow — completely missing | Backend + Web + Mobile |
| 9 | Notification read state doesn't persist to backend | Backend + All |
| 10 | Daily owner digest cron job missing | Backend |
| 11 | Web push notifications disabled (Firebase commented out) | Web |
| 12 | Admin 2FA security code is a placeholder | Web |
| 13 | Socket notification channel — doesn't exist | Backend |

### 🟡 Misleading UI
| # | Issue | Layer |
|---|-------|-------|
| 14 | ProfileScreen "Verified Account" badge always shows | Mobile |
| 15 | "Offers" filter chip missing from NotificationsScreen | Mobile |

### 🔵 Dead Code (Safe to Delete)
| File | Reason |
|------|--------|
| `PulseMateApp/src/screens/EditProfileScreen.jsx` | ProfileScreen uses inline EditSheet; this is never navigated to |
| `frontend/src/pages/admin/ClinicApprovals.jsx` | Not imported or routed in App.jsx |
| `frontend/src/pages/auth/SelectRolePage.jsx` | No route registered in App.jsx |

---

## 5. CONFIGURATION REQUIRED

Features fully coded but disabled — needs env vars:

| Feature | Env Var(s) Needed | File |
|---------|------------------|------|
| Real Razorpay payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | `backend/.env` |
| Backend FCM push | `FIREBASE_SERVICE_ACCOUNT_JSON` | `backend/.env` |
| Web push notifications | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | `frontend/.env` |
| Appointment reminder emails | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | `backend/.env` |

---

## 6. FULLY WORKING END-TO-END JOURNEYS

These complete flows work with no issues:

1. **Patient books appointment** → Search → Doctor detail → Booking → Real slots (or empty state) → Pay (dev mode) → Queue assigned → Success overlay → Visible in Appointments
2. **Profile wizard → return to booking** → Wizard completes → Returns to BookingScreen with valid profile
3. **Clinic owner onboarding** → Register → Pending → Admin verifies → Features unlock
4. **Doctor consultation** → Dashboard → Start → Complete (with notes)
5. **Doctor schedule** → Configure per-day slots → Patient sees real slots in booking
6. **Receptionist walk-in** → Add patient → Queue entry created → Doctor sees in queue
7. **Follow-up booking (reception)** → Priority insertion → Doctor sees it
8. **Admin clinic approval** → Review detail → Approve/Reject with reason → Owner gets email
9. **Password reset** → Forgot → Email → Reset link → New password
10. **Appointment cancellation** → Cancel from Appointments → Status updates → Backend confirms
11. **Revenue analytics (owner)** → Real data, broken down by doctor, period filter works
12. **Appointment reminders** → Cron runs hourly, deduplicates, fires FCM when configured
13. **Live queue (web + mobile)** → Socket updates in real-time via `useQueueSocket` / `useSocket`
14. **Push notifications (mobile)** → `usePushNotifications` fully wired — permissions, token register, foreground/background/cold-start tap navigation
15. **Session management** → Multiple device sessions, list and revoke individual sessions
