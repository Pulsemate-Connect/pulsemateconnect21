# 🚀 Test Production Firebase Phone Auth

## Before You Start

✅ Make sure you have:
- Real phone with working SIM card
- Phone connected to WiFi (same network as backend)
- Backend running (Terminal ID 53)
- Expo running (reload with 'r')
- Any valid phone number from your SIM

---

## Testing Flow (5 minutes)

### Step 1: Reload Expo App
**In Expo Terminal:** Press `r`

**Expected:**
```
[Auth] Firebase initialized
App shows login screen
```

### Step 2: Navigate to Login
- App should show login form
- Phone input field visible
- "Send OTP" button ready

### Step 3: Enter Phone Number
- Your real phone number in E.164 format
- Example: `+917022818878` or `+919876543210`
- Format: `+91` + 10 digits (for India)

### Step 4: Send OTP
**Tap "Send OTP"**

**Expected:**
```
App: "OTP sent to your phone"
Phone: Receive SMS from Firebase
```

**Important:** 
- ❌ DO NOT check backend console
- ❌ Backend will NOT print OTP
- ✅ Only check your phone SMS inbox

### Step 5: Read SMS
- Check SMS inbox on your phone
- From: Firebase
- Message: "Your PulseMate OTP is: XXXXXX"
- Copy the 6-digit code

### Step 6: Enter OTP
**Back in App:**
- OTP input screen should be visible
- Enter the 6-digit code from SMS
- Tap "Verify OTP"

### Step 7: Verify Backend
**Backend Console (Terminal ID 53):**

Should see:
```
[debug]: POST /api/auth/patient/firebase-phone-login

(No OTP logging!)
```

Should NOT see:
```
❌ [FIREBASE-OTP] Code: 
❌ [SMS-MOCK] 
❌ Code: 123456
```

### Step 8: Success!
**App Should:**
- Navigate to home screen ✅
- Show user name/profile
- All login screens gone
- Full app access

---

## Troubleshooting

### ❌ No SMS Received After 30 Seconds

**Check 1: Firebase Enabled**
- Go to Firebase Console
- Project: pulsemateconnect
- Authentication → Sign-in method → Phone
- Ensure phone provider is ENABLED

**Check 2: Phone Format**
- Must be: `+91` + 10 digits
- ❌ Wrong: `07022818878`
- ❌ Wrong: `917022818878`
- ✅ Right: `+917022818878`

**Check 3: Network**
- Phone on same WiFi as backend?
- Try sending again
- Different network might work for Firebase SMS

**Check 4: App Console Logs**
- Look for red error messages
- Screenshot and share if stuck

### ❌ "Invalid Phone Number" Error

**Solution:**
- Format must be: `+91XXXXXXXXXX`
- Recount digits: exactly 10 after +91
- No spaces, no dashes

### ❌ "Invalid OTP Code" When Entering Code

**Causes:**
1. Copied wrong code from SMS
2. Entered too slowly (OTP expired after 5 min)
3. Typo in code entry

**Solution:**
- Copy code again carefully
- Re-read the SMS
- Tap "Resend OTP" if expired
- Try within 5 minutes

### ❌ Backend Shows Error

**"Firebase Admin SDK not configured"**
- Backend might not have Firebase credentials
- Check `.env` has `FIREBASE_SERVICE_ACCOUNT_JSON`
- Restart backend

**"Invalid or expired Firebase token"**
- OTP expired (wait > 5 min after sending)
- Send new OTP

---

## What Should NOT Happen

❌ Backend console shows: `[FIREBASE-OTP] SMS sent to +917022818878, Code: 123456`
❌ Backend console shows: `[SMS-MOCK]`
❌ Backend console shows: `Code: ` followed by number
❌ You need to check backend to get OTP
❌ OTP appears anywhere except your phone SMS

---

## What SHOULD Happen

✅ OTP sent silently (no console logs)
✅ SMS arrives on phone from Firebase
✅ You read SMS and get 6-digit code
✅ You enter code in app
✅ Backend silently verifies
✅ You logged in successfully
✅ No OTP visible anywhere except SMS

---

## Test with Different Numbers

**You can test with:**
- Your primary SIM number
- Friend's phone number (if they let you)
- Multiple numbers to verify flow

**Each test:**
1. Send OTP → Get SMS
2. Enter code → Login successful

---

## Production Readiness Checklist

After successful test:

- [ ] SMS received on real phone
- [ ] No OTP visible in backend console
- [ ] No OTP logging anywhere
- [ ] Login completed successfully
- [ ] User profile shows correct name
- [ ] Logged in state persists
- [ ] Can navigate entire app
- [ ] Error handling works

---

## Proceed to Production

Once all tests pass:

1. ✅ Update app.json to production API URL
2. ✅ Build release AAB
3. ✅ Submit to Google Play Store
4. ✅ Users get real Firebase phone auth

---

## Need Help?

**If stuck:**
1. Check error message in app
2. Screenshot console logs
3. Verify phone number format
4. Try with different phone number
5. Check Firebase Console configuration

**Key reminder:**
- Backend will NEVER show OTP
- Firebase will send SMS
- You read SMS on your phone
- Perfectly normal if backend console looks quiet!

---

Let's test! 🎯
