// ─────────────────────────────────────────────────────────────────────────────
//  NearbyClinicsScreen — PulseMate Connect
//  Full-page nearby clinics list with location-based search
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getNearby } from '../api/patient';
import { colors, shadow, radius } from '../theme';

const PRIMARY = '#2563EB';
const SKY6    = '#0284C7';
const SUCCESS = '#16A34A';
const MUTED   = '#94A3B8';
const SLATE   = '#0F172A';
const WHITE   = '#FFFFFF';
const BG      = '#F0F4FF';

function ClinicLogo({ name, size = 52 }) {
  const initial = name?.charAt(0)?.toUpperCase() || '🏥';
  const paletteBg   = ['#DBEAFE', '#D1FAE5', '#FEE2E2', '#EDE9FE', '#FEF3C7', '#CCFBF1'];
  const paletteText = ['#1D4ED8', '#065F46', '#991B1B', '#6D28D9', '#92400E', '#0F766E'];
  const idx = ((name?.charCodeAt(0) || 72) - 65) % paletteBg.length;
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.25,
      backgroundColor: paletteBg[idx],
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: '#E2E8F0',
    }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: '800', color: paletteText[idx] }}>{initial}</Text>
    </View>
  );
}

function ClinicRow({ clinic, onBook }) {
  const { name, distanceKm, city, district, queueCount, rating, isOpen, _count } = clinic;
  const queue    = queueCount ?? _count?.appointments ?? 0;
  const location = city || district || 'Nearby';
  const isOpenVal = isOpen ?? true;

  return (
    <View style={s.row}>
      <ClinicLogo name={name} size={52} />
      <View style={s.rowInfo}>
        <View style={s.rowTop}>
          <Text style={s.rowName} numberOfLines={1}>{name}</Text>
          <View style={[s.badge, !isOpenVal && s.badgeClosed]}>
            <Text style={[s.badgeText, !isOpenVal && s.badgeTextClosed]}>
              {isOpenVal ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={11} color={MUTED} />
          <Text style={s.metaText} numberOfLines={1}>
            {distanceKm ? `${distanceKm} km · ` : ''}{location}
          </Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="people-outline" size={11} color={SKY6} />
          <Text style={[s.metaText, { color: SKY6, fontWeight: '600' }]}>{queue} in queue</Text>
          {rating && (
            <>
              <Text style={{ color: MUTED, marginHorizontal: 6 }}>·</Text>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={s.metaText}> {rating}</Text>
            </>
          )}
        </View>
      </View>
      <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.85}>
        <Text style={s.bookBtnText}>Book</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NearbyClinicsScreen({ navigation }) {
  const [clinics,    setClinics]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locError,   setLocError]   = useState(false);
  const [radius,     setRadiusKm]   = useState(50);
  const [search,     setSearch]     = useState('');

  const loadClinics = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocError(true); setLoading(false); return; }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      const res = await getNearby({ lat: latitude, lng: longitude, radius, type: 'clinics', limit: 30 });
      setClinics(res?.data?.data?.clinics || []);
      setLocError(false);
    } catch {
      setLocError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [radius]);

  useEffect(() => { loadClinics(); }, [loadClinics]);

  const displayed = search.trim()
    ? clinics.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()))
    : clinics;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={SLATE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Nearby Clinics</Text>
          <Text style={s.sub}>{loading ? 'Locating...' : `${displayed.length} clinic${displayed.length !== 1 ? 's' : ''} found`}</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={MUTED} />
        <TextInput
          style={s.searchInput}
          placeholder="Search clinic name or city..."
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>

      {/* Radius chips */}
      <View style={s.radiusRow}>
        <Text style={s.radiusLabel}>Radius:</Text>
        {[10, 25, 50, 100].map((r) => (
          <TouchableOpacity key={r} style={[s.chip, radius === r && s.chipActive]}
            onPress={() => setRadiusKm(r)} activeOpacity={0.8}>
            <Text style={[s.chipText, radius === r && s.chipTextActive]}>{r} km</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={s.loadText}>Finding nearby clinics...</Text>
        </View>
      ) : locError ? (
        <View style={s.center}>
          <Ionicons name="location-outline" size={48} color={MUTED} />
          <Text style={s.emptyTitle}>Location required</Text>
          <Text style={s.emptySub}>Enable location to find clinics near you</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadClinics} activeOpacity={0.88}>
            <Text style={s.retryText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      ) : displayed.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="business-outline" size={48} color={MUTED} />
          <Text style={s.emptyTitle}>No clinics found</Text>
          <Text style={s.emptySub}>Try increasing the search radius</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => setRadiusKm(100)} activeOpacity={0.88}>
            <Text style={s.retryText}>Search 100 km</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(c) => c.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadClinics(); }} tintColor={PRIMARY} colors={[PRIMARY]} />}
          renderItem={({ item }) => (
            <ClinicRow clinic={item}
              onBook={() => navigation.navigate('DoctorsTab')} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  backBtn:     { width: 38, height: 38, borderRadius: 12, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  title:       { fontSize: 20, fontWeight: '800', color: SLATE, letterSpacing: -0.3 },
  sub:         { fontSize: 11, color: MUTED, marginTop: 1 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 18, marginBottom: 10, backgroundColor: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: SLATE },
  radiusRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, marginBottom: 12 },
  radiusLabel: { fontSize: 12, fontWeight: '600', color: MUTED },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipActive:  { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText:    { fontSize: 12, fontWeight: '600', color: MUTED },
  chipTextActive: { color: WHITE },
  list:        { paddingHorizontal: 18, paddingBottom: 32 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, borderRadius: 18, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  rowInfo:     { flex: 1 },
  rowTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  rowName:     { fontSize: 14, fontWeight: '700', color: SLATE, flex: 1, marginRight: 8 },
  badge:       { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeClosed: { backgroundColor: '#F1F5F9' },
  badgeText:   { fontSize: 10, fontWeight: '700', color: SUCCESS },
  badgeTextClosed: { color: '#64748B' },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText:    { fontSize: 11, color: MUTED },
  bookBtn:     { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  bookBtnText: { fontSize: 12, fontWeight: '700', color: WHITE },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  loadText:    { fontSize: 14, color: MUTED },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: SLATE },
  emptySub:    { fontSize: 13, color: MUTED, textAlign: 'center' },
  retryBtn:    { marginTop: 8, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:   { fontSize: 14, fontWeight: '700', color: WHITE },
});
