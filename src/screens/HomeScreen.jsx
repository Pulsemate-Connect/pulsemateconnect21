// ─────────────────────────────────────────────────────────────────────────────
//  HomeScreen — PulseMate Connect  |  Premium Healthcare Dashboard
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ── Store & API ───────────────────────────────────────────────────────────────
import { useAuth } from '../store/authStore';
import { getNearby, searchDoctors, getPatientProfile } from '../api/patient';

// ── Home sub-components ───────────────────────────────────────────────────────
import HomeHeader           from './Home/components/HomeHeader';
import HeroBanner           from './Home/components/HeroBanner';
import SearchBar            from './Home/components/SearchBar';
import SpecialitiesSection  from './Home/components/SpecialitiesSection';
import NearbyClinicsSection from './Home/components/NearbyClinicsSection';
import TopDoctorsSection    from './Home/components/TopDoctorsSection';
import TrustBanner          from './Home/components/TrustBanner';
import HealthTipSection, { HEALTH_TIPS } from './Home/components/HealthTipSection';

const PRIMARY = '#2563EB';
const BG      = '#F8FBFF';

// ── Profile completion calculator ────────────────────────────────────────────
const calcCompletion = (user) => {
  const p = user?.patientProfile;
  const checks = [
    { label: 'Name',             done: !!user?.name },
    { label: 'Gender',           done: !!p?.gender },
    { label: 'Date of Birth',    done: !!(p?.dob || p?.age) },
    { label: 'City',             done: !!(p?.city || p?.address) },
    { label: 'Emergency Contact',done: !!p?.emergencyContact },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  return { pct, missing: checks.filter((c) => !c.done).map((c) => c.label) };
};

// ── Profile Completion Banner ─────────────────────────────────────────────────
function ProfileBanner({ pct, missing, onPress }) {
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const color = pct === 100 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626';
  const bgColor = pct === 100 ? '#F0FDF4' : pct >= 60 ? '#FFFBEB' : '#FEF2F2';
  const borderColor = pct === 100 ? '#BBF7D0' : pct >= 60 ? '#FDE68A' : '#FECACA';

  if (pct === 100) return null; // Hide when complete

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginHorizontal: 16, marginBottom: 14 }}>
      <TouchableOpacity
        style={[pb.card, { backgroundColor: bgColor, borderColor }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={pb.top}>
          <View style={[pb.iconWrap, { backgroundColor: `${color}18` }]}>
            <Ionicons name="person-circle-outline" size={20} color={color} />
          </View>
          <View style={pb.textWrap}>
            <Text style={[pb.title, { color }]}>Complete your health profile</Text>
            <Text style={pb.sub}>Required before booking appointments</Text>
          </View>
          <Text style={[pb.pct, { color }]}>{pct}%</Text>
        </View>

        {/* Progress bar */}
        <View style={pb.trackWrap}>
          <View style={pb.track}>
            <View style={[pb.fill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
        </View>

        {/* Missing fields */}
        {missing.length > 0 && (
          <View style={pb.chips}>
            {missing.slice(0, 3).map((m) => (
              <View key={m} style={[pb.chip, { borderColor: `${color}40`, backgroundColor: `${color}10` }]}>
                <Text style={[pb.chipText, { color }]}>+ {m}</Text>
              </View>
            ))}
            {missing.length > 3 && (
              <View style={[pb.chip, { borderColor: `${color}40`, backgroundColor: `${color}10` }]}>
                <Text style={[pb.chipText, { color }]}>+{missing.length - 3} more</Text>
              </View>
            )}
          </View>
        )}

        <View style={pb.tapHint}>
          <Text style={[pb.tapHintText, { color }]}>Tap to complete profile</Text>
          <Ionicons name="chevron-forward" size={12} color={color} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const pb = StyleSheet.create({
  card:       { borderRadius: 18, padding: 14, borderWidth: 1.5 },
  top:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconWrap:   { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textWrap:   { flex: 1 },
  title:      { fontSize: 13, fontWeight: '700' },
  sub:        { fontSize: 11, color: '#6B7280', marginTop: 1 },
  pct:        { fontSize: 16, fontWeight: '800' },
  trackWrap:  { marginBottom: 8 },
  track:      { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' },
  fill:       { height: '100%', borderRadius: 3 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip:       { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  chipText:   { fontSize: 10, fontWeight: '600' },
  tapHint:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  tapHintText:{ fontSize: 10, fontWeight: '600' },
});

export default function HomeScreen({ navigation }) {
  const { width }    = useWindowDimensions();
  const isTablet     = width >= 768;

  const [refreshing,        setRefreshing]        = useState(false);
  const [topDoctors,        setTopDoctors]        = useState([]);
  const [doctorsLoading,    setDoctorsLoading]    = useState(true);
  const [nearbyClinics,     setNearbyClinics]     = useState([]);
  const [nearbyLoading,     setNearbyLoading]     = useState(false);
  const [tipIndex,          setTipIndex]          = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(null); // { pct, missing }

  // ── Fetch doctors + profile ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [doctorRes, profileRes] = await Promise.allSettled([
        searchDoctors({ limit: 6, page: 1 }),
        getPatientProfile(),
      ]);

      if (doctorRes.status === 'fulfilled') {
        setTopDoctors(doctorRes.value?.data?.data || []);
      }

      if (profileRes.status === 'fulfilled') {
        const u = profileRes.value?.data?.data?.user;
        if (u) setProfileCompletion(calcCompletion(u));
      }
    } catch {}
    finally {
      setDoctorsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Called by HomeHeader when GPS coords are ready ────────────────────────
  const handleLocationFetched = useCallback(async (coords) => {
    setNearbyLoading(true);
    try {
      const res = await getNearby({
        lat: coords.latitude, lng: coords.longitude,
        radius: 50, type: 'clinics', limit: 10,
      });
      setNearbyClinics(res?.data?.data?.clinics || []);
    } catch {
      setNearbyClinics([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-rotate health tips every 5 seconds
  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % HEALTH_TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goSearch     = () => navigation.navigate('Search');
  const goDoctors    = () => navigation.navigate('DoctorsTab');
  const goBooking    = (doctor) => navigation.navigate('DoctorsTab', { screen: 'DoctorDetail', params: { doctorId: doctor?.id } });
  const goClinicBook = () => navigation.navigate('DoctorsTab');
  const goAllClinics = () => navigation.navigate('NearbyClinics');
  const goProfile    = () => navigation.navigate('ProfileTab', { screen: 'ProfileWizard', params: { returnTo: 'Home' } });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        contentContainerStyle={[s.scroll, isTablet && s.scrollTablet]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      >
        {/* index 0 — scrolls away */}
        <HomeHeader onLocationFetched={handleLocationFetched} />

        {/* index 1 — sticks at top when scrolled */}
        <View style={s.stickySearch}>
          <SearchBar onPress={goSearch} />
        </View>

        {/* rest scrolls freely */}
        <HeroBanner onGetStarted={goSearch} />

        <SpecialitiesSection
          onViewAll={goDoctors}
          onSpeciality={() => goDoctors()}
        />

        <NearbyClinicsSection
          clinics={nearbyClinics}
          loading={nearbyLoading}
          locationStatus={nearbyClinics.length > 0 || nearbyLoading ? 'granted' : 'idle'}
          onRequestLoc={() => {}}
          onViewAll={goAllClinics}
          onBook={goClinicBook}
        />

        <TopDoctorsSection
          doctors={topDoctors}
          loading={doctorsLoading}
          onViewAll={goDoctors}
          onBook={goBooking}
        />

        <TrustBanner />

        <HealthTipSection
          tipIndex={tipIndex}
          onNext={() => setTipIndex((i) => (i + 1) % HEALTH_TIPS.length)}
          onViewAll={() => {}}
        />

        <View style={s.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingBottom: 16,
  },
  scrollTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 900,
  },
  stickySearch: {
    backgroundColor: BG,
    paddingBottom: 4,
  },
  bottomSpacer: {
    height: 24,
  },
});
