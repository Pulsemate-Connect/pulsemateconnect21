# 🔐 PRODUCTION KEYSTORE INFORMATION

**Last Verified**: August 1, 2026  
**Source**: EAS Build Credentials yKf5TaJ1Kx  
**Status**: ✅ **VERIFIED AND CONFIGURED**

---

## 📋 KEYSTORE DETAILS

### **Build Credentials ID**
```
yKf5TaJ1Kx
```

### **Keystore Type**
```
JKS (Java KeyStore)
```

### **Key Alias**
```
f1a185ee3a5ba7802fd6698297601ca8
```

### **MD5 Fingerprint**
```
D7:00:F6:FD:7E:64:82:11:51:E4:86:2C:36:2B:91:6F
```

### **SHA-1 Fingerprint**
```
0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

### **SHA-256 Fingerprint**
```
83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

### **Last Updated**
```
4 days ago (from August 1, 2026)
```

---

## ✅ VERIFICATION STATUS

### **credentials.json**
```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/app/pulsemate-release-key.keystore",
      "keystorePassword": "59f1eb1d193744c0ae6d420664f0c77b",
      "keyAlias": "f1a185ee3a5ba7802fd6698297601ca8",
      "keyPassword": "4850e619405a4963a749151ac3ed2f76"
    }
  }
}
```

✅ **Key Alias Matches**: `f1a185ee3a5ba7802fd6698297601ca8`

### **google-services.json**
```json
{
  "android_info": {
    "package_name": "in.pulsemateconnect.patient",
    "certificate_hash": "0b84891144b1b8dbc49b4d05edaa83770f30434f"
  }
}
```

✅ **SHA-1 Matches**: `0b84891144b1b8dbc49b4d05edaa83770f30434f` (lowercase, no colons)

⚠️ **CRITICAL**: This was previously WRONG (had `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`)  
**Fixed on**: August 1, 2026  
**This was the ROOT CAUSE of Firebase OTP "Initialization Error" in production!**

### **Firebase Console**

**Required SHA Fingerprints** (must be added to Firebase Console):

1. **SHA-1** (Production):
   ```
   0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
   ```

2. **SHA-256** (Production):
   ```
   83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
   ```

✅ **Status**: These fingerprints are already added to Firebase Console

---

## 📦 PACKAGE INFORMATION

### **Package Name**
```
in.pulsemateconnect.patient
```

### **Application ID** (from build.gradle)
```
in.pulsemateconnect.patient
```

✅ **Matches**: Package name and application ID are consistent

---

## 🔧 CONFIGURATION FILES

### **Files Using This Keystore:**

1. **`credentials.json`**
   - Location: `./credentials.json`
   - Purpose: EAS Build configuration
   - Status: ✅ Configured with correct key alias

2. **`android/app/pulsemate-release-key.keystore`**
   - Location: `./android/app/pulsemate-release-key.keystore`
   - Purpose: Actual keystore file
   - Status: ✅ Downloaded from EAS

3. **`google-services.json`**
   - Location: `./android/app/google-services.json`
   - Purpose: Firebase Android configuration
   - Status: ✅ Contains correct SHA-1

4. **`eas.json`**
   - Location: `./eas.json`
   - Purpose: EAS Build configuration
   - Status: ✅ Uses `credentialsSource: "local"`

---

## 🎯 USAGE

### **For EAS Builds:**
```bash
eas build --platform android --profile production
```

EAS will automatically:
- Use keystore from `credentials.json`
- Sign AAB with production keystore
- Generate consistent SHA-1 and SHA-256 fingerprints

### **For Firebase Configuration:**

**Always use these fingerprints in Firebase Console:**

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Select Android app: `in.pulsemateconnect.patient`
3. Add SHA fingerprints:
   - SHA-1: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
   - SHA-256: `83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6`
4. Download new `google-services.json`
5. Replace `android/app/google-services.json`

---

## ⚠️ IMPORTANT NOTES

### **DO NOT:**
- ❌ Change key alias in `credentials.json`
- ❌ Delete or modify `pulsemate-release-key.keystore`
- ❌ Use different keystore for production builds
- ❌ Share keystore passwords publicly

### **ALWAYS:**
- ✅ Use EAS Build Credentials `yKf5TaJ1Kx`
- ✅ Keep `credentials.json` in sync with keystore
- ✅ Verify SHA-1 in Firebase Console matches this document
- ✅ Download fresh `google-services.json` after adding fingerprints

---

## 🔍 VERIFICATION COMMANDS

### **Verify Key Alias:**
```bash
keytool -list -v -keystore android/app/pulsemate-release-key.keystore -alias f1a185ee3a5ba7802fd6698297601ca8
```

**Expected output:**
```
Alias name: f1a185ee3a5ba7802fd6698297601ca8
Owner: ...
MD5:  D7:00:F6:FD:7E:64:82:11:51:E4:86:2C:36:2B:91:6F
SHA1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
SHA256: 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6
```

### **Verify google-services.json SHA-1:**
```bash
type android\app\google-services.json | findstr "certificate_hash"
```

**Expected output:**
```
"certificate_hash": "0b84891144b1b8dbc49b4d05edaa83770f30434f"
```

---

## 📊 KEYSTORE HISTORY

| Version | Build Credentials | SHA-1 | Status |
|---------|------------------|-------|--------|
| 1-72 | yKf5TaJ1Kx | 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F | ✅ Working |
| 73 | yKf5TaJ1Kx | Same | ❌ Build failed (Gradle) |
| 74 | yKf5TaJ1Kx | Same | 🔄 In progress (JavaScript bundling issue) |

**Keystore Consistency**: ✅ Same keystore used across all versions

---

## 🔐 SECURITY

### **Keystore Password**
```
59f1eb1d193744c0ae6d420664f0c77b
```

### **Key Password**
```
4850e619405a4963a749151ac3ed2f76
```

**⚠️ IMPORTANT**: 
- These passwords are stored in `credentials.json`
- Do NOT share `credentials.json` publicly
- Do NOT commit `credentials.json` to public repositories
- Keep backups of keystore and passwords securely

---

## 🎯 TROUBLESHOOTING

### **Issue: "SHA fingerprints don't match"**

**Cause**: Firebase Console has different SHA-1 than actual keystore

**Solution**:
1. Use the SHA-1 from this document: `0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F`
2. Add to Firebase Console (if not already there)
3. Download fresh `google-services.json`
4. Replace `android/app/google-services.json`

### **Issue: "Play Store rejects AAB due to signing"**

**Cause**: Using wrong keystore or key alias

**Solution**:
1. Verify `credentials.json` has key alias: `f1a185ee3a5ba7802fd6698297601ca8`
2. Verify keystore file exists: `android/app/pulsemate-release-key.keystore`
3. Rebuild with: `eas build --platform android --profile production`

### **Issue: "Firebase OTP fails in production"**

**Cause**: SHA fingerprints not added to Firebase Console

**Solution**:
1. Go to Firebase Console
2. Add both SHA-1 and SHA-256 from this document
3. Download new `google-services.json`
4. Rebuild app

---

## 📚 REFERENCES

- **EAS Build Credentials**: https://expo.dev/accounts/pulsemateconnecttt/projects/pulsemate-app/credentials
- **Firebase Console**: https://console.firebase.google.com/project/pulsemateconnect/settings/general
- **Play Console**: https://play.google.com/console

---

## ✅ CHECKLIST FOR NEW BUILDS

Before building a new version:

- [ ] Verify `credentials.json` has correct key alias
- [ ] Verify `pulsemate-release-key.keystore` exists
- [ ] Verify `google-services.json` has correct SHA-1
- [ ] Verify Firebase Console has both SHA-1 and SHA-256
- [ ] Version number incremented correctly
- [ ] EAS config uses `credentialsSource: "local"`

---

**Document Created**: August 1, 2026  
**Last Verified**: August 1, 2026  
**Status**: ✅ **ALL CREDENTIALS VERIFIED AND CONFIGURED**  
**Build Credentials ID**: yKf5TaJ1Kx (EAS)
