# ✅ Firebase Build Test Checklist

**Build ID:** 70f9e976  
**Status:** ✅ Installed and running on emulator  
**Date:** August 6, 2026

---

## 🎯 TESTING STEPS

### Step 1: Check App Launch ✅ CRITICAL

**What to test:**
- [ ] App opens without crashing
- [ ] No "Initialization Error" popup appears
- [ ] Login screen displays correctly

**Expected result:**
- ✅ App opens successfully
- ✅ No Firebase initialization errors
- ✅ Clean login screen with phone input

**If it fails:**
- ❌ App crashes → Check logcat for errors
- ❌ Initialization error still appears → Firebase config issue
- ❌ Blank screen → Check network connectivity

---

### Step 2: Test Phone Number Input

**What to test:**
- [ ] Enter a valid Indian mobile number (10 digits)
- [ ] Example: 9876543210 or your real number
- [ ] Click "Send OTP" or equivalent button

**Expected result:**
- ✅ Button processes the request
- ✅ Firebase reCAPTCHA verification happens (if needed)
- ✅ OTP screen appears

**If it fails:**
- ❌ Button does nothing → Check console logs
- ❌ reCAPTCHA fails → Normal, try again
- ❌ Network error → Check internet connection

---

### Step 3: Receive OTP

**What to test:**
- [ ] Wait for SMS to arrive (30-60 seconds)
- [ ] If using real number, check your phone
- [ ] If testing, check Firebase Console → Authentication → Users

**Expected result:**
- ✅ SMS received with 6-digit OTP code
- ✅ OTP input screen shows up
- ✅ Timer shows OTP expiry countdown

**If it fails:**
- ❌ No SMS → Check Firebase Console quotas
- ❌ Wrong number → Firebase shows the number in logs
- ❌ Too long → Firebase might have delays

---

### Step 4: Verify OTP

**What to test:**
- [ ] Enter the OTP code received via SMS
- [ ] Click "Verify" or "Submit" button
- [ ] Wait for verification

**Expected result:**
- ✅ OTP verification succeeds
- ✅ User is created/logged in
- ✅ Redirects to home/dashboard screen

**If it fails:**
- ❌ "Invalid OTP" → Check if code was typed correctly
- ❌ "Expired OTP" → Request new OTP
- ❌ Network error → Backend issue

---

### Step 5: Test User Session

**What to test:**
- [ ] App shows logged-in state
- [ ] User data displays (name, phone, profile)
- [ ] Navigation works correctly
- [ ] Close app and reopen → Should stay logged in

**Expected result:**
- ✅ User remains logged in
- ✅ JWT token stored in SecureStore
- ✅ App functions normally

**If it fails:**
- ❌ Logged out on reopen → Token not persisting
- ❌ Error on navigation → UI/routing issue
- ❌ Data not loading → Backend connection issue

---

## 📊 TEST RESULTS

### Build Information
- **Build ID:** 70f9e976
- **Platform:** Android
- **Profile:** production
- **Installed:** ✅ Successfully installed on PulseMatePixel35c

### Test Summary

| Test | Status | Notes |
|------|--------|-------|
| App Launch | ⏳ Pending | Check for initialization error |
| Phone Input | ⏳ Pending | Test with real or test number |
| OTP Sending | ⏳ Pending | Verify SMS arrives |
| OTP Verification | ⏳ Pending | Test login flow |
| User Session | ⏳ Pending | Test persistence |

**Legend:**
- ✅ Passed
- ❌ Failed
- ⏳ Pending
- ⚠️ Warning

---

## 🔍 DEBUGGING TIPS

### If App Crashes on Launch:

```bash
# View real-time logs
adb logcat | findstr "PulseMate"

# Or filter for errors only
adb logcat *:E | findstr "PulseMate"
```

### If Firebase Initialization Error Appears:

Check these in the app:
1. Firebase config is correct in `app.json`
2. `google-services.json` is present
3. AsyncStorage is initialized
4. Network connectivity is working

### If OTP Doesn't Arrive:

1. Check Firebase Console → Authentication → Usage
2. Verify phone number format (+91xxxxxxxxxx)
3. Check Firebase quotas (free tier: 10k/month)
4. Test with a different phone number

### If Backend Connection Fails:

```bash
# Test backend health
curl https://api.pulsemateconnect.in/health

# Test Firebase login endpoint
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/firebase-phone-login \
  -H "Content-Type: application/json" \
  -d "{\"firebaseIdToken\":\"test\",\"name\":\"Test User\"}"
```

---

## 📱 REAL DEVICE TESTING (Optional)

After emulator testing works, test on a real device:

```bash
# Install on connected device
adb install -r /path/to/build.apk

# Or use EAS
eas build:run -p android --latest
```

---

## 🎯 DECISION POINTS

### If Everything Works ✅

**Next steps:**
1. ✅ Build is ready for production
2. ✅ Can deploy to Play Store
3. ✅ Firebase Phone Auth is working perfectly

**Actions:**
```bash
# Build for Play Store
eas build -p android --profile production
```

### If Initialization Error Still Appears ❌

**Possible causes:**
1. Firebase config missing or incorrect
2. AsyncStorage not initialized properly
3. Network issues preventing Firebase connection

**Actions:**
1. Check logs: `adb logcat *:E`
2. Verify `app.json` has correct Firebase config
3. Check if internet is working in emulator

### If OTP Flow Works But Backend Fails ⚠️

**This means:**
- Firebase Phone Auth is working ✅
- But backend connection has issues

**Check:**
1. Backend is online: https://api.pulsemateconnect.in/health
2. Firebase service account is configured in Render
3. Network allows backend connections

---

## 📋 QUICK TEST SCRIPT

Use this to test quickly:

**Test Number:** 9876543210 (or your real number)

**Steps:**
1. Open app
2. Enter: 9876543210
3. Click: Send OTP
4. Wait for SMS
5. Enter OTP
6. Should see home screen

**Time:** 2-3 minutes per test

---

## ✅ SUCCESS CRITERIA

The build is **READY FOR PRODUCTION** if:

- ✅ App opens without initialization error
- ✅ OTP can be sent to phone number
- ✅ SMS arrives with OTP code
- ✅ OTP verification succeeds
- ✅ User is logged in and can navigate
- ✅ Session persists after app restart

**If all above pass → Deploy to Play Store!** 🚀

---

## 🚀 NEXT STEPS AFTER SUCCESSFUL TEST

### Immediate (if tests pass):

1. **Build for Play Store**
   ```bash
   eas build -p android --profile production
   ```

2. **Download AAB file**
   - Go to Expo dashboard
   - Download the `.aab` file
   - This is for Google Play Store

3. **Upload to Play Store**
   - Go to Google Play Console
   - Create new release
   - Upload the `.aab` file
   - Submit for review

### Parallel work:

1. **Fix Message Central** (in background)
   - Contact support
   - Get credentials sorted
   - Test when ready

2. **Monitor Firebase Usage**
   - Check Firebase Console daily
   - Monitor authentication counts
   - Watch for approaching free tier limit

---

## 📞 REPORT YOUR RESULTS

After testing, tell me:

**If it works:**
- ✅ "tests passed" → I'll help you deploy to Play Store

**If there are issues:**
- ❌ "initialization error" → I'll help debug Firebase config
- ❌ "otp not working" → I'll help debug phone auth
- ❌ "backend error" → I'll help check backend connection

**Just tell me what happened!** 🎯

---

## 💡 TESTING TIPS

1. **Use real phone number:** Testing with your actual number is easiest
2. **Check spam:** Sometimes OTP SMS goes to spam
3. **Wait patiently:** First OTP can take 60-90 seconds
4. **Try airplane mode:** Toggle off/on if SMS doesn't arrive
5. **Check Firebase Console:** Shows real-time auth attempts

---

**Current Status:** ⏳ Waiting for your test results

Tell me: Did the app open without errors? Can you see the login screen? 🚀

