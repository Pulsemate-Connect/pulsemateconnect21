// ─────────────────────────────────────────────────────────────────────────────
//  SectionHeader — PulseMate Connect
//  Reusable section title + "View all >" row
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#2563EB';
const SLATE   = '#0F172A';

/**
 * @param {string}        title     — section heading text
 * @param {function|null} onViewAll — if provided, shows "View all" link
 */
export default function SectionHeader({ title, onViewAll }) {
  return (
    <View style={s.row}>
      <Text style={s.title}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={s.linkRow}>
            <Text style={s.link}>View all</Text>
            <Ionicons name="chevron-forward" size={13} color={PRIMARY} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: SLATE,
    letterSpacing: -0.3,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  link: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '700',
  },
});
