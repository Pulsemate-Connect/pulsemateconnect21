/**
 * Custom Firebase reCAPTCHA Verifier for React Native
 * 
 * This component creates a hidden WebView with Firebase's reCAPTCHA implementation
 * Works in production builds without expo-firebase-core dependency
 */
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { firebaseConfig } from '../config/firebase-phone-production';

const FirebaseRecaptchaVerifier = forwardRef((props, ref) => {
  const webViewRef = useRef(null);
  const attemptInvisible = props.attemptInvisibleVerification !== false;

  // HTML content for reCAPTCHA
  const recaptchaHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #recaptcha-container { ${attemptInvisible ? 'display: none;' : ''} }
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>
  <script>
    // Initialize Firebase
    const firebaseConfig = ${JSON.stringify(firebaseConfig)};
    firebase.initializeApp(firebaseConfig);
    
    // Create reCAPTCHA verifier
    let recaptchaVerifier;
    
    function initializeRecaptcha() {
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: '${attemptInvisible ? 'invisible' : 'normal'}',
        callback: (response) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'verify',
            token: response
          }));
        },
        'expired-callback': () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'expired'
          }));
        },
        'error-callback': (error) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });
      
      recaptchaVerifier.render().then(widgetId => {
        window.recaptchaWidgetId = widgetId;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready'
        }));
      });
    }
    
    // Expose verify method
    window.verifyRecaptcha = function() {
      if (recaptchaVerifier) {
        return recaptchaVerifier.verify();
      }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeRecaptcha);
    } else {
      initializeRecaptcha();
    }
  </script>
</body>
</html>
  `;

  // Expose verify method to parent component
  useImperativeHandle(ref, () => ({
    verify: () => {
      return new Promise((resolve, reject) => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            (function() {
              try {
                window.verifyRecaptcha();
              } catch (error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  error: error.message
                }));
              }
            })();
          `);
          resolve();
        } else {
          reject(new Error('reCAPTCHA not initialized'));
        }
      });
    }
  }));

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ready') {
        console.log('[reCAPTCHA] Verifier ready');
      } else if (data.type === 'verify') {
        console.log('[reCAPTCHA] Verification successful');
      } else if (data.type === 'expired') {
        console.log('[reCAPTCHA] Verification expired');
      } else if (data.type === 'error') {
        console.error('[reCAPTCHA] Error:', data.error);
      }
    } catch (error) {
      console.error('[reCAPTCHA] Failed to parse message:', error);
    }
  };

  return (
    <View style={{ width: 0, height: 0, opacity: 0 }}>
      <WebView
        ref={webViewRef}
        source={{ html: recaptchaHTML }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        style={{ width: 0, height: 0 }}
      />
    </View>
  );
});

FirebaseRecaptchaVerifier.displayName = 'FirebaseRecaptchaVerifier';

export default FirebaseRecaptchaVerifier;
