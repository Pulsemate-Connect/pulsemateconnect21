# ⚡ 2Factor Quick Start (5 Minutes)

## What I Added:

✅ **Backend**: 2Factor SMS OTP service
✅ **Frontend**: New login screens for 2Factor
✅ **Routes**: `/api/auth/patient/send-otp` and `/api/auth/patient/verify-otp`
✅ **Both systems work**: Firebase AND 2Factor (you choose which to use!)

---

## 🚀 Get Started in 5 Steps:

### 1. Create 2Factor Account (2 minutes)
- Go to: https://2factor.in/
- Sign up
- Get your API key from dashboard

### 2. Add Credits (1 minute)
- Minimum: ₹100 (gives you ~650 SMS)
- Payment: UPI/Card/Net banking

### 3. Configure Backend (1 minute)

**Add to `.env`**:
```env
TWOFACTOR_API_KEY=your_api_key_here
```

**Add to Render.com**:
- Dashboard → Environment → Add Variable
- Key: `TWOFACTOR_API_KEY`
- Value: Your API key
- Save (auto-redeploys)

### 4. Update App Navigation (1 minute)

**Option A - Replace Firebase** (simple):
```javascript
// src/navigation/AppNavigator.js
import Login2FactorScreen from '../screens/Login2FactorScreen';
import Otp2FactorScreen from '../screens/Otp2FactorScreen';

<Stack.Screen name="Login" component={Login2FactorScreen} />
<Stack.Screen name="Otp2Factor" component={Otp2FactorScreen} />
```

**Option B - Keep both** (recommended):
```javascript
// Add both, user can choose
<Stack.Screen name="LoginFirebase" component={LoginScreen} />
<Stack.Screen name="Login2Factor" component={Login2FactorScreen} />
```

### 5. Test! (30 seconds)
- Enter your phone number
- Click "Send OTP"
- Check SMS (arrives in 5-10 seconds)
- Enter OTP
- Login! ✅

---

## 💰 Cost

- **2Factor**: ₹0.15 per SMS
- **100 SMS** = ₹15
- **1000 SMS** = ₹150

**Much cheaper than Twilio/Firebase!** 🎉

---

## 📱 API Endpoints

### Send OTP
```bash
POST /api/auth/patient/send-otp
Body: { "phone": "+919876543210" }
Response: { "sessionId": "xxx", "message": "OTP sent" }
```

### Verify OTP
```bash
POST /api/auth/patient/verify-otp
Body: { 
  "phone": "+919876543210",
  "sessionId": "xxx",
  "otp": "123456"
}
Response: { "accessToken": "...", "user": {...} }
```

---

## ✅ Benefits

✅ Reliable delivery in India
✅ Fast (5-10 seconds)
✅ Cheap (₹0.15/SMS)
✅ Simple API
✅ Indian support

---

## 📖 Full Guide

Read `2FACTOR-SETUP-GUIDE.md` for:
- Detailed setup
- Troubleshooting
- Security features
- Monitoring
- Rollback plan

---

## 🎯 Next Steps

1. **Create account**: https://2factor.in/
2. **Add API key** to backend
3. **Build new version** (1.2.6)
4. **Test** on your phone
5. **Deploy** to production

**Time: 5 minutes | Cost: ₹100 | Result: Working OTP! ✅**
