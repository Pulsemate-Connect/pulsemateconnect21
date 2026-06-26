// ─────────────────────────────────────────────────────────────────────────────
//  NotificationSettingsScreen — PulseMate Connect
//  Let patients control which notification categories they receive.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, shadow, radius } from '../theme';

// SecureStore keys must be alphanumeric + underscore only
const STORAGE_KEY = 'pulsemate_notif_settings';

// Thin AsyncStorage-compatible shim over SecureStore
const AsyncStorage = {
  getItem:  (key) => SecureStore.getItemAsync(key),
  setItem:  (key, value) => SecureStore.setItemAsync(key, value),
};

const DEFAULT_SETTINGS = {
  appointments: true,
  queueUpdates: true,
  reminders:    true,
  marketing:    false,
};

const SETTINGS_CONFIG = [
  {
    key:   'appointments',
    title: 'Appointment Notifications',
    desc:  'Booking confirmations, cancellations, and updates',
    icon:  'calendar-outline',
    color: '#2563EB',
    bg:    '#EFF6FF',
  },
  {
    key:   'queueUpdates',
    title: 'Queue Updates',
    desc:  'When your turn is near, queue paused or resumed',
    icon:  'people-outline',
    color: '#059669',
    bg:    '#ECFDF5',
  },
  {
    key:   'reminders',
    title: 'Appointment Reminders',
    desc:  '24-hour and 2-hour reminders before appointments',
    icon:  'notifications-outline',
    color: '#D97706',
    bg:    '#FEF3C7',
  },
  {
    key:   'marketing',
    title: 'Offers & Promotions',
    desc:  'Health check-up offers and promotional updates',
    icon:  'pricetag-outline',
    color: '#7C3AED',
    bg:    '#EDE9FE',
  },
];

export default function NotificationSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded,   setLoaded]   = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>Notification Settings</Text>
          <Text style={s.subtitle}>Choose what you want to be notified about</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.card}>
          {SETTINGS_CONFIG.map((item, i) => (
            <View key={item.key} style={[s.row, i < SETTINGS_CONFIG.length - 1 && s.rowBorder]}>
              <View style={[s.iconCircle, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={s.rowContent}>
                <Text style={s.rowTitle}>{item.title}</Text>
                <Text style={s.rowDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={loaded ? settings[item.key] : DEFAULT_SETTINGS[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: '#E2E8F0', true: colors.primary + '80' }}
                thumbColor={settings[item.key] ? colors.primary : '#94A3B8'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>
          ))}
        </View>

        <Text style={s.note}>
          System-critical notifications (like appointment status changes from your doctor or queue calls) are always delivered regardless of these settings.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#F0F4FF' },
  scroll:     { padding: 16, paddingBottom: 40 },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  backBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  headerMid:  { flex: 1 },
  title:      { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle:   { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  card:       { backgroundColor: '#fff', borderRadius: radius.xl, overflow: 'hidden', ...shadow.sm },
  row:        { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowBorder:  { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowContent: { flex: 1 },
  rowTitle:   { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  rowDesc:    { fontSize: 12, color: colors.textMuted, lineHeight: 16 },

  note:       { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 20, lineHeight: 17, paddingHorizontal: 8 },
});
