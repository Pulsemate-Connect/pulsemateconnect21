# 🚀 PulseMate Production Build Info

## Latest Build - Version 1.0.0 (Build 4)

**Build Date:** June 26, 2026  
**Build ID:** 0af756d9-3732-4aff-8ee6-ff75641c57c8  
**Platform:** Android  
**Format:** AAB (Android App Bundle)

---

## Build Details

- **Package:** `in.pulsemateconnect.app`
- **Version:** 1.0.0
- **Version Code:** 4
- **Target SDK:** 34
- **Build Type:** Production (Release)
- **Signing:** Expo Managed (Remote)

---

## Download Links

**AAB File:**
```
https://expo.dev/artifacts/eas/RPsr0e1kFPL6rrsesiTnwlluSJW0vWnjFRDTosyRNj4.aab
```

**Local File:** `pulsemate-v1.0.0-build4.aab`

**Build Logs:**
```
https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds/0af756d9-3732-4aff-8ee6-ff75641c57c8
```

---

## What's Included in This Build

✅ **Version Code 4** - Fixes "version code 3 already used" error  
✅ **AD_ID Permission** - Required for Android 13+ (API 33)  
✅ **Target SDK 34** - Meets Play Store requirements  
✅ **Dynamic Sessions** - Complete session management system  
✅ **Production API** - https://api.pulsemateconnect.in/api  
✅ **Firebase Integration** - Push notifications enabled  
✅ **Location Services** - Find nearby clinics  
✅ **Payment Gateway** - Razorpay integration  

---

## Next Steps to Upload to Play Console

### 1. Fix Signing Key Issue (CRITICAL)

In Google Play Console:
1. Go to **Setup → App signing** (or **App integrity**)
2. Look for **"Request upload key reset"** or **"Use App Signing by Google Play"**
3. Click it
4. Accept the new certificate with SHA1: `67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D`

### 2. Upload AAB

1. Go to **Testing → Internal testing**
2. Click **"Create new release"**
3. Upload: `pulsemate-v1.0.0-build4.aab`
4. Add release notes (see below)
5. Click **"Review release"**
6. Click **"Start rollout to Internal testing"**

### 3. Release Notes

```
Version 1.0.0 - Initial Release

🎉 Welcome to PulseMate Connect!

Features:
• Find nearby clinics and doctors
• Book appointments instantly
• Dynamic session management (Morning/Afternoon/Evening)
• Secure payment integration with Razorpay
• Real-time appointment tracking
• Push notifications for reminders
• Digital health records

What's New:
✓ Updated to Target SDK 34
✓ Added Android 13+ advertising ID compliance
✓ Improved session booking flow
✓ Enhanced location-based clinic search
✓ Bug fixes and performance improvements

This is our first public release. More features coming soon!
```

---

## Build Configuration

**From eas.json:**
```json
{
  "production": {
    "android": {
      "buildType": "app-bundle",
      "gradleCommand": ":app:bundleRelease",
      "credentialsSource": "remote"
    },
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

**Key Permissions:**
- Internet access
- Network state
- Location (fine & coarse)
- Boot completed (notifications)
- Vibrate
- Push notifications
- Advertising ID (Android 13+)

---

## Keystore Information

**Type:** Remote (Expo Managed)  
**Keystore Name:** pulsemate connect (default)  
**Managed By:** Expo Application Services (EAS)

**Current Certificate SHA1:**
```
67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D
```

**Note:** This certificate needs to be registered in Play Console before uploading.

---

## Previous Builds

| Version | Build ID | Date | Status |
|---------|----------|------|--------|
| 1.0.0 (versionCode 4) | 0af756d9-3732-4aff-8ee6-ff75641c57c8 | June 26, 2026 | ✅ Current |
| 1.0.0 (versionCode 3) | Previous | June 26, 2026 | ❌ Version conflict |
| 1.0.0 (versionCode 2) | Previous | June 26, 2026 | ❌ Signing mismatch |

---

## Testing Before Upload

To test this AAB locally (optional):

1. **Install bundletool:**
```bash
npm install -g bundletool
```

2. **Generate APKs from AAB:**
```bash
bundletool build-apks --bundle=pulsemate-v1.0.0-build4.aab --output=pulsemate.apks --mode=universal
```

3. **Extract and install:**
```bash
unzip pulsemate.apks
adb install universal.apk
```

---

## Support & Resources

**Expo Build Dashboard:**  
https://expo.dev/accounts/shubhamskkk/projects/pulsemate-app/builds

**Play Console:**  
https://play.google.com/console

**App Package:**  
https://play.google.com/store/apps/details?id=in.pulsemateconnect.app (once published)

---

**Status:** ✅ Build successful, ready for Play Console upload after fixing signing key

**Next Action:** Register the new certificate in Play Console App Signing settings
