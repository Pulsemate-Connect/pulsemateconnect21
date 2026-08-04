# 🚀 Firebase OTP Production Testing: Quick Start Guide

## 🎯 Goal

Test Firebase Phone Authentication in a production-like environment (outside Expo Go) to verify OTP works correctly before publishing to Play Store.

---

## ⚡ Quick Summary

**Problem:** OTP works in Expo Go but might not work in production builds  
**Cause:** Different app signatures require different SHA-1 fingerprints in Firebase  
**Solution:** Build development APK, add debug SHA-1 to Firebase, test OTP

---

## 🏃 Fast Track (5 Steps)

### Step 1: Get Debug SHA-1 (30 seconds)
```bash
.\get-debug-sha1.bat
```

**Output:** SHA-1 fingerprint (e.g., `4D:F5:83:93:29:93:FD:70...`)

---

### Step 2: Add SHA-1 to Firebase Console (2 minutes)

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Scroll to "Your apps" → Android app (`in.pulsemateconnect.patient`)
3. Click **"Add fingerprint"**
4. Paste your SHA-1 from Step 1
5. Click **"Save"**
6. Click **"Download google-services.json"**
7. Replace `android\app\google-services.json` with the downloaded file

---

### Step 3: Build Development APK (10-15 minutes)
```bash
.\build-dev-apk.bat
```

**What happens:**
- Builds APK with debug signature
- Includes Firebase native modules
- Supports live reload
- Can be installed via USB

**Output:** Download URL for APK file

---

### Step 4: Install APK on Phone (1 minute)
```bash
# Download APK from URL
# Place in project folder
.\install-dev-apk.bat
```

**What happens:**
- Installs app on USB-connected phone
- Replaces any previous version

---

### Step 5: Test OTP (1 minute)
```bash
# Start Metro bundler
npx expo start --dev-client

# Open "PulseMate Connect" app on phone
# Test OTP login
```

**Expected result:**
- ✅ Enter phone number
- ✅ Tap "Send OTP"
- ✅ reCAPTCHA modal appears (or invisible)
- ✅ OTP received via SMS
- ✅ Login successful!

---

## 🐛 If OTP Still Doesn't Work

### Check Logs:
```bash
.\view-firebase-logs.bat
```

**Look for:**
- ✅ `[Auth] ✅ OTP sent successfully` → Working!
- ❌ `[Auth] ❌ Send OTP error: auth/app-not-authorized` → SHA-1 issue
- ❌ `[Auth] ❌ Send OTP error: auth/invalid-phone-number` → Format issue

---

### Common Fixes:

**Problem 1: "auth/app-not-authorized"**
- SHA-1 not in Firebase Console
- Run `.\get-debug-sha1.bat` again
- Verify SHA-1 in Firebase Console matches
- Download fresh google-services.json
- Rebuild APK

**Problem 2: "auth/invalid-phone-number"**
- Use E.164 format: `+919876543210`
- Include country code (+91)
- No spaces or special characters

**Problem 3: "Too many requests"**
- Wait 15 minutes
- Use Firebase test phone number:
  - Firebase Console → Authentication → Settings → Phone numbers for testing
  - Add: `+919999999999` → Code: `123456`

---

## 📊 Build Types Comparison

| Build Type | When to Use | OTP Method | Build Time | Install Method |
|------------|-------------|------------|------------|----------------|
| **Expo Go** | Development (current) | reCAPTCHA modal | Instant | Expo Go app |
| **Development APK** | Testing before production | reCAPTCHA/SafetyNet | ~10 min | USB |
| **Preview APK** | Final testing | SafetyNet | ~10 min | USB |
| **Production AAB** | Play Store release | SafetyNet | ~10 min | Play Store |

---

## 🎯 Current Status

### ✅ What's Working:
- Expo Go testing (reCAPTCHA modal)
- Production keystore registered in Firebase
- google-services.json configured correctly

### ⚠️ What Needs Testing:
- Development APK with debug keystore
- Preview APK with production keystore
- Production AAB from Play Store

---

## 📝 Complete Testing Workflow

### Phase 1: Expo Go (✅ Done)
```bash
npx expo start
# Test in Expo Go → Works!
```

### Phase 2: Development APK (⏩ Do This Now)
```bash
.\get-debug-sha1.bat                 # Get SHA-1
# Add to Firebase Console
.\build-dev-apk.bat                   # Build APK (~10 min)
.\install-dev-apk.bat                 # Install via USB
npx expo start --dev-client           # Start Metro
# Test OTP on phone
```

### Phase 3: Preview APK (Optional)
```bash
npx eas build --platform android --profile preview
# Download APK, install, test (no live reload)
```

### Phase 4: Production AAB (Final)
```bash
.\build-aab-auto-version.bat          # Build AAB
# Upload to Play Store Internal Testing
# Download from Play Store
# Test OTP → Should work with SafetyNet!
```

---

## 🔧 Automated Scripts Created

| Script | Purpose | Time |
|--------|---------|------|
| `get-debug-sha1.bat` | Get debug keystore SHA-1 | 30 sec |
| `build-dev-apk.bat` | Build development APK | 10 min |
| `install-dev-apk.bat` | Install APK via USB | 1 min |
| `start-dev-client.bat` | Start Metro for dev build | Instant |
| `view-firebase-logs.bat` | Watch real-time logs | Realtime |

---

## 🎓 Key Concepts

### What is a Development Build?

**Expo Go:**
- Generic Expo app
- Works for any Expo project
- Limited to Expo-supported modules
- Signed with Expo's key

**Development Build:**
- YOUR app as standalone APK
- Includes all your native modules (Firebase!)
- Signed with YOUR debug key
- Supports live reload like Expo Go
- **Perfect for testing Firebase OTP!**

---

### Why Different SHA-1s?

**Expo Go SHA-1:**
- Controlled by Expo
- You can't add it to Firebase
- That's why we use reCAPTCHA modal

**Debug SHA-1:**
- From your debug.keystore
- Used for development builds
- Add to Firebase Console
- Firebase accepts your test builds

**Production SHA-1:**
- From your production keystore
- Used for Play Store builds
- Already in Firebase Console ✅
- Used for final app

---

### SafetyNet vs reCAPTCHA

**reCAPTCHA (Development):**
- Shows modal popup
- User clicks "I'm not a robot"
- Works in any build
- Slower, more visible

**SafetyNet (Production):**
- Silent, invisible
- No user interaction
- Only works with registered SHA-1
- Faster, seamless
- **Only works on Play Store downloads**

---

## 🚨 Important Notes

1. **Development APK won't have SafetyNet** 
   - Uses reCAPTCHA instead (modal appears)
   - This is normal and expected
   - SafetyNet only works on Play Store builds

2. **Play Store Internal Testing**
   - Internal testing track DOES support SafetyNet
   - Upload AAB to internal testing
   - Download from Play Store
   - Test OTP (should be silent/invisible)

3. **Direct APK Install vs Play Store**
   - Direct install (ADB): reCAPTCHA modal
   - Play Store download: SafetyNet (silent)
   - Both should send OTP successfully!

---

## ✅ Success Criteria

### Development APK Test:
- [ ] APK installs successfully
- [ ] App opens without crashes
- [ ] Login screen loads
- [ ] "Send OTP" button works
- [ ] reCAPTCHA modal appears
- [ ] OTP SMS received
- [ ] OTP verification succeeds
- [ ] User logged in successfully

### Production AAB Test (Play Store):
- [ ] AAB uploaded to Play Store
- [ ] Download from Play Store
- [ ] App opens without crashes
- [ ] "Send OTP" button works
- [ ] NO reCAPTCHA modal (SafetyNet silent)
- [ ] OTP SMS received
- [ ] OTP verification succeeds
- [ ] User logged in successfully

---

## 🎉 You're Ready!

**Next command to run:**
```bash
.\get-debug-sha1.bat
```

**Then:**
1. Add SHA-1 to Firebase Console
2. Build development APK
3. Test OTP
4. If works → Build production AAB
5. Upload to Play Store
6. Test final version

---

## 📚 Additional Resources

- **Full Debug Guide:** `FIREBASE-OTP-PRODUCTION-DEBUG-GUIDE.md`
- **Version Management:** `VERSION-TRACKER.md`
- **Development USB Guide:** `DEVELOPMENT-USB-GUIDE.md`
- **All Fixes Summary:** `SUMMARY-ALL-FIXES.md`

---

**Your Configuration:**
- **Package:** `in.pulsemateconnect.patient`
- **Firebase Project:** `pulsemateconnect`
- **Production SHA-1:** `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F` ✅
- **Debug SHA-1:** Get with `.\get-debug-sha1.bat`

**Status:** Ready to test! 🚀
