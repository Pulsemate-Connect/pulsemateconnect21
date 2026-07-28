# 🧪 2Factor SMS Authentication Testing Guide

## Quick Reference for Testing Production OTP Flow

---

## 🚀 Quick Start Testing

### 1. Start Backend Server
```bash
cd backend
npm start
```

**Expected output:**
```
[2Factor] Configuration validated successfully
[2Factor] OTP expiry: 5 minutes
[2Factor] Template: AUTOGEN
[2Factor] Max attempts: 5
[2Factor] Rate limit: 3 requests per 15 minutes
Server running on port 5000
```

### 2. Start Mobile App
```bash
cd ..
npm start
```

Choose Expo Go or build the app.

---

## ✅ Test Case 1: Successful Login Flow

### Steps:
1. Open app in Expo Go
2. Navigate to Login screen
3. Enter your Indian mobile number: `98765 43210` (app adds +91)
4. Tap "Send OTP"
5. **Check your phone** for SMS from 2Factor
6. Enter the 6-digit OTP from SMS
7. Tap "Verify & Continue"

### Expected Results:
- ✅ "OTP sent successfully" message appears
- ✅ SMS received within 30 seconds
- ✅ Navigation to OTP screen with 6 input boxes
- ✅ After entering correct OTP: "Login successful"
- ✅ App navigates to main screen
- ✅ User is logged in

### Backend Logs:
```
[2Factor] Sending OTP to +9198*** via 2Factor API
[2Factor] OTP sent successfully. Session: 2f_xxx, Expires in: 5m
[2Factor] OTP verified successfully for +9198*** from IP: 192.168.x.x
[Auth] New patient created: user_id (+9198***)
```

---

## ⏱️ Test Case 2: OTP Expiry

### Steps:
1. Request OTP (follow Test Case 1 steps 1-4)
2. **Wait 6 minutes**
3. Enter the OTP (even correct one)
4. Tap "Verify & Continue"

### Expected Results:
- ✅ Error: "OTP has expired. Please request a new one."
- ✅ OTP inputs cleared
- ✅ User can go back and request new OTP

### Backend Logs:
```
[2Factor] Expired OTP for +9198***
```

---

## 🚫 Test Case 3: Rate Limiting (Phone)

### Steps:
1. Request OTP for phone number: +919876543210
2. Immediately request OTP again (same number)
3. Request OTP again (3rd time)
4. Request OTP again (4th time - should fail)

### Expected Results:
- ✅ First 3 requests succeed
- ✅ 4th request fails with: "Too many OTP requests. Please try again in X minutes."
- ✅ After 15 minutes, requests work again

### Backend Logs:
```
[2Factor] Rate limit exceeded for phone: +9198***
```

---

## ❌ Test Case 4: Maximum Attempts

### Steps:
1. Request OTP (follow Test Case 1 steps 1-4)
2. Enter **wrong** OTP (e.g., 111111)
3. Tap "Verify & Continue"
4. Repeat 4 more times (5 wrong attempts total)

### Expected Results:
- ✅ First attempt: "Invalid OTP. 4 attempts remaining."
- ✅ Second attempt: "Invalid OTP. 3 attempts remaining."
- ✅ Third attempt: "Invalid OTP. 2 attempts remaining."
- ✅ Fourth attempt: "Invalid OTP. 1 attempt remaining."
- ✅ Fifth attempt: "Maximum verification attempts exceeded. Please request a new OTP."
- ✅ OTP is deleted, must request new one

### Backend Logs:
```
[2Factor] Invalid OTP attempt 1/5 for +9198*** from IP: 192.168.x.x
[2Factor] Invalid OTP attempt 2/5 for +9198*** from IP: 192.168.x.x
...
[2Factor] Max attempts exceeded for +9198*** from IP: 192.168.x.x
```

---

## 📱 Test Case 5: Invalid Phone Numbers

### Test 5A: Short Number
- Enter: `1234567`
- Expected: "Invalid Number. Enter a valid 10-digit mobile number."

### Test 5B: Non-Indian Number
- Enter: `1234567890` (starting with 1-5)
- Expected: OTP send fails with "Invalid Indian mobile number"

### Test 5C: Letters/Special Characters
- Enter: `abc123xyz!`
- Expected: Input field automatically filters to digits only

---

## 🔄 Test Case 6: Resend OTP

### Steps:
1. Request OTP (follow Test Case 1 steps 1-4)
2. On OTP screen, tap "Resend"
3. Check phone for new SMS

### Expected Results:
- ✅ "A new code has been sent to your mobile"
- ✅ New SMS received (new OTP)
- ✅ Old OTP no longer works
- ✅ New OTP works
- ✅ Subject to same rate limits (max 3 in 15 min)

### Backend Logs:
```
[2Factor] Resending OTP to +9198***
[2Factor] Invalidated previous OTP for +9198***
[2Factor] OTP sent successfully. Session: 2f_yyy, Expires in: 5m
```

---

## 🔐 Test Case 7: Session Validation

### Steps:
1. Request OTP on Device A
2. Note the sessionId from backend logs
3. On Device B (or API tool), try to verify with:
   - Correct phone number
   - Correct OTP
   - **Wrong sessionId** (make one up)

### Expected Results:
- ✅ Error: "Invalid session. Please request a new OTP."
- ✅ OTP not deleted (can still use with correct sessionId on Device A)

---

## 🌐 Test Case 8: Network Errors

### Test 8A: Backend Offline
1. Stop backend server
2. Try to send OTP
3. Expected: "SMS service is temporarily unavailable. Please try again in a few minutes."

### Test 8B: Invalid API Key
1. Change `TWOFACTOR_API_KEY` in `.env` to invalid value
2. Restart backend
3. Try to send OTP
4. Expected: "SMS service authentication failed. Please contact support."

### Test 8C: Network Timeout
- If 2Factor API is slow (>15 seconds)
- Expected: "SMS service is temporarily unavailable. Please try again in a few minutes."

---

## 🛠️ Debugging Tools

### Check Active OTPs
Add this temporary endpoint in `auth.controller.js` for debugging:

```javascript
const debugOtpStatsHandler = async (req, res) => {
  const twoFactorService = require('../services/twofactor.service');
  const stats = twoFactorService.getSessionStats();
  return res.json(stats);
};
```

Call: `GET /api/auth/debug/otp-stats`

Response:
```json
{
  "activeOtps": 2,
  "phoneRateLimitedCount": 5,
  "ipRateLimitedCount": 3
}
```

### Clear Rate Limit (Admin Function)
Add these temporary admin endpoints:

```javascript
// Clear phone rate limit
const clearPhoneRateLimitHandler = async (req, res) => {
  const twoFactorService = require('../services/twofactor.service');
  const { mobile } = req.body;
  twoFactorService.clearPhoneRateLimit(mobile);
  return res.json({ message: 'Rate limit cleared' });
};

// Clear IP rate limit
const clearIpRateLimitHandler = async (req, res) => {
  const twoFactorService = require('../services/twofactor.service');
  const { ip } = req.body;
  twoFactorService.clearIpRateLimit(ip);
  return res.json({ message: 'IP rate limit cleared' });
};
```

---

## 📊 Log Monitoring

### Success Indicators:
```
✅ [2Factor] Configuration validated successfully
✅ [2Factor] OTP sent successfully. Session: xxx, Expires in: 5m
✅ [2Factor] OTP verified successfully for +9198***
✅ [Auth] New patient created: user_id
✅ [Auth] Patient login: user_id
```

### Warning Signs:
```
⚠️ [2Factor] Rate limit exceeded for phone: +9198***
⚠️ [2Factor] IP rate limit exceeded: 192.168.x.x
⚠️ [2Factor] Invalid OTP attempt 3/5 for +9198***
⚠️ [2Factor] Max attempts exceeded for +9198***
```

### Critical Errors:
```
🚨 [2Factor] CRITICAL: API authentication failed. Check TWOFACTOR_API_KEY
🚨 [2Factor] CRITICAL: 2Factor account balance low or expired
🚨 [2Factor] API error 401: Authentication failed
🚨 [2Factor] API error 402: Balance low
🚨 [2Factor] No response from API: timeout
```

---

## 🧹 Cleanup After Testing

### Clear Test Data:
1. Delete test users from database:
   ```sql
   DELETE FROM users WHERE mobile = '+919876543210';
   ```

2. Restart backend to clear in-memory rate limits:
   ```bash
   # Or wait 15 minutes for automatic cleanup
   npm restart
   ```

---

## ✅ Test Results Checklist

| Test Case | Status | Notes |
|-----------|--------|-------|
| Successful login | ⬜ | |
| OTP expiry (6 min) | ⬜ | |
| Phone rate limit (4 requests) | ⬜ | |
| Max attempts (5 wrong OTPs) | ⬜ | |
| Invalid phone numbers | ⬜ | |
| Resend OTP | ⬜ | |
| Session validation | ⬜ | |
| Network errors | ⬜ | |
| Backend logs correct | ⬜ | |
| SMS delivered < 30s | ⬜ | |
| JWT tokens returned | ⬜ | |
| User created in DB | ⬜ | |

---

## 🎯 Performance Benchmarks

### Expected Response Times:
- Send OTP: < 5 seconds
- Verify OTP: < 1 second
- SMS delivery: < 30 seconds

### Rate Limits:
- Phone: 3 requests / 15 minutes
- IP: 9 requests / 15 minutes
- Verification: 5 attempts per OTP

### OTP Lifetime:
- Expiry: 5 minutes
- One-time use only

---

## 📞 Troubleshooting

### "No SMS received"
1. Check 2Factor API key valid
2. Check phone number format (+91xxxxxxxxxx)
3. Check backend logs for API errors
4. Check 2Factor account balance
5. Try different phone number

### "Too many requests"
1. Wait 15 minutes
2. Use admin function to clear rate limit
3. Use different phone number
4. Check for abuse patterns in logs

### "Invalid OTP"
1. Check OTP not expired (5 minutes)
2. Enter correct 6-digit code from SMS
3. Check not exceeded 5 attempts
4. Request new OTP if needed

### "Session ID required"
1. Check navigation params passed correctly
2. Check backend returned sessionId
3. Check network connection
4. Try sending OTP again

---

**Last Updated:** 2026-07-28  
**Version:** 1.0  
**Status:** Ready for Testing
