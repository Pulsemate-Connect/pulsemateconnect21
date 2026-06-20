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
  getAvailableSlots, getBookingStatus, getClinicSessions,
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

// ── Symptom tags ──────────────────────────────────────────────────────────────
const SYMPTOM_TAGS = ['Fever','Headache','Back Pain','Cough','Fatigue','Chest Pain','Stomach Ache','Dizziness'];

// ── Mock saved family members ─────────────────────────────────────────────────
const SAVED_FAMILY = [
  { id: 'f1', name: 'Priya Sharma',  relation: 'Spouse',  initials: 'PS', color: '#DBEAFE', textColor: '#1D4ED8' },
  { id: 'f2', name: 'Raj Sharma',    relation: 'Father',  initials: 'RS', color: '#D1FAE5', textColor: '#065F46' },
  { id: 'f3', name: 'Meera Sharma',  relation: 'Mother',  initials: 'MS', color: '#EDE9FE', textColor: '#5B21B6' },
];

// ── Progress stepper ──────────────────────────────────────────────────────────
function ProgressStepper({ step }) {
  const steps = ['For Whom','Visit','Date','Session','Notes'];
  return (
    <View style={ps.row}>
      {steps.map((label, i) => {
        const done   = step > i + 1;
        const active = step === i + 1;
        return (
          <View key={label} style={ps.item}>
            <View style={[ps.dot, done ? ps.dotDone : active ? ps.dotActive : ps.dotOff]}>
              {done
                ? <Ionicons name="checkmark" size={9} color={WHITE} />
                : <Text style={[ps.num, active ? ps.numActive : ps.numOff]}>{i + 1}</Text>}
            </View>
            <Text style={[ps.label, done ? ps.labelDone : active ? ps.labelActive : ps.labelOff]} numberOfLines={1}>
              {label}
            </Text>
            {i < steps.length - 1 && <View style={[ps.line, done ? ps.lineDone : ps.lineOff]} />}
          </View>
        );
      })}
    </View>
  );
}
const ps = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  item:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:       { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: BLUE },
  dotDone:   { backgroundColor: GREEN_DOT },
  dotOff:    { backgroundColor: '#E5E7EB' },
  num:       { fontSize: 9, fontWeight: '800' },
  numActive: { color: WHITE },
  numOff:    { color: MUTED },
  label:     { fontSize: 9, fontWeight: '600', maxWidth: 38 },
  labelActive:{ color: BLUE },
  labelDone: { color: GREEN_DOT },
  labelOff:  { color: MUTED },
  line:      { width: 14, height: 1.5, borderRadius: 1 },
  lineDone:  { backgroundColor: GREEN_DOT },
  lineOff:   { backgroundColor: '#E5E7EB' },
});

// ── "For Whom" options ────────────────────────────────────────────────────────
const FOR_WHOM_OPTIONS = [
  { key: 'myself',  label: 'Myself',        icon: 'person-outline'       },
  { key: 'family',  label: 'Family Member', icon: 'people-outline'       },
  { key: 'friend',  label: 'Friend',        icon: 'person-add-outline'   },
  { key: 'others',  label: 'Others',        icon: 'ellipsis-horizontal-circle-outline' },
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
  const [visitType,     setVisitType]     = useState('OFFLINE');
  const [date,          setDate]          = useState('');
  const [session,       setSession]       = useState('');
  const [slot,          setSlot]          = useState('');
  const [notes,         setNotes]         = useState('');
  const [notesFocused,  setNotesFocused]  = useState(false);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [selectedFamily,   setSelectedFamily]   = useState(null); // id of selected saved member

  // Family member state
  const [familyName,        setFamilyName]        = useState('');
  const [familyRelationship,setFamilyRelationship] = useState('');
  const [familyMobile,      setFamilyMobile]      = useState('');
  const [saveFamilyMember,  setSaveFamilyMember]  = useState(true);

  // Pulsing dot animation
  const pulseA = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1.8, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseA, { toValue: 1,   duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  // Derive stepper step
  const stepperStep = !date ? (forWhom && visitType ? 3 : visitType ? 2 : 1)
    : !session ? 4 : notes.length > 0 ? 5 : 4;

  // ── Data / async state ──────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [patient,         setPatient]         = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [success,         setSuccess]         = useState(false);
  const [bookedAppt,      setBookedAppt]      = useState(null);
  const [isFreeBooking,   setIsFreeBooking]   = useState(false);
  const [slots,           setSlots]           = useState([]);
  const [slotsLoading,    setSlotsLoading]    = useState(false);
  const [slotsSource,     setSlotsSource]     = useState('none');
  const [clinicSessions,  setClinicSessions]  = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

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
          if (status) setIsFreeBooking(!status.freeBookingUsed);
        } catch {}
      };
      check();
    }, [route.params?.paymentResult])
  );

  // ── Fetch clinic sessions when clinicId is available ────────────────────────
  useEffect(() => {
    if (!clinicId) return;
    setSessionsLoading(true);
    getClinicSessions(clinicId)
      .then((r) => setClinicSessions(r.data.data.sessions || []))
      .catch(() => setClinicSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [clinicId]);

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
  // Group slots by clinic session using time ranges from clinicSessions
  const getSlotsForSession = (sess) => {
    if (!sess) return [];
    const [sh, sm] = sess.startTime.split(':').map(Number);
    const [eh, em] = sess.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;
    return slots.filter((s) => {
      const [hh, mm] = s.time.split(':').map(Number);
      const slotMins = hh * 60 + mm;
      return slotMins >= startMins && slotMins < endMins;
    });
  };

  // Fallback: if no clinic sessions configured, derive from slots
  const morningSlots = slots.filter(s => { const h = parseInt(s.time?.split(':')[0] ?? '0', 10); return h < 14 && s.available; });
  const eveningSlots = slots.filter(s => { const h = parseInt(s.time?.split(':')[0] ?? '0', 10); return h >= 16 && s.available; });

  const handleSessionSelect = (sessKeyOrId) => {
    setSession(sessKeyOrId);
    setSlot('');
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
      const initRes = await initiatePayment({
        doctorId, clinicId,
        appointmentType: visitType,
        appointmentDate: date,
        slotTime:        slot     || undefined,
        symptoms:        notes.trim() || undefined,
      });
      const { appointmentId, order, devMode, isFree, appointment: freeAppt } = initRes.data.data;

      if (isFree) {
        setIsFreeBooking(false);
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

      {/* ── Progress Stepper ── */}
      <ProgressStepper step={stepperStep} />

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
            <TouchableOpacity style={s.feeTouchRow} onPress={() => setShowFeeBreakdown(v => !v)} activeOpacity={0.8}>
              <Text style={s.feeText}>₹{consultFee} Consultation Fee</Text>
              <Ionicons name={showFeeBreakdown ? 'chevron-up' : 'chevron-down'} size={14} color={MUTED} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={s.availableRow}>
              <View style={s.pulseWrap}>
                <Animated.View style={[s.pulseDotRing, { transform: [{ scale: pulseA }] }]} />
                <View style={s.greenDot} />
              </View>
              <Text style={s.availableText}>Available Today</Text>
            </View>
          </View>
          {showFeeBreakdown && (
            <View style={s.feeBreakdown}>
              {[
                { label: 'Consultation Fee', amount: consultFee },
                { label: 'Platform Fee',     amount: 0          },
                { label: 'GST (18%)',        amount: 0          },
              ].map((row, i) => (
                <View key={row.label} style={[s.feeBreakRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: BORDER }]}>
                  <Text style={s.feeBreakLabel}>{row.label}</Text>
                  <Text style={[s.feeBreakAmount, row.amount === 0 && { color: GREEN }]}>
                    {row.amount === 0 ? 'FREE' : `₹${row.amount}`}
                  </Text>
                </View>
              ))}
              <View style={s.feeTotalRow}>
                <Text style={s.feeTotalLabel}>Total Payable</Text>
                <Text style={s.feeTotalAmount}>₹{consultFee}</Text>
              </View>
            </View>
          )}
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
                    if (opt.key !== 'myself' && opt.key !== 'family') {
                      showToast('Coming soon');
                      return;
                    }
                    setForWhom(opt.key);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name={opt.icon} size={14} color={active ? BLUE : MUTED} style={{ marginRight: 5 }} />
                  <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={14} color={BLUE} style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Family Member sub-form */}
          {forWhom === 'family' && (
            <View style={s.familyForm}>
              {/* Saved family members quick-select */}
              <Text style={s.familySubLabel}>Select Family Member *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {/* Self option */}
                <TouchableOpacity
                  style={[s.savedMemberChip, selectedFamily === 'self' && s.savedMemberChipActive]}
                  onPress={() => setSelectedFamily('self')}
                  activeOpacity={0.8}
                >
                  <View style={[s.savedMemberAvatar, { backgroundColor: GREEN_L }]}>
                    <Text style={[s.savedMemberInitials, { color: GREEN }]}>
                      {patient?.name ? patient.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'ME'}
                    </Text>
                  </View>
                  <View>
                    <Text style={s.savedMemberName}>{patient?.name || 'You'}</Text>
                    <Text style={s.savedMemberRelation}>Self</Text>
                  </View>
                  {selectedFamily === 'self' && <Ionicons name="checkmark-circle" size={14} color={BLUE} />}
                </TouchableOpacity>
                {/* Saved members */}
                {SAVED_FAMILY.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.savedMemberChip, selectedFamily === m.id && s.savedMemberChipActive]}
                    onPress={() => setSelectedFamily(m.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.savedMemberAvatar, { backgroundColor: m.color }]}>
                      <Text style={[s.savedMemberInitials, { color: m.textColor }]}>{m.initials}</Text>
                    </View>
                    <View>
                      <Text style={s.savedMemberName}>{m.name}</Text>
                      <Text style={s.savedMemberRelation}>{m.relation}</Text>
                    </View>
                    {selectedFamily === m.id && <Ionicons name="checkmark-circle" size={14} color={BLUE} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={s.orRow}>
                <View style={s.orLine} /><Text style={s.orText}>OR</Text><View style={s.orLine} />
              </View>

              <Text style={s.familySubLabel}>Add New Family Member</Text>

              {/* Full Name + Relationship */}
              <View style={s.familyFieldRow}>
                <View style={[s.familyField, { flex: 1 }]}>
                  <Text style={s.familyFieldLabel}>Full Name</Text>
                  <TextInput
                    style={s.familyInput}
                    value={familyName}
                    onChangeText={setFamilyName}
                    placeholder="Enter full name"
                    placeholderTextColor={MUTED}
                  />
                </View>
                <View style={[s.familyField, { flex: 1 }]}>
                  <Text style={s.familyFieldLabel}>Relationship *</Text>
                  <View style={s.familyPickerBox}>
                    <TextInput
                      style={[s.familyInput, { flex: 1 }]}
                      value={familyRelationship}
                      onChangeText={setFamilyRelationship}
                      placeholder="e.g. Father, Mother"
                      placeholderTextColor={MUTED}
                    />
                    <Ionicons name="chevron-down" size={14} color={MUTED} />
                  </View>
                </View>
              </View>

              {/* Mobile Number */}
              <View style={s.familyField}>
                <Text style={s.familyFieldLabel}>Mobile Number *</Text>
                <View style={s.mobileInputRow}>
                  <View style={s.mobileFlag}>
                    <Text style={{ fontSize: 16 }}>🇮🇳</Text>
                    <Text style={s.mobileDialCode}>+91</Text>
                  </View>
                  <TextInput
                    style={[s.familyInput, { flex: 1, borderWidth: 0, padding: 0 }]}
                    value={familyMobile}
                    onChangeText={(t) => setFamilyMobile(t.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter mobile number"
                    placeholderTextColor={MUTED}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Save checkbox */}
              <TouchableOpacity
                style={s.checkboxRow}
                onPress={() => setSaveFamilyMember(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[s.checkbox, saveFamilyMember && s.checkboxActive]}>
                  {saveFamilyMember && <Ionicons name="checkmark" size={11} color={WHITE} />}
                </View>
                <Text style={s.checkboxLabel}>Save this person for future bookings</Text>
              </TouchableOpacity>

              {/* Cancel / Add & Select */}
              <View style={s.familyBtnRow}>
                <TouchableOpacity
                  style={s.familyCancelBtn}
                  onPress={() => setForWhom('myself')}
                  activeOpacity={0.8}
                >
                  <Text style={s.familyCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.familyAddBtn}
                  onPress={() => { if (familyName.trim()) showToast(`${familyName} added`); }}
                  activeOpacity={0.88}
                >
                  <Text style={s.familyAddText}>Add & Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Section 2: Visit Type ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>2. Select Visit Type</Text>
          <View style={s.visitTypeRow}>
            {[
              { key: 'OFFLINE', icon: 'business', label: 'Clinic Visit',        sub: 'Visit at clinic'  },
              { key: 'ONLINE',  icon: 'videocam',  label: 'Video Consultation', sub: 'Consult online'   },
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
                  <Text style={[s.visitSub, active && s.visitSubActive]}>{vt.sub}</Text>
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
          ) : (slotsLoading || sessionsLoading) ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={BLUE} />
              <Text style={s.loadingText}>Checking availability...</Text>
            </View>
          ) : clinicSessions.length > 0 ? (
            // ── Dynamic sessions from clinic config ──
            <>
              <View style={s.sessionRow}>
                {clinicSessions.map((sess) => {
                  const active = session === sess.id;
                  const sessSlots = getSlotsForSession(sess);
                  const availableSlots = sessSlots.filter(sl => sl.available);
                  const hasSlots = availableSlots.length > 0;
                  const name = sess.sessionName.toLowerCase();
                  const icon = name.includes('morning') ? 'sunny'
                    : name.includes('evening') ? 'moon'
                    : name.includes('afternoon') ? 'partly-sunny' : 'time-outline';
                  const iconColor = active ? BLUE
                    : name.includes('morning') ? '#F59E0B'
                    : name.includes('evening') ? '#6366F1' : '#10B981';
                  return (
                    <TouchableOpacity key={sess.id}
                      style={[s.sessionCard, active && s.sessionCardActive, !hasSlots && s.sessionCardDisabled]}
                      onPress={() => hasSlots && handleSessionSelect(sess.id)}
                      activeOpacity={hasSlots ? 0.85 : 1}
                    >
                      {active && <View style={s.sessionCheck}><Ionicons name="checkmark" size={10} color={WHITE} /></View>}
                      <Ionicons name={icon} size={28} color={active ? BLUE : (hasSlots ? iconColor : MUTED)} />
                      <Text style={[s.sessionLabel, active && s.sessionLabelActive]}>{sess.sessionName}</Text>
                      <Text style={[s.sessionTime, active && s.sessionTimeActive]}>{fmt12(sess.startTime)} – {fmt12(sess.endTime)}</Text>
                      {!hasSlots && <Text style={s.sessionNA}>Not available</Text>}
                      {hasSlots && slot && active && <Text style={s.sessionSlotHint}>Slot: {fmt12(slot)}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {session && (() => {
                const sel = clinicSessions.find(cs => cs.id === session);
                const sessSlots = sel ? getSlotsForSession(sel) : [];
                if (!sessSlots.length) return null;
                return (
                  <View style={s.slotGrid}>
                    <Text style={s.slotGridTitle}>Available Time Slots</Text>
                    <View style={s.slotGridRow}>
                      {sessSlots.map((sl) => {
                        const active = slot === sl.time;
                        return (
                          <TouchableOpacity key={sl.time}
                            style={[s.slotChip, active && s.slotChipActive, !sl.available && { opacity: 0.4 }]}
                            onPress={() => sl.available && setSlot(sl.time)}
                            activeOpacity={sl.available ? 0.8 : 1}
                          >
                            <Text style={[s.slotChipText, active && s.slotChipTextActive]}>{fmt12(sl.time)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })()}
              {slots.length === 0 && <Text style={s.noSlotsText}>No slots available for this day. Try a different date.</Text>}
            </>
          ) : (
            // ── Fallback: no clinic sessions configured ──
            <>
              <View style={s.sessionRow}>
                {(() => {
                  const active = session === 'morning';
                  const hasSlots = morningSlots.length > 0;
                  return (
                    <TouchableOpacity style={[s.sessionCard, active && s.sessionCardActive, !hasSlots && s.sessionCardDisabled]}
                      onPress={() => hasSlots && handleSessionSelect('morning')} activeOpacity={hasSlots ? 0.85 : 1}>
                      {active && <View style={s.sessionCheck}><Ionicons name="checkmark" size={10} color={WHITE} /></View>}
                      <Ionicons name="sunny" size={28} color={active ? BLUE : (hasSlots ? '#F59E0B' : MUTED)} />
                      <Text style={[s.sessionLabel, active && s.sessionLabelActive]}>Morning Session</Text>
                      <Text style={[s.sessionTime, active && s.sessionTimeActive]}>8:00 AM – 2:00 PM</Text>
                      {!hasSlots && <Text style={s.sessionNA}>Not available</Text>}
                    </TouchableOpacity>
                  );
                })()}
                {(() => {
                  const active = session === 'evening';
                  const hasSlots = eveningSlots.length > 0;
                  return (
                    <TouchableOpacity style={[s.sessionCard, active && s.sessionCardActive, !hasSlots && s.sessionCardDisabled]}
                      onPress={() => hasSlots && handleSessionSelect('evening')} activeOpacity={hasSlots ? 0.85 : 1}>
                      {active && <View style={s.sessionCheck}><Ionicons name="checkmark" size={10} color={WHITE} /></View>}
                      <Ionicons name="moon" size={28} color={active ? BLUE : (hasSlots ? '#6366F1' : MUTED)} />
                      <Text style={[s.sessionLabel, active && s.sessionLabelActive]}>Evening Session</Text>
                      <Text style={[s.sessionTime, active && s.sessionTimeActive]}>4:00 PM – 9:00 PM</Text>
                      {!hasSlots && <Text style={s.sessionNA}>Not available</Text>}
                    </TouchableOpacity>
                  );
                })()}
              </View>
              {slots.length === 0 && <Text style={s.noSlotsText}>No sessions available for this day. Please select another date.</Text>}
            </>
          )}
          <View style={s.queueInfo}>
            <Ionicons name="information-circle-outline" size={14} color={MUTED} />
            <Text style={s.queueInfoText}>Exact queue number will be assigned on the appointment day.</Text>
          </View>
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
          {/* Symptom quick-tags */}
          <Text style={s.symptomTagsLabel}>Quick add symptoms:</Text>
          <View style={s.symptomTagsRow}>
            {SYMPTOM_TAGS.map((tag) => {
              const active = notes.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[s.symptomTag, active && s.symptomTagActive]}
                  onPress={() => {
                    if (active) {
                      setNotes(n => n.replace(tag, '').replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',').trim());
                    } else {
                      const sep = notes.trim().length > 0 ? ', ' : '';
                      if ((notes + sep + tag).length <= 200) setNotes(n => (n.trim() ? n.trim() + ', ' : '') + tag);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {active && <Ionicons name="checkmark" size={10} color={BLUE} style={{ marginRight: 3 }} />}
                  <Text style={[s.symptomTagText, active && s.symptomTagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
          style={[s.confirmBtn, (loading || !date) && s.confirmBtnDisabled]}
          onPress={handleBook}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <Text style={s.confirmBtnText}>
              {isFreeBooking ? 'Confirm Free Booking' : 'Confirm Appointment'}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={s.noCharge}>You won't be charged now</Text>
      </View>

      {/* ── Success overlay ── */}
      <SuccessOverlay
        visible={success}
        doctorName={doctorName}
        date={date}
        slot={slot}
        queueNumber={bookedAppt?.queueNumber}
        isFree={isFreeBooking}
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
  visitSub:    { fontSize: 11, color: MUTED, textAlign: 'center' },
  visitSubActive:{ color: BLUE },

  // Family form
  familyForm:      { marginTop: 14, gap: 12 },
  familySubLabel:  { fontSize: 13, fontWeight: '700', color: SLATE, marginBottom: 4 },
  familyMemberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    padding: 12, backgroundColor: BG,
  },
  familyAvatar:    {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: GREEN_L, alignItems: 'center', justifyContent: 'center',
  },
  familyAvatarText:{ fontSize: 13, fontWeight: '800', color: GREEN },
  familyMemberName:{ fontSize: 14, fontWeight: '700', color: SLATE },
  familyMemberMeta:{ fontSize: 12, color: MUTED, marginTop: 1 },
  orRow:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine:          { flex: 1, height: 1, backgroundColor: BORDER },
  orText:          { fontSize: 12, fontWeight: '600', color: MUTED },
  familyFieldRow:  { flexDirection: 'row', gap: 10 },
  familyField:     { gap: 5 },
  familyFieldLabel:{ fontSize: 12, fontWeight: '600', color: SLATE_6 },
  familyInput:     {
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: SLATE, backgroundColor: WHITE,
  },
  familyPickerBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: WHITE,
  },
  mobileInputRow:  {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    backgroundColor: WHITE, overflow: 'hidden',
  },
  mobileFlag:      {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 10,
    borderRightWidth: 1, borderRightColor: BORDER,
  },
  mobileDialCode:  { fontSize: 13, fontWeight: '700', color: SLATE },
  checkboxRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:        {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive:  { backgroundColor: BLUE, borderColor: BLUE },
  checkboxLabel:   { fontSize: 12, color: SLATE_6, flex: 1 },
  familyBtnRow:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  familyCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', backgroundColor: WHITE,
  },
  familyCancelText:{ fontSize: 14, fontWeight: '600', color: SLATE_6 },
  familyAddBtn:    {
    flex: 1.6, paddingVertical: 13, borderRadius: 10,
    backgroundColor: BLUE, alignItems: 'center',
    shadowColor: BLUE, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  familyAddText:   { fontSize: 14, fontWeight: '700', color: WHITE },

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
  confirmBtnDisabled:{ backgroundColor: MUTED, shadowOpacity: 0 },
  confirmBtnText:    { fontSize: 16, fontWeight: '700', color: WHITE },
  noCharge:          { fontSize: 12, color: MUTED, marginTop: 6 },

  // Pulsing dot
  pulseWrap:   { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  pulseDotRing:{ position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: GREEN_DOT, opacity: 0.3 },
  greenDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_DOT },

  // Fee breakdown
  feeTouchRow:   { flexDirection: 'row', alignItems: 'center' },
  feeBreakdown:  { marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  feeBreakRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: BG },
  feeBreakLabel: { fontSize: 12, color: SLATE_6 },
  feeBreakAmount:{ fontSize: 12, fontWeight: '700', color: SLATE },
  feeTotalRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: BLUE_L },
  feeTotalLabel: { fontSize: 13, fontWeight: '700', color: BLUE },
  feeTotalAmount:{ fontSize: 13, fontWeight: '800', color: BLUE },

  // Saved family member chips
  savedMemberChip:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: BG },
  savedMemberChipActive:{ borderColor: BLUE, backgroundColor: BLUE_L },
  savedMemberAvatar:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  savedMemberInitials:  { fontSize: 11, fontWeight: '800' },
  savedMemberName:      { fontSize: 12, fontWeight: '700', color: SLATE },
  savedMemberRelation:  { fontSize: 10, color: MUTED, marginTop: 1 },

  // Slot time grid
  slotGrid:      { marginTop: 10 },
  slotGridTitle: { fontSize: 12, fontWeight: '700', color: SLATE_6, marginBottom: 8 },
  slotGridRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: BG },
  slotChipActive:{ borderColor: BLUE, backgroundColor: BLUE_L },
  slotChipText:  { fontSize: 12, fontWeight: '600', color: SLATE_6 },
  slotChipTextActive: { color: BLUE, fontWeight: '700' },

  // Symptom tags
  symptomTagsLabel:{ fontSize: 12, fontWeight: '600', color: SLATE_6, marginTop: 10, marginBottom: 6 },
  symptomTagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  symptomTag:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: BG },
  symptomTagActive:{ borderColor: BLUE, backgroundColor: BLUE_L },
  symptomTagText:  { fontSize: 11, fontWeight: '500', color: SLATE_6 },
  symptomTagTextActive: { color: BLUE, fontWeight: '700' },
});
