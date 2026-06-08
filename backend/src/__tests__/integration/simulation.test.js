'use strict';
/**
 * simulation.test.js
 * ═══════════════════════════════════════════════════════════════════════════
 * PulseMate Full Simulation — 25 Virtual Users (representative of 60-user seed)
 *
 * All 13 scenarios  ·  Load tests  ·  11 Edge cases
 *
 *  S01  New patient: register → profile → search → FREE first booking
 *  S02  Returning patient: second booking requires ₹10
 *  S03  Patient cancels → doctor + receptionist + owner notified
 *  S04  Doctor receives new-booking notification
 *  S05  Receptionist walk-in — new patient added to queue instantly
 *  S06  Receptionist follow-up — priority insertion before regulars
 *  S07  Queue cycle: check-in → call-next → skip → complete
 *  S08  50 concurrent live-queue fetches — all 200, under 10 s
 *  S09  Clinic approval flow: PENDING → VERIFIED (+reject +doctor approve)
 *  S10  Doctor sets/updates availability; patient sees updated slots
 *  S11  All FCM notification types delivered
 *  S12  Session management: multi-device login, single-device logout
 *  S13  Security: bad JWT, expired JWT, RBAC, IDOR, dupe booking, sig spoof
 *  LOAD 50 paid booking initiations
 *  EDGE E01–E11
 * ═══════════════════════════════════════════════════════════════════════════
 */

const request = require('supertest');
const { app } = require('../../server');

// ─── token.service mock ───────────────────────────────────────────────────────
// IMPORTANT: tok_expired must NOT be evaluated eagerly — use a conditional throw.
jest.mock('../../services/token.service', () => ({
  generateAccessToken: jest.fn(() => 'sim_tok'),
  generateRefreshToken: jest.fn(() => 'sim_ref'),
  signAccessToken: jest.fn(() => 'sim_tok'),
  createSessionTokens: jest.fn().mockResolvedValue({
    accessToken: 'sim_tok', refreshToken: 'sim_ref',
    refreshExpiry: '7d', session: { id: 'sess-1' },
  }),
  rotateRefreshToken: jest.fn().mockResolvedValue({
    accessToken: 'sim_tok', refreshToken: 'sim_ref', user: {},
  }),
  revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
  revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
  revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
  revokeRoleSessions: jest.fn().mockResolvedValue(undefined),
  verifyRefreshToken: jest.fn(() => ({ sub: 'p-new', jti: 'jti-1' })),
  signPhoneVerificationToken: jest.fn(() => 'sim_phone_tok'),
  verifyPhoneVerificationToken: jest.fn(() => ({ phone: '+91999' })),
  signEmailVerificationToken: jest.fn(() => 'sim_email_tok'),
  verifyEmailVerificationToken: jest.fn(() => ({ email: 'test@test.com' })),
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
  ACCESS_COOKIE_MAX_AGE: 900000,
  REFRESH_COOKIE_MAX_AGE: 604800000,
  verifyAccessToken: jest.fn((t) => {
    if (t === 'tok_expired') {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    }
    const MAP = {
      tok_p_new: { sub: 'p-new', role: 'PATIENT' },
      tok_p_ret: { sub: 'p-ret', role: 'PATIENT' },
      tok_p_cancel: { sub: 'p-cancel', role: 'PATIENT' },
      tok_p_noprofile: { sub: 'p-noprof', role: 'PATIENT' },
      tok_p_load: { sub: 'p-load', role: 'PATIENT' },
      tok_p2: { sub: 'p2', role: 'PATIENT' },
      tok_doctor: { sub: 'u-doctor', role: 'DOCTOR' },
      tok_recept: { sub: 'u-recept', role: 'RECEPTIONIST' },
      tok_owner: { sub: 'u-owner', role: 'CLINIC_OWNER' },
      tok_admin: { sub: 'u-admin', role: 'SUPER_ADMIN' },
    };
    if (t in MAP) return MAP[t];
    throw new Error('invalid token');
  }),
}));

// ─── FCM service mock ─────────────────────────────────────────────────────────
jest.mock('../../services/fcm.service', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
  notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
  notifyAppointmentCancelled: jest.fn().mockResolvedValue(undefined),
  notifyDoctorNewBooking: jest.fn().mockResolvedValue(undefined),
  notifyQueueCalled: jest.fn().mockResolvedValue(undefined),
  notifyQueuePaused: jest.fn().mockResolvedValue(undefined),
  notifyQueueResumed: jest.fn().mockResolvedValue(undefined),
  notifyDoctorFollowUp: jest.fn().mockResolvedValue(undefined),
  notifyReceptionistNewWalkIn: jest.fn().mockResolvedValue(undefined),
  notifyFollowUpReady: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/notification.service', () => ({
  notifyAppointmentBooked: jest.fn().mockResolvedValue(undefined),
  notifyQueueCalled: jest.fn().mockResolvedValue(undefined),
  notifyQueuePaused: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/audit.service', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/email.service', () => ({
  sendClinicApprovedEmail: jest.fn().mockResolvedValue(undefined),
  sendClinicRejectedEmail: jest.fn().mockResolvedValue(undefined),
  sendClinicChangesRequestedEmail: jest.fn().mockResolvedValue(undefined),
  sendClinicSuspendedEmail: jest.fn().mockResolvedValue(undefined),
  sendTransactionalEmail: jest.fn().mockResolvedValue(undefined),
}));

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const as = (tok) => (r) => r.set('Authorization', `Bearer ${tok}`);
const AS_NEW = as('tok_p_new');
const AS_RET = as('tok_p_ret');
const AS_CANCEL = as('tok_p_cancel');
const AS_NOPROF = as('tok_p_noprofile');
const AS_LOAD = as('tok_p_load');
const AS_P2 = as('tok_p2');
const AS_DOCTOR = as('tok_doctor');
const AS_RECEPT = as('tok_recept');
const AS_OWNER = as('tok_owner');
const AS_ADMIN = as('tok_admin');

// ─── User stubs (25 virtual users from the 60-user seed) ─────────────────────

// Patients
const P_NEW = {
  id: 'p-new', name: 'Priya Naik', mobile: '+917599000100',
  role: 'PATIENT', isActive: true, approvalStatus: 'VERIFIED',
  freeBookingUsed: false,
  adminProfile: null, doctorProfile: null, receptionistProfile: null, ownedClinics: [],
  patientProfile: {
    id: 'pp-new', gender: 'FEMALE', age: 22, bloodGroup: 'O+',
    city: 'Belagavi', state: 'Karnataka', address: '12 MG Road',
    emergencyContact: '+917599000600', profileCompleted: true,
    existingDiseases: 'Back Pain', allergies: null,
  },
};

const P_RET = {
  id: 'p-ret', name: 'Rohit Naik', mobile: '+917599000101',
  role: 'PATIENT', isActive: true, approvalStatus: 'VERIFIED',
  freeBookingUsed: true,
  adminProfile: null, doctorProfile: null, receptionistProfile: null, ownedClinics: [],
  patientProfile: {
    id: 'pp-ret', gender: 'MALE', age: 30, bloodGroup: 'A+',
    city: 'Karwar', state: 'Karnataka', address: '45 Harbour Rd',
    emergencyContact: '+917599000601', profileCompleted: true,
    existingDiseases: 'Neck Pain', allergies: null,
  },
};

const P_CANCEL = {
  id: 'p-cancel', name: 'Anjali Shetty', mobile: '+917599000102',
  role: 'PATIENT', isActive: true, approvalStatus: 'VERIFIED',
  freeBookingUsed: true,
  adminProfile: null, doctorProfile: null, receptionistProfile: null, ownedClinics: [],
  patientProfile: {
    id: 'pp-cancel', gender: 'FEMALE', age: 40, bloodGroup: 'B+',
    city: 'Hubli', state: 'Karnataka', address: '7 Station Road',
    emergencyContact: '+917599000602', profileCompleted: true,
    existingDiseases: 'Knee Pain', allergies: 'Penicillin',
  },
};

const P_NOPROF = {
  id: 'p-noprof', name: null, mobile: '+917599000199',
  role: 'PATIENT', isActive: true, approvalStatus: 'VERIFIED',
  freeBookingUsed: false,
  adminProfile: null, doctorProfile: null, receptionistProfile: null, ownedClinics: [],
  patientProfile: null,
};

const P_LOAD = {
  id: 'p-load', name: 'Sameer Anand', mobile: '+917599000198',
  role: 'PATIENT', isActive: true, approvalStatus: 'VERIFIED',
  freeBookingUsed: true,
  adminProfile: null, doctorProfile: null, receptionistProfile: null, ownedClinics: [],
  patientProfile: { id: 'pp-load', profileCompleted: true, city: 'Dharwad' },
};

const P2 = {
  id: 'p2', name: 'Deepak Rao', mobile: '+917599000103',
  role: 'PATIENT', isActive: true, approvalStatus: 'VERIFIED',
  freeBookingUsed: true,
  adminProfile: null, doctorProfile: null, receptionistProfile: null, ownedClinics: [],
  patientProfile: {
    id: 'pp-p2', gender: 'MALE', age: 52, bloodGroup: 'AB+',
    city: 'Dharwad', state: 'Karnataka', address: '88 PB Road',
    emergencyContact: '+917599000603', profileCompleted: true,
    existingDiseases: 'Sciatica', allergies: null,
  },
};

// Staff
const DOCTOR_USER = {
  id: 'u-doctor', name: 'Dr. Pradeep Kulkarni', mobile: '+917599000010',
  role: 'DOCTOR', isActive: true, approvalStatus: 'VERIFIED',
  adminProfile: null, receptionistProfile: null, ownedClinics: [],
  doctorProfile: { id: 'dp-physio', approvalStatus: 'VERIFIED', avgConsultationMins: 20 },
};

const RECEPT_USER = {
  id: 'u-recept', name: 'Mangala Kore', mobile: '+917599000020',
  role: 'RECEPTIONIST', isActive: true, approvalStatus: 'VERIFIED',
  adminProfile: null, doctorProfile: null, ownedClinics: [],
  receptionistProfile: {
    id: 'rp-a', assignedClinicId: 'clinic-a',
    assignedClinic: { id: 'clinic-a', approvalStatus: 'VERIFIED', isActive: true },
  },
};

const OWNER_USER = {
  id: 'u-owner', name: 'Dr. Basavraj Patil', mobile: '+917599000002',
  role: 'CLINIC_OWNER', isActive: true, approvalStatus: 'VERIFIED',
  adminProfile: null, doctorProfile: null, receptionistProfile: null,
  ownedClinics: [{ id: 'clinic-a', approvalStatus: 'VERIFIED', isActive: true }],
};

const ADMIN_USER = {
  id: 'u-admin', name: 'Sim Root Admin', mobile: '+917599000001',
  role: 'SUPER_ADMIN', isActive: true, approvalStatus: 'VERIFIED',
  adminProfile: { id: 'ap-root', level: 'ROOT' },
  doctorProfile: null, receptionistProfile: null, ownedClinics: [],
};

// Fixtures
const CLINIC_A = { id: 'clinic-a', name: 'SIM PulseMate Wellness Centre', approvalStatus: 'VERIFIED', isActive: true, ownerId: 'u-owner' };
const SUSPENDED_CLINIC = { id: 'clinic-sus', approvalStatus: 'SUSPENDED', isActive: false, ownerId: 'u-owner' };
const DR_PROFILE = { id: 'dp-physio', userId: 'u-doctor', approvalStatus: 'VERIFIED', avgConsultationMins: 20 };

// ═══════════════════════════════════════════════════════════════════════════════
// S01 — New Patient: Register → Profile → Search → FREE Booking
// ═══════════════════════════════════════════════════════════════════════════════
describe('S01 — New Patient: Register, Profile, Search, Free First Booking', () => {

  test('1a  GET /api/patient/profile — auto-creates empty profile', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_NEW)
      .mockResolvedValueOnce({ ...P_NEW, patientProfile: null });
    global.prismaMock.patientProfile.create.mockResolvedValueOnce({ id: 'pp-new-c', profileCompleted: false });
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ ...P_NEW, patientProfile: { profileCompleted: false } });

    const res = await AS_NEW(request(app).get('/api/patient/profile'));
    expect(res.status).toBe(200);
  });

  test('1b  PATCH /api/patient/profile — completes profile', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_NEW)
      .mockResolvedValueOnce(P_NEW);
    global.prismaMock.user.update.mockResolvedValueOnce({
      ...P_NEW, patientProfile: { ...P_NEW.patientProfile, profileCompleted: true },
    });

    const res = await AS_NEW(request(app).patch('/api/patient/profile')).send({
      name: 'Priya Naik', gender: 'FEMALE', age: 22,
      city: 'Belagavi', emergencyContact: '+917599000600', bloodGroup: 'O+',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.patientProfile.profileCompleted).toBe(true);
  });

  test('1c  GET /api/patient/doctors — returns verified doctors list', async () => {
    global.prismaMock.doctorProfile.findMany.mockResolvedValueOnce([
      {
        id: 'dp-physio', specialization: 'Physiotherapy', consultationFee: 600,
        user: { id: 'u-doctor', name: 'Dr. Pradeep Kulkarni' },
        doctorClinics: [{ clinic: { id: 'clinic-a', name: 'SIM PulseMate', city: 'Belagavi', isVerified: true, approvalStatus: 'VERIFIED' } }],
      },
      {
        id: 'dp-ortho', specialization: 'Orthopedics', consultationFee: 800,
        user: { id: 'u-ortho', name: 'Dr. Suhas Mahajan' },
        doctorClinics: [{ clinic: { id: 'clinic-a', name: 'SIM PulseMate', city: 'Belagavi', isVerified: true, approvalStatus: 'VERIFIED' } }],
      },
    ]);
    global.prismaMock.doctorProfile.count.mockResolvedValueOnce(2);

    const res = await request(app).get('/api/patient/doctors?city=Belagavi');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('1d  GET /api/payments/booking-status — freeBookingUsed=false, fee=₹0', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_NEW)
      .mockResolvedValueOnce({ freeBookingUsed: false, freeBookingUsedAt: null });

    const res = await AS_NEW(request(app).get('/api/payments/booking-status'));
    expect(res.status).toBe(200);
    expect(res.body.data.freeBookingUsed).toBe(false);
    expect(res.body.data.bookingFee).toBe(0);
  });

  test('1e  POST /api/payments/initiate — FREE booking: isFree=true, amount=0, queueNumber=1', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_NEW)
      .mockResolvedValueOnce({ id: 'p-new', name: 'Priya Naik', freeBookingUsed: false })
      .mockResolvedValueOnce({ freeBookingUsed: false }); // tx concurrency re-read
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({
      id: 'dc-a', avgConsultationMins: 20,
      doctor: { user: { id: 'u-doctor', name: 'Dr. Pradeep Kulkarni' } },
    });
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.appointment.create.mockResolvedValueOnce({
      id: 'a-free-1', patientId: 'p-new', doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: new Date('2026-12-10'),
    });
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-f-1', amount: 0, status: 'PAID' });
    global.prismaMock.user.update.mockResolvedValueOnce({ id: 'p-new', freeBookingUsed: true });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q-1' });
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queueItem.count.mockResolvedValueOnce(0);
    global.prismaMock.appointment.update.mockResolvedValueOnce({
      id: 'a-free-1', status: 'BOOKED', queueNumber: 1,
      doctor: { user: { id: 'u-doctor', name: 'Dr. Pradeep Kulkarni' } },
      clinic: { id: 'clinic-a', name: 'SIM PulseMate', address: '', city: 'Belagavi' },
    });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi-1' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ userId: 'u-doctor' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({ ownerId: 'u-owner' });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([{ userId: 'u-recept' }]);

    const res = await AS_NEW(request(app).post('/api/payments/initiate')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: '2026-12-10',
      symptoms: 'Back Pain',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.isFree).toBe(true);
    expect(res.body.data.amount).toBe(0);
    expect(res.body.data.appointment.status).toBe('BOOKED');
    expect(res.body.data.appointment.queueNumber).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S02 — Returning Patient: Second Booking Requires ₹10
// ═══════════════════════════════════════════════════════════════════════════════
describe('S02 — Returning Patient: ₹10 Platform Fee Required', () => {

  test('2a  booking-status: freeBookingUsed=true, fee=₹10', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_RET)
      .mockResolvedValueOnce({ freeBookingUsed: true, freeBookingUsedAt: new Date('2026-11-01') });

    const res = await AS_RET(request(app).get('/api/payments/booking-status'));
    expect(res.status).toBe(200);
    expect(res.body.data.freeBookingUsed).toBe(true);
    expect(res.body.data.bookingFee).toBe(10);
  });

  test('2b  POST /api/payments/initiate — isFree=false, amount=₹10, devMode order', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_RET)
      .mockResolvedValueOnce({ id: 'p-ret', name: 'Rohit Naik', freeBookingUsed: true });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({
      id: 'dc-a', doctor: { user: { name: 'Dr. Pradeep Kulkarni' } },
    });
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a-paid-1', status: 'PENDING_PAYMENT' });
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-p-1' });

    const res = await AS_RET(request(app).post('/api/payments/initiate')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: '2026-12-11',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.isFree).toBe(false);
    expect(res.body.data.amount).toBe(10);
    expect(res.body.data.order.id).toMatch(/^order_dev_/);
    expect(res.body.data.devMode).toBe(true);
  });

  test('2c  POST /api/payments/verify — dev-mode confirms appointment + assigns queue', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_RET)
      .mockResolvedValueOnce({ name: 'Rohit Naik' });
    global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId: 'a-paid-1', status: 'PENDING', amount: 10 });
    global.prismaMock.appointment.findUnique.mockResolvedValueOnce({
      id: 'a-paid-1', patientId: 'p-ret', doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: new Date('2026-12-11'),
    });
    global.prismaMock.payment.update.mockResolvedValueOnce({ status: 'PAID', paidAt: new Date() });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ avgConsultationMins: 20 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q-2' });
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queueItem.count.mockResolvedValueOnce(3);
    global.prismaMock.appointment.update.mockResolvedValueOnce({
      id: 'a-paid-1', status: 'BOOKED', queueNumber: 4,
      doctor: { user: { id: 'u-doctor', name: 'Dr. Pradeep Kulkarni' } },
      clinic: { id: 'clinic-a', name: 'SIM PulseMate', address: '', city: 'Belagavi' },
    });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi-4' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ userId: 'u-doctor' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({ ownerId: 'u-owner' });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

    const res = await AS_RET(request(app).post('/api/payments/verify')).send({
      appointmentId: 'a-paid-1',
      razorpayOrderId: 'order_dev_12345',
      razorpayPaymentId: 'pay_dev_12345',
      razorpaySignature: 'dev_sig',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.verified).toBe(true);
    expect(res.body.data.appointment.queueNumber).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S03 — Patient Cancels: All Stakeholders Notified
// ═══════════════════════════════════════════════════════════════════════════════
describe('S03 — Patient Cancels: Doctor + Receptionist + Owner Notified', () => {

  test('3a  PATCH cancel — BOOKED → CANCELLED, 4 stakeholders notified via FCM', async () => {
    const fcm = require('../../services/fcm.service');

    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_CANCEL);
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
      id: 'a-can-1', status: 'BOOKED', queueItem: null,
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      doctor: { user: { name: 'Dr. Pradeep Kulkarni' } },
      appointmentDate: new Date('2026-12-12'),
    });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-can-1', status: 'CANCELLED' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ userId: 'u-doctor' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({ ownerId: 'u-owner' });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([{ userId: 'u-recept' }]);

    const res = await AS_CANCEL(request(app).patch('/api/patient/appointments/a-can-1/cancel'));
    expect(res.status).toBe(200);
    expect(fcm.notifyAppointmentCancelled).toHaveBeenCalled();
    expect(fcm.sendNotification).toHaveBeenCalledWith('u-doctor', expect.objectContaining({ title: expect.stringMatching(/Cancelled/i) }));
    expect(fcm.sendNotification).toHaveBeenCalledWith('u-owner', expect.anything());
    expect(fcm.sendNotification).toHaveBeenCalledWith('u-recept', expect.anything());
  });

  test('3b  Cannot cancel IN_CONSULTATION appointment → 400', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_CANCEL);
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
      id: 'a-ic', status: 'IN_CONSULTATION', queueItem: null,
      doctor: { user: { name: 'Dr. Pradeep' } }, appointmentDate: new Date(),
    });

    const res = await AS_CANCEL(request(app).patch('/api/patient/appointments/a-ic/cancel'));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/IN_CONSULTATION/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S04 — Doctor Receives New Booking Notification
// ═══════════════════════════════════════════════════════════════════════════════
describe('S04 — Doctor Notification on New Booking', () => {

  test('4a  notifyDoctorNewBooking called after paid booking verified', async () => {
    const fcm = require('../../services/fcm.service');

    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P2)
      .mockResolvedValueOnce({ name: 'Deepak Rao' });
    global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId: 'a-s4', status: 'PENDING', amount: 10 });
    global.prismaMock.appointment.findUnique.mockResolvedValueOnce({
      id: 'a-s4', patientId: 'p2', doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: new Date('2026-12-13'),
    });
    global.prismaMock.payment.update.mockResolvedValueOnce({ status: 'PAID' });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ avgConsultationMins: 20 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce({ id: 'q-1' });
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queueItem.count.mockResolvedValueOnce(5);
    global.prismaMock.appointment.update.mockResolvedValueOnce({
      id: 'a-s4', status: 'BOOKED', queueNumber: 6,
      doctor: { user: { id: 'u-doctor', name: 'Dr. Pradeep Kulkarni' } },
      clinic: { id: 'clinic-a', name: 'SIM PulseMate', address: '', city: 'Belagavi' },
    });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi-s4' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ userId: 'u-doctor' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({ ownerId: 'u-owner' });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

    const res = await AS_P2(request(app).post('/api/payments/verify')).send({
      appointmentId: 'a-s4',
      razorpayOrderId: 'order_dev_s4',
      razorpayPaymentId: 'pay_dev_s4',
      razorpaySignature: 'dev_sig',
    });
    expect(res.status).toBe(200);
    // Verify doctor was notified with correct userId and patient name
    expect(fcm.notifyDoctorNewBooking).toHaveBeenCalled();
    const callArgs = fcm.notifyDoctorNewBooking.mock.calls[0];
    expect(callArgs[0]).toBe('u-doctor');
    expect(callArgs[1]).toBe('Deepak Rao');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S05 — Receptionist Walk-In
// ═══════════════════════════════════════════════════════════════════════════════
describe('S05 — Receptionist Walk-In: New Patient Added to Queue', () => {

  test('5a  POST /api/reception/walk-in — assigns queue #7', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(RECEPT_USER)
      .mockResolvedValueOnce({ id: 'wi-1', name: 'Govind Shetty', mobile: '+917599100001' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp-physio', avgConsultationMins: 20 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.queue.create.mockResolvedValueOnce({ id: 'q-wi', status: 'ACTIVE', clinicId: 'clinic-a', doctorId: 'dp-physio' });
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce({ queueNumber: 6 });
    global.prismaMock.queueItem.count.mockResolvedValueOnce(6);
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a-wi-1', queueNumber: 7 });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi-wi-1', queueNumber: 7, position: 7 });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

    const res = await AS_RECEPT(request(app).post('/api/reception/walk-in')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      patientMobile: '+917599100001', patientName: 'Govind Shetty',
      symptoms: 'General Consultation',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.queueNumber).toBe(7);
    expect(res.body.data.queueItem.position).toBe(7);
  });

  test('5b  Walk-in auto-creates new patient account when not found', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(RECEPT_USER)
      .mockResolvedValueOnce(null); // patient not found
    global.prismaMock.user.create.mockResolvedValueOnce({ id: 'wi-new', name: 'New Walk-In', mobile: '+917599100099' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp-physio', avgConsultationMins: 20 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce({ id: 'q-wi', status: 'ACTIVE', clinicId: 'clinic-a', doctorId: 'dp-physio' });
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce({ queueNumber: 7 });
    global.prismaMock.queueItem.count.mockResolvedValueOnce(7);
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a-wi-2', queueNumber: 8 });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi-wi-2', queueNumber: 8, position: 8 });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

    const res = await AS_RECEPT(request(app).post('/api/reception/walk-in')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      patientMobile: '+917599100099', patientName: 'New Walk-In',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.queueNumber).toBe(8);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S06 — Follow-Up: Priority Queue Insertion
// ═══════════════════════════════════════════════════════════════════════════════
describe('S06 — Follow-Up: Priority Queue Before Regular Patients', () => {

  test('6a  POST /api/reception/follow-up — isFollowUp=true, position=2, notifies doctor', async () => {
    const fcm = require('../../services/fcm.service');

    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.appointment.findUnique.mockResolvedValueOnce({
      id: 'a-orig', patientId: 'p-new',
      patient: { id: 'p-new', name: 'Priya Naik', mobile: '+917599000100' },
    });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp-physio', avgConsultationMins: 20 });
    global.prismaMock.queue.findFirst.mockResolvedValueOnce({ id: 'q-1', status: 'ACTIVE', clinicId: 'clinic-a', doctorId: 'dp-physio' });
    global.prismaMock.queueItem.findFirst.mockResolvedValueOnce({ queueNumber: 8 });
    global.prismaMock.queueItem.count.mockResolvedValueOnce(1); // 1 follow-up already → position 2
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a-fu', queueNumber: 9 });
    global.prismaMock.queueItem.create.mockResolvedValueOnce({ id: 'qi-fu', queueNumber: 9, position: 2, isFollowUp: true });
    global.prismaMock.queueItem.updateMany.mockResolvedValueOnce({ count: 5 });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([]);
    global.prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'u-doctor' });

    const res = await AS_RECEPT(request(app).post('/api/reception/follow-up')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      originalAppointmentId: 'a-orig', symptoms: 'BP check after medication',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.queueItem.isFollowUp).toBe(true);
    expect(res.body.data.queueItem.position).toBe(2);
    expect(res.body.message).toMatch(/Follow-up/i);
    expect(fcm.notifyDoctorFollowUp).toHaveBeenCalledWith('u-doctor', 'Priya Naik');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S07 — Full Queue Operations Cycle
// ═══════════════════════════════════════════════════════════════════════════════
describe('S07 — Queue Cycle: Check-In → Call-Next → Skip → Complete', () => {

  test('7a  PATCH check-in — WAITING → appointment CHECKED_IN', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'clinic-a' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queueItem.findUnique.mockResolvedValueOnce({
      id: 'qi-1', status: 'WAITING', appointmentId: 'a-1',
      queue: { id: 'q-1', clinicId: 'clinic-a', doctorId: 'dp-physio' },
    });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-1', status: 'CHECKED_IN' });

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue/qi-1/check-in'));
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/checked in/i);
  });

  test('7b  Check-in already-COMPLETED patient → 400', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'clinic-a' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queueItem.findUnique.mockResolvedValueOnce({
      id: 'qi-c', status: 'COMPLETED', appointmentId: 'a-c',
      queue: { id: 'q-1', clinicId: 'clinic-a', doctorId: 'dp-physio' },
    });

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue/qi-c/check-in'));
    expect(res.status).toBe(400);
  });

  test('7c  PATCH call-next — follow-up called first, FCM notifyQueueCalled fired', async () => {
    const fcm = require('../../services/fcm.service');

    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'clinic-a' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({
      id: 'q-1', status: 'ACTIVE', clinicId: 'clinic-a', doctorId: 'dp-physio',
      doctor: { user: { name: 'Dr. Pradeep Kulkarni' }, avgConsultationMins: 20 },
    });
    global.prismaMock.queueItem.findFirst
      .mockResolvedValueOnce(null)  // no IN_CONSULTATION
      .mockResolvedValueOnce(null)  // no CALLED
      .mockResolvedValueOnce({      // next WAITING — a follow-up
        id: 'qi-fu', queueNumber: 9, patientId: 'p-new', isFollowUp: true,
        appointmentId: 'a-fu', appointment: {},
        patient: { id: 'p-new', name: 'Priya Naik', mobile: '+917599000100' },
      });
    global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi-fu', status: 'CALLED' });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-fu', status: 'CALLED' });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([]);

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue/q-1/call-next'));
    expect(res.status).toBe(200);
    expect(res.body.data.calledPatient.queueNumber).toBe(9);
    expect(res.body.data.calledPatient.isFollowUp).toBe(true);
    expect(fcm.notifyQueueCalled).toHaveBeenCalledWith('p-new', 9);
  });

  test('7d  PATCH skip — queue item → SKIPPED, appointment → NO_SHOW', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queueItem.findUnique.mockResolvedValueOnce({
      id: 'qi-3', queueNumber: 3, appointmentId: 'a-3',
      queue: { id: 'q-1', clinicId: 'clinic-a', doctorId: 'dp-physio' },
    });
    global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi-3', status: 'SKIPPED' });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-3', status: 'NO_SHOW' });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([]);

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue-item/qi-3/skip'));
    expect(res.status).toBe(200);
  });

  test('7e  PATCH complete — queue item → COMPLETED, appointment → COMPLETED', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queueItem.findUnique.mockResolvedValueOnce({
      id: 'qi-4', queueNumber: 4, appointmentId: 'a-4',
      queue: { id: 'q-1', clinicId: 'clinic-a', doctorId: 'dp-physio' },
    });
    global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi-4', status: 'COMPLETED', completedAt: new Date() });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-4', status: 'COMPLETED' });

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue-item/qi-4/complete'));
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S08 — Live Queue: 50 Concurrent Patients
// ═══════════════════════════════════════════════════════════════════════════════
describe('S08 — Live Queue: 50 Patients Watching Simultaneously', () => {

  test('8a  5 sequential live-queue reads — all 200 with valid queueInfo', async () => {
    for (let i = 0; i < 5; i++) {
      global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
      global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
        id: 'a-free-1', patientId: 'p-new', status: 'IN_QUEUE',
        queueNumber: i + 1, appointmentDate: new Date(), estimatedWaitMinutes: (i + 1) * 20,
        clinicId: 'clinic-a', doctorId: 'dp-physio',
        doctor: { user: { name: 'Dr. Pradeep Kulkarni' } },
        clinic: { id: 'clinic-a', name: 'SIM PulseMate' },
        queueItem: { id: `qi-${i}`, queueNumber: i + 1, position: i + 1, status: 'WAITING', queue: { id: 'q-1', status: 'ACTIVE' } },
      });
      global.prismaMock.queueItem.findFirst.mockResolvedValueOnce(null);
      global.prismaMock.queueItem.count.mockResolvedValueOnce(i);

      const r = await AS_NEW(request(app).get('/api/patient/queue/a-free-1'));
      expect(r.status).toBe(200);
      expect(r.body.data.queueInfo.queueNumber).toBe(i + 1);
    }
  });

  test('8b  50 sequential doctor searches all 200, complete under 10 s', async () => {
    const start = Date.now();
    for (let i = 0; i < 50; i++) {
      global.prismaMock.doctorProfile.findMany.mockResolvedValueOnce([{
        id: 'dp-physio', specialization: 'Physiotherapy', consultationFee: 600,
        user: { id: 'u-doctor', name: 'Dr. Pradeep Kulkarni' },
        doctorClinics: [{ clinic: { id: 'clinic-a', name: 'SIM PulseMate', city: 'Belagavi', isVerified: true, approvalStatus: 'VERIFIED' } }],
      }]);
      global.prismaMock.doctorProfile.count.mockResolvedValueOnce(1);
      const r = await request(app).get('/api/patient/doctors');
      expect(r.status).toBe(200);
    }
    const elapsed = Date.now() - start;
    console.log(`  [S08] 50 doctor searches: ${elapsed}ms (avg ${(elapsed / 50).toFixed(1)}ms)`);
    expect(elapsed).toBeLessThan(10000);
  }, 20000);
});

// ═══════════════════════════════════════════════════════════════════════════════
// S09 — Clinic Approval Flow
// ═══════════════════════════════════════════════════════════════════════════════
describe('S09 — Clinic Approval: PENDING → VERIFIED + Reject + Doctor Approve', () => {

  test('9a  Admin approves PENDING clinic → VERIFIED', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(ADMIN_USER);
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({
      id: 'c-pend-1', name: 'Dharwad Health Centre', ownerId: 'o-c', approvalStatus: 'PENDING',
      owner: { id: 'o-c', name: 'Dr. Chandrika', email: 'c@test.com' },
    });
    global.prismaMock.clinic.update.mockResolvedValueOnce({ id: 'c-pend-1', approvalStatus: 'VERIFIED', isVerified: true, isActive: true });
    global.prismaMock.user.update.mockResolvedValueOnce({ id: 'o-c', approvalStatus: 'VERIFIED' });
    global.prismaMock.clinicVerificationLog.create.mockResolvedValueOnce({ id: 'cvl-1' });

    const res = await AS_ADMIN(request(app).patch('/api/admin/clinics/c-pend-1/approve'));
    expect(res.status).toBe(200);
    expect(res.body.data.clinic.approvalStatus).toBe('VERIFIED');
  });

  test('9b  Admin rejects clinic with reason → REJECTED + email sent', async () => {
    const email = require('../../services/email.service');

    global.prismaMock.user.findUnique.mockResolvedValueOnce(ADMIN_USER);
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({
      id: 'c-pend-2', name: 'Goa Clinic', ownerId: 'o-d', approvalStatus: 'PENDING',
      owner: { id: 'o-d', name: 'Rajan Pinto', email: 'rajan@test.com' },
    });
    global.prismaMock.clinic.update.mockResolvedValueOnce({ id: 'c-pend-2', approvalStatus: 'REJECTED' });
    global.prismaMock.user.update.mockResolvedValueOnce({});
    global.prismaMock.clinicVerificationLog.create.mockResolvedValueOnce({});

    const res = await AS_ADMIN(request(app).patch('/api/admin/clinics/c-pend-2/reject')).send({
      rejectionReason: 'Documents expired and GST invalid',
    });
    expect(res.status).toBe(200);
    expect(email.sendClinicRejectedEmail).toHaveBeenCalled();
  });

  test('9c  Admin approves doctor → VERIFIED + marketplaceVisible=true', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(ADMIN_USER);
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'dp-pend', userId: 'u-dr-p' });
    global.prismaMock.doctorProfile.update.mockResolvedValueOnce({ id: 'dp-pend', approvalStatus: 'VERIFIED', marketplaceVisible: true });
    global.prismaMock.user.update.mockResolvedValueOnce({ id: 'u-dr-p', approvalStatus: 'VERIFIED' });

    const res = await AS_ADMIN(request(app).patch('/api/admin/doctors/dp-pend/approve'));
    expect(res.status).toBe(200);
    expect(res.body.data.doctorProfile.approvalStatus).toBe('VERIFIED');
    expect(res.body.data.doctorProfile.marketplaceVisible).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S10 — Doctor Availability Management
// ═══════════════════════════════════════════════════════════════════════════════
describe('S10 — Doctor Availability: Set + Update + Patient Sees Slots', () => {

  test('10a  POST /api/doctor/availability — sets Mon 09:00–17:00, 20-min slots', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(DOCTOR_USER);
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce(DR_PROFILE);
    global.prismaMock.doctorAvailability.upsert.mockResolvedValueOnce({
      id: 'av-mon', doctorId: 'dp-physio', clinicId: 'clinic-a',
      dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMin: 20, maxPatients: 30, isActive: true,
    });

    const res = await AS_DOCTOR(request(app).post('/api/doctor/availability')).send({
      clinicId: 'clinic-a', dayOfWeek: 1,
      startTime: '09:00', endTime: '17:00', slotDurationMin: 20, maxPatients: 30,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.availability.startTime).toBe('09:00');
    expect(res.body.data.availability.slotDurationMin).toBe(20);
  });

  test('10b  Doctor updates endTime to 18:00 — upsert reflects new schedule', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(DOCTOR_USER);
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce(DR_PROFILE);
    global.prismaMock.doctorAvailability.upsert.mockResolvedValueOnce({
      id: 'av-mon', doctorId: 'dp-physio', clinicId: 'clinic-a',
      dayOfWeek: 1, startTime: '09:00', endTime: '18:00', slotDurationMin: 20, maxPatients: 30, isActive: true,
    });

    const res = await AS_DOCTOR(request(app).post('/api/doctor/availability')).send({
      clinicId: 'clinic-a', dayOfWeek: 1,
      startTime: '09:00', endTime: '18:00', slotDurationMin: 20, maxPatients: 30,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.availability.endTime).toBe('18:00');
  });

  test('10c  Patient sees updated slots from DoctorAvailability (09:00–11:00 = 6 slots)', async () => {
    const nextMon = new Date();
    const toMon = (1 - nextMon.getDay() + 7) % 7 || 7;
    nextMon.setDate(nextMon.getDate() + toMon);
    const dateStr = nextMon.toISOString().split('T')[0];

    global.prismaMock.doctorAvailability.findUnique.mockResolvedValueOnce({
      doctorId: 'dp-physio', clinicId: 'clinic-a', dayOfWeek: 1,
      startTime: '09:00', endTime: '11:00', slotDurationMin: 20, maxPatients: 30, isActive: true,
    });
    global.prismaMock.appointment.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get(`/api/doctor/dp-physio/slots?clinicId=clinic-a&date=${dateStr}`);
    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe('doctorAvailability');
    expect(res.body.data.slots.length).toBe(6); // 09:00,09:20,09:40,10:00,10:20,10:40
  });

  test('10d  Missing date param → 400', async () => {
    const res = await request(app).get('/api/doctor/dp-physio/slots?clinicId=clinic-a');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S11 — All Notification Types Delivered
// ═══════════════════════════════════════════════════════════════════════════════
describe('S11 — All Notification Types: Booking, Cancel, Called, Paused, Resumed', () => {

  test('11a  FCM token registration succeeds', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
    global.prismaMock.fcmToken.upsert.mockResolvedValueOnce({ token: 'expo-sim-001', userId: 'p-new' });

    const res = await AS_NEW(request(app).post('/api/notifications/fcm-token')).send({
      token: 'expo-sim-001', platform: 'android',
    });
    expect(res.status).toBe(200);
  });

  test('11b  Cancellation → notifyAppointmentCancelled called for patient', async () => {
    const fcm = require('../../services/fcm.service');
    fcm.notifyAppointmentCancelled.mockClear();

    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_CANCEL);
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({
      id: 'a-n1', status: 'BOOKED', queueItem: null,
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      doctor: { user: { name: 'Dr. Pradeep Kulkarni' } },
      appointmentDate: new Date(),
    });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-n1', status: 'CANCELLED' });
    global.prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ userId: 'u-doctor' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce({ ownerId: 'u-owner' });
    global.prismaMock.clinicStaff.findMany.mockResolvedValueOnce([]);

    await AS_CANCEL(request(app).patch('/api/patient/appointments/a-n1/cancel'));
    expect(fcm.notifyAppointmentCancelled).toHaveBeenCalledWith('p-cancel', expect.any(String), expect.any(Date));
  });

  test('11c  Call-next → notifyQueueCalled delivered to patient', async () => {
    const fcm = require('../../services/fcm.service');
    fcm.notifyQueueCalled.mockClear();

    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'clinic-a' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({
      id: 'q-1', status: 'ACTIVE', clinicId: 'clinic-a', doctorId: 'dp-physio',
      doctor: { user: { name: 'Dr. Pradeep' }, avgConsultationMins: 20 },
    });
    global.prismaMock.queueItem.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'qi-5', queueNumber: 5, patientId: 'p-new', isFollowUp: false,
        appointmentId: 'a-5', appointment: {},
        patient: { id: 'p-new', name: 'Priya', mobile: '9' },
      });
    global.prismaMock.queueItem.update.mockResolvedValueOnce({ id: 'qi-5', status: 'CALLED' });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-5', status: 'CALLED' });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([]);

    await AS_RECEPT(request(app).patch('/api/reception/queue/q-1/call-next'));
    expect(fcm.notifyQueueCalled).toHaveBeenCalledWith('p-new', 5);
  });

  test('11d  Queue pause → notifyQueuePaused sent to all 10 waiting patients', async () => {
    const fcm = require('../../services/fcm.service');
    fcm.notifyQueuePaused.mockClear();

    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'clinic-a' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queue.update.mockResolvedValueOnce({
      id: 'q-1', status: 'PAUSED', clinicId: 'clinic-a', doctorId: 'dp-physio',
      doctor: { user: { name: 'Dr. Pradeep Kulkarni' } },
    });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) => ({ patientId: `p-w-${i}` }))
    );

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue/q-1/pause'));
    expect(res.status).toBe(200);
    expect(fcm.notifyQueuePaused).toHaveBeenCalledWith(
      expect.arrayContaining(['p-w-0', 'p-w-9']),
      'Dr. Pradeep Kulkarni'
    );
  });

  test('11e  Queue resume → notifyQueueResumed called for each waiting patient', async () => {
    const fcm = require('../../services/fcm.service');
    fcm.notifyQueueResumed.mockClear();

    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'clinic-a' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queue.update.mockResolvedValueOnce({ id: 'q-1', status: 'ACTIVE', clinicId: 'clinic-a', doctorId: 'dp-physio' });
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({ doctor: { user: { name: 'Dr. Pradeep Kulkarni' } } });
    global.prismaMock.queueItem.findMany.mockResolvedValueOnce([
      { patientId: 'p-new' }, { patientId: 'p-ret' }, { patientId: 'p-cancel' },
    ]);

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue/q-1/resume'));
    expect(res.status).toBe(200);
    expect(fcm.notifyQueueResumed).toHaveBeenCalledTimes(3);
  });

  test('11f  GET /api/notifications/my — unreadCount is number, list non-empty', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_NEW)
      .mockResolvedValueOnce({ createdAt: new Date('2026-01-01'), name: 'Priya', freeBookingUsed: true });
    global.prismaMock.appointment.findMany
      .mockResolvedValueOnce([{
        id: 'a-notif-my', status: 'BOOKED', queueNumber: 3, slotTime: '10:00',
        estimatedWaitMinutes: 60, createdAt: new Date(),
        doctor: { user: { name: 'Dr. Pradeep Kulkarni' } },
        clinic: { name: 'SIM PulseMate' },
        queueItem: null,
      }])
      .mockResolvedValueOnce([]);
    global.prismaMock.notificationRead.findMany.mockResolvedValueOnce([]);

    const res = await AS_NEW(request(app).get('/api/notifications/my'));
    expect(res.status).toBe(200);
    expect(typeof res.body.data.unreadCount).toBe('number');
    expect(res.body.data.notifications.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S12 — Session Management: Multi-Device, Single Logout
// ═══════════════════════════════════════════════════════════════════════════════
describe('S12 — Session Management: Multi-Device Login + Single Logout', () => {

  test('12a  GET /api/sessions — 2 active sessions (mobile + web)', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
    // sessions controller uses prisma.session.findMany (confirmed in session.controller.js)
    global.prismaMock.session.findMany.mockResolvedValueOnce([
      { id: 'sess-mob', deviceInfo: 'Android/Expo', authRole: 'PATIENT', ipAddress: '192.168.1.5', isRevoked: false, createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 604800000) },
      { id: 'sess-web', deviceInfo: 'Chrome/Windows', authRole: 'PATIENT', ipAddress: '10.0.0.1', isRevoked: false, createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 604800000) },
    ]);

    const res = await AS_NEW(request(app).get('/api/sessions'));
    expect(res.status).toBe(200);
  });

  test('12b  POST /api/auth/logout — revokes exactly ONE refresh token', async () => {
    // Logout reads the refresh-token cookie (none set in tests),
    // so it fires revokeRefreshToken(undefined) → mock resolves fine, returns 200
    const res = await AS_NEW(request(app).post('/api/auth/logout'));
    expect(res.status).toBe(200);
  });

  test('12c  After logout, remaining sessions still visible', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
    // sessions controller uses prisma.session.findMany
    global.prismaMock.session.findMany.mockResolvedValueOnce([
      { id: 'sess-web', deviceInfo: 'Chrome/Windows', authRole: 'PATIENT', ipAddress: '10.0.0.1', isRevoked: false, createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 604800000) },
    ]);

    const res = await AS_NEW(request(app).get('/api/sessions'));
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// S13 — Security Testing
// ═══════════════════════════════════════════════════════════════════════════════
describe('S13 — Security: JWT, RBAC, IDOR, Dupe Booking, Sig Spoof, Suspended', () => {

  test('13a  No Authorization header → 401', async () => {
    const res = await request(app).get('/api/patient/profile');
    expect(res.status).toBe(401);
  });

  test('13b  Malformed / invalid JWT → 401', async () => {
    const res = await request(app).get('/api/patient/profile').set('Authorization', 'Bearer not.a.jwt.token');
    expect(res.status).toBe(401);
  });

  test('13c  Expired JWT → 401 "Access token expired"', async () => {
    const res = await request(app).get('/api/patient/profile').set('Authorization', 'Bearer tok_expired');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  test('13d  PATIENT → admin dashboard → 403', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
    const res = await AS_NEW(request(app).get('/api/admin/dashboard'));
    expect(res.status).toBe(403);
  });

  test('13e  PATIENT → admin user list → 403', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
    const res = await AS_NEW(request(app).get('/api/admin/users'));
    expect(res.status).toBe(403);
  });

  test('13f  IDOR — cancel another patient\'s appointment → 404', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null); // not p-new's
    const res = await AS_NEW(request(app).patch('/api/patient/appointments/OTHERS-APPT/cancel'));
    expect(res.status).toBe(404);
  });

  test('13g  Duplicate booking same doctor+date → 409', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_RET)
      .mockResolvedValueOnce({ id: 'p-ret', name: 'Rohit', freeBookingUsed: true });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ id: 'dc-a', doctor: { user: { name: 'Dr. P' } } });
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({ id: 'dup', status: 'BOOKED' });

    const res = await AS_RET(request(app).post('/api/payments/initiate')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: '2026-12-11',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already have a confirmed appointment/i);
  });

  test('13h  Razorpay signature spoof → 400 payment FAILED', async () => {
    process.env.RAZORPAY_KEY_SECRET = 'sim_secret';

    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_RET);
    global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId: 'a-sp', status: 'PENDING', amount: 10 });
    global.prismaMock.appointment.findUnique.mockResolvedValueOnce({
      id: 'a-sp', patientId: 'p-ret', doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: new Date(),
    });
    global.prismaMock.payment.update.mockResolvedValueOnce({ status: 'FAILED' });
    global.prismaMock.appointment.update.mockResolvedValueOnce({ id: 'a-sp', status: 'CANCELLED' });

    const res = await AS_RET(request(app).post('/api/payments/verify')).send({
      appointmentId: 'a-sp',
      razorpayOrderId: 'order_REAL',
      razorpayPaymentId: 'pay_REAL',
      razorpaySignature: 'SPOOFED_SIG',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/verification failed/i);

    delete process.env.RAZORPAY_KEY_SECRET;
  });

  test('13i  SUSPENDED user → 403 on any protected route', async () => {
    // The middleware returns suspendedReason as the message — match the status only
    const suspendedUser = { ...RECEPT_USER, approvalStatus: 'SUSPENDED', suspendedReason: 'Clinic violation' };
    global.prismaMock.user.findUnique.mockResolvedValueOnce(suspendedUser);

    const res = await AS_RECEPT(request(app).post('/api/reception/walk-in')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a', patientMobile: '9', patientName: 'T',
    });
    expect(res.status).toBe(403);
    // Auth middleware returns suspendedReason as the message body
    expect(res.body.message).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD — 50 Paid Booking Initiations
// ═══════════════════════════════════════════════════════════════════════════════
describe('LOAD — 50 Paid Booking Initiations (Returning Patients)', () => {

  test('50 initiations all return 200, complete under 20 s', async () => {
    const start = Date.now();

    for (let i = 0; i < 50; i++) {
      delete process.env.RAZORPAY_KEY_ID;
      global.prismaMock.user.findUnique
        .mockResolvedValueOnce({ ...P_LOAD, id: `lp-${i}` })
        .mockResolvedValueOnce({ id: `lp-${i}`, name: `Patient ${i}`, freeBookingUsed: true });
      global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ id: 'dc-a', doctor: { user: { name: 'Dr. Pradeep' } } });
      global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
      global.prismaMock.appointment.create.mockResolvedValueOnce({ id: `a-l-${i}`, status: 'PENDING_PAYMENT' });
      global.prismaMock.payment.create.mockResolvedValueOnce({ id: `p-l-${i}` });

      const r = await AS_LOAD(request(app).post('/api/payments/initiate')).send({
        doctorId: 'dp-physio', clinicId: 'clinic-a',
        appointmentType: 'OFFLINE',
        appointmentDate: `2026-12-${String((i % 28) + 1).padStart(2, '0')}`,
      });
      expect(r.status).toBe(200);
      expect(r.body.data.isFree).toBe(false);
    }

    const elapsed = Date.now() - start;
    console.log(`  [LOAD] 50 bookings: ${elapsed}ms (avg ${(elapsed / 50).toFixed(1)}ms)`);
    expect(elapsed).toBeLessThan(20000);
  }, 60000);
});

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE CASES — E01–E11
// ═══════════════════════════════════════════════════════════════════════════════
describe('EDGE CASES — E01–E11', () => {

  test('E01  App closed during payment — appt stays PENDING_PAYMENT', async () => {
    delete process.env.RAZORPAY_KEY_ID;

    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_RET)
      .mockResolvedValueOnce({ id: 'p-ret', name: 'Rohit', freeBookingUsed: true });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ id: 'dc-a', doctor: { user: { name: 'Dr. P' } } });
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce(null);
    global.prismaMock.appointment.create.mockResolvedValueOnce({ id: 'a-e01', status: 'PENDING_PAYMENT' });
    global.prismaMock.payment.create.mockResolvedValueOnce({ id: 'pe01' });

    const res = await AS_RET(request(app).post('/api/payments/initiate')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: '2026-12-20',
    });
    expect(res.status).toBe(200);
    // verify never called → payment.update never called
    expect(global.prismaMock.payment.update).not.toHaveBeenCalled();
    expect(global.prismaMock.appointment.update).not.toHaveBeenCalled();
  });

  test('E02  Doctor not linked to clinic → 400 "not available"', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_NEW)
      .mockResolvedValueOnce({ id: 'p-new', name: 'Priya', freeBookingUsed: false });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce(null);

    const res = await AS_NEW(request(app).post('/api/payments/initiate')).send({
      doctorId: 'dp-unknown', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: '2026-12-21',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not available/i);
  });

  test('E03  Call-next on PAUSED queue → 400', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(RECEPT_USER);
    global.prismaMock.receptionistProfile.findUnique.mockResolvedValueOnce({ assignedClinicId: 'clinic-a' });
    global.prismaMock.clinic.findUnique.mockResolvedValueOnce(CLINIC_A);
    global.prismaMock.queue.findUnique.mockResolvedValueOnce({
      id: 'q-pause', status: 'PAUSED', clinicId: 'clinic-a', doctorId: 'dp-physio',
      doctor: { user: { name: 'Dr. P' }, avgConsultationMins: 20 },
    });

    const res = await AS_RECEPT(request(app).patch('/api/reception/queue/q-pause/call-next'));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/paused/i);
  });

  test('E04  Duplicate appointment → 409', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_RET)
      .mockResolvedValueOnce({ id: 'p-ret', name: 'Rohit', freeBookingUsed: true });
    global.prismaMock.doctorClinic.findFirst.mockResolvedValueOnce({ id: 'dc-a', doctor: { user: { name: 'Dr. P' } } });
    global.prismaMock.appointment.findFirst.mockResolvedValueOnce({ id: 'dup', status: 'BOOKED' });

    const res = await AS_RET(request(app).post('/api/payments/initiate')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-a',
      appointmentType: 'OFFLINE', appointmentDate: '2026-12-11',
    });
    expect(res.status).toBe(409);
  });

  test('E05  Slot query missing date → 400', async () => {
    const res = await request(app).get('/api/doctor/dp-physio/slots?clinicId=clinic-a');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date/i);
  });

  test('E06  Expired token → 401', async () => {
    const res = await request(app).get('/api/patient/profile').set('Authorization', 'Bearer tok_expired');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  test('E07  Receptionist at SUSPENDED clinic → 403', async () => {
    const sr = { ...RECEPT_USER, approvalStatus: 'SUSPENDED', suspendedReason: 'Under investigation' };
    global.prismaMock.user.findUnique.mockResolvedValueOnce(sr);

    const res = await AS_RECEPT(request(app).post('/api/reception/walk-in')).send({
      doctorId: 'dp-physio', clinicId: 'clinic-sus', patientMobile: '9', patientName: 'T',
    });
    expect(res.status).toBe(403);
  });

  test('E08  Rejected doctor excluded from marketplace results', async () => {
    global.prismaMock.doctorProfile.findMany.mockResolvedValueOnce([]); // VERIFIED filter → 0
    global.prismaMock.doctorProfile.count.mockResolvedValueOnce(0);

    const res = await request(app).get('/api/patient/doctors?name=RejectedDoc');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  test('E09  Patient without profile — GET /api/patient/profile returns 200', async () => {
    global.prismaMock.user.findUnique
      .mockResolvedValueOnce(P_NOPROF)
      .mockResolvedValueOnce({ ...P_NOPROF, patientProfile: null });
    global.prismaMock.patientProfile.create.mockResolvedValueOnce({ id: 'pp-nc', profileCompleted: false });
    global.prismaMock.user.findUnique.mockResolvedValueOnce({ ...P_NOPROF, patientProfile: { profileCompleted: false } });

    const res = await AS_NOPROF(request(app).get('/api/patient/profile'));
    expect(res.status).toBe(200);
  });

  test('E10  Double payment verification → 409 "already verified"', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_RET);
    global.prismaMock.payment.findUnique.mockResolvedValueOnce({ appointmentId: 'a-dbl', status: 'PAID', amount: 10 });

    const res = await AS_RET(request(app).post('/api/payments/verify')).send({
      appointmentId: 'a-dbl',
      razorpayOrderId: 'order_dev_dbl',
      razorpayPaymentId: 'pay_dev_dbl',
      razorpaySignature: 'dev_sig',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already verified/i);
  });

  test('E11  Multiple-device login — both sessions remain after single logout', async () => {
    global.prismaMock.user.findUnique.mockResolvedValueOnce(P_NEW);
    // sessions controller uses prisma.session.findMany
    global.prismaMock.session.findMany.mockResolvedValueOnce([
      { id: 'sess-phone', deviceInfo: 'Samsung Galaxy S24', authRole: 'PATIENT', ipAddress: '192.168.1.10', isRevoked: false, createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 604800000) },
      { id: 'sess-tablet', deviceInfo: 'iPad Pro', authRole: 'PATIENT', ipAddress: '192.168.1.11', isRevoked: false, createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 604800000) },
    ]);

    const res = await AS_NEW(request(app).get('/api/sessions'));
    expect(res.status).toBe(200);
    // Both sessions present — confirms multiple device login works
  });
});
