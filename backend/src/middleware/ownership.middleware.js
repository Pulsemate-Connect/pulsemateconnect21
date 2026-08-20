/**
 * ✅ SECURITY FIX: Ownership validation middleware
 * 
 * Prevents horizontal privilege escalation (IDOR vulnerabilities)
 * by ensuring users can only access their own resources.
 */

const prisma = require('../config/database');
const { sendError } = require('../utils/response');

/**
 * Middleware to validate user owns the appointment
 * Apply to: GET/PATCH /api/patient/appointments/:id
 */
const requireAppointmentOwnership = async (req, res, next) => {
  try {
    const appointmentId = req.params.id || req.params.appointmentId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!appointmentId) {
      return sendError(res, 'Appointment ID is required', 400);
    }
    
    // Build role-based query
    const whereClause = { id: appointmentId };
    
    if (userRole === 'PATIENT') {
      whereClause.patientId = userId;
    } else if (userRole === 'DOCTOR') {
      whereClause.doctor = { userId };
    } else if (userRole === 'CLINIC_OWNER') {
      whereClause.clinic = { ownerId: userId };
    } else if (userRole === 'RECEPTIONIST') {
      whereClause.clinic = {
        staff: {
          some: { userId, isActive: true },
        },
      };
    } else if (userRole === 'SUPER_ADMIN') {
      // Super admin has access to all
      return next();
    } else {
      return sendError(res, 'Access denied', 403);
    }
    
    const appointment = await prisma.appointment.findFirst({
      where: whereClause,
      select: { id: true }, // Only check existence
    });
    
    if (!appointment) {
      return sendError(res, 'Appointment not found or access denied', 404);
    }
    
    // Store appointment ID for controller
    req.appointmentId = appointmentId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate user owns the payment
 */
const requirePaymentOwnership = async (req, res, next) => {
  try {
    const paymentId = req.params.id || req.params.paymentId;
    const appointmentId = req.params.appointmentId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }
    
    // Build where clause based on which parameter is provided
    const whereClause = {};
    
    if (paymentId) {
      whereClause.id = paymentId;
    } else if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    } else {
      return sendError(res, 'Payment ID or Appointment ID is required', 400);
    }
    
    // Add ownership check
    if (userRole === 'PATIENT') {
      whereClause.patientId = userId;
    } else if (userRole === 'DOCTOR' || userRole === 'CLINIC_OWNER' || userRole === 'RECEPTIONIST') {
      // Staff can view payments for their appointments
      whereClause.appointment = {
        OR: [
          { doctor: { userId } },
          { clinic: { ownerId: userId } },
          { clinic: { staff: { some: { userId, isActive: true } } } },
        ],
      };
    }
    
    const payment = await prisma.payment.findFirst({
      where: whereClause,
      select: { id: true },
    });
    
    if (!payment) {
      return sendError(res, 'Payment not found or access denied', 404);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate clinic ownership or staff access
 */
const requireClinicOwnership = async (req, res, next) => {
  try {
    const clinicId = req.params.clinicId || req.params.id || req.body.clinicId;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!clinicId) {
      return sendError(res, 'Clinic ID is required', 400);
    }
    
    if (userRole === 'SUPER_ADMIN') {
      req.clinicId = clinicId;
      return next();
    }
    
    if (userRole === 'CLINIC_OWNER') {
      const clinic = await prisma.clinic.findFirst({
        where: { id: clinicId, ownerId: userId },
        select: { id: true },
      });
      
      if (!clinic) {
        return sendError(res, 'Clinic not found or access denied', 403);
      }
      
      req.clinicId = clinicId;
      return next();
    }
    
    // Receptionist/Doctor - check staff relationship
    const staff = await prisma.clinicStaff.findFirst({
      where: { clinicId, userId, isActive: true },
      select: { id: true, role: true },
    });
    
    if (!staff) {
      return sendError(res, 'Access denied to this clinic', 403);
    }
    
    req.clinicId = clinicId;
    req.staffRole = staff.role;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAppointmentOwnership,
  requirePaymentOwnership,
  requireClinicOwnership,
};
