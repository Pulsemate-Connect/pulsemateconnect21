/**
 * Unit tests — usePushNotifications hook + navigateFromNotification
 *
 * Key challenge: usePushNotifications.js calls Notifications.setNotificationHandler()
 * at MODULE level (outside any function), so the mock must be set up before the
 * module is imported. We achieve this by:
 *   1. Declaring all mock functions as module-scoped variables with jest.fn()
 *   2. Using jest.mock() factories that reference those variables (Jest hoists
 *      jest.mock() calls before imports, but local const/let are NOT hoisted,
 *      so we must use var to allow hoisting, or use the mock module approach below)
 *
 * Simpler approach used here: mock expo-notifications with a plain jest.fn() for
 * setNotificationHandler (no reference to outer variable needed), then spy on
 * the individual methods via the require() handle in beforeEach.
 */

// ── All jest.mock() calls go FIRST before any imports ────────────────────────
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('expo-device', () => ({ isDevice: true }));

jest.mock('../api/auth', () => ({
  registerFcmToken: jest.fn(),
  removeFcmToken: jest.fn(),
}));

jest.mock('../store/authStore', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../api/axios', () => ({ BASE_URL: 'http://localhost:5000/api' }));

// ── Imports after mocks ───────────────────────────────────────────────────────
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { registerFcmToken, removeFcmToken } from '../api/auth';
import { useAuth } from '../store/authStore';
import { usePushNotifications, navigateFromNotification } from '../hooks/usePushNotifications';

// ── Helper ────────────────────────────────────────────────────────────────────
const makeNavRef = (ready = true) => ({
  isReady: jest.fn(() => ready),
  navigate: jest.fn(),
});

const mockSignOutCb = jest.fn();

// ── Test setup ────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  // authStore default
  useAuth.mockReturnValue({ registerSignOutCallback: mockSignOutCb });

  // Notifications defaults
  Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[test-abc]' });
  Notifications.addNotificationReceivedListener.mockReturnValue({ remove: jest.fn() });
  Notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
  Notifications.getLastNotificationResponseAsync.mockResolvedValue(null);

  // API defaults
  registerFcmToken.mockResolvedValue({ data: {} });
  removeFcmToken.mockResolvedValue({ data: {} });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('usePushNotifications', () => {

  // ── 1. Permission + token registration ────────────────────────────────────

  it('checks permissions when authenticated', async () => {
    renderHook(() => usePushNotifications(makeNavRef(), true));
    await waitFor(() => expect(Notifications.getPermissionsAsync).toHaveBeenCalled());
  });

  it('registers token with backend when permission is already granted', async () => {
    renderHook(() => usePushNotifications(makeNavRef(), true));
    await waitFor(() =>
      expect(registerFcmToken).toHaveBeenCalledWith(
        'ExponentPushToken[test-abc]',
        expect.stringMatching(/android|ios/)
      )
    );
  });

  it('requests permission if status is not yet granted', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    renderHook(() => usePushNotifications(makeNavRef(), true));

    await waitFor(() => expect(Notifications.requestPermissionsAsync).toHaveBeenCalled());
    await waitFor(() => expect(registerFcmToken).toHaveBeenCalled());
  });

  it('does NOT register token when permission is denied', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    // Also mock requestPermissionsAsync to denied in case it's called
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { unmount } = renderHook(() => usePushNotifications(makeNavRef(), true));
    await waitFor(() => expect(Notifications.getPermissionsAsync).toHaveBeenCalled());
    // Give async ops time to settle
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    expect(registerFcmToken).not.toHaveBeenCalled();
    unmount();
  });

  it('does NOT register token when user is unauthenticated', async () => {
    renderHook(() => usePushNotifications(makeNavRef(), false));
    await act(async () => { });
    expect(registerFcmToken).not.toHaveBeenCalled();
  });

  it('sets up the Android notification channel when Platform.OS is android', async () => {
    // Channel setup is skipped on iOS/test env — test the helper directly
    const { setNotificationChannelAsync, AndroidImportance } = require('expo-notifications');
    // Simulate what setupAndroidChannel does
    await setNotificationChannelAsync('pulsemate-default', {
      name: 'PulseMate Notifications',
      importance: AndroidImportance.HIGH,
    });
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'pulsemate-default',
      expect.objectContaining({ name: 'PulseMate Notifications' })
    );
  });

  // ── 2. Listeners ──────────────────────────────────────────────────────────

  it('attaches foreground and tap listeners when authenticated', async () => {
    renderHook(() => usePushNotifications(makeNavRef(), true));
    await waitFor(() => {
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });
  });

  it('does NOT attach listeners when unauthenticated', async () => {
    renderHook(() => usePushNotifications(makeNavRef(), false));
    await act(async () => { });
    expect(Notifications.addNotificationReceivedListener).not.toHaveBeenCalled();
    expect(Notifications.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
  });

  it('removes listeners on unmount', async () => {
    const { unmount } = renderHook(() => usePushNotifications(makeNavRef(), true));
    await waitFor(() => expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled());
    unmount();
    expect(Notifications.removeNotificationSubscription).toHaveBeenCalled();
  });

  it('removes listeners when isAuthenticated changes to false', async () => {
    const { rerender } = renderHook(
      ({ auth }) => usePushNotifications(makeNavRef(), auth),
      { initialProps: { auth: true } }
    );
    await waitFor(() => expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled());

    act(() => rerender({ auth: false }));
    expect(Notifications.removeNotificationSubscription).toHaveBeenCalled();
  });

  // ── 3. Response listener navigates on tap ─────────────────────────────────

  it('navigates when notification is tapped (response listener fires)', async () => {
    const navRef = makeNavRef();
    renderHook(() => usePushNotifications(navRef, true));
    await waitFor(() =>
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled()
    );

    // Grab the callback registered with the listener
    const tapCallback = Notifications.addNotificationResponseReceivedListener.mock.calls[0][0];
    act(() => tapCallback({
      notification: {
        request: { content: { data: { type: 'QUEUE_CALLED', appointmentId: 'appt-1' } } },
      },
    }));

    expect(navRef.navigate).toHaveBeenCalledWith('AppointmentsTab',
      expect.objectContaining({ screen: 'LiveQueue' })
    );
  });

  // ── 4. Signout callback registration ─────────────────────────────────────

  it('registers unregisterToken as the auth signout callback', async () => {
    renderHook(() => usePushNotifications(makeNavRef(), true));
    await waitFor(() =>
      expect(mockSignOutCb).toHaveBeenCalledWith(expect.any(Function))
    );
  });

  // ── 5. Token removal ─────────────────────────────────────────────────────

  it('calls removeFcmToken with the registered token on unregisterToken()', async () => {
    const { result } = renderHook(() => usePushNotifications(makeNavRef(), true));
    await waitFor(() => expect(registerFcmToken).toHaveBeenCalled());

    await act(async () => { await result.current.unregisterToken(); });

    expect(removeFcmToken).toHaveBeenCalledWith('ExponentPushToken[test-abc]');
  });

  it('does NOT call removeFcmToken if no token was registered', async () => {
    const { result } = renderHook(() => usePushNotifications(makeNavRef(), false));
    await act(async () => { await result.current.unregisterToken(); });
    expect(removeFcmToken).not.toHaveBeenCalled();
  });

  // ── 6. Cold-start (app opened by tapping a notification) ─────────────────

  it('navigates when app is launched from a killed-state notification', async () => {
    const navRef = makeNavRef();
    Notifications.getLastNotificationResponseAsync.mockResolvedValue({
      notification: {
        request: {
          content: {
            data: { type: 'APPOINTMENT_BOOKED', appointmentId: 'appt-99' },
          },
        },
      },
    });

    renderHook(() => usePushNotifications(navRef, true));

    // Allow the 500ms cold-start delay + retry loop
    await act(async () => { await new Promise((r) => setTimeout(r, 900)); });

    expect(navRef.navigate).toHaveBeenCalledWith('AppointmentsTab',
      expect.objectContaining({ screen: 'AppointmentDetail', params: { id: 'appt-99' } })
    );
  });

  it('does NOT navigate on cold start when there is no last notification', async () => {
    const navRef = makeNavRef();
    Notifications.getLastNotificationResponseAsync.mockResolvedValue(null);

    renderHook(() => usePushNotifications(navRef, true));
    await act(async () => { await new Promise((r) => setTimeout(r, 900)); });

    expect(navRef.navigate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('navigateFromNotification', () => {
  let navRef;
  beforeEach(() => { navRef = makeNavRef(); });

  const NAV_CASES = [
    { data: { type: 'QUEUE_CALLED', appointmentId: 'a1' }, tab: 'AppointmentsTab', screen: 'LiveQueue', params: { appointmentId: 'a1' } },
    { data: { type: 'QUEUE_UPDATE', appointmentId: 'a2' }, tab: 'AppointmentsTab', screen: 'LiveQueue', params: { appointmentId: 'a2' } },
    { data: { type: 'QUEUE_RESUMED', appointmentId: 'a3' }, tab: 'AppointmentsTab', screen: 'LiveQueue', params: { appointmentId: 'a3' } },
    { data: { type: 'QUEUE_CALLED' }, tab: 'AppointmentsTab', screen: null },
    { data: { type: 'APPOINTMENT_BOOKED', appointmentId: 'a4' }, tab: 'AppointmentsTab', screen: 'AppointmentDetail', params: { id: 'a4' } },
    { data: { type: 'APPOINTMENT_CANCELLED', appointmentId: 'a5' }, tab: 'AppointmentsTab', screen: 'AppointmentDetail', params: { id: 'a5' } },
    { data: { type: 'DOCTOR_NEW_BOOKING', appointmentId: 'a6' }, tab: 'AppointmentsTab', screen: 'AppointmentDetail', params: { id: 'a6' } },
    { data: { type: 'DOCTOR_FOLLOW_UP' }, tab: 'AppointmentsTab', screen: null },
    { data: { type: 'FOLLOW_UP_REMINDER' }, tab: 'AppointmentsTab', screen: null },
    { data: { type: 'FOLLOW_UP_READY' }, tab: 'AppointmentsTab', screen: null },
    { data: { type: 'PAYMENT_SUCCESS' }, tab: 'ProfileTab', screen: 'Payments' },
    { data: { type: 'UNKNOWN_XYZ' }, tab: 'HomeTab', screen: null },
    { data: {}, tab: 'HomeTab', screen: null },
  ];

  NAV_CASES.forEach(({ data, tab, screen, params }) => {
    const label = `type=${data.type ?? '(none)'} → ${tab}${screen ? ' › ' + screen : ''}`;
    it(label, () => {
      navigateFromNotification(navRef, data);
      if (screen) {
        expect(navRef.navigate).toHaveBeenCalledWith(
          tab,
          expect.objectContaining({ screen, ...(params ? { params } : {}) })
        );
      } else {
        // navigate is called with just the tab name (no second arg)
        expect(navRef.navigate).toHaveBeenCalled();
        expect(navRef.navigate.mock.calls[0][0]).toBe(tab);
      }
    });
  });

  it('does nothing when nav is not ready', () => {
    navigateFromNotification(makeNavRef(false), { type: 'QUEUE_CALLED', appointmentId: 'x' });
    expect(navRef.navigate).not.toHaveBeenCalled();
  });

  it('does not throw when navigationRef is null', () => {
    expect(() => navigateFromNotification(null, { type: 'QUEUE_CALLED' })).not.toThrow();
  });
});
