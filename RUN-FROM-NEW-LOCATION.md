# 🚀 Run App from New Location

**IMPORTANT:** The build cannot work from the current location due to spaces in the path.

Your project has been successfully copied to: **`C:\Dev\pm`**

---

## ✅ WHAT YOU NEED TO DO

### **Step 1: Open a NEW Command Prompt**

1. Press `Win + R`
2. Type: `cmd`
3. Press Enter

### **Step 2: Navigate to the new location**

```cmd
cd C:\Dev\pm
```

### **Step 3: Start Metro Bundler**

```cmd
npx expo start
```

Wait for the QR code to appear (about 10-20 seconds).

### **Step 4: Open a SECOND Command Prompt**

1. Press `Win + R` again
2. Type: `cmd`
3. Press Enter

### **Step 5: Build and Run on Emulator**

```cmd
cd C:\Dev\pm
npx expo run:android
```

This will:
- Build the app (3-5 minutes)
- Install on emulator
- Launch the app

---

## 🎯 WHAT TO EXPECT

After `npx expo run:android` completes:

1. ✅ Build succeeds
2. ✅ App installs on emulator
3. ✅ App launches automatically
4. ✅ Login screen appears
5. ✅ Firebase Native SDK is active
6. ✅ You can test OTP flow

---

## 📱 TESTING THE OTP FLOW

Once the app is running:

1. **Enter your phone number** (with country code, e.g., +919876543210)
2. **Tap "Send OTP"**
3. **Check console logs** - should see "React Native Firebase Native" messages
4. **Wait for SMS** (10-30 seconds)
5. **Enter the 6-digit code**
6. **Tap "Verify"**
7. **Login should succeed**

---

## 🔍 VERIFICATION

Check that the Firebase fix is working:

### In the console, you should see:
```
[RN Firebase Native] 🚀 Sending OTP via native Firebase SDK...
[RN Firebase Native] ✅ OTP sent successfully
[RN Firebase Native] 📲 Automatic SMS retrieval enabled (Android)
```

### You should NOT see:
- ❌ reCAPTCHA popup
- ❌ "Component auth not registered" error
- ❌ WebView opening

---

## 🆘 IF BUILD FAILS

If the build fails in the new location:

```cmd
cd C:\Dev\pm\android
.\gradlew.bat clean
cd ..
npx expo run:android
```

---

## ✅ SUCCESS INDICATORS

**Metro Bundler (Terminal 1):**
```
› Metro waiting on exp+pulsemate-app://...
› Using development build
› Press a │ open Android
```

**Build (Terminal 2):**
```
> Task :app:installDebug
Installing APK 'app-debug.apk' on 'PulseMate...
Installed app-debug.apk
BUILD SUCCESSFUL in 4m 23s
```

**Emulator:**
- App icon appears
- App launches
- Login screen shows
- No crashes

---

## 📋 QUICK REFERENCE

**Location:** `C:\Dev\pm`

**Terminal 1 (Metro):**
```cmd
cd C:\Dev\pm
npx expo start
```

**Terminal 2 (Build):**
```cmd
cd C:\Dev\pm
npx expo run:android
```

---

## 🎊 AFTER SUCCESSFUL TEST

Once OTP works on emulator:

1. ✅ Verify SHA certificates in Firebase Console
2. ✅ Build production AAB: `eas build -p android --profile production`
3. ✅ Upload to Play Console Internal Testing
4. ✅ Test on real device
5. ✅ Deploy to production

---

## 💡 WHY THIS WORKS

The new location `C:\Dev\pm`:
- ✅ **No spaces** in path
- ✅ **Short path** (10 characters vs 70+)
- ✅ **Gradle works** properly
- ✅ **Node commands execute** successfully
- ✅ **Build succeeds**

---

**Next Action:** Open Command Prompt and follow Step 1-5 above

