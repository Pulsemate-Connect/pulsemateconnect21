# PulseMate — Project Progress

> Last updated: June 6, 2026

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL + Prisma ORM |
| Frontend | React 18, Vite, TailwindCSS, Zustand |
| Mobile | Expo (React Native) |
| Auth | JWT (access + refresh), OTP, HttpOnly cookies |
| Realtime | Socket.io |
| Notifications | FCM (Firebase Cloud Messaging) + Email (Nodemailer/Resend) |
| Payments | Razorpay (integrated, 2-step flow) |
| Security | Helmet, bcrypt, rate limiting, CORS, audit logs |

---

## 1. Authentication & Users

- [x] OTP login via mobile (console / Twilio / MSG91 / Fast2SMS)
- [x] Password login (clinic owners, doctors, staff)
- [x] JWT access token (15 min) + refresh token rotation
- [x] HttpOnly cookie session with reuse detection
- [x] Forgot password → email reset link flow
- [x] Email verification for clinic owner registration
- [x] Role-based auth middleware — 5 roles: `PATIENT`, `DOCTOR`, `RECEPTIONIST`, `CLINIC_OWNER`, `SUPER_ADMIN`
- [x] Admin levels: `ROOT`, `SUPER_ADMIN`, `SUPPORT`, `FINANCE`
- [x] Protected routes on both frontend and backend
- [x] Session management (multi-device, revoke, list)

---

## 2. Database Schema (Prisma — 18 Models)

| Model | Purpose |
|---|---|
| `User` | All roles share one user table |
| `PatientProfile` | Extended patient info (age, blood group, allergies, etc.) |
| `DoctorProfile` | Qualifications, specialization, availability, marketplace visibility |
| `ReceptionistProfile` | Assigned clinic, created by owner |
| `AdminProfile` | Admin level, created-by tracking |
| `Clinic` | Full clinic info — location, docs, approval status, schedule |
| `ClinicStaff` | Many-to-many: users ↔ clinics with roles |
| `DoctorClinic` | Marketplace doctor-clinic link (invite/accept system) |
| `Appointment` | Booking with status lifecycle (9 states) |
| `Queue` | Per-doctor per-day queue with pause/resume |
| `QueueItem` | Individual patient in queue (position, status) |
| `Prescription` | Doctor-written, linked to appointment |
| `Payment` | Razorpay integration, status tracking |
| `Session` | Active device sessions |
| `RefreshToken` | JWT refresh with rotation |
| `OtpVerification` | Rate-limited OTP with hash |
| `EmailVerification` | Token-based email verification |
| `PasswordResetToken` | Secure reset with expiry |
| `FcmToken` | Push notification device tokens |
| `AuditLog` | All important actions logged |
| `ClinicVerificationLog` | Full history of clinic approval status changes |

9 migrations applied, tracking the full evolution of the schema.

---

## 3. Backend API

### Routes (12 route files)

| Route | Key Endpoints |
|---|---|
| `/api/auth` | send-otp, verify-otp, login-password, refresh, logout, me |
| `/api/patient` | search doctors, book appointment, my appointments, live queue, profile, prescriptions, payment |
| `/api/doctor` | dashboard, today's queue, appointments, start/complete consultation, availability toggle, profile |
| `/api/reception` | today's queue, walk-in, check-in, call-next, skip, complete, pause/resume |
| `/api/clinic` | create/update clinic, manage staff, appointments, profile |
| `/api/admin` | dashboard, clinic approvals, user management, create staff |
| `/api/approvals` | clinic submission, resubmission, status updates |
| `/api/marketplace` | doctor discovery with filters |
| `/api/prescriptions` | write, view by patient/appointment |
| `/api/payments` | create order, verify, status |
| `/api/notifications` | FCM token register, send push |
| `/api/sessions` | list active sessions, revoke |

### Middleware
- `authenticate` — JWT verification
- `authorize` — role + admin level guard
- `upload` — Multer file uploads (clinic docs, logos)
- `rateLimiter` — OTP (5/15min), login, global (500/min, skipped in dev)
- `errorHandler` — centralized error responses

### Services
- OTP service (multi-provider)
- Email service (Nodemailer / Resend)
- Email verification service
- Token service (JWT sign/verify/rotate)
- Audit log service
- FCM notification service

---

## 4. Clinic Approval Flow

Full multi-stage lifecycle with email notifications at each step:

```
PENDING → UNDER_REVIEW → VERIFIED
                       ↘ REJECTED
                       ↘ CHANGES_REQUIRED → (owner edits) → PENDING
                       ↘ SUSPENDED
```

- [x] Clinic owner registers with email + mobile OTP verification
- [x] Submits clinic with documents (logo, license, GST, PAN, certificates)
- [x] Admin reviews via `ClinicVerification` dashboard with filters and pagination
- [x] Admin can approve, reject, request changes, or suspend
- [x] Every status change logged to `ClinicVerificationLog`
- [x] Owner notified by email at each stage
- [x] Owner can edit and resubmit when `CHANGES_REQUIRED`
- [x] `ClinicNotVerifiedGuard` blocks access to clinic features until approved
- [x] `PendingVerificationPage` shown while awaiting review

---

## 5. Frontend (React / Vite)

### Auth Pages (12 pages)
- Login, Register, Role Login, Staff Login, Admin Login
- Doctor Register, Clinic Owner Register
- Forgot Password, Reset Password
- Pending Verification, Portal Landing, Public Home

### Patient Portal (10 pages)
- Dashboard, Doctor Search, Doctor Profile
- Book Appointment (modal), My Appointments, Appointment Detail
- Live Queue (real-time), My Prescriptions, Patient Profile, Payment Page
- Profile Setup Wizard (modal)

### Doctor Portal (5 pages)
- Dashboard, Appointments, Queue Management
- Profile Page, Write Prescription

### Receptionist Portal (4 pages)
- Dashboard, Today's Queue, Walk-in Booking, Follow-up Booking

### Clinic Owner Portal (6 pages)
- Dashboard, Clinic Profile, Clinic Edit & Resubmit
- Manage Staff (doctors + receptionists), Appointments, Queue Overview

### Admin Portal (5 pages)
- Dashboard (stats), Clinic Verification (list + filters + pagination)
- Clinic Verification Detail (review + approve/reject/request changes)
- Clinic Approvals, Users Management

### Shared Components / Infrastructure
- `ProtectedRoute` — role + admin level gating
- `ClinicNotVerifiedGuard` — blocks unverified clinic owners
- `DashboardLayout` — sidebar navigation
- `StatsCard`, `StatusBadge`, `AccountApprovalState`
- `ClinicVerificationTable`, `FilterBar`, `Pagination`, `SummaryCard` (admin)
- `useAuthStore` (Zustand) — global auth state
- `useFcm` hook — Firebase push notification registration
- `useSocket` hook — Socket.io connection

---

## 6. Real-time (Socket.io)

Room format: `queue:{clinicId}:{doctorId}:{YYYY-MM-DD}`

| Event | Direction | Trigger |
|---|---|---|
| `patient:joinQueueRoom` | Client → Server | Patient opens live queue |
| `staff:joinQueueRoom` | Client → Server | Staff opens queue |
| `queue:updated` | Server → Client | Any queue change |
| `queue:called` | Server → Client | Patient called |
| `queue:positionUpdated` | Server → Client | Positions recalculated |
| `queue:paused` | Server → Client | Queue paused |
| `queue:resumed` | Server → Client | Queue resumed |
| `queue:completed` | Server → Client | Consultation done |

---

## 7. Mobile App (Expo / React Native)

18 screens covering the full patient journey:

| Screen | Purpose |
|---|---|
| `WelcomeScreen` | App entry / splash |
| `OnboardingScreen` | Animated onboarding flow |
| `LoginScreen` | Mobile number entry |
| `OtpScreen` | OTP verification |
| `HomeScreen` | Patient home dashboard |
| `SearchScreen` | Doctor search with filters |
| `DoctorDetailScreen` | Doctor profile + booking |
| `BookingScreen` | Appointment booking |
| `AppointmentsScreen` | My appointments list |
| `AppointmentDetailScreen` | Single appointment detail |
| `LiveQueueScreen` | Real-time queue position |
| `PrescriptionsScreen` | My prescriptions list |
| `PrescriptionDetailScreen` | Single prescription view |
| `PaymentsScreen` | Payment history |
| `NotificationsScreen` | Push notifications |
| `ProfileScreen` | View profile |
| `EditProfileScreen` | Edit profile |
| `ProfileWizardScreen` | First-time profile setup |

Stack: Expo ~54, React Native 0.81, React Navigation (stack + bottom tabs), Socket.io client, expo-secure-store, expo-location.

---

## 8. Security

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] OTPs hashed, never stored plain
- [x] JWT with short expiry + refresh rotation + reuse detection
- [x] HttpOnly secure cookies
- [x] Helmet.js security headers
- [x] CORS restricted to frontend URL (with LAN override for mobile dev)
- [x] Rate limiting on OTP, login, and global endpoints
- [x] Input validation with Joi on all endpoints
- [x] Audit logs on all important actions
- [x] File upload validation via Multer

---

## 9. Seed Data

| Role | Mobile | Email |
|---|---|---|
| Super Admin | +919000000001 | admin@pulsemate.com |
| Clinic Owner | +919000000002 | owner@pulsemate.com |
| Doctor 1 (Cardiologist) | +919000000003 | doctor1@pulsemate.com |
| Doctor 2 (General) | +919000000004 | doctor2@pulsemate.com |
| Receptionist | +919000000005 | reception@pulsemate.com |
| Patient 1–3 | +91900000000(6–8) | OTP login |

All staff password: `Password@123`
Dev OTP: printed to backend terminal (no SMS needed).

---

## What's Next / Not Yet Built

- [ ] Telemedicine / video consultation flow
- [ ] Razorpay webhook handling (refunds, failures)
- [ ] Admin analytics / reporting page
- [ ] Doctor marketplace public listing page
- [ ] Patient health records / history
- [ ] Multi-clinic doctor scheduling
- [ ] SMS notifications (Twilio/MSG91 wired but not actively used)
- [ ] Mobile app: clinic owner / doctor views
- [ ] Production deployment (Docker, CI/CD)
