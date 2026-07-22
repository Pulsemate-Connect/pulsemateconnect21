import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
//  ErrorBoundary — PulseMate Connect
//
//  NEVER shows the crash screen for:
//    • Logout / Delete Account
//    • 401 / 403 / token errors
//    • Navigation resets
//    • Cancelled / aborted requests
//    • Any error during sign-out transition
// ─────────────────────────────────────────────────────────────────────────────

const SAFE_PATTERNS = [
  'logout', 'log out', 'sign out', 'signout',
  'delete account', 'deleteaccount',
  'unauthorized', '401', '403', 'forbidden',
  'token', 'accesstoken', 'refreshtoken',
  'err_canceled', 'cancelled', 'canceled', 'aborted',
  'navigation', 'navigate',
  'network request failed', 'network error',
  'cannot update a component',      // React state-update-after-unmount warning
  'unmounted component',
  'no-op',
  'securestore',
  'asyncstorage',
];

const isSafeError = (error) => {
  if (!error) return true;
  const msg = String(error?.message ?? error ?? '').toLowerCase();
  const stack = String(error?.stack ?? '').toLowerCase();
  // Check message AND stack for safety patterns
  return SAFE_PATTERNS.some((p) => msg.includes(p) || stack.includes(p));
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    if (isSafeError(error)) {
      // Safe/intentional error — do NOT show crash screen
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (isSafeError(error)) {
      // Reset just in case getDerivedStateFromError set hasError somehow
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null });
      }
      console.warn('[ErrorBoundary] Safe error suppressed:', error?.message);
      return;
    }
    console.error('[ErrorBoundary] Real crash caught:', error?.message);
    this.setState({ hasError: true, error });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={s.root}>
        <View style={s.card}>
          <Text style={s.icon}>⚠️</Text>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.msg}>Please tap Try Again or restart the app.</Text>
          <TouchableOpacity style={s.btn} onPress={this.handleReset}>
            <Text style={s.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#0C4A6E', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:  { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center' },
  icon:  { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 10, textAlign: 'center' },
  msg:   { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn:   { backgroundColor: '#0EA5E9', paddingHorizontal: 36, paddingVertical: 13, borderRadius: 10 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default ErrorBoundary;
