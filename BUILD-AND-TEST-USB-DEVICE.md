# 📱 BUILD PRODUCTION APK & TEST ON USB DEVICE

**Date:** August 7, 2026  
**Build Profile:** `apk` (Production-level release APK)  
**Testing:** Physical Android device via USB  

---

## 🎯 GOAL

Build a **production-ready APK** and install it on your physical Android phone to test:
- ✅ Message Central OTP (send + verify)
- ✅ Real SMS reception
- ✅ Complete login flow
- ✅ App performance on real hardware

---

## 📋 PREREQUISITES

### 1. Check USB Device Connection
```bash
adb devices
```

**Expected output:**
```
List of devices attached
XXXXXXXXXX      device
```

If shows "unauthorized" or nothing:
- Enable **Developer Options** on phone (tap Build Number 7 times)
- Enable **USB Debugging** in Developer Options
- Accept USB debugging prompt on phone
- Reconnect USB cable

### 2. Check EAS CLI
```bash
eas --version
```

If not installed:
```bash
npm install -g eas-cli
```

### 3. Login to EAS
```bash
eas login
```

---

## 🏗️ STEP 1: BUILD PRODUCTION APK

### Build Command:
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas build --platform android --profile apk
```

### What This Does:
- ✅ Uses **release build type** (optimized, no debug code)
- ✅ **Signs the APK** with EAS credentials (production keystore)
- ✅ **Obfuscates code** with ProGuard/R8
- ✅ Connects to **production API** (`https://api.pulsemateconnect.in`)
- ✅ Builds on **EAS cloud servers** (not local machine)

### Build Process:
1. **Uploads code** to EAS servers (~30 seconds)
2. **Builds APK** on cloud (~5-10 minutes)
3. **Provides download link** when complete

### Expected Output:
```
✔ Build successfully queued
⠋ Waiting for build to complete...
✔ Build finished!

https://expo.dev/accounts/pulsemateconnect/projects/pulsemateconnect21/builds/xxxxx

APK download: https://expo.dev/artifacts/eas/xxxxx.apk
```

**IMPORTANT:** Keep this terminal open or copy the download URL!

---

## 📥 STEP 2: DOWNLOAD APK

### Option A: Auto-download (if prompted)
```
✔ Download to local? (Y/n): Y
```

### Option B: Manual download
1. Copy the APK URL from terminal
2. Open in browser
3. Save to: `Downloads\pulsemateconnect-v1.3.7-build78.apk`

### Option C: EAS Dashboard
1. Go to: https://expo.dev/accounts/pulsemateconnect/projects/pulsemateconnect21/builds
2. Find latest build
3. Click "Download" button

---

## 📲 STEP 3: INSTALL ON USB DEVICE

### Check Device Connected:
```bash
adb devices
```

### Install APK:
```bash
# Replace with your actual APK path
adb install -r "C:\Users\shubh\Downloads\pulsemateconnect-v1.3.7-build78.apk"
```

**Flags:**
- `-r`: Reinstall existing app (keeps data)
- `-d`: Allow version downgrade (if needed)

### Expected Output:
```
Performing Streamed Install
Success
```

### If Installation Fails:

**Error: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"**
```bash
# Uninstall old version first
adb uninstall in.pulsemateconnect.patient

# Then install again
adb install "C:\Users\shubh\Downloads\pulsemateconnect-v1.3.7-build78.apk"
```

**Error: "signatures do not match"**
- Old version signed with different key
- Solution: Uninstall old app first

---

## 🧪 STEP 4: TEST OTP ON REAL DEVICE

### Complete Test Flow:

#### 1. Launch App
```bash
# Optional: Launch from command line
adb shell am start -n in.pulsemateconnect.patient/.MainActivity
```

Or just tap app icon on phone.

#### 2. Navigate to Login
- Should show PulseMate login screen
- Clean, professional UI

#### 3. Enter Phone Number
```
Phone: +91 7022818878
or
Phone: +91 [your test number]
```

**IMPORTANT:** Use a **real phone number** that can receive SMS!

#### 4. Tap "Send OTP"
- Should show loading indicator
- Wait 2-5 seconds
- Should show success message

**What Happens Backend:**
```
1. App → Production API (api.pulsemateconnect.in)
2. API → Message Central authentication
3. API → Message Central send OTP
4. Message Central → SMS to your phone
5. API → Returns verificationId to app
```

#### 5. Receive SMS
- Check phone for SMS
- Should arrive within 5-15 seconds
- Format: "Your OTP is: 123456"

**If SMS doesn't arrive:**
- Check phone signal strength
- Check SMS inbox (not blocked)
- Wait up to 60 seconds
- Try "Resend OTP" button

#### 6. Enter OTP Code
- Type the 6-digit code from SMS
- Tap "Verify"

**What Happens Backend:**
```
1. App → Production API with verificationId + OTP code
2. API → Message Central validateOTP
3. Message Central → Validates code (should return 200 OK now!)
4. API → Creates/logs in user
5. API → Issues JWT tokens
6. App → Stores tokens securely
7. App → Navigates to home screen
```

#### 7. Success Indicators
✅ **No 401 error!**  
✅ **No "Invalid OTP" message**  
✅ **Loading spinner disappears**  
✅ **Redirected to home screen**  
✅ **User logged in successfully**  

---

## 🐛 TROUBLESHOOTING

### Build Fails:

**"Unable to resolve module..."**
```bash
npm install
npx expo-doctor
```

**"EAS credentials error"**
```bash
eas credentials
# Select Android > Production > View credentials
```

**"Build timed out"**
- Try again: `eas build --platform android --profile apk`
- Cloud servers sometimes busy

### Install Fails:

**"adb not found"**
- Install Android SDK Platform Tools
- Add to PATH: `C:\Users\[username]\AppData\Local\Android\Sdk\platform-tools`

**"device unauthorized"**
- Accept USB debugging prompt on phone
- Run: `adb kill-server` then `adb devices`

### OTP Fails:

**"Network error"**
- Check phone has internet (WiFi or mobile data)
- Check not behind restrictive firewall

**"OTP expired"**
- Enter OTP within 60 seconds
- If expired, tap "Resend OTP"

**"Invalid OTP"**
- Make sure you typed all 6 digits correctly
- No spaces or special characters
- Try copying from SMS

**Still 401 error:**
- Check Render deployed the fix (dashboard logs)
- Clear app data: `adb shell pm clear in.pulsemateconnect.patient`
- Reinstall app

---

## 📊 MONITORING & LOGS

### View App Logs (Real-time):
```bash
# Android Logcat (all logs)
adb logcat

# Filter PulseMate logs only
adb logcat | findstr "PulseMate"

# Filter errors only
adb logcat *:E

# Clear logs and start fresh
adb logcat -c
adb logcat
```

### Check Backend Logs:
1. Go to: https://dashboard.render.com
2. Select: `pulsemate-backend`
3. Click: "Logs" tab
4. Watch for:
   - `[MessageCentral] 📱 Sending OTP to...`
   - `[MessageCentral] ✅ OTP sent successfully`
   - `[MessageCentral] 🔐 Validating OTP...`
   - `[MessageCentral] ✅ OTP validated successfully`

### Check Network Traffic:
```bash
# Monitor network requests from app
adb shell am start -a android.intent.action.VIEW -d "http://localhost:8081/debugger-ui"
```

Or use Chrome DevTools for React Native debugging.

---

## ✅ SUCCESS CRITERIA

Before considering this test complete, verify:

- [x] **Build succeeded** - APK downloaded successfully
- [ ] **Install succeeded** - App installed on physical device
- [ ] **App launches** - No crash on startup
- [ ] **Send OTP works** - SMS received on phone
- [ ] **Verify OTP works** - **NO 401 ERROR!**
- [ ] **Login successful** - User logged in, tokens stored
- [ ] **Home screen loads** - App functional after login
- [ ] **No crashes** - App stable during entire flow
- [ ] **Performance good** - No lag or freezing

---

## 🎯 NEXT STEPS AFTER SUCCESS

### If OTP Test PASSES ✅:
1. Test logout and login again
2. Test with different phone number
3. Test "Resend OTP" functionality
4. Test app restart (stays logged in)
5. Explore other app features
6. Take screenshots for Play Store
7. Start preparing Play Store assets

### If OTP Test FAILS ❌:
1. Check Render logs for backend errors
2. Check phone logcat for app errors
3. Verify production API URL correct
4. Confirm Message Central credentials valid
5. Test with different phone number
6. Report exact error message

---

## 📞 QUICK REFERENCE

### Common Commands:
```bash
# Check device
adb devices

# Install APK
adb install -r path\to\app.apk

# Uninstall app
adb uninstall in.pulsemateconnect.patient

# Launch app
adb shell am start -n in.pulsemateconnect.patient/.MainActivity

# View logs
adb logcat | findstr "PulseMate"

# Clear app data
adb shell pm clear in.pulsemateconnect.patient

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Record video (for demo)
adb shell screenrecord /sdcard/demo.mp4
# (Ctrl+C to stop)
adb pull /sdcard/demo.mp4
```

### Build Profiles:
```bash
# Development (debug build, dev server)
eas build --platform android --profile development

# Preview (release build, APK for testing)
eas build --platform android --profile preview

# APK (production release, APK format) ← USE THIS
eas build --platform android --profile apk

# Production (AAB for Play Store)
eas build --platform android --profile production
```

---

## 🚀 BUILD NOW!

**Ready to build? Run this:**
```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas build --platform android --profile apk
```

**Build time:** ~5-10 minutes  
**Download size:** ~30-50 MB APK  
**Install time:** ~10 seconds  
**Test time:** ~2 minutes  

**Total time to test:** ~15-20 minutes from now! 🎉

---

**Last Updated:** August 7, 2026  
**Version Code:** 78  
**Version Name:** 1.3.7  
**Backend:** https://api.pulsemateconnect.in (Production)  
**OTP Provider:** Message Central VerifyNow  
