import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './legal/LegalLayout';

const TOC = [
  { id: 'intro',       label: '1. Introduction' },
  { id: 'collected',   label: '2. Information Collected' },
  { id: 'firebase',    label: '3. Firebase Authentication' },
  { id: 'fcm',         label: '4. Push Notifications (FCM)' },
  { id: 'razorpay',    label: '5. Razorpay Payments' },
  { id: 'location',    label: '6. Location Permission' },
  { id: 'camera',      label: '7. Camera Permission' },
  { id: 'files',       label: '8. File Upload Permission' },
  { id: 'usage',       label: '9. How We Use Information' },
  { id: 'sharing',     label: '10. Data Sharing' },
  { id: 'security',    label: '11. Data Storage & Security' },
  { id: 'retention',   label: '12. Data Retention' },
  { id: 'rights',      label: '13. User Rights' },
  { id: 'deletion',    label: '14. Account Deletion' },
  { id: 'children',    label: '15. Children\'s Privacy' },
  { id: 'updates',     label: '16. Policy Updates' },
  { id: 'contact',     label: '17. Contact Us' },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="How PulseMate Connect collects, uses, and protects your personal information."
    >
      <Section title="1. Introduction" id="intro">
        <p>PulseMate Connect ("PulseMate", "we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web platform (collectively, the "Service").</p>
        <p>By using the Service, you agree to the practices described in this policy. If you do not agree, please discontinue use of the Service.</p>
        <InfoBox type="info">This policy applies to all users of PulseMate Connect, including patients, doctors, clinic owners, and receptionists registered on the platform.</InfoBox>
      </Section>

      <Section title="2. Information Collected" id="collected">
        <p><strong>Phone Number &amp; OTP</strong> — Your mobile number is used for Firebase OTP authentication. It is stored securely and never shared for marketing purposes.</p>
        <p><strong>Profile Information</strong> — Name, date of birth, gender, blood group, city, emergency contact, allergies, and existing medical conditions you optionally provide to personalise your care experience.</p>
        <p><strong>Appointment Data</strong> — Doctor, clinic, slot, symptoms, queue position, and appointment status — necessary to deliver the booking service.</p>
        <p><strong>Clinic &amp; Doctor Information</strong> — Clinic name, address, registration documents, and doctor credentials uploaded during onboarding for verification.</p>
        <p><strong>Device &amp; Analytics Data</strong> — FCM tokens, crash logs, and anonymised usage metrics to improve app stability. These are not linked to your personal identity.</p>
        <p><strong>Payment References</strong> — Razorpay Order ID, Payment ID, and status. We never store card numbers or UPI credentials.</p>
      </Section>

      <Section title="3. Firebase Authentication" id="firebase">
        <p>We use <strong>Firebase Authentication</strong> (Google LLC) for phone-based OTP login. Firebase processes your phone number to deliver an SMS verification code. Your data under Firebase is governed by Google's Privacy Policy: <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></p>
        <p>Firebase may temporarily retain your phone number and device token for the duration of OTP delivery. PulseMate does not access raw OTP codes — Firebase handles verification on our behalf.</p>
      </Section>

      <Section title="4. Push Notifications (FCM)" id="fcm">
        <p>With your permission, PulseMate sends push notifications via <strong>Firebase Cloud Messaging</strong> for appointment confirmations, queue updates, payment receipts, and reminders.</p>
        <Ul items={[
          'You can disable notifications in device Settings → Apps → PulseMate → Notifications',
          'Or within the app: Profile → Notification Settings',
          'FCM tokens are deleted when you log out or delete your account',
        ]} />
      </Section>

      <Section title="5. Razorpay Payments" id="razorpay">
        <p>Booking fees are processed by <strong>Razorpay Software Private Limited</strong>, a PCI-DSS compliant payment gateway. Razorpay's Privacy Policy applies: <a href="https://razorpay.com/privacy/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">razorpay.com/privacy</a></p>
        <p>PulseMate only receives payment status (PAID/FAILED) and transaction references. We never access or store your card numbers, CVV, UPI ID, or net banking credentials.</p>
      </Section>

      <Section title="6. Location Permission" id="location">
        <p>Location access is requested with an explicit in-app prompt. We use your GPS coordinates solely to display nearby clinics and doctors on the home screen.</p>
        <InfoBox type="warning">Location is accessed only while the app is in the foreground. We never track location in the background or share it with advertisers.</InfoBox>
        <p>To revoke: Device Settings → Apps → PulseMate → Permissions → Location → Deny.</p>
      </Section>

      <Section title="7. Camera Permission" id="camera">
        <p>Camera access may be requested for clinic owners and doctors to upload profile photos or clinic images during registration. Images are securely stored on Cloudinary.</p>
        <p>Patients are not required to grant camera access. The app functions fully without it.</p>
      </Section>

      <Section title="8. File Upload Permission" id="files">
        <p>Clinic owners may upload registration certificates and doctor credential documents as part of our verification process. Files are stored on Cloudinary with restricted access and reviewed only by authorised PulseMate administrators.</p>
        <p>Patients may upload a profile photo optionally. No medical documents or reports are collected from patients.</p>
      </Section>

      <Section title="9. How We Use Information" id="usage">
        <Ul items={[
          'Create and manage your account securely',
          'Facilitate appointment bookings and queue management',
          'Process payments and issue eligible refunds',
          'Send appointment reminders and real-time queue notifications',
          'Show clinics and doctors relevant to your location',
          'Verify clinic and doctor credentials before onboarding',
          'Improve app performance and resolve technical issues',
          'Comply with applicable legal obligations under Indian law',
        ]} />
        <InfoBox type="success">We do NOT sell your personal data. We do NOT use your health information for targeted advertising.</InfoBox>
      </Section>

      <Section title="10. Data Sharing" id="sharing">
        <p>We share your data only in these limited circumstances:</p>
        <Ul items={[
          'Healthcare Providers — Appointment and symptom details with the doctor/clinic you book with, to deliver the medical service',
          'Google Firebase — For OTP authentication and FCM push notifications',
          'Razorpay — For payment processing',
          'Cloudinary — For secure image and document storage',
          'Legal Authorities — When required by Indian law, court order, or to protect rights and safety',
        ]} />
      </Section>

      <Section title="11. Data Storage & Security" id="security">
        <Ul items={[
          'All data in transit is encrypted via HTTPS/TLS 1.2+',
          'JWT tokens used for session management with short expiry windows',
          'Passwords and sensitive tokens hashed with bcrypt',
          'Mobile tokens stored in Expo SecureStore (hardware-backed secure enclave)',
          'Razorpay webhook signatures verified with HMAC-SHA256',
          'Database hosted on secured PostgreSQL infrastructure',
        ]} />
      </Section>

      <Section title="12. Data Retention" id="retention">
        <p>Personal data is retained while your account is active. Upon account deletion, your PII (name, phone number) is anonymised within 30 days. Appointment records are retained in anonymised form for legal and audit purposes as required under Indian healthcare regulations.</p>
      </Section>

      <Section title="13. User Rights" id="rights">
        <p>Under applicable privacy law, you have the right to:</p>
        <Ul items={[
          'Access the personal data we hold about you',
          'Correct inaccurate or incomplete information',
          'Request deletion of your account and personal data',
          'Withdraw consent for location access or push notifications at any time',
          'Lodge a complaint with a data protection authority',
        ]} />
        <p>To exercise any right, contact us at <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 underline">support@pulsemateconnect.in</a>.</p>
      </Section>

      <Section title="14. Account Deletion" id="deletion">
        <p>You can delete your account at any time. Upon deletion:</p>
        <Ul items={[
          'Your name, phone number, and profile data are permanently anonymised',
          'All active appointments are cancelled with applicable refunds',
          'FCM push notification tokens are deleted',
          'You are signed out of all devices immediately',
        ]} />
        <p>Deletion requests are processed within 30 days. See our full <a href="/delete-account" className="text-blue-600 underline">Data Deletion Policy</a>.</p>
      </Section>

      <Section title="15. Children's Privacy" id="children">
        <p>PulseMate Connect is not intended for individuals under 13 years of age. We do not knowingly collect personal data from children. If you believe a child has registered on our platform, contact us immediately and we will remove their data.</p>
      </Section>

      <Section title="16. Policy Updates" id="updates">
        <p>We may update this Privacy Policy periodically. Significant changes will be communicated via in-app notification or email. Continued use of the Service after any update constitutes acceptance of the revised policy. The "Last Updated" date at the top reflects the most recent revision.</p>
      </Section>

      <Section title="17. Contact Us" id="contact">
        <p>For privacy-related queries or to exercise your rights, contact:</p>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
