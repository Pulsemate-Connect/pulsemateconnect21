/**
 * FirebaseRecaptcha Component
 * 
 * Provides invisible reCAPTCHA for Firebase Phone Authentication
 * Uses WebView to render reCAPTCHA (Firebase JS SDK requirement)
 */

import { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function FirebaseRecaptcha({ onVerify, siteKey, languageCode = 'en' }) {
  const webViewRef = useRef(null);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
  <script src="https://www.google.com/recaptcha/api.js?hl=${languageCode}"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: transparent;
    }
    #recaptcha-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>
  <script>
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: "${siteKey || 'AIzaSyA2PXJxyIZpYOG2tXHDRu95gaaJogKEDBc'}",
      authDomain: "pulsemateconnect.firebaseapp.com",
      projectId: "pulsemateconnect",
    };
    
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    
    // Create invisible reCAPTCHA
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved:', response);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verified', token: response }));
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
      },
      'error-callback': (error) => {
        console.error('reCAPTCHA error:', error);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: String(error) }));
      }
    });
    
    // Render the reCAPTCHA
    window.recaptchaVerifier.render().then(widgetId => {
      window.recaptchaWidgetId = widgetId;
      console.log('reCAPTCHA widget ID:', widgetId);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready', widgetId }));
    }).catch(error => {
      console.error('reCAPTCHA render error:', error);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: String(error) }));
    });
    
    // Listen for verify requests from React Native
    document.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'verify') {
        window.recaptchaVerifier.verify();
      } else if (data.action === 'reset') {
        if (window.recaptchaWidgetId !== undefined) {
          grecaptcha.reset(window.recaptchaWidgetId);
        }
      }
    });
    
    // Also support window.postMessage for iOS
    window.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'verify') {
        window.recaptchaVerifier.verify();
      } else if (data.action === 'reset') {
        if (window.recaptchaWidgetId !== undefined) {
          grecaptcha.reset(window.recaptchaWidgetId);
        }
      }
    });
  </script>
</body>
</html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[FirebaseRecaptcha] Message from WebView:', data);
      
      if (data.type === 'ready') {
        console.log('[FirebaseRecaptcha] reCAPTCHA ready');
      } else if (data.type === 'verified') {
        console.log('[FirebaseRecaptcha] reCAPTCHA verified');
        if (onVerify) {
          onVerify(data.token);
        }
      } else if (data.type === 'expired') {
        console.log('[FirebaseRecaptcha] reCAPTCHA expired');
      } else if (data.type === 'error') {
        console.error('[FirebaseRecaptcha] reCAPTCHA error:', data.error);
      }
    } catch (error) {
      console.error('[FirebaseRecaptcha] Failed to parse message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
        mixedContentMode="always"
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  webview: {
    width: 1,
    height: 1,
    backgroundColor: 'transparent',
  },
});
