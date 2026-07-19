// ─────────────────────────────────────────────────────────────────────────────
//  NearbyClinicsSection — PulseMate Connect
//  Horizontal scrollable clinic cards — real data only, no dummy fallback
// ─────────────────────────────────────────────────────────────────────────────
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from './SectionHeader';

const PRIMARY = '#2563EB';
const SKY6    = '#0284C7';
const SLATE   = '#0F172A';
const MUTED   = '#94A3B8';
const WHITE   = '#FFFFFF';
const SUCCESS = '#16A34A';

// ── Clinic logo with image + initial fallback ──────────────────────────────
function ClinicLogo({ name, logoUrl, size = 52 }) {
  const [broken, setBroken] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || '🏥';
  const paletteBg   = ['#DBEAFE', '#D1FAE5', '#FEE2E2', '#EDE9FE', '#FEF3C7', '#CCFBF1'];
  const paletteText = ['#1D4ED8', '#065F46', '#991B1B', '#6D28D9', '#92400E', '#0F766E'];
  const idx = ((name?.charCodeAt(0) || 72) - 65) % paletteBg.length;

  if (logoUrl && !broken) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size, borderRadius: size * 0.25, borderWidth: 1.5, borderColor: '#E2E8F0' }}
        resizeMode="cover"
        onError={() => setBroken(true)}
      />
    );
  }

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
  const queue     = queueCount ?? _count?.appointments ?? 0;
  const location  = city || district || 'Nearby';
  const isOpenVal = isOpen ?? true;

  return (
    <View style={[s.card, { width: cardWidth }]}>
      {/* Header: logo + open badge */}
      <View style={s.cardTop}>
        <ClinicLogo name={name} logoUrl={clinicLogoUrl} size={48} />
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

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState({ onRefresh }) {
  return (
    <View style={s.emptyWrap}>
      <Ionicons name="business-outline" size={40} color={MUTED} />
      <Text style={s.emptyTitle}>No clinics available in your area.</Text>
      <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} activeOpacity={0.85}>
        <Ionicons name="refresh-outline" size={14} color={WHITE} />
        <Text style={s.refreshBtnText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────
export default function NearbyClinicsSection({
  clinics = [],
  loading = false,
  onRefresh,
  onViewAll,
  onBook,
}) {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 768;
  const cardW     = isTablet ? (width - 48 - 12) / 2 : 180;

  return (
    <View style={s.section}>
      <SectionHeader title="Nearby Clinics" onViewAll={clinics.length > 0 ? onViewAll : undefined} />

      {loading ? (
        <ActivityIndicator color={SKY6} style={{ marginVertical: 20 }} />
      ) : clinics.length === 0 ? (
        <EmptyState onRefresh={onRefresh} />
      ) : isTablet ? (
        <View style={s.grid}>
          {clinics.map((c) => (
            <ClinicCard key={c.id} clinic={c} cardWidth={cardW} onBook={() => onBook?.(c)} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollRow}
          decelerationRate="fast"
          snapToInterval={cardW + 12}
          snapToAlignment="start"
        >
          {clinics.map((c) => (
            <ClinicCard key={c.id} clinic={c} cardWidth={cardW} onBook={() => onBook?.(c)} />
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
  cardTop:          { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  openBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  closedBadge:      { backgroundColor: '#F1F5F9' },
  openDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS },
  closedDot:        { backgroundColor: '#94A3B8' },
  openBadgeText:    { fontSize: 10, fontWeight: '700', color: SUCCESS },
  closedBadgeText:  { color: '#64748B' },
  clinicName:       { fontSize: 13, fontWeight: '800', color: SLATE, lineHeight: 18, marginBottom: 5 },
  locRow:           { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  locText:          { fontSize: 11, color: MUTED, flex: 1 },
  queueRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  queueText:        { fontSize: 11, color: SKY6, fontWeight: '600' },
  ratingRow:        { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  ratingText:       { fontSize: 11, fontWeight: '700', color: '#64748B' },
  ratingCount:      { fontSize: 10, color: MUTED },
  bookBtn:          { marginTop: 6, backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 9, alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  bookBtnText:      { fontSize: 12, fontWeight: '700', color: WHITE },

  // Empty state
  emptyWrap:        { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle:       { fontSize: 13, color: MUTED, textAlign: 'center', fontWeight: '500' },
  refreshBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PRIMARY, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginTop: 4 },
  refreshBtnText:   { fontSize: 12, fontWeight: '700', color: WHITE },
});
