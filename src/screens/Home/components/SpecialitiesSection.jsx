// ─────────────────────────────────────────────────────────────────────────────
//  SpecialitiesSection — PulseMate Connect
//  Horizontal scrollable list of medical speciality chips
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from './SectionHeader';

const SLATE = '#0F172A';

// ── Static speciality data ────────────────────────────────────────────────────
export const SPECIALITIES = [
  { id: '1', label: 'General\nPhysician', icon: 'medkit-outline',    bg: '#EFF6FF', ic: '#2563EB' },
  { id: '2', label: 'Dentist',            icon: 'happy-outline',      bg: '#F0FDF4', ic: '#16A34A' },
  { id: '3', label: 'Pediatrician',       icon: 'heart-outline',      bg: '#FFF7ED', ic: '#EA580C' },
  { id: '4', label: 'Dermatologist',      icon: 'body-outline',       bg: '#FDF4FF', ic: '#9333EA' },
  { id: '5', label: 'Orthopedic',         icon: 'fitness-outline',    bg: '#F0FDFA', ic: '#0D9488' },
  { id: '6', label: 'ENT',               icon: 'ear-outline',        bg: '#FEF3C7', ic: '#D97706' },
  { id: '7', label: 'More',              icon: 'grid-outline',       bg: '#F1F5F9', ic: '#64748B' },
];

/**
 * @param {function} onViewAll   — navigates to specialities / discover
 * @param {function} onSpeciality — called with speciality item on tap
 */
export default function SpecialitiesSection({ onViewAll, onSpeciality }) {
  return (
    <View style={s.section}>
      <SectionHeader title="Specialities" onViewAll={onViewAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {SPECIALITIES.map((sp) => (
          <TouchableOpacity
            key={sp.id}
            style={s.item}
            onPress={() => onSpeciality && onSpeciality(sp)}
            activeOpacity={0.75}
          >
            <View style={[s.iconWrap, { backgroundColor: sp.bg }]}>
              <Ionicons name={sp.icon} size={26} color={sp.ic} />
            </View>
            <Text style={s.label}>{sp.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  row: {
    gap: 10,
    paddingRight: 16,
  },
  item: {
    alignItems: 'center',
    gap: 8,
    width: 72,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: SLATE,
    textAlign: 'center',
    lineHeight: 14,
  },
});
