# 🚀 Build AAB v1.3.7 - Step-by-Step Instructions

**Date:** August 5, 2026  
**Version:** 1.3.7 (Build 77)  
**Critical Fix:** Backend SMS authentication (initialization error resolved)  
**Status:** ✅ Version updated and pushed to Git (commit 9449537)

---

## ⚡ TL;DR - Quick Steps

```bash
# 1. Fix login
eas logout
eas login  # Use: ramnathdurgadevienterprise@gmail.com
eas whoami  # Verify: pulsemateconnecttt

# 2. Build AAB
eas build --platform android --profile production

# 3. Wait 20-30 minutes

# 4. Download
eas build:download --platform android --latest
```

---

## ⚠️ CRITICAL: Login Required First!

### **Current Problem**
Your EAS login: `pulsemateconnect@gmail.com` ❌  
Required login: `ramnathdurgadevienterprise@gmail.com` ✅

The AAB build **WILL FAIL** without the correct account!

### **Fix Login Now**

Open Command Prompt or PowerShell and run:

```bash
eas logout
```

Then login:

```bash
eas login
```

**Enter:**
- Email: `ramnathdurgadevienterprise@gmail.com`
- Password: [Your password for this account]

**Verify:**

```bash
eas whoami
```

Should show:
```
pulsemateconnecttt
ramnathdurgadevienterprise@gmail.com
```

---

## 🔨 Build the AAB

### **Method 1: Automated Script (Easiest)**

1. Open File Explorer
2. Navigate to: `c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21`
3. Double-click: **`BUILD-AAB-v1.3.7.bat`**
4. Follow the on-screen prompts

The script will:
- ✅ Check your EAS login
- ✅ Start the AAB build
- ✅ Show progress
- ✅ Provide next steps

---

### **Method 2: Command Line (Manual)**

Open Command Prompt in the project folder:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas build --platform android --profile production
```

**You'll see:**
```
✔ Select platform: Android
✔ Select build profile: production
✔ Credentials: Using remote credentials
```

Build will start uploading...

---

## ⏱️ What Happens During Build

### **Phase 1: Upload (2-5 minutes)**
```
📤 Uploading project files to EAS servers...
   ├─ Compressing source code
   ├─ Uploading ~50-100 MB
   └─ Verifying upload
```

### **Phase 2: Queue (0-5 minutes)**
```
⏳ Waiting for build slot...
   └─ Depends on current EAS load
```

### **Phase 3: Build (15-20 minutes)**
```
🔨 Building on EAS cloud servers...
   ├─ Installing dependencies
   ├─ Compiling React Native
   ├─ Building Android native code
   ├─ Bundling JavaScript
   ├─ Signing with keystore
   └─ Creating AAB file
```

### **Phase 4: Complete**
```
✅ Build completed successfully!
   └─ AAB file ready for download
```

**Total Time:** 20-30 minutes

---

## 📊 Monitor Build Progress

### **Option 1: Command Line**

Check all builds:
```bash
eas build:list
```

Output shows:
- Build ID
- Status (in-queue, in-progress, finished)
- Platform
- Profile
- Created date

### **Option 2: Web Dashboard**

Open in browser:
```
https://expo.dev/accounts/pulsemateconnecttt/projects/pulsemate-app/builds
```

You'll see:
- Live build progress
- Real-time logs
- Download button (when complete)

### **Option 3: Live Logs**

Watch build in real-time:
```bash
eas build:view [BUILD_ID]
```

Replace `[BUILD_ID]` with the ID from `eas build:list`

---

## 📥 Download AAB After Build

### **You'll Receive Email**
EAS sends email when build completes:
- Subject: "Build finished for PulseMate Connect"
- Contains download link

### **Download via Command**

```bash
eas build:download --platform android --latest
```

AAB downloads to current folder:
- File name: `build-[BUILD_ID].aab`
- Size: ~40-50 MB

### **Download via Web**

1. Go to: https://expo.dev/accounts/pulsemateconnecttt/projects/pulsemate-app/builds
2. Find latest build (v1.3.7)
3. Click **"Download"** button
4. Save AAB file

---

## 🧪 Test AAB Locally (Optional)

AAB files cannot be installed directly. Convert to APK first:

### **Prerequisites**
```bash
# Download bundletool (one-time)
curl -L -o bundletool.jar https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar
```

### **Convert AAB to APK**

```bash
# Generate APKs
java -jar bundletool.jar build-apks --bundle=build-[BUILD_ID].aab --output=app.apks --mode=universal

# Extract universal APK
unzip -p app.apks universal.apk > app-1.3.7.apk

# Install on device
adb install app-1.3.7.apk
```

### **Test on Device**

1. Connect Android device via USB
2. Enable USB debugging
3. Install APK
4. Test OTP login flow
5. Verify no "initialization error"

---

## 🚀 Upload to Play Store

### **Step 1: Open Play Console**

```
https://play.google.com/console/
```

**Login with:** Play Store publisher account

### **Step 2: Select App**

- Find "PulseMate Connect"
- Click to open

### **Step 3: Create Release**

1. Navigate: **Release** → **Production** → **Releases**
2. Click: **"Create new release"**
3. Click: **"Upload"** button
4. Select: `build-[BUILD_ID].aab`
5. Wait for upload (1-2 minutes)

### **Step 4: Add Release Notes**

**Copy this into Play Console:**

```
What's New in v1.3.7:

🔧 Critical Bug Fix
• Fixed app crash on startup
• Resolved "Initialization Error: undefined is not a function"
• Improved authentication stability

🚀 Performance Improvements  
• Faster OTP delivery via backend SMS
• More reliable phone authentication
• Better error handling and recovery

📱 User Experience
• Smoother login process
• Clearer error messages
• Overall performance improvements

⚠️ Important Update
This is a critical stability fix. Please update to v1.3.7 for the best experience.
```

### **Step 5: Review Changes**

Play Console will show:
- Version code: 77 (increased from 76)
- Version name: 1.3.7 (increased from 1.3.6)
- APK/AAB details
- Permissions (no changes)

### **Step 6: Choose Rollout Strategy**

**Option A: Full Rollout (Recommended)**
- **100% immediately**
- Reason: Critical bug fix
- All users get update ASAP

**Option B: Staged Rollout**
- Day 1: 10% of users
- Day 2: 25% of users
- Day 3: 50% of users
- Day 4: 100% of users

**Recommendation:** Use **Option A** (Full Rollout) because:
- This is a critical crash fix
- Users cannot use app without this fix
- Faster is better for user experience

### **Step 7: Start Rollout**

1. Click: **"Review release"**
2. Verify all information
3. Click: **"Start rollout to Production"**
4. Confirm

### **Step 8: Monitor**

**First 24 Hours:**
- Check crash rate in Play Console
- Monitor user reviews
- Watch for reported issues

**Expected Results:**
- ✅ Crash rate drops significantly
- ✅ Positive user feedback
- ✅ Login success rate improves
- ✅ No "initialization error" reports

---

## ✅ Success Checklist

### **Build Phase**
- [ ] Logged into correct EAS account (pulsemateconnecttt)
- [ ] AAB build started successfully
- [ ] Build completed without errors
- [ ] AAB file downloaded

### **Testing Phase (Optional)**
- [ ] AAB converted to APK
- [ ] Installed on test device
- [ ] App opens without crash
- [ ] OTP login works
- [ ] No "initialization error"

### **Play Store Phase**
- [ ] AAB uploaded to Play Console
- [ ] Release notes added
- [ ] Version increased to 1.3.7 (Build 77)
- [ ] Rollout strategy selected
- [ ] Release started

### **Post-Release Phase**
- [ ] Monitoring crash reports (should decrease)
- [ ] Checking user reviews
- [ ] Verifying fix works in production
- [ ] No new critical issues

---

## 🔐 Important Information

### **EAS Credentials**
- **Username:** pulsemateconnecttt
- **Email:** ramnathdurgadevienterprise@gmail.com
- **Project ID:** 31fca56b-a99e-4219-bb3f-600d8b0c86b7

### **Keystore (EAS Managed)**
- **ID:** yKf5TaJ1Kx
- **Type:** JKS
- **Key Alias:** f1a185ee3a5ba7802fd6698297601ca8
- **SHA-256:** 83:39:B0:5E:31:F4:08:E4:43:F4:76:7D:43:E3:65:1A:91:50:1D:F1:87:33:95:C2:17:B2:BB:18:78:5D:7B:B6

### **App Details**
- **Package:** in.pulsemateconnect.patient
- **Version:** 1.3.7
- **Build Number:** 77
- **Target SDK:** 34

---

## 🐛 Troubleshooting

### **"Entity not authorized" Error**

**Problem:** Wrong EAS account

**Solution:**
```bash
eas logout
eas login  # Use: ramnathdurgadevienterprise@gmail.com
eas whoami  # Verify
```

---

### **Build Fails During Upload**

**Problem:** Network or file size issue

**Solutions:**
1. Check internet connection
2. Try again
3. Use: `eas build --clear-cache`

---

### **Build Fails During Compilation**

**Problem:** Code error or dependency issue

**Solutions:**
1. Check build logs: `eas build:view [BUILD_ID]`
2. Look for specific error
3. Fix locally and push
4. Rebuild

---

### **"Build taking too long"**

**Normal:** 20-30 minutes is expected

**If > 45 minutes:**
1. Check EAS status: https://status.expo.dev/
2. Check build logs for stuck step
3. Cancel and restart if needed

---

## 📞 Quick Reference

### **Essential Commands**

```bash
# Login
eas logout
eas login

# Verify account
eas whoami

# Build AAB
eas build --platform android --profile production

# Check builds
eas build:list

# Download AAB
eas build:download --platform android --latest

# View logs
eas build:view [BUILD_ID]
```

### **Important URLs**

- **EAS Dashboard:** https://expo.dev/accounts/pulsemateconnecttt/projects/pulsemate-app
- **Play Console:** https://play.google.com/console/
- **Firebase Console:** https://console.firebase.google.com/project/pulsemateconnect
- **GitHub Repo:** https://github.com/Pulsemate-Connect/pulsemateconnect21

---

## 📚 Additional Documentation

- **`BUILD-AAB-NOW.txt`** - Quick visual guide
- **`AAB-BUILD-GUIDE-v1.3.7.md`** - Complete detailed guide
- **`APP-STATUS-FINAL.md`** - Full project status
- **`ACTION-REQUIRED-NOW.md`** - Deployment checklist

---

## 🎯 What's Next

### **Immediate (Today)**
1. ✅ Fix EAS login
2. ✅ Build AAB v1.3.7
3. ⏳ Wait for build (20-30 min)
4. 📥 Download AAB
5. 🧪 Test (optional)

### **This Week**
1. 🚀 Upload to Play Store
2. 📝 Add release notes
3. 🎯 Start rollout
4. 📊 Monitor metrics
5. 👥 Check user feedback

### **Ongoing**
1. Monitor crash reports (should decrease)
2. Track authentication success rate (should improve)
3. Respond to user reviews
4. Plan next feature updates

---

**Last Updated:** August 5, 2026 - 5:05 AM IST  
**Version:** 1.3.7 (Build 77)  
**Git Commit:** 9449537  
**Status:** ✅ Ready to build (fix login first!)

---

**🚀 START NOW: Run `eas logout` and `eas login`!**
