import { registerRootComponent } from 'expo';
import App from './App';

// Global error handlers to prevent crashes
console.log('[Index] Setting up global error handlers');

// Catch unhandled promise rejections
if (typeof global.Promise !== 'undefined') {
  const originalPromiseReject = Promise.reject;
  Promise.reject = function (reason) {
    console.error('[Index] Unhandled Promise Rejection:', reason);
    return originalPromiseReject.call(this, reason);
  };
}

// Catch global errors
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('[Index] Global Error:', error);
  console.error('[Index] Is Fatal:', isFatal);
  console.error('[Index] Stack:', error.stack);
  
  if (isFatal) {
    console.error('[Index] FATAL ERROR - App will crash');
  }
});

console.log('[Index] Registering root component');
registerRootComponent(App);
console.log('[Index] Root component registered');
