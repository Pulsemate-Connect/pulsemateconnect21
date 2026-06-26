// ─────────────────────────────────────────────────────────────────────────────
//  TopDoctorsSection — PulseMate Connect
//  Horizontal scrollable doctor cards; grid on tablet
// ─────────────────────────────────────────────────────────────────────────────
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from './SectionHeader';

const PRIMARY = '#2563EB';
const SLATE   = '#0F172A';
const MUTED   = '#94A3B8';
const WHITE   = '#FFFFFF';

// ── Dummy doctor data ──────────────────────────────────────────────────────
export const DUMMY_DOCTORS = [
  {
    id: 'd1',
    user: { name: 'Rahul Sharma' },
    specialization: 'Cardiologist',
    rating: '4.9',
    ratingCount: 320,
    profilePhotoUrl: null,
  },
  {
    id: 'd2',
    user: { name: 'Priya Mehta' },
    specialization: 'Dermatologist',
    rating: '4.8',
    ratingCount: 215,
    profilePhotoUrl: null,
  },
  {
    id: 'd3',
    user: { name: 'Amit Verma' },
    specialization: 'Orthopedic',
    rating: '4.7',
    ratingCount: 189,
    profilePhotoUrl: null,
  },
  {
    id: 'd4',
    user: { name: 'Sneha Rao' },
    specialization: 'Pediatrician',
    rating: '4.8',
    ratingCount: 163,
    profilePhotoUrl: null,
  },
];

// ── Avatar with initial fallback ──────────────────────────────────────────
function DoctorAvatar({ photoUrl, name, size = 72 }) {
  const [broken, setBroken] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'D';

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

  const paletteBg   = ['#DBEAFE', '#D1FAE5', '#FEE2E2', '#EDE9FE', '#FEF3C7'];
  const paletteText = ['#1D4ED8', '#065F46', '#991B1B', '#6D28D9', '#92400E'];
  const idx = ((name?.charCodeAt(0) || 65) - 65) % paletteBg.length;

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: paletteBg[idx],
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: WHITE,
    }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: paletteText[idx] }}>
        {initial}
      </Text>
    </View>
  );
}

// ── Single doctor card ─────────────────────────────────────────────────────
function DoctorCard({ doctor, onBook, cardWidth }) {
  const name    = doctor.user?.name || 'Doctor';
  const spec    = doctor.specialization || 'General Physician';
  const rating  = doctor.rating || '4.8';
  const ratingCount = doctor.ratingCount || '';
  const photo   = doctor.profilePhotoUrl || doctor.photoUrl || null;

  return (
    <View style={[s.card, cardWidth ? { width: cardWidth } : null]}>
      {/* Heart / wishlist icon */}
      <TouchableOpacity style={s.wishBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="heart-outline" size={17} color={MUTED} />
      </TouchableOpacity>

      {/* Avatar */}
      <DoctorAvatar photoUrl={photo} name={name} size={72} />

      {/* Info */}
      <Text style={s.name} numberOfLines={1}>Dr. {name}</Text>
      <Text style={s.spec} numberOfLines={1}>{spec}</Text>

      {/* Rating */}
      <View style={s.ratingRow}>
        <Ionicons name="star" size={12} color="#F59E0B" />
        <Text style={s.ratingText}>{rating}</Text>
        {ratingCount ? <Text style={s.ratingCount}>({ratingCount})</Text> : null}
      </View>

      {/* Book button */}
      <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.85}>
        <Text style={s.bookBtnText}>Book</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * @param {array}    doctors   — live doctor data; falls back to DUMMY_DOCTORS
 * @param {boolean}  loading   — show spinner
 * @param {function} onViewAll — View all handler
 * @param {function} onBook    — called with doctor object
 */
export default function TopDoctorsSection({ doctors = [], loading = false, onViewAll, onBook }) {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 768;

  const displayDoctors = doctors.length > 0 ? doctors : DUMMY_DOCTORS;

  // Tablet: show 2-col grid; mobile: horizontal scroll
  const cardW = isTablet
    ? (width - 48 - 12) / 2  // 2 col grid
    : 152;                    // fixed width for horizontal scroll

  return (
    <View style={s.section}>
      <SectionHeader title="Top Doctors" onViewAll={onViewAll} />

      {loading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
      ) : isTablet ? (
        /* Tablet: 2-col wrap grid */
        <View style={s.grid}>
          {displayDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              cardWidth={cardW}
              onBook={() => onBook && onBook(doc)}
            />
          ))}
        </View>
      ) : (
        /* Mobile: horizontal scroll */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollRow}
        >
          {displayDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              cardWidth={cardW}
              onBook={() => onBook && onBook(doc)}
            />
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

  // Horizontal scroll
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

  // Card
  card: {
    width: 152,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  wishBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE,
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
  spec: {
    fontSize: 11,
    color: MUTED,
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 7,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  ratingCount: {
    fontSize: 11,
    color: MUTED,
  },
  bookBtn: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },
});
