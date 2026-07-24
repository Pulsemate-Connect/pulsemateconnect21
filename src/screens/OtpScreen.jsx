/**
 * OtpScreen — Firebase Phone Auth OTP verification
 *
 * Receives: mobile (E.164), confirmationResult (from Firebase sendOtpToPhone)
 * Flow:
 *   1. User enters 6-digit OTP from SMS
 *   2. verifyPhoneOtp(confirmationResult, code) → Firebase verifies locally, returns idToken
 *   3. loginWithFirebaseToken(idToken) → Backend verifies Firebase token, returns app JWT
 *   4. signIn(accessToken, user) → User logged in ✅
 *
 * KEY POINTS:
 *   - Firebase SDK handles SMS delivery (real SMS via Google infrastructure)
 *   - OTP verification happens on client (no server call)
 *   - Backend only verifies the Firebase ID Token after successful verification
 *   - No mock OTP logging or generation
 */
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Animated, Easing, StatusBar, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verifyPhoneOtp, resendOtp, loginWithFirebaseToken } from '../config/firebase';
import { useAuth } from '../store/authStore';
const LOGO = require('../../assets/logo1.jpeg');

const PRIVACY_URL = 'https://www.pulsemateconnect.in/privacy-policy';
const TERMS_URL   = 'https://www.pulsemateconnect.in/terms-of-service';

const BG     = '#E8F4FF';
const BLUE   = '#2563EB';
const BLUE_L = '#EFF6FF';
const BLUE_B = '#BFDBFE';
const GREEN  = '#22C55E';
const GREEN_L= '#DCFCE7';
const RED    = '#EF4444';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B7280';
const DARK   = '#111827';

function StepRow({ current }) {
  const steps = [{ n: '1', label: 'Enter Number' }, { n: '2', label: 'Get OTP' }, { n: '3', label: 'Verified' }];
  return (
    <View style={sr.row}>
      {steps.map((s, i) => {
        const done = current > i + 1; const active = current === i + 1;
        return (
          <View key={s.n} style={sr.item}>
            <View style={[sr.dot, done ? sr.dotDone : active ? sr.dotActive : sr.dotOff]}>
              {done ? <Ionicons name="checkmark" size={10} color={WHITE} /> : <Text style={[sr.num, active ? sr.numActive : sr.numOff]}>{s.n}</Text>}
            </View>
            <Text style={[sr.label, done ? sr.labelDone : active ? sr.labelActive : sr.labelOff]}>{s.label}</Text>
            {i < steps.length - 1 && <View style={[sr.line, done ? sr.lineDone : sr.lineOff]} />}
          </View>
        );
      })}
    </View>
  );
}

const sr = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 18 },
  item:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:        { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dotActive:  { backgroundColor: BLUE }, dotDone: { backgroundColor: GREEN }, dotOff: { backgroundColor: '#E5E7EB' },
  num:        { fontSize: 10, fontWeight: '800' },
  numActive:  { color: WHITE }, numOff: { color: GRAY },
  label:      { fontSize: 10, fontWeight: '600' },
  labelActive:{ color: BLUE }, labelDone: { color: GREEN }, labelOff: { color: '#9CA3AF' },
  line:       { width: 20, height: 1.5, borderRadius: 1 },
  lineDone:   { backgroundColor: GREEN }, lineOff: { backgroundColor: '#E5E7EB' },
});

export default function OtpScreen({ route, navigation }) {
  const { mobile, confirmationResult } = route.params;
  const { signIn } = useAuth();

  const [digits,      setDigits]      = useState(['', '', '', '', '', '']);
  const [loading,     setLoading]     = useState(false);
  const [status,      setStatus]      = useState('idle');
  const [cooldown,    setCooldown]    = useState(60);
  const [focusedIdx,  setFocusedIdx]  = useState(null);

  const shake        = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const progressA    = useRef(new Animated.Value(0)).current;

  const r0=useRef(null); const r1=useRef(null); const r2=useRef(null);
  const r3=useRef(null); const r4=useRef(null); const r5=useRef(null);
  const refs = [r0,r1,r2,r3,r4,r5];

  useEffect(() => {
    startCooldown(60);
    setTimeout(() => refs[0].current?.focus(), 150);
  }, []);

  useEffect(() => {
    const filled = digits.filter(Boolean).length;
    Animated.timing(progressA, { toValue: filled / 6, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [digits]);

  useEffect(() => {
    if (digits.join('').length === 6 && status === 'idle') handleVerify();
  }, [digits]);

  const startCooldown = (secs) => {
    setCooldown(secs);
    const t = setInterval(() => setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const handleDigitChange = (text, i) => {
    const d = text.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = d; setDigits(next);
    if (d && i < 5) refs[i+1].current?.focus();
    if (!d && i > 0 && !text) refs[i-1].current?.focus();
  };

  const handleKeyPress = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) refs[i-1].current?.focus();
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8,   duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start(() => setStatus('idle'));
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6 || !confirmationResult) return;

    setLoading(true);

    try {
      console.log('[OtpScreen] Verifying OTP with Firebase...');

      // Step 1: Verify OTP with Firebase SDK (local verification, no network call)
      const firebaseResult = await verifyPhoneOtp(confirmationResult, code);

      if (!firebaseResult?.idToken) {
        throw new Error('Failed to get Firebase token. Please try again.');
      }

      console.log('[OtpScreen] Firebase verification successful, sending to backend...');

      // Step 2: Send Firebase ID Token to backend
      // Backend will verify the token using Firebase Admin SDK
      // and return application JWT tokens
      const authData = await loginWithFirebaseToken(firebaseResult.idToken);

      if (!authData?.accessToken || !authData?.user) {
        throw new Error('Backend authentication failed. Please try again.');
      }

      console.log('[OtpScreen] Backend authentication successful');

      setStatus('success');
      Animated.spring(successScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();

      // Sign in after showing success animation
      setTimeout(() => signIn(
        authData.accessToken,
        authData.user,
        authData.refreshToken ?? null,
      ), 1600);

    } catch (err) {
      console.error('[OtpScreen] Verification error:', err);
      setStatus('error');
      triggerShake();
      const msg = err?.message || 'Verification failed. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      console.log('[OtpScreen] Resending OTP...');
      const result = await resendOtp(mobile);

      // Update confirmationResult in route params for next attempt
      route.params.confirmationResult = result.confirmationResult;

      setDigits(['', '', '', '', '', '']);
      setStatus('idle');
      startCooldown(60);
      setTimeout(() => refs[0].current?.focus(), 100);

      Alert.alert('OTP Resent', 'New OTP sent to your phone.');
    } catch (err) {
      console.error('[OtpScreen] Resend error:', err);
      Alert.alert('Error', err.message || 'Failed to resend OTP.');
    }
  };

  const boxStyle = (i) => {
    const filled = digits[i] !== ''; const focused = focusedIdx === i;
    if (status === 'error')   return [os.box, os.boxError];
    if (status === 'success') return [os.box, os.boxSuccess];
    if (focused)              return [os.box, os.boxFocused];
    if (filled)               return [os.box, os.boxFilled];
    return [os.box];
  };

  const canVerify = digits.join('').length === 6 && !loading && !!confirmationResult;

  return (
    <KeyboardAvoidingView style={os.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {status === 'success' && (
        <Animated.View style={[os.successOverlay, { opacity: successScale }]}>
          <Animated.View style={[os.successCircle, { transform: [{ scale: successScale }] }]}>
            <Ionicons name="checkmark" size={44} color={WHITE} />
          </Animated.View>
          <Text style={os.successTitle}>Verified!</Text>
          <Text style={os.successSub}>Welcome to PulseMate Connect</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={os.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Top bar — back button */}
        <View style={os.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={os.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={BLUE} />
          </TouchableOpacity>
          {/* Spacer to keep back button left-aligned */}
          <View style={{ flex: 1 }} />
        </View>

        {/* ── Centered logo block — matches Home screen logo1.jpeg ── */}
        <View style={os.logoBlock}>
          <View style={os.logoBox}>
            <Image source={LOGO} style={os.logoImg} resizeMode="cover" />
          </View>
          <Text style={os.headline}>PulseMate <Text style={os.headlineBlue}>Connect</Text></Text>
          <Text style={os.headlineSub}>Healthcare Platform</Text>
        </View>

        <View style={os.chips}>
          {[
            { icon: 'calendar-outline',      label: 'Book',  sub: 'Appointments' },
            { icon: 'people-outline',        label: 'Track', sub: 'Live Queue' },
            { icon: 'document-text-outline', label: 'Get',   sub: 'Prescriptions' },
          ].map((f) => (
            <View key={f.label} style={os.chip}>
              <Ionicons name={f.icon} size={14} color={BLUE} />
              <View><Text style={os.chipLabel}>{f.label}</Text><Text style={os.chipSub}>{f.sub}</Text></View>
            </View>
          ))}
        </View>

        {/* OTP Card */}
        <View style={os.formCard}>
          <View style={os.formHeader}>
            <View style={os.formIconBox}><Ionicons name="chatbubble-ellipses" size={20} color={BLUE} /></View>
            <View style={{ flex: 1 }}>
              <Text style={os.formTitle}>Enter OTP</Text>
              <Text style={os.formSub}>Sent to <Text style={os.mobileHighlight}>{mobile}</Text></Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={os.changeBtn}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={os.sentChip}>
            <View style={os.sentDot} />
            <Text style={os.sentText}>OTP sent via Firebase</Text>
          </View>

          {/* OTP boxes */}
          <Animated.View style={[os.boxesRow, { transform: [{ translateX: shake }] }]}>
            {digits.map((d, i) => (
              <TextInput
                key={i} ref={refs[i]} style={boxStyle(i)} value={d}
                onChangeText={(t) => handleDigitChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                onFocus={() => setFocusedIdx(i)} onBlur={() => setFocusedIdx(null)}
                keyboardType="number-pad" maxLength={1} selectTextOnFocus caretHidden textAlign="center"
              />
            ))}
          </Animated.View>

          {/* Progress */}
          <View style={os.progressTrack}>
            <Animated.View style={[os.progressFill, { width: progressA.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }) }]} />
          </View>

          {/* Resend */}
          <View style={os.resendRow}>
            {cooldown > 0 ? (
              <><View style={os.resendTimer}><Text style={os.resendTimerNum}>{cooldown}</Text></View>
              <Text style={os.resendMuted}>Resend in <Text style={os.resendSecs}>{cooldown}s</Text></Text></>
            ) : (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={os.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify button */}
          <TouchableOpacity style={[os.btn, !canVerify && os.btnDisabled]} onPress={handleVerify} disabled={!canVerify} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={WHITE} size="small" />
              : <><Ionicons name="shield-checkmark" size={16} color={WHITE} /><Text style={os.btnText}>Verify & Continue</Text><Ionicons name="checkmark" size={16} color={WHITE} /></>
            }
          </TouchableOpacity>

          <StepRow current={2} />
        </View>

        <Text style={os.terms}>By continuing, you agree to our <Text style={os.termsLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text> and <Text style={os.termsLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text></Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const os = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52 },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.96)', zIndex: 200, alignItems: 'center', justifyContent: 'center', gap: 14 },
  successCircle:  { width: 96, height: 96, borderRadius: 48, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  successTitle:   { fontSize: 28, fontWeight: '900', color: DARK },
  successSub:     { fontSize: 14, color: GRAY },
  topBar:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BLUE_B },

  // Centered logo block — same asset (logo1.jpeg) and shape as HomeHeader
  logoBlock:   { alignItems: 'center', marginBottom: 18 },
  logoBox: {
    width: 76,
    height: 76,
    backgroundColor: WHITE,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 14,
  },
  logoImg:     { width: '100%', height: '100%' },

  headline:    { fontSize: 26, fontWeight: '900', color: DARK, textAlign: 'center', letterSpacing: -0.5, marginBottom: 2 },
  headlineBlue:{ color: BLUE },
  headlineSub: { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 16 },
  chips:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  chipLabel:{ fontSize: 11, fontWeight: '800', color: DARK, lineHeight: 13 },
  chipSub:  { fontSize: 9, color: GRAY, lineHeight: 11, marginTop: 1 },
  formCard:   { backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  formIconBox:{ width: 42, height: 42, borderRadius: 12, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  formTitle:  { fontSize: 14, fontWeight: '800', color: DARK, lineHeight: 18 },
  formSub:    { fontSize: 11, color: GRAY, lineHeight: 15, marginTop: 2, flex: 1 },
  mobileHighlight: { color: BLUE, fontWeight: '700' },
  changeBtn:  { fontSize: 12, color: BLUE, fontWeight: '700', textDecorationLine: 'underline' },
  sentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN_L, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 14, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#BBF7D0' },
  sentDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  sentText: { fontSize: 11, fontWeight: '600', color: '#15803D' },
  boxesRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 10 },
  box:        { width: 46, height: 56, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', fontSize: 24, fontWeight: '900', textAlign: 'center', color: DARK },
  boxFilled:  { borderColor: BLUE, backgroundColor: BLUE_L },
  boxFocused: { borderColor: BLUE, borderWidth: 2.5, backgroundColor: WHITE, shadowColor: BLUE, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  boxError:   { borderColor: RED,  backgroundColor: '#FEF2F2' },
  boxSuccess: { borderColor: GREEN, backgroundColor: GREEN_L },
  progressTrack: { height: 3, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressFill:  { height: 3, backgroundColor: BLUE, borderRadius: 2 },
  resendRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 },
  resendTimer:    { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_L, borderWidth: 2, borderColor: BLUE_B, alignItems: 'center', justifyContent: 'center' },
  resendTimerNum: { fontSize: 13, fontWeight: '800', color: BLUE },
  resendMuted:    { fontSize: 12, color: GRAY },
  resendSecs:     { color: BLUE, fontWeight: '700' },
  resendLink:     { fontSize: 13, fontWeight: '700', color: BLUE },
  btn:         { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  btnText:     { fontSize: 15, fontWeight: '800', color: WHITE, letterSpacing: 0.3 },
  trustRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  trustBadge: { alignItems: 'center', gap: 4, flex: 1 },
  trustLabel: { fontSize: 10, color: GRAY, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  privacyCard: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: '#DBEAFE', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  privacyIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  privacyText: { flex: 1, fontSize: 11, color: GRAY, lineHeight: 16 },
  otpBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN_L, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, borderWidth: 1, borderColor: '#BBF7D0', alignSelf: 'flex-start', flexShrink: 0 },
  otpDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  otpBadgeText:{ fontSize: 10, fontWeight: '800', color: '#15803D' },
  terms:    { textAlign: 'center', fontSize: 11, color: GRAY, lineHeight: 18 },
  termsLink:{ color: BLUE, fontWeight: '700' },
});
