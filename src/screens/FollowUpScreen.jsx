/**
 * FollowUpScreen — Patient's follow-up list
 *
 * Shows all active follow-ups for the logged-in patient.
 * Each card shows: doctor, clinic, last visit date, follow-up date,
 * days remaining, status, and a "Book Follow-up" action button.
 *
 * Navigates to BookingScreen for booking with pre-filled context.
 */
import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMyFollowUps } from '../api/followup';
import { colors, shadow, radius } from '../theme';

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: 'Upcoming',    bg: '#EFF6FF', text: '#2563EB', icon: 'time-outline' },
  UPCOMING:  { label: 'Due Soon',    bg: '#FEF3C7', text: '#92400E', icon: 'alert-circle-outline' },
  DUE:       { label: 'Due Today',   bg: '#FEE2E2', text: '#991B1B', icon: 'notifications' },
  OVERDUE:   { label: 'Overdue',     bg: '#FEE2E2', text: '#991B1B', icon: 'warning-outline' },
  BOOKED:    { label: 'Booked',      bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle' },
  COMPLETED: { label: 'Completed',   bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-done-circle' },
  CANCELLED: { label: 'Cancelled',   bg: '#F1F5F9', text: '#64748B', icon: 'close-circle-outline' },
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const daysUntil = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(date); due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
};

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={11} color={cfg.text} />
      <Text style={[badge.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── Days chip ─────────────────────────────────────────────────────────────
function DaysChip({ followUpDate, status }) {
  if (['COMPLETED', 'CANCELLED', 'BOOKED'].includes(status)) return null;
  const d = daysUntil(followUpDate);
  let label, bg, text;
  if (d > 0)       { label = `In ${d} day${d > 1 ? 's' : ''}`; bg = '#EFF6FF'; text = colors.primary; }
  else if (d === 0) { label = 'Due today';    bg = '#FEE2E2'; text = '#991B1B'; }
  else              { label = `${Math.abs(d)}d overdue`; bg = '#FEE2E2'; text = '#991B1B'; }

  return (
    <View style={[chip.wrap, { backgroundColor: bg }]}>
      <Ionicons name="calendar" size={11} color={text} />
      <Text style={[chip.text, { color: text }]}>{label}</Text>
    </View>
  );
}
const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 6, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '600' },
});

// ─── Follow-up Card ────────────────────────────────────────────────────────
function FollowUpCard({ item, onBook }) {
  const doctorName = item.doctor?.user?.name || 'Doctor';
  const clinicName = item.clinic?.name || 'Clinic';
  const isCancelled = item.status === 'CANCELLED';
  const isCompleted = item.status === 'COMPLETED';
  const isBooked    = item.status === 'BOOKED';
  const canBook     = ['PENDING', 'UPCOMING', 'DUE', 'OVERDUE'].includes(item.status);
  const isUrgent    = ['DUE', 'OVERDUE', 'UPCOMING'].includes(item.status);

  return (
    <View style={[s.card, isCancelled && s.cardDimmed, isUrgent && s.cardUrgent]}>
      {/* Header row */}
      <View style={s.cardHeader}>
        {/* Doctor avatar */}
        <View style={s.avatar}>
          <Text style={s.avatarText}>{doctorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.doctorName}>Dr. {doctorName}</Text>
          <View style={s.clinicRow}>
            <Ionicons name="business-outline" size={11} color={colors.textMuted} />
            <Text style={s.clinicName} numberOfLines={1}>{clinicName}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Info grid */}
      <View style={s.infoGrid}>
        <InfoCell icon="calendar-outline"    label="Last Visit"   value={fmtDate(item.originalVisit?.appointmentDate)} />
        <InfoCell icon="arrow-forward-circle" label="Follow-up"   value={fmtDate(item.followUpDate)} color={isUrgent ? '#991B1B' : colors.primary} />
        <InfoCell icon="time-outline"         label="Recommended" value={`After ${item.followUpDays} days`} />
        {item.note ? (
          <InfoCell icon="document-text-outline" label="Note" value={item.note} fullWidth />
        ) : null}
      </View>

      {/* Days chip */}
      <DaysChip followUpDate={item.followUpDate} status={item.status} />

      {/* Booked appointment info */}
      {isBooked && item.bookedAppointment && (
        <View style={s.bookedBanner}>
          <Ionicons name="checkmark-circle" size={14} color="#065F46" />
          <Text style={s.bookedText}>
            Appointment booked for {fmtDate(item.bookedAppointment.appointmentDate)}
          </Text>
        </View>
      )}

      {/* Action button */}
      {canBook && (
        <TouchableOpacity style={s.bookBtn} onPress={() => onBook(item)} activeOpacity={0.85}>
          <Ionicons name="calendar-sharp" size={15} color="#fff" />
          <Text style={s.bookBtnText}>
            {item.status === 'OVERDUE' ? 'Book Follow-up (Overdue)' : 'Book Follow-up'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoCell({ icon, label, value, color, fullWidth }) {
  return (
    <View style={[s.infoCell, fullWidth && { width: '100%' }]}>
      <Ionicons name={icon} size={12} color={colors.textMuted} />
      <View>
        <Text style={s.infoCellLabel}>{label}</Text>
        <Text style={[s.infoCellValue, color && { color }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'active',    label: 'Active'    },
  { key: 'BOOKED',    label: 'Booked'    },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function FollowUpScreen({ navigation }) {
  const [followUps, setFollowUps] = useState([]);
  const [filter, setFilter]       = useState('active');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getMyFollowUps();
      setFollowUps(res.data.data?.followUps || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = followUps.filter((fu) => {
    if (filter === 'active') return ['PENDING', 'UPCOMING', 'DUE', 'OVERDUE'].includes(fu.status);
    return fu.status === filter;
  });

  const handleBook = (fu) => {
    navigation.navigate('HomeTab', {
      screen: 'Booking',
      params: {
        doctorId:       fu.doctor?.id,
        clinicId:       fu.clinic?.id,
        doctorName:     fu.doctor?.user?.name,
        clinicName:     fu.clinic?.name,
        specialization: fu.doctor?.specialization,
        followUpId:     fu.id,
        isFollowUp:     true,
        previousAppointmentId: fu.originalVisitId,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>My Follow-Ups</Text>
        </View>
        <View style={s.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>My Follow-Ups</Text>
          <Text style={s.subtitle}>Doctor-recommended follow-up visits</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>
            {followUps.filter(f => ['PENDING','UPCOMING','DUE','OVERDUE'].includes(f.status)).length}
          </Text>
          <Text style={s.countLabel}>Active</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = followUps.filter((fu) => {
            if (f.key === 'active') return ['PENDING','UPCOMING','DUE','OVERDUE'].includes(fu.status);
            return fu.status === f.key;
          }).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[s.filterLabel, active && s.filterLabelActive]}>
                {f.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Error */}
      {error && (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filtered.length === 0 ? s.emptyContainer : s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        renderItem={({ item }) => <FollowUpCard item={item} onBook={handleBook} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Text style={{ fontSize: 40 }}>📋</Text>
            </View>
            <Text style={s.emptyTitle}>
              {filter === 'active' ? 'No active follow-ups' : `No ${filter.toLowerCase()} follow-ups`}
            </Text>
            <Text style={s.emptySub}>
              {filter === 'active'
                ? "Your doctor will add a follow-up after your visit if needed."
                : "Nothing here yet."}
            </Text>
            {filter === 'active' && (
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => navigation.navigate('DoctorsTab')}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={15} color="#fff" />
                <Text style={s.emptyBtnText}>Book Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  countBadge:   { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  countText:    { fontSize: 22, fontWeight: '900', color: colors.primary },
  countLabel:   { fontSize: 10, fontWeight: '600', color: colors.primary, marginTop: 1 },

  // Filter row
  filterRow:    { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  filterChip:   { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterLabel:  { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  filterLabelActive: { color: '#fff' },

  // Error
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  errorText:    { fontSize: 13, color: colors.danger, flex: 1 },

  // List
  listContent:  { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  emptyContainer: { flex: 1, paddingHorizontal: 16 },

  // Card
  card:         { backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, ...shadow.sm },
  cardDimmed:   { opacity: 0.65 },
  cardUrgent:   { borderWidth: 1, borderColor: '#FCA5A5' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 18, fontWeight: '800', color: colors.primary },
  doctorName:   { fontSize: 14, fontWeight: '800', color: colors.text },
  clinicRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  clinicName:   { fontSize: 11, color: colors.textMuted, flex: 1 },

  // Info grid
  infoGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  infoCell:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '47%' },
  infoCellLabel:{ fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoCellValue:{ fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 1 },

  // Booked banner
  bookedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7, marginTop: 10 },
  bookedText:   { fontSize: 12, fontWeight: '600', color: '#065F46', flex: 1 },

  // Book button
  bookBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 11, marginTop: 12 },
  bookBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Empty state
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon:    { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle:   { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  emptySub:     { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
