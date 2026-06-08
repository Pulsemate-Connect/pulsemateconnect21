const prisma = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { notifyAppointmentBooked, notifyAppointmentCancelled, notifyDoctorNewBooking, sendNotification } = require('../services/fcm.service');

/**
 * GET /api/patient/doctors - Search doctors
 * Only returns doctors who are linked to at least one VERIFIED + active clinic.
 * The doctorClinics include only returns verified + active clinic entries.
 */
const searchDoctors = async (req, res, next) => {
  try {
    const { specialization, city, name, available, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Base filter — doctor must be verified, user active,
    // AND linked to at least one verified active clinic
    const verifiedClinicFilter = {
      some: {
        isActive: true,
        inviteStatus: 'ACCEPTED',
        clinic: { approvalStatus: 'VERIFIED', isActive: true },
      },
    };

    const where = {
      approvalStatus: 'VERIFIED',
      marketplaceVisible: true,
      user: { isActive: true, role: 'DOCTOR' },
      doctorClinics: verifiedClinicFilter,
    };

    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    if (available === 'true') {
      where.offlineAvailable = true;
    }

    if (name) {
      where.user = { ...where.user, name: { contains: name, mode: 'insensitive' } };
    }

    if (city) {
      where.doctorClinics = {
        some: {
          isActive: true,
          inviteStatus: 'ACCEPTED',
          clinic: {
            approvalStatus: 'VERIFIED',
            isActive: true,
            city: { contains: city, mode: 'insensitive' },
          },
        },
      };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: { select: { id: true, name: true, mobile: true } },
          doctorClinics: {
            // Only expose verified + active clinic relationships to the patient
            where: {
              isActive: true,
              inviteStatus: 'ACCEPTED',
              clinic: { approvalStatus: 'VERIFIED', isActive: true },
            },
            include: {
              clinic: {
                select: {
                  id: true, name: true, city: true, address: true,
                  isVerified: true, approvalStatus: true,
                },
              },
            },
          },
        },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    return sendPaginated(res, doctors, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/doctors/:id - Get doctor profile
 * Only shows clinic relationships where the clinic is VERIFIED and active.
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, mobile: true } },
        doctorClinics: {
          where: {
            isActive: true,
            inviteStatus: 'ACCEPTED',
            clinic: { approvalStatus: 'VERIFIED', isActive: true },
          },
          include: {
            clinic: {
              select: {
                id: true, name: true, city: true, address: true, phone: true,
                openingTime: true, closingTime: true,
                isVerified: true, approvalStatus: true,
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      return sendError(res, 'Doctor not found', 404);
    }

    return sendSuccess(res, { doctor });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patient/appointments - Book appointment
 * Clinic must be VERIFIED and active before a booking is accepted.
 */
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, clinicId, appointmentType, appointmentDate, slotTime, symptoms } = req.body;

    // Verify the clinic is approved and active
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, approvalStatus: true, isActive: true, name: true },
    });

    if (!clinic) {
      return sendError(res, 'Clinic not found', 404);
    }
    if (clinic.approvalStatus !== 'VERIFIED' || !clinic.isActive) {
      return sendError(res, 'Clinic verification is required before using this feature.', 403);
    }

    // Verify doctor-clinic relationship
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId, clinicId, isActive: true },
      include: { doctor: true },
    });

    if (!doctorClinic) {
      return sendError(res, 'Doctor is not available at this clinic', 400);
    }

    // Check for duplicate booking on same date
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        patientId: req.user.id,
        doctorId,
        clinicId,
        appointmentDate: {
          gte: new Date(new Date(appointmentDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(appointmentDate).setHours(23, 59, 59, 999)),
        },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    if (existingBooking) {
      return sendError(res, 'You already have an appointment with this doctor on this date', 409);
    }

    let queueNumber = null;
    let estimatedWaitMinutes = null;

    // For offline appointments, assign queue number
    if (appointmentType === 'OFFLINE') {
      const today = new Date(appointmentDate);
      today.setUTCHours(0, 0, 0, 0); // use UTC midnight to match Queue.date storage

      // Get or create queue
      let queue = await prisma.queue.findFirst({
        where: { clinicId, doctorId, date: today },
      });

      if (!queue) {
        queue = await prisma.queue.create({
          data: { clinicId, doctorId, date: today, status: 'ACTIVE' },
        });
      }

      const lastItem = await prisma.queueItem.findFirst({
        where: { queueId: queue.id },
        orderBy: { queueNumber: 'desc' },
      });

      queueNumber = (lastItem?.queueNumber || 0) + 1;

      const waitingCount = await prisma.queueItem.count({
        where: { queueId: queue.id, status: 'WAITING' },
      });

      estimatedWaitMinutes = (waitingCount + 1) * (doctorClinic.avgConsultationMins || 10);
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user.id,
        doctorId,
        clinicId,
        appointmentType,
        appointmentDate: new Date(appointmentDate),
        slotTime,
        symptoms,
        status: 'BOOKED',
        queueNumber,
        estimatedWaitMinutes,
      },
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true, address: true, city: true } },
      },
    });

    // Create queue item for offline appointments
    if (appointmentType === 'OFFLINE' && queueNumber) {
      const today = new Date(appointmentDate);
      today.setHours(0, 0, 0, 0);

      const queue = await prisma.queue.findFirst({
        where: { clinicId, doctorId, date: today },
      });

      if (queue) {
        const waitingCount = await prisma.queueItem.count({
          where: { queueId: queue.id, status: 'WAITING' },
        });

        await prisma.queueItem.create({
          data: {
            queueId: queue.id,
            appointmentId: appointment.id,
            patientId: req.user.id,
            queueNumber,
            status: 'WAITING',
            position: waitingCount + 1,
          },
        });
      }
    }

    // Fire-and-forget booking confirmation notification
    notifyAppointmentBooked(
      req.user.id,
      appointment.doctor?.user?.name || 'the doctor',
      appointmentDate,
      queueNumber
    ).catch(() => { });

    // Notify doctor of new booking
    if (appointment.doctor?.user?.id) {
      notifyDoctorNewBooking(
        appointment.doctor.user.id,
        req.user.name || 'A patient',
        appointmentDate
      ).catch(() => { });
    }

    return sendSuccess(res, { appointment }, 'Appointment booked successfully', 201);
  } catch (error) {
    next(error);
  }
};
const getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { patientId: req.user.id };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          doctor: {
            include: { user: { select: { id: true, name: true } } },
          },
          clinic: { select: { id: true, name: true, address: true, city: true, phone: true } },
          queueItem: true,
          payment: { select: { id: true, status: true, amount: true, method: true } },
        },
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return sendPaginated(res, appointments, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/appointments/:id - Get appointment details
 */
const getAppointmentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: req.user.id },
      include: {
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true, address: true, city: true, phone: true, latitude: true, longitude: true } },
        queueItem: true,
        payment: { select: { id: true, status: true, amount: true, method: true, paidAt: true, razorpayPaymentId: true } },
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    return sendSuccess(res, { appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patient/queue/:appointmentId - Get live queue status
 */
const getLiveQueue = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: req.user.id },
      include: {
        queueItem: {
          include: { queue: true },
        },
        doctor: {
          include: { user: { select: { id: true, name: true } } },
        },
        clinic: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    // Always compute roomName so mobile can connect socket even before queue item exists
    const apptDateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    const roomName = `queue:${appointment.clinicId}:${appointment.doctorId}:${apptDateStr}`;

    if (!appointment.queueItem) {
      return sendSuccess(res, {
        appointment,
        queueInfo: {
          queueNumber: appointment.queueNumber || null,
          position: null,
          status: appointment.status,
          estimatedWaitMinutes: appointment.estimatedWaitMinutes || null,
          patientsAhead: null,
          currentlyServing: null,
          queueStatus: 'ACTIVE',
          roomName,
          appointmentDate: appointment.appointmentDate,
        }
      });
    }

    // Get current consultation info
    const currentlyServing = await prisma.queueItem.findFirst({
      where: {
        queueId: appointment.queueItem.queueId,
        status: { in: ['CALLED', 'IN_CONSULTATION'] },
      },
      orderBy: { queueNumber: 'desc' },
    });

    // Count patients ahead
    const patientsAhead = await prisma.queueItem.count({
      where: {
        queueId: appointment.queueItem.queueId,
        status: 'WAITING',
        position: { lt: appointment.queueItem.position },
      },
    });

    const queueInfo = {
      queueNumber: appointment.queueItem.queueNumber,
      position: appointment.queueItem.position,
      status: appointment.queueItem.status,
      estimatedWaitMinutes: appointment.estimatedWaitMinutes,
      patientsAhead,
      currentlyServing: currentlyServing?.queueNumber || null,
      queueStatus: appointment.queueItem.queue.status,
      roomName,
      appointmentDate: appointment.appointmentDate,
    };

    return sendSuccess(res, { appointment, queueInfo });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/patient/appointments/:id/cancel - Cancel appointment
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId: req.user.id },
      include: {
        queueItem: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    if (['COMPLETED', 'CANCELLED', 'IN_CONSULTATION'].includes(appointment.status)) {
      return sendError(res, `Cannot cancel appointment with status: ${appointment.status}`, 400);
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    if (appointment.queueItem) {
      await prisma.queueItem.update({
        where: { id: appointment.queueItem.id },
        data: { status: 'CANCELLED' },
      });
    }

    // Notify all stakeholders (fire-and-forget)
    try {
      const doctorName = appointment.doctor?.user?.name || 'the doctor';
      const date = appointment.appointmentDate;

      // 1. Notify patient
      notifyAppointmentCancelled(req.user.id, doctorName, date).catch(() => { });

      // 2. Notify doctor
      const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: appointment.doctorId }, select: { userId: true } });
      if (doctorProfile) {
        sendNotification(doctorProfile.userId, {
          title: '❌ Appointment Cancelled',
          body: `Patient cancelled appointment on ${new Date(date).toLocaleDateString('en-IN')}.`,
          data: { type: 'APPOINTMENT_CANCELLED', appointmentId: appointment.id },
        }).catch(() => { });
      }

      // 3. Notify clinic owner + receptionists
      const clinic = await prisma.clinic.findUnique({ where: { id: appointment.clinicId }, select: { ownerId: true } });
      if (clinic) {
        const cancelMsg = { title: '❌ Appointment Cancelled', body: `An appointment was cancelled by the patient.`, data: { type: 'APPOINTMENT_CANCELLED' } };
        sendNotification(clinic.ownerId, cancelMsg).catch(() => { });
        const receptionists = await prisma.clinicStaff.findMany({ where: { clinicId: appointment.clinicId, role: 'RECEPTIONIST', isActive: true }, select: { userId: true } });
        receptionists.forEach(r => sendNotification(r.userId, cancelMsg).catch(() => { }));
      }
    } catch { }

    return sendSuccess(res, {}, 'Appointment cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate profile completion percentage
 */
const calcProfileCompletion = (user, profile) => {
  const checks = [
    { field: user?.name, weight: 20 },
    { field: profile?.gender, weight: 15 },
    { field: profile?.dob || profile?.age, weight: 15 },
    { field: profile?.city || profile?.address, weight: 10 },
    { field: profile?.emergencyContact, weight: 10 },
    { field: profile?.bloodGroup, weight: 10 },
    { field: profile?.allergies, weight: 5 },
    { field: profile?.existingDiseases, weight: 5 },
    { field: profile?.insuranceProvider, weight: 5 },
    { field: user?.email, weight: 5 },
  ];
  return checks.reduce((sum, c) => sum + (c.field ? c.weight : 0), 0);
};

/**
 * GET /api/patient/profile - Get patient profile (works for any role)
 */
const getProfile = async (req, res, next) => {
  try {
    // Auto-create patientProfile if missing (e.g. for DOCTOR users using patient features)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patientProfile: true },
    });

    if (!user.patientProfile) {
      await prisma.patientProfile.create({
        data: { userId: req.user.id },
      });
      // Re-fetch with profile
      const updated = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { patientProfile: true },
      });
      const completion = calcProfileCompletion(updated, updated?.patientProfile);
      return sendSuccess(res, { user: updated, profileCompletion: completion });
    }

    const completion = calcProfileCompletion(user, user?.patientProfile);
    return sendSuccess(res, { user, profileCompletion: completion });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/patient/profile - Update patient profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name, email, age, dob, gender, address, city,
      emergencyContact, bloodGroup, allergies,
      existingDiseases, insuranceProvider,
    } = req.body;

    // Determine if required fields are complete after this update
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patientProfile: true },
    });

    const mergedName = name || currentUser?.name;
    const mergedGender = gender || currentUser?.patientProfile?.gender;
    const mergedDob = dob || currentUser?.patientProfile?.dob;
    const mergedAge = age !== undefined ? age : currentUser?.patientProfile?.age;
    const mergedCity = city || currentUser?.patientProfile?.city;
    const mergedEmergency = emergencyContact || currentUser?.patientProfile?.emergencyContact;

    const profileCompleted = !!(
      mergedName && mergedGender && (mergedDob || mergedAge) && (mergedCity || address) && mergedEmergency
    );

    // Build profile update — only include fields that were actually sent in the request body
    const profileUpdate = {};
    if (age !== undefined) profileUpdate.age = age || null;
    if (dob !== undefined) profileUpdate.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) profileUpdate.gender = gender || null;
    if (address !== undefined) profileUpdate.address = address || null;
    if (city !== undefined) profileUpdate.city = city || null;
    if (emergencyContact !== undefined) profileUpdate.emergencyContact = emergencyContact || null;
    if (bloodGroup !== undefined) profileUpdate.bloodGroup = bloodGroup || null;
    if (allergies !== undefined) profileUpdate.allergies = allergies || null;
    if (existingDiseases !== undefined) profileUpdate.existingDiseases = existingDiseases || null;
    if (insuranceProvider !== undefined) profileUpdate.insuranceProvider = insuranceProvider || null;
    profileUpdate.profileCompleted = profileCompleted;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        patientProfile: {
          upsert: {
            create: {
              age: age || null,
              dob: dob ? new Date(dob) : null,
              gender: gender || null,
              address: address || null,
              city: city || null,
              emergencyContact: emergencyContact || null,
              bloodGroup: bloodGroup || null,
              allergies: allergies || null,
              existingDiseases: existingDiseases || null,
              insuranceProvider: insuranceProvider || null,
              profileCompleted,
            },
            update: profileUpdate,
          },
        },
      },
      include: { patientProfile: true },
    });

    const completion = calcProfileCompletion(user, user?.patientProfile);
    return sendSuccess(res, { user, profileCompletion: completion }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Haversine distance in km between two lat/lng points
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * GET /api/patient/nearby?lat=xx&lng=yy&radius=10&type=clinics|doctors|all
 * Returns nearby verified clinics and/or doctors sorted by distance
 */
const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, type = 'all', limit = 20 } = req.query;

    if (!lat || !lng) {
      return sendError(res, 'lat and lng query params are required', 400);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);
    const maxResults = parseInt(limit);

    if (isNaN(userLat) || isNaN(userLng)) {
      return sendError(res, 'Invalid lat/lng values', 400);
    }

    const result = {};

    // ── Nearby Clinics ───────────────────────────────────────────────────────
    if (type === 'clinics' || type === 'all') {
      const clinics = await prisma.clinic.findMany({
        where: {
          approvalStatus: 'VERIFIED',
          isVerified: true,
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          phone: true,
          openingHours: true,
          specialties: true,
          clinicType: true,
          clinicLogoUrl: true,
          consultationModes: true,
          _count: { select: { appointments: true } },
        },
      });

      const nearbyClinics = clinics
        .map((c) => {
          const distKm = haversineKm(userLat, userLng, c.latitude, c.longitude);
          return { ...c, distanceKm: Math.round(distKm * 10) / 10 };
        })
        .filter((c) => c.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, maxResults);

      result.clinics = nearbyClinics;
    }

    // ── Nearby Doctors (via their clinics) ───────────────────────────────────
    if (type === 'doctors' || type === 'all') {
      const doctorClinics = await prisma.doctorClinic.findMany({
        where: {
          isActive: true,
          clinic: {
            approvalStatus: 'VERIFIED',
            isVerified: true,
            latitude: { not: null },
            longitude: { not: null },
          },
          doctor: {
            approvalStatus: 'VERIFIED',
            user: { isActive: true },
          },
        },
        select: {
          consultationFee: true,
          clinic: {
            select: {
              id: true,
              name: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              experienceYears: true,
              offlineAvailable: true,
              onlineAvailable: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      });

      // Deduplicate doctors, keep closest clinic
      const doctorMap = new Map();
      for (const dc of doctorClinics) {
        const distKm = haversineKm(userLat, userLng, dc.clinic.latitude, dc.clinic.longitude);
        if (distKm > radiusKm) continue;
        const existing = doctorMap.get(dc.doctor.id);
        if (!existing || distKm < existing.distanceKm) {
          doctorMap.set(dc.doctor.id, {
            ...dc.doctor,
            nearestClinic: dc.clinic,
            consultationFee: dc.consultationFee,
            distanceKm: Math.round(distKm * 10) / 10,
          });
        }
      }

      result.doctors = Array.from(doctorMap.values())
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, maxResults);
    }

    return sendSuccess(res, result, 'Nearby results fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDoctors,
  getDoctorProfile,
  bookAppointment,
  getMyAppointments,
  getAppointmentDetails,
  getLiveQueue,
  cancelAppointment,
  getProfile,
  updateProfile,
  getNearby,
};
