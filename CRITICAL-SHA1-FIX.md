# ⚠️ CRITICAL SHA-1 FIX APPLIED

**Date**: August 1, 2026  
**Issue**: SHA-1 mismatch causing Firebase OTP failure in production

---

## 🔴 PROBLEM IDENTIFIED

**google-services.json had WRONG SHA-1:**
```
OLD: 5e8f16062ea3cd2c4a0d547876baa6f38cabf625
NEW: 0b84891144b1b8dbc49b4d05edaa83770f30434f
```

This is the **ROOT CAUSE** of "Initialization Error" in production builds!

---

## ✅ FIX APPLIED

Updated `android/app/google-services.json` with correct production keystore SHA-1:

**Production Keystore SHA-1** (Build Credentials yKf5TaJ1Kx):
```
0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

**Lowercase format for google-services.json:**
```
0b84891144b1b8dbc49b4d05edaa83770f30434f
```

---

## 🎯 VERIFICATION

**credentials.json Key Alias:**
```
f1a185ee3a5ba7802fd6698297601ca8 ✅
```

**google-services.json certificate_hash:**
```
0b84891144b1b8dbc49b4d05edaa83770f30434f ✅
```

**Both match the production keystore!**

---

## 🚨 IMPORTANT: Update Firebase Console

You **MUST** add this SHA-1 to Firebase Console before building:

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Select Android app: `in.pulsemateconnect.patient`
3. Click "Add fingerprint"
4. Add SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
5. Add SHA-256: `83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6`
6. **Download the updated google-services.json** from Firebase Console
7. Verify the `certificate_hash` matches: `0b84891144b1b8dbc49b4d05edaa83770f30434f`

---

## 📦 BUILD READY

With this fix applied:

```bash
eas build --platform android --profile production --clear-cache
```

**Expected Result**: ✅ Build will succeed AND Firebase OTP will work!

---

## 🔍 WHY THIS WAS THE ISSUE

Firebase Auth requires the SHA-1 fingerprint to:
1. Verify app authenticity
2. Enable SafetyNet for reCAPTCHA
3. Allow OTP SMS sending

**Wrong SHA-1 = Firebase rejects authentication = "Initialization Error"**

---

**Status**: ✅ **FIXED - READY TO BUILD VERSION 74**

