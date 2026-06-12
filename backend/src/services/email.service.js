const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const isProduction = process.env.NODE_ENV === 'production';
const hasSmtpConfig =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_PORT) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

const mailProvider = (process.env.EMAIL_PROVIDER || (hasSmtpConfig ? 'smtp' : 'console')).toLowerCase();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || (smtpPort === 465)).toLowerCase() === 'true';
const smtpUser = String(process.env.SMTP_USER || '').trim();
const smtpPass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
const smtpFrom = String(process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '').trim();

let smtpTransporter;

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  if (!hasSmtpConfig) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false' ? { rejectUnauthorized: false } : undefined,
  });

  return smtpTransporter;
};

const sendViaResend = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`Resend API error (${response.status}): ${errorBody}`);
    throw new Error(`Resend request failed with status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  logger.info(`Resend email sent to ${to} with subject "${subject}" - ID: ${result.id}`);
  return result;
};

const sendViaSendGrid = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`SendGrid request failed with status ${response.status}`);
  }

  return true;
};

const sendViaMailgun = async ({ to, subject, text, html }) => {
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  const from = process.env.MAILGUN_FROM_EMAIL;
  const formData = new URLSearchParams();
  formData.set('from', from);
  formData.set('to', to);
  formData.set('subject', subject);
  formData.set('text', text);
  formData.set('html', html);

  const auth = Buffer.from(`api:${apiKey}`).toString('base64');
  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`Mailgun request failed with status ${response.status}`);
  }

  return true;
};

const sendTransactionalEmail = async ({ to, subject, text, html }) => {
  if (!isProduction) {
    logger.info(`Email preview -> to: ${to}, subject: ${subject}`);
    logger.info(text);
  }

  if (mailProvider === 'smtp') {
    const transporter = getSmtpTransporter();
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text,
      html,
    });
    logger.info(`SMTP email sent to ${to} with subject "${subject}"`);
    return true;
  }

  if (typeof fetch !== 'function') {
    return false;
  }

  if (mailProvider === 'resend' && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    return sendViaResend({ to, subject, text, html });
  }

  if (mailProvider === 'sendgrid' && process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    return sendViaSendGrid({ to, subject, text, html });
  }

  if (mailProvider === 'mailgun' && process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.MAILGUN_FROM_EMAIL) {
    return sendViaMailgun({ to, subject, text, html });
  }

  return false;
};

const logEmail = (subject, email, body) => {
  logger.info(`${subject} queued for ${email}`);
  if (!isProduction) {
    logger.info(body);
  }
};

const sendPasswordResetEmail = async (userEmail, resetLink, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'We received a request to reset your PulseMate account password.',
    '',
    'Click the link below to reset your password:',
    resetLink,
    '',
    'This link will expire in 15 minutes.',
    '',
    'If you did not request this password reset, you can safely ignore this email.',
    '',
    'For security, never share this link with anyone.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  logEmail('Reset your PulseMate password', userEmail, body);
  return true;
};

const sendPasswordChangedEmail = async (userEmail, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'Your PulseMate account password was successfully changed.',
    '',
    'If this was you, no action is needed.',
    '',
    'If this was not you, contact support immediately.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  logEmail('Your PulseMate password was changed', userEmail, body);
  return true;
};

const sendSuperAdminPasswordChangedSecurityEmail = async (userEmail, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'Your PulseMate Super Admin password was successfully changed.',
    '',
    'If this was not you, contact the technical owner immediately.',
    '',
    'Thanks,',
    'PulseMate Security Team',
  ].join('\n');

  logEmail('Security Alert: PulseMate Super Admin Password Reset', userEmail, body);
  return true;
};

const sendSuperAdminResetEmail = async (userEmail, resetLink, userName) => {
  const body = [
    `Hello ${userName || 'there'},`,
    '',
    'A password reset was requested for your PulseMate Super Admin account.',
    '',
    'Reset link:',
    resetLink,
    '',
    'This link will expire in 10 minutes.',
    '',
    'If this was not you, contact the technical owner immediately and do not click the link.',
    '',
    'Thanks,',
    'PulseMate Security Team',
  ].join('\n');

  logEmail('Security Alert: PulseMate Super Admin Password Reset', userEmail, body);
  return true;
};

const sendClinicOwnerVerificationEmail = async (userEmail, verificationLink, userName) => {
  const subject = 'Verify your PulseMate clinic registration email';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    'Please verify your email address to continue your PulseMate clinic registration.',
    '',
    'Click the link below to verify your email:',
    verificationLink,
    '',
    'This link will expire in 10 minutes.',
    '',
    'If you did not start a clinic registration, you can ignore this email.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>Please verify your email address to continue your PulseMate clinic registration.</p>
      <p><a href="${verificationLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Verify email</a></p>
      <p style="color:#64748b;font-size:14px">This link will expire in 10 minutes.</p>
      <p style="color:#64748b;font-size:14px">If you did not start a clinic registration, you can ignore this email.</p>
    </div>
  `;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) {
    logEmail(subject, userEmail, text);
  }
  logger.info(`Legacy clinic email verification link: ${verificationLink}`);
  return true;
};

const sendClinicOwnerVerificationOtpEmail = async (userEmail, otp, userName) => {
  const subject = 'Your PulseMate clinic verification code';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    'Please use the OTP below to verify your email address for your PulseMate clinic registration.',
    '',
    `Email OTP: ${otp}`,
    '',
    'This OTP will expire in 10 minutes.',
    '',
    'If you did not start a clinic registration, you can ignore this email.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>Please use the OTP below to verify your email address for your PulseMate clinic registration.</p>
      <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;font-size:24px;font-weight:700;letter-spacing:0.28em;color:#1d4ed8">${otp}</div>
      <p style="color:#64748b;font-size:14px">This OTP will expire in 10 minutes.</p>
      <p style="color:#64748b;font-size:14px">If you did not start a clinic registration, you can ignore this email.</p>
    </div>
  `;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) {
    logEmail(subject, userEmail, text);
  }
  return true;
};

const sendClinicApprovedEmail = async (userEmail, userName, clinicName) => {
  const subject = '🎉 Your PulseMate Clinic is Approved!';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    `Congratulations! Your clinic "${clinicName}" has been verified and approved on PulseMate.`,
    '',
    'You can now:',
    '• Add doctors and receptionists',
    '• Receive patient bookings',
    '• Manage your queue',
    '• Appear in patient search',
    '',
    'Login to your dashboard to get started.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>🎉 Congratulations! Your clinic <strong>${clinicName}</strong> has been <span style="color:#16a34a;font-weight:700">verified and approved</span> on PulseMate.</p>
      <p>You can now add doctors, receive bookings, and manage your queue from your dashboard.</p>
      <p style="color:#64748b;font-size:14px">Thanks,<br>PulseMate Team</p>
    </div>`;
  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
  return true;
};

const sendClinicRejectedEmail = async (userEmail, userName, clinicName, reason) => {
  const subject = 'PulseMate Clinic Verification Update';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    `We have reviewed your clinic "${clinicName}" registration on PulseMate.`,
    '',
    'Unfortunately, your clinic verification has been rejected for the following reason:',
    '',
    reason || 'Please contact support for more details.',
    '',
    'You may edit your clinic details and resubmit for review from your dashboard.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>We have reviewed your clinic <strong>${clinicName}</strong> registration.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="color:#dc2626;font-weight:700;margin:0 0 6px">Reason for rejection:</p>
        <p style="margin:0;color:#7f1d1d">${reason || 'Please contact support for details.'}</p>
      </div>
      <p>You can edit your details and resubmit from your dashboard.</p>
      <p style="color:#64748b;font-size:14px">Thanks,<br>PulseMate Team</p>
    </div>`;
  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
  return true;
};

const sendClinicChangesRequestedEmail = async (userEmail, userName, clinicName, reason) => {
  const subject = 'Action Required: Changes Requested for Your PulseMate Clinic';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    `Our admin team has reviewed your clinic "${clinicName}" and requires some changes before approval.`,
    '',
    'Changes requested:',
    '',
    reason || 'Please check your dashboard for details.',
    '',
    'Please update your clinic information and resubmit from your dashboard.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>Our admin team has reviewed your clinic <strong>${clinicName}</strong> and requires some changes.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="color:#d97706;font-weight:700;margin:0 0 6px">Changes requested:</p>
        <p style="margin:0;color:#78350f">${reason || 'Please check your dashboard for details.'}</p>
      </div>
      <p>Please update your clinic information and resubmit from your dashboard.</p>
      <p style="color:#64748b;font-size:14px">Thanks,<br>PulseMate Team</p>
    </div>`;
  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
  return true;
};

const sendClinicSuspendedEmail = async (userEmail, userName, clinicName, reason) => {
  const subject = 'Important: Your PulseMate Clinic Has Been Suspended';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    `Your clinic "${clinicName}" on PulseMate has been suspended.`,
    '',
    'Reason:',
    reason || 'Please contact support for details.',
    '',
    'During suspension, your clinic will not appear in patient search and bookings will be disabled.',
    '',
    'Please contact PulseMate support if you believe this is an error.',
    '',
    'Thanks,',
    'PulseMate Team',
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${userName || 'there'},</p>
      <p>Your clinic <strong>${clinicName}</strong> has been <span style="color:#6b7280;font-weight:700">suspended</span>.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin:16px 0">
        <p style="color:#374151;font-weight:700;margin:0 0 6px">Reason:</p>
        <p style="margin:0;color:#6b7280">${reason || 'Please contact support for details.'}</p>
      </div>
      <p>Contact PulseMate support if you believe this is an error.</p>
      <p style="color:#64748b;font-size:14px">Thanks,<br>PulseMate Team</p>
    </div>`;
  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
  return true;
};

const sendClinicResubmittedEmail = async (adminEmail, clinicName, ownerName) => {
  const subject = `PulseMate: Clinic Resubmitted for Review — ${clinicName}`;
  const text = [
    'Hello Admin,',
    '',
    `Clinic "${clinicName}" owned by ${ownerName} has been resubmitted for review.`,
    '',
    'Please log in to the admin dashboard to review the updated details.',
    '',
    'Thanks,',
    'PulseMate System',
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello Admin,</p>
      <p>Clinic <strong>${clinicName}</strong> (owner: ${ownerName}) has been <span style="color:#2563eb;font-weight:700">resubmitted for review</span>.</p>
      <p>Please log in to the admin dashboard to review the updated details.</p>
      <p style="color:#64748b;font-size:14px">PulseMate System</p>
    </div>`;
  const sent = await sendTransactionalEmail({ to: adminEmail, subject, text, html });
  if (!sent) logEmail(subject, adminEmail, text);
  return true;
};

/**
 * Send doctor account credentials to newly created doctor
 */
const sendDoctorCredentialsEmail = async (doctorEmail, doctorName, clinicName, tempPassword) => {
  const subject = 'PulseMate Doctor Account Created';
  const text = [
    `Hello Dr. ${doctorName},`,
    '',
    `Your doctor account has been created by ${clinicName}.`,
    '',
    `Login Email: ${doctorEmail}`,
    `Temporary Password: ${tempPassword}`,
    '',
    'Please log in and complete your profile at:',
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/doctor`,
    '',
    'After logging in, you can update your password and complete your professional details.',
    '',
    'Thank you,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello Dr. ${doctorName},</p>
      <p>Your doctor account has been created by <strong>${clinicName}</strong>.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:700;color:#1e40af">Login Credentials</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${doctorEmail}</p>
        <p style="margin:4px 0"><strong>Temporary Password:</strong> <code style="background:#1e40af;color:#fff;padding:4px 8px;border-radius:4px;font-size:14px">${tempPassword}</code></p>
      </div>
      <p>Please log in and complete your profile:</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login/doctor" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700">Login to PulseMate</a></p>
      <p style="color:#64748b;font-size:14px;margin-top:20px">After logging in, you can update your password and complete your professional details.</p>
      <p style="color:#64748b;font-size:14px">Thank you,<br>PulseMate Team</p>
    </div>`;

  const sent = await sendTransactionalEmail({ to: doctorEmail, subject, text, html });
  if (!sent) logEmail(subject, doctorEmail, text);
  return true;
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendSuperAdminPasswordChangedSecurityEmail,
  sendSuperAdminResetEmail,
  sendClinicOwnerVerificationEmail,
  sendClinicOwnerVerificationOtpEmail,
  sendTransactionalEmail,
  sendClinicApprovedEmail,
  sendClinicRejectedEmail,
  sendClinicChangesRequestedEmail,
  sendClinicSuspendedEmail,
  sendClinicResubmittedEmail,
  sendDoctorCredentialsEmail,
};
