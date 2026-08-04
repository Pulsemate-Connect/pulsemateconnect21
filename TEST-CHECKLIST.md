# ✅ LOCAL TESTING CHECKLIST

## Before Running

- [ ] Backend API is running (if testing OTP)
- [ ] Physical device or emulator is ready
- [ ] Expo Go app installed (if using physical device)

## Run the App

```bash
# Double-click: RUN-LOCAL-TEST.bat
# Or run: npm start
```

## What to Check

### ✅ 1. APP STARTUP (CRITICAL)
- [ ] App starts successfully
- [ ] **NO "Initialization Error" alert appears** ⭐⭐⭐
- [ ] Welcome screen loads
- [ ] No crashes
- [ ] No console errors about "undefined is not a function"

**Expected Console Output:**
```
✅ [App] Starting import phase
✅ [App] Core imports complete
✅ [App] Importing AuthStore...
✅ [App] AuthStore imported
✅ [App] Importing Navigators...
✅ [App] Navigators imported
✅ [App] Importing hooks and components...
✅ [App] All imports complete
```

**Should NOT see:**
```
❌ Firebase Auth initialization failed
❌ getAuth() returned: undefined
❌ undefined is not a function
```

### ✅ 2. NAVIGATION
- [ ] Can tap "Login" button
- [ ] Navigate to Login screen
- [ ] Login screen loads without errors

### ✅ 3. BACKEND SMS (if backend running)
- [ ] Enter phone number: +91XXXXXXXXXX
- [ ] Tap "Send OTP"
- [ ] Loading indicator appears
- [ ] Console shows: "Backend SMS" logs (not "Firebase JS SDK")
- [ ] SMS arrives (if backend configured)
- [ ] Navigate to OTP screen

**Expected Console Output:**
```
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔧 [Login2Factor] BACKEND SMS INITIALIZATION
╠═══════════════════════════════════════════════════════════════════════════════
║ ✅ Backend SMS Auth ready
║ 📡 Backend API: https://api.pulsemateconnect.in/api
╚═══════════════════════════════════════════════════════════════════════════════
```

### ✅ 4. OTP VERIFICATION (if backend running)
- [ ] Enter 6-digit OTP
- [ ] Tap "Verify"
- [ ] Backend validates OTP
- [ ] Receive JWT token
- [ ] Successfully log in

### ✅ 5. ERROR HANDLING
- [ ] Test invalid phone number → Shows error message
- [ ] Test without backend → Shows "Cannot reach server" (not initialization error)

## Success Criteria

### ✅ PRIMARY (Must Pass):
1. **App starts without "Initialization Error"** ⭐⭐⭐
2. App doesn't crash on startup
3. Can navigate to Login screen

### ✅ SECONDARY (Should Pass):
1. OTP flow works (if backend running)
2. Error messages are user-friendly
3. Console shows Backend SMS logs (not Firebase JS SDK)

## If Initialization Error STILL Appears

Check these files for imports:

```bash
# Should import from '../config/firebase' (Backend SMS)
# NOT from '../config/firebase-native' (Firebase JS SDK)

1. src/screens/Login2FactorScreen.jsx (Line 17)
2. src/screens/LoginScreen.jsx (Line 23)
3. src/screens/Otp2FactorScreen.jsx (Line 13)
```

## Console Commands During Testing

```bash
# Clear Metro cache (if issues)
npm start -- --clear

# Reset everything
npx expo start -c

# Run on Android emulator
npm run android

# Run on iOS simulator (Mac)
npm run ios
```

## Test Results Template

```
Date: _______________
Time: _______________

✅ App Startup: PASS / FAIL
✅ No Initialization Error: PASS / FAIL
✅ Navigation Works: PASS / FAIL
✅ Backend SMS Logs: PASS / FAIL
✅ OTP Flow: PASS / FAIL / NOT TESTED

Issues Found:
_______________________________
_______________________________
_______________________________

Overall Status: PASS / FAIL

Tested By: _______________
```

## Next Steps After Testing

### If All Tests Pass ✅
1. Proceed to build production AAB
2. Test on physical device with AAB
3. Deploy to Play Store

### If Tests Fail ❌
1. Check console logs
2. Verify file imports are correct
3. Review error messages
4. Check documentation files for help
