/**
 * useQueueSocket — PulseMate Mobile
 *
 * Manages the full Socket.io lifecycle for the Live Queue screen.
 *
 * Features:
 *  - Connects once roomName is known (derived from initial REST fetch)
 *  - Listens to all 6 queue events: updated, called, positionUpdated,
 *    paused, resumed, completed
 *  - Deduplicates listeners: clears old handlers before re-registering
 *  - Automatic reconnect (socket.io built-in, 5 attempts, 2s delay)
 *  - 30-second polling fallback when socket is offline / connect_error
 *  - Stops polling immediately when socket reconnects
 *  - Cleans up socket + interval on unmount or appointmentId change
 *  - Exposes: { socketState, lastUpdated, manualRefresh }
 *
 * Socket states: 'connecting' | 'live' | 'offline'
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../api/axios';
import { getLiveQueue } from '../api/patient';

// Strip /api suffix — socket server lives at root
const SOCKET_URL = BASE_URL.replace('/api', '');

// Polling interval when socket is offline (ms)
const POLL_INTERVAL_MS = 30_000;

// Max reconnect attempts before giving up and staying on polling
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * @param {string}   appointmentId  - The appointment to track
 * @param {function} onData         - Called with fresh { appointment, queueInfo } on every update
 * @param {function} onError        - Optional. Called when fetch throws.
 *
 * @returns {{ socketState: string, lastUpdated: Date|null, manualRefresh: function }}
 */
export function useQueueSocket(appointmentId, onData, onError) {
  const [socketState, setSocketState] = useState('connecting');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Internal refs — never trigger re-renders
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const roomRef = useRef(null);      // last known roomName
  const onDataRef = useRef(onData);    // keep stable ref so socket callbacks don't capture stale closures
  const onErrorRef = useRef(onError);

  // Keep callback refs up-to-date without reconnecting
  useEffect(() => { onDataRef.current = onData; }, [onData]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // ── Core fetch ──────────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      const res = await getLiveQueue(appointmentId);
      const payload = res.data?.data ?? res.data;
      onDataRef.current?.(payload);
      setLastUpdated(new Date());

      // If we now have a roomName and no live socket, connect
      const room = payload?.queueInfo?.roomName;
      if (room && room !== roomRef.current) {
        roomRef.current = room;
      }
      return payload;
    } catch (err) {
      onErrorRef.current?.(err);
    }
  }, [appointmentId]);

  // ── Polling fallback ────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already running
    pollRef.current = setInterval(() => {
      fetchQueue();
    }, POLL_INTERVAL_MS);
  }, [fetchQueue]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Register all queue event listeners ─────────────────────────────────────
  const registerListeners = useCallback((socket) => {
    const QUEUE_EVENTS = [
      'queue:updated',
      'queue:positionUpdated',
      'queue:called',
      'queue:paused',
      'queue:resumed',
      'queue:completed',
    ];

    // Remove old listeners first — prevents duplicates on reconnect
    QUEUE_EVENTS.forEach((event) => socket.off(event));

    // All events trigger a silent re-fetch to get latest authoritative state
    QUEUE_EVENTS.forEach((event) => {
      socket.on(event, () => {
        fetchQueue();
      });
    });
  }, [fetchQueue]);

  // ── Socket connect ──────────────────────────────────────────────────────────
  const connectSocket = useCallback(async (room) => {
    // Tear down any existing socket
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    let token = null;
    try {
      token = await SecureStore.getItemAsync('accessToken');
    } catch (_) { /* SecureStore unavailable in test env */ }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socketRef.current = socket;

    // ── Lifecycle events ──────────────────────────────────────────────────────
    socket.on('connect', () => {
      setSocketState('live');
      stopPolling(); // socket is back — no need for polling

      // Parse room parts: queue:{clinicId}:{doctorId}:{date}
      const parts = room.split(':');
      socket.emit('patient:joinQueueRoom', {
        clinicId: parts[1],
        doctorId: parts[2],
        date: parts[3],
      });
    });

    socket.on('queue:joined', () => {
      setSocketState('live');
      // Fresh fetch right after joining to sync any missed updates
      fetchQueue();
    });

    socket.on('disconnect', (reason) => {
      setSocketState('offline');
      // Start fallback polling — socket will auto-reconnect in background
      startPolling();
    });

    socket.on('connect_error', () => {
      setSocketState('offline');
      startPolling();
    });

    socket.on('reconnect', () => {
      setSocketState('live');
      stopPolling();
      // Re-join room after reconnect
      const parts = room.split(':');
      socket.emit('patient:joinQueueRoom', {
        clinicId: parts[1],
        doctorId: parts[2],
        date: parts[3],
      });
    });

    socket.on('reconnect_failed', () => {
      setSocketState('offline');
      startPolling();
    });

    // ── Queue data events ─────────────────────────────────────────────────────
    registerListeners(socket);
  }, [fetchQueue, startPolling, stopPolling, registerListeners]);

  // ── Bootstrap effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appointmentId) return;

    setSocketState('connecting');

    // Step 1: initial REST load — this gives us the roomName
    fetchQueue().then((payload) => {
      const room = payload?.queueInfo?.roomName;
      if (room) {
        roomRef.current = room;
        connectSocket(room);
      } else {
        // No room yet (appointment not in queue) — stay on polling
        setSocketState('offline');
        startPolling();
      }
    });

    return () => {
      stopPolling();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketState('connecting');
    };
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ Intentionally omit function deps — we want this to run only when appointmentId changes.
  //   The latest function refs are always read from the closure or via refs.

  // ── Manual refresh (tap LIVE/OFFLINE badge) ─────────────────────────────────
  const manualRefresh = useCallback(() => {
    fetchQueue();
  }, [fetchQueue]);

  return { socketState, lastUpdated, manualRefresh };
}
