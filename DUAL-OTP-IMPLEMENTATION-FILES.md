# Dual OTP Authentication - Implementation Files

## ✅ Files Created/Modified

### Backend Files

#### 1. **backend/src/services/twofactor.service.js** (NEW)
- 2Factor SMS API integration
- Send OTP via 2Factor
- Verify OTP with session management
- Rate limiting
- In-memory session storage (can be upgraded to Redis)

```javascript
const { sendOtp, verifyOtp, resendOtp } = require('./services/twofactor.service');
```

#### 2. **backend/src/controllers/auth.controller.js** (ENHANCED)
Already has these handlers:
- `patientSendOtpHandler` - Send OTP via 2Factor (mobile)
- `patientVerifyOtpHandler` - Verify OTP via 2Factor (mobile)
- `patientFirebasePhoneLoginHandler` - Firebase token verification (web + mobile)

#### 3. **backend/src/routes/auth.routes.js** (EXISTS)
Routes already configured:
```javascript
// Mobile (2Factor)
POST /api/auth/patient/send-otp
POST /api/auth/patient/verify-otp

// Web + Mobile (Firebase)
POST /api/auth/patient/firebase-phone-login
```

#### 4. **backend/src/config/firebase.js** (EXISTS)
Firebase Admin SDK already configured with `verifyFirebaseToken` function

### Frontend Web Files (TO BE CREATED)

#### 1. **frontend/src/config/firebase.js** (NEW)
```javascript
// Firebase Web SDK configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### 2. **frontend/src/stores/authStore.js** (NEW)
```javascript
// Zustand store for authentication state
import create from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(persist((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  
  setAuth: (user, accessToken) => set({ 
    user, 
    accessToken, 
    isAuthenticated: true 
  }),
  
  logout: () => set({ 
    user: null, 
    accessToken: null, 
    isAuthenticated: false 
  }),
}), {
  name: 'auth-storage',
}));

export default useAuthStore;
```

#### 3. **frontend/src/services/api.js** (NEW)
```javascript
// Axios instance with interceptors
import axios from 'axios';
import useAuthStore from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Important for cookies
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

#### 4. **frontend/src/pages/Login.jsx** (NEW)
```javascript
import { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';
import useAuthStore from '../stores/authStore';
import api from '../services/api';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  // Initialize reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved'),
        },
        auth
      );
    }
  };

  // Send OTP via Firebase
  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setupRecaptcha();
      
      const appVerifier = window.recaptchaVerifier;
      const fullPhone = `+91${phone}`;
      
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and login
  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      
      // Verify OTP with Firebase
      const credential = await confirmationResult.confirm(otp);
      const firebaseIdToken = await credential.user.getIdToken();
      
      // Send Firebase token to backend
      const { data } = await api.post('/auth/patient/firebase-phone-login', {
        firebaseIdToken,
      });
      
      setAuth(data.user, data.accessToken);
      window.location.href = '/';
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">PulseMate Connect</h2>
        
        {step === 'phone' ? (
          <>
            <input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-4 py-2 border rounded"
            />
            <button
              onClick={handleSendOTP}
              disabled={phone.length !== 10 || loading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-2 border rounded"
            />
            <button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || loading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </>
        )}
        
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
```

#### 5. **frontend/src/components/ProtectedRoute.jsx** (NEW)
```javascript
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
```

### Mobile App Files (TO BE ENHANCED)

#### 1. **src/screens/LoginScreen.jsx** (ENHANCE)
Already uses Firebase, just needs verification that it uses the correct endpoint:
```javascript
// Existing Firebase flow is correct
// Just ensure it calls patientFirebasePhoneLoginHandler
```

#### 2. **src/screens/MobileLoginScreen.jsx** (NEW - Alternative 2Factor flow)
```javascript
import { useState } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export default function MobileLoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [step, setStep] = useState('phone');

  const handleSendOTP = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/patient/send-otp`, {
        phone: `+91${phone}`,
      });
      
      setSessionId(data.sessionId);
      setStep('otp');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/patient/verify-otp`, {
        phone: `+91${phone}`,
        otp,
        sessionId,
      });
      
      // Store tokens in SecureStore
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    // UI implementation
  );
}
```

#### 3. **src/api/auth.js** (ENHANCE)
```javascript
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Send OTP via 2Factor
export const sendOtp = async (phone) => {
  const { data } = await axios.post(`${API_URL}/auth/mobile/send-otp`, { phone });
  return data;
};

// Verify OTP via 2Factor
export const verifyOtp = async (phone, otp, sessionId) => {
  const { data } = await axios.post(`${API_URL}/auth/mobile/verify`, {
    phone,
    otp,
    sessionId,
  });
  
  // Store tokens
  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  await SecureStore.setItemAsync('user', JSON.stringify(data.user));
  
  return data;
};

// Refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });
    
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    
    return data.accessToken;
  } catch (error) {
    // Token refresh failed, logout user
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    throw error;
  }
};

// Axios instance with interceptors
export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Navigate to login
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Environment Files

#### **backend/.env**
```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# 2Factor SMS API
TWO_FACTOR_API_KEY=your_2factor_api_key_here
TWO_FACTOR_TEMPLATE=AUTOGEN

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pulsemate
```

#### **frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### **mobile/.env** (or app.json)
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:abcdef
```

## 📦 Dependencies

### Backend
```bash
cd backend
npm install axios firebase-admin
```

### Frontend Web
```bash
cd frontend
npm install firebase zustand axios react-router-dom
```

### Mobile
```bash
cd ../  # Root directory
npm install expo-secure-store axios
# Firebase already installed
```

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 2. Frontend Web Setup
```bash
cd frontend
cp .env.example .env
# Edit .env with Firebase config
npm install
npm run dev
```

### 3. Mobile Setup
```bash
# Already configured in existing app
npm start
```

## ✅ Testing Checklist

- [ ] Backend: 2Factor service sends OTP
- [ ] Backend: Firebase token verification works
- [ ] Backend: JWT tokens issued correctly
- [ ] Web: Firebase phone auth sends OTP
- [ ] Web: OTP verification and login works
- [ ] Web: HttpOnly cookie is set
- [ ] Web: Auto token refresh works
- [ ] Mobile: 2Factor OTP is received
- [ ] Mobile: OTP verification and login works
- [ ] Mobile: Tokens stored in SecureStore
- [ ] Mobile: Session persists after restart
- [ ] Mobile: Auto token refresh works

## 📊 API Endpoint Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/patient/firebase-phone-login` | POST | No | Web: Verify Firebase token & login |
| `/api/auth/mobile/send-otp` | POST | No | Mobile: Send OTP via 2Factor |
| `/api/auth/mobile/verify` | POST | No | Mobile: Verify OTP & login |
| `/api/auth/refresh` | POST | Yes (Cookie/Token) | Refresh access token |
| `/api/auth/logout` | POST | Yes | Logout (clear cookie/revoke token) |
| `/api/auth/me` | GET | Yes | Get current user |

## 🎯 Implementation Status

- ✅ Backend: 2Factor service
- ✅ Backend: Auth controller handlers
- ✅ Backend: Routes configured
- ⏳ Frontend Web: To be created
- ⏳ Mobile: To be enhanced

---

**Next Steps**:
1. Create frontend web files
2. Test web Firebase flow end-to-end
3. Enhance mobile app with 2Factor alternative
4. Deploy and monitor
