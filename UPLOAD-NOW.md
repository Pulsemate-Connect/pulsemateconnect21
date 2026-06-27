# ✅ READY TO UPLOAD - Follow These Steps

## Files Ready:
- ✅ AAB: `pulsemate-v1.0.0-build4.aab`
- ✅ Certificate: `upload_certificate_new.pem`

---

## STEP 1: Register Certificate in Play Console

### 1a. Go to Play Console
Open: https://play.google.com/console

### 1b. Select Your App
Click on: **PulseMate Connect**

### 1c. Go to App Integrity
- In left sidebar, look for **"Setup"** section
- Click **"App integrity"** or **"App signing"**

### 1d. Register New Certificate
Look for ONE of these buttons/links:
- **"Request upload key reset"** ← Click this
- **"Choose signing key"** ← Or this
- **"Use App Signing by Google Play"** ← Or this

Click it and follow the wizard.

### 1e. Upload Certificate
- When asked for certificate file
- Upload: `upload_certificate_new.pem`
- Click "Save" or "Continue"

---

## STEP 2: Upload AAB

### 2a. Go to Internal Testing
- In left sidebar, click **"Testing"**
- Click **"Internal testing"**

### 2b. Create Release
- Click **"Create new release"** button

### 2c. Upload AAB
- Click **"Upload"**
- Select file: `pulsemate-v1.0.0-build4.aab`
- Wait for upload to complete

### 2d. Add Release Notes
```
Version 1.0.0 - Initial Release

Features:
• Find nearby clinics and doctors
• Book appointments instantly  
• Dynamic session management
• Secure payments with Razorpay
• Push notifications
• Digital health records

What's New:
✓ Target SDK 34
✓ Android 13+ compliance
✓ Improved session booking
✓ Enhanced clinic search
✓ Bug fixes and improvements

First public release!
```

### 2e. Review and Start Rollout
- Click **"Review release"**
- Check everything looks good
- Click **"Start rollout to Internal testing"**

---

## ✅ DONE!

Your app will now be in internal testing!

**Next Steps:**
1. Test the app from Play Store internal testing
2. When ready, promote to Production
3. Wait 1-7 days for Google review
4. App goes live! 🎉

---

## Certificate Details

**File:** `upload_certificate_new.pem`  
**Keystore SHA1:** `83:13:6E:61:E2:3A:AC:50:14:6A:D7:63:C4:13:FD:14:AF:E2:7F:72`

This certificate matches the AAB file you're uploading.

---

## If You Get Stuck

**Error:** "Certificate already registered"  
**Solution:** The certificate is already accepted! Skip to STEP 2.

**Error:** "Wrong certificate"  
**Solution:** Make sure you uploaded `upload_certificate_new.pem`, not `upload_certificate.pem`

**Error:** "App signing not set up"  
**Solution:** Click "Use App Signing by Google Play" and follow wizard first

---

## Current Status

- ✅ AAB built with version code 4
- ✅ Certificate extracted
- ✅ AD_ID permission added
- ✅ Target SDK 34
- ⏳ Waiting for you to upload to Play Console

**START WITH STEP 1 ABOVE!** 🚀
