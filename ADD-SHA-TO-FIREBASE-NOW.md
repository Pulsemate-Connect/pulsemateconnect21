# 🔐 ADD THESE SHA CERTIFICATES TO FIREBASE NOW

**Status:** Found debug SHA certificates  
**Action Required:** Add to Firebase Console to fix OTP

---

## 📋 YOUR SHA CERTIFICATES

### **Debug SHA-1:**
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

### **Debug SHA-256:**
```
FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

---

## 🎯 ADD TO FIREBASE CONSOLE (5 MINUTES)

### **Step 1: Open Firebase Console**
Go to: https://console.firebase.google.com/

### **Step 2: Select Your Project**
Click on "PulseMate Connect" (or your project name)

### **Step 3: Go to Project Settings**
1. Click the ⚙️ gear icon (top left)
2. Click "Project settings"

### **Step 4: Find Your Android App**
Scroll down to "Your apps" section

### **Step 5: Add SHA Certificates**
1. Click on your Android app (`in.pulsemateconnect.patient`)
2. Scroll down to "SHA certificate fingerprints"
3. Click "Add fingerprint"

### **Step 6: Add SHA-1**
Paste this:
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```
Click "Save"

### **Step 7: Add SHA-256**
1. Click "Add fingerprint" again
2. Paste this:
```
FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```
Click "Save"

---

## ✅ AFTER ADDING SHA CERTIFICATES

### **Step 1: Wait 5 Minutes**
Firebase needs time to propagate the changes

### **Step 2: Restart Your App**
In the emulator, close and reopen the PulseMate Connect app

### **Step 3: Test OTP Again**
1. Enter phone number: +917022818878
2. Tap "Send OTP"
3. ✅ **OTP should send successfully!**

---

## 🎊 EXPECTED RESULT

### Before (Current Error):
```
❌ auth/missing-client-identifier
```

### After (Success):
```
✅ [RN Firebase Native] ✅ OTP sent successfully
✅ [RN Firebase Native] 🔑 Verification ID: xxxxx
✅ [RN Firebase Native] ⏰ SMS should arrive in 10-30 seconds
```

---

## 📝 IMPORTANT NOTES

### **These are DEBUG certificates**
- Valid for: Development and testing
- Used for: Local builds, emulator testing

### **You'll also need PRODUCTION certificates**
When you build with EAS for Play Store, you'll need to:
1. Get production SHA from EAS: `eas credentials -p android`
2. Get Play Console SHA from Google Play Console
3. Add both to Firebase Console

But for NOW, just add these debug certificates to test!

---

## 🆘 TROUBLESHOOTING

### If OTP still fails after adding SHA:
1. Wait 5-10 minutes for Firebase to update
2. Clear app data on emulator
3. Restart emulator
4. Try again

### If you can't find Firebase Console:
- URL: https://console.firebase.google.com/
- Make sure you're logged in with the correct Google account
- Select the correct project

---

## 🚀 QUICK CHECKLIST

- [ ] Copy SHA-1 from above
- [ ] Go to Firebase Console
- [ ] Open Project Settings
- [ ] Add SHA-1 fingerprint
- [ ] Add SHA-256 fingerprint
- [ ] Wait 5 minutes
- [ ] Restart app
- [ ] Test OTP
- [ ] ✅ Success!

---

**Next Action:** Add the SHA certificates to Firebase Console NOW!

Then test OTP again in 5 minutes! 🎉

