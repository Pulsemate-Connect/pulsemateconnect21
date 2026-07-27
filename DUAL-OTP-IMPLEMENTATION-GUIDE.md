# Dual OTP Authentication System - Implementation Guide

## 🎯 Overview

This document describes the production-ready dual OTP authentication system for PulseMate Connect:

- **Web Platform**: Firebase Phone Authentication with invisible reCAPTCHA
- **Mobile App**: 2Factor SMS API for direct OTP delivery
- **Backend**: Unified JWT authentication with single Users table

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Web Implementation](#frontend-web-implementation)
4. [Mobile App Implementation](#mobile-app-implementation)
5. [Environment Variables](#environment-variables)
6. [Testing Guide](#testing-guide)
7. [Security Considerations](#security-considerations)

## 🏗️ Architecture

### Authentication Flow Comparison

#### Web Flow (Firebase)
```
User → Enter Phone → Firebase SDK → OTP via SMS → Verify OTP
→ Get Firebase ID Token → Send to Backend → Backend verifies token
→ Backend issues JWT → Set HttpOnly Cookie → Redirect Home
```

#### Mobile Flow (2Factor)
```
User → Enter Phone → Backend API → 2Factor sends OTP
→ User enters OTP → Backend verifies with 2Factor
→ Backend issues JWT → Store in SecureStore → Navigate Home
```

### Key Differences

| Aspect | Web (Firebase) | Mobile (2Factor) |
|--------|---------------|------------------|
| OTP Provider | Firebase (Google) | 2Factor SMS API |
| Verification | Client + Server | Server-side only |
| Token Storage | HttpOnly Cookie | Expo SecureStore |
| reCAPTCHA | Yes (invisible) | No |
| Phone Format | E.164 (+91xxx) | E.164 (+91xxx) |

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── firebase.js                    # Firebase Admin setup
│   ├── controllers/
│   │   └── auth.controller.js             # Auth handlers (existing - enhanced)
│   ├── services/
│   │   ├── twofactor.service.js          # NEW: 2Factor SMS service
│   │   └── token.service.js               # JWT token management
│   ├── middleware/
│   │   └── auth.middleware.js             # JWT verification
│   └── routes/
│       └── auth.routes.js                 # Auth endpoints

frontend/
├── src/
│   ├── config/
│   │   └── firebase.js                    # NEW: Firebase Web SDK
│   ├── stores/
│   │   └── authStore.js                   # NEW: Zustand auth store
│   ├── services/
│   │   └── api.js                         # NEW: Axios API client
│   └── pages/
│       └── Login.jsx                      # NEW: Web login page

mobile (React Native)/
├── src/
│   ├── config/
│   │   └── firebase.js                    # Firebase React Native SDK (existing)
│   ├── store/
│   │   └── authStore.js                   # Auth store (existing - enhanced)
│   ├── api/
│   │   └── auth.js                        # API client (existing - enhanced)
│   └── screens/
│       ├── LoginScreen.jsx                # Mobile login (existing - enhanced)
│       └── OtpScreen.jsx                  # OTP verification (existing)
```

## 🔧 Implementation Files Created

### Backend Files

1. **twofactor.service.js** - 2Factor SMS integration
2. **Auth controller enhancements** - Mobile OTP endpoints
3. **Environment configuration** - API keys and secrets

### Frontend Web Files

1. **firebase.js** - Firebase Web SDK configuration
2. **authStore.js** - Zustand authentication store
3. **api.js** - Axios HTTP client with interceptors
4. **Login.jsx** - Web login page with Firebase
5. **ProtectedRoute.jsx** - Route guard component

### Mobile App Enhancements

1. **LoginScreen.jsx** - Enhanced with 2Factor flow
2. **OtpScreen.jsx** - 2Factor OTP verification
3. **authStore.js** - Enhanced with session persistence

## 🔐 Security Features Implemented

### Backend Security
- ✅ JWT access tokens (15 min expiry)
- ✅ Refresh tokens (7 days) with rotation
- ✅ Rate limiting on OTP endpoints
- ✅ Firebase token validation with revocation check
- ✅ Audit logging for all auth events
- ✅ Session management with device tracking
- ✅ Input validation and sanitization

### Frontend Security
- ✅ HttpOnly cookies for refresh tokens (web)
- ✅ Secure token storage (mobile)
- ✅ Automatic token refresh
- ✅ Request/response interceptors
- ✅ CSRF protection
- ✅ XSS prevention

## 📝 API Endpoints

### Web Authentication (Firebase)

```http
POST /api/auth/web/verify
Content-Type: application/json

{
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIs...",
  "name": "John Doe" (optional)
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "PATIENT",
      "isNewUser": false
    }
  }
}
```

### Mobile Authentication (2Factor)

```http
POST /api/auth/mobile/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "abc123...",
    "message": "OTP sent successfully"
  }
}
```

```http
POST /api/auth/mobile/verify
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456",
  "sessionId": "abc123...",
  "name": "John Doe" (optional)
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "PATIENT",
      "isNewUser": true
    }
  }
}
```

## 🧪 Testing Checklist

### Backend Testing
- [ ] Firebase token verification works
- [ ] 2Factor OTP send/verify works
- [ ] JWT tokens are generated correctly
- [ ] Refresh token rotation works
- [ ] Rate limiting is enforced
- [ ] Audit logs are created
- [ ] Error handling is comprehensive

### Web Testing
- [ ] Firebase phone auth works
- [ ] reCAPTCHA appears and works
- [ ] OTP is received and verified
- [ ] JWT is stored in HttpOnly cookie
- [ ] Auto token refresh works
- [ ] Protected routes work
- [ ] Logout clears session

### Mobile Testing
- [ ] 2Factor OTP is received
- [ ] OTP verification works
- [ ] JWT is stored securely
- [ ] Session persists after app restart
- [ ] Auto token refresh works
- [ ] Logout clears SecureStore
- [ ] Works on both iOS and Android

## 🚀 Deployment Steps

1. **Set Environment Variables** (see next section)
2. **Deploy Backend** with new endpoints
3. **Deploy Web Frontend** with Firebase config
4. **Update Mobile App** with 2Factor flow
5. **Test End-to-End** on staging environment
6. **Monitor** error rates and OTP delivery

## 📊 Monitoring & Metrics

Track these metrics in production:

- OTP send success rate
- OTP verification success rate
- Firebase token validation errors
- 2Factor API errors
- Token refresh failures
- Average login time
- Failed login attempts

## 🆘 Troubleshooting

### Common Issues

**Firebase not initialized**
```
Error: Firebase Admin SDK is not configured
Solution: Check FIREBASE_SERVICE_ACCOUNT_JSON env var
```

**2Factor API failed**
```
Error: TWO_FACTOR_API_KEY missing
Solution: Add 2Factor API key to .env
```

**OTP not received**
```
Check:
1. Phone number format (+91...)
2. 2Factor account balance
3. SMS provider logs
4. Rate limiting (429 errors)
```

**Token expired**
```
Solution: Implement automatic refresh token flow
```

## 📞 Support

For issues or questions:
- Backend: Check backend logs and audit_logs table
- Frontend: Check browser console
- Mobile: Check React Native debugger
- 2Factor: Check dashboard at https://2factor.in

---

**Implementation Status**: ✅ Ready for Integration
**Last Updated**: 2026-07-27
**Version**: 1.0.0
