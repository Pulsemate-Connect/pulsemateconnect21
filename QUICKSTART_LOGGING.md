# Quick Start: Capture Production Logs

This is a **5-minute guide** to capture Firebase Phone Authentication logs from your Play Store-installed app.

## Prerequisites (One-Time Setup)

1. **Enable USB Debugging on Your Android Phone:**
   ```
   Settings → About Phone → Tap "Build Number" 7 times (Developer mode enabled)
   Settings → System → Developer Options → Enable "USB Debugging"
   ```

2. **Install adb (if not already installed):**
   - **Already have Android Studio?** adb is at:
     ```
     C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools\adb.exe
     ```
     Add this folder to your Windows PATH.
   
   - **Don't have Android Studio?** Download standalone:
     https://developer.android.com/tools/releases/platform-tools
     Extract and add folder to PATH, or run from that folder.

3. **Verify adb works:**
   ```bash
   adb version
   ```
   Should show version number.

## Capture Logs (Every Time)

### Windows: Use the Automated Script

1. **Connect your Android phone via USB**

2. **Double-click:** `capture-firebase-logs.bat`

3. **Follow on-screen instructions:**
   - Open PulseMate Connect app
   - Try to login (enter phone → send OTP → verify OTP)
   - Wait for success or error
   - Press Ctrl+C in the command window

4. **Log file opens automatically** in Notepad

### Manual Method (Windows/Mac/Linux)

1. **Connect phone via USB**

2. **Clear old logs:**
   ```bash
   adb logcat -c
   ```

3. **Start capturing:**
   ```bash
   adb logcat -v time ReactNativeJS:V chromium:V *:E > firebase-logs.txt
   ```

4. **Reproduce the issue** in the app

5. **Stop capture:** Press Ctrl+C

6. **Open log file:**
   ```bash
   notepad firebase-logs.txt     # Windows
   open firebase-logs.txt        # Mac
   cat firebase-logs.txt         # Linux
   ```

## What to Look For in Logs

Search for these patterns to find relevant information:

### 🔴 **Errors** (Most Important)
```
Search for: "FIREBASE ERROR" or "🔴"
```

Example:
```
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 FIREBASE ERROR - SEND OTP - signInWithPhoneNumber FAILED
╠═══════════════════════════════════════════════════════════════════════════════
║ ❌ ERROR DETAILS:
║ ├─ Code: auth/invalid-app-credential
║ ├─ Message: App verification failed. SHA-256 not registered.
```

### 🌍 **Environment Information**
```
Search for: "Environment:"
```

Shows if running as:
- `EXPO_GO` - Development in Expo Go
- `DEVELOPMENT_BUILD` - Development build
- `PLAY_STORE_PRODUCTION` - Production from Play Store ✓

### 📦 **Package Name**
```
Search for: "Package:"
```

Should show: `in.pulsemateconnect.patient`

### 🔑 **Firebase Error Codes**
```
Search for: "auth/"
```

Common production issues:
- `auth/invalid-app-credential` = SHA-256 not registered
- `auth/app-not-authorized` = Package name not registered  
- `auth/too-many-requests` = Rate limited
- `auth/invalid-phone-number` = Phone format wrong
- `auth/code-expired` = OTP timeout (>120 seconds)

### ⏱️ **Timing Issues**
```
Search for: "Time Since OTP Sent:"
```

If > 120 seconds → OTP expired, need to resend

## Common Production Issues & Solutions

### Issue 1: "App verification failed" or "invalid-app-credential"

**Cause:** SHA-256 fingerprint not registered in Firebase Console

**Solution:**
1. Get production SHA-256:
   ```bash
   keytool -list -v -keystore path/to/your/keystore.jks -alias your-key-alias
   ```

2. Add to Firebase Console:
   - Go to: https://console.firebase.google.com
   - Select your project
   - Project Settings → Your apps → Android app
   - Scroll to "SHA certificate fingerprints"
   - Click "Add fingerprint"
   - Paste SHA-256
   - Save

3. Wait 5-10 minutes for propagation

### Issue 2: "Package name not registered" or "app-not-authorized"

**Cause:** Package name in app doesn't match Firebase Console

**Check logs for:**
```
║ 🆔 Package: in.pulsemateconnect.patient
```

**Solution:**
1. Verify package in Firebase Console matches exactly
2. Check `app.json` → `android.package`
3. Rebuild app if package changed

### Issue 3: OTP never arrives

**Check logs for:**
```
║ ✅ SEND OTP SUCCESS
║ 🔑 Verification ID: ABC123...
```

- If you see success → OTP was sent by Firebase
- If you see error → Check error code in logs
- If OTP sent but not received → Check phone SMS/network

### Issue 4: OTP verification fails with "code-expired"

**Check logs for:**
```
║ ⏱️  Time Since OTP Sent: 125.5 seconds
```

**Cause:** User took >120 seconds to enter OTP

**Solution:** Request new OTP (tap "Resend")

## Sharing Logs for Support

If you need to share logs:

1. **Remove sensitive info:**
   - Phone numbers (replace with `+91*****12345`)
   - User names
   - Any personal data

2. **Share relevant sections only:**
   - Search for error messages
   - Copy 20-30 lines before and after the error
   - Include the boxed log entries with emoji icons

3. **Include environment details:**
   ```
   ║ 🌍 Environment: PLAY_STORE_PRODUCTION
   ║ 📦 Package: in.pulsemateconnect.patient
   ║ 📱 Platform: android 34
   ```

## Need More Help?

See the comprehensive guide: `FIREBASE_LOGGING_GUIDE.md`

## Troubleshooting Log Capture

### "adb: command not found"
- Install Android SDK Platform Tools
- Add to PATH or run from platform-tools folder

### "no devices/emulators found"  
- Check USB cable is connected
- Accept "Allow USB debugging?" on phone
- Try different USB port
- Run: `adb kill-server` then `adb start-server`

### Logs are empty or missing React Native entries
- Make sure app is running
- Check logcat buffer size: `adb logcat -g`
- Try capturing all logs: `adb logcat > all-logs.txt`

### Phone shows "Allow USB debugging?" but times out
- Tap "Always allow from this computer"
- Check USB cable quality (try different cable)
- Restart adb: `adb kill-server && adb start-server`

## Summary

✅ **What you did:**
- Enabled USB debugging
- Installed adb
- Captured comprehensive logs

✅ **What logs contain:**
- Every Firebase operation with timestamps
- Complete error details with codes
- Environment and package information
- Timing information for timeout debugging

✅ **How to use logs:**
- Search for "FIREBASE ERROR" or "🔴"
- Check "Environment:" to confirm production
- Look for "auth/" error codes
- Check timing for OTP expiry issues

**The logs now give you complete visibility into what's happening in your production app!**
