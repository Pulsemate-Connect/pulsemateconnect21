# 🏥 Clinic Partner Registration Flow - Complete Guide

**Last Updated**: September 6, 2026, 10:45 PM  
**Status**: ✅ All fixes applied and working

---

## 📋 Complete Registration Flow (Step-by-Step)

### Phase 1: Initial Registration (Email + Name Only)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User visits registration page                       │
│ URL: /clinic-owner/register                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: User enters basic information                       │
│ - Full Name (e.g., "Abu Nk")                               │
│ - Email (e.g., "kotharkar276@gmail.com")                   │
│ - Click "Send OTP"                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Email OTP sent                                      │
│ - 6-digit OTP sent to email                                │
│ - Valid for 10 minutes                                      │
│ - User enters OTP and clicks "Verify"                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: User Account Created ✅                             │
│                                                             │
│ Database Record:                                            │
│ - id: <generated UUID>                                      │
│ - name: "Abu Nk"                                           │
│ - email: "kotharkar276@gmail.com"                          │
│ - mobile: NULL                                              │
│ - role: CLINIC_OWNER                                        │
│ - approvalStatus: DRAFT ⭐ (NEW!)                          │
│ - isEmailVerified: true                                     │
│ - isPhoneVerified: false                                    │
│ - registrationComplete: false ⭐                            │
│ - registrationStartedAt: <timestamp> ⭐                     │
│ - registrationCompletedAt: null                             │
│                                                             │
│ ✅ User can now LOGIN with Email + OTP!                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Redirect to Clinic Onboarding                       │
│ URL: /clinic/onboarding/step-1                             │
│ Status: User is authenticated (has JWT token)               │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 2: Clinic Onboarding - Step 1 (Clinic Information)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1 Form: Clinic Information                             │
│                                                             │
│ Section 1: Clinic Details                                   │
│ - Clinic Name                                               │
│ - Clinic Type (Hospital/Clinic/Diagnostic/etc)             │
│ - Display Name                                              │
│                                                             │
│ Section 2: Owner Details ⭐                                 │
│ - Owner Name (pre-filled from user.name)                   │
│ - Owner Email (pre-filled from user.email, read-only)      │
│ - Owner Mobile (NEW FIELD - must enter & verify)           │
│                                                             │
│ Section 3: Primary Contact                                  │
│ - Primary Contact Phone                                     │
│ - Option: "Same as owner mobile"                            │
│                                                             │
│ Section 4: Location                                         │
│ - Latitude/Longitude (auto-detect or manual)               │
│ - Complete Address                                          │
│ - City, District, State, Pincode                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Mobile Verification in Step 1 ⭐ (CRITICAL)                │
│                                                             │
│ User enters mobile: +919999999999                           │
│ Clicks "Send OTP"                                           │
│   ↓                                                         │
│ Frontend sends:                                             │
│   - POST /api/auth/send-otp                                │
│   - Body: { phoneNumber: "+919999999999",                 │
│            purpose: "ONBOARDING" }                         │
│   ↓                                                         │
│ Backend sends OTP via SMS                                   │
│   ↓                                                         │
│ User enters OTP: 123456                                     │
│ Clicks "Verify"                                             │
│   ↓                                                         │
│ Frontend sends: ⭐ WITH AUTH TOKEN                          │
│   - POST /api/auth/verify-otp                              │
│   - Headers: { Authorization: "Bearer <token>" }           │
│   - Body: { phoneNumber: "+919999999999",                 │
│            otp: "123456",                                  │
│            purpose: "ONBOARDING" }                         │
│   ↓                                                         │
│ Backend verifies OTP ✅                                     │
│ Backend updates user record: ⭐ (NEW!)                      │
│   - user.mobile = "+919999999999"                          │
│   - user.isPhoneVerified = true                             │
│   - Logs: "Linked mobile to user"                          │
│   - Returns fresh JWT tokens                                │
│   ↓                                                         │
│ Frontend updates local storage:                             │
│   - localStorage.setItem('token', newToken)                │
│   - Shows: "Mobile verified successfully" ✅               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ User completes rest of Step 1 form                          │
│ Clicks "Next" or "Save & Continue"                          │
│   ↓                                                         │
│ Frontend sends:                                             │
│   - POST /api/auth/clinic-owner/save-clinic-information    │
│   - Headers: { Authorization: "Bearer <token>" }           │
│   - Body: { all form data }                                 │
│   ↓                                                         │
│ Backend saves to: ⭐                                        │
│   clinicOnboardingData: {                                   │
│     clinicInformation: {                                    │
│       clinicName: "...",                                   │
│       ownerName: "...",                                    │
│       ownerEmail: "...",                                   │
│       ownerMobile: "+919999999999",                        │
│       // ... rest of form data                             │
│     },                                                      │
│     currentStep: 1,                                         │
│   }                                                         │
│   ↓                                                         │
│ Backend ALSO updates: (priority logic)                      │
│   user.mobile = user.mobile || formData.ownerMobile        │
│   → Since user.mobile is ALREADY SET from verification,    │
│      it keeps the verified mobile! ✅                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Redirect to Step 2: Services & Operations                   │
│ URL: /clinic/onboarding/step-2                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Steps 2-5 (Services, Documents, Staff, Review)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Services & Operations                               │
│ - Primary Specialties                                       │
│ - Services Offered                                          │
│ - Operating Hours                                           │
│ - Consultation Fee                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Documents & Verification                            │
│ - Medical Registration Certificate                          │
│ - Clinic License                                            │
│ - Owner ID Proof                                            │
│ - Clinic Photos                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Staff & Facilities                                  │
│ - Number of doctors                                         │
│ - Support staff                                             │
│ - Facilities available                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Review & Submit                                     │
│ - Review all entered information                            │
│ - Confirm accuracy                                          │
│ - Click "Submit Application"                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Final Submission ⭐                                         │
│                                                             │
│ Frontend sends:                                             │
│   - POST /api/clinic-owner/application/submit              │
│   - Headers: { Authorization: "Bearer <token>" }           │
│   ↓                                                         │
│ Backend updates: ⭐                                         │
│   - approvalStatus: DRAFT → PENDING                         │
│   - registrationComplete: true                              │
│   - registrationCompletedAt: <timestamp>                    │
│   ↓                                                         │
│ Response:                                                   │
│   - "Application submitted successfully"                    │
│   - "You'll be notified once reviewed"                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Redirect to: Application Status Page                        │
│ URL: /clinic-owner/application-status                      │
│ Shows: "Pending Admin Review"                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Login Capabilities (After Registration)

### Option 1: Email OTP Login ✅

```
User goes to: /clinic-owner/login
Enters: kotharkar276@gmail.com
Clicks: "Send OTP"
  ↓
Receives OTP via email
Enters OTP and verifies
  ↓
✅ Logged in successfully!
Redirects based on status:
  - DRAFT → Continue registration
  - PENDING → View application status
  - VERIFIED → Dashboard
```

### Option 2: Mobile OTP Login ✅ (NEW!)

```
User goes to: /clinic-owner/login
Enters: +919999999999
Clicks: "Send OTP"
  ↓
Receives OTP via SMS
Enters OTP and verifies
  ↓
✅ Logged in successfully!
Redirects based on status:
  - DRAFT → Continue registration
  - PENDING → View application status
  - VERIFIED → Dashboard
```

---

## 👨‍💼 Admin View

### Before Approval:

```
Admin Dashboard → Clinic Verifications

Shows:
┌─────────────────────────────────────────────────────────┐
│ Abu Nk                    CLINIC_OWNER    Pending       │
│ +919999999999 ⭐ (Verified mobile from Step 1)         │
│ kotharkar276@gmail.com                                 │
└─────────────────────────────────────────────────────────┘

Admin clicks to view details:
- Clinic Name: [...]
- Owner Name: Abu Nk
- Owner Mobile: +919999999999 ✅ (Shows verified mobile)
- Mobile Verified: ✅ Yes
- Email Verified: ✅ Yes
- All form data...

Admin can:
- ✅ Approve → Status changes to VERIFIED
- ❌ Reject → Status changes to REJECTED
- 📝 Request Changes → Status changes to CHANGES_REQUIRED
```

---

## 📊 Status Flow Diagram

```
Registration Started
        ↓
   ┌─────────┐
   │  DRAFT  │  ← User created, email verified, no mobile yet
   └─────────┘
        ↓ (Step 1: Mobile verified & form submitted)
        ↓
   ┌─────────┐
   │ PENDING │  ← Application submitted, waiting for admin
   └─────────┘
        ↓ (Admin reviews)
        ↓
   ┌─────────────────────────────┐
   │         Admin Action         │
   ├─────────────┬───────────────┤
   │  Approve ✅  │  Reject ❌   │  Request Changes 📝
   ↓             ↓               ↓
┌──────────┐ ┌──────────┐ ┌──────────────────┐
│ VERIFIED │ │ REJECTED │ │ CHANGES_REQUIRED │
└──────────┘ └──────────┘ └──────────────────┘
     ↓                            ↓
Dashboard                    Fix & Resubmit
                                   ↓
                             Back to PENDING
```

---

## 🔄 Resume Registration (Progressive Registration)

```
Scenario: User starts registration but doesn't finish
────────────────────────────────────────────────────────

Day 1:
- User registers with email
- User verifies mobile in Step 1
- User fills partial form
- User closes browser ❌

Day 2:
- User visits site again
- User logs in with Mobile OTP ✅
  ↓
System checks:
- approvalStatus = DRAFT
- registrationComplete = false
  ↓
✅ Redirects to: /clinic-owner/register?resume=true
  ↓
Form shows:
- All previously saved data ✅
- "Continue where you left off"
- Can continue from last step
```

---

## 🧹 Auto-Cleanup (Abandoned Registrations)

```
Cron Job: cleanup-draft-registrations.js
Runs: Daily at 2 AM

Logic:
- Find all users where:
  - approvalStatus = DRAFT
  - registrationComplete = false
  - registrationStartedAt > 3 days ago
  ↓
- Send reminder email/SMS
  ↓
- After 7 days total:
  - Delete abandoned DRAFT accounts
  - Free up email/mobile for re-registration
```

---

## ✅ Key Features (After All Fixes)

### 1. **Hybrid Registration (DRAFT → PENDING)** ⭐
- User created early (after email verify)
- Status: DRAFT until full submission
- Can resume anytime

### 2. **OTP-Only Authentication** ⭐
- No password required
- Login with Email OTP or Mobile OTP
- More secure, easier for users

### 3. **Mobile Linking in Step 1** ⭐
- Mobile verified during onboarding
- Automatically linked to user account
- Admin sees verified mobile

### 4. **Progressive Registration** ⭐
- Save progress at any time
- Resume from where you left
- Data persisted in database

### 5. **Smart Routing** ⭐
- DRAFT → Continue registration
- PENDING → View status
- VERIFIED → Full dashboard access
- CHANGES_REQUIRED → Edit and resubmit

---

## 🧪 Test the Flow

### Quick Test Scenario:

```bash
# 1. Register new clinic owner
Email: test123@example.com
Name: Test Clinic Owner

# 2. Verify email OTP
Check email → Enter OTP → Verify ✅

# 3. Check database
SELECT id, name, email, mobile, approvalStatus, registrationComplete
FROM users WHERE email = 'test123@example.com';

# Expected:
# - mobile: NULL
# - approvalStatus: DRAFT
# - registrationComplete: false

# 4. Go to Step 1 form
# Enter mobile: 7777777777
# Click "Send OTP" → Enter OTP → Verify ✅

# 5. Check database again
# Expected:
# - mobile: +917777777777 ✅
# - isPhoneVerified: true ✅

# 6. Complete Step 1 form → Submit

# 7. Complete Steps 2-5 → Submit Application

# 8. Check database final
# Expected:
# - approvalStatus: PENDING ✅
# - registrationComplete: true ✅

# 9. Check admin dashboard
# Should show:
# - Name: Test Clinic Owner
# - Mobile: +917777777777 ✅
# - Status: Pending
```

---

## 📝 Summary

### Registration Flow:
1. Email + Name → Email OTP → Account created (DRAFT)
2. Step 1 form → Mobile OTP → Mobile linked to account ✅
3. Complete all steps → Submit → Status changes to PENDING
4. Admin reviews → Approves → Status changes to VERIFIED

### Login Options:
- Email + OTP ✅
- Mobile + OTP ✅
- No password needed ✅

### Data Integrity:
- Mobile verified = Mobile stored ✅
- Admin sees verified mobile ✅
- No data mismatch ✅

---

**All systems operational! Registration flow is complete and working!** 🎉

**Files Updated:**
- Frontend: `OwnerDetailsCard.jsx` (mobile verification)
- Backend: `auth.controller.js` (mobile linking)
- Admin: `ClinicVerificationDetail.jsx` (display priority)

**Status**: ✅ PRODUCTION READY
