const prisma = require('../config/database');
const logger = require('../config/logger');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { hashPassword } = require('../utils/hash');
const { revokeAllUserTokens } = require('../services/token.service');
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
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const [
      totalUsers,
      patientCount,
      doctorCount,
      clinicOwnerCount,
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
      totalAppointments,
      appointmentsToday,
      completedToday,
      todayRevenue,
      recentBookings,
      recentVerifiedClinics,
      pendingDeletionRequests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.user.count({ where: { role: 'CLINIC_OWNER' } }),
      prisma.clinic.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.clinic.count({ where: { approvalStatus: 'UNDER_REVIEW' } }),
      prisma.doctorProfile.count({ where: { approvalStatus: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      prisma.clinic.count({ where: { approvalStatus: 'VERIFIED' } }),
      prisma.doctorProfile.count({ where: { approvalStatus: 'VERIFIED' } }),
      prisma.clinic.count({ where: { approvalStatus: 'REJECTED' } }),
      prisma.clinic.count({ where: { approvalStatus: 'CHANGES_REQUIRED' } }),
      prisma.clinic.count({ where: { approvalStatus: 'SUSPENDED' } }),
      prisma.payment.count({ where: { amount: 0, status: 'PAID' } }),
      prisma.payment.count({ where: { amount: { gt: 0 }, status: 'PAID' } }),
      prisma.payment.aggregate({
        where: { amount: { gt: 0 }, status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.appointment.count({ where: { status: { notIn: ['PENDING_PAYMENT'] } } }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: todayStart, lte: todayEnd }, status: { notIn: ['PENDING_PAYMENT', 'CANCELLED'] } },
      }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      // 10 most recent confirmed bookings
      prisma.payment.findMany({
        where: { status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 10,
        include: {
          patient: { select: { id: true, name: true, mobile: true } },
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              appointmentType: true,
              clinic: { select: { id: true, name: true } },
              doctor: { include: { user: { select: { name: true } } } },
            },
          },
        },
      }),
      // 5 most recently verified clinics
      prisma.clinic.findMany({
        where: { approvalStatus: 'VERIFIED' },
        orderBy: { verifiedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, city: true, state: true, verifiedAt: true, clinicType: true },
      }),
      prisma.user.count({ where: { deletionRequestedAt: { not: null } } }),
    ]);

    const totalPaidPlusFreeBkg = freeBookings + paidBookings;
    const conversionRate = totalPaidPlusFreeBkg > 0
      ? Math.round((paidBookings / totalPaidPlusFreeBkg) * 100)
      : 0;

    return sendSuccess(res, {
      stats: {
        totalUsers,
        patientCount,
        doctorCount,
        clinicOwnerCount,
        pendingClinics,
        underReviewClinics,
        pendingDoctors,
        verifiedClinics,
        verifiedDoctors,
        rejectedClinics,
        changesRequiredClinics,
        suspendedClinics,
        totalAppointments,
        appointmentsToday,
        completedToday,
        pendingDeletionRequests,
      },
      bookingMetrics: {
        freeBookings,
        paidBookings,
        totalBookings: totalPaidPlusFreeBkg,
        conversionRate,
        totalRevenue: totalRevenue._sum.amount || 0,
        todayRevenue: todayRevenue._sum.amount || 0,
        revenuePerPatient: paidBookings > 0
          ? Math.round(((totalRevenue._sum.amount || 0) / paidBookings) * 100) / 100
          : 0,
      },
      recentBookings: recentBookings.map((p) => ({
        paymentId: p.id,
        patientName: p.patient?.name || 'Unknown',
        patientMobile: p.patient?.mobile || '',
        amount: p.amount,
        isFree: p.amount === 0,
        method: p.method,
        paidAt: p.paidAt,
        clinicName: p.appointment?.clinic?.name || '—',
        doctorName: p.appointment?.doctor?.user?.name || '—',
        appointmentDate: p.appointment?.appointmentDate,
        appointmentType: p.appointment?.appointmentType,
      })),
      recentVerifiedClinics,
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
    // Get doctors with PENDING verification status from DoctorProfile
    const doctorProfiles = await prisma.doctorProfile.findMany({
      where: { 
        verificationStatus: 'PENDING',
        profileStatus: 'COMPLETE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            approvalStatus: true,
            createdAt: true,
          },
        },
        invitation: {
          select: {
            id: true,
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
            invitedBy: {
              select: {
                name: true,
              },
            },
            createdAt: true,
          },
        },
      },
      orderBy: { profileSubmittedAt: 'asc' },
    });

    // Transform to match expected format
    const doctors = doctorProfiles.map(profile => ({
      id: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      mobile: profile.user.mobile,
      approvalStatus: profile.user.approvalStatus,
      createdAt: profile.user.createdAt,
      doctorProfile: {
        id: profile.id,
        fullLegalName: profile.fullLegalName,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        profilePhotoUrl: profile.profilePhotoUrl,
        medicalSystem: profile.medicalSystem,
        qualification: profile.qualification,
        specialization: profile.specialization,
        medicalRegistrationNumber: profile.medicalRegistrationNumber,
        registrationAuthority: profile.registrationAuthority,
        registrationYear: profile.registrationYear,
        experienceYears: profile.experienceYears,
        languagesKnown: profile.languagesKnown,
        bio: profile.bio,
        consultationFee: profile.consultationFee,
        areasOfExpertise: profile.areasOfExpertise,
        certificates: profile.certificates,
        profileStatus: profile.profileStatus,
        verificationStatus: profile.verificationStatus,
        profileSubmittedAt: profile.profileSubmittedAt,
        profileCompletionPercentage: profile.profileCompletionPercentage,
      },
      invitation: profile.invitation,
    }));

    return sendSuccess(res, { doctors }, 'Pending doctors fetched');
  } catch (error) {
    logger.error('[GetPendingDoctors] Error:', error);
    next(error);
  }
};

const getAllDoctors = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      specialization, 
      search 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      profileStatus: 'COMPLETE' // Only show doctors with complete profiles
    };

    // Filter by verification status
    if (status && status !== 'ALL') {
      if (status === 'SUSPENDED') {
        // For suspended, check user's approvalStatus
        where.user = {
          approvalStatus: 'SUSPENDED'
        };
      } else {
        where.verificationStatus = status;
      }
    }

    // Filter by specialization
    if (specialization && specialization !== 'ALL') {
      where.specialization = specialization;
    }

    // Search filter
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { fullLegalName: { contains: searchTerm, mode: 'insensitive' } },
        { medicalRegistrationNumber: { contains: searchTerm, mode: 'insensitive' } },
        { specialization: { contains: searchTerm, mode: 'insensitive' } },
        { user: { 
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { mobile: { contains: searchTerm } },
          ]
        }},
      ];
    }

    const [doctorProfiles, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              approvalStatus: true,
              createdAt: true,
            },
          },
          invitation: {
            select: {
              id: true,
              clinic: {
                select: {
                  id: true,
                  name: true,
                },
              },
              invitedBy: {
                select: {
                  name: true,
                },
              },
              createdAt: true,
            },
          },
        },
        orderBy: { profileSubmittedAt: 'desc' },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    // Transform to match expected format
    const doctors = doctorProfiles.map(profile => ({
      id: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      mobile: profile.user.mobile,
      approvalStatus: profile.user.approvalStatus,
      createdAt: profile.user.createdAt,
      doctorProfile: {
        id: profile.id,
        fullLegalName: profile.fullLegalName,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        profilePhotoUrl: profile.profilePhotoUrl,
        medicalSystem: profile.medicalSystem,
        qualification: profile.qualification,
        specialization: profile.specialization,
        medicalRegistrationNumber: profile.medicalRegistrationNumber,
        registrationAuthority: profile.registrationAuthority,
        registrationYear: profile.registrationYear,
        experienceYears: profile.experienceYears,
        languagesKnown: profile.languagesKnown,
        bio: profile.bio,
        consultationFee: profile.consultationFee,
        areasOfExpertise: profile.areasOfExpertise,
        certificates: profile.certificates,
        profileStatus: profile.profileStatus,
        verificationStatus: profile.verificationStatus,
        profileSubmittedAt: profile.profileSubmittedAt,
        profileCompletionPercentage: profile.profileCompletionPercentage,
      },
      invitation: profile.invitation,
    }));

    return res.status(200).json({
      success: true,
      message: 'Doctors fetched',
      data: {
        doctors,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('[GetAllDoctors] Error:', error);
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

    // ✅ FIX: Revoke all refresh tokens for the clinic owner
    // This forces them to re-login and get a fresh JWT with updated approvalStatus: 'VERIFIED'
    await revokeAllUserTokens(clinic.ownerId);
    logger.info(`[Admin] Revoked all tokens for clinic owner ${clinic.ownerId} after approval`);

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

    // ✅ FIX: Revoke all refresh tokens for the clinic owner
    // This forces them to re-login and blocks access (rejected users can't login)
    await revokeAllUserTokens(clinic.ownerId);
    logger.info(`[Admin] Revoked all tokens for clinic owner ${clinic.ownerId} after rejection`);

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
    const { doctorId } = req.params; // This is the user ID

    const user = await prisma.user.findUnique({ 
      where: { id: doctorId },
      include: {
        doctorProfile: true,
      },
    });
    
    if (!user || !user.doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const profile = user.doctorProfile;
    
    // ✅ FIX: Load invitation separately using invitationId
    let invitation = null;
    if (profile.invitationId) {
      invitation = await prisma.doctorInvitation.findUnique({
        where: { id: profile.invitationId },
        include: {
          clinic: true,
        },
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update doctor profile verification status
      const doctorProfile = await tx.doctorProfile.update({
        where: { id: profile.id },
        data: {
          verificationStatus: 'VERIFIED',
          profileStatus: 'COMPLETE',
          marketplaceVisible: true,
          approvalStatus: 'VERIFIED', // Add this for backward compatibility
        },
      });

      // Update user approval status
      const updatedUser = await tx.user.update({
        where: { id: doctorId },
        data: {
          approvalStatus: 'VERIFIED',
          rejectionReason: null,
        },
      });

      // ✅ CREATE CLINIC-DOCTOR RELATIONSHIP
      let clinicDoctor = null;
      if (invitation && invitation.clinicId) {
        // Check if relationship already exists
        const existing = await tx.doctorClinic.findUnique({
          where: {
            doctorId_clinicId: {
              doctorId: profile.id,
              clinicId: invitation.clinicId,
            },
          },
        });

        if (existing) {
          // Update existing relationship
          clinicDoctor = await tx.doctorClinic.update({
            where: { id: existing.id },
            data: {
              inviteStatus: 'ACCEPTED',
              isActive: true,
              adminVerifiedAt: new Date(),
              adminVerifiedById: req.user.id,
            },
          });
          logger.info(`[ApproveDoctor] ✅ Updated existing clinic-doctor relationship: Doctor ${profile.id} → Clinic ${invitation.clinicId}`);
        } else {
          // Create new relationship
          clinicDoctor = await tx.doctorClinic.create({
            data: {
              doctorId: profile.id,
              clinicId: invitation.clinicId,
              inviteStatus: 'ACCEPTED',
              roleAtClinic: invitation.specialization || 'CONSULTANT',
              consultationFee: profile.consultationFee,
              isActive: true,
              joinedAt: new Date(),
              adminVerifiedAt: new Date(),
              adminVerifiedById: req.user.id,
            },
          });
          logger.info(`[ApproveDoctor] ✅ Created new clinic-doctor relationship: Doctor ${profile.id} → Clinic ${invitation.clinicId}`);
        }
      } else {
        logger.warn(`[ApproveDoctor] ⚠️  No invitation found for doctor ${profile.id}, skipping clinic link`);
      }

      // Update invitation status if exists
      if (invitation) {
        await tx.doctorInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            verifiedById: req.user.id,
          },
        });

        // Create verification log
        await tx.doctorVerificationLog.create({
          data: {
            doctorProfileId: profile.id,
            adminId: req.user.id,
            oldStatus: 'PENDING',
            newStatus: 'VERIFIED',
            action: 'APPROVED',
            adminNotes: 'Doctor profile approved by admin',
          },
        });
      }

      return { doctorProfile, user: updatedUser, clinicDoctor };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_APPROVED',
      entityType: 'DoctorProfile',
      entityId: profile.id,
      metadata: { 
        doctorUserId: doctorId,
        clinicId: invitation?.clinicId,
        clinicName: invitation?.clinic?.name,
      },
      ipAddress: req.ip,
    });

    logger.info(`[ApproveDoctor] ✅ Doctor ${user.name} (${doctorId}) approved by admin ${req.user.id} for clinic ${invitation?.clinic?.name}`);

    return sendSuccess(res, updated, 'Doctor approved successfully and added to clinic');
  } catch (error) {
    logger.error('[ApproveDoctor] Error:', error);
    next(error);
  }
};

const rejectDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params; // This is the user ID
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return sendError(res, 'Rejection reason is required', 400);
    }

    const user = await prisma.user.findUnique({ 
      where: { id: doctorId },
      include: {
        doctorProfile: {
          include: {
            invitation: true,
          },
        },
      },
    });
    
    if (!user || !user.doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const profile = user.doctorProfile;

    const updated = await prisma.$transaction(async (tx) => {
      // Update doctor profile verification status
      const doctorProfile = await tx.doctorProfile.update({
        where: { id: profile.id },
        data: {
          verificationStatus: 'REJECTED',
          marketplaceVisible: false,
        },
      });

      // Update user approval status
      const updatedUser = await tx.user.update({
        where: { id: doctorId },
        data: {
          approvalStatus: 'REJECTED',
          rejectionReason: rejectionReason.trim(),
        },
      });

      // Update invitation status if exists
      if (profile.invitationId) {
        await tx.doctorInvitation.update({
          where: { id: profile.invitationId },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectedById: req.user.id,
            rejectionReason: rejectionReason.trim(),
          },
        });

        // Create verification log
        await tx.doctorVerificationLog.create({
          data: {
            doctorProfileId: profile.id,
            adminId: req.user.id,
            oldStatus: 'PENDING',
            newStatus: 'REJECTED',
            action: 'REJECTED',
            reason: rejectionReason.trim(),
            adminNotes: `Rejected: ${rejectionReason.trim()}`,
          },
        });
      }

      return { doctorProfile, user: updatedUser };
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_REJECTED',
      entityType: 'DoctorProfile',
      entityId: profile.id,
      metadata: { 
        doctorUserId: doctorId,
        rejectionReason: rejectionReason.trim(),
      },
      ipAddress: req.ip,
    });

    logger.info(`[RejectDoctor] Doctor ${user.name} (${doctorId}) rejected by admin ${req.user.id}`);

    return sendSuccess(res, updated, 'Doctor rejected successfully');
  } catch (error) {
    logger.error('[RejectDoctor] Error:', error);
    next(error);
  }
};

/**
 * GET /admin/users/:id — Get detailed user profile for admin
 */
const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
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
        lastLoginAt: true,
        freeBookingUsed: true,
        authProvider: true,
        adminProfile: { select: { level: true } },
        patientProfile: {
          select: {
            age: true, dob: true, gender: true,
            city: true, state: true,
            bloodGroup: true, emergencyContact: true,
            allergies: true, existingDiseases: true,
            profileCompleted: true,
          },
        },
        doctorProfile: {
          select: {
            specialization: true, qualification: true,
            experienceYears: true, consultationFee: true,
            avgConsultationMins: true, approvalStatus: true,
            verificationStatus: true, bio: true,
          },
        },
        ownedClinics: {
          select: { id: true, name: true, city: true, approvalStatus: true },
          take: 5,
        },
        appointments: {
          select: { id: true, status: true, appointmentDate: true },
          orderBy: { appointmentDate: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            appointments: true,
            payments: true,
          },
        },
      },
    });

    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user });
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
    // ✅ SECURITY FIX: Double-check environment (defense in depth)
    if (process.env.NODE_ENV === 'production') {
      logger.error('[ResetDatabase] ❌ BLOCKED: Attempted database reset in PRODUCTION');
      await createAuditLog({
        userId: req.user.id,
        action: 'DATABASE_RESET_BLOCKED',
        entityType: 'System',
        metadata: { 
          reason: 'Production environment protection',
          attemptedBy: req.user.email 
        },
        ipAddress: req.ip,
      });
      return sendError(res, 'Database reset is disabled in production environment', 403);
    }

    const triggeredBy = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    };

    // ✅ Fetch BOTH admin accounts before reset
    const [rootAdmin, superAdmin] = await Promise.all([
      prisma.user.findUnique({
        where: { email: process.env.ROOT_ADMIN_EMAIL || 'shubham27052002@gmail.com' },
        select: { id: true, email: true, passwordHash: true },
      }),
      prisma.user.findUnique({
        where: { email: 'sahilnaik1515@gmail.com' },
        select: { id: true, email: true, passwordHash: true },
      }),
    ]);

    // Preserve passwords or use environment variables
    const rootPasswordHash = rootAdmin?.passwordHash || await hashPassword(
      process.env.ROOT_ADMIN_PASSWORD || process.env.ADMIN_1_PASSWORD || 'ChangeMe123!'
    );
    const superPasswordHash = superAdmin?.passwordHash || await hashPassword(
      process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_2_PASSWORD || 'ChangeMe456!'
    );

    const admins = await prisma.$transaction(async (tx) => {
      // ✅ FIX: Use TRUNCATE CASCADE with ALL tables (except _prisma_migrations)
      await tx.$executeRaw`
        TRUNCATE TABLE 
          "admin_profiles",
          "appointments",
          "audit_logs",
          "broadcast_notifications",
          "clinic_doctors",
          "clinic_holidays",
          "clinic_owner_profiles",
          "clinic_sessions",
          "clinic_staff",
          "clinic_verification_logs",
          "clinics",
          "dashboard_widget_preferences",
          "doctor_availability",
          "doctor_invitations",
          "doctor_profiles",
          "doctor_verification_documents",
          "doctor_verification_logs",
          "email_verifications",
          "fcm_tokens",
          "firebase_phone_verifications",
          "notification_campaigns",
          "notification_delivery_log",
          "notification_preferences",
          "notification_reads",
          "notification_templates",
          "notifications",
          "otp_attempts",
          "otp_verifications",
          "password_reset_tokens",
          "patient_profiles",
          "payments",
          "prescriptions",
          "queue_items",
          "queues",
          "receptionist_profiles",
          "refresh_tokens",
          "reminder_sent",
          "scheduled_notifications",
          "sessions",
          "user_notifications",
          "users"
        CASCADE
      `;

      // Create ROOT admin
      const createdRootAdmin = await tx.user.create({
        data: {
          name: process.env.ROOT_ADMIN_NAME || 'Shubham',
          mobile: process.env.ROOT_ADMIN_MOBILE || '+919876543210',
          email: process.env.ROOT_ADMIN_EMAIL || 'shubham27052002@gmail.com',
          role: 'SUPER_ADMIN',
          approvalStatus: 'VERIFIED',
          passwordHash: rootPasswordHash,
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          adminProfile: {
            create: {
              level: 'ROOT',
            },
          },
        },
        include: {
          adminProfile: true,
        },
      });

      // Create SUPER_ADMIN (Sahil)
      const createdSuperAdmin = await tx.user.create({
        data: {
          name: 'Sahil Naik',
          mobile: '+917022818878',
          email: 'sahilnaik1515@gmail.com',
          role: 'SUPER_ADMIN',
          approvalStatus: 'VERIFIED',
          passwordHash: superPasswordHash,
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          adminProfile: {
            create: {
              level: 'SUPER_ADMIN',
              createdById: createdRootAdmin.id,
            },
          },
        },
        include: {
          adminProfile: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: createdRootAdmin.id,
          action: 'DATABASE_RESET',
          entityType: 'System',
          metadata: {
            triggeredBy,
            resetAt: new Date().toISOString(),
            adminsCreated: [
              { email: createdRootAdmin.email, level: 'ROOT' },
              { email: createdSuperAdmin.email, level: 'SUPER_ADMIN' },
            ],
          },
          ipAddress: req.ip,
        },
      });

      return { root: createdRootAdmin, super: createdSuperAdmin };
    }, {
      maxWait: 30000, // 30 seconds
      timeout: 60000, // 60 seconds
    });

    logger.info('[ResetDatabase] ✅ Database reset successfully');
    logger.info(`[ResetDatabase] ✅ ROOT admin: ${admins.root.email}`);
    logger.info(`[ResetDatabase] ✅ SUPER_ADMIN: ${admins.super.email}`);

    return sendSuccess(
      res,
      {
        admins: [
          {
            email: admins.root.email,
            level: 'ROOT',
          },
          {
            email: admins.super.email,
            level: 'SUPER_ADMIN',
          },
        ],
      },
      'Database reset successfully. Both admin accounts preserved with same passwords.'
    );
  } catch (error) {
    logger.error('[ResetDatabase] Error:', error);
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

    const counts = await prisma.clinic.groupBy({
      by: ['approvalStatus'],
      where: baseWhere,
      _count: { _all: true },
    });

    const stats = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const row of counts) {
      if (stats.hasOwnProperty(row.approvalStatus)) {
        stats[row.approvalStatus] = row._count._all;
      }
    }
    stats.TOTAL = Object.values(stats).reduce((sum, n) => sum + n, 0);

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
            id: true, 
            name: true, 
            mobile: true, 
            email: true,
            isPhoneVerified: true, 
            isEmailVerified: true,
            approvalStatus: true, 
            createdAt: true,
            clinicOnboardingData: true, // Include the 4-step registration form data
          },
        },
        verificationLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!clinic) return sendError(res, 'Clinic not found', 404);
    
    // Attach clinicOnboardingData to clinic object for easier access in frontend
    const clinicWithOnboarding = {
      ...clinic,
      clinicOnboardingData: clinic.owner?.clinicOnboardingData || null,
    };
    
    return sendSuccess(res, { clinic: clinicWithOnboarding });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getPendingClinics,
  getPendingDoctors,
  getAllDoctors,
  approveClinic,
  rejectClinic,
  approveDoctor,
  rejectDoctor,
  getUsers,
  getUserDetail,
  updateUserStatus,
  createAdminAccount,
  deleteAdminAccount,
  resetDatabase,
  requestClinicChanges,
  suspendClinic,
  getAllClinics,
  getClinicStats,
  getClinicDetail,
  getDeletionRequests,
  cancelDeletionRequest,
};

// ── Account Deletion Queue ────────────────────────────────────────────────────

/**
 * GET /api/admin/deletion-requests
 * Lists users pending deletion, sorted by request date.
 */
async function getDeletionRequests(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: { deletionRequestedAt: { not: null } },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        isActive: true,
        deletionRequestedAt: true,
        createdAt: true,
      },
      orderBy: { deletionRequestedAt: 'asc' },
    });

    const now = new Date();
    const withDaysLeft = users.map((u) => {
      const purgeDate = new Date(u.deletionRequestedAt);
      purgeDate.setDate(purgeDate.getDate() + 10);
      const daysLeft = Math.max(0, Math.ceil((purgeDate - now) / (1000 * 60 * 60 * 24)));
      return { ...u, purgeDate, daysLeft };
    });

    return sendSuccess(res, { users: withDaysLeft, total: withDaysLeft.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/deletion-requests/:id/cancel
 * Admin can cancel a pending deletion (restore account).
 */
async function cancelDeletionRequest(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { deletionRequestedAt: null, isActive: true },
    });
    await createAuditLog({ userId: req.user.id, action: 'CANCEL_DELETION_REQUEST', entityType: 'User', entityId: id });
    return sendSuccess(res, {}, 'Deletion request cancelled and account restored.');
  } catch (err) {
    next(err);
  }
}
