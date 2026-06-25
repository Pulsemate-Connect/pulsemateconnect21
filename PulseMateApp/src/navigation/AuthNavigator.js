import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';

const Stack = createNativeStackNavigator();
const ONBOARDING_KEY = 'onboarding_shown_v1';

export default function AuthNavigator() {
  const [initialRoute, setInitialRoute] = useState(null); // null = loading

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then((val) => setInitialRoute(val === 'true' ? 'Login' : 'Onboarding'))
      .catch(() => setInitialRoute('Login')); // fail-safe: skip onboarding on error
  }, []);

  // Wait until we know whether to show onboarding
  if (!initialRoute) return null;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        listeners={{
          // When user leaves Onboarding (skip or complete), mark as shown
          beforeRemove: () => {
            SecureStore.setItemAsync(ONBOARDING_KEY, 'true').catch(() => {});
          },
        }}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}
