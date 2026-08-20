// ─────────────────────────────────────────────────────────────────────────────
//  HeroBanner — PulseMate Connect
//  Premium blue-gradient hero card with phone mockup illustration
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#2563EB';
const SLATE   = '#0F172A';
const MUTED   = '#64748B';
const WHITE   = '#FFFFFF';

/**
 * @param {function} onGetStarted — handler for Get Started button
 */
export default function HeroBanner({ onGetStarted }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={[s.banner, isTablet && s.bannerTablet]}>
      {/* Decorative blobs */}
      <View style={s.blobTL} />
      <View style={s.blobBR} />
      <View style={s.blobMid} />

      {/* ── Left text content ── */}
      <View style={[s.left, isTablet && s.leftTablet]}>
        <Text style={[s.title, isTablet && s.titleTablet]}>
          Smart Healthcare.
        </Text>
        <Text style={[s.titleBlue, isTablet && s.titleTablet]}>
          Less Waiting.
        </Text>
        <Text style={[s.subtitle, isTablet && s.subtitleTablet]}>
          Book appointments, track live{'\n'}queues and visit your doctor.
        </Text>
        <TouchableOpacity
          style={s.btn}
          onPress={onGetStarted}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={14} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* ── Right phone mockup illustration ── */}
      <View style={[s.right, isTablet && s.rightTablet]}>
        {/* Outer glow ring */}
        <View style={s.phoneGlow} />
        {/* Phone frame */}
        <View style={s.phone}>
          {/* Status bar dots */}
          <View style={s.phoneCamera} />
          {/* Screen content */}
          <View style={s.phoneScreen}>
            {/* Hospital building illustration (SVG-style via shapes) */}
            <View style={s.buildingBase}>
              <View style={s.buildingBody}>
                {/* Cross sign */}
                <View style={s.crossH} />
                <View style={s.crossV} />
                {/* Windows row 1 */}
                <View style={s.windowRow}>
                  <View style={s.window} />
                  <View style={s.window} />
                </View>
                {/* Windows row 2 */}
                <View style={s.windowRow}>
                  <View style={s.window} />
                  <View style={s.window} />
                </View>
              </View>
              {/* Door */}
              <View style={s.door} />
            </View>
            {/* PulseMate label */}
            <View style={s.labelWrap}>
              <Ionicons name="pulse" size={10} color={PRIMARY} />
              <Text style={s.labelText}>PulseMate</Text>
            </View>
            <Text style={s.labelSub}>Connect</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 165,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bannerTablet: {
    minHeight: 210,
    padding: 30,
    marginHorizontal: 24,
  },

  // Decorative blobs
  blobTL: {
    position: 'absolute',
    top: -35,
    left: -35,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#BFDBFE',
    opacity: 0.6,
  },
  blobBR: {
    position: 'absolute',
    bottom: -25,
    right: 90,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#BAE6FD',
    opacity: 0.5,
  },
  blobMid: {
    position: 'absolute',
    top: 20,
    right: 60,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F2FE',
    opacity: 0.7,
  },

  // Left side
  left: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  leftTablet: {
    paddingRight: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: SLATE,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  titleBlue: {
    fontSize: 20,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: -0.5,
    marginBottom: 8,
    lineHeight: 26,
  },
  titleTablet: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 16,
  },
  subtitleTablet: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
  },

  // Right phone mockup
  right: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightTablet: {
    width: 130,
  },
  phoneGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#93C5FD',
    opacity: 0.25,
  },
  phone: {
    width: 78,
    height: 118,
    backgroundColor: WHITE,
    borderRadius: 16,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 7,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  phoneCamera: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  phoneScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },

  // Hospital building illustration
  buildingBase: {
    alignItems: 'center',
  },
  buildingBody: {
    width: 40,
    height: 44,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginBottom: 2,
  },
  crossH: {
    position: 'absolute',
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    top: 8,
  },
  crossV: {
    position: 'absolute',
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    top: 4,
  },
  windowRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 16,
  },
  window: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#93C5FD',
  },
  door: {
    width: 14,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },

  // Label
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  labelText: {
    fontSize: 8,
    fontWeight: '800',
    color: PRIMARY,
  },
  labelSub: {
    fontSize: 7,
    color: MUTED,
    fontWeight: '600',
  },
});
