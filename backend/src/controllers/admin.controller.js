const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { hashPassword } = require('../utils/hash');
const {
  sendClinicApprovedEmail,
  sendClinicRejectedEmail,
  sendClinicChangesRequestedEmail,
  sendClinicSuspendedEmail,
} = require('../services/email.service');

const ROOT_ADMIN_LEVEL = 'ROOT';
const MANAGEABLE_ADMIN_LEVELS = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'];

const isRootAdmin = (user) => user?.adminProfile?.level === ROOT_ADMIN_LEVEL;
const isAdminUser = (user) => user?.role === 'SUPER_ADMIN' && !!user?.adminProfile;

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      pendingClinics,
      underReviewClinics,
      pendingDoctors,
      verifiedClinics,
      verifiedDoctors,
      rejectedClinics,
      changesRequiredClinics,
      suspendedClinics,
      freeBookings,
      paidBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.clinic.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.clinic.count({ where: { approvalStatus: 'UNDER_REVIEW' } }),
      prisma.doctorProfile.count({ where: { approvalStatus: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.clinic.count({ where: { approvalStatus: 'VERIFIED' } }),
      prisma.doctorProfile.count({ where: { approvalStatus: 'VERIFIED' } }),
      prisma.clinic.count({ where: { approvalStatus: 'REJECTED' } }),
      prisma.clinic.count({ where: { approvalStatus: 'CHANGES_REQUIRED' } }),
      prisma.clinic.count({ where: { approvalStatus: 'SUSPENDED' } }),
      // Free bookings = payments with amount = 0 and status PAID
      prisma.payment.count({ where: { amount: 0, status: 'PAID' } }),
      // Paid bookings = payments with amount > 0 and status PAID
      prisma.payment.count({ where: { amount: { gt: 0 }, status: 'PAID' } }),
      // Total platform revenue from ₹10 booking fees
      prisma.payment.aggregate({
        where: { amount: { gt: 0 }, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    const totalPaidPlusFreeBkg = freeBookings + paidBookings;
    const conversionRate = totalPaidPlusFreeBkg > 0
      ? Math.round((paidBookings / totalPaidPlusFreeBkg) * 100)
      : 0;

    return sendSuccess(res, {
      stats: {
        totalUsers,
        pendingClinics,
        underReviewClinics,
        pendingDoctors,
        verifiedClinics,
        verifiedDoctors,
        rejectedClinics,
        changesRequiredClinics,
        suspendedClinics,
      },
      bookingMetrics: {
        freeBookings,
        paidBookings,
        totalBookings: totalPaidPlusFreeBkg,
        conversionRate,       // % of bookings that were paid (not free)
        totalRevenue: totalRevenue._sum.amount || 0,
        revenuePerPatient: paidBookings > 0
          ? Math.round(((totalRevenue._sum.amount || 0) / paidBookings) * 100) / 100
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPendingClinics = async (req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { approvalStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, { clinics }, 'Pending clinics fetched');
  } catch (error) {
    next(error);
  }
};

const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: { approvalStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            approvalStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sendSuccess(res, { doctors }, 'Pending doctors fetched');
  } catch (error) {
    next(error);
  }
};

const approveClinic = async (req, res, next) => {
  try {
    const { clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const oldStatus = clinic.approvalStatus;

    const updated = await prisma.$transaction(async (tx) => {
      const verifiedClinic = await tx.clinic.update({
        where: { id: clinicId },
        data: {
          approvalStatus: 'VERIFIED',
          isVerified: true,
          isActive: true,
          rejectionReason: null,
          changesRequestedReason: null,
          suspendedReason: null,
          verifiedAt: new Date(),
          verifiedById: req.user.id,
        },
      });

      await tx.user.update({
        where: { id: clinic.ownerId },
        data: { approvalStatus: 'VERIFIED', rejectionReason: null },
      });

      await tx.clinicVerificationLog.create({
        data: {
          clinicId,
          adminId: req.user.id,
          oldStatus,
          newStatus: 'VERIFIED',
          remark: 'Clinic approved',
        },
      });

      return { clinic: verifiedClinic };
    });

    // Send email notification (fire-and-forget)
    if (clinic.owner?.email) {
      sendClinicApprovedEmail(clinic.owner.email, clinic.owner.name, clinic.name).catch(() => { });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_APPROVED',
      entityType: 'Clinic',
      entityId: clinicId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Clinic approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectClinic = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { rejectionReason, reason } = req.body;
    const rejectReason = rejectionReason || reason || 'Clinic registration rejected';

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const oldStatus = clinic.approvalStatus;

    const updated = await prisma.$transaction(async (tx) => {
      const rejectedClinic = await tx.clinic.update({
        where: { id: clinicId },
        data: {
          approvalStatus: 'REJECTED',
          isVerified: false,
          isActive: false,
          rejectionReason: rejectReason,
          rejectedById: req.user.id,
          rejectedAt: new Date(),
          verifiedAt: null,
          verifiedById: null,
        },
      });

      await tx.user.update({
        where: { id: clinic.ownerId },
        data: { approvalStatus: 'REJECTED', rejectionReason: rejectReason },
      });

      await tx.clinicVerificationLog.create({
        data: {
          clinicId,
          adminId: req.user.id,
          oldStatus,
          newStatus: 'REJECTED',
          remark: rejectReason,
        },
      });

      return { clinic: rejectedClinic };
    });

    if (clinic.owner?.email) {
      sendClinicRejectedEmail(clinic.owner.email, clinic.owner.name, clinic.name, rejectReason).catch(() => { });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_REJECTED',
      entityType: 'Clinic',
      entityId: clinicId,
      metadata: { reason: rejectReason },
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Clinic rejected successfully');
  } catch (error) {
    next(error);
  }
};

const approveDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const profile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!profile) return sendError(res, 'Doctor profile not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const doctorProfile = await tx.doctorProfile.update({
        where: { id: doctorId },
        data: {
          approvalStatus: 'VERIFIED',
          marketplaceVisible: true,
        },
      });

      const user = await tx.user.update({
        where: { id: profile.userId },
        data: {
          approvalStatus: 'VERIFIED',
          rejectionReason: null,
        },
      });

      return { doctorProfile, user };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_APPROVED',
      entityType: 'DoctorProfile',
      entityId: doctorId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Doctor approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { rejectionReason } = req.body;

    const profile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!profile) return sendError(res, 'Doctor profile not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const doctorProfile = await tx.doctorProfile.update({
        where: { id: doctorId },
        data: {
          approvalStatus: 'REJECTED',
          marketplaceVisible: false,
        },
      });

      const user = await tx.user.update({
        where: { id: profile.userId },
        data: {
          approvalStatus: 'REJECTED',
          rejectionReason: rejectionReason || 'Doctor profile rejected',
        },
      });

      return { doctorProfile, user };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_REJECTED',
      entityType: 'DoctorProfile',
      entityId: doctorId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Doctor rejected successfully');
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
          role: true,
          isActive: true,
          approvalStatus: true,
          rejectionReason: true,
          createdAt: true,
          adminProfile: {
            select: { level: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Users fetched',
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user.id) {
      return sendError(res, 'Cannot modify your own account status', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
      },
    });

    if (!targetUser) {
      return sendError(res, 'User not found', 404);
    }

    if (isAdminUser(targetUser)) {
      if (!isRootAdmin(req.user)) {
        return sendError(res, 'Only the root admin can change admin account status', 403);
      }
      if (targetUser.adminProfile.level === ROOT_ADMIN_LEVEL) {
        return sendError(res, 'Root admin account status cannot be changed', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, mobile: true, role: true, isActive: true },
    });

    await createAuditLog({
      userId: req.user.id,
      action: isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      entityType: 'User',
      entityId: id,
      metadata: { targetRole: targetUser.role, targetAdminLevel: targetUser.adminProfile?.level || null },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user }, `User ${isActive ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    next(error);
  }
};

const createAdminAccount = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, level } = req.body;

    if (!MANAGEABLE_ADMIN_LEVELS.includes(level)) {
      return sendError(res, 'Invalid admin level', 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ mobile: phone }, { email: email.toLowerCase() }],
      },
    });

    if (existing) {
      return sendError(res, 'User with this phone or email already exists', 409);
    }

    const admin = await prisma.user.create({
      data: {
        name: fullName,
        mobile: phone,
        email: email.toLowerCase(),
        role: 'SUPER_ADMIN',
        approvalStatus: 'VERIFIED',
        isPhoneVerified: true,
        isEmailVerified: true,
        isActive: true,
        passwordHash: await hashPassword(password),
        adminProfile: {
          create: {
            level,
            createdById: req.user.id,
          },
        },
      },
      include: {
        adminProfile: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_CREATED',
      entityType: 'User',
      entityId: admin.id,
      metadata: { level },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
          isActive: admin.isActive,
          approvalStatus: admin.approvalStatus,
          adminProfile: { level: admin.adminProfile.level },
        },
      },
      'Admin account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return sendError(res, 'You cannot delete your own account', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { adminProfile: true },
    });

    if (!targetUser) {
      return sendError(res, 'User not found', 404);
    }

    // Prevent deleting any admin (use deleteAdminAccount for that)
    if (isAdminUser(targetUser)) {
      return sendError(res, 'Use the admin delete endpoint to remove admin accounts', 400);
    }

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      userId: req.user.id,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      metadata: {
        deletedName: targetUser.name,
        deletedMobile: targetUser.mobile,
        deletedRole: targetUser.role,
      },
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const deleteAdminAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return sendError(res, 'You cannot delete your own root admin account', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
      },
    });

    if (!targetUser || !isAdminUser(targetUser)) {
      return sendError(res, 'Admin account not found', 404);
    }

    if (targetUser.adminProfile.level === ROOT_ADMIN_LEVEL) {
      return sendError(res, 'Root admin account cannot be deleted', 400);
    }

    await prisma.user.delete({
      where: { id },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_DELETED',
      entityType: 'User',
      entityId: id,
      metadata: {
        deletedEmail: targetUser.email,
        deletedLevel: targetUser.adminProfile.level,
      },
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'Admin account deleted successfully');
  } catch (error) {
    next(error);
  }
};

const resetDatabase = async (req, res, next) => {
  try {
    const triggeredBy = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    };

    const adminPasswordHash = await hashPassword('Nkabu18$');

    const adminUser = await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany();
      await tx.fcmToken.deleteMany();
      await tx.payment.deleteMany();
      await tx.queueItem.deleteMany();
      await tx.queue.deleteMany();
      await tx.appointment.deleteMany();
      await tx.doctorClinic.deleteMany();
      await tx.clinicStaff.deleteMany();
      await tx.receptionistProfile.deleteMany();
      await tx.adminProfile.deleteMany();
      await tx.doctorProfile.deleteMany();
      await tx.patientProfile.deleteMany();
      await tx.passwordResetToken.deleteMany();
      await tx.refreshToken.deleteMany();
      await tx.session.deleteMany();
      await tx.otpVerification.deleteMany();
      await tx.clinic.deleteMany();
      await tx.user.deleteMany();

      const createdAdmin = await tx.user.create({
        data: {
          name: 'Sahil Naik',
          mobile: '+919000000001',
          email: 'sahilnaik1515@gmail.com',
          role: 'SUPER_ADMIN',
          approvalStatus: 'VERIFIED',
          passwordHash: adminPasswordHash,
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          adminProfile: {
            create: {
              level: ROOT_ADMIN_LEVEL,
            },
          },
        },
        include: {
          adminProfile: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: createdAdmin.id,
          action: 'DATABASE_RESET',
          entityType: 'System',
          metadata: {
            triggeredBy,
            resetAt: new Date().toISOString(),
            bootstrapAdminEmail: createdAdmin.email,
          },
          ipAddress: req.ip,
        },
      });

      return createdAdmin;
    });

    return sendSuccess(
      res,
      {
        admin: {
          email: adminUser.email,
          password: 'Nkabu18$',
        },
      },
      'Database reset successfully. Sign in again with the recreated admin account.'
    );
  } catch (error) {
    next(error);
  }
};

const requestClinicChanges = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { reason } = req.body;
    if (!reason?.trim()) return sendError(res, 'Reason is required for requesting changes', 400);

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const oldStatus = clinic.approvalStatus;

    await prisma.$transaction(async (tx) => {
      await tx.clinic.update({
        where: { id: clinicId },
        data: {
          approvalStatus: 'CHANGES_REQUIRED',
          isVerified: false,
          isActive: false,
          changesRequestedReason: reason.trim(),
        },
      });

      await tx.user.update({
        where: { id: clinic.ownerId },
        data: { approvalStatus: 'CHANGES_REQUIRED' },
      });

      await tx.clinicVerificationLog.create({
        data: {
          clinicId,
          adminId: req.user.id,
          oldStatus,
          newStatus: 'CHANGES_REQUIRED',
          remark: reason.trim(),
        },
      });
    });

    if (clinic.owner?.email) {
      sendClinicChangesRequestedEmail(clinic.owner.email, clinic.owner.name, clinic.name, reason.trim()).catch(() => { });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_CHANGES_REQUESTED',
      entityType: 'Clinic',
      entityId: clinicId,
      metadata: { reason },
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'Changes requested successfully');
  } catch (error) {
    next(error);
  }
};

const suspendClinic = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { reason } = req.body;
    if (!reason?.trim()) return sendError(res, 'Reason is required for suspending a clinic', 400);

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!clinic) return sendError(res, 'Clinic not found', 404);

    const oldStatus = clinic.approvalStatus;

    await prisma.$transaction(async (tx) => {
      await tx.clinic.update({
        where: { id: clinicId },
        data: {
          approvalStatus: 'SUSPENDED',
          isVerified: false,
          isActive: false,
          suspendedReason: reason.trim(),
        },
      });

      await tx.user.update({
        where: { id: clinic.ownerId },
        data: { approvalStatus: 'SUSPENDED', suspendedReason: reason.trim() },
      });

      // Cancel all active/pending appointments at this clinic
      // so patients are not waiting for bookings that will never be served
      await tx.appointment.updateMany({
        where: {
          clinicId,
          status: { in: ['BOOKED', 'PENDING_PAYMENT', 'CHECKED_IN', 'IN_QUEUE', 'CALLED'] },
        },
        data: { status: 'CANCELLED' },
      });

      // Cancel corresponding queue items
      await tx.queueItem.updateMany({
        where: {
          queue: { clinicId },
          status: { in: ['WAITING', 'CALLED'] },
        },
        data: { status: 'CANCELLED' },
      });

      // Close any active queues
      await tx.queue.updateMany({
        where: { clinicId, status: { in: ['ACTIVE', 'PAUSED'] } },
        data: { status: 'CLOSED' },
      });

      await tx.clinicVerificationLog.create({
        data: {
          clinicId,
          adminId: req.user.id,
          oldStatus,
          newStatus: 'SUSPENDED',
          remark: reason.trim(),
        },
      });
    });

    if (clinic.owner?.email) {
      sendClinicSuspendedEmail(clinic.owner.email, clinic.owner.name, clinic.name, reason.trim()).catch(() => { });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CLINIC_SUSPENDED',
      entityType: 'Clinic',
      entityId: clinicId,
      metadata: { reason },
      ipAddress: req.ip,
    });

    return sendSuccess(res, {}, 'Clinic suspended successfully');
  } catch (error) {
    next(error);
  }
};

// ── GET /admin/all-clinics/stats — per-status counts matching current filters ─
// Uses the same search/state/city/clinicType filters as the table list,
// so stats cards and table always use the same dataset.
const getClinicStats = async (req, res, next) => {
  try {
    const { state, city, clinicType, search } = req.query;

    // Build base where (same logic as getAllClinics, WITHOUT status filter)
    const baseWhere = {};
    if (state) baseWhere.state = { contains: state, mode: 'insensitive' };
    if (city) baseWhere.city = { contains: city, mode: 'insensitive' };
    if (clinicType) baseWhere.clinicType = { contains: clinicType, mode: 'insensitive' };
    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { clinicRegistrationNumber: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { owner: { mobile: { contains: search } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const STATUSES = ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'CHANGES_REQUIRED', 'SUSPENDED'];

    const counts = await Promise.all(
      STATUSES.map((s) =>
        prisma.clinic.count({ where: { ...baseWhere, approvalStatus: s } })
      )
    );

    const stats = Object.fromEntries(STATUSES.map((s, i) => [s, counts[i]]));
    stats.TOTAL = counts.reduce((sum, n) => sum + n, 0);

    return res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

// ── GET /admin/all-clinics — paginated, filtered clinic list for admin ────────
const getAllClinics = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      status, state, city, clinicType, search,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.approvalStatus = status;
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (clinicType) where.clinicType = { contains: clinicType, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { clinicRegistrationNumber: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { owner: { mobile: { contains: search } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          clinicType: true,
          city: true,
          state: true,
          approvalStatus: true,
          submittedAt: true,
          createdAt: true,
          owner: {
            select: { id: true, name: true, mobile: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clinic.count({ where }),
    ]);

    return res.json({
      success: true,
      data: { clinics },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /admin/all-clinics/:clinicId — full clinic detail for admin review ────
const getClinicDetail = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        owner: {
          select: {
            id: true, name: true, mobile: true, email: true,
            isPhoneVerified: true, isEmailVerified: true,
            approvalStatus: true, createdAt: true,
          },
        },
        verificationLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!clinic) return sendError(res, 'Clinic not found', 404);
    return sendSuccess(res, { clinic });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getPendingClinics,
  getPendingDoctors,
  approveClinic,
  rejectClinic,
  approveDoctor,
  rejectDoctor,
  getUsers,
  updateUserStatus,
  createAdminAccount,
  deleteAdminAccount,
  deleteUser,
  resetDatabase,
  requestClinicChanges,
  suspendClinic,
  getAllClinics,
  getClinicStats,
  getClinicDetail,
};
