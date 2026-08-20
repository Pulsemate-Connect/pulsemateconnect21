const { verifyAccessToken } = require('../services/token.service');
const logger = require('../config/logger');

/**
 * Initialize Socket.io with authentication and room management
 */
const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      // Allow unauthenticated connections for queue viewing (patients)
      socket.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      // Allow connection but mark as unauthenticated
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.user?.sub || 'anonymous'}`);

    /**
     * Patient joins queue room to receive live updates
     * Room format: queue:{clinicId}:{doctorId}:{date}
     */
    socket.on('patient:joinQueueRoom', ({ clinicId, doctorId, date }) => {
      if (!clinicId || !doctorId || !date) {
        socket.emit('error', { message: 'Invalid room parameters' });
        return;
      }

      const roomName = `queue:${clinicId}:${doctorId}:${date}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room: ${roomName}`);

      socket.emit('queue:joined', { roomName, message: 'Connected to live queue' });
    });

    /**
     * Receptionist/Doctor joins queue management room
     */
    socket.on('staff:joinQueueRoom', ({ clinicId, doctorId, date }) => {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomName = `queue:${clinicId}:${doctorId}:${date}`;
      socket.join(roomName);
      logger.info(`Staff ${socket.user.sub} joined room: ${roomName}`);

      socket.emit('queue:joined', { roomName, message: 'Connected to queue management' });
    });

    /**
     * Leave queue room
     */
    socket.on('leaveQueueRoom', ({ clinicId, doctorId, date }) => {
      const roomName = `queue:${clinicId}:${doctorId}:${date}`;
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left room: ${roomName}`);
    });

    /**
     * Join clinic room for general updates
     */
    socket.on('clinic:join', ({ clinicId }) => {
      if (!clinicId) return socket.emit('error', { message: 'clinicId required' });
      const roomName = `clinic:${clinicId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined clinic room: ${roomName}`);
      socket.emit('clinic:joined', { roomName });
    });

    /**
     * Join appointment room
     */
    socket.on('appointment:join', ({ appointmentId }) => {
      if (!appointmentId) return socket.emit('error', { message: 'appointmentId required' });
      const roomName = `appointment:${appointmentId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined appointment room: ${roomName}`);
      socket.emit('appointment:joined', { roomName });
    });

    /**
     * Join notification room (user-specific)
     */
    socket.on('notification:join', ({ userId }) => {
      if (!userId) return socket.emit('error', { message: 'userId required' });
      const roomName = `user:${userId}:notifications`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined notification room: ${roomName}`);
      socket.emit('notification:joined', { roomName });
    });

    /**
     * Join doctor availability room
     */
    socket.on('doctor:joinAvailability', ({ doctorId }) => {
      if (!doctorId) return socket.emit('error', { message: 'doctorId required' });
      const roomName = `doctor:${doctorId}:availability`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined doctor availability room: ${roomName}`);
      socket.emit('doctor:availabilityJoined', { roomName });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, { error });
    });
  });

  logger.info('Socket.io initialized');
};

/**
 * Helper functions to emit events from controllers
 */
const emitQueueUpdate = (io, clinicId, doctorId, date, queueData) => {
  const roomName = `queue:${clinicId}:${doctorId}:${date}`;
  io.to(roomName).emit('queue:updated', queueData);
  logger.debug(`Emitted queue:updated to ${roomName}`);
};

const emitPatientCalled = (io, clinicId, doctorId, date, patientData) => {
  const roomName = `queue:${clinicId}:${doctorId}:${date}`;
  io.to(roomName).emit('queue:patientCalled', patientData);
  logger.info(`Emitted queue:patientCalled to ${roomName}`, { patientId: patientData.patientId });
};

const emitAppointmentUpdate = (io, appointmentId, appointmentData) => {
  const roomName = `appointment:${appointmentId}`;
  io.to(roomName).emit('appointment:updated', appointmentData);
  logger.debug(`Emitted appointment:updated to ${roomName}`);
};

const emitClinicUpdate = (io, clinicId, updateData) => {
  const roomName = `clinic:${clinicId}`;
  io.to(roomName).emit('clinic:updated', updateData);
  logger.debug(`Emitted clinic:updated to ${roomName}`);
};

const emitNotification = (io, userId, notification) => {
  const roomName = `user:${userId}:notifications`;
  io.to(roomName).emit('notification:new', notification);
  logger.info(`Emitted notification:new to ${roomName}`, { notificationId: notification.id });
};

const emitDoctorAvailabilityUpdate = (io, doctorId, availabilityData) => {
  const roomName = `doctor:${doctorId}:availability`;
  io.to(roomName).emit('doctor:availabilityUpdated', availabilityData);
  logger.debug(`Emitted doctor:availabilityUpdated to ${roomName}`);
};

const emitSessionUpdate = (io, clinicId, sessionData) => {
  const roomName = `clinic:${clinicId}`;
  io.to(roomName).emit('session:updated', sessionData);
  logger.debug(`Emitted session:updated to ${roomName}`);
};

module.exports = {
  initializeSocket,
  emitQueueUpdate,
  emitPatientCalled,
  emitAppointmentUpdate,
  emitClinicUpdate,
  emitNotification,
  emitDoctorAvailabilityUpdate,
  emitSessionUpdate,
};
