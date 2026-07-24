# 🚀 Twilio SMS Setup — Enable Real OTP Delivery

## Current Status

- **Backend**: ✅ Running with updated OTP handler
- **SMS Service**: ✅ Integrated (supports Twilio, MSG91, 2Factor, mock)
- **OTP Endpoint**: ✅ Updated to send SMS automatically
- **SMS Provider**: Currently set to `mock` (logs only)

## What Happens When You Send OTP

### Currently (Mock Mode)
```
1. Click "Send OTP" in app
2. Backend generates OTP code
3. OTP logged to console (not sent anywhere)
4. You must copy from console to test
```

### After Twilio Setup (Real SMS)
```
1. Click "Send OTP" in app
2. Backend generates OTP code
3. Twilio sends SMS to phone number
4. OTP arrives in your SMS inbox
5. You receive code and enter in app
```

---

## Quick Start (5 minutes)

### Option 1: Free Twilio Trial (Recommended for Testing)

#### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your email
4. Complete signup (takes ~2 minutes)

#### Step 2: Get Your Credentials
1. After signup, you'll be in the Twilio Console
2. Go to **Account** → **API Keys & Credentials**
3. Copy your **Account SID** (looks like `ACxxxxxxxxxxxxxxxxxxxxxxxxxx`)
4. Copy your **Auth Token** (looks like `xxxxxxxxxxxxxxxxxxxxxxxxxxx`)

#### Step 3: Get a Twilio Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click **Get your first Twilio phone number**
3. Accept the default or choose a number
4. Copy the phone number (e.g., `+1234567890`)

#### Step 4: Update Backend Environment
Edit `pulsemateconnect21/backend/.env`:

```env
# ─── SMS / OTP Provider ───────────────────────────────────────────────────────
SMS_PROVIDER=twilio
SMS_API_KEY=
SMS_SENDER_ID=PULSE
SMS_TEMPLATE_ID=
OTP_PROVIDER=mock

# ─── Twilio ───────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

Replace:
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxx` with your Account SID
- `xxxxxxxxxxxxxxxxxxxxxxxxxxx` with your Auth Token
- `+1234567890` with your Twilio phone number

#### Step 5: Restart Backend
In the backend terminal (ID 53), type:
```
rs
```

This restarts the Node.js server with new environment variables.

#### Step 6: Test SMS Delivery
1. In your phone app, enter your personal phone number
2. Click "Send OTP"
3. **You should receive an SMS!** ✅
4. Copy the code from SMS and enter in app
5. Verify OTP → Login successful

---

## Twilio Pricing

### Trial Account (Free)
- ✅ **Free for 30 days**
- ✅ Includes $15 credit
- ✅ Can send SMS to verified phone numbers
- ⚠️ Limited: Can only send to numbers you add to account (good for testing)
- ⚠️ **Limitation**: SMS will have a "Sent from your Twilio trial account" prefix

### Production Account (Paid)
- Cost: ~$0.01 per SMS (varies by country)
- No number restrictions
- No trial message prefix
- Better for live production

### For Testing
Use the **Free Trial Account** to:
1. Test with your phone number
2. Test with team members' numbers
3. Test the full OTP flow

---

## Verification: Is SMS Working?

### Check Backend Logs
After sending OTP, look for one of these in backend console:

**✅ Success (Twilio sent)**
```
[Twilio] Sent. SID: SM1234567890abcdef1234567890abcdef
```

**✅ Success (2Factor sent)**
```
[2Factor] Sent. id: 123456789
```

**✅ Success (MSG91 sent)**
```
[MSG91] Sent. id: 1234567890
```

**❌ Failed (Invalid credentials)**
```
[Twilio] Failed: Invalid account token.
```

**❌ Failed (API key missing)**
```
[Twilio] No API key — falling back to mock
```

---

## Troubleshooting

### Issue: "Twilio] No API key — falling back to mock"
**Cause**: `TWILIO_ACCOUNT_SID` or `TWILIO_AUTH_TOKEN` is empty
**Solution**:
1. Check backend `.env` file
2. Verify you copied credentials correctly (no spaces)
3. Restart backend (`rs` in terminal)
4. Try again

### Issue: "[Twilio] Failed: Invalid account token"
**Cause**: Wrong Account SID or Auth Token
**Solution**:
1. Go to Twilio Console → Account → API Keys
2. Copy credentials again (carefully)
3. Update `.env`
4. Restart backend

### Issue: "The 'to' parameter is not a valid phone number"
**Cause**: Phone number format is incorrect
**Solution**:
1. Phone number must be in E.164 format: `+[country code][number]`
2. Examples:
   - ✅ `+917022818878` (India)
   - ✅ `+919876543210` (India)
   - ✅ `+14155552671` (USA)
   - ❌ `917022818878` (missing +)
   - ❌ `07022818878` (missing country code)

### Issue: SMS sent but not received
**Cause**: Could be Twilio trial limitations or SMS filtering
**Solution**:
1. If using **trial account**: Add your phone number to verified list in Twilio Console
2. Check SMS isn't going to spam folder
3. Wait a few seconds (sometimes delayed)
4. Try again with different number

### Issue: Backend keeps crashing after restart
**Cause**: Syntax error in `.env` file
**Solution**:
1. Check for unclosed quotes in `.env`
2. Each line should be: `KEY=value` (no quotes needed)
3. Restart backend again

---

## Environment Setup Reference

### Minimal Configuration (Testing)
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Full Configuration (Production)
```env
SMS_PROVIDER=twilio
SMS_SENDER_ID=PULSE
SMS_API_KEY=
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Alternative: Using Combined API Key
Instead of separate Account SID and Auth Token, you can use:
```env
SMS_API_KEY=ACxxxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

(Replace `:` with colon, SID:Token format)

---

## Testing Checklist

- [ ] Created Twilio account
- [ ] Copied Account SID
- [ ] Copied Auth Token
- [ ] Got Twilio phone number
- [ ] Updated `.env` with credentials
- [ ] Restarted backend (`rs` in terminal)
- [ ] Backend logs show "[Twilio] Sent. SID: ..." (not mock logs)
- [ ] Received SMS on your phone
- [ ] OTP code visible in SMS message
- [ ] Entered code in app
- [ ] Login successful ✅

---

## Next Steps After SMS Works

1. ✅ Test with multiple phone numbers
2. Test error scenarios (wrong code, expired OTP, etc.)
3. Add rate limiting for OTP requests (already done)
4. Test on multiple devices
5. Prepare for production:
   - Upgrade Twilio account (paid)
   - Update app to production API URL
   - Build release APK/AAB
   - Submit to Play Store

---

## Production Recommendations

### For India Market (Recommended)
Use **MSG91** instead of Twilio:
- Better pricing for India
- Better delivery rates
- Local support

Setup:
1. Create account at https://msg91.com
2. Get Flow ID and API key
3. Update `.env`:
```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key
MSG91_TEMPLATE_ID=your_template_id
MSG91_SENDER_ID=PULSE
```

### For International
Use **Twilio** (already set up above)
- Works worldwide
- Good reliability
- Standard pricing

---

## Backend SMS Service Code

The SMS service supports multiple providers. Located at:
```
pulsemateconnect21/backend/src/services/sms.service.js
```

Providers available:
- `twilio` ✅ (Recommended for now)
- `msg91` (Better for India production)
- `2factor` (Budget option)
- `mock` (Development only)

---

## Questions?

If SMS isn't working:
1. Check backend console for error messages
2. Verify Twilio credentials are correct
3. Ensure phone number is in E.164 format
4. Restart backend
5. Try again

**You're 5 minutes away from real SMS delivery!** 🎯
