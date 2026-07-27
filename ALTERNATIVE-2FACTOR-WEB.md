# 🔄 Alternative: Use 2Factor for Web (No Firebase Billing)

If you don't want to enable Firebase billing, you can use 2Factor SMS API for both web and mobile platforms.

---

## ✅ Benefits of This Approach

- ✅ No Firebase billing required
- ✅ Single SMS provider for all platforms
- ✅ More predictable costs (pay per SMS)
- ✅ No credit card required for Firebase
- ✅ Simpler architecture

---

## 📝 Changes Required

### 1. Update Frontend Login Component

Replace Firebase Phone Auth with 2Factor API calls.

**File:** `frontend/src/pages/Login.jsx`

Replace the Firebase authentication logic with API calls to your backend:

```javascript
// Instead of Firebase auth, use backend API
const handleSendOTP = async () => {
  try {
    setLoading(true);
    setError('');
    
    // Call backend to send OTP via 2Factor
    await axios.post('/api/auth/mobile/send-otp', {
      phone: `+${countryCode}${phoneNumber}`
    });
    
    setStep('otp');
    setError('');
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to send OTP');
  } finally {
    setLoading(false);
  }
};

const handleVerifyOTP = async () => {
  try {
    setLoading(true);
    setError('');
    
    // Call backend to verify OTP
    const response = await axios.post('/api/auth/mobile/verify', {
      phone: `+${countryCode}${phoneNumber}`,
      otp: otp
    });
    
    // Save tokens and user data
    const { accessToken, refreshToken, user } = response.data;
    
    // Store in cookies or localStorage
    document.cookie = `accessToken=${accessToken}; path=/; secure; samesite=strict`;
    document.cookie = `refreshToken=${refreshToken}; path=/; secure; samesite=strict`;
    
    // Update auth store
    authStore.setUser(user);
    authStore.setAccessToken(accessToken);
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Invalid OTP');
  } finally {
    setLoading(false);
  }
};
```

---

### 2. Add reCAPTCHA for Web (Bot Protection)

Since we're removing Firebase's built-in bot protection, add Google reCAPTCHA v3.

#### Install reCAPTCHA
```bash
cd frontend
npm install react-google-recaptcha-v3
```

#### Update Login Component
```javascript
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const Login = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const handleSendOTP = async () => {
    try {
      setLoading(true);
      
      // Execute reCAPTCHA
      const recaptchaToken = await executeRecaptcha('send_otp');
      
      // Send OTP with reCAPTCHA token
      await axios.post('/api/auth/mobile/send-otp', {
        phone: `+${countryCode}${phoneNumber}`,
        recaptchaToken
      });
      
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of component
};
```

#### Wrap App with reCAPTCHA Provider
**File:** `frontend/src/main.jsx` or `frontend/src/App.jsx`

```javascript
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

<GoogleReCaptchaProvider reCaptchaKey="YOUR_RECAPTCHA_SITE_KEY">
  <App />
</GoogleReCaptchaProvider>
```

---

### 3. Update Backend to Verify reCAPTCHA

**File:** `backend/src/controllers/auth.controller.js`

Add reCAPTCHA verification to `patientSendOtpHandler`:

```javascript
const axios = require('axios');

const verifyRecaptcha = async (token) => {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );
    
    return response.data.success && response.data.score > 0.5;
  } catch (error) {
    logger.error('reCAPTCHA verification failed:', error);
    return false;
  }
};

exports.patientSendOtpHandler = async (req, res, next) => {
  try {
    const { phone, recaptchaToken } = req.body;
    
    // Verify reCAPTCHA (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed. Please try again.'
        });
      }
    }
    
    // Continue with OTP sending...
    // (rest of existing code)
  } catch (error) {
    next(error);
  }
};
```

---

### 4. Get Google reCAPTCHA Keys

1. Go to: https://www.google.com/recaptcha/admin/create
2. Register a new site:
   - **Label:** PulseMate Connect
   - **reCAPTCHA type:** reCAPTCHA v3
   - **Domains:** 
     - `localhost` (for testing)
     - `pulsemateconnect.in`
     - `www.pulsemateconnect.in`
     - `pulsemate-frontend.onrender.com`
3. Accept terms and submit
4. Copy your keys:
   - **Site Key:** For frontend (public)
   - **Secret Key:** For backend (private)

---

### 5. Add Environment Variables

#### Frontend (.env)
```bash
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

#### Backend (.env)
```bash
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

#### Render Dashboard
Add to `pulsemate-backend` environment:
```
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

---

## 💰 Cost Comparison

### Firebase Phone Auth (Blaze Plan)
- First 10,000 verifications/month: **FREE**
- After 10k: $0.01 per verification
- Requires credit card

### 2Factor SMS API
- No free tier
- Cost: ₹0.20-0.50 per SMS (~$0.0024-0.006 USD)
- Pay as you go (prepaid)
- No credit card for Firebase

### Google reCAPTCHA v3
- **FREE** (up to 1,000,000 assessments/month)
- No billing required

### Cost Example (1000 users/month):
- **Firebase:** $0 (under free tier)
- **2Factor + reCAPTCHA:** ₹200-500 (~$2.40-6 USD)

---

## 🚀 Implementation Steps

### Step 1: Remove Firebase from Frontend
```bash
cd frontend
npm uninstall firebase
npm install react-google-recaptcha-v3
```

### Step 2: Update Login Component
- Replace Firebase auth with API calls
- Add reCAPTCHA protection

### Step 3: Get reCAPTCHA Keys
- Register site at https://www.google.com/recaptcha/admin
- Add keys to environment variables

### Step 4: Update Backend
- Add reCAPTCHA verification to send-otp endpoint
- Add RECAPTCHA_SECRET_KEY to environment

### Step 5: Test
- Test OTP send/verify flow
- Verify reCAPTCHA is working

---

## 📋 Complete File Changes

### Files to Modify:
1. ✅ `frontend/src/pages/Login.jsx` - Replace Firebase with API calls
2. ✅ `frontend/src/main.jsx` - Add reCAPTCHA provider
3. ✅ `frontend/package.json` - Update dependencies
4. ✅ `backend/src/controllers/auth.controller.js` - Add reCAPTCHA verification
5. ✅ `backend/.env.example` - Add RECAPTCHA_SECRET_KEY
6. ✅ `.env` files - Add reCAPTCHA keys

### Files to Remove (Optional):
1. ⚠️ `frontend/src/config/firebase.js` - No longer needed
2. ⚠️ `backend/src/config/firebase.js` - Keep if using for other features

---

## ⚠️ Considerations

### Pros:
- ✅ No Firebase billing
- ✅ Simpler setup
- ✅ Single SMS provider
- ✅ Free reCAPTCHA protection

### Cons:
- ❌ Pay per SMS (no free tier)
- ❌ Need to implement reCAPTCHA separately
- ❌ Slightly more complex frontend logic
- ❌ Dependent on 2Factor service availability

---

## 🎯 Recommendation

### Option 1: Enable Firebase Blaze Plan (Recommended)
**Best for:**
- Testing and development (10k free verifications)
- Growing applications
- Professional setup

**Cost:** $0 for first 10k/month

### Option 2: Use 2Factor for All (This Guide)
**Best for:**
- Absolutely no billing/credit card
- Predictable per-SMS costs
- Simple architecture

**Cost:** ₹0.20-0.50 per SMS

---

## 📞 Need Help Implementing This?

If you want to implement this alternative approach:
1. Let me know and I'll create the updated files
2. I can modify the Login.jsx component
3. I can add reCAPTCHA integration
4. I can update the backend controllers

Just say "implement 2Factor for web" and I'll make all the changes!

---

**Quick Decision:**
- Have credit card + want Firebase reliability → Enable Blaze plan
- No credit card + okay with SMS costs → Use this 2Factor approach

Which do you prefer?
