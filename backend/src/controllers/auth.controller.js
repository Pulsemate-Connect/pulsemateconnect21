const prisma = require('../config/database');
const { sendOtp, verifyOtp } = require('../services/otp.service');
const {
  createSessionTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  revokeAllRefreshTokens,
} = require('../services/token.service');
const { hashPassword, verifyPassword } = require('../utils/hash');
const { sendSuccess, sendError } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');
const { REFRESH_COOKIE_NAME, clearRefreshTokenCookie, setRefreshTokenCookie } = require('../utils/cookies');
const { normalizeMobileNumber } = require('../utils/mobile');
const {
  createPasswordResetToken,
  validatePasswordResetToken,
  markTokenUsed,
} = require('../services/password-reset.service');
const {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendSuperAdminPasswordChangedSecurityEmail,
  sendSuperAdminResetEmail,
} = require('../services/email.service');
const {
  sendEmailVerification,
  verifyEmailVerificationToken,
} = require('../services/email-verification.service');
const { verifyFirebaseToken } = require('../config/firebase');
const firebasePhoneVerificationRepo = require('../repositories/firebase-phone-verification.repository');

const buildFileUrl = (req, file) => {
  // When Cloudinary is active, req.file.path contains the full Cloudinary URL.
  // When using local disk, req.file.filename is the stored filename.
  if (file.path && /^https?:\/\//i.test(file.path)) {
    // Cloudinary URL — return as-is
    return file.path;
  }
  // Local disk storage — build absolute URL
  const origin = process.env.BACKEND_URL ||
    `${req.protocol}://${req.get('host')}`;
  return `${origin}/uploads/clinic-owner/${file.filename}`;
};

const baseUserInclude = {
  adminProfile: true,
  doctorProfile: true,
  receptionistProfile: {
    include: {
      assignedClinic: true,
    },
  },
  ownedClinics: true,
  patientProfile: true,
};

const toAuthUser = (user) => ({
  id: user.id,
  name: user.name,
  phone: user.mobile,
  email: user.email,
  role: user.role,
  status: user.approvalStatus,
  isPhoneVerified: user.isPhoneVerified,
  isEmailVerified: user.isEmailVerified,
  rejectionReason: user.rejectionReason,
  suspendedReason: user.suspendedReason,
  doctorProfile: user.doctorProfile || null,
  receptionistProfile: user.receptionistProfile || null,
  ownedClinics: user.ownedClinics || [],
  adminLevel: user.adminProfile?.level || null,
  clinicStaff: user.clinicStaff || [],
});

const getSessionMetadata = (req) => ({
  ipAddress: req.ip,
  deviceInfo: req.headers['x-device-info'] || req.headers['user-agent'] || null,
});

const issueAuthTokens = async (res, user, req) => {
  const tokens = await createSessionTokens(user, user.role, getSessionMetadata(req));
  setRefreshTokenCookie(res, tokens.refreshToken, 7 * 24 * 60 * 60 * 1000);
  return tokens;
};

const buildMePayload = async (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      ...baseUserInclude,
      clinicStaff: {
        where: { isActive: true },
        include: { clinic: true },
      },
      refreshTokens: {
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

const resolveIdentifier = (identifier) => {
  const value = identifier.trim();
  if (value.includes('@')) {
    return { email: value.toLowerCase(), mobile: undefined };
  }
  return { email: undefined, mobile: normalizeMobileNumber(value) };
};

const getPasswordUserByIdentifier = async (identifier) => {
  const lookup = resolveIdentifier(identifier);
  return prisma.user.findFirst({
    where: {
      OR: [
        lookup.email ? { email: lookup.email } : undefined,
        lookup.mobile ? { mobile: lookup.mobile } : undefined,
      ].filter(Boolean),
    },
    include: baseUserInclude,
  });
};

const blockIfPasswordLoginDisallowed = (user, res) => {
  if (!user || !user.passwordHash || user.role === 'PATIENT') {
    return sendError(res, 'Invalid credentials', 401);
  }
  if (user.approvalStatus === 'SUSPENDED') {
    return sendError(res, user.suspendedReason || 'Account is suspended', 403);
  }
  if (user.approvalStatus === 'REJECTED') {
    return sendError(res, user.rejectionReason || 'Account has been rejected', 403);
  }
  if (!user.isActive) {
    return sendError(res, 'Account is disabled', 403);
  }
  return null;
};

const patientSendOtpHandler = async (req, res, next) => {
  try {
    const result = await sendOtp(req.body.phone || req.body.mobile, 'LOGIN');
    return sendSuccess(res, result, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/patient/firebase-phone-login
 *
 * Patient login using Firebase Phone Auth (supports both web & mobile app).
 * Frontend (web/app) performs OTP via Firebase, sends the Firebase ID token here.
 * Backend verifies the token, extracts phone, creates/logs in patient.
 */
const patientFirebasePhoneLoginHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken, name } = req.body;

    // ── 1. Verify Firebase token ───────────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract phone from trusted token (never from body) ─────────────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number in Firebase token. Use Phone Auth provider.', 400);
    }
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    // ── 3. Find or create patient ─────────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { mobile },
      include: baseUserInclude,
    });

    let isNewUser = false;
    if (!user) {
      // Create new patient
      user = await prisma.user.create({
        data: {
          mobile,
          name: name || null,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          firebaseUid: decoded.uid,
          authProvider: 'FIREBASE_PHONE',
          patientProfile: { create: {} },
        },
        include: baseUserInclude,
      });
      isNewUser = true;
    } else if (user.role !== 'PATIENT') {
      return sendError(res, 'This phone belongs to a staff account. Use staff login.', 403);
    } else {
      // Existing patient - update login time and name if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
          firebaseUid: decoded.uid,
          authProvider: 'FIREBASE_PHONE',
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
    }

    // ── 4. Issue JWT tokens ───────────────────────────────────────────────
    const tokens = await issueAuthTokens(res, user, req);
    
    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'PATIENT_REGISTERED_FIREBASE' : 'PATIENT_LOGIN_FIREBASE',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        // Include refreshToken in body so mobile clients (React Native / Expo)
        // can store it in SecureStore for silent token rotation.
        // Web clients ignore this and rely on the httpOnly cookie set above.
        refreshToken: tokens.refreshToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Patient account created successfully' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/clinic-owner/verify-firebase-phone
 *
 * Verifies the clinic owner's phone number using Firebase Phone Auth.
 * The frontend performs OTP via Firebase, then sends the Firebase ID token here.
 * Backend verifies the token, extracts the phone number (never from request body),
 * and creates a short-lived server-side verification record for use at registration.
 *
 * Replaces the old custom OTP send + verify flow for clinic owners.
 */
const clinicOwnerVerifyFirebasePhoneHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken } = req.body;

    // ── 1. Verify Firebase token ───────────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured on this server. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract phone from trusted token (never from body) ─────────────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number found in Firebase token. Use Phone Auth provider.', 400);
    }
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    // ── 3. Ensure phone is not already registered ─────────────────────────
    const existing = await prisma.user.findUnique({
      where: { mobile },
      select: { id: true },
    });
    if (existing) {
      return sendError(res, 'A user with this phone number already exists', 409);
    }

    // ── 4. Invalidate any previous pending records, create new one ────────
    const EXPIRY_MINUTES = 120; // 2 hours — clinic registration is a multi-step form that takes time
    await firebasePhoneVerificationRepo.invalidateOutstanding(mobile, 'CLINIC_OWNER_REGISTER');
    await firebasePhoneVerificationRepo.create({
      mobile,
      firebaseUid: decoded.uid,
      purpose: 'CLINIC_OWNER_REGISTER',
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
    });

    return sendSuccess(
      res,
      { ownerMobileVerified: true, mobile },
      'Phone number verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

// ── Backward-compat shims — old custom OTP routes kept alive during migration ─
const clinicOwnerSendOtpHandler = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const existing = await prisma.user.findUnique({ where: { mobile: phone }, select: { id: true } });
    if (existing) return sendError(res, 'A user with this phone number already exists', 409);
    const result = await sendOtp(phone, 'PHONE_VERIFY');
    return sendSuccess(res, result, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

const clinicOwnerVerifyOtpHandler = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const existing = await prisma.user.findUnique({ where: { mobile: phone }, select: { id: true } });
    if (existing) return sendError(res, 'A user with this phone number already exists', 409);
    await verifyOtp(phone, otp, 'PHONE_VERIFY');
    return sendSuccess(res, { ownerMobileVerified: true }, 'Phone number verified successfully');
  } catch (error) {
    next(error);
  }
};

const clinicOwnerSendEmailOtpHandler = async (req, res, next) => {
  try {
    const { email, ownerName } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return sendError(res, 'A user with this email already exists', 409);
    }

    const result = await sendEmailVerification(normalizedEmail, ownerName);

    // In development, return the OTP in the response for easy testing
    const responseData = process.env.NODE_ENV !== 'production' && result.otp
      ? { devOtp: result.otp }
      : {};

    return sendSuccess(res, responseData, 'Verification code sent successfully');
  } catch (error) {
    next(error);
  }
};

const clinicOwnerVerifyEmailOtpHandler = async (req, res, next) => {
  try {
    // Normalize email to lowercase — verification record was stored lowercase
    const rawEmail = req.body.email || req.query.email;
    const email = rawEmail ? rawEmail.toLowerCase() : undefined;
    const otp = req.body.otp || req.query.token;

    const verified = (email && otp)
      ? await verifyEmailVerificationToken(email, otp)
      : await verifyEmailVerificationToken(otp);

    return sendSuccess(
      res,
      {
        email: verified.email,
        ownerEmailVerified: true,
        emailVerifiedAt: verified.verifiedAt || new Date(),
      },
      'Email verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

const patientVerifyOtpHandler = async (req, res, next) => {
  try {
    const { phone, mobile, otp, name } = req.body;
    const mobileNumber = phone || mobile;
    await verifyOtp(mobileNumber, otp, 'LOGIN');

    let user = await prisma.user.findUnique({
      where: { mobile: mobileNumber },
      include: baseUserInclude,
    });

    let isNewUser = false;
    if (!user) {
      user = await prisma.user.create({
        data: {
          mobile: mobileNumber,
          name: name || null,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          patientProfile: { create: {} },
        },
        include: baseUserInclude,
      });
      isNewUser = true;
    } else if (user.role !== 'PATIENT') {
      return sendError(res, 'This phone number belongs to a staff account. Use staff login.', 403);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
    }

    const tokens = await issueAuthTokens(res, user, req);
    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'PATIENT_REGISTERED' : 'PATIENT_LOGIN_OTP',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Patient account created successfully' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

const registerClinicOwnerHandler = async (req, res, next) => {
  try {
    const {
      ownerName,
      phone,
      email,
      password,
      clinicName,
      clinicType,
      clinicTypeOther,
      clinicDescription,
      clinicAddress,
      landmark,
      city,
      state,
      district,
      pincode,
      googleMapsLocation,
      latitude,
      longitude,
      clinicPhone,
      emergencyContactNumber,
      alternateEmail,
      consultationModes,
      weeklySchedule,
      averageConsultationTimeMinutes,
      appointmentSlotMinutes,
      dailyPatientCapacity,
      gstNumber,
      panNumber,
      openingHours,
      specialties,
      specialtyOther,
      doctorCount,
      clinicLogoUrl,
      clinicCoverImageUrl,
      facilities,
      languagesSpoken,
      paymentMethods,
      insuranceSupported,
      clinicRegistrationNumber,
      licenseDocumentUrl,
      medicalEstablishmentCertificateUrl,
      gstCertificateUrl,
      panCardUrl,
      additionalDocuments,
      ownerMobileVerified,
      ownerEmailVerified,
    } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) {
      return sendError(res, 'User with this phone or email already exists', 409);
    }

    const duplicateClinicSignals = await prisma.clinic.findFirst({
      where: {
        OR: [
          clinicRegistrationNumber ? { clinicRegistrationNumber } : undefined,
          gstNumber ? { gstNumber } : undefined,
          panNumber ? { panNumber } : undefined,
          clinicPhone ? { phone: clinicPhone } : undefined,
        ].filter(Boolean),
      },
      select: {
        id: true,
        name: true,
        clinicRegistrationNumber: true,
        gstNumber: true,
        panNumber: true,
        phone: true,
      },
    });

    if (duplicateClinicSignals) {
      return sendError(
        res,
        `A clinic application already exists with matching registration or contact details (${duplicateClinicSignals.name}).`,
        409
      );
    }

    const verifiedPhoneRecord = await firebasePhoneVerificationRepo.findLatestValid(phone, 'CLINIC_OWNER_REGISTER');

    if (!ownerMobileVerified || !verifiedPhoneRecord) {
      return sendError(res, 'Owner mobile verification via Firebase is required before submitting the clinic application', 400);
    }

    const verifiedEmailRecord = await prisma.emailVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        purpose: 'CLINIC_OWNER_REGISTER',
        verifiedAt: { not: null },
        isUsed: true,
      },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!ownerEmailVerified || !verifiedEmailRecord) {
      return sendError(res, 'Owner email verification is required before submitting the clinic application', 400);
    }

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: ownerName,
          mobile: phone,
          email: email.toLowerCase(),
          role: 'CLINIC_OWNER',
          approvalStatus: 'PENDING',
          passwordHash: await hashPassword(password),
          isPhoneVerified: true,
          isEmailVerified: true,
          firebaseUid: verifiedPhoneRecord.firebaseUid,
          authProvider: 'FIREBASE_PHONE',
        },
      });

      const clinic = await tx.clinic.create({
        data: {
          ownerId: user.id,
          name: clinicName,
          clinicType: clinicType || null,
          address: clinicAddress,
          landmark: landmark || null,
          city,
          state,
          pincode,
          phone: clinicPhone,
          googleMapsLocation: googleMapsLocation || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          emergencyContactNumber: emergencyContactNumber || null,
          alternateEmail: alternateEmail || null,
          consultationModes: consultationModes || [],
          weeklySchedule: weeklySchedule || [],
          avgConsultationMinutes: averageConsultationTimeMinutes ?? null,
          appointmentSlotMinutes: appointmentSlotMinutes ?? null,
          dailyPatientCapacity: dailyPatientCapacity ?? null,
          gstNumber: gstNumber || null,
          panNumber: panNumber || null,
          openingHours,
          description: clinicDescription || null,
          specialties,
          doctorCount: doctorCount ?? null,
          clinicLogoUrl: clinicLogoUrl || null,
          clinicCoverImageUrl: clinicCoverImageUrl || null,
          facilities: facilities || [],
          languagesSpoken: languagesSpoken || [],
          paymentMethods: paymentMethods || [],
          insuranceSupported: insuranceSupported || [],
          clinicRegistrationNumber,
          clinicLicenseDocument: licenseDocumentUrl,
          licenseDocumentUrl,
          medicalEstablishmentCertificateUrl: medicalEstablishmentCertificateUrl || null,
          gstCertificateUrl: gstCertificateUrl || null,
          panCardUrl: panCardUrl || null,
          additionalDocuments: additionalDocuments || [],
          ownerMobileVerified: true,
          ownerEmailVerified: true,
          mobileOtpVerifiedAt: verifiedPhoneRecord.verifiedAt || new Date(),
          emailVerifiedAt: verifiedEmailRecord.verifiedAt || new Date(),
          approvalStatus: 'PENDING',
          isVerified: false,
          submittedAt: new Date(),
        },
      });

      if (clinicTypeOther || specialtyOther) {
        await tx.$executeRaw`
          UPDATE clinics
          SET
            "clinicTypeOther" = ${clinicTypeOther || null},
            "specialtyOther" = ${specialtyOther || null}
          WHERE id = ${clinic.id}
        `;
      }

      if (district) {
        await tx.$executeRaw`
          UPDATE clinics
          SET "district" = ${district}
          WHERE id = ${clinic.id}
        `;
      }

      await tx.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      return { user, clinic };
    });

    await createAuditLog({
      userId: created.user.id,
      action: 'CLINIC_OWNER_REGISTERED',
      entityType: 'Clinic',
      entityId: created.clinic.id,
      ipAddress: req.ip,
    });

    // Mark the Firebase phone verification record as consumed
    await firebasePhoneVerificationRepo.markUsed(verifiedPhoneRecord.id);

    return sendSuccess(
      res,
      {
        user: {
          id: created.user.id,
          role: created.user.role,
          status: created.user.approvalStatus,
        },
        clinic: created.clinic,
        nextSteps: [
          'Your clinic application has been submitted for review.',
          'PulseMate admin will verify the clinic details and documents.',
          'You can sign in after approval is completed.',
        ],
      },
      'Registration submitted. Awaiting super admin verification.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/doctor/verify-firebase-phone
 *
 * Verifies the doctor's phone number using Firebase Phone Auth.
 * Same pattern as clinic owner — frontend handles OTP, sends ID token here.
 * Backend verifies, extracts phone, creates a short-lived verification record.
 */
const doctorVerifyFirebasePhoneHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken } = req.body;

    // ── 1. Verify Firebase token ───────────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured on this server. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract phone from trusted token (never from body) ─────────────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number found in Firebase token. Use Phone Auth provider.', 400);
    }
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    // ── 3. Ensure phone is not already registered ─────────────────────────
    const existing = await prisma.user.findUnique({
      where: { mobile },
      select: { id: true },
    });
    if (existing) {
      return sendError(res, 'A user with this phone number already exists', 409);
    }

    // ── 4. Invalidate any previous pending records, create new one ────────
    const EXPIRY_MINUTES = 15;
    await firebasePhoneVerificationRepo.invalidateOutstanding(mobile, 'DOCTOR_REGISTER');
    await firebasePhoneVerificationRepo.create({
      mobile,
      firebaseUid: decoded.uid,
      purpose: 'DOCTOR_REGISTER',
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
    });

    return sendSuccess(
      res,
      { mobileVerified: true, mobile },
      'Phone number verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

const registerDoctorHandler = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      qualification,
      specialization,
      experience,
      medicalRegistrationNumber,
      documentUrl,
      consultationFee,
      onlineConsultationEnabled,
    } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) {
      return sendError(res, 'User with this phone or email already exists', 409);
    }

    // ── Require Firebase phone verification ───────────────────────────────
    const verifiedPhoneRecord = await firebasePhoneVerificationRepo.findLatestValid(phone, 'DOCTOR_REGISTER');
    if (!verifiedPhoneRecord) {
      return sendError(res, 'Mobile number verification via Firebase is required before registering', 400);
    }

    const doctor = await prisma.user.create({
      data: {
        name,
        mobile: phone,
        email: email.toLowerCase(),
        role: 'DOCTOR',
        approvalStatus: 'PENDING',
        passwordHash: await hashPassword(password),
        isPhoneVerified: true,
        firebaseUid: verifiedPhoneRecord.firebaseUid,
        authProvider: 'FIREBASE_PHONE',
        doctorProfile: {
          create: {
            approvalStatus: 'PENDING',
            qualification,
            specialization,
            experienceYears: experience,
            medicalRegistrationNumber,
            documentUrl,
            certificates: documentUrl ? [documentUrl] : [],
            consultationFee,
            onlineAvailable: onlineConsultationEnabled,
            offlineAvailable: true,
            marketplaceVisible: false,
          },
        },
      },
      include: baseUserInclude,
    });

    await createAuditLog({
      userId: doctor.id,
      action: 'DOCTOR_REGISTERED',
      entityType: 'User',
      entityId: doctor.id,
      ipAddress: req.ip,
    });

    // Mark the Firebase phone verification record as consumed
    await firebasePhoneVerificationRepo.markUsed(verifiedPhoneRecord.id);

    return sendSuccess(
      res,
      {
        user: toAuthUser(doctor),
      },
      'Doctor profile submitted. Awaiting verification.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const clinicOwnerUploadDocumentHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please choose a file to upload', 400);
    }

    return sendSuccess(
      res,
      {
        url: buildFileUrl(req, req.file),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      'Document uploaded successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

const loginHandler = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const user = await getPasswordUserByIdentifier(identifier);
    const blocked = blockIfPasswordLoginDisallowed(user, res);
    if (blocked) return blocked;

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return sendError(res, 'Invalid credentials', 401);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: baseUserInclude,
    });

    const tokens = await issueAuthTokens(res, updatedUser, req);
    await createAuditLog({
      userId: updatedUser.id,
      action: `LOGIN_${updatedUser.role}`,
      entityType: 'User',
      entityId: updatedUser.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      user: toAuthUser(updatedUser),
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const forgotPasswordHandler = async (req, res, next) => {
  try {
    const safeMessage = 'If an account exists with this email, password reset instructions have been sent.';
    const user = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: baseUserInclude,
    });

    if (!user) {
      return sendSuccess(res, {}, safeMessage);
    }

    if (
      user.role === 'PATIENT' ||
      user.approvalStatus === 'SUSPENDED' ||
      user.approvalStatus === 'REJECTED' ||
      (user.role === 'SUPER_ADMIN' && user.approvalStatus !== 'VERIFIED')
    ) {
      return sendSuccess(res, {}, safeMessage);
    }

    if (!['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST', 'SUPER_ADMIN'].includes(user.role)) {
      return sendSuccess(res, {}, safeMessage);
    }

    const { rawToken, purpose } = await createPasswordResetToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    if (user.role === 'SUPER_ADMIN') {
      await sendSuperAdminResetEmail(user.email, resetLink, user.name);
      await createAuditLog({
        userId: user.id,
        action: 'SUPER_ADMIN_PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { purpose },
        ipAddress: req.ip,
      });
    } else {
      await sendPasswordResetEmail(user.email, resetLink, user.name);
      await createAuditLog({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        metadata: { purpose },
        ipAddress: req.ip,
      });
    }

    return sendSuccess(
      res,
      process.env.NODE_ENV !== 'production' ? { resetToken: rawToken } : {},
      safeMessage
    );
  } catch (error) {
    next(error);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    let stored;
    try {
      stored = await validatePasswordResetToken(token);
    } catch (_) {
      return sendError(res, 'Reset link is invalid or expired.', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: stored.userId },
      include: baseUserInclude,
    });

    if (
      !existingUser ||
      existingUser.role === 'PATIENT' ||
      existingUser.approvalStatus === 'SUSPENDED' ||
      existingUser.approvalStatus === 'REJECTED'
    ) {
      return sendError(res, 'Reset link is invalid or expired.', 400);
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash: await hashPassword(newPassword) },
      include: baseUserInclude,
    });

    await markTokenUsed(stored.id);
    await revokeAllRefreshTokens(user.id);
    clearRefreshTokenCookie(res);

    await createAuditLog({
      userId: user.id,
      action: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN_PASSWORD_RESET_COMPLETED' : 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    await sendPasswordChangedEmail(user.email, user.name);
    if (user.role === 'SUPER_ADMIN') {
      await sendSuperAdminPasswordChangedSecurityEmail(user.email, user.name);
    }

    return sendSuccess(res, {}, 'Password reset successfully. Please login again.');
  } catch (error) {
    next(error);
  }
};

const verifyResetTokenHandler = async (req, res, next) => {
  try {
    const { token } = req.query;

    try {
      const stored = await validatePasswordResetToken(token);
      if (
        stored.user.role === 'PATIENT' ||
        stored.user.approvalStatus === 'SUSPENDED' ||
        stored.user.approvalStatus === 'REJECTED'
      ) {
        return res.status(400).json({ valid: false, message: 'Reset link is invalid or expired' });
      }
      return res.json({ valid: true });
    } catch (_) {
      return res.status(400).json({ valid: false, message: 'Reset link is invalid or expired' });
    }
  } catch (error) {
    next(error);
  }
};

const refreshTokenHandler = async (req, res, next) => {
  try {
    // Web clients send the refresh token via httpOnly cookie.
    // Mobile clients (React Native / Expo) cannot use httpOnly cookies, so
    // they send the refresh token in the request body as { refreshToken: '...' }.
    const rawRefreshToken =
      req.cookies?.[REFRESH_COOKIE_NAME] ||
      req.body?.refreshToken ||
      null;

    if (!rawRefreshToken) return sendError(res, 'Refresh token not found', 401);

    const refreshed = await rotateRefreshToken(rawRefreshToken, null, getSessionMetadata(req));

    // Set cookie for web clients (no-op on mobile — cookies are not persisted)
    setRefreshTokenCookie(res, refreshed.refreshToken, 7 * 24 * 60 * 60 * 1000);

    return sendSuccess(res, {
      accessToken: refreshed.accessToken,
      // Also return the new refresh token in the body so mobile can store it
      refreshToken: refreshed.refreshToken,
      user: toAuthUser(refreshed.user),
    }, 'Token refreshed');
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
};

const logoutHandler = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawRefreshToken) await revokeRefreshToken(rawRefreshToken);
    clearRefreshTokenCookie(res);
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const logoutAllHandler = async (req, res, next) => {
  try {
    await revokeAllUserTokens(req.user.id);
    clearRefreshTokenCookie(res);
    return sendSuccess(res, {}, 'Logged out from all devices');
  } catch (error) {
    next(error);
  }
};

const getMeHandler = async (req, res, next) => {
  try {
    const user = await buildMePayload(req.user.id);
    return sendSuccess(res, { user: toAuthUser(user), profile: user }, 'User profile fetched');
  } catch (error) {
    next(error);
  }
};

const createReceptionistHandler = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    const clinic = await prisma.clinic.findFirst({
      where: { ownerId: req.user.id, approvalStatus: 'VERIFIED' },
      orderBy: { createdAt: 'asc' },
    });

    if (!clinic) {
      return sendError(res, 'Verified clinic not found for this owner', 404);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) return sendError(res, 'User with this phone or email already exists', 409);

    const receptionist = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          mobile: phone,
          email: email.toLowerCase(),
          role: 'RECEPTIONIST',
          approvalStatus: 'VERIFIED',
          passwordHash: await hashPassword(password),
          isPhoneVerified: true,
          receptionistProfile: {
            create: {
              assignedClinicId: clinic.id,
              createdByOwnerId: req.user.id,
            },
          },
        },
        include: baseUserInclude,
      });

      await tx.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          role: 'RECEPTIONIST',
        },
      });

      return user;
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'RECEPTIONIST_CREATED',
      entityType: 'User',
      entityId: receptionist.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: toAuthUser(receptionist) }, 'Receptionist created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const createAdminHandler = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, level } = req.body;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: phone }, { email: email.toLowerCase() }] },
    });
    if (existing) return sendError(res, 'User with this phone or email already exists', 409);

    const admin = await prisma.user.create({
      data: {
        name: fullName,
        mobile: phone,
        email: email.toLowerCase(),
        role: 'SUPER_ADMIN',
        approvalStatus: 'VERIFIED',
        isPhoneVerified: true,
        isEmailVerified: true,
        passwordHash: await hashPassword(password),
        adminProfile: {
          create: {
            level,
            createdById: req.user.id,
          },
        },
      },
      include: baseUserInclude,
    });

    return sendSuccess(res, { user: toAuthUser(admin) }, 'Admin account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const lookupPincodeHandler = async (req, res, next) => {
  try {
    const pincode = String(req.params.pincode || '').replace(/\D/g, '').trim();
    if (pincode.length !== 6) {
      return sendError(res, 'Pincode must be 6 digits', 400);
    }

    const response = await fetch(`https://aniket-thapa.github.io/india-pincode-api/pincodes/${pincode}.json`);
    const data = await response.json();
    const offices = Array.isArray(data?.offices) ? data.offices : [];

    if (!offices.length) {
      return sendError(res, 'No location found for this pincode', 404);
    }

    const districts = [...new Set(offices.map((office) => office.district || data.district).filter(Boolean))];
    const cities = [...new Set(
      offices
        .map((office) => {
          const name = String(office.officeName || '').trim();
          // Strip suffix like "B.O", "S.O", "H.O" — keep only the locality name
          return name.split(/\s+/)[0] || name;
        })
        .filter(Boolean)
    )];
    const state = String(data.state || '').trim();

    return sendSuccess(
      res,
      {
        pincode,
        state,
        districts,
        cities,
      },
      'Pincode location fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/user/firebase-phone-login
 *
 * Patient-only Firebase Phone Auth login / register.
 *
 * Flow:
 *  1. Mobile app uses Firebase Phone Auth to send OTP and verify it.
 *  2. After confirmation, app gets a Firebase ID token and sends it here.
 *  3. Backend verifies the token using Firebase Admin SDK.
 *  4. Extracts the phone_number from the decoded token (trusted source).
 *  5. Normalizes the phone number to E.164 / +91XXXXXXXXXX format.
 *  6. Looks up the user by mobile number.
 *  7. If user exists → logs them in, updates lastLoginAt + firebaseUid.
 *  8. If user does not exist → creates a new PATIENT account.
 *  9. Returns our app JWT access token + user profile.
 *
 * Security notes:
 *  - Mobile number is NEVER taken directly from the request body.
 *    It is always extracted from the Firebase-verified token.
 *  - firebaseUid is stored and kept in sync for audit purposes.
 */
const firebasePhoneLoginHandler = async (req, res, next) => {
  try {
    const { firebaseIdToken, name } = req.body;

    // ── 1. Verify Firebase ID token ───────────────────────────────────────
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseIdToken);
    } catch (firebaseError) {
      // Distinguish configuration errors from bad tokens
      if (firebaseError.status === 503) {
        return sendError(res, 'Firebase Auth is not configured on this server. Contact support.', 503);
      }
      return sendError(res, 'Invalid or expired Firebase token. Please try again.', 401);
    }

    // ── 2. Extract & validate phone number from trusted Firebase token ────
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return sendError(res, 'No phone number found in Firebase token. Use Phone Auth provider.', 400);
    }

    // Normalize to E.164 (+91XXXXXXXXXX for Indian numbers)
    const mobile = normalizeMobileNumber(rawPhone);
    if (!mobile || !/^\+[1-9]\d{9,14}$/.test(mobile)) {
      return sendError(res, 'Invalid phone number format in Firebase token.', 400);
    }

    const firebaseUid = decoded.uid;

    // ── 3. Find or create patient user ─────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { mobile },
      include: baseUserInclude,
    });

    let isNewUser = false;

    if (!user) {
      // ── 3a. New user — create PATIENT account ────────────────────────────
      user = await prisma.user.create({
        data: {
          mobile,
          name: name || null,
          role: 'PATIENT',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          firebaseUid,
          authProvider: 'FIREBASE_PHONE',
          patientProfile: { create: {} },
        },
        include: baseUserInclude,
      });
      isNewUser = true;
    } else {
      // ── 3b. Existing user — safety checks ────────────────────────────────
      if (user.role !== 'PATIENT') {
        return sendError(
          res,
          'This phone number belongs to a staff account. Use the staff login portal.',
          403
        );
      }

      if (!user.isActive) {
        return sendError(res, 'Your account has been disabled. Please contact support.', 403);
      }

      if (user.approvalStatus === 'SUSPENDED') {
        return sendError(res, user.suspendedReason || 'Your account is suspended.', 403);
      }

      // ── 3c. Update lastLoginAt + sync firebaseUid if needed ──────────────
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          lastLoginAt: new Date(),
          authProvider: 'FIREBASE_PHONE',
          ...(user.firebaseUid !== firebaseUid ? { firebaseUid } : {}),
          ...(name && !user.name ? { name } : {}),
        },
        include: baseUserInclude,
      });
    }

    // ── 4. Issue our app JWT ───────────────────────────────────────────────
    const tokens = await issueAuthTokens(res, user, req);

    await createAuditLog({
      userId: user.id,
      action: isNewUser ? 'PATIENT_REGISTERED_FIREBASE' : 'PATIENT_LOGIN_FIREBASE',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      metadata: { provider: 'FIREBASE_PHONE' },
    });

    return sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        // Include refreshToken in body so mobile clients (React Native / Expo)
        // can store it in SecureStore for silent token rotation.
        // Web clients ignore this and rely on the httpOnly cookie set above.
        refreshToken: tokens.refreshToken,
        user: { ...toAuthUser(user), isNewUser },
      },
      isNewUser ? 'Account created successfully' : 'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

const sendOtpHandler = patientSendOtpHandler;
const verifyOtpHandler = patientVerifyOtpHandler;
const loginPasswordHandler = loginHandler;

module.exports = {
  patientSendOtpHandler,
  patientVerifyOtpHandler,
  clinicOwnerSendOtpHandler,
  clinicOwnerVerifyOtpHandler,
  clinicOwnerVerifyFirebasePhoneHandler,
  clinicOwnerSendEmailOtpHandler,
  clinicOwnerVerifyEmailOtpHandler,
  clinicOwnerSendEmailVerificationHandler: clinicOwnerSendEmailOtpHandler,
  clinicOwnerVerifyEmailHandler: clinicOwnerVerifyEmailOtpHandler,
  clinicOwnerUploadDocumentHandler,
  registerClinicOwnerHandler,
  doctorVerifyFirebasePhoneHandler,
  registerDoctorHandler,
  loginHandler,
  clinicOwnerLoginHandler: loginHandler,
  doctorLoginHandler: loginHandler,
  receptionistLoginHandler: loginHandler,
  adminLoginHandler: loginHandler,
  createReceptionistHandler,
  createAdminHandler,
  lookupPincodeHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyResetTokenHandler,
  refreshTokenHandler,
  logoutHandler,
  logoutAllHandler,
  getMeHandler,
  sendOtpHandler,
  verifyOtpHandler,
  loginPasswordHandler,
  firebasePhoneLoginHandler,
  patientFirebasePhoneLoginHandler,
};
