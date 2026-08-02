# 🔐 SHA-256 Fingerprint Verification & Setup

**Date:** August 2, 2026  
**Status:** ⚠️ SHA-1 Present, SHA-256 Verification Needed

---

## ✅ CURRENT STATUS

### google-services.json Analysis
```json
Package Name: in.pulsemateconnect.patient ✅
SHA-1 Registered: 0b84891144b1b8dbc49b4d05edaa83770f30434f ✅
OAuth Client: Configured ✅
```

**Good News:** SHA-1 is already registered!  
**Action Needed:** Verify SHA-256 is also added for Play Integrity API

---

## 🎯 WHY SHA-256 IS NEEDED

### React Native Firebase Requirements

| Feature | Requires | Status |
|---------|----------|--------|
| Firebase Auth (Basic) | SHA-1 | ✅ Already added |
| Play Integrity API | SHA-256 | ⚠️ Needs verification |
| Google Sign-In | SHA-1 | ✅ Already added |
| Native Phone Auth | SHA-1 + SHA-256 | ⚠️ SHA-256 needs verification |

**For production Native Firebase Phone Authentication:**
- ✅ SHA-1 — Already registered
- ⚠️ SHA-256 — Must verify and add

---

## 📋 STEP 1: GET YOUR SHA-256 FINGERPRINT

### Option A: From Debug Keystore (For Development)

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\android"

# Windows PowerShell
keytool -list -v -keystore app\debug.keystore -alias androiddebugkey -storepass android -keypass android | Select-String "SHA256"
```

### Option B: From Production Keystore (For Production)

```bash
# If you have your production keystore locally
keytool -list -v -keystore path\to\your\production.keystore -alias your-key-alias | Select-String "SHA256"
```

### Option C: From Play Console (After Upload)

**This is the most important one for production!**

1. Go to: [Google Play Console](https://play.google.com/console)
2. Select: PulseMate Connect app
3. Navigate to: **Release → Setup → App Integrity**
4. Look for: **App signing key certificate**
5. Copy: **SHA-256 certificate fingerprint**

**Example format:**
```
SHA-256: A1:B2:C3:D4:E5:F6:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90
```

---

## 📋 STEP 2: ADD SHA-256 TO FIREBASE CONSOLE

### Instructions

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general

2. **Find Your Android App:**
   - Scroll to: "Your apps" section
   - Find: `in.pulsemateconnect.patient`

3. **Add SHA-256 Fingerprint:**
   - Click: "Add fingerprint" button
   - Paste: Your SHA-256 (from Step 1)
   - Click: "Save"

4. **Verify Both Fingerprints Present:**
   - You should see BOTH:
     - ✅ SHA-1: `0b84891144b1b8dbc49b4d05edaa83770f30434f`
     - ✅ SHA-256: `<your-sha256-here>`

---

## 📋 STEP 3: DOWNLOAD FRESH google-services.json

### After Adding SHA-256

1. **In Firebase Console:**
   - Click: "Download google-services.json" button
   - Save the file

2. **Replace in Project:**
   ```bash
   # Backup current file
   copy "android\app\google-services.json" "android\app\google-services.json.backup"
   
   # Replace with new file
   # Move your downloaded google-services.json to:
   # android\app\google-services.json
   ```

3. **Verify New File:**
   - Open: `android\app\google-services.json`
   - Search for: Your SHA-256 fingerprint
   - Confirm: Both SHA-1 and SHA-256 are present

---

## 📋 STEP 4: REBUILD PROJECT

### Clean Rebuild Required

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Clean rebuild native Android project
npx expo prebuild --clean --platform android

# Build with EAS
eas build --platform android --profile production
```

**Why rebuild?**
- Firebase native modules need to be relinked
- google-services.json changes require native rebuild
- Ensures SHA-256 is properly integrated

---

## 🧪 STEP 5: VERIFY IT WORKS

### Test on Physical Device

1. **Install Build:**
   - Download APK/AAB from EAS Build
   - Install on physical Android device
   - (Emulator won't work for Play Integrity)

2. **Test Authentication:**
   - Open app
   - Enter phone number: `+91XXXXXXXXXX`
   - Tap "Send OTP"
   - **Expected:** SMS received within 30 seconds
   - Enter OTP code
   - **Expected:** Login successful

3. **Check for Errors:**
   ```bash
   # Capture logs while testing
   .\capture-firebase-logs.bat
   ```

4. **Success Indicators:**
   - ✅ SMS received
   - ✅ OTP verification works
   - ✅ Login successful
   - ✅ No `auth/invalid-app-credential` error
   - ✅ No `auth/app-not-authorized` error

---

## ⚠️ TROUBLESHOOTING

### Error: auth/invalid-app-credential

**Cause:** SHA-256 not registered or not matching

**Fix:**
1. Get SHA-256 from Play Console (App Integrity section)
2. Add to Firebase Console
3. Download fresh google-services.json
4. Replace in project
5. Run: `npx expo prebuild --clean`
6. Rebuild: `eas build --platform android --profile production`

### Error: auth/app-not-authorized

**Cause:** Package name mismatch or SHA fingerprints not registered

**Fix:**
1. Verify package name in Firebase Console: `in.pulsemateconnect.patient`
2. Verify package name in android/app/build.gradle: `in.pulsemateconnect.patient`
3. Verify both SHA-1 and SHA-256 are added to Firebase Console
4. Download fresh google-services.json
5. Rebuild

### SMS Not Received

**Possible Causes:**
1. SHA-256 not registered → Add SHA-256
2. Firebase quota exceeded → Check Firebase Console usage
3. Phone number blocked → Try different number
4. Internet connection issue → Check device connectivity

---

## 📊 VERIFICATION CHECKLIST

### Before Building
- [ ] SHA-1 present in Firebase Console (already done ✅)
- [ ] SHA-256 added to Firebase Console (verify this!)
- [ ] Fresh google-services.json downloaded
- [ ] google-services.json replaced in android/app/
- [ ] Project rebuilt with `npx expo prebuild --clean`

### After Building
- [ ] Build completed successfully
- [ ] APK/AAB installed on physical device
- [ ] App launches without errors
- [ ] Can enter phone number
- [ ] "Send OTP" button works
- [ ] SMS received within 30 seconds
- [ ] OTP verification works
- [ ] Login successful
- [ ] Session persists after app restart

### In Firebase Console
- [ ] Phone Authentication enabled
- [ ] Android app registered: `in.pulsemateconnect.patient`
- [ ] SHA-1 present: `0b84891144b1b8dbc49b4d05edaa83770f30434f` ✅
- [ ] SHA-256 present: `<verify-this>`
- [ ] google-services.json up to date

---

## 🔍 HOW TO CHECK IF SHA-256 IS ALREADY ADDED

### Method 1: Firebase Console (Recommended)

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Scroll to: "Your apps" section
3. Find: `in.pulsemateconnect.patient`
4. Look at: "SHA certificate fingerprints" section
5. Check: Do you see **TWO** fingerprints?
   - One starting with `0b:84:89...` (SHA-1) ✅
   - One longer hash (SHA-256)?

**If you see only SHA-1:** Add SHA-256  
**If you see both:** You're good! Just rebuild

### Method 2: google-services.json Content

Your current `google-services.json` only shows OAuth client with SHA-1:
```json
"oauth_client": [{
  "client_type": 1,
  "android_info": {
    "certificate_hash": "0b84891144b1b8dbc49b4d05edaa83770f30434f"
  }
}]
```

After adding SHA-256, you should see additional OAuth client entries or the SHA-256 will be available in Firebase Console (not always visible in google-services.json).

---

## 🎯 QUICK ACTION ITEMS

### Right Now (Before Building)

1. **Check Firebase Console:**
   - Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
   - Find: `in.pulsemateconnect.patient`
   - Count: How many SHA fingerprints do you see?
   - If only 1 (SHA-1): Proceed to add SHA-256

2. **Get SHA-256:**
   - From Play Console → Release → Setup → App Integrity
   - Copy the SHA-256 certificate fingerprint

3. **Add to Firebase:**
   - Click "Add fingerprint" in Firebase Console
   - Paste SHA-256
   - Save

4. **Download & Replace:**
   - Download fresh google-services.json
   - Replace: `android\app\google-services.json`

5. **Rebuild:**
   ```bash
   npx expo prebuild --clean --platform android
   eas build --platform android --profile production
   ```

---

## 📚 DOCUMENTATION REFERENCES

### Firebase Console Links
- Project Settings: https://console.firebase.google.com/project/pulsemateconnect/settings/general
- Authentication: https://console.firebase.google.com/project/pulsemateconnect/authentication

### Google Play Console
- App Integrity: https://play.google.com/console → Release → Setup → App Integrity

### Documentation
- SHA Fingerprints: https://developers.google.com/android/guides/client-auth
- React Native Firebase: https://rnfirebase.io/auth/phone-auth
- Play Integrity: https://developer.android.com/google/play/integrity

---

## ✅ SUMMARY

**Current Status:**
- ✅ SHA-1 registered: `0b84891144b1b8dbc49b4d05edaa83770f30434f`
- ⚠️ SHA-256 status: Needs verification

**Action Required:**
1. Check Firebase Console for SHA-256
2. If not present, get SHA-256 from Play Console
3. Add SHA-256 to Firebase Console
4. Download fresh google-services.json
5. Replace in project
6. Rebuild

**After This:**
- ✅ Build will work in production
- ✅ SMS OTP will be delivered
- ✅ Play Integrity API will function
- ✅ No auth/invalid-app-credential errors

---

**Next Steps:** See **BUILD_NOW.md** for build instructions after SHA-256 is verified/added!
