// ─────────────────────────────────────────────────────────────────────────────
//  NearbyClinicsSection — PulseMate Connect
//  Horizontal scrollable clinic cards — matches TopDoctorsSection pattern
// ─────────────────────────────────────────────────────────────────────────────
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from './SectionHeader';

const PRIMARY = '#2563EB';
const SKY6    = '#0284C7';
const SLATE   = '#0F172A';
const MUTED   = '#94A3B8';
const WHITE   = '#FFFFFF';
const SUCCESS = '#16A34A';

// ── Dummy fallback clinic data ─────────────────────────────────────────────
export const DUMMY_CLINICS = [
  { id: 'd1', name: 'Sunrise Multispeciality', distanceKm: '1.2', city: 'HSR Layout', queueCount: 8,  rating: '4.8', ratingCount: 320, clinicLogoUrl: null, isOpen: true  },
  { id: 'd2', name: 'Apollo Health Centre',    distanceKm: '2.5', city: 'Koramangala', queueCount: 3,  rating: '4.6', ratingCount: 211, clinicLogoUrl: null, isOpen: true  },
  { id: 'd3', name: 'Fortis Clinic',           distanceKm: '4.1', city: 'Indiranagar', queueCount: 12, rating: '4.7', ratingCount: 180, clinicLogoUrl: null, isOpen: false },
  { id: 'd4', name: 'Medanta Care',            distanceKm: '5.3', city: 'Whitefield',  queueCount: 5,  rating: '4.5', ratingCount: 142, clinicLogoUrl: null, isOpen: true  },
];

// ── Clinic logo placeholder ────────────────────────────────────────────────
function ClinicLogo({ name, size = 52 }) {
  const initial = name?.charAt(0)?.toUpperCase() || '🏥';
  const paletteBg   = ['#DBEAFE', '#D1FAE5', '#FEE2E2', '#EDE9FE', '#FEF3C7', '#CCFBF1'];
  const paletteText = ['#1D4ED8', '#065F46', '#991B1B', '#6D28D9', '#92400E', '#0F766E'];
  const idx = ((name?.charCodeAt(0) || 72) - 65) % paletteBg.length;
  return (
    <View style={[logo.wrap, { width: size, height: size, borderRadius: size * 0.25, backgroundColor: paletteBg[idx] }]}>
      <Text style={[logo.initial, { color: paletteText[idx], fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}
const logo = StyleSheet.create({
  wrap:    { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  initial: { fontWeight: '800' },
});

// ── Single horizontal clinic card ─────────────────────────────────────────
function ClinicCard({ clinic, onBook, cardWidth }) {
  const { name, distanceKm, city, district, queueCount, rating, ratingCount, clinicLogoUrl, isOpen, _count } = clinic;
  const queue    = queueCount ?? _count?.appointments ?? 0;
  const location = city || district || 'Nearby';
  const isOpenVal = isOpen ?? true;

  return (
    <View style={[s.card, { width: cardWidth }]}>
      {/* Header: logo + open badge */}
      <View style={s.cardTop}>
        <ClinicLogo name={name} size={48} />
        <View style={[s.openBadge, !isOpenVal && s.closedBadge]}>
          <View style={[s.openDot, !isOpenVal && s.closedDot]} />
          <Text style={[s.openBadgeText, !isOpenVal && s.closedBadgeText]}>
            {isOpenVal ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text style={s.clinicName} numberOfLines={2}>{name}</Text>

      {/* Location */}
      <View style={s.locRow}>
        <Ionicons name="location-outline" size={11} color={MUTED} />
        <Text style={s.locText} numberOfLines={1}>
          {distanceKm ? `${distanceKm} km · ` : ''}{location}
        </Text>
      </View>

      {/* Queue */}
      <View style={s.queueRow}>
        <Ionicons name="people-outline" size={11} color={SKY6} />
        <Text style={s.queueText}>{queue} in queue</Text>
      </View>

      {/* Rating */}
      {rating && (
        <View style={s.ratingRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={s.ratingText}>{rating}</Text>
          {ratingCount ? <Text style={s.ratingCount}>({ratingCount})</Text> : null}
        </View>
      )}

      {/* Book button */}
      <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.85}>
        <Text style={s.bookBtnText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────
export default function NearbyClinicsSection({
  clinics = [],
  loading = false,
  locationStatus = 'idle',
  onRequestLoc,
  onViewAll,
  onBook,
}) {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 768;

  const displayClinics = clinics.length > 0 ? clinics : DUMMY_CLINICS;
  const cardW = isTablet ? (width - 48 - 12) / 2 : 180;

  return (
    <View style={s.section}>
      <SectionHeader title="Nearby Clinics" onViewAll={onViewAll} />

      {loading ? (
        <ActivityIndicator color={SKY6} style={{ marginVertical: 20 }} />
      ) : isTablet ? (
        /* Tablet: 2-col wrap grid */
        <View style={s.grid}>
          {displayClinics.map((c) => (
            <ClinicCard key={c.id} clinic={c} cardWidth={cardW} onBook={() => onBook?.(c)} />
          ))}
        </View>
      ) : (
        /* Mobile: horizontal sliding scroll — same pattern as TopDoctorsSection */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollRow}
          decelerationRate="fast"
          snapToInterval={cardW + 12}
          snapToAlignment="start"
        >
          {displayClinics.map((c) => (
            <ClinicCard key={c.id} clinic={c} cardWidth={cardW} onBook={() => onBook?.(c)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  // Scroll row — horizontal
  scrollRow: {
    gap: 12,
    paddingRight: 16,
  },

  // Tablet grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Card — vertical layout inside each slide
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Card top row: logo + open badge
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // Open/Closed badge
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  closedBadge: {
    backgroundColor: '#F1F5F9',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SUCCESS,
  },
  closedDot: {
    backgroundColor: '#94A3B8',
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: SUCCESS,
  },
  closedBadgeText: {
    color: '#64748B',
  },

  // Clinic info
  clinicName: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE,
    lineHeight: 18,
    marginBottom: 5,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  locText: {
    fontSize: 11,
    color: MUTED,
    flex: 1,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  queueText: {
    fontSize: 11,
    color: SKY6,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  ratingCount: {
    fontSize: 10,
    color: MUTED,
  },

  // Book button
  bookBtn: {
    marginTop: 6,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
  },
});
