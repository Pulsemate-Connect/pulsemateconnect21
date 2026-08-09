# Message Central OTP Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Uninstall Firebase (if not done)
```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth
```

### 3. Start Development Server
```bash
npm start
```

### 4. Run on Android
```bash
# Emulator (now supported!)
npm run android

# Or physical device via Expo Go
# Scan QR code from terminal
```

---

## ✅ Test Scenarios

### Test 1: Send OTP (Happy Path)
1. Launch app
2. Enter valid 10-digit mobile number (e.g., `9876543210`)
3. Tap "Send OTP"
4. **Expected Result:**
   - Loading indicator appears briefly
   - Navigation to OTP screen
   - SMS arrives on phone
   - Countdown timer starts (60s)
   - Console logs show successful API call

### Test 2: Verify OTP (Happy Path)
1. After receiving OTP SMS
2. Enter 6-digit OTP code
3. OTP auto-verifies when 6 digits entered
4. **Expected Result:**
   - Loading indicator appears
   - Success animation plays (green checkmark)
   - "Verified! Welcome to PulseMate Connect" message
   - Navigation to home screen
   - User logged in

### Test 3: Invalid Phone Number
1. Enter less than 10 digits (e.g., `98765`)
2. Tap "Send OTP"
3. **Expected Result:**
   - Alert: "Enter a valid 10-digit mobile number"
   - No API call made

### Test 4: Invalid OTP
1. Send OTP successfully
2. Enter incorrect 6-digit code (e.g., `000000`)
3. **Expected Result:**
   - Alert: "Invalid or expired OTP. Please try again"
   - Input boxes shake (error animation)
   - OTP boxes turn red briefly

### Test 5: Resend OTP
1. Send OTP successfully
2. Wait for countdown to reach 0 (or let OTP expire)
3. Tap "Resend OTP"
4. **Expected Result:**
   - New SMS arrives
   - Countdown resets to 60s
   - Input boxes cleared
   - Alert: "OTP Resent"

### Test 6: Expired OTP
1. Send OTP successfully
2. Wait 60+ seconds (or however long backend expires OTP)
3. Enter the old OTP code
4. **Expected Result:**
   - Alert: "OTP has expired. Please request a new one"
   - Suggest tapping "Resend OTP"

### Test 7: Rate Limiting
1. Send OTP successfully
2. Immediately go back to login screen
3. Try sending OTP again to same number
4. **Expected Result:**
   - Alert: "Please wait 2 minutes before requesting another OTP"
   - No SMS sent

### Test 8: Network Error
1. Disable internet/wifi
2. Try sending OTP
3. **Expected Result:**
   - Alert with network error message
   - Loading indicator stops

### Test 9: Backend Down
1. Stop backend server
2. Try sending OTP
3. **Expected Result:**
   - Alert with error message
   - Graceful error handling

---

## 🔍 What to Check

### Console Logs (Frontend)
Look for these log patterns:

#### Send OTP Success:
```
╔═══════════════════════════════════════════════════════════════
║ 🚀 [LoginScreen] SEND OTP BUTTON PRESSED (Message Central)
║ ✅ [LoginScreen] SEND OTP SUCCESS (Message Central)
║ 🔑 Verification ID: abc123...
╚═══════════════════════════════════════════════════════════════
```

#### Verify OTP Success:
```
╔═══════════════════════════════════════════════════════════════
║ 🔐 [OtpScreen] VERIFY OTP BUTTON PRESSED
║ ✅ [OtpScreen] VERIFICATION SUCCESS
║ 👤 User authenticated successfully
╚═══════════════════════════════════════════════════════════════
```

### Backend Logs
Look for:
- `[Auth] OTP sent to +91XXXXXXXXXX via Message Central`
- `[Auth] Patient login: <user-id>`
- `[MessageCentral] ✅ OTP sent successfully`
- `[MessageCentral] ✅ OTP validated successfully`

---

## 🐛 Common Issues

### "Failed to send OTP"
**Causes:**
- Backend not running
- Message Central credentials missing in backend `.env`
- Invalid phone number format

**Solutions:**
1. Check backend is running on correct URL
2. Verify backend `.env` has:
   ```
   MESSAGE_CENTRAL_CUSTOMER_ID=...
   MESSAGE_CENTRAL_PASSWORD=...
   MESSAGE_CENTRAL_BASE_URL=...
   ```
3. Check phone number is valid Indian mobile (+91XXXXXXXXXX)

### "Invalid or expired OTP"
**Causes:**
- OTP entered incorrectly
- OTP expired (>60 seconds)
- Network delay

**Solutions:**
1. Double-check OTP digits
2. Request new OTP via "Resend"
3. Check backend logs for validation errors

### "Network request failed"
**Causes:**
- No internet connection
- Backend URL incorrect
- Backend not accessible

**Solutions:**
1. Check device internet connection
2. Verify `BASE_URL` in `src/api/axios.js`
3. Test backend URL in browser/Postman

### App crashes on OTP screen
**Causes:**
- Missing route params
- Invalid verificationId

**Solutions:**
1. Check console for error stack trace
2. Verify navigation params passed correctly
3. Check backend returned valid verificationId

---

## 📱 Device-Specific Testing

### Android Emulator
- ✅ **Now works!** (no longer requires Play Integrity)
- OTP will be sent to phone number
- Check SMS on physical device with that number

### Android Physical Device
- ✅ Works perfectly
- Automatic SMS retrieval may work depending on Android version
- OTP arrives in Messages app

### iOS (Future)
- Backend supports iOS
- Frontend migration needed for iOS screens

---

## 🔧 Advanced Testing

### Test with Postman
You can test backend directly:

#### Send OTP:
```http
POST https://api.pulsemateconnect.in/api/auth/patient/send-otp
Content-Type: application/json

{
  "mobileNumber": "+919876543210"
}
```

#### Verify OTP:
```http
POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp
Content-Type: application/json

{
  "verificationId": "<from-send-response>",
  "otp": "123456",
  "mobileNumber": "+919876543210"
}
```

---

## ✅ Sign-Off Checklist

Before marking migration complete:

- [ ] Send OTP works on emulator
- [ ] Send OTP works on physical device
- [ ] Verify OTP works with correct code
- [ ] Invalid OTP shows proper error
- [ ] Resend OTP works
- [ ] Expired OTP shows proper error
- [ ] Rate limiting works (try sending twice quickly)
- [ ] Network error handling works
- [ ] UI unchanged from previous version
- [ ] No console errors or warnings
- [ ] Backend logs show Message Central calls
- [ ] Production build tested (EAS build)

---

## 📊 Success Metrics

Migration is successful when:
1. ✅ 100% of auth flows work without Firebase
2. ✅ No Firebase imports or dependencies remain
3. ✅ Works on Android emulators
4. ✅ Same user experience as before
5. ✅ All error scenarios handled gracefully

---

## 🎯 Performance Expectations

- **Send OTP:** ~2-5 seconds (depends on Message Central API)
- **OTP Arrival:** 10-30 seconds (SMS delivery time)
- **Verify OTP:** ~1-3 seconds (backend validation)
- **Total Login Time:** ~30-60 seconds (similar to Firebase)

---

**Happy Testing! 🎉**
