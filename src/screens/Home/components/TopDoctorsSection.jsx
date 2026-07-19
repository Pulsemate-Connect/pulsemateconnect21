// ─────────────────────────────────────────────────────────────────────────────
//  TopDoctorsSection — PulseMate Connect
//  Horizontal scrollable doctor cards — real data only, no dummy fallback
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
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: paletteBg[idx],
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: WHITE,
    }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: paletteText[idx] }}>
        {initial}
      </Text>
    </View>
  );
}

// ── Single doctor card ─────────────────────────────────────────────────────
function DoctorCard({ doctor, onBook, cardWidth }) {
  const name       = doctor.user?.name || 'Doctor';
  const spec       = doctor.specialization || 'General Physician';
  const rating     = doctor.rating || null;
  const ratingCount = doctor.ratingCount || '';
  const photo      = doctor.profilePhotoUrl || doctor.photoUrl || null;

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

      {/* Rating — only show if real data exists */}
      {rating && (
        <View style={s.ratingRow}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={s.ratingText}>{rating}</Text>
          {ratingCount ? <Text style={s.ratingCount}>({ratingCount})</Text> : null}
        </View>
      )}

      {/* Book button */}
      <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.85}>
        <Text style={s.bookBtnText}>Book</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={s.emptyWrap}>
      <Ionicons name="person-outline" size={40} color={MUTED} />
      <Text style={s.emptyTitle}>No doctors available.</Text>
    </View>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────
export default function TopDoctorsSection({ doctors = [], loading = false, onViewAll, onBook }) {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 768;
  const cardW     = isTablet ? (width - 48 - 12) / 2 : 152;

  return (
    <View style={s.section}>
      <SectionHeader title="Top Doctors" onViewAll={doctors.length > 0 ? onViewAll : undefined} />

      {loading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
      ) : doctors.length === 0 ? (
        <EmptyState />
      ) : isTablet ? (
        <View style={s.grid}>
          {doctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} cardWidth={cardW} onBook={() => onBook?.(doc)} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollRow}
        >
          {doctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} cardWidth={cardW} onBook={() => onBook?.(doc)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section:    { paddingHorizontal: 16, marginBottom: 24 },
  scrollRow:  { gap: 12, paddingRight: 16 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

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
  wishBtn:     { position: 'absolute', top: 12, right: 12 },
  name:        { fontSize: 13, fontWeight: '700', color: SLATE, marginTop: 10, textAlign: 'center', width: '100%' },
  spec:        { fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 2, width: '100%' },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 7 },
  ratingText:  { fontSize: 12, fontWeight: '700', color: '#64748B' },
  ratingCount: { fontSize: 11, color: MUTED },
  bookBtn:     { marginTop: 10, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 8, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  bookBtnText: { fontSize: 13, fontWeight: '700', color: PRIMARY },

  // Empty state
  emptyWrap:   { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle:  { fontSize: 13, color: MUTED, textAlign: 'center', fontWeight: '500' },
});
