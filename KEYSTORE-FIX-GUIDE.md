# 🔑 Keystore Fix - Step by Step Guide

## Problem
EAS keeps generating NEW keystores each build, causing different signatures.

## Solution
Download the existing keystore that matches Play Console expectations and reuse it.

---

## OPTION 1: Download Existing Keystore from EAS (RECOMMENDED)

### Step 1: Run This Command
```bash
eas credentials
```

### Step 2: Menu Navigation
When you see the menus, select in this order:

**1st Menu - Select Platform:**
```
> Android
```

**2nd Menu - What do you want to do:**
```
> credentials.json: Upload/Download credentials between EAS servers and your local json
```

**3rd Menu - Action:**
```
> Download credentials from EAS to credentials.json
```

**4th Menu - Select build credentials:**
```
> Select the one that shows SHA1: 67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D
```

This will download:
- `credentials.json` with keystore info
- `credentials/android/keystore.jks` file

### Step 3: Rebuild with Downloaded Keystore
```bash
eas build --platform android --profile production
```

EAS will now use the downloaded keystore from `credentials.json`

---

## OPTION 2: If Keystore Not Found in EAS

If you can't find the keystore with SHA1 `67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D`:

### Then Accept NEW Certificate in Play Console

1. Go to Play Console: https://play.google.com/console
2. Go to **Setup → App integrity** (or **App signing**)
3. Click **"Request upload key reset"**
4. Follow instructions to register the NEW certificate:
   - SHA1: `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72`

---

## What Each Menu Does:

### Menu 1: Platform
- **Android** = Manage Android certificates
- iOS = For iPhone (not needed)
- Exit = Cancel

### Menu 2: What to do
- **Keystore** = Create/manage signing keys
- Google Service Account = For auto-publishing (not needed now)
- Push Notifications = FCM setup (already done)
- **credentials.json** = Download/Upload existing keys ✅ USE THIS
- Go back = Previous menu
- Exit = Cancel

### Menu 3: credentials.json action
- **Download** = Get keystore from EAS to your computer ✅ USE THIS
- Upload = Send keystore from computer to EAS
- Exit = Cancel

### Menu 4: Which credentials
- Select the one showing your app name
- Look for SHA1 fingerprint that matches what Play Console expects

---

## Quick Commands

### Download keystore from EAS:
```bash
eas credentials
# Then: Android > credentials.json > Download
```

### Check what keystores exist:
```bash
eas credentials
# Then: Android > Keystore > View all
```

### Build with local credentials:
```bash
eas build --platform android --profile production
```

---

## Current Status

**Play Console expects:** `67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D`

**Latest build has:** `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72`

**Action needed:**
1. Download keystore with correct SHA1 from EAS
2. OR register new SHA1 in Play Console

---

## Files to Check After Download

After running the download, you should have:

```
pulsemate123/
├── credentials.json          ← Keystore passwords and paths
└── credentials/
    └── android/
        └── keystore.jks      ← The actual keystore file
```

Add these to `.gitignore`:
```
credentials.json
credentials/
```

---

## Test the Keystore

To verify the keystore signature:
```bash
keytool -list -v -keystore credentials/android/keystore.jks
```

It should show SHA1: `67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D`
