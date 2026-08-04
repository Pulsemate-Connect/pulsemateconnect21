import { View } from 'react-native';

/**
 * reCAPTCHA container for Firebase Phone Auth
 * 
 * Required by Firebase JS SDK for phone authentication
 * The reCAPTCHA is invisible and handled automatically
 * 
 * This component must be rendered in any screen that calls
 * Firebase Phone Auth (sendOtpToPhone)
 */
export default function RecaptchaContainer() {
  return (
    <View 
      id="recaptcha-container" 
      nativeID="recaptcha-container"
      style={{ 
        width: 0, 
        height: 0, 
        opacity: 0,
        position: 'absolute',
        top: -1000,
        left: -1000
      }}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
