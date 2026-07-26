import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import Login2FactorScreen from '../screens/Login2FactorScreen';
import Otp2FactorScreen from '../screens/Otp2FactorScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={Login2FactorScreen} />
      <Stack.Screen name="Otp2Factor" component={Otp2FactorScreen} />
    </Stack.Navigator>
  );
}
