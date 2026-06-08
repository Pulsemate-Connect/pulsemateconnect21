// ─────────────────────────────────────────────────────────────────────────────
//  RazorpayScreen — PulseMate Connect
//
//  Renders Razorpay checkout inside a WebView.
//  Works in Expo Go without any native module.
//
//  Navigation flow:
//    BookingScreen ──initiatePayment──> RazorpayScreen ──success──> BookingScreen (callback)
//                                                       ──cancel──> BookingScreen (back)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { verifyPayment } from '../api/patient';

const PRIMARY   = '#0EA5E9';
const PRIMARY_D = '#0284C7';
const WHITE     = '#FFFFFF';
const SLATE     = '#0F172A';
const MUTED     = '#94A3B8';
const RED       = '#EF4444';

// ─────────────────────────────────────────────────────────────────────────────
// Build the Razorpay checkout HTML page injected into the WebView.
// Razorpay v1 JS checkout opens the payment modal inline.
// ─────────────────────────────────────────────────────────────────────────────
const buildCheckoutHTML = ({ keyId, orderId, amount, currency, name, description, patientName, patientEmail, patientMobile }) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, sans-serif;
      background: #F0F7FF;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: white; border-radius: 20px; padding: 32px 24px;
      width: 100%; max-width: 400px; text-align: center;
      box-shadow: 0 4px 24px rgba(14,165,233,0.12);
    }
    .logo { font-size: 28px; font-weight: 800; color: #0F172A; margin-bottom: 4px; }
    .logo span { color: #0EA5E9; }
    .sub { color: #94A3B8; font-size: 13px; margin-bottom: 28px; }
    .amount { font-size: 36px; font-weight: 900; color: #0F172A; margin-bottom: 4px; }
    .amount-sub { color: #64748B; font-size: 13px; margin-bottom: 28px; }
    .btn {
      background: #0EA5E9; color: white; border: none;
      padding: 16px 32px; border-radius: 14px; font-size: 16px;
      font-weight: 700; cursor: pointer; width: 100%;
      transition: background 0.2s;
    }
    .btn:hover { background: #0284C7; }
    .btn:disabled { background: #94A3B8; cursor: not-allowed; }
    .cancel { margin-top: 14px; color: #94A3B8; font-size: 13px; cursor: pointer; }
    .cancel:hover { color: #EF4444; }
    .secure { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 20px; color: #94A3B8; font-size: 11px; }
    .loading { display: none; }
    .spinner {
      border: 3px solid #E2E8F0; border-top: 3px solid #0EA5E9;
      border-radius: 50%; width: 36px; height: 36px;
      animation: spin 0.8s linear infinite; margin: 16px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Pulse<span>Mate</span></div>
    <div class="sub">Appointment Booking Fee</div>
    <div class="amount">₹${(amount / 100).toFixed(0)}</div>
    <div class="amount-sub">${description || 'Secure payment via Razorpay'}</div>
    <button class="btn" id="payBtn" onclick="openRazorpay()">Pay ₹${(amount / 100).toFixed(0)}</button>
    <div class="cancel" onclick="cancelPayment()">Cancel booking</div>
    <div class="secure">🔒 Secured by Razorpay · 256-bit SSL encryption</div>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = {
      key:         '${keyId}',
      amount:      ${amount},
      currency:    '${currency || 'INR'}',
      order_id:    '${orderId}',
      name:        '${(name || 'PulseMate').replace(/'/g, "\\'")}',
      description: '${(description || 'Appointment Booking').replace(/'/g, "\\'")}',
      prefill: {
        name:    '${(patientName  || '').replace(/'/g, "\\'")}',
        email:   '${(patientEmail || '').replace(/'/g, "\\'")}',
        contact: '${(patientMobile || '').replace(/'/g, "\\'")}',
      },
      theme: { color: '#0EA5E9' },
      modal: { ondismiss: function() { cancelPayment(); } },
      handler: function(response) {
        // Payment success — post back to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:              'PAYMENT_SUCCESS',
          razorpayOrderId:   response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }));
      }
    };

    function openRazorpay() {
      document.getElementById('payBtn').disabled = true;
      document.getElementById('payBtn').textContent = 'Opening payment...';
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:  'PAYMENT_FAILED',
          error: response.error.description,
        }));
      });
      rzp.open();
    }

    function cancelPayment() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_CANCELLED' }));
    }

    // Auto-open Razorpay modal after 600ms (better UX than requiring a tap)
    setTimeout(openRazorpay, 600);
  </script>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────
export default function RazorpayScreen({ route, navigation }) {
  const {
    appointmentId,
    orderId,
    orderAmount,
    orderCurrency,
    keyId,
    doctorName,
    patientName,
    patientEmail,
    patientMobile,
    onSuccess,  // callback passed via navigation params
  } = route.params;

  const [loading,     setLoading]     = useState(true);
  const [verifying,   setVerifying]   = useState(false);
  const webviewRef = useRef(null);

  const html = buildCheckoutHTML({
    keyId,
    orderId,
    amount:       orderAmount,
    currency:     orderCurrency || 'INR',
    name:         'PulseMate',
    description:  `Appointment with Dr. ${doctorName || 'Doctor'}`,
    patientName,
    patientEmail,
    patientMobile,
  });

  const handleMessage = async (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    if (msg.type === 'PAYMENT_SUCCESS') {
      setVerifying(true);
      try {
        const res = await verifyPayment({
          appointmentId,
          razorpayOrderId:   msg.razorpayOrderId,
          razorpayPaymentId: msg.razorpayPaymentId,
          razorpaySignature: msg.razorpaySignature,
        });
        const appt = res.data.data.appointment;
        // Navigate back and trigger success callback
        navigation.goBack();
        if (onSuccess) onSuccess(appt);
      } catch (err) {
        setVerifying(false);
        Alert.alert(
          'Payment Verification Failed',
          err.response?.data?.message || 'Payment was received but verification failed. Contact support.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
      return;
    }

    if (msg.type === 'PAYMENT_FAILED') {
      Alert.alert('Payment Failed', msg.error || 'Payment could not be processed. Please try again.', [
        { text: 'Try Again', onPress: () => webviewRef.current?.reload() },
        { text: 'Cancel',    style: 'cancel', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    if (msg.type === 'PAYMENT_CANCELLED') {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_D} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Complete Payment</Text>
          <Text style={s.sub}>Secured by Razorpay · ₹{((orderAmount || 0) / 100).toFixed(0)}</Text>
        </View>
        <View style={s.lockBadge}>
          <Ionicons name="lock-closed" size={12} color={WHITE} />
        </View>
      </View>

      {/* WebView */}
      <View style={{ flex: 1 }}>
        {loading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={s.loadingText}>Loading payment gateway...</Text>
          </View>
        )}

        {verifying && (
          <View style={s.verifyingOverlay}>
            <ActivityIndicator size="large" color={WHITE} />
            <Text style={s.verifyingText}>Verifying payment...</Text>
            <Text style={s.verifyingSub}>Please wait, do not close this screen</Text>
          </View>
        )}

        <WebView
          ref={webviewRef}
          source={{ html }}
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={{ flex: 1 }}
          scrollEnabled={false}
          bounces={false}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: PRIMARY_D },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: PRIMARY_D,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  title:  { fontSize: 16, fontWeight: '700', color: WHITE },
  sub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  lockBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#F0F7FF', zIndex: 10,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { fontSize: 14, color: MUTED },
  verifyingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(14,165,233,0.95)', zIndex: 20,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  verifyingText: { fontSize: 18, fontWeight: '700', color: WHITE },
  verifyingSub:  { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
});
