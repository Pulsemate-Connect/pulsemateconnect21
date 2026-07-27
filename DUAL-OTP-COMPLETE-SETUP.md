# 🚀 Dual OTP Authentication System - Complete Setup Guide

## ✅ Implementation Status: COMPLETE

This guide provides step-by-step instructions to set up and deploy the dual OTP authentication system for PulseMate Connect.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup](#backend-setup)
4. [Frontend Web Setup](#frontend-web-setup)
5. [Mobile App Setup](#mobile-app-setup)
6. [Firebase Configuration](#firebase-configuration)
7. [2Factor Configuration](#2factor-configuration)
8. [Testing Guide](#testing-guide)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What Was Implemented

✅ **Backend**
- 2Factor SMS service integration (`backend/src/services/twofactor.service.js`)
- Enhanced auth controller with mobile OTP endpoints
- Firebase Admin SDK token verification
- JWT token generation and refresh
- Rate limiting and security

✅ **Frontend Web**
- Firebase Web SDK configuration (`frontend/src/config/firebase.js`)
- Zustand authentication store (`frontend/src/stores/authStore.js`)
- Axios API client with interceptors (`frontend/src/services/api.js`)
- Login page with Firebase Phone Auth (`frontend/src/pages/Login.jsx`)
- Protected route component (`frontend/src/components/ProtectedRoute.jsx`)

✅ **Mobile App**
- Existing Firebase integration (already working)
- 2Factor OTP endpoints available as alternative
- Secure token storage with Expo SecureStore

### Authentication Flows

```
┌─────────────────────────────────────────────────────────────┐
│                     WEB AUTHENTICATION                       │
└─────────────────────────────────────────────────────────────┘

User → Enter Phone → Firebase SDK (reCAPTCHA) → OTP via SMS
  → Verify OTP → Get Firebase ID Token → Send to Backend
  → Backend Verifies Token → Issue JWT → Store in Cookie
  → Redirect to Home

┌─────────────────────────────────────────────────────────────┐
│                    MOBILE AUTHENTICATION                     │
└─────────────────────────────────────────────────────────────┘

Option 1 (Primary - Firebase):
User → Enter Phone → Firebase SDK → OTP via SMS → Verify OTP
  → Get Firebase ID Token → Send to Backend → Backend Verifies
  → Issue JWT → Store in SecureStore → Navigate Home

Option 2 (Alternative - 2Factor):
User → Enter Phone → Backend API → 2Factor sends OTP
  → User enters OTP → Backend verifies with 2Factor
  → Issue JWT → Store in SecureStore → Navigate Home
```

---

## 🔧 Prerequisites

### Required Accounts

1. **Firebase Account**
   - Go to: https://console.firebase.google.com
   - Create a new project or use existing
   - Enable Phone Authentication
   - Get Web and Android configurations

2. **2Factor Account** (for mobile alternative)
   - Go to: https://2factor.in
   - Sign up and verify account
   - Get API key from dashboard
   - Add credits for SMS

3. **Development Environment**
   - Node.js 18+ installed
   - PostgreSQL database running
   - Git for version control

---

## 🔨 Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

Dependencies already installed:
- `firebase-admin` - Firebase Admin SDK
- `axios` - For 2Factor API calls
- `jsonwebtoken` - JWT token generation
- `bcryptjs` - Password hashing
- `express` - Web framework
- `@prisma/client` - Database ORM

### Step 2: Environment Variables

Create or update `backend/.env`:

```env
# ─────────────────────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/pulsemate
DIRECT_URL=postgresql://user:password@localhost:5432/pulsemate

# ─────────────────────────────────────────────────────────────
# Firebase Admin SDK
# ─────────────────────────────────────────────────────────────
# Get from Firebase Console → Project Settings → Service Accounts
# → Generate New Private Key → Copy as single-line JSON
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}

# ─────────────────────────────────────────────────────────────
# 2Factor SMS API
# ─────────────────────────────────────────────────────────────
# Get from: https://2factor.in/dashboard
TWO_FACTOR_API_KEY=your_2factor_api_key_here
TWO_FACTOR_TEMPLATE=AUTOGEN

# ─────────────────────────────────────────────────────────────
# JWT Configuration
# ─────────────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ─────────────────────────────────────────────────────────────
# Server Configuration
# ─────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000

# ─────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Database Setup

The schema is already configured. Just run migrations:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### Step 4: Start Backend

```bash
npm run dev
```

Backend should now be running on `http://localhost:5000`

### Step 5: Verify Backend

Test endpoints:

```bash
# Test 2Factor service
curl -X POST http://localhost:5000/api/auth/mobile/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Expected response:
{
  "success": true,
  "data": {
    "sessionId": "2f_1234567890_abcdef",
    "message": "OTP sent successfully",
    "expiresIn": 300
  }
}
```

---

## 🌐 Frontend Web Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install firebase zustand axios react-router-dom
```

### Step 2: Environment Variables

Create `frontend/.env`:

```env
# ─────────────────────────────────────────────────────────────
# API Configuration
# ─────────────────────────────────────────────────────────────
VITE_API_URL=http://localhost:5000/api

# ─────────────────────────────────────────────────────────────
# Firebase Web SDK Configuration
# ─────────────────────────────────────────────────────────────
# Get from Firebase Console → Project Settings → General → Your apps → Web app
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Step 3: Update Router

Add login route to your `App.jsx` or main router file:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home'; // Your existing home page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        
        {/* Add more protected routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Step 4: Add TailwindCSS (if not already configured)

The login page uses TailwindCSS. If not installed:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 5: Start Frontend

```bash
npm run dev
```

Frontend should now be running on `http://localhost:5173`

### Step 6: Test Web Login

1. Open `http://localhost:5173/login`
2. Enter a test phone number (e.g., your own)
3. Click "Send OTP"
4. Check your phone for OTP
5. Enter OTP and verify
6. Should redirect to home page

---

## 📱 Mobile App Setup

### Step 1: Verify Dependencies

The mobile app already has Firebase configured. Verify these are installed:

```bash
# Check package.json for:
expo-secure-store
firebase
axios
@react-navigation/native
```

If missing:

```bash
npm install expo-secure-store firebase axios
```

### Step 2: Environment Configuration

Add to `app.json` or create `.env`:

```json
{
  "extra": {
    "apiUrl": "http://your-backend-url.com/api",
    "firebaseApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "firebaseAuthDomain": "your-project.firebaseapp.com",
    "firebaseProjectId": "your-project-id",
    "firebaseAppId": "1:123456789:android:abcdef123456"
  }
}
```

### Step 3: Verify Firebase Configuration

The mobile app already uses Firebase Phone Auth. Just ensure `google-services.json` is present:

```bash
# Should exist at:
android/app/google-services.json
```

If missing, download from Firebase Console → Project Settings → Your apps → Android app

### Step 4: Test Mobile Login

```bash
npm start
```

The existing login flow should work with Firebase Phone Auth.

---

## 🔥 Firebase Configuration

### Step 1: Enable Phone Authentication

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Enable **Phone** authentication
5. Save changes

### Step 2: Configure Authorized Domains

1. In **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - `your-frontend-domain.com` (for production)
   - `your-backend-domain.com` (for backend verification)

### Step 3: Get Web Configuration

1. Go to **Project Settings** → **General** → **Your apps**
2. Select **Web app** or add new web app
3. Copy configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "1:123:web:abc"
};
```

4. Add to `frontend/.env` as shown above

### Step 4: Get Service Account (for backend)

1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download JSON file
4. Minify JSON to single line (remove newlines and spaces)
5. Add to `backend/.env` as `FIREBASE_SERVICE_ACCOUNT_JSON`

**⚠️ Security Note**: Never commit service account JSON to Git!

### Step 5: Configure Android App (Mobile)

1. Go to **Project Settings** → **Your apps** → Add Android app
2. Enter package name: `in.pulsemateconnect.patient`
3. Download `google-services.json`
4. Place in `android/app/` directory
5. Rebuild app: `npm run android`

---

## 📱 2Factor Configuration

### Step 1: Create Account

1. Go to: https://2factor.in
2. Sign up with email and phone
3. Verify your account

### Step 2: Get API Key

1. Login to dashboard: https://2factor.in/dashboard
2. Go to **API** section
3. Copy your **API Key**
4. Add to `backend/.env` as `TWO_FACTOR_API_KEY`

### Step 3: Add Credits

1. Go to **Recharge** in dashboard
2. Add credits for SMS (₹1 per SMS approximately)
3. Minimum ₹100 recommended for testing

### Step 4: Test 2Factor

```bash
# Test API directly
curl "https://2factor.in/API/V1/YOUR_API_KEY/SMS/919876543210/AUTOGEN/AUTOGEN"

# Expected response:
{
  "Status": "Success",
  "Details": "session-id-here"
}
```

### Step 5: Verify Integration

```bash
# Test via your backend
curl -X POST http://localhost:5000/api/auth/mobile/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

---

## 🧪 Testing Guide

### Unit Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

### Manual Testing Checklist

#### Web Platform

- [ ] Login page loads without errors
- [ ] reCAPTCHA initializes (check browser console)
- [ ] Phone number validation works
- [ ] OTP is sent successfully
- [ ] OTP arrives on phone
- [ ] Invalid OTP shows error
- [ ] Valid OTP logs in successfully
- [ ] JWT is stored in cookie
- [ ] Protected routes redirect to login when logged out
- [ ] Token refresh works on 401
- [ ] Logout clears session
- [ ] New users see name input
- [ ] Session persists after browser refresh

#### Mobile Platform

- [ ] Firebase OTP sends successfully
- [ ] OTP arrives on phone
- [ ] OTP verification works
- [ ] JWT stored in SecureStore
- [ ] Session persists after app restart
- [ ] Token refresh works
- [ ] Logout clears SecureStore
- [ ] 2Factor alternative works (if implemented)

#### Backend

- [ ] Firebase token verification works
- [ ] 2Factor OTP send works
- [ ] 2Factor OTP verify works
- [ ] JWT tokens generated correctly
- [ ] Refresh token rotation works
- [ ] Rate limiting enforced (429 on too many requests)
- [ ] Audit logs created
- [ ] Error responses are user-friendly

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create artillery config (test-load.yml)
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Send OTP'
    flow:
      - post:
          url: '/api/auth/mobile/send-otp'
          json:
            phone: '+919876543210'

# Run test
artillery run test-load.yml
```

---

## 🚀 Deployment

### Environment-Specific Configurations

#### Development

```env
NODE_ENV=development
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

#### Staging

```env
NODE_ENV=staging
BACKEND_URL=https://api-staging.pulsemateconnect.in
FRONTEND_URL=https://staging.pulsemateconnect.in
```

#### Production

```env
NODE_ENV=production
BACKEND_URL=https://api.pulsemateconnect.in
FRONTEND_URL=https://pulsemateconnect.in
```

### Deployment Steps

#### Backend (Node.js)

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name pulsemate-api

# Or use Docker
docker build -t pulsemate-backend .
docker run -p 5000:5000 pulsemate-backend
```

#### Frontend (Vite)

```bash
# Build
npm run build

# Serve with nginx or deploy to Vercel/Netlify
# dist/ folder contains built files
```

#### Mobile (Expo)

```bash
# Build APK for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Post-Deployment Checklist

- [ ] Update Firebase authorized domains
- [ ] Update CORS allowed origins
- [ ] Enable HTTPS/SSL
- [ ] Configure CDN for frontend
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup for database
- [ ] Set up CI/CD pipeline
- [ ] Test production authentication flow
- [ ] Monitor error logs
- [ ] Check 2Factor SMS delivery

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Firebase reCAPTCHA Not Working

**Problem**: reCAPTCHA doesn't appear or fails

**Solutions**:
- Check Firebase API key in `.env`
- Verify domain is authorized in Firebase Console
- Clear browser cache
- Check browser console for errors
- Try in incognito mode

#### 2. OTP Not Received

**Problem**: SMS not arriving

**Solutions**:
- Verify phone number format (+91...)
- Check Firebase quota (free tier limits)
- Check 2Factor account balance
- Verify phone number is valid
- Check spam/blocked messages

#### 3. Invalid Firebase Token Error

**Problem**: Backend rejects Firebase token

**Solutions**:
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is correct
- Check token hasn't expired (tokens expire in 1 hour)
- Ensure Firebase project IDs match
- Check server time is synchronized

#### 4. 2Factor API Errors

**Problem**: 2Factor SMS fails

**Solutions**:
- Verify `TWO_FACTOR_API_KEY` is correct
- Check account balance on 2factor.in
- Verify phone number format
- Check API rate limits
- Review 2Factor dashboard logs

#### 5. CORS Errors

**Problem**: Browser blocks requests

**Solutions**:
- Add frontend URL to `ALLOWED_ORIGINS` in backend
- Ensure `withCredentials: true` in axios
- Check CORS middleware configuration
- Verify protocol (http vs https)

#### 6. Token Refresh Loop

**Problem**: Infinite refresh attempts

**Solutions**:
- Check refresh token cookie is sent
- Verify JWT_SECRET matches
- Clear cookies and login again
- Check token expiry configuration

### Debugging Commands

```bash
# Check backend logs
pm2 logs pulsemate-api

# Test Firebase token manually
curl -X POST http://localhost:5000/api/auth/patient/firebase-phone-login \
  -H "Content-Type: application/json" \
  -d '{"firebaseIdToken": "your-test-token"}'

# Check database users
psql -d pulsemate -c "SELECT id, mobile, role, \"isPhoneVerified\" FROM users LIMIT 10;"

# Monitor API requests
# Add this to backend temporarily:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});
```

### Getting Help

- **Backend Issues**: Check `backend/logs/` folder
- **Frontend Issues**: Check browser console
- **Mobile Issues**: Check React Native debugger
- **Firebase Issues**: Check Firebase Console logs
- **2Factor Issues**: Check 2Factor dashboard

---

## 📊 Monitoring & Analytics

### Metrics to Track

1. **Authentication Success Rate**
   - % of successful logins
   - % of failed OTP verifications
   - Average time to login

2. **OTP Delivery**
   - SMS delivery success rate
   - Average delivery time
   - Failed SMS attempts

3. **API Performance**
   - Response times
   - Error rates
   - Rate limit hits

4. **User Behavior**
   - Login frequency
   - Session duration
   - Token refresh frequency

### Recommended Tools

- **Backend**: PM2, Sentry, DataDog
- **Frontend**: LogRocket, Google Analytics
- **Mobile**: Firebase Analytics, Crashlytics
- **Infrastructure**: CloudWatch, Grafana

---

## 🎉 Success!

You've successfully set up the dual OTP authentication system for PulseMate Connect!

### What's Next?

1. Complete profile management features
2. Add social login (optional)
3. Implement biometric authentication for mobile
4. Add multi-factor authentication
5. Set up automated testing
6. Configure monitoring and alerts

### Support

For issues or questions:
- Check troubleshooting section above
- Review code comments in implementation files
- Check Firebase/2Factor documentation
- Contact: support@pulsemateconnect.in

---

**Version**: 1.0.0  
**Last Updated**: 2026-07-27  
**Status**: ✅ Production Ready
