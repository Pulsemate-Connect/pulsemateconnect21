# 📱 PLAY STORE PRODUCTION READINESS CHECKLIST

**App:** PulseMate Connect (Patient App)  
**Package:** `in.pulsemateconnect.patient`  
**Date:** August 7, 2026  

---

## ⚠️ CRITICAL: TEST OTP FIX FIRST!

**Status:** 🟡 **WAITING FOR TEST** (Render deployed at ~15:52)

### ✅ Test Steps (DO THIS NOW):
```
1. Open emulator: adb devices
2. Launch app (should already be running)
3. Navigate to login screen
4. Enter phone: +917022818878
5. Tap "Send OTP"
6. Receive SMS (5-10 seconds)
7. Enter 6-digit OTP code
8. Tap "Verify"
9. ✅ Should login successfully and show home screen
```

**DO NOT proceed to Play Store until this test PASSES!**

---

## 📋 PHASE 1: CORE FUNCTIONALITY (Required)

### Authentication System
- [ ] **Send OTP** - Test with real phone number
- [ ] **Verify OTP** - Test correct OTP code
- [ ] **OTP Error Handling** - Test wrong OTP, expired OTP
- [ ] **Rate Limiting** - Test multiple OTP requests (should block after threshold)
- [ ] **New User Registration** - Creates patient account on first login
- [ ] **Existing User Login** - Logs in existing users correctly
- [ ] **JWT Token Storage** - Tokens saved securely in SecureStore
- [ ] **Token Refresh** - Auto-refresh when access token expires
- [ ] **Logout** - Clears tokens and redirects to login

### Backend Connectivity
- [ ] **Production API** - `https://api.pulsemateconnect.in` is accessible
- [ ] **SSL/HTTPS** - All API calls use HTTPS
- [ ] **Error Handling** - Network errors show user-friendly messages
- [ ] **Timeout Handling** - Requests don't hang indefinitely
- [ ] **Backend Health** - Backend is stable and running

### Critical User Flows
- [ ] **First Launch** - App opens without crashing
- [ ] **Login Flow** - User can login with phone number
- [ ] **Home Screen** - Shows after successful login
- [ ] **Navigation** - All tabs/screens accessible
- [ ] **Back Button** - Android back button works correctly
- [ ] **App Restart** - User stays logged in after closing/reopening

---

## 📋 PHASE 2: APP CONFIGURATION (Required)

### App.json / EAS Configuration
- [ ] **Package Name** - `in.pulsemateconnect.patient` ✅
- [ ] **Version Code** - Increment for each release
- [ ] **Version Name** - User-facing version (e.g., "1.0.0")
- [ ] **App Name** - "PulseMate Connect" ✅
- [ ] **Bundle Identifier** - Matches package name
- [ ] **Permissions** - Only required permissions declared
- [ ] **API Keys** - Removed all debug/test keys
- [ ] **Backend URL** - Points to production (not localhost)

### Build Configuration
- [ ] **Release Build Type** - Not debug build
- [ ] **ProGuard/R8** - Enabled for code obfuscation
- [ ] **Signing** - Signed with production keystore (EAS handles this)
- [ ] **App Size** - Reasonable size (<100MB ideally)
- [ ] **Target SDK** - Android 14 (API 34) or latest
- [ ] **Min SDK** - Android 7.0+ (API 24)

---

## 📋 PHASE 3: PLAY STORE ASSETS (Required)

### Required Assets
- [ ] **App Icon** - 512x512 PNG, transparent background ❌ NEEDED
- [ ] **Feature Graphic** - 1024x500 PNG ❌ NEEDED
- [ ] **Screenshots** - Minimum 2, recommended 4-8 ❌ NEEDED
  - [ ] Phone: 16:9 or 9:16 aspect ratio
  - [ ] Tablet (optional): 16:9 or 9:16 aspect ratio
- [ ] **Short Description** - Max 80 characters ❌ NEEDED
- [ ] **Full Description** - Max 4000 characters ❌ NEEDED
- [ ] **Privacy Policy URL** - Required for apps with login ❌ NEEDED

### Content Rating
- [ ] **Complete IARC Questionnaire** - Answer all questions ❌ NEEDED
- [ ] **Target Audience** - Specify age group (likely Everyone) ❌ NEEDED

### Store Listing Info
- [ ] **App Category** - "Medical" or "Health & Fitness" ❌ NEEDED
- [ ] **Contact Email** - Support email address ❌ NEEDED
- [ ] **Contact Phone** - Optional but recommended ❌ NEEDED
- [ ] **Website** - Optional (e.g., pulsemateconnect.in) ❌ NEEDED

---

## 📋 PHASE 4: LEGAL & COMPLIANCE (Critical)

### Privacy & Data Handling
- [ ] **Privacy Policy** - Must be hosted and accessible
- [ ] **Data Usage Disclosure** - Declare what data you collect
  - [ ] Phone number (authentication)
  - [ ] User name (optional profile data)
  - [ ] Device info (analytics - if any)
- [ ] **Third-party Libraries** - Disclose Message Central SMS usage
- [ ] **Data Deletion** - Provide way for users to delete account
- [ ] **GDPR Compliance** - If targeting EU users

### Permissions Declaration
- [ ] **Internet** - Required (API calls)
- [ ] **Phone State** - Only if needed (likely not)
- [ ] **SMS Read** - Only if auto-reading OTP (optional)
- [ ] Explain WHY each permission is needed in store listing

---

## 📋 PHASE 5: TESTING & QA (Critical)

### Device Testing
- [ ] **Android Emulator** - Tested on Pixel 3a (API 33/34)
- [ ] **Physical Device** - Test on at least 1 real device ❌ NEEDED
- [ ] **Different Screen Sizes** - Phone + Tablet (if supported)
- [ ] **Different Android Versions** - Test Android 7, 9, 11, 13, 14
- [ ] **Low Memory Devices** - App doesn't crash on <2GB RAM

### Edge Cases
- [ ] **No Internet Connection** - Shows proper error message
- [ ] **Airplane Mode** - Handles gracefully
- [ ] **App Backgrounding** - Resumes correctly after backgrounding
- [ ] **Phone Call During OTP** - App doesn't crash
- [ ] **Battery Saver Mode** - App still functions
- [ ] **Dark Mode** - UI looks good (if supported)

### Crash Testing
- [ ] **No Fatal Crashes** - App doesn't crash during normal use
- [ ] **ANR (App Not Responding)** - No UI freezes
- [ ] **Memory Leaks** - Long-term usage doesn't slow down
- [ ] **Network Failures** - Handled gracefully

---

## 📋 PHASE 6: PRODUCTION BUILD (Required)

### Build Type Decision
**Option A: AAB (Recommended - Smaller size)**
```bash
eas build --platform android --profile production
```

**Option B: APK (Universal compatibility)**
```bash
eas build --platform android --profile production --no-wait
```

### Build Checklist
- [ ] **EAS CLI Installed** - `npm install -g eas-cli`
- [ ] **EAS Login** - `eas login`
- [ ] **EAS Project Setup** - `eas build:configure`
- [ ] **Production Profile** - `eas.json` has production config
- [ ] **Build Triggered** - Started build on EAS
- [ ] **Build Success** - No build errors
- [ ] **Download AAB/APK** - Save to local machine
- [ ] **Test Built APK** - Install and test before uploading

---

## 📋 PHASE 7: PLAY STORE UPLOAD (Final Step)

### Pre-Upload
- [ ] **Google Play Console Access** - Have account credentials
- [ ] **App Created** - App already exists in console
- [ ] **AAB/APK Ready** - Signed production build ready
- [ ] **All Assets Ready** - Icons, screenshots, descriptions
- [ ] **Internal Testing Track** - Consider testing here first

### Upload Steps
1. [ ] Go to https://play.google.com/console
2. [ ] Select your app
3. [ ] Navigate to "Production" → "Create new release"
4. [ ] Upload AAB/APK file
5. [ ] Fill release notes (what's new)
6. [ ] Review release
7. [ ] Click "Start rollout to Production"

### Post-Upload
- [ ] **Review Status** - "Pending publication" (takes 1-3 days)
- [ ] **Pre-launch Report** - Check for issues found by Google
- [ ] **Fix Any Issues** - Address any warnings/rejections
- [ ] **Wait for Approval** - Usually 1-3 days
- [ ] **Monitor After Launch** - Check crash reports, reviews

---

## ⚠️ KNOWN ISSUES TO FIX BEFORE RELEASE

### Critical (Must Fix)
- [ ] **OTP Validation** - ✅ FIXED (test pending)
- [ ] **Backend Production URL** - ✅ Already configured
- [ ] **Firebase Removed** - ✅ Already removed

### High Priority (Strongly Recommended)
- [ ] **Error Messages** - Review all error messages are user-friendly
- [ ] **Loading States** - All API calls show loading indicators
- [ ] **Network Errors** - Proper retry mechanisms
- [ ] **OTP Timeout** - Currently 60s, user requested 3 minutes
- [ ] **Rate Limiting Messages** - Clear message when OTP blocked

### Medium Priority (Nice to Have)
- [ ] **Splash Screen** - Professional branding
- [ ] **Onboarding** - First-time user tutorial
- [ ] **Analytics** - Track user behavior (optional)
- [ ] **Crash Reporting** - Sentry/Firebase Crashlytics
- [ ] **App Updates** - In-app update prompts

---

## 🚨 BLOCKERS - DO NOT RELEASE UNTIL:

1. ✅ **OTP Test Passes** - User can login successfully
2. ❌ **Physical Device Test** - Tested on real Android phone
3. ❌ **Privacy Policy** - Hosted and URL provided
4. ❌ **Store Assets** - Icon, screenshots, descriptions ready
5. ❌ **Production Build** - AAB/APK built successfully
6. ❌ **Test APK Installed** - Final build tested before upload

---

## 📊 CURRENT STATUS

### What's Ready ✅
- [x] Backend API production-ready
- [x] Message Central OTP integration (fix deployed)
- [x] Firebase removed
- [x] Package name configured
- [x] Android build system working
- [x] Expo EAS setup

### What's NOT Ready ❌
- [ ] OTP fix tested and confirmed working
- [ ] Play Store assets (icon, screenshots, descriptions)
- [ ] Privacy policy URL
- [ ] Physical device testing
- [ ] Production AAB/APK build
- [ ] Google Play Console setup

---

## 🎯 ESTIMATED TIMELINE

**If everything works:**
- ⏰ **Today (Aug 7):** Test OTP fix, create assets, build APK
- ⏰ **Tomorrow (Aug 8):** Physical device test, privacy policy, upload to Play Store
- ⏰ **Aug 9-12:** Google review process (1-3 days)
- ⏰ **Aug 12-15:** Live on Play Store! 🎉

**Realistic timeline:**
- 📅 **Week 1 (Aug 7-14):** Fix remaining issues, test thoroughly, create assets
- 📅 **Week 2 (Aug 15-21):** Submit to Play Store, address review feedback
- 📅 **Week 3 (Aug 22+):** Live on Play Store

---

## 📞 RESOURCES

**Expo EAS Build:**
- Docs: https://docs.expo.dev/build/introduction/
- Dashboard: https://expo.dev/accounts/[your-account]/projects/pulsemateconnect21

**Google Play Console:**
- Console: https://play.google.com/console
- Guide: https://support.google.com/googleplay/android-developer/answer/9859152

**Testing:**
- Internal Testing: https://play.google.com/console → Testing → Internal testing
- Closed Beta: Invite testers before public release

---

## ✅ NEXT IMMEDIATE ACTIONS

1. **RIGHT NOW:** Test the OTP fix (wait for Render deployment)
2. **If OTP works:** Test on physical device
3. **Create store assets:** Icon, screenshots, descriptions
4. **Write privacy policy:** Host on website
5. **Build production APK:** `eas build --platform android --profile production`
6. **Final testing:** Install and thoroughly test APK
7. **Upload to Play Store:** Submit for review

---

**Bottom Line:** 🟡 **NOT READY YET** - Still need testing, assets, and privacy policy before Play Store submission.
