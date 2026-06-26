// ─────────────────────────────────────────────────────────────────────────────
//  TrustBanner — PulseMate Connect
//  Soft blue card with 3 trust features + shield illustration + footer tagline
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY  = '#2563EB';
const SKY5     = '#0EA5E9';
const SLATE    = '#0F172A';
const MUTED    = '#64748B';
const WHITE    = '#FFFFFF';

const FEATURES = [
  {
    icon:    'shield-checkmark',
    color:   PRIMARY,
    title:   'Verified Clinics',
    sub:     'Trusted & verified\nhealthcare partners',
  },
  {
    icon:    'people',
    color:   SKY5,
    title:   'Live Queue Tracking',
    sub:     'Real-time updates\nso you can plan better',
  },
  {
    icon:    'calendar-outline',
    color:   '#8B5CF6',
    title:   'Instant Appointments',
    sub:     'Book in a few\nsimple steps',
  },
];

export default function TrustBanner() {
  return (
    <View style={s.section}>
      <View style={s.card}>
        {/* Decorative blobs */}
        <View style={s.blobTR} />
        <View style={s.blobBL} />

        {/* Shield illustration (top-right) */}
        <View style={s.shieldWrap}>
          <View style={s.shieldOuter}>
            <Ionicons name="shield-checkmark" size={38} color={PRIMARY} />
          </View>
          {/* Sparkle dots */}
          <View style={[s.sparkle, { top: 2, right: 4 }]} />
          <View style={[s.sparkle, { top: 12, right: -4, width: 5, height: 5 }]} />
          <View style={[s.sparkle, { bottom: 4, right: 8, width: 4, height: 4 }]} />
        </View>

        {/* Feature list */}
        {FEATURES.map((f, i) => (
          <View key={i} style={[s.featureRow, i < FEATURES.length - 1 && s.featureRowBorder]}>
            <View style={[s.iconWrap, { backgroundColor: `${f.color}18` }]}>
              <Ionicons name={f.icon} size={20} color={f.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}

        {/* Footer tagline */}
        <View style={s.footer}>
          <Ionicons name="heart" size={14} color="#EF4444" />
          <Text style={s.footerText}>Trusted by patients across Karnataka 💙</Text>
        </View>
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
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },

  // Decorative blobs
  blobTR: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DBEAFE',
    opacity: 0.45,
  },
  blobBL: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE9FE',
    opacity: 0.35,
  },

  // Shield illustration
  shieldWrap: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  sparkle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#93C5FD',
    opacity: 0.7,
  },

  // Feature rows
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingRight: 70, // leave room for shield
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 16,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
