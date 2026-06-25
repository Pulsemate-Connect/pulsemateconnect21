// ─────────────────────────────────────────────────────────────────────────────
//  HomeScreen — PulseMate Connect  |  Premium Healthcare Dashboard
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Dimensions, StatusBar,
  Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../store/authStore';
import { getMyAppointments, getLiveQueue, getNearby, searchDoctors } from '../api/patient';
import { getMyNotifications } from '../api/auth';
import { fmtDoctorName } from '../utils/doctorName';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const PRIMARY   = '#2563EB';
const SKY5      = '#0EA5E9';
const SKY6      = '#0284C7';
const WHITE     = '#FFFFFF';
const SLATE     = '#0F172A';
const SLATE2    = '#1E293B';
const MUTED     = '#94A3B8';
const BG        = '#F0F7FF';
const CARD      = '#FFFFFF';

// ── Specialities data ─────────────────────────────────────────────────────────
const SPECIALITIES = [
  { id: '1', label: 'General\nPhysician', icon: 'medkit',          color: '#EFF6FF', ic: '#2563EB' },
  { id: '2', label: 'Dentist',            icon: 'happy',            color: '#F0FDF4', ic: '#16A34A' },
  { id: '3', label: 'Pediatrician',       icon: 'heart',            color: '#FFF7ED', ic: '#EA580C' },
  { id: '4', label: 'Dermatologist',      icon: 'body',             color: '#FDF4FF', ic: '#9333EA' },
  { id: '5', label: 'Orthopedic',         icon: 'fitness',          color: '#F0FDFA', ic: '#0D9488' },
  { id: '6', label: 'ENT',                icon: 'ear',              color: '#FEF3C7', ic: '#D97706' },
  { id: '7', label: 'More',               icon: 'grid',             color: '#F1F5F9', ic: '#64748B' },
];

// ── Health tips ───────────────────────────────────────────────────────────────
const HEALTH_TIPS = [
  { id: '1', title: 'Stay Hydrated',      body: 'Drink enough water every day to keep your body healthy.', emoji: '💧' },
  { id: '2', title: 'Walk 30 Minutes',    body: 'A daily 30-minute walk reduces risk of heart disease.', emoji: '🚶' },
  { id: '3', title: 'Sleep 7-8 Hours',    body: 'Quality sleep boosts immunity and mental health.', emoji: '😴' },
];

// ── Logo asset ────────────────────────────────────────────────────────────────
const LOGO = require('../../assets/logo.png');

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <View style={s.viewAllRow}>
            <Text style={s.viewAll}>View all</Text>
            <Ionicons name="chevron-forward" size={13} color={PRIMARY} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Doctor avatar with photo fallback ────────────────────────────────────────
function DoctorAvatar({ photoUrl, name, size = 70 }) {
  const [broken, setBroken] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'D';
  if (photoUrl && !broken) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setBroken(true)}
      />
    );
  }
  const colors = ['#DBEAFE','#D1FAE5','#FEE2E2','#EDE9FE','#FEF3C7','#F0FDFA'];
  const textColors = ['#1D4ED8','#065F46','#991B1B','#6D28D9','#92400E','#0F766E'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: colors[idx], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: textColors[idx] }}>{initial}</Text>
    </View>
  );
}

// ── Doctor card ───────────────────────────────────────────────────────────────
function DoctorCard({ doctor, onBook }) {
  const name  = doctor.user?.name || 'Doctor';
  const spec  = doctor.specialization || 'General Physician';
  const photo = doctor.profilePhotoUrl || doctor.photoUrl || null;
  return (
    <View style={s.doctorCard}>
      <TouchableOpacity style={s.wishBtn} activeOpacity={0.7}>
        <Ionicons name="heart-outline" size={16} color={MUTED} />
      </TouchableOpacity>
      <DoctorAvatar photoUrl={photo} name={name} size={72} />
      <Text style={s.doctorName} numberOfLines={1}>{fmtDoctorName(name)}</Text>
      <Text style={s.doctorSpec} numberOfLines={1}>{spec}</Text>
      <View style={s.ratingRow}>
        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
        <Text style={s.ratingText}>Verified</Text>
      </View>
      <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.85}>
        <Text style={s.bookBtnText}>Book</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Clinic card ───────────────────────────────────────────────────────────────
function ClinicCard({ clinic, onBook }) {
  // Derive open/closed from clinic hours if available, otherwise don't show badge
  const checkIsOpen = () => {
    if (!clinic.openingHours) return null; // unknown — don't show badge
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentMins = hour * 60 + minute;
      // openingHours format expected: "09:00-18:00"
      const [open, close] = clinic.openingHours.split('-');
      if (!open || !close) return null;
      const [oh, om] = open.split(':').map(Number);
      const [ch, cm] = close.split(':').map(Number);
      const openMins  = oh * 60 + om;
      const closeMins = ch * 60 + cm;
      return currentMins >= openMins && currentMins < closeMins;
    } catch { return null; }
  };
  const isOpen = checkIsOpen();
  return (
    <View style={s.clinicCard}>
      {/* Clinic image / placeholder */}
      <View style={s.clinicImgWrap}>
        {clinic.clinicLogoUrl ? (
          <Image source={{ uri: clinic.clinicLogoUrl }} style={s.clinicImg} resizeMode="cover" />
        ) : (
          <View style={[s.clinicImg, s.clinicImgPlaceholder]}>
            <Ionicons name="business" size={36} color="#93C5FD" />
          </View>
        )}
        {isOpen !== null && (
          <View style={[s.openBadge, { backgroundColor: isOpen ? '#22C55E' : '#EF4444' }]}>
            <Text style={s.openBadgeText}>{isOpen ? 'Open Now' : 'Closed'}</Text>
          </View>
        )}
      </View>
      {/* Info */}
      <View style={s.clinicInfo}>
        <Text style={s.clinicName} numberOfLines={1}>{clinic.name}</Text>
        <View style={s.clinicLocRow}>
          <Ionicons name="location-outline" size={12} color={MUTED} />
          <Text style={s.clinicLoc} numberOfLines={1}>
            {clinic.distanceKm ? `${clinic.distanceKm} km away · ` : ''}{clinic.city || clinic.district}
          </Text>
        </View>
        <View style={s.clinicMetaRow}>
          <View style={s.clinicQueueChip}>
            <Ionicons name="people-outline" size={12} color={SKY6} />
            <Text style={s.clinicQueueText}>
              {clinic._count?.appointments ?? 0} in queue
            </Text>
          </View>
          <View style={s.clinicRatingChip}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={s.clinicRatingText}>4.8 (320)</Text>
          </View>
        </View>
        <TouchableOpacity style={s.clinicBookBtn} onPress={onBook} activeOpacity={0.85}>
          <Text style={s.clinicBookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Trust strip ───────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: 'shield-checkmark', color: PRIMARY, title: 'Verified Clinics',       sub: 'Trusted & verified\nhealthcare partners' },
    { icon: 'people',           color: SKY5,    title: 'Live Queue Tracking',    sub: 'Real-time updates\nso you can plan better' },
    { icon: 'calendar',         color: '#8B5CF6', title: 'Instant Appointments', sub: 'Book in a few\nsimple steps' },
  ];
  return (
    <View style={s.trustStrip}>
      {items.map((item, i) => (
        <View key={i} style={s.trustItem}>
          <View style={[s.trustIconWrap, { backgroundColor: `${item.color}18` }]}>
            <Ionicons name={item.icon} size={20} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.trustTitle}>{item.title}</Text>
            <Text style={s.trustSub}>{item.sub}</Text>
          </View>
        </View>
      ))}
      <View style={s.trustFooter}>
        <Ionicons name="heart" size={14} color="#EF4444" />
        <Text style={s.trustFooterText}>Trusted by patients across Karnataka</Text>
      </View>
    </View>
  );
}

// ── Main HomeScreen ───────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [loadError,     setLoadError]     = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [nearbyClinics, setNearbyClinics] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationStatus,setLocationStatus]= useState('idle');
  const [topDoctors,    setTopDoctors]    = useState([]);
  const [tipIdx,        setTipIdx]        = useState(0);

  // ── Animation refs ─────────────────────────────────────────────────────────
  const heartbeatA = useRef(new Animated.Value(1)).current;
  const fadeInA    = useRef(new Animated.Value(0)).current;

  // Heartbeat animation on logo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatA, { toValue: 1.12, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(heartbeatA, { toValue: 1,    duration: 140, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.timing(heartbeatA, { toValue: 1.06, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(heartbeatA, { toValue: 1,    duration: 120, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
        Animated.delay(1400),
      ])
    ).start();
  }, [heartbeatA]);

  // Fade-in on page load
  useEffect(() => {
    Animated.timing(fadeInA, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fadeInA]);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [notifRes, doctorsRes] = await Promise.allSettled([
        getMyNotifications(),
        searchDoctors({ limit: 6, page: 1 }),
      ]);
      if (notifRes.status === 'fulfilled') setUnreadCount(notifRes.value.data.data?.unreadCount || 0);
      if (doctorsRes.status === 'fulfilled') setTopDoctors(doctorsRes.value.data.data || []);
      if (notifRes.status === 'rejected' && doctorsRes.status === 'rejected') {
        // Check if it's a network error
        const err = doctorsRes.reason;
        setLoadError(err?.friendlyMessage || 'Could not load. Tap to retry.');
      }
    } catch (err) { setLoadError(err?.friendlyMessage || 'Could not load. Tap to retry.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchNearby = useCallback(async (coords) => {
    setNearbyLoading(true);
    try {
      const res = await getNearby({ lat: coords.latitude, lng: coords.longitude, radius: 50, type: 'clinics', limit: 5 });
      setNearbyClinics(res.data.data?.clinics || []);
    } catch { setNearbyClinics([]); }
    finally { setNearbyLoading(false); }
  }, []);

  const requestLocation = useCallback(async () => {
    setLocationStatus('asking');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationStatus('denied'); return; }
      setLocationStatus('granted');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      fetchNearby(loc.coords);
    } catch { setLocationStatus('denied'); }
  }, [fetchNearby]);

  useEffect(() => { load(); }, [load]);
  // Rotate health tip every 5 seconds
  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % HEALTH_TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const tip = HEALTH_TIPS[tipIdx];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={PRIMARY} />}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={s.helloText}>Hello,</Text>
              <Text style={s.userName}>{firstName}</Text>
            </View>
          </View>
          {/* Notification bell only — search removed */}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={20} color={SLATE} />
            {unreadCount > 0 && (
              <View style={s.notifDot}>
                <Text style={s.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Network error banner ── */}
        {loadError && (
          <TouchableOpacity
            style={s.errorBanner}
            onPress={() => { setLoading(true); load(); }}
            accessibilityLabel="Could not load data. Tap to retry."
            accessibilityRole="button"
          >
            <Ionicons name="wifi-outline" size={16} color="#92400E" />
            <Text style={s.errorBannerText}>{typeof loadError === 'string' ? loadError : 'Could not load. Tap to retry.'}</Text>
            <Ionicons name="refresh-outline" size={16} color="#92400E" />
          </TouchableOpacity>
        )}

        {/* ── Hero Banner ── */}
        <Animated.View style={[s.heroBanner, { opacity: fadeInA }]}>
          {/* Decorative blobs */}
          <View style={s.heroBlobTL} />
          <View style={s.heroBlobBR} />
          <View style={s.heroBlobMR} />

          {/* ── Brand identity at top center ── */}
          <View style={s.heroBrand}>
            {/* Logo icon with heartbeat */}
            <Animated.View style={[s.heroLogoWrap, { transform: [{ scale: heartbeatA }] }]}>
              <Image source={LOGO} style={s.heroLogoImg} resizeMode="contain" />
            </Animated.View>

            {/* Brand name */}
            <View style={s.heroBrandTextWrap}>
              <Text style={s.heroBrandName}>
                <Text style={s.heroBrandPulse}>Pulse</Text>
                <Text style={s.heroBrandMate}>Mate</Text>
                <Text style={s.heroBrandConnect}> Connect</Text>
              </Text>
              <Text style={s.heroBrandTagline}>Smart Healthcare, Simplified</Text>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={s.heroDivider} />

          {/* ── Headline + CTA ── */}
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>Smart Healthcare.</Text>
            <Text style={s.heroTitleBlue}>Less Waiting.</Text>
            <Text style={s.heroSub}>
              Book appointments, track live{'\n'}queues and visit your doctor.
            </Text>
            <TouchableOpacity
              style={s.heroBtn}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.88}
              accessibilityLabel="Get Started - Search for doctors"
              accessibilityRole="button"
            >
              <Ionicons name="calendar-outline" size={15} color={WHITE} />
              <Text style={s.heroBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={14} color={WHITE} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Search bar ── */}
        <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
          <Ionicons name="search-outline" size={18} color={MUTED} />
          <Text style={s.searchText}>Search doctors, clinics, specialities...</Text>
          <Ionicons name="mic-outline" size={18} color={MUTED} />
        </TouchableOpacity>

        {/* ── Specialities ── */}
        <View style={s.section}>
          <SectionHeader title="Specialities" onViewAll={() => navigation.navigate('DoctorsTab')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.specRow}>
            {SPECIALITIES.map((sp) => (
              <TouchableOpacity key={sp.id} style={s.specItem} onPress={() => navigation.navigate('DoctorsTab')} activeOpacity={0.8}>
                <View style={[s.specIcon, { backgroundColor: sp.color }]}>
                  <Ionicons name={sp.icon} size={26} color={sp.ic} />
                </View>
                <Text style={s.specLabel}>{sp.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Nearby Clinics ── */}
        <View style={s.section}>
          <SectionHeader title="Nearby Clinics" onViewAll={() => navigation.navigate('DoctorsTab')} />
          {locationStatus === 'idle' && (
            <TouchableOpacity style={s.locationPrompt} onPress={requestLocation} activeOpacity={0.85}>
              <View style={s.locationPromptIcon}>
                <Ionicons name="location-outline" size={22} color={SKY6} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.locationPromptTitle}>Enable Location</Text>
                <Text style={s.locationPromptSub}>Tap to find clinics near you</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={SKY5} />
            </TouchableOpacity>
          )}
          {locationStatus === 'asking' && (
            <View style={s.locationPrompt}>
              <ActivityIndicator color={SKY5} />
              <Text style={[s.locationPromptSub, { marginLeft: 12 }]}>Getting your location…</Text>
            </View>
          )}
          {locationStatus === 'denied' && (
            <TouchableOpacity style={s.locationPrompt} onPress={requestLocation} activeOpacity={0.85}>
              <Ionicons name="location-outline" size={22} color="#EF4444" />
              <Text style={[s.locationPromptSub, { marginLeft: 10, color: '#EF4444' }]}>Location denied — tap to retry</Text>
            </TouchableOpacity>
          )}
          {locationStatus === 'granted' && nearbyLoading && <ActivityIndicator color={SKY5} style={{ marginVertical: 20 }} />}
          {locationStatus === 'granted' && !nearbyLoading && nearbyClinics.length === 0 && (
            <View style={s.emptyCard}>
              <Text style={s.emptySub}>No verified clinics found nearby</Text>
            </View>
          )}
          {locationStatus === 'granted' && !nearbyLoading && nearbyClinics.length > 0 && (
            nearbyClinics.map((c) => (
              <ClinicCard
                key={c.id}
                clinic={c}
                onBook={() => navigation.navigate('DoctorsTab', { screen: 'SearchMain', params: { clinicId: c.id, clinicName: c.name } })}
              />
            ))
          )}
        </View>

        {/* ── Top Doctors ── */}
        <View style={s.section}>
          <SectionHeader title="Top Doctors" onViewAll={() => navigation.navigate('DoctorsTab')} />
          {loading ? (
            <ActivityIndicator color={SKY5} style={{ marginVertical: 20 }} />
          ) : topDoctors.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptySub}>No doctors available right now</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {topDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onBook={() => navigation.navigate('DoctorsTab', { screen: 'DoctorDetail', params: { doctorId: doc.id } })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Trust Strip ── */}
        <View style={s.section}>
          <TrustStrip />
        </View>

        {/* ── Health Tip ── */}
        <View style={s.section}>
          <SectionHeader title="Health Tip" onViewAll={() => {}} />
          <View style={s.tipCard}>
            <View style={s.tipLeft}>
              <Text style={s.tipEmoji}>{tip.emoji}</Text>
            </View>
            <View style={s.tipContent}>
              <Text style={s.tipTitle}>{tip.title}</Text>
              <Text style={s.tipBody}>{tip.body}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={MUTED} />
          </View>
          {/* Dots */}
          <View style={s.tipDots}>
            {HEALTH_TIPS.map((_, i) => (
              <View key={i} style={[s.tipDot, i === tipIdx && s.tipDotActive]} />
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  headerLogo: { height: 36, width: 160 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#93C5FD' },
  avatarText: { fontSize: 17, fontWeight: '800', color: PRIMARY },
  helloText: { fontSize: 12, color: MUTED, fontWeight: '500' },
  userName: { fontSize: 16, fontWeight: '800', color: SLATE, letterSpacing: -0.3 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  notifDot: { position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: WHITE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifDotText: { fontSize: 8, color: '#fff', fontWeight: '800', lineHeight: 10 },

  // Hero banner — compact centered layout (~260–290px tall)
  heroBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 5,
  },
  // Decorative blobs — smaller, less dominant
  heroBlobTL: { position: 'absolute', top: -25, left: -25, width: 80, height: 80, borderRadius: 40, backgroundColor: '#BFDBFE', opacity: 0.35 },
  heroBlobBR: { position: 'absolute', bottom: -20, right: -20, width: 65, height: 65, borderRadius: 33, backgroundColor: '#BAE6FD', opacity: 0.35 },
  heroBlobMR: { position: 'absolute', top: 10, right: -12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', opacity: 0.5 },

  // Brand identity — row layout to save vertical space
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  heroLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 3,
  },
  heroLogoImg: { width: 34, height: 34 },
  heroBrandTextWrap: { alignItems: 'flex-start', gap: 1 },
  heroBrandName: { fontSize: 17, letterSpacing: -0.2 },
  heroBrandPulse: { fontWeight: '900', color: PRIMARY },
  heroBrandMate:  { fontWeight: '900', color: SLATE },
  heroBrandConnect: { fontWeight: '600', color: SKY5 },
  heroBrandTagline: { fontSize: 11, color: MUTED, fontWeight: '500', letterSpacing: 0.1 },

  // Divider — thinner, shorter gap
  heroDivider: { width: '50%', height: 1, backgroundColor: '#E2E8F0', marginBottom: 12 },

  // Headline + CTA — tighter spacing
  heroContent: { alignItems: 'center', width: '100%' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: SLATE, letterSpacing: -0.5, textAlign: 'center' },
  heroTitleBlue: { fontSize: 22, fontWeight: '900', color: PRIMARY, letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' },
  heroSub: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 14, textAlign: 'center' },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 11,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  heroBtnText: { fontSize: 13, fontWeight: '800', color: WHITE, letterSpacing: 0.1 },

  // Search
  searchBar: { marginHorizontal: 16, marginBottom: 20, backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  searchText: { fontSize: 14, color: MUTED, flex: 1 },

  // Error banner
  errorBanner: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#FEF3C7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#FDE68A' },
  errorBannerText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600' },

  // Section
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: SLATE, letterSpacing: -0.3 },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll: { fontSize: 13, color: PRIMARY, fontWeight: '700' },
});

// Additional styles (appended separately to stay under limit)
Object.assign(s, StyleSheet.create({
  // Specialities
  specRow: { gap: 10, paddingRight: 16 },
  specItem: { alignItems: 'center', gap: 8, width: 72 },
  specIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 2 },
  specLabel: { fontSize: 11, fontWeight: '600', color: SLATE, textAlign: 'center', lineHeight: 14 },

  // Location prompt
  locationPrompt: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: WHITE, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: 4 },
  locationPromptIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  locationPromptTitle: { fontSize: 14, fontWeight: '700', color: SLATE },
  locationPromptSub: { fontSize: 12, color: MUTED, marginTop: 2 },

  // Clinic card
  clinicCard: { backgroundColor: WHITE, borderRadius: 16, flexDirection: 'row', marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  clinicImgWrap: { width: 120, height: 110, position: 'relative' },
  clinicImg: { width: 120, height: 110 },
  clinicImgPlaceholder: { backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  openBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#22C55E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  openBadgeText: { fontSize: 10, fontWeight: '700', color: WHITE },
  clinicInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  clinicName: { fontSize: 14, fontWeight: '800', color: SLATE, marginBottom: 4 },
  clinicLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  clinicLoc: { fontSize: 11, color: MUTED, flex: 1 },
  clinicMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  clinicQueueChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  clinicQueueText: { fontSize: 11, color: SKY6, fontWeight: '600' },
  clinicRatingChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clinicRatingText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  clinicBookBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  clinicBookBtnText: { fontSize: 12, fontWeight: '700', color: WHITE },

  // Doctor card
  doctorCard: { width: 150, backgroundColor: WHITE, borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  wishBtn: { position: 'absolute', top: 10, right: 10 },
  doctorName: { fontSize: 13, fontWeight: '700', color: SLATE, marginTop: 10, textAlign: 'center' },
  doctorSpec: { fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  bookBtn: { marginTop: 10, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 8, width: '100%', alignItems: 'center' },
  bookBtnText: { fontSize: 13, fontWeight: '700', color: PRIMARY },

  // Trust strip
  trustStrip: { backgroundColor: WHITE, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  trustIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontSize: 13, fontWeight: '700', color: SLATE },
  trustSub: { fontSize: 11, color: MUTED, marginTop: 1, lineHeight: 16 },
  trustFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginTop: 2 },
  trustFooterText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  // Health tip
  tipCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  tipLeft: { width: 52, height: 52, backgroundColor: '#F0FDF4', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tipEmoji: { fontSize: 26 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#16A34A', marginBottom: 3 },
  tipBody: { fontSize: 12, color: MUTED, lineHeight: 17 },
  tipDots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 12 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  tipDotActive: { backgroundColor: PRIMARY, width: 18 },

  // Empty
  emptyCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  emptySub: { fontSize: 13, color: MUTED, textAlign: 'center' },
}));
