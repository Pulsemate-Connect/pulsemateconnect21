# 🧪 OTP Testing Guide - Ready to Test!

**Date:** 2026-08-12  
**Status:** ✅ Message Central Credentials Configured  
**Backend:** ✅ Running on port 5000  
**Frontend:** ✅ Running on port 3000

---

## ✅ Configuration Complete

Message Central credentials have been updated in `backend/.env`:

```env
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_EMAIL=pulsemateconnect@gmail.com
MESSAGE_CENTRAL_PASSWORD=TmthYnUxOCQ= (Base64 encoded)
```

Backend server has been restarted to load the new credentials.

---

## 🧪 Test Scenarios

### Test 1: Development Test Numbers (No Real SMS)

**Purpose:** Verify test mode works without sending real SMS

**Test Numbers:**
- `9999999999`
- `8888888888`
- `7777777777`

**Steps:**
1. Open: http://localhost:3000/clinic-partner
2. Click "Create account" button
3. Enter:
   - Name: "Test User"
   - Email: "test@example.com"
   - Mobile: `9999999999`
   - Check "I agree to Terms"
4. Click "Create account"
5. **Expected:** Toast shows "TEST MODE: Your OTP is 123456" (10 seconds)
6. Enter OTP: `123456`
7. Click "Verify & Continue"
8. **Expected:** Login successful, redirected to clinic onboarding

**Backend Logs to Watch:**
```
[Auth] 🧪 TEST MODE: Using test OTP for 9999999999
[Auth] 🧪 TEST OTP: 123456 for 9999999999
[Auth] 🧪 TEST MODE: Verifying test OTP for 9999999999
[Auth] 🧪 TEST MODE: OTP verified successfully
```

---

### Test 2: Real Phone Number (Real SMS via Message Central)

**Purpose:** Verify Message Central integration sends actual SMS

**Test Number:** `8762697832` (or your real phone number)

**Steps:**
1. Open: http://localhost:3000/clinic-partner
2. Click "Create account" button
3. Enter:
   - Name: "Real User"
   - Email: "real@example.com"
   - Mobile: `8762697832`
   - Check "I agree to Terms"
4. Click "Create account"
5. **Expected:** Toast shows "OTP sent successfully!" (NO test OTP shown)
6. **Check your phone** - SMS should arrive within 30 seconds
7. Enter the 6-digit OTP from SMS
8. Click "Verify & Continue"
9. **Expected:** Login successful, redirected to clinic onboarding

**Backend Logs to Watch:**
```
[Auth] Sending real OTP via Message Central to 8762697832
[MessageCentral] 📱 Sending 6-digit OTP to: +918762697832
[MessageCentral] ✅ OTP sent successfully
[MessageCentral] 🔑 Verification ID: xxx-xxx-xxx
[Auth] OTP sent to +918762697832 via Message Central
```

**If Message Central API Fails:**
```
[MessageCentral] ❌❌❌ ERROR ❌❌❌
[MessageCentral] Error Type: AxiosError (or similar)
[MessageCentral] HTTP Response Error:
[MessageCentral] ├─ Status: 401/403/500
[MessageCentral] └─ Body: { error details }
```

**Verify in Message Central Dashboard:**
1. Go to: https://cpaas.messagecentral.com/
2. Login with: pulsemateconnect@gmail.com
3. Navigate to: SMS Logs / Reports / Dashboard
4. **Check:** Recent SMS sent to +918762697832
5. **Status:** Should show "DELIVERED" or "SENT"

---

### Test 3: Existing User Multi-Role (Current Limitation)

**Purpose:** Test what happens when existing PATIENT tries to become CLINIC_OWNER

**Precondition:** User already exists as PATIENT with mobile `9999999999`

**Steps:**
1. Open: http://localhost:3000/clinic-partner
2. Click "Create account" (or "Login")
3. Enter mobile: `9999999999`
4. Enter OTP: `123456`
5. **Current Behavior:**
   - ✅ Login successful
   - ✅ Redirected to clinic onboarding
   - ❌ User still has PATIENT role only (NOT CLINIC_OWNER)
   - ❌ Multi-role not implemented yet

**Backend Logs:**
```
[Auth] Existing user found for 9999999999 with role PATIENT
[Auth] 🧪 TEST MODE: PATIENT login: <user-id> (9999999999)
```

**Note:** Multi-role support requires:
1. Create `user_roles` junction table
2. Update `verifyOtpHandler` to add new role
3. Update JWT to include roles array

---

## 🔍 Troubleshooting

### Issue: "No authToken or token in response data"

**Cause:** Message Central credentials invalid or expired

**Solution:**
1. Check Message Central dashboard
2. Verify credentials are correct
3. Check if account is active
4. Try regenerating API key/password
5. Update `backend/.env` with new credentials
6. Restart backend server

### Issue: SMS not received

**Possible Causes:**
1. ❌ Wrong phone number format
2. ❌ Phone number not registered (DND)
3. ❌ Message Central account has no credits
4. ❌ Network delay (wait up to 2 minutes)
5. ❌ Carrier blocked SMS

**Check:**
- Backend logs for "✅ OTP sent successfully"
- Message Central dashboard for delivery status
- Try different phone number
- Check Message Central account balance

### Issue: "This login is only for clinic owners" (9999999999)

**Cause:** Browser cache from old code

**Solution:**
- **Hard refresh:** Ctrl + Shift + R (Chrome/Edge)
- Or: Clear browser cache and refresh
- Or: Open incognito/private window

### Issue: "Invalid OTP"

**Causes:**
1. ❌ Entered wrong OTP
2. ❌ OTP expired (5 minutes)
3. ❌ Used OTP already (can't reuse)
4. ❌ Too many attempts (5 max)

**Solution:**
- Request new OTP
- Check SMS again
- For test numbers, use `123456`

---

## 📊 Backend Log Monitoring

Open backend terminal and watch for:

### Successful Test Number Flow:
```
[Auth] 🧪 TEST MODE: Using test OTP for 9999999999
[Auth] 🧪 TEST OTP: 123456 for 9999999999
[Auth] 🧪 TEST MODE: Verifying test OTP for 9999999999
[Auth] 🧪 TEST MODE: OTP verified successfully for 9999999999
[Auth] 🧪 TEST MODE: New CLINIC_OWNER registered: <uuid> (9999999999)
```

### Successful Real Number Flow:
```
[Auth] Sending real OTP via Message Central to 8762697832
[MessageCentral] 📱 Sending 6-digit OTP to: +918762697832
[MessageCentral] ✅ OTP sent successfully
[MessageCentral] 🔑 Verification ID: xxx-xxx-xxx
[Auth] OTP sent to +918762697832 via Message Central
[Auth] OTP verified successfully for 8762697832
[Auth] New CLINIC_OWNER registered: <uuid> (8762697832)
```

### Error Patterns to Watch:
```
❌ [MessageCentral] ❌❌❌ ERROR ❌❌❌
❌ [Auth] Message Central error: ...
❌ Invalid OTP. X attempts remaining.
❌ Maximum OTP attempts exceeded
❌ OTP expired or not found
```

---

## ✅ Success Criteria

### Test Numbers (9999999999, etc.)
- [ ] Toast shows "TEST MODE: Your OTP is 123456"
- [ ] OTP 123456 works
- [ ] Login successful
- [ ] Redirected to clinic onboarding
- [ ] No real SMS sent
- [ ] Backend logs show "🧪 TEST MODE"

### Real Numbers (8762697832)
- [ ] Toast shows "OTP sent successfully!" (NO test OTP)
- [ ] SMS received on phone within 30 seconds
- [ ] OTP from SMS works
- [ ] Login successful
- [ ] Redirected to clinic onboarding
- [ ] Message Central dashboard shows SMS delivered
- [ ] Backend logs show "✅ OTP sent successfully"

### Error Handling
- [ ] Wrong OTP shows "Invalid OTP"
- [ ] Expired OTP shows proper error
- [ ] Max attempts exceeded shows proper error
- [ ] Invalid phone number shows validation error

---

## 🎯 Next Steps After Testing

### If Test Numbers Work But Real Numbers Fail:

1. **Check Message Central Dashboard:**
   - Go to: https://cpaas.messagecentral.com/
   - Login and check SMS logs
   - Verify account balance/credits
   - Check API usage limits

2. **Check Backend Logs:**
   - Look for Message Central error details
   - Share error message if present

3. **Verify Credentials:**
   - Customer ID: C-B6442109CBD3438
   - Email: pulsemateconnect@gmail.com
   - Password: TmthYnUxOCQ= (Base64)

### If Both Work Successfully:

**Next feature to implement: Multi-Role Support**

1. Create `user_roles` junction table
2. Update `verifyOtpHandler` to support role addition
3. Update JWT payload to include roles array
4. Test: PATIENT → add CLINIC_OWNER role
5. Test: DOCTOR → add PATIENT role

---

## 🚀 Start Testing Now!

1. **Open frontend:** http://localhost:3000/clinic-partner
2. **Open backend logs:** Check the terminal where backend is running
3. **Start with test number:** 9999999999 → OTP: 123456
4. **Then try real number:** 8762697832 → Check SMS

**Report any errors with:**
- Frontend error message (toast or console)
- Backend log output (full error)
- Steps to reproduce

---

**Status:** ✅ Ready for testing with real SMS OTP via Message Central!
