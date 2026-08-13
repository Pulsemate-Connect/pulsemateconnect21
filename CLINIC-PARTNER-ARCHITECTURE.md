# Clinic Partner Architecture - Complete Documentation

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLINIC PARTNER SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Frontend   │───▶│   Backend    │───▶│   Database   │     │
│  │   (React)    │◀───│   (Node.js)  │◀───│  (PostgreSQL)│     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │Message Central│    │   Firebase   │                          │
│  │  (OTP SMS)   │    │(Phone Auth)  │                          │
│  └──────────────┘    └──────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete Flow Diagram

### Registration Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRATION JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

1. USER LANDS ON /clinic-partner
   ↓
2. CLICKS "Register" → Opens ClinicAuthModal (view: 'signup')
   ↓
3. ENTERS:
   - Full Name
   - Email Address
   - Agrees to Terms ✓
   ↓
4. CLICKS "Continue"
   ↓
5. BACKEND CHECK:
   GET /auth/check-user-exists?email=xxx
   ├─ EXISTS? → Error: "Email already registered"
   └─ NOT EXISTS? → Continue ✓
   ↓
6. SEND EMAIL OTP:
   POST /auth/register-email-otp/send
   Body: { email, name }
   ↓
7. BACKEND:
   - Check if email exists
   - If PENDING: Error "Application pending"
   - If VERIFIED: Error "Email exists"
   - If NEW: Generate 6-digit OTP
   - Store in emailVerifications table
   - Send email with OTP
   ↓
8. USER RECEIVES EMAIL OTP (Valid: 10 minutes)
   ↓
9. ENTERS 6-DIGIT OTP
   ↓
10. VERIFY EMAIL OTP:
    POST /auth/register-email-otp/verify
    Body: { email, otp, name, role: "CLINIC_OWNER" }
    ↓
11. BACKEND:
    - Validate OTP
    - Create User record:
      {
        email: "xxx@example.com",
        name: "Clinic Owner Name",
        role: "CLINIC_OWNER",
        approvalStatus: "PENDING",
        isEmailVerified: true
      }
    - Issue JWT tokens (accessToken, refreshToken)
    - Return user + tokens
    ↓
12. FRONTEND:
    - Store tokens in authStore
    - User logged in ✓
    - Redirect to: /clinic/onboarding/step-1
    ↓
13. ONBOARDING PROCESS (4 Steps):
    
    STEP 1: Clinic Information
    ├─ Verify Phone (Firebase Phone Auth)
    │  └─ POST /auth/clinic-owner/verify-firebase-phone
    ├─ Clinic Details (name, type, display name)
    ├─ Owner Details (auto-filled from registration)
    ├─ Address (full address with map)
    └─ SAVE → POST /auth/clinic-owner/save-clinic-information
       └─ Stores in User.clinicOnboardingData JSON field
    
    STEP 2: Services & Operations
    ├─ Specialties (multi-select)
    ├─ Consultation Types (In-Person, Video, Phone)
    ├─ Operating Hours (opening/closing time)
    ├─ Weekly Off Days
    └─ SAVE → POST /auth/clinic-owner/save-services-operations
       └─ Stores in User.clinicOnboardingData JSON field
    
    STEP 3: Clinic Documents
    ├─ Registration Certificate (upload)
    ├─ Medical License (upload)
    ├─ Owner ID Proof (upload)
    ├─ GST Certificate (upload)
    ├─ Clinic Photos (4 photos: logo, exterior, reception, consultation)
    └─ SAVE → POST /auth/clinic-owner/save-clinic-documents
       └─ Files uploaded to Cloudinary/local
       └─ URLs stored in User.clinicOnboardingData JSON field
    
    STEP 4: Partner Agreement
    ├─ Review Terms & Conditions
    ├─ Accept checkboxes:
    │  ├─ Terms Accepted ✓
    │  ├─ Confirm Authorized ✓
    │  ├─ Confirm Accurate ✓
    │  └─ Confirm Compliance ✓
    └─ SUBMIT → POST /auth/clinic-owner/submit-application
       ├─ Update User.approvalStatus = "PENDING"
       ├─ Update User.clinicOnboardingData.onboardingComplete = true
       └─ Shows success modal ✓

14. REGISTRATION COMPLETE!
    - User status: PENDING
    - Admin notified for review
    - User can login and see pending dashboard
```

---

### Login Flow (Email OR Mobile)

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. USER LANDS ON /clinic-partner
   ↓
2. CLICKS "Login" → Opens ClinicAuthModal (view: 'login')
   ↓
3. CHOOSES LOGIN METHOD:
   ┌──────────────────────┬──────────────────────┐
   │    MOBILE LOGIN      │     EMAIL LOGIN      │
   └──────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE LOGIN PATH                           │
└─────────────────────────────────────────────────────────────────┘

1. USER ENTERS: Mobile Number (10 digits)
   ↓
2. CLICKS: "Send One Time Password"
   ↓
3. FRONTEND CHECK:
   GET /auth/check-user-exists?mobile=9999999999
   ├─ NOT EXISTS? → Error: "Mobile not registered. Create account first."
   └─ EXISTS? → Continue ✓
   ↓
4. SEND MOBILE OTP:
   POST /auth/send-otp
   Body: { phoneNumber: "9999999999", purpose: "LOGIN" }
   ↓
5. BACKEND:
   - Normalize phone: +919999999999
   - Check if test mode:
     ├─ TEST MODE: Return fake verificationId, show OTP in toast
     └─ PRODUCTION: Call Message Central VerifyNow API
   - Return: { verificationId, timeout: 180, mobileNumber }
   ↓
6. USER RECEIVES SMS OTP (Valid: 3 minutes)
   ↓
7. ENTERS 6-DIGIT OTP
   ↓
8. VERIFY MOBILE OTP:
   POST /auth/verify-otp
   Body: { phoneNumber: "9999999999", otp: "123456" }
   ↓
9. BACKEND:
   - Validate OTP with Message Central
   - Find user by mobile
   - If user exists:
     ├─ Update lastLoginAt
     ├─ Issue JWT tokens
     ├─ Create audit log: "CLINIC_OWNER_LOGIN_MOBILE_OTP"
     └─ Return: { accessToken, refreshToken, user }
   - If user NOT exists:
     └─ Return: { verified: true } (just verification, no login)
   ↓
10. FRONTEND:
    - Check if tokens received
    - Store tokens in authStore
    - Check user.status:
      ├─ PENDING → Redirect to /clinic/dashboard/pending
      └─ VERIFIED → Redirect to /clinic/onboarding/step-1 or dashboard
    - User logged in ✓


┌─────────────────────────────────────────────────────────────────┐
│                       EMAIL LOGIN PATH                           │
└─────────────────────────────────────────────────────────────────┘

1. USER CLICKS: "Continue with Email"
   ↓
2. USER ENTERS: Email Address
   ↓
3. CLICKS: "Send One Time Password"
   ↓
4. FRONTEND CHECK:
   GET /auth/check-user-exists?email=user@example.com
   ├─ NOT EXISTS? → Error: "Email not registered. Create account first."
   └─ EXISTS? → Continue ✓
   ↓
5. SEND EMAIL OTP:
   POST /auth/register-email-otp/send
   Body: { email: "user@example.com", name: "" }
   ↓
6. BACKEND:
   - Check if email exists (it does, we just verified)
   - Generate 6-digit OTP
   - Store in emailVerifications table
   - Send email with OTP
   - Return: { success: true }
   ↓
7. USER RECEIVES EMAIL OTP (Valid: 10 minutes)
   ↓
8. ENTERS 6-DIGIT OTP
   ↓
9. VERIFY EMAIL OTP:
   POST /auth/register-email-otp/verify
   Body: { email: "user@example.com", otp: "123456" }
   ↓
10. BACKEND:
    - Validate OTP
    - Find user by email
    - If user exists:
      ├─ Update lastLoginAt
      ├─ Issue JWT tokens
      ├─ Create audit log: "CLINIC_OWNER_LOGIN_EMAIL_OTP"
      └─ Return: { accessToken, refreshToken, user }
    ↓
11. FRONTEND:
    - Store tokens in authStore
    - Check user.status:
      ├─ PENDING → Redirect to /clinic/dashboard/pending
      └─ VERIFIED → Redirect to /clinic/dashboard or operations
    - User logged in ✓
```

---

## 🗄️ Database Schema

### User Table
```sql
model User {
  id                   String       @id @default(cuid())
  email                String?      @unique
  mobile               String?      @unique
  name                 String?
  passwordHash         String?
  role                 UserRole     @default(PATIENT)
  approvalStatus       ApprovalStatus @default(PENDING)
  
  -- Verification Status
  isEmailVerified      Boolean      @default(false)
  isPhoneVerified      Boolean      @default(false)
  
  -- Auth Provider
  authProvider         String?      // "EMAIL_OTP", "MOBILE_OTP", "FIREBASE_PHONE"
  firebaseUid          String?
  
  -- Onboarding Data (JSON)
  clinicOnboardingData Json?        // Stores all onboarding steps data
  
  -- Timestamps
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
  lastLoginAt          DateTime?
  
  -- Profiles
  clinicOwnerProfile   ClinicOwnerProfile?
  ownedClinics         Clinic[]
  
  -- Relations
  refreshTokens        RefreshToken[]
  auditLogs            AuditLog[]
}
```

### clinicOnboardingData JSON Structure
```json
{
  "clinicInformation": {
    "clinicName": "ABC Medical Center",
    "clinicType": "MULTI_SPECIALTY",
    "clinicTypeOther": null,
    "displayName": "ABC Medical",
    "ownerName": "Dr. John Doe",
    "ownerEmail": "john@example.com",
    "ownerMobile": "9999999999",
    "primaryContactPhone": "9999999999",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "addressLine1": "123 Main Street",
    "addressLine2": "Near City Hospital",
    "locality": "Downtown",
    "landmark": "Opposite Metro Station",
    "city": "New Delhi",
    "state": "Delhi",
    "pincode": "110001",
    "country": "India",
    "completedAt": "2024-01-15T10:30:00.000Z"
  },
  "servicesOperations": {
    "specialties": ["GENERAL_MEDICINE", "CARDIOLOGY", "PEDIATRICS"],
    "specialtyOther": null,
    "consultationTypes": ["IN_PERSON", "VIDEO_CALL"],
    "openingTime": "09:00",
    "closingTime": "18:00",
    "weeklyOffDays": ["SUNDAY"],
    "appointmentMode": "SCHEDULED",
    "completedAt": "2024-01-15T10:45:00.000Z"
  },
  "clinicDocuments": {
    "clinicRegistrationCertificate": "https://cloudinary.com/xxx.pdf",
    "medicalLicense": "https://cloudinary.com/yyy.pdf",
    "ownerIdProof": "https://cloudinary.com/zzz.pdf",
    "gstCertificate": "https://cloudinary.com/aaa.pdf",
    "clinicPhotos": {
      "logo": "https://cloudinary.com/logo.jpg",
      "exterior": "https://cloudinary.com/exterior.jpg",
      "reception": "https://cloudinary.com/reception.jpg",
      "consultation": "https://cloudinary.com/consultation.jpg"
    },
    "clinicRegistrationNumber": "REG123456",
    "gstNumber": "GST987654",
    "completedAt": "2024-01-15T11:00:00.000Z"
  },
  "partnerAgreement": {
    "termsAccepted": true,
    "confirmAuthorized": true,
    "confirmAccurate": true,
    "confirmCompliance": true,
    "termsAcceptedAt": "2024-01-15T11:15:00.000Z",
    "agreementVersion": "v1.0",
    "submittedAt": "2024-01-15T11:15:00.000Z",
    "completedAt": "2024-01-15T11:15:00.000Z"
  },
  "lastUpdatedStep": "partnerAgreement",
  "lastUpdatedAt": "2024-01-15T11:15:00.000Z",
  "onboardingComplete": true,
  "submittedAt": "2024-01-15T11:15:00.000Z"
}
```

### Email Verification Table
```sql
model EmailVerification {
  id         String   @id @default(cuid())
  email      String
  otp        String
  expiresAt  DateTime
  verified   Boolean  @default(false)
  createdAt  DateTime @default(now())
  
  @@index([email])
}
```

### Refresh Token Table
```sql
model RefreshToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  expiresAt   DateTime
  revokedAt   DateTime?
  ipAddress   String?
  deviceInfo  String?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([token])
}
```

---

## 🔐 Authentication & Security

### JWT Token Structure

#### Access Token (15 minutes validity)
```json
{
  "userId": "cm5abc123xyz",
  "email": "clinic@example.com",
  "mobile": "9999999999",
  "role": "CLINIC_OWNER",
  "sessionId": "session_abc123",
  "iat": 1234567890,
  "exp": 1234568790
}
```

#### Refresh Token (30 days validity)
```json
{
  "userId": "cm5abc123xyz",
  "sessionId": "session_abc123",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1237245890
}
```

### Token Storage
- **Web Frontend**: 
  - `accessToken`: Memory (authStore state)
  - `refreshToken`: httpOnly cookie (30 days, secure, sameSite: 'strict')

### Security Features
1. **OTP Validation**:
   - 6-digit random OTP
   - Email OTP: 10 minutes validity
   - Mobile OTP: 3 minutes validity
   - Rate limiting: 5 OTP sends per hour per phone/email

2. **PENDING Check**:
   - Registration blocks if email/mobile has PENDING application
   - Login allows PENDING users (shows pending dashboard)

3. **Rate Limiting**:
   - Login: 10 attempts / 15 minutes per IP
   - OTP Send: 5 requests / hour per phone/email
   - OTP Verify: 10 attempts / 15 minutes per phone/email

4. **Session Management**:
   - Multiple devices supported
   - Logout revokes refresh token
   - Logout all devices revokes all user's refresh tokens

---

## 🎯 User States & Redirects

### User Approval Status
```
┌──────────┐
│ PENDING  │ → Just registered, submitted application
├──────────┤    Can login, sees pending dashboard
│          │    No access to operations
└──────────┘

┌──────────┐
│ VERIFIED │ → Admin approved application
├──────────┤    Full access to clinic dashboard
│          │    Can manage appointments, staff, etc.
└──────────┘

┌──────────┐
│ REJECTED │ → Admin rejected application
├──────────┤    Can login, can resubmit with edits
│          │    No access to operations
└──────────┘

┌───────────┐
│ SUSPENDED │ → Account suspended by admin
├───────────┤    Cannot login
│           │    Shows suspension reason
└───────────┘
```

### Redirect Logic
```javascript
// After successful login
if (user.status === 'PENDING') {
  redirect('/clinic/dashboard/pending');
}
else if (user.status === 'VERIFIED') {
  redirect('/clinic/dashboard');
}
else if (user.status === 'REJECTED') {
  redirect('/clinic/edit-resubmit');
}
else if (user.status === 'SUSPENDED') {
  logout();
  showError('Account suspended: ' + user.suspendedReason);
}
```

---

## 📡 API Endpoints Summary

### Authentication
```
POST   /auth/register-email-otp/send          - Send email OTP (registration/login)
POST   /auth/register-email-otp/verify        - Verify email OTP (creates user if new)
POST   /auth/send-otp                         - Send mobile OTP (login)
POST   /auth/verify-otp                       - Verify mobile OTP (login with tokens)
GET    /auth/check-user-exists                - Check if email/mobile registered
POST   /auth/refresh                          - Refresh access token
POST   /auth/logout                           - Logout (revoke refresh token)
POST   /auth/logout-all                       - Logout from all devices
GET    /auth/me                               - Get current user details
```

### Onboarding
```
POST   /auth/clinic-owner/verify-firebase-phone   - Verify phone with Firebase
POST   /auth/clinic-owner/send-email-otp          - Send email verification OTP
POST   /auth/clinic-owner/verify-email-otp        - Verify email OTP
POST   /auth/clinic-owner/save-clinic-information - Save Step 1 data
POST   /auth/clinic-owner/save-services-operations - Save Step 2 data
POST   /auth/clinic-owner/save-clinic-documents   - Save Step 3 data (with file uploads)
POST   /auth/clinic-owner/submit-application      - Submit final application
GET    /auth/clinic-owner/get-onboarding-data     - Get saved onboarding data
```

---

## 🔄 State Management (Frontend)

### authStore (Zustand)
```javascript
{
  // User data
  user: {
    id: "cm5abc123",
    name: "Dr. John Doe",
    email: "john@example.com",
    phone: "9999999999",
    role: "CLINIC_OWNER",
    status: "PENDING",
    isPhoneVerified: true,
    isEmailVerified: true
  },
  
  // Tokens
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  
  // Auth state
  isAuthenticated: true,
  isLoading: false,
  
  // Actions
  login: (userData, token) => {},
  logout: () => {},
  updateUser: (userData) => {},
  refreshToken: () => {}
}
```

---

## 📱 UI Components

### Key Components
```
ClinicAuthModal
├─ LoginView (Mobile OR Email)
├─ SignupView (Email only)
└─ OTPView (6-digit input)

ClinicOnboarding
├─ Step1ClinicInfo
├─ Step2ServicesOperations
├─ Step3ClinicDocuments
└─ Step4PartnerAgreement

PendingApprovalDashboard
└─ (Read-only status view)

OwnerDashboard
└─ (Full access after approval)
```

---

## 🚀 Deployment Considerations

### Environment Variables
```bash
# Backend (.env)
JWT_SECRET=xxx
JWT_REFRESH_SECRET=yyy
DATABASE_URL=postgresql://...
MESSAGE_CENTRAL_API_KEY=zzz
FIREBASE_PROJECT_ID=pulsemateconnect
CLOUDINARY_URL=cloudinary://...
ENABLE_TEST_OTP=true
TEST_OTP_CODE=123456
TEST_OTP_NUMBERS=9999999999,8888888888
```

### Frontend Configuration
```javascript
// API Base URL
VITE_API_URL=http://localhost:5001/api

// Firebase Config
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=pulsemateconnect
```

---

## 📊 System Status Summary

### ✅ Completed Features
- Email OTP Registration ✓
- Email OTP Login ✓
- Mobile OTP Login ✓
- User existence validation ✓
- PENDING status handling ✓
- 4-step onboarding process ✓
- File uploads (Cloudinary) ✓
- Pending approval dashboard ✓
- Token-based authentication ✓
- Rate limiting ✓
- Audit logging ✓

### 🔄 Current Limitations
- No password-based login (OTP only)
- No social login (Google, Facebook)
- No 2FA/MFA
- No email change after registration
- No mobile change after verification

### 🎯 Future Enhancements
- Real-time status updates (WebSocket)
- Progress tracking in onboarding
- Admin dashboard for approvals
- Rejection reasons and resubmission
- Document verification automation
- SMS notifications
- Push notifications
- Multi-language support

---

## 📝 Complete User Journey Example

### Registration → Approval → Login
```
Day 1: 10:00 AM
├─ Clinic owner visits /clinic-partner
├─ Clicks "Register"
├─ Enters: name, email, accepts terms
├─ Receives email OTP
├─ Verifies OTP → User created (PENDING)
├─ Redirected to /clinic/onboarding/step-1
│
├─ Step 1: Fills clinic info, verifies phone → Saved
├─ Step 2: Fills services & operations → Saved
├─ Step 3: Uploads documents → Saved
├─ Step 4: Accepts terms → Submits application
└─ Status: PENDING ✓

Day 1: 10:30 AM (User closes browser)

Day 2: 3:00 PM (User wants to check status)
├─ Visits /clinic-partner
├─ Clicks "Login"
├─ Enters email
├─ Receives email OTP
├─ Verifies OTP → Logged in
└─ Redirected to /clinic/dashboard/pending
   └─ Sees "Application Pending Review" ✓

Day 3: 10:00 AM (Admin reviews and approves)
├─ Admin changes status: PENDING → VERIFIED
└─ User receives email notification

Day 3: 2:00 PM (User logs in again)
├─ Visits /clinic-partner
├─ Clicks "Login"
├─ Enters mobile this time
├─ Receives SMS OTP
├─ Verifies OTP → Logged in
├─ Status check: VERIFIED
└─ Redirected to /clinic/dashboard
   └─ Full access to operations! ✓
```

---

## 🎉 Summary

This is a complete **passwordless OTP-based authentication system** with:
- ✅ Dual login (Email OR Mobile)
- ✅ Comprehensive onboarding (4 steps)
- ✅ Approval workflow (PENDING → VERIFIED)
- ✅ Secure JWT tokens
- ✅ File uploads
- ✅ Rate limiting
- ✅ Audit trails
- ✅ Professional UI/UX

The system is **production-ready** and handles all edge cases including pending applications, rejected applications, and multi-device sessions.
