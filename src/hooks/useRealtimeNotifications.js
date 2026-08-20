/**
 * ============================================================================
 * REAL-TIME NOTIFICATIONS HOOK
 * ============================================================================
 * Socket.IO integration for real-time notifications, queue updates, etc.
 * ============================================================================
 */

import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../store/authStore';
import { BACKEND_URL } from '../config/api';

let socket = null;

export const useRealtimeNotifications = (onNotification, onQueueUpdate, onUnreadCount) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // ── Connect to Socket.IO ────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!user || !token) {
      console.log('[SOCKET] No user/token, skipping connection');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('[SOCKET] Already connected');
      return;
    }

    console.log('[SOCKET] Connecting...');

    socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // ── Connection Events ────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('[SOCKET] Connected:', socket.id);
      reconnectAttemptsRef.current = 0;
    });

    socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error.message);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('[SOCKET] Max reconnection attempts reached');
        socket.disconnect();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason);
    });

    // ── Notification Events ──────────────────────────────────────────────
    socket.on('notification:new', async (notification) => {
      console.log('[SOCKET] New notification received:', notification.type);
      
      // Show local notification if app is in foreground
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            notificationId: notification.id,
            referenceType: notification.referenceType,
            referenceId: notification.referenceId,
          },
        },
        trigger: null, // Immediate
      });

      // Call callback
      if (onNotification) {
        onNotification(notification);
      }
    });

    socket.on('notification:unread-count', (data) => {
      console.log('[SOCKET] Unread count:', data.count);
      if (onUnreadCount) {
        onUnreadCount(data.count);
      }
    });

    // ── Queue Events ─────────────────────────────────────────────────────
    socket.on('queue:update', (queueData) => {
      console.log('[SOCKET] Queue update:', queueData);
      if (onQueueUpdate) {
        onQueueUpdate(queueData);
      }
    });

    socket.on('queue:your-turn', async (data) => {
      console.log('[SOCKET] Your turn!');
      
      // Show urgent local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🩺 Your Turn',
          body: `Please proceed to Dr. ${data.doctorName}'s consultation room`,
          data: data,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    });

    socket.on('queue:almost-your-turn', async (data) => {
      console.log('[SOCKET] Almost your turn');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 You\'re Next!',
          body: 'Please be ready. Your consultation will begin shortly.',
          data: data,
        },
        trigger: null,
      });
    });

    // ── Appointment Events ───────────────────────────────────────────────
    socket.on('appointment:update', (appointmentData) => {
      console.log('[SOCKET] Appointment update:', appointmentData);
    });

    socket.on('appointment:cancelled', async (data) => {
      console.log('[SOCKET] Appointment cancelled');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '❌ Appointment Cancelled',
          body: data.message || 'Your appointment has been cancelled',
          data: data,
        },
        trigger: null,
      });
    });

  }, [user, token, onNotification, onQueueUpdate, onUnreadCount]);

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[SOCKET] Disconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // ── Effect ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, token, connect, disconnect]);

  // ── Emit Events ──────────────────────────────────────────────────────────
  const emitEvent = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[SOCKET] Not connected, cannot emit:', event);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    emit: emitEvent,
    reconnect: connect,
  };
};

export default useRealtimeNotifications;
