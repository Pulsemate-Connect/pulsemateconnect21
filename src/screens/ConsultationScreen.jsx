import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/auth';
import { colors, shadow, radius } from '../theme';

export default function ConsultationScreen({ navigation, route }) {
  const { appointmentId, patientName, patientId } = route.params;

  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!diagnosis) {
      Alert.alert('Error', 'Please enter diagnosis');
      return;
    }

    setLoading(true);
    try {
      const prescriptionData = {
        appointmentId,
        patientId,
        symptoms,
        diagnosis,
        medicines: medicines.filter(m => m.name),
        instructions,
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : null,
      };

      await api.post('/doctor/prescription', prescriptionData);
      await api.patch(`/doctor/appointment/${appointmentId}/complete`);

      Alert.alert('Success', 'Consultation completed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>Consultation</Text>
          <Text style={s.subtitle}>{patientName}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Symptoms */}
        <View style={s.section}>
          <Text style={s.label}>Symptoms</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Enter patient symptoms..."
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Diagnosis */}
        <View style={s.section}>
          <Text style={s.label}>Diagnosis *</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Enter diagnosis..."
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Medicines */}
        <View style={s.section}>
          <View style={s.labelRow}>
            <Text style={s.label}>Medicines</Text>
            <TouchableOpacity onPress={addMedicine} style={s.addBtn}>
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <Text style={s.addText}>Add Medicine</Text>
            </TouchableOpacity>
          </View>

          {medicines.map((medicine, index) => (
            <View key={index} style={s.medicineCard}>
              <View style={s.medicineHeader}>
                <Text style={s.medicineNumber}>Medicine {index + 1}</Text>
                {medicines.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedicine(index)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={s.input}
                placeholder="Medicine name"
                value={medicine.name}
                onChangeText={(value) => updateMedicine(index, 'name', value)}
              />

              <View style={s.row}>
                <TextInput
                  style={[s.input, s.halfInput]}
                  placeholder="Dosage (e.g., 1-0-1)"
                  value={medicine.dosage}
                  onChangeText={(value) => updateMedicine(index, 'dosage', value)}
                />
                <TextInput
                  style={[s.input, s.halfInput]}
                  placeholder="Duration (e.g., 5 days)"
                  value={medicine.duration}
                  onChangeText={(value) => updateMedicine(index, 'duration', value)}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={s.section}>
          <Text style={s.label}>Instructions</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Special instructions for the patient..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Follow-up */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.checkboxRow}
            onPress={() => setFollowUpRequired(!followUpRequired)}
          >
            <View style={[s.checkbox, followUpRequired && s.checkboxChecked]}>
              {followUpRequired && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={s.checkboxLabel}>Follow-up required</Text>
          </TouchableOpacity>

          {followUpRequired && (
            <TextInput
              style={s.input}
              placeholder="Follow-up date (YYYY-MM-DD)"
              value={followUpDate}
              onChangeText={setFollowUpDate}
            />
          )}
        </View>

        {/* Submit Button */}
        <View style={s.section}>
          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={s.submitBtnText}>
              {loading ? 'Submitting...' : 'Complete Consultation'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  textArea: { minHeight: 90 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medicineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  medicineNumber: { fontSize: 13, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { fontSize: 14, color: colors.text },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
