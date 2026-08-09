# 📖 PulseMate Connect - Complete Technical Flow Documentation

**Version:** 1.0.0  
**Last Updated:** August 8, 2026  
**Purpose:** Detailed technical documentation of all application flows

---

## TABLE OF CONTENTS

1. [System Architecture](#1-system-architecture)
2. [Authentication Flow (Message Central OTP)](#2-authentication-flow-message-central-otp)
3. [Doctor Discovery & Booking Flow](#3-doctor-discovery--booking-flow)
4. [Appointment Management Flow](#4-appointment-management-flow)
5. [Real-time Queue Flow](#5-real-time-queue-flow)
6. [Payment Flow](#6-payment-flow)
7. [Notification Flow](#7-notification-flow)
8. [Profile Management Flow](#8-profile-management-flow)
9. [Error Scenarios & Recovery](#9-error-scenarios--recovery)
10. [API Reference](#10-api-reference)

---

## 1. SYSTEM ARCHITECTURE

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native/Expo)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │  Home    │  │  Search  │  │ Profile  │  │
│  │  Screens │  │  Screen  │  │  Screen  │  │  Screen  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │              │         │
│  ┌────┴──────────────┴──────────────┴──────────────┴─────┐ │
│  │           Navigation Layer (React Navigation)         │ │
│  └────┬──────────────────────────────────────────────────┘ │
│       │                                                     │
│  ┌────┴──────────────────────────────────────────────────┐ │
│  │      State Management (Zustand + React Context)       │ │
│  └────┬──────────────────────────────────────────────────┘ │
│       │                                                     │
│  ┌────┴──────────────────────────────────────────────────┐ │
│  │         API Layer (Axios + Interceptors)              │ │
│  └────┬───────────────────────────────┬──────────────────┘ │
└───────┼───────────────────────────────┼────────────────────┘
        │                               │
        │ HTTP/REST                     │ Socket.IO
        │                               │
        ↓                               ↓
┌────────────────────────────────────────────────────────────┐
│              BACKEND API (Node.js/Express)                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Rate Limiting Middleware                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │OTP Send  │  │OTP Verify│  │ Firebase │         │  │
│  │  │5/hour    │  │10/15min  │  │10/hour   │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           JWT Authentication Middleware              │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │    Controllers (Auth, Patient, Doctor, Appointment) │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │        Services (Message Central, Socket.IO)        │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            Database Layer (Prisma ORM)              │  │
│  └────────────┬────────────────────────────────────────┘  │
└───────────────┼───────────────────────────────────────────┘
                │
                ↓
     ┌──────────────────────┐         ┌────────────────────┐
     │  PostgreSQL Database │         │  External Services │
     │  ┌────────────────┐  │         │  ┌──────────────┐ │
     │  │ Users          │  │         │  │ Message      │ │
     │  │ Patients       │  │         │  │ Central      │ │
     │  │ Doctors        │  │         │  │ (SMS OTP)    │ │
     │  │ Clinics        │  │         │  └──────────────┘ │
     │  │ Appointments   │  │         │  ┌──────────────┐ │
     │  │ OtpCodes       │  │         │  │ Razorpay     │ │
     │  │ Payments       │  │         │  │ (Payments)   │ │
     │  │ Queues         │  │         │  └──────────────┘ │
     │  └────────────────┘  │         │  ┌──────────────┐ │
     └──────────────────────┘         │  │ Cloudinary   │ │
                                      │  │ (Images)     │ │
                                      │  └──────────────┘ │
                                      └────────────────────┘
```

### 1.2 Technology Stack


**Frontend:**
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | Latest | Mobile framework |
| Expo SDK | 54.0.35 | Development platform |
| React Navigation | 6.x | Navigation |
| Zustand | Latest | State management |
| Axios | 1.6.7 | HTTP client |
| Socket.IO Client | Latest | Real-time communication |
| Expo SecureStore | Latest | Secure token storage |
| React Native Toast | Latest | Toast notifications |

**Backend:**
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 24.x | Runtime |
| Express.js | 4.x | Web framework |
| Prisma | Latest | ORM |
| PostgreSQL | 15.x | Database |
| JWT | Latest | Authentication |
| express-rate-limit | Latest | Rate limiting |
| Socket.IO | Latest | Real-time |
| bcryptjs | Latest | Password hashing |
| Axios | Latest | HTTP client |

**External Services:**
| Service | Purpose | Credentials Location |
|---------|---------|---------------------|
| Message Central | SMS OTP | Backend env vars |
| Razorpay | Payments | Backend env vars |
| Cloudinary | Image storage | Backend env vars |
| Render | Backend hosting | N/A |

---

## 2. AUTHENTICATION FLOW (Message Central OTP)

### 2.1 Overview

**Authentication Type:** SMS OTP via Message Central  
**Flow:** Phone number → OTP → JWT tokens  
**Session Duration:** Access token: 15 min, Refresh token: 7 days  
**Security:** Phone-based rate limiting, bcrypt OTP hashing, JWT signing

### 2.2 Detailed Flow

#### Step 1: User Opens App

```
App.js
  ↓
<AuthProvider> loads from SecureStore
  ├─ Tokens found? → signIn() → MainNavigator
  └─ No tokens? → AuthNavigator
      ↓
WelcomeScreen renders
```

**Code Reference:**
```javascript
// App.js - RootNavigator
function RootNavigator({ navigationRef }) {
  const { user, loading } = useAuth();
  
  if (loading) return <SplashScreen />;
  return user ? <MainNavigator /> : <AuthNavigator />;
}
```


#### Step 2: User Enters Phone Number

```
WelcomeScreen
  ↓ User taps "Get Started"
Login2FactorScreen
  ↓
┌─────────────────────────────────────┐
│  Phone Input Component              │
│  ┌───────────────────────────────┐ │
│  │ 🇮🇳 +91  │  [Input Field]    │ │
│  └───────────────────────────────┘ │
│  - Validates 10 digits             │
│  - Strips non-numeric chars        │
│  - Formats: +91XXXXXXXXXX          │
└─────────────────────────────────────┘
```

**Validation:**
```javascript
// Frontend validation
if (trimmed.length < 10) {
  Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number.');
  return;
}
const fullNumber = `+91${trimmed}`;
```

#### Step 3: Send OTP Request

```
[FRONTEND] Login2FactorScreen.jsx
handleSendOtp() calls:
  ↓
[SERVICE] messagecentral-otp.service.js
sendOTP("+91XXXXXXXXXX")
  ↓
[API CALL] POST https://api.pulsemateconnect.in/api/auth/patient/send-otp
Body: { mobileNumber: "+91XXXXXXXXXX" }
Headers: { Content-Type: "application/json" }
```

**Frontend Service Code:**
```javascript
// src/services/messagecentral-otp.service.js
export async function sendOTP(mobileNumber) {
  try {
    const response = await api.post('/auth/patient/send-otp', {
      mobileNumber
    });
    
    return {
      verificationId: response.data.verificationId,
      expiresIn: response.data.expiresIn,
      message: response.data.message
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send OTP');
  }
}
```

#### Step 4: Backend Processes OTP Request

```
[BACKEND] Express App receives request
  ↓
[MIDDLEWARE] Rate Limiter: otpSendLimiter
  ├─ Extract phone: req.body.mobileNumber
  ├─ Normalize: remove non-digits
  ├─ Generate key: `otp_send:${phone}`
  ├─ Check Redis/memory store
  ├─ Current count < 5 (per hour)? 
  │   ├─ YES → Proceed
  │   └─ NO → Return 429 "Too many OTP requests"
  ↓
[ROUTE] /api/auth/patient/send-otp
  ↓
[CONTROLLER] auth.controller.js - sendOtpHandler()
  ├─ 1. Validate phone number format
  ├─ 2. Call Message Central service
  │    ├─ Generate auth token (Customer ID + Password)
  │    ├─ POST to Message Central API
  │    ├─ Endpoint: /verification/v3/send
  │    ├─ Params: countryCode, customerId, flowType, mobileNumber
  │    └─ Response: { verificationId, responseCode: 200 }
  ├─ 3. Generate 6-digit OTP (backend)
  ├─ 4. Hash OTP with bcrypt (10 rounds)
  ├─ 5. Store in database:
  │    await prisma.otpCode.create({
  │      data: {
  │        mobileNumber,
  │        code: hashedOTP,
  │        expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 min
  │        verificationId: mcVerificationId
  │      }
  │    })
  └─ 6. Return response
       ↓
[RESPONSE] 200 OK
{
  "success": true,
  "message": "OTP sent successfully",
  "verificationId": "uuid-string",
  "expiresIn": 180
}
```

**Backend Controller Code:**
```javascript
// backend/src/controllers/auth.controller.js
async function sendOtpHandler(req, res) {
  try {
    const { mobileNumber } = req.body;
    
    // Call Message Central
    const mcResult = await messageCentralService.sendOTP(mobileNumber, 6);
    
    // Generate and hash OTP
    const otp = generateOTP(6);
    const hashedOTP = await bcrypt.hash(otp, 10);
    
    // Store in database
    await prisma.otpCode.create({
      data: {
        mobileNumber,
        code: hashedOTP,
        expiresAt: new Date(Date.now() + 3 * 60 * 1000),
        verificationId: mcResult.verificationId
      }
    });
    
    res.json({
      success: true,
      verificationId: mcResult.verificationId,
      expiresIn: 180
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
```

#### Step 5: User Receives SMS & Enters OTP

```
User's Phone
  ↓ SMS received (via Message Central)
  "Your OTP is: 123456"
  ↓
Otp2FactorScreen
  ↓
┌─────────────────────────────────────┐
│  OTP Input (6 boxes)                │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐│
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 ││
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘│
│  - Auto-focus next input            │
│  - Backspace focuses previous       │
│  - Submit on complete               │
└─────────────────────────────────────┘
```


#### Step 6: Verify OTP Request

```
[FRONTEND] Otp2FactorScreen.jsx
handleVerifyOtp() calls:
  ↓
[SERVICE] messagecentral-otp.service.js
verifyOTP(verificationId, "123456", "+91XXXXXXXXXX")
  ↓
[API CALL] POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp
Body: {
  verificationId: "uuid-string",
  code: "123456",
  mobileNumber: "+91XXXXXXXXXX"
}
```

#### Step 7: Backend Verifies OTP

```
[BACKEND] Express App receives request
  ↓
[MIDDLEWARE] Rate Limiter: otpVerifyLimiter
  ├─ Key: `otp_verify:${phone}`
  ├─ Check: attempts < 10 (per 15 minutes)?
  │   ├─ YES → Proceed
  │   └─ NO → Return 429 "Too many verification attempts"
  ↓
[CONTROLLER] auth.controller.js - verifyOtpHandler()
  ├─ 1. Find OTP record in database
  │    const otpRecord = await prisma.otpCode.findFirst({
  │      where: {
  │        verificationId,
  │        mobileNumber,
  │        used: false
  │      }
  │    });
  ├─ 2. Check if exists
  │    if (!otpRecord) → 400 "Invalid or expired OTP"
  ├─ 3. Check expiration
  │    if (otpRecord.expiresAt < new Date()) → 400 "OTP expired"
  ├─ 4. Verify OTP hash
  │    const isValid = await bcrypt.compare(code, otpRecord.code);
  │    if (!isValid) → 400 "Invalid OTP"
  ├─ 5. Mark OTP as used
  │    await prisma.otpCode.update({
  │      where: { id: otpRecord.id },
  │      data: { used: true, usedAt: new Date() }
  │    });
  ├─ 6. Find or create Patient user
  │    let patient = await prisma.patient.findUnique({
  │      where: { mobileNumber },
  │      include: { user: true }
  │    });
  │    
  │    if (!patient) {
  │      // Create new user and patient
  │      const user = await prisma.user.create({
  │        data: {
  │          mobileNumber,
  │          role: 'PATIENT',
  │          isVerified: true
  │        }
  │      });
  │      
  │      patient = await prisma.patient.create({
  │        data: {
  │          userId: user.id,
  │          mobileNumber
  │        },
  │        include: { user: true }
  │      });
  │    }
  ├─ 7. Generate JWT tokens
  │    const accessToken = jwt.sign(
  │      { userId: patient.userId, role: 'PATIENT' },
  │      process.env.JWT_SECRET,
  │      { expiresIn: '15m' }
  │    );
  │    
  │    const refreshToken = jwt.sign(
  │      { userId: patient.userId },
  │      process.env.JWT_REFRESH_SECRET,
  │      { expiresIn: '7d' }
  │    );
  └─ 8. Return auth data
       ↓
[RESPONSE] 200 OK
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": null,
    "mobileNumber": "+91XXXXXXXXXX",
    "role": "PATIENT"
  }
}
```


#### Step 8: Frontend Stores Auth Data

```
[FRONTEND] Otp2FactorScreen.jsx receives response
  ↓
authStore.signIn(accessToken, user, refreshToken)
  ↓
[STORE] authStore.js (Zustand)
  ├─ 1. Store tokens in Expo SecureStore (encrypted)
  │    await SecureStore.setItemAsync('accessToken', accessToken);
  │    await SecureStore.setItemAsync('refreshToken', refreshToken);
  ├─ 2. Update Zustand state
  │    set({ user, token: accessToken, loading: false });
  └─ 3. Trigger React Navigation change
       ↓
[NAVIGATION] App.js detects user state change
  ├─ user !== null
  └─ Renders <MainNavigator /> instead of <AuthNavigator />
       ↓
[SCREEN] HomeScreen renders
  ├─ Bottom tabs visible
  ├─ User is logged in
  └─ Can access protected features
```

**Auth Store Code:**
```javascript
// src/store/authStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,
  
  signIn: async (accessToken, user, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, token: accessToken, loading: false });
  },
  
  signOut: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, token: null });
  },
  
  loadTokens: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (accessToken) {
        // Verify token and load user
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        set({ user: response.data.user, token: accessToken, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ loading: false });
    }
  }
}));
```

### 2.3 Error Scenarios & Recovery

#### Error: Rate Limit Exceeded (429)

**Trigger:** User requests OTP 6th time within 1 hour

```
[BACKEND] otpSendLimiter blocks request
  ↓
[RESPONSE] 429 Too Many Requests
{
  "success": false,
  "message": "Too many OTP requests. Please try again after an hour.",
  "retryAfter": 3456 // seconds
}
  ↓
[FRONTEND] Alert shown
"Too many OTP requests. Please try again after an hour."
```

**Recovery:** Wait for rate limit window to expire (1 hour)


#### Error: Invalid OTP (400)

**Trigger:** User enters wrong OTP code

```
[BACKEND] bcrypt.compare returns false
  ↓
[RESPONSE] 400 Bad Request
{
  "success": false,
  "message": "Invalid OTP code"
}
  ↓
[FRONTEND] Alert + Clear OTP inputs
  ├─ Alert.alert('Verification Failed', 'Invalid OTP code')
  ├─ setOtp(['', '', '', '', '', ''])
  └─ inputRefs.current[0]?.focus()
```

**Recovery:** User can try again (up to 10 attempts per 15 minutes)

#### Error: Expired OTP (400)

**Trigger:** User enters OTP after 3 minutes

```
[BACKEND] otpRecord.expiresAt < new Date()
  ↓
[RESPONSE] 400 Bad Request
{
  "success": false,
  "message": "OTP has expired. Please request a new one."
}
  ↓
[FRONTEND] Alert with resend option
Alert.alert(
  'OTP Expired',
  'This OTP has expired. Request a new one?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Resend', onPress: handleResendOtp }
  ]
)
```

**Recovery:** User taps "Resend" → New OTP generated

#### Error: Message Central API Failure

**Trigger:** Message Central service down or rate limited

```
[BACKEND] Message Central API call fails
  ↓
[CONTROLLER] Catches error
  ↓
[RESPONSE] 500 Internal Server Error
{
  "success": false,
  "message": "Failed to send OTP. Please try again later."
}
  ↓
[FRONTEND] Alert shown
"Failed to send OTP. Please try again later."
```

**Recovery:** User can try again after a moment

---

## 3. DOCTOR DISCOVERY & BOOKING FLOW

### 3.1 Search Flow

#### Step 1: User Searches for Doctors

```
HomeScreen OR SearchScreen
  ↓
User enters search query:
  ├─ Doctor name
  ├─ Specialization
  └─ Location
  ↓
[API CALL] GET /api/patient/doctors?search=...&specialization=...&location=...
```

**API Request:**
```javascript
// Frontend
const searchDoctors = async (filters) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.specialization) params.append('specialization', filters.specialization);
  if (filters.location) params.append('location', filters.location);
  if (filters.availability) params.append('availability', filters.availability);
  
  const response = await api.get(`/patient/doctors?${params}`);
  return response.data.doctors;
};
```


**Backend Query:**
```javascript
// backend/src/controllers/patient.controller.js
async function searchDoctorsHandler(req, res) {
  const { search, specialization, location, availability } = req.query;
  
  const doctors = await prisma.doctor.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { specialization: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        specialization ? { specialization } : {},
        location ? {
          clinic: {
            OR: [
              { city: { contains: location, mode: 'insensitive' } },
              { address: { contains: location, mode: 'insensitive' } }
            ]
          }
        } : {},
        availability === 'today' ? {
          availability: { some: { date: new Date() } }
        } : {}
      ]
    },
    include: {
      user: true,
      clinic: true,
      availability: {
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' }
      }
    },
    orderBy: { rating: 'desc' }
  });
  
  res.json({ success: true, doctors });
}
```

**Response:**
```json
{
  "success": true,
  "doctors": [
    {
      "id": 1,
      "userId": 10,
      "specialization": "Cardiologist",
      "qualification": "MBBS, MD",
      "experience": 15,
      "rating": 4.8,
      "reviewCount": 120,
      "consultationFee": 500,
      "user": {
        "id": 10,
        "name": "Dr. John Smith",
        "profilePicture": "https://..."
      },
      "clinic": {
        "id": 5,
        "name": "City Heart Clinic",
        "address": "123 Main St",
        "city": "Mumbai",
        "distance": 2.5
      },
      "availability": [
        {
          "date": "2026-08-09",
          "slots": ["09:00", "09:30", "10:00"]
        }
      ]
    }
  ]
}
```

#### Step 2: User Views Doctor Details

```
SearchScreen → Tap doctor card
  ↓
DoctorDetailScreen
  ↓
[API CALL] GET /api/patient/doctors/:id
  ↓
Display:
  ├─ Doctor profile (name, photo, specialization)
  ├─ Ratings & reviews
  ├─ Qualifications & experience
  ├─ Clinic information
  ├─ Available time slots
  └─ "Book Appointment" button
```

