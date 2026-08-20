'use strict';
/**
 * Unit tests — Booking & Payment module
 * Task 5.3 + First Booking Free T1-T8
 */

const httpMocks = require('node-mocks-http');

// Mock notification service to prevent real FCM calls
jest.mock('../../services/notification.service', () => ({
  notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/fcm.service', () => ({
  notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
  notifyAppointmentCancelled: jest.fn().mockResolvedValue(undefined),
  notifyDoctorNewBooking: jest.fn().mockResolvedValue(undefined),
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

const {
  initiatePayment,
  verifyPayment,
  getBookingStatus,
} = require('../../controllers/payment.controller');

const {
  cancelAppointment,
} = require('../../controllers/patient.controller');

// ─────────────────────────────────────────────────────────────────────────────
// initiatePayment — existing tests
// ─────────────────────────────────────────────────────────────────────────────
describe('initiatePayment', () => {
  const makeReq = (body = {}) => {
    const req = httpMocks.createRequest({ method: 'POST', body });
    req.user = { id: 'patient-1' };
    req.app = { get: jest.fn(() => null) };
    return req;
  };

  test('returns 400 when doctor is not available at clinic', async () => {
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce(null);

    const req = makeReq({ doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-01' });
    const res = httpMocks.createResponse();

    await initiatePayment(req, res, jest.fn());

    const data = res._getJSONData();
    expect(res.statusCode).toBe(400);
    expect(data.message).toMatch(/not available/i);
  });

  test('returns 409 when duplicate booking exists', async () => {
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ id: 'dc1', doctor: { user: { name: 'Dr. Test' } } });
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({ id: 'existing-appt' });
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'patient-1', name: 'Test', freeBookingUsed: true });

    const req = makeReq({ doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-01' });
    const res = httpMocks.createResponse();

    await initiatePayment(req, res, jest.fn());

    expect(res.statusCode).toBe(409);
  });

  test('creates PENDING_PAYMENT appointment in dev mode (paid path)', async () => {
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ id: 'dc1', doctor: { user: { name: 'Dr. Test' } } });
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
    // freeBookingUsed=true — goes straight to paid path
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'patient-1', name: 'Test', freeBookingUsed: true });
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'new-appt-1', status: 'PENDING_PAYMENT' });
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-1' });

    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = makeReq({ doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-01' });
    const res = httpMocks.createResponse();

    await initiatePayment(req, res, jest.fn());

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.data.devMode).toBe(true);
    expect(data.data.order.id).toMatch(/^order_dev_/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// verifyPayment — existing tests
// ─────────────────────────────────────────────────────────────────────────────
describe('verifyPayment', () => {
  const makeReq = (body = {}) => {
    const req = httpMocks.createRequest({ method: 'POST', body });
    req.user = { id: 'patient-1' };
    req.app = { get: jest.fn(() => null) };
    return req;
  };

  test('returns 404 when payment record not found', async () => {
    global.prismaMock.payment.findUnique.mockResolvedValueOnce(null);

    const req = makeReq({ appointmentId: 'a1', razorpayOrderId: 'order_dev_123' });
    const res = httpMocks.createResponse();

    await verifyPayment(req, res, jest.fn());

    expect(res.statusCode).toBe(404);
  });

  test('returns 409 when payment already verified', async () => {
    global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId: 'a1', status: 'PAID' });

    const req = makeReq({ appointmentId: 'a1', razorpayOrderId: 'order_dev_123' });
    const res = httpMocks.createResponse();

    await verifyPayment(req, res, jest.fn());

    expect(res.statusCode).toBe(409);
  });

  test('auto-confirms appointment in dev mode', async () => {
    global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId: 'a1', status: 'PENDING' });
    global.prismaMock.appointment.findUnique.mockResolvedValueOnce({
      id: 'a1', patientId: 'patient-1', doctorId: 'd1', clinicId: 'c1',
      appointmentType: 'OFFLINE', appointmentDate: new Date(),
    });
    global.prismaMock.payment.update.mockResolvedValueOnce({ status: 'PAID' });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ avgConsultationMins: 10 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q1' });
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queueItem.count.mockResolvedValueOnce(0);
    global.prismaMock.appointment.update.mockResolvedValueOnce({
      id: 'a1', status: 'BOOKED', queueNumber: 1,
      doctor: { user: { id: 'd-user', name: 'Dr. Test' } },
      clinic: { id: 'c1', name: 'Test Clinic' },
    });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi1' });
    // notifyStakeholders (fire-and-forget)
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ name: 'Patient' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ userId: 'doc-user-1' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({ ownerId: 'owner-1' });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

    const req = makeReq({
      appointmentId: 'a1',
      razorpayOrderId: 'order_dev_123',
      razorpayPaymentId: 'pay_dev_456',
      razorpaySignature: 'dev_sig',
    });
    const res = httpMocks.createResponse();

    await verifyPayment(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.data.verified).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cancelAppointment — existing tests
// ─────────────────────────────────────────────────────────────────────────────
describe('cancelAppointment', () => {
  const makeReq = (id) => {
    const req = httpMocks.createRequest({ method: 'PATCH', params: { id } });
    req.user = { id: 'patient-1' };
    return req;
  };

  test('returns 404 when appointment not found', async () => {
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);

    const req = makeReq('missing-appt');
    const res = httpMocks.createResponse();
    await cancelAppointment(req, res, jest.fn());

    expect(res.statusCode).toBe(404);
  });

  test('returns 400 when trying to cancel IN_CONSULTATION appointment', async () => {
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
      id: 'a1', status: 'IN_CONSULTATION', queueItem: null,
      doctor: { user: { name: 'Dr. Test' } }, appointmentDate: new Date(),
    });

    const req = makeReq('a1');
    const res = httpMocks.createResponse();
    await cancelAppointment(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
  });

  test('cancels a BOOKED appointment successfully', async () => {
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
      id: 'a1', status: 'BOOKED', queueItem: null,
      doctor: { user: { name: 'Dr. Test' } }, appointmentDate: new Date(),
    });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a1', status: 'CANCELLED' });

    const req = makeReq('a1');
    const res = httpMocks.createResponse();
    await cancelAppointment(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(global.prismaMock.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELLED' } })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// First Booking Free — T1 through T8
// ─────────────────────────────────────────────────────────────────────────────

const doctorClinicStub = {
  id: 'dc1',
  avgConsultationMins: 10,
  doctor: { user: { id: 'doc-user-1', name: 'Dr. Free' } },
};

const appointmentStub = {
  id: 'appt-free-1',
  patientId: 'patient-free',
  doctorId: 'd1',
  clinicId: 'c1',
  appointmentType: 'OFFLINE',
  appointmentDate: new Date('2026-12-01'),
};

const confirmedAppt = {
  ...appointmentStub,
  status: 'BOOKED',
  queueNumber: 1,
  estimatedWaitMinutes: 10,
  doctor: { user: { id: 'doc-user-1', name: 'Dr. Free' } },
  clinic: { id: 'c1', name: 'Test Clinic', address: '123 St', city: 'Mumbai' },
};

/**
 * Helper: queue all mocks needed by assignQueueAndConfirm (OFFLINE path)
 */
const mockQueueAssignment = () => {
  global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
  global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q1' });
  global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
  global.prismaMock.queueItem.count.mockResolvedValueOnce(0);
  global.prismaMock.appointment.update.mockResolvedValueOnce(confirmedAppt);
  global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi1' });
};

/**
 * Helper: queue fire-and-forget notifyStakeholders lookups
 */
const mockNotifyStakeholders = () => {
  global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ userId: 'doc-user-1' });
  global.prismaMock.clinic.findUnique.mockResolvedValueOnce({ ownerId: 'owner-1' });
  global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);
};

// ── T1: First booking is free ──────────────────────────────────────────────
describe('T1 — first booking is free', () => {
  test('returns isFree=true, amount=0, and appointment confirmed as BOOKED', async () => {
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce(doctorClinicStub);
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);

    // setup.js $transaction default passes prismaMock as tx.
    // Controller calls: tx.user.findUnique (re-read), tx.appointment.create, tx.payment.create, tx.user.update
    // So queue these on prismaMock directly in order:
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'patient-free', name: 'Test Patient', freeBookingUsed: false }) // outer pre-check
      .mockResolvedValueOnce({ freeBookingUsed: false }); // tx re-read inside transaction
    global.prismaMock.appointment.create.mockResolvedValueOnce(appointmentStub);
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-free-1', amount: 0, status: 'PAID' });
    global.prismaMock.user.update.mockResolvedValueOnce({ id: 'patient-free', freeBookingUsed: true });

    mockQueueAssignment();
    mockNotifyStakeholders();

    const req = httpMocks.createRequest({ method: 'POST', body: { doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-01' } });
    req.user = { id: 'patient-free' };
    req.app = { get: jest.fn(() => null) };
    const res = httpMocks.createResponse();

    await initiatePayment(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.data.isFree).toBe(true);
    expect(data.data.amount).toBe(0);
    expect(data.data.appointment).toBeDefined();
    expect(data.data.appointment.status).toBe('BOOKED');
  });
});

// ── T2: Second booking is paid ─────────────────────────────────────────────
describe('T2 — second booking requires payment', () => {
  test('returns isFree=false and a Razorpay order for ₹10', async () => {
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce(doctorClinicStub);
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'patient-paid', name: 'Returning', freeBookingUsed: true });
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'appt-paid-1', status: 'PENDING_PAYMENT' });
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-paid-1' });

    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = httpMocks.createRequest({ method: 'POST', body: { doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-02' } });
    req.user = { id: 'patient-paid' };
    req.app = { get: jest.fn(() => null) };
    const res = httpMocks.createResponse();

    await initiatePayment(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.data.isFree).toBe(false);
    expect(data.data.amount).toBe(10);
    expect(data.data.order.id).toMatch(/^order_dev_/);
  });
});

// ── T3: Cancelled free booking — benefit still consumed ───────────────────
describe('T3 — cancelled free booking does not reset benefit', () => {
  test('user with freeBookingUsed=true always pays, even after cancellation', async () => {
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce(doctorClinicStub);
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'patient-c', name: 'Cancelled User', freeBookingUsed: true });
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'appt-c', status: 'PENDING_PAYMENT' });
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-c' });

    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = httpMocks.createRequest({ method: 'POST', body: { doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-03' } });
    req.user = { id: 'patient-c' };
    req.app = { get: jest.fn(() => null) };
    const res = httpMocks.createResponse();

    await initiatePayment(req, res, jest.fn());

    const data = res._getJSONData();
    expect(data.data.isFree).toBe(false);
    expect(data.data.amount).toBe(10);
  });
});

// ── T4: Race condition — concurrent free booking falls back to paid ────────
describe('T4 — concurrent free booking race condition', () => {
  test('when tx re-read shows benefit already used, falls back to paid booking', async () => {
    // The controller recurses once on FREE_BOOKING_ALREADY_USED, so most mocks
    // need two values — one for the first call and one for the recursive paid call.
    global.prismaMock.doctorClinic.findFirst
      .mockResolvedValueOnce(doctorClinicStub)  // first call
      .mockResolvedValueOnce(doctorClinicStub); // recursive call
    global.prismaMock.appointment.findFirst
      .mockResolvedValueOnce(null)  // first duplicate check
      .mockResolvedValueOnce(null); // recursive duplicate check

    // First call: outer read says free
    // Recursive call: outer read says already used (so it goes to paid path directly)
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'patient-race', name: 'Race', freeBookingUsed: false }) // first outer check
      .mockResolvedValueOnce({ freeBookingUsed: true })  // tx re-read inside transaction → throws
      .mockResolvedValueOnce({ id: 'patient-race', name: 'Race', freeBookingUsed: true }); // recursive outer check

    // Paid path mocks for the recursive call:
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'appt-race', status: 'PENDING_PAYMENT' });
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-race' });

    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = httpMocks.createRequest({ method: 'POST', body: { doctorId: 'd1', clinicId: 'c1', appointmentType: 'OFFLINE', appointmentDate: '2026-12-04' } });
    req.user = { id: 'patient-race' };
    req.app = { get: jest.fn(() => null) };
    const res = httpMocks.createResponse();

    await initiatePayment(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.data.isFree).toBe(false);
  });
});

// ── T5: Failed payment — invalid signature ────────────────────────────────
describe('T5 — failed payment with invalid signature', () => {
  test('marks payment FAILED and appointment CANCELLED', async () => {
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';

    global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId: 'a1', status: 'PENDING', amount: 10 });
    global.prismaMock.appointment.findUnique.mockResolvedValueOnce({ id: 'a1', patientId: 'p1', doctorId: 'd1', clinicId: 'c1' });
    global.prismaMock.payment.update.mockResolvedValueOnce({ status: 'FAILED' });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a1', status: 'CANCELLED' });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { appointmentId: 'a1', razorpayOrderId: 'order_real_1', razorpayPaymentId: 'pay_real_1', razorpaySignature: 'bad_sig' },
    });
    req.user = { id: 'p1' };
    req.app = { get: jest.fn(() => null) };
    const res = httpMocks.createResponse();

    await verifyPayment(req, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(global.prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } })
    );
    expect(global.prismaMock.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELLED' } })
    );

    delete process.env.RAZORPAY_KEY_SECRET;
  });
});

// ── T6 & T7: getBookingStatus ─────────────────────────────────────────────
describe('getBookingStatus', () => {
  const makeStatusReq = (userId) => {
    const req = httpMocks.createRequest({ method: 'GET' });
    req.user = { id: userId };
    return req;
  };

  test('T6 — new patient: freeBookingUsed=false, bookingFee=0', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ freeBookingUsed: false, freeBookingUsedAt: null });

    const res = httpMocks.createResponse();
    await getBookingStatus(makeStatusReq('new-patient'), res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.data.freeBookingUsed).toBe(false);
    expect(data.data.bookingFee).toBe(0);
  });

  test('T7 — returning patient: freeBookingUsed=true, bookingFee=10', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ freeBookingUsed: true, freeBookingUsedAt: new Date() });

    const res = httpMocks.createResponse();
    await getBookingStatus(makeStatusReq('returning-patient'), res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.data.freeBookingUsed).toBe(true);
    expect(data.data.bookingFee).toBe(10);
  });
});

// ── T8: Admin dashboard booking metrics ───────────────────────────────────
describe('T8 — admin getDashboard booking metrics', () => {
  const { getDashboard } = require('../../controllers/admin.controller');

  test('correctly aggregates free/paid bookings and calculates conversion rate', async () => {
    global.prismaMock.user.count.mockResolvedValueOnce(50);
    global.prismaMock.clinic.count
      .mockResolvedValueOnce(2)   // PENDING
      .mockResolvedValueOnce(1)   // UNDER_REVIEW
      .mockResolvedValueOnce(10)  // VERIFIED
      .mockResolvedValueOnce(1)   // REJECTED
      .mockResolvedValueOnce(0)   // CHANGES_REQUIRED
      .mockResolvedValueOnce(0);  // SUSPENDED
    global.prismaMock.doctorProfile.count
      .mockResolvedValueOnce(3)   // PENDING+UNDER_REVIEW
      .mockResolvedValueOnce(8);  // VERIFIED
    global.prismaMock.payment.count
      .mockResolvedValueOnce(3)   // freeBookings (amount=0, PAID)
      .mockResolvedValueOnce(5);  // paidBookings (amount>0, PAID)
    global.prismaMock.payment.aggregate.mockResolvedValueOnce({ _sum: { amount: 50 } });

    const req = httpMocks.createRequest({ method: 'GET' });
    req.user = { id: 'admin-1' };
    const res = httpMocks.createResponse();

    await getDashboard(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    const bm = data.data.bookingMetrics;

    expect(bm.freeBookings).toBe(3);
    expect(bm.paidBookings).toBe(5);
    expect(bm.totalBookings).toBe(8);
    expect(bm.conversionRate).toBe(63); // round(5/8*100)
    expect(bm.totalRevenue).toBe(50);
    expect(bm.revenuePerPatient).toBe(10);
  });
});
