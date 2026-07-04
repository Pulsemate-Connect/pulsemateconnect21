// ─────────────────────────────────────────────────────────────────────────────
//  RazorpayScreen — PulseMate Connect
//
//  Renders Razorpay checkout inside a WebView.
//  Works in Expo Go without any native module.
//
//  Navigation flow:
//    BookingScreen ─navigate('Razorpay', params)─> RazorpayScreen
//    RazorpayScreen ─navigation.navigate('Booking', { paymentResult })─> BookingScreen
//
//  NOTE: React Navigation drops functions from params (they get serialized).
//  We return the result back to BookingScreen via navigation.navigate() with
//  a paymentResult param, which BookingScreen reads via useFocusEffect/route.params.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { verifyPayment } from '../api/patient';

const PRIMARY   = '#0EA5E9';
const PRIMARY_D = '#0284C7';
const WHITE     = '#FFFFFF';
const MUTED     = '#94A3B8';

// ─────────────────────────────────────────────────────────────────────────────
// Build the Razorpay checkout HTML injected into the WebView.
// ─────────────────────────────────────────────────────────────────────────────
const buildCheckoutHTML = ({
  keyId, orderId, amount, currency,
  patientName, patientEmail, patientMobile, doctorName,
}) => `
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
    .amount { font-size: 42px; font-weight: 900; color: #0F172A; margin-bottom: 4px; }
    .amount-sub { color: #64748B; font-size: 13px; margin-bottom: 28px; }
    .btn {
      background: #0EA5E9; color: white; border: none;
      padding: 16px 32px; border-radius: 14px; font-size: 16px;
      font-weight: 700; cursor: pointer; width: 100%;
    }
    .btn:disabled { background: #94A3B8; cursor: not-allowed; }
    .cancel { margin-top: 14px; color: #94A3B8; font-size: 13px; cursor: pointer; }
    .secure { display: flex; align-items: center; justify-content: center;
              gap: 6px; margin-top: 20px; color: #94A3B8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Pulse<span>Mate</span></div>
    <div class="sub">Appointment Booking Fee</div>
    <div class="amount">&#8377;${Math.round(amount / 100)}</div>
    <div class="amount-sub">Appointment with Dr. ${(doctorName || 'Doctor').replace(/'/g, "\\'")}</div>
    <button class="btn" id="payBtn" onclick="openRazorpay()">
      Pay &#8377;${Math.round(amount / 100)}
    </button>
    <div class="cancel" onclick="cancelPayment()">Cancel booking</div>
    <div class="secure">&#128274; Secured by Razorpay &middot; 256-bit SSL</div>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    var options = {
      key:         '${keyId}',
      amount:      ${amount},
      currency:    '${currency || 'INR'}',
      order_id:    '${orderId}',
      name:        'PulseMate Connect',
      description: 'Appointment Booking Fee',
      prefill: {
        name:    '${(patientName  || '').replace(/'/g, "\\'")}',
        email:   '${(patientEmail || '').replace(/'/g, "\\'")}',
        contact: '${(patientMobile || '').replace(/'/g, "\\'")}',
      },
      theme: { color: '#0EA5E9' },
      modal: { ondismiss: function() { cancelPayment(); } },
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:              'PAYMENT_SUCCESS',
          razorpayOrderId:   response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }));
      }
    };

    function openRazorpay() {
      var btn = document.getElementById('payBtn');
      btn.disabled = true;
      btn.textContent = 'Opening payment...';
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

    // Auto-open after short delay for better UX
    setTimeout(openRazorpay, 500);
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
  } = route.params;

  const [loading,   setLoading]   = useState(true);
  const [verifying, setVerifying] = useState(false);
  const webviewRef = useRef(null);

  const html = buildCheckoutHTML({
    keyId,
    orderId,
    amount:       orderAmount,
    currency:     orderCurrency || 'INR',
    doctorName,
    patientName,
    patientEmail,
    patientMobile,
  });

  const handleMessage = async (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    // ── Payment successful in Razorpay UI ────────────────────────────────────
    if (msg.type === 'PAYMENT_SUCCESS') {
      setVerifying(true);
      try {
        const res = await verifyPayment({
          appointmentId,
          razorpayOrderId:   msg.razorpayOrderId,
          razorpayPaymentId: msg.razorpayPaymentId,
          razorpaySignature: msg.razorpaySignature,
        });
        const confirmedAppt = res.data.data.appointment;

        // ── Return result to BookingScreen via navigation params ─────────────
        // Functions cannot be passed as nav params (they get serialized/lost).
        // Instead we navigate back and pass the result as a param.
        navigation.navigate('Booking', {
          paymentResult: {
            success: true,
            appointment: confirmedAppt,
          },
        });
      } catch (err) {
        setVerifying(false);
        // Navigate to PaymentStatus screen which will poll until confirmed
        // This handles the case where verify call fails but payment may have succeeded
        navigation.navigate('PaymentStatus', {
          appointmentId,
          orderId:         msg.razorpayOrderId,
          amount:          Math.round((orderAmount || 0) / 100),
          doctorName,
          clinicName:      route.params?.clinicName || '',
          appointmentDate: route.params?.appointmentDate || '',
        });
      }
      return;
    }

    // ── Payment failed in Razorpay UI ────────────────────────────────────────
    if (msg.type === 'PAYMENT_FAILED') {
      Alert.alert(
        'Payment Failed',
        msg.error || 'Payment could not be processed. Please try again.',
        [
          { text: 'Try Again', onPress: () => webviewRef.current?.reload() },
          { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    // ── User dismissed the Razorpay modal ────────────────────────────────────
    if (msg.type === 'PAYMENT_CANCELLED') {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_D} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          disabled={verifying}
        >
          <Ionicons name="close" size={20} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Complete Payment</Text>
          <Text style={s.sub}>
            Secured by Razorpay · ₹{Math.round((orderAmount || 0) / 100)}
          </Text>
        </View>
        <View style={s.lockBadge}>
          <Ionicons name="lock-closed" size={12} color={WHITE} />
        </View>
      </View>

      {/* WebView area */}
      <View style={{ flex: 1 }}>
        {/* Loading overlay while HTML loads */}
        {loading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={s.loadingText}>Loading payment gateway...</Text>
          </View>
        )}

        {/* Verifying overlay after payment — prevents user from closing */}
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
          // Critical: Allow Razorpay to open UPI apps and bank pages on Android.
          // Razorpay uses intent:// and upi:// URLs to open payment apps.
          // Without this handler, those URLs are blocked by the WebView and
          // the payment sheet never appears.
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;
            // Let Razorpay's own pages load normally inside WebView
            if (
              url.startsWith('https://api.razorpay.com') ||
              url.startsWith('https://checkout.razorpay.com') ||
              url.startsWith('about:blank') ||
              url === 'about:srcdoc'
            ) {
              return true;
            }
            // Open UPI / intent / payment app URLs in the native OS
            if (
              url.startsWith('intent://') ||
              url.startsWith('upi://') ||
              url.startsWith('phonepe://') ||
              url.startsWith('gpay://') ||
              url.startsWith('paytmmp://') ||
              url.startsWith('bhim://') ||
              url.startsWith('tez://') ||
              url.startsWith('credpay://') ||
              url.startsWith('amazonpay://') ||
              url.startsWith('mobikwik://') ||
              url.startsWith('freecharge://')
            ) {
              Linking.openURL(url).catch(() => {
                Alert.alert(
                  'App not installed',
                  'The payment app is not installed on your device. Please choose a different payment method.',
                );
              });
              return false; // don't load in WebView
            }
            // Allow everything else (bank redirects, etc.)
            return true;
          }}
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
  title:    { fontSize: 16, fontWeight: '700', color: WHITE },
  sub:      { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  lockBadge:{
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
