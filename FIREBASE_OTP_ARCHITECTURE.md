# Firebase OTP Architecture - PulseMate Connect

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FIREBASE AUTHENTICATION                            │
│                         (Single Source of Truth)                            │
│                                                                             │
│  ┌─────────────┐              ┌──────────────┐                             │
│  │   Firebase  │◄─────────────┤   Firebase   │                             │
│  │   Console   │              │   Admin SDK  │                             │
│  │   (Setup)   │              │  (Verifier)  │                             │
│  └─────────────┘              └──────────────┘                             │
│         │                             │                                     │
│         │ Sends SMS with OTP          │ Verifies ID Token                  │
│         │                             │                                     │
└─────────┼─────────────────────────────┼─────────────────────────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────┐           ┌──────────────────┐
│                 │           │                  │
│   USER'S PHONE  │           │  BACKEND SERVER  │
│                 │           │  (Node.js API)   │
│  (Receives SMS) │           │                  │
└─────────────────┘           └──────────────────┘
          │                             ▲
          │                             │
          │                             │ POST /auth/patient/
          │                             │ firebase-phone-login
          │                             │ { firebaseIdToken }
          │                             │
    ┌─────┴──────┐               ┌──────┴────────┐
    │            │               │               │
    ▼            ▼               │               │
┌────────┐  ┌────────┐          │               │
│  WEB   │  │ MOBILE │          │               │
│  APP   │  │  APP   │          │               │
│        │  │        │          │               │
│ React  │  │ React  │          │               │
│  Web   │  │ Native │          │               │
└────────┘  └────────┘          │               │
    │            │               │               │
    │            │               │               │
    └────────────┴───────────────┘               │
                 │                               │
                 └───────────────────────────────┘
                  Returns JWT Access Token

```


---

## Sequence Diagram: Login Flow

### Web Platform

```
User          Web App         Firebase         Backend         Database
 │               │               │                │                │
 │ Enter Phone   │               │                │                │
 ├──────────────►│               │                │                │
 │               │               │                │                │
 │               │ signInWith    │                │                │
 │               │ PhoneNumber() │                │                │
 │               ├──────────────►│                │                │
 │               │               │                │                │
 │               │               │ Send SMS       │                │
 │◄──────────────┼───────────────┤                │                │
 │   SMS: 123456 │               │                │                │
 │               │               │                │                │
 │ Enter OTP     │               │                │                │
 ├──────────────►│               │                │                │
 │               │               │                │                │
 │               │ confirm(otp)  │                │                │
 │               ├──────────────►│                │                │
 │               │               │                │                │
 │               │ ID Token      │                │                │
 │               │◄──────────────┤                │                │
 │               │               │                │                │
 │               │ POST /auth/patient/            │                │
 │               │ firebase-phone-login           │                │
 │               ├──────────────────────────────►│                │
 │               │                                │                │
 │               │                verify token    │                │
 │               │                ◄───────────────┤                │
 │               │                                │                │
 │               │                                │ Find/Create    │
 │               │                                │ Patient        │
 │               │                                ├───────────────►│
 │               │                                │                │
 │               │                                │ User Data      │
 │               │                                │◄───────────────┤
 │               │                                │                │
 │               │ JWT Token + User Data          │                │
 │               │◄───────────────────────────────┤                │
 │               │                                │                │
 │ Logged In ✓   │                                │                │
 │◄──────────────┤                                │                │
```


---

### Mobile App Platform

```
User        Mobile App      Firebase         Backend         Database
 │               │               │                │                │
 │ Enter Phone   │               │                │                │
 ├──────────────►│               │                │                │
 │               │               │                │                │
 │               │ PhoneAuth     │                │                │
 │               │ Provider.     │                │                │
 │               │ verify()      │                │                │
 │               ├──────────────►│                │                │
 │               │               │                │                │
 │               │               │ Send SMS       │                │
 │◄──────────────┼───────────────┤                │                │
 │   SMS: 123456 │               │  (SAME OTP!)   │                │
 │               │               │                │                │
 │ Enter OTP     │               │                │                │
 ├──────────────►│               │                │                │
 │               │               │                │                │
 │               │ signInWith    │                │                │
 │               │ Credential()  │                │                │
 │               ├──────────────►│                │                │
 │               │               │                │                │
 │               │ ID Token      │                │                │
 │               │◄──────────────┤                │                │
 │               │               │                │                │
 │               │ POST /auth/patient/            │                │
 │               │ firebase-phone-login           │                │
 │               ├──────────────────────────────►│                │
 │               │                                │                │
 │               │                verify token    │                │
 │               │                ◄───────────────┤                │
 │               │                                │                │
 │               │                                │ Find/Create    │
 │               │                                │ Patient        │
 │               │                                ├───────────────►│
 │               │                                │                │
 │               │                                │ User Data      │
 │               │                                │◄───────────────┤
 │               │                                │                │
 │               │ JWT Token + User Data          │                │
 │               │◄───────────────────────────────┤                │
 │               │                                │                │
 │ Logged In ✓   │                                │                │
 │◄──────────────┤                                │                │
```

**KEY POINT**: The OTP (123456) is THE SAME for both web and mobile!


---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE PROJECT                                 │
│                      (pulsemateconnect)                                 │
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐          │
│  │   Web App    │     │  Android App │     │   iOS App    │          │
│  │   Config     │     │    Config    │     │    Config    │          │
│  └──────────────┘     └──────────────┘     └──────────────┘          │
│                                                                         │
│  Phone Authentication Enabled                                          │
│  SMS Provider: Firebase Default                                        │
│  SMS Quota: 10,000 free/month                                          │
│                                                                         │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
                            │ Sends OTP via SMS
                            │
                            ▼
                    ┌───────────────┐
                    │  USER'S PHONE │
                    │               │
                    │  +91XXXXXXXXXX│
                    └───────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │    Web    │   │  Android  │   │    iOS    │
    │   Login   │   │   Login   │   │   Login   │
    └───────────┘   └───────────┘   └───────────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                            │ Firebase ID Token
                            │
                            ▼
            ┌────────────────────────────────┐
            │   Backend API Server           │
            │                                 │
            │   POST /auth/patient/           │
            │   firebase-phone-login          │
            │                                 │
            │   1. Verify Firebase Token      │
            │   2. Extract phone number       │
            │   3. Find or create patient     │
            │   4. Generate JWT token         │
            └────────────────────────────────┘
                            │
                            │ JWT Access Token
                            │
                            ▼
            ┌────────────────────────────────┐
            │      PostgreSQL Database        │
            │                                 │
            │  users                          │
            │  ├─ mobile (phone)              │
            │  ├─ firebaseUid                 │
            │  ├─ authProvider                │
            │  ├─ isPhoneVerified: true       │
            │  └─ role: PATIENT               │
            └────────────────────────────────┘
```


---

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────┐     ┌──────────────────────────────┐   │
│  │    Web (React)             │     │   Mobile (React Native)      │   │
│  │                            │     │                               │   │
│  │  frontend/src/api/         │     │  PulseMateApp/src/           │   │
│  │  ├─ firebaseAuth.js        │     │  ├─ config/firebase.js       │   │
│  │  │   • initRecaptcha()     │     │  ├─ api/firebaseAuth.js      │   │
│  │  │   • sendOtpToPhone()    │     │  │   • sendOtpToPhone()      │   │
│  │  │   • verifyPhoneOtp()    │     │  │   • verifyOtp()           │   │
│  │  └─ auth.api.js            │     │  └─ api/auth.js              │   │
│  │      • firebasePhoneLogin()│     │      • patientLoginFirebase()│   │
│  └───────────────────────────┘     └──────────────────────────────┘   │
│                                                                          │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
                           │ HTTP POST: firebaseIdToken
                           │
┌──────────────────────────▼───────────────────────────────────────────────┐
│                          BACKEND LAYER                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  backend/src/                                                             │
│  ├─ routes/auth.routes.js                                                │
│  │   POST /auth/patient/firebase-phone-login                             │
│  │                                                                        │
│  ├─ controllers/auth.controller.js                                       │
│  │   patientFirebasePhoneLoginHandler()                                  │
│  │   ├─ Verify Firebase token                                            │
│  │   ├─ Extract & normalize phone                                        │
│  │   ├─ Find or create patient                                           │
│  │   └─ Issue JWT tokens                                                 │
│  │                                                                        │
│  ├─ config/firebase.js                                                   │
│  │   verifyFirebaseToken(idToken)                                        │
│  │   • Firebase Admin SDK                                                │
│  │   • Token verification                                                │
│  │                                                                        │
│  └─ services/token.service.js                                            │
│      createSessionTokens()                                               │
│                                                                           │
└──────────────────────────┬────────────────────────────────────────────────┘
                           │
                           │ SQL Queries
                           │
┌──────────────────────────▼────────────────────────────────────────────────┐
│                        DATABASE LAYER                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PostgreSQL + Prisma                                                       │
│                                                                            │
│  users table                                                               │
│  ├─ id                                                                     │
│  ├─ mobile (unique)                                                        │
│  ├─ name                                                                   │
│  ├─ role = 'PATIENT'                                                       │
│  ├─ firebaseUid                                                            │
│  ├─ authProvider = 'FIREBASE_PHONE'                                        │
│  ├─ isPhoneVerified = true                                                 │
│  └─ approvalStatus = 'VERIFIED'                                            │
│                                                                            │
│  patientProfile table                                                      │
│  └─ (related patient data)                                                 │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

