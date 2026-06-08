const crypto = require('crypto');
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { notifyAppointmentBooked, notifyDoctorNewBooking, sendNotification } = require('../services/fcm.service');

// ─── Fixed platform booking fee ───────────────────────────────────────────────
// Charged from the SECOND booking onward.
// The first booking is FREE (platform fee waived, queue assigned immediately).
const BOOKING_FEE = 10; // ₹10

// ─── Shared queue-assignment helper ──────────────────────────────────────────

/**
 * Assign queue number and create queue item for an appointment.
 * Called after payment confirmation OR immediately for free bookings.
 */
const assignQueueAndConfirm = async (appointment, doctorClinic, io) => {
  const avgMins = doctorClinic?.avgConsultationMins || 10;

  if (appointment.appointmentType === 'OFFLINE') {
    const day = new Date(appointment.appointmentDate);
    day.setUTCHours(0, 0, 0, 0);

    let queue = await prisma.queue.findFirst({
      where: { clinicId: appointment.clinicId, doctorId: appointment.doctorId, date: day },
    });
    if (!queue) {
      queue = await prisma.queue.create({
        data: { clinicId: appointment.clinicId, doctorId: appointment.doctorId, date: day, status: 'ACTIVE' },
      });
    }

    const lastItem = await prisma.queueItem.findFirst({
      where: { queueId: queue.id },
      orderBy: { queueNumber: 'desc' },
    });
    const queueNumber = (lastItem?.queueNumber || 0) + 1;

    const waitingCount = await prisma.queueItem.count({
      where: { queueId: queue.id, status: 'WAITING' },
    });

    const confirmed = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'BOOKED',
        queueNumber,
        estimatedWaitMinutes: (waitingCount + 1) * avgMins,
      },
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        clinic: { select: { id: true, name: true, address: true, city: true } },
      },
    });

    await prisma.queueItem.create({
      data: {
        queueId: queue.id,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        queueNumber,
        status: 'WAITING',
        position: waitingCount + 1,
      },
    });

    if (io) {
      const today = new Date(appointment.appointmentDate).toISOString().split('T')[0];
      const roomName = `queue:${appointment.clinicId}:${appointment.doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', {
        type: 'APPOINTMENT_BOOKED',
        appointmentId: appointment.id,
        queueNumber,
      });
    }

    return confirmed;
  }

  // Online appointment — just confirm
  return prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: 'BOOKED' },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      clinic: { select: { id: true, name: true, address: true, city: true } },
    },
  });
};

/**
 * Fire-and-forget: notify doctor, clinic owner, and receptionists of a new booking.
 */
const notifyStakeholders = async (appointment, patientName) => {
  try {
    const apptDate = appointment.appointmentDate;
    const [doctorProfile, clinicData] = await Promise.all([
      prisma.doctorProfile.findUnique({ where: { id: appointment.doctorId }, select: { userId: true } }),
      prisma.clinic.findUnique({ where: { id: appointment.clinicId }, select: { ownerId: true } }),
    ]);

    if (doctorProfile) {
      notifyDoctorNewBooking(doctorProfile.userId, patientName, apptDate).catch(() => { });
    }

    if (clinicData) {
      const msg = {
        title: '📅 New Booking',
        body: `${patientName} booked an appointment on ${new Date(apptDate).toLocaleDateString('en-IN')}.`,
        data: { type: 'DOCTOR_NEW_BOOKING', appointmentId: appointment.id },
      };
      sendNotification(clinicData.ownerId, msg).catch(() => { });

      const receptionists = await prisma.clinicStaff.findMany({
        where: { clinicId: appointment.clinicId, role: 'RECEPTIONIST', isActive: true },
        select: { userId: true },
      }).catch(() => []);
      receptionists.forEach((r) => sendNotification(r.userId, msg).catch(() => { }));
    }
  } catch { /* notification failure must never break main flow */ }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/payments/initiate
 *
 * Unified booking entry point — handles both free and paid flows.
 *
 * FREE flow (first booking):
 *   - Validates doctor/clinic/date
 *   - Creates appointment + assigns queue immediately (inside DB transaction)
 *   - Marks freeBookingUsed = true on the user
 *   - Creates a FREE payment record (amount: 0)
 *   - Returns { isFree: true, appointment } — no Razorpay order
 *
 * PAID flow (second booking onward):
 *   - Creates appointment in PENDING_PAYMENT state
 *   - Creates Razorpay order (or dev mock)
 *   - Returns { isFree: false, order, key, amount } — client opens Razorpay
 *
 * Both paths return the same top-level shape so clients can branch on `isFree`.
 */
const initiatePayment = async (req, res, next) => {
  try {
    const {
      doctorId, clinicId, appointmentType,
      appointmentDate, slotTime, symptoms,
    } = req.body;

    const patientId = req.user.id;

    // ── Validate doctor-clinic relationship ───────────────────────────────
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId, clinicId, isActive: true },
      include: { doctor: { include: { user: { select: { id: true, name: true } } } } },
    });
    if (!doctorClinic) {
      return sendError(res, 'Doctor is not available at this clinic', 400);
    }

    // ── Duplicate booking guard ────────────────────────────────────────────
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId,
        clinicId,
        appointmentDate: {
          gte: new Date(new Date(appointmentDate).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(appointmentDate).setHours(23, 59, 59, 999)),
        },
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'] },
      },
    });
    if (existingBooking) {
      return sendError(res, 'You already have a confirmed appointment with this doctor on this date', 409);
    }

    // ── Check free-booking eligibility (read inside transaction below) ────
    const patientUser = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true, name: true, freeBookingUsed: true },
    });
    if (!patientUser) return sendError(res, 'Patient not found', 404);

    const isFree = !patientUser.freeBookingUsed;

    // ═════════════════════════════════════════════════════════════════════
    // PATH A — FREE FIRST BOOKING
    // ═════════════════════════════════════════════════════════════════════
    if (isFree) {
      // Use a DB transaction to prevent double-claiming via concurrent requests.
      const result = await prisma.$transaction(async (tx) => {
        // Re-read freeBookingUsed inside the transaction for concurrency safety
        const userLocked = await tx.user.findUnique({
          where: { id: patientId },
          select: { freeBookingUsed: true },
        });
        if (userLocked.freeBookingUsed) {
          // Race condition — another request already claimed the free booking
          throw new Error('FREE_BOOKING_ALREADY_USED');
        }

        // Create the appointment
        const appointment = await tx.appointment.create({
          data: {
            patientId,
            doctorId,
            clinicId,
            appointmentType,
            appointmentDate: new Date(appointmentDate),
            slotTime: slotTime || null,
            symptoms: symptoms || null,
            status: 'PENDING_PAYMENT', // will be updated to BOOKED by assignQueueAndConfirm
          },
        });

        // Create a FREE payment record (amount = 0, status PAID immediately)
        await tx.payment.create({
          data: {
            appointmentId: appointment.id,
            patientId,
            amount: 0,
            status: 'PAID',
            method: 'RAZORPAY', // reuse existing enum; amount=0 distinguishes it
            razorpayOrderId: `free_${appointment.id}`,
            razorpayPaymentId: `free_${appointment.id}`,
            razorpaySignature: 'free_booking',
            paidAt: new Date(),
          },
        });

        // Consume the free booking benefit — this is the critical atomic write
        await tx.user.update({
          where: { id: patientId },
          data: { freeBookingUsed: true, freeBookingUsedAt: new Date() },
        });

        return appointment;
      });

      // Assign queue + confirm outside the transaction (non-critical DB writes)
      const io = req.app.get('io');
      const confirmed = await assignQueueAndConfirm(result, doctorClinic, io);

      // Notify patient — free booking message
      sendNotification(patientId, {
        title: '🎉 First Booking Free!',
        body: `Your appointment with Dr. ${doctorClinic.doctor?.user?.name || 'the doctor'} is confirmed. Your first booking is free!`,
        data: { type: 'APPOINTMENT_BOOKED', appointmentId: confirmed.id, isFree: 'true' },
      }).catch(() => { });

      // Notify stakeholders
      notifyStakeholders(confirmed, patientUser.name || 'A patient');

      return sendSuccess(res, {
        isFree: true,
        appointmentId: confirmed.id,
        appointment: confirmed,
        amount: 0,
        message: '🎉 Your first appointment booking is free. Appointment confirmed successfully.',
      }, 'Free booking confirmed!');
    }

    // ═════════════════════════════════════════════════════════════════════
    // PATH B — PAID BOOKING (₹10 platform fee)
    // ═════════════════════════════════════════════════════════════════════
    const fee = BOOKING_FEE;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        clinicId,
        appointmentType,
        appointmentDate: new Date(appointmentDate),
        slotTime: slotTime || null,
        symptoms: symptoms || null,
        status: 'PENDING_PAYMENT',
      },
    });

    let order, key, devMode = false;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      order = {
        id: `order_dev_${Date.now()}`,
        amount: Math.round(fee * 100),
        currency: 'INR',
        receipt: appointment.id,
      };
      key = 'rzp_test_dev_mode';
      devMode = true;
    } else {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      order = await razorpay.orders.create({
        amount: Math.round(fee * 100),
        currency: 'INR',
        receipt: appointment.id,
        notes: { appointmentId: appointment.id, patientId },
      });
      key = process.env.RAZORPAY_KEY_ID;
    }

    await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        patientId,
        amount: fee,
        status: 'PENDING',
        method: 'RAZORPAY',
        razorpayOrderId: order.id,
      },
    });

    return sendSuccess(res, {
      isFree: false,
      appointmentId: appointment.id,
      order,
      key,
      amount: fee,
      currency: 'INR',
      devMode,
      doctorName: doctorClinic.doctor?.user?.name,
    }, 'Payment order created');

  } catch (error) {
    // Gracefully handle the concurrent free-booking race condition
    if (error.message === 'FREE_BOOKING_ALREADY_USED') {
      // Re-run as paid booking — rare case, just recurse once
      req.body._forcePaid = true;
      return initiatePayment(req, res, next);
    }
    next(error);
  }
};

/**
 * POST /api/payments/verify
 *
 * Step 2 of the PAID booking flow.
 * Verifies Razorpay HMAC signature, marks payment PAID,
 * confirms appointment + assigns queue.
 *
 * Not called for free bookings (they are already confirmed in initiatePayment).
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      appointmentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const payment = await prisma.payment.findUnique({ where: { appointmentId } });
    if (!payment) return sendError(res, 'Payment record not found', 404);
    if (payment.status === 'PAID') return sendError(res, 'Payment already verified', 409);

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    // ── Dev mode ──────────────────────────────────────────────────────────
    if (razorpayOrderId?.startsWith('order_dev_')) {
      await prisma.payment.update({
        where: { appointmentId },
        data: {
          status: 'PAID',
          razorpayPaymentId: razorpayPaymentId || `pay_dev_${Date.now()}`,
          razorpaySignature: razorpaySignature || 'dev_sig',
          paidAt: new Date(),
        },
      });

      const doctorClinic = await prisma.doctorClinic.findFirst({
        where: { doctorId: appointment.doctorId, clinicId: appointment.clinicId },
      });
      const io = req.app.get('io');
      const confirmed = await assignQueueAndConfirm(appointment, doctorClinic, io);

      notifyAppointmentBooked(
        appointment.patientId,
        confirmed.doctor?.user?.name || 'the doctor',
        appointment.appointmentDate,
        confirmed.queueNumber
      ).catch(() => { });

      const patientUser = await prisma.user.findUnique({
        where: { id: appointment.patientId },
        select: { name: true },
      });
      notifyStakeholders(confirmed, patientUser?.name || 'A patient');

      return sendSuccess(res, { verified: true, appointment: confirmed }, 'Payment verified — appointment confirmed!');
    }

    // ── Real Razorpay HMAC verification ───────────────────────────────────
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      await prisma.payment.update({ where: { appointmentId }, data: { status: 'FAILED' } });
      await prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'CANCELLED' } });
      return sendError(res, 'Payment verification failed — invalid signature', 400);
    }

    await prisma.payment.update({
      where: { appointmentId },
      data: { status: 'PAID', razorpayPaymentId, razorpaySignature, paidAt: new Date() },
    });

    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId: appointment.doctorId, clinicId: appointment.clinicId },
    });
    const io = req.app.get('io');
    const confirmed = await assignQueueAndConfirm(appointment, doctorClinic, io);

    // Notification — paid booking message
    sendNotification(appointment.patientId, {
      title: '✅ Appointment Confirmed',
      body: `Payment of ₹${BOOKING_FEE} received. Appointment with Dr. ${confirmed.doctor?.user?.name || 'the doctor'} confirmed.`,
      data: { type: 'APPOINTMENT_BOOKED', appointmentId: confirmed.id, isFree: 'false' },
    }).catch(() => { });

    const patientUser = await prisma.user.findUnique({
      where: { id: appointment.patientId },
      select: { name: true },
    });
    notifyStakeholders(confirmed, patientUser?.name || 'A patient');

    return sendSuccess(res, { verified: true, appointment: confirmed }, 'Payment verified — appointment confirmed!');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/booking-status
 * Returns whether the current patient has used their free booking.
 * Used by the frontend to show/hide the free booking banner before booking.
 */
const getBookingStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { freeBookingUsed: true, freeBookingUsedAt: true },
    });
    return sendSuccess(res, {
      freeBookingUsed: user?.freeBookingUsed ?? false,
      freeBookingUsedAt: user?.freeBookingUsedAt ?? null,
      bookingFee: user?.freeBookingUsed ? BOOKING_FEE : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/cash
 * Receptionist records cash payment and confirms appointment.
 */
const markCashPayment = async (req, res, next) => {
  try {
    const { appointmentId, amount } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: { select: { consultationFee: true } } },
    });
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    const finalAmount = amount || appointment.doctor?.consultationFee || 0;

    const payment = await prisma.payment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        patientId: appointment.patientId,
        amount: finalAmount,
        status: 'PAID',
        method: 'CASH',
        paidAt: new Date(),
      },
      update: {
        status: 'PAID',
        method: 'CASH',
        amount: finalAmount,
        paidAt: new Date(),
      },
    });

    const io = req.app.get('io');
    if (io) {
      const today = new Date().toISOString().split('T')[0];
      const roomName = `queue:${appointment.clinicId}:${appointment.doctorId}:${today}`;
      io.to(roomName).emit('queue:updated', { type: 'PAYMENT_RECORDED', appointmentId, method: 'CASH' });
    }

    return sendSuccess(res, { payment }, 'Cash payment recorded');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/appointment/:appointmentId
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const payment = await prisma.payment.findUnique({ where: { appointmentId } });
    return sendSuccess(res, { payment: payment || null });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/my
 */
const getMyPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { patientId: req.user.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            select: {
              id: true, appointmentDate: true, status: true, queueNumber: true,
              doctor: { include: { user: { select: { name: true } } } },
              clinic: { select: { name: true, city: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where: { patientId: req.user.id } }),
    ]);

    return sendSuccess(res, { payments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/refund
 */
const requestRefund = async (req, res, next) => {
  try {
    const { appointmentId, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const payment = await prisma.payment.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            patient: { select: { id: true, name: true } },
            doctor: { include: { user: { select: { name: true } } } },
            clinic: { select: { name: true, ownerId: true } },
          },
        },
      },
    });

    if (!payment) return sendError(res, 'Payment not found', 404);
    if (payment.status === 'REFUNDED') return sendError(res, 'Already refunded', 400);
    if (payment.status !== 'PAID') return sendError(res, 'Only PAID payments can be refunded', 400);

    if (userRole === 'PATIENT' && payment.patientId !== userId) {
      return sendError(res, 'Access denied', 403);
    }

    // Free bookings (amount = 0) — nothing to refund via Razorpay, just cancel
    const isFreeBooking = payment.amount === 0 || payment.razorpayOrderId?.startsWith('free_');

    if (
      !isFreeBooking &&
      payment.method === 'RAZORPAY' &&
      payment.razorpayPaymentId &&
      !payment.razorpayPaymentId.startsWith('pay_dev_') &&
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET
    ) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(payment.amount * 100),
          notes: { reason: reason || 'Patient requested refund', appointmentId },
        });
      } catch (err) {
        return sendError(res, `Razorpay refund failed: ${err.message}`, 500);
      }
    }

    const updated = await prisma.payment.update({
      where: { appointmentId },
      data: { status: 'REFUNDED' },
    });

    const appt = payment.appointment;
    if (appt && !['COMPLETED', 'CANCELLED'].includes(appt.status)) {
      await prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'CANCELLED' } });
    }

    return sendSuccess(res, { payment: updated }, 'Refund processed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  getBookingStatus,
  markCashPayment,
  getPaymentStatus,
  getMyPayments,
  requestRefund,
};
