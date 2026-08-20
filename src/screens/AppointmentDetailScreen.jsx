import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAppointmentDetail, cancelAppointment } from '../api/patient';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import { colors } from '../theme';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointmentDetail(id)
      .then((r) => setAppt(r.data.data.appointment))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!appt) {
    return (
      <SafeAreaView style={s.safe}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>
          Appointment not found
        </Text>
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await cancelAppointment(id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel');
          }
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Appointment Details</Text>
        </TouchableOpacity>

        {/* Status */}
        <Card>
          <Text style={s.sectionTitle}>Status</Text>
          <StatusBadge status={appt.status || 'UNKNOWN'} />
          {appt.queueNumber ? (
            <Text style={s.infoText}>Queue #{String(appt.queueNumber)}</Text>
          ) : null}
        </Card>

        {/* Doctor */}
        {appt.doctor ? (
          <Card>
            <Text style={s.sectionTitle}>Doctor</Text>
            <Text style={s.docName}>{appt.doctor.user?.name || 'Doctor'}</Text>
            {appt.doctor.specialization ? (
              <Text style={s.docSpec}>{String(appt.doctor.specialization)}</Text>
            ) : null}
          </Card>
        ) : null}

        {/* Clinic */}
        {appt.clinic ? (
          <Card>
            <Text style={s.sectionTitle}>Clinic</Text>
            <Text style={s.infoText}>{appt.clinic.name || 'Clinic'}</Text>
            {appt.clinic.address || appt.clinic.city ? (
              <Text style={s.infoText}>
                {[appt.clinic.address, appt.clinic.city].filter(Boolean).join(', ')}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {/* Details */}
        <Card>
          <Text style={s.sectionTitle}>Details</Text>
          {appt.appointmentDate ? (
            <View style={s.row}>
              <Text style={s.label}>Date:</Text>
              <Text style={s.value}>
                {new Date(appt.appointmentDate).toLocaleDateString('en-IN')}
              </Text>
            </View>
          ) : null}
          {appt.slotTime ? (
            <View style={s.row}>
              <Text style={s.label}>Time:</Text>
              <Text style={s.value}>{String(appt.slotTime)}</Text>
            </View>
          ) : null}
        </Card>

        {/* Actions */}
        {appt.status === 'CANCELLED' ? (
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => navigation.navigate('DoctorProfile', { 
              id: appt.doctorId,
              clinicId: appt.clinicId 
            })}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>Book Another Appointment</Text>
          </TouchableOpacity>
        ) : null}

        {['BOOKED', 'IN_QUEUE'].includes(appt.status) ? (
          <TouchableOpacity style={s.dangerBtn} onPress={handleCancel}>
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <Text style={s.dangerBtnText}>Cancel Appointment</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  docName: { fontSize: 15, fontWeight: '700', color: colors.text },
  docSpec: { fontSize: 13, color: colors.primary, marginTop: 4 },
  infoText: { fontSize: 14, color: colors.text, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, color: colors.textMuted },
  value: { fontSize: 14, fontWeight: '600', color: colors.text },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dangerBtn: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  dangerBtnText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
