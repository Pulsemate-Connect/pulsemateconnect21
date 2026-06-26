// ─────────────────────────────────────────────────────────────────────────────
//  LocationPickerModal — PulseMate Connect
//  Full-screen modal to search / pick a city or locality
//
//  Features:
//    • Search bar — filters localities in real-time
//    • "Use current location" — triggers GPS fetch
//    • Recent searches — persisted via AsyncStorage, clearable
//    • Top localities list — static popular areas for Bangalore
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, StyleSheet, StatusBar, ActivityIndicator,
  Keyboard, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY  = '#2563EB';
const SLATE    = '#0F172A';
const MUTED    = '#94A3B8';
const BG       = '#F8FBFF';
const WHITE    = '#FFFFFF';
const DIVIDER  = '#F1F5F9';
const SECTION  = '#F8FAFC';

const RECENT_KEY   = '@pulsemate_recent_locations';
const LOCATION_KEY = '@pulsemate_last_location';

// ── Static top localities ─────────────────────────────────────────────────────
const TOP_LOCALITIES = [
  { id: 'l1',  name: 'JP Nagar',         type: 'LOCALITY' },
  { id: 'l2',  name: 'Whitefield',        type: 'LOCALITY' },
  { id: 'l3',  name: 'HSR Layout',        type: 'LOCALITY' },
  { id: 'l4',  name: 'Indiranagar',       type: 'LOCALITY' },
  { id: 'l5',  name: 'Sarjapur Road',     type: 'LOCALITY' },
  { id: 'l6',  name: 'Yelahanka',         type: 'LOCALITY' },
  { id: 'l7',  name: 'Rajajinagar',       type: 'LOCALITY' },
  { id: 'l8',  name: 'Electronics City',  type: 'LOCALITY' },
  { id: 'l9',  name: 'Malleswaram',       type: 'LOCALITY' },
  { id: 'l10', name: 'Bannerghatta Road', type: 'LOCALITY' },
  { id: 'l11', name: 'Koramangala',       type: 'LOCALITY' },
  { id: 'l12', name: 'BTM Layout',        type: 'LOCALITY' },
  { id: 'l13', name: 'Marathahalli',      type: 'LOCALITY' },
  { id: 'l14', name: 'Hebbal',            type: 'LOCALITY' },
  { id: 'l15', name: 'Jayanagar',         type: 'LOCALITY' },
];

// ── Reverse geocode helper ────────────────────────────────────────────────────
// Field mapping for Indian addresses from expo-location:
//   r.name        → can be house/plot number on Android — skip if numeric
//   r.street      → road/street name
//   r.district    → taluk / block level
//   r.city        → actual city/town name
//   r.subregion   → revenue DIVISION (e.g. "Belgaum Division") — too broad, skip
//   r.region      → state name
async function reverseGeocode(latitude, longitude) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results?.length > 0) {
      const r = results[0];

      const isNumeric = (s) => !!s && /^\d+[\w\-\/]*$/.test(s.trim());

      const name     = !isNumeric(r.name)   ? (r.name   || '') : '';
      const street   = !isNumeric(r.street) ? (r.street || '') : '';
      const district = r.district || '';
      const city     = r.city     || '';

      if (name   && city     && name   !== city)     return `${name}, ${city}`;
      if (name   && district && name   !== district) return `${name}, ${district}`;
      if (street && city     && street !== city)     return `${street}, ${city}`;
      if (city   && district && city   !== district) return `${city}, ${district}`;
      return name || city || street || district || 'Your Location';
    }
  } catch { /* fall through */ }
  return 'Your Location';
}

// ── Single row item ───────────────────────────────────────────────────────────
function LocationRow({ name, type, icon = 'location-outline', iconColor = MUTED, onPress }) {
  return (
    <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.7}>
      <View style={r.iconWrap}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <Text style={r.name} numberOfLines={1}>{name}</Text>
      {type ? <Text style={r.type}>{type}</Text> : null}
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: DIVIDER },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: SECTION, alignItems: 'center', justifyContent: 'center' },
  name:     { flex: 1, fontSize: 15, color: SLATE, fontWeight: '500' },
  type:     { fontSize: 11, color: MUTED, fontWeight: '600', letterSpacing: 0.5 },
});

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ title, action, onAction }) {
  return (
    <View style={sl.row}>
      <Text style={sl.title}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={sl.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sl = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: SECTION },
  title:  { fontSize: 13, fontWeight: '700', color: MUTED, letterSpacing: 0.3 },
  action: { fontSize: 13, fontWeight: '800', color: PRIMARY, letterSpacing: 0.3 },
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {boolean}  visible          — modal open/close
 * @param {function} onClose          — close without selection
 * @param {function} onSelect         — called with { label, latitude?, longitude? }
 * @param {function} onUseCurrentLoc  — triggers GPS fetch in parent
 */
export default function LocationPickerModal({ visible, onClose, onSelect, onUseCurrentLoc }) {
  const insets              = useSafeAreaInsets();
  const inputRef            = useRef(null);

  const [query,    setQuery]    = useState('');
  const [recents,  setRecents]  = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── Load recents on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      loadRecents();
      // Auto-focus search input
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setQuery('');
      setGpsLoading(false);
    }
  }, [visible]);

  const loadRecents = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch { /* ignore */ }
  };

  const saveRecent = async (item) => {
    try {
      const existing = recents.filter((r) => r.name !== item.name);
      const updated  = [item, ...existing].slice(0, 5); // keep last 5
      setRecents(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const clearRecents = async () => {
    setRecents([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  // ── Handle selection ──────────────────────────────────────────────────────
  const handleSelect = useCallback((item) => {
    Keyboard.dismiss();
    saveRecent(item);
    onSelect?.(item);
    onClose?.();
  }, [recents, onSelect, onClose]); // eslint-disable-line

  // ── Use current GPS location ──────────────────────────────────────────────
  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy:   Location.Accuracy.High,
        maximumAge: 10000,
        timeout:    15000,
      });
      const { latitude, longitude } = loc.coords;
      const label = await reverseGeocode(latitude, longitude);

      // Persist
      await AsyncStorage.setItem(
        LOCATION_KEY,
        JSON.stringify({ label, latitude, longitude, ts: Date.now() }),
      );

      const item = { name: label, latitude, longitude, type: 'GPS' };
      saveRecent(item);
      onSelect?.(item);
      onUseCurrentLoc?.({ latitude, longitude });
      onClose?.();
    } catch {
      setGpsLoading(false);
    }
  };

  // ── Filtered localities ───────────────────────────────────────────────────
  const filtered = query.trim().length > 0
    ? TOP_LOCALITIES.filter((l) =>
        l.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : TOP_LOCALITIES;

  // ── List data builder ─────────────────────────────────────────────────────
  // We use a single FlatList with heterogeneous items for scroll performance
  const listData = [];

  // "Use current location" row
  listData.push({ _type: 'gps' });

  // Recent searches
  if (query.trim() === '' && recents.length > 0) {
    listData.push({ _type: 'sectionLabel', title: 'Recent Search', action: 'CLEAR' });
    recents.forEach((item) => listData.push({ _type: 'recent', ...item }));
  }

  // Top localities / search results
  if (query.trim() === '') {
    listData.push({ _type: 'sectionLabel', title: 'Top Localities in Bangalore' });
  }
  filtered.forEach((item) => listData.push({ _type: 'locality', ...item }));

  // ── Render each row ───────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    if (item._type === 'gps') {
      return (
        <TouchableOpacity style={gps.row} onPress={handleUseCurrentLocation} activeOpacity={0.8}>
          {gpsLoading
            ? <ActivityIndicator size={18} color={PRIMARY} />
            : <Ionicons name="locate" size={18} color={PRIMARY} />
          }
          <Text style={gps.text}>
            {gpsLoading ? 'Getting location…' : 'Use current location'}
          </Text>
          {!gpsLoading && (
            <Ionicons name="radio-button-on-outline" size={18} color={PRIMARY} />
          )}
        </TouchableOpacity>
      );
    }

    if (item._type === 'sectionLabel') {
      return (
        <SectionLabel
          title={item.title}
          action={item.action}
          onAction={item.action === 'CLEAR' ? clearRecents : undefined}
        />
      );
    }

    if (item._type === 'recent') {
      return (
        <LocationRow
          name={item.name}
          type={item.type === 'GPS' ? 'GPS' : 'RECENT'}
          icon="time-outline"
          iconColor="#94A3B8"
          onPress={() => handleSelect(item)}
        />
      );
    }

    if (item._type === 'locality') {
      return (
        <LocationRow
          name={item.name}
          type="LOCALITY"
          icon="location-outline"
          iconColor={MUTED}
          onPress={() => handleSelect({ name: item.name })}
        />
      );
    }

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <View style={[m.root, { paddingTop: Platform.OS === 'android' ? insets.top + 8 : 0 }]}>

        {/* ── Top bar ── */}
        <View style={m.topBar}>
          <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={SLATE} />
          </TouchableOpacity>
          <Text style={m.title}>Enter your city or locality</Text>
        </View>

        {/* ── Search input ── */}
        <View style={m.searchWrap}>
          <View style={m.searchBar}>
            <Ionicons name="search-outline" size={18} color={MUTED} />
            <TextInput
              ref={inputRef}
              style={m.searchInput}
              placeholder="Search your location here"
              placeholderTextColor={MUTED}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── List ── */}
        <FlatList
          data={listData}
          keyExtractor={(item, i) => `${item._type}_${item.id || item.name || i}`}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      </View>
    </Modal>
  );
}

// ── GPS row style ─────────────────────────────────────────────────────────────
const gps = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: DIVIDER },
  text: { flex: 1, fontSize: 15, fontWeight: '700', color: PRIMARY },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WHITE,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PRIMARY,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: WHITE,
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WHITE,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: SLATE,
    fontWeight: '400',
  },
});
