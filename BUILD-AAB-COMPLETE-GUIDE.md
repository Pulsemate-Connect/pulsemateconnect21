# 🔨 BUILD AAB + LOCAL TESTING - COMPLETE GUIDE

## ═══════════════════════════════════════════════════════════════════════════════
## CURRENT BUILD STATUS
## ═══════════════════════════════════════════════════════════════════════════════

✅ **APK Build:** In Progress (terminal 3)  
⏳ **AAB Build:** Permission issue (need to fix account)  
✅ **Fix Applied:** YES  
✅ **Code Pushed:** YES

---

## ═══════════════════════════════════════════════════════════════════════════════
## OPTION 1: BUILD AAB VIA EAS (Recommended)
## ═══════════════════════════════════════════════════════════════════════════════

### Step 1: Check Account Access

```bash
# Check who you're logged in as
eas whoami

# Should show:
# pulsemateconnecttt
# Owner of: pulsemateconnecttt, pulsemateconnecttts-team
```

### Step 2: Build Production AAB

```bash
# Build AAB on EAS servers (20-30 minutes)
eas build --profile production --platform android

# Monitor build
eas build:list

# Check specific build
eas build:view <BUILD_ID>
```

### Step 3: Wait for Build

Build takes 20-30 minutes. You'll receive:
- Email notification when complete
- Build ID for tracking

### Step 4: Download AAB

```bash
# Download latest build
eas build:download --platform android --latest

# Or download specific build
eas build:download --id <BUILD_ID>

# File will be saved as: pulsemate-latest.aab
```

### Step 5: Convert AAB to APK

```bash
# Use the conversion script
Double-click: CONVERT-AAB-TO-APK.bat

# This will:
# 1. Download bundletool (if needed)
# 2. Convert AAB to universal APK
# 3. Extract APK: pulsemate-production-fixed.apk
```

### Step 6: Install on Device

```bash
# Connect phone via USB
# Enable USB debugging

# Install APK
Double-click: INSTALL-APK-USB.bat

# Or manually:
adb install -r pulsemate-production-fixed.apk
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## OPTION 2: WAIT FOR APK BUILD (Faster)
## ═══════════════════════════════════════════════════════════════════════════════

**Current Status:** APK build in progress (terminal 3)

### What's Building:

- **Profile:** apk (release APK)
- **Platform:** Android
- **Time:** 15-20 minutes
- **Output:** Ready-to-install APK file

### When Complete:

1. ✅ APK file downloaded automatically
2. ✅ No conversion needed
3. ✅ Install directly: `INSTALL-APK-USB.bat`

---

## ═══════════════════════════════════════════════════════════════════════════════
## OPTION 3: TEST WITH CURRENT RUNNING APP (Fastest)
## ═══════════════════════════════════════════════════════════════════════════════

**Metro server is still running!**

### Quick Test Now:

1. Open Expo Go app on your phone
2. Scan QR code from terminal (terminal 2)
3. App loads with fix applied ✅
4. Test immediately!

**This is the FASTEST way to verify the fix works!**

---

## ═══════════════════════════════════════════════════════════════════════════════
## KEYSTORE INFORMATION (Important for Firebase)
## ═══════════════════════════════════════════════════════════════════════════════

### Your Production Keystore:

**EAS Build Credentials:** yKf5TaJ1Kx

```
Type:        JKS
Key Alias:   f1a185ee3a5ba7802fd6698297601ca8
Updated:     4 days ago

MD5:         D7:00:F6:FD:7E:64:82:11:51:E4:86:2C:36:2B:91:6F
SHA1:        0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA256:      83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

### ⚠️ CRITICAL: Add SHA256 to Firebase

**For Firebase Phone Auth to work in production:**

1. Go to Firebase Console: https://console.firebase.google.com/project/pulsemateconnect/settings/general

2. Scroll to "Your apps" → Select Android app

3. Click "Add fingerprint"

4. Paste SHA256:
   ```
   83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
   ```

5. Save and download new `google-services.json`

6. **Important:** Rebuild after updating google-services.json

---

## ═══════════════════════════════════════════════════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════════════════════════════════════════════════

### "Entity not authorized" Error

**Problem:** Not logged in with correct Expo account

**Solution:**
```bash
# Check current account
eas whoami

# If wrong account, login again
eas logout
eas login

# Enter credentials:
# Email: ramnathdurgadevienterprise@gmail.com
# Password: [your password]
```

### Permission Denied

**Problem:** Not owner of the project

**Solution:**
```bash
# Check app.json for project ID
# projectId: "31fca56b-a99e-4219-bb3f-600d8b0c86b7"

# Make sure you're logged in as the owner
eas whoami

# Should show:
# • pulsemateconnecttt (Role: Owner)
```

### Build Stuck/Slow

**Problem:** EAS build queue or network issues

**Solutions:**
1. Check build status: `eas build:list`
2. Cancel and retry: `eas build:cancel`, then rebuild
3. Use local APK build (faster for testing)

---

## ═══════════════════════════════════════════════════════════════════════════════
## RECOMMENDED WORKFLOW
## ═══════════════════════════════════════════════════════════════════════════════

### Phase 1: Quick Test (NOW) ⏰ 2 minutes

```
1. Metro is running (terminal 2)
2. Scan QR code with Expo Go
3. Verify fix works ✅
```

### Phase 2: APK Test (LATER) ⏰ 20 minutes

```
1. Wait for APK build (terminal 3)
2. Download APK when ready
3. Install: INSTALL-APK-USB.bat
4. Test production build ✅
```

### Phase 3: AAB for Play Store (TOMORROW) ⏰ 30 minutes

```
1. Fix account permissions
2. Build AAB: eas build --profile production
3. Download when ready
4. Upload to Play Store ✅
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## FILES & SCRIPTS
## ═══════════════════════════════════════════════════════════════════════════════

**Build Scripts:**
- ✅ `BUILD-AAB-AND-TEST.bat` - Full AAB workflow
- ✅ `DOWNLOAD-AND-CONVERT-AAB.bat` - Download + convert
- ✅ `CONVERT-AAB-TO-APK.bat` - AAB to APK conversion
- ✅ `INSTALL-APK-USB.bat` - Install APK via USB

**Documentation:**
- ✅ `BUILD-AAB-COMPLETE-GUIDE.md` - This file
- ✅ `KEYSTORE-INFO.md` - Keystore details
- ✅ `TEST-OPTIONS.md` - All testing options

**Current Builds:**
- ⏳ APK (terminal 3) - In progress
- ❌ AAB (terminal 4) - Permission error
- ✅ Metro server (terminal 2) - Running

---

## ═══════════════════════════════════════════════════════════════════════════════
## QUICK COMMANDS
## ═══════════════════════════════════════════════════════════════════════════════

```bash
# Check who you're logged in as
eas whoami

# List recent builds
eas build:list

# Build production AAB
eas build --profile production --platform android

# Download latest build
eas build:download --platform android --latest

# Convert AAB to APK
# Double-click: CONVERT-AAB-TO-APK.bat

# Install APK
# Double-click: INSTALL-APK-USB.bat

# Check running processes
# Terminal 2: Metro server (Expo Go testing)
# Terminal 3: APK build (in progress)
# Terminal 4: AAB build (failed - permission issue)
```

---

## 🎯 WHAT TO DO NOW

### Recommended: Option 1 (Fastest)
**Use Expo Go to test NOW** (2 minutes)
- Metro is already running
- Just scan QR code
- Verify fix works

### Then: Option 2 (Later Today)
**Wait for APK build** (20 minutes)
- Build is in progress
- Will auto-download when ready
- Production-like testing

### Finally: Option 3 (Tomorrow)
**Build AAB for Play Store** (30 minutes)
- Fix account permissions
- Build AAB
- Upload to Play Store

---

## ✅ STATUS SUMMARY

| Item | Status | Action |
|------|--------|--------|
| Fix Applied | ✅ DONE | - |
| Code Pushed | ✅ DONE | - |
| Metro Running | ✅ RUNNING | Scan QR code to test |
| APK Build | ⏳ IN PROGRESS | Wait 10-15 min |
| AAB Build | ❌ FAILED | Fix permissions |
| Local Testing | ✅ READY | Use Expo Go |

**Next Step:** Scan QR code with Expo Go app to test NOW! 📱
