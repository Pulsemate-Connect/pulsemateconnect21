// ─────────────────────────────────────────────────────────────────────────────
//  TopDoctorsScreen — PulseMate Connect
//  Full-page doctor listing with filters — real backend data only
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { searchDoctors, getNearby } from '../api/patient';

const PRIMARY = '#2563EB';
const SLATE   = '#0F172A';
const MUTED   = '#94A3B8';
const WHITE   = '#FFFFFF';
const BG      = '#F0F4FF';

const SPECIALITIES = ['All', 'Cardiologist', 'Dermatologist', 'Orthopedic', 'Pediatrician', 'General Physician', 'Gynecologist', 'Neurologist', 'Psychiatrist', 'ENT'];

// ── Doctor Avatar ──────────────────────────────────────────────────────────
function DoctorAvatar({ photoUrl, name, size = 56 }) {
  const [broken, setBroken] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'D';
  const paletteBg   = ['#DBEAFE', '#D1FAE5', '#FEE2E2', '#EDE9FE', '#FEF3C7'];
  const paletteText = ['#1D4ED8', '#065F46', '#991B1B', '#6D28D9', '#92400E'];
  const idx = ((name?.charCodeAt(0) || 65) - 65) % paletteBg.length;

  if (photoUrl && !broken) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setBroken(true)}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: paletteBg[idx], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: WHITE }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: paletteText[idx] }}>{initial}</Text>
    </View>
  );
}

// ── Doctor Row Card ────────────────────────────────────────────────────────
function DoctorRow({ doctor, onBook }) {
  const name    = doctor.user?.name || 'Doctor';
  const spec    = doctor.specialization || 'General Physician';
  const exp     = doctor.experienceYears;
  const rating  = doctor.rating;
  const fee     = doctor.consultationFee;
  const photo   = doctor.profilePhotoUrl || doctor.photoUrl || null;
  const dist    = doctor.distanceKm;
  const clinic  = doctor.nearestClinic?.name || doctor.clinicName;

  return (
    <View style={r.card}>
      <DoctorAvatar photoUrl={photo} name={name} size={56} />
      <View style={r.info}>
        <Text style={r.name} numberOfLines={1}>Dr. {name}</Text>
        <Text style={r.spec}>{spec}</Text>
        <View style={r.metaRow}>
          {exp != null && (
            <View style={r.tag}>
              <Ionicons name="briefcase-outline" size={10} color={MUTED} />
              <Text style={r.tagText}>{exp} yrs</Text>
            </View>
          )}
          {rating && (
            <View style={r.tag}>
              <Ionicons name="star" size={10} color="#F59E0B" />
              <Text style={r.tagText}>{rating}</Text>
            </View>
          )}
          {dist != null && (
            <View style={r.tag}>
              <Ionicons name="location-outline" size={10} color={MUTED} />
              <Text style={r.tagText}>{dist} km</Text>
            </View>
          )}
        </View>
        {clinic && (
          <Text style={r.clinic} numberOfLines={1}>
            <Ionicons name="business-outline" size={10} color={MUTED} /> {clinic}
          </Text>
        )}
      </View>
      <View style={r.right}>
        {fee != null && <Text style={r.fee}>₹{fee}</Text>}
        <TouchableOpacity style={r.bookBtn} onPress={onBook} activeOpacity={0.85}>
          <Text style={r.bookBtnText}>Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const r = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  info:      { flex: 1 },
  name:      { fontSize: 14, fontWeight: '700', color: SLATE },
  spec:      { fontSize: 12, color: MUTED, marginTop: 2 },
  metaRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F8FAFC', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  tagText:   { fontSize: 10, color: '#64748B', fontWeight: '600' },
  clinic:    { fontSize: 10, color: MUTED, marginTop: 4 },
  right:     { alignItems: 'center', gap: 6 },
  fee:       { fontSize: 12, fontWeight: '700', color: PRIMARY },
  bookBtn:   { backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  bookBtnText: { fontSize: 12, fontWeight: '700', color: WHITE },
});

// ── Sort options ───────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: 'nearest',    label: 'Nearest' },
  { key: 'rating',     label: 'Top Rated' },
  { key: 'experience', label: 'Most Experienced' },
];

export default function TopDoctorsScreen({ navigation }) {
  const [doctors,    setDoctors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [specialty,  setSpecialty]  = useState('All');
  const [sortBy,     setSortBy]     = useState('nearest');
  const [coords,     setCoords]     = useState(null);
  const searchTimer = useRef(null);

  const loadDoctors = useCallback(async (forceCoords) => {
    try {
      setError(null);
      let loc = forceCoords || coords;

      // Try to get GPS for nearby sorting
      if (!loc) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCoords(loc);
        }
      }

      let allDoctors = [];

      if (loc) {
        // Fetch nearby doctors via location
        const res = await getNearby({ lat: loc.latitude, lng: loc.longitude, radius: 100, type: 'doctors', limit: 50 });
        allDoctors = res?.data?.data?.doctors || [];
      }

      // Fallback to general search if no nearby results
      if (allDoctors.length === 0) {
        const res = await searchDoctors({ limit: 50, page: 1 });
        allDoctors = res?.data?.data || [];
      }

      setDoctors(allDoctors);
    } catch (e) {
      setError('Unable to load doctors.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords]);

  useEffect(() => { loadDoctors(); }, []);

  // Debounce search
  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {}, 300);
  };

  // Filter + sort
  const displayed = doctors
    .filter((d) => {
      const name = d.user?.name || '';
      const spec = d.specialization || '';
      const matchSearch = !search.trim() ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        spec.toLowerCase().includes(search.toLowerCase());
      const matchSpec = specialty === 'All' || spec.toLowerCase().includes(specialty.toLowerCase());
      return matchSearch && matchSpec;
    })
    .sort((a, b) => {
      if (sortBy === 'nearest')    return (a.distanceKm || 999) - (b.distanceKm || 999);
      if (sortBy === 'rating')     return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      if (sortBy === 'experience') return (b.experienceYears || 0) - (a.experienceYears || 0);
      return 0;
    });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={SLATE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Top Doctors</Text>
          <Text style={s.sub}>{loading ? 'Loading...' : `${displayed.length} doctor${displayed.length !== 1 ? 's' : ''} found`}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={MUTED} />
        <TextInput
          style={s.searchInput}
          placeholder="Search doctors, specialities..."
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort chips */}
      <View style={s.chipRow}>
        {SORT_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.key}
            style={[s.chip, sortBy === o.key && s.chipActive]}
            onPress={() => setSortBy(o.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, sortBy === o.key && s.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Specialty filter */}
      <FlatList
        data={SPECIALITIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i}
        contentContainerStyle={s.specRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.specChip, specialty === item && s.specChipActive]}
            onPress={() => setSpecialty(item)}
            activeOpacity={0.8}
          >
            <Text style={[s.specChipText, specialty === item && s.specChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={s.loadText}>Loading doctors...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={MUTED} />
          <Text style={s.emptyTitle}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); loadDoctors(); }} activeOpacity={0.88}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : displayed.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="person-outline" size={48} color={MUTED} />
          <Text style={s.emptyTitle}>No doctors available.</Text>
          {specialty !== 'All' && (
            <TouchableOpacity style={s.retryBtn} onPress={() => setSpecialty('All')} activeOpacity={0.88}>
              <Text style={s.retryText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(d) => d.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadDoctors(); }}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          renderItem={({ item }) => (
            <DoctorRow
              doctor={item}
              onBook={() => navigation.navigate('DoctorDetail', { doctorId: item.id })}
            />
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
  chipRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 10 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipActive:  { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText:    { fontSize: 12, fontWeight: '600', color: MUTED },
  chipTextActive: { color: WHITE },
  specRow:     { paddingHorizontal: 18, paddingBottom: 10, gap: 8 },
  specChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1.5, borderColor: '#E2E8F0' },
  specChipActive: { backgroundColor: '#EFF6FF', borderColor: PRIMARY },
  specChipText: { fontSize: 12, fontWeight: '600', color: MUTED },
  specChipTextActive: { color: PRIMARY },
  list:        { paddingHorizontal: 18, paddingBottom: 32 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  loadText:    { fontSize: 14, color: MUTED },
  emptyTitle:  { fontSize: 17, fontWeight: '700', color: SLATE, textAlign: 'center' },
  retryBtn:    { marginTop: 8, backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:   { fontSize: 14, fontWeight: '700', color: WHITE },
});
