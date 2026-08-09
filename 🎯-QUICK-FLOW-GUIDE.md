# 🎯 PulseMate Connect - Quick Flow Guide

**Last Updated:** August 8, 2026

---

## 🚀 START HERE

### Emulator/App Status
✅ Emulator: Run `START-EMULATOR.bat` or use Android Studio  
✅ Metro: Running (Terminal ID: 1)  
✅ Backend: Deployed at https://api.pulsemateconnect.in  
✅ OTP Fixes: All deployed (3 commits)

---

## 📱 MAIN USER FLOWS

### 1. AUTHENTICATION FLOW (Message Central OTP)

**Entry:** WelcomeScreen → Tap "Get Started"

```
WelcomeScreen
    ↓
Login2FactorScreen (Enter mobile: +91-XXXXXXXXXX)
    ↓ Send OTP button
[Backend] POST /api/auth/patient/send-otp
    ├─ Rate limit: 5 requests/hour per phone
    ├─ Message Central API
    ├─ Generate & hash OTP
    ├─ Send SMS
    └─ Return: { verificationId, expiresIn: 180 }
    ↓
Otp2FactorScreen (Enter 6-digit code)
    ↓ Verify button
[Backend] POST /api/auth/patient/verify-otp
    ├─ Rate limit: 10 attempts/15min per phone
    ├─ Validate OTP hash
    ├─ Check expiration
    ├─ Find/create Patient user
    ├─ Generate JWT tokens
    └─ Return: { accessToken, refreshToken, user }
    ↓
[Frontend] Store tokens → Navigate to MainNavigator
    ↓
HomeScreen ✅ Logged in
```

**Success Indicators:**
- SMS received within 10 seconds
- OTP verification succeeds
- No "Too many requests" errors
- No 401 validation errors

**Common Errors & Fixes:**
- "Too many requests" → Wait 1 hour (rate limit working)
- "Invalid OTP" → Check OTP code, verify not expired
- "Failed to send OTP" → Check backend logs, Message Central status

---

### 2. HOME & DISCOVERY FLOW

**Entry:** After login → HomeScreen (default tab)

```
HomeScreen
├─ Header: Greeting + Notifications bell
├─ Search Bar → SearchScreen
├─ Quick Actions
│   ├─ Book Appointment → SearchScreen
│   ├─ View Queue → LiveQueueScreen
│   ├─ My Appointments → AppointmentsScreen
│   └─ Nearby Clinics → NearbyClinicsScreen
├─ Nearby Clinics (Horizontal scroll)
│   └─ Tap clinic → DoctorDetailScreen
├─ Top Doctors (Horizontal scroll)
│   └─ Tap doctor → DoctorDetailScreen
└─ Recent Activities (List)
```

**Key Features:**
- Location-based clinic search
- Doctor ratings & reviews
- Specialization filters
- Real-time availability

---

### 3. DOCTOR SEARCH & BOOKING FLOW

```
SearchScreen (Search tab OR from HomeScreen)
├─ Search input (name, specialization, location)
├─ Filters
│   ├─ Specialization dropdown
│   ├─ Location (current/custom)
│   ├─ Availability (today, tomorrow, this week)
│   └─ Rating filter
└─ Doctor list results
    ↓ Tap doctor card
DoctorDetailScreen
├─ Doctor profile
│   ├─ Photo, name, specialization
│   ├─ Rating & reviews count
│   ├─ Qualifications
│   ├─ Experience years
│   └─ Clinic info (name, address, distance)
├─ Available Time Slots
│   ├─ Date selector (horizontal scroll)
│   ├─ Time slots (Morning/Afternoon/Evening)
│   └─ Queue info (current: X patients)
└─ "Book Appointment" button
    ↓
BookingScreen
├─ Selected slot confirmation
├─ Patient details (pre-filled from profile)
│   ├─ Name
│   ├─ Age
│   ├─ Gender
│   └─ Medical history (optional)
├─ Appointment type
│   ├─ New consultation
│   └─ Follow-up
├─ Payment summary
│   ├─ Consultation fee
│   ├─ Booking fee (if any)
│   └─ Total amount
└─ "Proceed to Payment" button
    ↓
RazorpayScreen (Payment gateway)
├─ Load Razorpay checkout
├─ Payment methods
│   ├─ UPI
│   ├─ Cards
│   ├─ Net banking
│   └─ Wallets
└─ Complete payment
    ↓
PaymentStatusScreen
├─ Success: Appointment confirmed
│   ├─ Appointment ID
│   ├─ Doctor name & clinic
│   ├─ Date & time
│   ├─ Queue position
│   └─ "View Appointment" button → AppointmentDetailScreen
└─ Failure: Payment failed
    ├─ Error message
    └─ "Try Again" button → BookingScreen
```

**API Calls:**
1. `GET /api/patient/doctors` - Search doctors
2. `GET /api/patient/doctors/:id` - Doctor details
3. `POST /api/patient/appointments` - Create appointment
4. `POST /api/patient/payments/initiate` - Create Razorpay order
5. `POST /api/patient/payments/verify` - Verify payment signature
6. `GET /api/patient/appointments/:id` - Get appointment details

---

### 4. APPOINTMENTS MANAGEMENT FLOW

```
AppointmentsScreen (Appointments tab)
├─ Tab filters
│   ├─ Upcoming
│   ├─ Completed
│   └─ Cancelled
├─ Appointment cards (list)
│   ├─ Doctor info
│   ├─ Date & time
│   ├─ Clinic location
│   ├─ Status badge
│   └─ Queue position (if upcoming)
└─ Tap card
    ↓
AppointmentDetailScreen
├─ Full appointment info
│   ├─ Appointment ID
│   ├─ Doctor details
│   ├─ Clinic details
│   ├─ Date & time
│   ├─ Payment info
│   └─ Status
├─ Actions (if upcoming)
│   ├─ "View Live Queue" → LiveQueueScreen
│   ├─ "Get Directions" → Open maps
│   ├─ "Call Clinic" → Dialer
│   └─ "Cancel Appointment" → Confirm dialog
└─ Prescription (if completed)
    └─ View/Download PDF
```

**API Calls:**
1. `GET /api/patient/appointments` - List appointments
2. `GET /api/patient/appointments/:id` - Appointment details
3. `PATCH /api/patient/appointments/:id/cancel` - Cancel appointment
4. `GET /api/patient/appointments/:id/prescription` - Get prescription

---

### 5. LIVE QUEUE TRACKING FLOW (Real-time)

```
LiveQueueScreen (From AppointmentDetail OR Home quick action)
├─ Connect to Socket.IO server
│   └─ Room: `queue_${appointmentId}`
├─ Display queue info
│   ├─ Current patient number
│   ├─ Your position
│   ├─ Estimated wait time
│   └─ Total patients
├─ Real-time updates (Socket events)
│   ├─ 'queue_updated' → Update display
│   ├─ 'patient_called' → Notification
│   └─ 'queue_status_changed' → Update status
└─ Actions
    ├─ Refresh button (manual)
    ├─ Call clinic
    └─ Cancel appointment
```

**Socket.IO Integration:**
```javascript
// Connect
socket.connect();
socket.emit('join_queue', { appointmentId });

// Listen for updates
socket.on('queue_updated', (data) => {
  // Update UI with new position
});

socket.on('your_turn', (data) => {
  // Show notification: "It's your turn!"
  // Push notification also sent
});

// Disconnect
socket.emit('leave_queue', { appointmentId });
socket.disconnect();
```

**API Calls:**
1. `GET /api/patient/queue/:appointmentId` - Get initial queue state
2. Socket.IO events for real-time updates

---

### 6. PROFILE MANAGEMENT FLOW

```
ProfileScreen (Profile tab)
├─ User info card
│   ├─ Photo (tap to change)
│   ├─ Name
│   ├─ Mobile (verified)
│   └─ Email
├─ Menu options
│   ├─ Edit Profile → EditProfileScreen
│   ├─ Medical History → ProfileWizardScreen
│   ├─ Payment History → PaymentsScreen
│   ├─ Notifications → NotificationsScreen
│   ├─ Settings → NotificationSettingsScreen
│   ├─ Help & Support → External link
│   ├─ Terms & Privacy → External link
│   └─ Logout → Confirm dialog
└─ Version info
```

**EditProfileScreen:**
- Update name, email, age, gender
- Add/update medical history
- Manage allergies
- Upload documents

**API Calls:**
1. `GET /api/patient/profile` - Get profile
2. `PATCH /api/patient/profile` - Update profile
3. `POST /api/patient/documents/upload` - Upload document
4. `GET /api/patient/payments` - Payment history
5. `GET /api/patient/notifications` - Notifications
6. `PATCH /api/patient/settings` - Update settings

---

## 🚨 ERROR HANDLING & FIXES

### Error 1: "Too Many Requests" After 30 Minutes
**Status:** ✅ FIXED (August 8, 2026)

**Symptoms:**
- User can login initially
- After 30 minutes of normal usage, "Too many requests" appears
- Blocks legitimate users

**Root Cause:**
- Wrong rate limiter applied to OTP endpoints
- `firebasePhoneLoginLimiter` used instead of dedicated OTP limiters
- IP-based blocking (affected all users on same network)
- Single counter for send + verify (10 requests total)
- Normal usage: 3 sends + 7 verifies = 10 = LIMIT HIT

**Fix Applied:**
```javascript
// Created dedicated phone-based rate limiters
const otpSendLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,     // 1 hour
  max: 5,                        // 5 sends per phone
  keyGenerator: (req) => `otp_send:${phone}`
});

const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 10,                       // 10 attempts per phone
  keyGenerator: (req) => `otp_verify:${phone}`
});
```

**Files Changed:**
- `backend/src/middleware/rateLimit.middleware.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/controllers/auth.controller.js`

**Commits:** `3fd189a`, `58c620a`

---

### Error 2: OTP Validation 401 Error
**Status:** ✅ FIXED (August 8, 2026)

**Symptoms:**
- OTP is sent successfully
- User enters correct OTP
- Gets 401 Unauthorized error
- Response header shows: `"allow": "GET"`

**Root Cause:**
- Backend was calling Message Central validate API with POST method
- API only accepts GET method with query parameters

**Fix Applied:**
```javascript
// BEFORE (WRONG):
const response = await axios.post(
  `${BASE_URL}/verification/v3/validateOtp`,
  { verificationId, code }
);

// AFTER (CORRECT):
const response = await axios.get(
  `${BASE_URL}/verification/v3/validateOtp`,
  { params: { verificationId, code } }
);
```

**File Changed:**
- `backend/src/services/messagecentral.service.js`

**Commit:** `7f113e8`

---

### Error 3: Emulator Won't Start
**Status:** ⚠️ COMMON ISSUE

**Symptoms:**
- `npx expo run:android` shows "emulator quit before opening"
- Emulator crashes on launch

**Common Causes:**
1. **Insufficient RAM** - Emulator configured with too much RAM
2. **Graphics driver issue** - Hardware acceleration not supported
3. **HAXM/Virtualization** - Intel HAXM not installed or disabled
4. **Corrupted AVD** - Emulator configuration corrupted

**Fixes:**

**Option A: Use Android Studio Device Manager**
```
1. Open Android Studio
2. Tools → Device Manager
3. Click ▶️ next to emulator
4. Wait for boot
5. Metro terminal → Press 'a'
```

**Option B: Start with software rendering**
```bash
emulator @PulseMatePixel35c -gpu swiftshader_indirect
```

**Option C: Use physical Android device**
```
1. Phone: Enable USB Debugging
2. Connect USB cable
3. adb devices (verify)
4. Metro → Press 'a'
```

**Scripts Created:**
- `LAUNCH-EMULATOR.bat` - Start emulator with proper environment
- `START-DEV-ENVIRONMENT.bat` - Interactive setup

---

### Error 4: Metro Bundler Port Already in Use
**Symptoms:**
- `npm start` fails with "Port 8081 already in use"

**Fix:**
```bash
# Kill existing process
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Or start with reset cache
npm start -- --reset-cache
```

---

### Error 5: App Builds But Crashes Immediately
**Symptoms:**
- APK installs successfully
- App crashes on launch
- No error in Metro

**Common Causes:**
1. Missing native dependencies
2. Incorrect Firebase configuration
3. Asset loading error

**Fix:**
```bash
# Clean and rebuild
cd android
.\gradlew clean
cd ..
npm install
npx expo run:android
```

---

