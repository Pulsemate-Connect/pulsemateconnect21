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
  const subject = 'Reset your PulseMate password';
  const text = [
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
    'Thanks,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:500px">
      <p>Hello ${userName || 'there'},</p>
      <p>We received a request to reset your PulseMate account password.</p>
      <p><a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700">Reset Password</a></p>
      <p style="color:#64748b;font-size:13px">This link will expire in 15 minutes.</p>
      <p style="color:#64748b;font-size:13px">If you did not request this, you can safely ignore this email.</p>
      <p style="color:#64748b;font-size:13px">Thanks,<br>PulseMate Team</p>
    </div>`;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
  return true;
};

const sendPasswordChangedEmail = async (userEmail, userName) => {
  const subject = 'Your PulseMate password was changed';
  const text = [
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

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:500px">
      <p>Hello ${userName || 'there'},</p>
      <p>Your PulseMate account password was <strong>successfully changed</strong>.</p>
      <p>If this was you, no action is needed.</p>
      <p style="color:#dc2626">If this was not you, contact support immediately.</p>
      <p style="color:#64748b;font-size:13px">Thanks,<br>PulseMate Team</p>
    </div>`;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
  return true;
};

const sendSuperAdminPasswordChangedSecurityEmail = async (userEmail, userName) => {
  const subject = 'Security Alert: PulseMate Super Admin Password Changed';
  const text = [
    `Hello ${userName || 'there'},`,
    '',
    'Your PulseMate Super Admin password was successfully changed.',
    '',
    'If this was not you, contact the technical owner immediately.',
    '',
    'Thanks,',
    'PulseMate Security Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:500px">
      <p>Hello ${userName || 'there'},</p>
      <p>🔐 Your PulseMate <strong>Super Admin</strong> password was successfully changed.</p>
      <p style="color:#dc2626;font-weight:700">If this was not you, contact the technical owner immediately.</p>
      <p style="color:#64748b;font-size:13px">Thanks,<br>PulseMate Security Team</p>
    </div>`;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
  return true;
};

const sendSuperAdminResetEmail = async (userEmail, resetLink, userName) => {
  const subject = 'Security Alert: PulseMate Super Admin Password Reset';
  const text = [
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

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:500px">
      <p>Hello ${userName || 'there'},</p>
      <p>🔐 A password reset was requested for your PulseMate <strong>Super Admin</strong> account.</p>
      <p><a href="${resetLink}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700">Reset Super Admin Password</a></p>
      <p style="color:#64748b;font-size:13px">This link will expire in 10 minutes.</p>
      <p style="color:#dc2626;font-size:13px;font-weight:700">If this was not you, contact the technical owner immediately.</p>
      <p style="color:#64748b;font-size:13px">Thanks,<br>PulseMate Security Team</p>
    </div>`;

  const sent = await sendTransactionalEmail({ to: userEmail, subject, text, html });
  if (!sent) logEmail(subject, userEmail, text);
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

/**
 * Send doctor invitation email
 */
const sendDoctorInvitationEmail = async (doctorEmail, doctorName, clinicName, clinicAddress, clinicCity, invitationToken) => {
  const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/doctor/invitation/${invitationToken}`;
  
  const subject = `🏥 ${clinicName} invited you to join their clinic on PulseMate`;
  
  const text = [
    `Hello Dr. ${doctorName},`,
    '',
    `${clinicName} has invited you to join their clinic on PulseMate Connect.`,
    '',
    '📍 Clinic Details:',
    `Clinic Name: ${clinicName}`,
    `Location: ${clinicAddress}, ${clinicCity}`,
    '',
    'To accept this invitation and complete your professional profile:',
    acceptLink,
    '',
    '✅ Next Steps:',
    '1. Click the link above or log in to PulseMate with your mobile number',
    '2. Accept the invitation',
    '3. Complete your professional profile with your credentials',
    '4. Submit for PulseMate admin verification',
    '5. Once verified, you will be active at this clinic',
    '',
    '💡 Important:',
    '• You will provide your own professional credentials and documents',
    '• PulseMate admin will verify your qualifications before activation',
    '• This ensures patient safety and trust',
    '',
    'If you did not expect this invitation, you can safely ignore this email.',
    '',
    'Thank you,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:600px">
      <div style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:24px;border-radius:12px 12px 0 0">
        <h2 style="color:#fff;margin:0;font-size:22px">🏥 Clinic Invitation</h2>
      </div>
      
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px">
        <p style="font-size:16px;margin:0 0 20px">Hello <strong>Dr. ${doctorName}</strong>,</p>
        
        <p style="font-size:15px;margin:0 0 20px">
          <strong>${clinicName}</strong> has invited you to join their clinic on PulseMate Connect.
        </p>
        
        <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px;margin:20px 0;border-radius:4px">
          <p style="margin:0 0 8px;font-weight:700;color:#1e40af;font-size:14px">📍 Clinic Details</p>
          <p style="margin:4px 0;font-size:14px"><strong>Clinic Name:</strong> ${clinicName}</p>
          <p style="margin:4px 0;font-size:14px"><strong>Location:</strong> ${clinicAddress}, ${clinicCity}</p>
        </div>
        
        <p style="font-size:15px;margin:20px 0">To accept this invitation and join the clinic:</p>
        
        <div style="text-align:center;margin:28px 0">
          <a href="${acceptLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;box-shadow:0 4px 6px rgba(37,99,235,0.2)">Accept Invitation</a>
        </div>
        
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:24px 0">
          <p style="margin:0 0 12px;font-weight:700;color:#1e40af;font-size:14px">✅ Next Steps:</p>
          <ol style="margin:8px 0;padding-left:20px;color:#1e3a8a;font-size:13px">
            <li style="margin:4px 0">Click the button above or log in to PulseMate</li>
            <li style="margin:4px 0">Accept the invitation</li>
            <li style="margin:4px 0">Complete your professional profile with your credentials</li>
            <li style="margin:4px 0">Submit for PulseMate admin verification</li>
            <li style="margin:4px 0">Once verified, you will be active at this clinic</li>
          </ol>
        </div>
        
        <div style="background:#fef3c7;border:1px solid#fde68a;border-radius:8px;padding:16px;margin:24px 0">
          <p style="margin:0 0 8px;font-weight:700;color:#d97706;font-size:14px">💡 Important:</p>
          <ul style="margin:8px 0;padding-left:20px;color:#78350f;font-size:13px">
            <li style="margin:4px 0">You will provide your own professional credentials and documents</li>
            <li style="margin:4px 0">PulseMate admin will verify your qualifications before activation</li>
            <li style="margin:4px 0">This ensures patient safety and trust</li>
          </ul>
        </div>
        
        <p style="color:#6b7280;font-size:13px;margin:24px 0 0">
          If you did not expect this invitation, you can safely ignore this email.
        </p>
        
        <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:20px">
          <p style="color:#9ca3af;font-size:13px;margin:0">
            Thank you,<br>
            <strong style="color:#6b7280">PulseMate Team</strong>
          </p>
        </div>
      </div>
    </div>`;

  const sent = await sendTransactionalEmail({ to: doctorEmail, subject, text, html });
  if (!sent) logEmail(subject, doctorEmail, text);
  return true;
};

/**
 * Send Email OTP for verification
 */
const sendEmailOtp = async (userEmail, userName, otp) => {
  const subject = 'Verify your email - PulseMate Connect';
  const text = [
    `Hi ${userName || 'Doctor'},`,
    '',
    `Your email verification code is: ${otp}`,
    '',
    'This code will expire in 10 minutes.',
    '',
    'If you did not request this code, please ignore this email.',
    '',
    'Best regards,',
    'PulseMate Team',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏥 PulseMate Connect</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${userName || 'Doctor'},</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #666; margin-bottom: 10px;">Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #888; font-size: 14px;">⏰ This code will expire in 10 minutes.</p>
        <p style="color: #888; font-size: 14px;">If you did not request this code, please ignore this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Best regards,<br>
            The PulseMate Team
          </p>
        </div>
      </div>
    </div>
  `;

  return sendTransactionalEmail({ to: userEmail, subject, text, html });
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
  sendDoctorInvitationEmail,
  sendEmailOtp,
};
