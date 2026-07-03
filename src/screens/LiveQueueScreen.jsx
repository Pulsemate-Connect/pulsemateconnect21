// ─────────────────────────────────────────────────────────────────────────────
//  LiveQueueScreen — PulseMate Connect  |  Real-time Queue Tracker
//  Delegates all socket/polling logic to useQueueSocket hook.
//  Socket events: queue:updated · queue:called · queue:positionUpdated
//                 queue:completed · queue:paused · queue:resumed
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Dimensions, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueueSocket } from '../hooks/useQueueSocket';

const { width: W } = Dimensions.get('window');

// ── Helper: convert "09:45" to "9:45 AM" ─────────────────────────────────────
const fmt12h = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY5    = '#0EA5E9';
const SKY6    = '#0284C7';
const SKY7    = '#0369A1';
const SKY8    = '#075985';
const TEAL    = '#2DD4BF';
const AMBER   = '#F59E0B';
const AMBER_L = '#FEF3C7';
const AMBER_D = '#92400E';
const GREEN   = '#10B981';
const GREEN_L = '#D1FAE5';
const GREEN_D = '#065F46';
const BLUE    = '#3B82F6';
const BLUE_L  = '#DBEAFE';
const BLUE_D  = '#1D4ED8';
const RED     = '#EF4444';
const RED_L   = '#FEE2E2';
const PURPLE  = '#8B5CF6';
const PURPLE_L = '#EDE9FE';
const WHITE   = '#FFFFFF';
const SLATE   = '#0F172A';
const SLATE_6 = '#475569';
const MUTED   = '#94A3B8';
const BG      = '#F0F7FF';
const BORDER  = '#E2E8F0';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_META = {
  WAITING: {
    label: 'Waiting', subLabel: 'Your turn is coming up',
    icon: 'time', color: AMBER, light: AMBER_L, dark: AMBER_D,
  },
  CALLED: {
    label: "You've Been Called!", subLabel: "Please proceed to the doctor's room now",
    icon: 'megaphone', color: GREEN, light: GREEN_L, dark: GREEN_D,
  },
  IN_CONSULTATION: {
    label: 'In Consultation', subLabel: 'Your consultation is in progress',
    icon: 'medical', color: BLUE, light: BLUE_L, dark: BLUE_D,
  },
  CHECKED_IN: {
    label: 'Checked In', subLabel: 'You are checked in and waiting',
    icon: 'checkmark-circle', color: SKY5, light: '#E0F2FE', dark: SKY7,
  },
  COMPLETED: {
    label: 'Consultation Complete', subLabel: 'Thank you for visiting',
    icon: 'checkmark-done-circle', color: GREEN, light: GREEN_L, dark: GREEN_D,
  },
  SKIPPED: {
    label: 'Skipped', subLabel: 'Please check with reception',
    icon: 'alert-circle', color: RED, light: RED_L, dark: '#991B1B',
  },
};
const getStatusMeta = (s) => STATUS_META[s] || STATUS_META.WAITING;

// ── Sub-components ────────────────────────────────────────────────────────────

function PulseRing({ color, size = 80 }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    anim(ring1, 0).start();
    anim(ring2, 700).start();
  }, []);

  const ringStyle = (val) => ({
    position: 'absolute', width: size, height: size, borderRadius: size / 2,
    borderWidth: 2, borderColor: color,
    opacity: val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />
    </View>
  );
}

function LiveDot({ color = TEAL }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 10, height: 10, borderRadius: 5,
        backgroundColor: color,
        opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
        transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
      }} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

function QueueProgressBar({ position, total, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? Math.max(0, Math.min(1, 1 - (position - 1) / total)) : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct, duration: 900,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={lq.progressTrack}>
      <Animated.View style={[lq.progressFill, {
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        backgroundColor: color,
      }]} />
      {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
        <View key={i} style={[lq.progressTick, { left: `${((i + 1) / Math.min(total, 10)) * 100}%` }]} />
      ))}
    </View>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label, highlight }) {
  const scaleA = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleA, { toValue: 1.08, duration: 180, useNativeDriver: true }),
      Animated.spring(scaleA, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [value]);

  return (
    <Animated.View style={[lq.statCard, highlight && lq.statCardHL, { transform: [{ scale: scaleA }] }]}>
      <View style={[lq.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[lq.statVal, highlight && { color: iconColor }]}>{value ?? '—'}</Text>
      <Text style={lq.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function CalledBanner({ visible }) {
  const slideA = useRef(new Animated.Value(-120)).current;
  const shakeA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(slideA, { toValue: 0, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeA, { toValue: 6,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: 4,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: -4, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeA, { toValue: 0,  duration: 60, useNativeDriver: true }),
            Animated.delay(3000),
          ]),
          { iterations: 4 }
        ),
      ]).start();
    } else {
      Animated.timing(slideA, { toValue: -120, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[lq.calledBanner, { transform: [{ translateY: slideA }, { translateX: shakeA }] }]}>
      <View style={lq.calledBannerIcon}>
        <Text style={{ fontSize: 28 }}>🔔</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={lq.calledBannerTitle}>Your Turn Has Arrived!</Text>
        <Text style={lq.calledBannerSub}>Please proceed to the doctor's room now</Text>
      </View>
      <View style={lq.calledArrow}>
        <Ionicons name="arrow-forward" size={20} color={WHITE} />
      </View>
    </Animated.View>
  );
}

// ── Connection indicator ──────────────────────────────────────────────────────
function ConnBadge({ socketState, onPress }) {
  if (socketState === 'live') {
    return (
      <TouchableOpacity style={lq.connBadge} onPress={onPress} activeOpacity={0.8} testID="conn-badge-live">
        <LiveDot color={TEAL} />
        <Text style={[lq.connText, { color: TEAL }]}>LIVE</Text>
      </TouchableOpacity>
    );
  }
  if (socketState === 'offline') {
    return (
      <TouchableOpacity style={lq.connBadge} onPress={onPress} activeOpacity={0.8} testID="conn-badge-offline">
        <View style={[lq.connDot, { backgroundColor: AMBER }]} />
        <Text style={[lq.connText, { color: AMBER }]}>OFFLINE</Text>
      </TouchableOpacity>
    );
  }
  // connecting
  return (
    <TouchableOpacity style={lq.connBadge} onPress={onPress} activeOpacity={0.8} testID="conn-badge-connecting">
      <ActivityIndicator size="small" color={TEAL} />
      <Text style={[lq.connText, { color: MUTED }]}>SYNC</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LiveQueueScreen({ route, navigation }) {
  const { appointmentId } = route.params;
  const insets = useSafeAreaInsets();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const flashA    = useRef(new Animated.Value(0)).current;
  const tokenNumA = useRef(new Animated.Value(1)).current;

  const triggerFlash = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashA, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(flashA, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.spring(tokenNumA, { toValue: 1.15, friction: 3, useNativeDriver: true }),
      Animated.spring(tokenNumA, { toValue: 1,    friction: 4, useNativeDriver: true }),
    ]).start();
  }, [flashA, tokenNumA]);

  // ── Hook — owns all socket/polling logic ───────────────────────────────────
  const handleData = useCallback((payload) => {
    setData(payload);
    setLoading(false);
    triggerFlash();
  }, [triggerFlash]);

  const { socketState, lastUpdated, manualRefresh } = useQueueSocket(
    appointmentId,
    handleData,
    () => setLoading(false),
  );

  // ── Derived from data ──────────────────────────────────────────────────────
  const qi            = data?.queueInfo;
  const appt          = data?.appointment;
  const status        = qi?.status        ?? appt?.status ?? 'WAITING';
  const meta          = getStatusMeta(status);
  const queueNumber   = qi?.queueNumber   ?? appt?.queueNumber ?? null;
  const patientsAhead = qi?.patientsAhead ?? null;
  const currentServing = qi?.currentlyServing ?? null;
  const estimatedWait = qi?.estimatedWaitMinutes ?? appt?.estimatedWaitMinutes ?? null;
  const estimatedAppointmentTime = qi?.estimatedAppointmentTime ?? null;
  const position      = qi?.position      ?? null;
  const queueStatus   = qi?.queueStatus   ?? 'ACTIVE';
  const doctorName    = appt?.doctor?.user?.name;
  const doctorSpec    = appt?.doctor?.specialization;
  const clinicName    = appt?.clinic?.name;
  const apptType      = appt?.appointmentType;
  const apptDate      = appt?.appointmentDate
    ? new Date(appt.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;
  const totalInQueue = patientsAhead != null && position != null ? position + patientsAhead : null;
  const fmtUpdated   = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <View style={lq.loadingRoot}>
        <StatusBar barStyle="light-content" backgroundColor={SKY7} />
        <View style={[lq.loadingHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={lq.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>
          <Text style={lq.loadingTitle}>Live Queue</Text>
        </View>
        <View style={lq.loadingBody}>
          <ActivityIndicator color={SKY5} size="large" />
          <Text style={lq.loadingText}>Connecting to live queue...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={lq.root} testID="live-queue-screen">
      <StatusBar barStyle="light-content" backgroundColor={SKY8} translucent />

      {/* Called banner slides in from top */}
      <CalledBanner visible={status === 'CALLED'} />

      {/* Flash overlay on data update */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          backgroundColor: TEAL,
          opacity: flashA.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] }),
          zIndex: 50,
        }]}
      />

      <ScrollView
        contentContainerStyle={[lq.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ── */}
        <View style={[lq.hero, { paddingTop: insets.top + 12 }]}>
          <View style={lq.navRow}>
            <TouchableOpacity style={lq.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={WHITE} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={lq.navTitle}>Live Queue</Text>
              <Text style={lq.navSub}>{clinicName || 'Tracking your position'}</Text>
            </View>
            {/* LIVE / CONNECTING / OFFLINE indicator */}
            <ConnBadge socketState={socketState} onPress={manualRefresh} />
          </View>

          {/* Token number */}
          <View style={lq.tokenSection}>
            <View style={lq.tokenRingWrap}>
              <PulseRing
                color={status === 'CALLED' ? GREEN : status === 'IN_CONSULTATION' ? BLUE : TEAL}
                size={120}
              />
            </View>
            <Animated.View style={[lq.tokenCircle, { transform: [{ scale: tokenNumA }] }]}>
              <View style={[lq.tokenCircleInner, { borderColor: meta.color + '60' }]}>
                <Text style={lq.tokenLabel}>YOUR TOKEN</Text>
                <Text style={lq.tokenNumber} testID="token-number">{queueNumber ?? '—'}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Status pill */}
          <View style={[lq.statusPill, { backgroundColor: meta.color + '25', borderColor: meta.color + '50' }]}>
            <Ionicons name={meta.icon} size={16} color={meta.color} />
            <Text style={[lq.statusPillText, { color: meta.color }]} testID="status-label">{meta.label}</Text>
          </View>
          <Text style={lq.statusSubText}>{meta.subLabel}</Text>

          {queueStatus === 'PAUSED' && (
            <View style={lq.pausedBadge} testID="paused-badge">
              <Ionicons name="pause-circle" size={14} color={AMBER} />
              <Text style={lq.pausedText}>Queue is temporarily paused</Text>
            </View>
          )}

          {fmtUpdated && (
            <Text style={lq.lastUpdated} testID="last-updated">Updated {fmtUpdated}</Text>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={lq.statsRow}>
          <StatCard icon="people"  iconBg={AMBER_L} iconColor={AMBER}
            value={patientsAhead} label="Ahead of You" highlight={patientsAhead === 0} />
          <StatCard icon="person"  iconBg={BLUE_L}  iconColor={BLUE}
            value={currentServing != null ? `#${currentServing}` : null} label="Now Serving" />
          <StatCard icon="time"    iconBg={GREEN_L} iconColor={GREEN}
            value={estimatedAppointmentTime ? fmt12h(estimatedAppointmentTime) : (estimatedWait != null ? `${estimatedWait}m` : null)}
            label={estimatedAppointmentTime ? "Your Slot" : "Est. Wait"} />
        </View>

        {/* ── Estimated appointment time card ── */}
        {estimatedAppointmentTime && status === 'WAITING' && (
          <View style={lq.slotCard}>
            <View style={lq.slotCardLeft}>
              <Text style={lq.slotCardIcon}>🕐</Text>
              <View>
                <Text style={lq.slotCardLabel}>Your Estimated Appointment</Text>
                <Text style={lq.slotCardTime}>{fmt12h(estimatedAppointmentTime)}</Text>
              </View>
            </View>
            <View style={lq.slotCardRight}>
              <Text style={lq.slotCardNote}>
                {patientsAhead === 0 ? "You're next!" : `${patientsAhead} patient${patientsAhead > 1 ? 's' : ''} ahead`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Queue progress tracker ── */}
        {status === 'WAITING' && totalInQueue != null && (
          <View style={lq.card}>
            <View style={lq.cardHeader}>
              <View style={[lq.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="list" size={15} color={SKY6} />
              </View>
              <Text style={lq.cardTitle}>Queue Progress</Text>
              <View style={lq.cardBadge}>
                <Text style={lq.cardBadgeText} testID="position-badge">Position #{position}</Text>
              </View>
            </View>
            <QueueProgressBar position={position} total={totalInQueue} color={meta.color} />
            <View style={lq.progressLabels}>
              <View style={lq.progressLabelItem}>
                <View style={[lq.progressLabelDot, { backgroundColor: GREEN }]} />
                <Text style={lq.progressLabelText}>Start</Text>
              </View>
              <Text style={lq.progressLabelCenter}>
                {patientsAhead === 0 ? "You're next!" : `${patientsAhead} ahead`}
              </Text>
              <View style={lq.progressLabelItem}>
                <View style={[lq.progressLabelDot, { backgroundColor: SKY5 }]} />
                <Text style={lq.progressLabelText}>Doctor</Text>
              </View>
            </View>
            {/* Journey steps */}
            <View style={lq.stepsRow}>
              {[
                { key: 'BOOKED',     label: 'Booked',     icon: 'calendar-outline' },
                { key: 'CHECKED_IN', label: 'Checked In', icon: 'checkmark-circle-outline' },
                { key: 'WAITING',    label: 'Waiting',    icon: 'time-outline' },
                { key: 'CALLED',     label: 'Called',     icon: 'megaphone-outline' },
                { key: 'DONE',       label: 'Done',       icon: 'medical-outline' },
              ].map((step, idx, arr) => {
                const ORDER = ['BOOKED', 'CHECKED_IN', 'WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED'];
                const curIdx  = ORDER.indexOf(status);
                const stepIdx = ORDER.indexOf(step.key === 'DONE' ? 'COMPLETED' : step.key);
                const done    = curIdx > stepIdx;
                const active  = curIdx === stepIdx || (step.key === 'DONE' && status === 'IN_CONSULTATION');
                return (
                  <View key={step.key} style={lq.stepItem}>
                    <View style={[
                      lq.stepCircle,
                      done   && { backgroundColor: GREEN,      borderColor: GREEN      },
                      active && { backgroundColor: meta.color, borderColor: meta.color },
                    ]}>
                      <Ionicons name={done ? 'checkmark' : step.icon} size={12}
                        color={done || active ? WHITE : MUTED} />
                    </View>
                    <Text style={[lq.stepLabel, (done || active) && {
                      color: done ? GREEN : meta.color, fontWeight: '700',
                    }]}>{step.label}</Text>
                    {idx < arr.length - 1 && (
                      <View style={[lq.stepLine, done && { backgroundColor: GREEN }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Called action card ── */}
        {status === 'CALLED' && (
          <View style={[lq.card, lq.calledCard]} testID="called-card">
            <View style={lq.calledCardTop}>
              <View style={lq.calledCardEmoji}><Text style={{ fontSize: 36 }}>🏥</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={lq.calledCardTitle}>Please Go In Now</Text>
                <Text style={lq.calledCardSub}>The doctor is ready to see you</Text>
              </View>
            </View>
            <View style={lq.calledCardDivider} />
            <View style={lq.calledCardFooter}>
              <Ionicons name="information-circle-outline" size={14} color={GREEN_D} />
              <Text style={lq.calledCardNote}>
                Head to the consultation room. Show your token #{queueNumber} at the door.
              </Text>
            </View>
          </View>
        )}

        {/* ── In consultation card ── */}
        {status === 'IN_CONSULTATION' && (
          <View style={[lq.card, lq.consultCard]}>
            <View style={lq.consultTop}>
              <View style={lq.consultIcon}>
                <Ionicons name="medical" size={28} color={BLUE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={lq.consultTitle}>Consultation in Progress</Text>
                <Text style={lq.consultSub}>You are currently with the doctor</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Doctor card ── */}
        {doctorName && (
          <View style={lq.card}>
            <View style={lq.cardHeader}>
              <View style={[lq.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person" size={15} color={SKY6} />
              </View>
              <Text style={lq.cardTitle}>Your Doctor</Text>
            </View>
            <View style={lq.doctorRow}>
              <View style={lq.doctorAvatarWrap}>
                <Text style={lq.doctorAvatarText}>{doctorName?.charAt(0)?.toUpperCase() || 'D'}</Text>
                <View style={[lq.doctorOnlineDot, {
                  backgroundColor: status === 'IN_CONSULTATION' ? BLUE : GREEN,
                }]} />
              </View>
              <View style={lq.doctorInfo}>
                <Text style={lq.doctorName}>Dr. {doctorName}</Text>
                {doctorSpec && <Text style={lq.doctorSpec}>{doctorSpec}</Text>}
                <View style={lq.doctorStatusRow}>
                  <View style={[lq.doctorStatusDot, {
                    backgroundColor: status === 'IN_CONSULTATION' ? BLUE : GREEN,
                  }]} />
                  <Text style={[lq.doctorStatusText, {
                    color: status === 'IN_CONSULTATION' ? BLUE : GREEN,
                  }]}>
                    {status === 'IN_CONSULTATION' ? 'In Consultation' : 'Available'}
                  </Text>
                </View>
              </View>
              <View style={lq.doctorRight}>
                {apptType && (
                  <View style={[lq.apptTypeBadge, {
                    backgroundColor: apptType === 'ONLINE' ? PURPLE_L : '#EFF6FF',
                  }]}>
                    <Ionicons
                      name={apptType === 'ONLINE' ? 'videocam' : 'business'}
                      size={11}
                      color={apptType === 'ONLINE' ? PURPLE : SKY6}
                    />
                    <Text style={[lq.apptTypeText, {
                      color: apptType === 'ONLINE' ? PURPLE : SKY6,
                    }]}>
                      {apptType === 'ONLINE' ? 'Online' : 'In-Clinic'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── Clinic card ── */}
        {clinicName && (
          <View style={lq.card}>
            <View style={lq.cardHeader}>
              <View style={[lq.cardIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="business" size={15} color={GREEN} />
              </View>
              <Text style={lq.cardTitle}>Clinic Details</Text>
            </View>
            <View style={lq.clinicRow}>
              <View style={lq.clinicIconWrap}>
                <Ionicons name="business" size={26} color={SKY6} />
              </View>
              <View style={lq.clinicInfo}>
                <Text style={lq.clinicName}>{clinicName}</Text>
                {apptDate && (
                  <View style={lq.clinicMetaRow}>
                    <Ionicons name="calendar-outline" size={12} color={MUTED} />
                    <Text style={lq.clinicMetaText}>{apptDate}</Text>
                  </View>
                )}
              </View>
              <View style={[lq.queueStatusBadge, {
                backgroundColor: queueStatus === 'ACTIVE' ? GREEN_L :
                                 queueStatus === 'PAUSED' ? AMBER_L : '#F1F5F9',
              }]}>
                <View style={[lq.queueStatusDot, {
                  backgroundColor: queueStatus === 'ACTIVE' ? GREEN :
                                   queueStatus === 'PAUSED' ? AMBER : MUTED,
                }]} />
                <Text style={[lq.queueStatusText, {
                  color: queueStatus === 'ACTIVE' ? GREEN_D :
                         queueStatus === 'PAUSED' ? AMBER_D : SLATE_6,
                }]}>
                  {queueStatus === 'ACTIVE' ? 'Queue Active' :
                   queueStatus === 'PAUSED' ? 'Queue Paused' : queueStatus}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Tips while waiting ── */}
        {status === 'WAITING' && (
          <View style={lq.tipsCard}>
            <View style={lq.tipsHeader}>
              <Ionicons name="bulb-outline" size={15} color={AMBER} />
              <Text style={lq.tipsTitle}>While You Wait</Text>
            </View>
            {[
              { icon: 'document-text-outline', text: 'Keep your prescriptions and reports ready' },
              { icon: 'notifications-outline', text: "You'll be notified when it's your turn" },
              { icon: 'time-outline',           text: 'Queue updates automatically in real-time' },
            ].map((tip, i) => (
              <View key={i} style={lq.tipRow}>
                <View style={lq.tipIconWrap}>
                  <Ionicons name={tip.icon} size={14} color={SKY6} />
                </View>
                <Text style={lq.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Manual refresh button ── */}
        <TouchableOpacity style={lq.refreshBtn} onPress={manualRefresh} activeOpacity={0.8} testID="refresh-btn">
          {loading ? (
            <ActivityIndicator size="small" color={SKY6} />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color={SKY6} />
              <Text style={lq.refreshText}>Refresh Queue</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={lq.footerNote}>
          {socketState === 'live'
            ? '⚡ Connected — updates in real-time via Socket.IO'
            : '🔄 Polling every 30 seconds for updates'}
        </Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const lq = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  loadingRoot:   { flex: 1, backgroundColor: SKY7 },
  loadingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  loadingTitle:  { fontSize: 18, fontWeight: '800', color: WHITE },
  loadingBody:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText:   { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  scroll:        { gap: 12, paddingHorizontal: 16, paddingTop: 0 },

  // Hero
  hero:          { backgroundColor: SKY7, paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center', marginHorizontal: -16, marginBottom: 4 },
  navRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginBottom: 28 },
  backBtn:       { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  navTitle:      { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  navSub:        { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  // Connection badge
  connBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  connDot:       { width: 7, height: 7, borderRadius: 4 },
  connText:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  // Token
  tokenSection:     { alignItems: 'center', justifyContent: 'center', marginBottom: 20, height: 160 },
  tokenRingWrap:    { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  tokenCircle:      { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  tokenCircleInner: { width: 118, height: 118, borderRadius: 59, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  tokenLabel:       { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  tokenNumber:      { fontSize: 56, fontWeight: '900', color: WHITE, letterSpacing: -2, lineHeight: 60 },

  // Status
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, marginBottom: 8 },
  statusPillText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  statusSubText:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 10 },
  pausedBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', marginBottom: 8 },
  pausedText:     { fontSize: 12, fontWeight: '700', color: AMBER },
  lastUpdated:    { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4 },

  // Stats
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard:    { flex: 1, backgroundColor: WHITE, borderRadius: 18, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  statCardHL:  { borderWidth: 1.5, borderColor: GREEN, shadowColor: GREEN, shadowOpacity: 0.15 },
  statIconWrap:{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statVal:     { fontSize: 22, fontWeight: '900', color: SLATE, letterSpacing: -0.5 },
  statLabel:   { fontSize: 10, color: MUTED, fontWeight: '600', textAlign: 'center' },

  // Card
  card:       { backgroundColor: WHITE, borderRadius: 20, padding: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardIconWrap:{ width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle:  { fontSize: 14, fontWeight: '800', color: SLATE, flex: 1, letterSpacing: -0.2 },
  cardBadge:  { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardBadgeText:{ fontSize: 11, fontWeight: '700', color: SKY6 },

  // Progress
  progressTrack:      { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  progressFill:       { height: '100%', borderRadius: 5 },
  progressTick:       { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.6)' },
  progressLabels:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  progressLabelItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressLabelDot:   { width: 6, height: 6, borderRadius: 3 },
  progressLabelText:  { fontSize: 10, color: MUTED, fontWeight: '600' },
  progressLabelCenter:{ fontSize: 11, fontWeight: '700', color: SLATE_6 },
  stepsRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepItem:    { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle:  { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 5, zIndex: 1 },
  stepLabel:   { fontSize: 9, color: MUTED, fontWeight: '600', textAlign: 'center' },
  stepLine:    { position: 'absolute', top: 13, left: '50%', right: '-50%', height: 2, backgroundColor: BORDER, zIndex: 0 },

  // Called card
  calledCard:       { borderWidth: 2, borderColor: GREEN, backgroundColor: '#F0FDF4' },
  calledCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  calledCardEmoji:  { width: 60, height: 60, borderRadius: 18, backgroundColor: GREEN_L, alignItems: 'center', justifyContent: 'center' },
  calledCardTitle:  { fontSize: 18, fontWeight: '800', color: GREEN_D, marginBottom: 4 },
  calledCardSub:    { fontSize: 13, color: GREEN_D, opacity: 0.8 },
  calledCardDivider:{ height: 1, backgroundColor: GREEN + '30', marginBottom: 12 },
  calledCardFooter: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  calledCardNote:   { flex: 1, fontSize: 12, color: GREEN_D, lineHeight: 18 },

  // Consult card
  consultCard: { borderWidth: 2, borderColor: BLUE, backgroundColor: '#EFF6FF' },
  consultTop:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  consultIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center' },
  consultTitle:{ fontSize: 16, fontWeight: '800', color: BLUE_D, marginBottom: 4 },
  consultSub:  { fontSize: 12, color: BLUE_D, opacity: 0.8 },

  // Doctor card
  doctorRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorAvatarWrap:{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  doctorAvatarText:{ fontSize: 22, fontWeight: '800', color: SKY6 },
  doctorOnlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: WHITE },
  doctorInfo:      { flex: 1 },
  doctorName:      { fontSize: 15, fontWeight: '800', color: SLATE, marginBottom: 2 },
  doctorSpec:      { fontSize: 12, color: SKY6, fontWeight: '600', marginBottom: 5 },
  doctorStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  doctorStatusDot: { width: 6, height: 6, borderRadius: 3 },
  doctorStatusText:{ fontSize: 11, fontWeight: '700' },
  doctorRight:     { alignItems: 'flex-end' },
  apptTypeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  apptTypeText:    { fontSize: 11, fontWeight: '700' },

  // Clinic card
  clinicRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clinicIconWrap:   { width: 52, height: 52, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  clinicInfo:       { flex: 1 },
  clinicName:       { fontSize: 15, fontWeight: '800', color: SLATE, marginBottom: 4 },
  clinicMetaRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  clinicMetaText:   { fontSize: 12, color: MUTED },
  queueStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  queueStatusDot:   { width: 6, height: 6, borderRadius: 3 },
  queueStatusText:  { fontSize: 11, fontWeight: '700' },

  // Tips
  tipsCard:   { backgroundColor: WHITE, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: AMBER_L, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  tipsTitle:  { fontSize: 13, fontWeight: '800', color: SLATE },
  tipRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tipIconWrap:{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  tipText:    { flex: 1, fontSize: 12, color: SLATE_6, lineHeight: 17 },

  // Footer
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: WHITE, borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: '#BAE6FD', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  refreshText:{ fontSize: 14, fontWeight: '700', color: SKY6 },
  footerNote: { textAlign: 'center', fontSize: 11, color: MUTED, paddingBottom: 8 },

  // Called banner (slides from top)
  calledBanner:      { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 14, shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
  calledBannerIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  calledBannerTitle: { fontSize: 15, fontWeight: '800', color: WHITE, marginBottom: 2 },
  calledBannerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  calledArrow:       { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Estimated slot card
  slotCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EFF6FF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#BFDBFE' },
  slotCardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotCardIcon:  { fontSize: 24 },
  slotCardLabel: { fontSize: 11, color: SKY6, fontWeight: '600', marginBottom: 2 },
  slotCardTime:  { fontSize: 22, fontWeight: '900', color: SKY7, letterSpacing: -0.5 },
  slotCardRight: { alignItems: 'flex-end' },
  slotCardNote:  { fontSize: 11, color: SKY6, fontWeight: '600' },
});
