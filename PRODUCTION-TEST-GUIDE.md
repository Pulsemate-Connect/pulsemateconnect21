# 🧪 MESSAGE CENTRAL - PRODUCTION TEST GUIDE

**Goal:** Verify Message Central OTP works on production before building mobile app

---

## 🎯 THE PROCESS (3 Steps)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  STEP 1: Add Env Vars to Render (5 min)               │
│           ↓                                             │
│  STEP 2: Test Production API (2 min)                   │
│           ↓                                             │
│  STEP 3: Build Mobile App (2 hours)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 STEP 1: Add Environment Variables to Render

**Time:** 5 minutes

### Actions:

1. **Open Render Dashboard:**
   ```
   https://dashboard.render.com/
   ```

2. **Select Your Backend Service:**
   - Look for "pulsemateconnect-api" or your backend service name
   - Click on it

3. **Go to Environment Tab:**
   - Click "Environment" in the left menu

4. **Add 3 Variables:**

   Click "Add Environment Variable" button, then add each:

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

5. **Save Changes:**
   - Click "Save Changes" button at the bottom
   - Render will restart automatically (2-3 minutes)

6. **Wait for Deployment:**
   - Go to "Events" tab
   - Wait for "Deploy live" message
   - Should take 5-10 minutes total

### ✅ Verification:

Check the "Logs" tab and look for:
```
[Backend] Server starting...
[Backend] ✅ Connected to database
[Backend] 🚀 Server running on port 5000
```

No errors = deployment successful!

---

## 🧪 STEP 2: Test Production API

**Time:** 2 minutes

### Option A: Automated Test (Recommended)

Run the test script:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
TEST-PRODUCTION-OTP.bat
```

This script will:
1. Ask for your phone number
2. Send OTP via production API
3. Wait for you to confirm SMS received
4. Ask for OTP from SMS
5. Verify OTP
6. Show success/failure

### Option B: Manual Test

**Test 1: Send OTP**

```bash
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp -H "Content-Type: application/json" -d "{\"mobileNumber\": \"9876543210\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "some-long-verification-id",
    "expiresIn": 60,
    "message": "OTP sent successfully"
  }
}
```

**✅ Check your phone for SMS!** Copy the verificationId for next test.

---

**Test 2: Verify OTP**

After receiving SMS, run:

```bash
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp -H "Content-Type: application/json" -d "{\"verificationId\": \"YOUR_VERIFICATION_ID\", \"otp\": \"123456\", \"mobileNumber\": \"+919876543210\"}"
```

Replace:
- `YOUR_VERIFICATION_ID` with the ID from Test 1
- `123456` with the OTP from SMS
- `+919876543210` with your phone number

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "phone": "+919876543210",
      "role": "PATIENT",
      "isNewUser": true
    }
  },
  "message": "Account created successfully"
}
```

---

## ✅ STEP 3: Build Mobile App

**Time:** 2-4 hours (depending on option chosen)

### If Tests Passed:

You can now confidently tell your team:

> "Message Central OTP is working on production. We can build the mobile app."

### Two Build Options:

**Option 1: Quick Test Build (2 hours)**
- Create test login screens
- Keep Firebase as backup
- Test Message Central separately
- **Recommended for first build**

**Option 2: Full Migration (4 hours)**
- Replace Firebase completely
- Update all login screens
- Remove Firebase dependencies
- **Use after Option 1 succeeds**

### Build Instructions:

See detailed guide: `BUILD-MESSAGE-CENTRAL-APP.md`

Quick start for Option 1:
```bash
# 1. Create service file
# Copy code from BUILD-MESSAGE-CENTRAL-APP.md

# 2. Create test screens
# Copy code from BUILD-MESSAGE-CENTRAL-APP.md

# 3. Build APK
eas build --platform android --profile apk
```

---

## 📊 DECISION TREE

```
Production Test → Pass? → Yes → Build App (Option 1 or 2)
                    ↓
                   No
                    ↓
                Check Logs → Fix Issue → Test Again
```

### If Test Fails:

**Error: 500 Internal Server Error**
- Check Render logs for errors
- Verify env vars are correct
- Check DATABASE_URL exists in Render

**Error: "Failed to generate token"**
- MESSAGE_CENTRAL_PASSWORD is wrong
- Check if value copied correctly
- No spaces at start/end

**Error: No SMS received**
- Check Message Central dashboard for credits
- Try different phone number
- Check Render logs for API call success

**Error: "Invalid OTP"**
- OTP expired (60 seconds timeout)
- Wrong OTP entered
- Request new OTP

---

## 🎯 SUCCESS CRITERIA

**✅ You can build the app when:**

1. **Production Test Passed:**
   - [ ] Send OTP API returns verificationId
   - [ ] SMS received on phone within 30 seconds
   - [ ] Verify OTP API returns JWT tokens
   - [ ] No errors in any step

2. **Render Deployment:**
   - [ ] All 3 env vars added
   - [ ] Deployment shows "Deploy live"
   - [ ] No errors in logs

3. **Ready to Build:**
   - [ ] Decided Option 1 or Option 2
   - [ ] Read BUILD-MESSAGE-CENTRAL-APP.md
   - [ ] Frontend code ready

---

## ⏱️ TIME BREAKDOWN

| Step | Task | Time |
|------|------|------|
| 1 | Add env vars to Render | 5 min |
| 1 | Wait for deployment | 5 min |
| 2 | Run test script | 2 min |
| 2 | Check SMS & verify | 1 min |
| 3 | Write frontend code | 1-2 hours |
| 3 | Build APK | 30 min |
| 3 | Test on device | 30 min |
| **Total** | | **3-4 hours** |

---

## 🚀 QUICK START

**Right now, run this:**

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
TEST-PRODUCTION-OTP.bat
```

This will:
1. Check if Render deployment is ready
2. Test send OTP
3. Wait for SMS
4. Test verify OTP
5. Confirm success

**If successful:** You'll see "✅ SUCCESS! MESSAGE CENTRAL OTP IS WORKING ON PRODUCTION!"

**Then:** Read `BUILD-MESSAGE-CENTRAL-APP.md` for build instructions

---

## 📞 COMMANDS REFERENCE

```bash
# Test production OTP
TEST-PRODUCTION-OTP.bat

# Check Render deployment
# Visit: https://dashboard.render.com/

# Build test app (Option 1)
eas build --platform android --profile apk

# Build production app (Option 2)
eas build --platform android --profile production

# Install on emulator
eas build:run -p android --latest
```

---

## 🎯 TELL YOUR TEAM

**After successful test, you can say:**

> "Backend is ready. Message Central OTP tested on production and working:
> - ✅ SMS delivery confirmed
> - ✅ OTP verification working
> - ✅ JWT token generation successful
> 
> We can proceed with building the mobile app. Frontend code is ready in BUILD-MESSAGE-CENTRAL-APP.md. Estimated time: 2-3 hours."

---

## 📚 DOCUMENTATION

| File | Purpose |
|------|---------|
| `PRODUCTION-TEST-GUIDE.md` | This file - testing guide |
| `BUILD-MESSAGE-CENTRAL-APP.md` | Frontend code & build steps |
| `TEST-PRODUCTION-OTP.bat` | Automated test script |
| `MESSAGE-CENTRAL-MIGRATION-PLAN.md` | Full migration strategy |
| `CURRENT-STATUS.md` | Overall project status |

---

## 🎉 YOU'RE HERE

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ✅ Backend Code Complete                              │
│  ✅ Code Pushed to GitHub                              │
│  ⏳ Env Vars Need to be Added                          │
│  ⏳ Production Test Pending                            │
│  ⏳ Build App Pending                                  │
│                                                         │
│  NEXT: Add env vars to Render, then run test script    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Ready to proceed?**

1. Add env vars to Render (5 min)
2. Run `TEST-PRODUCTION-OTP.bat` (2 min)
3. If pass → Build app (2-3 hours)

**Start here:** https://dashboard.render.com/

**Good luck! 🚀**
