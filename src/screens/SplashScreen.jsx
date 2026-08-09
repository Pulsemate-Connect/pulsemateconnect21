// ─────────────────────────────────────────────────────────────────────────────
//  SplashScreen — PulseMate Connect
//  Simple 3-second splash with logo, then navigate to Login
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

const LOGO = require('../../assets/logo1.jpeg');
const BG = '#F8FBFF';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // After 3 seconds, navigate to Login screen
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <Image source={LOGO} style={s.logo} resizeMode="contain" />
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
  logo: {
    width: 200,
    height: 200,
  },
});
