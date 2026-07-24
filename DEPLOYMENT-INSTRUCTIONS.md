# Firebase Cloud Functions Deployment Instructions

## Overview

We've created Firebase Cloud Functions to send real SMS OTP via Firebase (bypassing Expo's reCAPTCHA issue).

## Files Created

1. **`backend/functions/send-otp.js`** - Cloud Functions for sending and verifying OTP
2. **`backend/functions/package.json`** - Dependencies for Cloud Functions
3. **`backend/firebase.json`** - Firebase configuration
4. **`backend/.firebaserc`** - Project ID mapping
5. **`src/config/firebase.js`** - Updated client code to call Cloud Functions

## Deployment Steps

### Step 1: Authenticate with Firebase

```bash
firebase login
```

This will open a browser window to authenticate. Follow the prompts.

### Step 2: Deploy Cloud Functions

From the `backend` directory:

```bash
cd pulsemateconnect21/backend
firebase deploy --only functions:sendOtp,functions:verifyOtp
```

**Expected output:**
```
✔ functions[sendOtp(us-central1)] Successful create operation.
✔ functions[verifyOtp(us-central1)] Successful create operation.

Deploy complete!
```

### Step 3: Verify Deployment

Check Firebase Console:
1. Go to https://console.firebase.google.com
2. Select project: **pulsemateconnect**
3. Navigate to **Functions** tab
4. Should see two functions:
   - `sendOtp`
   - `verifyOtp`

## What These Functions Do

### `sendOtp(phoneNumber)`

**Input:**
```javascript
{ phoneNumber: "+917022818878" }
```

**Process:**
1. Validates phone number format
2. Generates secure 6-digit OTP
3. Stores in Firestore with 5-minute expiry
4. Sends SMS (TODO: integrate Twilio/SMS provider)
5. Returns verification ID

**Output:**
```javascript
{
  success: true,
  verificationId: "...",
  message: "OTP sent successfully"
}
```

### `verifyOtp(verificationId, code, phoneNumber)`

**Input:**
```javascript
{
  verificationId: "...",
  code: "123456",
  phoneNumber: "+917022818878"
}
```

**Process:**
1. Retrieves OTP record from Firestore
2. Validates code matches
3. Checks expiry (must be <5 minutes)
4. Creates Firebase custom token
5. Returns token for authentication

**Output:**
```javascript
{
  success: true,
  token: "...",
  uid: "user_7022818878",
  phoneNumber: "+917022818878"
}
```

## Configuring SMS Provider

Currently, the function **logs OTP to console** (for testing).

To send **real SMS**, add Twilio integration:

### Option 1: Twilio (Recommended)

1. **Sign up:** https://www.twilio.com/
2. **Get credentials:** Account SID, Auth Token, Phone Number
3. **Update `backend/functions/send-otp.js`:**

```javascript
// At top of file
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In sendOtp function, replace console.log with:
await twilio.messages.create({
  body: `Your PulseMate verification code is: ${otp}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phoneNumber,
});
```

4. **Set environment variables in Firebase:**
   ```bash
   firebase functions:config:set twilio.sid="AC..." twilio.token="..." twilio.phone="+1..."
   ```

5. **Redeploy:**
   ```bash
   firebase deploy --only functions:sendOtp,functions:verifyOtp
   ```

### Option 2: Firebase Cloud Messaging (Free)

Use FCM to send SMS via Google's infrastructure (limited availability).

### Option 3: AWS SNS

Similar to Twilio setup.

## Testing

After deployment, the app will:

1. **Call Cloud Function** when user taps [Send OTP]
2. **Cloud Function generates OTP** and stores in Firestore
3. **Function logs OTP** (currently) or sends via SMS (when configured)
4. **User enters OTP** in app
5. **App verifies via Cloud Function**
6. **Function returns token**
7. **App authenticates with backend**
8. **User logged in** ✅

## Troubleshooting

### Firebase CLI Not Found
```bash
npm install -g firebase-tools
```

### Authentication Failed
```bash
firebase login
# Follow browser prompts
```

### Function Deploy Failed
Check:
- `backend/functions/package.json` exists
- `backend/firebase.json` exists
- `backend/.firebaserc` has correct project ID
- All dependencies installed: `npm install`

### Functions Not Callable
- Ensure functions deployed successfully
- Check Cloud Functions tab in Firebase Console
- Verify function URLs match in client code

## Next Steps

1. ✅ Deploy Cloud Functions (see steps above)
2. ⏳ Configure SMS provider (Twilio or similar)
3. ⏳ Test on phone with Expo
4. ⏳ Release build for Play Store
5. ⏳ Production deployment

---

**Status:** Ready for deployment  
**Deploy Command:** `firebase deploy --only functions:sendOtp,functions:verifyOtp`  
**Estimated Time:** 2-5 minutes
