/**
 * MedicalDisclaimerModal
 *
 * Shown ONCE on first app launch (stored in AsyncStorage).
 * Required by Google Play for apps in the Medical / Health & Fitness category.
 * User must tap "I Understand" before proceeding — cannot be dismissed.
 */
import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const DISCLAIMER_KEY = '@pulsemate_disclaimer_accepted';
const PRIVACY_URL    = 'https://www.pulsemateconnect.in/privacy-policy';

export default function MedicalDisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_KEY).then((v) => {
      if (!v) setVisible(true);
    });
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}} // prevent back-button dismiss
    >
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Icon */}
          <View style={s.iconWrap}>
            <Ionicons name="medical" size={32} color="#2563EB" />
          </View>

          <Text style={s.title}>Medical Disclaimer</Text>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <Text style={s.body}>
              PulseMate Connect is a healthcare appointment booking platform.
              It is designed to help you find doctors, book appointments, and
              track your queue at clinics.
            </Text>

            <Text style={s.body}>
              <Text style={s.bold}>Important: </Text>
              PulseMate Connect is <Text style={s.bold}>not a substitute</Text> for
              professional medical advice, diagnosis, or treatment. Always seek
              the advice of your physician or other qualified health provider
              with any questions you may have regarding a medical condition.
            </Text>

            <Text style={s.body}>
              In case of a medical emergency, call <Text style={s.bold}>112</Text> or
              your local emergency services immediately.
            </Text>

            <Text style={s.body}>
              By using this app you agree to our{' '}
              <Text style={s.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
                Privacy Policy
              </Text>
              . Your health information is stored securely and never sold
              to third parties.
            </Text>
          </ScrollView>

          <TouchableOpacity style={s.btn} onPress={handleAccept} activeOpacity={0.88}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.btnText}>I Understand & Accept</Text>
          </TouchableOpacity>

          <Text style={s.version}>PulseMate Connect · Healthcare Platform</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  scroll: {
    maxHeight: 240,
    width: '100%',
    marginBottom: 20,
  },
  body: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'left',
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  link: {
    color: '#2563EB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 7,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  version: {
    marginTop: 14,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
