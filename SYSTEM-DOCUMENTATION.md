# PulseMate Connect — Complete System Documentation

> Last updated: July 3, 2026  
> Version: 1.2.0 (versionCode 20)  
> Stack: React Native (Expo) · React/Vite Web · Node.js/Express · PostgreSQL/Prisma · Render

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [User Roles & Access](#3-user-roles--access)
4. [Authentication Flow](#4-authentication-flow)
5. [Patient App (React Native)](#5-patient-app-react-native)
6. [Web Portal — Admin Panel](#6-web-portal--admin-panel)
7. [Web Portal — Clinic Owner Dashboard](#7-web-portal--clinic-owner-dashboard)
8. [Web Portal — Doctor Panel](#8-web-portal--doctor-panel)
9. [Web Portal — Receptionist Panel](#9-web-portal--receptionist-panel)
10. [Queue System — Full Flow](#10-queue-system--full-flow)
11. [Booking & Payment Flow](#11-booking--payment-flow)
12. [Revenue Model](#12-revenue-model)
13. [Notification System](#13-notification-system)
14. [Session-Based Queue Architecture](#14-session-based-queue-architecture)
15. [Estimated Appointment Time System](#15-estimated-appointment-time-system)
16. [Database Schema Summary](#16-database-schema-summary)
17. [API Overview](#17-api-overview)
18. [Deployment](#18-deployment)

---

## 1. System Overview

PulseMate Connect is a healthcare appointment booking and queue management platform with:

- **Patient mobile app** (React Native / Expo) for booking and live queue tracking
- **Web portal** for Clinic Owners, Doctors, Receptionists, and Super Admins
- **Real-time queue** via Socket.IO
- **Payment gateway** via Razorpay (₹10 platform fee per booking)
- **OTP login** via Firebase Phone Auth (patients) and Email/Password (staff)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│                                                          │
│  React Native App (Patient)    React/Vite Web (Staff)   │
│  - Expo managed workflow       - Tailwind CSS            │
│  - Firebase Phone OTP          - Role-based dashboards   │
└──────────────────────┬──────────────────┬───────────────┘
                       │ HTTPS REST       │ Socket.IO
                       ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Node.js / Express)                │
│  - JWT Auth (access 15min + refresh 7d)                  │
│  - Prisma ORM                                            │
│  - Socket.IO for real-time queue events                  │
│  - Razorpay payment integration                          │
│  - Firebase Admin SDK (FCM push notifications)           │
│  - Cloudinary (file/image uploads)                       │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (Render managed)                 │
│  - Prisma migrations                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. User Roles & Access

| Role | Platform | Access |
|------|----------|--------|
| `PATIENT` | Mobile App | Book appointments, track queue, view history |
| `DOCTOR` | Web Portal | View own appointments, manage queue, set schedule |
| `RECEPTIONIST` | Web Portal | Walk-in/follow-up, queue management, cash payment |
| `CLINIC_OWNER` | Web Portal | Full clinic management, dashboard, analytics |
| `SUPER_ADMIN` | Web Portal | Platform-wide admin, clinic verification, user management |

### Admin Levels (SUPER_ADMIN only)
- `ROOT` — Full access including DB reset and admin creation
- `SUPER_ADMIN` — Clinic verification, user management
- `SUPPORT` — Read access + clinic operations
- `FINANCE` — Dashboard + revenue data

---

## 4. Authentication Flow

### Patient (Firebase Phone OTP)
```
Patient enters mobile number
        ↓
Firebase sends OTP via SMS
        ↓
Patient enters 6-digit OTP
        ↓
Firebase verifies → returns idToken
        ↓
Backend: POST /auth/patient/firebase-phone-login
        ↓
Returns: accessToken (15 min) + refreshToken (7 days)
        ↓
Patient is logged in — tokens stored in SecureStore
```

### Staff (Email + Password)
```
Staff enters email + password
        ↓
POST /auth/login-password
        ↓
Returns: accessToken + refreshToken
        ↓
Web app stores tokens, role-based redirect
```

### Token Refresh
- Axios interceptors auto-refresh on 401 response
- Silent refresh — user never sees a logout unless refresh token expires

---

## 5. Patient App (React Native)

### Screens & What's Working

#### Authentication
- ✅ Welcome/Onboarding screen
- ✅ Mobile number entry with +91 prefix
- ✅ Firebase OTP send + verify
- ✅ Web OTP API (auto-fill OTP from SMS on supported Android)
- ✅ Profile wizard after first login (name, gender, DOB, city, emergency contact)

#### Home Screen
- ✅ Personalized greeting
- ✅ Profile completion banner (shows % and prompts completion)
- ✅ Quick action cards: Find a Doctor, Appointments, My Profile
- ✅ Active appointment cards with queue tracking link
- ✅ Recent appointment history

#### Doctor Search & Booking
- ✅ Search by name, city, specialization
- ✅ Availability filter (Online / Offline)
- ✅ Doctor card shows specialization, experience, clinic location
- ✅ Doctor detail page with full profile
- ✅ Booking screen with:
  - Date strip (next 14 days, horizontal scroll)
  - Session selector (Morning / Afternoon / Evening from clinic config)
  - Slot picker (3 cols phone / 4 cols tablet)
  - "For whom" selector
  - Visit type (Clinic Visit / Online)
  - Notes/symptoms input
- ✅ First booking FREE (platform fee waived)
- ✅ Razorpay payment for subsequent bookings (₹10 platform fee)
- ✅ Booking confirmation overlay showing: doctor, date, queue token #, estimated slot time

#### Live Queue Screen
- ✅ Real-time queue position via Socket.IO
- ✅ Falls back to 30-second polling when socket disconnects
- ✅ Shows:
  - Queue token number (large)
  - **Estimated appointment time** (e.g., "9:45 AM") ← NEW
  - Patients ahead
  - Currently serving token
  - Queue status (Active / Paused)
  - Doctor and clinic info
- ✅ Journey steps tracker (Booked → Checked In → Waiting → Called → Done)
- ✅ "Called" banner slides in with shake animation when your turn
- ✅ Pull-to-refresh + manual refresh button
- ✅ LIVE / OFFLINE / CONNECTING badge

#### Appointment History
- ✅ Filter by status (All / Booked / In Queue / Completed)
- ✅ Queue strip shows position, estimated wait, **estimated slot time** ← NEW
- ✅ Cancel appointment
- ✅ Track live queue link for active appointments

#### Profile
- ✅ View and edit personal details
- ✅ Blood group, allergies, existing diseases
- ✅ Insurance provider
- ✅ Emergency contact
- ✅ Account deletion (GDPR/Play Store compliant, 10-day grace period)

#### Payments
- ✅ Razorpay WebView integration
- ✅ Free booking flow (amount = ₹0, confirmation immediate)
- ✅ Payment history

---

## 6. Web Portal — Admin Panel

### URL: `/admin`

#### Dashboard (`/admin/dashboard`)
- ✅ Live indicator (green dot, auto-refreshes)
- ✅ Clinic Overview stats:
  - Total Users (clickable → navigates to Users)
  - Pending / Approved / Rejected Clinics
  - Changes Required / Suspended Clinics
  - Pending / Verified Doctors
- ✅ Booking Metrics:
  - Free Bookings / Paid Bookings
  - Conversion Rate (free→paid)
  - **Total Platform Revenue** (₹10 fees from Razorpay) ← separate from clinic revenue

#### Users (`/admin/users`)
- ✅ List all users with role filter + search
- ✅ Role chips: All / Patient / Doctor / Receptionist / Clinic Owner / Super Admin
- ✅ **Click any user → detail drawer slides in** ← NEW
- ✅ Drawer shows:
  - Contact info, account info, join date, last login
  - Patient profile (gender, city, blood group etc.)
  - Doctor profile (specialization, fees, verification)
  - Owned clinics with status
  - Last 5 appointments
  - Enable/Disable account button
- ✅ Root admin: Create admin accounts (SUPPORT / FINANCE / SUPER_ADMIN levels)
- ✅ Root admin: Delete admin accounts
- ✅ Deletion requests tab: see accounts pending purge, restore them

#### Clinics (`/admin/clinics/verify`)
- ✅ List all clinic applications
- ✅ Approve / Reject / Request Changes / Suspend
- ✅ View clinic details before deciding
- ✅ Admin notes, rejection reasons

#### Notifications (`/admin/notifications`)
- ✅ Create notification campaigns
- ✅ Target: All Users / Specific Users / City / State
- ✅ Channel: In-App / Push / Both
- ✅ Schedule campaigns
- ✅ Start / Pause / Stop campaigns

---

## 7. Web Portal — Clinic Owner Dashboard

### URL: `/clinic/dashboard`

#### Dashboard
- ✅ Clinic verification status banner (Pending / Under Review / Verified / Rejected / Changes Required / Suspended)
- ✅ Resubmit flow for rejected/changes-required clinics
- ✅ Verified clinic → full enhanced dashboard:
  - **Revenue metrics** (CASH + UPI only — platform ₹10 fees excluded) ← FIXED
  - Patient metrics (Total / New / Returning)
  - Appointment metrics (Completed / Cancelled / No-Show / Completion Rate / Avg Wait)
  - Staff metrics (Active Staff / Doctors / Receptionists / Utilization Rate)
- ✅ Revenue trend chart (Recharts, responsive)
- ✅ Appointment trend chart
- ✅ Doctor performance bar chart
- ✅ Recent transactions table
- ✅ Quick actions grid
- ✅ Alerts & insights widget
- ✅ Real-time updates via Socket.IO
- ✅ Date range filter (Today / Week / Month / Custom)
- ✅ Doctor filter
- ✅ Payment method filter
- ✅ Export to PDF / Excel
- ✅ **Widget customizer** — show/hide/reorder dashboard widgets
- ✅ Multi-clinic selector (for owners with multiple clinics)

#### My Clinic (`/clinic/profile`)
- ✅ Edit clinic name, address, phone, specialties
- ✅ Upload clinic logo and cover image
- ✅ Set consultation modes (Online / Offline)
- ✅ Payment methods accepted
- ✅ Languages spoken
- ✅ Facilities list
- ✅ Weekly schedule

#### Sessions (`/clinic/sessions`)
- ✅ Create/Edit/Delete sessions (Morning / Afternoon / Evening)
- ✅ Set start time, end time, max patients
- ✅ **Set avg time per patient (min)** ← NEW — drives slot timing calculations
- ✅ Session timing preview: "Patient 1 → 9:00 AM, Patient 2 → 9:15 AM…"
- ✅ Enable/Disable sessions

#### Doctors (`/clinic/doctors`)
- ✅ View all doctors at clinic
- ✅ Add new doctor (creates account + sends credentials by email)
- ✅ Enable/Disable doctor access

#### Receptionists (`/clinic/receptionists`)
- ✅ View all receptionists
- ✅ Add new receptionist
- ✅ Enable/Disable

#### Appointments (`/clinic/appointments`)
- ✅ View all appointments with status filters
- ✅ Date range filter
- ✅ Doctor filter

#### Queue Overview (`/clinic/queue`)
- ✅ Live queue for any doctor at the clinic
- ✅ Session tabs (Morning / Afternoon / Evening) ← NEW
- ✅ Queue stats

---

## 8. Web Portal — Doctor Panel

### URL: `/doctor/dashboard`

#### Dashboard
- ✅ Today's appointment count
- ✅ Completed / Pending stats
- ✅ Revenue earned (from cash payments)

#### Appointments (`/doctor/appointments`)
- ✅ List with status filter
- ✅ Date range
- ✅ Patient details in each row

#### My Queue (`/doctor/queue`)
- ✅ Live patient queue for today
- ✅ Call next / complete / skip actions

#### Schedule (`/doctor/schedule`)
- ✅ View availability per day
- ✅ Set consultation slots

#### Profile (`/doctor/profile`)
- ✅ Specialization, qualification, experience
- ✅ Consultation fee
- ✅ Bio
- ✅ Associated clinics with status

---

## 9. Web Portal — Receptionist Panel

### URL: `/receptionist/dashboard`

#### Dashboard
- ✅ Today's stats: total patients, waiting, completed

#### Today's Queue (`/receptionist/queue`)
- ✅ **Session tabs** — Morning / Afternoon / Evening ← NEW
- ✅ Auto-selects currently active session based on time
- ✅ **Doctor selector** — now shows ALL doctors (direct + invited) ← FIXED
- ✅ Estimated appointment time badge on each patient card (e.g., 🕐 9:45 AM) ← NEW
- ✅ Call Next Patient button
- ✅ Pause / Resume queue
- ✅ Patient check-in
- ✅ Skip patient
- ✅ Complete patient
- ✅ Record cash payment modal (suggests consultation fee)
- ✅ Real-time updates via Socket.IO

#### Walk-in (`/receptionist/walk-in`)
- ✅ **Session selector** — assigns walk-in to correct session queue ← NEW
- ✅ Doctor selector
- ✅ Patient mobile lookup (creates new account if not found)
- ✅ Patient name + symptoms
- ✅ Assigns queue number instantly
- ✅ Shows success with queue number

#### Follow-up (`/receptionist/follow-up`)
- ✅ Add returning patient back to queue with priority (ahead of regular patients)
- ✅ Inherits session from original appointment ← NEW

---

## 10. Queue System — Full Flow

### Per-Session Separate Queues ← NEW ARCHITECTURE

```
Doctor A — July 3, 2026

Morning Session (9:00 AM – 12:00 PM):
  Queue: #1 → 9:00 AM, #2 → 9:15 AM, #3 → 9:30 AM
  
Evening Session (5:00 PM – 8:00 PM):
  Queue: #1 → 5:00 PM, #2 → 5:15 PM, #3 → 5:30 PM
  
  ↑ COMPLETELY INDEPENDENT QUEUES
```

### Queue Item Lifecycle
```
Patient Books (OFFLINE)
  → Queue item created (status: WAITING)
  → Position assigned (follow-ups go first)
        ↓
Receptionist: Check In
  → Appointment status: CHECKED_IN
        ↓
Receptionist: Call Next
  → Queue item: CALLED
  → Patient gets push notification + banner on Live Queue screen
        ↓
Patient enters consultation room
  → Queue item: IN_CONSULTATION
        ↓
Receptionist: Complete
  → Queue item: COMPLETED
  → Appointment: COMPLETED
  → Cash payment can be recorded
```

### Follow-up Priority
- Follow-up patients go BEFORE regular waiting patients
- Up to 4 follow-up slots before regular queue resumes

---

## 11. Booking & Payment Flow

### First Booking (FREE)
```
Patient selects doctor + date + session + slot
      ↓
POST /payments/initiate → { isFree: true }
      ↓
Appointment created (status: PENDING_PAYMENT)
Payment record created (amount: 0, status: PAID)
freeBookingUsed = true (atomic DB transaction)
      ↓
assignQueueAndConfirm():
  - Scoped to session queue ← NEW
  - Queue number assigned
  - estimatedAppointmentTime calculated ← NEW
      ↓
Patient sees: "🎉 First Booking Free! Queue #4 — 9:45 AM"
```

### Subsequent Bookings (₹10 platform fee)
```
POST /payments/initiate → { order: { id, amount: 1000 } }
      ↓
Razorpay payment sheet opens
      ↓
Patient pays ₹10
      ↓
POST /payments/verify → signature verified
      ↓
assignQueueAndConfirm() → queue number + estimated time
      ↓
Patient sees confirmation
```

---

## 12. Revenue Model

| Payment | Who collects | Amount | Shown in |
|---------|-------------|--------|---------|
| Platform booking fee | PulseMate | ₹10 (Razorpay) | Admin Dashboard only |
| Consultation fee | Clinic/Doctor | Variable (Cash/UPI) | Clinic Owner Dashboard |

### Clinic Revenue Dashboard
- **Shows:** CASH + UPI only (collected by receptionist)
- **Excludes:** Razorpay ₹10 (platform fee — goes to PulseMate)
- Cash Revenue = receptionist-recorded cash payments
- Online Revenue = receptionist-recorded UPI payments

---

## 13. Notification System

### Push Notifications (Firebase FCM)
| Event | Recipient |
|-------|----------|
| Appointment booked | Patient |
| Queue called (your turn) | Patient |
| Queue paused | All waiting patients |
| Queue resumed | All waiting patients |
| Walk-in added | Receptionists |
| Follow-up added | Doctor |
| New booking at clinic | Doctor |
| Appointment cancelled | Patient + Doctor + Clinic Owner |

### In-App Notifications
- Bell icon in header shows unread count
- Polled every 60 seconds
- Refreshes on every page navigation
- Admin can create platform-wide notification campaigns

---

## 14. Session-Based Queue Architecture

### Database
```sql
Queue: clinicId + doctorId + date + sessionId (unique per combination)
Appointment: sessionId field stores which session was booked
```

### How sessionId flows
```
Patient selects session in BookingScreen
        ↓ sessionId passed to initiatePayment()
        ↓ sessionId stored on Appointment record
        ↓ Queue scoped to (clinicId, doctorId, date, sessionId)

Receptionist Walk-in:
        ↓ Receptionist selects session tab
        ↓ sessionId passed to addWalkIn()
        ↓ Same session-scoped queue

Follow-up:
        ↓ Inherits sessionId from original appointment
        ↓ Placed in correct session queue
```

---

## 15. Estimated Appointment Time System

### Formula
```
estimatedAppointmentTime = sessionStart + (position - 1) × avgConsultationMins

Patient 1 → 9:00 AM + (1-1) × 15 = 9:00 AM
Patient 2 → 9:00 AM + (2-1) × 15 = 9:15 AM
Patient 3 → 9:00 AM + (3-1) × 15 = 9:30 AM
Patient 4 → 9:00 AM + (4-1) × 15 = 9:45 AM
```

### Where it's shown
| Screen | Display |
|--------|---------|
| Live Queue (mobile) | "Your Slot: 9:45 AM" card + stat badge |
| Appointments list (mobile) | Queue strip "Your slot: 9:45 AM" |
| Booking confirmation (mobile) | "Estimated Slot: 9:45 AM" |
| Today's Queue (web) | 🕐 9:45 AM badge on each patient card |
| Session Management (web) | Preview: "Patient 1 → 9:00 AM, Patient 2 → 9:15 AM…" |

### Configuration
Clinic owner sets **avgConsultationMins per session** in Session Management.  
Default: 15 minutes/patient.

---

## 16. Database Schema Summary

### Core Models
| Model | Key Fields |
|-------|-----------|
| `User` | id, name, mobile, email, role, isActive, freeBookingUsed |
| `PatientProfile` | userId, gender, dob, city, bloodGroup, emergencyContact |
| `DoctorProfile` | userId, specialization, consultationFee, avgConsultationMins |
| `Clinic` | name, ownerId, approvalStatus, city |
| `ClinicSession` | clinicId, sessionType, startTime, endTime, avgConsultationMins |
| `Appointment` | patientId, doctorId, clinicId, sessionId, status, queueNumber |
| `Queue` | clinicId, doctorId, date, sessionId (unique together) |
| `QueueItem` | queueId, appointmentId, position, status, isFollowUp |
| `Payment` | appointmentId, amount, method (RAZORPAY/CASH/UPI), status |
| `ClinicStaff` | clinicId, userId, role (DOCTOR/RECEPTIONIST), isActive |
| `DoctorClinic` | doctorId, clinicId, inviteStatus (ACCEPTED/PENDING) |

---

## 17. API Overview

### Base URL: `https://api.pulsemateconnect.in/api`

| Module | Prefix | Key Endpoints |
|--------|--------|--------------|
| Auth | `/auth` | login, firebase-phone-login, refresh, logout |
| Patient | `/patient` | doctors, appointments, queue/:id, profile |
| Payments | `/payments` | initiate, verify, my, booking-status |
| Clinics | `/clinics` | my, :id/staff, :id/sessions, :id/revenue |
| Reception | `/reception` | queue/:doctorId, walk-in, follow-up, call-next |
| Doctor | `/doctor` | schedule, :id/slots, availability |
| Admin | `/admin` | dashboard, users, users/:id, clinics/verify |
| Notifications | `/notifications` | my, unread-count |

---

## 18. Deployment

### Backend
- **Platform:** Render (web service)
- **Database:** Render PostgreSQL
- **Auto-deploy:** On push to `main` branch
- **Migrations:** `prisma migrate deploy` runs on startup

### Web Frontend
- **Platform:** Render (static site)
- **Build:** `npm run build` → Vite output
- **URL:** `https://pulsemateconnect.in`

### Mobile App
- **Platform:** Google Play Store (Internal Testing → Production)
- **Build:** Gradle `bundleRelease` from `C:\pm\android`
- **Current version:** 1.2.0 (versionCode 20)
- **AAB location after build:** `C:\pm\android\app\build\outputs\bundle\release\app-release.aab`

### Environment Variables (Backend)
```
DATABASE_URL          PostgreSQL connection string
JWT_ACCESS_SECRET     JWT signing secret
JWT_REFRESH_SECRET    Refresh token secret
RAZORPAY_KEY_ID       Razorpay API key
RAZORPAY_KEY_SECRET   Razorpay secret
FIREBASE_*            Firebase Admin SDK credentials
CLOUDINARY_*          Cloudinary upload credentials
```

---

*Generated by Kiro — PulseMate Connect v1.2.0*
