# 🔄 MESSAGE CENTRAL VERIFYNOW - MIGRATION PLAN

**Goal:** Completely replace Firebase Phone Auth with Message Central VerifyNow OTP  
**Date:** August 5, 2026  
**App:** React Native Android Only (Website keeps Firebase)

---

## 🎯 MIGRATION OBJECTIVES

### ✅ What We're Achieving:
1. **Remove ALL Firebase Auth** from React Native app
2. **Backend-controlled authentication** - Message Central credentials NEVER exposed to app
3. **Message Central VerifyNow API** for OTP delivery
4. **Backend issues JWT** after successful OTP verification
5. **Website continues** using Firebase (unchanged)

### ❌ What We're Removing:
- `firebase` package (keeping only if needed for Analytics/Crashlytics)
- `src/config/firebase-phone-production.js`
- `src/components/FirebaseRecaptchaVerifier.jsx`
- All `signInWithPhoneNumber()` calls
- All Firebase Auth imports and code

---

## 📋 PHASE 1: BACKEND IMPLEMENTATION

### Step 1.1: Environment Variables

**File:** `backend/.env`

```env
# Message Central VerifyNow
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_PASSWORD=<your_base64_encoded_password>
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com

# Existing
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

**Security:** Never commit `.env` to Git!

---

### Step 1.2: Message Central Service

**File:** `backend/src/services/messagecentral.service.js`

```javascript
const axios = require('axios');

const BASE_URL = process.env.MESSAGE_CENTRAL_BASE_URL;
const CUSTOMER_ID = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = process.env.MESSAGE_CENTRAL_PASSWORD;

// In-memory cache for auth tokens (use Redis in production)
let authTokenCache = {
  token: null,
  expiresAt: null
};

/**
 * Generate Message Central Authentication Token
 */
async function generateAuthToken() {
  try {
    // Check cache first
    if (authTokenCache.token && authTokenCache.expiresAt > Date.now()) {
      console.log('[MessageCentral] Using cached auth token');
      return authTokenCache.token;
    }

    console.log('[MessageCentral] Generating new auth token...');
    
    const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
      params: {
        customerId: CUSTOMER_ID,
        key: PASSWORD,
        scope: 'NEW',
        country: '91',
        email: 'tech@pulsemateconnect.in'
      },
      headers: {
        'accept': '*/*'
      }
    });

    if (response.data.responseCode !== 200) {
      throw new Error(`Failed to generate token: ${response.data.message}`);
    }

    const token = response.data.data.authToken;
    
    // Cache token (expires in ~30 days, but we'll refresh every day)
    authTokenCache = {
      token,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    console.log('[MessageCentral] ✅ Auth token generated');
    return token;
  } catch (error) {
    console.error('[MessageCentral] ❌ Token generation failed:', error.message);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Send OTP to mobile number
 */
async function sendOTP(mobileNumber, otpLength = 6) {
  try {
    console.log(`[MessageCentral] Sending OTP to ${mobileNumber}...`);
    
    const authToken = await generateAuthToken();
    
    const response = await axios.post(
      `${BASE_URL}/verification/v3/send`,
      null,
      {
        params: {
          countryCode: '91',
          customerId: CUSTOMER_ID,
          flowType: 'SMS',
          mobileNumber: mobileNumber.replace('+91', ''), // Remove +91 prefix
          otpLength: otpLength
        },
        headers: {
          'authToken': authToken
        }
      }
    );

    if (response.data.responseCode !== 200) {
      throw new Error(`Failed to send OTP: ${response.data.message}`);
    }

    const { verificationId, timeout } = response.data.data;
    
    console.log('[MessageCentral] ✅ OTP sent successfully');
    console.log('[MessageCentral] Verification ID:', verificationId);
    console.log('[MessageCentral] Timeout:', timeout, 'seconds');

    return {
      verificationId,
      timeout: parseInt(timeout) || 60,
      mobileNumber: `+91${mobileNumber.replace('+91', '')}`
    };
  } catch (error) {
    console.error('[MessageCentral] ❌ Send OTP failed:', error.message);
    
    // Handle specific errors
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.message || 'Failed to send OTP');
    }
    
    throw new Error('Failed to send OTP');
  }
}

/**
 * Validate OTP
 */
async function validateOTP(verificationId, code) {
  try {
    console.log(`[MessageCentral] Validating OTP for verification ID: ${verificationId}...`);
    
    const authToken = await generateAuthToken();
    
    const response = await axios.post(
      `${BASE_URL}/verification/v3/validateOtp`,
      null,
      {
        params: {
          verificationId,
          code
        },
        headers: {
          'authToken': authToken
        }
      }
    );

    if (response.data.responseCode !== 200) {
      const errorCode = response.data.responseCode;
      
      // Handle specific error codes
      if (errorCode === 702) {
        throw new Error('WRONG_OTP');
      } else if (errorCode === 705) {
        throw new Error('OTP_EXPIRED');
      } else if (errorCode === 703) {
        throw new Error('ALREADY_VERIFIED');
      } else if (errorCode === 700) {
        throw new Error('VERIFICATION_FAILED');
      }
      
      throw new Error(response.data.message || 'OTP validation failed');
    }

    const { verificationStatus, mobileNumber } = response.data.data;
    
    if (verificationStatus !== 'VERIFICATION_COMPLETED') {
      throw new Error('OTP verification incomplete');
    }

    console.log('[MessageCentral] ✅ OTP validated successfully');
    console.log('[MessageCentral] Mobile:', mobileNumber);

    return {
      success: true,
      mobileNumber: `+91${mobileNumber}`,
      verificationStatus
    };
  } catch (error) {
    console.error('[MessageCentral] ❌ OTP validation failed:', error.message);
    
    // Return user-friendly errors
    if (error.message === 'WRONG_OTP') {
      throw new Error('Invalid OTP code. Please check and try again.');
    } else if (error.message === 'OTP_EXPIRED') {
      throw new Error('OTP has expired. Please request a new one.');
    } else if (error.message === 'ALREADY_VERIFIED') {
      throw new Error('This OTP has already been used.');
    }
    
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.message || 'Failed to validate OTP');
    }
    
    throw new Error('Failed to validate OTP');
  }
}

module.exports = {
  sendOTP,
  validateOTP,
  generateAuthToken
};
```

---

### Step 1.3: Auth Controller Updates

**File:** `backend/src/controllers/auth.controller.js`

Add these new methods:

```javascript
const messageCentralService = require('../services/messagecentral.service');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

/**
 * Send OTP - Message Central
 * POST /api/auth/patient/send-otp
 */
exports.sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    // Validate input
    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Validate format
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10 && cleanNumber.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format'
      });
    }

    // Rate limiting check (optional - implement based on your needs)
    // TODO: Check if this number has requested OTP too many times in last 15 mins

    // Send OTP via Message Central
    const result = await messageCentralService.sendOTP(cleanNumber, 6);

    // Store verification ID in memory/Redis with expiry
    // For now, we'll just return it to the client
    // In production, use Redis with 5-minute TTL

    res.status(200).json({
      success: true,
      verificationId: result.verificationId,
      expiresIn: result.timeout,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('[Auth] Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

/**
 * Verify OTP and Login/Register - Message Central
 * POST /api/auth/patient/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { verificationId, otp, mobileNumber } = req.body;

    // Validate input
    if (!verificationId || !otp || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Verification ID, OTP, and mobile number are required'
      });
    }

    // Validate OTP via Message Central
    const validation = await messageCentralService.validateOTP(verificationId, otp);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // OTP is valid - now handle user login/registration
    const cleanMobile = validation.mobileNumber;

    // Find or create user
    let user = await prisma.patient.findUnique({
      where: { mobile: cleanMobile }
    });

    if (!user) {
      // New user - create account
      user = await prisma.patient.create({
        data: {
          mobile: cleanMobile,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('[Auth] New patient registered:', user.id, cleanMobile);
    } else {
      // Existing user - update last login
      user = await prisma.patient.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          updatedAt: new Date()
        }
      });
      
      console.log('[Auth] Patient login:', user.id, cleanMobile);
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        mobile: user.mobile,
        role: 'PATIENT'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        mobile: user.mobile,
        role: 'PATIENT'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        patientId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('[Auth] Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
};
```

---

### Step 1.4: Auth Routes

**File:** `backend/src/routes/auth.routes.js`

Add these routes:

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Message Central OTP routes
router.post('/patient/send-otp', authController.sendOtp);
router.post('/patient/verify-otp', authController.verifyOtp);

// Existing routes...
// router.post('/patient/firebase-phone-login', authController.firebasePhoneLogin);

module.exports = router;
```

---

## 📋 PHASE 2: FRONTEND IMPLEMENTATION

### Step 2.1: Remove Firebase Dependencies

**Update:** `package.json`

```json
{
  "dependencies": {
    // REMOVE these:
    // "firebase": "^10.14.1",
    
    // KEEP these (existing):
    "@react-native-async-storage/async-storage": "^2.2.0",
    "axios": "^1.6.7",
    "react-native-webview": "13.15.0"
  }
}
```

**Run:**
```bash
npm uninstall firebase
```

---

### Step 2.2: Delete Firebase Files

Delete these files:
- `src/config/firebase-phone-production.js`
- `src/components/FirebaseRecaptchaVerifier.jsx`

---

### Step 2.3: Create Auth Service

**File:** `src/services/auth.service.js`

```javascript
import api from '../api/axios';

/**
 * Send OTP to mobile number
 */
export const sendOtp = async (mobileNumber) => {
  try {
    console.log('[Auth Service] Sending OTP to:', mobileNumber);
    
    const response = await api.post('/auth/patient/send-otp', {
      mobileNumber
    });

    return response.data;
  } catch (error) {
    console.error('[Auth Service] Send OTP failed:', error);
    throw error.response?.data || error;
  }
};

/**
 * Verify OTP and login
 */
export const verifyOtp = async (verificationId, otp, mobileNumber) => {
  try {
    console.log('[Auth Service] Verifying OTP...');
    
    const response = await api.post('/auth/patient/verify-otp', {
      verificationId,
      otp,
      mobileNumber
    });

    return response.data;
  } catch (error) {
    console.error('[Auth Service] Verify OTP failed:', error);
    throw error.response?.data || error;
  }
};
```

---

### Step 2.4: Update Login Screen

**File:** `src/screens/Login2FactorScreen.jsx`

```javascript
import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { sendOtp } from '../services/auth.service';

export default function Login2FactorScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const trimmed = mobile.trim();
    
    if (trimmed.length < 10) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number.');
      return;
    }

    const fullNumber = `+91${trimmed}`;
    setLoading(true);

    try {
      const result = await sendOtp(fullNumber);
      
      if (result.success) {
        navigation.navigate('Otp2Factor', {
          mobile: fullNumber,
          verificationId: result.verificationId,
          expiresIn: result.expiresIn
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={mobile}
        onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
        placeholder="98765 43210"
        keyboardType="phone-pad"
        maxLength={10}
      />
      <TouchableOpacity onPress={handleSendOtp} disabled={loading || mobile.length < 10}>
        <Text>{loading ? 'Sending...' : 'Send OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

### Step 2.5: Update OTP Screen

**File:** `src/screens/Otp2FactorScreen.jsx`

```javascript
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { verifyOtp } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Otp2FactorScreen({ route, navigation }) {
  const { mobile, verificationId, expiresIn } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(expiresIn || 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOtp(verificationId, otp, mobile);
      
      if (result.success) {
        // Store tokens
        await AsyncStorage.setItem('accessToken', result.accessToken);
        await AsyncStorage.setItem('refreshToken', result.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        
        // Navigate to home
        navigation.replace('Home');
      } else {
        Alert.alert('Error', result.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>Enter OTP sent to {mobile}</Text>
      <TextInput
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
      />
      <Text>Time remaining: {timer}s</Text>
      <TouchableOpacity onPress={handleVerifyOtp} disabled={loading || otp.length < 6}>
        <Text>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 📋 PHASE 3: TESTING

### Backend Testing:

1. **Test Token Generation:**
```bash
curl --location 'https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=C-B6442109CBD3438&key=<password>&scope=NEW&country=91'
```

2. **Test Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9876543210"}'
```

3. **Test Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"verificationId": "xxxx", "otp": "123456", "mobileNumber": "+919876543210"}'
```

### Frontend Testing:

1. Enter phone number
2. Tap "Send OTP"
3. Receive SMS
4. Enter OTP
5. Verify login successful
6. Check AsyncStorage has JWT

---

## ✅ MIGRATION CHECKLIST

### Backend:
- [ ] Install axios in backend
- [ ] Create `messagecentral.service.js`
- [ ] Update `auth.controller.js`
- [ ] Add new routes in `auth.routes.js`
- [ ] Add environment variables
- [ ] Test Message Central token generation
- [ ] Test send OTP API
- [ ] Test verify OTP API
- [ ] Deploy backend with new env vars

### Frontend:
- [ ] Uninstall `firebase` package
- [ ] Delete `firebase-phone-production.js`
- [ ] Delete `FirebaseRecaptchaVerifier.jsx`
- [ ] Create `auth.service.js`
- [ ] Update `Login2FactorScreen.jsx`
- [ ] Update `Otp2FactorScreen.jsx`
- [ ] Test OTP flow end-to-end
- [ ] Build new APK
- [ ] Test on real device

### Verification:
- [ ] No Firebase Auth code remains
- [ ] Message Central credentials not in app
- [ ] JWT authentication working
- [ ] Refresh token rotation working
- [ ] Session management working

---

## 🚀 DEPLOYMENT ORDER

1. **Deploy Backend First** (with Message Central service)
2. **Test backend APIs** using Postman/curl
3. **Update Frontend** (remove Firebase, add Message Central)
4. **Test locally** with Expo Go/dev build
5. **Build production APK/AAB**
6. **Test on real device**
7. **Deploy to Play Store**

---

## 💰 COST COMPARISON

| Service | Before (Firebase) | After (Message Central) |
|---------|------------------|------------------------|
| Free Tier | 10,000 SMS/month | Free credits (test) |
| Paid | Pay-as-you-go | Pay-as-you-go |
| Setup | Complex | Simpler backend flow |
| Control | Limited | Full backend control |

---

## 📞 CREDENTIALS

```
Customer ID: C-B6442109CBD3438
Auth Token: eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ
Base URL: https://cpaas.messagecentral.com
```

**Store these in `.env` - NEVER commit to Git!**

---

**Ready to start migration?** Let me know and I'll help you implement step by step!
