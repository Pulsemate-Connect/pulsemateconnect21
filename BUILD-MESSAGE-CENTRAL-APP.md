# 📱 BUILD MESSAGE CENTRAL MOBILE APP

**Prerequisite:** Production OTP test passed ✅  
**Goal:** Build React Native app with Message Central OTP

---

## 🎯 OVERVIEW

You have **two options** for building the app:

| Option | Description | Time | Recommendation |
|--------|-------------|------|----------------|
| **Option 1** | Quick Test Build | 2 hours | ⭐ Start here |
| **Option 2** | Full Migration | 4 hours | After testing |

---

## ⭐ OPTION 1: QUICK TEST BUILD (Recommended)

Create a **parallel version** to test Message Central without affecting Firebase.

### Benefits:
- ✅ Keep Firebase app working (backup)
- ✅ Test Message Central separately
- ✅ Easy rollback if issues
- ✅ Compare both systems

### Process:

#### STEP 1: Create Message Central Auth Service (15 min)

**File:** `src/services/messagecentral-auth.service.js`

```javascript
import api from '../api/axios';

/**
 * Send OTP using Message Central
 */
export const sendOtp = async (mobileNumber) => {
  try {
    // Clean number - remove +91, spaces, etc.
    const cleanNumber = mobileNumber.replace(/\D/g, '').replace(/^91/, '');
    
    console.log('[MessageCentral] Sending OTP to:', cleanNumber);
    
    const response = await api.post('/auth/patient/send-otp', {
      mobileNumber: cleanNumber
    });

    if (response.data.success) {
      return {
        success: true,
        verificationId: response.data.data.verificationId,
        expiresIn: response.data.data.expiresIn
      };
    } else {
      throw new Error(response.data.message || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('[MessageCentral] Send OTP error:', error);
    throw error;
  }
};

/**
 * Verify OTP using Message Central
 */
export const verifyOtp = async (verificationId, otp, mobileNumber) => {
  try {
    console.log('[MessageCentral] Verifying OTP...');
    
    const response = await api.post('/auth/patient/verify-otp', {
      verificationId,
      otp,
      mobileNumber
    });

    if (response.data.success) {
      return {
        success: true,
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
        user: response.data.data.user
      };
    } else {
      throw new Error(response.data.message || 'Invalid OTP');
    }
  } catch (error) {
    console.error('[MessageCentral] Verify OTP error:', error);
    throw error;
  }
};
```

---

#### STEP 2: Create Test Login Screen (30 min)

**File:** `src/screens/LoginMessageCentralScreen.jsx`

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { sendOtp } from '../services/messagecentral-auth.service';

export default function LoginMessageCentralScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    // Validate phone number
    const cleanNumber = mobile.trim();
    if (cleanNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const result = await sendOtp(cleanNumber);
      
      if (result.success) {
        // Navigate to OTP verification screen
        navigation.navigate('OtpMessageCentral', {
          mobile: `+91${cleanNumber}`,
          verificationId: result.verificationId,
          expiresIn: result.expiresIn
        });
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Message Central OTP Test
      </Text>
      
      <Text style={{ marginBottom: 10 }}>Enter Mobile Number</Text>
      
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <Text style={{ fontSize: 18, padding: 10 }}>+91</Text>
        <TextInput
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            fontSize: 18 
          }}
          value={mobile}
          onChangeText={(text) => setMobile(text.replace(/\D/g, '').slice(0, 10))}
          placeholder="9876543210"
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: mobile.length === 10 && !loading ? '#007AFF' : '#ccc',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
        onPress={handleSendOtp}
        disabled={mobile.length !== 10 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Send OTP
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
```

---

#### STEP 3: Create OTP Verification Screen (30 min)

**File:** `src/screens/OtpMessageCentralScreen.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyOtp } from '../services/messagecentral-auth.service';

export default function OtpMessageCentralScreen({ route, navigation }) {
  const { mobile, verificationId, expiresIn } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(expiresIn || 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
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
        
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Home')
          }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Enter OTP
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        OTP sent to {mobile}
      </Text>
      
      <TextInput
        style={{ 
          borderWidth: 1, 
          borderColor: '#ccc', 
          padding: 15, 
          fontSize: 24, 
          textAlign: 'center',
          letterSpacing: 10,
          marginBottom: 20
        }}
        value={otp}
        onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
      />

      <Text style={{ textAlign: 'center', marginBottom: 20, color: timer > 0 ? '#007AFF' : '#ff0000' }}>
        Time remaining: {formatTime(timer)}
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: otp.length === 6 && !loading ? '#007AFF' : '#ccc',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
        onPress={handleVerifyOtp}
        disabled={otp.length !== 6 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Verify OTP
          </Text>
        )}
      </TouchableOpacity>

      {timer === 0 && (
        <TouchableOpacity
          style={{ marginTop: 20, alignItems: 'center' }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#007AFF', fontSize: 16 }}>
            Resend OTP
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

---

#### STEP 4: Add Routes to Navigation (10 min)

Update your navigation file to add the test screens:

```javascript
// Add these imports
import LoginMessageCentralScreen from './src/screens/LoginMessageCentralScreen';
import OtpMessageCentralScreen from './src/screens/OtpMessageCentralScreen';

// Add these routes to your Stack.Navigator
<Stack.Screen 
  name="LoginMessageCentral" 
  component={LoginMessageCentralScreen}
  options={{ title: 'Message Central Login (Test)' }}
/>
<Stack.Screen 
  name="OtpMessageCentral" 
  component={OtpMessageCentralScreen}
  options={{ title: 'Verify OTP' }}
/>
```

---

#### STEP 5: Build Test APK (30 min)

```bash
cd "c:\Users\shubh\Desktop\PulseMate Connect\pulsemateconnect21"

eas build --platform android --profile apk --non-interactive
```

**What happens:**
- EAS builds new APK with Message Central screens
- Takes 15-20 minutes
- Downloads APK to your computer

---

#### STEP 6: Install and Test (15 min)

```bash
# Install on emulator
eas build:run -p android --latest

# Or install manually
adb install path/to/app.apk
```

**Test Flow:**
1. Open app
2. Navigate to "Message Central Login (Test)"
3. Enter phone number
4. Tap "Send OTP"
5. Check phone for SMS
6. Enter OTP
7. Verify login works

---

## 🚀 OPTION 2: FULL MIGRATION

Replace Firebase completely with Message Central.

### Process:

#### STEP 1: Update Existing Login Screens

Replace Firebase code in:
- `src/screens/Login2FactorScreen.jsx`
- `src/screens/Otp2FactorScreen.jsx`

Change from:
```javascript
import { signInWithPhoneNumber } from './firebase-config';
```

To:
```javascript
import { sendOtp, verifyOtp } from './messagecentral-auth.service';
```

---

#### STEP 2: Remove Firebase Dependencies (Optional)

```bash
npm uninstall firebase
```

Delete files:
- `src/config/firebase-phone-production.js`
- `src/components/FirebaseRecaptchaVerifier.jsx`

---

#### STEP 3: Update app.json

```json
{
  "expo": {
    "name": "PulseMate Connect",
    "version": "1.3.7",
    "android": {
      "versionCode": 77
    }
  }
}
```

---

#### STEP 4: Build Production APK

```bash
eas build --platform android --profile production
```

---

## 📊 DECISION MATRIX

| Scenario | Choose | Reason |
|----------|--------|--------|
| First time testing Message Central | Option 1 | Safe, can rollback |
| Firebase has issues | Option 2 | Faster to production |
| Want to compare both | Option 1 | Both systems available |
| Confident in Message Central | Option 2 | Cleaner codebase |

---

## ⏱️ TIME ESTIMATES

### Option 1 (Quick Test):
- Frontend code: 1 hour
- Build APK: 30 min
- Testing: 30 min
- **Total: 2 hours**

### Option 2 (Full Migration):
- Update screens: 2 hours
- Remove Firebase: 30 min
- Build APK: 30 min
- Testing: 1 hour
- **Total: 4 hours**

---

## ✅ TESTING CHECKLIST

After building, test these:

### Basic Flow:
- [ ] App opens without crash
- [ ] Can navigate to login
- [ ] Can enter phone number
- [ ] Send OTP button works
- [ ] SMS received (check phone!)
- [ ] Can enter OTP
- [ ] Verify OTP works
- [ ] JWT tokens stored
- [ ] User logged in
- [ ] Can navigate to home

### Error Handling:
- [ ] Invalid phone number shows error
- [ ] Wrong OTP shows error
- [ ] Expired OTP shows error
- [ ] Network error handled
- [ ] Timeout handled

### User Experience:
- [ ] OTP timer shows countdown
- [ ] Can resend OTP
- [ ] Loading states work
- [ ] Success/error messages clear

---

## 🎯 SUCCESS CRITERIA

**You can tell your team to build when:**

- ✅ Production backend OTP test passed
- ✅ SMS delivery confirmed working
- ✅ JWT tokens returned correctly
- ✅ Frontend code ready (Option 1 or 2)
- ✅ Test build installed and tested
- ✅ All flows work end-to-end

---

## 📞 QUICK COMMANDS

**Start Option 1:**
```bash
# 1. Create service file
notepad src\services\messagecentral-auth.service.js

# 2. Create login screen
notepad src\screens\LoginMessageCentralScreen.jsx

# 3. Create OTP screen
notepad src\screens\OtpMessageCentralScreen.jsx

# 4. Build
eas build --platform android --profile apk
```

**Start Option 2:**
```bash
# 1. Update existing screens
notepad src\screens\Login2FactorScreen.jsx

# 2. Build
eas build --platform android --profile production
```

---

## 🚨 BEFORE YOU BUILD

**Checklist:**
- [ ] Production OTP test passed (run TEST-PRODUCTION-OTP.bat)
- [ ] SMS received on real phone
- [ ] JWT tokens working
- [ ] Decided Option 1 or Option 2
- [ ] Frontend code ready
- [ ] API endpoint confirmed: https://api.pulsemateconnect.in

---

## 🎉 READY TO BUILD?

**Recommended path:**
1. Run `TEST-PRODUCTION-OTP.bat` first
2. If successful, start with **Option 1** (Quick Test)
3. Create the 3 files above
4. Build APK
5. Test on device
6. If working, proceed with Option 2 (Full Migration)

**Total time to production:** 3-4 hours

---

**Questions?** Check:
- `MESSAGE-CENTRAL-MIGRATION-PLAN.md` - Full migration guide
- `QUICK-ACTION-GUIDE.md` - Quick reference
- `CURRENT-STATUS.md` - Current progress

**Ready to test production?** Run:
```bash
TEST-PRODUCTION-OTP.bat
```
