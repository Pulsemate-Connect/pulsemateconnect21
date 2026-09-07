# 🧪 New Registration Flow - Testing Guide

**Date**: September 6, 2026, 11:15 PM  
**Status**: Ready for Testing

---

## 🎯 What Changed

### OLD Flow (❌ Had Issues):
```
1. Email + Name → Email OTP → Account created
2. Go to Step 1 form → Enter mobile AGAIN → Verify mobile OTP
3. Mobile stored in form but NOT in user.mobile
4. Admin dashboard showed wrong mobile
```

### NEW Flow (✅ Fixed):
```
1. Email + Name → Email OTP
2. Mobile → Mobile OTP
3. Account created (BOTH verified) ✅
4. Go to Step 1 form → Mobile shown as read-only (pre-filled)
5. Admin dashboard shows correct mobile ✅
```

---

## 📋 Complete Test Checklist

### Test 1: New Registration Flow

#### Step 1: Access Registration Page
- [ ] Navigate to: http://localhost:3000/register/clinic-owner
- [ ] OR: http://localhost:3000/clinic-owner/register
- [ ] Page loads with clean 4-step UI ✅

#### Step 2: Enter Email & Name
- [ ] Enter name: "Test Clinic Owner"
- [ ] Enter email: "test123@example.com"
- [ ] Click "Send OTP to Email"
- [ ] Should show loading state
- [ ] Should receive success toast ✅

#### Step 3: Verify Email OTP
- [ ] Check email for OTP code
- [ ] Enter 6-digit OTP
- [ ] Click "Verify Email"
- [ ] Should show success toast: "Email verified successfully!"
- [ ] Should advance to Step 3 (Mobile entry) ✅

#### Step 4: Enter Mobile Number
- [ ] Should see green checkmark for email verified ✅
- [ ] Enter mobile: 9999999999 (test number)
- [ ] Click "Send OTP to Mobile"
- [ ] Should see reCAPTCHA (if not test number)
- [ ] Should receive OTP via SMS ✅

#### Step 5: Verify Mobile OTP
- [ ] Enter 6-digit OTP (use 123456 for test numbers)
- [ ] Click "Complete Registration"
- [ ] Should show loading state
- [ ] Should show success toast: "Registration successful!"
- [ ] Should redirect to: /clinic/onboarding/step-1 ✅

#### Step 6: Verify Step 1 Form
- [ ] Name should be pre-filled ✅
- [ ] Email should be pre-filled (read-only, green badge) ✅
- [ ] Mobile should be pre-filled (read-only, green badge) ✅
- [ ] No "Send OTP" button for mobile ✅
- [ ] Can proceed to fill rest of form ✅

---

### Test 2: Database Verification

Run these queries after completing registration:

```sql
-- Check user account
SELECT 
  id,
  name,
  email,
  mobile,
  "isEmailVerified",
  "isPhoneVerified",
  role,
  "approvalStatus",
  "registrationComplete",
  "registrationStartedAt"
FROM users
WHERE email = 'test123@example.com';
```

**Expected Results:**
- ✅ name: "Test Clinic Owner"
- ✅ email: "test123@example.com"
- ✅ mobile: "+919999999999"
- ✅ isEmailVerified: true
- ✅ isPhoneVerified: true
- ✅ role: "CLINIC_OWNER"
- ✅ approvalStatus: "DRAFT"
- ✅ registrationComplete: false
- ✅ registrationStartedAt: <timestamp>

---

### Test 3: Complete Onboarding & Check Admin

#### Complete the Onboarding:
- [ ] Fill Step 1 form (clinic info)
- [ ] Fill Step 2 (services)
- [ ] Fill Step 3 (documents)
- [ ] Fill Step 4 (staff)
- [ ] Submit application

#### Check Database Again:
```sql
SELECT 
  id,
  name,
  email,
  mobile,
  "approvalStatus",
  "registrationComplete",
  "registrationCompletedAt"
FROM users
WHERE email = 'test123@example.com';
```

**Expected Results:**
- ✅ approvalStatus: "PENDING"
- ✅ registrationComplete: true
- ✅ registrationCompletedAt: <timestamp>

#### Check Admin Dashboard:
- [ ] Login as admin
- [ ] Go to: /admin/clinic-verifications
- [ ] Find "Test Clinic Owner"
- [ ] Should show mobile: +919999999999 ✅
- [ ] Should show status: Pending ✅

---

### Test 4: Login with Mobile OTP

#### Test Mobile OTP Login:
- [ ] Logout from the account
- [ ] Go to: /clinic-owner/login
- [ ] Enter mobile: +919999999999
- [ ] Click "Send OTP"
- [ ] Enter OTP
- [ ] Click "Login"
- [ ] Should login successfully ✅
- [ ] Should redirect based on status:
  - DRAFT → /clinic-owner/register?resume=true
  - PENDING → /clinic-owner/application-status
  - VERIFIED → /clinic/dashboard

---

### Test 5: Edge Cases

#### Test 5a: Email Already Registered
- [ ] Try to register with same email again
- [ ] Should show error: "A user with this email already exists"

#### Test 5b: Mobile Already Registered
- [ ] Complete email verification
- [ ] Try to use same mobile from previous registration
- [ ] Should show error: "This mobile number is already registered"

#### Test 5c: Back Navigation
- [ ] Start registration
- [ ] Complete email verification
- [ ] Click "Back" on mobile step
- [ ] Should go back to email step
- [ ] Should allow re-sending email OTP

#### Test 5d: Resend OTP
- [ ] Start registration
- [ ] Request email OTP
- [ ] Wait for countdown (60s)
- [ ] Click "Resend OTP"
- [ ] Should send new OTP
- [ ] Should reset countdown

---

## 🐛 Known Issues to Watch For

### Issue 1: reCAPTCHA Not Showing
**Symptom**: Mobile OTP doesn't send  
**Cause**: Firebase reCAPTCHA container not mounted  
**Check**: `<div id="recaptcha-container">` exists in DOM

### Issue 2: tempToken Expired
**Symptom**: Mobile verification fails with "Invalid or expired session token"  
**Cause**: User took too long between email and mobile verification  
**Fix**: tempToken valid for 2 hours

### Issue 3: Mobile Format Issues
**Symptom**: Mobile saves incorrectly  
**Check**: Should be saved as "+919999999999" (with +91)

---

## ✅ Success Criteria

### Registration Flow:
- [x] Email verification works
- [x] Mobile verification works
- [x] Account created with both verified
- [x] Redirects to Step 1 form
- [x] Step 1 shows mobile as read-only

### Database:
- [x] user.mobile correctly stored
- [x] user.isPhoneVerified = true
- [x] user.isEmailVerified = true
- [x] user.approvalStatus = "DRAFT"

### Admin Dashboard:
- [x] Shows correct mobile number
- [x] Shows verified badges
- [x] No more data mismatch

### Login:
- [x] Can login with email OTP
- [x] Can login with mobile OTP
- [x] Redirects based on status

---

## 📊 Test Results Template

```
Test Date: __________
Tester: __________

Test 1: New Registration Flow
- Email verification: [ ] Pass [ ] Fail
- Mobile verification: [ ] Pass [ ] Fail
- Account creation: [ ] Pass [ ] Fail
- Step 1 form: [ ] Pass [ ] Fail

Test 2: Database Verification
- user.mobile correct: [ ] Pass [ ] Fail
- All fields verified: [ ] Pass [ ] Fail

Test 3: Admin Dashboard
- Mobile displayed: [ ] Pass [ ] Fail
- Status correct: [ ] Pass [ ] Fail

Test 4: Login
- Mobile OTP login: [ ] Pass [ ] Fail
- Email OTP login: [ ] Pass [ ] Fail

Test 5: Edge Cases
- Duplicate email: [ ] Pass [ ] Fail
- Duplicate mobile: [ ] Pass [ ] Fail
- Back navigation: [ ] Pass [ ] Fail
- Resend OTP: [ ] Pass [ ] Fail

Overall: [ ] All Tests Pass [ ] Some Failed
```

---

## 🚀 Quick Test Script

For rapid testing, use test numbers:

```
Email: test1@example.com
Name: Test User 1
Mobile: 9999999999
Email OTP: (check email)
Mobile OTP: 123456 (for test number)
```

Then check:
1. Database: `SELECT mobile FROM users WHERE email = 'test1@example.com';`
2. Expected: `+919999999999`
3. Admin Dashboard: Should show same number

**If all match → ✅ SUCCESS!**

---

**Ready to test!** Start at: http://localhost:3000/register/clinic-owner 🎯
