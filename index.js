import { registerRootComponent } from 'expo';
import App from './App';

// ── Suppress known-safe errors from crashing the app ──────────────────────────
const SAFE_PATTERNS = [
  'logout', 'sign out', 'signout',
  'delete account',
  'unauthorized', 'token',
  'err_canceled', 'cancelled', 'canceled', 'aborted',
  'navigation', 'cannot update a component', 'unmounted',
  'network request failed',
  'securestore', 'asyncstorage',
  'no-op',
];

const isSafeError = (err) => {
  const msg = String(err?.message ?? err ?? '').toLowerCase();
  return SAFE_PATTERNS.some((p) => msg.includes(p));
};

// Global handler — catches uncaught JS errors
ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (isSafeError(error)) {
    // Safe/expected error during logout or navigation transition — suppress it
    console.warn('[GlobalHandler] Suppressed safe error:', error?.message);
    return;
  }
  console.error('[GlobalHandler] Unhandled error (fatal=' + isFatal + '):', error?.message);
});

registerRootComponent(App);
