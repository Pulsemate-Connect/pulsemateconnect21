/**
 * LoginScreen — Firebase Phone Authentication
 *
 * Flow:
 *   1. User enters 10-digit mobile number and taps Send OTP
 *   2. FirebaseRecaptchaVerifierModal handles reCAPTCHA silently
 *   3. Firebase REST API sends SMS OTP
 *   4. Navigate to OtpScreen with { mobile, sessionInfo }
 */
import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { firebaseConfig, sendOtpToPhone } from '../config/firebase';

const LOGO = require('../../assets/logo1.jpeg');

const BG     = '#E8F4FF';
const BLUE   = '#2563EB';
const BLUE_L = '#EFF6FF';
const GREEN  = '#22C55E';
const GREEN_L= '#DCFCE7';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B7280';
const DARK   = '#111827';

function StepDot({ num, label, active }) {
  return (
    <View style={st.step}>
      <View style={[st.dot, active ? st.dotActive : st.dotInactive]}>
        <Text style={[st.dotNum, active ? st.dotNumActive : st.dotNumInactive]}>{num}</Text>
      </View>
      <Text style={[st.label, active ? st.labelActive : st.labelInactive]}>{label}</Text>
    </View>
  );
}
const st = StyleSheet.create({
  step:           { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:            { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dotActive:      { backgroundColor: BLUE },
  dotInactive:    { backgroundColor: '#E5E7EB' },
  dotNum:         { fontSize: 10, fontWeight: '800' },
  dotNumActive:   { color: WHITE },
  dotNumInactive: { color: GRAY },
  label:          { fontSize: 11, fontWeight: '600' },
  labelActive:    { color: BLUE },
  labelInactive:  { color: '#9CA3AF' },
});

export default function LoginScreen({ navigation }) {
  const [mobile,  setMobile]  = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  // Ref for the invisible reCAPTCHA modal (required by Firebase Phone Auth)
  const recaptchaVerifier = useRef(null);

  const handleSendOtp = async () => {
    const trimmed = mobile.trim();
    if (trimmed.length < 10) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    const fullNumber = `+91${trimmed}`;
    setLoading(true);
    try {
      // reCAPTCHA resolves automatically (invisible mode), then Firebase sends SMS
      const recaptchaToken = await recaptchaVerifier.current.verify();
      const sessionInfo = await sendOtpToPhone(fullNumber, recaptchaToken);
      navigation.navigate('Otp', { mobile: fullNumber, sessionInfo });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSend = mobile.trim().length >= 10 && !loading;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Invisible reCAPTCHA modal — required by Firebase Phone Auth */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
      />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Top bar — logo only, no badge */}
        <View style={s.topBar}>
          <View style={s.logoBox}>
            <Image source={LOGO} style={s.logoImg} resizeMode="cover" />
          </View>
        </View>

        {/* Headline */}
        <Text style={s.headline}>PulseMate <Text style={s.headlineBlue}>Connect</Text></Text>
        <Text style={s.headlineSub}>Healthcare Platform</Text>

        {/* Chips */}
        <View style={s.chips}>
          {[
            { icon: 'calendar-outline',      label: 'Book',  sub: 'Appointments' },
            { icon: 'people-outline',        label: 'Track', sub: 'Live Queue' },
            { icon: 'document-text-outline', label: 'Get',   sub: 'Prescriptions' },
          ].map((f) => (
            <View key={f.label} style={s.chip}>
              <Ionicons name={f.icon} size={14} color={BLUE} />
              <View><Text style={s.chipLabel}>{f.label}</Text><Text style={s.chipSub}>{f.sub}</Text></View>
            </View>
          ))}
        </View>

        {/* Form card */}
        <View style={s.formCard}>
          <View style={s.formHeader}>
            <View style={s.formIconBox}><Ionicons name="call" size={20} color={BLUE} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.formTitle}>Enter Your Mobile Number</Text>
              <Text style={s.formSub}>We'll send you a verification code via SMS</Text>
            </View>
          </View>

          <View style={[s.inputRow, focused && s.inputRowFocused]}>
            <View style={s.country}>
              <Text style={s.flag}>🇮🇳</Text>
              <Text style={s.dialCode}>+91</Text>
              <Ionicons name="chevron-down" size={12} color={GRAY} />
            </View>
            <View style={s.inputDivider} />
            <TextInput
              style={s.phoneInput}
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
              placeholderTextColor="#D1D5DB"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={canSend ? handleSendOtp : undefined}
            />
          </View>

          <View style={s.noPwdRow}>
            <View style={s.noPwdCheck}><Ionicons name="checkmark" size={9} color={WHITE} /></View>
            <Text style={s.noPwdText}>Verified by Firebase — no password needed</Text>
          </View>

          <TouchableOpacity
            style={[s.btn, !canSend && s.btnDisabled]}
            onPress={handleSendOtp}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={WHITE} size="small" />
              : <><Ionicons name="send" size={16} color={WHITE} /><Text style={s.btnText}>Send OTP</Text></>
            }
          </TouchableOpacity>

          <View style={s.steps}>
            <StepDot num="1" label="Enter Number" active />
            <View style={s.stepLine} />
            <StepDot num="2" label="Get OTP" active={false} />
            <View style={s.stepLine} />
            <StepDot num="3" label="Verified" active={false} />
          </View>
        </View>

        {/* Trust */}
        <View style={s.trustRow}>
          {[
            { icon: 'shield-outline',      label: 'Firebase\nVerified' },
            { icon: 'lock-closed-outline', label: 'No Password\nRequired' },
            { icon: 'people-outline',      label: 'Trusted by\nClinics' },
          ].map((b) => (
            <View key={b.label} style={s.trustBadge}>
              <Ionicons name={b.icon} size={16} color={BLUE} />
              <Text style={s.trustLabel}>{b.label}</Text>
            </View>
          ))}
        </View>



        <Text style={s.terms}>By continuing, you agree to our <Text style={s.termsLink}>Terms</Text> and <Text style={s.termsLink}>Privacy Policy</Text></Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52 },
  topBar:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', marginBottom: 14 },
  logoBox:      { width: 56, height: 56, backgroundColor: WHITE, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3, borderWidth: 1, borderColor: '#DBEAFE' },
  logoImg:      { width: '100%', height: '100%', borderRadius: 18 },
  headline:     { fontSize: 26, fontWeight: '900', color: DARK, textAlign: 'center', letterSpacing: -0.5, marginBottom: 2 },
  headlineBlue: { color: BLUE },
  headlineSub:  { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 16 },
  chips:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  chipLabel:{ fontSize: 11, fontWeight: '800', color: DARK, lineHeight: 13 },
  chipSub:  { fontSize: 9, color: GRAY, lineHeight: 11, marginTop: 1 },
  illustrationCard: { backgroundColor: WHITE, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  dividerLine:      { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  heroTitle:        { fontSize: 16, fontWeight: '900', color: DARK, textAlign: 'center' },
  heroSub:          { fontSize: 13, fontWeight: '700', color: BLUE, textAlign: 'center', marginTop: 2 },

  // ── New doctor showcase ──────────────────────────────────────────────────────
  doctorsRow:       { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 14 },
  docMiniCard:      { flex: 1, alignItems: 'center', backgroundColor: '#F8FAFF', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#E0EAFF' },
  docMiniAvatar:    { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6, position: 'relative' },
  docMiniInitials:  { fontSize: 16, fontWeight: '800' },
  docMiniDot:       { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', borderWidth: 1.5, borderColor: WHITE },
  docMiniName:      { fontSize: 10, fontWeight: '700', color: DARK, textAlign: 'center', marginBottom: 2 },
  docMiniSpec:      { fontSize: 9, color: GRAY, textAlign: 'center', marginBottom: 4 },
  docMiniRating:    { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  docMiniRatingText:{ fontSize: 10, fontWeight: '800', color: '#92400E' },

  // Stats row
  statsRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  statItem:         { flex: 1, alignItems: 'center' },
  statNum:          { fontSize: 15, fontWeight: '900', color: BLUE },
  statLabel:        { fontSize: 10, color: GRAY, fontWeight: '500', marginTop: 1 },
  statDivider:      { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  formCard:   { backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  formIconBox:{ width: 42, height: 42, borderRadius: 12, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  formTitle:  { fontSize: 14, fontWeight: '800', color: DARK, lineHeight: 18 },
  formSub:    { fontSize: 11, color: GRAY, lineHeight: 15, marginTop: 2 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: '#F9FAFB', marginBottom: 10, overflow: 'hidden' },
  inputRowFocused: { borderColor: BLUE, backgroundColor: WHITE },
  country:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14 },
  flag:            { fontSize: 18 },
  dialCode:        { fontSize: 14, fontWeight: '700', color: DARK },
  inputDivider:    { width: 1, height: 24, backgroundColor: '#E5E7EB' },
  phoneInput:      { flex: 1, fontSize: 16, fontWeight: '500', color: DARK, paddingHorizontal: 12, paddingVertical: 14, letterSpacing: 0.3 },
  noPwdRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  noPwdCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  noPwdText:  { fontSize: 12, fontWeight: '600', color: GREEN },
  btn:         { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.3 },
  steps:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  stepLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB', maxWidth: 28 },
  trustRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  trustBadge: { alignItems: 'center', gap: 4, flex: 1 },
  trustLabel: { fontSize: 10, color: GRAY, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  terms:     { textAlign: 'center', fontSize: 11, color: GRAY, lineHeight: 18 },
  termsLink: { color: BLUE, fontWeight: '700' },
});
