# 📱 How to Test AAB File via USB

## ⚠️ **Important: AAB ≠ APK**

**AAB (Android App Bundle)** files CANNOT be installed directly via USB!

- ❌ AAB files are for Play Store ONLY
- ✅ APK files can be installed via USB

---

## 🎯 **Solution: 3 Options**

### **Option 1: Use Play Store Internal Testing** ⭐ **RECOMMENDED**

This is the PROPER way to test AAB files:

1. **Upload AAB to Play Store Internal Testing:**
   - Go to: https://play.google.com/console
   - Select your app
   - Release → Testing → Internal testing
   - Create new release
   - Upload AAB file
   - Review and rollout

2. **Join Internal Testing:**
   - Copy the opt-in link from Play Console
   - Open on your phone
   - Join as tester

3. **Download from Play Store:**
   - App appears in Play Store
   - Download like any other app
   - **This is 100% production!**

4. **Test OTP:**
   - Open app
   - Test OTP login
   - Uses SafetyNet (silent, no modal)
   - Exact production behavior

**Benefits:**
- ✅ 100% production environment
- ✅ SafetyNet works perfectly
- ✅ Fast (internal testing is instant approval)
- ✅ Can test before public release

---

### **Option 2: Convert AAB to Universal APK**

If you MUST test via USB, convert AAB to APK first:

**Requirements:**
- Java installed
- bundletool

**Steps:**

1. **Download bundletool:**
```bash
# Download from:
https://github.com/google/bundletool/releases/latest

# Or use curl:
curl -L -o bundletool.jar https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar
```

2. **Convert AAB to APK:**
```bash
java -jar bundletool.jar build-apks ^
  --bundle=your-app.aab ^
  --output=app.apks ^
  --mode=universal
```

3. **Extract universal APK:**
```bash
# Rename .apks to .zip
ren app.apks app.zip

# Extract
powershell -Command "Expand-Archive -Path 'app.zip' -DestinationPath 'apks'"

# Find universal.apk in apks folder
```

4. **Install via USB:**
```bash
adb install -r apks\universal.apk
```

**Drawbacks:**
- ⚠️ Complex process
- ⚠️ Requires Java and bundletool
- ⚠️ SafetyNet may not work (direct install)
- ⚠️ Not true production testing

---

### **Option 3: Build APK Instead (Use Preview Profile)**

Build an APK file instead of AAB:

```bash
npx eas build --platform android --profile preview
```

**But:** Your free builds are exhausted this month

**Alternative:**
- Wait until September 1 (quota resets)
- Or upgrade to paid plan

---

## 💡 **Recommended Workflow**

### **For Testing Before Public Release:**

```
1. Build AAB
   ↓
2. Upload to Internal Testing
   ↓
3. Download from Play Store
   ↓
4. Test OTP (100% production)
   ↓
5. If works → Release to Production ✅
```

### **Why Internal Testing is Better:**

| Method | SafetyNet | Production Accuracy | Setup Difficulty |
|--------|-----------|---------------------|------------------|
| Internal Testing | ✅ Yes | 100% | Easy |
| APK via USB | ⚠️ Maybe | 80% | Medium |
| AAB converted to APK | ⚠️ Maybe | 80% | Hard |

---

## 🚀 **Your Current Situation**

**You have:**
- ✅ AAB file (version 72): https://expo.dev/artifacts/eas/cWv7pXHMfzd3KNNEX7WQDjqGCLsDLpEB0vLjlkHGQNI.aab
- ✅ Production keystore configured
- ✅ google-services.json updated

**Best next step:**
1. Download AAB file
2. Upload to Play Store Internal Testing
3. Download from Play Store on your phone
4. Test OTP → Will work perfectly! ✅

---

## 📋 **Internal Testing Step-by-Step**

### **1. Upload AAB:**

1. Go to: https://play.google.com/console
2. Select "PulseMate Connect"
3. Left menu → **Release** → **Testing** → **Internal testing**
4. Click **"Create new release"**
5. Click **"Upload"** → Select your AAB file
6. Click **"Review release"**
7. Click **"Start rollout to Internal testing"**
8. Wait 2-5 minutes for processing

### **2. Join as Tester:**

1. In Play Console, go to Internal testing page
2. Find **"Testers"** section
3. Copy the **"Opt-in URL"**
4. Open URL on your phone's browser
5. Click **"Become a tester"**
6. Wait 1-2 minutes

### **3. Download App:**

1. Open Play Store on phone
2. Search "PulseMate Connect"
3. Should show "Internal test" badge
4. Tap **"Install"** or **"Update"**
5. Wait for download

### **4. Test OTP:**

1. Open app
2. Enter phone number
3. Tap "Send OTP"
4. **NO modal** (SafetyNet silent verification)
5. OTP arrives within 5-10 seconds
6. Enter OTP
7. Login successful ✅

---

## ✅ **Success Criteria**

**Internal Testing:**
- [ ] AAB uploaded successfully
- [ ] Release rolled out to internal testing
- [ ] Joined as tester
- [ ] App appears in Play Store with "Internal test" badge
- [ ] App installed from Play Store
- [ ] OTP works without reCAPTCHA modal (SafetyNet silent)
- [ ] Login successful

**If all checked → Ready for production release!** 🚀

---

## 🆘 **Common Issues**

### **Issue: "App not compatible with your device"**

**Cause:** AAB not processed yet

**Solution:** Wait 5-10 minutes after upload

---

### **Issue: App not appearing in Play Store**

**Cause:** Not joined as tester

**Solution:** 
1. Use opt-in URL again
2. Clear Play Store cache
3. Wait 5 minutes

---

### **Issue: OTP shows reCAPTCHA modal in Internal Testing**

**Cause:** This shouldn't happen in Internal Testing

**Solution:**
1. Verify downloaded from Play Store (not sideloaded)
2. Check SHA-1 in Firebase Console
3. Re-download google-services.json

---

## 📝 **Summary**

**AAB files:**
- ✅ Upload to Play Store (Internal or Production)
- ❌ Cannot install via USB directly

**APK files:**
- ✅ Install via USB
- ⚠️ May not have full SafetyNet support

**Best practice:**
- Use Internal Testing for final testing before production
- 100% production environment
- FREE and FAST

---

**Next step:** Upload your AAB to Internal Testing! 🚀
