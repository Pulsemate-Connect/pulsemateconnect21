import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Primary patient login — 2Factor SMS OTP (Indian numbers, active flow)
import Login2FactorScreen from '../screens/Login2FactorScreen';
import Otp2FactorScreen from '../screens/Otp2FactorScreen';

// Firebase Phone Auth screens (registered but currently unreachable via Welcome;
// kept here so they can be navigated to when Firebase is ready for production)
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* Active 2Factor SMS OTP flow */}
      <Stack.Screen name="Login" component={Login2FactorScreen} />
      <Stack.Screen name="Otp2Factor" component={Otp2FactorScreen} />

      {/* Firebase Phone Auth flow — screens are now reachable */}
      <Stack.Screen name="LoginFirebase" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}
