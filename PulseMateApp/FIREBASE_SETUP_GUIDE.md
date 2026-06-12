# Firebase Setup Guide - PulseMate Mobile App

## 📱 Step-by-Step Setup Instructions

### Prerequisites
- Firebase Console access
- React Native development environment set up
- Expo CLI installed

---

## Step 1: Install Firebase Package

```bash
cd PulseMateApp
expo install firebase
```

Or if using npm directly:
```bash
npm install firebase
```

---

## Step 2: Register Your App in Firebase Console

### For Android App

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pulsemateconnect**
3. Click on **Project Settings** (gear icon)
4. Scroll to **Your apps** section
5. Click **Add app** → Select **Android**

#### Fill in the details:

**Package Name:**
- Open `PulseMateApp/app.json`
- Find `expo.android.package`
- Example: `com.yourcompany.pulsemateconnect`
- Enter this as the package name

**App Nickname (optional):**
- Example: "PulseMate Android"

**Debug Signing Certificate SHA-1 (Required for Phone Auth):**

Get your SHA-1 using one of these methods:


**Method 1: Using Expo (Recommended)**
```bash
cd PulseMateApp
eas credentials
```
Select "Android" → "Create a new keystore" → Copy the SHA-1

**Method 2: Using keytool (For development)**
```bash
# Windows
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# Mac/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the SHA-1 fingerprint and paste it in Firebase Console.

6. Click **Register app**
7. **Download `google-services.json`**
8. Place `google-services.json` in `PulseMateApp/` directory (root level)

---

### For iOS App (If supporting iOS)

1. In Firebase Console, click **Add app** → Select **iOS**

**Bundle ID:**
- Open `PulseMateApp/app.json`
- Find `expo.ios.bundleIdentifier`
- Example: `com.yourcompany.pulsemateconnect`
- Enter this as the bundle ID

**App Nickname (optional):**
- Example: "PulseMate iOS"

2. Click **Register app**
3. **Download `GoogleService-Info.plist`**
4. Place `GoogleService-Info.plist` in `PulseMateApp/` directory (root level)

---

## Step 3: Enable Phone Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started** (if first time)
3. Click **Sign-in method** tab
4. Find **Phone** provider
5. Click **Phone** → Enable it
6. Click **Save**

---

## Step 4: Update Firebase Configuration

Open `PulseMateApp/src/config/firebase.js` and update the `appId`:

**For Android:**
- Go to Firebase Console → Project Settings → Your apps → Android app
- Copy the **App ID** (looks like: `1:157620382332:android:abc123def456`)
- Replace in `firebase.js`:

```javascript
appId: "1:157620382332:android:YOUR_ANDROID_APP_ID",
```

**For iOS:**
- Go to Firebase Console → Project Settings → Your apps → iOS app
- Copy the **App ID**
- Create a separate config or use platform detection


---

## Step 5: Update app.json (Expo Configuration)

Add Firebase config to your `app.json`:

```json
{
  "expo": {
    "name": "PulseMate",
    "slug": "pulsemateconnect",
    "android": {
      "package": "com.yourcompany.pulsemateconnect",
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.pulsemateconnect",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth"
    ]
  }
}
```

---

## Step 6: Add Test Phone Numbers (For Development)

1. In Firebase Console → Authentication → Sign-in method
2. Scroll to **Phone numbers for testing**
3. Click **Add phone number**
4. Add your test number: `+917022818878`
5. Add a verification code: `123456`
6. Click **Save**

Now you can test without actually receiving SMS!

---

## Step 7: Verify Installation

Create a test file to verify Firebase is working:

**PulseMateApp/test-firebase.js**
```javascript
import { auth } from './src/config/firebase';

console.log('Firebase initialized:', auth.app.name);
console.log('Firebase project ID:', auth.app.options.projectId);
```

Run the app and check console logs.

---

## Step 8: Update Your Login Screen

Use the example from `EXAMPLE_LoginScreen.js` or integrate Firebase auth into your existing login screen:

```javascript
import { sendOtpToPhone, verifyOtp } from './src/api/firebaseAuth';
import { patientFirebasePhoneLogin } from './src/api/auth';

// Send OTP
const verificationId = await sendOtpToPhone("+917022818878");

// Verify OTP
const firebaseIdToken = await verifyOtp(verificationId, "123456");

// Login to backend
const response = await patientFirebasePhoneLogin(firebaseIdToken, "John Doe");
```


---

## Step 9: Build and Test

### Testing on Development Build

```bash
# Start development server
npm start
# or
expo start
```

Then scan QR code with Expo Go app.

**Note**: Firebase Phone Auth may not work fully in Expo Go. You need a development build.

### Create Development Build

```bash
# For Android
eas build --profile development --platform android

# For iOS
eas build --profile development --platform ios
```

Install the build on your device and test!

---

## Testing Checklist

- [ ] Firebase package installed
- [ ] `google-services.json` added (Android)
- [ ] `GoogleService-Info.plist` added (iOS)
- [ ] SHA-1 fingerprint added to Firebase Console
- [ ] Phone authentication enabled in Firebase
- [ ] Test phone number added (optional for dev)
- [ ] `firebase.js` config file created
- [ ] `firebaseAuth.js` service file created
- [ ] Backend endpoint tested
- [ ] Login flow integrated
- [ ] OTP sending works
- [ ] OTP verification works
- [ ] Backend login successful

---

## Common Issues & Solutions

### Issue 1: "reCAPTCHA verification failed"
**Solution**: Add SHA-1 fingerprint to Firebase Console (Android)

### Issue 2: "QUOTA_EXCEEDED" error
**Solution**: 
- Use test phone numbers for development
- Check Firebase quota limits

### Issue 3: SMS not received
**Solution**:
- Check phone number format (must be E.164: +917022818878)
- Verify Phone Auth is enabled in Firebase Console
- Use test phone numbers during development

### Issue 4: "App not authorized to use Firebase Authentication"
**Solution**: 
- Verify package name matches Firebase Console
- Verify `google-services.json` is correct
- Rebuild the app after adding config files

### Issue 5: "Invalid ID token"
**Solution**:
- Check Firebase service account JSON in backend `.env`
- Verify Firebase project matches between web, mobile, and backend

---

## Firebase Quotas

**Free Tier (Spark Plan):**
- Phone authentication: 10,000 verifications/month
- After that: $0.01 per verification

**Blaze Plan (Pay as you go):**
- Same pricing, but no hard limit

---

## Security Best Practices

1. **Never commit config files to Git**
   - Add to `.gitignore`:
     ```
     google-services.json
     GoogleService-Info.plist
     ```

2. **Use test phone numbers in development**
   - Avoid using real SMS quota

3. **Enable App Check** (Optional but recommended)
   - Protects against abuse
   - Prevents unauthorized API calls

4. **Rate limiting**
   - Backend already has rate limiting for Firebase endpoints
   - Firebase also has built-in rate limiting

---

## Next Steps

1. ✅ Complete this setup
2. ✅ Test OTP flow end-to-end
3. ✅ Integrate into production login screen
4. 📝 Monitor Firebase usage in Console
5. 📝 Set up error logging (Sentry, etc.)

---

## Support

- Firebase Documentation: https://firebase.google.com/docs/auth/android/phone-auth
- Expo Firebase Guide: https://docs.expo.dev/guides/using-firebase/
- PulseMate Backend API: Check `UNIFIED_FIREBASE_OTP_SOLUTION.md`

## Need Help?

Check these documents:
- `UNIFIED_FIREBASE_OTP_SOLUTION.md` - Complete solution overview
- `QUICK_START_FIREBASE_OTP.md` - Quick reference
- `EXAMPLE_LoginScreen.js` - Sample implementation
