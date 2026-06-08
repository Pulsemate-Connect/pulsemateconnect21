import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, StatusBar, Dimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendOtp } from '../api/auth';

const LOGO   = require('../../assets/logo1.jpeg');
const DOCTOR = require('../../assets/icon.png'); // app icon as doctor placeholder

const { width: W, height: H } = Dimensions.get('window');

const BG     = '#E8F4FF';
const BLUE   = '#2563EB';
const BLUE_L = '#EFF6FF';
const BLUE_B = '#BFDBFE';
const GREEN  = '#22C55E';
const GREEN_L= '#DCFCE7';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B7280';
const DARK   = '#111827';

/* ─── Queue illustration ─────────────────────────────────────────────────── */
function QueueCard() {
  return (
    <View style={qi.wrap}>
      {/* Person with phone */}
      <View style={qi.person}>
        <View style={qi.avatar}><Ionicons name="person" size={20} color="#93C5FD" /></View>
        <View style={qi.phoneIcon}><Ionicons name="phone-portrait-outline" size={13} color={BLUE} /></View>
      </View>

      <View style={qi.arrow}><Text style={qi.arrowText}>→</Text></View>

      {/* Queue card */}
      <View style={qi.card}>
        <Text style={qi.cardLabel}>Your Queue</Text>
        <Text style={qi.cardNum}>#12</Text>
        <Text style={qi.cardWaitLabel}>Estimated Wait</Text>
        <Text style={qi.cardWait}>25 min</Text>
        {/* progress bar */}
        <View style={qi.bar}><View style={qi.barFill} /></View>
      </View>

      <View style={qi.arrow}><Text style={qi.arrowText}>→</Text></View>

      {/* Doctor */}
      <View style={qi.doctor}>
        <View style={qi.docAvatar}><Ionicons name="medkit" size={20} color="#6EE7B7" /></View>
        <View style={qi.stethoscope}><Ionicons name="pulse" size={13} color={GREEN} /></View>
      </View>
    </View>
  );
}

const qi = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 8 },
  person:     { alignItems: 'center', justifyContent: 'center', width: 48, height: 48, backgroundColor: '#DBEAFE', borderRadius: 24 },
  avatar:     { alignItems: 'center', justifyContent: 'center' },
  phoneIcon:  { position: 'absolute', bottom: -2, right: -2, backgroundColor: WHITE, borderRadius: 6, padding: 2 },
  arrow:      { paddingBottom: 4 },
  arrowText:  { fontSize: 18, color: '#9CA3AF', fontWeight: '700' },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center',
    minWidth: 88,
    borderWidth: 1, borderColor: '#BFDBFE',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  cardLabel:    { fontSize: 9,  fontWeight: '700', color: GRAY,  textTransform: 'uppercase', letterSpacing: 0.5 },
  cardNum:      { fontSize: 30, fontWeight: '900', color: DARK,  lineHeight: 36, marginTop: 2 },
  cardWaitLabel:{ fontSize: 9,  color: GRAY, marginTop: 2 },
  cardWait:     { fontSize: 13, fontWeight: '800', color: BLUE },
  bar:          { height: 5, width: '100%', backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill:      { height: 5, width: '60%', backgroundColor: GREEN, borderRadius: 3 },
  doctor:       { alignItems: 'center', justifyContent: 'center', width: 48, height: 48, backgroundColor: '#D1FAE5', borderRadius: 24 },
  docAvatar:    { alignItems: 'center', justifyContent: 'center' },
  stethoscope:  { position: 'absolute', bottom: -2, right: -2, backgroundColor: WHITE, borderRadius: 6, padding: 2 },
});

/* ─── Step indicator ─────────────────────────────────────────────────────── */
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

/* ─── Main LoginScreen ────────────────────────────────────────────────────── */
export default function LoginScreen({ navigation }) {
  const [mobile,  setMobile]  = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSendOtp = async () => {
    if (mobile.trim().length < 10) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const fullNumber = `+91${mobile.trim()}`;
      const res = await sendOtp(fullNumber, 'LOGIN');
      const devOtp = String(res.data.data?.devOtp || '');
      navigation.navigate('Otp', { mobile: fullNumber, devOtp });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const canSend = mobile.trim().length >= 10 && !loading;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top: Logo + secure badge ── */}
        <View style={s.topBar}>
          {/* Logo box */}
          <View style={s.logoBox}>
            <Image source={LOGO} style={s.logoImg} resizeMode="cover" />
          </View>

          {/* Secure badge */}
          <View style={s.secureBadge}>
            <View style={s.secureIcon}><Ionicons name="shield-checkmark" size={12} color={WHITE} /></View>
            <View>
              <Text style={s.secureTitle}>Secure Login</Text>
              <Text style={s.secureSub}>256-bit SSL</Text>
            </View>
          </View>
        </View>

        {/* ── Headline ── */}
        <Text style={s.headline}>
          PulseMate <Text style={s.headlineBlue}>Connect</Text>
        </Text>
        <Text style={s.headlineSub}>Healthcare Platform</Text>

        {/* ── Feature chips ── */}
        <View style={s.chips}>
          {[
            { icon: 'calendar-outline', label: 'Book',  sub: 'Appointments' },
            { icon: 'people-outline',   label: 'Track', sub: 'Live Queue' },
            { icon: 'document-text-outline', label: 'Get', sub: 'Prescriptions' },
          ].map((f) => (
            <View key={f.label} style={s.chip}>
              <Ionicons name={f.icon} size={14} color={BLUE} />
              <View>
                <Text style={s.chipLabel}>{f.label}</Text>
                <Text style={s.chipSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Illustration card ── */}
        <View style={s.illustrationCard}>
          {/* Doctor photo strip */}
          <View style={s.doctorStrip}>
            <Image source={LOGO} style={s.doctorPhoto} resizeMode="cover" />
            <View style={s.doctorInfo}>
              <View style={s.doctorBadge}>
                <Ionicons name="medical" size={10} color={WHITE} />
                <Text style={s.doctorBadgeText}>Verified Doctor</Text>
              </View>
              <Text style={s.doctorName}>Dr. Priya Sharma</Text>
              <Text style={s.doctorSpec}>Cardiologist · 12 yrs exp</Text>
              <View style={s.doctorAvail}>
                <View style={s.availDot} />
                <Text style={s.availText}>Available now</Text>
              </View>
            </View>
            <View style={s.doctorRating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={s.ratingText}>4.9</Text>
            </View>
          </View>

          <View style={s.illustrationDivider} />

          <QueueCard />
          <Text style={s.heroTitle}>Skip the waiting room.</Text>
          <Text style={s.heroSub}>Book and track appointments in real time.</Text>
        </View>

        {/* ── Form card ── */}
        <View style={s.formCard}>
          {/* Form header */}
          <View style={s.formHeader}>
            <View style={s.formIconBox}>
              <Ionicons name="call" size={20} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.formTitle}>Enter Your Mobile Number</Text>
              <Text style={s.formSub}>We'll send you a one-time password (OTP)</Text>
            </View>
          </View>

          {/* Phone input row */}
          <View style={[s.inputRow, focused && s.inputRowFocused]}>
            {/* Country */}
            <View style={s.country}>
              <Text style={s.flag}>🇮🇳</Text>
              <Text style={s.dialCode}>+91</Text>
              <Ionicons name="chevron-down" size={12} color={GRAY} />
            </View>
            <View style={s.divider} />
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

          {/* No password note */}
          <View style={s.noPwdRow}>
            <View style={s.noPwdCheck}>
              <Ionicons name="checkmark" size={9} color={WHITE} />
            </View>
            <Text style={s.noPwdText}>No password needed — OTP only</Text>
          </View>

          {/* Send OTP button */}
          <TouchableOpacity
            style={[s.btn, !canSend && s.btnDisabled]}
            onPress={handleSendOtp}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={WHITE} size="small" />
              : <>
                  <Ionicons name="send" size={16} color={WHITE} />
                  <Text style={s.btnText}>Send OTP</Text>
                </>
            }
          </TouchableOpacity>

          {/* Step indicators */}
          <View style={s.steps}>
            <StepDot num="1" label="Enter Number" active />
            <View style={s.stepLine} />
            <StepDot num="2" label="Get OTP" active={false} />
            <View style={s.stepLine} />
            <StepDot num="3" label="Verified" active={false} />
          </View>
        </View>

        {/* ── Trust badges ── */}
        <View style={s.trustRow}>
          {[
            { icon: 'shield-outline',   label: 'Secure OTP Login' },
            { icon: 'lock-closed-outline', label: 'No Password\nRequired' },
            { icon: 'people-outline',   label: 'Trusted by\nClinics' },
          ].map((b) => (
            <View key={b.label} style={s.trustBadge}>
              <Ionicons name={b.icon} size={16} color={BLUE} />
              <Text style={s.trustLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Privacy note ── */}
        <View style={s.privacyCard}>
          <View style={s.privacyIcon}><Ionicons name="lock-closed" size={16} color={BLUE} /></View>
          <Text style={s.privacyText}>
            Your number is only used for authentication and is never shared with third parties.
          </Text>
          <View style={s.otpBadge}>
            <View style={s.otpDot} /><Text style={s.otpBadgeText}>OTP Verified</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <Text style={s.terms}>
          By continuing, you agree to our{' '}
          <Text style={s.termsLink}>Terms &amp; Conditions</Text>
          {' '}and{' '}
          <Text style={s.termsLink}>Privacy Policy</Text>
        </Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52 },

  /* top bar */
  topBar:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  logoBox:      { width: 56, height: 56, backgroundColor: WHITE, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3, borderWidth: 1, borderColor: '#DBEAFE' },
  logoImg:      { width: '100%', height: '100%', borderRadius: 18 },
  secureBadge:  { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderWidth: 1, borderColor: '#D1FAE5' },
  secureIcon:   { width: 22, height: 22, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  secureTitle:  { fontSize: 11, fontWeight: '800', color: DARK, lineHeight: 13 },
  secureSub:    { fontSize: 9,  color: GRAY, lineHeight: 11, marginTop: 1 },

  /* headline */
  headline:    { fontSize: 26, fontWeight: '900', color: DARK, textAlign: 'center', letterSpacing: -0.5, marginBottom: 2 },
  headlineBlue:{ color: BLUE },
  headlineSub: { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 16 },

  /* chips */
  chips:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  chipLabel:{ fontSize: 11, fontWeight: '800', color: DARK, lineHeight: 13 },
  chipSub:  { fontSize: 9,  color: GRAY, lineHeight: 11, marginTop: 1 },

  /* illustration */
  illustrationCard:   { backgroundColor: WHITE, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  illustrationDivider:{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  heroTitle:          { fontSize: 16, fontWeight: '900', color: DARK, textAlign: 'center', marginTop: 8 },
  heroSub:            { fontSize: 13, fontWeight: '700', color: BLUE, textAlign: 'center', marginTop: 2 },

  /* doctor strip */
  doctorStrip:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorPhoto:      { width: 56, height: 56, borderRadius: 16, borderWidth: 2, borderColor: '#BFDBFE' },
  doctorInfo:       { flex: 1, gap: 3 },
  doctorBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BLUE, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  doctorBadgeText:  { fontSize: 9, fontWeight: '800', color: WHITE },
  doctorName:       { fontSize: 14, fontWeight: '800', color: DARK },
  doctorSpec:       { fontSize: 11, color: GRAY },
  doctorAvail:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  availDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  availText:        { fontSize: 10, fontWeight: '600', color: GREEN },
  doctorRating:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  ratingText:       { fontSize: 12, fontWeight: '800', color: '#92400E' },

  /* form card */
  formCard:   { backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  formIconBox:{ width: 42, height: 42, borderRadius: 12, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  formTitle:  { fontSize: 14, fontWeight: '800', color: DARK, lineHeight: 18 },
  formSub:    { fontSize: 11, color: GRAY, lineHeight: 15, marginTop: 2 },

  /* input */
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: '#F9FAFB', marginBottom: 10, overflow: 'hidden' },
  inputRowFocused: { borderColor: BLUE, backgroundColor: WHITE },
  country:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14 },
  flag:            { fontSize: 18 },
  dialCode:        { fontSize: 14, fontWeight: '700', color: DARK },
  divider:         { width: 1, height: 24, backgroundColor: '#E5E7EB' },
  phoneInput:      { flex: 1, fontSize: 16, fontWeight: '500', color: DARK, paddingHorizontal: 12, paddingVertical: 14, letterSpacing: 0.3 },

  /* no password */
  noPwdRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  noPwdCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  noPwdText:  { fontSize: 12, fontWeight: '600', color: GREEN },

  /* button */
  btn:     { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.3 },

  /* steps */
  steps:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  stepLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB', maxWidth: 28 },

  /* trust */
  trustRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  trustBadge: { alignItems: 'center', gap: 4, flex: 1 },
  trustLabel: { fontSize: 10, color: GRAY, fontWeight: '600', textAlign: 'center', lineHeight: 14 },

  /* privacy */
  privacyCard: { backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: '#DBEAFE', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  privacyIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  privacyText: { flex: 1, fontSize: 11, color: '#6B7280', lineHeight: 16 },
  otpBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN_L, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, borderWidth: 1, borderColor: '#BBF7D0', alignSelf: 'flex-start', flexShrink: 0 },
  otpDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  otpBadgeText:{ fontSize: 10, fontWeight: '800', color: '#15803D' },

  /* terms */
  terms:     { textAlign: 'center', fontSize: 11, color: GRAY, lineHeight: 18 },
  termsLink: { color: BLUE, fontWeight: '700' },
});
