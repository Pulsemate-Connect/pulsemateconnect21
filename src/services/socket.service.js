import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'https://api.pulsemateconnect.in';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    const token = await AsyncStorage.getItem('accessToken');
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Join clinic room
  joinClinicRoom(clinicId) {
    if (!this.socket) return;
    this.socket.emit('clinic:join', { clinicId });
  }

  // Join queue room
  joinQueueRoom(clinicId, doctorId, date) {
    if (!this.socket) return;
    this.socket.emit('patient:joinQueueRoom', { clinicId, doctorId, date });
  }

  // Join notification room
  joinNotificationRoom(userId) {
    if (!this.socket) return;
    this.socket.emit('notification:join', { userId });
  }

  // Listen for queue updates
  onQueueUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('queue:updated', callback);
  }

  // Listen for patient called
  onPatientCalled(callback) {
    if (!this.socket) return;
    this.socket.on('queue:patientCalled', callback);
  }

  // Listen for notifications
  onNotification(callback) {
    if (!this.socket) return;
    this.socket.on('notification:new', callback);
  }

  // Listen for appointment updates
  onAppointmentUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('appointment:updated', callback);
  }

  // Listen for clinic updates
  onClinicUpdate(callback) {
    if (!this.socket) return;
    this.socket.on('clinic:updated', callback);
  }

  // Remove listeners
  off(event) {
    if (!this.socket) return;
    this.socket.off(event);
  }
}

export default new SocketService();
