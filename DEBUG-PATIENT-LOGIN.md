# 🐛 DEBUG: Patient Login Not Redirecting to Dashboard

## Problem
After entering OTP, patient login does not redirect to `/patient/home` dashboard.

---

## Debugging Steps

### 1. Open Browser Console
Press **F12** → Click **Console** tab

### 2. Clear Everything
- Clear browser cache: Ctrl+Shift+Delete → Select "All time" → Clear
- Clear localStorage: F12 → Application → Local Storage → Delete all
- Close all tabs
- Reopen browser

### 3. Test Login Flow
Go to: https://www.pulsemateconnect.in/login

Enter phone number and request OTP.

### 4. Monitor Console Logs
After entering OTP, you should see these logs:

**✅ EXPECTED (Working):**
```
[Firebase] Verifying OTP...
[Firebase] OTP verified successfully
[Login] Sending Firebase token to backend...
[API] POST /auth/patient/firebase-phone-login { ... }
[API] Response /auth/patient/firebase-phone-login: { data: { accessToken: "...", user: { ... } } }
[Login] Login successful, user role: PATIENT
[Login] Navigating to dashboard
[ProtectedRoute] isAuthenticated: true, user.role: PATIENT
```

**❌ WRONG (Not Working):**
```
[Login] Verify OTP error: <some error message>
```
OR
```
[Login] Login successful...
[ProtectedRoute] Not authenticated, redirecting to login
```

### 5. Check localStorage
After OTP verification, check:

**F12 → Application → Local Storage → https://www.pulsemateconnect.in**

You should see:
```
pulsemate-auth-storage: {
  "state": {
    "user": { "id": "...", "name": "...", "role": "PATIENT", ... },
    "accessToken": "eyJ...",
    "isAuthenticated": true
  },
  "version": 0
}
```

If `pulsemate-auth-storage` is **missing** or **isAuthenticated** is false → Auth store not saving properly

### 6. Check Network Tab
**F12 → Network → Filter: Fetch/XHR**

After entering OTP, you should see:

1. **POST** `https://api.pulsemateconnect.in/api/auth/patient/firebase-phone-login`
   - Status: **200 OK**
   - Response:
     ```json
     {
       "status": "success",
       "data": {
         "accessToken": "eyJ...",
         "refreshToken": "...",
         "user": {
           "id": "...",
           "mobile": "+91...",
           "role": "PATIENT",
           "isNewUser": false
         }
       }
     }
     ```

If you see **401**, **403**, or **500** → Backend error

### 7. Share Console Output
Copy ALL console logs after entering OTP and share them. This will show exactly where the flow breaks.

---

## Common Issues & Solutions

### Issue 1: `[Login] Verify OTP error: Request failed with status code 401`
**Cause**: Backend rejected the Firebase token  
**Solution**: Check if Firebase App ID is configured in Render environment variables

### Issue 2: `[ProtectedRoute] Not authenticated, redirecting to login`
**Cause**: Auth store not saving or ProtectedRoute reading wrong store  
**Solution**: Already fixed in latest deployment, clear cache and retry

### Issue 3: `[Login] Navigating to dashboard` but stays on login page
**Cause**: PublicRoute redirecting back  
**Solution**: Check if `isAuthenticated` is actually `true` in localStorage

### Issue 4: Navigation happens but immediately redirects back
**Cause**: ProtectedRoute prop mismatch (`roles` vs `requiredRole`)  
**Solution**: Already fixed in latest deployment

### Issue 5: `TypeError: Cannot read property 'role' of null`
**Cause**: User object not being saved to store  
**Solution**: Check backend response structure

---

## Expected Flow Diagram

```
1. User enters phone (+919876543210)
   ↓
2. Firebase sends OTP
   ↓
3. User enters OTP (123456)
   ↓
4. verifyFirebaseOtp() → Returns Firebase ID Token
   ↓
5. loginWithFirebase(firebaseIdToken, name)
   ↓
6. POST /api/auth/patient/firebase-phone-login
   ↓
7. Backend verifies Firebase token
   ↓
8. Backend returns { accessToken, user }
   ↓
9. setAuth(user, accessToken) → Saves to store
   ↓
10. localStorage updated with auth data
    ↓
11. navigate('/patient/home', { replace: true })
    ↓
12. ProtectedRoute checks:
    - isAuthenticated === true ✓
    - user.role === 'PATIENT' ✓
    ↓
13. PatientDashboard renders ✅
```

---

## Files Already Fixed

| File | Issue | Status |
|------|-------|--------|
| `Login.jsx` | Wrong store import (`../stores/authStore`) | ✅ Fixed |
| `ProtectedRoute.jsx` | Wrong store import (`../stores/authStore`) | ✅ Fixed |
| `services/api.js` | Wrong store import (`../stores/authStore`) | ✅ Fixed |
| `App.jsx` | Wrong prop name (`roles` → `requiredRole`) | ✅ Fixed |
| `authStore.js` | Missing persist middleware | ✅ Fixed |
| `authStore.js` | Syntax errors in persist config | ✅ Fixed |

---

## What to Share

Please share:
1. **Console logs** (all of them after clicking "Verify OTP")
2. **Network tab** - Screenshot of the `/firebase-phone-login` request/response
3. **localStorage** - Screenshot of `pulsemate-auth-storage` value
4. **Any error messages** shown on screen

This will help identify exactly where the flow is breaking!
