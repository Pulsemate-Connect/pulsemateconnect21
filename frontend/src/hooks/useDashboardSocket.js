import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import throttle from 'lodash.throttle';
import useAuthStore from '../store/authStore';

// Strip trailing /api so the socket connects to the base server URL
const SOCKET_URL =
  (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : '');

/**
 * useDashboardSocket
 *
 * Connects to the Socket.io server and subscribes to `clinic:updated` events
 * for the given clinic room. Routes each event type to the appropriate callback,
 * applying throttling where specified.
 *
 * @param {string} clinicId - The clinic whose room to join
 * @param {{
 *   onNewAppointment: function,
 *   onAppointmentCompleted: function,
 *   onNewPayment: function,
 *   onQueueUpdated: function,
 * }} callbacks - Event callbacks
 * @param {{ doctorId?: string }} [filters] - Active dashboard filters; used to
 *   gate events so only relevant updates are dispatched.
 * @returns {{ connected: boolean, reconnecting: boolean }}
 */
function useDashboardSocket(clinicId, callbacks = {}, filters = {}) {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Keep a stable ref to callbacks so the effect doesn't re-run when they change
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  });

  useEffect(() => {
    if (!clinicId) return;

    const token = useAuthStore.getState().accessToken;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // ── Throttled handlers (created once; cancelled on unmount) ──────────────
    const throttledNewAppointment = throttle((payload) => {
      callbacksRef.current.onNewAppointment?.(payload);
    }, 5000);

    const throttledNewPayment = throttle((payload) => {
      callbacksRef.current.onNewPayment?.(payload);
    }, 5000);

    const throttledQueueUpdated = throttle((payload) => {
      callbacksRef.current.onQueueUpdated?.(payload);
    }, 5000);

    // ── Connection lifecycle ─────────────────────────────────────────────────
    socket.on('connect', () => {
      socket.emit('clinic:join', { clinicId });
      setConnected(true);
      setReconnecting(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setReconnecting(true);
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setReconnecting(true);
    });

    socket.on('reconnect', () => {
      setReconnecting(false);
    });

    // ── clinic:updated event routing ─────────────────────────────────────────
    socket.on('clinic:updated', (payload) => {
      const { type, appointment, payment } = payload || {};

      // Filter gate: skip if a doctorId filter is active and doesn't match
      const activeDoctorId = filtersRef.current?.doctorId;
      if (activeDoctorId) {
        const eventDoctorId =
          appointment?.doctorId ?? payment?.doctorId ?? null;
        if (eventDoctorId && eventDoctorId !== activeDoctorId) {
          return;
        }
      }

      switch (type) {
        case 'new-appointment':
          throttledNewAppointment(payload);
          break;

        case 'appointment-completed':
          callbacksRef.current.onAppointmentCompleted?.(payload);
          break;

        case 'new-payment':
          throttledNewPayment(payload);
          break;

        case 'queue-updated':
          throttledQueueUpdated(payload);
          break;

        default:
          break;
      }
    });

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      throttledNewAppointment.cancel();
      throttledNewPayment.cancel();
      throttledQueueUpdated.cancel();
      socket.disconnect();
    };
  }, [clinicId]); // only re-run when clinicId changes; callbacks/filters kept fresh via refs

  return { connected, reconnecting };
}

export default useDashboardSocket;
