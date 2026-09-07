# ✅ Clinic Partner Modal - Mobile Verification Added

## 📋 Summary

Updated the **ClinicAuthModal** (shown on `/clinic-partner` page) to verify BOTH email and mobile during registration.

### Before:
- Signup flow: Name + Email → Email OTP → Done
- Only email was verified

### After:
- Signup flow: Name + Email + Mobile → Email OTP → Mobile OTP → Done
- Both email AND mobile are verified before proceeding

---

## 🔄 Registration Flow

### New Multi-Step Verification:

```
Step 1: Signup Form
├─ Name (Full name)
├─ Email (Email address)
├─ Mobile (+91 XXXXXXXXXX)
└─ Agree to Terms
   ↓ Click "Continue"

Step 2: Email OTP Verification
├─ Enter 6-digit OTP sent to email
├─ Verify Email
└─ Backend returns tempToken
   ↓ Email Verified ✅

Step 3: Mobile OTP Verification
├─ Click "Send OTP" to mobile
├─ Enter 6-digit OTP sent to mobile
├─ Verify Mobile using tempToken
└─ Mobile linked to user account
   ↓ Mobile Verified ✅

Step 4: Redirect to Full Registration
└─ Redirects to /register/clinic-owner
   (OLD ClinicOwnerRegisterPage with all form steps)
```

---

## 📝 Changes Made

### 1. **Updated State Management**

```javascript
// Added verification tracking
const [verificationState, setVerificationState] = useState({
  emailVerified: false,
  mobileVerified: false,
  tempToken: null, // From email verification
});

// Added new views
// 'login' | 'signup' | 'email-otp' | 'mobile-otp' | 'otp' (for login)
```

### 2. **Added Mobile Field to Signup Form**

```javascript
// Validation updated
if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
  newErrors.mobile = 'Please enter a valid 10-digit mobile number';
}
```

**UI:**
```html
<div className="flex gap-2">
  <div className="flex items-center px-3 border rounded-lg bg-gray-50">
    <span>+91</span>
  </div>
  <input type="tel" placeholder="Mobile Number" />
</div>
```

### 3. **New API Handlers**

#### Email Verification (Signup)
```javascript
const handleSendEmailOTP = async () => {
  // Uses: POST /auth/clinic-owner/send-email-verification
  // Sends OTP to email
};

const handleVerifySignupEmailOTP = async () => {
  // Uses: POST /auth/clinic-owner/verify-email-otp
  // Returns tempToken
  // Moves to mobile-otp view
};
```

#### Mobile Verification (Signup)
```javascript
const handleSendSignupMobileOTP = async () => {
  // Uses: POST /auth/send-otp (Firebase)
  // Sends OTP to mobile
};

const handleVerifySignupMobileOTP = async () => {
  // 1. Verify OTP: POST /auth/verify-otp
  // 2. Link mobile: POST /auth/clinic-owner/verify-firebase-phone
  //    (passes tempToken)
  // 3. Redirect to /register/clinic-owner
};
```

### 4. **New OTP Views**

#### Email OTP View (`email-otp`)
- Shows after clicking "Continue" on signup form
- 6-digit OTP input
- Verify Email button
- Resend functionality
- Back to change email

#### Mobile OTP View (`mobile-otp`)
- Shows after email verified
- Send OTP button first
- Then 6-digit OTP input
- Verify Mobile & Complete button
- Resend functionality
- Back to change mobile

### 5. **Backend Integration**

Uses clinic owner specific endpoints:

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `POST /auth/clinic-owner/send-email-verification` | Send email OTP | OTP sent confirmation |
| `POST /auth/clinic-owner/verify-email-otp` | Verify email OTP | `tempToken` for mobile linking |
| `POST /auth/send-otp` | Send mobile OTP (Firebase) | Verification ID |
| `POST /auth/verify-otp` | Verify mobile OTP | Firebase token |
| `POST /auth/clinic-owner/verify-firebase-phone` | Link mobile to user | User with auth token |

---

## 🎨 UI/UX Updates

### Signup Form:
```
Create your clinic partner account

┌─────────────────────────────────┐
│ Full name                       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Email address                   │
└─────────────────────────────────┘

┌────┬──────────────────────────┐
│+91 │ Mobile Number            │
└────┴──────────────────────────┘

☐ I agree to PulseMate Connect's
  Terms of Service and Privacy Policy

┌─────────────────────────────────┐
│         Continue                │
└─────────────────────────────────┘

Already have an account? Login
```

### Email OTP View:
```
Verify Email

Verification code has been sent to
your@email.com

┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘

┌─────────────────────────────────┐
│       Verify Email              │
└─────────────────────────────────┘

        09:45

Not received OTP? Resend Now

← Change email
```

### Mobile OTP View:
```
Verify Mobile Number

Verification code has been sent to
+91 9876543210

┌─────────────────────────────────┐
│         Send OTP                │
└─────────────────────────────────┘

(After sending OTP)

┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘

┌─────────────────────────────────┐
│   Verify Mobile & Complete      │
└─────────────────────────────────┘

        09:45

Not received OTP? Resend Now

← Change mobile number
```

---

## 🔧 Technical Details

### State Flow:

```javascript
// Initial
view = 'signup'
verificationState = {
  emailVerified: false,
  mobileVerified: false,
  tempToken: null
}

// After email OTP verified
view = 'mobile-otp'
verificationState = {
  emailVerified: true,
  mobileVerified: false,
  tempToken: 'abc123...'
}

// After mobile OTP verified
verificationState = {
  emailVerified: true,
  mobileVerified: true,
  tempToken: 'abc123...'
}
// → Redirect to /register/clinic-owner
```

### TempToken Flow:

```
1. User enters email → Send Email OTP
   ↓
2. User verifies email OTP
   ↓
3. Backend returns tempToken
   ↓
4. Store tempToken in state
   ↓
5. User enters mobile → Send Mobile OTP
   ↓
6. User verifies mobile OTP
   ↓
7. Pass tempToken + Firebase token to backend
   ↓
8. Backend links mobile to user account
   ↓
9. User authenticated, redirect to registration form
```

---

## 📊 Data Flow

### Email Verification:
```javascript
Request:
POST /auth/clinic-owner/send-email-verification
{
  email: "owner@clinic.com",
  name: "Owner Name"
}

Response:
{
  success: true,
  data: {
    _testOtp: "123456" // (dev mode only)
  }
}

// Then verify
POST /auth/clinic-owner/verify-email-otp
{
  email: "owner@clinic.com",
  otp: "123456",
  name: "Owner Name"
}

Response:
{
  success: true,
  data: {
    tempToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Mobile Verification:
```javascript
Request:
POST /auth/send-otp
{
  phoneNumber: "+919876543210",
  purpose: "PHONE_VERIFICATION"
}

Response:
{
  success: true,
  data: {
    verificationId: "verification-id-123",
    _testOtp: "654321" // (dev mode only)
  }
}

// Then verify Firebase OTP
POST /auth/verify-otp
{
  phoneNumber: "+919876543210",
  otp: "654321",
  verificationId: "verification-id-123"
}

Response:
{
  success: true,
  data: {
    firebaseToken: "firebase-token-xyz..."
  }
}

// Finally link mobile to user
POST /auth/clinic-owner/verify-firebase-phone
{
  firebaseIdToken: "firebase-token-xyz...",
  tempToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  success: true,
  data: {
    user: { id, email, mobile, role, ... },
    accessToken: "auth-token..."
  }
}
```

---

## ✅ Testing Checklist

### Signup Flow:
- [ ] Fill name, email, mobile
- [ ] Check Terms checkbox
- [ ] Click Continue → Email OTP sent
- [ ] Enter email OTP → Verified
- [ ] Auto-move to Mobile OTP view
- [ ] Click Send OTP → Mobile OTP sent
- [ ] Enter mobile OTP → Verified
- [ ] Check: Redirects to `/register/clinic-owner`
- [ ] Check: User authenticated
- [ ] Check: Database has email + mobile

### Validation:
- [ ] Name < 2 chars → Error
- [ ] Invalid email → Error
- [ ] Invalid mobile → Error
- [ ] Terms not checked → Error
- [ ] Wrong email OTP → Error
- [ ] Wrong mobile OTP → Error

### Resend OTP:
- [ ] Email OTP resend works
- [ ] Mobile OTP resend works
- [ ] Countdown timer shows correctly
- [ ] Can't resend before countdown ends

### Navigation:
- [ ] "Change email" goes back to signup
- [ ] "Change mobile" goes back to signup
- [ ] Login link from signup works
- [ ] Create account from login works

---

## 📁 Files Modified

1. **`frontend/src/components/modals/ClinicAuthModal.jsx`**
   - Added mobile field to signup form
   - Added verification state tracking
   - Added email-otp and mobile-otp views
   - Added new API handlers
   - Updated validation
   - Updated UI flow

---

## 🎯 Result

Users registering from `/clinic-partner` page modal now must verify:
1. ✅ Email (gets tempToken)
2. ✅ Mobile (uses tempToken to link)

After both verifications, they're redirected to `/register/clinic-owner` to complete the full clinic registration form with all steps.

---

**Status**: ✅ Complete  
**Updated**: September 6, 2026  
**Flow**: Modal (Email + Mobile verification) → Full Registration Page (All form steps)
