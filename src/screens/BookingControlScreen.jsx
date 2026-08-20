import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  TextInput, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getClinicBookingStatus,
  stopClinicBookings,
  resumeClinicBookings,
} from '../api/auth';
import { colors, shadow, radius } from '../theme';

export default function BookingControlScreen({ navigation, route }) {
  const { clinicId, clinicName } = route.params;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await getClinicBookingStatus(clinicId);
      if (response.data.success) {
        setStatus(response.data);
        setReason(response.data.clinic.suspendedReason || '');
      }
    } catch (error) {
      console.error('Failed to load status:', error);
      Alert.alert('Error', 'Failed to load booking status');
    } finally {
      setLoading(false);
    }
  };

  const handleStopBookings = async () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for stopping bookings');
      return;
    }

    Alert.alert(
      'Stop Bookings?',
      `New patients won't be able to book appointments. Existing appointments will remain valid.\n\nReason: ${reason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Bookings',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const response = await stopClinicBookings(clinicId, reason);
              if (response.data.success) {
                Alert.alert('Success', 'Bookings stopped successfully');
                await loadStatus();
              }
            } catch (error) {
              console.error('Failed to stop bookings:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to stop bookings');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleResumeBookings = async () => {
    Alert.alert(
      'Resume Bookings?',
      'New patients will be able to book appointments again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            setUpdating(true);
            try {
              const response = await resumeClinicBookings(clinicId);
              if (response.data.success) {
                Alert.alert('Success', 'Bookings resumed successfully');
                setReason('');
                await loadStatus();
              }
            } catch (error) {
              console.error('Failed to resume bookings:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to resume bookings');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.title}>Booking Control</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const isAcceptingBookings = status?.acceptingBookings;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>Booking Control</Text>
          <Text style={s.subtitle}>{clinicName}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Status Card */}
        <View style={s.section}>
          <View style={[
            s.statusCard,
            { backgroundColor: isAcceptingBookings ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <View style={[
              s.statusIcon,
              { backgroundColor: isAcceptingBookings ? '#10B981' : '#EF4444' }
            ]}>
              <Ionicons
                name={isAcceptingBookings ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color="#fff"
              />
            </View>
            <View style={s.statusContent}>
              <Text style={s.statusTitle}>
                {isAcceptingBookings ? 'Accepting Bookings' : 'Bookings Stopped'}
              </Text>
              <Text style={s.statusSubtitle}>
                {isAcceptingBookings
                  ? 'New patients can book appointments'
                  : status?.message || 'Not accepting new bookings'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={s.section}>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={s.infoText}>
                Use booking control to temporarily stop accepting new appointments during emergencies,
                maintenance, or when fully booked.
              </Text>
            </View>
            <View style={[s.infoRow, { marginTop: 12 }]}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={s.infoText}>
                Existing appointments will remain valid and unaffected.
              </Text>
            </View>
          </View>
        </View>

        {/* Reason Input (only when stopping bookings) */}
        {isAcceptingBookings && (
          <View style={s.section}>
            <Text style={s.inputLabel}>Reason for stopping bookings</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Emergency maintenance, Fully booked"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!updating}
            />
            <Text style={s.inputHelper}>
              This message will be shown to patients trying to book.
            </Text>
          </View>
        )}

        {/* Current Reason (when bookings are stopped) */}
        {!isAcceptingBookings && status?.clinic?.suspendedReason && (
          <View style={s.section}>
            <Text style={s.inputLabel}>Current Reason</Text>
            <View style={s.reasonCard}>
              <Text style={s.reasonText}>{status.clinic.suspendedReason}</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={s.section}>
          {isAcceptingBookings ? (
            <TouchableOpacity
              style={[s.actionBtn, s.stopBtn, updating && s.btnDisabled]}
              onPress={handleStopBookings}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="pause-circle" size={20} color="#fff" />
                  <Text style={s.actionBtnText}>Stop Accepting Bookings</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.actionBtn, s.resumeBtn, updating && s.btnDisabled]}
              onPress={handleResumeBookings}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={20} color="#fff" />
                  <Text style={s.actionBtnText}>Resume Accepting Bookings</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  headerMid: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  // Status Card
  statusCard: {
    borderRadius: radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...shadow.sm,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 16,
    ...shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // Input
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 90,
  },
  inputHelper: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },

  // Reason Card
  reasonCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  // Action Button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  stopBtn: {
    backgroundColor: '#EF4444',
  },
  resumeBtn: {
    backgroundColor: '#10B981',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
