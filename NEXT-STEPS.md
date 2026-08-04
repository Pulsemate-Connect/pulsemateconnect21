# 🚀 Next Steps: Complete Firebase Phone Auth Migration

## ✅ What's Done (Frontend)

1. ✅ Firebase JS SDK v10.14.1 installed
2. ✅ `firebase-auth.js` created with full Phone Auth implementation
3. ✅ `RecaptchaContainer.jsx` component created
4. ✅ All login screens updated to use Firebase Auth
5. ✅ All changes committed and pushed to GitHub
6. ✅ Complete documentation created

**Git commit:** `57fa0ec` - "feat: Migrate from 2Factor to Firebase Phone Authentication"

---

## 🔴 Critical: Backend Changes Required

The app **WILL NOT WORK** until backend is updated. Frontend is calling `/auth/firebase-login` endpoint that doesn't exist yet.

### Step 1: Install Firebase Admin SDK (Backend)

```bash
cd backend
npm install firebase-admin
git add package.json package-lock.json
git commit -m "feat: Add firebase-admin dependency"
```

### Step 2: Create Firebase Admin Config

Create file: `backend/src/config/firebase-admin.js`

```javascript
const admin = require('firebase-admin');
const logger = require('./logger');

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : null;
  
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'pulsemateconnect'
    });
    logger.info('[Firebase Admin] Initialized successfully');
  } else {
    logger.warn('[Firebase Admin] Service account not configured');
  }
} catch (error) {
  logger.error('[Firebase Admin] Initialization failed:', error);
}

const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('[Firebase Admin] Token verification failed:', error);
    throw error;
  }
};

module.exports = { verifyFirebaseToken };
```

### Step 3: Create Firebase Auth Controller

Create file: `backend/src/controllers/firebase-auth.controller.js`

```javascript
const { verifyFirebaseToken } = require('../config/firebase-admin');
const prisma = require('../config/database');
const { createSessionTokens } = require('../services/token.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

exports.firebasePhoneLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    
    if (!firebaseToken) {
      return sendError(res, 'Firebase token is required', 400);
    }
    
    // Verify Firebase ID token
    const decodedToken = await verifyFirebaseToken(firebaseToken);
    const phoneNumber = decodedToken.phone_number;
    const firebaseUid = decodedToken.uid;
    
    if (!phoneNumber) {
      return sendError(res, 'Phone number not found in Firebase token', 400);
    }
    
    logger.info(`[Firebase Auth] Token verified for ${phoneNumber}`);
    
    // Find or create user
    let user = await prisma.patient.findUnique({
      where: { phone: phoneNumber }
    });
    
    if (!user) {
      // Create new user
      user = await prisma.patient.create({
        data: {
          phone: phoneNumber,
          firebaseUid: firebaseUid,
          isPhoneVerified: true
        }
      });
      logger.info(`[Firebase Auth] New user created: ${user.id}`);
    } else {
      // Update Firebase UID if changed
      if (user.firebaseUid !== firebaseUid) {
        user = await prisma.patient.update({
          where: { id: user.id },
          data: { 
            firebaseUid: firebaseUid,
            isPhoneVerified: true
          }
        });
      }
    }
    
    // Create session tokens
    const { accessToken, refreshToken } = await createSessionTokens(
      user.id,
      'patient',
      req
    );
    
    return sendSuccess(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    logger.error('[Firebase Auth] Failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return sendError(res, 'Firebase token expired', 401);
    } else if (error.code === 'auth/invalid-id-token') {
      return sendError(res, 'Invalid Firebase token', 401);
    }
    
    return sendError(res, 'Authentication failed', 500);
  }
};
```

### Step 4: Add Route

In `backend/src/routes/auth.routes.js`, add:

```javascript
const { firebasePhoneLogin } = require('../controllers/firebase-auth.controller');

// Add this line with other routes
router.post('/firebase-login', firebasePhoneLogin);
```

### Step 5: Get Firebase Service Account JSON

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Download the JSON file
4. Minify it (remove all whitespace and newlines)
5. Copy the entire JSON string

### Step 6: Add to Render Environment Variables

1. Go to: https://dashboard.render.com (your backend service)
2. Go to Environment → Environment Variables
3. Add new variable:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** `{"type":"service_account","project_id":"pulsemateconnect",...}` (the entire minified JSON)
4. Save changes

### Step 7: Deploy Backend

```bash
git add .
git commit -m "feat: Add Firebase Phone Auth backend support

- Add firebase-admin dependency
- Create firebase-admin.js config
- Create firebase-auth.controller.js with firebasePhoneLogin
- Add /firebase-login route
- Backend now verifies Firebase ID tokens
- Creates/updates users with Firebase UID
- Returns JWT access/refresh tokens"

git push origin main
```

**Render will automatically deploy.**

---

## 🔥 Firebase Console Configuration

### Enable Phone Authentication

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/providers
2. Click on "Phone" provider
3. Click "Enable"
4. Click "Save"

### Add SHA Fingerprints (CRITICAL for Play Store)

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/settings/general
2. Scroll to "Your apps"
3. Click on Android app: `in.pulsemateconnect.patient`
4. Scroll to "SHA certificate fingerprints"
5. Click "Add fingerprint"
6. Add SHA-1:
   ```
   E0:AC:76:86:0F:79:68:E8:3D:20:47:1D:EF:53:5D:39:D6:00:9E:E1
   ```
7. Click "Add fingerprint" again
8. Add SHA-256:
   ```
   CE:A8:43:D7:9C:7C:2B:AC:B5:9A:23:F1:31:6A:46:9F:20:1F:E0:68:4C:B8:79:6A:5B:A9:FA:4A:07:0C:92:8A
   ```
9. Click "Save"

### Add Authorized Domains (for reCAPTCHA)

1. Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/settings
2. Scroll to "Authorized domains"
3. Add these domains:
   - `localhost` (already there)
   - `pulsemateconnect.in` (if you have web app)

---

## 🧪 Testing After Backend Deployment

### Test with Expo Dev Build

```bash
# Start app
npm start

# Run on emulator
# Press 'a' for Android
```

### Test Flow:
1. Enter mobile number (+91XXXXXXXXXX)
2. Tap "Send OTP"
3. You may see reCAPTCHA verification (invisible or checkbox)
4. Check if SMS arrives via Firebase
5. Enter OTP
6. Should login successfully

### Monitor Logs:
```bash
# Frontend logs
adb logcat -s ReactNativeJS:V

# Backend logs (on Render)
Check Render dashboard → Logs tab
```

---

## 🚀 Production Deployment

### After Testing Succeeds:

1. **Build new APK/AAB:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Wait for build to complete** (check EAS dashboard)

3. **Install on test device:**
   ```bash
   eas build:run -p android --latest
   ```

4. **Test on real device** with production backend

5. **Upload to Play Store** (Internal Testing first)

6. **Monitor Firebase Console:**
   - Go to: https://console.firebase.google.com/project/pulsemateconnect/authentication/users
   - Check if users are being created
   - Check Firebase usage quota

---

## 📊 Expected Results

### Before Migration:
- ❌ Using 2Factor.in (₹0.12 per SMS)
- ❌ Monthly cost: ₹132 (1000 logins)
- ❌ Backend manages OTP generation
- ❌ Backend manages OTP storage
- ❌ Backend manages OTP expiry

### After Migration:
- ✅ Using Firebase Phone Auth (FREE)
- ✅ Monthly cost: ₹0
- ✅ Firebase manages OTP generation
- ✅ Firebase manages OTP storage
- ✅ Firebase manages OTP expiry
- ✅ Built-in Play Integrity security
- ✅ reCAPTCHA spam protection

---

## ⚠️ Common Issues

### Issue 1: "Firebase token is required"
**Cause:** Backend not updated yet  
**Fix:** Complete backend changes above

### Issue 2: "Invalid Firebase token"
**Cause:** Service account JSON not configured  
**Fix:** Add FIREBASE_SERVICE_ACCOUNT_JSON to Render

### Issue 3: "Phone number not found in Firebase token"
**Cause:** Phone Auth not enabled in Firebase Console  
**Fix:** Enable Phone Auth in Firebase Console

### Issue 4: SMS not received
**Cause:** SHA fingerprints not added  
**Fix:** Add SHA-1 and SHA-256 to Firebase Console

### Issue 5: "Too many requests"
**Cause:** Firebase quota exceeded  
**Fix:** Wait or upgrade Firebase plan

---

## 📞 Support Resources

- **Firebase Phone Auth Docs:** https://firebase.google.com/docs/auth/web/phone-auth
- **Firebase Console:** https://console.firebase.google.com/project/pulsemateconnect
- **Migration Guide:** `MIGRATION-TO-FIREBASE-AUTH.md`
- **Frontend Implementation:** `src/config/firebase-auth.js`

---

## ✅ Final Checklist

### Backend
- [ ] Install firebase-admin
- [ ] Create firebase-admin.js
- [ ] Create firebase-auth.controller.js
- [ ] Add /firebase-login route
- [ ] Get service account JSON
- [ ] Add to Render environment variables
- [ ] Deploy backend
- [ ] Verify deployment successful

### Firebase Console
- [ ] Enable Phone Authentication
- [ ] Add SHA-1 fingerprint
- [ ] Add SHA-256 fingerprint
- [ ] Verify authorized domains

### Testing
- [ ] Test locally with dev build
- [ ] Verify SMS received
- [ ] Verify OTP works
- [ ] Check backend logs
- [ ] Check Firebase Console users

### Production
- [ ] Build new APK/AAB
- [ ] Test on real device
- [ ] Upload to Play Store internal testing
- [ ] Monitor Firebase usage
- [ ] Gradually roll out

---

**Status:** Frontend complete, backend pending  
**Next Action:** Complete backend changes (Steps 1-7)  
**Estimated Time:** 1-2 hours for backend + Firebase Console config
