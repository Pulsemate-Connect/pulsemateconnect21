# 🚀 LOCAL DEVELOPMENT GUIDE

Run frontend locally connected to production Render backend.

**Perfect for debugging authentication issues!**

---

## ✅ WHAT'S CONFIGURED

- ✅ Frontend `.env` updated with production backend URL
- ✅ Firebase credentials configured for OTP
- ✅ Backend URL: `https://api.pulsemateconnect.in`
- ✅ Frontend will run on: `http://localhost:3000`

---

## 🎯 QUICK START

### Option 1: Use Batch File (Easiest)

```cmd
START-LOCAL-DEV.bat
```

This will:
1. Navigate to frontend folder
2. Start Vite dev server
3. Open browser automatically
4. Show console logs in terminal

### Option 2: Manual Commands

```cmd
cd frontend
npm run dev
```

---

## 🌐 WHAT YOU'LL SEE

### Terminal Output
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
➜  press h + enter to show help
```

### Browser
- Opens automatically at `http://localhost:3000`
- Shows your PulseMate Connect app
- Connected to production backend
- Real OTP via Firebase

---

## 🔍 DEBUGGING BENEFITS

### Console Logs (Terminal)
```
[Login] Sending OTP to: +919876543210
[Login] OTP sent successfully
[Login] Verifying OTP with Firebase...
[Login] Sending Firebase token to backend...
[Login] Login successful, user: PATIENT
[Login] Navigating to patient dashboard
```

### Browser Console (F12)
```javascript
[Login] Login successful, user: PATIENT
[Login] Navigating to patient dashboard
// See navigation happen in real-time
// Check localStorage: token, user
// See any errors immediately
```

### Network Tab (F12 → Network)
```
POST /api/auth/patient/firebase-phone-login
Status: 200 OK
Response: { accessToken: "...", user: {...} }
```

---

## 🧪 TESTING PATIENT LOGIN

### Step 1: Start Dev Server
```cmd
START-LOCAL-DEV.bat
```

### Step 2: Open Browser
```
http://localhost:3000
```

### Step 3: Navigate to Login
```
Click "Login as Patient"
OR
Go to: http://localhost:3000/login
```

### Step 4: Test OTP Flow
```
1. Enter phone: +919876543210
2. Click "Send OTP"
3. Check SMS for OTP
4. Enter OTP
5. Watch console logs
```

### Step 5: Observe
```
✅ Terminal: See [Login] logs
✅ Browser Console: See navigation logs
✅ Network Tab: See API calls
✅ Result: Should navigate to /patient/home
```

---

## 🐛 WHAT TO CHECK IF BROKEN

### In Terminal
```
[Login] Login successful, user: PATIENT
[Login] Navigating to patient dashboard
```
If you DON'T see "Navigating to patient dashboard" → navigation code not executing

### In Browser Console (F12)
```javascript
// Check for errors
// Check localStorage
localStorage.getItem('token')     // Should have JWT
localStorage.getItem('user')      // Should have user object
localStorage.getItem('authStore') // Should have Zustand state

// Check navigation
// Did window.location.href execute?
// Any React Router errors?
```

### In Network Tab (F12 → Network)
```
Filter: /api/auth/patient/firebase-phone-login
Status: 200 OK? ✅
Status: 401/403? ❌ Backend auth issue
Status: 500? ❌ Server error

Response body:
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "role": "PATIENT",  // Must be PATIENT
      ...
    }
  }
}
```

---

## 📝 CONSOLE LOG CHECKLIST

After entering OTP, you should see these logs in order:

```
✅ [Login] Verifying OTP with Firebase...
✅ [Firebase] OTP verified successfully
✅ [Login] Sending Firebase token to backend...
✅ [Login] Login successful, user: PATIENT
✅ [Login] Navigating to patient dashboard
```

**If missing any of these**, tell me which one and we'll fix it.

---

## 🔧 CONFIGURATION FILES

### Frontend .env (Already Updated)
```env
VITE_API_URL=https://api.pulsemateconnect.in/api
VITE_FIREBASE_API_KEY=AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc
VITE_FIREBASE_AUTH_DOMAIN=pulsemateconnect-21.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pulsemateconnect-21
```

### What This Means
- Frontend runs locally (http://localhost:3000)
- API calls go to Render (https://api.pulsemateconnect.in)
- Firebase OTP works (real SMS)
- Database is production (Render PostgreSQL)

---

## 🌐 HOW IT WORKS

```
Your Browser (localhost:3000)
↓
Vite Dev Server (localhost:3000)
↓
React App (Login.jsx)
↓
Firebase Phone Auth (OTP SMS)
↓
API Call: POST https://api.pulsemateconnect.in/api/auth/patient/firebase-phone-login
↓
Render Backend (production)
↓
PostgreSQL Database (production)
↓
Response: JWT + User Data
↓
Save to localStorage
↓
Navigate to /patient/home
↓
✅ Dashboard renders
```

---

## ⚡ HOT RELOAD

When you edit files, Vite automatically reloads:

```
Edit Login.jsx → Save → Browser refreshes automatically ✅
```

**Perfect for testing fixes in real-time!**

---

## 🛑 HOW TO STOP

In the terminal where dev server is running:
```
Press: Ctrl + C
Confirm: Y
```

---

## 🔄 RESTART AFTER CODE CHANGES

If you git pull new changes:
```cmd
# Stop server (Ctrl+C)
# Start again
START-LOCAL-DEV.bat
```

Vite will pick up the new code automatically.

---

## 📊 COMPARE: LOCAL vs PRODUCTION

### Local Development (What you're running now)
```
Frontend: localhost:3000 (your computer)
Backend:  api.pulsemateconnect.in (Render)
Database: Production (Render PostgreSQL)
Firebase: Production (real SMS)
Logs:     Visible in terminal ✅
Hot Reload: Yes ✅
```

### Production (Render deployment)
```
Frontend: pulsemateconnect.in (Render)
Backend:  api.pulsemateconnect.in (Render)
Database: Production (Render PostgreSQL)
Firebase: Production (real SMS)
Logs:     Only in Render dashboard
Hot Reload: No
```

**Local dev is better for debugging!**

---

## 🎯 BENEFITS OF LOCAL DEVELOPMENT

1. ✅ **See console logs immediately** (no need to check Render)
2. ✅ **Fast hot reload** (instant changes)
3. ✅ **Browser DevTools** (full debugging)
4. ✅ **Edit and test** (real-time feedback)
5. ✅ **Production data** (real backend + database)
6. ✅ **Real OTP** (actual SMS via Firebase)

---

## 🧪 TEST SCENARIOS TO TRY

### Test 1: Basic OTP Login
```
1. Start dev server
2. Go to /login
3. Enter phone → Send OTP
4. Enter OTP
5. Check: Does dashboard open?
```

### Test 2: Check Console Logs
```
1. Open F12 → Console
2. Do Test 1
3. See: [Login] logs appearing?
4. See: Navigation happening?
```

### Test 3: Check localStorage
```
1. Complete OTP login
2. F12 → Application → Local Storage
3. Check: 'token' exists?
4. Check: 'user' exists?
5. Check: user.role === "PATIENT"?
```

### Test 4: Check Network Requests
```
1. F12 → Network tab
2. Complete OTP login
3. Find: POST .../firebase-phone-login
4. Check: Status 200?
5. Check: Response has accessToken?
```

### Test 5: Manual Navigation
```
1. Complete login
2. In address bar type: http://localhost:3000/patient/home
3. Press Enter
4. Check: Dashboard loads?
5. Check: Stays on dashboard (no redirect)?
```

---

## 🐛 COMMON ISSUES

### Issue: "Port 3000 already in use"
```cmd
# Kill existing process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Restart
START-LOCAL-DEV.bat
```

### Issue: "Cannot find module"
```cmd
cd frontend
npm install
npm run dev
```

### Issue: "CORS error"
```
Check backend .env FRONTEND_URL includes localhost:3000
Should be: FRONTEND_URL=http://localhost:3000,https://pulsemateconnect.in
```

### Issue: "Firebase not configured"
```
Check frontend/.env has:
VITE_FIREBASE_API_KEY=AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc
```

---

## 📞 REPORTING ISSUES

When reporting issues, share:

1. **Terminal logs** (copy full [Login] output)
2. **Browser console** (F12 → Console → screenshot)
3. **Network tab** (F12 → Network → screenshot of /firebase-phone-login)
4. **localStorage** (F12 → Application → Local Storage → screenshot)
5. **Exact behavior** (what happens after entering OTP?)

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:

1. ✅ Terminal shows: `[Login] Navigating to patient dashboard`
2. ✅ Browser URL changes to: `http://localhost:3000/patient/home`
3. ✅ Dashboard appears with patient data
4. ✅ No console errors
5. ✅ localStorage has token + user

---

## 🚀 START NOW

```cmd
START-LOCAL-DEV.bat
```

Then test patient login and **share the console logs** with me!

---

**Local development is now configured. Run START-LOCAL-DEV.bat to begin!**
