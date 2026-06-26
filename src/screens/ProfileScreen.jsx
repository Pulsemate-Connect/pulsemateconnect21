// ─────────────────────────────────────────────────────────────────────────────
//  ProfileScreen — PulseMate Connect  |  Modern Healthcare Profile UI
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Dimensions, StatusBar,
  Modal, TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPatientProfile, getMyAppointments, updatePatientProfile, deleteAccount } from '../api/patient';
import { logout } from '../api/auth';
import { useAuth } from '../store/authStore';

const { width: W } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG       = '#F4F8FF';
const WHITE    = '#FFFFFF';
const BLUE     = '#2563EB';
const BLUE_D   = '#1D4ED8';
const BLUE_L   = '#EFF6FF';
const BLUE_B   = '#BFDBFE';
const GREEN    = '#16A34A';
const GREEN_L  = '#DCFCE7';
const GREEN_B  = '#BBF7D0';
const AMBER    = '#D97706';
const AMBER_L  = '#FEF3C7';
const RED      = '#DC2626';
const RED_L    = '#FEE2E2';
const PURPLE   = '#7C3AED';
const PURPLE_L = '#EDE9FE';
const TEAL     = '#0891B2';
const TEAL_L   = '#CFFAFE';
const DARK     = '#0F172A';
const SLATE    = '#334155';
const GRAY     = '#64748B';
const MUTED    = '#94A3B8';
const BORDER   = '#E2E8F0';

const BLOOD_GROUPS   = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Male',   emoji: '👨' },
  { value: 'FEMALE', label: 'Female', emoji: '👩' },
  { value: 'OTHER',  label: 'Other',  emoji: '🧑' },
];
const POPULAR_CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];

const STATUS_META = {
  BOOKED:          { label: 'Confirmed',  color: BLUE,   bg: BLUE_L   },
  CHECKED_IN:      { label: 'Checked In', color: GREEN,  bg: GREEN_L  },
  IN_QUEUE:        { label: 'In Queue',   color: AMBER,  bg: AMBER_L  },
  IN_CONSULTATION: { label: 'Consulting', color: PURPLE, bg: PURPLE_L },
  CALLED:          { label: 'Called',     color: GREEN,  bg: GREEN_L  },
  COMPLETED:       { label: 'Completed',  color: GREEN,  bg: GREEN_L  },
  CANCELLED:       { label: 'Cancelled',  color: RED,    bg: RED_L    },
  NO_SHOW:         { label: 'No Show',    color: GRAY,   bg: '#F1F5F9'},
  PENDING_PAYMENT: { label: 'Pending',    color: AMBER,  bg: AMBER_L  },
};

const stripCC = (v = '') =>
  String(v).replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(0, 10);

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};
const fmtDob = (raw = '') => {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
};

// ── Edit Sheet ────────────────────────────────────────────────────────────────
function EditSheet({ visible, profile, onClose, onSaved }) {
  const insets = useSafeAreaInsets();
  const slideA = useRef(new Animated.Value(800)).current;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', gender: '', dob: '', city: '',
    emergencyContact: '', bloodGroup: '',
    allergies: '', existingDiseases: '', insuranceProvider: '',
  });

  useEffect(() => {
    if (visible) {
      const pp = profile?.patientProfile;
      setForm({
        name:             profile?.name || '',
        gender:           pp?.gender || '',
        dob:              pp?.dob ? pp.dob.split('T')[0] : '',
        city:             pp?.city || '',
        emergencyContact: stripCC(pp?.emergencyContact || ''),
        bloodGroup:       pp?.bloodGroup || '',
        allergies:        pp?.allergies || '',
        existingDiseases: pp?.existingDiseases || '',
        insuranceProvider:pp?.insuranceProvider || '',
      });
      Animated.spring(slideA, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideA, { toValue: 800, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      Alert.alert('Name required', 'Please enter your full name.'); return;
    }
    if (form.dob && !/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD'); return;
    }
    if (form.emergencyContact && form.emergencyContact.length !== 10) {
      Alert.alert('Invalid contact', 'Enter a 10-digit number'); return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await updatePatientProfile({
        name:             form.name.trim(),
        gender:           form.gender || undefined,
        dob:              form.dob || undefined,
        city:             form.city.trim() || undefined,
        emergencyContact: form.emergencyContact.length === 10 ? `+91${form.emergencyContact}` : undefined,
        bloodGroup:       form.bloodGroup || undefined,
        allergies:        form.allergies || undefined,
        existingDiseases: form.existingDiseases || undefined,
        insuranceProvider:form.insuranceProvider || undefined,
      });
      onSaved(res.data.data?.user);
      onClose();
      Alert.alert('✓ Saved', 'Profile updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  // Safe bottom: respect home indicator / gesture bar, minimum 16px
  const safeBottom = Math.max(insets.bottom, 16);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Dim backdrop — tap outside to close */}
      <TouchableOpacity style={es.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[es.sheet, { transform: [{ translateY: slideA }] }]}>
        {/* Drag handle */}
        <View style={es.handle} />

        {/* Header */}
        <View style={es.header}>
          <View style={es.headerLeft}>
            <View style={es.headerIcon}>
              <Ionicons name="create-outline" size={18} color={BLUE} />
            </View>
            <Text style={es.headerTitle}>Edit Profile</Text>
          </View>
          <TouchableOpacity style={es.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={DARK} />
          </TouchableOpacity>
        </View>

        {/*
          KeyboardAvoidingView:
          - iOS: 'padding' mode shifts the whole sheet up above the keyboard.
          - Android: 'height' mode shrinks the available area so ScrollView
            stays scrollable and the sticky button rides above the keyboard.
          flex:1 is critical — lets the inner ScrollView + footer fill the
          remaining sheet height without overflowing.
        */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/*
            ScrollView must be flex:1 so it fills available space and
            does NOT push the sticky footer off-screen.
            contentContainerStyle paddingBottom gives clearance so the last
            field is never hidden under the sticky save footer.
          */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={es.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Name */}
            <Text style={es.label}>Full Name <Text style={es.req}>*</Text></Text>
            <View style={es.inputRow}>
              <Ionicons name="person-outline" size={16} color={MUTED} />
              <TextInput style={es.input} value={form.name} onChangeText={v => set('name', v)}
                placeholder="e.g. Rahul Sharma" placeholderTextColor={MUTED} autoCapitalize="words" />
            </View>

            {/* Gender */}
            <Text style={es.label}>Gender</Text>
            <View style={es.chipRow}>
              {GENDER_OPTIONS.map(g => (
                <TouchableOpacity key={g.value}
                  style={[es.chip, form.gender === g.value && es.chipActive]}
                  onPress={() => set('gender', form.gender === g.value ? '' : g.value)}>
                  <Text style={es.chipEmoji}>{g.emoji}</Text>
                  <Text style={[es.chipText, form.gender === g.value && es.chipTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DOB */}
            <Text style={es.label}>Date of Birth</Text>
            <View style={es.inputRow}>
              <Ionicons name="calendar-outline" size={16} color={MUTED} />
              <TextInput style={es.input} value={form.dob}
                onChangeText={v => set('dob', fmtDob(v))}
                placeholder="YYYY-MM-DD" placeholderTextColor={MUTED}
                keyboardType="numeric" maxLength={10} />
            </View>

            {/* City */}
            <Text style={es.label}>City</Text>
            <View style={es.inputRow}>
              <Ionicons name="location-outline" size={16} color={MUTED} />
              <TextInput style={es.input} value={form.city} onChangeText={v => set('city', v)}
                placeholder="e.g. Bengaluru" placeholderTextColor={MUTED} autoCapitalize="words" />
            </View>
            <View style={es.cityChips}>
              {POPULAR_CITIES.map(c => (
                <TouchableOpacity key={c} style={[es.cityChip, form.city === c && es.cityChipActive]}
                  onPress={() => set('city', c)}>
                  <Text style={[es.cityChipText, form.city === c && { color: WHITE, fontWeight: '700' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Emergency contact */}
            <Text style={es.label}>Emergency Contact</Text>
            <View style={es.inputRow}>
              <Text style={es.dialCode}>🇮🇳 +91</Text>
              <TextInput style={es.input} value={form.emergencyContact}
                onChangeText={v => set('emergencyContact', v.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210" placeholderTextColor={MUTED}
                keyboardType="phone-pad" maxLength={10} />
            </View>

            {/* Blood group */}
            <Text style={es.label}>Blood Group</Text>
            <View style={es.chipRow}>
              {BLOOD_GROUPS.map(bg => (
                <TouchableOpacity key={bg}
                  style={[es.bloodChip, form.bloodGroup === bg && es.bloodChipActive]}
                  onPress={() => set('bloodGroup', form.bloodGroup === bg ? '' : bg)}>
                  <Text style={[es.bloodChipText, form.bloodGroup === bg && { color: RED, fontWeight: '800' }]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Allergies */}
            <Text style={es.label}>Known Allergies <Text style={es.opt}>(optional)</Text></Text>
            <TextInput style={es.textArea} value={form.allergies} onChangeText={v => set('allergies', v)}
              placeholder="e.g. Penicillin, Dust..." placeholderTextColor={MUTED}
              multiline numberOfLines={2} textAlignVertical="top" />

            {/* Conditions */}
            <Text style={es.label}>Existing Conditions <Text style={es.opt}>(optional)</Text></Text>
            <TextInput style={es.textArea} value={form.existingDiseases} onChangeText={v => set('existingDiseases', v)}
              placeholder="e.g. Diabetes, Hypertension..." placeholderTextColor={MUTED}
              multiline numberOfLines={2} textAlignVertical="top" />

            {/* Bottom spacer — ensures last field scrolls fully clear of sticky footer */}
            <View style={{ height: 16 }} />
          </ScrollView>

          {/*
            Sticky Save Footer — lives OUTSIDE the ScrollView but INSIDE KAV.
            This means:
            1. It stays pinned at the bottom of the visible sheet area.
            2. When the keyboard opens, KAV shrinks the container so the footer
               rides up just above the keyboard automatically.
            3. It never overlaps the bottom nav bar because we add safeBottom.
          */}
          <View style={[es.saveFooter, { paddingBottom: safeBottom + 8 }]}>
            <TouchableOpacity
              style={[es.saveBtn, saving && es.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving
                ? <ActivityIndicator color={WHITE} size="small" />
                : <>
                    <Ionicons name="checkmark-circle" size={20} color={WHITE} />
                    <Text style={es.saveBtnText}>Save Changes</Text>
                  </>
              }
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const es = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  // Sheet takes 92% height — enough room for all fields on any phone
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    height: '92%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 24,
    // flex column so KAV children stack correctly
    flexDirection: 'column',
  },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:     { width: 34, height: 34, borderRadius: 10, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: '800', color: DARK },
  closeBtn:       { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  // ScrollView content — 20px section gap, 16px label-to-input gap
  // paddingBottom gives clearance so last field scrolls above sticky footer
  body: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },

  label:          { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 8, marginTop: 20 },
  req:            { color: RED },
  opt:            { fontSize: 11, fontWeight: '400', color: MUTED },
  inputRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#F8FAFC' },
  input:          { flex: 1, fontSize: 14, color: DARK, paddingVertical: 0 },
  dialCode:       { fontSize: 14, fontWeight: '600', color: DARK, marginRight: 4 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC' },
  chipActive:     { borderColor: BLUE, backgroundColor: BLUE_L },
  chipEmoji:      { fontSize: 16 },
  chipText:       { fontSize: 13, fontWeight: '600', color: DARK },
  chipTextActive: { color: BLUE, fontWeight: '700' },
  cityChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  cityChip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC' },
  cityChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  cityChipText:   { fontSize: 12, fontWeight: '600', color: DARK },
  bloodChip:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC' },
  bloodChipActive:{ backgroundColor: RED_L, borderColor: '#FCA5A5' },
  bloodChipText:  { fontSize: 13, fontWeight: '600', color: DARK },
  textArea:       { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: DARK, backgroundColor: '#F8FAFC', minHeight: 72, textAlignVertical: 'top' },

  // Sticky footer — sits outside ScrollView, inside KAV
  // paddingBottom is set dynamically: safeBottom + 8 so it clears the
  // home indicator on gesture-nav phones and the bottom nav bar.
  saveFooter: {
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: WHITE,
  },

  // Full-width, 56px tall, 16px radius as specified
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BLUE,
    borderRadius: 16,
    height: 56,
    width: '100%',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 7,
  },
  saveBtnDisabled: { opacity: 0.55, shadowOpacity: 0 },
  saveBtnText:    { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.2 },
});

// ── Profile Screen ────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation, route }) {
  const { user, signOut, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile,      setProfile]      = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editSheet,    setEditSheet]    = useState(false);

  const load = useCallback(async () => {
    try {
      const [profRes, apptRes] = await Promise.all([
        getPatientProfile(),
        getMyAppointments({ limit: 10 }).catch(() => null),
      ]);
      setProfile(profRes.data.data.user);
      if (apptRes) {
        const list = apptRes.data.data || [];
        setAppointments(Array.isArray(list) ? list : []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  // Auto-open edit sheet when navigated from "Complete Profile" button
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route?.params?.openEdit) {
        setEditSheet(true);
        // Clear the param so it doesn't re-open on next focus
        navigation.setParams({ openEdit: false });
      }
    });
    return unsubscribe;
  }, [navigation, route?.params?.openEdit]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          try { await logout(); } catch {}
          signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all personal data. Your appointment history will be anonymized. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" to confirm. This action is irreversible.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      await logout().catch(() => {});
                      signOut();
                    } catch (err) {
                      Alert.alert('Error', err.response?.data?.message || 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleProfileSaved = (updatedUser) => {
    if (updatedUser) {
      setProfile(updatedUser);
      updateUser({ name: updatedUser.name });
    }
    getPatientProfile().then(r => setProfile(r.data.data.user)).catch(() => {});
  };

  const displayName = profile?.name || user?.name || 'You';
  const initials    = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const p           = profile?.patientProfile;
  const mobile      = profile?.mobile ? String(profile.mobile).replace('+91', '').trim() : '';

  const isVerified = profile?.isPhoneVerified || profile?.isEmailVerified;

  const total     = appointments.length;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  const upcoming  = appointments.filter(a => ['BOOKED','CHECKED_IN','IN_QUEUE','CALLED'].includes(a.status)).length;
  const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;

  const recent = appointments.slice(0, 3);

  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={BLUE} size="large" />
        <Text style={{ color: MUTED, marginTop: 12, fontSize: 13 }}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
      >

        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={s.headerTitle}>My Profile</Text>
            <Text style={s.headerSub}>Manage your account</Text>
          </View>
        </View>

        {/* ── Profile Card ── */}
        <View style={s.profileCard}>
          {/* Top row: avatar + info */}
          <View style={s.profileRow}>
            {/* Avatar with green tick */}
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              {isVerified && (
                <View style={s.verifiedTick}>
                  <Ionicons name="checkmark" size={10} color={WHITE} />
                </View>
              )}
            </View>

            {/* Name + phone + city */}
            <View style={s.profileInfo}>
              <Text style={s.profileName} numberOfLines={1}>{displayName}</Text>
              {mobile ? (
                <View style={s.profileMetaRow}>
                  <Ionicons name="call-outline" size={14} color={GRAY} />
                  <Text style={s.profileMobile}>+91 {mobile}</Text>
                </View>
              ) : null}
              {p?.city ? (
                <View style={s.profileMetaRow}>
                  <Ionicons name="location-outline" size={14} color={GRAY} />
                  <Text style={s.profileCity} numberOfLines={1}>
                    {[p.city, p.state].filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Divider */}
          <View style={s.profileDivider} />

          {/* Bottom row: verified + edit */}
          <View style={s.profileFooter}>
            {isVerified ? (
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={GREEN} />
                <Text style={s.verifiedText}>Verified Account</Text>
              </View>
            ) : (
              <View style={[s.verifiedBadge, { backgroundColor: AMBER_L }]}>
                <Ionicons name="shield-outline" size={14} color={AMBER} />
                <Text style={[s.verifiedText, { color: AMBER }]}>Verification Pending</Text>
              </View>
            )}
            <TouchableOpacity style={s.editBtn} onPress={() => setEditSheet(true)} activeOpacity={0.88}>
              <Ionicons name="create-outline" size={15} color={BLUE} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick Actions 2×2 ── */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {[
            {
              icon: 'calendar',
              iconColor: BLUE,
              bg: BLUE_L,
              label: 'My Appointments',
              desc: 'View & manage bookings',
              onPress: () => navigation.navigate('AppointmentsTab'),
            },
            {
              icon: 'search',
              iconColor: TEAL,
              bg: TEAL_L,
              label: 'Find Doctors',
              desc: 'Search & book near you',
              onPress: () => navigation.navigate('DoctorsTab'),
            },
            {
              icon: 'time',
              iconColor: PURPLE,
              bg: PURPLE_L,
              label: 'Live Queue',
              desc: 'Track your turn live',
              onPress: () => navigation.navigate('AppointmentsTab'),
            },
            {
              icon: 'person',
              iconColor: AMBER,
              bg: AMBER_L,
              label: 'Edit Profile',
              desc: 'Update your details',
              onPress: () => setEditSheet(true),
            },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={s.actionCard} onPress={item.onPress} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <View style={s.actionText}>
                <Text style={s.actionLabel}>{item.label}</Text>
                <Text style={s.actionDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={MUTED} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Appointment Summary ── */}
        <Text style={s.sectionTitle}>Appointment Summary</Text>
        <View style={s.statsRow}>
          {[
            { label: 'Total',     num: total,     icon: 'calendar-outline',        color: BLUE,   bg: BLUE_L   },
            { label: 'Completed', num: completed, icon: 'checkmark-circle-outline', color: GREEN,  bg: GREEN_L  },
            { label: 'Upcoming',  num: upcoming,  icon: 'time-outline',             color: AMBER,  bg: AMBER_L  },
            { label: 'Cancelled', num: cancelled, icon: 'close-circle-outline',     color: RED,    bg: RED_L    },
          ].map((st) => (
            <View key={st.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: st.bg }]}>
                <Ionicons name={st.icon} size={16} color={st.color} />
              </View>
              <Text style={[s.statNum, { color: st.color }]}>{st.num}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Recent Appointments ── */}
        <View style={s.recentHeader}>
          <Text style={s.sectionTitle}>Recent Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentsTab')} style={s.viewAllBtn}>
            <Text style={s.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={13} color={BLUE} />
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={32} color={MUTED} />
            </View>
            <Text style={s.emptyTitle}>No appointments yet</Text>
            <Text style={s.emptySub}>Your past and upcoming appointments will appear here.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('DoctorsTab')} activeOpacity={0.88}>
              <Text style={s.emptyBtnText}>Find a Doctor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.recentCard}>
            {recent.map((appt, idx) => {
              const docName = appt.doctor?.user?.name || 'Doctor';
              const spec    = appt.doctor?.specialization || '';
              const clinic  = appt.clinic?.name || '';
              const meta    = STATUS_META[appt.status] || STATUS_META.BOOKED;
              const initial = docName.charAt(0).toUpperCase();
              return (
                <TouchableOpacity
                  key={appt.id}
                  style={[s.apptRow, idx < recent.length - 1 && s.apptBorder]}
                  onPress={() => navigation.navigate('AppointmentsTab', { screen: 'AppointmentDetail', params: { id: appt.id } })}
                  activeOpacity={0.85}
                >
                  {/* Doctor avatar */}
                  <View style={s.docAvatar}>
                    <Text style={s.docAvatarText}>{initial}</Text>
                  </View>

                  {/* Info */}
                  <View style={s.apptInfo}>
                    <Text style={s.docName} numberOfLines={1}>Dr. {docName}</Text>
                    {spec ? <Text style={s.docSpec} numberOfLines={1}>{spec}</Text> : null}
                    {clinic ? (
                      <View style={s.clinicRow}>
                        <Ionicons name="business-outline" size={11} color={MUTED} />
                        <Text style={s.clinicName} numberOfLines={1}>{clinic}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Right side */}
                  <View style={s.apptRight}>
                    <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={s.apptDate}>{fmtDate(appt.appointmentDate)}</Text>
                    {appt.slotTime ? (
                      <View style={s.timeRow}>
                        <Ionicons name="time-outline" size={10} color={MUTED} />
                        <Text style={s.apptTime}>{fmtTime(appt.slotTime)}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Logout ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <View style={s.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={18} color={RED} />
          </View>
          <Text style={s.logoutText}>Logout</Text>
          <Ionicons name="chevron-forward" size={15} color={RED} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* ── Delete Account (Google Play required) ── */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <View style={s.deleteIconWrap}>
            <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
          </View>
          <Text style={s.deleteText}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={13} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <Text style={s.deleteHint}>Permanently deletes your account and all personal data.</Text>

      </ScrollView>

      {/* ── Edit Sheet ── */}
      <EditSheet
        visible={editSheet}
        profile={profile}
        onClose={() => setEditSheet(false)}
        onSaved={handleProfileSaved}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 18 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: DARK, letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: GRAY, marginTop: 2 },

  // Profile card — horizontal layout matching design
  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EFF7',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  // Top row: avatar left, info right
  profileRow:     { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarWrap:     { position: 'relative' },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 28, fontWeight: '900', color: WHITE },
  verifiedTick:   { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: GREEN, borderWidth: 2.5, borderColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  // Info column
  profileInfo:    { flex: 1, gap: 5 },
  profileName:    { fontSize: 18, fontWeight: '800', color: DARK, letterSpacing: -0.3 },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileMobile:  { fontSize: 14, color: GRAY },
  profileCity:    { fontSize: 14, color: GRAY, flex: 1 },
  // Divider
  profileDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 14 },
  // Footer row: verified badge left, edit button right
  profileFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  verifiedText:   { fontSize: 13, fontWeight: '700', color: GREEN },
  editBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: BLUE, backgroundColor: WHITE },
  editBtnText:    { fontSize: 13, fontWeight: '700', color: BLUE },
  // Kept for compatibility (no longer used in card but referenced elsewhere)
  metaPills:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill:       { backgroundColor: BLUE_L, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  metaPillText:   { fontSize: 12, fontWeight: '600', color: SLATE },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '800', color: DARK, marginBottom: 12, letterSpacing: -0.2 },

  // Quick actions
  actionsGrid: { gap: 10, marginBottom: 22 },
  actionCard:  {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: WHITE,
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  actionIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText:  { flex: 1 },
  actionLabel: { fontSize: 14, fontWeight: '800', color: DARK, marginBottom: 2 },
  actionDesc:  { fontSize: 12, color: GRAY },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: WHITE, borderRadius: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statIcon:  { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statNum:   { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  statLabel: { fontSize: 10, color: GRAY, fontWeight: '600', textAlign: 'center' },

  // Recent header
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  viewAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText:  { fontSize: 13, fontWeight: '700', color: BLUE },

  // Empty state
  emptyCard:    { backgroundColor: WHITE, borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 22, borderWidth: 1, borderColor: BORDER },
  emptyIconWrap:{ width: 64, height: 64, borderRadius: 20, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle:   { fontSize: 15, fontWeight: '800', color: DARK, marginBottom: 6 },
  emptySub:     { fontSize: 12, color: GRAY, textAlign: 'center', lineHeight: 18, marginBottom: 16, maxWidth: 240 },
  emptyBtn:     { backgroundColor: BLUE, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: WHITE },

  // Recent appointments
  recentCard: {
    backgroundColor: WHITE, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER,
    marginBottom: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  apptRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  apptBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  docAvatar:  { width: 46, height: 46, borderRadius: 14, backgroundColor: BLUE_L, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docAvatarText: { fontSize: 18, fontWeight: '800', color: BLUE },
  apptInfo:   { flex: 1 },
  docName:    { fontSize: 14, fontWeight: '800', color: DARK, marginBottom: 2 },
  docSpec:    { fontSize: 12, color: GRAY, marginBottom: 3 },
  clinicRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clinicName: { fontSize: 11, color: MUTED },
  apptRight:  { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  statusBadge:{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  apptDate:   { fontSize: 11, color: GRAY, fontWeight: '500' },
  timeRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  apptTime:   { fontSize: 10, color: MUTED },

  // Logout
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8, shadowColor: RED, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  logoutIconWrap:{ width: 38, height: 38, borderRadius: 12, backgroundColor: RED_L, alignItems: 'center', justifyContent: 'center' },
  logoutText:    { fontSize: 15, fontWeight: '700', color: RED },
  deleteBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 4, elevation: 0 },
  deleteIconWrap:{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  deleteText:    { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  deleteHint:    { fontSize: 11, color: '#D1D5DB', textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 },
});
