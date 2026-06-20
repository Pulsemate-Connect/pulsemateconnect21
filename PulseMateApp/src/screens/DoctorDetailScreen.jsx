// ─────────────────────────────────────────────────────────────────────────────
//  DoctorDetailScreen — PulseMate Connect  |  Premium Doctor Profile
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Easing, Dimensions, StatusBar,
  Linking, Platform, Alert, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDoctorProfile } from '../api/patient';
import { colors, shadow } from '../theme';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY5  = '#0EA5E9'; const SKY6  = '#0284C7'; const SKY7 = '#0369A1';
const TEAL  = '#2DD4BF'; const WHITE = '#FFFFFF';
const SLATE = '#0F172A'; const MUTED = '#94A3B8'; const BG = '#F0F7FF';

// ── Spec color map ────────────────────────────────────────────────────────────
const SPEC_CFG = {
  'General Physician': { color: '#6366F1', bg: '#EEF2FF', icon: 'medkit'        },
  'Cardiologist':      { color: '#EF4444', bg: '#FEE2E2', icon: 'heart'         },
  'Dermatologist':     { color: '#F59E0B', bg: '#FEF3C7', icon: 'color-palette' },
  'Orthopedic':        { color: '#10B981', bg: '#D1FAE5', icon: 'body'          },
  'Pediatrician':      { color: '#EC4899', bg: '#FCE7F3', icon: 'happy'         },
  'Neurologist':       { color: '#8B5CF6', bg: '#EDE9FE', icon: 'pulse'         },
  'Physiotherapy':     { color: SKY5,      bg: '#E0F2FE', icon: 'fitness'       },
  'Dental':            { color: '#14B8A6', bg: '#CCFBF1', icon: 'happy-outline' },
  'ENT':               { color: '#06B6D4', bg: '#CFFAFE', icon: 'ear'           },
};
const getSpec = (s) => SPEC_CFG[s] || { color: SKY5, bg: '#E0F2FE', icon: 'medical' };

// ── Day abbreviations ─────────────────────────────────────────────────────────
const DAY_SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };

// ── Helper: format doctor name without double "Dr." ──────────────────────────
const fmtDoctorName = (name) => {
  if (!name) return 'Doctor';
  const t = name.trim();
  if (t.toLowerCase().startsWith('dr.') || t.toLowerCase().startsWith('dr ')) return t;
  return `Dr. ${t}`;
};

// ── Maps navigation helper ────────────────────────────────────────────────────
const openMaps = (lat, lng, name) => {
  if (!lat || !lng) {
    Alert.alert('No Location', 'Clinic location coordinates are not available.');
    return;
  }
  const url = Platform.OS === 'ios'
    ? `maps://?q=${encodeURIComponent(name)}&ll=${lat},${lng}`
    : `geo:${lat},${lng}?q=${encodeURIComponent(name)}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`)
  );
};

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children, accent = SKY5 }) {
  return (
    <View style={dd.section}>
      <View style={dd.sectionHeader}>
        <View style={[dd.sectionIconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name={icon} size={15} color={accent} />
        </View>
        <Text style={dd.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, accent = SKY5 }) {
  return (
    <View style={dd.infoRow}>
      <View style={[dd.infoIconWrap, { backgroundColor: accent + '15' }]}>
        <Ionicons name={icon} size={14} color={accent} />
      </View>
      <View style={dd.infoContent}>
        <Text style={dd.infoLabel}>{label}</Text>
        <Text style={dd.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── Star rating ───────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

// ── Clinic card ───────────────────────────────────────────────────────────────
function ClinicCard({ dc, accent, onBook }) {
  const days = dc.availableDays?.map((d) => DAY_SHORT[d] || d).join('  ·  ') || 'Mon – Sat';
  const time = dc.startTime && dc.endTime ? `${dc.startTime} – ${dc.endTime}` : '9:00 AM – 6:00 PM';
  const fee  = dc.consultationFee ? `₹${dc.consultationFee}` : 'Free';

  return (
    <View style={[dd.clinicCard, { borderLeftColor: accent }]}>
      {/* Clinic header */}
      <View style={dd.clinicTop}>
        <View style={[dd.clinicIconWrap, { backgroundColor: accent + '18' }]}>
          <Ionicons name="business" size={20} color={accent} />
        </View>
        <View style={dd.clinicInfo}>
          <Text style={dd.clinicName}>{dc.clinic?.name}</Text>
          <View style={dd.clinicLocRow}>
            <Ionicons name="location-outline" size={12} color={MUTED} />
            <Text style={dd.clinicLoc}>
              {[dc.clinic?.address, dc.clinic?.city].filter(Boolean).join(', ') || 'Location not specified'}
            </Text>
          </View>
        </View>
        <View style={[dd.clinicFeeBadge, { backgroundColor: accent + '15' }]}>
          <Text style={[dd.clinicFeeText, { color: accent }]}>{fee}</Text>
          <Text style={dd.clinicFeeLabel}>fee</Text>
        </View>
      </View>

      {/* Working hours */}
      <View style={dd.clinicMeta}>
        <View style={dd.clinicMetaItem}>
          <Ionicons name="calendar-outline" size={13} color={MUTED} />
          <Text style={dd.clinicMetaText}>{days}</Text>
        </View>
        <View style={dd.clinicMetaItem}>
          <Ionicons name="time-outline" size={13} color={MUTED} />
          <Text style={dd.clinicMetaText}>{time}</Text>
        </View>
      </View>

      {/* Action buttons row — call + directions + book */}
      <View style={dd.clinicActions}>
        {dc.clinic?.phone && (
          <TouchableOpacity
            style={[dd.clinicActionBtn, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]}
            onPress={() => Linking.openURL(`tel:${dc.clinic.phone}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={15} color="#10B981" />
            <Text style={[dd.clinicActionText, { color: '#065F46' }]}>Call Clinic</Text>
          </TouchableOpacity>
        )}
        {(dc.clinic?.latitude && dc.clinic?.longitude) ? (
          <TouchableOpacity
            style={[dd.clinicActionBtn, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}
            onPress={() => openMaps(dc.clinic.latitude, dc.clinic.longitude, dc.clinic.name)}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={15} color={SKY6} />
            <Text style={[dd.clinicActionText, { color: SKY7 }]}>Directions</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Book button */}
      <TouchableOpacity
        style={[dd.clinicBookBtn, { backgroundColor: accent, shadowColor: accent }]}
        onPress={onBook}
        activeOpacity={0.88}
      >
        <Ionicons name="calendar" size={15} color={WHITE} />
        <Text style={dd.clinicBookText}>Book at this Clinic</Text>
        <Ionicons name="arrow-forward" size={14} color={WHITE} />
      </TouchableOpacity>
    </View>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <View style={dd.reviewCard}>
      <View style={dd.reviewTop}>
        <View style={dd.reviewAvatar}>
          <Text style={dd.reviewAvatarText}>{review.name.charAt(0)}</Text>
        </View>
        <View style={dd.reviewMeta}>
          <Text style={dd.reviewName}>{review.name}</Text>
          <View style={dd.reviewStarsRow}>
            <Stars rating={review.rating} size={12} />
            <Text style={dd.reviewTime}>{review.time}</Text>
          </View>
        </View>
        <View style={dd.reviewVerified}>
          <Ionicons name="checkmark-circle" size={14} color={TEAL} />
          <Text style={dd.reviewVerifiedText}>Verified</Text>
        </View>
      </View>
      <Text style={dd.reviewText}>{review.text}</Text>
    </View>
  );
}

// ── Main DoctorDetailScreen ───────────────────────────────────────────────────
export default function DoctorDetailScreen({ route, navigation }) {
  const { doctorId } = route.params;
  const insets = useSafeAreaInsets();
  const [doctor,  setDoctor]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [tab,     setTab]     = useState('about'); // 'about' | 'clinics' | 'reviews'

  const scrollY  = useRef(new Animated.Value(0)).current;
  const enterA   = useRef(new Animated.Value(0)).current;
  const heartA   = useRef(new Animated.Value(1)).current;

  const fetchDoctor = () => {
    setLoading(true);
    setError(null);
    getDoctorProfile(doctorId)
      .then((r) => {
        setDoctor(r.data.data.doctor);
        Animated.timing(enterA, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || 'Failed to load doctor profile';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctor(); }, [doctorId]);

  const handleSave = () => {
    setSaved((v) => !v);
    Animated.sequence([
      Animated.timing(heartA, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(heartA, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  if (loading) return (
    <View style={dd.loadWrap}>
      <StatusBar barStyle="light-content" />
      <ActivityIndicator color={SKY5} size="large" />
      <Text style={dd.loadText}>Loading profile...</Text>
    </View>
  );

  if (error || !doctor) return (
    <View style={dd.loadWrap}>
      <View style={dd.errorIconWrap}>
        <Ionicons name={error ? 'wifi-outline' : 'alert-circle-outline'} size={44} color={MUTED} />
      </View>
      <Text style={dd.errorTitle}>{error ? 'Could not load profile' : 'Doctor not found'}</Text>
      <Text style={dd.errorSub}>
        {error || 'This doctor profile is no longer available.'}
      </Text>
      <View style={dd.errorBtnRow}>
        {error && (
          <TouchableOpacity style={dd.retryBtn} onPress={fetchDoctor} activeOpacity={0.88}>
            <Ionicons name="refresh-outline" size={16} color={WHITE} />
            <Text style={dd.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={dd.backBtn2} onPress={() => navigation.goBack()} activeOpacity={0.88}>
          <Ionicons name="arrow-back" size={16} color={SKY5} />
          <Text style={dd.backBtn2Text}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const spec    = doctor.specialization || 'General Physician';
  const cfg     = getSpec(spec);
  const accent  = cfg.color;
  const initial = doctor.user?.name?.charAt(0)?.toUpperCase() || 'D';
  const photoUrl = doctor.profilePhotoUrl || doctor.profileImage || null;
  const displayName = fmtDoctorName(doctor.user?.name);
  const langs   = doctor.languagesKnown?.join(', ') || 'English';
  const qual    = doctor.qualification || 'MBBS';
  const exp     = doctor.experienceYears || 0;
  const fee     = doctor.consultationFee ? `₹${doctor.consultationFee}` : 'Free';
  const avgMins = doctor.avgConsultationMins || 10;
  const firstClinic = doctor.doctorClinics?.[0];

  const handleBook = (dc) => navigation.navigate('Booking', {
    doctorId:       doctor.id,
    clinicId:       dc?.clinic?.id || firstClinic?.clinic?.id,
    doctorName:     doctor.user?.name,
    clinicName:     dc?.clinic?.name || firstClinic?.clinic?.name,
    fee:            dc?.consultationFee || doctor.consultationFee,
    specialization: doctor.specialization,
  });

  return (
    <View style={dd.root}>
      <StatusBar barStyle="light-content" backgroundColor={SKY7} translucent />

      {/* ── Static header ── */}
      <View style={[dd.staticHeader, { paddingTop: insets.top + 6, backgroundColor: accent }]}>
        <TouchableOpacity style={dd.floatBack} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={WHITE} />
        </TouchableOpacity>
        <Text style={dd.floatTitle} numberOfLines={1}>{displayName}</Text>
        <Animated.View style={{ transform: [{ scale: heartA }] }}>
          <TouchableOpacity style={dd.floatHeart} onPress={handleSave} activeOpacity={0.8}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? '#FB7185' : WHITE} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Hero banner ── */}
        <View style={[dd.heroBanner, { backgroundColor: accent }]}>

          {/* No spacer needed — static header is not overlapping */}

          {/* Avatar + name block */}
          <View style={dd.heroContent}>
            {/* Avatar */}
            <View style={dd.avatarRing}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={dd.avatarPhoto} resizeMode="cover" />
              ) : (
                <View style={[dd.avatar, { backgroundColor: cfg.bg }]}>
                  <Text style={[dd.avatarInitial, { color: accent }]}>{initial}</Text>
                </View>
              )}
              <View style={dd.onlineDot} />
            </View>

            {/* Name + spec */}
            <View style={dd.heroText}>
              <View style={dd.heroNameRow}>
                <Text style={dd.heroName}>{displayName}</Text>
                <Ionicons name="checkmark-circle" size={18} color={TEAL} />
              </View>
              <View style={[dd.specBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name={cfg.icon} size={12} color={WHITE} />
                <Text style={dd.specBadgeText}>{spec}</Text>
              </View>
              <Text style={dd.heroQual}>{qual}  ·  {exp} yrs experience</Text>
            </View>
          </View>

          {/* Stats strip */}
          <View style={dd.heroStats}>
            <View style={dd.heroStat}>
              <Text style={dd.heroStatNum}>{exp}+</Text>
              <Text style={dd.heroStatLabel}>Years Exp</Text>
            </View>
            <View style={dd.heroStatSep} />
            <View style={dd.heroStat}>
              <Text style={dd.heroStatNum}>{avgMins}m</Text>
              <Text style={dd.heroStatLabel}>Avg Visit</Text>
            </View>
            <View style={dd.heroStatSep} />
            <View style={dd.heroStat}>
              <Text style={dd.heroStatNum}>{doctor.offlineAvailable && doctor.onlineAvailable ? 'Both' : doctor.onlineAvailable ? 'Online' : 'Clinic'}</Text>
              <Text style={dd.heroStatLabel}>Mode</Text>
            </View>
          </View>
        </View>

        {/* ── Tab bar ── */}
        <View style={dd.tabBar}>
          {[
            { key: 'about',   label: 'About',   icon: 'person-outline'   },
            { key: 'clinics', label: 'Clinics',  icon: 'business-outline' },
            { key: 'reviews', label: 'Reviews',  icon: 'star-outline'     },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[dd.tabBtn, tab === t.key && dd.tabBtnActive]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={t.icon} size={15} color={tab === t.key ? accent : MUTED} />
              <Text style={[dd.tabLabel, tab === t.key && { color: accent, fontWeight: '700' }]}>{t.label}</Text>
              {tab === t.key && <View style={[dd.tabUnderline, { backgroundColor: accent }]} />}
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View style={{ opacity: enterA }}>

          {/* ── ABOUT TAB ── */}
          {tab === 'about' && (
            <View style={dd.tabContent}>

              {/* Consult modes */}
              <View style={dd.modeRow}>
                {doctor.offlineAvailable && (
                  <View style={[dd.modeChip, { borderColor: SKY6, backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="business-outline" size={14} color={SKY6} />
                    <Text style={[dd.modeText, { color: SKY6 }]}>In-Clinic</Text>
                  </View>
                )}
                {doctor.onlineAvailable && (
                  <View style={[dd.modeChip, { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="videocam-outline" size={14} color="#10B981" />
                    <Text style={[dd.modeText, { color: '#10B981' }]}>Online</Text>
                  </View>
                )}
                <View style={[dd.modeChip, { borderColor: accent, backgroundColor: cfg.bg }]}>
                  <Ionicons name="cash-outline" size={14} color={accent} />
                  <Text style={[dd.modeText, { color: accent }]}>{fee}</Text>
                </View>
              </View>

              {/* Bio */}
              {doctor.bio && (
                <Section title="About" icon="information-circle-outline" accent={accent}>
                  <Text style={dd.bioText}>{doctor.bio}</Text>
                </Section>
              )}

              {/* Details */}
              <Section title="Details" icon="document-text-outline" accent={accent}>
                <InfoRow icon="school-outline"          label="Qualification"  value={qual}                    accent={accent} />
                <InfoRow icon="briefcase-outline"       label="Experience"     value={`${exp} years`}          accent={accent} />
                <InfoRow icon="medical-outline"         label="Specialization" value={spec}                    accent={accent} />
                <InfoRow icon="chatbubble-ellipses-outline" label="Languages"  value={langs}                   accent={accent} />
                <InfoRow icon="time-outline"            label="Avg. Consult"   value={`${avgMins} minutes`}    accent={accent} />
                {doctor.medicalRegistrationNumber && (
                  <InfoRow icon="card-outline"          label="Reg. Number"    value={doctor.medicalRegistrationNumber} accent={accent} />
                )}
              </Section>

              {/* Education */}
              {doctor.education && (
                <Section title="Education" icon="school-outline" accent={accent}>
                  <Text style={dd.bioText}>{doctor.education}</Text>
                </Section>
              )}

              {/* Languages */}
              <Section title="Languages Spoken" icon="chatbubble-ellipses-outline" accent={accent}>
                <View style={dd.langRow}>
                  {(doctor.languagesKnown?.length ? doctor.languagesKnown : ['English']).map((l) => (
                    <View key={l} style={[dd.langChip, { backgroundColor: cfg.bg, borderColor: accent + '40' }]}>
                      <Text style={[dd.langText, { color: accent }]}>{l}</Text>
                    </View>
                  ))}
                </View>
              </Section>

            </View>
          )}

          {/* ── CLINICS TAB ── */}
          {tab === 'clinics' && (
            <View style={dd.tabContent}>
              {doctor.doctorClinics?.length > 0 ? (
                doctor.doctorClinics.map((dc) => (
                  <ClinicCard
                    key={dc.id}
                    dc={dc}
                    accent={accent}
                    onBook={() => handleBook(dc)}
                  />
                ))
              ) : (
                <View style={dd.emptyTab}>
                  <Ionicons name="business-outline" size={40} color={MUTED} />
                  <Text style={dd.emptyTabText}>No clinic information available</Text>
                </View>
              )}
            </View>
          )}

          {/* ── REVIEWS TAB ── */}
          {tab === 'reviews' && (
            <View style={dd.tabContent}>
              <View style={dd.emptyTab}>
                <Ionicons name="star-outline" size={48} color={MUTED} />
                <Text style={[dd.emptyTabText, { fontWeight: '700', fontSize: 16, color: SLATE, marginTop: 12 }]}>No reviews yet</Text>
                <Text style={[dd.emptyTabText, { marginTop: 6, textAlign: 'center' }]}>
                  Patient reviews will appear here after appointments are completed.
                </Text>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View style={[dd.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={dd.stickyLeft}>
          <Text style={dd.stickyFeeLabel}>Consultation Fee</Text>
          <Text style={[dd.stickyFee, { color: accent }]}>{fee}</Text>
        </View>
        <TouchableOpacity
          style={[dd.stickyBtn, { backgroundColor: accent, shadowColor: accent }]}
          onPress={() => handleBook(firstClinic)}
          activeOpacity={0.88}
        >
          <Ionicons name="calendar" size={18} color={WHITE} />
          <Text style={dd.stickyBtnText}>Book Appointment</Text>
          <Ionicons name="arrow-forward" size={16} color={WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const dd = StyleSheet.create({

  root:    { flex: 1, backgroundColor: BG },

  // Loading / error
  loadWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: BG, padding: 32 },
  loadText:     { fontSize: 15, color: MUTED, fontWeight: '600' },
  errorIconWrap:{ width: 88, height: 88, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  errorTitle:   { fontSize: 18, fontWeight: '800', color: SLATE, textAlign: 'center' },
  errorSub:     { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  errorBtnRow:  { flexDirection: 'row', gap: 12, marginTop: 8 },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: SKY5, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13, shadowColor: SKY5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  retryText:    { fontSize: 14, fontWeight: '700', color: WHITE },
  backBtn2:     { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13, borderWidth: 1.5, borderColor: SKY5, backgroundColor: WHITE },
  backBtn2Text: { fontSize: 14, fontWeight: '700', color: SKY5 },

  // Static header
  staticHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  // Floating header (kept for reference but no longer used as animated overlay)
  floatingHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, gap: 12,
  },
  floatBack:  { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  floatTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  floatHeart: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Hero banner
  heroBanner: { paddingBottom: 0, overflow: 'hidden' },
  blobTL:     { position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  blobBR:     { position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
  dotGrid:    { position: 'absolute', top: 60, right: 16, width: 80, flexDirection: 'row', flexWrap: 'wrap', gap: 10, opacity: 0.2 },
  dot:        { width: 3, height: 3, borderRadius: 2, backgroundColor: WHITE },

  heroContent: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  avatarRing:  { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatar:      { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center' },
  avatarPhoto: { width: 82, height: 82, borderRadius: 41 },
  avatarInitial: { fontSize: 34, fontWeight: '800' },
  onlineDot:   { position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2.5, borderColor: WHITE },

  heroText:    { flex: 1, paddingBottom: 4 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heroName:    { fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.4, flex: 1 },
  specBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, marginBottom: 6 },
  specBadgeText: { fontSize: 12, fontWeight: '700', color: WHITE },
  heroQual:    { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  heroStats:   { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', paddingVertical: 14, paddingHorizontal: 8 },
  heroStat:    { flex: 1, alignItems: 'center', gap: 3 },
  heroStatNum: { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroStatSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tabBtn:      { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4, position: 'relative' },
  tabBtnActive:{ backgroundColor: '#FAFBFF' },
  tabLabel:    { fontSize: 12, fontWeight: '600', color: MUTED },
  tabUnderline:{ position: 'absolute', bottom: 0, left: 16, right: 16, height: 2.5, borderRadius: 2 },

  // Tab content
  tabContent: { padding: 18, gap: 16 },

  // Consult modes
  modeRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  modeText: { fontSize: 12, fontWeight: '700' },

  // Section
  section:       { backgroundColor: WHITE, borderRadius: 18, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: SLATE, letterSpacing: -0.2 },

  // Info row
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  infoIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoContent:  { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:    { fontSize: 12, color: MUTED, fontWeight: '500' },
  infoValue:    { fontSize: 13, fontWeight: '700', color: SLATE, flex: 1, textAlign: 'right' },

  // Bio
  bioText: { fontSize: 13, color: '#475569', lineHeight: 21 },

  // Languages
  langRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  langText: { fontSize: 12, fontWeight: '700' },

  // Clinic card
  clinicCard: {
    backgroundColor: WHITE, borderRadius: 18, padding: 16,
    borderLeftWidth: 4, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  clinicTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  clinicIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  clinicInfo:     { flex: 1 },
  clinicName:     { fontSize: 15, fontWeight: '800', color: SLATE, marginBottom: 4 },
  clinicLocRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clinicLoc:      { fontSize: 12, color: MUTED, flex: 1 },
  clinicFeeBadge: { alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  clinicFeeText:  { fontSize: 16, fontWeight: '800' },
  clinicFeeLabel: { fontSize: 9, color: MUTED, fontWeight: '600' },
  clinicMeta:     { gap: 6 },
  clinicMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  clinicMetaText: { fontSize: 12, color: '#475569' },
  clinicBookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 13,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  clinicBookText: { fontSize: 14, fontWeight: '800', color: WHITE, flex: 1, textAlign: 'center' },
  clinicActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  clinicActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 10, paddingVertical: 10, borderWidth: 1,
  },
  clinicActionText: { fontSize: 12, fontWeight: '700' },

  // Reviews
  ratingCard: {
    backgroundColor: WHITE, borderRadius: 18, padding: 18,
    flexDirection: 'row', gap: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ratingLeft:    { alignItems: 'center', gap: 6 },
  ratingBig:     { fontSize: 44, fontWeight: '900', letterSpacing: -2 },
  ratingCount:   { fontSize: 11, color: MUTED, textAlign: 'center' },
  ratingBars:    { flex: 1, gap: 5 },
  ratingBarRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingBarLabel:{ fontSize: 11, color: MUTED, width: 10, textAlign: 'right' },
  ratingBarTrack:{ flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: '100%', borderRadius: 3 },
  ratingBarPct:  { fontSize: 10, color: MUTED, width: 28, textAlign: 'right' },

  reviewCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  reviewTop:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar:       { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText:   { fontSize: 16, fontWeight: '800', color: SKY6 },
  reviewMeta:         { flex: 1, gap: 3 },
  reviewName:         { fontSize: 13, fontWeight: '700', color: SLATE },
  reviewStarsRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewTime:         { fontSize: 11, color: MUTED },
  reviewVerified:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewVerifiedText: { fontSize: 10, fontWeight: '700', color: TEAL },
  reviewText:         { fontSize: 13, color: '#475569', lineHeight: 19 },

  // Empty tab
  emptyTab:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTabText: { fontSize: 14, color: MUTED },

  // Sticky bottom bar
  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE, paddingHorizontal: 20, paddingTop: 14,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
  },
  stickyLeft:     { gap: 2 },
  stickyFeeLabel: { fontSize: 11, color: MUTED, fontWeight: '500' },
  stickyFee:      { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  stickyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  stickyBtnText: { fontSize: 15, fontWeight: '800', color: WHITE, letterSpacing: 0.1 },
});
