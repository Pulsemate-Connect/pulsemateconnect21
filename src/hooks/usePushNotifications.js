// ─────────────────────────────────────────────────────────────────────────────
//  usePushNotifications — PulseMate Connect
//
//  SDK 53 BREAKING CHANGE:
//  expo-notifications addPushTokenListener fires at native-module init time
//  and crashes Expo Go.  The ONLY safe fix is to NOT import the module at all
//  in Expo Go — so we use dynamic require() gated behind the Expo Go check.
//
//  Everything still works in Expo Go except remote push tokens.
//  Tap-to-navigate, foreground banners — all fine once in a dev/prod build.
//
//  For real push: npx expo run:android  OR  eas build --profile development
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerFcmToken, removeFcmToken } from '../api/auth';

// Detect Expo Go — appOwnership === 'expo' means Expo Go
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// ── Safe notification accessor ─────────────────────────────────────────────
// Returns the real expo-notifications module in dev/prod builds.
// Returns a no-op stub in Expo Go to avoid the native crash.
const getNotifications = () => {
  if (IS_EXPO_GO) {
    // Stub: every method is a safe no-op
    const noop = () => { };
    const noopSub = () => ({ remove: noop });
    return {
      setNotificationHandler: noop,
      setNotificationChannelAsync: () => Promise.resolve(),
      getPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
      requestPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
      getExpoPushTokenAsync: () => Promise.resolve({ data: null }),
      addNotificationReceivedListener: noopSub,
      addNotificationResponseReceivedListener: noopSub,
      removeNotificationSubscription: noop,
      AndroidImportance: { HIGH: 4 },
      AndroidNotificationVisibility: { PUBLIC: 1 },
    };
  }
  // Real module — safe to load in dev/prod builds
  // eslint-disable-next-line import/no-extraneous-dependencies
  return require('expo-notifications');
};

// Set foreground handler once (no-op stub in Expo Go, real call in dev/prod build)
// Must run after getNotifications() is defined but before any hook usage.
if (!IS_EXPO_GO) {
  // Only call setNotificationHandler in a real build — safe to require here
  const N = require('expo-notifications');
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ── Notification → screen mapping ────────────────────────────────────────────
const getNavigationTarget = (data = {}) => {
  const { type, appointmentId } = data;
  switch (type) {
    case 'QUEUE_CALLED':
    case 'QUEUE_UPDATE':
    case 'QUEUE_RESUMED':
    case 'QUEUE_PAUSED':
      return appointmentId
        ? { screen: 'AppointmentsTab', params: { screen: 'AppointmentDetail', params: { id: appointmentId } } }
        : { screen: 'AppointmentsTab' };
    case 'APPOINTMENT_BOOKED':
    case 'APPOINTMENT_CANCELLED':
    case 'APPOINTMENT_REMINDER':
      return appointmentId
        ? { screen: 'AppointmentsTab', params: { screen: 'AppointmentDetail', params: { id: appointmentId } } }
        : { screen: 'AppointmentsTab' };
    case 'DOCTOR_NEW_BOOKING':
    case 'DOCTOR_FOLLOW_UP':
      return { screen: 'AppointmentsTab' };
    case 'DAILY_DIGEST':
      return { screen: 'ProfileTab' };
    default:
      return { screen: 'HomeTab', params: { screen: 'Notifications' } };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const usePushNotifications = (navigationRef, isAuthenticated = false) => {
  const tokenRef = useRef(null);
  const notifListener = useRef(null);
  const responseListener = useRef(null);

  // ── Remote token (dev/prod build only) ────────────────────────────────────
  const registerToken = useCallback(async () => {
    if (IS_EXPO_GO) {
      console.log('[Push] Expo Go — push notifications disabled. Use a dev build.');
      return;
    }

    const N = getNotifications();
    const Device = require('expo-device');

    if (!Device.isDevice) {
      console.log('[Push] Skipping — not a physical device');
      return;
    }

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'PulseMate Connect Notifications',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0EA5E9',
        lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied');
      return;
    }

    let token;
    try {
      const result = await N.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      token = result.data;
    } catch (err) {
      console.warn('[Push] getExpoPushTokenAsync failed:', err.message);
      return;
    }

    if (!token) return;
    tokenRef.current = token;

    try {
      await registerFcmToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
      console.log('[Push] Token registered ✓');
    } catch (err) {
      console.warn('[Push] Backend registration failed:', err.message);
    }
  }, []);

  // ── Listeners (stub in Expo Go — remove() is safe no-op) ─────────────────
  const subscribe = useCallback(() => {
    const N = getNotifications();

    notifListener.current = N.addNotificationReceivedListener((notification) => {
      const type = notification.request.content.data?.type;
      console.log('[Push] Foreground notification:', type);
    });

    responseListener.current = N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      const target = getNavigationTarget(data);
      if (!navigationRef?.current?.isReady?.()) return;
      try {
        if (target.params) {
          navigationRef.current.navigate(target.screen, target.params);
        } else {
          navigationRef.current.navigate(target.screen);
        }
      } catch (err) {
        console.warn('[Push] Navigate on tap failed:', err.message);
      }
    });
  }, [navigationRef]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const unregister = useCallback(async () => {
    const N = getNotifications();
    if (tokenRef.current) {
      try { await removeFcmToken(tokenRef.current); } catch { }
      tokenRef.current = null;
    }
    if (notifListener.current) {
      N.removeNotificationSubscription(notifListener.current);
      notifListener.current = null;
    }
    if (responseListener.current) {
      N.removeNotificationSubscription(responseListener.current);
      responseListener.current = null;
    }
  }, []);

  // ── Effect ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      unregister();
      return;
    }
    registerToken();
    subscribe();

    return () => {
      const N = getNotifications();
      if (notifListener.current) N.removeNotificationSubscription(notifListener.current);
      if (responseListener.current) N.removeNotificationSubscription(responseListener.current);
    };
  }, [isAuthenticated, registerToken, subscribe, unregister]);
};

export { usePushNotifications };
export default usePushNotifications;
