// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Enhanced Service — PulseMate Connect
//  Reusable query builders and utility functions for enhanced dashboard endpoints
// ═════════════════════════════════════════════════════════════════════════════

/**
 * buildDateRange(period, startDate, endDate)
 *
 * Maps a period string to a Prisma `{ gte, lte }` date filter object.
 *
 * Supported periods:
 *   'today'   → start/end of today (UTC)
 *   'week'    → last 7 days (alias for last7)
 *   'month'   → last 30 days (alias for last30)
 *   'last7'   → last 7 days
 *   'last30'  → last 30 days
 *   'all'     → {} (no date filter)
 *   'custom'  → { gte: new Date(startDate), lte: new Date(endDate) }
 *
 * @param {string} period
 * @param {string|null} startDate - ISO date string, used only for 'custom'
 * @param {string|null} endDate   - ISO date string, used only for 'custom'
 * @returns {{ gte: Date, lte: Date } | {}}
 */
function buildDateRange(period, startDate, endDate) {
  const now = new Date();

  switch (period) {
    case 'today': {
      const gte = new Date(now);
      gte.setUTCHours(0, 0, 0, 0);
      const lte = new Date(now);
      lte.setUTCHours(23, 59, 59, 999);
      return { gte, lte };
    }

    case 'week':
    case 'last7': {
      const gte = new Date(now);
      gte.setDate(now.getDate() - 7);
      gte.setUTCHours(0, 0, 0, 0);
      const lte = new Date(now);
      lte.setUTCHours(23, 59, 59, 999);
      return { gte, lte };
    }

    case 'month':
    case 'last30': {
      const gte = new Date(now);
      gte.setDate(now.getDate() - 30);
      gte.setUTCHours(0, 0, 0, 0);
      const lte = new Date(now);
      lte.setUTCHours(23, 59, 59, 999);
      return { gte, lte };
    }

    case 'all':
      return {};

    case 'custom': {
      if (!startDate || !endDate) return {};
      return {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    default:
      return {};
  }
}

/**
 * buildPreviousPeriodRange(period, startDate, endDate)
 *
 * Returns the equivalent previous period date range for comparison.
 *
 *   'today'  → yesterday (full UTC day)
 *   'week'   → 7–14 days ago
 *   'last7'  → 7–14 days ago
 *   'month'  → 30–60 days ago
 *   'last30' → 30–60 days ago
 *   'all'    → null (no comparison available)
 *   'custom' → null (no comparison available)
 *
 * @param {string} period
 * @param {string|null} startDate - not used; included for API symmetry
 * @param {string|null} endDate   - not used; included for API symmetry
 * @returns {{ gte: Date, lte: Date } | null}
 */
function buildPreviousPeriodRange(period, startDate, endDate) {
  const now = new Date();

  switch (period) {
    case 'today': {
      // Yesterday: full UTC day
      const gte = new Date(now);
      gte.setDate(now.getDate() - 1);
      gte.setUTCHours(0, 0, 0, 0);
      const lte = new Date(now);
      lte.setDate(now.getDate() - 1);
      lte.setUTCHours(23, 59, 59, 999);
      return { gte, lte };
    }

    case 'week':
    case 'last7': {
      // 7–14 days ago
      const gte = new Date(now);
      gte.setDate(now.getDate() - 14);
      gte.setUTCHours(0, 0, 0, 0);
      const lte = new Date(now);
      lte.setDate(now.getDate() - 7);
      lte.setUTCHours(23, 59, 59, 999);
      return { gte, lte };
    }

    case 'month':
    case 'last30': {
      // 30–60 days ago
      const gte = new Date(now);
      gte.setDate(now.getDate() - 60);
      gte.setUTCHours(0, 0, 0, 0);
      const lte = new Date(now);
      lte.setDate(now.getDate() - 30);
      lte.setUTCHours(23, 59, 59, 999);
      return { gte, lte };
    }

    case 'all':
    case 'custom':
    default:
      return null;
  }
}

/**
 * buildAppointmentWhere(clinicId, dateRange, filters)
 *
 * Builds a Prisma `where` clause for Appointment queries.
 *
 * Always includes:  clinicId
 * Conditionally:
 *   - appointmentDate: dateRange  (when dateRange has gte/lte keys)
 *   - doctorId: filters.doctorId  (when truthy)
 *   - status: filters.appointmentStatus  (when not 'ALL')
 *
 * @param {string} clinicId
 * @param {{ gte?: Date, lte?: Date }} dateRange
 * @param {{ doctorId?: string, appointmentStatus?: string }} filters
 * @returns {object}
 */
function buildAppointmentWhere(clinicId, dateRange, filters = {}) {
  const where = { clinicId };

  // Add date range only when it actually has filter keys (not empty {})
  if (dateRange && (dateRange.gte !== undefined || dateRange.lte !== undefined)) {
    where.appointmentDate = dateRange;
  }

  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  if (filters.appointmentStatus && filters.appointmentStatus !== 'ALL') {
    where.status = filters.appointmentStatus;
  }

  return where;
}

/**
 * buildPaymentWhere(clinicId, dateRange, filters)
 *
 * Builds a Prisma `where` clause for Payment queries.
 *
 * Always includes:
 *   - appointment: { clinicId }  (nested relation filter)
 *   - status: 'PAID'
 * Conditionally:
 *   - paidAt: dateRange  (when dateRange has gte/lte keys)
 *   - method: filters.paymentMethod  (when not 'ALL')
 *
 * @param {string} clinicId
 * @param {{ gte?: Date, lte?: Date }} dateRange
 * @param {{ paymentMethod?: string }} filters
 * @returns {object}
 */
function buildPaymentWhere(clinicId, dateRange, filters = {}) {
  const where = {
    appointment: { clinicId },
    status: 'PAID',
  };

  // Add date range only when it actually has filter keys (not empty {})
  if (dateRange && (dateRange.gte !== undefined || dateRange.lte !== undefined)) {
    where.paidAt = dateRange;
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
    where.method = filters.paymentMethod;
  }

  return where;
}

/**
 * calcPct(current, previous)
 *
 * Returns the percentage change from previous to current, rounded to 1 decimal.
 * Returns null if previous is 0, null, or undefined (cannot divide by zero).
 *
 * Formula: ((current - previous) / previous) * 100
 *
 * @param {number} current
 * @param {number|null|undefined} previous
 * @returns {number|null}
 */
function calcPct(current, previous) {
  if (previous === null || previous === undefined || previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * getChartGranularity(startDate, endDate)
 *
 * Determines the appropriate chart granularity based on the date range.
 *
 *   > 14 days difference → 'weekly'
 *   ≤ 14 days or either date is null → 'daily'
 *
 * @param {Date|string|null} startDate
 * @param {Date|string|null} endDate
 * @returns {'daily'|'weekly'}
 */
function getChartGranularity(startDate, endDate) {
  if (!startDate || !endDate) return 'daily';

  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays > 14 ? 'weekly' : 'daily';
}

module.exports = {
  buildDateRange,
  buildPreviousPeriodRange,
  buildAppointmentWhere,
  buildPaymentWhere,
  calcPct,
  getChartGranularity,
};
