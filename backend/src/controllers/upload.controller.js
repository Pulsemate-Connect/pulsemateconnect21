const { sendSuccess, sendError } = require('../utils/response');
const { getFileUrl } = require('../services/upload.service');
const prisma = require('../config/database');

/**
 * POST /api/upload/clinic-logo - Upload clinic logo
 */
const uploadClinicLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const { clinicId } = req.body;

    // Verify ownership
    const clinic = await prisma.clinic.findFirst({
      where: { id: clinicId, ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    const fileUrl = getFileUrl(req.file.filename, req);

    // Update clinic
    await prisma.clinic.update({
      where: { id: clinicId },
      data: { clinicLogoUrl: fileUrl },
    });

    return sendSuccess(res, { url: fileUrl }, 'Logo uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/clinic-cover - Upload clinic cover image
 */
const uploadClinicCover = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const { clinicId } = req.body;

    const clinic = await prisma.clinic.findFirst({
      where: { id: clinicId, ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    const fileUrl = getFileUrl(req.file.filename, req);

    await prisma.clinic.update({
      where: { id: clinicId },
      data: { clinicCoverImageUrl: fileUrl },
    });

    return sendSuccess(res, { url: fileUrl }, 'Cover image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/clinic-document - Upload clinic documents
 */
const uploadClinicDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const { clinicId, documentType } = req.body;

    const clinic = await prisma.clinic.findFirst({
      where: { id: clinicId, ownerId: req.user.id },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found or access denied', 404);
    }

    const fileUrl = getFileUrl(req.file.filename, req);

    // Update appropriate field based on documentType
    const updateData = {};
    switch (documentType) {
      case 'LICENSE':
        updateData.licenseDocumentUrl = fileUrl;
        updateData.clinicLicenseDocument = fileUrl;
        break;
      case 'GST':
        updateData.gstCertificateUrl = fileUrl;
        break;
      case 'PAN':
        updateData.panCardUrl = fileUrl;
        break;
      case 'MEDICAL_CERTIFICATE':
        updateData.medicalEstablishmentCertificateUrl = fileUrl;
        break;
      default:
        return sendError(res, 'Invalid document type', 400);
    }

    await prisma.clinic.update({
      where: { id: clinicId },
      data: updateData,
    });

    return sendSuccess(res, { url: fileUrl }, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/doctor-photo - Upload doctor profile photo
 */
const uploadDoctorPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const fileUrl = getFileUrl(req.file.filename, req);

    await prisma.doctorProfile.update({
      where: { userId: req.user.id },
      data: { profileImage: fileUrl },
    });

    return sendSuccess(res, { url: fileUrl }, 'Photo uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/doctor-document - Upload doctor document (public - uses token)
 */
const uploadDoctorDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const { invitationToken, documentType } = req.body;

    if (!invitationToken) {
      return sendError(res, 'Invitation token is required', 400);
    }

    // Verify invitation token
    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation token', 404);
    }

    // Check token expiration
    if (new Date() > invitation.tokenExpiresAt) {
      return sendError(res, 'Invitation token has expired', 410);
    }

    const fileUrl = getFileUrl(req.file.filename, req);

    return sendSuccess(res, { 
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      documentType 
    }, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/upload/doctor-profile-photo - Upload doctor profile photo (public - uses token)
 */
const uploadDoctorProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const { invitationToken } = req.body;

    if (!invitationToken) {
      return sendError(res, 'Invitation token is required', 400);
    }

    // Verify invitation token
    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken },
    });

    if (!invitation) {
      return sendError(res, 'Invalid invitation token', 404);
    }

    // Check token expiration
    if (new Date() > invitation.tokenExpiresAt) {
      return sendError(res, 'Invitation token has expired', 410);
    }

    const fileUrl = getFileUrl(req.file.filename, req);

    return sendSuccess(res, { 
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size
    }, 'Profile photo uploaded successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadClinicLogo,
  uploadClinicCover,
  uploadClinicDocument,
  uploadDoctorPhoto,
  uploadDoctorDocument,
  uploadDoctorProfilePhoto,
};
