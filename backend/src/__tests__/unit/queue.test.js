'use strict';
/**
 * Unit tests — Queue & Reception module
 * Task 5.4
 */

const httpMocks = require('node-mocks-http');

jest.mock('../../services/fcm.service', () => ({
  notifyQueueCalled: jest.fn().mockResolvedValue(undefined),
  notifyQueuePaused: jest.fn().mockResolvedValue(undefined),
  notifyQueueResumed: jest.fn().mockResolvedValue(undefined),
  notifyDoctorFollowUp: jest.fn().mockResolvedValue(undefined),
  notifyReceptionistNewWalkIn: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/audit.service', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const {
  addWalkIn,
  callNext,
  pauseQueue,
  resumeQueue,
  skipPatient,
} = require('../../controllers/reception.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const makeReq = (body = {}, params = {}, query = {}) => {
  const req = httpMocks.createRequest({ method: 'POST', body, params, query });
  req.user = { id: 'staff-1' };
  req.app = { get: jest.fn(() => null) }; // no io
  return req;
};

// ─────────────────────────────────────────────────────────────────────────────
// addWalkIn
// ─────────────────────────────────────────────────────────────────────────────
describe('addWalkIn', () => {
  test('returns 404 when doctor profile not found', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'p1', name: 'Patient', mobile: '9999999999' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce(null);

    const req = makeReq({ doctorId: 'd1', clinicId: 'c1', patientMobile: '9999999999', patientName: 'Test' });
    const res = httpMocks.createResponse();
    await addWalkIn(req, res, jest.fn());

    expect(res.statusCode).toBe(404);
  });

  test('creates new patient when mobile not found and adds to queue', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(null);   // patient not found
    global.prismaMock.user.create.mockResolvedValueOnce({ id: 'new-p', name: 'New Patient', mobile: '8888888888' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'd1', avgConsultationMins: 10 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q1', status: 'ACTIVE', clinicId: 'c1', doctorId: 'd1' });
    // Last queue item has queueNumber 2 — so next will be 3
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce({ queueNumber: 2 });
    global.prismaMock.queueItem.count.mockResolvedValueOnce(2);
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a1', queueNumber: 3 });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi1', queueNumber: 3, position: 3 });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

    const req = makeReq({ doctorId: 'd1', clinicId: 'c1', patientMobile: '8888888888', patientName: 'New Patient' });
    const res = httpMocks.createResponse();
    await addWalkIn(req, res, jest.fn());

    expect(res.statusCode).toBe(201);
    const data = res._getJSONData();
    expect(data.data.queueNumber).toBe(3);
  });

  test('returns 400 when queue is CLOSED', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'p1', name: 'P', mobile: '9' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'd1', avgConsultationMins: 10 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce({ id: 'q1', status: 'CLOSED' });

    const req = makeReq({ doctorId: 'd1', clinicId: 'c1', patientMobile: '9', patientName: 'P' });
    const res = httpMocks.createResponse();
    await addWalkIn(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// callNext
// ─────────────────────────────────────────────────────────────────────────────
describe('callNext', () => {
  test('returns 404 when queue not found', async () => {
    global.prismaMock.queue.findUnique.mockResolvedValueOnce(null);

    const req = makeReq({}, { queueId: 'q-missing' });
    const res = httpMocks.createResponse();
    await callNext(req, res, jest.fn());

    expect(res.statusCode).toBe(404);
  });

  test('returns 400 when queue is PAUSED', async () => {
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({
      id: 'q1', status: 'PAUSED', clinicId: 'c1', doctorId: 'd1',
      doctor: { user: { name: 'Dr. T' }, avgConsultationMins: 10 },
    });

    const req = makeReq({}, { queueId: 'q1' });
    const res = httpMocks.createResponse();
    await callNext(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
  });

  test('calls next patient and emits socket event', async () => {
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({
      id: 'q1', status: 'ACTIVE', clinicId: 'c1', doctorId: 'd1',
      doctor: { user: { name: 'Dr. T' }, avgConsultationMins: 10 },
    });
    global.prismaMock.queueItem.findFirst
      .mockResolvedValueOnce(null)   // no IN_CONSULTATION
      .mockResolvedValueOnce(null)   // no CALLED
      .mockResolvedValueOnce({       // next WAITING patient
        id: 'qi1', queueNumber: 2, patientId: 'p1', isFollowUp: false,
        appointmentId: 'a1',
        patient: { id: 'p1', name: 'Alice', mobile: '9' },
        appointment: {},
      });
    global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi1', status: 'CALLED' });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ status: 'CALLED' });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([]); // recalculate positions

    const ioEmit = jest.fn();
    const req = makeReq({}, { queueId: 'q1' });
    req.app = { get: jest.fn(() => ({ to: jest.fn(() => ({ emit: ioEmit })) })) };
    const res = httpMocks.createResponse();
    await callNext(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(ioEmit).toHaveBeenCalledWith('queue:called', expect.objectContaining({ queueNumber: 2 }));
  });

  test('returns 200 with no-more-patients message when queue is empty', async () => {
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({
      id: 'q1', status: 'ACTIVE', clinicId: 'c1', doctorId: 'd1',
      doctor: { user: { name: 'Dr. T' }, avgConsultationMins: 10 },
    });
    global.prismaMock.queueItem.findFirst
      .mockResolvedValueOnce(null)  // no IN_CONSULTATION
      .mockResolvedValueOnce(null)  // no CALLED
      .mockResolvedValueOnce(null); // no WAITING

    const req = makeReq({}, { queueId: 'q1' });
    const res = httpMocks.createResponse();
    await callNext(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.data.message).toMatch(/no more/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// pauseQueue / resumeQueue
// ─────────────────────────────────────────────────────────────────────────────
describe('pauseQueue', () => {
  test('pauses the queue and emits socket event', async () => {
    global.prismaMock.queue.update.mockResolvedValueOnce({
      id: 'q1', status: 'PAUSED', clinicId: 'c1', doctorId: 'd1',
      doctor: { user: { name: 'Dr. T' } },
    });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([{ patientId: 'p1' }]);

    const ioEmit = jest.fn();
    const req = makeReq({}, { queueId: 'q1' });
    req.app = { get: jest.fn(() => ({ to: jest.fn(() => ({ emit: ioEmit })) })) };
    const res = httpMocks.createResponse();
    await pauseQueue(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(ioEmit).toHaveBeenCalledWith('queue:paused', expect.objectContaining({ queueId: 'q1' }));
  });
});

describe('resumeQueue', () => {
  test('resumes the queue and emits socket event', async () => {
    global.prismaMock.queue.update.mockResolvedValueOnce({ id: 'q1', status: 'ACTIVE', clinicId: 'c1', doctorId: 'd1' });
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({ doctor: { user: { name: 'Dr. T' } } });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([{ patientId: 'p1' }]);

    const ioEmit = jest.fn();
    const req = makeReq({}, { queueId: 'q1' });
    req.app = { get: jest.fn(() => ({ to: jest.fn(() => ({ emit: ioEmit })) })) };
    const res = httpMocks.createResponse();
    await resumeQueue(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(ioEmit).toHaveBeenCalledWith('queue:resumed', expect.anything());
  });
});
