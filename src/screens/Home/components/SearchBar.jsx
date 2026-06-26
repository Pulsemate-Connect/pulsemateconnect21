// ─────────────────────────────────────────────────────────────────────────────
//  SearchBar — PulseMate Connect
//  Tappable search field that navigates to Search screen
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WHITE = '#FFFFFF';
const MUTED = '#94A3B8';

/**
 * @param {function} onPress — called when user taps the search bar
 */
export default function SearchBar({ onPress }) {
  return (
    <TouchableOpacity style={s.bar} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name="search-outline" size={18} color={MUTED} />
      <Text style={s.placeholder} numberOfLines={1}>
        Search doctors, clinics, specialities...
      </Text>
      <Ionicons name="mic-outline" size={18} color={MUTED} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bar: {
    marginHorizontal: 16,
    marginBottom: 22,
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  placeholder: {
    fontSize: 14,
    color: MUTED,
    flex: 1,
  },
});
