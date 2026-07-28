# ✅ Firebase Phone Auth Migration Checklist

**Status:** Code Updated ✅  
**Next:** Firebase Console Configuration

---

## ✅ **COMPLETED**

### 1. Code Changes
- ✅ Updated `Login2FactorScreen.jsx` to use Firebase
- ✅ Updated `Otp2FactorScreen.jsx` to use Firebase
- ✅ Added Firebase initialization
- ✅ Added better error handling
- ✅ Removed 2Factor API calls

---

## 📋 **WHAT YOU NEED TO DO NOW**

### **STEP 1: Get SHA-1 Certificate (5 minutes)**

Open terminal and run:

```bash
cd android
./gradlew signingReport
```

**Look for this output:**
```
Variant: debug
Config: debug
SHA1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA-256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy these values:**
- SHA1: ____________________
- SHA-256: ____________________

---

### **STEP 2: Add SHA to Firebase Console (5 minutes)**

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general

2. Scroll to "Your apps" section

3. Find: **Android (in.pulsemateconnect.patient)**

4. Click "Add fingerprint"

5. Paste your **SHA-1** → Click "Save"

6. Click "Add fingerprint" again

7. Paste your **SHA-256** → Click "Save"

---

### **STEP 3: Download New google-services.json (2 minutes)**

1. Still in Firebase Console → Android app settings

2. Click the settings gear icon ⚙️

3. Click "Download google-services.json"

4. Save the file to your Downloads folder

---

### **STEP 4: Replace google-services.json (1 minute)**

Run these commands:

```bash
# Go to project root
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21

# Replace root file (adjust path to your Downloads)
copy C:\Users\shubh\Downloads\google-services.json google-services.json

# Replace Android app file
copy C:\Users\shubh\Downloads\google-services.json android\app\google-services.json
```

**Or manually:**
1. Copy downloaded `google-services.json`
2. Replace `pulsemateconnect21/google-services.json`
3. Replace `pulsemateconnect21/android/app/google-services.json`

---

### **STEP 5: Verify Phone Auth Enabled (1 minute)**

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/providers

2. Find "Phone" provider

3. Make sure it's **Enabled** (toggle should be green)

4. **IMPORTANT:** Remove any "Phone numbers for testing"
   - Click "Phone numbers for testing"
   - Delete all test numbers
   - Click "Save"

---

### **STEP 6: Commit Changes (2 minutes)**

```bash
git add .
git commit -m "Switch mobile app to Firebase Phone Auth"
git push origin main
```

---

### **STEP 7: Build with EAS (20 minutes)**

```bash
# Make sure you're logged in
eas login

# Build development APK for testing
eas build --platform android --profile development
```

**Wait for build to complete (15-20 minutes)**

---

### **STEP 8: Test on Real Device (10 minutes)**

**⚠️ MUST use a real Android device - NOT an emulator!**

1. Download APK from EAS:
   - Check: https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds
   - Download the latest development build

2. Transfer APK to your Android phone

3. Install APK on phone:
   - Open file manager
   - Tap the APK file
   - Allow "Install from unknown sources" if prompted
   - Install

4. Open the app

5. Test login:
   - Enter your real phone number
   - Tap "Send OTP"
   - Check your phone for SMS (should arrive in 5-30 seconds)
   - Enter the 6-digit code
   - Login should succeed ✅

---

### **STEP 9: Production Build (Later)**

Once testing works, add Google Play Store certificates:

1. Go to: https://play.google.com/console
2. Select your app
3. Go to: Setup → App signing
4. Copy SHA-1 and SHA-256 from "App signing certificate"
5. Add them to Firebase Console (same as Step 2)
6. Download new google-services.json
7. Replace files
8. Build production AAB

---

## 🐛 **TROUBLESHOOTING**

### Issue: "auth/app-not-authorized"

**Solution:** SHA certificate not added to Firebase

1. Run `./gradlew signingReport` again
2. Verify SHA-1 matches what you added to Firebase
3. Download fresh google-services.json
4. Rebuild app

### Issue: "This device may not support Firebase Phone Auth"

**Solution:** Must use EAS build on real device

- ❌ Cannot use Expo Go
- ❌ Cannot use emulator
- ✅ Must use EAS development build
- ✅ Must use real Android device with SIM

### Issue: SMS not received

**Possible causes:**
1. Device has no Google Play Services
2. Poor network connection
3. Wrong phone format (must be +91XXXXXXXXXX)
4. Firebase quota exceeded

**Solutions:**
- Verify Google Play Services installed
- Check internet connection
- Try different phone number
- Check Firebase Console → Authentication → Usage

---

## 📊 **VERIFICATION**

After completing all steps, verify:

- [ ] SHA-1 and SHA-256 added to Firebase Console
- [ ] Phone Authentication is enabled in Firebase
- [ ] No test phone numbers in Firebase
- [ ] google-services.json downloaded and replaced (both locations)
- [ ] Code changes committed and pushed
- [ ] Built with EAS development profile
- [ ] Installed on real Android device
- [ ] Successfully sent OTP via Firebase
- [ ] Received SMS on device
- [ ] Successfully verified OTP
- [ ] Successfully logged in

---

## 🎯 **QUICK START**

**If you want to start right now, do this:**

```bash
# 1. Get SHA certificate
cd android
./gradlew signingReport

# Copy the SHA-1 and SHA-256 values
# Then follow steps 2-9 above
```

---

## 📞 **NEED HELP?**

### Firebase Console:
https://console.firebase.google.com/project/pulsemateconnect

### EAS Builds:
https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds

### Detailed Guide:
Read: `SWITCH-TO-FIREBASE-GUIDE.md` for complete step-by-step instructions

---

## 🔄 **ROLLBACK (If Needed)**

If something goes wrong, you can revert:

```bash
git checkout HEAD -- src/screens/Login2FactorScreen.jsx
git checkout HEAD -- src/screens/Otp2FactorScreen.jsx
git checkout HEAD -- google-services.json
git checkout HEAD -- android/app/google-services.json
```

Your 2Factor API backend is still there and will work immediately.

---

**Status:** Ready for Firebase Console configuration  
**Next Step:** Run `cd android && ./gradlew signingReport`  
**Estimated Time Remaining:** 45 minutes  
**Last Updated:** 2026-07-28
