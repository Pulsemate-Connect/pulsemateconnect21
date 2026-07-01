'use strict';
/**
 * Unit tests — dashboard-enhanced.controller.js
 * Tests use mock req/res objects and jest.mock for prisma.
 * Requirements: 10.11–10.14
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../config/database', () => ({
  clinic: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  appointment: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  payment: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  clinicStaff: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  patientProfile: {
    findMany: jest.fn(),
  },
  dashboardWidgetPreference: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock('../../../utils/response', () => ({
  sendSuccess: jest.fn((res, data) => res.json({ success: true, data })),
  sendError: jest.fn((res, message, status) => res.status(status || 400).json({ success: false, message })),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

const prisma = require('../../../config/database');
const {
  getEnhancedDashboard,
  getComparisonData,
  getChartData,
  getTransactions,
  saveWidgetPreferences,
} = require('../../../controllers/dashboard-enhanced.controller');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockReq = (overrides = {}) => ({
  params: { clinicId: 'clinic-123' },
  query: { period: 'month' },
  body: {},
  user: { id: 'user-123', role: 'CLINIC_OWNER' },
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Default mock values for prisma.$transaction
const makeDefaultTransactionMocks = () => [
  // allPatientIds
  [{ patientId: 'p1' }, { patientId: 'p2' }],
  // firstTimePatientIds
  [{ patientId: 'p1', appointmentDate: new Date() }],
  // totalAppointments
  10,
  // completedAppointments
  8,
  // cancelledAppointments
  1,
  // noShowAppointments
  1,
  // completedWithTimestamps
  [{ createdAt: new Date(Date.now() - 600000), updatedAt: new Date() }],
  // appointmentsWithWait
  { _avg: { estimatedWaitMinutes: 15 } },
  // appointmentsWithHour
  [{ appointmentDate: new Date() }],
  // revenueAggregate
  { _sum: { amount: 5000 }, _count: { id: 5 } },
  // cashRevenue
  { _sum: { amount: 2000 } },
  // onlineRevenue
  { _sum: { amount: 3000 } },
  // thisMonthRevenue
  { _sum: { amount: 5000 } },
  // lastMonthRevenue
  { _sum: { amount: 4000 } },
  // activeStaff
  3,
  // totalDoctors
  2,
  // activeDoctors
  2,
  // totalReceptionists
  1,
  // thisWeekPatients
  [{ patientId: 'p1' }],
  // lastWeekPatients
  [{ patientId: 'p2' }],
];

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── getEnhancedDashboard ─────────────────────────────────────────────────────

describe('getEnhancedDashboard', () => {
  test('returns 400 when period is an invalid enum value', async () => {
    const req = mockReq({ query: { period: 'invalid-period' } });
    const res = mockRes();
    await getEnhancedDashboard(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('returns 403 when clinic not found for the user', async () => {
    const req = mockReq();
    const res = mockRes();
    // CLINIC_OWNER role → findFirst is called
    prisma.clinic.findFirst.mockResolvedValue(null);
    await getEnhancedDashboard(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 200 with correct metrics structure on valid data', async () => {
    const req = mockReq();
    const res = mockRes();
    prisma.clinic.findFirst.mockResolvedValue({ id: 'clinic-123', name: 'Test Clinic', ownerId: 'user-123' });
    prisma.$transaction.mockResolvedValue(makeDefaultTransactionMocks());
    // For newPatients groupBy call outside transaction
    prisma.appointment.groupBy.mockResolvedValue([
      { patientId: 'p1', _min: { appointmentDate: new Date() } },
    ]);

    await getEnhancedDashboard(req, res, mockNext);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data.metrics).toBeDefined();
    expect(jsonCall.data.metrics.revenue).toBeDefined();
    expect(jsonCall.data.metrics.appointments).toBeDefined();
    expect(jsonCall.data.metrics.patients).toBeDefined();
    expect(jsonCall.data.metrics.staff).toBeDefined();
    expect(jsonCall.data.filteredCount).toBe(10);
  });

  test('SUPER_ADMIN bypasses clinic ownership check', async () => {
    const req = mockReq({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } });
    const res = mockRes();
    prisma.clinic.findUnique.mockResolvedValue({ id: 'clinic-123', name: 'Test Clinic', ownerId: 'other-user' });
    prisma.$transaction.mockResolvedValue(makeDefaultTransactionMocks());
    prisma.appointment.groupBy.mockResolvedValue([]);

    await getEnhancedDashboard(req, res, mockNext);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
  });
});

// ── getComparisonData ────────────────────────────────────────────────────────

describe('getComparisonData', () => {
  const setupVerifiedClinic = () => {
    prisma.clinic.findFirst.mockResolvedValue({ id: 'clinic-123', name: 'Test', ownerId: 'user-123' });
  };

  test('returns noPreviousData:true when period is "all"', async () => {
    setupVerifiedClinic();
    const req = mockReq({ query: { period: 'all' } });
    const res = mockRes();
    await getComparisonData(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.noPreviousData).toBe(true);
    expect(jsonCall.data.comparison).toBeNull();
  });

  test('returns noPreviousData:true when period is "custom"', async () => {
    setupVerifiedClinic();
    const req = mockReq({ query: { period: 'custom', startDate: '2025-01-01', endDate: '2025-01-31' } });
    const res = mockRes();
    await getComparisonData(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.noPreviousData).toBe(true);
  });

  test('returns comparison object with all 5 metric shapes for period "today"', async () => {
    setupVerifiedClinic();
    const req = mockReq({ query: { period: 'today' } });
    const res = mockRes();
    // Mock the transaction: [currentCompleted, currentTotal, currentPatients, currentRevenue,
    //                         prevCompleted, prevTotal, prevPatients, prevRevenue]
    prisma.$transaction.mockResolvedValue([
      8,  // currentCompletedCount
      10, // currentTotalCount
      [{ patientId: 'p1' }, { patientId: 'p2' }], // currentUniquePatients
      { _sum: { amount: 5000 }, _count: { id: 5 } }, // currentRevenue
      6,  // prevCompletedCount
      8,  // prevTotalCount
      [{ patientId: 'p3' }], // prevUniquePatients
      { _sum: { amount: 4000 }, _count: { id: 4 } }, // prevRevenue
    ]);

    await getComparisonData(req, res, mockNext);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    const { comparison } = jsonCall.data;
    expect(comparison).toBeDefined();
    expect(comparison.revenue).toHaveProperty('current');
    expect(comparison.revenue).toHaveProperty('previous');
    expect(comparison.revenue).toHaveProperty('delta');
    expect(comparison.revenue).toHaveProperty('pct');
    expect(comparison.patients).toBeDefined();
    expect(comparison.appointments).toBeDefined();
    expect(comparison.completionRate).toBeDefined();
    expect(comparison.avgRevPerAppt).toBeDefined();
    expect(comparison.label).toBe('vs. yesterday');
  });

  test('includes noPreviousData:true when all previous-period counts are 0', async () => {
    setupVerifiedClinic();
    const req = mockReq({ query: { period: 'week' } });
    const res = mockRes();
    prisma.$transaction.mockResolvedValue([
      5, 8, [{ patientId: 'p1' }], { _sum: { amount: 3000 }, _count: { id: 3 } },
      0, 0, [], { _sum: { amount: 0 }, _count: { id: 0 } },
    ]);
    await getComparisonData(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.noPreviousData).toBe(true);
  });
});

// ── getChartData ─────────────────────────────────────────────────────────────

describe('getChartData', () => {
  const setupMocks = () => {
    prisma.clinic.findFirst.mockResolvedValue({ id: 'clinic-123', name: 'Test', ownerId: 'user-123' });
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    prisma.appointment.count.mockResolvedValue(0);
    prisma.appointment.groupBy.mockResolvedValue([]);
    prisma.patientProfile.findMany.mockResolvedValue([]);
    prisma.clinicStaff.findMany.mockResolvedValue([]);
  };

  test('returns granularity "weekly" when date range is 15 days', async () => {
    setupMocks();
    const start = '2025-01-01';
    const end   = '2025-01-16'; // 15 days
    const req   = mockReq({ query: { period: 'custom', startDate: start, endDate: end } });
    const res   = mockRes();
    await getChartData(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.granularity).toBe('weekly');
  });

  test('returns granularity "daily" when date range is 7 days', async () => {
    setupMocks();
    const start = '2025-01-01';
    const end   = '2025-01-08'; // 7 days
    const req   = mockReq({ query: { period: 'custom', startDate: start, endDate: end } });
    const res   = mockRes();
    await getChartData(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.granularity).toBe('daily');
  });

  test('response contains all 8 chart series keys', async () => {
    setupMocks();
    const req = mockReq({ query: { period: 'month' } });
    const res = mockRes();
    await getChartData(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    const d = jsonCall.data;
    expect(d).toHaveProperty('revenueTrend');
    expect(d).toHaveProperty('appointmentTrend');
    expect(d).toHaveProperty('paymentBreakdown');
    expect(d).toHaveProperty('appointmentStatus');
    expect(d).toHaveProperty('doctorPerformance');
    expect(d).toHaveProperty('patientDemographics');
    expect(d).toHaveProperty('peakHours');
    expect(d).toHaveProperty('dayOfWeek');
    expect(d).toHaveProperty('granularity');
  });
});

// ── getTransactions ──────────────────────────────────────────────────────────

describe('getTransactions', () => {
  const setupMocks = (total) => {
    prisma.clinic.findFirst.mockResolvedValue({ id: 'clinic-123', name: 'Test', ownerId: 'user-123' });
    prisma.payment.count.mockResolvedValue(total);
    prisma.payment.findMany.mockResolvedValue([]);
  };

  test('returns paginated { transactions, total, page, pages } with default page=1', async () => {
    setupMocks(45);
    const req = mockReq({ query: { period: 'month' } });
    const res = mockRes();
    await getTransactions(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.page).toBe(1);
    expect(jsonCall.data.total).toBe(45);
    expect(jsonCall.data.pages).toBe(3); // ceil(45/20) = 3
    expect(jsonCall.data.transactions).toBeDefined();
  });

  test('includes truncated:true when total > 1000', async () => {
    setupMocks(1500);
    const req = mockReq({ query: { period: 'all' } });
    const res = mockRes();
    await getTransactions(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.truncated).toBe(true);
    expect(jsonCall.data.total).toBe(1500);
  });

  test('does NOT include truncated when total <= 1000', async () => {
    setupMocks(500);
    const req = mockReq({ query: { period: 'all' } });
    const res = mockRes();
    await getTransactions(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.data.truncated).toBeUndefined();
  });
});

// ── saveWidgetPreferences ────────────────────────────────────────────────────

describe('saveWidgetPreferences', () => {
  const setupMocks = () => {
    prisma.clinic.findFirst.mockResolvedValue({ id: 'clinic-123', name: 'Test', ownerId: 'user-123' });
  };

  test('returns 400 when all widgets have visible: false', async () => {
    setupMocks();
    const req = mockReq({
      body: {
        widgets: [
          { id: 'revenue-metrics', visible: false, order: 0 },
          { id: 'patient-metrics', visible: false, order: 1 },
        ],
      },
    });
    const res = mockRes();
    await saveWidgetPreferences(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.message).toMatch(/at least one widget/i);
  });

  test('returns 200 when at least one widget is visible', async () => {
    setupMocks();
    const savedWidgets = [
      { id: 'revenue-metrics', visible: true, order: 0 },
      { id: 'patient-metrics', visible: false, order: 1 },
    ];
    prisma.dashboardWidgetPreference.upsert.mockResolvedValue({
      userId: 'user-123',
      clinicId: 'clinic-123',
      widgets: savedWidgets,
    });
    const req = mockReq({ body: { widgets: savedWidgets } });
    const res = mockRes();
    await saveWidgetPreferences(req, res, mockNext);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(true);
    expect(jsonCall.data.widgets).toEqual(savedWidgets);
  });

  test('returns 400 when body is missing widgets field', async () => {
    setupMocks();
    const req = mockReq({ body: {} });
    const res = mockRes();
    await saveWidgetPreferences(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
