import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAppointmentDetail, cancelAppointment } from '../api/patient';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import { colors } from '../theme';

const openMaps = (lat, lng, name) => {
  if (!lat || !lng) return;
  const url = Platform.OS === 'ios'
    ? `maps://?q=${encodeURIComponent(name)}&ll=${lat},${lng}`
    : `geo:${lat},${lng}?q=${encodeURIComponent(name)}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`)
  );
};

// ── Doctor avatar — photo with initial fallback ───────────────────────────────
function DoctorAvatarDetail({ photoUrl, name, size = 44 }) {
  const [broken, setBroken] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'D';
  if (photoUrl && !broken) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <View style={[s.docAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={s.docAvatarText}>{initial}</Text>
    </View>
  );
}

export default function AppointmentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [appt, setAppt]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointmentDetail(id)
      .then((r) => setAppt(r.data.data.appointment))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await cancelAppointment(id);
          navigation.goBack();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
        }
      }},
    ]);
  };

  const handleRefund = () => {
    Alert.alert(
      'Request Refund',
      'This will request a refund for your booking fee. The appointment will be cancelled if still active.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Refund', style: 'destructive', onPress: async () => {
          try {
            await api.post('/payments/refund', { appointmentId: id, reason: 'Patient requested refund' });
            Alert.alert('✓ Refund Requested', 'Your refund has been processed.');
            // Reload the appointment detail
            getAppointmentDetail(id)
              .then((r) => setAppt(r.data.data.appointment))
              .catch(() => {});
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Refund request failed');
          }
        }},
      ]
    );
  };

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!appt) return (
    <SafeAreaView style={s.safe}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>Appointment not found</Text>
    </SafeAreaView>
  );

  const isPaid = appt.payment?.status === 'PAID';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Appointment Details</Text>
        </TouchableOpacity>

        {/* Status banner */}
        <Card style={s.statusCard}>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Status</Text>
            <StatusBadge status={appt.status} />
          </View>
          {appt.queueNumber && (
            <View style={s.queueBadge}>
              <Text style={s.queueText}>Queue #{appt.queueNumber}</Text>
            </View>
          )}
        </Card>

        {/* Doctor */}
        <Card>
          <Text style={s.sectionTitle}>Doctor</Text>
          <View style={s.docRow}>
            <DoctorAvatarDetail
              photoUrl={appt.doctor?.profilePhotoUrl || appt.doctor?.profileImage}
              name={appt.doctor?.user?.name}
            />
            <View style={s.docInfo}>
              <Text style={s.docName}>{appt.doctor?.user?.name}</Text>
              <Text style={s.docSpec}>{appt.doctor?.specialization}</Text>
            </View>
          </View>
        </Card>

        {/* Clinic */}
        <Card>
          <Text style={s.sectionTitle}>Clinic</Text>
          <View style={s.infoRow}>
            <Ionicons name="business-outline" size={16} color={colors.textMuted} />
            <Text style={s.infoText}>{appt.clinic?.name}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={s.infoText}>{appt.clinic?.address}, {appt.clinic?.city}</Text>
          </View>
          {/* Quick actions */}
          <View style={s.clinicActions}>
            {appt.clinic?.phone && (
              <TouchableOpacity
                style={[s.clinicActionBtn, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]}
                onPress={() => Linking.openURL(`tel:${appt.clinic.phone}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={15} color="#10B981" />
                <Text style={[s.clinicActionText, { color: '#065F46' }]}>Call Clinic</Text>
              </TouchableOpacity>
            )}
            {appt.clinic?.latitude && appt.clinic?.longitude && (
              <TouchableOpacity
                style={[s.clinicActionBtn, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}
                onPress={() => openMaps(appt.clinic.latitude, appt.clinic.longitude, appt.clinic.name)}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={15} color={colors.primary} />
                <Text style={[s.clinicActionText, { color: colors.primaryDark }]}>Directions</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Appointment info */}
        <Card>
          <Text style={s.sectionTitle}>Details</Text>
          <View style={s.grid}>
            <InfoItem label="Date"  value={new Date(appt.appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoItem label="Type"  value={appt.appointmentType === 'OFFLINE' ? '🏥 In-Clinic' : '💻 Online'} />
            {appt.slotTime && <InfoItem label="Time" value={(() => { const [h,m] = appt.slotTime.split(':').map(Number); return `${h > 12 ? h-12 : h||12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`; })()} />}
            {appt.estimatedWaitMinutes && <InfoItem label="Est. Wait" value={`${appt.estimatedWaitMinutes} min`} />}
          </View>
          {appt.symptoms && (
            <View style={s.symptomsBox}>
              <Text style={s.symptomsLabel}>Symptoms</Text>
              <Text style={s.symptomsText}>{appt.symptoms}</Text>
            </View>
          )}
          {appt.notes && (
            <View style={[s.symptomsBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[s.symptomsLabel, { color: '#166534' }]}>Doctor's Notes</Text>
              <Text style={[s.symptomsText, { color: '#166534' }]}>{appt.notes}</Text>
            </View>
          )}
        </Card>

        {/* Payment */}
        <Card>
          <Text style={s.sectionTitle}>Payment</Text>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Booking Fee</Text>
            <Text style={s.payVal}>
              {appt.payment?.amount === 0 ? '🎉 FREE' : `₹${appt.payment?.amount || 10}`}
            </Text>
          </View>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Status</Text>
            <View style={[s.payStatus, { backgroundColor: isPaid ? '#D1FAE5' : '#FEF3C7' }]}>
              <Text style={[s.payStatusText, { color: isPaid ? '#065F46' : '#92400E' }]}>
                {appt.payment?.status === 'REFUNDED' ? '↩ Refunded' : isPaid ? '✓ Paid' : 'Pending'}
              </Text>
            </View>
          </View>
          {appt.payment?.method && (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Method</Text>
              <Text style={s.payVal}>{appt.payment.method}</Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <View style={s.actions}>
          {['IN_QUEUE','BOOKED','CHECKED_IN'].includes(appt.status) && (
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => navigation.navigate('LiveQueue', { appointmentId: appt.id })}
            >
              <Ionicons name="radio-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Track Live Queue</Text>
            </TouchableOpacity>
          )}
          {['BOOKED','IN_QUEUE'].includes(appt.status) && (
            <TouchableOpacity style={s.dangerBtn} onPress={handleCancel}>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={s.dangerBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          )}
          {/* Refund — only for completed paid appointments (not free) */}
          {appt.status === 'COMPLETED' &&
            appt.payment?.status === 'PAID' &&
            appt.payment?.amount > 0 && (
            <TouchableOpacity style={s.refundBtn} onPress={handleRefund}>
              <Ionicons name="return-up-back-outline" size={18} color="#6B7280" />
              <Text style={s.refundBtnText}>Request Refund</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoItem = ({ label, value }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 }}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  content:      { padding: 20, paddingBottom: 40 },
  back:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText:     { fontSize: 18, fontWeight: '700', color: colors.text },
  statusCard:   { backgroundColor: colors.primaryLight },
  statusRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusLabel:  { fontSize: 14, fontWeight: '600', color: colors.text },
  queueBadge:   { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  queueText:    { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  docAvatarText:{ fontSize: 18, fontWeight: '700', color: colors.primary },
  docInfo:      { flex: 1 },
  docName:      { fontSize: 15, fontWeight: '700', color: colors.text },
  docSpec:      { fontSize: 13, color: colors.primary, marginTop: 2 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText:     { fontSize: 14, color: colors.text, flex: 1 },
  grid:         { flexDirection: 'column', gap: 0 },
  symptomsBox:  { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 8 },
  symptomsLabel:{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  symptomsText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  payRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  payLabel:     { fontSize: 13, color: colors.textMuted },
  payVal:       { fontSize: 14, fontWeight: '600', color: colors.text },
  payStatus:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  payStatusText:{ fontSize: 12, fontWeight: '700' },
  actions:      { gap: 10, marginTop: 4 },
  clinicActions:{ flexDirection: 'row', gap: 10, marginTop: 10 },
  clinicActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 10, borderWidth: 1,
  },
  clinicActionText: { fontSize: 12, fontWeight: '700' },
  primaryBtn:   { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  dangerBtn:    { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerBtnText:{ color: colors.danger, fontWeight: '700', fontSize: 15 },
  refundBtn:    { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  refundBtnText:{ color: '#6B7280', fontWeight: '600', fontSize: 13 },
});
