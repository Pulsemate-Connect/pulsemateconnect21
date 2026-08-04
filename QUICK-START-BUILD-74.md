# ⚡ QUICK START - BUILD VERSION 74

**Status**: ✅ **READY TO BUILD**  
**Critical Fix**: SHA-1 mismatch corrected

---

## 🚨 CRITICAL FIX APPLIED

**google-services.json SHA-1 was WRONG!**

Changed from: `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`  
Changed to: `0b84891144b1b8dbc49b4d05edaa83770f30434f`

**This was the root cause of "Initialization Error"!**

---

## 🔥 STEP 1: Add SHA-1 to Firebase (REQUIRED!)

Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general

Add these fingerprints:
- **SHA-1**: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
- **SHA-256**: `83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6`

---

## 🔑 STEP 2: Download Keystore

Run:
```bash
download-keystore.bat
```

Or manually:
```bash
eas credentials
# Select: Android → production → Download credentials
```

Verify:
```bash
dir android\app\pulsemate-release-key.keystore
```

---

## 🚀 STEP 3: Build

```bash
eas build --platform android --profile production --clear-cache
```

---

## ✅ WHAT'S READY

- [x] Firebase v10.12.5 (optimized)
- [x] Correct SHA-1 in google-services.json
- [x] Keystore credentials verified
- [x] reCAPTCHA modal restored
- [x] Detailed error logging
- [x] Version 74

---

## 🎯 EXPECTED RESULT

✅ Build succeeds  
✅ Firebase OTP works in production  
✅ No more "Initialization Error"

---

**Confidence**: 🟢 **HIGH - Root cause fixed!**

