# 🚀 2Factor SMS OTP Setup Guide

Complete guide to switch from Firebase to 2Factor for SMS OTP authentication.

---

## ✅ Why 2Factor?

- ✅ **Reliable in India** - Indian telecom provider, fast delivery
- ✅ **Cost-effective** - ₹0.15 per SMS (cheaper than Twilio/Firebase)
- ✅ **Simple API** - Easy integration
- ✅ **Good support** - Indian customer support
- ✅ **No credit card required** for trial

---

## 📋 Step 1: Create 2Factor Account

1. Go to: https://2factor.in/
2. Click **"Sign Up"**
3. Enter your details:
   - Name
   - Email
   - Phone number
   - Company name (PulseMate Connect)
4. Verify your email
5. Login to dashboard

---

## 🔑 Step 2: Get API Key

1. Go to **Dashboard**: https://2factor.in/panel/dashboard
2. Click **"API Key"** in left sidebar
3. Copy your **API Key** (looks like: `abc123xyz-1234-5678-90ab-cdefghijklmn`)
4. Keep it safe!

---

## 💰 Step 3: Add Credits

1. Go to **"Recharge"** in dashboard
2. Minimum: ₹100 (gets you ~650 SMS)
3. Payment methods:
   - UPI
   - Credit/Debit card
   - Net banking
4. Credits never expire!

---

## 🔧 Step 4: Configure Backend

### Add API Key to Environment

1. **Local Development** (`.env` file):
```env
TWOFACTOR_API_KEY=your_api_key_here
```

2. **Render.com** (Production):
   - Go to: https://dashboard.render.com
   - Select your PulseMate API service
   - Click **"Environment"** tab
   - Click **"Add Environment Variable"**
   - Key: `TWOFACTOR_API_KEY`
   - Value: Your 2Factor API key
   - Click **"Save Changes"**
   - Service will auto-redeploy

3. **Verify it works**:
```bash
# Test locally
curl http://localhost:5000/api/auth/patient/send-otp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

---

## 📱 Step 5: Update Mobile App

### Option A: Use 2Factor Login Screen (Simple)

Update your navigation to use `Login2FactorScreen`:

```javascript
// src/navigation/AppNavigator.js
import Login2FactorScreen from '../screens/Login2FactorScreen';
import Otp2FactorScreen from '../screens/Otp2FactorScreen';

// Replace LoginScreen with Login2FactorScreen
<Stack.Screen name="Login" component={Login2FactorScreen} />
<Stack.Screen name="Otp2Factor" component={Otp2FactorScreen} />
```

### Option B: Keep Both (Recommended for Testing)

Add both screens and let users choose:

```javascript
<Stack.Screen name="LoginFirebase" component={LoginScreen} />
<Stack.Screen name="Login2Factor" component={Login2FactorScreen} />
<Stack.Screen name="OtpFirebase" component={OtpScreen} />
<Stack.Screen name="Otp2Factor" component={Otp2FactorScreen} />
```

---

## 🧪 Step 6: Test the Flow

### Test Locally First:

1. **Start backend**:
```bash
cd backend
npm run dev
```

2. **Start mobile app**:
```bash
npx expo start
```

3. **Test login**:
   - Enter your phone number: `9876543210`
   - Click "Send OTP"
   - Check your SMS inbox
   - Enter the 6-digit OTP
   - Should login successfully ✅

### Test on Production:

1. Build new APK/AAB with version 1.2.6
2. Upload to Play Store Internal Testing
3. Install on your device
4. Test login flow
5. Verify SMS arrives within 5-10 seconds

---

## 🔍 Troubleshooting

### Issue 1: SMS Not Arriving

**Check:**
- ✅ 2Factor account has credits
- ✅ API key is correct in `.env` / Render
- ✅ Phone number format: `+919876543210` (with +91)
- ✅ Check 2Factor dashboard logs

**Solution:**
```bash
# Check backend logs
# Look for: "[2Factor] Sending OTP to..."
```

### Issue 2: "2Factor API key not configured"

**Solution:**
- Add `TWOFACTOR_API_KEY` to `.env`
- Restart backend
- Verify env var loaded: `console.log(process.env.TWOFACTOR_API_KEY)`

### Issue 3: "Invalid OTP"

**Possible causes:**
- OTP expired (5 minutes validity)
- Wrong session ID
- Typo in OTP

**Solution:**
- Click "Resend OTP"
- Enter new code

### Issue 4: API Error "Insufficient Credits"

**Solution:**
- Recharge your 2Factor account
- Minimum ₹100

---

## 📊 Pricing Comparison

| Provider | Cost per SMS | Indian Support |
|----------|-------------|----------------|
| 2Factor  | ₹0.15       | ✅ Yes          |
| Firebase | Free (limited), then $0.05 USD | ❌ No |
| Twilio   | $0.05-0.10 USD | ❌ No |
| AWS SNS  | $0.05 USD | ❌ No |

**Winner**: 2Factor for Indian users! 🏆

---

## 🔐 Security Features

✅ **Auto-generated OTPs** - Random 6-digit codes
✅ **5-minute expiry** - OTPs expire automatically
✅ **Session-based verification** - Each OTP has unique session ID
✅ **Rate limiting** - Backend limits OTP requests
✅ **IP logging** - Track login attempts

---

## 📈 Monitoring

### 2Factor Dashboard:

- **SMS Logs**: https://2factor.in/panel/sms-logs
- **Credits**: https://2factor.in/panel/dashboard
- **Reports**: https://2factor.in/panel/reports

### Backend Monitoring:

Check logs for:
```
[2Factor] Sending OTP to 9876543210
[2Factor] OTP sent successfully. Session: xxx
[2Factor] Verifying OTP for session xxx
[2Factor] OTP verified successfully
```

---

## 🚀 Next Steps After Setup

1. ✅ Test login flow thoroughly
2. ✅ Monitor SMS delivery rates
3. ✅ Set up alerts for low credits
4. ✅ Add analytics for OTP success rate
5. ✅ Consider adding email OTP as backup

---

## 📞 2Factor Support

- **Website**: https://2factor.in/
- **Email**: support@2factor.in
- **Phone**: +91-1140523421
- **Docs**: https://2factor.in/docs/

---

## ✅ Checklist

Before deploying to production:

- [ ] 2Factor account created
- [ ] API key obtained
- [ ] Credits added (minimum ₹100)
- [ ] API key added to Render environment variables
- [ ] Backend redeployed with 2Factor service
- [ ] Mobile app updated with 2Factor screens
- [ ] Tested locally - OTP received
- [ ] Tested on production - OTP received
- [ ] Tested OTP expiry (wait 6 minutes)
- [ ] Tested resend OTP
- [ ] Tested invalid OTP
- [ ] Monitored 2Factor dashboard logs

---

## 🎉 You're Done!

Your app now uses reliable, cost-effective SMS OTP via 2Factor!

**Test phone number**: Your own number
**Expected result**: SMS arrives in 5-10 seconds ✅

---

## 🔄 Rollback Plan (If Issues)

If 2Factor doesn't work, you can quickly switch back to Firebase:

1. Keep Firebase code intact (don't delete)
2. Change navigation back to `LoginScreen`
3. Redeploy
4. Firebase flow will work again

Both systems can coexist! 🎯
