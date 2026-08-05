# 🚀 BUILD AAB & RUN LOCALLY - STEP BY STEP

## ═══════════════════════════════════════════════════════════════════════════════
## COMPLETE WORKFLOW
## ═══════════════════════════════════════════════════════════════════════════════

This guide shows you how to:
1. Build production AAB file
2. Convert AAB to APK
3. Install and test locally on your device

**Time Required:** 30-40 minutes total

---

## ═══════════════════════════════════════════════════════════════════════════════
## STEP 1: LOGIN TO EAS (if not already) - 2 minutes
## ═══════════════════════════════════════════════════════════════════════════════

### Check if logged in:

```bash
eas whoami
```

**Expected output:**
```
pulsemateconnecttt
ramnathdurgadevienterprise@gmail.com

Accounts:
• pulsemateconnecttt (Role: Owner)
```

### If not logged in:

```bash
eas login
```

Enter:
- **Email:** ramnathdurgadevienterprise@gmail.com
- **Password:** [your password]

---

## ═══════════════════════════════════════════════════════════════════════════════
## STEP 2: BUILD PRODUCTION AAB - 20-30 minutes
## ═══════════════════════════════════════════════════════════════════════════════

### Option A: Use Batch Script (Easiest)

```bash
Double-click: BUILD-AAB-FIXED.bat
```

This will:
1. ✅ Check you're logged in
2. ✅ Start build on EAS servers
3. ✅ Give you build ID
4. ✅ Can close window (build continues)

### Option B: Manual Command

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas build --profile production --platform android
```

### What Happens:

1. **Uploads project** to EAS servers
2. **Builds AAB** on cloud (Android App Bundle)
3. **Signs with keystore** (yKf5TaJ1Kx)
4. **Takes 20-30 minutes**
5. **Sends email** when complete

### While Waiting:

- ✅ You can close terminal
- ✅ Build continues on server
- ✅ Check status: `eas build:list`
- ✅ You'll get email notification

---

## ═══════════════════════════════════════════════════════════════════════════════
## STEP 3: CHECK BUILD STATUS - 1 minute
## ═══════════════════════════════════════════════════════════════════════════════

### Use Script:

```bash
Double-click: CHECK-BUILD-STATUS.bat
```

### Or Manually:

```bash
eas build:list --platform android --limit 5
```

### Build States:

| Status | Meaning | Action |
|--------|---------|--------|
| ⏳ IN_QUEUE | Waiting to start | Wait |
| 🔨 IN_PROGRESS | Building now | Wait (10-20 min) |
| ✅ FINISHED | Complete | Download! |
| ❌ ERRORED | Failed | Check logs |

---

## ═══════════════════════════════════════════════════════════════════════════════
## STEP 4: DOWNLOAD AAB - 2 minutes
## ═══════════════════════════════════════════════════════════════════════════════

### When Build Shows "FINISHED":

```bash
eas build:download --platform android --latest
```

This downloads:
- **File:** `pulsemate-latest.aab` (or similar name)
- **Size:** ~40-60 MB
- **Location:** Current directory

### Verify Download:

```bash
dir *.aab
```

You should see your AAB file listed.

---

## ═══════════════════════════════════════════════════════════════════════════════
## STEP 5: CONVERT AAB TO APK - 3 minutes
## ═══════════════════════════════════════════════════════════════════════════════

### Why Convert?

AAB files cannot be installed directly. They must be:
- Uploaded to Play Store (for production)
- OR converted to APK (for local testing)

### Use Conversion Script:

```bash
Double-click: CONVERT-AAB-TO-APK.bat
```

### What It Does:

1. ✅ Downloads bundletool (if needed)
2. ✅ Converts AAB to universal APK
3. ✅ Extracts APK file
4. ✅ Creates: `pulsemate-production-fixed.apk`

### Manual Conversion (Advanced):

```bash
# Download bundletool
curl -L https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar -o bundletool.jar

# Convert AAB to APKs
java -jar bundletool.jar build-apks ^
  --bundle=pulsemate-latest.aab ^
  --output=pulsemate.apks ^
  --mode=universal

# Extract universal APK
powershell -Command "Expand-Archive -Path 'pulsemate.apks' -DestinationPath 'apks-temp' -Force"
copy apks-temp\universal.apk pulsemate-production-fixed.apk

# Cleanup
rmdir /s /q apks-temp
del pulsemate.apks
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## STEP 6: INSTALL ON DEVICE - 2 minutes
## ═══════════════════════════════════════════════════════════════════════════════

### Prerequisites:

1. ✅ Connect phone via USB
2. ✅ Enable USB Debugging:
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Settings → Developer Options
   - Enable "USB Debugging"
3. ✅ Allow USB debugging popup on phone

### Install Using Script:

```bash
Double-click: INSTALL-APK-USB.bat
```

### Or Install Manually:

```bash
# Check device connected
adb devices

# Should show your device
# If not, check USB connection and debugging

# Install APK
adb install -r pulsemate-production-fixed.apk

# -r flag: reinstall (keeps app data)
```

### If ADB Not Found:

Install Android Studio:
https://developer.android.com/studio

Or install ADB standalone:
https://developer.android.com/studio/releases/platform-tools

---

## ═══════════════════════════════════════════════════════════════════════════════
## STEP 7: TEST THE APP - 5 minutes
## ═══════════════════════════════════════════════════════════════════════════════

### Critical Tests:

**1. App Startup:**
- [ ] App opens without crash
- [ ] **NO "Initialization Error" alert** ⭐⭐⭐
- [ ] Welcome screen loads
- [ ] Smooth navigation

**2. Console Logs (while connected via USB):**
```bash
adb logcat | findstr "PulseMate"
```

Should see:
```
✅ [Auth] Backend SMS Auth ready
✅ [Auth] Backend API: https://api.pulsemateconnect.in/api
```

Should NOT see:
```
❌ Firebase JS SDK Initialization error
❌ getAuth() returned: undefined
```

**3. OTP Flow:**
- [ ] Navigate to Login screen
- [ ] Enter phone: +91XXXXXXXXXX
- [ ] Tap "Send OTP"
- [ ] Backend SMS logs appear
- [ ] SMS arrives (if backend running)
- [ ] Can enter OTP
- [ ] Successful login

**4. Error Handling:**
- [ ] Invalid phone → Shows error
- [ ] Network error → User-friendly message
- [ ] No crashes during navigation

---

## ═══════════════════════════════════════════════════════════════════════════════
## COMPLETE AUTOMATED WORKFLOW
## ═══════════════════════════════════════════════════════════════════════════════

### All-in-One Script:

```bash
Double-click: DOWNLOAD-AND-CONVERT-AAB.bat
```

This will:
1. ✅ Check recent builds
2. ✅ Download latest AAB
3. ✅ Convert to APK
4. ✅ Ready to install

Then:
```bash
Double-click: INSTALL-APK-USB.bat
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════════════════════════════════════════════════

### Build Failed - "Entity not authorized"

**Problem:** Not logged in with correct account

**Solution:**
```bash
eas logout
eas login
# Enter: ramnathdurgadevienterprise@gmail.com
```

### Build Failed - Other Error

**Solution:**
```bash
# View build logs
eas build:view [BUILD_ID]

# Check error message
# Common issues:
# - google-services.json invalid
# - Package name mismatch
# - Gradle build error
```

### Download Failed

**Problem:** Build not complete yet

**Solution:**
```bash
# Check status
eas build:list

# Wait until status is "FINISHED"
# Then download again
```

### Conversion Failed - Java Not Found

**Problem:** Java not installed

**Solution:**
```bash
# Check Java
java -version

# If not found, install JDK:
# https://www.oracle.com/java/technologies/downloads/
```

### Install Failed - Device Not Found

**Problem:** USB debugging not enabled or device not connected

**Solution:**
```bash
# Check device connection
adb devices

# If empty:
# 1. Check USB cable
# 2. Enable USB debugging
# 3. Allow USB debugging popup on phone
# 4. Try different USB port
```

### Install Failed - Signature Mismatch

**Problem:** Old version installed with different signature

**Solution:**
```bash
# Uninstall old version first
adb uninstall in.pulsemateconnect.patient

# Then install new version
adb install -r pulsemate-production-fixed.apk
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## KEYSTONE INFORMATION (IMPORTANT)
## ═══════════════════════════════════════════════════════════════════════════════

### Your Production Keystore:

**EAS Credentials:** yKf5TaJ1Kx

```
SHA256: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

### ⚠️ CRITICAL: Add to Firebase

**For Firebase Phone Auth to work in production:**

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Select Android app
3. Click "Add fingerprint"
4. Paste SHA256 above
5. Save changes
6. Download new `google-services.json`
7. **Rebuild AAB** with new google-services.json

---

## ═══════════════════════════════════════════════════════════════════════════════
## QUICK REFERENCE
## ═══════════════════════════════════════════════════════════════════════════════

```bash
# Login to EAS
eas login

# Build production AAB
eas build --profile production --platform android

# Check build status
eas build:list

# Download AAB
eas build:download --platform android --latest

# Convert to APK
# Double-click: CONVERT-AAB-TO-APK.bat

# Install on device
# Double-click: INSTALL-APK-USB.bat

# OR manual install
adb install -r pulsemate-production-fixed.apk

# View logs
adb logcat | findstr "PulseMate"
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## FILES & SCRIPTS
## ═══════════════════════════════════════════════════════════════════════════════

**Build Scripts:**
- ✅ `BUILD-AAB-FIXED.bat` - Build AAB workflow
- ✅ `CHECK-BUILD-STATUS.bat` - Check build status
- ✅ `DOWNLOAD-AND-CONVERT-AAB.bat` - Download + convert
- ✅ `CONVERT-AAB-TO-APK.bat` - Convert AAB to APK
- ✅ `INSTALL-APK-USB.bat` - Install APK via USB

**Documentation:**
- ✅ `AAB-BUILD-RUN-LOCALLY.md` - This guide
- ✅ `BUILD-AAB-COMPLETE-GUIDE.md` - Detailed guide
- ✅ `KEYSTORE-INFO.md` - Keystore details
- ✅ `CURRENT-STATUS.txt` - Current status

---

## ✅ SUCCESS CHECKLIST

- [ ] Logged in to EAS
- [ ] Build submitted (20-30 min)
- [ ] Build status: FINISHED
- [ ] AAB downloaded
- [ ] Converted to APK
- [ ] Installed on device
- [ ] App opens without error
- [ ] NO "Initialization Error" ✅
- [ ] OTP flow works
- [ ] Ready for Play Store

---

**Time:** 30-40 minutes total  
**Result:** Production AAB file tested locally  
**Next:** Upload to Play Store for deployment
