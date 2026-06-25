// ─────────────────────────────────────────────────────────────────────────────
//  HomeScreen — PulseMate Connect  |  Premium Healthcare Dashboard
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Store & API ───────────────────────────────────────────────────────────────
import { useAuth } from '../store/authStore';
import { getNearby, searchDoctors } from '../api/patient';

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

export default function HomeScreen({ navigation }) {
  const { width }    = useWindowDimensions();
  const isTablet     = width >= 768;

  const [refreshing,     setRefreshing]     = useState(false);
  const [topDoctors,     setTopDoctors]     = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [nearbyClinics,  setNearbyClinics]  = useState([]);
  const [nearbyLoading,  setNearbyLoading]  = useState(false);
  const [tipIndex,       setTipIndex]       = useState(0);

  // ── Fetch doctors ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const res = await searchDoctors({ limit: 6, page: 1 });
      console.log('[DOCTORS]', JSON.stringify(res?.data));
      setTopDoctors(res?.data?.data || []);
    } catch (e) {
      console.log('[DOCTORS ERROR]', e?.response?.data || e?.message);
    } finally {
      setDoctorsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Called by HomeHeader when GPS coords are ready ────────────────────────
  const handleLocationFetched = useCallback(async (coords) => {
    setNearbyLoading(true);
    try {
      const res = await getNearby({
        lat:    coords.latitude,
        lng:    coords.longitude,
        radius: 50,
        type:   'clinics',
        limit:  10,
      });
      console.log('[NEARBY]', JSON.stringify(res?.data));
      setNearbyClinics(res?.data?.data?.clinics || []);
    } catch (e) {
      console.log('[NEARBY ERROR]', e?.response?.data || e?.message);
      setNearbyClinics([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-rotate health tips every 5 seconds
  useEffect(() => {
    const t = setInterval(
      () => setTipIndex((i) => (i + 1) % HEALTH_TIPS.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goSearch     = () => navigation.navigate('Search');
  const goDoctors    = () => navigation.navigate('DoctorsTab');
  const goBooking    = (doctor) =>
    navigation.navigate('DoctorsTab', {
      screen: 'DoctorDetail',
      params: { id: doctor?.id },
    });
  const goClinicBook = () => navigation.navigate('DoctorsTab');

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
          onViewAll={goDoctors}
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
