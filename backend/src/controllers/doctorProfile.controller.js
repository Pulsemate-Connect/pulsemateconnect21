/**
 * Doctor Profile Controller
 * Handles doctor profile views with proper role-based data separation
 * 
 * Security: Different endpoints return different data based on who's requesting:
 * - Doctor's own profile (full access)
 * - Patient viewing doctor (public data only)
 * - Clinic viewing their doctor (clinic-specific data)
 * - Admin verification (complete data)
 */

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../config/logger');

/**
 * Calculate profile completion percentage
 */
const calculateProfileCompletion = (profile) => {
  const requiredFields = [
    'fullLegalName',
    'dateOfBirth',
    'gender',
    'medicalSystem',
    'qualification',
    'specialization',
    'medicalRegistrationNumber',
    'registrationAuthority',
    'registrationYear',
    'experienceYears',
  ];

  const optionalFields = [
    'profilePhotoUrl',
    'bio',
    'languagesKnown',
    'areasOfExpertise',
    'consultationFee',
  ];

  let completed = 0;
  let total = requiredFields.length + optionalFields.length;

  // Check required fields (count as completed)
  requiredFields.forEach(field => {
    if (profile[field]) completed++;
  });

  // Check optional fields
  optionalFields.forEach(field => {
    if (field === 'languagesKnown' || field === 'areasOfExpertise') {
      if (profile[field] && profile[field].length > 0) completed++;
    } else {
      if (profile[field]) completed++;
    }
  });

  // Check documents (2 minimum required)
  if (profile.certificates && Array.isArray(profile.certificates) && profile.certificates.length >= 2) {
    completed++;
  }
  total++;

  return Math.round((completed / total) * 100);
};

/**
 * GET /api/doctor/me/profile - Doctor's own complete profile
 * Returns all personal, professional, and verification data
 * 
 * Security: Only accessible by the doctor themselves
 */
const getMyCompleteProfile = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: doctorUserId },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        approvalStatus: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: {
          include: {
            doctorClinics: {
              where: { isActive: true },
              include: {
                clinic: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                    pincode: true,
                    phone: true,
                  },
                },
              },
            },
            invitation: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                acceptedAt: true,
                verifiedAt: true,
                rejectionReason: true,
                clinic: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    const profile = user.doctorProfile;

    // Calculate profile completion
    const profileCompletion = calculateProfileCompletion(profile);

    // Parse documents for status display
    const documents = profile.certificates || [];
    const documentStatus = {
      degreeCertificate: documents.some(d => d.documentType === 'DEGREE_CERTIFICATE') ? 'Submitted' : 'Not Submitted',
      registrationCertificate: documents.some(d => d.documentType === 'REGISTRATION_CERTIFICATE') ? 'Submitted' : 'Not Submitted',
      experienceCertificate: documents.some(d => d.documentType === 'EXPERIENCE_CERTIFICATE') ? 'Submitted' : 'Not Submitted',
      idProof: documents.some(d => d.documentType === 'ID_PROOF') ? 'Submitted' : 'Not Submitted',
    };

    // Mask sensitive contact info
    const maskedMobile = user.mobile ? `******${user.mobile.slice(-4)}` : null;
    const maskedEmail = user.email ? `${user.email.charAt(0)}*****@${user.email.split('@')[1]}` : null;

    // Prepare complete profile response
    const completeProfile = {
      // User information
      userId: user.id,
      name: user.name,
      mobile: user.mobile, // Full mobile for doctor
      maskedMobile,
      email: user.email, // Full email for doctor
      maskedEmail,
      role: user.role,
      approvalStatus: user.approvalStatus,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,

      // Profile information (ALL fields visible to doctor)
      profileId: profile.id,
      fullLegalName: profile.fullLegalName,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      profilePhotoUrl: profile.profilePhotoUrl,
      
      // Professional information (including sensitive registration data)
      medicalSystem: profile.medicalSystem,
      qualification: profile.qualification,
      specialization: profile.specialization,
      medicalRegistrationNumber: profile.medicalRegistrationNumber, // ✅ VISIBLE TO DOCTOR
      registrationAuthority: profile.registrationAuthority,
      registrationYear: profile.registrationYear,
      experienceYears: profile.experienceYears,
      
      // Optional professional details
      bio: profile.bio,
      languagesKnown: profile.languagesKnown,
      areasOfExpertise: profile.areasOfExpertise,
      consultationFee: profile.consultationFee,
      avgConsultationMins: profile.avgConsultationMins,
      onlineAvailable: profile.onlineAvailable,
      offlineAvailable: profile.offlineAvailable,
      
      // Verification status
      profileStatus: profile.profileStatus,
      verificationStatus: profile.verificationStatus,
      approvalStatus: profile.approvalStatus,
      profileSubmittedAt: profile.profileSubmittedAt,
      
      // Documents (doctor can see their own documents)
      documents: documents,
      documentStatus: documentStatus,
      
      // Clinic associations
      clinics: profile.doctorClinics.map(dc => ({
        id: dc.id,
        clinicId: dc.clinicId,
        clinicName: dc.clinic.name,
        clinicAddress: dc.clinic.address,
        clinicCity: dc.clinic.city,
        clinicState: dc.clinic.state,
        inviteStatus: dc.inviteStatus,
        isActive: dc.isActive,
        joinedAt: dc.joinedAt,
        consultationFee: dc.consultationFee,
      })),
      
      // Invitation details
      invitation: profile.invitation,
      
      // Completion metrics
      profileCompletion: profileCompletion,
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: profile.updatedAt,
      lastEditedAt: profile.lastEditedAt,
    };

    logger.info(`[DoctorProfile] Complete profile fetched for doctor ${profile.id}`);

    return sendSuccess(res, completeProfile, 'Complete profile fetched successfully');
  } catch (error) {
    logger.error('[DoctorProfile] Get complete profile error:', error);
    next(error);
  }
};

/**
 * GET /api/doctors/:id/public-profile - Public doctor profile for patients
 * Returns ONLY public-safe information
 * 
 * Security: NO sensitive data - registration number, documents, DOB, contact info, etc.
 */
const getPublicDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params; // Doctor profile ID or user ID

    // Try to find by profile ID first, then by user ID
    let doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            approvalStatus: true,
          },
        },
        doctorClinics: {
          where: { isActive: true },
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
    });

    // If not found by profile ID, try user ID
    if (!doctorProfile) {
      doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: id },
        include: {
          user: {
            select: {
              name: true,
              approvalStatus: true,
            },
          },
          doctorClinics: {
            where: { isActive: true },
            include: {
              clinic: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
        },
      });
    }

    if (!doctorProfile) {
      return sendError(res, 'Doctor not found', 404);
    }

    // Only show verified doctors to patients
    if (doctorProfile.verificationStatus !== 'VERIFIED') {
      return sendError(res, 'Doctor profile not available', 404);
    }

    // Prepare PUBLIC profile (minimal necessary information)
    const publicProfile = {
      // Basic identification (safe to show)
      profileId: doctorProfile.id,
      displayName: doctorProfile.fullLegalName || doctorProfile.user.name,
      profilePhotoUrl: doctorProfile.profilePhotoUrl,
      
      // Professional information (public)
      qualification: doctorProfile.qualification,
      specialization: doctorProfile.specialization,
      medicalSystem: doctorProfile.medicalSystem,
      experienceYears: doctorProfile.experienceYears,
      
      // Verification badge
      isVerified: doctorProfile.verificationStatus === 'VERIFIED',
      verificationBadge: '✓ PulseMate Verified',
      
      // Optional professional details (only if provided)
      ...(doctorProfile.bio && { bio: doctorProfile.bio }),
      ...(doctorProfile.languagesKnown && doctorProfile.languagesKnown.length > 0 && { 
        languagesKnown: doctorProfile.languagesKnown 
      }),
      ...(doctorProfile.areasOfExpertise && doctorProfile.areasOfExpertise.length > 0 && { 
        areasOfExpertise: doctorProfile.areasOfExpertise 
      }),
      
      // Consultation information (controlled by business rules)
      ...(doctorProfile.consultationFee && { consultationFee: doctorProfile.consultationFee }),
      avgConsultationMins: doctorProfile.avgConsultationMins,
      
      // Availability types
      availableConsultationTypes: [
        ...(doctorProfile.onlineAvailable ? ['Online'] : []),
        ...(doctorProfile.offlineAvailable ? ['In-Clinic'] : []),
      ],
      
      // Clinic associations (public info only)
      clinics: doctorProfile.doctorClinics.map(dc => ({
        clinicId: dc.clinicId,
        clinicName: dc.clinic.name,
        clinicCity: dc.clinic.city,
        clinicState: dc.clinic.state,
        clinicAddress: dc.clinic.address,
      })),
      
      // ❌ NO SENSITIVE DATA:
      // - NO medicalRegistrationNumber
      // - NO registrationAuthority
      // - NO registrationYear
      // - NO dateOfBirth
      // - NO mobile number
      // - NO email address
      // - NO documents/certificates
      // - NO document status
      // - NO verification details
      // - NO admin notes
      // - NO rejection reasons
      // - NO internal IDs
    };

    logger.info(`[DoctorProfile] Public profile fetched for doctor ${doctorProfile.id}`);

    return sendSuccess(res, publicProfile, 'Public profile fetched successfully');
  } catch (error) {
    logger.error('[DoctorProfile] Get public profile error:', error);
    next(error);
  }
};

/**
 * GET /api/clinic/doctors/:id/profile - Clinic's view of their doctor
 * Returns professional info + clinic-specific data
 * 
 * Security: Only accessible by clinic owners for their own doctors
 */
const getClinicDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params; // Doctor profile ID
    const clinicOwnerId = req.user.id;

    // Get clinic owner's clinics
    const ownerClinics = await prisma.clinic.findMany({
      where: { ownerId: clinicOwnerId },
      select: { id: true },
    });

    const clinicIds = ownerClinics.map(c => c.id);

    // Get doctor profile with clinic association
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            mobile: true,
            email: true,
            approvalStatus: true,
          },
        },
        doctorClinics: {
          where: {
            clinicId: { in: clinicIds },
            isActive: true,
          },
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor not found', 404);
    }

    // Verify clinic has access to this doctor
    if (doctorProfile.doctorClinics.length === 0) {
      return sendError(res, 'You do not have access to this doctor', 403);
    }

    // Prepare clinic-specific profile
    const clinicDoctorProfile = {
      // Basic information
      profileId: doctorProfile.id,
      userId: doctorProfile.userId,
      fullLegalName: doctorProfile.fullLegalName,
      displayName: doctorProfile.fullLegalName || doctorProfile.user.name,
      profilePhotoUrl: doctorProfile.profilePhotoUrl,
      
      // Contact (for clinic communication)
      mobile: doctorProfile.user.mobile,
      email: doctorProfile.user.email,
      
      // Professional information
      qualification: doctorProfile.qualification,
      specialization: doctorProfile.specialization,
      medicalSystem: doctorProfile.medicalSystem,
      experienceYears: doctorProfile.experienceYears,
      
      // Verification status
      verificationStatus: doctorProfile.verificationStatus,
      approvalStatus: doctorProfile.approvalStatus,
      isVerified: doctorProfile.verificationStatus === 'VERIFIED',
      
      // Optional professional details
      bio: doctorProfile.bio,
      languagesKnown: doctorProfile.languagesKnown,
      areasOfExpertise: doctorProfile.areasOfExpertise,
      
      // Consultation settings
      consultationFee: doctorProfile.consultationFee,
      avgConsultationMins: doctorProfile.avgConsultationMins,
      onlineAvailable: doctorProfile.onlineAvailable,
      offlineAvailable: doctorProfile.offlineAvailable,
      
      // Clinic-specific associations
      clinicAssociations: doctorProfile.doctorClinics.map(dc => ({
        associationId: dc.id,
        clinicId: dc.clinicId,
        clinicName: dc.clinic.name,
        inviteStatus: dc.inviteStatus,
        isActive: dc.isActive,
        joinedAt: dc.joinedAt,
        consultationFee: dc.consultationFee || doctorProfile.consultationFee,
        avgConsultationMins: dc.avgConsultationMins,
      })),
      
      // ❌ NO SENSITIVE VERIFICATION DATA:
      // - NO medicalRegistrationNumber (clinic doesn't need this)
      // - NO registrationAuthority
      // - NO certificates/documents
      // - NO admin verification notes
    };

    logger.info(`[DoctorProfile] Clinic profile fetched for doctor ${doctorProfile.id} by clinic owner ${clinicOwnerId}`);

    return sendSuccess(res, clinicDoctorProfile, 'Clinic doctor profile fetched successfully');
  } catch (error) {
    logger.error('[DoctorProfile] Get clinic doctor profile error:', error);
    next(error);
  }
};

/**
 * GET /api/admin/doctors/:id/verification - Admin verification view
 * Returns COMPLETE data including documents, verification history
 * 
 * Security: Only accessible by SUPER_ADMIN
 */
const getAdminVerificationProfile = async (req, res, next) => {
  try {
    const { id } = req.params; // Doctor profile ID or invitation ID

    // Try to find by profile ID first
    let doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        doctorClinics: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                ownerId: true,
              },
            },
          },
        },
        invitation: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            verifiedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            rejectedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        verificationDocuments: true,
        verificationLogs: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // If not found by profile ID, try invitation ID
    if (!doctorProfile) {
      const invitation = await prisma.doctorInvitation.findUnique({
        where: { id },
        include: {
          doctorProfile: {
            include: {
              user: true,
              doctorClinics: {
                include: {
                  clinic: true,
                },
              },
              verificationDocuments: true,
              verificationLogs: {
                include: {
                  admin: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          clinic: true,
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          verifiedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          rejectedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (invitation && invitation.doctorProfile) {
        doctorProfile = invitation.doctorProfile;
        doctorProfile.invitation = invitation;
      }
    }

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    // Calculate profile completion
    const profileCompletion = calculateProfileCompletion(doctorProfile);

    // Prepare COMPLETE admin verification view
    const adminVerificationProfile = {
      // Complete user information
      user: doctorProfile.user,
      
      // Complete profile information (ALL fields)
      profile: {
        id: doctorProfile.id,
        userId: doctorProfile.userId,
        fullLegalName: doctorProfile.fullLegalName,
        dateOfBirth: doctorProfile.dateOfBirth,
        gender: doctorProfile.gender,
        profilePhotoUrl: doctorProfile.profilePhotoUrl,
        
        // Complete professional information
        medicalSystem: doctorProfile.medicalSystem,
        qualification: doctorProfile.qualification,
        specialization: doctorProfile.specialization,
        medicalRegistrationNumber: doctorProfile.medicalRegistrationNumber, // ✅ Admin can see
        registrationAuthority: doctorProfile.registrationAuthority,
        registrationYear: doctorProfile.registrationYear,
        experienceYears: doctorProfile.experienceYears,
        
        // Optional fields
        bio: doctorProfile.bio,
        languagesKnown: doctorProfile.languagesKnown,
        areasOfExpertise: doctorProfile.areasOfExpertise,
        consultationFee: doctorProfile.consultationFee,
        avgConsultationMins: doctorProfile.avgConsultationMins,
        onlineAvailable: doctorProfile.onlineAvailable,
        offlineAvailable: doctorProfile.offlineAvailable,
        
        // Status fields
        profileStatus: doctorProfile.profileStatus,
        verificationStatus: doctorProfile.verificationStatus,
        approvalStatus: doctorProfile.approvalStatus,
        profileCompletionPercentage: profileCompletion,
        
        // Timestamps
        profileSubmittedAt: doctorProfile.profileSubmittedAt,
        lastEditedAt: doctorProfile.lastEditedAt,
        createdAt: doctorProfile.createdAt,
        updatedAt: doctorProfile.updatedAt,
      },
      
      // Complete documents (admin needs to verify these)
      documents: doctorProfile.certificates,
      verificationDocuments: doctorProfile.verificationDocuments,
      
      // Invitation details
      invitation: doctorProfile.invitation,
      
      // Clinic associations
      clinicAssociations: doctorProfile.doctorClinics,
      
      // Verification history
      verificationLogs: doctorProfile.verificationLogs,
      
      // Metrics
      profileCompletion: profileCompletion,
    };

    logger.info(`[DoctorProfile] Admin verification profile fetched for doctor ${doctorProfile.id} by admin ${req.user.id}`);

    return sendSuccess(res, adminVerificationProfile, 'Admin verification profile fetched successfully');
  } catch (error) {
    logger.error('[DoctorProfile] Get admin verification profile error:', error);
    next(error);
  }
};

/**
 * PATCH /api/doctor/me/profile - Update doctor's own profile
 * Allows doctors to update permitted fields
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const updateData = req.body;

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctorProfile) {
      return sendError(res, 'Doctor profile not found', 404);
    }

    // Fields that doctor can update after verification
    const editableFields = [
      'bio',
      'consultationFee',
      'languagesKnown',
      'areasOfExpertise',
      'profilePhotoUrl',
      'avgConsultationMins',
      'onlineAvailable',
      'offlineAvailable',
    ];

    // Filter allowed fields
    const filteredData = {};
    for (const field of editableFields) {
      if (updateData[field] !== undefined) {
        // Validate bio length
        if (field === 'bio' && updateData[field] && updateData[field].length > 500) {
          return sendError(res, 'Bio cannot exceed 500 characters', 400);
        }
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return sendError(res, 'No valid fields to update', 400);
    }

    // Update profile
    const updatedProfile = await prisma.doctorProfile.update({
      where: { id: doctorProfile.id },
      data: {
        ...filteredData,
        lastEditedAt: new Date(),
      },
    });

    // Recalculate completion
    const profileCompletion = calculateProfileCompletion(updatedProfile);

    logger.info(`[DoctorProfile] Profile updated for doctor ${doctorProfile.id}`);

    return sendSuccess(res, { 
      profile: updatedProfile,
      profileCompletion 
    }, 'Profile updated successfully');
  } catch (error) {
    logger.error('[DoctorProfile] Update profile error:', error);
    next(error);
  }
};

module.exports = {
  getMyCompleteProfile,
  getPublicDoctorProfile,
  getClinicDoctorProfile,
  getAdminVerificationProfile,
  updateMyProfile,
  calculateProfileCompletion,
};
