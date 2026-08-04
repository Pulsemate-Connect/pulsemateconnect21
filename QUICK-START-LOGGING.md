# ⚡ Quick Start: Test Production OTP with Logging

**Time Required:** ~1 hour  
**Goal:** Capture exact error from Play Store production build

---

## 🎯 STEP-BY-STEP

### 1️⃣ Build New Version (15 min)

```cmd
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

REM Increment version
.\increment-version.bat

REM Build production AAB
eas build --platform android --profile production
```

**Wait for build to complete on EAS dashboard.**

---

### 2️⃣ Upload to Play Store (5 min)

1. Download AAB from EAS dashboard
2. Go to: https://play.google.com/console
3. **Release → Testing → Internal testing**
4. Click **"Create new release"**
5. Upload the AAB file
6. Click **"Review release"** → **"Start rollout"**

**Wait 15-30 minutes for Play Store processing.**

---

### 3️⃣ Install from Play Store (5 min)

On your Android device:

1. Open Play Store
2. Search "PulseMate Connect"
3. Scroll down → Join Internal Testing
4. Click "Install" or "Update"
5. **IMPORTANT:** Install from Play Store, NOT from APK/sideload

---

### 4️⃣ Enable USB Debugging (2 min)

On your Android device:

```
Settings → About Phone → Tap "Build Number" 7 times
(You'll see "You are now a developer!")

Settings → System → Developer Options → Enable "USB Debugging"
```

---

### 5️⃣ Connect Device (1 min)

1. Connect phone to PC via USB cable
2. On phone: Tap "Allow USB Debugging" when prompted
3. Check the "Always allow from this computer" box

**Verify connection:**
```cmd
adb devices
```

You should see your device ID listed.

---

### 6️⃣ Capture Logs (5 min)

**Automated (RECOMMENDED):**
```cmd
.\capture-firebase-logs.bat
```

**Manual:**
```cmd
adb logcat -c
adb logcat -s ReactNativeJS:V chromium:V > firebase_logs.txt
```

**Keep the command prompt window open!**

---

### 7️⃣ Test OTP Flow (3 min)

On your phone:

1. Open **PulseMate Connect** (from Play Store)
2. Enter your phone number
3. Click **"Send OTP"**
4. **Wait for result** (success or error)
5. If SMS arrives, enter OTP
6. Complete login flow

---

### 8️⃣ Stop Logging (1 sec)

In command prompt: Press **Ctrl+C**

The log file will open automatically.

---

### 9️⃣ Analyze Logs (5 min)

**Open the log file and search for:**

#### If OTP FAILED, search for:
```
🔴 FIREBASE ERROR
```

Then look for:
```
║ ├─ Code: auth/XXXXX
```

**This code is the answer you need!**

#### Common Error Codes:

| Code | Meaning | Solution |
|------|---------|----------|
| `auth/captcha-check-failed` | Web SDK cannot do native attestation | **MIGRATE to React Native Firebase** |
| `auth/invalid-app-credential` | SHA mismatch | **FIX SHA** in Firebase Console |
| `auth/app-not-authorized` | Package not registered | **ADD package** to Firebase Console |
| `auth/network-request-failed` | Network issue | Check internet connection |

#### If OTP SUCCEEDED, search for:
```
✅ FIREBASE SUCCESS - signInWithPhoneNumber SUCCESS
```

**If you see this, the current implementation works! No migration needed.**

---

## 🎯 DECISION TREE

```
Did OTP work?
│
├─ YES → ✅ Current implementation is fine
│         → Deploy to production
│         → No migration needed
│
└─ NO → Check error code
        │
        ├─ auth/captcha-check-failed
        │  → ❌ Web SDK incompatible
        │  → MUST migrate to React Native Firebase
        │
        ├─ auth/invalid-app-credential
        │  → ⚠️  Configuration issue
        │  → Fix SHA fingerprints
        │  → No migration needed
        │
        └─ Other error
           → Investigate specific error
           → May or may not need migration
```

---

## 📋 CHECKLIST

- [ ] New version built with logging
- [ ] Uploaded to Play Store Internal Testing
- [ ] Processing complete (15-30 min wait)
- [ ] Installed from Play Store (not sideloaded)
- [ ] USB debugging enabled
- [ ] Device connected via USB
- [ ] Verified with `adb devices`
- [ ] Started log capture
- [ ] Tested OTP flow in app
- [ ] Stopped logging with Ctrl+C
- [ ] Opened log file
- [ ] Searched for error or success
- [ ] Identified error code (if failed)
- [ ] Made decision (fix config or migrate)

---

## 🚨 COMMON ISSUES

### "adb: command not found"

**Fix:**
1. Install Android SDK Platform Tools
2. Add to PATH: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`
3. Restart command prompt

### "device unauthorized"

**Fix:**
1. Look at phone screen
2. Tap "Allow" on USB debugging prompt
3. Check "Always allow from this computer"

### "No logs appearing"

**Fix:**
1. Make sure you installed from Play Store (not sideload)
2. Try: `adb logcat` (without filters)
3. Search for "Firebase" or "Auth" in output

### "App crashes immediately"

**Fix:**
1. Use: `adb logcat *:E` to see all errors
2. Look for crash logs
3. Check Play Console for crash reports

---

## 📄 WHAT THE LOGS LOOK LIKE

### SUCCESS:
```
╔═══════════════════════════════════════════════════════════════
║ ✅ FIREBASE SUCCESS - signInWithPhoneNumber SUCCESS
║ Environment: PLAY_STORE_PRODUCTION
║ Package: in.pulsemateconnect.patient
║ verificationId: AFOoXXXXXXXXX
╚═══════════════════════════════════════════════════════════════
```

### FAILURE:
```
╔═══════════════════════════════════════════════════════════════
║ 🔴 FIREBASE ERROR - signInWithPhoneNumber FAILED
║ Environment: PLAY_STORE_PRODUCTION
║ Package: in.pulsemateconnect.patient
║ 
║ ❌ ERROR DETAILS:
║ ├─ Code: auth/captcha-check-failed  ← THIS IS KEY
║ ├─ Message: reCAPTCHA verification failed
╚═══════════════════════════════════════════════════════════════
```

---

## ⏱️ ESTIMATED TIME

| Step | Time |
|------|------|
| Build | 15 min |
| Upload | 5 min |
| Play Store processing | 15-30 min |
| Install | 5 min |
| Setup USB | 2 min |
| Test & Capture | 5 min |
| Analyze | 5 min |
| **TOTAL** | **~1 hour** |

---

## ✅ OUTCOME

After completing these steps, you will have:

1. ✅ **Proof** - Evidence from actual production build
2. ✅ **Error Code** - Exact Firebase error (if failed)
3. ✅ **Environment** - Confirmed it's Play Store build
4. ✅ **Decision** - Clear path forward (fix or migrate)

**No more guessing. Only evidence.**

---

## 📞 NEED HELP?

If logs show `auth/captcha-check-failed`:
- Read: `PRODUCTION-LOGGING-GUIDE.md` for details
- This means: Web SDK cannot work in production
- Solution: Migrate to React Native Firebase

If logs show success:
- Celebrate! 🎉
- Current implementation works
- Deploy to production

If logs show other error:
- Share the full error block
- Include environment information
- We can diagnose from there

---

**Ready?** Start with Step 1: Build New Version

```cmd
.\increment-version.bat
eas build --platform android --profile production
```
