// ─────────────────────────────────────────────────────────────────────────────
//  HomeHeader — PulseMate Connect
//  Logo + app name on left
//  Location pill on right — tapping opens LocationPickerModal
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import {
  View, Image, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationPickerModal from './LocationPickerModal';

const PRIMARY      = '#2563EB';
const WHITE        = '#FFFFFF';
const SLATE        = '#0F172A';
const MUTED        = '#64748B';
const LOGO         = require('../../../../assets/logo1.jpeg');
const LOCATION_KEY = '@pulsemate_last_location';

// ── Reverse-geocode helper ────────────────────────────────────────────────────
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

      // r.name is often a door/plot number on Android — discard if purely numeric
      const isNumeric = (s) => !!s && /^\d+[\w\-\/]*$/.test(s.trim());

      const name     = !isNumeric(r.name)   ? (r.name     || '') : '';
      const street   = !isNumeric(r.street) ? (r.street   || '') : '';
      const district = r.district || '';
      const city     = r.city     || '';

      // Best label: specific place + city  e.g. "Sonarwada, Karwar"
      if (name   && city     && name   !== city)     return `${name}, ${city}`;
      if (name   && district && name   !== district) return `${name}, ${district}`;
      if (street && city     && street !== city)     return `${street}, ${city}`;
      if (city   && district && city   !== district) return `${city}, ${district}`;
      return name || city || street || district || 'Your Location';
    }
  } catch { /* fall through */ }
  return 'Your Location';
}

/**
 * @param {function} onLocationFetched — called with { latitude, longitude }
 */
export default function HomeHeader({ onLocationFetched }) {
  const [label,       setLabel]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // ── Fetch GPS + reverse geocode ───────────────────────────────────────────
  const fetchLocation = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLabel('Location off');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy:   Location.Accuracy.High,
        maximumAge: 10000,
        timeout:    15000,
      });
      const { latitude, longitude } = loc.coords;
      onLocationFetched?.({ latitude, longitude });
      const area = await reverseGeocode(latitude, longitude);
      setLabel(area);
      await AsyncStorage.setItem(
        LOCATION_KEY,
        JSON.stringify({ label: area, latitude, longitude, ts: Date.now() }),
      );
    } catch {
      // Fallback to last known
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          const { latitude, longitude } = last.coords;
          onLocationFetched?.({ latitude, longitude });
          const area = await reverseGeocode(latitude, longitude);
          setLabel(`~${area}`);
        }
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, [onLocationFetched]);

  // ── On mount: load cache → request GPS if first time ─────────────────────
  useEffect(() => {
    (async () => {
      let hasCached = false;
      try {
        const saved = await AsyncStorage.getItem(LOCATION_KEY);
        if (saved) {
          const { label: cachedLabel, latitude, longitude } = JSON.parse(saved);
          if (cachedLabel) { setLabel(cachedLabel); hasCached = true; }
          if (latitude && longitude) onLocationFetched?.({ latitude, longitude });
        }
      } catch { /* ignore */ }
      // First open: show dialog visibly; return visit: silent background refresh
      fetchLocation(hasCached);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle selection from modal ───────────────────────────────────────────
  const handleModalSelect = useCallback((item) => {
    // If item has coords (GPS pick), pass them to parent
    if (item.latitude && item.longitude) {
      onLocationFetched?.({ latitude: item.latitude, longitude: item.longitude });
    }
    setLabel(item.name);
  }, [onLocationFetched]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.header}>
      {/* ── Left: logo + app name ── */}
      <View style={s.left}>
        <Image source={LOGO} style={s.logo} resizeMode="cover" />
        <View>
          <Text style={s.appName}>
            Pulse<Text style={s.appNameBlue}>Mate</Text>
          </Text>
          <Text style={s.tagline}>Connect</Text>
        </View>
      </View>

      {/* ── Right: location pill → opens picker ── */}
      <TouchableOpacity
        style={s.pill}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
      >
        {loading ? (
          <ActivityIndicator size={11} color={PRIMARY} />
        ) : (
          <Ionicons name="location-sharp" size={13} color={PRIMARY} />
        )}
        <Text style={s.pillText} numberOfLines={1}>
          {loading ? 'Locating…' : (label || 'Select location')}
        </Text>
        {!loading && (
          <Ionicons name="chevron-down" size={12} color={MUTED} />
        )}
      </TouchableOpacity>

      {/* ── Location picker modal ── */}
      <LocationPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleModalSelect}
        onUseCurrentLoc={(coords) => {
          onLocationFetched?.(coords);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: SLATE,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  appNameBlue: {
    color: PRIMARY,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8F0FE',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: SLATE,
    flexShrink: 1,
  },
});
