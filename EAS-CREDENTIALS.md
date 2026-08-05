# 🔐 EAS BUILD CREDENTIALS

## ═══════════════════════════════════════════════════════════════════════════════
## EAS ACCOUNT INFORMATION
## ═══════════════════════════════════════════════════════════════════════════════

**Account Owner:** pulsemateconnecttt  
**Email:** ramnathdurgadevienterprise@gmail.com  
**Project ID:** 31fca56b-a99e-4219-bb3f-600d8b0c86b7  
**Package Name:** in.pulsemateconnect.patient

---

## ═══════════════════════════════════════════════════════════════════════════════
## PRODUCTION KEYSTORE
## ═══════════════════════════════════════════════════════════════════════════════

**Configuration:** Build Credentials yKf5TaJ1Kx  
**Type:** JKS (Java KeyStore)  
**Key Alias:** f1a185ee3a5ba7802fd6698297601ca8  
**Updated:** 4 days ago

### Fingerprints:

```
MD5:     D7:00:F6:FD:7E:64:82:11:51:E4:86:2C:36:2B:91:6F
SHA1:    0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA256:  83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 🔥 FIREBASE CONFIGURATION (CRITICAL)
## ═══════════════════════════════════════════════════════════════════════════════

### ⚠️ REQUIRED: Add SHA256 to Firebase Console

**For production builds to work with Firebase Phone Auth:**

#### Step 1: Go to Firebase Console
```
https://console.firebase.google.com/project/pulsemateconnect/settings/general
```

#### Step 2: Select Your Android App
- Package name: `in.pulsemateconnect.patient`

#### Step 3: Add SHA256 Fingerprint
Click "Add fingerprint" button and paste:

```
83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

#### Step 4: Save Changes
- Click "Save"
- Wait for confirmation

#### Step 5: Download New google-services.json
- Click "Download google-services.json"
- Replace the file in your project root
- Commit and push to git

#### Step 6: Rebuild
```bash
eas build --profile production --platform android
```

### Why This is Critical:

Without the SHA256 in Firebase Console:
- ❌ Firebase Phone Auth will NOT work in production
- ❌ Users will see "App not authorized" errors
- ❌ OTP SMS will not be sent
- ❌ Login will fail

With SHA256 added:
- ✅ Firebase recognizes your production build
- ✅ Phone Auth works correctly
- ✅ SMS OTP delivered successfully
- ✅ Users can login

---

## ═══════════════════════════════════════════════════════════════════════════════
## EAS LOGIN INSTRUCTIONS
## ═══════════════════════════════════════════════════════════════════════════════

### Check Current Login:

```bash
eas whoami
```

**Expected output:**
```
pulsemateconnecttt
ramnathdurgadevienterprise@gmail.com

Accounts:
• pulsemateconnecttt (Role: Owner)
• pulsemateconnecttts-team (Role: Owner)
```

### Login Command:

```bash
eas login
```

**Enter:**
- **Email:** ramnathdurgadevienterprise@gmail.com
- **Password:** [your password]

### Logout (if needed):

```bash
eas logout
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## BUILD PROFILES
## ═══════════════════════════════════════════════════════════════════════════════

### Development Build (APK):
```bash
eas build --profile development --platform android
```
- **Output:** Development APK
- **Time:** 15-20 minutes
- **Use:** Testing with dev features

### Preview Build (APK):
```bash
eas build --profile preview --platform android
```
- **Output:** Release APK
- **Time:** 15-20 minutes
- **Use:** Internal testing

### Production Build (AAB):
```bash
eas build --profile production --platform android
```
- **Output:** Production AAB
- **Time:** 20-30 minutes
- **Use:** Play Store deployment
- **Keystore:** yKf5TaJ1Kx (auto-signed)

---

## ═══════════════════════════════════════════════════════════════════════════════
## QUICK COMMANDS
## ═══════════════════════════════════════════════════════════════════════════════

```bash
# Check login status
eas whoami

# Build production AAB
eas build --profile production --platform android

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Download latest build
eas build:download --platform android --latest

# Download specific build
eas build:download --id [BUILD_ID]

# Cancel running build
eas build:cancel [BUILD_ID]

# View credentials
eas credentials

# Configure project
eas build:configure
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## KEYSTORE MANAGEMENT
## ═══════════════════════════════════════════════════════════════════════════════

### View Keystore:

```bash
eas credentials
# Select: Android
# Select: Production
# Select: Keystore
# Choose: View details
```

### Download Keystore (if needed):

```bash
eas credentials
# Select: Android
# Select: Production
# Select: Keystore
# Choose: Download
```

**File saved as:** `pulsemate-keystore.jks` (or similar)

### Keystore Details:

```
Configuration ID: yKf5TaJ1Kx
Type: JKS
Alias: f1a185ee3a5ba7802fd6698297601ca8
Password: [stored securely in EAS]
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## CONVERTING AAB TO APK FOR LOCAL TESTING
## ═══════════════════════════════════════════════════════════════════════════════

### Using Bundletool:

```bash
# Download bundletool (if not already)
curl -L https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar -o bundletool.jar

# Convert AAB to universal APK
java -jar bundletool.jar build-apks ^
  --bundle=pulsemate-latest.aab ^
  --output=pulsemate.apks ^
  --mode=universal

# Extract APK
powershell -Command "Expand-Archive -Path 'pulsemate.apks' -DestinationPath 'apks-temp' -Force"
copy apks-temp\universal.apk pulsemate-production-fixed.apk

# Cleanup
rmdir /s /q apks-temp
del pulsemate.apks
```

### Using Script:

```bash
Double-click: CONVERT-AAB-TO-APK.bat
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## SECURITY NOTES
## ═══════════════════════════════════════════════════════════════════════════════

### Keep These Private:

- ❌ Never commit keystore password to git
- ❌ Never share keystore files publicly
- ❌ Never expose private keys
- ❌ Never commit google-services.json with API keys

### What's Safe to Share:

- ✅ SHA256 fingerprint (public info)
- ✅ Package name
- ✅ App version
- ✅ Build configuration

### Keystore Storage:

- ✅ Stored securely in EAS servers
- ✅ Encrypted and backed up
- ✅ No need to store locally
- ✅ Can download if needed

---

## ═══════════════════════════════════════════════════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════════════════════════════════════════════════

### "Entity not authorized" Error

**Cause:** Not logged in with correct account

**Fix:**
```bash
eas logout
eas login
# Enter: ramnathdurgadevienterprise@gmail.com
```

### Build Fails - "Invalid keystore"

**Cause:** Keystore configuration issue

**Fix:**
```bash
# View credentials
eas credentials

# Verify keystore shows: yKf5TaJ1Kx
# If missing, need to reconfigure
```

### Firebase Auth Not Working in Production

**Cause:** SHA256 not added to Firebase Console

**Fix:**
1. Go to Firebase Console
2. Add SHA256: `83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6`
3. Download new google-services.json
4. Rebuild app

---

## ═══════════════════════════════════════════════════════════════════════════════
## CHECKLIST FOR PRODUCTION BUILD
## ═══════════════════════════════════════════════════════════════════════════════

Before building:
- [ ] Logged in to EAS (ramnathdurgadevienterprise@gmail.com)
- [ ] SHA256 added to Firebase Console
- [ ] google-services.json is up to date
- [ ] Version number incremented in app.json
- [ ] Code tested and working
- [ ] All changes committed to git

Build:
- [ ] Run: `eas build --profile production --platform android`
- [ ] Wait for build to complete (20-30 min)
- [ ] Download AAB

Test locally:
- [ ] Convert AAB to APK
- [ ] Install on device
- [ ] Test complete OTP flow
- [ ] Verify no crashes
- [ ] Check Firebase Phone Auth works

Deploy:
- [ ] Upload AAB to Play Console
- [ ] Submit for review
- [ ] Monitor for issues

---

## 📞 NEED HELP?

**Check these files:**
- `AAB-BUILD-RUN-LOCALLY.md` - Complete guide
- `BUILD-AAB-COMPLETE-GUIDE.md` - Detailed instructions
- `KEYSTORE-INFO.md` - Keystore details
- This file - Credentials reference

**Quick start:**
```bash
Double-click: BUILD-AAB-FIXED.bat
```

---

**Last Updated:** August 5, 2026  
**Account:** pulsemateconnecttt  
**Keystore:** yKf5TaJ1Kx  
**Status:** Active ✅
