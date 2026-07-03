const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { hashValue, generateTempPassword } = require('../utils/crypto');
const { sendDoctorCredentialsEmail } = require('../services/email.service');
const { createDoctorSchema, updateDoctorSchema } = require('../validators/doctor.validator');

/**
 * POST /api/clinics - Create clinic
 */
const createClinic = async (req, res, next) => {
  try {
    const { name, phone, address, city, latitude, longitude, openingTime, closingTime, description } = req.body;

    const clinic = await prisma.clinic.create({
      data: {
        name,
        phone,
        address,
        city,
        latitude,
        longitude,
        openingTime,
        closingTime,
        description,
        ownerId: req.user.id,
        clinicStaff: {
          create: {
            userId: req.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    // Update user role to CLINIC_OWNER if not already
    if (req.user.role !== 'CLINIC_OWNER' && req.user.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'CLINIC_OWNER' },
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_CREATED',
      entityType: 'Clinic',
      entityId: clinic.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { clinic }, 'Clinic created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/my - Get owner's clinics
 */
const getMyClinics = async (req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: { select: { staff: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { clinics });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/my-status - Get owner's first clinic with full verification status
 */
const getMyClinicStatus = async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
      include: {
        verificationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!clinic) return sendError(res, 'No clinic found for this owner', 404);

    return sendSuccess(res, { clinic });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clinics/my-resubmit - Resubmit clinic after REJECTED or CHANGES_REQUIRED
 * Accepts all editable clinic fields, updates in a single transaction,
 * resets status to PENDING, clears reasons, and writes a verification log.
 */
const resubmitClinic = async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (!clinic) return sendError(res, 'No clinic found', 404);

    if (!['REJECTED', 'CHANGES_REQUIRED'].includes(clinic.approvalStatus)) {
      return sendError(res, 'Clinic can only be resubmitted when status is REJECTED or CHANGES_REQUIRED', 400);
    }

    const oldStatus = clinic.approvalStatus;

    // All fields the owner is allowed to update on resubmit
    const allowedFields = [
      // Basic info
      'name', 'phone', 'address', 'landmark', 'city', 'state', 'district',
      'pincode', 'googleMapsLocation', 'latitude', 'longitude',
      'emergencyContactNumber', 'alternateEmail', 'description',
      // Clinic type & specialties
      'clinicType', 'clinicTypeOther', 'specialties', 'specialtyOther', 'doctorCount',
      // Branding
      'clinicLogoUrl', 'clinicCoverImageUrl',
      // Operations
      'consultationModes', 'weeklySchedule', 'openingHours',
      'avgConsultationMinutes', 'appointmentSlotMinutes', 'dailyPatientCapacity',
      // Facilities & services
      'facilities', 'languagesSpoken', 'paymentMethods', 'insuranceSupported',
      // Compliance
      'clinicRegistrationNumber', 'gstNumber', 'panNumber',
      'licenseDocumentUrl', 'clinicLicenseDocument',
      'medicalEstablishmentCertificateUrl', 'gstCertificateUrl',
      'panCardUrl', 'additionalDocuments',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Keep clinicLicenseDocument in sync with licenseDocumentUrl
    if (updateData.licenseDocumentUrl && !updateData.clinicLicenseDocument) {
      updateData.clinicLicenseDocument = updateData.licenseDocumentUrl;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedClinic = await tx.clinic.update({
        where: { id: clinic.id },
        data: {
          ...updateData,
          approvalStatus: 'PENDING',
          isVerified: false,
          isActive: false,
          rejectionReason: null,
          changesRequestedReason: null,
          suspendedReason: null,
          rejectedById: null,
          rejectedAt: null,
          lastResubmittedAt: new Date(),
          submittedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: req.user.id },
        data: { approvalStatus: 'PENDING', rejectionReason: null },
      });

      await tx.clinicVerificationLog.create({
        data: {
          clinicId: clinic.id,
          adminId: null,
          oldStatus,
          newStatus: 'PENDING',
          remark: 'Owner resubmitted clinic for review',
        },
      });

      return updatedClinic;
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_RESUBMITTED',
      entityType: 'Clinic',
      entityId: clinic.id,
      metadata: { oldStatus, fieldsUpdated: Object.keys(updateData) },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { clinic: updated }, 'Clinic resubmitted for review successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/:id - Get clinic details
 */
const getClinic = async (req, res, next) => {
  try {
    const { id } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, mobile: true, email: true } },
        clinicStaff: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, mobile: true, email: true, role: true },
              include: { doctorProfile: true },
            },
          },
        },
        doctorClinics: {
          where: { isActive: true },
          include: {
            doctor: {
              include: {
                user: { select: { id: true, name: true, mobile: true } },
              },
            },
          },
        },
      },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found', 404);
    }

    return sendSuccess(res, { clinic });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clinics/:id - Update clinic
 */
const updateClinic = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.clinic.findFirst({
      where: { id, ownerId: req.user.role === 'SUPER_ADMIN' ? undefined : req.user.id },
    });

    if (!existing) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    const clinic = await prisma.clinic.update({
      where: { id },
      data: req.body,
    });

    return sendSuccess(res, { clinic }, 'Clinic updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clinics/:id/staff - Add staff to clinic
 */
const addStaff = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;
    const { mobile, role, name, email, password } = req.body;

    // Verify clinic ownership
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        ownerId: req.user.role === 'SUPER_ADMIN' ? undefined : req.user.id,
      },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      const staffRole = role === 'DOCTOR' ? 'DOCTOR' : 'RECEPTIONIST';
      const tempPassword = password || generateTempPassword();
      const passwordHash = await hashValue(tempPassword);

      user = await prisma.user.create({
        data: {
          mobile,
          name,
          email,
          role: staffRole,
          approvalStatus: 'VERIFIED',
          passwordHash,
          ...(role === 'DOCTOR' && {
            doctorProfile: {
              create: {
                approvalStatus: 'VERIFIED',
                marketplaceVisible: false,
              },
            },
          }),
          ...(role === 'RECEPTIONIST' && {
            receptionistProfile: {
              create: {
                assignedClinicId: clinicId,
                createdByOwnerId: req.user.id,
              },
            },
          }),
        },
      });

      // Send credentials email if doctor and email provided
      if (role === 'DOCTOR' && email) {
        try {
          await sendDoctorCredentialsEmail(email, name, clinic.name, tempPassword);
        } catch (emailError) {
          // Log error but don't fail the request
          console.error('Failed to send doctor credentials email:', emailError);
        }
      }
    } else {
      // Update role if needed
      const targetRole = role === 'DOCTOR' ? 'DOCTOR' : 'RECEPTIONIST';
      if (user.role === 'PATIENT') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: targetRole },
        });
        if (role === 'DOCTOR' && !await prisma.doctorProfile.findUnique({ where: { userId: user.id } })) {
          await prisma.doctorProfile.create({
            data: {
              userId: user.id,
              approvalStatus: 'VERIFIED',
              marketplaceVisible: false,
            },
          });
        }
        if (role === 'RECEPTIONIST' && !await prisma.receptionistProfile.findUnique({ where: { userId: user.id } })) {
          await prisma.receptionistProfile.create({
            data: {
              userId: user.id,
              assignedClinicId: clinicId,
              createdByOwnerId: req.user.id,
            },
          });
        }
      }
    }

    // Check if already staff
    const existingStaff = await prisma.clinicStaff.findUnique({
      where: { clinicId_userId: { clinicId, userId: user.id } },
    });

    if (existingStaff) {
      if (existingStaff.isActive) {
        return sendError(res, 'User is already a staff member of this clinic', 409);
      }
      // Reactivate
      await prisma.clinicStaff.update({
        where: { id: existingStaff.id },
        data: { isActive: true, role },
      });
    } else {
      await prisma.clinicStaff.create({
        data: { clinicId, userId: user.id, role },
      });
    }

    // If doctor, create DoctorClinic link
    if (role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (doctorProfile) {
        await prisma.doctorClinic.upsert({
          where: { doctorId_clinicId: { doctorId: doctorProfile.id, clinicId } },
          update: { isActive: true, inviteStatus: 'ACCEPTED', joinedAt: new Date(), removedAt: null },
          create: { doctorId: doctorProfile.id, clinicId, inviteStatus: 'ACCEPTED', joinedAt: new Date() },
        });
      }
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'STAFF_ADDED',
      entityType: 'ClinicStaff',
      entityId: clinicId,
      metadata: { staffUserId: user.id, role },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: { id: user.id, name: user.name, mobile: user.mobile, role } }, 'Staff added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/:id/staff - Get clinic staff
 * Returns all active staff from ClinicStaff table
 * ALSO includes doctors who joined via DoctorClinic invitation (inviteStatus ACCEPTED)
 */
const getStaff = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;

    // Staff added directly (receptionists + directly-added doctors)
    const directStaff = await prisma.clinicStaff.findMany({
      where: { clinicId, isActive: true },
      include: {
        user: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });

    // Doctors who joined via DoctorClinic invitation (NOT already in directStaff)
    const directStaffUserIds = new Set(directStaff.map((s) => s.user.id));

    const invitedDoctors = await prisma.doctorClinic.findMany({
      where: {
        clinicId,
        isActive: true,
        inviteStatus: 'ACCEPTED',
        doctorId: { not: undefined },
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true, name: true, mobile: true, email: true, role: true,
              },
            },
          },
        },
      },
    });

    // Convert invited doctors to the same shape as ClinicStaff entries
    const invitedAsStaff = invitedDoctors
      .filter((dc) => !directStaffUserIds.has(dc.doctor?.user?.id)) // avoid duplicates
      .map((dc) => ({
        id: dc.id,
        clinicId: dc.clinicId,
        userId: dc.doctor?.user?.id,
        role: 'DOCTOR',
        isActive: true,
        createdAt: dc.createdAt,
        updatedAt: dc.updatedAt,
        user: {
          ...dc.doctor.user,
          doctorProfile: dc.doctor,
        },
      }));

    const staff = [...directStaff, ...invitedAsStaff];

    return sendSuccess(res, { staff });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinics/:id/doctor-invites - Get doctor invite history for a clinic
 */
const getDoctorInvites = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;

    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({
        where: { id: clinicId, ownerId: req.user.id },
      });
      if (!clinic) return sendError(res, 'Clinic not found or access denied', 404);
    }

    const invites = await prisma.doctorClinic.findMany({
      where: { clinicId },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, mobile: true, email: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return sendSuccess(res, { invites });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clinics/:id/staff/:staffId/status - Update staff status
 */
const updateStaffStatus = async (req, res, next) => {
  try {
    const { id: clinicId, staffId } = req.params;
    const { isActive } = req.body;

    const staffRecord = await prisma.clinicStaff.findFirst({
      where: { id: staffId, clinicId },
    });

    if (!staffRecord) {
      return sendError(res, 'Staff record not found', 404);
    }

    await prisma.clinicStaff.update({
      where: { id: staffId },
      data: { isActive },
    });

    return sendSuccess(res, {}, `Staff ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

const getClinicRevenue = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;
    const { period = 'today' } = req.query;

    // Verify access
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) return sendError(res, 'Access denied', 403);
    }

    // Date range
    const now = new Date();
    let startDate, endDate;

    if (period === 'today') {
      startDate = new Date(); startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(); endDate.setUTCHours(23, 59, 59, 999);
    } else if (period === 'week') {
      startDate = new Date(); startDate.setDate(now.getDate() - 6); startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(); endDate.setUTCHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(); endDate.setUTCHours(23, 59, 59, 999);
    } else {
      startDate = new Date(0);
      endDate = new Date();
    }

    // Clinic revenue = CASH + UPI only (exclude RAZORPAY which is platform booking fee)
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        method: { in: ['CASH', 'UPI'] },
        paidAt: { gte: startDate, lte: endDate },
        appointment: { clinicId },
      },
      include: {
        appointment: {
          select: {
            id: true, slotTime: true, appointmentDate: true,
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
        patient: { select: { id: true, name: true, mobile: true } },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const cashRevenue  = payments.filter((p) => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const onlineRevenue = payments.filter((p) => p.method === 'UPI').reduce((sum, p) => sum + p.amount, 0);

    // Revenue by doctor
    const byDoctor = {};
    for (const p of payments) {
      const name = p.appointment?.doctor?.user?.name || 'Unknown';
      if (!byDoctor[name]) byDoctor[name] = 0;
      byDoctor[name] += p.amount;
    }

    // Today's appointment count
    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);
    const [totalAppointments, completedToday, pendingPayments] = await Promise.all([
      prisma.appointment.count({ where: { clinicId, appointmentDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { clinicId, status: 'COMPLETED', appointmentDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.payment.count({ where: { status: 'PENDING', appointment: { clinicId } } }),
    ]);

    return sendSuccess(res, {
      period,
      totalRevenue,
      cashRevenue,
      onlineRevenue,
      transactionCount: payments.length,
      revenueByDoctor: Object.entries(byDoctor).map(([doctor, amount]) => ({ doctor, amount })),
      recentPayments: payments.slice(0, 10),
      stats: { totalAppointments, completedToday, pendingPayments },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/clinic/:id/booking-metrics
 * Returns free vs paid booking breakdown for the clinic owner dashboard.
 */
const getClinicBookingMetrics = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;

    // Access check
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) return sendError(res, 'Access denied', 403);
    }

    const [freeBookings, paidBookings] = await Promise.all([
      // Free bookings for this clinic = payments with amount 0
      prisma.payment.count({
        where: { amount: 0, status: 'PAID', appointment: { clinicId } },
      }),
      // Paid bookings for this clinic = payments with amount > 0
      prisma.payment.count({
        where: { amount: { gt: 0 }, status: 'PAID', appointment: { clinicId } },
      }),
    ]);

    const total = freeBookings + paidBookings;
    return sendSuccess(res, {
      freeBookings,
      paidBookings,
      totalBookings: total,
      freeBookingRate: total > 0 ? Math.round((freeBookings / total) * 100) : 0,
    });
  } catch (error) {
    next(error);
  }
};

const getClinicAppointments = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;
    const { date, status, doctorId, page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    // Verify access: owner or super admin
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({ where: { id: clinicId, ownerId: req.user.id } });
      if (!clinic) {
        // Also allow receptionist/doctor of this clinic
        const staff = await prisma.clinicStaff.findFirst({
          where: { clinicId, userId: req.user.id, isActive: true },
        });
        if (!staff) return sendError(res, 'Access denied', 403);
      }
    }

    const where = { clinicId };
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (date) {
      const d = new Date(date);
      where.appointmentDate = {
        gte: new Date(new Date(d).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(d).setUTCHours(23, 59, 59, 999)),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          patient: { select: { id: true, name: true, mobile: true } },
          doctor: { include: { user: { select: { id: true, name: true } } } },
          queueItem: { select: { id: true, status: true, position: true } },
        },
        orderBy: [{ appointmentDate: 'desc' }, { queueNumber: 'asc' }],
      }),
      prisma.appointment.count({ where }),
    ]);

    return sendPaginated(res, appointments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DOCTOR MANAGEMENT (Phase 1)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/clinic/doctors - Create a new doctor account
 */
const createDoctor = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createDoctorSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    const {
      name,
      email,
      mobile,
      gender,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      availableDays,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime,
      consultationMode,
    } = value;

    // Get clinic ownership - owner must have a verified clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        ownerId: req.user.id,
        approvalStatus: 'VERIFIED',
        isActive: true,
      },
    });

    if (!clinic) {
      return sendError(res, 'You must have a verified clinic to add doctors', 403);
    }

    // Check for duplicate email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return sendError(res, 'Email already exists', 409);
    }

    // Check for duplicate mobile
    const existingMobile = await prisma.user.findUnique({ where: { mobile } });
    if (existingMobile) {
      return sendError(res, 'Mobile number already exists', 409);
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashValue(tempPassword);

    // Create doctor in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          name,
          email,
          mobile,
          role: 'DOCTOR',
          approvalStatus: 'VERIFIED',
          passwordHash,
          authProvider: 'EMAIL_PASSWORD',
          isActive: true,
        },
      });

      // Create doctor profile
      const doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          specialization,
          qualification,
          experienceYears,
          consultationFee,
          gender,
          approvalStatus: 'VERIFIED',
          profileStatus: 'INCOMPLETE',
          verificationStatus: 'NOT_VERIFIED',
          marketplaceVisible: false,
          onlineAvailable: consultationMode === 'ONLINE' || consultationMode === 'BOTH',
          offlineAvailable: consultationMode === 'OFFLINE' || consultationMode === 'BOTH',
        },
      });

      // Create clinic_staff relation
      await tx.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          role: 'DOCTOR',
          isActive: true,
        },
      });

      // Create clinic_doctor relation
      await tx.doctorClinic.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: clinic.id,
          inviteStatus: 'ACCEPTED',
          consultationFee,
          availableDays,
          startTime,
          endTime,
          isActive: true,
          joinedAt: new Date(),
        },
      });

      return { user, doctorProfile };
    });

    // Send credentials email
    try {
      await sendDoctorCredentialsEmail(email, name, clinic.name, tempPassword);
    } catch (emailError) {
      // Log but don't fail the request
      console.error('Failed to send doctor credentials email:', emailError);
    }

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_CREATED',
      entityType: 'Doctor',
      entityId: result.user.id,
      metadata: { doctorId: result.doctorProfile.id, clinicId: clinic.id },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        doctor: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          mobile: result.user.mobile,
          profileId: result.doctorProfile.id,
        },
        tempPassword, // Include in response for owner to share if email fails
      },
      'Doctor account created successfully. Credentials sent to email.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinic/doctors - Get all doctors for the owner's clinic
 */
const getClinicDoctors = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get owner's clinic
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'No clinic found', 404);
    }

    // Build where clause
    const where = {
      clinicId: clinic.id,
      role: 'DOCTOR',
    };

    if (status) {
      where.isActive = status === 'ACTIVE';
    }

    // Get doctors
    const [doctors, total] = await Promise.all([
      prisma.clinicStaff.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
            include: {
              doctorProfile: {
                select: {
                  id: true,
                  specialization: true,
                  qualification: true,
                  experienceYears: true,
                  consultationFee: true,
                  profileStatus: true,
                  verificationStatus: true,
                  gender: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clinicStaff.count({ where }),
    ]);

    // Get DoctorClinic details for each doctor
    const doctorIds = doctors
      .map((d) => d.user.doctorProfile?.id)
      .filter(Boolean);

    const doctorClinics = await prisma.doctorClinic.findMany({
      where: {
        doctorId: { in: doctorIds },
        clinicId: clinic.id,
      },
    });

    // Map doctor clinics to doctor IDs
    const doctorClinicMap = {};
    doctorClinics.forEach((dc) => {
      doctorClinicMap[dc.doctorId] = dc;
    });

    // Format response
    const formattedDoctors = doctors.map((staff) => ({
      id: staff.user.id,
      name: staff.user.name,
      email: staff.user.email,
      mobile: staff.user.mobile,
      isActive: staff.isActive,
      lastLoginAt: staff.user.lastLoginAt,
      joinedAt: staff.createdAt,
      profile: staff.user.doctorProfile
        ? {
            ...staff.user.doctorProfile,
            availableDays:
              doctorClinicMap[staff.user.doctorProfile.id]?.availableDays || [],
            startTime: doctorClinicMap[staff.user.doctorProfile.id]?.startTime,
            endTime: doctorClinicMap[staff.user.doctorProfile.id]?.endTime,
          }
        : null,
    }));

    // Apply search filter if provided
    let filteredDoctors = formattedDoctors;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDoctors = formattedDoctors.filter(
        (d) =>
          d.name?.toLowerCase().includes(searchLower) ||
          d.email?.toLowerCase().includes(searchLower) ||
          d.mobile?.includes(search) ||
          d.profile?.specialization?.toLowerCase().includes(searchLower)
      );
    }

    return sendPaginated(res, filteredDoctors, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinic/doctors/:id - Get doctor details
 */
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get owner's clinic
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'No clinic found', 404);
    }

    // Find doctor
    const doctor = await prisma.user.findUnique({
      where: { id },
      include: {
        doctorProfile: true,
        clinicStaff: {
          where: { clinicId: clinic.id },
        },
      },
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return sendError(res, 'Doctor not found', 404);
    }

    // Check if doctor belongs to this clinic
    if (doctor.clinicStaff.length === 0) {
      return sendError(res, 'Doctor does not belong to your clinic', 403);
    }

    // Get DoctorClinic details
    const doctorClinic = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: doctor.doctorProfile.id,
          clinicId: clinic.id,
        },
      },
    });

    return sendSuccess(res, {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        mobile: doctor.mobile,
        isActive: doctor.clinicStaff[0].isActive,
        lastLoginAt: doctor.lastLoginAt,
        createdAt: doctor.createdAt,
        profile: {
          ...doctor.doctorProfile,
          availableDays: doctorClinic?.availableDays || [],
          startTime: doctorClinic?.startTime,
          endTime: doctorClinic?.endTime,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clinic/doctors/:id - Update doctor details
 */
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = updateDoctorSchema.validate(req.body);
    if (error) {
      return sendError(res, error.details[0].message, 400);
    }

    // Get owner's clinic
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'No clinic found', 404);
    }

    // Find doctor
    const doctor = await prisma.user.findUnique({
      where: { id },
      include: {
        doctorProfile: true,
        clinicStaff: {
          where: { clinicId: clinic.id },
        },
      },
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return sendError(res, 'Doctor not found', 404);
    }

    // Check if doctor belongs to this clinic
    if (doctor.clinicStaff.length === 0) {
      return sendError(res, 'Doctor does not belong to your clinic', 403);
    }

    const {
      name,
      mobile,
      gender,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      availableDays,
      startTime,
      endTime,
      breakStartTime,
      breakEndTime,
      consultationMode,
    } = value;

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update user
      if (name || mobile) {
        await tx.user.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(mobile && { mobile }),
          },
        });
      }

      // Update doctor profile
      if (
        gender ||
        specialization ||
        qualification ||
        experienceYears !== undefined ||
        consultationFee !== undefined ||
        consultationMode
      ) {
        await tx.doctorProfile.update({
          where: { userId: id },
          data: {
            ...(gender && { gender }),
            ...(specialization && { specialization }),
            ...(qualification && { qualification }),
            ...(experienceYears !== undefined && { experienceYears }),
            ...(consultationFee !== undefined && { consultationFee }),
            ...(consultationMode && {
              onlineAvailable:
                consultationMode === 'ONLINE' || consultationMode === 'BOTH',
              offlineAvailable:
                consultationMode === 'OFFLINE' || consultationMode === 'BOTH',
            }),
          },
        });
      }

      // Update DoctorClinic
      if (
        availableDays ||
        startTime ||
        endTime ||
        consultationFee !== undefined
      ) {
        await tx.doctorClinic.update({
          where: {
            doctorId_clinicId: {
              doctorId: doctor.doctorProfile.id,
              clinicId: clinic.id,
            },
          },
          data: {
            ...(availableDays && { availableDays }),
            ...(startTime && { startTime }),
            ...(endTime && { endTime }),
            ...(consultationFee !== undefined && { consultationFee }),
          },
        });
      }
    });

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_UPDATED',
      entityType: 'Doctor',
      entityId: id,
      metadata: { clinicId: clinic.id, updates: value },
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'Doctor updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/clinic/doctors/:id/status - Activate/Deactivate doctor
 */
const updateDoctorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendError(res, 'isActive must be a boolean', 400);
    }

    // Get owner's clinic
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'No clinic found', 404);
    }

    // Find doctor
    const staffRecord = await prisma.clinicStaff.findFirst({
      where: {
        userId: id,
        clinicId: clinic.id,
        role: 'DOCTOR',
      },
      include: {
        user: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });

    if (!staffRecord) {
      return sendError(res, 'Doctor not found in your clinic', 404);
    }

    // Update status in transaction
    await prisma.$transaction(async (tx) => {
      // Update clinic staff status
      await tx.clinicStaff.update({
        where: { id: staffRecord.id },
        data: { isActive },
      });

      // Update doctor clinic status
      await tx.doctorClinic.updateMany({
        where: {
          doctorId: staffRecord.user.doctorProfile.id,
          clinicId: clinic.id,
        },
        data: {
          isActive,
          ...(isActive ? {} : { removedAt: new Date() }),
        },
      });
    });

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      action: isActive ? 'DOCTOR_ACTIVATED' : 'DOCTOR_DEACTIVATED',
      entityType: 'Doctor',
      entityId: id,
      metadata: { clinicId: clinic.id },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {},
      `Doctor ${isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/clinic/doctors/:id - Soft delete doctor (deactivate permanently)
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get owner's clinic
    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'No clinic found', 404);
    }

    // Find doctor
    const staffRecord = await prisma.clinicStaff.findFirst({
      where: {
        userId: id,
        clinicId: clinic.id,
        role: 'DOCTOR',
      },
      include: {
        user: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });

    if (!staffRecord) {
      return sendError(res, 'Doctor not found in your clinic', 404);
    }

    // Soft delete (deactivate)
    await prisma.$transaction(async (tx) => {
      await tx.clinicStaff.update({
        where: { id: staffRecord.id },
        data: { isActive: false },
      });

      await tx.doctorClinic.updateMany({
        where: {
          doctorId: staffRecord.user.doctorProfile.id,
          clinicId: clinic.id,
        },
        data: {
          isActive: false,
          removedAt: new Date(),
        },
      });
    });

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_REMOVED',
      entityType: 'Doctor',
      entityId: id,
      metadata: { clinicId: clinic.id },
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'Doctor removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClinic,
  getMyClinics,
  getMyClinicStatus,
  resubmitClinic,
  getClinic,
  updateClinic,
  addStaff,
  getStaff,
  getDoctorInvites,
  updateStaffStatus,
  getClinicRevenue,
  getClinicBookingMetrics,
  getClinicAppointments,
  // Doctor Management
  createDoctor,
  getClinicDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  deleteDoctor,
};


// ═══════════════════════════════════════════════════════════════════════════
// ✅ NEW: BOOKING CONTROL ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/clinic/:id/bookings/stop
 * Stop accepting new bookings for the clinic
 */
const stopBookings = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;
    const { reason } = req.body;

    // Verify ownership
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({
        where: { id: clinicId, ownerId: req.user.id },
      });
      if (!clinic) return sendError(res, 'Access denied', 403);
    }

    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        isActive: false,
        suspendedReason: reason || 'Bookings temporarily stopped by owner',
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'BOOKINGS_STOPPED',
      entityType: 'Clinic',
      entityId: clinicId,
      metadata: { reason },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { clinic }, 'Bookings stopped successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clinic/:id/bookings/resume
 * Resume accepting bookings for the clinic
 */
const resumeBookings = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;

    // Verify ownership
    if (req.user.role !== 'SUPER_ADMIN') {
      const clinic = await prisma.clinic.findFirst({
        where: { id: clinicId, ownerId: req.user.id },
      });
      if (!clinic) return sendError(res, 'Access denied', 403);
    }

    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        isActive: true,
        suspendedReason: null,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'BOOKINGS_RESUMED',
      entityType: 'Clinic',
      entityId: clinicId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { clinic }, 'Bookings resumed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clinic/:id/booking-status
 * Check if clinic is accepting bookings
 */
const getBookingStatus = async (req, res, next) => {
  try {
    const { id: clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        isActive: true,
        approvalStatus: true,
        suspendedReason: true,
      },
    });

    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const acceptingBookings =
      clinic.isActive &&
      clinic.approvalStatus === 'VERIFIED';

    return sendSuccess(res, {
      acceptingBookings,
      clinic,
      message: acceptingBookings
        ? 'Clinic is accepting bookings'
        : clinic.suspendedReason || 'Clinic is not accepting bookings',
    });
  } catch (error) {
    next(error);
  }
};

// Export new functions
module.exports = {
  createClinic,
  getMyClinics,
  getMyClinicStatus,
  resubmitClinic,
  getClinic,
  updateClinic,
  addStaff,
  getStaff,
  getDoctorInvites,
  updateStaffStatus,
  getClinicRevenue,
  getClinicBookingMetrics,
  getClinicAppointments,
  createDoctor,
  getClinicDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  deleteDoctor,
  // ✅ NEW: Booking control
  stopBookings,
  resumeBookings,
  getBookingStatus,
};
