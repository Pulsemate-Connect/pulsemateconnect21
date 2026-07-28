/**
 * Otp2FactorScreen — Verify Firebase Phone OTP
 */
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verifyPhoneOtp, loginWithFirebaseToken, resendOtp } from '../config/firebase';
import { useAuth } from '../store/authStore';

const BLUE  = '#2563EB';
const WHITE = '#FFFFFF';
const GRAY  = '#6B7280';
const DARK  = '#111827';

export default function Otp2FactorScreen({ route, navigation }) {
  const { mobile, confirmResult } = route?.params || {};
  const { signIn } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Validate required params on mount
  useEffect(() => {
    console.log('[Otp2Factor] Screen mounted');
    console.log('[Otp2Factor] Mobile:', mobile);
    console.log('[Otp2Factor] ConfirmResult:', confirmResult ? 'Present' : 'Missing');
    
    if (!mobile || !confirmResult) {
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
  }, [mobile, confirmResult, navigation]);

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

    if (!confirmResult) {
      Alert.alert('Error', 'No confirmation result. Please request a new OTP.');
      navigation.goBack();
      return;
    }

    setLoading(true);

    try {
      console.log('[Otp2Factor] Verifying OTP with Firebase');
      
      // STEP 1: Verify OTP with Firebase
      const { idToken, phoneNumber } = await verifyPhoneOtp(confirmResult, otpCode);
      
      console.log('[Otp2Factor] OTP verified, phone:', phoneNumber);
      console.log('[Otp2Factor] Logging in with backend using Firebase ID token');
      
      // STEP 2: Login with backend using Firebase ID token
      const { accessToken, refreshToken, user } = await loginWithFirebaseToken(idToken);
      
      console.log('[Otp2Factor] Backend login successful');
      
      // STEP 3: Store tokens and user data
      // RootNavigator watches user state and automatically navigates to MainNavigator
      await signIn(accessToken, user, refreshToken);
      
      console.log('[Otp2Factor] Login complete');
    } catch (err) {
      console.error('[Otp2Factor] Verify OTP error:', err);
      
      let message = err.message || 'Invalid OTP';
      
      // Provide better error messages
      if (err.message?.includes('invalid-verification-code')) {
        message = 'Invalid OTP code. Please check and try again.';
      } else if (err.message?.includes('code-expired')) {
        message = 'OTP has expired. Please request a new one.';
      } else if (err.message?.includes('too-many-requests')) {
        message = 'Too many verification attempts. Please request a new OTP.';
      } else if (err.message?.includes('Session creation failed')) {
        message = 'Login failed. Please try again.';
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

    setResending(true);
    
    try {
      console.log('[Otp2Factor] Resending OTP via Firebase');
      
      // Resend OTP using Firebase
      const result = await resendOtp(mobile);
      
      // Update navigation params with new confirmation result
      navigation.setParams({
        mobile: mobile,
        confirmResult: result.confirmationResult,
      });
      
      Alert.alert('OTP Sent', 'A new code has been sent to your mobile.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('[Otp2Factor] Resend OTP error:', err);
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
