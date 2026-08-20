// ═════════════════════════════════════════════════════════════════════════════
//  Dashboard Controller — PulseMate Connect
//  Quick wins: Combined dashboard data endpoint
// ═════════════════════════════════════════════════════════════════════════════
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * ✅ NEW: GET /api/clinic/:clinicId/dashboard
 * Combined endpoint that returns all dashboard data in one call
 * Reduces API calls from 5+ to 1
 */
exports.getClinicDashboard = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // Verify access
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({
        where: { id: clinicId, ownerId: req.user.id },
      });

      if (!clinic) {
        // Also allow staff
        const staff = await prisma.clinicStaff.findFirst({
          where: { clinicId, userId: req.user.id, isActive: true },
        });
        if (!staff) return sendError(res, 'Access denied', 403);
      }
    }

    // Date ranges
    const now = new Date();
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);

    const weekStart = new Date(); weekStart.setDate(now.getDate() - 6); weekStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); monthStart.setUTCHours(0, 0, 0, 0);

    // Parallel queries for performance
    const [
      // Today's stats
      todayAppointments,
      todayCompleted,
      todayPending,
      todayCancelled,

      // Counts
      totalDoctors,
      activeDoctors,
      totalStaff,
      totalPatients,

      // Revenue
      todayRevenue,
      weekRevenue,
      monthRevenue,

      // Recent data
      recentAppointments,
      activeQueue,

      // Clinic info
      clinic,
    ] = await Promise.all([
      // Today's appointments
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
      }),
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: 'CONFIRMED' },
      }),
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: 'CANCELLED' },
      }),

      // Doctor counts
      prisma.clinicStaff.count({
        where: { clinicId, role: 'DOCTOR' },
      }),
      prisma.clinicStaff.count({
        where: { clinicId, role: 'DOCTOR', isActive: true },
      }),

      // Staff count
      prisma.clinicStaff.count({
        where: { clinicId, isActive: true },
      }),

      // Unique patients
      prisma.appointment.findMany({
        where: { clinicId },
        distinct: ['patientId'],
        select: { patientId: true },
      }).then(r => r.length),

      // Revenue queries
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: todayStart, lte: todayEnd },
          appointment: { clinicId },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: weekStart, lte: todayEnd },
          appointment: { clinicId },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: { gte: monthStart, lte: todayEnd },
          appointment: { clinicId },
        },
        _sum: { amount: true },
      }),

      // Recent appointments
      prisma.appointment.findMany({
        where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd } },
        take: 10,
        orderBy: [{ appointmentDate: 'asc' }, { queueNumber: 'asc' }],
        include: {
          patient: { select: { id: true, name: true, mobile: true } },
          doctor: { include: { user: { select: { name: true } } } },
          queueItem: { select: { status: true, position: true } },
        },
      }),

      // Active queue
      prisma.queue.count({
        where: { clinicId, status: { in: ['WAITING', 'IN_PROGRESS'] } },
      }),

      // Clinic info
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: {
          id: true,
          name: true,
          isVerified: true,
          approvalStatus: true,
          isActive: true,
        },
      }),
    ]);

    // Format response
    return sendSuccess(res, {
      clinic,
      stats: {
        today: {
          appointments: todayAppointments,
          completed: todayCompleted,
          pending: todayPending,
          cancelled: todayCancelled,
          revenue: todayRevenue._sum.amount || 0,
          transactions: todayRevenue._count || 0,
        },
        totals: {
          doctors: totalDoctors,
          activeDoctors,
          staff: totalStaff,
          patients: totalPatients,
          activeQueue,
        },
        revenue: {
          today: todayRevenue._sum.amount || 0,
          week: weekRevenue._sum.amount || 0,
          month: monthRevenue._sum.amount || 0,
        },
      },
      recentAppointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ✅ NEW: GET /api/clinic/:clinicId/quick-stats
 * Even faster endpoint - just counts, no complex queries
 */
exports.getQuickStats = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    // Verify access
    if (req.user.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.clinicStaff.findFirst({
        where: {
          clinicId,
          userId: req.user.id,
          isActive: true,
        },
      });
      if (!hasAccess && req.user.role !== 'CLINIC_OWNER') {
        return sendError(res, 'Access denied', 403);
      }
    }

    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);

    const [todayCount, doctorCount, queueCount] = await Promise.all([
      prisma.appointment.count({
        where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.clinicStaff.count({
        where: { clinicId, role: 'DOCTOR', isActive: true },
      }),
      prisma.queue.count({
        where: { clinicId, status: { in: ['WAITING', 'IN_PROGRESS'] } },
      }),
    ]);

    return sendSuccess(res, {
      todayAppointments: todayCount,
      activeDoctors: doctorCount,
      activeQueue: queueCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClinicDashboard: exports.getClinicDashboard,
  getQuickStats: exports.getQuickStats,
};
