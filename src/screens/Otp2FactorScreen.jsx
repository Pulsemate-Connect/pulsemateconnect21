/**
 * Otp2FactorScreen — Verify Firebase Phone OTP
 * 
 * ✅ FIXED: Now uses FirebaseRecaptchaVerifierModal for resend functionality
 */
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { verifyPhoneOtp, loginWithFirebaseToken, resendOtp } from '../config/firebase';
import { firebaseConfig } from '../config/firebaseConfig';
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
  
  // ✅ FIX: Add recaptchaVerifier ref for resend functionality
  const recaptchaVerifier = useRef(null);

  // Validate required params on mount
  useEffect(() => {
    console.log('[Otp2Factor] 🎬 Screen mounted');
    console.log('[Otp2Factor] 📱 Mobile:', mobile);
    console.log('[Otp2Factor] 📦 ConfirmResult:', currentConfirmResult ? 'Present' : 'Missing');
    console.log('[Otp2Factor] 🔑 VerificationId:', currentVerificationId || 'Missing');
    console.log('[Otp2Factor] ⏰ Sent timestamp:', currentSentTimestamp ? new Date(currentSentTimestamp).toISOString() : 'Missing');
    console.log('[Otp2Factor] ⏰ Current time:', new Date().toISOString());
    
    if (currentSentTimestamp) {
      const elapsed = (Date.now() - currentSentTimestamp) / 1000;
      console.log('[Otp2Factor] ⏱️  Elapsed time:', elapsed, 'seconds');
      
      if (elapsed > 100) {
        console.warn('[Otp2Factor] ⚠️  WARNING: More than 100 seconds elapsed since OTP sent');
        console.warn('[Otp2Factor] ⚠️  OTP may expire soon (typical timeout: 120 seconds)');
      }
    }
    
    if (!mobile || !currentConfirmResult) {
      Alert.alert(
        'Session Error',
        'Verification session is missing. Please request a new OTP.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
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
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code.');
      return;
    }

    if (!currentConfirmResult) {
      console.error('[Otp2Factor] ❌ No confirmation result available');
      Alert.alert('Error', 'No confirmation result. Please request a new OTP.');
      navigation.goBack();
      return;
    }

    setLoading(true);

    try {
      const verifyStartTime = Date.now();
      const elapsedSinceSent = currentSentTimestamp ? (verifyStartTime - currentSentTimestamp) / 1000 : null;
      
      console.log('[Otp2Factor] 🔐 Starting OTP verification');
      console.log('[Otp2Factor] 📝 OTP entered:', otpCode);
      console.log('[Otp2Factor] 🔑 Using VerificationId:', currentVerificationId || 'unknown');
      console.log('[Otp2Factor] ⏰ Verify start time:', new Date(verifyStartTime).toISOString());
      console.log('[Otp2Factor] ⏱️  Time since OTP sent:', elapsedSinceSent, 'seconds');
      
      if (elapsedSinceSent && elapsedSinceSent > 110) {
        console.warn('[Otp2Factor] ⚠️  WARNING: Verification attempt after', elapsedSinceSent, 'seconds');
        console.warn('[Otp2Factor] ⚠️  This is close to Firebase timeout limit (typically 120 seconds)');
        Alert.alert(
          'Timeout Warning',
          'You\'ve taken more than 110 seconds to enter OTP. If verification fails, please request a new OTP.',
          [{ text: 'Continue Anyway', onPress: () => {} }]
        );
      }
      
      // STEP 1: Verify OTP with Firebase
      console.log('[Otp2Factor] 📡 Calling Firebase verifyPhoneOtp...');
      const { idToken, phoneNumber } = await verifyPhoneOtp(
        currentConfirmResult, 
        otpCode,
        currentSentTimestamp
      );
      
      console.log('[Otp2Factor] ✅ OTP verified successfully');
      console.log('[Otp2Factor] 📱 Phone:', phoneNumber);
      console.log('[Otp2Factor] 🎫 Got Firebase ID token');
      console.log('[Otp2Factor] ⏱️  Verification took:', (Date.now() - verifyStartTime) / 1000, 'seconds');
      
      // STEP 2: Login with backend using Firebase ID token
      console.log('[Otp2Factor] 🔄 Logging in with backend...');
      const { accessToken, refreshToken, user } = await loginWithFirebaseToken(idToken);
      
      console.log('[Otp2Factor] ✅ Backend login successful');
      console.log('[Otp2Factor] 👤 User ID:', user?.id || 'unknown');
      
      // STEP 3: Store tokens and user data
      console.log('[Otp2Factor] 💾 Storing authentication data...');
      await signIn(accessToken, user, refreshToken);
      
      console.log('[Otp2Factor] 🎉 Login complete - Total time:', (Date.now() - verifyStartTime) / 1000, 'seconds');
    } catch (err) {
      console.error('[Otp2Factor] ❌ Verification failed');
      console.error('[Otp2Factor] ❌ Error:', err.message);
      console.error('[Otp2Factor] ❌ Error type:', err.constructor.name);
      
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
    }
  };

  const handleResendOtp = async () => {
    if (!mobile) {
      Alert.alert('Error', 'Phone number is missing');
      return;
    }

    // ✅ FIX: Validate recaptchaVerifier is available
    if (!recaptchaVerifier.current) {
      Alert.alert('Error', 'reCAPTCHA not ready. Please try again in a moment.');
      return;
    }

    setResending(true);
    
    try {
      console.log('[Otp2Factor] 🔄 Resending OTP via Firebase');
      console.log('[Otp2Factor] 📱 Phone number:', mobile);
      console.log('[Otp2Factor] ⏰ Resend timestamp:', new Date().toISOString());
      
      // ✅ FIX: Pass recaptchaVerifier.current as 2nd parameter
      const result = await resendOtp(mobile, recaptchaVerifier.current);
      
      // ✅ CRITICAL: Update ALL state with new confirmation result
      setCurrentConfirmResult(result.confirmationResult);
      setCurrentVerificationId(result.verificationId);
      setCurrentSentTimestamp(result.timestamp);
      
      console.log('[Otp2Factor] ✅ New OTP sent successfully');
      console.log('[Otp2Factor] 🔑 New VerificationId:', result.verificationId);
      console.log('[Otp2Factor] ⏰ New timestamp:', new Date(result.timestamp).toISOString());
      console.log('[Otp2Factor] ⏰ Valid until:', new Date(result.timestamp + 120000).toISOString());
      
      Alert.alert('OTP Sent', 'A new verification code has been sent to your mobile.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('[Otp2Factor] ❌ Resend OTP error:', err.message);
      const message = err.message || 'Failed to resend OTP';
      Alert.alert('Error', message);
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const canVerify = otp.every(d => d) && !loading;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* ✅ FIX: Add FirebaseRecaptchaVerifierModal for resend */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
      />
      
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
