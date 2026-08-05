# 🚀 MESSAGE CENTRAL - QUICK START GUIDE

**Ready to migrate?** Follow these steps in order.

---

## ✅ STEP 1: FIX CURRENT FIREBASE ISSUE (5 min)

The current app has Firebase initialization error. Let's fix it first so you have a working baseline.

**Already done:** Firebase config updated with AsyncStorage persistence.

**Next:** Rebuild and test:

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"
eas build --platform android --profile apk --non-interactive
```

**Test:** Install on emulator and verify OTP works with Firebase.

---

## ✅ STEP 2: SETUP BACKEND (30 min)

### 2.1 Install Dependencies

```bash
cd backend
npm install axios
```

### 2.2 Add Environment Variables

**File:** `backend/.env`

```env
# Message Central VerifyNow
MESSAGE_CENTRAL_CUSTOMER_ID=C-B6442109CBD3438
MESSAGE_CENTRAL_PASSWORD=<ask_user_for_base64_password>
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com

# Keep existing variables
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

**⚠️ IMPORTANT:** The PASSWORD must be Base64-encoded. If you don't have it:
1. Go to Message Central dashboard
2. Get your password
3. Encode it: `echo -n "your_password" | base64`

### 2.3 Create Message Central Service

**File created:** `backend/src/services/messagecentral.service.js` ✅

### 2.4 Update Auth Controller

**File:** `backend/src/controllers/auth.controller.js`

Add these two functions at the end of the file:

```javascript
const messageCentralService = require('../services/messagecentral.service');

/**
 * Send OTP - Message Central
 * POST /api/auth/patient/send-otp
 */
exports.sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10 && cleanNumber.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format'
      });
    }

    const result = await messageCentralService.sendOTP(cleanNumber, 6);

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
 * Verify OTP and Login - Message Central
 * POST /api/auth/patient/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { verificationId, otp, mobileNumber } = req.body;

    if (!verificationId || !otp || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Verification ID, OTP, and mobile number are required'
      });
    }

    const validation = await messageCentralService.validateOTP(verificationId, otp);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    const cleanMobile = validation.mobileNumber;

    // Find or create user (adjust based on your Prisma schema)
    let user = await prisma.patient.findUnique({
      where: { mobile: cleanMobile }
    });

    if (!user) {
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
      user = await prisma.patient.update({
        where: { id: user.id },
        data: { isVerified: true, updatedAt: new Date() }
      });
      console.log('[Auth] Patient login:', user.id, cleanMobile);
    }

    // Generate JWT tokens (use your existing JWT logic)
    const accessToken = jwt.sign(
      { userId: user.id, mobile: user.mobile, role: 'PATIENT' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, mobile: user.mobile, role: 'PATIENT' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token (adjust based on your schema)
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

### 2.5 Add Routes

**File:** `backend/src/routes/auth.routes.js`

Add these lines:

```javascript
// Message Central OTP routes
router.post('/patient/send-otp', authController.sendOtp);
router.post('/patient/verify-otp', authController.verifyOtp);
```

### 2.6 Test Backend

**Start backend:**
```bash
npm run dev
```

**Test send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"mobileNumber\": \"9876543210\"}"
```

**Expected response:**
```json
{
  "success": true,
  "verificationId": "xxxx",
  "expiresIn": 60,
  "message": "OTP sent successfully"
}
```

**Test verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"verificationId\": \"xxxx\", \"otp\": \"123456\", \"mobileNumber\": \"+919876543210\"}"
```

---

## ✅ STEP 3: DEPLOY BACKEND (10 min)

### 3.1 Add Env Vars to Render

1. Go to: https://dashboard.render.com/
2. Select your backend service
3. Click "Environment" tab
4. Add these variables:
   - `MESSAGE_CENTRAL_CUSTOMER_ID` = `C-B6442109CBD3438`
   - `MESSAGE_CENTRAL_PASSWORD` = `<base64_password>`
   - `MESSAGE_CENTRAL_BASE_URL` = `https://cpaas.messagecentral.com`
5. Click "Save Changes"

### 3.2 Push Code

```bash
git add .
git commit -m "Add Message Central OTP service"
git push origin main
```

Render will auto-deploy.

### 3.3 Test Live Backend

```bash
curl -X POST https://api.pulsemateconnect.in/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"mobileNumber\": \"9876543210\"}"
```

---

## ✅ STEP 4: UPDATE FRONTEND (45 min)

### 4.1 Remove Firebase (Don't do this yet - keep as backup)

**Skip for now.** We'll keep Firebase working while testing Message Central.

### 4.2 Create Auth Service

**File:** `src/services/messagecentral-auth.service.js`

```javascript
import api from '../api/axios';

export const sendOtp = async (mobileNumber) => {
  try {
    console.log('[MessageCentral Auth] Sending OTP to:', mobileNumber);
    
    const response = await api.post('/auth/patient/send-otp', {
      mobileNumber
    });

    return response.data;
  } catch (error) {
    console.error('[MessageCentral Auth] Send OTP failed:', error);
    throw error.response?.data || { message: 'Failed to send OTP' };
  }
};

export const verifyOtp = async (verificationId, otp, mobileNumber) => {
  try {
    console.log('[MessageCentral Auth] Verifying OTP...');
    
    const response = await api.post('/auth/patient/verify-otp', {
      verificationId,
      otp,
      mobileNumber
    });

    return response.data;
  } catch (error) {
    console.error('[MessageCentral Auth] Verify OTP failed:', error);
    throw error.response?.data || { message: 'Failed to verify OTP' };
  }
};
```

### 4.3 Create Test Login Screen

**File:** `src/screens/LoginMessageCentralScreen.jsx`

Copy your existing `Login2FactorScreen.jsx` and modify it:

1. Import Message Central service instead of Firebase
2. Call `sendOtp()` from Message Central service
3. Navigate with `verificationId` instead of `confirmResult`

### 4.4 Test Flow

1. Add route to navigation for `LoginMessageCentralScreen`
2. Navigate to test screen
3. Enter phone number
4. Send OTP
5. Verify OTP works
6. Check JWT is stored

---

## ✅ STEP 5: FULL MIGRATION (1 hour)

Once Message Central is tested and working:

### 5.1 Replace Login Screens

Replace the content of:
- `src/screens/Login2FactorScreen.jsx`
- `src/screens/Otp2FactorScreen.jsx`

With Message Central service calls.

### 5.2 Remove Firebase

```bash
npm uninstall firebase
```

Delete:
- `src/config/firebase-phone-production.js`
- `src/components/FirebaseRecaptchaVerifier.jsx`

### 5.3 Build & Test

```bash
eas build --platform android --profile apk
```

Install and test complete flow.

---

## 📊 MIGRATION STATUS

| Task | Status |
|------|--------|
| Backend Service Created | ✅ Done |
| Environment Variables | ⏳ Pending |
| Backend Controllers | ⏳ Pending |
| Backend Routes | ⏳ Pending |
| Backend Testing | ⏳ Pending |
| Backend Deployment | ⏳ Pending |
| Frontend Service | ⏳ Pending |
| Frontend Screens | ⏳ Pending |
| Frontend Testing | ⏳ Pending |
| Remove Firebase | ⏳ Pending |
| Production Build | ⏳ Pending |

---

## 🆘 NEED HELP?

**Current Firebase Issue:**
Build ID: `70f9e976-bd19-47dc-844d-21d691498817` 
Should work now with AsyncStorage fix.

**Message Central Support:**
- API Docs: Provided in MESSAGE-CENTRAL-MIGRATION-PLAN.md
- Service Code: `backend/src/services/messagecentral.service.js`

**Next Steps:**
1. Fix current Firebase build (test Build 70f9e976)
2. Setup backend Message Central service
3. Test backend APIs
4. Update frontend
5. Remove Firebase

---

**Ready to proceed?** Let me know which step you want to start with!
