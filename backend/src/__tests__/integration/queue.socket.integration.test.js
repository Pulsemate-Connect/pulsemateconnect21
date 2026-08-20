'use strict';
/**
 * Integration test — Queue Socket.io end-to-end flow
 *
 * Tests the full real-time pipeline:
 *   Patient joins queue room → Receptionist calls next → Patient receives queue:called event
 *
 * Uses a real http server + real socket.io instance (no mocking of socket layer).
 * Does NOT use Prisma at all — socket layer has no DB dependency.
 *
 * @jest-environment node
 */

// Override setupFilesAfterEnv for this file — we don't need Prisma mock
jest.mock('../../config/database', () => ({}));
jest.mock('../../config/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));

const http = require('http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const { initializeSocket } = require('../../socket/index');

// ── Token service mock ────────────────────────────────────────────────────────
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'test-token-staff'),
  generateRefreshToken: jest.fn(() => 'test-refresh'),
  verifyAccessToken: jest.fn((t) => {
    if (t === 'test-token-staff') return { sub: 'staff-1', role: 'RECEPTIONIST' };
    if (t === 'test-token-patient') return { sub: 'patient-1', role: 'PATIENT' };
    throw new Error('invalid token');
  }),
}));

// ── Test helpers ──────────────────────────────────────────────────────────────
const ROOM_PARAMS = {
  clinicId: 'clinic-test-1',
  doctorId: 'doctor-test-1',
  date: '2026-06-07',
};
const ROOM_NAME = `queue:${ROOM_PARAMS.clinicId}:${ROOM_PARAMS.doctorId}:${ROOM_PARAMS.date}`;

let httpServer;
let ioServer;
let serverPort;

const makeClient = (token) =>
  ioClient(`http://localhost:${serverPort}`, {
    transports: ['websocket'],
    auth: { token },
    reconnection: false,
  });

const waitForEvent = (socket, event, timeout = 3000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
    socket.once(event, (data) => { clearTimeout(timer); resolve(data); });
  });

const connectAndWait = (socket) =>
  new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });

// ── Suite setup/teardown ──────────────────────────────────────────────────────
beforeAll((done) => {
  httpServer = http.createServer();
  ioServer = new Server(httpServer, { cors: { origin: '*' } });
  initializeSocket(ioServer);
  httpServer.listen(0, () => {
    serverPort = httpServer.address().port;
    done();
  });
});

afterAll((done) => {
  ioServer.close();
  httpServer.close(done);
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Queue Socket.io — end-to-end', () => {

  // ── 1. Room join ─────────────────────────────────────────────────────────
  describe('Room joining', () => {
    it('patient receives queue:joined after emitting patient:joinQueueRoom', async () => {
      const client = makeClient('test-token-patient');

      try {
        await connectAndWait(client);
        const joinedPromise = waitForEvent(client, 'queue:joined');
        client.emit('patient:joinQueueRoom', ROOM_PARAMS);
        const data = await joinedPromise;

        expect(data.roomName).toBe(ROOM_NAME);
        expect(data.message).toMatch(/connected/i);
      } finally {
        client.disconnect();
      }
    });

    it('staff receives queue:joined after emitting staff:joinQueueRoom', async () => {
      const client = makeClient('test-token-staff');

      try {
        await connectAndWait(client);
        const joinedPromise = waitForEvent(client, 'queue:joined');
        client.emit('staff:joinQueueRoom', ROOM_PARAMS);
        const data = await joinedPromise;

        expect(data.roomName).toBe(ROOM_NAME);
      } finally {
        client.disconnect();
      }
    });

    it('returns error when patient:joinQueueRoom is missing clinicId', async () => {
      const client = makeClient('test-token-patient');

      try {
        await connectAndWait(client);
        const errPromise = waitForEvent(client, 'error');
        client.emit('patient:joinQueueRoom', { doctorId: 'doc-1', date: '2026-06-07' }); // missing clinicId
        const err = await errPromise;

        expect(err.message).toMatch(/invalid/i);
      } finally {
        client.disconnect();
      }
    });
  });

  // ── 2. queue:updated broadcast ───────────────────────────────────────────
  describe('queue:updated broadcast', () => {
    it('patient in room receives queue:updated when server broadcasts to room', async () => {
      const patient = makeClient('test-token-patient');

      try {
        await connectAndWait(patient);
        await new Promise((res) => {
          patient.emit('patient:joinQueueRoom', ROOM_PARAMS);
          patient.once('queue:joined', res);
        });

        const updatePromise = waitForEvent(patient, 'queue:updated');

        // Server emits to the room (simulates what reception controller does)
        ioServer.to(ROOM_NAME).emit('queue:updated', { queueSize: 5 });

        const data = await updatePromise;
        expect(data.queueSize).toBe(5);
      } finally {
        patient.disconnect();
      }
    });
  });

  // ── 3. queue:called — patient gets notified ──────────────────────────────
  describe('queue:called event', () => {
    it('patient receives queue:called within 2 seconds after server emits to room', async () => {
      const patient = makeClient('test-token-patient');

      try {
        await connectAndWait(patient);
        await new Promise((res) => {
          patient.emit('patient:joinQueueRoom', ROOM_PARAMS);
          patient.once('queue:joined', res);
        });

        const calledPromise = waitForEvent(patient, 'queue:called', 2000);

        ioServer.to(ROOM_NAME).emit('queue:called', {
          queueNumber: 5,
          patientName: 'Alice',
        });

        const data = await calledPromise;
        expect(data.queueNumber).toBe(5);
      } finally {
        patient.disconnect();
      }
    });
  });

  // ── 4. queue:positionUpdated ─────────────────────────────────────────────
  describe('queue:positionUpdated event', () => {
    it('patient receives position update with new position data', async () => {
      const patient = makeClient('test-token-patient');

      try {
        await connectAndWait(patient);
        await new Promise((res) => {
          patient.emit('patient:joinQueueRoom', ROOM_PARAMS);
          patient.once('queue:joined', res);
        });

        const posPromise = waitForEvent(patient, 'queue:positionUpdated');

        ioServer.to(ROOM_NAME).emit('queue:positionUpdated', {
          updatedPositions: [{ patientId: 'patient-1', newPosition: 2, estimatedWaitMinutes: 10 }],
        });

        const data = await posPromise;
        expect(data.updatedPositions[0].newPosition).toBe(2);
      } finally {
        patient.disconnect();
      }
    });
  });

  // ── 5. queue:paused / queue:resumed ─────────────────────────────────────
  describe('queue:paused and queue:resumed events', () => {
    it('patient receives queue:paused', async () => {
      const patient = makeClient('test-token-patient');

      try {
        await connectAndWait(patient);
        await new Promise((res) => {
          patient.emit('patient:joinQueueRoom', ROOM_PARAMS);
          patient.once('queue:joined', res);
        });

        const pausedPromise = waitForEvent(patient, 'queue:paused');
        ioServer.to(ROOM_NAME).emit('queue:paused', { reason: 'Doctor break' });
        const data = await pausedPromise;

        expect(data.reason).toBe('Doctor break');
      } finally {
        patient.disconnect();
      }
    });

    it('patient receives queue:resumed', async () => {
      const patient = makeClient('test-token-patient');

      try {
        await connectAndWait(patient);
        await new Promise((res) => {
          patient.emit('patient:joinQueueRoom', ROOM_PARAMS);
          patient.once('queue:joined', res);
        });

        const resumedPromise = waitForEvent(patient, 'queue:resumed');
        ioServer.to(ROOM_NAME).emit('queue:resumed', {});
        await resumedPromise; // just verify it arrives
      } finally {
        patient.disconnect();
      }
    });
  });

  // ── 6. Room isolation ───────────────────────────────────────────────────
  describe('Room isolation', () => {
    it('patient in room A does NOT receive events broadcast to room B', async () => {
      const patientA = makeClient('test-token-patient');

      try {
        await connectAndWait(patientA);
        await new Promise((res) => {
          patientA.emit('patient:joinQueueRoom', ROOM_PARAMS); // room A
          patientA.once('queue:joined', res);
        });

        let receivedUpdate = false;
        patientA.on('queue:updated', () => { receivedUpdate = true; });

        // Emit to a completely different room
        const ROOM_B = 'queue:other-clinic:other-doctor:2026-06-07';
        ioServer.to(ROOM_B).emit('queue:updated', { queueSize: 99 });

        // Wait 500ms — patient A should NOT have received it
        await new Promise((res) => setTimeout(res, 500));
        expect(receivedUpdate).toBe(false);
      } finally {
        patientA.disconnect();
      }
    });
  });

  // ── 7. Unauthenticated connection ────────────────────────────────────────
  describe('Unauthenticated connection', () => {
    it('anonymous patient can still join queue room (read-only access)', async () => {
      const client = makeClient(null); // no token

      try {
        await connectAndWait(client);
        const joinedPromise = waitForEvent(client, 'queue:joined');
        client.emit('patient:joinQueueRoom', ROOM_PARAMS);
        await joinedPromise; // should succeed — queue viewing is public
      } finally {
        client.disconnect();
      }
    });

    it('anonymous user cannot join staff room', async () => {
      const client = makeClient(null); // no token

      try {
        await connectAndWait(client);
        const errPromise = waitForEvent(client, 'error');
        client.emit('staff:joinQueueRoom', ROOM_PARAMS);
        const err = await errPromise;

        expect(err.message).toMatch(/auth/i);
      } finally {
        client.disconnect();
      }
    });
  });

  // ── 8. Disconnect cleanup ────────────────────────────────────────────────
  describe('Disconnect behavior', () => {
    it('disconnected patient no longer receives room events', async () => {
      const patient = makeClient('test-token-patient');

      await connectAndWait(patient);
      await new Promise((res) => {
        patient.emit('patient:joinQueueRoom', ROOM_PARAMS);
        patient.once('queue:joined', res);
      });

      let receivedAfterDisconnect = false;
      patient.on('queue:updated', () => { receivedAfterDisconnect = true; });

      patient.disconnect();
      await new Promise((res) => setTimeout(res, 200)); // let disconnect propagate

      ioServer.to(ROOM_NAME).emit('queue:updated', { queueSize: 10 });
      await new Promise((res) => setTimeout(res, 300));

      expect(receivedAfterDisconnect).toBe(false);
    });
  });
});
