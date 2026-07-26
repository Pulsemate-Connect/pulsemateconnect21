/**
 * Login2FactorScreen — 2Factor SMS OTP Authentication
 *
 * Simpler alternative to Firebase Phone Auth
 * Uses 2Factor API for Indian phone numbers
 */
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, StatusBar, Image, Linking,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../api/axios';

const LOGO = require('../../assets/logo1.jpeg');

const BG     = '#F0F7FF';
const BLUE   = '#2563EB';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B7280';
const LIGHT_GRAY = '#9CA3AF';
const DARK   = '#111827';

export default function Login2FactorScreen({ navigation }) {
  const [mobile,  setMobile]  = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSendOtp = async () => {
    const trimmed = mobile.trim();
    if (trimmed.length < 10) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number.');
      return;
    }

    const fullNumber = `+91${trimmed}`;
    setLoading(true);

    try {
      console.log('[Login2Factor] Sending OTP to', fullNumber);
      const response = await api.post('/auth/patient/send-otp', { phone: fullNumber });
      
      console.log('[Login2Factor] Full API Response:', JSON.stringify(response.data, null, 2));
      
      const sessionId = response.data?.data?.sessionId;
      
      console.log('[Login2Factor] Extracted sessionId:', sessionId);
      console.log('[Login2Factor] SessionId type:', typeof sessionId);
      
      if (!sessionId) {
        console.error('[Login2Factor] No session ID in response. Full data:', response.data);
        throw new Error('No session ID received from server');
      }

      console.log('[Login2Factor] OTP sent, session:', sessionId);
      console.log('[Login2Factor] Navigating with params:', { mobile: fullNumber, sessionId });

      // Navigate to OTP screen
      navigation.navigate('Otp2Factor', {
        mobile: fullNumber,
        sessionId: sessionId,
      });
    } catch (err) {
      console.error('[Login2Factor] Send OTP error:', err);
      const message = err?.response?.data?.message || err.message || 'Failed to send OTP';
      Alert.alert('Error', message);
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
        {/* Decorative Background Pattern */}
        <View style={s.bgPattern}>
          <View style={[s.bgDot, { top: 60, left: 20 }]} />
          <View style={[s.bgDot, { top: 80, left: 40 }]} />
          <View style={[s.bgDot, { top: 100, left: 30 }]} />
          <View style={[s.bgCircle, { top: 40, right: 20 }]} />
          <View style={[s.bgCross, { top: 120, right: 40 }]} />
        </View>

        {/* Logo */}
        <View style={s.logoContainer}>
          <View style={s.logoBox}>
            <Image source={LOGO} style={s.logoImg} resizeMode="cover" />
          </View>
        </View>

        {/* Title */}
        <Text style={s.headline}>PulseMate <Text style={s.headlineBlue}>Connect</Text></Text>
        <Text style={s.headlineSub}>Healthcare Platform</Text>

        {/* Form Card */}
        <View style={s.formCard}>
          <View style={s.formHeader}>
            <View style={s.phoneIconBox}>
              <Ionicons name="call" size={24} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.formTitle}>Enter Your Mobile Number</Text>
              <Text style={s.formSub}>We'll send you a verification code via SMS</Text>
            </View>
          </View>

          {/* Phone Input */}
          <View style={[s.inputRow, focused && s.inputRowFocused]}>
            <View style={s.country}>
              <Text style={s.flag}>🇮🇳</Text>
              <Text style={s.dialCode}>+91</Text>
              <Ionicons name="chevron-down" size={16} color={GRAY} />
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

          {/* Send OTP Button */}
          <TouchableOpacity
            style={[s.btn, !canSend && s.btnDisabled]}
            onPress={handleSendOtp}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color={WHITE} />
                <Text style={s.btnText}>Send OTP</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Note */}
          <View style={s.securityNote}>
            <Ionicons name="shield-checkmark" size={16} color={GRAY} />
            <Text style={s.securityText}>Your data is safe and secure with us.</Text>
          </View>
        </View>

        {/* Features */}
        <View style={s.featuresRow}>
          <View style={s.featureItem}>
            <View style={s.featureIcon}>
              <Ionicons name="shield-checkmark" size={24} color={BLUE} />
            </View>
            <Text style={s.featureTitle}>Secure & Private</Text>
            <Text style={s.featureDesc}>Your data is 100% protected</Text>
          </View>

          <View style={s.featureItem}>
            <View style={[s.featureIcon, { backgroundColor: '#D1FAE5' }]}>
              <MaterialIcons name="verified" size={24} color="#10B981" />
            </View>
            <Text style={s.featureTitle}>Trusted Healthcare</Text>
            <Text style={s.featureDesc}>Connecting you to trusted care</Text>
          </View>

          <View style={s.featureItem}>
            <View style={[s.featureIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="time" size={24} color={BLUE} />
            </View>
            <Text style={s.featureTitle}>Quick & Easy</Text>
            <Text style={s.featureDesc}>Get started in just a few steps</Text>
          </View>
        </View>

        {/* Footer Links */}
        <View style={s.footer}>
          <Text style={s.footerText}>By continuing, you agree to our </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://pulsemateconnect.in/terms')}>
            <Text style={s.footerLink}>Terms & Conditions</Text>
          </TouchableOpacity>
          <Text style={s.footerText}> and </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://pulsemateconnect.in/privacy')}>
            <Text style={s.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 },
  
  // Background Pattern
  bgPattern: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  bgDot: { 
    width: 4, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: '#C7D2FE', 
    position: 'absolute' 
  },
  bgCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#E0E7FF', 
    opacity: 0.3, 
    position: 'absolute' 
  },
  bgCross: { 
    width: 20, 
    height: 20, 
    position: 'absolute' 
  },

  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoBox:      { width: 80, height: 80, backgroundColor: WHITE, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  logoImg:      { width: '100%', height: '100%' },

  // Title
  headline:     { fontSize: 28, fontWeight: '900', color: DARK, textAlign: 'center', marginBottom: 4 },
  headlineBlue: { color: BLUE },
  headlineSub:  { fontSize: 14, color: LIGHT_GRAY, textAlign: 'center', marginBottom: 32 },

  // Form Card
  formCard:   { backgroundColor: WHITE, borderRadius: 24, padding: 24, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  phoneIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  formTitle:  { fontSize: 16, fontWeight: '800', color: DARK, marginBottom: 4 },
  formSub:    { fontSize: 13, color: LIGHT_GRAY, lineHeight: 18 },

  // Input
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 16, backgroundColor: '#F9FAFB', marginBottom: 20, height: 60 },
  inputRowFocused: { borderColor: BLUE, backgroundColor: WHITE, elevation: 2 },
  country:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14 },
  flag:            { fontSize: 24 },
  dialCode:        { fontSize: 16, fontWeight: '700', color: DARK },
  inputDivider:    { width: 1, height: 30, backgroundColor: '#E5E7EB' },
  phoneInput:      { flex: 1, fontSize: 16, fontWeight: '500', color: DARK, paddingHorizontal: 16 },

  // Button
  btn:         { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: '800', color: WHITE },

  // Security Note
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  securityText: { fontSize: 12, color: GRAY },

  // Features
  featuresRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
  featureItem: { flex: 1, alignItems: 'center' },
  featureIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 12, fontWeight: '700', color: DARK, textAlign: 'center', marginBottom: 4 },
  featureDesc: { fontSize: 10, color: LIGHT_GRAY, textAlign: 'center', lineHeight: 14 },

  // Footer
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  footerText: { fontSize: 11, color: LIGHT_GRAY },
  footerLink: { fontSize: 11, color: BLUE, fontWeight: '600' },
});
