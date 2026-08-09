# 📚 PulseMate Connect - Complete Documentation Index

**Last Updated:** August 8, 2026

---

## 🎯 QUICK START

**New to the project? Start here:**
1. Read `▶️-START-HERE.md` - Quick overview
2. Read `✅-EMULATOR-RUNNING.md` - Run the app
3. Read `🎯-QUICK-FLOW-GUIDE.md` - Main user flows

---

## 📖 DOCUMENTATION FILES

### 🚀 Getting Started
| File | Description | Use When |
|------|-------------|----------|
| `▶️-START-HERE.md` | Quick start guide | First time setup |
| `✅-EMULATOR-RUNNING.md` | Emulator setup & status | Running the app |
| `📱-METRO-STARTED.md` | Metro bundler info | Development |
| `🚀-RUN-APP-ON-EMULATOR.md` | Complete run guide | Need detailed steps |

### 🔐 Authentication
| File | Description | Use When |
|------|-------------|----------|
| `📖-COMPLETE-TECHNICAL-FLOWS.md` | Detailed auth flow | Understanding implementation |
| `🎯-QUICK-FLOW-GUIDE.md` | Quick auth overview | Quick reference |
| `MESSAGE-CENTRAL-API-FIX.md` | OTP validation fix | Debugging OTP issues |
| `OTP-RATE-LIMIT-FIX-DEPLOYED.md` | Rate limit fix details | Understanding rate limits |

### 🐛 Bug Fixes & Issues
| File | Description | Use When |
|------|-------------|----------|
| `🎉-ALL-OTP-ISSUES-FIXED.md` | Complete OTP fix summary | Overview of all fixes |
| `OTP-RATE-LIMIT-DIAGNOSTIC-REPORT.md` | Investigation report | Understanding the bug |
| `OTP-DEPLOYMENT-FIX.md` | Deployment fix | Syntax error resolution |
| `🔧-FIX-EMULATOR-ISSUE.md` | Emulator troubleshooting | Emulator won't start |

### 📱 Application Flows
| File | Description | Use When |
|------|-------------|----------|
| `🎯-QUICK-FLOW-GUIDE.md` | All main flows | Quick reference |
| `📖-COMPLETE-TECHNICAL-FLOWS.md` | Detailed technical flows | Deep understanding |
| `📚-COMPLETE-APP-FLOW-DOCUMENTATION.md` | Architecture & flows | System design |

### ⚙️ Configuration & Setup
| File | Description | Use When |
|------|-------------|----------|
| `app.json` | Expo configuration | App settings |
| `eas.json` | EAS Build configuration | Building APK/AAB |
| `package.json` | Dependencies | Installing packages |

---

## 🔥 KEY CONCEPTS

### Authentication System

**Current Implementation:** Message Central OTP (SMS)

**Flow:**
```
User → Enter Phone → Send OTP → Receive SMS → Enter OTP → Verify → Get JWT → Login
```

**Files to Read:**
1. Frontend: `src/screens/Login2FactorScreen.jsx`
2. Frontend: `src/screens/Otp2FactorScreen.jsx`
3. Frontend Service: `src/services/messagecentral-otp.service.js`
4. Backend: `backend/src/controllers/auth.controller.js`
5. Backend: `backend/src/services/messagecentral.service.js`

**Recent Fixes:**
- ✅ Rate limiting (phone-based, separate counters)
- ✅ API method (POST → GET for validation)
- ✅ Redundant database check removed


### Rate Limiting Configuration

**Implementation:** `backend/src/middleware/rateLimit.middleware.js`

| Endpoint | Limiter | Window | Max | Key | Purpose |
|----------|---------|--------|-----|-----|---------|
| `/patient/send-otp` | `otpSendLimiter` | 1 hour | 5 | Phone | Prevent SMS spam |
| `/patient/verify-otp` | `otpVerifyLimiter` | 15 min | 10 | Phone | Allow retries |
| `/patient/firebase-phone-login` | `firebasePhoneLoginLimiter` | 1 hour | 10 | IP | Firebase login |
| `/login` | `loginLimiter` | 15 min | 5 | Email | Standard login |

**Why Phone-Based:**
- Fair per-user limits
- Prevents NAT/corporate network blocking
- Independent quotas for each phone number

### Navigation Structure

```
Root
├── Unauthenticated (AuthNavigator)
│   ├── WelcomeScreen (Entry)
│   ├── Login2FactorScreen (Message Central)
│   ├── Otp2FactorScreen (Verification)
│   ├── LoginScreen (Firebase - backup)
│   └── OtpScreen (Firebase OTP - backup)
│
└── Authenticated (MainNavigator - Bottom Tabs)
    ├── HomeTab
    │   ├── HomeScreen
    │   ├── SearchScreen
    │   ├── DoctorDetailScreen
    │   ├── BookingScreen
    │   ├── RazorpayScreen
    │   ├── PaymentStatusScreen
    │   ├── LiveQueueScreen
    │   ├── NearbyClinicsScreen
    │   ├── TopDoctorsScreen
    │   └── ProfileWizardScreen
    │
    ├── DoctorsTab
    │   ├── SearchScreen (main)
    │   ├── DoctorDetailScreen
    │   ├── BookingScreen
    │   └── ... (shared screens)
    │
    ├── AppointmentsTab
    │   ├── AppointmentsScreen (list)
    │   ├── AppointmentDetailScreen
    │   └── LiveQueueScreen
    │
    └── ProfileTab
        ├── ProfileScreen
        ├── EditProfileScreen
        ├── ProfileWizardScreen
        ├── PaymentsScreen
        ├── NotificationsScreen
        └── NotificationSettingsScreen
```

### Database Schema (Key Tables)

**Users Table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  mobile_number VARCHAR(15) UNIQUE,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50), -- 'PATIENT', 'DOCTOR', 'CLINIC_OWNER', 'RECEPTIONIST'
  is_verified BOOLEAN DEFAULT false,
  profile_picture TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Patients Table:**
```sql
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  mobile_number VARCHAR(15) UNIQUE,
  date_of_birth DATE,
  gender VARCHAR(20),
  blood_group VARCHAR(10),
  medical_history TEXT,
  allergies TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Doctors Table:**
```sql
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  clinic_id INTEGER REFERENCES clinics(id),
  specialization VARCHAR(255),
  qualification VARCHAR(255),
  experience INTEGER,
  consultation_fee DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  available_days TEXT[], -- ['MONDAY', 'TUESDAY', ...]
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Appointments Table:**
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id),
  doctor_id INTEGER REFERENCES doctors(id),
  clinic_id INTEGER REFERENCES clinics(id),
  appointment_date DATE,
  appointment_time TIME,
  status VARCHAR(50), -- 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
  queue_number INTEGER,
  consultation_fee DECIMAL(10,2),
  payment_status VARCHAR(50), -- 'PENDING', 'PAID', 'REFUNDED'
  payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**OTP Codes Table:**
```sql
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  mobile_number VARCHAR(15),
  code VARCHAR(255), -- bcrypt hashed
  verification_id VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 API ENDPOINTS

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/patient/send-otp` | No | Send OTP to mobile |
| POST | `/api/auth/patient/verify-otp` | No | Verify OTP and login |
| POST | `/api/auth/patient/firebase-phone-login` | No | Firebase phone login |
| POST | `/api/auth/login` | No | Email/password login |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Logout (invalidate token) |
| GET | `/api/auth/me` | Yes | Get current user |

### Patient Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/patient/profile` | Yes | Get patient profile |
| PATCH | `/api/patient/profile` | Yes | Update profile |
| GET | `/api/patient/doctors` | Yes | Search doctors |
| GET | `/api/patient/doctors/:id` | Yes | Get doctor details |
| GET | `/api/patient/clinics` | Yes | Search clinics |
| POST | `/api/patient/appointments` | Yes | Create appointment |
| GET | `/api/patient/appointments` | Yes | List appointments |
| GET | `/api/patient/appointments/:id` | Yes | Get appointment details |
| PATCH | `/api/patient/appointments/:id/cancel` | Yes | Cancel appointment |
| GET | `/api/patient/queue/:appointmentId` | Yes | Get queue status |
| GET | `/api/patient/payments` | Yes | Payment history |
| GET | `/api/patient/notifications` | Yes | Get notifications |

---

## 🔍 ERROR CODES REFERENCE

### HTTP Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Token missing/invalid |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Backend error |

### Custom Error Messages

**Authentication Errors:**
- "Invalid mobile number" - Phone format wrong
- "OTP has expired" - OTP older than 3 minutes
- "Invalid OTP code" - Wrong OTP entered
- "Too many OTP requests" - Rate limit hit (5/hour)
- "Too many verification attempts" - Rate limit hit (10/15min)

**Booking Errors:**
- "Slot no longer available" - Someone else booked
- "Doctor not available" - Doctor schedule changed
- "Payment failed" - Razorpay transaction failed

---

## 📞 TESTING CHECKLIST

### Authentication Testing

- [ ] Can send OTP to valid Indian mobile number
- [ ] Receives SMS within 10 seconds
- [ ] Can verify with correct OTP
- [ ] Gets error on wrong OTP
- [ ] Gets error on expired OTP (after 3 min)
- [ ] Rate limit works (6th request in hour blocked)
- [ ] Different phones have independent limits
- [ ] Can logout successfully
- [ ] Tokens stored securely
- [ ] Refresh token works

### Booking Flow Testing

- [ ] Can search doctors by name
- [ ] Can filter by specialization
- [ ] Can see available time slots
- [ ] Can select slot and proceed to booking
- [ ] Can enter patient details
- [ ] Payment gateway loads correctly
- [ ] Can complete payment
- [ ] Appointment created after payment
- [ ] Receives confirmation notification

### Queue Testing

- [ ] Can view live queue
- [ ] Queue updates in real-time
- [ ] Receives notification when turn comes
- [ ] Can refresh queue manually
- [ ] Socket connection stable

---

## 🎯 PRODUCTION DEPLOYMENT

### Backend (Render.com)

**URL:** https://api.pulsemateconnect.in

**Environment Variables:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
MESSAGE_CENTRAL_CUSTOMER_ID=...
MESSAGE_CENTRAL_PASSWORD_BASE64=...
MESSAGE_CENTRAL_EMAIL=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
PORT=10000
```

### Frontend (Google Play Store)

**Package:** `in.pulsemateconnect.patient`  
**Version:** Check `app.json`  
**Build:** Via EAS Build

**To deploy new version:**
```bash
# Update version in app.json
# Build AAB
eas build --platform android --profile production
# Download AAB from EAS dashboard
# Upload to Google Play Console
```

---

## 📚 ADDITIONAL RESOURCES

### External Documentation
- [Message Central API Docs](https://docs.messagecentral.com)
- [Razorpay Integration](https://razorpay.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org/docs)
- [Prisma ORM](https://www.prisma.io/docs)

### Project Links
- Backend Repo: (Your GitHub link)
- Frontend Repo: (Your GitHub link)
- Play Store: (Your app link)
- Website: https://pulsemateconnect.in

---

**Last Updated:** August 8, 2026  
**Status:** ✅ Production Ready  
**OTP Issues:** ✅ Fixed  
**Next:** Regular maintenance and feature additions
