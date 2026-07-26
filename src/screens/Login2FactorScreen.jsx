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
  ActivityIndicator, Alert, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const LOGO = require('../../assets/logo1.jpeg');

const BG     = '#E8F4FF';
const BLUE   = '#2563EB';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B7280';
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

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.topBar}>
          <View style={s.logoBox}>
            <Image source={LOGO} style={s.logoImg} resizeMode="cover" />
          </View>
        </View>

        <Text style={s.headline}>PulseMate <Text style={s.headlineBlue}>Connect</Text></Text>
        <Text style={s.headlineSub}>Healthcare Platform</Text>

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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 52 },
  topBar:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', marginBottom: 14 },
  logoBox:      { width: 56, height: 56, backgroundColor: WHITE, borderRadius: 18, overflow: 'hidden' },
  logoImg:      { width: '100%', height: '100%' },
  headline:     { fontSize: 26, fontWeight: '900', color: DARK, textAlign: 'center', marginBottom: 2 },
  headlineBlue: { color: BLUE },
  headlineSub:  { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 16 },
  formCard:   { backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 14 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  formIconBox:{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  formTitle:  { fontSize: 14, fontWeight: '800', color: DARK },
  formSub:    { fontSize: 11, color: GRAY, marginTop: 2 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: '#F9FAFB', marginBottom: 10 },
  inputRowFocused: { borderColor: BLUE, backgroundColor: WHITE },
  country:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14 },
  flag:            { fontSize: 18 },
  dialCode:        { fontSize: 14, fontWeight: '700', color: DARK },
  inputDivider:    { width: 1, height: 24, backgroundColor: '#E5E7EB' },
  phoneInput:      { flex: 1, fontSize: 16, fontWeight: '500', color: DARK, paddingHorizontal: 12, paddingVertical: 14 },
  btn:         { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: '800', color: WHITE },
});
