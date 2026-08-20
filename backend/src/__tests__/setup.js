'use strict';
/**
 * Global Jest test setup.
 * Mocks Prisma so tests never touch a real database.
 * Every prisma.model.method becomes a jest.fn() returning undefined by default.
 * Individual tests override with .mockResolvedValueOnce() as needed.
 *
 * NOTE: Jest requires jest.mock() factory functions not to reference
 * out-of-scope variables (unless they are prefixed with 'mock').
 * We therefore build the mock object inside the factory and expose it
 * via global.prismaMock for test files to reference.
 */

// ── Prisma mock ────────────────────────────────────────────────────────────────
// Build the mock object once, attach to global so test files can access it.
const mockPrismaDb = {
  user: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
    delete: jest.fn(), count: jest.fn(), upsert: jest.fn(),
  },
  patientProfile: { create: jest.fn(), update: jest.fn(), upsert: jest.fn(), findUnique: jest.fn() },
  doctorProfile: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    update: jest.fn(), count: jest.fn(),
  },
  clinic: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), count: jest.fn(),
  },
  clinicStaff: {
    findMany: jest.fn(), findFirst: jest.fn(),
    create: jest.fn(), update: jest.fn(), delete: jest.fn(),
  },
  doctorClinic: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(),
  },
  queue: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
  },
  queueItem: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), upsert: jest.fn(), count: jest.fn(),
    aggregate: jest.fn(),
  },
  fcmToken: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  otpVerification: {
    findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn(),
  },
  refreshToken: {
    findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
  },
  session: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  auditLog: { create: jest.fn(), deleteMany: jest.fn() },
  reminderSent: { findUnique: jest.fn(), create: jest.fn() },
  doctorAvailability: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), upsert: jest.fn(),
  },
  notificationRead: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  receptionistProfile: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), upsert: jest.fn(),
  },
  emailVerification: {
    findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn(),
  },
  passwordResetToken: {
    findFirst: jest.fn(), create: jest.fn(), update: jest.fn(),
  },
  prescriptionMedicine: {
    findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn(),
  },
  prescription: {
    findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
    create: jest.fn(), update: jest.fn(), count: jest.fn(),
  },
  clinicVerificationLog: {
    create: jest.fn(), findMany: jest.fn(),
  },
  // Prisma transaction helper — default impl runs the callback with prismaMock as tx
  $transaction: jest.fn((fn) => {
    if (typeof fn === 'function') return fn(mockPrismaDb);
    return Promise.all(fn);
  }),
};

// ── jest.mock factory — only references the 'mock'-prefixed variable ──────────
jest.mock('../config/database', () => mockPrismaDb);

// ── Logger mock (suppress output during tests) ────────────────────────────────
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// ── Redis mock ─────────────────────────────────────────────────────────────────
jest.mock('../config/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  setex: jest.fn().mockResolvedValue('OK'),
}));

// Expose via global so test files can do: global.prismaMock.user.findUnique...
global.prismaMock = mockPrismaDb;

beforeEach(() => {
  // Reset all mock implementations before each test
  Object.values(mockPrismaDb).forEach((model) => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && fn.mockReset) fn.mockReset();
      });
    }
  });

  // Restore default $transaction behaviour after each test
  mockPrismaDb.$transaction.mockImplementation((fn) => {
    if (typeof fn === 'function') {
      // Pass a shallow clone without $transaction to avoid circular recursion
      const txProxy = { ...mockPrismaDb };
      delete txProxy.$transaction;
      return fn(txProxy);
    }
    return Promise.all(fn);
  });
});
