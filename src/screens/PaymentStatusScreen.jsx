// ─────────────────────────────────────────────────────────────────────────────
//  PaymentStatusScreen — PulseMate Connect
//
//  Shown when the user navigates back to the app after a Razorpay payment.
//  Polls the backend until payment is confirmed or times out.
//  Matches the web PaymentPage.jsx polling UX.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BLUE    = '#2563EB';
const BLUE_L  = '#EFF6FF';
const GREEN   = '#16A34A';
const GREEN_L = '#DCFCE7';
const AMBER   = '#D97706';
const AMBER_L = '#FEF3C7';
const RED     = '#DC2626';
const RED_L   = '#FEE2E2';
const WHITE   = '#FFFFFF';
const SLATE   = '#0F172A';
const MUTED   = '#94A3B8';
const BG      = '#F8FAFC';

const POLL_INTERVAL = 3000;   // 3 sec
const POLL_TIMEOUT  = 60000;  // 60 sec

export default function PaymentStatusScreen({ route, navigation }) {
  const { appointmentId, orderId, amount, doctorName, clinicName, appointmentDate } = route.params || {};

  const [pollState, setPollState] = useState('POLLING'); // POLLING | SUCCESS | FAILED | TIMEOUT
  const [pollSeconds, setPollSeconds] = useState(0);
  const [payment, setPayment] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const pollRef     = useRef(null);
  const startRef    = useRef(Date.now());
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;

  // Pulse animation for the loading icon
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const checkPayment = useCallback(async () => {
    const elapsed = Date.now() - startRef.current;
    setPollSeconds(Math.floor(elapsed / 1000));

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: Math.min(elapsed / POLL_TIMEOUT, 1),
      duration: 500,
      useNativeDriver: false,
    }).start();

    if (elapsed >= POLL_TIMEOUT) {
      stopPolling();
      setPollState('TIMEOUT');
      return;
    }

    try {
      const endpoint = orderId
        ? `/payments/status/${orderId}`
        : `/payments/appointment/${appointmentId}`;
      const res = await api.get(endpoint);
      const p = res.data.data?.payment;
      if (p) setPayment(p);

      if (p?.status === 'PAID') {
        stopPolling();
        setPollState('SUCCESS');
      } else if (p?.status === 'FAILED') {
        stopPolling();
        setPollState('FAILED');
      }
    } catch {
      // Network blip — keep polling
    }
  }, [appointmentId, orderId, stopPolling, progressAnim]);

  const startPolling = useCallback(() => {
    stopPolling();
    startRef.current = Date.now();
    setPollSeconds(0);
    setPollState('POLLING');
    progressAnim.setValue(0);
    checkPayment(); // immediate first check
    pollRef.current = setInterval(checkPayment, POLL_INTERVAL);
  }, [checkPayment, stopPolling, progressAnim]);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, []);

  const handleViewAppointments = () => {
    navigation.reset({ index: 0, routes: [{ name: 'AppointmentsTab' }] });
  };

  const handleRetry = () => {
    setRetrying(true);
    startPolling();
    setTimeout(() => setRetrying(false), 1000);
  };

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ── Renders ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={SLATE} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment Status</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={s.content}>

        {/* Appointment summary card */}
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View style={s.summaryAvatar}>
              <Text style={s.summaryAvatarText}>{(doctorName || 'D').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.summaryInfo}>
              <Text style={s.summaryDoctor}>{doctorName ? `Dr. ${doctorName}` : 'Doctor'}</Text>
              <Text style={s.summaryClinic}>{clinicName || 'Clinic'}</Text>
              {appointmentDate && <Text style={s.summaryDate}>📅 {fmtDate(appointmentDate)}</Text>}
            </View>
            <View style={s.summaryAmount}>
              <Text style={s.summaryAmountLabel}>Amount</Text>
              <Text style={s.summaryAmountVal}>₹{amount || 10}</Text>
            </View>
          </View>
        </View>

        {/* ── POLLING state ── */}
        {pollState === 'POLLING' && (
          <View style={s.stateCard}>
            <Animated.View style={[s.stateIconWrap, { backgroundColor: AMBER_L, transform: [{ scale: pulseAnim }] }]}>
              <ActivityIndicator size="large" color={AMBER} />
            </Animated.View>
            <Text style={[s.stateTitle, { color: AMBER }]}>Confirming Payment...</Text>
            <Text style={s.stateSub}>
              ⚠️ Do not go back or pay again.{'\n'}
              Your payment is being verified.
            </Text>

            {/* Progress bar */}
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, {
                width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }),
                backgroundColor: AMBER,
              }]} />
            </View>
            <Text style={s.pollTimer}>Checking... ({pollSeconds}s)</Text>
          </View>
        )}

        {/* ── SUCCESS state ── */}
        {pollState === 'SUCCESS' && (
          <View style={[s.stateCard, { borderColor: GREEN, borderWidth: 1.5 }]}>
            <View style={[s.stateIconWrap, { backgroundColor: GREEN_L }]}>
              <Ionicons name="checkmark-circle" size={52} color={GREEN} />
            </View>
            <Text style={[s.stateTitle, { color: GREEN }]}>Payment Confirmed! ✅</Text>
            <Text style={s.stateSub}>Your appointment is confirmed.</Text>
            {payment?.razorpayPaymentId && !payment.razorpayPaymentId.startsWith('dev_') && (
              <View style={s.txnBox}>
                <Ionicons name="receipt-outline" size={12} color={MUTED} />
                <Text style={s.txnText} numberOfLines={1}>{payment.razorpayPaymentId}</Text>
              </View>
            )}
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: GREEN }]} onPress={handleViewAppointments} activeOpacity={0.88}>
              <Ionicons name="calendar-outline" size={18} color={WHITE} />
              <Text style={s.primaryBtnText}>View My Appointments</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── FAILED state ── */}
        {pollState === 'FAILED' && (
          <View style={[s.stateCard, { borderColor: RED, borderWidth: 1.5 }]}>
            <View style={[s.stateIconWrap, { backgroundColor: RED_L }]}>
              <Ionicons name="close-circle" size={52} color={RED} />
            </View>
            <Text style={[s.stateTitle, { color: RED }]}>Payment Failed</Text>
            <Text style={s.stateSub}>
              Your payment could not be processed.{'\n'}
              No money has been deducted. Please try again.
            </Text>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: RED }]} onPress={() => navigation.goBack()} activeOpacity={0.88}>
              <Ionicons name="refresh" size={18} color={WHITE} />
              <Text style={s.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TIMEOUT state ── */}
        {pollState === 'TIMEOUT' && (
          <View style={[s.stateCard, { borderColor: AMBER, borderWidth: 1.5 }]}>
            <View style={[s.stateIconWrap, { backgroundColor: AMBER_L }]}>
              <Ionicons name="time-outline" size={52} color={AMBER} />
            </View>
            <Text style={[s.stateTitle, { color: AMBER }]}>Payment Pending ⏳</Text>
            <Text style={s.stateSub}>
              We could not automatically confirm your payment.{'\n\n'}
              If money was deducted from your account,{' '}
              <Text style={{ fontWeight: '800', color: SLATE }}>do not pay again</Text>
              {' '}— your appointment will be confirmed within 24 hours once Razorpay sends us the confirmation.
            </Text>
            <View style={s.timeoutBtns}>
              <TouchableOpacity style={[s.secondaryBtn, { borderColor: AMBER }]} onPress={handleRetry} disabled={retrying} activeOpacity={0.85}>
                {retrying ? <ActivityIndicator size="small" color={AMBER} /> : (
                  <>
                    <Ionicons name="refresh" size={16} color={AMBER} />
                    <Text style={[s.secondaryBtnText, { color: AMBER }]}>Check Again</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: BLUE, flex: 1 }]} onPress={handleViewAppointments} activeOpacity={0.88}>
                <Text style={s.primaryBtnText}>My Appointments</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: WHITE },
  backBtn:     { width: 38, height: 38, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: SLATE },
  content:     { flex: 1, padding: 16, gap: 14 },

  // Summary card
  summaryCard:   { backgroundColor: WHITE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center' },
  summaryAvatarText: { fontSize: 20, fontWeight: '800', color: BLUE },
  summaryInfo:   { flex: 1 },
  summaryDoctor: { fontSize: 14, fontWeight: '700', color: SLATE },
  summaryClinic: { fontSize: 12, color: MUTED, marginTop: 1 },
  summaryDate:   { fontSize: 11, color: MUTED, marginTop: 2 },
  summaryAmount: { alignItems: 'flex-end' },
  summaryAmountLabel: { fontSize: 10, color: MUTED, fontWeight: '600', textTransform: 'uppercase' },
  summaryAmountVal:   { fontSize: 20, fontWeight: '800', color: SLATE },

  // State card
  stateCard:     { backgroundColor: WHITE, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  stateIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stateTitle:    { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateSub:      { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  // Progress bar
  progressTrack: { width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progressFill:  { height: '100%', borderRadius: 3 },
  pollTimer:     { fontSize: 11, color: MUTED, marginTop: 4 },

  // Transaction ID
  txnBox:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%' },
  txnText:  { fontSize: 11, color: MUTED, flex: 1, fontFamily: 'monospace' },

  // Buttons
  primaryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, width: '100%' },
  primaryBtnText:  { fontSize: 15, fontWeight: '700', color: WHITE },
  timeoutBtns:     { flexDirection: 'row', gap: 10, width: '100%' },
  secondaryBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  secondaryBtnText:{ fontSize: 14, fontWeight: '700' },
});
