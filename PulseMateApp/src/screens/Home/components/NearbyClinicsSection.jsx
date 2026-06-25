// ─────────────────────────────────────────────────────────────────────────────
//  NearbyClinicsSection — PulseMate Connect
//  Shows a clinic card with image, open badge, queue, rating and Book Now btn
// ─────────────────────────────────────────────────────────────────────────────
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from './SectionHeader';

const PRIMARY  = '#2563EB';
const SKY6     = '#0284C7';
const SLATE    = '#0F172A';
const MUTED    = '#94A3B8';
const WHITE    = '#FFFFFF';
const SUCCESS  = '#16A34A';

// ── Dummy fallback clinic data ─────────────────────────────────────────────
export const DUMMY_CLINICS = [
  {
    id: 'd1',
    name: 'Sunrise Multispeciality Clinic',
    distanceKm: '1.2',
    city: 'HSR Layout, Bengaluru',
    district: 'Bengaluru',
    queueCount: 8,
    rating: '4.8',
    ratingCount: 320,
    clinicLogoUrl: null,
    isOpen: true,
  },
  {
    id: 'd2',
    name: 'Apollo Health Centre',
    distanceKm: '2.5',
    city: 'Koramangala, Bengaluru',
    district: 'Bengaluru',
    queueCount: 3,
    rating: '4.6',
    ratingCount: 211,
    clinicLogoUrl: null,
    isOpen: true,
  },
  {
    id: 'd3',
    name: 'Fortis Clinic',
    distanceKm: '4.1',
    city: 'Indiranagar, Bengaluru',
    district: 'Bengaluru',
    queueCount: 12,
    rating: '4.7',
    ratingCount: 180,
    clinicLogoUrl: null,
    isOpen: false,
  },
];

// ── Single clinic card ────────────────────────────────────────────────────────
function ClinicCard({ clinic, onBook, isTablet }) {
  const {
    name, distanceKm, city, district, queueCount, rating,
    ratingCount, clinicLogoUrl, isOpen,
    _count,
  } = clinic;

  const queue   = queueCount ?? _count?.appointments ?? 0;
  const location = city || district || 'Nearby';

  return (
    <View style={[s.card, isTablet && s.cardTablet]}>
      {/* ── Left image ── */}
      <View style={[s.imgWrap, isTablet && s.imgWrapTablet]}>
        {clinicLogoUrl ? (
          <Image
            source={{ uri: clinicLogoUrl }}
            style={[s.img, isTablet && s.imgTablet]}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.img, s.imgPlaceholder, isTablet && s.imgTablet]}>
            <Ionicons name="business" size={34} color="#93C5FD" />
            <View style={s.buildingWin1} />
            <View style={s.buildingWin2} />
          </View>
        )}
        {/* Open / Closed badge */}
        <View style={[s.openBadge, !isOpen && s.closedBadge]}>
          <Text style={s.openBadgeText}>{isOpen ? 'Open Now' : 'Closed'}</Text>
        </View>
      </View>

      {/* ── Right info ── */}
      <View style={s.info}>
        <Text style={s.clinicName} numberOfLines={2}>{name}</Text>

        {/* Location row */}
        <View style={s.locRow}>
          <Ionicons name="location-outline" size={12} color={MUTED} />
          <Text style={s.locText} numberOfLines={1}>
            {distanceKm ? `${distanceKm} km away · ` : ''}{location}
          </Text>
        </View>

        {/* Queue + rating row */}
        <View style={s.metaRow}>
          <View style={s.queueChip}>
            <Ionicons name="people-outline" size={12} color={SKY6} />
            <Text style={s.queueText}>{queue} in queue</Text>
          </View>
          <View style={s.ratingChip}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={s.ratingText}>{rating} ({ratingCount})</Text>
          </View>
        </View>

        {/* Book Now button */}
        <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.85}>
          <Text style={s.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * @param {array}    clinics        — live clinic data (falls back to DUMMY_CLINICS if empty & locationGranted)
 * @param {boolean}  loading        — show spinner
 * @param {string}   locationStatus — 'idle' | 'asking' | 'denied' | 'granted'
 * @param {function} onRequestLoc   — ask for location permission
 * @param {function} onViewAll      — View all handler
 * @param {function} onBook         — Book Now handler (receives clinic)
 */
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

  // Use dummy data when location is granted but no API data yet
  const displayClinics = clinics.length > 0 ? clinics : DUMMY_CLINICS;

  return (
    <View style={s.section}>
      <SectionHeader title="Nearby Clinics" onViewAll={onViewAll} />

      {/* Granted — show clinics or loader */}
      {loading && (
        <ActivityIndicator color={SKY6} style={{ marginVertical: 20 }} />
      )}

      {!loading && (
        <>
          {displayClinics.slice(0, isTablet ? 3 : 2).map((c) => (
            <ClinicCard
              key={c.id}
              clinic={c}
              isTablet={isTablet}
              onBook={() => onBook && onBook(c)}
            />
          ))}
          {/* Pagination dots */}
          <View style={s.dots}>
            {displayClinics.slice(0, isTablet ? 3 : 2).map((_, i) => (
              <View key={i} style={[s.dot, i === 0 && s.dotActive]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  // Clinic card
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTablet: {
    borderRadius: 22,
  },

  // Clinic image
  imgWrap: {
    width: 130,
    position: 'relative',
  },
  imgWrapTablet: {
    width: 170,
  },
  img: {
    width: 130,
    height: 120,
  },
  imgTablet: {
    width: 170,
    height: 130,
  },
  imgPlaceholder: {
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  buildingWin1: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    width: 36,
    height: 10,
    backgroundColor: '#93C5FD',
    borderRadius: 3,
    opacity: 0.5,
  },
  buildingWin2: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 36,
    height: 10,
    backgroundColor: '#93C5FD',
    borderRadius: 3,
    opacity: 0.5,
  },
  openBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: SUCCESS,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  closedBadge: {
    backgroundColor: '#64748B',
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: WHITE,
  },

  // Info side
  info: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    gap: 5,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '800',
    color: SLATE,
    lineHeight: 19,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    fontSize: 11,
    color: MUTED,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  queueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  queueText: {
    fontSize: 11,
    color: SKY6,
    fontWeight: '600',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bookBtn: {
    marginTop: 6,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignSelf: 'flex-start',
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

  // Pagination dots
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    backgroundColor: PRIMARY,
    width: 18,
  },
});
