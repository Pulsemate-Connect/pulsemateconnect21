// ─────────────────────────────────────────────────────────────────────────────
//  ProfileWizardScreen — PulseMate Connect  |  6-Step Profile Completion
//  Fixed: full validation, date picker, city search, emergency contact check,
//         inline errors, double-submit guard, pre-population on reopen.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, FlatList,
  Animated, Easing, Dimensions, StatusBar, ActivityIndicator,
  Alert, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { updatePatientProfile, getPatientProfile } from '../api/patient';
import { useAuth } from '../store/authStore';
import {
  BLOOD_GROUPS, GENDER_OPTIONS, POPULAR_CITIES,
  capitaliseName, calcAge,
  validateName, validateGender, validateDob,
  validateCity, validateEmergencyContact, normalisePhone,
  isStepValid, validateStep,
} from '../utils/profileValidation';

const { width: W } = Dimensions.get('window');
const SKY5  = '#0EA5E9'; const SKY6  = '#0284C7'; const SKY7 = '#0369A1';
const TEAL  = '#2DD4BF'; const WHITE = '#FFFFFF';
const SLATE = '#0F172A'; const MUTED = '#94A3B8'; const BG = '#F0F7FF';
const ROSE  = '#FB7185'; const RED   = '#EF4444'; const GREEN = '#16A34A';
const BORDER = '#E2E8F0';

const STEPS = [
  { id:1, key:'name',             title:'Full Name',         subtitle:'How should doctors address you?',               icon:'person',      color:SKY5,    bg:'#E0F2FE', required:true  },
  { id:2, key:'gender',           title:'Gender',            subtitle:'Helps doctors provide personalised care.',       icon:'male-female', color:'#8B5CF6',bg:'#EDE9FE', required:true  },
  { id:3, key:'dob',              title:'Date of Birth',     subtitle:'Used to calculate your age for medical records.',icon:'calendar',    color:'#10B981',bg:'#D1FAE5', required:true  },
  { id:4, key:'city',             title:'Your City',         subtitle:'Helps us show nearby clinics and doctors.',      icon:'location',    color:'#F59E0B',bg:'#FEF3C7', required:true  },
  { id:5, key:'emergencyContact', title:'Emergency Contact', subtitle:'A number we can reach in case of emergency.',    icon:'call',        color:ROSE,    bg:'#FEE2E2', required:true  },
  { id:6, key:'medical',          title:'Medical Details',   subtitle:'Optional — helps doctors prepare in advance.',   icon:'medical',     color:TEAL,    bg:'#CCFBF1', required:false },
];

// ── Inline error helper ───────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <View style={fe.row}>
      <Ionicons name="alert-circle-outline" size={13} color={RED} />
      <Text style={fe.text}>{msg}</Text>
    </View>
  );
}
const fe = StyleSheet.create({
  row:  { flexDirection:'row', alignItems:'center', gap:5, marginTop:6 },
  text: { fontSize:12, color:RED, flex:1 },
});

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total, accent }) {
  const pct = (current / total) * 100;
  const widthA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthA, { toValue:pct, duration:400, easing:Easing.out(Easing.cubic), useNativeDriver:false }).start();
  }, [pct]);
  return (
    <View style={pb.wrap}>
      <View style={pb.track}>
        <Animated.View style={[pb.fill, { width: widthA.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] }), backgroundColor:accent }]} />
      </View>
      <Text style={[pb.pct, { color:accent }]}>{Math.round(pct)}%</Text>
    </View>
  );
}
const pb = StyleSheet.create({
  wrap:  { flexDirection:'row', alignItems:'center', gap:10, marginBottom:6 },
  track: { flex:1, height:6, backgroundColor:'#E2E8F0', borderRadius:3, overflow:'hidden' },
  fill:  { height:'100%', borderRadius:3 },
  pct:   { fontSize:13, fontWeight:'800', minWidth:38, textAlign:'right' },
});

// ── Step 1: Full Name ─────────────────────────────────────────────────────────
function StepName({ value, onChange, error, accent }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Your full name <Text style={sw.req}>*</Text></Text>
      <View style={[sw.inputWrap, focused && { borderColor:accent }, error && sw.inputError]}>
        <Ionicons name="person-outline" size={18} color={focused ? accent : MUTED} />
        <TextInput
          style={sw.input}
          value={value}
          onChangeText={(v) => onChange(capitaliseName(v))}
          placeholder="e.g. Rahul Kumar Sharma"
          placeholderTextColor={MUTED}
          autoCapitalize="words"
          autoFocus
          maxLength={60}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="next"
        />
        {!error && value.trim().length >= 3 && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
      </View>
      <FieldError msg={error} />
      <Text style={sw.charHint}>{value.trim().length}/60</Text>
    </View>
  );
}

// ── Step 2: Gender ────────────────────────────────────────────────────────────
function StepGender({ value, onChange, error, accent }) {
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Select your gender <Text style={sw.req}>*</Text></Text>
      <View style={sw.genderGrid}>
        {GENDER_OPTIONS.map((g) => {
          const active = value === g.value;
          return (
            <TouchableOpacity key={g.value}
              style={[sw.genderCard, active && { borderColor:accent, backgroundColor:accent+'18' }]}
              onPress={() => onChange(g.value)} activeOpacity={0.8}>
              <Text style={sw.genderEmoji}>{g.emoji}</Text>
              <Text style={[sw.genderLabel, active && { color:accent, fontWeight:'800' }]}>{g.label}</Text>
              {active && <View style={[sw.genderCheck, { backgroundColor:accent }]}><Ionicons name="checkmark" size={10} color={WHITE} /></View>}
            </TouchableOpacity>
          );
        })}
      </View>
      <FieldError msg={error} />
    </View>
  );
}

// ── Step 3: Date of Birth (native date picker — no manual typing) ─────────────
function StepDob({ value, onChange, error, accent }) {
  const [showPicker, setShowPicker] = useState(false);
  const today     = new Date();
  const minDate   = new Date('1900-01-01');
  const pickerVal = value ? new Date(value) : new Date(1990, 0, 1);
  const age       = calcAge(value);

  const onPickerChange = (_evt, selected) => {
    setShowPicker(Platform.OS === 'ios'); // iOS keeps picker open; Android closes
    if (selected) {
      const iso = selected.toISOString().split('T')[0];
      onChange(iso);
    }
  };

  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Date of birth <Text style={sw.req}>*</Text></Text>

      {/* Tap-to-open date picker button — no manual typing allowed */}
      <TouchableOpacity
        style={[sw.inputWrap, error && sw.inputError, { justifyContent:'space-between' }]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
          <Ionicons name="calendar-outline" size={18} color={accent} />
          <Text style={[sw.input, { color: value ? SLATE : MUTED }]}>
            {value || 'Select date of birth'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={MUTED} />
      </TouchableOpacity>

      {age !== null && (
        <View style={[sw.ageBadge, { backgroundColor:accent+'15', borderColor:accent+'30' }]}>
          <Ionicons name="person-outline" size={14} color={accent} />
          <Text style={[sw.ageText, { color:accent }]}>Age: {age} years old</Text>
        </View>
      )}
      <FieldError msg={error} />

      {/* Android: modal picker; iOS: inline (shown below button) */}
      {showPicker && (
        <DateTimePicker
          value={pickerVal}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={today}
          minimumDate={minDate}
          onChange={onPickerChange}
        />
      )}
    </View>
  );
}

// ── Step 4: City (searchable dropdown) ───────────────────────────────────────
function StepCity({ value, onChange, error, accent }) {
  const [query, setQuery]   = useState(value || '');
  const [showDrop, setShowDrop] = useState(false);

  const filtered = query.trim().length >= 1
    ? POPULAR_CITIES.filter((c) => c.toLowerCase().startsWith(query.toLowerCase()))
    : POPULAR_CITIES.slice(0, 12);

  const select = (city) => {
    onChange(city);
    setQuery(city);
    setShowDrop(false);
  };

  // Sync when parent value changes (e.g. pre-populated)
  useEffect(() => { setQuery(value || ''); }, [value]);

  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Your city <Text style={sw.req}>*</Text></Text>
      <View style={[sw.inputWrap, error && sw.inputError]}>
        <Ionicons name="location-outline" size={18} color={accent} />
        <TextInput
          style={sw.input}
          value={query}
          onChangeText={(t) => { setQuery(t); onChange(t); setShowDrop(true); }}
          placeholder="Search city…"
          placeholderTextColor={MUTED}
          autoCapitalize="words"
          onFocus={() => setShowDrop(true)}
          returnKeyType="done"
          onSubmitEditing={() => setShowDrop(false)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); onChange(''); setShowDrop(true); }}>
            <Ionicons name="close-circle" size={18} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>
      <FieldError msg={error} />

      {showDrop && filtered.length > 0 && (
        <View style={sw.cityDropdown}>
          <FlatList
            data={filtered}
            keyExtractor={(c) => c}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            style={{ maxHeight: 180 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={sw.cityDropItem} onPress={() => select(item)} activeOpacity={0.7}>
                <Ionicons name="location-outline" size={14} color={accent} />
                <Text style={sw.cityDropText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <Text style={sw.popularLabel}>Popular cities</Text>
      <View style={sw.cityGrid}>
        {POPULAR_CITIES.slice(0, 8).map((c) => (
          <TouchableOpacity key={c}
            style={[sw.cityChip, value === c && { backgroundColor:accent, borderColor:accent }]}
            onPress={() => select(c)} activeOpacity={0.8}>
            <Text style={[sw.cityChipText, value === c && { color:WHITE, fontWeight:'700' }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Step 5: Emergency Contact ─────────────────────────────────────────────────
function StepEmergency({ value, onChange, error, accent, userPhone }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Emergency contact <Text style={sw.req}>*</Text></Text>
      <View style={[sw.inputWrap, focused && { borderColor:accent }, error && sw.inputError]}>
        <View style={sw.dialCode}>
          <Text style={sw.dialFlag}>🇮🇳</Text>
          <Text style={sw.dialNum}>+91</Text>
        </View>
        <View style={sw.inputDivider} />
        <TextInput
          style={sw.input}
          value={value}
          onChangeText={(t) => onChange(normalisePhone(t))}
          placeholder="9876543210"
          placeholderTextColor={MUTED}
          keyboardType="phone-pad"
          maxLength={10}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="done"
        />
        {!error && value.length === 10 && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
      </View>
      <Text style={sw.charHint}>{value.length}/10 digits</Text>
      <FieldError msg={error} />
      <View style={[sw.infoBox, { borderColor:accent+'30', backgroundColor:accent+'08' }]}>
        <Ionicons name="call" size={16} color={accent} />
        <Text style={[sw.infoText, { color:accent }]}>
          Only used in medical emergencies during your clinic visit. Never for marketing.
        </Text>
      </View>
    </View>
  );
}

// ── Step 6: Medical Details (all optional) ────────────────────────────────────
function StepMedical({ form, onChange, accent }) {
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Blood group <Text style={sw.optTag}>(optional)</Text></Text>
      <View style={sw.bloodGrid}>
        {BLOOD_GROUPS.map((bg) => {
          const active = form.bloodGroup === bg;
          return (
            <TouchableOpacity key={bg}
              style={[sw.bloodChip, active && { backgroundColor:'#FEE2E2', borderColor:'#FCA5A5' }]}
              onPress={() => onChange('bloodGroup', active ? '' : bg)} activeOpacity={0.8}>
              <Text style={[sw.bloodText, active && { color:'#DC2626', fontWeight:'800' }]}>{bg}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[sw.fieldLabel, { marginTop:16 }]}>Known allergies <Text style={sw.optTag}>(optional)</Text></Text>
      <TextInput style={sw.textArea} value={form.allergies}
        onChangeText={(v) => onChange('allergies', v)}
        placeholder="e.g. Penicillin, Dust, Peanuts"
        placeholderTextColor={MUTED} multiline numberOfLines={2} textAlignVertical="top" />
      <Text style={[sw.fieldLabel, { marginTop:8 }]}>Existing conditions <Text style={sw.optTag}>(optional)</Text></Text>
      <TextInput style={sw.textArea} value={form.existingDiseases}
        onChangeText={(v) => onChange('existingDiseases', v)}
        placeholder="e.g. Diabetes Type 2, Hypertension"
        placeholderTextColor={MUTED} multiline numberOfLines={2} textAlignVertical="top" />
      <Text style={[sw.fieldLabel, { marginTop:8 }]}>Insurance provider <Text style={sw.optTag}>(optional)</Text></Text>
      <View style={sw.inputWrap}>
        <Ionicons name="shield-outline" size={18} color={MUTED} />
        <TextInput style={sw.input} value={form.insuranceProvider}
          onChangeText={(v) => onChange('insuranceProvider', v)}
          placeholder="e.g. Star Health, HDFC Ergo" placeholderTextColor={MUTED} />
      </View>
    </View>
  );
}

// ── Success overlay ───────────────────────────────────────────────────────────
function SuccessOverlay({ visible, returnTo }) {
  const scaleA = useRef(new Animated.Value(0)).current;
  const fadeA  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleA, { toValue:1, friction:4, tension:80, useNativeDriver:true }),
        Animated.timing(fadeA,  { toValue:1, duration:300, useNativeDriver:true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[so.overlay, { opacity:fadeA }]}>
      <Animated.View style={[so.card, { transform:[{ scale:scaleA }] }]}>
        <View style={so.circle}><Ionicons name="checkmark" size={52} color={WHITE} /></View>
        <Text style={so.title}>Profile Complete!</Text>
        <Text style={so.sub}>{returnTo === 'Booking' ? 'Taking you back to complete your booking…' : 'Your health profile is set up.'}</Text>
      </Animated.View>
    </Animated.View>
  );
}
const so = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(3,105,161,0.92)', zIndex:200, alignItems:'center', justifyContent:'center', padding:32 },
  card:    { backgroundColor:WHITE, borderRadius:28, padding:32, alignItems:'center', width:'100%', gap:12 },
  circle:  { width:96, height:96, borderRadius:48, backgroundColor:TEAL, alignItems:'center', justifyContent:'center', marginBottom:4 },
  title:   { fontSize:26, fontWeight:'800', color:SLATE },
  sub:     { fontSize:14, color:MUTED, textAlign:'center', lineHeight:21 },
});

// ── Main ProfileWizardScreen ──────────────────────────────────────────────────
export default function ProfileWizardScreen({ route, navigation }) {
  const { profile: routeProfile, returnTo } = route?.params || {};
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors,  setErrors]  = useState({});  // { [stepKey]: errorMsg }
  const [profile, setProfile] = useState(routeProfile || null);

  const p = profile?.patientProfile;
  const userPhone = user?.mobile || '';

  const [form, setForm] = useState({
    name:             profile?.name || '',
    gender:           p?.gender || '',
    dob:              p?.dob ? p.dob.split('T')[0] : '',
    city:             p?.city || '',
    emergencyContact: p?.emergencyContact ? normalisePhone(p.emergencyContact) : '',
    bloodGroup:       p?.bloodGroup || '',
    allergies:        p?.allergies || '',
    existingDiseases: p?.existingDiseases || '',
    insuranceProvider:p?.insuranceProvider || '',
  });

  // If no profile was passed, fetch fresh data on mount
  useEffect(() => {
    if (!routeProfile) {
      getPatientProfile().then((res) => {
        const u = res.data.data.user;
        setProfile(u);
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
      }).catch(() => {});
    }
  }, []);

  const slideA = useRef(new Animated.Value(0)).current;
  const fadeA  = useRef(new Animated.Value(1)).current;

  const animateStep = (dir) => {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue:0, duration:120, useNativeDriver:true }),
      Animated.timing(slideA, { toValue:dir * -30, duration:120, useNativeDriver:true }),
    ]).start(() => {
      slideA.setValue(dir * 30);
      Animated.parallel([
        Animated.timing(fadeA,  { toValue:1, duration:220, easing:Easing.out(Easing.cubic), useNativeDriver:true }),
        Animated.timing(slideA, { toValue:0, duration:220, easing:Easing.out(Easing.cubic), useNativeDriver:true }),
      ]).start();
    });
  };

  const setField = (field, val) => {
    setForm((f) => ({ ...f, [field]:val }));
    setErrors((e) => ({ ...e, [STEPS[step].key]: null })); // clear error on change
  };

  const currentStepKey = STEPS[step].key;

  const validateCurrentStep = () => {
    const err = isStepValid(currentStepKey, form, userPhone)
      ? null
      : validateStep(currentStepKey, form, userPhone);
    if (err) setErrors((e) => ({ ...e, [currentStepKey]: err }));
    return !err;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (step < STEPS.length - 1) {
      animateStep(1);
      setStep((s) => s + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 0) { animateStep(-1); setStep((s) => s - 1); }
    else navigation.goBack();
  };

  const handleSave = async () => {
    if (saving) return; // double-submit guard
    setSaving(true);
    try {
      const payload = {
        name:              form.name.trim()      || undefined,
        gender:            form.gender           || undefined,
        dob:               form.dob              || undefined,
        city:              form.city.trim()      || undefined,
        emergencyContact:  form.emergencyContact.length === 10
                             ? `+91${form.emergencyContact}` : undefined,
        bloodGroup:        form.bloodGroup       || undefined,
        allergies:         form.allergies        || undefined,
        existingDiseases:  form.existingDiseases || undefined,
        insuranceProvider: form.insuranceProvider|| undefined,
      };
      if (__DEV__) console.log('[ProfileWizard] saving payload', payload);
      const res = await updatePatientProfile(payload);
      updateUser({ name: res.data.data.user.name });
      setSuccess(true);
      setTimeout(() => {
        if (returnTo === 'Booking') navigation.goBack();
        else navigation.reset({ index:0, routes:[{ name:'ProfileTab' }] });
      }, 2400);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile. Please try again.';
      Alert.alert('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const current  = STEPS[step];
  const accent   = current.color;
  const canGo    = isStepValid(currentStepKey, form, userPhone);

  return (
    <View style={wz.root}>
      <StatusBar barStyle="light-content" backgroundColor={SKY7} translucent />
      <View style={[wz.headerBand, { backgroundColor:accent, paddingTop:insets.top + 12 }]}>
        <View style={wz.navRow}>
          <TouchableOpacity style={wz.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>
          <View style={wz.navCenter}>
            <Text style={wz.navTitle}>Complete Your Profile</Text>
            <Text style={wz.navSub}>Step {step+1} of {STEPS.length}</Text>
          </View>
          <TouchableOpacity style={wz.skipBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={wz.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <ProgressBar current={step + (canGo ? 1 : 0)} total={STEPS.length} accent={WHITE} />
        <View style={wz.stepHero}>
          <View style={[wz.stepIconWrap, { backgroundColor:'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={current.icon} size={28} color={WHITE} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={wz.stepTitle}>{current.title}</Text>
            <Text style={wz.stepSubtitle}>{current.subtitle}</Text>
          </View>
          <View style={current.required ? wz.requiredBadge : wz.optionalBadge}>
            <Text style={current.required ? wz.requiredText : wz.optionalBadgeText}>
              {current.required ? 'Required' : 'Optional'}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={wz.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity:fadeA, transform:[{ translateY:slideA }] }}>
            <View style={wz.card}>
              {step === 0 && <StepName     value={form.name}             onChange={(v) => setField('name', v)}             error={errors.name}             accent={accent} />}
              {step === 1 && <StepGender   value={form.gender}           onChange={(v) => setField('gender', v)}           error={errors.gender}           accent={accent} />}
              {step === 2 && <StepDob      value={form.dob}              onChange={(v) => setField('dob', v)}              error={errors.dob}              accent={accent} />}
              {step === 3 && <StepCity     value={form.city}             onChange={(v) => setField('city', v)}             error={errors.city}             accent={accent} />}
              {step === 4 && <StepEmergency value={form.emergencyContact} onChange={(v) => setField('emergencyContact', v)} error={errors.emergencyContact} accent={accent} userPhone={userPhone} />}
              {step === 5 && <StepMedical  form={form}                   onChange={setField}                               accent={accent} />}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[wz.bottomBar, { paddingBottom:insets.bottom + 12 }]}>
        {step > 0 && (
          <TouchableOpacity style={wz.prevBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color={accent} />
            <Text style={[wz.prevText, { color:accent }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[wz.nextBtn, { backgroundColor:canGo ? accent : '#E2E8F0', shadowColor:accent }, step === 0 && { flex:1 }]}
          onPress={handleNext}
          disabled={saving}
          activeOpacity={0.88}
        >
          {saving ? <ActivityIndicator color={WHITE} size="small" /> : (
            <>
              <Text style={[wz.nextText, { color:canGo ? WHITE : MUTED }]}>
                {step === STEPS.length - 1 ? 'Complete Profile' : 'Continue'}
              </Text>
              <Ionicons name={step === STEPS.length - 1 ? 'checkmark-circle' : 'arrow-forward'} size={18} color={canGo ? WHITE : MUTED} />
            </>
          )}
        </TouchableOpacity>
      </View>
      <SuccessOverlay visible={success} returnTo={returnTo} />
    </View>
  );
}

// ── Shared step styles ────────────────────────────────────────────────────────
const sw = StyleSheet.create({
  stepBody:    { gap:4 },
  fieldLabel:  { fontSize:14, fontWeight:'700', color:SLATE, marginBottom:10 },
  req:         { color:RED },
  optTag:      { fontSize:12, fontWeight:'400', color:MUTED },
  charHint:    { fontSize:11, color:MUTED, textAlign:'right', marginTop:4 },
  inputWrap: {
    flexDirection:'row', alignItems:'center', gap:10,
    borderWidth:1.5, borderColor:BORDER, borderRadius:16,
    backgroundColor:WHITE, paddingHorizontal:16, paddingVertical:14,
    shadowColor:'#000', shadowOffset:{ width:0, height:1 }, shadowOpacity:0.04, shadowRadius:4, elevation:1,
  },
  inputError:  { borderColor:RED, backgroundColor:'#FFF5F5' },
  input:       { flex:1, fontSize:16, color:SLATE, fontWeight:'500' },
  inputDivider:{ width:1, height:24, backgroundColor:BORDER },
  dialCode:    { flexDirection:'row', alignItems:'center', gap:5 },
  dialFlag:    { fontSize:18 },
  dialNum:     { fontSize:15, fontWeight:'700', color:SLATE },
  infoBox: {
    flexDirection:'row', alignItems:'flex-start', gap:8,
    borderWidth:1, borderRadius:12, padding:12, marginTop:12,
  },
  infoText:    { flex:1, fontSize:12, lineHeight:17 },
  ageBadge: {
    flexDirection:'row', alignItems:'center', gap:7,
    borderWidth:1, borderRadius:10, paddingHorizontal:12, paddingVertical:8, marginTop:10,
    alignSelf:'flex-start',
  },
  ageText:     { fontSize:13, fontWeight:'700' },
  genderGrid:  { flexDirection:'row', gap:12, marginBottom:4 },
  genderCard: {
    flex:1, alignItems:'center', paddingVertical:20, borderRadius:18,
    borderWidth:2, borderColor:BORDER, backgroundColor:WHITE, gap:8, position:'relative',
  },
  genderEmoji: { fontSize:32 },
  genderLabel: { fontSize:13, fontWeight:'600', color:'#475569' },
  genderCheck: {
    position:'absolute', top:8, right:8, width:20, height:20, borderRadius:10,
    alignItems:'center', justifyContent:'center',
  },
  cityDropdown: {
    borderWidth:1, borderColor:BORDER, borderRadius:12, backgroundColor:WHITE,
    marginTop:4, shadowColor:'#000', shadowOffset:{ width:0, height:4 },
    shadowOpacity:0.1, shadowRadius:8, elevation:6,
  },
  cityDropItem: { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:14, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  cityDropText: { fontSize:14, color:SLATE, fontWeight:'500' },
  popularLabel: { fontSize:12, fontWeight:'600', color:MUTED, marginTop:14, marginBottom:8 },
  cityGrid:     { flexDirection:'row', flexWrap:'wrap', gap:8 },
  cityChip: {
    paddingHorizontal:14, paddingVertical:8, borderRadius:10,
    borderWidth:1.5, borderColor:BORDER, backgroundColor:WHITE,
  },
  cityChipText: { fontSize:13, fontWeight:'600', color:'#475569' },
  bloodGrid:    { flexDirection:'row', flexWrap:'wrap', gap:10 },
  bloodChip: {
    paddingHorizontal:16, paddingVertical:10, borderRadius:12,
    borderWidth:1.5, borderColor:BORDER, backgroundColor:WHITE, minWidth:56, alignItems:'center',
  },
  bloodText:    { fontSize:14, fontWeight:'700', color:'#475569' },
  textArea: {
    borderWidth:1.5, borderColor:BORDER, borderRadius:14,
    padding:14, fontSize:14, color:SLATE, backgroundColor:WHITE,
    minHeight:80, marginBottom:4,
  },
});

// ── Screen layout styles ──────────────────────────────────────────────────────
const wz = StyleSheet.create({
  root:         { flex:1, backgroundColor:BG },
  headerBand:   { paddingHorizontal:20, paddingBottom:20, overflow:'hidden' },
  navRow:       { flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 },
  backBtn:      { width:36, height:36, borderRadius:11, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  navCenter:    { flex:1 },
  navTitle:     { fontSize:16, fontWeight:'800', color:WHITE, letterSpacing:-0.3 },
  navSub:       { fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:1 },
  skipBtn:      { paddingHorizontal:10, paddingVertical:6 },
  skipText:     { fontSize:13, fontWeight:'600', color:'rgba(255,255,255,0.75)' },
  stepHero:     { flexDirection:'row', alignItems:'center', gap:14, marginTop:8 },
  stepIconWrap: { width:52, height:52, borderRadius:16, alignItems:'center', justifyContent:'center' },
  stepTitle:    { fontSize:20, fontWeight:'800', color:WHITE, letterSpacing:-0.4 },
  stepSubtitle: { fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3, lineHeight:17 },
  requiredBadge:{ backgroundColor:'rgba(255,255,255,0.25)', borderRadius:8, paddingHorizontal:8, paddingVertical:4 },
  requiredText: { fontSize:10, fontWeight:'800', color:WHITE },
  optionalBadge:{ backgroundColor:'rgba(255,255,255,0.15)', borderRadius:8, paddingHorizontal:8, paddingVertical:4 },
  optionalBadgeText:{ fontSize:10, fontWeight:'600', color:'rgba(255,255,255,0.8)' },
  scrollContent:{ padding:18, paddingBottom:40, gap:14 },
  card: {
    backgroundColor:WHITE, borderRadius:24, padding:20,
    shadowColor:'#000', shadowOffset:{ width:0, height:4 }, shadowOpacity:0.08, shadowRadius:16, elevation:5,
  },
  bottomBar: {
    flexDirection:'row', alignItems:'center', gap:12,
    paddingHorizontal:20, paddingTop:14, backgroundColor:WHITE,
    borderTopWidth:1, borderTopColor:'#F1F5F9',
    shadowColor:'#000', shadowOffset:{ width:0, height:-4 }, shadowOpacity:0.07, shadowRadius:12, elevation:10,
  },
  prevBtn: {
    flexDirection:'row', alignItems:'center', gap:6,
    paddingHorizontal:18, paddingVertical:15, borderRadius:16, borderWidth:1.5, borderColor:BORDER,
  },
  prevText:     { fontSize:14, fontWeight:'700' },
  nextBtn: {
    flex:2, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8,
    borderRadius:16, paddingVertical:16,
    shadowOffset:{ width:0, height:6 }, shadowOpacity:0.35, shadowRadius:14, elevation:8,
  },
  nextText:     { fontSize:15, fontWeight:'800', letterSpacing:0.1 },
});
