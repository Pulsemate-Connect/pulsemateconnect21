import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/auth';
import { colors, shadow, radius } from '../theme';

export default function HolidayManagementScreen({ navigation, route }) {
  const { clinicId, clinicName } = route.params;

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [reason, setReason] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const response = await api.get(`/clinic/${clinicId}/holidays`);
      if (response.data.success) {
        setHolidays(response.data.holidays);
      }
    } catch (error) {
      console.error('Failed to load holidays:', error);
      Alert.alert('Error', 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!selectedDate || !holidayName) {
      Alert.alert('Error', 'Please select date and enter holiday name');
      return;
    }

    try {
      const response = await api.post(`/clinic/${clinicId}/holidays`, {
        date: selectedDate,
        name: holidayName,
        reason,
        isRecurring,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Holiday added successfully');
        setModalVisible(false);
        setHolidayName('');
        setReason('');
        setIsRecurring(false);
        loadHolidays();
      }
    } catch (error) {
      console.error('Failed to add holiday:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add holiday');
    }
  };

  const handleDeleteHoliday = (holidayId, holidayName) => {
    Alert.alert(
      'Delete Holiday',
      `Are you sure you want to delete "${holidayName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/clinic/${clinicId}/holidays/${holidayId}`);
              Alert.alert('Success', 'Holiday deleted');
              loadHolidays();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete holiday');
            }
          },
        },
      ]
    );
  };

  // Format holidays for calendar
  const markedDates = {};
  holidays.forEach((holiday) => {
    const dateStr = new Date(holiday.date).toISOString().split('T')[0];
    markedDates[dateStr] = {
      selected: true,
      selectedColor: colors.error,
      marked: true,
      dotColor: 'white',
    };
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>Holidays</Text>
          <Text style={s.subtitle}>{clinicName}</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={s.section}>
          <Calendar
            markedDates={markedDates}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setModalVisible(true);
            }}
            theme={{
              todayTextColor: colors.primary,
              arrowColor: colors.primary,
            }}
          />
        </View>

        {/* Holiday List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Upcoming Holidays</Text>
          {holidays.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyText}>No holidays added</Text>
            </View>
          ) : (
            holidays.map((holiday) => (
              <View key={holiday.id} style={s.holidayCard}>
                <View style={s.holidayLeft}>
                  <View style={s.holidayIconCircle}>
                    <Ionicons name="calendar" size={20} color={colors.error} />
                  </View>
                  <View style={s.holidayInfo}>
                    <Text style={s.holidayName}>{holiday.name}</Text>
                    <Text style={s.holidayDate}>
                      {new Date(holiday.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    {holiday.reason && (
                      <Text style={s.holidayReason}>{holiday.reason}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteHoliday(holiday.id, holiday.name)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Holiday Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Add Holiday</Text>

            <Text style={s.label}>Date</Text>
            <Text style={s.dateText}>{selectedDate || 'Select date from calendar'}</Text>

            <Text style={s.label}>Holiday Name *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Christmas, Diwali"
              value={holidayName}
              onChangeText={setHolidayName}
            />

            <Text style={s.label}>Reason (Optional)</Text>
            <TextInput
              style={s.input}
              placeholder="Optional reason"
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity
              style={s.checkboxRow}
              onPress={() => setIsRecurring(!isRecurring)}
            >
              <View style={[s.checkbox, isRecurring && s.checkboxChecked]}>
                {isRecurring && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={s.checkboxLabel}>Recurring yearly</Text>
            </TouchableOpacity>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnAdd]}
                onPress={handleAddHoliday}
              >
                <Text style={s.modalBtnText}>Add Holiday</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
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
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 40,
    alignItems: 'center',
    ...shadow.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
  holidayCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    ...shadow.sm,
  },
  holidayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  holidayIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayInfo: { flex: 1 },
  holidayName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  holidayDate: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  holidayReason: { fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: { fontSize: 14, color: colors.text },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnAdd: {
    backgroundColor: colors.primary,
  },
  modalBtnTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
