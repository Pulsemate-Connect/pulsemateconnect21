import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = 'https://api.pulsemateconnect.in';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    // Use SecureStore (consistent with the rest of the app)
    let token = null;
    try {
      token = await SecureStore.getItemAsync('accessToken');
    } catch (e) {
      console.warn('[Socket] Could not read token:', e?.message);
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.warn('[Socket] Error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (e) {
        console.warn('[Socket] Disconnect error (non-fatal):', e?.message);
      }
      this.socket = null;
      this.connected = false;
      console.log('[Socket] Disconnected cleanly');
    }
  }

  // ── Room joins ───────────────────────────────────────────────────────────
  joinClinicRoom(clinicId) {
    if (!this.socket?.connected) return;
    this.socket.emit('clinic:join', { clinicId });
  }

  joinQueueRoom(clinicId, doctorId, date) {
    if (!this.socket?.connected) return;
    this.socket.emit('patient:joinQueueRoom', { clinicId, doctorId, date });
  }

  joinNotificationRoom(userId) {
    if (!this.socket?.connected) return;
    this.socket.emit('notification:join', { userId });
  }

  // ── Event listeners ──────────────────────────────────────────────────────
  onQueueUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('queue:updated', callback);
  }

  onPatientCalled(callback) {
    if (!this.socket) return;
    this.socket.on('queue:patientCalled', callback);
  }

  onNotification(callback) {
    if (!this.socket) return;
    this.socket.on('notification:new', callback);
  }

  onAppointmentUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('appointment:updated', callback);
  }

  onClinicUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('clinic:updated', callback);
  }

  off(event) {
    if (!this.socket) return;
    this.socket.off(event);
  }
}

export default new SocketService();
