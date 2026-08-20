// ─────────────────────────────────────────────────────────────────────────────
//  SplashScreen — PulseMate Connect
//  Simple splash with logo, then navigate to Login
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, StatusBar, Animated } from 'react-native';

const LOGO = require('../../assets/logo1.jpeg');
const BG = '#F8FBFF';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Animate logo: fade in + scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Show splash for 1 second, then navigate to Login screen
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <Animated.View 
        style={[
          s.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.Text style={[s.appName, { opacity: fadeAnim }]}>
        PulseMate Connect
      </Animated.Text>
      <Animated.Text style={[s.tagline, { opacity: fadeAnim }]}>
        Smart healthcare at your fingertips
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 32,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
});
