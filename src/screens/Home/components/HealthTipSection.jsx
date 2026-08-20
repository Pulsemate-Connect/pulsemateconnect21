// ─────────────────────────────────────────────────────────────────────────────
//  HealthTipSection — PulseMate Connect
//  Auto-rotating health tip card with water/leaf illustration + slider dots
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from './SectionHeader';

const PRIMARY = '#2563EB';
const SUCCESS = '#16A34A';
const MUTED   = '#94A3B8';
const WHITE   = '#FFFFFF';

export const HEALTH_TIPS = [
  {
    id: '1',
    title:  'Stay Hydrated',
    body:   'Drink enough water every day to keep your body healthy.',
    emoji:  '💧',
    bg:     '#F0FDF4',
    color:  SUCCESS,
  },
  {
    id: '2',
    title:  'Walk 30 Minutes',
    body:   'A daily 30-minute walk reduces risk of heart disease.',
    emoji:  '🚶',
    bg:     '#EFF6FF',
    color:  PRIMARY,
  },
  {
    id: '3',
    title:  'Sleep 7-8 Hours',
    body:   'Quality sleep boosts immunity and mental health.',
    emoji:  '😴',
    bg:     '#FEF3C7',
    color:  '#D97706',
  },
];

/**
 * @param {number}   tipIndex  — currently active tip index
 * @param {function} onNext    — called when arrow button is pressed
 * @param {function} onViewAll — View all handler
 */
export default function HealthTipSection({ tipIndex = 0, onNext }) {
  const tip = HEALTH_TIPS[tipIndex % HEALTH_TIPS.length];

  return (
    <View style={s.section}>
      <SectionHeader title="Health Tip" />

      <View style={s.card}>
        {/* Decorative background circle */}
        <View style={[s.bgCircle, { backgroundColor: tip.bg }]} />

        {/* Emoji / water illustration */}
        <View style={[s.emojiWrap, { backgroundColor: tip.bg }]}>
          <Text style={s.emoji}>{tip.emoji}</Text>
        </View>

        {/* Content */}
        <View style={s.content}>
          <Text style={[s.tipTitle, { color: tip.color }]}>{tip.title}</Text>
          <Text style={s.tipBody}>{tip.body}</Text>
        </View>

        {/* Right arrow button */}
        <TouchableOpacity style={s.arrowBtn} onPress={onNext} activeOpacity={0.75}>
          <Ionicons name="arrow-forward" size={18} color={tip.color} />
        </TouchableOpacity>
      </View>

      {/* Slider dots */}
      <View style={s.dots}>
        {HEALTH_TIPS.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === tipIndex % HEALTH_TIPS.length && [s.dotActive, { backgroundColor: tip.color }],
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bgCircle: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.5,
  },
  emojiWrap: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 26,
  },
  content: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FBFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Dots
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 20,
  },
});
