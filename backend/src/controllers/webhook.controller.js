/**
 * webhook.controller.js
 *
 * Razorpay webhook handler.
 *
 * WHY THIS EXISTS:
 * On mobile, the Razorpay checkout sometimes closes before the JS handler
 * callback fires — especially on redirect-based flows. The payment is debited
 * on Razorpay's side but the app never calls POST /payments/verify.
 * The webhook is the server-side safety net: Razorpay calls our server
 * directly when events happen, regardless of what the client does.
 *
 * Setup in Razorpay Dashboard:
 *   Settings → Webhooks → Add New Webhook
 *   URL: https://api.pulsemateconnect.in/api/webhooks/razorpay
 *   Secret: set RAZORPAY_WEBHOOK_SECRET env var to the same value
 *   Events: payment.captured, payment.failed, order.paid
 *
 * IMPORTANT: This route must receive the RAW request body (not parsed JSON)
 * for signature verification. See server.js — raw body parser applied before
 * this route only.
 */

const crypto  = require('crypto');
const prisma  = require('../config/database');

// ── helpers (duplicated from payment.controller to avoid circular deps) ───────

const assignQueueAndConfirm = async (appointment, io) => {
  const doctorClinic = await prisma.doctorClinic.findFirst({
    where: { doctorId: appointment.doctorId, clinicId: appointment.clinicId },
  });
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
    const waitingCount = await prisma.queueItem.count({ where: { queueId: queue.id, status: 'WAITING' } });

    const confirmed = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'BOOKED', queueNumber, estimatedWaitMinutes: (waitingCount + 1) * avgMins },
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
      const dateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
      const room = `queue:${appointment.clinicId}:${appointment.doctorId}:${dateStr}`;
      io.to(room).emit('queue:updated', { type: 'APPOINTMENT_BOOKED', appointmentId: appointment.id, queueNumber });
    }

    return confirmed;
  }

  return prisma.appointment.update({ where: { id: appointment.id }, data: { status: 'BOOKED' } });
};

// ── Main webhook handler ───────────────────────────────────────────────────────

const razorpayWebhook = async (req, res) => {
  // 1. Verify webhook signature using raw body
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const receivedSig   = req.headers['x-razorpay-signature'];

  if (webhookSecret) {
    if (!receivedSig) {
      console.warn('[webhook] razorpay: missing x-razorpay-signature header');
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody) // raw body captured by express middleware
      .digest('hex');

    if (expectedSig !== receivedSig) {
      console.warn('[webhook] razorpay: invalid signature — possible spoofing attempt');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } else {
    console.warn('[webhook] razorpay: RAZORPAY_WEBHOOK_SECRET not set — skipping sig verification (insecure)');
  }

  // 2. Parse event
  let event;
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }

  const eventType = event?.event;
  console.log(`[webhook] razorpay: event=${eventType}`);

  // 3. Respond 200 immediately so Razorpay doesn't retry (processing is async)
  res.status(200).json({ success: true, received: true });

  // 4. Handle events asynchronously — errors here don't affect the 200 response
  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      await handlePaymentCaptured(event, eventType);
    } else if (eventType === 'payment.failed') {
      await handlePaymentFailed(event);
    } else {
      console.log(`[webhook] razorpay: unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error(`[webhook] razorpay: error processing ${eventType}:`, err.message);
  }
};

// ── payment.captured / order.paid ─────────────────────────────────────────────

const handlePaymentCaptured = async (event, eventType) => {
  let razorpayOrderId, razorpayPaymentId;

  if (eventType === 'order.paid') {
    razorpayOrderId  = event?.payload?.order?.entity?.id;
    razorpayPaymentId = event?.payload?.payment?.entity?.id;
  } else {
    // payment.captured
    const paymentEntity = event?.payload?.payment?.entity;
    razorpayOrderId  = paymentEntity?.order_id;
    razorpayPaymentId = paymentEntity?.id;
  }

  console.log(`[webhook] razorpay: ${eventType} | orderId=${razorpayOrderId} paymentId=${razorpayPaymentId}`);

  if (!razorpayOrderId) {
    console.warn('[webhook] razorpay: no order_id found in event payload');
    return;
  }

  // Find payment by order ID
  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId },
    include: { appointment: true },
  });

  if (!payment) {
    console.warn(`[webhook] razorpay: no payment found for orderId=${razorpayOrderId}`);
    return;
  }

  // ── Idempotency: never downgrade SUCCESS ──────────────────────────────
  if (payment.status === 'PAID') {
    console.log(`[webhook] razorpay: already PAID — skip | orderId=${razorpayOrderId}`);
    return;
  }

  // Mark payment as PAID
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId,
      paidAt: new Date(),
    },
  });

  console.log(`[webhook] razorpay: payment marked PAID | orderId=${razorpayOrderId} paymentId=${razorpayPaymentId} appointmentId=${payment.appointmentId} status=SUCCESS`);

  // Confirm appointment + assign queue (if not already confirmed)
  const appointment = payment.appointment;
  if (appointment && appointment.status === 'PENDING_PAYMENT') {
    try {
      await assignQueueAndConfirm(appointment, null /* no io in webhook */);
      console.log(`[webhook] razorpay: appointment confirmed | appointmentId=${appointment.id}`);
    } catch (err) {
      console.error(`[webhook] razorpay: queue assignment failed for appointmentId=${appointment.id}:`, err.message);
    }
  }
};

// ── payment.failed ─────────────────────────────────────────────────────────────

const handlePaymentFailed = async (event) => {
  const paymentEntity   = event?.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const razorpayPaymentId = paymentEntity?.id;
  const errorDesc       = paymentEntity?.error_description || 'Unknown error';

  console.log(`[webhook] razorpay: payment.failed | orderId=${razorpayOrderId} paymentId=${razorpayPaymentId} reason=${errorDesc} status=FAILED`);

  if (!razorpayOrderId) return;

  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId } });
  if (!payment) return;

  // ── Idempotency: never overwrite SUCCESS with FAILED ──────────────────
  if (payment.status === 'PAID') {
    console.log(`[webhook] razorpay: payment.failed received but status=PAID — not overwriting | orderId=${razorpayOrderId}`);
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED', razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId },
  });

  // Cancel the appointment only if it's still pending
  if (payment.appointment?.status === 'PENDING_PAYMENT') {
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { status: 'CANCELLED' },
    }).catch(() => {});
  }
};

module.exports = { razorpayWebhook };
