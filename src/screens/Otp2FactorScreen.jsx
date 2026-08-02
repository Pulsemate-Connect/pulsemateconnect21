/**
 * Otp2FactorScreen — Verify Firebase Phone OTP (Native)
 * 
 * ✅ MIGRATED: Now uses React Native Firebase (Native)
 */
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Using Firebase JavaScript SDK v10
import { verifyPhoneOtp, loginWithFirebaseToken, resendOtp } from '../config/firebase';
import { useAuth } from '../store/authStore';

const BLUE  = '#2563EB';
const WHITE = '#FFFFFF';
const GRAY  = '#6B7280';
const DARK  = '#111827';

export default function Otp2FactorScreen({ route, navigation }) {
  const { mobile, confirmResult, verificationId, sentTimestamp } = route?.params || {};
  const { signIn } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [currentConfirmResult, setCurrentConfirmResult] = useState(confirmResult);
  const [currentVerificationId, setCurrentVerificationId] = useState(verificationId);
  const [currentSentTimestamp, setCurrentSentTimestamp] = useState(sentTimestamp);
  const inputRefs = useRef([]);
  
  // Validate required params on mount
  useEffect(() => {
    const timestamp = Date.now();
    const elapsedSinceSent = currentSentTimestamp ? (timestamp - currentSentTimestamp) / 1000 : null;
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🎬 [Otp2Factor] SCREEN MOUNTED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Mount Timestamp: ${new Date(timestamp).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
║ 
║ 📋 RECEIVED PARAMETERS:
║ ├─ Mobile: ${mobile || 'MISSING'}
║ ├─ ConfirmResult: ${currentConfirmResult ? 'Present' : 'MISSING'}
║ ├─ VerificationId: ${currentVerificationId || 'MISSING'}
║ ├─ Sent Timestamp: ${currentSentTimestamp ? new Date(currentSentTimestamp).toISOString() : 'MISSING'}
║ 
║ ⏱️  TIME ANALYSIS:
║ ├─ Current Time: ${new Date(timestamp).toISOString()}
║ ├─ OTP Sent Time: ${currentSentTimestamp ? new Date(currentSentTimestamp).toISOString() : 'N/A'}
║ ├─ Time Elapsed: ${elapsedSinceSent ? `${elapsedSinceSent.toFixed(2)} seconds` : 'N/A'}
${elapsedSinceSent && elapsedSinceSent > 100 ? `║ ├─ ⚠️  WARNING: More than 100 seconds elapsed
║ ├─ ⚠️  OTP may expire soon (typical timeout: 120 seconds)` : ''}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    if (!mobile || !currentConfirmResult) {
      console.error('[Otp2Factor] ❌ CRITICAL: Missing required parameters');
      console.error('[Otp2Factor] Missing mobile:', !mobile);
      console.error('[Otp2Factor] Missing confirmResult:', !currentConfirmResult);
      
      Alert.alert(
        'Session Error',
        'Verification session is missing. Please request a new OTP.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('[Otp2Factor] User dismissed error, navigating back');
              navigation.goBack();
            },
          },
        ]
      );
    }
  }, [mobile, currentConfirmResult, currentVerificationId, currentSentTimestamp, navigation]);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const startTime = Date.now();
    const otpCode = otp.join('');
    const elapsedSinceSent = currentSentTimestamp ? (startTime - currentSentTimestamp) / 1000 : null;
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 [Otp2Factor] VERIFY OTP BUTTON PRESSED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Verify Start: ${new Date(startTime).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
║ 🔑 OTP Length: ${otpCode.length}
║ 🔑 OTP Format: ${/^\d{6}$/.test(otpCode) ? 'VALID' : 'INVALID'}
║ 📋 Has ConfirmResult: ${!!currentConfirmResult}
║ 🔑 VerificationId: ${currentVerificationId || 'unknown'}
║ ⏱️  Time Since OTP Sent: ${elapsedSinceSent ? `${elapsedSinceSent.toFixed(2)} seconds` : 'unknown'}
${elapsedSinceSent && elapsedSinceSent > 110 ? `║ ⚠️  WARNING: Verification after ${elapsedSinceSent.toFixed(0)} seconds
║ ⚠️  Close to Firebase timeout (typically 120 seconds)` : ''}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    if (otpCode.length !== 6) {
      console.warn('[Otp2Factor] ⚠️  Incomplete OTP code:', otpCode.length, 'digits');
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code.');
      return;
    }

    if (!currentConfirmResult) {
      console.error('[Otp2Factor] ❌ No confirmation result available');
      Alert.alert('Error', 'No confirmation result. Please request a new OTP.');
      navigation.goBack();
      return;
    }
    
    if (elapsedSinceSent && elapsedSinceSent > 110) {
      console.warn(`[Otp2Factor] ⚠️  WARNING: Verification attempt after ${elapsedSinceSent.toFixed(0)} seconds`);
      Alert.alert(
        'Timeout Warning',
        `You've taken more than ${Math.floor(elapsedSinceSent)} seconds to enter OTP. If verification fails, please request a new OTP.`,
        [{ text: 'Continue Anyway', onPress: () => {} }]
      );
    }

    setLoading(true);

    try {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📡 [Otp2Factor] STEP 1: CALLING verifyPhoneOtp
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 🔑 OTP Length: ${otpCode.length}
║ 📋 Has ConfirmResult: ${!!currentConfirmResult}
║ 🔑 VerificationId: ${currentVerificationId}
║ ⏰ Sent Timestamp: ${currentSentTimestamp}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      const verifyStartTime = Date.now();
      
      // STEP 1: Verify OTP with Firebase
      const { idToken, phoneNumber } = await verifyPhoneOtp(
        currentConfirmResult, 
        otpCode,
        currentSentTimestamp
      );
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ [Otp2Factor] STEP 1 SUCCESS: Firebase OTP Verified
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Verification Duration: ${(Date.now() - verifyStartTime) / 1000} seconds
║ 📱 Phone: ${phoneNumber}
║ 🎫 Has ID Token: ${!!idToken}
║ 🎫 Token Length: ${idToken?.length || 0}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📡 [Otp2Factor] STEP 2: CALLING loginWithFirebaseToken
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 🎫 Sending Firebase ID Token to backend
║ 🎫 Token Length: ${idToken?.length}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      const backendStartTime = Date.now();
      
      // STEP 2: Login with backend using Firebase ID token
      const { accessToken, refreshToken, user } = await loginWithFirebaseToken(idToken);
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ [Otp2Factor] STEP 2 SUCCESS: Backend Authentication
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Backend Duration: ${(Date.now() - backendStartTime) / 1000} seconds
║ 🔑 Has Access Token: ${!!accessToken}
║ 🔄 Has Refresh Token: ${!!refreshToken}
║ 👤 Has User Object: ${!!user}
║ 👤 User ID: ${user?.id || 'unknown'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      // STEP 3: Store tokens and user data
      console.log('[Otp2Factor] 💾 Storing authentication data...');
      await signIn(accessToken, user, refreshToken);
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🎉 [Otp2Factor] LOGIN COMPLETE SUCCESS
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Total Time: ${(Date.now() - startTime) / 1000} seconds
║ ⏱️  Time Since OTP Sent: ${elapsedSinceSent ? `${elapsedSinceSent.toFixed(2)} seconds` : 'unknown'}
║ 👤 User authenticated and signed in successfully
╚═══════════════════════════════════════════════════════════════════════════════
`);
    } catch (err) {
      console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 [Otp2Factor] VERIFICATION FAILED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${(Date.now() - startTime) / 1000} seconds
║ ⏱️  Time Since OTP Sent: ${elapsedSinceSent ? `${elapsedSinceSent.toFixed(2)} seconds` : 'unknown'}
║ 🔑 OTP Length: ${otpCode.length}
║ 
║ ❌ ERROR DETAILS:
║ ├─ Error Type: ${err.constructor.name}
║ ├─ Error Name: ${err.name || 'N/A'}
║ ├─ Error Code: ${err.code || 'N/A'}
║ ├─ Error Message: ${err.message || 'N/A'}
║ 
║ 📚 Stack Trace:
${err.stack ? err.stack.split('\n').map(line => '║    ' + line).join('\n') : '║    N/A'}
║ 
║ 🔍 Full Error Object:
${JSON.stringify(err, Object.getOwnPropertyNames(err), 2).split('\n').map(line => '║    ' + line).join('\n')}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      let message = err.message || 'Invalid OTP';
      
      // Provide better error messages with specific guidance
      if (err.message?.includes('invalid-verification-code')) {
        message = 'Invalid OTP code. Please check and try again.';
      } else if (err.message?.includes('code-expired') || err.message?.includes('expired')) {
        message = 'OTP has expired. Please request a new one.';
        console.error('[Otp2Factor] 💡 Expiry reason: Likely took > 120 seconds to verify');
      } else if (err.message?.includes('session-expired')) {
        message = 'Session expired. Please start over and request a new OTP.';
      } else if (err.message?.includes('too-many-requests')) {
        message = 'Too many verification attempts. Please wait a few minutes and request a new OTP.';
      } else if (err.message?.includes('invalid-verification-id')) {
        message = 'Verification session is invalid. Please request a new OTP.';
      } else if (err.message?.includes('Session creation failed')) {
        message = 'Backend login failed. Please try again.';
      } else if (err.message?.includes('Network error') || err.message?.includes('Cannot reach server')) {
        message = 'Network error. Please check:\n\n1. Your internet connection is active\n2. You are not using VPN\n3. Try switching between WiFi and mobile data';
      } else if (err.message?.includes('timeout')) {
        message = 'Connection timeout. Please check your internet and try again.';
      } else if (err.message?.includes('Firebase token verification failed')) {
        message = 'Token verification failed. Please request a new OTP and try again.';
      }
      
      Alert.alert('Verification Failed', message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      console.log('[Otp2Factor] 🏁 Verify flow completed at:', new Date().toISOString());
    }
  };

  const handleResendOtp = async () => {
    const startTime = Date.now();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔄 [Otp2Factor] RESEND OTP BUTTON PRESSED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(startTime).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 📞 Mobile: ${mobile || 'MISSING'}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    if (!mobile) {
      console.error('[Otp2Factor] ❌ Phone number is missing');
      Alert.alert('Error', 'Phone number is missing');
      return;
    }

    setResending(true);
    
    try {
      console.log('[Otp2Factor] 📡 Calling resendOtp via Firebase (Native)...');
      
      // Native Firebase - no recaptchaVerifier needed
      const result = await resendOtp(mobile);
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ [Otp2Factor] RESEND OTP SUCCESS
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - startTime}ms
║ 📱 Phone: ${mobile}
║ 🔑 New VerificationId: ${result.verificationId}
║ ⏰ New Timestamp: ${new Date(result.timestamp).toISOString()}
║ ⏰ Valid Until: ${new Date(result.timestamp + 120000).toISOString()}
║ 📦 Has New ConfirmResult: ${!!result.confirmationResult}
║ 
║ 🔍 Result Object:
${JSON.stringify({
  hasConfirmationResult: !!result.confirmationResult,
  verificationId: result.verificationId,
  timestamp: result.timestamp,
  phoneNumber: result.phoneNumber
}, null, 2).split('\n').map(line => '║    ' + line).join('\n')}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      // ✅ CRITICAL: Update ALL state with new confirmation result
      setCurrentConfirmResult(result.confirmationResult);
      setCurrentVerificationId(result.verificationId);
      setCurrentSentTimestamp(result.timestamp);
      
      console.log('[Otp2Factor] ✅ State updated with new confirmation result');
      
      Alert.alert('OTP Sent', 'A new verification code has been sent to your mobile.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔴 [Otp2Factor] RESEND OTP FAILED
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - startTime}ms
║ 📱 Phone: ${mobile}
║ 
║ ❌ ERROR DETAILS:
║ ├─ Name: ${err.name || 'N/A'}
║ ├─ Code: ${err.code || 'N/A'}
║ ├─ Message: ${err.message || 'N/A'}
║ 
║ 📚 Stack Trace:
${err.stack ? err.stack.split('\n').map(line => '║    ' + line).join('\n') : '║    N/A'}
║ 
║ 🔍 Full Error Object:
${JSON.stringify(err, Object.getOwnPropertyNames(err), 2).split('\n').map(line => '║    ' + line).join('\n')}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      const message = err.message || 'Failed to resend OTP';
      Alert.alert('Error', message);
    } finally {
      setResending(false);
      console.log('[Otp2Factor] 🏁 Resend flow completed at:', new Date().toISOString());
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const canVerify = otp.every(d => d) && !loading;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        <View style={s.iconBox}>
          <Ionicons name="mail-outline" size={48} color={BLUE} />
        </View>

        <Text style={s.title}>Enter Verification Code</Text>
        <Text style={s.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={s.phone}>{mobile}</Text>
        </Text>

        <View style={s.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[s.otpInput, digit && s.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[s.verifyBtn, !canVerify && s.verifyBtnDisabled]}
          onPress={handleVerifyOtp}
          disabled={!canVerify}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={s.verifyBtnText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={s.resendRow}>
          <Text style={s.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
            <Text style={s.resendLink}>
              {resending ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: WHITE },
  header:  { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  content:      { flex: 1, paddingHorizontal: 20 },
  iconBox:      { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  title:        { fontSize: 24, fontWeight: '900', color: DARK, textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 14, color: GRAY, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  phone:        { fontWeight: '700', color: BLUE },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 },
  otpInput:     { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', textAlign: 'center', fontSize: 20, fontWeight: '700', color: DARK },
  otpInputFilled: { borderColor: BLUE, backgroundColor: '#EFF6FF' },
  verifyBtn:     { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { fontSize: 16, fontWeight: '800', color: WHITE },
  resendRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText:    { fontSize: 14, color: GRAY },
  resendLink:    { fontSize: 14, fontWeight: '700', color: BLUE },
});
