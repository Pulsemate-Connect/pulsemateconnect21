// ─────────────────────────────────────────────────────────────────────────────
//  BookingScreen — PulseMate Connect  |  Appointment Booking (Redesign)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Animated,
  Dimensions, StatusBar, ToastAndroid, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  initiatePayment, verifyPayment, getPatientProfile,
  getAvailableSlots, getBookingStatus,
} from '../api/patient';

const { width: W } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const BLUE       = '#2563EB';
const BLUE_L     = '#EFF6FF';
const BLUE_D     = '#1D4ED8';
const GREEN      = '#16A34A';
const GREEN_L    = '#DCFCE7';
const GREEN_DOT  = '#22C55E';
const WHITE      = '#FFFFFF';
const SLATE      = '#0F172A';
const SLATE_6    = '#475569';
const MUTED      = '#94A3B8';
const BORDER     = '#E2E8F0';
const BG         = '#F8FAFC';
const CARD       = '#FFFFFF';
const RED        = '#EF4444';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const showToast = (msg) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
};

// ── "For Whom" options ────────────────────────────────────────────────────────
const FOR_WHOM_OPTIONS = [
  { key: 'myself',  label: 'Myself' },
  { key: 'family',  label: 'Family Member' },
  { key: 'friend',  label: 'Friend' },
  { key: 'others',  label: 'Others' },
];

// ── Success Overlay ───────────────────────────────────────────────────────────
function SuccessOverlay({ visible, doctorName, date, slot, queueNumber, onView, isFree }) {
  const scaleA = useRef(new Animated.Value(0)).current;
  const fadeA  = useRef(new Animated.Value(0)).current;
  const checkA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleA, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
          Animated.timing(fadeA,  { toValue: 1, duration: 280, useNativeDriver: true }),
        ]),
        Animated.spring(checkA, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[so.overlay, { opacity: fadeA }]}>
      <Animated.View style={[so.card, { transform: [{ scale: scaleA }] }]}>
        <Animated.View style={[so.checkCircle, { transform: [{ scale: checkA }] }]}>
          <View style={[so.checkInner, isFree && { backgroundColor: GREEN }]}>
            <Ionicons name={isFree ? 'gift' : 'checkmark'} size={36} color={WHITE} />
          </View>
        </Animated.View>
        <Text style={so.title}>{isFree ? '🎉 First Booking Free!' : 'Booking Confirmed!'}</Text>
        <Text style={so.sub}>{isFree ? 'Your appointment is confirmed at no charge.' : 'Your appointment has been successfully booked.'}</Text>
        <View style={so.detailBox}>
          <View style={so.detailRow}>
            <Ionicons name="person" size={13} color={BLUE} />
            <Text style={so.detailLabel}>Doctor</Text>
            <Text style={so.detailVal}>Dr. {doctorName}</Text>
          </View>
          <View style={so.divider} />
          <View style={so.detailRow}>
            <Ionicons name="calendar" size={13} color={GREEN} />
            <Text style={so.detailLabel}>Date</Text>
            <Text style={so.detailVal}>{fmtDate(date)}{slot ? ` · ${fmt12(slot)}` : ''}</Text>
          </View>
          {queueNumber && (
            <>
              <View style={so.divider} />
              <View style={so.detailRow}>
                <Ionicons name="people" size={13} color={BLUE} />
                <Text style={so.detailLabel}>Queue Token</Text>
                <Text style={[so.detailVal, { color: BLUE, fontWeight: '800' }]}>#{queueNumber}</Text>
              </View>
            </>
          )}
        </View>
        <TouchableOpacity style={so.btn} onPress={onView} activeOpacity={0.88}>
          <Text style={so.btnText}>View My Appointments</Text>
          <Ionicons name="arrow-forward" size={16} color={WHITE} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const so = StyleSheet.create({
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.75)', zIndex: 200, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:       { backgroundColor: WHITE, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%' },
  checkCircle:{ width: 88, height: 88, borderRadius: 44, backgroundColor: GREEN_L, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  checkInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 22, fontWeight: '800', color: SLATE, marginBottom: 6, textAlign: 'center' },
  sub:        { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  detailBox:  { width: '100%', backgroundColor: BG, borderRadius: 14, padding: 4, marginBottom: 20 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  detailLabel:{ fontSize: 12, color: MUTED, flex: 1 },
  detailVal:  { fontSize: 13, fontWeight: '700', color: SLATE },
  divider:    { height: 1, backgroundColor: BORDER, marginHorizontal: 12 },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 15, width: '100%', justifyContent: 'center' },
  btnText:    { fontSize: 15, fontWeight: '800', color: WHITE },
});

// ── Main BookingScreen ────────────────────────────────────────────────────────
export default function BookingScreen({ route, navigation }) {
  const { doctorId, clinicId, doctorName, clinicName, fee, specialization } = route.params || {};
  const insets = useSafeAreaInsets();

  // ── UI State ────────────────────────────────────────────────────────────────
  const [forWhom,       setForWhom]       = useState('myself');
  const [visitType,     setVisitType]     = useState('OFFLINE'); // OFFLINE | ONLINE
  const [date,          setDate]          = useState('');
  const [session,       setSession]       = useState(''); // 'morning' | 'evening'
  const [slot,          setSlot]          = useState('');
  const [notes,         setNotes]         = useState('');
  const [notesFocused,  setNotesFocused]  = useState(false);

  // ── Data / async state ──────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [patient,         setPatient]         = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [success,         setSuccess]         = useState(false);
  const [bookedAppt,      setBookedAppt]      = useState(null);
  const [isFreeBooking,   setIsFreeBooking]   = useState(false);
  // Separate flag to track whether the CONFIRMED booking was free — used by
  // SuccessOverlay. We must not mutate isFreeBooking before setSuccess(true)
  // because SuccessOverlay reads isFree={isFreeBooking} synchronously.
  const [confirmedIsFree, setConfirmedIsFree] = useState(false);
  const [slots,           setSlots]           = useState([]);
  const [slotsLoading,    setSlotsLoading]    = useState(false);
  const [slotsSource,     setSlotsSource]     = useState('none');

  // ── Build date strip (next 14 days) ─────────────────────────────────────────
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key:        d.toISOString().split('T')[0],
      weekday:    d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day:        d.getDate(),
      month:      d.toLocaleDateString('en-IN', { month: 'short' }),
      isToday:    i === 0,
      isTomorrow: i === 1,
    };
  });

  // ── Focus effect: handle payment return + profile fetch ──────────────────────
  useFocusEffect(
    useCallback(() => {
      const paymentResult = route.params?.paymentResult;
      if (paymentResult?.success && paymentResult?.appointment) {
        setConfirmedIsFree(false); // paid flow — never free
        setBookedAppt(paymentResult.appointment);
        setSuccess(true);
        navigation.setParams({ paymentResult: undefined });
        return;
      }
      const check = async () => {
        try {
          const [profileRes, statusRes] = await Promise.all([
            getPatientProfile(),
            getBookingStatus().catch(() => null),
          ]);
          const u = profileRes.data.data.user;
          setPatient(u);
          const pp = u?.patientProfile;
          setProfileComplete(!!(u?.name && pp?.gender && pp?.emergencyContact));
          const status = statusRes?.data?.data;
          if (status) {
            if (__DEV__) {
              console.log('[Booking] booking-status response', {
                userId: u?.id,
                freeBookingUsed: status.freeBookingUsed,
                bookingFee: status.bookingFee,
                isFreeBooking: !status.freeBookingUsed,
              });
            }
            setIsFreeBooking(!status.freeBookingUsed);
          } else {
            // If the call failed, default to free (safer — matches web behaviour)
            setIsFreeBooking(true);
          }
        } catch {}
      };
      check();
    }, [route.params?.paymentResult])
  );

  // ── Fetch slots when date changes ────────────────────────────────────────────
  useEffect(() => {
    if (!date || !doctorId || !clinicId) return;
    setSlotsLoading(true);
    setSlot('');
    setSession('');
    setSlots([]);
    getAvailableSlots(doctorId, { clinicId, date })
      .then((r) => {
        const data = r.data.data;
        setSlotsSource(data.source || 'none');
        if (Array.isArray(data.slots) && data.slots.length > 0) {
          setSlots(data.slots);
        } else {
          setSlots([]);
          setSlotsSource('none');
        }
      })
      .catch(() => { setSlots([]); setSlotsSource('none'); })
      .finally(() => setSlotsLoading(false));
  }, [date, doctorId, clinicId]);

  // ── Slot session helpers ─────────────────────────────────────────────────────
  // Morning: before 14:00  |  Evening: 16:00+
  const morningSlots = slots.filter(s => {
    const h = parseInt(s.time?.split(':')[0] ?? '0', 10);
    return h < 14 && s.available;
  });
  const eveningSlots = slots.filter(s => {
    const h = parseInt(s.time?.split(':')[0] ?? '0', 10);
    return h >= 16 && s.available;
  });

  const handleSessionSelect = (sess) => {
    setSession(sess);
    if (sess === 'morning' && morningSlots.length > 0) {
      setSlot(morningSlots[0].time);
    } else if (sess === 'evening' && eveningSlots.length > 0) {
      setSlot(eveningSlots[0].time);
    } else {
      setSlot('');
    }
  };

  // ── Booking handler ───────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!profileComplete) {
      Alert.alert(
        'Complete Your Profile First',
        'Please add your name, gender, and emergency contact before booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update Profile', onPress: () => navigation.navigate('ProfileWizard', { returnTo: 'Booking' }) },
        ]
      );
      return;
    }
    if (!date) { Alert.alert('Select Date', 'Please pick an appointment date.'); return; }
    setLoading(true);
    try {
      if (__DEV__) {
        console.log('[Booking] Initiating payment', {
          userId: patient?.id,
          doctorId,
          clinicId,
          date,
          isFreeBookingExpected: isFreeBooking,
        });
      }

      const initRes = await initiatePayment({
        doctorId, clinicId,
        appointmentType: visitType,
        appointmentDate: date,
        slotTime:        slot     || undefined,
        symptoms:        notes.trim() || undefined,
      });
      const { appointmentId, order, devMode, isFree, appointment: freeAppt } = initRes.data.data;

      if (__DEV__) {
        console.log('[Booking] /payments/initiate response', {
          isFree,
          appointmentId,
          devMode,
          orderId: order?.id,
          amount: initRes.data.data.amount,
        });
      }

      if (isFree) {
        // Fix: capture the free state in a separate flag BEFORE clearing isFreeBooking.
        // SuccessOverlay reads isFree={confirmedIsFree}, not isFreeBooking, so
        // setting isFreeBooking=false here won't affect the overlay display.
        setConfirmedIsFree(true);
        setIsFreeBooking(false); // mark consumed so banner disappears on re-entry
        setBookedAppt(freeAppt || { queueNumber: null });
        setSuccess(true);
        return;
      }

      if (devMode || order?.id?.startsWith('order_dev_')) {
        const verifyRes = await verifyPayment({
          appointmentId,
          razorpayOrderId:   order.id,
          razorpayPaymentId: `pay_dev_${Date.now()}`,
          razorpaySignature: 'dev_sig',
        });
        setConfirmedIsFree(false);
        setBookedAppt(verifyRes.data.data.appointment);
        setSuccess(true);
      } else {
        setLoading(false);
        navigation.navigate('Razorpay', {
          appointmentId,
          orderId:       order.id,
          orderAmount:   order.amount,
          orderCurrency: order.currency || 'INR',
          keyId:         order.key || initRes.data.data.key,
          doctorName:    doctorName || 'Doctor',
          patientName:   patient?.name || '',
          patientEmail:  patient?.email || '',
          patientMobile: patient?.mobile || '',
        });
        return;
      }
    } catch (err) {
      if (__DEV__) {
        console.error('[Booking] Error', err.response?.data || err.message);
      }
      Alert.alert('Booking Failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const consultFee = fee || 0;
  const initials   = (doctorName || 'D').charAt(0).toUpperCase();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={SLATE} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Book Appointment</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {/* ── Scrollable body ── */}
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Doctor Card ── */}
        <View style={s.doctorCard}>
          <View style={s.doctorRow}>
            {/* Avatar */}
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            {/* Info */}
            <View style={s.doctorInfo}>
              <View style={s.doctorNameRow}>
                <Text style={s.doctorName}>Dr. {doctorName || 'Doctor'}</Text>
                <Ionicons name="checkmark-circle" size={16} color={BLUE} style={{ marginLeft: 4 }} />
              </View>
              <Text style={s.doctorSpec}>{specialization || 'General Physician'}</Text>
              <Text style={s.doctorClinic}>{clinicName || 'Clinic'}</Text>
            </View>
            {/* Distance badge */}
            <View style={s.distanceBadge}>
              <Ionicons name="location-outline" size={11} color={BLUE} />
              <Text style={s.distanceText}>Nearby</Text>
            </View>
          </View>
          {/* Rating row */}
          <View style={s.doctorMeta}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={s.ratingText}>4.8</Text>
            <Text style={s.reviewsText}>(240 reviews)</Text>
          </View>
          {/* Fee + Availability row */}
          <View style={s.feeRow}>
            <View style={s.availableRow}>
              <View style={s.greenDot} />
              <Text style={s.availableText}>Available Today</Text>
            </View>
          </View>
        </View>

        {/* ── Section 1: For Whom ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>1. For Whom You Are Booking?</Text>
          <View style={s.chipRow}>
            {FOR_WHOM_OPTIONS.map((opt) => {
              const active = forWhom === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => {
                    if (opt.key !== 'myself') {
                      showToast('Coming soon');
                      return;
                    }
                    setForWhom(opt.key);
                  }}
                  activeOpacity={0.8}
                >
                  {active && (
                    <Ionicons name="checkmark-circle" size={14} color={BLUE} style={{ marginRight: 5 }} />
                  )}
                  <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section 2: Visit Type ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>2. Select Visit Type</Text>
          <View style={s.visitTypeRow}>
            {[
              { key: 'OFFLINE', icon: 'business', label: 'Clinic Visit' },
              { key: 'ONLINE',  icon: 'videocam',  label: 'Video Consultation' },
            ].map((vt) => {
              const active = visitType === vt.key;
              return (
                <TouchableOpacity
                  key={vt.key}
                  style={[s.visitCard, active && s.visitCardActive]}
                  onPress={() => setVisitType(vt.key)}
                  activeOpacity={0.85}
                >
                  {active && (
                    <View style={s.visitCheck}>
                      <Ionicons name="checkmark" size={10} color={WHITE} />
                    </View>
                  )}
                  <Ionicons name={vt.icon} size={28} color={active ? BLUE : MUTED} />
                  <Text style={[s.visitLabel, active && s.visitLabelActive]}>{vt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section 3: Select Date ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>3. Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateStrip}>
            {days.map((d) => {
              const active = date === d.key;
              let dayLabel = d.weekday;
              if (d.isToday)    dayLabel = 'Today';
              if (d.isTomorrow) dayLabel = 'Tomorrow';
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[s.dateCell, active && s.dateCellActive]}
                  onPress={() => setDate(d.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.dateDayName, active && s.dateTextActive]}>{dayLabel}</Text>
                  <Text style={[s.dateNum, active && s.dateTextActive]}>{d.day}</Text>
                  <Text style={[s.dateMonth, active && s.dateTextActive]}>{d.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Section 4: Select Session ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>4. Select Session</Text>
          {!date ? (
            <Text style={s.selectDateHint}>Please select a date first</Text>
          ) : slotsLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={BLUE} />
              <Text style={s.loadingText}>Checking availability...</Text>
            </View>
          ) : (
            <>
              <View style={s.sessionRow}>
                {/* Morning Session */}
                {(() => {
                  const active = session === 'morning';
                  const hasSlots = morningSlots.length > 0;
                  return (
                    <TouchableOpacity
                      style={[s.sessionCard, active && s.sessionCardActive, !hasSlots && s.sessionCardDisabled]}
                      onPress={() => hasSlots && handleSessionSelect('morning')}
                      activeOpacity={hasSlots ? 0.85 : 1}
                    >
                      {active && (
                        <View style={s.sessionCheck}>
                          <Ionicons name="checkmark" size={10} color={WHITE} />
                        </View>
                      )}
                      <Ionicons name="sunny" size={28} color={active ? BLUE : (hasSlots ? '#F59E0B' : MUTED)} />
                      <Text style={[s.sessionLabel, active && s.sessionLabelActive]}>Morning Session</Text>
                      <Text style={[s.sessionTime, active && s.sessionTimeActive]}>8:00 AM – 2:00 PM</Text>
                      {!hasSlots && <Text style={s.sessionNA}>Not available</Text>}
                      {hasSlots && slot && session === 'morning' && (
                        <Text style={s.sessionSlotHint}>Slot: {fmt12(slot)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })()}
                {/* Evening Session */}
                {(() => {
                  const active = session === 'evening';
                  const hasSlots = eveningSlots.length > 0;
                  return (
                    <TouchableOpacity
                      style={[s.sessionCard, active && s.sessionCardActive, !hasSlots && s.sessionCardDisabled]}
                      onPress={() => hasSlots && handleSessionSelect('evening')}
                      activeOpacity={hasSlots ? 0.85 : 1}
                    >
                      {active && (
                        <View style={s.sessionCheck}>
                          <Ionicons name="checkmark" size={10} color={WHITE} />
                        </View>
                      )}
                      <Ionicons name="moon" size={28} color={active ? BLUE : (hasSlots ? '#6366F1' : MUTED)} />
                      <Text style={[s.sessionLabel, active && s.sessionLabelActive]}>Evening Session</Text>
                      <Text style={[s.sessionTime, active && s.sessionTimeActive]}>4:00 PM – 9:00 PM</Text>
                      {!hasSlots && <Text style={s.sessionNA}>Not available</Text>}
                      {hasSlots && slot && session === 'evening' && (
                        <Text style={s.sessionSlotHint}>Slot: {fmt12(slot)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })()}
              </View>
              {slots.length === 0 && (
                <Text style={s.noSlotsText}>No slots configured for this day. Try a different date.</Text>
              )}
              <View style={s.queueInfo}>
                <Ionicons name="information-circle-outline" size={14} color={MUTED} />
                <Text style={s.queueInfoText}>Exact queue number will be assigned on the appointment day.</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Section 5: Appointment Notes ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>5. Appointment Notes <Text style={s.optional}>(Optional)</Text></Text>
          <View style={[s.notesWrap, notesFocused && s.notesFocused]}>
            <TextInput
              style={s.notesInput}
              value={notes}
              onChangeText={(t) => t.length <= 200 && setNotes(t)}
              placeholder="Add any symptoms or notes for the doctor..."
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
              maxLength={200}
            />
          </View>
          <Text style={s.charCount}>{notes.length}/200</Text>
        </View>

        {/* ── Payment Summary Card ── */}
        <View style={[s.section, isFreeBooking && s.sectionFree]}>
          <Text style={s.sectionTitle}>6. Payment Summary</Text>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Platform Booking Fee</Text>
            {isFreeBooking ? (
              <View style={s.payFreeRight}>
                <Text style={s.payStrike}>₹10</Text>
                <Text style={s.payFree}>FREE</Text>
              </View>
            ) : (
              <Text style={s.payAmount}>₹10</Text>
            )}
          </View>
          <View style={s.payDivider} />
          <View style={s.payRow}>
            <Text style={[s.payLabel, { fontWeight: '700', color: SLATE }]}>Pay Now</Text>
            <Text style={[s.payAmount, isFreeBooking && { color: GREEN }]}>
              {isFreeBooking ? '₹0' : '₹10'}
            </Text>
          </View>
          {isFreeBooking && (
            <Text style={s.payFreeNote}>🎁 First booking benefit applied automatically</Text>
          )}
        </View>

        {/* ── Free booking banner ── */}
        {isFreeBooking && (
          <View style={s.freeBanner}>
            <Text style={s.freeBannerEmoji}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.freeBannerTitle}>First Booking Free!</Text>
              <Text style={s.freeBannerSub}>Your first appointment on PulseMate is completely free. No payment required.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Sticky Bottom Bar ── */}
      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.confirmBtn, (loading || !date) && s.confirmBtnDisabled, isFreeBooking && s.confirmBtnFree]}
          onPress={handleBook}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={s.confirmBtnText}>
              {isFreeBooking ? '🎉 Confirm Free Booking' : '💳 Pay ₹10 & Confirm'}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={s.noCharge}>
          {isFreeBooking ? 'No payment required — first booking is free' : 'Platform booking fee: ₹10 via Razorpay'}
        </Text>
      </View>

      {/* ── Success overlay ── */}
      <SuccessOverlay
        visible={success}
        doctorName={doctorName}
        date={date}
        slot={slot}
        queueNumber={bookedAppt?.queueNumber}
        isFree={confirmedIsFree}
        onView={() => navigation.navigate('AppointmentsTab')}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },

  // Header
  headerSafe:  { backgroundColor: WHITE },
  header:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    backgroundColor: WHITE,
  },
  backBtn:     {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: SLATE, letterSpacing: -0.3 },

  // Scroll
  scroll: { padding: 16, gap: 14 },

  // Doctor Card
  doctorCard:  {
    backgroundColor: CARD, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  doctorRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatarCircle:{
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { fontSize: 22, fontWeight: '800', color: BLUE },
  doctorInfo:  { flex: 1 },
  doctorNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  doctorName:  { fontSize: 16, fontWeight: '700', color: SLATE },
  doctorSpec:  { fontSize: 13, color: SLATE_6, marginBottom: 2 },
  doctorClinic:{ fontSize: 12, color: MUTED },
  distanceBadge:{
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: BLUE_L, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  distanceText:{ fontSize: 11, fontWeight: '600', color: BLUE },
  doctorMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingText:  { fontSize: 13, fontWeight: '700', color: SLATE },
  reviewsText: { fontSize: 12, color: MUTED },
  feeRow:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER,
  },
  feeText:     { fontSize: 14, fontWeight: '700', color: SLATE },
  availableRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_DOT },
  availableText:{ fontSize: 13, fontWeight: '600', color: GREEN },

  // Section
  section:     {
    backgroundColor: CARD, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionTitle:{ fontSize: 15, fontWeight: '700', color: SLATE, marginBottom: 14 },
  optional:    { fontSize: 13, fontWeight: '400', color: MUTED },

  // For Whom chips
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:        {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: BG,
  },
  chipActive:  { borderColor: BLUE, backgroundColor: BLUE_L },
  chipText:    { fontSize: 13, fontWeight: '500', color: SLATE_6 },
  chipTextActive:{ color: BLUE, fontWeight: '700' },

  // Visit Type
  visitTypeRow:{ flexDirection: 'row', gap: 12 },
  visitCard:   {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: BG, gap: 8, position: 'relative',
  },
  visitCardActive:{ borderColor: BLUE, backgroundColor: BLUE_L },
  visitCheck:  {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  visitLabel:  { fontSize: 13, fontWeight: '600', color: SLATE_6, textAlign: 'center' },
  visitLabelActive:{ color: BLUE, fontWeight: '700' },

  // Date Strip
  dateStrip:   { gap: 10, paddingRight: 4 },
  dateCell:    {
    width: 62, borderRadius: 14, backgroundColor: BG,
    alignItems: 'center', paddingVertical: 11,
    borderWidth: 1.5, borderColor: BORDER, gap: 2,
  },
  dateCellActive:{
    backgroundColor: BLUE, borderColor: BLUE,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  dateDayName: { fontSize: 10, color: MUTED, fontWeight: '700', textTransform: 'uppercase' },
  dateNum:     { fontSize: 22, fontWeight: '800', color: SLATE },
  dateMonth:   { fontSize: 10, color: MUTED, fontWeight: '600' },
  dateTextActive:{ color: WHITE },

  // Session
  sessionRow:        { flexDirection: 'row', gap: 12, marginBottom: 10 },
  sessionCard:       {
    flex: 1, alignItems: 'center', paddingVertical: 20,
    borderRadius: 12, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: BG, gap: 6, position: 'relative',
  },
  sessionCardActive: { borderColor: BLUE, backgroundColor: BLUE_L },
  sessionCardDisabled:{ opacity: 0.45 },
  sessionCheck:      {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
  },
  sessionLabel:      { fontSize: 13, fontWeight: '600', color: SLATE_6, textAlign: 'center' },
  sessionLabelActive:{ color: BLUE, fontWeight: '700' },
  sessionTime:       { fontSize: 11, color: MUTED, textAlign: 'center' },
  sessionTimeActive: { color: BLUE },
  sessionNA:         { fontSize: 10, color: RED, fontWeight: '600' },
  sessionSlotHint:   { fontSize: 10, color: BLUE, fontWeight: '600' },
  selectDateHint:    { fontSize: 13, color: MUTED, textAlign: 'center', paddingVertical: 16 },
  loadingRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, justifyContent: 'center' },
  loadingText:       { fontSize: 13, color: MUTED },
  noSlotsText:       { fontSize: 12, color: MUTED, textAlign: 'center', marginBottom: 8 },
  queueInfo:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  queueInfoText:     { fontSize: 11, color: MUTED, flex: 1, lineHeight: 16 },

  // Notes
  notesWrap:   {
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, padding: 12, backgroundColor: BG,
  },
  notesFocused:{ borderColor: BLUE, backgroundColor: WHITE },
  notesInput:  { fontSize: 14, color: SLATE, minHeight: 88, lineHeight: 21 },
  charCount:   { fontSize: 11, color: MUTED, textAlign: 'right', marginTop: 4 },

  // Free banner
  freeBanner:  {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: GREEN_L, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  freeBannerEmoji:{ fontSize: 20 },
  freeBannerTitle:{ fontSize: 14, fontWeight: '700', color: '#14532D', marginBottom: 3 },
  freeBannerSub:  { fontSize: 12, color: '#166534', lineHeight: 17 },

  // Payment summary
  sectionFree:   { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  payRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  payLabel:      { fontSize: 13, color: SLATE_6 },
  payAmount:     { fontSize: 14, fontWeight: '700', color: SLATE },
  payFreeRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payStrike:     { fontSize: 12, color: MUTED, textDecorationLine: 'line-through' },
  payFree:       { fontSize: 14, fontWeight: '800', color: GREEN },
  payAtClinic:   { fontSize: 12, color: MUTED, fontStyle: 'italic' },
  payDivider:    { height: 1, backgroundColor: BORDER, marginVertical: 2 },
  payFreeNote:   { fontSize: 12, color: GREEN, marginTop: 8, fontWeight: '600' },

  // Sticky bar
  stickyBar:   {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE, paddingHorizontal: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: BORDER,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 12,
    alignItems: 'center',
  },
  confirmBtn:  {
    width: '100%', backgroundColor: BLUE,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 7,
  },
  confirmBtnFree: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
  },
  confirmBtnDisabled:{ backgroundColor: MUTED, shadowOpacity: 0 },
  confirmBtnText:    { fontSize: 16, fontWeight: '700', color: WHITE },
  noCharge:          { fontSize: 12, color: MUTED, marginTop: 6 },
});
