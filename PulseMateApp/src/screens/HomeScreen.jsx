// ─────────────────────────────────────────────────────────────────────────────
//  HomeScreen — PulseMate Connect  |  Premium Healthcare Dashboard
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
  Dimensions, StatusBar, Platform,
} from 'react-native';import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../store/authStore';
import { getMyAppointments, getLiveQueue, getNearby } from '../api/patient';
import { getMyNotifications } from '../api/auth';

const { width: W } = Dimensions.get('window');
const LOGO = require('../../assets/logo1.jpeg');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY4 = '#38BDF8'; const SKY5 = '#0EA5E9'; const SKY6 = '#0284C7';
const SKY7 = '#0369A1'; const TEAL = '#2DD4BF'; const WHITE = '#FFFFFF';
const SLATE = '#0F172A'; const MUTED = '#94A3B8'; const BG = '#F0F7FF';

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK = [
  { icon: 'calendar',      label: 'Book\nAppointment', bg: '#EFF6FF', ic: SKY6,      action: 'book'          },
  { icon: 'calendar-outline', label: 'Appointments',   bg: '#F0FDFA', ic: '#0D9488', action: 'appointments'  },
  { icon: 'person-circle', label: 'My\nProfile',       bg: '#FFF7ED', ic: '#EA580C', action: 'profile'       },
];

// ── Specializations removed — belongs in SearchScreen ────────────────────────

// ── Nearby clinics (loaded from API) ─────────────────────────────────────────
// ── Recommended doctors (loaded from API) ────────────────────────────────────

// ── Simple live dot (no animation) ───────────────────────────────────────────
function LiveIndicator() {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />;
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }) {
  return (
    <View style={hs.sectionRow}>
      <Text style={hs.sectionTitle}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={hs.viewAll}>View all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Upcoming appointment card ─────────────────────────────────────────────────
function AppointmentCard({ appt, onPress }) {
  const statusMeta = {
    BOOKED:          { label: 'Confirmed',   color: SKY5,     bg: '#E0F2FE' },
    CHECKED_IN:      { label: 'Checked In',  color: '#10B981', bg: '#D1FAE5' },
    IN_QUEUE:        { label: 'In Queue',    color: '#F59E0B', bg: '#FEF3C7' },
    IN_CONSULTATION: { label: 'In Progress', color: '#8B5CF6', bg: '#EDE9FE' },
    CALLED:          { label: 'Called',      color: '#EF4444', bg: '#FEE2E2' },
  };
  const meta = statusMeta[appt.status] || { label: appt.status, color: MUTED, bg: '#F1F5F9' };
  const initial = appt.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D';
  const date = new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity style={hs.apptCard} onPress={onPress} activeOpacity={0.88}>
      {/* Left accent bar */}
      <View style={[hs.apptAccent, { backgroundColor: meta.color }]} />

      {/* Avatar */}
      <View style={[hs.apptAvatar, { backgroundColor: meta.bg }]}>
        <Text style={[hs.apptAvatarText, { color: meta.color }]}>{initial}</Text>
      </View>

      {/* Info */}
      <View style={hs.apptInfo}>
        <Text style={hs.apptName}>Dr. {appt.doctor?.user?.name}</Text>
        <Text style={hs.apptSpec}>{appt.doctor?.specialization || 'General Physician'}</Text>
        <View style={hs.apptMetaRow}>
          <Ionicons name="location-outline" size={11} color={MUTED} />
          <Text style={hs.apptMetaText}>{appt.clinic?.name}</Text>
          <View style={hs.metaDot} />
          <Ionicons name="calendar-outline" size={11} color={MUTED} />
          <Text style={hs.apptMetaText}>{date}</Text>
        </View>
      </View>

      {/* Right */}
      <View style={hs.apptRight}>
        <View style={[hs.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[hs.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {appt.queueNumber && (
          <Text style={hs.queueNum}>#{appt.queueNumber}</Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={MUTED} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main HomeScreen ───────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeAppt,   setActiveAppt]   = useState(null);
  const [queueInfo,    setQueueInfo]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);

  // ── Location & Nearby ──────────────────────────────────────────────────────
  const [location,       setLocation]       = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | asking | granted | denied
  const [nearbyClinics,  setNearbyClinics]  = useState([]);
  const [nearbyLoading,  setNearbyLoading]  = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMyAppointments({ limit: 20 });
      const all = res.data.data || [];
      setAppointments(all);
      const active = all.find((a) =>
        ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'CALLED'].includes(a.status)
      );
      setActiveAppt(active || null);
      if (active) {
        try {
          const qRes = await getLiveQueue(active.id);
          setQueueInfo(qRes.data.data?.queueInfo || null);
        } catch { setQueueInfo(null); }
      }
      try {
        const notifRes = await getMyNotifications();
        setUnreadCount(notifRes.data.data.unreadCount || 0);
      } catch {}
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  // ── Request location & fetch nearby ───────────────────────────────────────
  const fetchNearby = useCallback(async (coords) => {
    if (!coords) return;
    setNearbyLoading(true);
    try {
      const res = await getNearby({
        lat: coords.latitude,
        lng: coords.longitude,
        radius: 50,
        type: 'all',
        limit: 10,
      });
      const data = res.data.data || {};
      setNearbyClinics(data.clinics || []);
    } catch {
      setNearbyClinics([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setLocationStatus('asking');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      setLocationStatus('granted');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc.coords);
      fetchNearby(loc.coords);
    } catch {
      setLocationStatus('denied');
    }
  }, [fetchNearby]);

  // GPS is opt-in only — no auto-request on mount
  useEffect(() => { load(); }, [load]);

  const upcoming = appointments
    .filter((a) => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status))
    .slice(0, 3);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const handleQuick = (action) => {
    if (action === 'book')               navigation.navigate('Search');
    else if (action === 'appointments')  navigation.navigate('AppointmentsTab');
    else if (action === 'profile')       navigation.navigate('ProfileTab');
  };

  return (
    <SafeAreaView style={hs.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={SKY5} />}
      >
        <View>

          {/* ── Header ── */}
          <View style={hs.header}>
            <View style={hs.headerLeft}>
              <Image source={LOGO} style={hs.logoImg} resizeMode="cover" />
              <View>
                <Text style={hs.brandName}>
                  Pulse<Text style={{ color: SKY5 }}>Mate</Text>
                </Text>
                <Text style={hs.greetingSmall}>Hello, {firstName}</Text>
              </View>
            </View>
            <View style={hs.headerRight}>
              <TouchableOpacity style={hs.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8}>
                <Ionicons name="notifications-outline" size={20} color={SLATE} />
                {unreadCount > 0 && (
                  <View style={hs.notifDot}>
                    <Text style={hs.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Search bar ── */}
          <TouchableOpacity style={hs.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
            <View style={hs.searchLeft}>
              <Ionicons name="search-outline" size={18} color={MUTED} />
              <Text style={hs.searchText}>Search doctors, clinics, specialities...</Text>
            </View>
            <View style={hs.filterBtn}>
              <Ionicons name="options-outline" size={16} color={SKY6} />
            </View>
          </TouchableOpacity>

          {/* ── Hero appointment card ── */}
          {loading ? (
            <View style={hs.heroCard}>
              <ActivityIndicator color={WHITE} />
            </View>
          ) : activeAppt ? (
            <TouchableOpacity
              style={hs.heroCard}
              onPress={() => navigation.navigate('LiveQueue', { appointmentId: activeAppt.id })}
              activeOpacity={0.92}
            >
              {/* BG decoration */}
              <View style={hs.heroBlobTL} />
              <View style={hs.heroBlobBR} />

              <View style={hs.heroTop}>
                <View>
                  <View style={hs.heroLiveBadge}>
                    <LiveIndicator />
                    <Text style={hs.heroLiveText}>LIVE QUEUE</Text>
                  </View>
                  <Text style={hs.heroClinic}>{activeAppt.clinic?.name}</Text>
                  <Text style={hs.heroDoc}>Dr. {activeAppt.doctor?.user?.name}</Text>
                </View>
                <View style={hs.heroTokenBox}>
                  <Text style={hs.heroTokenLabel}>Token</Text>
                  <Text style={hs.heroTokenNum}>#{activeAppt.queueNumber || '—'}</Text>
                </View>
              </View>

              <View style={hs.heroDivider} />

              <View style={hs.heroBottom}>
                <View style={hs.heroStat}>
                  <Text style={hs.heroStatNum}>{queueInfo?.patientsAhead ?? '—'}</Text>
                  <Text style={hs.heroStatLabel}>Ahead</Text>
                </View>
                <View style={hs.heroStatDivider} />
                <View style={hs.heroStat}>
                  <Text style={hs.heroStatNum}>{queueInfo?.estimatedWaitMinutes ? `${queueInfo.estimatedWaitMinutes}m` : '—'}</Text>
                  <Text style={hs.heroStatLabel}>Est. Wait</Text>
                </View>
                <View style={hs.heroStatDivider} />
                <View style={hs.heroStat}>
                  <Text style={hs.heroStatNum}>{queueInfo?.currentlyServing ? `#${queueInfo.currentlyServing}` : '—'}</Text>
                  <Text style={hs.heroStatLabel}>Serving</Text>
                </View>
                <TouchableOpacity style={hs.heroTrackBtn} activeOpacity={0.85}>
                  <Text style={hs.heroTrackText}>Track</Text>
                  <Ionicons name="arrow-forward" size={13} color={WHITE} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={hs.heroCard} onPress={() => navigation.navigate('Search')} activeOpacity={0.92}>
              <View style={hs.heroBlobTL} />
              <View style={hs.heroBlobBR} />
              <View style={hs.heroEmpty}>
                <View style={hs.heroEmptyIcon}>
                  <Ionicons name="calendar" size={28} color={WHITE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={hs.heroEmptyTitle}>No Active Appointment</Text>
                  <Text style={hs.heroEmptySub}>Book a doctor to track your live queue here</Text>
                </View>
              </View>
              <TouchableOpacity style={hs.heroBookBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
                <Ionicons name="add-circle-outline" size={16} color={SKY5} />
                <Text style={hs.heroBookText}>Book Appointment</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* ── Quick Actions ── */}
          <View style={hs.quickGrid}>
            {QUICK.map((item) => (
              <TouchableOpacity key={item.label} style={hs.quickItem} onPress={() => handleQuick(item.action)} activeOpacity={0.8}>
                <View style={[hs.quickIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={22} color={item.ic} />
                </View>
                <Text style={hs.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Upcoming Appointments ── */}
          <View style={hs.section}>
            <SectionHeader title="Upcoming Appointments" onViewAll={() => navigation.navigate('AppointmentsTab')} />
            {loading ? (
              <ActivityIndicator color={SKY5} style={{ marginVertical: 20 }} />
            ) : upcoming.length === 0 ? (
              <View style={hs.emptyCard}>
                <View style={hs.emptyIconWrap}>
                  <Ionicons name="calendar-outline" size={32} color={SKY5} />
                </View>
                <Text style={hs.emptyTitle}>No upcoming appointments</Text>
                <Text style={hs.emptySub}>Find a doctor and book your first appointment</Text>
                <TouchableOpacity style={hs.emptyBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
                  <Ionicons name="search" size={14} color={WHITE} />
                  <Text style={hs.emptyBtnText}>Find a Doctor</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onPress={() => navigation.navigate('AppointmentsTab', { screen: 'AppointmentDetail', params: { id: appt.id } })}
                />
              ))
            )}
          </View>

          {/* ── Nearby Clinics ── */}
          <View style={hs.section}>
            <SectionHeader title="Nearby Clinics" onViewAll={() => navigation.navigate('Search')} />
            {locationStatus === 'idle' && (
              <TouchableOpacity style={hs.locationPrompt} onPress={requestLocation} activeOpacity={0.85}>
                <View style={hs.locationPromptIcon}>
                  <Ionicons name="location-outline" size={24} color={SKY6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={hs.locationPromptTitle}>Enable Location</Text>
                  <Text style={hs.locationPromptSub}>Tap to find clinics near you</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={SKY5} />
              </TouchableOpacity>
            )}
            {locationStatus === 'asking' && (
              <View style={hs.locationPrompt}>
                <ActivityIndicator color={SKY5} />
                <Text style={[hs.locationPromptSub, { marginLeft: 12 }]}>Getting your location…</Text>
              </View>
            )}
            {locationStatus === 'denied' && (
              <TouchableOpacity style={hs.locationPrompt} onPress={requestLocation} activeOpacity={0.85}>
                <Ionicons name="location-outline" size={22} color="#EF4444" />
                <Text style={[hs.locationPromptSub, { marginLeft: 10, color: '#EF4444' }]}>
                  Location denied — tap to retry
                </Text>
              </TouchableOpacity>
            )}
            {locationStatus === 'granted' && nearbyLoading && (
              <ActivityIndicator color={SKY5} style={{ marginVertical: 20 }} />
            )}
            {locationStatus === 'granted' && !nearbyLoading && nearbyClinics.length === 0 && (
              <View style={hs.emptyCard}>
                <Ionicons name="business-outline" size={30} color={MUTED} />
                <Text style={[hs.emptySub, { marginTop: 8 }]}>No verified clinics found within 50 km</Text>
              </View>
            )}
            {locationStatus === 'granted' && !nearbyLoading && nearbyClinics.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                {nearbyClinics.map((c) => (
                  <TouchableOpacity key={c.id} style={hs.clinicCard} onPress={() => navigation.navigate('Search')} activeOpacity={0.88}>
                    <View style={hs.clinicIconWrap}>
                      <Ionicons name="business" size={22} color={SKY6} />
                    </View>
                    <Text style={hs.clinicName} numberOfLines={1}>{c.name}</Text>
                    <Text style={hs.clinicArea} numberOfLines={1}>{c.district || c.city}</Text>
                    <View style={hs.clinicMeta}>
                      <Ionicons name="navigate-outline" size={11} color={SKY5} />
                      <Text style={hs.clinicDist}>{c.distanceKm} km</Text>
                    </View>
                    {c.specialties?.length > 0 && (
                      <View style={[hs.clinicTag, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={[hs.clinicTagText, { color: SKY6 }]} numberOfLines={1}>
                          {c.specialties[0]}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const hs = StyleSheet.create({

  safe: { flex: 1, backgroundColor: BG },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Logo image in header
  logoImg: {
    width: 42, height: 42, borderRadius: 12,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  brandName:     { fontSize: 19, fontWeight: '800', color: SLATE, letterSpacing: -0.4 },
  greetingSmall: { fontSize: 12, color: MUTED, fontWeight: '500', marginTop: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: WHITE,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  notifDotText: { fontSize: 8, color: '#fff', fontWeight: '800', lineHeight: 10 },

  // ── Search bar ───────────────────────────────────────────────────────────────
  searchBar: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: WHITE, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  searchLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  searchText:  { fontSize: 14, color: MUTED, flex: 1 },
  filterBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero card ────────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: SKY5, borderRadius: 24,
    padding: 20, overflow: 'hidden',
    shadowColor: SKY5, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
    minHeight: 130,
  },
  heroBlobTL: {
    position: 'absolute', top: -40, left: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroBlobBR: {
    position: 'absolute', bottom: -30, right: -30,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heroLiveText:  { fontSize: 10, fontWeight: '800', color: TEAL, letterSpacing: 1.2 },
  heroClinic:    { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  heroDoc:       { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroTokenBox: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTokenLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 2 },
  heroTokenNum:   { fontSize: 24, fontWeight: '900', color: WHITE, letterSpacing: -0.5 },
  heroDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 14 },
  heroBottom:     { flexDirection: 'row', alignItems: 'center', gap: 0 },
  heroStat:       { flex: 1, alignItems: 'center' },
  heroStatNum:    { fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.5 },
  heroStatLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '500' },
  heroStatDivider:{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroTrackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    marginLeft: 8,
  },
  heroTrackText:  { fontSize: 12, fontWeight: '700', color: WHITE },
  heroEmpty:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  heroEmptyIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  heroEmptyTitle: { fontSize: 16, fontWeight: '700', color: WHITE },
  heroEmptySub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  heroBookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: WHITE, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 11, alignSelf: 'flex-start',
  },
  heroBookText: { fontSize: 13, fontWeight: '700', color: SKY5 },

  // ── Quick actions ────────────────────────────────────────────────────────────
  quickGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 24,
  },
  quickItem: { alignItems: 'center', width: '22%' },
  quickIcon: {
    width: 58, height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: SLATE, textAlign: 'center', lineHeight: 15 },

  // ── Section ──────────────────────────────────────────────────────────────────
  section:     { paddingHorizontal: 20, marginBottom: 24 },
  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:{ fontSize: 17, fontWeight: '800', color: SLATE, letterSpacing: -0.3 },
  viewAll:     { fontSize: 13, color: SKY5, fontWeight: '700' },

  // ── Specializations ──────────────────────────────────────────────────────────
  specRow:  { gap: 12, paddingRight: 20 },
  specItem: { alignItems: 'center', gap: 8, width: 72 },
  specIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
  },
  specLabel: { fontSize: 11, fontWeight: '600', color: SLATE, textAlign: 'center', lineHeight: 14 },

  // ── Appointment card ─────────────────────────────────────────────────────────
  apptCard: {
    backgroundColor: WHITE, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  apptAccent:    { width: 4, alignSelf: 'stretch' },
  apptAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12, marginVertical: 14,
  },
  apptAvatarText: { fontSize: 18, fontWeight: '800' },
  apptInfo:       { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  apptName:       { fontSize: 14, fontWeight: '700', color: SLATE, marginBottom: 2 },
  apptSpec:       { fontSize: 12, color: MUTED, marginBottom: 6 },
  apptMetaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  apptMetaText:   { fontSize: 11, color: '#64748B' },
  apptRight:      { paddingRight: 14, alignItems: 'flex-end', gap: 4 },
  statusBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:     { fontSize: 10, fontWeight: '700' },
  queueNum:       { fontSize: 13, fontWeight: '800', color: SLATE },
  metaDot:        { width: 3, height: 3, borderRadius: 2, backgroundColor: MUTED },

  // ── Empty state ──────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: WHITE, borderRadius: 20,
    padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: SLATE, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: SKY5, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // ── Nearby clinics ───────────────────────────────────────────────────────────
  locationPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: WHITE, borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    marginBottom: 4,
  },
  locationPromptIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  locationPromptTitle: { fontSize: 14, fontWeight: '700', color: SLATE },
  locationPromptSub:   { fontSize: 12, color: MUTED, marginTop: 2 },
  clinicCard: {
    width: 160, backgroundColor: WHITE, borderRadius: 18,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  clinicIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  clinicName:    { fontSize: 13, fontWeight: '700', color: SLATE, marginBottom: 2 },
  clinicArea:    { fontSize: 11, color: MUTED, marginBottom: 8 },
  clinicMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  clinicRating:  { fontSize: 11, fontWeight: '700', color: SLATE },
  clinicDist:    { fontSize: 11, color: MUTED },
  clinicTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start',
  },
  clinicTagDot:  { width: 5, height: 5, borderRadius: 3 },
  clinicTagText: { fontSize: 10, fontWeight: '700' },

  // ── Recommended doctors ──────────────────────────────────────────────────────
  docCard: {
    backgroundColor: WHITE, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  docAvatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  docAvatarText: { fontSize: 20, fontWeight: '800', color: SKY5 },
  docInfo:       { flex: 1 },
  docName:       { fontSize: 14, fontWeight: '700', color: SLATE, marginBottom: 2 },
  docSpec:       { fontSize: 12, color: MUTED, marginBottom: 6 },
  docMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docRating:     { fontSize: 11, fontWeight: '700', color: SLATE },
  docAvailText:  { fontSize: 11, color: '#10B981', fontWeight: '600' },
  docRight:      { alignItems: 'flex-end', gap: 4 },
  docFee:        { fontSize: 15, fontWeight: '800', color: SLATE },
  docFeeLabel:   { fontSize: 10, color: MUTED },
  docBookBtn: {
    backgroundColor: SKY5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  docBookText: { fontSize: 12, fontWeight: '700', color: WHITE },
});
