# ⚡ TEST MESSAGE CENTRAL NOW - CHECKLIST

**Current Status:** Code is pushed to GitHub ✅  
**Action Required:** Add environment variables to Render, then test

---

## 📋 PREREQUISITE: Add Environment Variables to Render

⚠️ **You MUST do this first before testing will work!**

### Steps:

1. **Open Render Dashboard:**
   ```
   https://dashboard.render.com/
   ```

2. **Find Your Backend Service:**
   - Look for "pulsemateconnect-api" or similar
   - It should already exist (your current backend)

3. **Go to Environment Tab:**
   - Click on your service
   - Click "Environment" in left sidebar

4. **Check if these variables already exist:**
   - `MESSAGE_CENTRAL_CUSTOMER_ID`
   - `MESSAGE_CENTRAL_PASSWORD`
   - `MESSAGE_CENTRAL_BASE_URL`

5. **If they DON'T exist, add them:**

   Click "Add Environment Variable" and add:

   **Variable 1:**
   ```
   Key: MESSAGE_CENTRAL_CUSTOMER_ID
   Value: C-B6442109CBD3438
   ```

   **Variable 2:**
   ```
   Key: MESSAGE_CENTRAL_PASSWORD
   Value: eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
   ```

   **Variable 3:**
   ```
   Key: MESSAGE_CENTRAL_BASE_URL
   Value: https://cpaas.messagecentral.com
   ```

6. **Click "Save Changes"**
   - Render will restart automatically
   - Takes 2-3 minutes

7. **Wait for "Deploy live" status**
   - Go to "Events" tab
   - Wait for deployment to complete (~5 minutes)

---

## ✅ AFTER ADDING ENV VARS: Test the API

Once Render deployment completes, test with your phone number:

### Test 1: Send OTP

**Open PowerShell or CMD and run:**

```powershell
$body = @{
    mobileNumber = "YOUR_10_DIGIT_NUMBER"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.pulsemateconnect.in/api/auth/patient/send-otp" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

**Replace `YOUR_10_DIGIT_NUMBER` with your actual phone number (e.g., 9876543210)**

**What to expect:**
- Status: 200 OK
- Response contains: `"success": true`
- Response contains: `"verificationId": "..."`
- **SMS arrives on your phone!**

**Copy the `verificationId` from response for next test.**

---

### Test 2: Verify OTP

After receiving SMS, run:

```powershell
$body = @{
    verificationId = "PASTE_VERIFICATION_ID_HERE"
    otp = "123456"
    mobileNumber = "+91YOUR_NUMBER"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.pulsemateconnect.in/api/auth/patient/verify-otp" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

**Replace:**
- `PASTE_VERIFICATION_ID_HERE` with the verificationId from Test 1
- `123456` with the actual OTP from SMS
- `+91YOUR_NUMBER` with your full phone number (e.g., +919876543210)

**What to expect:**
- Status: 200 OK
- Response contains: `"success": true`
- Response contains: `"accessToken": "..."`
- Response contains: `"refreshToken": "..."`

---

## 📊 RESULTS INTERPRETATION

### ✅ SUCCESS (Both tests passed):

You should see:
1. ✅ Test 1 returns verificationId
2. ✅ SMS received on your phone
3. ✅ Test 2 returns JWT tokens

**This means:**
- Message Central OTP is working on production
- Backend is properly configured
- SMS delivery is working
- **YOU CAN PROCEED TO BUILD THE MOBILE APP**

---

### ❌ FAILURE (Tests failed):

**Error: "Failed to generate token"**
- MESSAGE_CENTRAL_PASSWORD is incorrect
- Check if you copied the full token (it's very long!)
- Try adding env vars again

**Error: 500 Internal Server Error**
- Check Render logs for details
- Env vars might not be loaded yet
- Wait 5 minutes after saving and try again

**Error: No SMS received**
- Check Message Central dashboard for credits
- Verify phone number is correct
- Try a different phone number
- Check Render logs to see if API call succeeded

**Error: "Invalid OTP"**
- OTP expired (60 seconds limit)
- Wrong OTP entered
- Request a new OTP and try again

---

## 🎯 NEXT STEPS AFTER SUCCESS

### If tests passed:

**You can tell your team:**

> "✅ Message Central OTP tested and working on production!
> 
> Test Results:
> - Backend API: Working ✅
> - SMS Delivery: Confirmed ✅
> - OTP Verification: Working ✅
> - JWT Token Generation: Working ✅
> 
> Ready to build mobile app. Frontend code is ready in BUILD-MESSAGE-CENTRAL-APP.md
> 
> Estimated build time: 2-3 hours"

**Then proceed to:**
1. Read `BUILD-MESSAGE-CENTRAL-APP.md`
2. Choose Option 1 (Quick Test) or Option 2 (Full Migration)
3. Create frontend code
4. Build APK
5. Test on device

---

## 🚨 IMPORTANT NOTES

### Before Testing:
- [ ] Environment variables added to Render
- [ ] Render deployment completed (check Events tab)
- [ ] No errors in Render logs
- [ ] Have your phone ready to receive SMS

### During Testing:
- [ ] Use real phone number (10 digits, no spaces)
- [ ] Check phone for SMS within 30 seconds
- [ ] Copy verificationId carefully (no extra spaces)
- [ ] Enter OTP quickly (expires in 60 seconds)

### After Testing:
- [ ] If passed: Proceed to build app
- [ ] If failed: Check Render logs and fix issues
- [ ] Document any problems encountered

---

## 📞 QUICK REFERENCE

**Render Dashboard:**
```
https://dashboard.render.com/
```

**Your Backend URL:**
```
https://api.pulsemateconnect.in
```

**Send OTP Endpoint:**
```
POST https://api.pulsemateconnect.in/api/auth/patient/send-otp
```

**Verify OTP Endpoint:**
```
POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp
```

---

## ⏱️ ESTIMATED TIME

| Task | Time |
|------|------|
| Add env vars to Render | 5 min |
| Wait for deployment | 5 min |
| Run Test 1 (Send OTP) | 1 min |
| Wait for SMS | 30 sec |
| Run Test 2 (Verify OTP) | 1 min |
| **Total** | **~12 minutes** |

---

## 🎉 YOU'RE ALMOST THERE!

```
Current Progress: ████████████████░░░░ 80%

✅ Backend code written
✅ Code pushed to GitHub
⏳ Environment variables (you do this)
⏳ Production test (we do together)
⏳ Build mobile app (2-3 hours)
```

**Next Action:** Go to Render dashboard and add those 3 environment variables!

**Then:** Come back here and run the PowerShell test commands above.

---

**Ready? Start here:** https://dashboard.render.com/ 🚀
