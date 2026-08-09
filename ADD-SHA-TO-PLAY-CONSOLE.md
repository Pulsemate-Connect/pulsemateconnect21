# 🔐 ADD SHA Certificates to Google Play Console

**Task:** Register app signing certificates with Google Play Console  
**Date:** August 7, 2026  
**Status:** 🟡 IN PROGRESS  

---

## 📋 YOUR KEYSTORE CERTIFICATES

### Build Credentials: `yKf5TaJ1Kx`

```
Type:             JKS
Key Alias:        f1a185ee3a5ba7802fd6698297601ca8
MD5 Fingerprint:  D7:00:F6:FD:7E:64:82:11:51:E4:86:2C:36:2B:91:6F
SHA1 Fingerprint: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA256 Fingerprint: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
Updated:          4 days ago
```

---

## 🎯 SOLUTION: Configure Play Console App Signing

Google Play Console needs to know about your app's signing certificates. There are **two signing modes**:

### **Mode 1: Play App Signing (Recommended by Google) ✅**

In this mode:
- **Upload key:** Your keystore (signs AAB before upload)
- **App signing key:** Google manages (signs APKs for users)
- **Benefit:** Google re-signs your app, you can recover if you lose keystore

### **Mode 2: Legacy App Signing (Your Current Mode)**

In this mode:
- **Your keystore:** Signs everything (AAB and final APKs)
- **No Google re-signing:** Your exact keystore is used
- **Risk:** If you lose keystore, you can never update app again

---

## 🔧 STEP-BY-STEP FIX

### **OPTION A: Enable Play App Signing ✅ RECOMMENDED**

This is the modern, secure way. Google will manage the final app signing key.

#### Step 1: Go to Google Play Console
1. Open: https://play.google.com/console
2. Log in with your account
3. Select: **PulseMate Connect** app

#### Step 2: Navigate to App Signing Settings
1. Click: **Setup** (left sidebar)
2. Click: **App integrity**
3. Click: **App signing** tab

#### Step 3: Check Current Status
Look for one of these messages:

**If you see:** *"Your app is not enrolled in Play App Signing"*
- ✅ Good! Proceed to Step 4

**If you see:** *"Your app uses Play App Signing"*
- ✅ Already enrolled! Skip to Step 6

**If you see:** *"Upgrade to Play App Signing"*
- ✅ You can upgrade! Proceed to Step 4

#### Step 4: Enroll in Play App Signing
1. Click: **"Use Play App Signing"** (or "Continue" if already shown)
2. Select one of these options:

   **Option A: Let Google create key (Easiest)**
   - Select: "Let Google create and manage my app signing key (recommended)"
   - Click: "Continue"
   - ✅ Google generates new app signing key
   - ✅ Your keystore becomes "upload key"

   **Option B: Use your existing key**
   - Select: "Export and upload a key from a Java Keystore"
   - Follow instructions to export `.pepk` file
   - Upload `.pepk` file
   - ✅ Your existing key becomes app signing key

#### Step 5: Download Upload Key Certificate (Important!)
After enrollment:
1. Google will show: **"App signing key certificate"** (SHA-1, SHA-256)
2. Below that: **"Upload key certificate"** (your keystore)
3. **COPY THESE SHA VALUES** - you'll need them!

#### Step 6: Verify Your Upload Key is Registered
Look for section: **"Upload key certificate"**

Should show:
```
SHA-1:   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA-256: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

✅ **If these match your keystore** → Perfect! You're done with Play Console setup.

❌ **If they DON'T match** → Proceed to Step 7

#### Step 7: Register Your Upload Key (If Not Automatically Detected)
If Google didn't automatically detect your upload key:

1. Scroll to: **"Upload key certificate"** section
2. Click: **"Request upload key reset"** or **"Add upload key"**
3. You'll need to contact Google Support with:
   - SHA-1 fingerprint: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
   - SHA-256 fingerprint: `83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6`
   - Reason: "Initial app setup - registering upload key"

---

### **OPTION B: Stay with Legacy Signing (Not Recommended)**

If you choose NOT to use Play App Signing:

#### Step 1: Verify Your First Upload
- The **first APK/AAB** you upload sets the signing key forever
- Your keystore SHA-1 (`0B:84:89:11:44:B1:B8:DB...`) must match

#### Step 2: Upload AAB
1. Go to: **Production** → **Create new release**
2. Upload your AAB (Build 79 or 80)
3. If upload succeeds → Your keystore is correct ✅
4. If upload fails with signing error → Wrong keystore ❌

#### Step 3: Future Updates
- **ALWAYS** use the same keystore (SHA-1: 0B:84:89:11...)
- **NEVER** lose this keystore file
- **BACKUP** keystore file securely (cloud storage, safe)

---

## 🧪 VERIFY BEFORE UPLOADING AAB

### Check Your Local Keystore Files
You have two keystore files found:
```
1. c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks
2. c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks
```

Let's verify which one has the correct SHA-1:

```bash
# Check first keystore
keytool -list -v -keystore "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks"

# Check second keystore
keytool -list -v -keystore "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\@pulsemateconnect__pulsemate-app.jks"

# Look for SHA1 fingerprint:
# Should be: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

### Verify EAS is Using Correct Keystore

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Check EAS credentials
eas credentials

# Select: Android → Production
# View: Keystore details
# Verify SHA-1 matches: 0B:84:89:11:44:B1:B8:DB...
```

---

## 📱 REBUILD AAB WITH CORRECT SIGNING

### Option 1: EAS Already Has Correct Keystore
If EAS credentials show SHA-1: `0B:84:89:11:44:B1:B8:DB...`

```bash
# Just rebuild
eas build --platform android --profile production

# Wait for build to complete
# Download AAB
# Upload to Play Console
# Should succeed ✅
```

### Option 2: EAS Has Wrong Keystore
If EAS credentials show different SHA-1:

```bash
# Remove current keystore
eas credentials
# Select: Android → Production → Keystore
# Choose: "Remove keystore"

# Upload correct keystore
eas credentials
# Select: Android → Production → Keystore
# Choose: "Set up a new keystore"
# Choose: "Upload an existing keystore"
# Browse to correct .jks file
# Enter keystore password
# Enter key alias: f1a185ee3a5ba7802fd6698297601ca8
# Enter key password

# Verify SHA-1 matches
# Then rebuild
eas build --platform android --profile production
```

---

## 🚨 IMPORTANT: DON'T LOSE YOUR KEYSTORE

### Backup Keystore NOW
```bash
# Copy to multiple locations
copy "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\credentials\android\keystore.jks" "c:\Users\shubh\Backups\pulsemateconnect-keystore-backup.jks"

# Upload to cloud storage (Google Drive, Dropbox, OneDrive)
# Store in password manager (1Password, LastPass)
# Email to yourself (encrypted attachment)
```

### Store Keystore Passwords Securely
Create a file: `keystore-info-KEEP-SAFE.txt`
```
App: PulseMate Connect
Package: in.pulsemateconnect.patient

Keystore File: keystore.jks
Keystore Password: [YOUR_PASSWORD]
Key Alias: f1a185ee3a5ba7802fd6698297601ca8
Key Password: [YOUR_PASSWORD]

SHA-1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA-256: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6

⚠️ KEEP THIS FILE SAFE! Losing keystore means you can NEVER update your app!
```

Store this file in:
- Encrypted USB drive
- Password manager
- Secure cloud storage (encrypted)
- Safe deposit box (for production apps)

---

## ✅ SUCCESS CHECKLIST

After completing the steps above:

- [ ] **Play Console App Signing configured** (Option A or B)
- [ ] **Upload key registered** (SHA-1: 0B:84:89:11...)
- [ ] **EAS has correct keystore** (verified SHA-1)
- [ ] **Keystore backed up** (multiple locations)
- [ ] **Passwords stored securely** (password manager)
- [ ] **AAB rebuilt** (with correct signing)
- [ ] **AAB uploaded to Play Console** (no signing errors)
- [ ] **Release created** (ready to publish)

---

## 🎯 EXPECTED OUTCOME

### Before Fix:
```
❌ Upload failed: "App Bundle is signed with the wrong key"
❌ Expected SHA-1: 0B:84:89:11...
❌ Received SHA-1: 56:39:95:C3... (wrong keystore)
```

### After Fix:
```
✅ Upload successful!
✅ SHA-1 matches: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
✅ Release created: Version 1.3.7 (Build 79 or 80)
✅ Ready to publish to Production
```

---

## 📞 NEED HELP?

### Common Issues:

**"Wrong key" error persists**
- Verify SHA-1 of uploaded AAB matches Play Console
- Check if you're in the correct Google account
- Try uploading to Internal Testing track first

**Can't find keystore file**
- Check: `credentials/android/keystore.jks`
- Check: `@pulsemateconnect__pulsemate-app.jks`
- Check EAS dashboard: https://expo.dev → Your project → Credentials

**Don't have keystore password**
- Check: `eas.json`, `app.json`, `.env` files
- Check: EAS credentials (may be stored there)
- Last resort: Contact previous developer/team member

**Lost keystore completely**
- If not using Play App Signing: Cannot recover, must create new app
- If using Play App Signing: Request upload key reset from Google Support

---

**Next Step:** Upload your correct SHA certificates to Google Play Console, then rebuild and upload AAB!
