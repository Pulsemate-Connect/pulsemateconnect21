// ─────────────────────────────────────────────────────────────────────────────
//  LocationPickerModal — PulseMate Connect
//  Modern, clean, premium location selector
//
//  Features:
//    • Compact header with back button
//    • Clean search bar
//    • Use current location action
//    • Popular localities list
//    • Skeleton loading states
//    • Empty states
//    • Selected state handling
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

// Modern Healthcare App Color Palette
const PRIMARY   = '#2563EB';  // Primary brand color
const DARK      = '#1E293B';  // Dark charcoal text
const GRAY      = '#64748B';  // Soft gray secondary
const LIGHT_GRAY = '#94A3B8'; // Lighter gray
const BG_WHITE  = '#FFFFFF';  // White background
const BG_SUBTLE = '#F8FAFC';  // Very light neutral surface
const BORDER    = '#E2E8F0';  // Subtle border
const SUCCESS   = '#10B981';  // Success green

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

// ── Major Indian Cities & Towns ────────────────────────────────────────────────
const INDIAN_CITIES = [
  // Karnataka
  { id: 'c1', name: 'Bangalore', type: 'CITY' },
  { id: 'c2', name: 'Mysore', type: 'CITY' },
  { id: 'c3', name: 'Mangalore', type: 'CITY' },
  { id: 'c4', name: 'Hubli', type: 'CITY' },
  { id: 'c5', name: 'Belgaum', type: 'CITY' },
  { id: 'c6', name: 'Karwar', type: 'CITY' },
  { id: 'c7', name: 'Dharwad', type: 'CITY' },
  { id: 'c8', name: 'Tumkur', type: 'CITY' },
  { id: 'c9', name: 'Shimoga', type: 'CITY' },
  { id: 'c10', name: 'Udupi', type: 'CITY' },
  
  // Maharashtra
  { id: 'c11', name: 'Mumbai', type: 'CITY' },
  { id: 'c12', name: 'Pune', type: 'CITY' },
  { id: 'c13', name: 'Nagpur', type: 'CITY' },
  { id: 'c14', name: 'Thane', type: 'CITY' },
  { id: 'c15', name: 'Nashik', type: 'CITY' },
  { id: 'c16', name: 'Aurangabad', type: 'CITY' },
  { id: 'c17', name: 'Solapur', type: 'CITY' },
  
  // Delhi NCR
  { id: 'c18', name: 'Delhi', type: 'CITY' },
  { id: 'c19', name: 'Gurgaon', type: 'CITY' },
  { id: 'c20', name: 'Noida', type: 'CITY' },
  { id: 'c21', name: 'Faridabad', type: 'CITY' },
  { id: 'c22', name: 'Ghaziabad', type: 'CITY' },
  
  // Tamil Nadu
  { id: 'c23', name: 'Chennai', type: 'CITY' },
  { id: 'c24', name: 'Coimbatore', type: 'CITY' },
  { id: 'c25', name: 'Madurai', type: 'CITY' },
  { id: 'c26', name: 'Trichy', type: 'CITY' },
  { id: 'c27', name: 'Salem', type: 'CITY' },
  
  // Telangana
  { id: 'c28', name: 'Hyderabad', type: 'CITY' },
  { id: 'c29', name: 'Warangal', type: 'CITY' },
  
  // Andhra Pradesh
  { id: 'c30', name: 'Vijayawada', type: 'CITY' },
  { id: 'c31', name: 'Visakhapatnam', type: 'CITY' },
  { id: 'c32', name: 'Guntur', type: 'CITY' },
  
  // Kerala
  { id: 'c33', name: 'Kochi', type: 'CITY' },
  { id: 'c34', name: 'Thiruvananthapuram', type: 'CITY' },
  { id: 'c35', name: 'Kozhikode', type: 'CITY' },
  { id: 'c36', name: 'Thrissur', type: 'CITY' },
  
  // Gujarat
  { id: 'c37', name: 'Ahmedabad', type: 'CITY' },
  { id: 'c38', name: 'Surat', type: 'CITY' },
  { id: 'c39', name: 'Vadodara', type: 'CITY' },
  { id: 'c40', name: 'Rajkot', type: 'CITY' },
  
  // Rajasthan
  { id: 'c41', name: 'Jaipur', type: 'CITY' },
  { id: 'c42', name: 'Jodhpur', type: 'CITY' },
  { id: 'c43', name: 'Udaipur', type: 'CITY' },
  { id: 'c44', name: 'Kota', type: 'CITY' },
  
  // West Bengal
  { id: 'c45', name: 'Kolkata', type: 'CITY' },
  { id: 'c46', name: 'Durgapur', type: 'CITY' },
  { id: 'c47', name: 'Siliguri', type: 'CITY' },
  
  // Uttar Pradesh
  { id: 'c48', name: 'Lucknow', type: 'CITY' },
  { id: 'c49', name: 'Kanpur', type: 'CITY' },
  { id: 'c50', name: 'Agra', type: 'CITY' },
  { id: 'c51', name: 'Varanasi', type: 'CITY' },
  { id: 'c52', name: 'Allahabad', type: 'CITY' },
  
  // Madhya Pradesh
  { id: 'c53', name: 'Bhopal', type: 'CITY' },
  { id: 'c54', name: 'Indore', type: 'CITY' },
  { id: 'c55', name: 'Jabalpur', type: 'CITY' },
  
  // Punjab
  { id: 'c56', name: 'Chandigarh', type: 'CITY' },
  { id: 'c57', name: 'Ludhiana', type: 'CITY' },
  { id: 'c58', name: 'Amritsar', type: 'CITY' },
  
  // Haryana
  { id: 'c59', name: 'Faridabad', type: 'CITY' },
  { id: 'c60', name: 'Gurgaon', type: 'CITY' },
  
  // Bihar
  { id: 'c61', name: 'Patna', type: 'CITY' },
  { id: 'c62', name: 'Gaya', type: 'CITY' },
  
  // Jharkhand
  { id: 'c63', name: 'Ranchi', type: 'CITY' },
  { id: 'c64', name: 'Jamshedpur', type: 'CITY' },
  
  // Odisha
  { id: 'c65', name: 'Bhubaneswar', type: 'CITY' },
  { id: 'c66', name: 'Cuttack', type: 'CITY' },
  
  // Assam
  { id: 'c67', name: 'Guwahati', type: 'CITY' },
  
  // Goa
  { id: 'c68', name: 'Panaji', type: 'CITY' },
  { id: 'c69', name: 'Margao', type: 'CITY' },
  
  // Uttarakhand
  { id: 'c70', name: 'Dehradun', type: 'CITY' },
  
  // Himachal Pradesh
  { id: 'c71', name: 'Shimla', type: 'CITY' },
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

// ── Skeleton Loading Row ──────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <View style={skeleton.row}>
      <View style={skeleton.icon} />
      <View style={skeleton.text} />
    </View>
  );
}

const skeleton = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
  },
  text: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
});

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onUseCurrentLocation }) {
  return (
    <View style={empty.container}>
      <Ionicons name="location-outline" size={48} color={LIGHT_GRAY} />
      <Text style={empty.title}>No locations found</Text>
      <Text style={empty.subtitle}>Try another city or locality</Text>
      <TouchableOpacity style={empty.button} onPress={onUseCurrentLocation} activeOpacity={0.7}>
        <Ionicons name="navigate" size={18} color={PRIMARY} />
        <Text style={empty.buttonText}>Use current location</Text>
      </TouchableOpacity>
    </View>
  );
}

const empty = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: GRAY,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY,
  },
});

// ── Single Location Row ───────────────────────────────────────────────────────
function LocationRow({ name, isSelected, onPress }) {
  return (
    <TouchableOpacity style={r.row} onPress={onPress} activeOpacity={0.6}>
      <View style={r.iconWrap}>
        <Ionicons 
          name={isSelected ? "checkmark-circle" : "location-outline"} 
          size={22} 
          color={isSelected ? SUCCESS : GRAY} 
        />
      </View>
      <Text style={[r.name, isSelected && r.nameSelected]} numberOfLines={1}>
        {name}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={LIGHT_GRAY} />
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    backgroundColor: BG_WHITE,
    minHeight: 60,
  },
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: DARK,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  nameSelected: {
    color: SUCCESS,
    fontWeight: '600',
  },
});

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ title, subtitle }) {
  return (
    <View style={sl.row}>
      <View style={sl.iconWrap}>
        <Ionicons name="location" size={18} color={PRIMARY} />
      </View>
      <View style={sl.textWrap}>
        <Text style={sl.title}>{title}</Text>
        {subtitle && <Text style={sl.subtitle}> {subtitle}</Text>}
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: BG_WHITE,
    gap: 8,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: GRAY,
    letterSpacing: -0.2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {boolean}  visible          — modal open/close
 * @param {function} onClose          — close without selection
 * @param {function} onSelect         — called with { label, latitude?, longitude? }
 * @param {function} onUseCurrentLoc  — triggers GPS fetch in parent
 */
export default function LocationPickerModal({ visible, onClose, onSelect, onUseCurrentLoc }) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [cityDetected, setCityDetected] = useState('Bangalore');

  // ── Load recents on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      loadRecents();
      setQuery('');
      setGpsLoading(false);
      setGpsError('');
      setSelectedLocation(null);
      // Auto-focus search input
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length > 0) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        // Simulate search completion
        setIsSearching(false);
      }, 300);
    } else {
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

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
  const handleSelect = useCallback(async (item) => {
    Keyboard.dismiss();
    setSelectedLocation(item.name);
    saveRecent(item);
    
    // If no coordinates, try to geocode the location name
    let finalItem = { ...item };
    if (!item.latitude || !item.longitude) {
      try {
        // Geocode the location name to get coordinates
        const results = await Location.geocodeAsync(item.name);
        if (results && results.length > 0) {
          finalItem.latitude = results[0].latitude;
          finalItem.longitude = results[0].longitude;
        }
      } catch (error) {
        console.log('[LocationPicker] Geocoding failed for:', item.name);
      }
    }
    
    // Small delay for visual feedback
    setTimeout(() => {
      onSelect?.(finalItem);
      onClose?.();
    }, 150);
  }, [recents, onSelect, onClose]); // eslint-disable-line

  // ── Use current GPS location ──────────────────────────────────────────────
  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError('');
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setGpsError('Location access is disabled. Enable location permission to detect your location automatically.');
        setGpsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
        timeout: 15000,
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
      setSelectedLocation(label);
      
      // Small delay for visual feedback
      setTimeout(() => {
        onSelect?.(item);
        onUseCurrentLoc?.({ latitude, longitude });
        onClose?.();
      }, 150);
    } catch (error) {
      setGpsError('Unable to detect location. Please try again.');
      setGpsLoading(false);
    }
  };

  // ── Filtered localities & cities ──────────────────────────────────────────────
  const searchTerm = query.trim().toLowerCase();
  
  let filtered = [];
  
  if (searchTerm.length > 0) {
    // Search in both localities and cities
    const matchingLocalities = TOP_LOCALITIES.filter((l) =>
      l.name.toLowerCase().includes(searchTerm)
    );
    const matchingCities = INDIAN_CITIES.filter((c) =>
      c.name.toLowerCase().includes(searchTerm)
    );
    
    // Combine results - cities first, then localities
    filtered = [...matchingCities, ...matchingLocalities];
  } else {
    // No search - show only top localities
    filtered = TOP_LOCALITIES;
  }

  // ── Build list data ───────────────────────────────────────────────────────
  const listData = [];

  // GPS Error State
  if (gpsError) {
    listData.push({ _type: 'gpsError', message: gpsError });
  }

  // GPS Loading State
  if (gpsLoading) {
    listData.push({ _type: 'gpsLoading' });
  }

  // Use Current Location Button (when not loading/error)
  if (!gpsLoading && !gpsError) {
    listData.push({ _type: 'gpsButton' });
  }

  // Section header
  if (query.trim() === '') {
    listData.push({ 
      _type: 'sectionLabel', 
      title: 'Popular localities',
      subtitle: cityDetected ? `in ${cityDetected}` : ''
    });
  } else if (filtered.length > 0) {
    listData.push({ 
      _type: 'sectionLabel', 
      title: 'Search results'
    });
  }

  // Loading skeleton
  if (isSearching) {
    for (let i = 0; i < 5; i++) {
      listData.push({ _type: 'skeleton', id: `skeleton-${i}` });
    }
  } else if (filtered.length === 0 && query.trim().length > 0) {
    // Empty state
    listData.push({ _type: 'empty' });
  } else {
    // Localities
    filtered.forEach((item) => listData.push({ _type: 'locality', ...item }));
  }

  // ── Render each row ───────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    // GPS Loading State
    if (item._type === 'gpsLoading') {
      return (
        <View style={gps.row}>
          <View style={gps.iconCircle}>
            <ActivityIndicator size={20} color={PRIMARY} />
          </View>
          <Text style={gps.loadingText}>Detecting your location...</Text>
        </View>
      );
    }

    // GPS Error State
    if (item._type === 'gpsError') {
      return (
        <View style={gps.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <Text style={gps.errorText}>{item.message}</Text>
          <TouchableOpacity 
            style={gps.retryButton} 
            onPress={handleUseCurrentLocation}
            activeOpacity={0.7}
          >
            <Text style={gps.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // GPS Button
    if (item._type === 'gpsButton') {
      return (
        <TouchableOpacity style={gps.row} onPress={handleUseCurrentLocation} activeOpacity={0.7}>
          <View style={gps.iconCircle}>
            <Ionicons name="navigate" size={20} color={PRIMARY} />
          </View>
          <View style={gps.textWrap}>
            <Text style={gps.text}>Use my current location</Text>
            <Text style={gps.subtitle}>Detect location automatically</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={LIGHT_GRAY} />
        </TouchableOpacity>
      );
    }

    // Section Label
    if (item._type === 'sectionLabel') {
      return <SectionLabel title={item.title} subtitle={item.subtitle} />;
    }

    // Skeleton Loading
    if (item._type === 'skeleton') {
      return <SkeletonRow />;
    }

    // Empty State
    if (item._type === 'empty') {
      return <EmptyState onUseCurrentLocation={handleUseCurrentLocation} />;
    }

    // Locality Row
    if (item._type === 'locality') {
      const isSelected = selectedLocation === item.name;
      return (
        <LocationRow
          name={item.name}
          isSelected={isSelected}
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
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={BG_WHITE} />
      <View style={[m.root, { paddingTop: insets.top }]}>

        {/* ── Compact Header ── */}
        <View style={m.header}>
          <TouchableOpacity style={m.backButton} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={DARK} />
          </TouchableOpacity>
          <Text style={m.headerTitle}>Select your location</Text>
        </View>

        {/* ── Search Input ── */}
        <View style={m.searchWrap}>
          <View style={m.searchBar}>
            <Ionicons name="search" size={20} color={GRAY} />
            <TextInput
              ref={inputRef}
              style={m.searchInput}
              placeholder="Search city or locality"
              placeholderTextColor={LIGHT_GRAY}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {query.length > 0 && (
              <TouchableOpacity 
                onPress={() => setQuery('')} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={LIGHT_GRAY} />
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
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: BORDER, marginLeft: 56 }} />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />

        {/* ── Privacy Notice ── */}
        <View style={m.privacyNotice}>
          <View style={m.privacyIcon}>
            <Ionicons name="shield-checkmark" size={18} color={SUCCESS} />
          </View>
          <Text style={m.privacyText}>
            We use your location only to show relevant doctors and clinics near you.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ── GPS Button & States ───────────────────────────────────────────────────────
const gps = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 70,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BG_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: GRAY,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  loadingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: PRIMARY,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#991B1B',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: BG_WHITE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});

// ── Modal Styles ──────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BG_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_SUBTLE,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DARK,
    flex: 1,
    letterSpacing: -0.4,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: BG_WHITE,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BG_SUBTLE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    borderWidth: 1,
    borderColor: BORDER,
    height: 56,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DARK,
    fontWeight: '400',
    letterSpacing: -0.2,
    paddingVertical: 0, // Remove default padding
    includeFontPadding: false, // Android-specific fix
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  privacyIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: GRAY,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});
