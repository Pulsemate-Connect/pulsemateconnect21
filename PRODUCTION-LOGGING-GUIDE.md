# 📋 Production Logging Guide - Firebase Phone Authentication

**Created:** August 2, 2026  
**Purpose:** Capture detailed logs from Play Store production builds to diagnose OTP issues

---

## ✅ WHAT WAS ADDED

### Enhanced Logging in `src/config/firebase.js`:

1. **Environment Detection** - Identifies exact build type:
   - `EXPO_GO` - Running in Expo Go app
   - `DEVELOPMENT_BUILD` - EAS development build
   - `PLAY_STORE_PRODUCTION` - Downloaded from Google Play Store
   - `PRODUCTION_BUILD` - Standalone production build

2. **Comprehensive Error Logging** - Captures:
   - Error name, code, message
   - Full stack trace
   - Complete error object (all properties)
   - Environment details (OS, version, package name)
   - Timestamp of failure

3. **Success Logging** - Records:
   - Each successful step
   - Timing information
   - Environment context
   - Verification IDs

4. **Step-by-Step Logging**:
   - Firebase initialization
   - RecaptchaVerifier creation
   - `signInWithPhoneNumber()` call
   - OTP verification
   - Backend login

---

## 📱 HOW TO RETRIEVE LOGS FROM PLAY STORE APP

### Method 1: USB Debugging (RECOMMENDED)

#### Prerequisites:
- Physical Android device
- USB cable
- USB debugging enabled on device

#### Steps:

1. **Enable USB Debugging on Your Device:**
   ```
   Settings → About Phone → Tap "Build Number" 7 times
   Settings → Developer Options → Enable "USB Debugging"
   ```

2. **Connect Device via USB**

3. **Open Command Prompt** and verify connection:
   ```cmd
   adb devices
   ```
   You should see your device ID listed.

4. **Clear Old Logs:**
   ```cmd
   adb logcat -c
   ```

5. **Start Capturing Logs:**
   ```cmd
   adb logcat -s ReactNativeJS:V chromium:V > firebase_logs.txt
   ```
   This command captures ALL React Native console logs.

6. **Keep Command Prompt Open** and perform these actions on your phone:
   - Open PulseMate Connect app
   - Enter phone number
   - Click "Send OTP"
   - Wait for result (success or error)
   - Enter OTP if received
   - Complete login flow

7. **Stop Logging** with `Ctrl+C`

8. **Open `firebase_logs.txt`** and search for:
   - `🔧 FIREBASE INITIALIZATION STARTING`
   - `📱 SEND OTP - STARTING`
   - `🚀 CALLING signInWithPhoneNumber`
   - `🔴 FIREBASE ERROR` (if failure occurred)
   - `✅ FIREBASE SUCCESS` (if successful)

---

### Method 2: Remote Logging Service (For Non-USB Testing)

Since Play Store builds don't allow direct console access, you can implement remote logging:

#### Option A: Sentry Integration

1. **Install Sentry:**
   ```bash
   npm install @sentry/react-native
   ```

2. **Configure Sentry** in `App.js`:
   ```javascript
   import * as Sentry from '@sentry/react-native';
   
   Sentry.init({
     dsn: 'YOUR_SENTRY_DSN',
     environment: __DEV__ ? 'development' : 'production',
   });
   ```

3. **Wrap Console Logs:**
   In `firebase.js`, add to each error:
   ```javascript
   Sentry.captureException(error, {
     contexts: {
       firebase: {
         phoneNumber,
         environment: env.environment,
         packageName: env.packageName
       }
     }
   });
   ```

4. **View Logs** in Sentry Dashboard

#### Option B: Custom Backend Logging

1. **Create Backend Endpoint:**
   ```javascript
   // In your backend
   app.post('/api/logs/client', (req, res) => {
     const { level, message, context } = req.body;
     console.log(`[CLIENT-${level}]`, message, context);
     res.sendStatus(200);
   });
   ```

2. **Add to `firebase.js`:**
   ```javascript
   const sendLogToServer = async (level, message, context) => {
     try {
       await api.post('/logs/client', { level, message, context });
     } catch (err) {
       // Fail silently - don't break app
     }
   };
   
   // In logError function, add:
   await sendLogToServer('error', 'Firebase Error', {
     error: error.message,
     code: error.code,
     environment: env.environment
   });
   ```

3. **View Logs** in your backend console

---

### Method 3: Android Studio Logcat (Alternative to ADB)

1. **Install Android Studio** (if not already installed)

2. **Connect Device via USB**

3. **Open Android Studio** → **Logcat** (bottom panel)

4. **Filter Logs:**
   - Set filter to: `package:in.pulsemateconnect.patient`
   - Or filter by tag: `ReactNativeJS`

5. **Perform OTP Flow** in app

6. **Copy Logs** from Logcat window

---

## 🔍 WHAT TO LOOK FOR IN LOGS

### Successful Flow Should Show:

```
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔧 FIREBASE INITIALIZATION STARTING
║ Environment: PLAY_STORE_PRODUCTION
║ Package: in.pulsemateconnect.patient
╚═══════════════════════════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE SUCCESS - FIREBASE INITIALIZATION
╚═══════════════════════════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════════════════════════
║ 📱 SEND OTP - STARTING
║ Environment: PLAY_STORE_PRODUCTION
║ Phone Number: +91XXXXXXXXXX
╚═══════════════════════════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════════════════════════
║ 🚀 CALLING signInWithPhoneNumber
╚═══════════════════════════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ FIREBASE SUCCESS - SEND OTP - signInWithPhoneNumber SUCCESS
║ verificationId: XXXXXXXXXX
╚═══════════════════════════════════════════════════════════════════════════════
```

### Failed Flow Will Show:

```
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE ERROR - SEND OTP - signInWithPhoneNumber FAILED
║ ❌ ERROR DETAILS:
║ ├─ Name: FirebaseError
║ ├─ Code: auth/captcha-check-failed  ← THIS IS THE KEY INFO
║ ├─ Message: ...
║ 📚 Stack Trace:
║    [Full stack trace here]
║ 🔍 Full Error Object:
║    [Complete error details]
╚═══════════════════════════════════════════════════════════════════════════════
```

---

## 🎯 KEY ERROR CODES TO IDENTIFY

| Error Code | Meaning | Root Cause |
|------------|---------|------------|
| `auth/invalid-app-credential` | SHA fingerprint mismatch | Google Play re-signed app with different cert |
| `auth/captcha-check-failed` | reCAPTCHA verification failed | Web SDK cannot invoke native attestation |
| `auth/app-not-authorized` | App not registered | Package name or SHA not in Firebase Console |
| `auth/network-request-failed` | Network issue | Internet connectivity or Firebase API down |
| `auth/internal-error` | Firebase SDK internal error | SDK incompatibility with environment |
| `auth/too-many-requests` | Rate limited | Too many OTP attempts |

---

## 📋 TESTING CHECKLIST

### Before Deploying to Play Store:

- [ ] Comprehensive logging added to `firebase.js`
- [ ] Built new version with logging
- [ ] Tested in development (logs appear correctly)
- [ ] Version number incremented

### After Installing from Play Store:

- [ ] Device connected via USB
- [ ] ADB working (`adb devices` shows device)
- [ ] Started log capture (`adb logcat -s ReactNativeJS:V`)
- [ ] Opened app from Play Store (not sideloaded)
- [ ] Attempted OTP flow
- [ ] Captured complete logs
- [ ] Saved logs to file
- [ ] Searched for error codes

### Log Analysis:

- [ ] Found initialization logs
- [ ] Found "SEND OTP - STARTING" log
- [ ] Found "CALLING signInWithPhoneNumber" log
- [ ] Identified if success or error
- [ ] If error: extracted error code
- [ ] If error: extracted full error message
- [ ] If error: captured stack trace

---

## 🚀 NEXT STEPS AFTER GETTING LOGS

### If Logs Show `auth/captcha-check-failed`:

**Conclusion:** Firebase Web SDK cannot perform native attestation in production.

**Solution:** Migrate to React Native Firebase (native SDK).

### If Logs Show `auth/invalid-app-credential` or `auth/app-not-authorized`:

**Conclusion:** SHA fingerprint mismatch.

**Solution:** 
1. Get Google Play signing certificate from Play Console
2. Add it to Firebase Console
3. Rebuild and test

### If Logs Show `auth/network-request-failed`:

**Conclusion:** Network or connectivity issue.

**Solution:**
1. Check device internet
2. Try different network
3. Check Firebase status page

### If Logs Show SUCCESS but No SMS:

**Conclusion:** Firebase OTP sent but SMS delivery failed.

**Solution:**
1. Check Firebase Console SMS quota
2. Verify phone number is valid
3. Check carrier SMS blocking

### If NO Logs Appear:

**Conclusion:** Logging not working or app crashed before logging.

**Solution:**
1. Check if app opens at all
2. Look for crash logs in `adb logcat` (without filter)
3. Check Play Console Vitals for crashes

---

## 📄 LOG FILE LOCATIONS

### Development (Expo Go):
- Logs appear in Metro bundler console
- Logs appear in terminal running `npm start`

### Development Build (EAS):
- USB: `adb logcat -s ReactNativeJS:V`
- Android Studio: Logcat panel

### Play Store Production:
- **ONLY accessible via USB debugging**
- Command: `adb logcat -s ReactNativeJS:V chromium:V`
- Output file: `firebase_logs.txt`

---

## ⚠️ IMPORTANT NOTES

1. **USB Debugging Must Be Enabled** - Production apps cannot access logs without USB debugging

2. **Logs Are Not Persisted** - React Native console.log() does NOT save to file automatically

3. **ADB Required** - Only way to get logs from installed apps

4. **Play Console Vitals** - Only shows CRASHES, not console logs

5. **Remote Logging** - If you need logs from users who can't use USB, implement Sentry or custom logging

6. **Performance Impact** - Extensive logging may slightly slow down the app (negligible in this case)

---

## 🔧 TROUBLESHOOTING

### "adb: command not found"

**Solution:**
1. Install Android SDK Platform Tools
2. Add to PATH: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`

### "device unauthorized"

**Solution:**
1. Check phone screen for USB debugging authorization popup
2. Tap "Allow"
3. Run `adb devices` again

### "No logs appearing"

**Solution:**
1. Use: `adb logcat` (without filters) to see ALL logs
2. Look for "PulseMate" or "pulsemateconnect"
3. Try: `adb logcat | findstr Firebase`

### "Too many logs"

**Solution:**
1. Clear old logs: `adb logcat -c`
2. Use specific filters: `adb logcat -s ReactNativeJS:V`
3. Redirect to file: `> firebase_logs.txt`

---

## 📞 WHAT TO DO WITH LOGS

After capturing logs:

1. **Save to File:**
   ```cmd
   adb logcat -s ReactNativeJS:V > production_test_logs.txt
   ```

2. **Search for Key Sections:**
   - Search for: `FIREBASE ERROR`
   - Search for: `error.code`
   - Search for: `signInWithPhoneNumber`

3. **Extract Error Code:**
   - Look for: `║ ├─ Code: auth/XXXXX`
   - This is the root cause identifier

4. **Share Logs:**
   - If seeking help, share the complete error block
   - Include environment information
   - Include device details

---

## ✅ EXPECTED OUTCOME

After following this guide, you will have:

1. ✅ **Detailed logs** from Play Store production build
2. ✅ **Exact error code** (if OTP fails)
3. ✅ **Environment information** (confirming it's Play Store build)
4. ✅ **Evidence-based diagnosis** (not assumptions)
5. ✅ **Clear path forward** (fix config or migrate)

**This will definitively prove whether the issue is SDK incompatibility or configuration.**

---

**Status:** ✅ Comprehensive logging implemented  
**File:** `src/config/firebase.js`  
**Next Step:** Build new version and test in Play Store with USB debugging
