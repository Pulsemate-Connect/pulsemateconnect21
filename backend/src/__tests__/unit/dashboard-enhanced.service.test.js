'use strict';
/**
 * Unit tests — dashboard-enhanced.service.js
 * Covers: buildDateRange, buildPreviousPeriodRange, buildAppointmentWhere,
 *         buildPaymentWhere, calcPct, getChartGranularity
 */

const {
  buildDateRange,
  buildPreviousPeriodRange,
  buildAppointmentWhere,
  buildPaymentWhere,
  calcPct,
  getChartGranularity,
} = require('../../services/dashboard-enhanced.service');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the number of milliseconds difference between two dates. */
const diffMs = (a, b) => Math.abs(a.getTime() - b.getTime());

/** Returns the day difference (approximate) between two dates. */
const diffDays = (a, b) => diffMs(a, b) / (1000 * 60 * 60 * 24);

// ─────────────────────────────────────────────────────────────────────────────
// buildDateRange
// ─────────────────────────────────────────────────────────────────────────────
describe('buildDateRange', () => {
  describe("period = 'today'", () => {
    test('returns gte at start of today (UTC midnight)', () => {
      const result = buildDateRange('today');
      const expectedStart = new Date();
      expectedStart.setUTCHours(0, 0, 0, 0);
      // Within 1 second tolerance for test execution time
      expect(diffMs(result.gte, expectedStart)).toBeLessThan(1000);
    });

    test('returns lte at end of today (UTC 23:59:59.999)', () => {
      const result = buildDateRange('today');
      const expectedEnd = new Date();
      expectedEnd.setUTCHours(23, 59, 59, 999);
      expect(diffMs(result.lte, expectedEnd)).toBeLessThan(1000);
    });

    test('gte and lte are within the same UTC day', () => {
      const result = buildDateRange('today');
      expect(result.gte.getUTCHours()).toBe(0);
      expect(result.lte.getUTCHours()).toBe(23);
    });
  });

  describe("period = 'week' (alias for last7)", () => {
    test('gte is approximately 7 days ago (within same calendar day)', () => {
      const result = buildDateRange('week');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setUTCHours(0, 0, 0, 0);
      // gte should be at UTC midnight of 7 days ago — allow up to 1 hour drift
      expect(diffMs(result.gte, sevenDaysAgo)).toBeLessThan(60 * 60 * 1000);
    });

    test('lte is end of today', () => {
      const result = buildDateRange('week');
      expect(result.lte.getUTCHours()).toBe(23);
    });
  });

  describe("period = 'last7'", () => {
    test('returns same range as week', () => {
      const week = buildDateRange('week');
      const last7 = buildDateRange('last7');
      expect(diffMs(week.gte, last7.gte)).toBeLessThan(1000);
      expect(diffMs(week.lte, last7.lte)).toBeLessThan(1000);
    });
  });

  describe("period = 'month' (alias for last30)", () => {
    test('gte is approximately 30 days ago (within same calendar day)', () => {
      const result = buildDateRange('month');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
      // gte should be at UTC midnight of 30 days ago — allow up to 1 hour drift
      expect(diffMs(result.gte, thirtyDaysAgo)).toBeLessThan(60 * 60 * 1000);
    });
  });

  describe("period = 'last30'", () => {
    test('returns same range as month', () => {
      const month = buildDateRange('month');
      const last30 = buildDateRange('last30');
      expect(diffMs(month.gte, last30.gte)).toBeLessThan(1000);
      expect(diffMs(month.lte, last30.lte)).toBeLessThan(1000);
    });
  });

  describe("period = 'all'", () => {
    test('returns empty object (no date filter)', () => {
      const result = buildDateRange('all');
      expect(result).toEqual({});
    });
  });

  describe("period = 'custom'", () => {
    test('returns gte and lte from provided dates', () => {
      const result = buildDateRange('custom', '2025-01-01', '2025-01-31');
      expect(result.gte).toEqual(new Date('2025-01-01'));
      expect(result.lte).toEqual(new Date('2025-01-31'));
    });

    test('returns empty object when startDate is missing', () => {
      const result = buildDateRange('custom', null, '2025-01-31');
      expect(result).toEqual({});
    });

    test('returns empty object when endDate is missing', () => {
      const result = buildDateRange('custom', '2025-01-01', null);
      expect(result).toEqual({});
    });

    test('returns empty object when both dates are missing', () => {
      const result = buildDateRange('custom', null, null);
      expect(result).toEqual({});
    });
  });

  describe('unknown period', () => {
    test('returns empty object for unknown period string', () => {
      const result = buildDateRange('unknown');
      expect(result).toEqual({});
    });

    test('returns empty object when period is undefined', () => {
      const result = buildDateRange(undefined);
      expect(result).toEqual({});
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPreviousPeriodRange
// ─────────────────────────────────────────────────────────────────────────────
describe('buildPreviousPeriodRange', () => {
  describe("period = 'today'", () => {
    test('returns previous day (yesterday)', () => {
      const result = buildPreviousPeriodRange('today');
      expect(result).not.toBeNull();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const expectedStart = new Date(yesterday);
      expectedStart.setUTCHours(0, 0, 0, 0);
      const expectedEnd = new Date(yesterday);
      expectedEnd.setUTCHours(23, 59, 59, 999);

      expect(diffMs(result.gte, expectedStart)).toBeLessThan(1000);
      expect(diffMs(result.lte, expectedEnd)).toBeLessThan(1000);
    });

    test('gte is at UTC midnight of yesterday', () => {
      const result = buildPreviousPeriodRange('today');
      expect(result.gte.getUTCHours()).toBe(0);
    });

    test('lte is at UTC 23:59:59 of yesterday', () => {
      const result = buildPreviousPeriodRange('today');
      expect(result.lte.getUTCHours()).toBe(23);
    });
  });

  describe("period = 'week' (alias for last7)", () => {
    test('gte is approximately 14 days ago (within same calendar day)', () => {
      const result = buildPreviousPeriodRange('week');
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      fourteenDaysAgo.setUTCHours(0, 0, 0, 0);
      // allow up to 1 hour drift for start-of-day UTC rounding
      expect(diffMs(result.gte, fourteenDaysAgo)).toBeLessThan(60 * 60 * 1000);
    });

    test('lte is approximately 7 days ago (within same calendar day)', () => {
      const result = buildPreviousPeriodRange('week');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setUTCHours(23, 59, 59, 999);
      // allow up to 1 hour drift for end-of-day UTC rounding
      expect(diffMs(result.lte, sevenDaysAgo)).toBeLessThan(60 * 60 * 1000);
    });
  });

  describe("period = 'last7'", () => {
    test('returns same range as week', () => {
      const week = buildPreviousPeriodRange('week');
      const last7 = buildPreviousPeriodRange('last7');
      expect(diffMs(week.gte, last7.gte)).toBeLessThan(1000);
      expect(diffMs(week.lte, last7.lte)).toBeLessThan(1000);
    });
  });

  describe("period = 'month' (alias for last30)", () => {
    test('gte is approximately 60 days ago (within same calendar day)', () => {
      const result = buildPreviousPeriodRange('month');
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      sixtyDaysAgo.setUTCHours(0, 0, 0, 0);
      expect(diffMs(result.gte, sixtyDaysAgo)).toBeLessThan(60 * 60 * 1000);
    });

    test('lte is approximately 30 days ago (within same calendar day)', () => {
      const result = buildPreviousPeriodRange('month');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setUTCHours(23, 59, 59, 999);
      expect(diffMs(result.lte, thirtyDaysAgo)).toBeLessThan(60 * 60 * 1000);
    });
  });

  describe("period = 'last30'", () => {
    test('returns same range as month', () => {
      const month = buildPreviousPeriodRange('month');
      const last30 = buildPreviousPeriodRange('last30');
      expect(diffMs(month.gte, last30.gte)).toBeLessThan(1000);
      expect(diffMs(month.lte, last30.lte)).toBeLessThan(1000);
    });
  });

  describe("period = 'all'", () => {
    test('returns null (no comparison available)', () => {
      expect(buildPreviousPeriodRange('all')).toBeNull();
    });
  });

  describe("period = 'custom'", () => {
    test('returns null (no comparison available)', () => {
      expect(buildPreviousPeriodRange('custom', '2025-01-01', '2025-01-31')).toBeNull();
    });
  });

  describe('unknown period', () => {
    test('returns null for unknown period string', () => {
      expect(buildPreviousPeriodRange('unknown')).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildAppointmentWhere
// ─────────────────────────────────────────────────────────────────────────────
describe('buildAppointmentWhere', () => {
  const clinicId = 'clinic-123';

  test('always includes clinicId', () => {
    const result = buildAppointmentWhere(clinicId, {}, {});
    expect(result.clinicId).toBe(clinicId);
  });

  test('adds appointmentDate when dateRange has gte/lte', () => {
    const dateRange = { gte: new Date('2025-01-01'), lte: new Date('2025-01-31') };
    const result = buildAppointmentWhere(clinicId, dateRange, {});
    expect(result.appointmentDate).toEqual(dateRange);
  });

  test('does NOT add appointmentDate when dateRange is empty {}', () => {
    const result = buildAppointmentWhere(clinicId, {}, {});
    expect(result.appointmentDate).toBeUndefined();
  });

  test('adds doctorId when provided in filters', () => {
    const result = buildAppointmentWhere(clinicId, {}, { doctorId: 'doctor-456' });
    expect(result.doctorId).toBe('doctor-456');
  });

  test('does NOT add doctorId when not provided', () => {
    const result = buildAppointmentWhere(clinicId, {}, {});
    expect(result.doctorId).toBeUndefined();
  });

  test('adds status when appointmentStatus is not ALL', () => {
    const result = buildAppointmentWhere(clinicId, {}, { appointmentStatus: 'COMPLETED' });
    expect(result.status).toBe('COMPLETED');
  });

  test('does NOT add status when appointmentStatus is ALL', () => {
    const result = buildAppointmentWhere(clinicId, {}, { appointmentStatus: 'ALL' });
    expect(result.status).toBeUndefined();
  });

  test('does NOT add status when appointmentStatus is not provided', () => {
    const result = buildAppointmentWhere(clinicId, {}, {});
    expect(result.status).toBeUndefined();
  });

  test('combines all filters correctly', () => {
    const dateRange = { gte: new Date('2025-01-01'), lte: new Date('2025-01-31') };
    const filters = { doctorId: 'doc-1', appointmentStatus: 'CANCELLED' };
    const result = buildAppointmentWhere(clinicId, dateRange, filters);
    expect(result).toEqual({
      clinicId,
      appointmentDate: dateRange,
      doctorId: 'doc-1',
      status: 'CANCELLED',
    });
  });

  test('works with no filters argument (defaults to {})', () => {
    const result = buildAppointmentWhere(clinicId, {});
    expect(result.clinicId).toBe(clinicId);
    expect(result.doctorId).toBeUndefined();
    expect(result.status).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPaymentWhere
// ─────────────────────────────────────────────────────────────────────────────
describe('buildPaymentWhere', () => {
  const clinicId = 'clinic-123';

  test('always includes appointment.clinicId as nested relation filter', () => {
    const result = buildPaymentWhere(clinicId, {}, {});
    expect(result.appointment).toEqual({ clinicId });
  });

  test('always includes status: PAID', () => {
    const result = buildPaymentWhere(clinicId, {}, {});
    expect(result.status).toBe('PAID');
  });

  test('adds paidAt when dateRange has gte/lte', () => {
    const dateRange = { gte: new Date('2025-01-01'), lte: new Date('2025-01-31') };
    const result = buildPaymentWhere(clinicId, dateRange, {});
    expect(result.paidAt).toEqual(dateRange);
  });

  test('does NOT add paidAt when dateRange is empty {}', () => {
    const result = buildPaymentWhere(clinicId, {}, {});
    expect(result.paidAt).toBeUndefined();
  });

  test('adds method when paymentMethod is not ALL', () => {
    const result = buildPaymentWhere(clinicId, {}, { paymentMethod: 'CASH' });
    expect(result.method).toBe('CASH');
  });

  test('adds method ONLINE correctly', () => {
    const result = buildPaymentWhere(clinicId, {}, { paymentMethod: 'ONLINE' });
    expect(result.method).toBe('ONLINE');
  });

  test('does NOT add method when paymentMethod is ALL', () => {
    const result = buildPaymentWhere(clinicId, {}, { paymentMethod: 'ALL' });
    expect(result.method).toBeUndefined();
  });

  test('does NOT add method when paymentMethod is not provided', () => {
    const result = buildPaymentWhere(clinicId, {}, {});
    expect(result.method).toBeUndefined();
  });

  test('combines all filters correctly', () => {
    const dateRange = { gte: new Date('2025-06-01'), lte: new Date('2025-06-30') };
    const filters = { paymentMethod: 'ONLINE' };
    const result = buildPaymentWhere(clinicId, dateRange, filters);
    expect(result).toEqual({
      appointment: { clinicId },
      status: 'PAID',
      paidAt: dateRange,
      method: 'ONLINE',
    });
  });

  test('works with no filters argument (defaults to {})', () => {
    const result = buildPaymentWhere(clinicId, {});
    expect(result.status).toBe('PAID');
    expect(result.method).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcPct
// ─────────────────────────────────────────────────────────────────────────────
describe('calcPct', () => {
  test('calculates positive percentage change correctly', () => {
    // (150 - 100) / 100 * 100 = 50
    expect(calcPct(150, 100)).toBe(50.0);
  });

  test('calculates negative percentage change correctly', () => {
    // (80 - 100) / 100 * 100 = -20
    expect(calcPct(80, 100)).toBe(-20.0);
  });

  test('returns 0 when current equals previous', () => {
    expect(calcPct(100, 100)).toBe(0.0);
  });

  test('rounds to 1 decimal place', () => {
    // (110 - 300) / 300 * 100 = -63.333... → -63.3
    expect(calcPct(110, 300)).toBe(-63.3);
  });

  test('handles fractional results correctly', () => {
    // (1 - 3) / 3 * 100 = -66.666... → -66.7
    expect(calcPct(1, 3)).toBe(-66.7);
  });

  test('returns null when previous is 0', () => {
    expect(calcPct(100, 0)).toBeNull();
  });

  test('returns null when previous is null', () => {
    expect(calcPct(100, null)).toBeNull();
  });

  test('returns null when previous is undefined', () => {
    expect(calcPct(100, undefined)).toBeNull();
  });

  test('works correctly with zero current and non-zero previous', () => {
    // (0 - 100) / 100 * 100 = -100
    expect(calcPct(0, 100)).toBe(-100.0);
  });

  test('works with large numbers', () => {
    // (2000000 - 1000000) / 1000000 * 100 = 100
    expect(calcPct(2000000, 1000000)).toBe(100.0);
  });

  test('works with decimal input values', () => {
    // (1.5 - 1.0) / 1.0 * 100 = 50
    expect(calcPct(1.5, 1.0)).toBe(50.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getChartGranularity
// ─────────────────────────────────────────────────────────────────────────────
describe('getChartGranularity', () => {
  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  test('returns daily for a 1-day range', () => {
    const start = daysAgo(1);
    const end = new Date();
    expect(getChartGranularity(start, end)).toBe('daily');
  });

  test('returns daily for a 7-day range', () => {
    const start = daysAgo(7);
    const end = new Date();
    expect(getChartGranularity(start, end)).toBe('daily');
  });

  test('returns daily at exactly 14 days (boundary — not greater than)', () => {
    const end = new Date('2025-06-15T00:00:00.000Z');
    const start = new Date('2025-06-01T00:00:00.000Z'); // 14 days exactly
    expect(getChartGranularity(start, end)).toBe('daily');
  });

  test('returns weekly for a range of 15 days', () => {
    const end = new Date('2025-06-16T00:00:00.000Z');
    const start = new Date('2025-06-01T00:00:00.000Z'); // 15 days
    expect(getChartGranularity(start, end)).toBe('weekly');
  });

  test('returns weekly for a 30-day range', () => {
    const start = daysAgo(30);
    const end = new Date();
    expect(getChartGranularity(start, end)).toBe('weekly');
  });

  test('returns weekly for a 90-day range', () => {
    const start = daysAgo(90);
    const end = new Date();
    expect(getChartGranularity(start, end)).toBe('weekly');
  });

  test('returns daily when startDate is null', () => {
    expect(getChartGranularity(null, new Date())).toBe('daily');
  });

  test('returns daily when endDate is null', () => {
    expect(getChartGranularity(new Date(), null)).toBe('daily');
  });

  test('returns daily when both dates are null', () => {
    expect(getChartGranularity(null, null)).toBe('daily');
  });

  test('accepts ISO string dates as input', () => {
    // 30-day range as strings
    expect(getChartGranularity('2025-01-01', '2025-02-01')).toBe('weekly');
    // 7-day range as strings
    expect(getChartGranularity('2025-01-01', '2025-01-08')).toBe('daily');
  });
});
