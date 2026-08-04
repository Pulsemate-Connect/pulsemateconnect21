# ✅ QUICK TEST CHECKLIST

## 🎯 Your Task: Test OTP on USB Device

---

## ✅ DONE (Already Complete)
- [x] React Native Firebase installed
- [x] Code migrated to native SDK
- [x] Production AAB built
- [x] Preview APK built
- [x] APK downloaded
- [x] **APK installed on device 9b90e608**

---

## ⏳ DO NOW (Test on Device)

### Step 1: Open App
```
[ ] Find "PulseMate Connect" on your device
[ ] Tap to open
[ ] App opens without crashing
```

### Step 2: Test OTP Send (CRITICAL!)
```
[ ] Enter phone number: +91 __________
[ ] Click "Send OTP" button
[ ] 🔍 CHECK: NO reCAPTCHA modal appears ✅
[ ] 🔍 CHECK: Loading indicator shows
[ ] ⏱️  Wait 10-30 seconds
[ ] 🔍 CHECK: SMS arrives on phone
[ ] 🔍 CHECK: Navigate to OTP screen
[ ] 🔍 CHECK: NO "Configuration error" ❌
```

### Step 3: Enter OTP
```
[ ] Check SMS for 6-digit code
[ ] Enter OTP: __ __ __ __ __ __
[ ] Click "Verify" button
[ ] 🔍 CHECK: OTP verification succeeds
[ ] 🔍 CHECK: Login successful
[ ] 🔍 CHECK: Home screen appears
```

---

## 🎯 KEY SUCCESS INDICATORS

### ✅ If OTP Works (SUCCESS):
- NO reCAPTCHA modal
- SMS received
- OTP verified
- Login successful

### ❌ If OTP Fails (NEED TO FIX):
- reCAPTCHA modal appears
- "Configuration error" message
- No SMS received
- App crashes

---

## 📝 REPORT RESULTS

After testing, tell me:

### ✅ If SUCCESS:
```
"OTP works! No reCAPTCHA modal, SMS received, login successful!"
```

**Next:** Upload AAB to Play Store

### ❌ If FAILED:
```
"Error: [describe what happened]"
```

**Next:** Debug the issue

---

## 🔍 OPTIONAL: Watch Logs

While testing, run this in another terminal:
```cmd
adb -s 9b90e608 logcat | findstr "Auth"
```

Look for:
- `[Auth] ✅ OTP sent successfully` ← GOOD
- `[Auth] ❌ Send OTP error` ← BAD

---

## 🚀 READY?

1. **Pick up your phone** (Device 9b90e608)
2. **Open PulseMate Connect** app
3. **Test OTP** as described above
4. **Report results**

---

**GO! 📱**
