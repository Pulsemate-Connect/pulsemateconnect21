# 📱 OTP Services Overview - PulseMate Connect

## 🎯 Current OTP Implementation

You are using a **HYBRID OTP SYSTEM** with different services for different flows:

---

## 1️⃣ Patient Login Flow (Primary) - BACKEND SMS

### Service: **2Factor.in**
**Usage:** Patient authentication via mobile app  
**Status:** ✅ ACTIVE (Production)

### Configuration
```yaml
SMS_PROVIDER: twofactor
TWOFACTOR_API_KEY: [Set in Render dashboard]
TWOFACTOR_TEMPLATE_NAME: AUTOGEN
OTP_EXPIRY_MINUTES: 5
OTP_MAX_ATTEMPTS: 5
OTP_RESEND_COOLDOWN_SECONDS: 60
```

### How It Works
1. **Frontend** (React Native app) calls your **backend API**
2. **Backend** generates OTP and calls **2Factor.in API**
3. **2Factor.in** sends SMS to user's mobile
4. User enters OTP in app
5. **Backend verifies** OTP and creates session

### API Endpoint
```
POST https://api.pulsemateconnect.in/api/auth/patient/send-otp
POST https://api.pulsemateconnect.in/api/auth/patient/verify-otp
```

### Implementation Files
- `backend/src/services/sms.service.js` - SMS delivery
- `backend/src/services/otp.service.js` - OTP generation/verification
- `backend/src/controllers/auth.controller.js` - Auth endpoints
- `src/config/firebase.js` - Frontend API calls

### 2Factor.in Details
- **Website:** https://2factor.in
- **API Documentation:** https://2factor.in/docs/
- **Type:** SMS gateway service (India-focused)
- **Cost:** Pay-per-SMS model
- **Features:**
  - SMS OTP delivery
  - WhatsApp OTP (optional)
  - Auto-generated templates
  - Delivery tracking

---

## 2️⃣ Firebase Phone Authentication (Not Currently Used)

### Service: **Firebase Authentication**
**Usage:** Commented out / Legacy  
**Status:** ⚠️ NOT ACTIVE (Code present but not in use)

### Why Not Used
Your current implementation uses **Backend SMS** (2Factor) instead of Firebase Phone Auth because:
- Backend has full control over OTP generation
- Backend handles rate limiting
- Backend manages OTP storage and verification
- More cost-effective for your use case

### Firebase Configuration (Available but not used)
```yaml
FIREBASE_API_KEY: AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc
FIREBASE_SERVICE_ACCOUNT_JSON: [Set in Render dashboard]
```

---

## 3️⃣ Optional WhatsApp OTP (Not Configured)

### Service: **2Factor.in WhatsApp**
**Status:** ⚠️ NOT ACTIVE (Feature available but not configured)

To enable WhatsApp OTP, add to environment:
```yaml
WHATSAPP_PROVIDER: 2factor
WHATSAPP_TEMPLATE_ID: [Your WhatsApp template ID]
```

---

## 📊 OTP Service Comparison

| Feature | 2Factor.in (Current) | Firebase Auth | MSG91 | Twilio |
|---------|---------------------|---------------|-------|--------|
| **Status** | ✅ ACTIVE | ⚠️ Available | ⚠️ Available | ⚠️ Available |
| **Region** | India-focused | Global | India | Global |
| **SMS Cost** | ~₹0.10-0.20/SMS | Pay-per-use | ~₹0.10-0.15/SMS | ~$0.0075/SMS |
| **Setup** | API Key | Firebase Config | API Key | Account SID |
| **OTP Control** | Backend | Client | Backend | Backend |
| **WhatsApp** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **Templates** | AUTOGEN | N/A | Custom | Custom |

---

## 🔧 Your Current Backend SMS Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT LOGIN OTP FLOW                     │
└─────────────────────────────────────────────────────────────┘

1. User enters mobile number in app
   ↓
2. App sends request to backend
   POST /api/auth/patient/send-otp
   { phone: "+919876543210" }
   ↓
3. Backend (auth.controller.js)
   - Validates phone number
   - Checks rate limits (3 requests per 15 min)
   - Generates 6-digit OTP
   - Hashes OTP with bcrypt
   - Stores in database
   ↓
4. Backend calls sms.service.js
   - sendVia2Factor(mobile, otp)
   ↓
5. 2Factor.in API
   GET https://2factor.in/API/V1/{API_KEY}/SMS/{mobile}/{otp}/AUTOGEN
   ↓
6. User receives SMS with OTP
   ↓
7. User enters OTP in app
   ↓
8. App sends verification request
   POST /api/auth/patient/verify-otp
   { phone: "+919876543210", requestId: "...", otp: "123456" }
   ↓
9. Backend verifies OTP
   - Checks OTP hash matches
   - Checks not expired (5 minutes)
   - Checks attempts < 5
   - Creates session tokens
   ↓
10. User logged in ✅
```

---

## 📁 Key Configuration Files

### Production (Render)
```yaml
# render.yaml
SMS_PROVIDER: twofactor
TWOFACTOR_API_KEY: [Secret - set in Render dashboard]
TWOFACTOR_TEMPLATE_NAME: AUTOGEN
OTP_EXPIRY_MINUTES: 5
OTP_MAX_ATTEMPTS: 5
OTP_RESEND_COOLDOWN_SECONDS: 60
```

### Backend Environment
```env
# backend/.env (local development)
SMS_PROVIDER=twofactor
TWOFACTOR_API_KEY=your_2factor_api_key_here
TWOFACTOR_TEMPLATE_NAME=AUTOGEN
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
```

---

## 🔐 Security Features

### Rate Limiting
- **3 OTP requests per 15 minutes** per phone number
- Prevents SMS spam and abuse
- Implemented in backend middleware

### OTP Security
- **6-digit random OTP** generated with crypto
- **Hashed with bcrypt** before storing
- **5-minute expiry** window
- **Maximum 5 verification attempts**
- **60-second cooldown** between resend requests

### Session Management
- OTP verification returns JWT tokens
- Access token + Refresh token
- Tokens stored securely in app

---

## 💰 Cost Analysis

### 2Factor.in Pricing (Approximate)
- **Transactional SMS:** ₹0.10 - ₹0.20 per SMS
- **Promotional SMS:** ₹0.08 - ₹0.15 per SMS
- **OTP SMS:** ₹0.12 per SMS (typical)
- **WhatsApp OTP:** ₹0.25 - ₹0.35 per message

### Monthly Cost Estimate
```
Assumptions:
- 1000 patient logins/month
- 10% resend rate
- Total SMS: 1100

Cost = 1100 × ₹0.12 = ₹132/month (~$1.60/month)
```

### Comparison
- **2Factor.in:** ₹132/month for 1100 SMS
- **Firebase Auth:** Free tier (10K verifications/month), then ~₹0.05/SMS
- **MSG91:** ₹110-165/month for 1100 SMS
- **Twilio:** ~₹660/month ($8/month) for 1100 SMS

**Verdict:** 2Factor.in is cost-effective for Indian users.

---

## 🛠️ Alternative Providers (Available in Code)

### Option 1: MSG91 (India)
```env
SMS_PROVIDER=msg91
SMS_API_KEY=your_msg91_api_key
SMS_TEMPLATE_ID=your_flow_id
SMS_SENDER_ID=PULSE
```

### Option 2: Twilio (Global)
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
SMS_SENDER_ID=+1234567890
```

### Option 3: Firebase Auth (Client-side)
```env
SMS_PROVIDER=firebase
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Option 4: Mock (Development Only)
```env
SMS_PROVIDER=mock
# Logs OTP to console, no real SMS sent
```

---

## 📋 Switching SMS Providers

### To Switch from 2Factor to MSG91:
1. Update `render.yaml`:
   ```yaml
   SMS_PROVIDER: msg91
   SMS_API_KEY: [MSG91 API key]
   SMS_TEMPLATE_ID: [MSG91 Flow ID]
   ```
2. Get MSG91 API key from https://msg91.com
3. Create SMS flow template in MSG91 dashboard
4. Update Render environment variables
5. Restart backend service
6. Test OTP flow

### To Switch to Firebase Auth:
1. Update `render.yaml`:
   ```yaml
   SMS_PROVIDER: firebase
   ```
2. Configure Firebase Phone Auth in Firebase Console
3. Add Firebase service account JSON to Render
4. Update app to use Firebase client SDK (requires code changes)
5. Test thoroughly

---

## 🧪 Testing OTP Services

### Check 2Factor.in Balance
```bash
curl "https://2factor.in/API/V1/{YOUR_API_KEY}/ADDON_SERVICES/BAL/TRANSACTIONAL_SMS"
```

### Test SMS Delivery
```bash
# Send test OTP
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'
```

### Check Delivery Logs
```bash
# Check Render logs for SMS status
# Look for "[2Factor] Sent. id: ..." messages
```

---

## 📊 Current Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Primary SMS Service** | ✅ 2Factor.in | Active in production |
| **WhatsApp OTP** | ⚠️ Not configured | Available but not enabled |
| **Firebase Auth** | ⚠️ Not used | Code present, not active |
| **Rate Limiting** | ✅ Active | 3 requests/15min |
| **OTP Security** | ✅ Active | Hashed, 5min expiry |
| **Production Backend** | ✅ Running | https://api.pulsemateconnect.in |
| **Mobile App** | ✅ Connected | Using backend SMS flow |

---

## 🎯 Recommendations

### Current Setup ✅
Your current 2Factor.in setup is:
- **Cost-effective** for Indian market
- **Reliable** with good delivery rates
- **Well-integrated** with your backend
- **Secure** with proper rate limiting

### Consider Adding
1. **WhatsApp OTP** as fallback option
2. **SMS delivery tracking** and analytics
3. **Failed SMS retry** mechanism
4. **Multi-language OTP templates**

### Future Enhancements
1. **Biometric authentication** (fingerprint/face)
2. **Email OTP** as alternative
3. **Magic links** for passwordless login
4. **Social logins** (Google, Apple)

---

**Last Updated:** August 4, 2026  
**Service:** 2Factor.in  
**Status:** ✅ Active in Production  
**Monthly Cost:** ~₹132 for 1000 logins
