# 🧪 USE FIREBASE TEST PHONE NUMBERS FOR TESTING

**Issue:** Debug builds on emulators can't pass Play Integrity checks  
**Solution:** Use Firebase test phone numbers (no real SMS needed!)

---

## 🎯 SETUP TEST PHONE NUMBER IN FIREBASE

### **Step 1: Go to Firebase Console**
https://console.firebase.google.com/

### **Step 2: Go to Authentication**
1. Select your project "pulsemateconnect"
2. Click "Authentication" in left sidebar
3. Click "Sign-in method" tab

### **Step 3: Enable Phone Authentication Test Numbers**
1. Scroll down to "Phone numbers for testing"
2. Click to expand it

### **Step 4: Add Test Phone Number**
Click "Add phone number" and add:

**Phone number:**
```
+917022818878
```

**Test code:**
```
123456
```

Click "Add"

---

## ✅ HOW TO USE

### **Step 1: In Your App**
Enter the test phone number:
```
+917022818878
```

### **Step 2: Tap "Send OTP"**
You'll see success message (no real SMS is sent)

### **Step 3: Enter Test Code**
On OTP screen, enter:
```
123456
```

### **Step 4: Login Success!**
The app will verify and log you in! ✅

---

## 🎊 BENEFITS

- ✅ **No real SMS** - Saves money
- ✅ **Works on emulator** - No Play Integrity needed
- ✅ **Instant testing** - No waiting for SMS
- ✅ **Consistent code** - Always use 123456

---

## 📱 FOR PRODUCTION TESTING

When you want to test with real SMS:

1. **Build production APK/AAB** with EAS
2. **Upload to Play Console** Internal Testing
3. **Install from Play Store** on real device
4. **Use real phone number** - SMS will work!

Production builds from Play Store will pass Play Integrity and work perfectly.

---

## 🔧 ALTERNATIVE: Use Real Phone on Emulator

If you want to test real SMS on emulator, you need to:
1. Build a **release APK** (not debug)
2. Sign it with **release keystore**
3. Add **release SHA** to Firebase
4. Install on emulator

But this is complicated - test phone numbers are easier!

---

## 📋 QUICK SUMMARY

**For Emulator/Debug Testing:**
- Use Firebase test phone numbers
- No Play Integrity needed
- Quick and easy!

**For Production Testing:**
- Use EAS build → Play Console → Real device
- Real SMS will work
- Production-ready!

---

**Next Action:** Add test phone number `+917022818878` with code `123456` in Firebase Console!

