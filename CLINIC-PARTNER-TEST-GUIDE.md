# Clinic Partner Testing Guide - Complete Checklist

## 🧪 Pre-Testing Setup

### 1. Check Backend is Running
```bash
cd backend
npm run dev

# Should see:
# ✓ Server running on port 5001
# ✓ Database connected
```

### 2. Check Frontend is Running
```bash
cd frontend
npm run dev

# Should see:
# ✓ Local: http://localhost:5173
```

### 3. Check Environment Variables

#### Backend (.env)
```bash
ENABLE_TEST_OTP=true
TEST_OTP_CODE=123456
TEST_OTP_NUMBERS=9999999999,8888888888,7777777777
```

#### Frontend (.env or .env.local)
```bash
VITE_API_URL=http://localhost:5001/api
```

---

## 🎯 Test Scenarios

### ═══════════════════════════════════════════════════════════════
### TEST 1: New User Registration (Email OTP)
### ═══════════════════════════════════════════════════════════════

#### Steps:
1. ✅ Open browser: `http://localhost:5173/clinic-partner`
2. ✅ Click "Register" button
3. ✅ Modal opens with "Create your clinic partner account" heading
4. ✅ Enter:
   - Full name: `Test Clinic Owner`
   - Email: `testclinic@example.com` (use a NEW email each time)
   - ✓ Check "I agree to PulseMate Connect's Terms"
5. ✅ Click "Continue" button
6. ✅ Check console for OTP (TEST MODE)
   - Should see toast: "TEST MODE: Your OTP is 123456"
7. ✅ Modal changes to OTP view
8. ✅ Enter OTP: `123456`
9. ✅ Click "Verify & Continue"
10. ✅ Should see: "Registration successful!"
11. ✅ Modal closes
12. ✅ Should redirect to: `/clinic/onboarding/step-1`

#### Expected Results:
- ✅ User created in database with:
  - `role: CLINIC_OWNER`
  - `approvalStatus: PENDING`
  - `isEmailVerified: true`
  - `email: testclinic@example.com`
- ✅ JWT tokens stored in authStore
- ✅ User is logged in

---

### ═══════════════════════════════════════════════════════════════
### TEST 2: Complete 4-Step Onboarding
### ═══════════════════════════════════════════════════════════════

#### STEP 1: Clinic Information

1. ✅ Should be on `/clinic/onboarding/step-1`
2. ✅ Phone Verification:
   - Click "Verify Phone Number"
   - Firebase modal appears
   - Enter phone: `+91 9999999999` (use test number)
   - Complete Firebase OTP verification
   - Should see: "Phone verified successfully"
   
3. ✅ Fill Clinic Details:
   - Clinic Name: `Test Medical Center`
   - Clinic Type: Select "Multi-Specialty Clinic"
   - Display Name: `Test Medical`
   
4. ✅ Owner Details (should auto-fill):
   - Owner Name: `Test Clinic Owner` (auto-filled)
   - Owner Email: `testclinic@example.com` (auto-filled)
   - Owner Mobile: `9999999999` (auto-filled)
   
5. ✅ Primary Contact:
   - Phone: `9999999999`
   
6. ✅ Location:
   - Click "Use My Location" OR
   - Search: `Connaught Place, New Delhi`
   - Map marker should appear
   
7. ✅ Address:
   - Address Line 1: `123 Main Street`
   - Locality: `Connaught Place`
   - Landmark: `Near Central Park`
   - City: `New Delhi`
   - State: `Delhi`
   - Pincode: `110001`
   - Country: `India`
   
8. ✅ Click "Next" button
9. ✅ Should see: "Clinic information saved successfully"
10. ✅ Should redirect to: `/clinic/onboarding/step-2`

#### Expected Results:
- ✅ Data saved in `User.clinicOnboardingData.clinicInformation`
- ✅ Step 1 marked complete with green checkmark

---

#### STEP 2: Services & Operations

1. ✅ Should be on `/clinic/onboarding/step-2`
2. ✅ Select Specialties (click multiple):
   - ✓ General Medicine
   - ✓ Cardiology
   - ✓ Pediatrics
   
3. ✅ Select Consultation Types:
   - ✓ In-Person Consultation
   - ✓ Video Consultation
   
4. ✅ Operating Hours:
   - Opening Time: `09:00 AM`
   - Closing Time: `06:00 PM`
   
5. ✅ Weekly Off Days:
   - ✓ Sunday
   
6. ✅ Appointment Mode:
   - Select: "Scheduled Appointments"
   
7. ✅ Click "Next" button
8. ✅ Should see: "Services & operations saved successfully"
9. ✅ Should redirect to: `/clinic/onboarding/step-3`

#### Expected Results:
- ✅ Data saved in `User.clinicOnboardingData.servicesOperations`
- ✅ Step 2 marked complete with green checkmark

---

#### STEP 3: Clinic Documents

1. ✅ Should be on `/clinic/onboarding/step-3`
2. ✅ Upload Documents:
   
   **Registration Certificate:**
   - Click "Browse" button
   - Select a PDF file (or create a dummy PDF)
   - Should see: File name displayed
   - Should see: ✓ Uploaded icon
   
   **Medical License:**
   - Click "Browse" button
   - Select a PDF file
   - Should see: ✓ Uploaded icon
   
   **Owner ID Proof:**
   - Click "Browse" button
   - Select a PDF/Image file
   - Should see: ✓ Uploaded icon
   
   **GST Certificate:**
   - Click "Browse" button
   - Select a PDF file
   - Should see: ✓ Uploaded icon
   
3. ✅ Additional Details:
   - Registration Number: `REG123456`
   - GST Number: `GST987654321`
   
4. ✅ Upload Clinic Photos:
   
   **Clinic Logo:**
   - Click "Browse" button
   - Select an image file
   - Should see: Image preview
   
   **Clinic Exterior:**
   - Click "Browse" button
   - Select an image file
   - Should see: Image preview
   
   **Reception Area:**
   - Click "Browse" button
   - Select an image file
   - Should see: Image preview
   
   **Consultation Room:**
   - Click "Browse" button
   - Select an image file
   - Should see: Image preview
   
5. ✅ Click "Next" button
6. ✅ Should see: "Documents uploaded successfully!"
7. ✅ Should redirect to: `/clinic/onboarding/step-4`

#### Expected Results:
- ✅ Files uploaded to Cloudinary (or local storage)
- ✅ URLs saved in `User.clinicOnboardingData.clinicDocuments`
- ✅ Step 3 marked complete with green checkmark

---

#### STEP 4: Partner Agreement

1. ✅ Should be on `/clinic/onboarding/step-4`
2. ✅ Review agreement text
3. ✅ Check all boxes:
   - ✓ I agree to PulseMate Connect's Terms of Service and Privacy Policy
   - ✓ I confirm that I am authorized to register this clinic
   - ✓ I confirm that all information submitted is accurate and complete
   - ✓ I agree to comply with all applicable laws and requirements
   
4. ✅ Click "Submit" button
5. ✅ Success modal appears with:
   - ✓ Success icon
   - ✓ "Application Submitted Successfully!" heading
   - ✓ "What happens next?" section (3 points)
   
6. ✅ Click "Got It" button in modal
7. ✅ Success modal closes
8. ✅ Step 4 marked complete with green checkmark

#### Expected Results:
- ✅ Data saved in `User.clinicOnboardingData.partnerAgreement`
- ✅ `User.approvalStatus` = "PENDING"
- ✅ `User.clinicOnboardingData.onboardingComplete` = true
- ✅ All 4 steps show green checkmarks

---

### ═══════════════════════════════════════════════════════════════
### TEST 3: Login with Mobile OTP (PENDING User)
### ═══════════════════════════════════════════════════════════════

1. ✅ Logout or open new incognito window
2. ✅ Go to: `http://localhost:5173/clinic-partner`
3. ✅ Click "Login" button
4. ✅ Modal opens with mobile input (default)
5. ✅ Enter mobile: `9999999999` (the verified number)
6. ✅ Click "Send One Time Password"
7. ✅ Check console for OTP (TEST MODE)
   - Should see toast: "TEST MODE: Your OTP is 123456"
8. ✅ Modal changes to OTP view
9. ✅ Enter OTP: `123456`
10. ✅ Click "Verify & Continue"
11. ✅ Should see: "Login successful! Your application is pending approval."
12. ✅ Modal closes
13. ✅ Should redirect to: `/clinic/dashboard/pending`

#### Expected Results on Pending Dashboard:
- ✅ Header shows "PulseMate Connect"
- ✅ Logout button visible
- ✅ Yellow banner: "Application Pending Review"
- ✅ Application Details section shows:
  - Name: Test Clinic Owner
  - Email: testclinic@example.com
  - Mobile: 9999999999
  - Status badge: 🟡 Pending Review
- ✅ "What Happens Next?" section with 3 steps
- ✅ Timeline: "Expected Review Time: 1-3 business days"
- ✅ Contact Support buttons (Email & Phone)
- ✅ No navigation menu visible
- ✅ No access to operations

---

### ═══════════════════════════════════════════════════════════════
### TEST 4: Login with Email OTP (PENDING User)
### ═══════════════════════════════════════════════════════════════

1. ✅ From pending dashboard, click "Logout"
2. ✅ Go to: `http://localhost:5173/clinic-partner`
3. ✅ Click "Login" button
4. ✅ Click "Continue with Email" button
5. ✅ Modal changes to email input
6. ✅ Enter email: `testclinic@example.com`
7. ✅ Click "Send One Time Password"
8. ✅ Check console for OTP (TEST MODE)
   - Should see toast: "TEST MODE: Your OTP is 123456"
9. ✅ Modal changes to OTP view
10. ✅ Enter OTP: `123456`
11. ✅ Click "Verify & Continue"
12. ✅ Should see: "Login successful! Your application is pending approval."
13. ✅ Should redirect to: `/clinic/dashboard/pending`

#### Expected Results:
- ✅ Same pending dashboard as mobile login
- ✅ User logged in successfully
- ✅ JWT tokens stored

---

### ═══════════════════════════════════════════════════════════════
### TEST 5: Validation - Unregistered Email/Mobile
### ═══════════════════════════════════════════════════════════════

#### Test Unregistered Email:
1. ✅ Go to login
2. ✅ Click "Continue with Email"
3. ✅ Enter email: `notregistered@example.com`
4. ✅ Click "Send One Time Password"
5. ✅ Should see error toast: "Email not registered. Please create an account first."
6. ✅ NO OTP should be sent
7. ✅ Should stay on login screen

#### Test Unregistered Mobile:
1. ✅ Go to login (default mobile view)
2. ✅ Enter mobile: `8888888888` (not registered)
3. ✅ Click "Send One Time Password"
4. ✅ Should see error toast: "Mobile number not registered. Please create an account first."
5. ✅ NO OTP should be sent
6. ✅ Should stay on login screen

#### Expected Results:
- ✅ Validation happens BEFORE OTP is sent
- ✅ Saves OTP credits
- ✅ Clear error message
- ✅ User knows to register first

---

### ═══════════════════════════════════════════════════════════════
### TEST 6: Validation - Duplicate Email Registration
### ═══════════════════════════════════════════════════════════════

1. ✅ Go to: `http://localhost:5173/clinic-partner`
2. ✅ Click "Register" button
3. ✅ Enter:
   - Name: `Another Owner`
   - Email: `testclinic@example.com` (already registered)
   - ✓ Terms
4. ✅ Click "Continue"
5. ✅ Should see error: "An application with this email is already pending review..."
6. ✅ NO OTP should be sent
7. ✅ Should stay on registration screen

#### Expected Results:
- ✅ Prevents duplicate registrations
- ✅ Shows PENDING status message
- ✅ Clear error message

---

### ═══════════════════════════════════════════════════════════════
### TEST 7: Toggle Between Email and Mobile Login
### ═══════════════════════════════════════════════════════════════

1. ✅ Go to login
2. ✅ Default view: Mobile input with 🇮🇳 +91
3. ✅ Click "Continue with Email" button
4. ✅ Should see: Email input field
5. ✅ Should see: Button changes to "📱 Continue with Mobile"
6. ✅ Click "📱 Continue with Mobile" button
7. ✅ Should see: Mobile input field again
8. ✅ Should see: Button changes back to "📧 Continue with Email"

#### Expected Results:
- ✅ Smooth transitions
- ✅ Input field changes correctly
- ✅ Button text/icon updates
- ✅ No data loss when toggling

---

### ═══════════════════════════════════════════════════════════════
### TEST 8: OTP Resend Functionality
### ═══════════════════════════════════════════════════════════════

1. ✅ Go to login
2. ✅ Enter mobile/email
3. ✅ Click "Send One Time Password"
4. ✅ OTP view appears
5. ✅ Wait for countdown timer
6. ✅ Should see: "Not received OTP? Resend in 60s"
7. ✅ Countdown decreases: 59s, 58s, 57s...
8. ✅ When reaches 0:
   - Should see: "Not received OTP? Resend Now" (blue link)
9. ✅ Click "Resend Now"
10. ✅ Should see new OTP in console (TEST MODE)
11. ✅ Countdown resets to 60s
12. ✅ Enter new OTP
13. ✅ Should verify successfully

#### Expected Results:
- ✅ Countdown works correctly
- ✅ Resend button only active at 0
- ✅ New OTP generated
- ✅ Countdown resets after resend

---

### ═══════════════════════════════════════════════════════════════
### TEST 9: Change Email/Mobile in OTP Screen
### ═══════════════════════════════════════════════════════════════

1. ✅ Go to login
2. ✅ Enter mobile: `9999999999`
3. ✅ Click "Send One Time Password"
4. ✅ OTP view appears
5. ✅ Click "← Change phone number" link
6. ✅ Should return to login view
7. ✅ Mobile input cleared
8. ✅ Can enter different number
9. ✅ Repeat for email:
   - Click "Continue with Email"
   - Enter email
   - Send OTP
   - Click "← Change email"
   - Should return to login view

#### Expected Results:
- ✅ Can go back to change credentials
- ✅ OTP fields cleared
- ✅ Can enter new credentials
- ✅ Correct text: "Change phone number" vs "Change email"

---

### ═══════════════════════════════════════════════════════════════
### TEST 10: Invalid OTP Handling
### ═══════════════════════════════════════════════════════════════

1. ✅ Go to login
2. ✅ Enter mobile/email
3. ✅ Click "Send One Time Password"
4. ✅ OTP view appears
5. ✅ Enter wrong OTP: `999999`
6. ✅ Click "Verify & Continue"
7. ✅ Should see error: "Invalid OTP. Please try again."
8. ✅ OTP fields should clear
9. ✅ Focus should return to first OTP input
10. ✅ Can enter OTP again

#### Expected Results:
- ✅ Error message displayed
- ✅ Fields cleared
- ✅ Can retry
- ✅ No redirect

---

### ═══════════════════════════════════════════════════════════════
### TEST 11: Logout Functionality
### ═══════════════════════════════════════════════════════════════

1. ✅ Login successfully
2. ✅ Should be on pending dashboard
3. ✅ Click "Logout" button
4. ✅ Should redirect to homepage or clinic-partner page
5. ✅ Try accessing: `/clinic/dashboard/pending`
6. ✅ Should redirect to login (protected route)
7. ✅ Verify in DevTools:
   - authStore.user = null
   - authStore.token = null
   - authStore.isAuthenticated = false

#### Expected Results:
- ✅ User logged out
- ✅ Tokens cleared
- ✅ Protected routes redirect to login
- ✅ Refresh token revoked in backend

---

### ═══════════════════════════════════════════════════════════════
### TEST 12: Browser Back Button During Onboarding
### ═══════════════════════════════════════════════════════════════

1. ✅ Complete Step 1
2. ✅ On Step 2, click browser back button
3. ✅ Should return to Step 1
4. ✅ Data should still be visible (pre-filled)
5. ✅ Click "Next"
6. ✅ Should return to Step 2
7. ✅ Data should still be visible

#### Expected Results:
- ✅ Can navigate back
- ✅ Data persists
- ✅ No data loss
- ✅ Can continue from where left off

---

## 🔍 Database Verification

### Check User Created:
```sql
SELECT 
  id, email, mobile, name, role, 
  approvalStatus, isEmailVerified, isPhoneVerified,
  createdAt
FROM "User"
WHERE email = 'testclinic@example.com';
```

### Check Onboarding Data:
```sql
SELECT 
  "clinicOnboardingData"
FROM "User"
WHERE email = 'testclinic@example.com';
```

### Check Refresh Tokens:
```sql
SELECT 
  id, userId, expiresAt, revokedAt, createdAt
FROM "RefreshToken"
WHERE userId = (
  SELECT id FROM "User" 
  WHERE email = 'testclinic@example.com'
);
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to send OTP"
**Solution:**
- Check backend is running
- Check MESSAGE_CENTRAL_API_KEY in .env
- Check ENABLE_TEST_OTP=true for testing

### Issue 2: "User not found" after OTP verify
**Solution:**
- Check user exists in database
- Check mobile number format (10 digits without +91)

### Issue 3: Firebase phone verification not working
**Solution:**
- Check Firebase config in frontend
- Check reCAPTCHA is loading
- Try different phone number

### Issue 4: File uploads failing
**Solution:**
- Check Cloudinary config
- Check file size < 10MB
- Check file format (PDF, JPG, PNG)

### Issue 5: Redirect not working
**Solution:**
- Check React Router routes in App.jsx
- Check user.status value
- Check console for errors

---

## ✅ Success Criteria

### Registration Flow:
- ✅ User can register with email
- ✅ OTP sent and verified
- ✅ User created with PENDING status
- ✅ Redirected to onboarding

### Onboarding Flow:
- ✅ All 4 steps can be completed
- ✅ Data saves correctly
- ✅ Files upload successfully
- ✅ Application submitted with PENDING status

### Login Flow:
- ✅ Can login with email OR mobile
- ✅ OTP validation works
- ✅ PENDING users see pending dashboard
- ✅ No access to operations

### Validation:
- ✅ Prevents unregistered login
- ✅ Prevents duplicate registration
- ✅ Shows appropriate errors

---

## 📊 Test Results Template

```
DATE: ___________
TESTER: ___________

┌──────────────────────────────────┬──────┬─────────┐
│ Test Case                        │ Pass │ Notes   │
├──────────────────────────────────┼──────┼─────────┤
│ 1. Email Registration            │  ☐   │         │
│ 2. 4-Step Onboarding             │  ☐   │         │
│ 3. Mobile Login (PENDING)        │  ☐   │         │
│ 4. Email Login (PENDING)         │  ☐   │         │
│ 5. Unregistered Validation       │  ☐   │         │
│ 6. Duplicate Email Prevention    │  ☐   │         │
│ 7. Email/Mobile Toggle           │  ☐   │         │
│ 8. OTP Resend                    │  ☐   │         │
│ 9. Change Credentials            │  ☐   │         │
│ 10. Invalid OTP                  │  ☐   │         │
│ 11. Logout                       │  ☐   │         │
│ 12. Browser Back Button          │  ☐   │         │
└──────────────────────────────────┴──────┴─────────┘

OVERALL STATUS: ☐ PASS  ☐ FAIL
```

---

## 🎉 Ready to Test!

Start with **TEST 1** and work through all scenarios sequentially. Each test builds on the previous one.

Good luck testing! 🚀
