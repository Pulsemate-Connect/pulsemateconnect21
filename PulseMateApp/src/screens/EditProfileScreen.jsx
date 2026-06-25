// ─────────────────────────────────────────────────────────────────────────────
//  EditProfileScreen — PulseMate Connect
//  Fixed: full validation, native date picker, city search, inline errors,
//         double-submit guard, fresh fetch on mount, emergency contact check.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, FlatList, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { updatePatientProfile, getPatientProfile } from '../api/patient';
import { useAuth } from '../store/authStore';
import {
  BLOOD_GROUPS, GENDER_OPTIONS, POPULAR_CITIES,
  capitaliseName, calcAge,
  validateName, validateGender, validateDob,
  validateCity, validateEmergencyContact, normalisePhone,
} from '../utils/profileValidation';

const PRIMARY = '#2563EB';
const GREEN   = '#16A34A';
const RED     = '#EF4444';
const BORDER  = '#E2E8F0';
const MUTED   = '#94A3B8';
const SLATE   = '#0F172A';
const BG      = '#F8FAFC';
const WHITE   = '#FFFFFF';

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginTop:4, marginBottom:4 }}>
      <Ionicons name="alert-circle-outline" size={13} color={RED} />
      <Text style={{ fontSize:12, color:RED, flex:1 }}>{msg}</Text>
    </View>
  );
}

export default function EditProfileScreen({ route, navigation }) {
  const { profile: routeProfile } = route.params || {};
  const { user, updateUser } = useAuth();
  const userPhone = user?.mobile || '';

  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [cityQuery, setCityQuery]   = useState('');
  const [showCityDrop, setShowCityDrop] = useState(false);

  const [form, setForm] = useState({
    name:             routeProfile?.name || '',
    gender:           routeProfile?.patientProfile?.gender || '',
    dob:              routeProfile?.patientProfile?.dob ? routeProfile.patientProfile.dob.split('T')[0] : '',
    city:             routeProfile?.patientProfile?.city || '',
    emergencyContact: routeProfile?.patientProfile?.emergencyContact
                        ? normalisePhone(routeProfile.patientProfile.emergencyContact) : '',
    bloodGroup:       routeProfile?.patientProfile?.bloodGroup || '',
    allergies:        routeProfile?.patientProfile?.allergies || '',
    existingDiseases: routeProfile?.patientProfile?.existingDiseases || '',
    insuranceProvider:routeProfile?.patientProfile?.insuranceProvider || '',
  });

  // Always fetch fresh data on mount to ensure we have the latest values
  useEffect(() => {
    getPatientProfile().then((res) => {
      const u  = res.data.data.user;
      const pp = u?.patientProfile;
      setForm({
        name:             u?.name || '',
        gender:           pp?.gender || '',
        dob:              pp?.dob ? pp.dob.split('T')[0] : '',
        city:             pp?.city || '',
        emergencyContact: pp?.emergencyContact ? normalisePhone(pp.emergencyContact) : '',
        bloodGroup:       pp?.bloodGroup || '',
        allergies:        pp?.allergies || '',
        existingDiseases: pp?.existingDiseases || '',
        insuranceProvider:pp?.insuranceProvider || '',
      });
      setCityQuery(pp?.city || '');
    }).catch(() => {});
  }, []);

  // Sync city query when form.city changes
  useEffect(() => { setCityQuery(form.city); }, [form.city]);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const validateAll = () => {
    const e = {
      name:             validateName(form.name),
      gender:           validateGender(form.gender),
      dob:              validateDob(form.dob),
      city:             validateCity(form.city),
      emergencyContact: validateEmergencyContact(form.emergencyContact, userPhone),
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validateAll()) {
      Alert.alert('Please fix the errors', 'Some fields have invalid values. Check the form and try again.');
      return;
    }
    setSaving(true);
    try {
      const res = await updatePatientProfile({
        name:              form.name.trim(),
        gender:            form.gender            || undefined,
        dob:               form.dob               || undefined,
        city:              form.city.trim()        || undefined,
        emergencyContact:  form.emergencyContact.length === 10
                             ? `+91${form.emergencyContact}` : undefined,
        bloodGroup:        form.bloodGroup,
        allergies:         form.allergies,
        existingDiseases:  form.existingDiseases,
        insuranceProvider: form.insuranceProvider,
      });
      updateUser({ name: res.data.data.user.name });
      Alert.alert('Saved ✓', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save. Please try again.';
      Alert.alert('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const age = calcAge(form.dob);
  const filteredCities = cityQuery.trim().length >= 1
    ? POPULAR_CITIES.filter((c) => c.toLowerCase().includes(cityQuery.toLowerCase()))
    : POPULAR_CITIES.slice(0, 12);

  const pickerDate = form.dob ? new Date(form.dob) : new Date(1990, 0, 1);
  const onPickerChange = (_evt, selected) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) set('dob', selected.toISOString().split('T')[0]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Ionicons name="arrow-back" size={22} color={SLATE} />
            <Text style={s.backText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Full Name */}
          <Text style={s.label}>Full Name <Text style={s.req}>*</Text></Text>
          <TextInput
            style={[s.input, errors.name && s.inputError]}
            value={form.name}
            onChangeText={(v) => set('name', capitaliseName(v))}
            placeholder="e.g. Rahul Kumar Sharma"
            placeholderTextColor={MUTED}
            autoCapitalize="words"
            maxLength={60}
          />
          <FieldError msg={errors.name} />

          {/* Gender */}
          <Text style={s.label}>Gender <Text style={s.req}>*</Text></Text>
          <View style={s.optionRow}>
            {GENDER_OPTIONS.map((g) => {
              const active = form.gender === g.value;
              return (
                <TouchableOpacity key={g.value}
                  style={[s.optionBtn, active && s.optionBtnActive, errors.gender && !active && s.optionBtnError]}
                  onPress={() => set('gender', g.value)}>
                  <Text style={[s.optionText, active && s.optionTextActive]}>{g.emoji} {g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FieldError msg={errors.gender} />

          {/* Date of Birth — native picker, no manual typing */}
          <Text style={s.label}>Date of Birth <Text style={s.req}>*</Text></Text>
          <TouchableOpacity
            style={[s.input, s.pickerBtn, errors.dob && s.inputError]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color={form.dob ? PRIMARY : MUTED} />
            <Text style={[s.pickerText, { color: form.dob ? SLATE : MUTED }]}>
              {form.dob || 'Select date of birth'}
            </Text>
            {age !== null && <Text style={s.ageBadge}>{age} yrs</Text>}
          </TouchableOpacity>
          <FieldError msg={errors.dob} />
          {showPicker && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              minimumDate={new Date('1900-01-01')}
              onChange={onPickerChange}
            />
          )}

          {/* City */}
          <Text style={s.label}>City <Text style={s.req}>*</Text></Text>
          <View style={[s.input, s.cityWrap, errors.city && s.inputError]}>
            <Ionicons name="location-outline" size={18} color={PRIMARY} />
            <TextInput
              style={s.cityInput}
              value={cityQuery}
              onChangeText={(t) => { setCityQuery(t); set('city', t); setShowCityDrop(true); }}
              placeholder="Search city…"
              placeholderTextColor={MUTED}
              autoCapitalize="words"
              onFocus={() => setShowCityDrop(true)}
              returnKeyType="done"
              onSubmitEditing={() => setShowCityDrop(false)}
            />
            {cityQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setCityQuery(''); set('city', ''); }}>
                <Ionicons name="close-circle" size={18} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>
          {showCityDrop && filteredCities.length > 0 && (
            <View style={s.cityDropdown}>
              <FlatList
                data={filteredCities}
                keyExtractor={(c) => c}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
                style={{ maxHeight:160 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.cityDropItem}
                    onPress={() => { set('city', item); setCityQuery(item); setShowCityDrop(false); }}>
                    <Ionicons name="location-outline" size={14} color={PRIMARY} />
                    <Text style={s.cityDropText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          <FieldError msg={errors.city} />

          {/* Emergency Contact */}
          <Text style={s.label}>Emergency Contact <Text style={s.req}>*</Text></Text>
          <View style={[s.input, s.phoneWrap, errors.emergencyContact && s.inputError]}>
            <Text style={s.dialCode}>🇮🇳 +91</Text>
            <View style={s.phoneDivider} />
            <TextInput
              style={s.phoneInput}
              value={form.emergencyContact}
              onChangeText={(v) => set('emergencyContact', normalisePhone(v))}
              placeholder="9876543210"
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
            />
            {form.emergencyContact.length === 10 && !errors.emergencyContact && (
              <Ionicons name="checkmark-circle" size={18} color={GREEN} />
            )}
          </View>
          <Text style={{ fontSize:11, color:MUTED, marginBottom:2 }}>{form.emergencyContact.length}/10 digits</Text>
          <FieldError msg={errors.emergencyContact} />

          {/* Blood Group */}
          <Text style={s.label}>Blood Group <Text style={s.optional}>(optional)</Text></Text>
          <View style={s.bloodRow}>
            {BLOOD_GROUPS.map((bg) => (
              <TouchableOpacity key={bg}
                style={[s.bloodBtn, form.bloodGroup === bg && s.bloodBtnActive]}
                onPress={() => set('bloodGroup', form.bloodGroup === bg ? '' : bg)}>
                <Text style={[s.bloodText, form.bloodGroup === bg && s.bloodTextActive]}>{bg}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Allergies */}
          <Text style={s.label}>Known Allergies <Text style={s.optional}>(optional)</Text></Text>
          <TextInput style={s.input} value={form.allergies}
            onChangeText={(v) => set('allergies', v)}
            placeholder="e.g. Penicillin, Dust, Peanuts"
            placeholderTextColor={MUTED} />

          {/* Existing Conditions */}
          <Text style={s.label}>Existing Conditions <Text style={s.optional}>(optional)</Text></Text>
          <TextInput style={s.input} value={form.existingDiseases}
            onChangeText={(v) => set('existingDiseases', v)}
            placeholder="e.g. Diabetes, Hypertension"
            placeholderTextColor={MUTED} />

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={WHITE} />
              : <><Ionicons name="checkmark-circle-outline" size={20} color={WHITE} /><Text style={s.saveBtnText}>Save Profile</Text></>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:BG },
  content:        { padding:20, paddingBottom:48 },
  back:           { flexDirection:'row', alignItems:'center', gap:8, marginBottom:22 },
  backText:       { fontSize:18, fontWeight:'700', color:SLATE },
  label:          { fontSize:14, fontWeight:'600', color:SLATE, marginBottom:6, marginTop:8 },
  req:            { color:RED },
  optional:       { fontWeight:'400', color:MUTED, fontSize:12 },
  input: {
    borderWidth:1.5, borderColor:BORDER, borderRadius:12,
    padding:14, fontSize:15, color:SLATE, backgroundColor:WHITE, marginBottom:2,
  },
  inputError:     { borderColor:RED, backgroundColor:'#FFF5F5' },
  pickerBtn:      { flexDirection:'row', alignItems:'center', gap:10 },
  pickerText:     { flex:1, fontSize:15 },
  ageBadge: {
    backgroundColor:'#EFF6FF', borderRadius:8, paddingHorizontal:8, paddingVertical:3,
    fontSize:12, fontWeight:'700', color:PRIMARY,
  },
  cityWrap:       { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:10 },
  cityInput:      { flex:1, fontSize:15, color:SLATE },
  cityDropdown: {
    borderWidth:1, borderColor:BORDER, borderRadius:12, backgroundColor:WHITE,
    marginTop:2, marginBottom:4,
    shadowColor:'#000', shadowOffset:{ width:0, height:4 }, shadowOpacity:0.1, shadowRadius:8, elevation:6,
  },
  cityDropItem:   { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  cityDropText:   { fontSize:14, color:SLATE, fontWeight:'500' },
  phoneWrap:      { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:10 },
  dialCode:       { fontSize:14, fontWeight:'700', color:SLATE },
  phoneDivider:   { width:1, height:22, backgroundColor:BORDER, marginHorizontal:4 },
  phoneInput:     { flex:1, fontSize:15, color:SLATE },
  optionRow:      { flexDirection:'row', gap:10, marginBottom:4 },
  optionBtn: {
    flex:1, paddingVertical:12, borderRadius:12, borderWidth:1.5,
    borderColor:BORDER, alignItems:'center', backgroundColor:WHITE,
  },
  optionBtnActive:{ backgroundColor:PRIMARY, borderColor:PRIMARY },
  optionBtnError: { borderColor:RED },
  optionText:     { fontSize:13, fontWeight:'600', color:MUTED },
  optionTextActive:{ color:WHITE },
  bloodRow:       { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:4 },
  bloodBtn: {
    paddingHorizontal:16, paddingVertical:10, borderRadius:10,
    borderWidth:1.5, borderColor:BORDER, backgroundColor:WHITE,
  },
  bloodBtnActive: { backgroundColor:'#FEE2E2', borderColor:'#FCA5A5' },
  bloodText:      { fontSize:14, fontWeight:'600', color:MUTED },
  bloodTextActive:{ color:'#DC2626', fontWeight:'800' },
  saveBtn: {
    backgroundColor:PRIMARY, borderRadius:14, paddingVertical:16,
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, marginTop:16,
  },
  saveBtnDisabled:{ opacity:0.6 },
  saveBtnText:    { color:WHITE, fontSize:16, fontWeight:'700' },
});
