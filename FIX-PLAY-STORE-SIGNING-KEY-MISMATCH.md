# 🔑 FIX: Play Store Signing Key Mismatch

**Issue:** AAB rejected - "Your Android App Bundle is signed with the wrong key"  
**Date:** August 7, 2026  
**Status:** 🔴 CRITICAL - Blocks Play Store upload  

---

## 🔍 PROBLEM SUMMARY

### Google Play Console Error:
```
Your Android App Bundle is signed with the wrong key. 
Ensure that your App Bundle is signed with the correct signing key and try again.

Expected certificate fingerprint:
SHA1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F

But the certificate used to sign the App Bundle you uploaded has fingerprint:
SHA1: 56:39:95:C3:CD:73:07:E4:93:CF:75:2A:F4:37:FD:2E:09:2C:B2:61
```

### What This Means:
- **Play Console expects:** SHA1 ending in `...0F:30:43:4F` (old keystore)
- **Your AAB is signed with:** SHA1 ending in `...09:2C:B2:61` (EAS keystore)
- **Root cause:** Previously uploaded app was signed with a different keystore
- **Impact:** Cannot update existing app in Play Store

---

## 🎯 SOLUTION OPTIONS

### **OPTION 1: Use Existing Keystore (Upload to EAS) ✅ RECOMMENDED**

This is the **correct** solution if you have the original keystore that was used for the previous upload.

#### What You Need:
- Original `.jks` or `.keystore` file (SHA1: 0B:84:89:11:44:B1:B8:DB...)
- Keystore password
- Key alias name
- Key password

#### Steps:

##### 1. Find Your Original Keystore
Check these locations:
```bash
# Common locations
c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\android\app\
c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21\
c:\Users\shubh\.android\
```

Look for files named:
- `*.jks`
- `*.keystore`
- `pulsemateconnect.jks`
- `release.keystore`
- `upload-keystore.jks`

##### 2. Verify It's The Correct Keystore
```bash
# Check SHA1 fingerprint
keytool -list -v -keystore path\to\your.jks -alias your_alias

# Should show:
# SHA1: 0B:84:89:11:44:B1:B8:DB:C4:9B:4D:05:ED:AA:83:77:0F:30:43:4F
```

##### 3. Upload Keystore to EAS
```bash
# Navigate to project
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

# Upload keystore to EAS
eas credentials

# Follow prompts:
# 1. Select: Android → Production
# 2. Select: "Set up a new keystore"
# 3. Choose: "Upload an existing keystore"
# 4. Provide keystore file path
# 5. Enter keystore password
# 6. Enter key alias
# 7. Enter key password
```

##### 4. Update `eas.json` to Use Uploaded Keystore
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "remote"
      }
    }
  }
}
```

##### 5. Rebuild AAB with Correct Keystore
```bash
# Increment version code first (currently at 79, make it 80)
# Edit app.json: "versionCode": 80

# Build with uploaded keystore
eas build --platform android --profile production
```

##### 6. Verify New AAB Signature
```bash
# Download new AAB from EAS
# Extract upload certificate:
bundletool dump certificate --bundle=application-*.aab

# Should show SHA1: 0B:84:89:11:44:B1:B8:DB...0F:30:43:4F ✅
```

##### 7. Upload to Play Console
- Upload new AAB (Build 80)
- Should be accepted ✅

---

### **OPTION 2: Use Play App Signing (Migration) ⚠️ COMPLEX**

If you **DON'T have the original keystore**, you can migrate to Google Play App Signing.

#### Prerequisites:
- You must be the **original app owner** in Play Console
- App must not already be using Play App Signing
- Access to Play Console settings

#### Steps:

##### 1. Check Current Play App Signing Status
1. Go to: https://play.google.com/console
2. Select: **PulseMate Connect**
3. Navigate: **Setup → App integrity → App signing**
4. Check if it says: "Your app is not enrolled in Play App Signing"

##### 2. If NOT Enrolled - Enroll Now
1. Click: **"Use Play App Signing"**
2. Select: **"Use a different key"** (since you don't have original)
3. Generate new upload key certificate
4. Download new upload key (`.pepk` file)
5. Follow Google's instructions to complete enrollment

##### 3. Generate New Upload Keystore
```bash
# This will be your NEW keystore going forward
keytool -genkeypair -v \
  -keystore upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype JKS \
  -storepass your_password \
  -keypass your_password \
  -dname "CN=PulseMate Connect, OU=Mobile, O=PulseMate, L=Bangalore, ST=Karnataka, C=IN"
```

##### 4. Upload New Keystore to Play Console
1. Go to: **App signing** page
2. Upload the `.pepk` file generated in step 2
3. Confirm migration

##### 5. Upload New Keystore to EAS (Same as Option 1, Step 3)

##### 6. Rebuild and Upload
- Build new AAB with new keystore
- Upload to Play Console
- Should be accepted ✅

---

### **OPTION 3: Create New App Listing ❌ NOT RECOMMENDED**

**Only if:**
- You don't have original keystore
- Can't migrate to Play App Signing
- Haven't launched to production yet

**Consequences:**
- Lose all existing Play Console data
- New package name required
- Users can't update (must uninstall/reinstall)
- Lose reviews, ratings, installs count

**Steps:**
1. Create new package name (e.g., `in.pulsemateconnect.patient.v2`)
2. Update `app.json`: `"package": "in.pulsemateconnect.patient.v2"`
3. Create new app in Play Console
4. Upload AAB
5. Complete new app setup

---

## 🔍 FIND YOUR ORIGINAL KEYSTORE

### Check Project Directory
<function_calls>
<invoke name="file_search">
<parameter name="explanation">Searching for keystore files in the project