# 📚 PulseMate Connect - Complete Application Flow Documentation

**Version:** 1.0.0  
**Platform:** React Native (Expo)  
**Backend:** Node.js/Express API  
**Database:** PostgreSQL with Prisma ORM  
**Last Updated:** August 8, 2026

---

## 📋 TABLE OF CONTENTS

1. [Application Architecture](#1-application-architecture)
2. [Authentication Flows](#2-authentication-flows)
3. [Main Application Flows](#3-main-application-flows)
4. [API Integration](#4-api-integration)
5. [Error Handling](#5-error-handling)
6. [Known Issues & Fixes](#6-known-issues--fixes)
7. [Testing Guide](#7-testing-guide)

---

## 1. APPLICATION ARCHITECTURE

### 1.1 Tech Stack

**Frontend:**
- React Native with Expo SDK 54
- React Navigation 6 (Stack + Bottom Tabs)
- Zustand (State Management)
- Axios (HTTP Client)
- Socket.IO Client (Real-time updates)

**Backend:**
- Node.js + Express.js
- PostgreSQL (Database)
- Prisma ORM
- Message Central (SMS OTP)
- Cloudinary (File Storage)
- Socket.IO (Real-time)
- JWT Authentication

**Deployment:**
- Backend: Render.com (https://api.pulsemateconnect.in)
- Database: Render PostgreSQL
- App: Google Play Store (via EAS Build)

### 1.2 Project Structure

```
pulsemateconnect21/
├── App.js                          # Root component with splash screen
├── src/
│   ├── navigation/
│   │   ├── AuthNavigator.js        # Unauthenticated screens
│   │   └── MainNavigator.js        # Authenticated screens (tabs)
│   ├── screens/
│   │   ├── WelcomeScreen.jsx       # Onboarding
│   │   ├── Login2FactorScreen.jsx  # Message Central OTP Login
│   │   ├── Otp2FactorScreen.jsx    # OTP Verification
│   │   ├── HomeScreen.jsx          # Main dashboard
│   │   ├── SearchScreen.jsx        # Doctor search
│   │   ├── DoctorDetailScreen.jsx  # Doctor profile
│   │   ├── BookingScreen.jsx       # Appointment booking
│   │   ├── AppointmentsScreen.jsx  # User appointments list
│   │   ├── LiveQueueScreen.jsx     # Real-time queue
│   │   ├── ProfileScreen.jsx       # User profile
│   │   └── ... (other screens)
│   ├── api/
│   │   ├── axios.js                # Axios instance with interceptors
│   │   ├── auth.js                 # Auth API calls
│   │   └── patient.js              # Patient API calls
│   ├── services/
│   │   ├── messagecentral-otp.service.js  # OTP service
│   │   └── socket.service.js       # Socket.IO service
│   ├── store/
│   │   └── authStore.js            # Zustand auth state
│   ├── hooks/
│   │   ├── usePushNotifications.js  # Push notifications
│   │   └── useQueueSocket.js        # Real-time queue
│   └── components/
│       └── ... (reusable components)
└── backend/
    ├── src/
    │   ├── server.js               # Express server
    │   ├── controllers/
    │   │   └── auth.controller.js  # Auth endpoints
    │   ├── services/
    │   │   └── messagecentral.service.js  # Message Central API
    │   ├── middleware/
    │   │   ├── auth.middleware.js  # JWT verification
    │   │   └── rateLimit.middleware.js  # Rate limiting
    │   └── routes/
    │       └── auth.routes.js      # Auth routes
    └── prisma/
        └── schema.prisma           # Database schema
```

### 1.3 Navigation Structure

```
App Root
├── AuthNavigator (Not logged in)
│   ├── WelcomeScreen (Entry point)
│   ├── Login2FactorScreen (Message Central Login)
│   ├── Otp2FactorScreen (OTP Verification)
│   ├── LoginScreen (Firebase - Secondary)
│   └── OtpScreen (Firebase OTP - Secondary)
└── MainNavigator (Logged in - Bottom Tabs)
    ├── HomeTab (Stack Navigator)
    │   ├── Home
    │   ├── Search
    │   ├── DoctorDetail
    │   ├── Booking
    │   ├── Razorpay (Payment)
    │   ├── PaymentStatus
    │   ├── LiveQueue
    │   ├── NearbyClinics
    │   ├── TopDoctors
    │   ├── Notifications
    │   ├── NotificationSettings
    │   └── ProfileWizard
    ├── DoctorsTab (Stack Navigator)
    │   ├── SearchMain
    │   ├── DoctorDetail
    │   ├── Booking
    │   ├── Razorpay
    │   ├── PaymentStatus
    │   └── LiveQueue
    ├── AppointmentsTab (Stack Navigator)
    │   ├── Appointments
    │   ├── AppointmentDetail
    │   └── LiveQueue
    └── ProfileTab (Stack Navigator)
        ├── Profile
        ├── EditProfile
        ├── ProfileWizard
        ├── Payments
        ├── Notifications
        └── NotificationSettings
```

---

## 2. AUTHENTICATION FLOWS

### 2.1 Primary Authentication: Message Central OTP

**Status:** ✅ PRODUCTION (Active)  
**Provider:** Message Central VerifyNow  
**Method:** SMS OTP via Backend API

#### Flow Diagram

```
┌─────────────┐
│ WelcomeScreen│
└──────┬──────┘
       │ User taps "Get Started"
       ↓
┌─────────────────────┐
│Login2FactorScreen   │
│                     │
│ 1. User enters      │
│    10-digit mobile  │
│ 2. Taps "Send OTP"  │
└──────┬──────────────┘
       │
       ↓
   [FRONTEND]
   sendOTP("+91XXXXXXXXXX")
       │
       ↓
   [BACKEND API]
   POST /api/auth/patient/send-otp
   ├─ Rate Limiter: otpSendLimiter (5/hour per phone)
   ├─ Message Central API call
   ├─ Generate 6-digit OTP
   ├─ Hash OTP (bcrypt)
   ├─ Store in database (OtpCode table)
   └─ Send SMS via Message Central
       │
       ↓
   [RESPONSE]
   {
     verificationId: "string",
     expiresIn: 180,
     message: "OTP sent"
   }
       │
       ↓
┌─────────────────────┐
│Otp2FactorScreen     │
│                     │
│ 1. User enters OTP  │
│ 2. Taps "Verify"    │
└──────┬──────────────┘
       │
       ↓
   [FRONTEND]
   verifyOTP(verificationId, "123456", mobile)
       │
       ↓
   [BACKEND API]
   POST /api/auth/patient/verify-otp
   ├─ Rate Limiter: otpVerifyLimiter (10/15min per phone)
   ├─ Validate OTP (compare hash)
   ├─ Check expiration (3 minutes)
   ├─ Find or create Patient user
   ├─ Generate JWT tokens (access + refresh)
   └─ Return auth data
       │
       ↓
   [RESPONSE]
   {
     accessToken: "jwt...",
     refreshToken: "jwt...",
     user: {
       id, name, email, mobile, role
     }
   }
       │
       ↓
   [FRONTEND]
   authStore.signIn(accessToken, user, refreshToken)
   ├─ Store tokens in SecureStore (encrypted)
   ├─ Set user state
   └─ Trigger navigation to MainNavigator
       │
       ↓
┌──────────────┐
│ HomeScreen   │ ✅ User logged in
└──────────────┘
```

#### Key Components

**Frontend Service:** `src/services/messagecentral-otp.service.js`
```javascript
export async function sendOTP(mobileNumber) {
  // Calls backend: POST /api/auth/patient/send-otp
  // Returns: { verificationId, expiresIn }
}

export async function verifyOTP(verificationId, code, mobileNumber) {
  // Calls backend: POST /api/auth/patient/verify-otp
  // Returns: { accessToken, refreshToken, user }
}

export async function resendOTP(mobileNumber) {
  // Calls backend: POST /api/auth/patient/send-otp
  // Returns: { verificationId, expiresIn }
}
```

**Backend Controller:** `backend/src/controllers/auth.controller.js`
```javascript
// sendOtpHandler
// 1. Validate phone number
// 2. Call Message Central API (send OTP)
// 3. Hash OTP with bcrypt
// 4. Store in OtpCode table
// 5. Return verificationId

// verifyOtpHandler
// 1. Validate OTP code
// 2. Check expiration (3 minutes)
// 3. Compare hash
// 4. Find or create Patient user
// 5. Generate JWT tokens
// 6. Return auth data
```

**Backend Service:** `backend/src/services/messagecentral.service.js`
```javascript
// Message Central API Integration
// - Base URL: https://cpaas.messagecentral.com
// - Auth: Customer ID + Password (Base64)
// - OTP Send: POST /verification/v3/send
// - OTP Validate: GET /verification/v3/validateOtp (with query params)
```


#### Rate Limiting Configuration

**✅ FIXED (August 8, 2026)**

| Endpoint | Limiter | Window | Max Requests | Key |
|----------|---------|--------|--------------|-----|
| `/patient/send-otp` | `otpSendLimiter` | 1 hour | 5 | Phone number |
| `/patient/verify-otp` | `otpVerifyLimiter` | 15 min | 10 | Phone number |

**Previous Issue:** Used `firebasePhoneLoginLimiter` (IP-based, 10 total for both send+verify)  
**Fix:** Dedicated phone-based limiters with separate counters

**Implementation:** `backend/src/middleware/rateLimit.middleware.js`
```javascript
const otpSendLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => {
    const phone = req.body?.mobileNumber?.replace(/\D/g, '');
    return phone ? `otp_send:${phone}` : `otp_send_ip:${req.ip}`;
  },
});

const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => {
    const phone = req.body?.mobileNumber?.replace(/\D/g, '');
    return phone ? `otp_verify:${phone}` : `otp_verify_ip:${req.ip}`;
  },
});
```

#### Error Handling

**Frontend Errors:**
- Invalid phone number → Alert: "Enter a valid 10-digit mobile number"
- Incomplete OTP → Alert: "Please enter the complete 6-digit code"
- Network error → Alert: Error message from backend
- Verification failed → Clear OTP, refocus first input

**Backend Errors:**
- Rate limit exceeded → 429 with message
- Invalid OTP → 400 "Invalid OTP code"
- Expired OTP → 400 "OTP has expired"
- Message Central API failure → 500 "Failed to send OTP"

---

### 2.2 Secondary Authentication: Firebase Phone Auth

**Status:** ⚠️ INACTIVE (Secondary option)  
**Provider:** Firebase Phone Authentication  
**Screens:** `LoginScreen.jsx`, `OtpScreen.jsx`

**Note:** Firebase Phone Auth is configured but not the default flow. Users access it via specific navigation, not from Welcome screen.

