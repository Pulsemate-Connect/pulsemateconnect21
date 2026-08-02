# Firebase Phone Auth - Production Debugging Checklist

Use this checklist when Firebase Phone Authentication fails in production (Play Store build).

## 🚀 Quick Debug Steps

### Step 1: Capture Logs (5 minutes)

- [ ] Connect Android phone via USB
- [ ] Enable USB debugging on phone
  - Settings → About Phone → Tap "Build Number" 7 times
  - Settings → Developer Options → Enable "USB Debugging"
- [ ] Run `capture-firebase-logs.bat` (or `adb logcat`)
- [ ] Reproduce the issue in the app
- [ ] Press Ctrl+C to stop capture
- [ ] Log file opens automatically

### Step 2: Identify Error Type

Search the log file for: **"FIREBASE ERROR"** or **"🔴"**

Found error? Continue to Step 3.
No error found? Check "No Error Logs" section below.

### Step 3: Identify Error Code

Look for: **"Code:"** in the error section

Common codes and quick fixes:

---

## ❌ Error Code Solutions

### `auth/invalid-app-credential`
**Meaning:** App verification failed

**Quick Checks:**
- [ ] Is this a **Play Store production build**? (Check logs for "Environment: PLAY_STORE_PRODUCTION")
- [ ] Have you added the **production SHA-256** certificate to Firebase Console?

**Solution:**
1. Get production SHA-256 from your release keystore:
   ```bash
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```

2. Copy the SHA-256 fingerprint

3. Add to Firebase Console:
   - Go to: https://console.firebase.google.com
   - Select project → Project Settings
   - Your apps → Android app
   - Add SHA-256 certificate fingerprint
   - Click "Save"

4. Wait 5-10 minutes, then test again

---

### `auth/app-not-authorized`
**Meaning:** Package name not registered in Firebase

**Quick Checks:**
- [ ] Check **actual package name** in logs (search for "Package:")
- [ ] Should be: `in.pulsemateconnect.patient`

**Solution:**
1. Verify package name in logs matches Firebase Console exactly
2. In Firebase Console → Project Settings → Your apps
3. Check registered package name
4. If different, register the correct package name
5. Update google-services.json file
6. Rebuild app

---

### `auth/code-expired`
**Meaning:** OTP timeout (>120 seconds)

**Quick Checks:**
- [ ] Search logs for: **"Time Since OTP Sent:"**
- [ ] If > 120 seconds → OTP expired

**Solution:**
1. Tap "Resend OTP" button in app
2. Enter new OTP within 120 seconds

**Prevention:**
- Logs now show warning at 110 seconds
- User should resend if taking too long

---

### `auth/invalid-verification-code`
**Meaning:** Wrong OTP entered

**Quick Checks:**
- [ ] User entered correct 6-digit code?
- [ ] OTP not expired? (check "Time Since OTP Sent")

**Solution:**
- Double-check OTP in SMS
- Request new OTP if expired

---

### `auth/too-many-requests`
**Meaning:** Rate limited by Firebase

**Solution:**
- Wait 15-30 minutes before trying again
- Firebase automatically limits excessive requests

---

### `auth/quota-exceeded`
**Meaning:** SMS quota exceeded in Firebase project

**Solution:**
- Check Firebase Console → Authentication → Sign-in methods → Phone
- Verify SMS quota and billing
- May need to upgrade Firebase plan

---

### `auth/captcha-check-failed`
**Meaning:** reCAPTCHA verification failed

**Quick Checks:**
- [ ] Is **RecaptchaVerifier** being created? (Check logs)
- [ ] Internet connection stable?

**Solution:**
- On production builds, Firebase should use Play Integrity instead
- Verify app is a signed release build, not debug
- Check Play Integrity API is enabled

---

## 🔍 No Error Logs Found?

If logs don't show any Firebase errors:

### Check 1: App Type
- [ ] Search logs for: **"Environment:"**
- [ ] Is it "PLAY_STORE_PRODUCTION"?
- [ ] If "EXPO_GO" or "DEVELOPMENT_BUILD" → Not a production build

### Check 2: Firebase Initialized?
- [ ] Search logs for: **"FIREBASE INITIALIZATION"**
- [ ] Should show "✅ SUCCESS"
- [ ] If failed → Check Firebase config

### Check 3: Logs Being Captured?
- [ ] Logs show React Native output?
- [ ] Search for: **"ReactNativeJS"**
- [ ] If missing → adb might not be capturing correctly

**Try:**
```bash
adb logcat -c
adb logcat *:V > all-logs.txt
```

---

## 🌐 Network/Backend Errors

### Backend Login Failed
**Look for:** "Backend login failed" or "Cannot reach server"

**Quick Checks:**
- [ ] Internet connection active?
- [ ] WiFi or mobile data working?
- [ ] VPN disabled?
- [ ] Backend server accessible?

**Solution:**
- Test backend endpoint manually
- Check server logs
- Verify API endpoint URL

---

### Network Timeout
**Look for:** "timeout" or "ETIMEDOUT"

**Solution:**
- Check internet connection
- Try different network (WiFi vs mobile data)
- Check firewall/proxy settings

---

## ✅ Success But User Reports Issue

If logs show "✅ SUCCESS" but user says it failed:

### Check Navigation
- [ ] Search logs for: **"Navigation successful"**
- [ ] Did app navigate to home screen?

### Check Token Storage
- [ ] Search logs for: **"Storing authentication data"**
- [ ] Was signIn() called?

### Check Backend Response
- [ ] Search logs for: **"Backend login successful"**
- [ ] Did backend return user object?
- [ ] Check: "Has Access Token: true"

---

## 📋 Information to Collect

When reporting issues, collect:

1. **Error Code:** (e.g., auth/invalid-app-credential)
2. **Environment:** (from logs - PLAY_STORE_PRODUCTION)
3. **Package Name:** (from logs - should be in.pulsemateconnect.patient)
4. **Platform:** (from logs - android XX)
5. **Timing:** (Time Since OTP Sent, if relevant)
6. **Full Error Log:** (the boxed error section)

---

## 🔧 Advanced Debugging

### View All Firebase Config
Search logs for: **"FIREBASE INITIALIZATION STARTING"**

Should show:
```
║ Firebase Config Check:
║ ├─ Config Loaded: YES
║ ├─ API Key Present: YES
║ ├─ Project ID: your-project-id
║ ├─ Auth Domain: your-project.firebaseapp.com
```

### Check All OTP Flow Steps
Search for these in order:
1. "SEND OTP BUTTON PRESSED"
2. "CALLING sendOtpToPhone"
3. "SEND OTP SUCCESS" or "SEND OTP FAILED"
4. "VERIFY OTP BUTTON PRESSED"
5. "CALLING verifyPhoneOtp"
6. "STEP 1 SUCCESS"
7. "CALLING loginWithFirebaseToken"
8. "STEP 2 SUCCESS"

If any step missing or failed, that's where the issue is.

---

## 🆘 Still Stuck?

1. **Review Logs:** Check `FIREBASE_LOGGING_GUIDE.md` for detailed analysis
2. **Common Issues:** See `QUICKSTART_LOGGING.md` for common solutions
3. **File Changes:** See `LOGGING_CHANGES_SUMMARY.md` for what was modified

---

## 🎯 Most Common Production Issues

Based on typical Firebase Phone Auth problems:

1. **SHA-256 not registered** (auth/invalid-app-credential) → 70% of issues
2. **Package name mismatch** (auth/app-not-authorized) → 15% of issues
3. **OTP timeout** (auth/code-expired) → 10% of issues
4. **Network issues** → 5% of issues

**Start with checking SHA-256 certificate first!**

---

**Quick Reference:**
- Capture logs: `capture-firebase-logs.bat`
- Search errors: "FIREBASE ERROR" or "auth/"
- Check environment: "Environment: PLAY_STORE_PRODUCTION"
- Most common: SHA-256 certificate not registered
