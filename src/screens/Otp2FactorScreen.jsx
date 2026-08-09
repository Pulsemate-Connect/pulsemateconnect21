/**
 * Otp2FactorScreen — Verify Message Central OTP
 * 
 * ✅ Uses Message Central (Backend API)
 */
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// ✅ Message Central OTP Service
import { verifyOTP, resendOTP } from '../services/messagecentral-otp.service';
import { useAuth } from '../store/authStore';

const BLUE  = '#2563EB';
const WHITE = '#FFFFFF';
const GRAY  = '#6B7280';
const DARK  = '#111827';

export default function Otp2FactorScreen({ route, navigation }) {
  const { mobile, verificationId: initialVerificationId, expiresIn } = route?.params || {};
  const { signIn } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [currentVerificationId, setCurrentVerificationId] = useState(initialVerificationId);
  const inputRefs = useRef([]);
  
  // Validate required params on mount
  useEffect(() => {
    const timestamp = Date.now();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🎬 [Otp2Factor] SCREEN MOUNTED (Message Central)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Mount Timestamp: ${new Date(timestamp).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
║ 
║ 📋 RECEIVED PARAMETERS:
║ ├─ Mobile: ${mobile || 'MISSING'}
║ ├─ VerificationId: ${currentVerificationId || 'MISSING'}
║ ├─ ExpiresIn: ${expiresIn || 'N/A'} seconds
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    if (!mobile || !currentVerificationId) {
      console.error('[Otp2Factor] ❌ CRITICAL: Missing required parameters');
      console.error('[Otp2Factor] Missing mobile:', !mobile);
      console.error('[Otp2Factor] Missing verificationId:', !currentVerificationId);
      
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
  }, [mobile, currentVerificationId, navigation]);

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
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔐 [Otp2Factor] VERIFY OTP BUTTON PRESSED (Message Central)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Verify Start: ${new Date(startTime).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
║ 🔑 OTP Length: ${otpCode.length}
║ 🔑 OTP Format: ${/^\d{6}$/.test(otpCode) ? 'VALID' : 'INVALID'}
║ 🔑 VerificationId: ${currentVerificationId || 'unknown'}
║ 📞 Mobile: ${mobile}
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    if (otpCode.length !== 6) {
      console.warn('[Otp2Factor] ⚠️  Incomplete OTP code:', otpCode.length, 'digits');
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code.');
      return;
    }

    if (!currentVerificationId) {
      console.error('[Otp2Factor] ❌ No verification ID available');
      Alert.alert('Error', 'No verification ID. Please request a new OTP.');
      navigation.goBack();
      return;
    }

    setLoading(true);

    try {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 📡 [Otp2Factor] CALLING verifyOTP (Message Central Backend API)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ 🔑 OTP Length: ${otpCode.length}
║ 🔑 VerificationId: ${currentVerificationId}
║ 📞 Mobile: ${mobile}
║ 🔐 Implementation: Message Central (Backend API)
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      // Verify OTP via Backend → Message Central (single step, returns JWT tokens directly)
      const authData = await verifyOTP(currentVerificationId, otpCode, mobile);
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ [Otp2Factor] VERIFICATION SUCCESS (Message Central)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Total Time: ${(Date.now() - startTime) / 1000} seconds
║ 🔑 Has Access Token: ${!!authData?.accessToken}
║ 🔄 Has Refresh Token: ${!!authData?.refreshToken}
║ 👤 Has User Object: ${!!authData?.user}
║ 👤 User ID: ${authData?.user?.id || 'unknown'}
╚═══════════════════════════════════════════════════════════════════════════════
`);

      if (!authData?.accessToken || !authData?.user) {
        const error = new Error('Authentication failed. Please try again.');
        console.error('[Otp2Factor] ❌ Invalid auth data from backend');
        throw error;
      }
      
      // Store tokens and user data
      console.log('[Otp2Factor] 💾 Storing authentication data...');
      await signIn(authData.accessToken, authData.user, authData.refreshToken);
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🎉 [Otp2Factor] LOGIN COMPLETE SUCCESS
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Total Time: ${(Date.now() - startTime) / 1000} seconds
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
║ 🔑 OTP Length: ${otpCode.length}
║ 
║ ❌ ERROR DETAILS:
║ ├─ Error Message: ${err.message || 'N/A'}
║ 
║ 📚 Stack Trace:
${err.stack ? err.stack.split('\n').map(line => '║    ' + line).join('\n') : '║    N/A'}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      const message = err.message || 'Verification failed. Please try again.';
      
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
║ 🔄 [Otp2Factor] RESEND OTP BUTTON PRESSED (Message Central)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date(startTime).toISOString()}
║ 📱 Platform: ${Platform.OS} ${Platform.Version}
║ 📞 Mobile: ${mobile || 'MISSING'}
║ 🔧 Development Mode: ${__DEV__ ? 'YES' : 'NO'}
║ 🔐 Implementation: Message Central (Backend API)
╚═══════════════════════════════════════════════════════════════════════════════
`);
    
    if (!mobile) {
      console.error('[Otp2Factor] ❌ Phone number is missing');
      Alert.alert('Error', 'Phone number is missing');
      return;
    }

    setResending(true);
    
    try {
      console.log('[Otp2Factor] 📡 Calling resendOTP (Message Central Backend API)...');
      
      // Message Central - Backend API
      const result = await resendOTP(mobile);
      
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ ✅ [Otp2Factor] RESEND OTP SUCCESS (Message Central)
╠═══════════════════════════════════════════════════════════════════════════════
║ ⏰ Timestamp: ${new Date().toISOString()}
║ ⏱️  Time Taken: ${Date.now() - startTime}ms
║ 📱 Phone: ${mobile}
║ 🔑 New VerificationId: ${result.verificationId}
║ ⏰ Expires In: ${result.expiresIn}s
║ 
║ 🔍 Result Object:
${JSON.stringify({
  verificationId: result.verificationId,
  expiresIn: result.expiresIn,
  message: result.message
}, null, 2).split('\n').map(line => '║    ' + line).join('\n')}
╚═══════════════════════════════════════════════════════════════════════════════
`);
      
      // Update verificationId with new one
      setCurrentVerificationId(result.verificationId);
      
      console.log('[Otp2Factor] ✅ State updated with new verification ID');
      
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
║ ├─ Message: ${err.message || 'N/A'}
║ 
║ 📚 Stack Trace:
${err.stack ? err.stack.split('\n').map(line => '║    ' + line).join('\n') : '║    N/A'}
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
