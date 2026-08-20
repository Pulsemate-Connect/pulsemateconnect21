// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Enhanced Controller — PulseMate Connect
//  Comprehensive business-intelligence metrics endpoint for clinic owners
// ═════════════════════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const {
  buildDateRange,
  buildPreviousPeriodRange,
  buildAppointmentWhere,
  buildPaymentWhere,
  calcPct,
  getChartGranularity,
} = require('../services/dashboard-enhanced.service');
const {
  enhancedDashboardQuerySchema,
  transactionsQuerySchema,
  widgetPreferencesBodySchema,
} = require('../validations/dashboard.validation');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Verify that the authenticated user owns the clinic or is SUPER_ADMIN.
 * Returns the clinic record on success, or calls sendError and returns null.
 */
async function verifyClinicOwnership(req, res, clinicId) {
  if (req.user.role === 'SUPER_ADMIN') {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!clinic) {
      sendError(res, 'Clinic not found', 404);
      return null;
    }
    return clinic;
  }

  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, ownerId: req.user.id },
    select: { id: true, name: true, ownerId: true },
  });

  if (!clinic) {
    sendError(res, 'You do not have access to this clinic', 403);
    return null;
  }

  return clinic;
}

/**
 * Map the frontend paymentMethod filter value to a Prisma where clause fragment.
 *   'CASH'   → { method: 'CASH' }
 *   'ONLINE' → { method: { in: ['RAZORPAY', 'UPI'] } }
 *   'ALL'    → {} (no filter)
 */
function paymentMethodFilter(paymentMethod) {
  if (paymentMethod === 'CASH') return { method: 'CASH' };
  if (paymentMethod === 'ONLINE') return { method: { in: ['RAZORPAY', 'UPI'] } };
  return {};
}

/**
 * Calculate the number of calendar days in a date range.
 * Falls back to 1 to avoid division-by-zero.
 */
function daysInRange(dateRange) {
  if (!dateRange || !dateRange.gte || !dateRange.lte) {
    return 1;
  }
  const diffMs = new Date(dateRange.lte) - new Date(dateRange.gte);
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return days;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/clinic/:clinicId/enhanced
 *
 * Query params:
 *   period            'today'|'week'|'month'|'last7'|'last30'|'all'|'custom'
 *   startDate         ISO date string (required when period='custom')
 *   endDate           ISO date string (required when period='custom')
 *   doctorId          UUID (optional)
 *   paymentMethod     'ALL'|'CASH'|'ONLINE' (optional, default 'ALL')
 *   appointmentStatus 'ALL'|'COMPLETED'|'CANCELLED'|'NO_SHOW' (optional, default 'ALL')
 *
 * Returns structured metrics:
 *   { metrics: { patients, appointments, revenue, staff, growth }, filteredCount }
 */
exports.getEnhancedDashboard = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // ── 1. Validate query params ──────────────────────────────────────────────
    const parsed = enhancedDashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { period, startDate, endDate, doctorId, paymentMethod, appointmentStatus } = parsed.data;

    // ── 2. Verify ownership ───────────────────────────────────────────────────
    const clinic = await verifyClinicOwnership(req, res, clinicId);
    if (!clinic) return; // sendError already called

    // ── 3. Build date ranges ──────────────────────────────────────────────────
    const dateRange = buildDateRange(period, startDate, endDate);
    const filters = { doctorId, appointmentStatus, paymentMethod };

    // Appointment where clause (base — without status override for sub-queries)
    const apptWhere = buildAppointmentWhere(clinicId, dateRange, filters);
    // Payment where clause — EXCLUDE RAZORPAY (platform fee, not clinic revenue)
    // Clinic revenue = CASH + UPI only (collected by receptionist)
    const CLINIC_REVENUE_METHODS = ['CASH', 'UPI'];

    const payWhere = buildPaymentWhere(clinicId, dateRange, {
      paymentMethod,
    });
    // Override: always exclude RAZORPAY from clinic revenue totals
    if (!paymentMethod || paymentMethod === 'ALL') {
      payWhere.method = { in: CLINIC_REVENUE_METHODS };
    } else if (paymentMethod === 'ONLINE') {
      // ONLINE in clinic context = UPI only (not Razorpay platform fee)
      payWhere.method = 'UPI';
    }

    // Payment where without paymentMethod filter (used for cash/online breakdown) — also exclude RAZORPAY
    const payWhereNoMethod = buildPaymentWhere(clinicId, dateRange, {});
    payWhereNoMethod.method = { in: CLINIC_REVENUE_METHODS };

    // Apply doctorId to payment queries via nested appointment relation
    if (doctorId) {
      payWhere.appointment = { ...(payWhere.appointment || {}), clinicId, doctorId };
      payWhereNoMethod.appointment = { ...(payWhereNoMethod.appointment || {}), clinicId, doctorId };
    }

    // Completed appointments where (for duration/wait calculations)
    const completedApptWhere = {
      ...apptWhere,
      status: 'COMPLETED',
    };

    // ── 4. Month-over-month revenue range (ignores all filters per spec) ──────
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    thisMonthStart.setUTCHours(0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    thisMonthEnd.setUTCHours(23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthStart.setUTCHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    lastMonthEnd.setUTCHours(23, 59, 59, 999);

    // Week-over-week patient growth
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    thisWeekStart.setUTCHours(0, 0, 0, 0);
    const thisWeekEnd = new Date(now);
    thisWeekEnd.setUTCHours(23, 59, 59, 999);

    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);
    lastWeekStart.setUTCHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - 7);
    lastWeekEnd.setUTCHours(23, 59, 59, 999);

    // ── 5. Parallel Prisma transaction ────────────────────────────────────────
    const [
      // Patient stats
      allPatientIds,
      firstTimePatientIds,

      // Appointment stats
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      completedWithTimestamps,
      appointmentsWithWait,
      appointmentsWithHour,

      // Revenue stats
      revenueAggregate,
      cashRevenue,
      onlineRevenue,
      thisMonthRevenue,
      lastMonthRevenue,

      // Staff stats
      activeStaff,
      totalDoctors,
      activeDoctors,
      totalReceptionists,

      // Week-over-week patients
      thisWeekPatients,
      lastWeekPatients,
    ] = await prisma.$transaction([
      // ── Patient: all unique patients in filtered period ──────────────────
      prisma.appointment.findMany({
        where: apptWhere,
        distinct: ['patientId'],
        select: { patientId: true },
      }),

      // ── Patient: new (first visit at THIS clinic within date range) ───────
      // A patient is "new" if their earliest appointment at this clinic falls within the range.
      prisma.appointment.findMany({
        where: {
          clinicId,
          ...(dateRange.gte ? { appointmentDate: { gte: dateRange.gte, lte: dateRange.lte } } : {}),
          ...(doctorId ? { doctorId } : {}),
        },
        distinct: ['patientId'],
        select: {
          patientId: true,
          appointmentDate: true,
          _count: false,
        },
      }),

      // ── Appointment: total ────────────────────────────────────────────────
      prisma.appointment.count({ where: apptWhere }),

      // ── Appointment: completed ────────────────────────────────────────────
      prisma.appointment.count({ where: { ...apptWhere, status: 'COMPLETED' } }),

      // ── Appointment: cancelled ────────────────────────────────────────────
      prisma.appointment.count({ where: { ...apptWhere, status: 'CANCELLED' } }),

      // ── Appointment: no-show ──────────────────────────────────────────────
      prisma.appointment.count({ where: { ...apptWhere, status: 'NO_SHOW' } }),

      // ── Appointment: completed — for avgDuration ──────────────────────────
      // Duration = updatedAt - createdAt for COMPLETED appointments
      prisma.appointment.findMany({
        where: completedApptWhere,
        select: { createdAt: true, updatedAt: true },
      }),

      // ── Appointment: avgWaitTime from estimatedWaitMinutes ────────────────
      prisma.appointment.aggregate({
        where: { ...apptWhere, estimatedWaitMinutes: { not: null } },
        _avg: { estimatedWaitMinutes: true },
      }),

      // ── Appointment: for peakHour calculation ─────────────────────────────
      prisma.appointment.findMany({
        where: apptWhere,
        select: { appointmentDate: true },
      }),

      // ── Revenue: total (filtered) ─────────────────────────────────────────
      prisma.payment.aggregate({
        where: payWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),

      // ── Revenue: cash breakdown ───────────────────────────────────────────
      prisma.payment.aggregate({
        where: { ...payWhereNoMethod, method: 'CASH' },
        _sum: { amount: true },
      }),

      // ── Revenue: online breakdown (RAZORPAY + UPI) ────────────────────────
      prisma.payment.aggregate({
        where: { ...payWhereNoMethod, method: { in: ['RAZORPAY', 'UPI'] } },
        _sum: { amount: true },
      }),

      // ── Revenue: this month (unfiltered — requirement spec, clinic only) ──────
      prisma.payment.aggregate({
        where: {
          appointment: { clinicId },
          status: 'PAID',
          method: { in: ['CASH', 'UPI'] },
          paidAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { amount: true },
      }),

      // ── Revenue: last month (unfiltered, clinic only) ─────────────────────
      prisma.payment.aggregate({
        where: {
          appointment: { clinicId },
          status: 'PAID',
          method: { in: ['CASH', 'UPI'] },
          paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),

      // ── Staff: all active staff ───────────────────────────────────────────
      prisma.clinicStaff.count({
        where: { clinicId, isActive: true },
      }),

      // ── Staff: total doctors (all, including inactive) ────────────────────
      prisma.clinicStaff.count({
        where: { clinicId, role: 'DOCTOR' },
      }),

      // ── Staff: active doctors ─────────────────────────────────────────────
      prisma.clinicStaff.count({
        where: { clinicId, role: 'DOCTOR', isActive: true },
      }),

      // ── Staff: total receptionists ────────────────────────────────────────
      prisma.clinicStaff.count({
        where: { clinicId, role: 'RECEPTIONIST' },
      }),

      // ── Growth: this week patients ────────────────────────────────────────
      prisma.appointment.findMany({
        where: {
          clinicId,
          appointmentDate: { gte: thisWeekStart, lte: thisWeekEnd },
        },
        distinct: ['patientId'],
        select: { patientId: true },
      }),

      // ── Growth: last week patients ────────────────────────────────────────
      prisma.appointment.findMany({
        where: {
          clinicId,
          appointmentDate: { gte: lastWeekStart, lte: lastWeekEnd },
        },
        distinct: ['patientId'],
        select: { patientId: true },
      }),
    ]);

    // ── 6. Compute derived metrics ────────────────────────────────────────────

    // Patient stats
    const totalPatients = allPatientIds.length;

    // Determine new patients: patients whose FIRST appointment at this clinic
    // falls within the date range. We do this by grouping the firstTimePatientIds
    // result by patientId, then checking the min appointmentDate.
    // Since we queried with distinct['patientId'] ordered by default, we need the
    // full set of patient min-dates from the filtered period range.
    // Strategy: For patients in the filtered period, fetch their earliest appt at
    // this clinic and count those whose earliest is within the range.
    const patientIdsInRange = [...new Set(firstTimePatientIds.map((r) => r.patientId))];

    let newPatients = 0;
    if (patientIdsInRange.length > 0 && dateRange.gte) {
      // For each patient in range, check if their earliest appt at THIS clinic
      // is also within the range (meaning first-time visitor).
      const earliestPerPatient = await prisma.appointment.groupBy({
        by: ['patientId'],
        where: {
          clinicId,
          patientId: { in: patientIdsInRange },
        },
        _min: { appointmentDate: true },
      });

      newPatients = earliestPerPatient.filter((row) => {
        const earliest = row._min.appointmentDate;
        return earliest >= dateRange.gte && earliest <= dateRange.lte;
      }).length;
    } else if (!dateRange.gte) {
      // 'all' period: every patient is new by definition (no baseline)
      newPatients = totalPatients;
    }

    const returningPatients = totalPatients - newPatients;

    // Appointment completion rate
    const completionRate =
      totalAppointments > 0
        ? Math.round((completedAppointments / totalAppointments) * 100 * 10) / 10
        : 0;

    // Average appointment duration (createdAt → updatedAt of COMPLETED appointments)
    let avgDuration = 0;
    if (completedWithTimestamps.length > 0) {
      const totalDurationMs = completedWithTimestamps.reduce((sum, appt) => {
        return sum + (new Date(appt.updatedAt) - new Date(appt.createdAt));
      }, 0);
      avgDuration = Math.round(totalDurationMs / completedWithTimestamps.length / 60000); // ms → mins
    }

    // Average wait time
    const avgWaitTime = Math.round(appointmentsWithWait._avg.estimatedWaitMinutes || 0);

    // Average daily appointments
    const days = daysInRange(dateRange);
    const avgDaily = Math.round((totalAppointments / days) * 10) / 10;

    // Peak hour (0–23 based on appointmentDate hour)
    let peakHour = null;
    if (appointmentsWithHour.length > 0) {
      const hourCounts = {};
      for (const appt of appointmentsWithHour) {
        const hour = new Date(appt.appointmentDate).getUTCHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
      const maxHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
      if (maxHour) {
        const h = parseInt(maxHour[0], 10);
        peakHour = `${String(h).padStart(2, '0')}:00`;
      }
    }

    // Revenue stats
    const totalRevenue = revenueAggregate._sum.amount || 0;
    const cashTotal = cashRevenue._sum.amount || 0;
    const onlineTotal = onlineRevenue._sum.amount || 0;
    const paidAppointmentsCount = revenueAggregate._count.id || 0;
    const avgPerAppointment =
      paidAppointmentsCount > 0
        ? Math.round((totalRevenue / paidAppointmentsCount) * 100) / 100
        : 0;

    // Month-over-month growth (ignores active filters per design spec)
    const thisMonthTotal = thisMonthRevenue._sum.amount || 0;
    const lastMonthTotal = lastMonthRevenue._sum.amount || 0;
    let monthGrowth = null;
    if (lastMonthTotal > 0) {
      monthGrowth = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 * 10) / 10;
    }

    // Staff stats
    const utilizationRate =
      totalDoctors > 0 ? Math.round((activeDoctors / totalDoctors) * 100 * 10) / 10 : 0;

    // Week-over-week patient growth
    const thisWeekCount = thisWeekPatients.length;
    const lastWeekCount = lastWeekPatients.length;
    let weekPatientGrowth = null;
    if (lastWeekCount > 0) {
      weekPatientGrowth =
        Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 * 10) / 10;
    }

    // ── 7. Build response ─────────────────────────────────────────────────────
    return sendSuccess(res, {
      metrics: {
        patients: {
          total: totalPatients,
          new: newPatients,
          returning: returningPatients < 0 ? 0 : returningPatients,
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShow: noShowAppointments,
          completionRate,
          avgDuration,
          avgWaitTime,
          avgDaily,
          peakHour,
        },
        revenue: {
          total: totalRevenue,
          cash: cashTotal,
          online: onlineTotal,
          avgPerAppointment,
          monthGrowth,
        },
        staff: {
          active: activeStaff,
          doctors: totalDoctors,
          receptionists: totalReceptionists,
          utilizationRate,
        },
        growth: {
          weekPatients: weekPatientGrowth,
        },
      },
      filteredCount: totalAppointments,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Period label mapping ────────────────────────────────────────────────────

/** Maps a period string to the human-readable comparison label. */
const PERIOD_LABELS = {
  today: 'vs. yesterday',
  week: 'vs. last week',
  last7: 'vs. last week',
  month: 'vs. last month',
  last30: 'vs. last month',
};

// ─── getComparisonData ────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/clinic/:clinicId/comparison
 *
 * Returns period-over-period comparison metrics for the clinic owner dashboard.
 * Only COMPLETED appointments (and their associated PAID payments) are counted,
 * per Requirement 3.17.
 *
 * Query params: same as getEnhancedDashboard
 *   period, startDate, endDate, doctorId, paymentMethod, appointmentStatus
 *
 * Response (all metrics have the shape { current, previous, delta, pct }):
 *   {
 *     comparison: {
 *       revenue, patients, appointments, completionRate, avgRevPerAppt,
 *       period: string,
 *       label:  string
 *     }
 *   }
 *
 * When previous period is unavailable ('all' / 'custom'):
 *   { comparison: null, noPreviousData: true }
 */
exports.getComparisonData = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // ── 1. Validate query params ──────────────────────────────────────────────
    const parsed = enhancedDashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { period, startDate, endDate, doctorId, paymentMethod } = parsed.data;

    // ── 2. Verify ownership ───────────────────────────────────────────────────
    const clinic = await verifyClinicOwnership(req, res, clinicId);
    if (!clinic) return; // sendError already called

    // ── 3. Build date ranges ──────────────────────────────────────────────────
    const currentRange = buildDateRange(period, startDate, endDate);
    const previousRange = buildPreviousPeriodRange(period, startDate, endDate);

    // When no previous range is available (all / custom), return early
    if (!previousRange) {
      return sendSuccess(res, { comparison: null, noPreviousData: true });
    }

    // ── 4. Build Prisma where clauses ─────────────────────────────────────────
    // Per Requirement 3.17 we only consider COMPLETED appointments.
    const sharedFilters = { doctorId, appointmentStatus: 'COMPLETED', paymentMethod };

    // Current period — appointments (COMPLETED only)
    const currentApptWhere = buildAppointmentWhere(clinicId, currentRange, sharedFilters);

    // Previous period — appointments (COMPLETED only)
    const prevApptWhere = buildAppointmentWhere(clinicId, previousRange, sharedFilters);

    // For total appointments (needed for completionRate denominator) we need ALL
    // statuses in the same period, so build separate where clauses without status filter.
    const currentTotalApptWhere = buildAppointmentWhere(clinicId, currentRange, {
      doctorId,
      appointmentStatus: 'ALL',
      paymentMethod: 'ALL',
    });
    const prevTotalApptWhere = buildAppointmentWhere(clinicId, previousRange, {
      doctorId,
      appointmentStatus: 'ALL',
      paymentMethod: 'ALL',
    });

    // Payment where clauses (linked to COMPLETED appointments via nested relation)
    // buildPaymentWhere already filters status: 'PAID'; we additionally restrict
    // to appointments with status COMPLETED via nested appointment.status.
    const currentPayWhere = {
      ...buildPaymentWhere(clinicId, currentRange, { paymentMethod }),
      appointment: {
        clinicId,
        status: 'COMPLETED',
        ...(doctorId ? { doctorId } : {}),
      },
    };

    const prevPayWhere = {
      ...buildPaymentWhere(clinicId, previousRange, { paymentMethod }),
      appointment: {
        clinicId,
        status: 'COMPLETED',
        ...(doctorId ? { doctorId } : {}),
      },
    };

    // ── 5. Run parallel queries for both periods ──────────────────────────────
    const [
      // Current period
      currentCompletedCount,
      currentTotalCount,
      currentUniquePatients,
      currentRevenue,

      // Previous period
      prevCompletedCount,
      prevTotalCount,
      prevUniquePatients,
      prevRevenue,
    ] = await prisma.$transaction([
      // Current: completed appointment count
      prisma.appointment.count({ where: currentApptWhere }),

      // Current: total appointment count (all statuses)
      prisma.appointment.count({ where: currentTotalApptWhere }),

      // Current: unique patient count (among completed appointments)
      prisma.appointment.findMany({
        where: currentApptWhere,
        distinct: ['patientId'],
        select: { patientId: true },
      }),

      // Current: revenue (PAID payments linked to COMPLETED appointments)
      prisma.payment.aggregate({
        where: currentPayWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Previous: completed appointment count
      prisma.appointment.count({ where: prevApptWhere }),

      // Previous: total appointment count (all statuses)
      prisma.appointment.count({ where: prevTotalApptWhere }),

      // Previous: unique patient count (among completed appointments)
      prisma.appointment.findMany({
        where: prevApptWhere,
        distinct: ['patientId'],
        select: { patientId: true },
      }),

      // Previous: revenue (PAID payments linked to COMPLETED appointments)
      prisma.payment.aggregate({
        where: prevPayWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // ── 6. Derive scalar values ───────────────────────────────────────────────

    // Revenue
    const currentRev = currentRevenue._sum.amount || 0;
    const prevRev = prevRevenue._sum.amount || 0;
    const currentPaidCount = currentRevenue._count.id || 0;
    const prevPaidCount = prevRevenue._count.id || 0;

    // Patients (unique)
    const currentPatients = currentUniquePatients.length;
    const prevPatients = prevUniquePatients.length;

    // Appointments (completed count)
    const currentAppts = currentCompletedCount;
    const prevAppts = prevCompletedCount;

    // Completion rate: completed / total * 100
    const currentCompletionRate =
      currentTotalCount > 0
        ? Math.round((currentCompletedCount / currentTotalCount) * 100 * 10) / 10
        : 0;
    const prevCompletionRate =
      prevTotalCount > 0
        ? Math.round((prevCompletedCount / prevTotalCount) * 100 * 10) / 10
        : 0;

    // Average revenue per appointment (paid appointments only)
    const currentAvgRev =
      currentPaidCount > 0
        ? Math.round((currentRev / currentPaidCount) * 100) / 100
        : 0;
    const prevAvgRev =
      prevPaidCount > 0
        ? Math.round((prevRev / prevPaidCount) * 100) / 100
        : 0;

    // ── 7. Calculate deltas and percentage changes ────────────────────────────

    /**
     * Build the standard metric shape:
     * { current, previous, delta, pct }
     */
    function metricShape(current, previous) {
      return {
        current,
        previous,
        delta: Math.round((current - previous) * 100) / 100,
        pct: calcPct(current, previous),
      };
    }

    // Determine whether previous period contained any data at all
    const noPreviousData =
      prevCompletedCount === 0 && prevTotalCount === 0 && prevPatients === 0 && prevRev === 0;

    // ── 8. Build and return response ──────────────────────────────────────────
    return sendSuccess(res, {
      comparison: {
        revenue: metricShape(currentRev, prevRev),
        patients: metricShape(currentPatients, prevPatients),
        appointments: metricShape(currentAppts, prevAppts),
        completionRate: metricShape(currentCompletionRate, prevCompletionRate),
        avgRevPerAppt: metricShape(currentAvgRev, prevAvgRev),
        period,
        label: PERIOD_LABELS[period] || 'vs. previous period',
      },
      ...(noPreviousData ? { noPreviousData: true } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// ─── getChartData ─────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/clinic/:clinicId/charts
 *
 * Returns all 8 chart data series in one response, plus the resolved granularity.
 *
 * Query params: same as getEnhancedDashboard
 *   period, startDate, endDate, doctorId, paymentMethod, appointmentStatus
 *
 * Response shape:
 *   {
 *     revenueTrend:        [{ date, revenue }],
 *     appointmentTrend:    [{ date, count }],
 *     paymentBreakdown:    { cash, online },
 *     appointmentStatus:   { completed, cancelled, noShow },
 *     doctorPerformance:   [{ doctor, appointments, revenue }],
 *     patientDemographics: [{ ageGroup, count }],
 *     peakHours:           [{ hour, label, count }],
 *     dayOfWeek:           [{ day, count }],
 *     granularity:         'daily' | 'weekly'
 *   }
 */
exports.getChartData = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // ── 1. Validate query params ──────────────────────────────────────────────
    const parsed = enhancedDashboardQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { period, startDate, endDate, doctorId, paymentMethod, appointmentStatus } = parsed.data;

    // ── 2. Verify clinic ownership ────────────────────────────────────────────
    const clinic = await verifyClinicOwnership(req, res, clinicId);
    if (!clinic) return;

    // ── 3. Build date range and granularity ───────────────────────────────────
    const dateRange = buildDateRange(period, startDate, endDate);
    const granularity = getChartGranularity(dateRange.gte || null, dateRange.lte || null);

    // Shared appointment where (respects all filters)
    const apptWhere = buildAppointmentWhere(clinicId, dateRange, {
      doctorId,
      appointmentStatus,
      paymentMethod,
    });

    // Payment where clause (for revenue series — only PAID clinic payments, exclude RAZORPAY)
    const CLINIC_REVENUE_METHODS_CHART = ['CASH', 'UPI'];
    const payWhere = buildPaymentWhere(clinicId, dateRange, { paymentMethod });
    if (!paymentMethod || paymentMethod === 'ALL') {
      payWhere.method = { in: CLINIC_REVENUE_METHODS_CHART };
    } else if (paymentMethod === 'ONLINE') {
      payWhere.method = 'UPI';
    }
    if (doctorId) {
      payWhere.appointment = {
        ...(payWhere.appointment || {}),
        clinicId,
        doctorId,
      };
    }

    // Payment where without method filter (for cash/online breakdown) — exclude RAZORPAY
    const payWhereNoMethod = buildPaymentWhere(clinicId, dateRange, {});
    payWhereNoMethod.method = { in: CLINIC_REVENUE_METHODS_CHART };
    if (doctorId) {
      payWhereNoMethod.appointment = {
        ...(payWhereNoMethod.appointment || {}),
        clinicId,
        doctorId,
      };
    }

    // ── 4. Run all queries in parallel ────────────────────────────────────────
    const [
      // For revenueTrend and appointmentTrend (raw date-bucketed queries handled separately)
      allAppointments,          // { appointmentDate, status } for trend + peak + dayOfWeek
      paidPayments,             // { paidAt, amount } for revenueTrend
      cashPayments,             // aggregate for paymentBreakdown.cash
      onlinePayments,           // aggregate for paymentBreakdown.online
      completedCount,           // for appointmentStatus.completed
      cancelledCount,           // for appointmentStatus.cancelled
      noShowCount,              // for appointmentStatus.noShow
      doctorAppointments,       // groupBy doctorId for doctorPerformance
      patientAges,              // PatientProfile ages for demographics
    ] = await Promise.all([
      // All appointments in range — select only what we need for trend + hour + DOW
      prisma.appointment.findMany({
        where: apptWhere,
        select: { appointmentDate: true, status: true },
      }),

      // Paid payments for revenue trend
      prisma.payment.findMany({
        where: payWhere,
        select: { paidAt: true, amount: true },
      }),

      // Cash total (clinic revenue — receptionist collected)
      prisma.payment.aggregate({
        where: { ...payWhereNoMethod, method: 'CASH' },
        _sum: { amount: true },
      }),

      // UPI total (clinic revenue — receptionist collected, NOT platform Razorpay)
      prisma.payment.aggregate({
        where: { ...payWhereNoMethod, method: 'UPI' },
        _sum: { amount: true },
      }),

      // UPI total (clinic revenue — already included above, this slot kept for array index compat)
      // Note: online for clinic = UPI only (Razorpay is platform fee, excluded)
      prisma.payment.aggregate({
        where: { ...payWhereNoMethod, method: 'UPI' },
        _sum: { amount: true },
      }),

      // Completed appointments count
      prisma.appointment.count({ where: { ...apptWhere, status: 'COMPLETED' } }),

      // Cancelled appointments count
      prisma.appointment.count({ where: { ...apptWhere, status: 'CANCELLED' } }),

      // No-show appointments count
      prisma.appointment.count({ where: { ...apptWhere, status: 'NO_SHOW' } }),

      // Doctor-level appointment grouping
      prisma.appointment.groupBy({
        by: ['doctorId'],
        where: apptWhere,
        _count: { id: true },
      }),

      // Patient ages for demographics — query PatientProfile for patients
      // who had appointments in the filtered date range
      prisma.patientProfile.findMany({
        where: {
          userId: {
            in: await prisma.appointment
              .findMany({
                where: apptWhere,
                select: { patientId: true },
                distinct: ['patientId'],
              })
              .then((rows) => rows.map((r) => r.patientId)),
          },
          age: { not: null },
        },
        select: { age: true },
      }),
    ]);

    // ── 5. doctorPerformance — resolve names and revenue ─────────────────────
    const doctorPerformance = [];
    if (doctorAppointments.length > 0) {
      const doctorIds = doctorAppointments.map((d) => d.doctorId);

      // Fetch doctor names via ClinicStaff → User
      const staffRows = await prisma.clinicStaff.findMany({
        where: { clinicId, userId: { in: doctorIds }, role: 'DOCTOR' },
        select: {
          userId: true,
          user: { select: { name: true } },
        },
      });

      // Also check DoctorProfile-linked users (doctorProfile.userId maps to clinicStaff.userId)
      // Build userId → name map from staff
      const nameMap = {};
      for (const staff of staffRows) {
        nameMap[staff.userId] = staff.user.name || 'Unknown Doctor';
      }

      // For any doctorId not found via ClinicStaff, fall back to DoctorProfile → User
      const unmappedIds = doctorIds.filter((id) => !nameMap[id]);
      if (unmappedIds.length > 0) {
        const doctorProfiles = await prisma.doctorProfile.findMany({
          where: { id: { in: unmappedIds } },
          select: {
            id: true,
            user: { select: { name: true } },
          },
        });
        for (const dp of doctorProfiles) {
          nameMap[dp.id] = dp.user.name || 'Unknown Doctor';
        }
      }

      // Revenue per doctor — filter paid payments by doctorId via appointment relation
      const doctorRevenueResults = await Promise.all(
        doctorIds.map(async (dId) => {
          const rev = await prisma.payment.aggregate({
            where: {
              status: 'PAID',
              appointment: {
                clinicId,
                doctorId: dId,
                ...(dateRange.gte ? { appointmentDate: dateRange } : {}),
              },
            },
            _sum: { amount: true },
          });
          return { doctorId: dId, revenue: rev._sum.amount || 0 };
        })
      );

      const revenueMap = {};
      for (const r of doctorRevenueResults) {
        revenueMap[r.doctorId] = r.revenue;
      }

      for (const row of doctorAppointments) {
        doctorPerformance.push({
          doctor: nameMap[row.doctorId] || 'Unknown Doctor',
          appointments: row._count.id,
          revenue: revenueMap[row.doctorId] || 0,
        });
      }

      // Sort by appointments descending
      doctorPerformance.sort((a, b) => b.appointments - a.appointments);
    }

    // ── 6. Build revenueTrend ─────────────────────────────────────────────────
    /**
     * Buckets paid payments by day or week.
     * Returns [{ date: 'YYYY-MM-DD', revenue }] sorted ascending.
     */
    function buildRevenueTrend(payments, gran) {
      const buckets = {};
      for (const p of payments) {
        if (!p.paidAt) continue;
        const key = getBucketKey(new Date(p.paidAt), gran);
        buckets[key] = (buckets[key] || 0) + (p.amount || 0);
      }
      return Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }));
    }

    // ── 7. Build appointmentTrend ─────────────────────────────────────────────
    function buildAppointmentTrend(appointments, gran) {
      const buckets = {};
      for (const a of appointments) {
        const key = getBucketKey(new Date(a.appointmentDate), gran);
        buckets[key] = (buckets[key] || 0) + 1;
      }
      return Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));
    }

    /**
     * Returns a sortable bucket key string for the given date.
     * daily   → 'YYYY-MM-DD'
     * weekly  → ISO week start date 'YYYY-MM-DD' (Monday)
     */
    function getBucketKey(date, gran) {
      if (gran === 'weekly') {
        // Get Monday of the week
        const d = new Date(date);
        const day = d.getUTCDay(); // 0=Sun, 1=Mon…6=Sat
        const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
        d.setUTCDate(d.getUTCDate() + diff);
        return d.toISOString().slice(0, 10);
      }
      // daily
      return new Date(date).toISOString().slice(0, 10);
    }

    const revenueTrend = buildRevenueTrend(paidPayments, granularity);
    const appointmentTrend = buildAppointmentTrend(allAppointments, granularity);

    // ── 8. paymentBreakdown ───────────────────────────────────────────────────
    const paymentBreakdown = {
      cash: Math.round((cashPayments._sum.amount || 0) * 100) / 100,
      online: Math.round((onlinePayments._sum.amount || 0) * 100) / 100,
    };

    // ── 9. appointmentStatus ──────────────────────────────────────────────────
    const appointmentStatusData = {
      completed: completedCount,
      cancelled: cancelledCount,
      noShow: noShowCount,
    };

    // ── 10. patientDemographics — age bucketing in JS ─────────────────────────
    const ageBuckets = { '<18': 0, '18-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    for (const { age } of patientAges) {
      if (age === null || age === undefined) continue;
      if (age < 18) ageBuckets['<18']++;
      else if (age <= 30) ageBuckets['18-30']++;
      else if (age <= 45) ageBuckets['31-45']++;
      else if (age <= 60) ageBuckets['46-60']++;
      else ageBuckets['60+']++;
    }
    const patientDemographics = Object.entries(ageBuckets).map(([ageGroup, count]) => ({
      ageGroup,
      count,
    }));

    // ── 11. peakHours — group by hour of day in JS ────────────────────────────
    const hourCounts = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;
    for (const a of allAppointments) {
      const hour = new Date(a.appointmentDate).getUTCHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    function formatHourLabel(h) {
      if (h === 0) return '12 AM';
      if (h < 12) return `${h} AM`;
      if (h === 12) return '12 PM';
      return `${h - 12} PM`;
    }

    const peakHours = Object.entries(hourCounts).map(([hourStr, count]) => {
      const hour = parseInt(hourStr, 10);
      return { hour, label: formatHourLabel(hour), count };
    });
    // Already sorted 0–23 since we seeded all hours

    // ── 12. dayOfWeek — group by day in JS, Mon–Sun order ────────────────────
    const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Mon–Sun order: indices 1,2,3,4,5,6,0
    const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

    const dowCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const a of allAppointments) {
      const dow = new Date(a.appointmentDate).getUTCDay(); // 0=Sun … 6=Sat
      dowCounts[dow] = (dowCounts[dow] || 0) + 1;
    }
    const dayOfWeek = DOW_ORDER.map((d) => ({
      day: DOW_LABELS[d],
      count: dowCounts[d],
    }));

    // ── 13. Return response ───────────────────────────────────────────────────
    return sendSuccess(res, {
      revenueTrend,
      appointmentTrend,
      paymentBreakdown,
      appointmentStatus: appointmentStatusData,
      doctorPerformance,
      patientDemographics,
      peakHours,
      dayOfWeek,
      granularity,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Widget preference defaults ───────────────────────────────────────────────

/**
 * Default widget configuration returned when no preferences have been saved yet.
 * Each entry has a stable `id`, `visible: true`, and an initial `order`.
 */
const DEFAULT_WIDGET_CONFIG = [
  { id: 'revenue-metrics',     visible: true, order: 0 },
  { id: 'patient-metrics',     visible: true, order: 1 },
  { id: 'appointment-metrics', visible: true, order: 2 },
  { id: 'staff-metrics',       visible: true, order: 3 },
  { id: 'alerts-insights',     visible: true, order: 4 },
  { id: 'revenue-chart',       visible: true, order: 5 },
  { id: 'appointment-chart',   visible: true, order: 6 },
  { id: 'revenue-by-doctor',   visible: true, order: 7 },
  { id: 'recent-transactions', visible: true, order: 8 },
  { id: 'quick-actions',       visible: true, order: 9 },
];

// ─── getTransactions ──────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/clinic/:clinicId/transactions
 *
 * Returns a paginated list of PAID payments for the clinic, supporting all
 * the same filters as the enhanced dashboard endpoint plus pagination params.
 *
 * Query params: (all optional)
 *   period, startDate, endDate, doctorId, paymentMethod, appointmentStatus
 *   page   - page number (default 1)
 *   limit  - rows per page (default 20, max 1000)
 *
 * When the total count exceeds 1000 the response includes `truncated: true`
 * and data is capped at 1000 rows (export scenario safety guard).
 *
 * Response:
 *   { transactions: [...], total, page, pages, truncated? }
 *
 * Requirements: 6.21
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // ── 1. Validate query params ──────────────────────────────────────────────
    const parsed = transactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { period, startDate, endDate, doctorId, paymentMethod, page, limit } = parsed.data;

    // ── 2. Verify clinic ownership ────────────────────────────────────────────
    const clinic = await verifyClinicOwnership(req, res, clinicId);
    if (!clinic) return;

    // ── 3. Build filters ──────────────────────────────────────────────────────
    const dateRange = buildDateRange(period, startDate, endDate);
    const payWhere = buildPaymentWhere(clinicId, dateRange, { paymentMethod });

    // Narrow appointment relation to include optional doctorId filter
    if (doctorId) {
      payWhere.appointment = {
        ...(payWhere.appointment || {}),
        clinicId,
        doctorId,
      };
    }

    // ── 4. Count total matching rows ──────────────────────────────────────────
    const total = await prisma.payment.count({ where: payWhere });

    // ── 5. Determine pagination boundaries ───────────────────────────────────
    // Hard-cap at 1000 rows for export safety (Requirement 6.21)
    const MAX_ROWS = 1000;
    const truncated = total > MAX_ROWS;
    const effectiveTotal = truncated ? MAX_ROWS : total;
    const pages = Math.ceil(total / limit);

    const skip = (page - 1) * limit;

    // Don't fetch beyond the 1000-row cap
    if (skip >= MAX_ROWS) {
      return sendSuccess(res, {
        transactions: [],
        total,
        page,
        pages,
        ...(truncated ? { truncated: true } : {}),
      });
    }

    // Ensure we don't overshoot the 1000-row cap within the last permitted page
    const effectiveLimit = Math.min(limit, MAX_ROWS - skip);

    // ── 6. Fetch paginated transactions ───────────────────────────────────────
    const transactions = await prisma.payment.findMany({
      where: payWhere,
      skip,
      take: effectiveLimit,
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        amount: true,
        method: true,
        paidAt: true,
        patient: {
          select: { name: true },
        },
        appointment: {
          select: {
            doctor: {
              select: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    // ── 7. Return response ────────────────────────────────────────────────────
    return sendSuccess(res, {
      transactions,
      total,
      page,
      pages,
      ...(truncated ? { truncated: true } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// ─── getDoctorList ────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/clinic/:clinicId/doctors
 *
 * Returns a lightweight list of active doctors at the clinic for use in
 * the filter dropdown on the dashboard.
 *
 * Response:
 *   { doctors: [{ id, name }] }
 *
 * Requirements: 7.9, 7.10
 */
exports.getDoctorList = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // ── 1. Verify clinic ownership ────────────────────────────────────────────
    const clinic = await verifyClinicOwnership(req, res, clinicId);
    if (!clinic) return;

    // ── 2. Query active doctors at this clinic ────────────────────────────────
    const staffRows = await prisma.clinicStaff.findMany({
      where: {
        clinicId,
        role: 'DOCTOR',
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // ── 3. Map to flat { id, name } shape ─────────────────────────────────────
    const doctors = staffRows.map((row) => ({
      id: row.user.id,
      name: row.user.name,
    }));

    return sendSuccess(res, { doctors });
  } catch (error) {
    next(error);
  }
};

// ─── getWidgetPreferences ─────────────────────────────────────────────────────

/**
 * GET /api/dashboard/clinic/:clinicId/widget-preferences
 *
 * Returns the saved widget configuration for the authenticated user.
 * Falls back to DEFAULT_WIDGET_CONFIG when no record exists yet.
 *
 * Response:
 *   { widgets: [{ id, visible, order }] }
 *
 * Requirements: 7.11, 7.18
 */
exports.getWidgetPreferences = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // ── 1. Verify clinic ownership ────────────────────────────────────────────
    const clinic = await verifyClinicOwnership(req, res, clinicId);
    if (!clinic) return;

    // ── 2. Fetch preference record for this user ──────────────────────────────
    const record = await prisma.dashboardWidgetPreference.findUnique({
      where: { userId: req.user.id },
    });

    // ── 3. Return saved config or default ─────────────────────────────────────
    const widgets = record ? record.widgets : DEFAULT_WIDGET_CONFIG;

    return sendSuccess(res, { widgets });
  } catch (error) {
    next(error);
  }
};

// ─── saveWidgetPreferences ────────────────────────────────────────────────────

/**
 * PUT /api/dashboard/clinic/:clinicId/widget-preferences
 *
 * Validates and persists the widget configuration for the authenticated user.
 * At least one widget must have `visible: true`; otherwise returns HTTP 400.
 *
 * Request body:
 *   { widgets: [{ id, visible, order }] }
 *
 * Response:
 *   { widgets: [...] }  — the saved widgets array from the database record
 *
 * Requirements: 7.9, 7.18
 */
exports.saveWidgetPreferences = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // ── 1. Validate request body ──────────────────────────────────────────────
    const parsed = widgetPreferencesBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { widgets } = parsed.data;

    // ── 2. Verify clinic ownership ────────────────────────────────────────────
    const clinic = await verifyClinicOwnership(req, res, clinicId);
    if (!clinic) return;

    // ── 3. Business rule — at least 1 widget must remain visible ─────────────
    const hasVisible = widgets.some((w) => w.visible === true);
    if (!hasVisible) {
      return res.status(400).json({
        success: false,
        message: 'At least one widget must be visible',
      });
    }

    // ── 4. Upsert preference record ───────────────────────────────────────────
    const userId = req.user.id;

    const savedRecord = await prisma.dashboardWidgetPreference.upsert({
      where: { userId },
      create: {
        userId,
        clinicId,
        widgets,
      },
      update: {
        widgets,
        updatedAt: new Date(),
      },
    });

    // ── 5. Return saved widgets ───────────────────────────────────────────────
    return sendSuccess(res, { widgets: savedRecord.widgets });
  } catch (error) {
    next(error);
  }
};
