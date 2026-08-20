import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const TOC = [
  { id: 'commitment',  label: '1. Our Security Commitment' },
  { id: 'encryption',  label: '2. Data Encryption (HTTPS/TLS)' },
  { id: 'jwt',         label: '3. JWT Authentication' },
  { id: 'storage',     label: '4. Secure Token Storage' },
  { id: 'rbac',        label: '5. Access Control & RBAC' },
  { id: 'database',    label: '6. Database Protection' },
  { id: 'payments',    label: '7. Payment Security (Razorpay)' },
  { id: 'files',       label: '8. File Storage (Cloudinary)' },
  { id: 'disclosure',  label: '9. Vulnerability Disclosure' },
  { id: 'contact',     label: '10. Contact' },
];

export default function SecurityPolicyPage() {
  return (
    <LegalLayout
      title="Security Policy"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="How PulseMate Connect protects your data and maintains platform security."
    >
      <Section title="1. Our Security Commitment" id="commitment">
        <p>PulseMate Connect takes the security of your personal and health-related data seriously. We implement layered security controls following industry best practices to protect data in transit, at rest, and in use.</p>
        <InfoBox type="success">PulseMate operates on a security-first architecture. All components — mobile app, web platform, API, and database — are independently secured with appropriate controls.</InfoBox>
      </Section>

      <Section title="2. Data Encryption (HTTPS/TLS)" id="encryption">
        <p>All communication between PulseMate clients (mobile app, web) and our servers is encrypted using <strong>HTTPS with TLS 1.2 or higher</strong>. We enforce HTTPS-only connections and reject plain HTTP requests.</p>
        <Ul items={[
          'API requests are encrypted in transit via TLS',
          'HSTS (HTTP Strict Transport Security) headers enforced on the web platform',
          'API endpoints are accessed only over HTTPS; no fallback to HTTP',
          'Sensitive response data (tokens, payment references) is never logged',
        ]} />
      </Section>

      <Section title="3. JWT Authentication" id="jwt">
        <p>User sessions are managed using <strong>JSON Web Tokens (JWT)</strong>. JWTs are short-lived access tokens signed with a server-side secret key. Expired tokens are rejected automatically.</p>
        <Ul items={[
          'Access tokens expire after a short window to limit exposure',
          'Refresh tokens are rotated on each use (one-time use)',
          'Tokens are invalidated immediately on logout or account deletion',
          'Role claims embedded in JWTs are verified server-side on every request',
        ]} />
      </Section>

      <Section title="4. Secure Token Storage (Expo SecureStore)" id="storage">
        <p>On mobile devices, authentication tokens are stored using <strong>Expo SecureStore</strong>, which uses the device's hardware-backed secure enclave (Android Keystore / iOS Keychain).</p>
        <Ul items={[
          'Tokens are never stored in AsyncStorage or plain local storage',
          'Tokens cannot be accessed by other apps on the device',
          'Tokens are cleared when the app is uninstalled',
          'Biometric authentication can be required to access stored tokens on supported devices',
        ]} />
      </Section>

      <Section title="5. Access Control & RBAC" id="rbac">
        <p>PulseMate implements <strong>Role-Based Access Control (RBAC)</strong>. Each user role (Patient, Doctor, Receptionist, Clinic Owner, Super Admin) has strictly scoped permissions.</p>
        <Ul items={[
          'Patients can only access their own appointments, profile, and payments',
          'Doctors can only access appointments at their registered clinic',
          'Clinic Owners can only manage their own clinic data',
          'Receptionists have queue management access limited to their assigned clinic',
          'Admin accounts require multi-level role verification',
          'All API routes are protected by server-side role middleware',
        ]} />
      </Section>

      <Section title="6. Database Protection (PostgreSQL)" id="database">
        <p>Patient data is stored in a <strong>PostgreSQL</strong> database with the following protections:</p>
        <Ul items={[
          'Passwords are hashed using bcrypt with a work factor of 12',
          'Database credentials are stored as environment variables, never in source code',
          'Connection pooling with connection limits to prevent DoS',
          'Regular automated backups with encrypted storage',
          'Database access is restricted to application servers only; no direct public access',
        ]} />
      </Section>

      <Section title="7. Payment Security (Razorpay HMAC)" id="payments">
        <p>All payment integrations use <strong>Razorpay</strong>, which is PCI-DSS Level 1 compliant. PulseMate never processes raw card or UPI data directly.</p>
        <Ul items={[
          'Payment webhooks are verified using HMAC-SHA256 signature validation',
          'Only Razorpay-signed webhook events update payment status',
          'Payment Order IDs are created server-side to prevent client-side manipulation',
          'Razorpay Checkout opens in an isolated WebView — payment data never touches our servers',
        ]} />
      </Section>

      <Section title="8. File Storage (Cloudinary)" id="files">
        <p>Clinic images, doctor photos, and verification documents are stored on <strong>Cloudinary</strong>, a cloud-based media management platform.</p>
        <Ul items={[
          'Files are accessed via signed URLs with expiry for sensitive documents',
          'Upload access requires authenticated clinic owner or admin session',
          'Clinic verification documents are accessible only to Super Admin accounts',
          'Malware scanning is applied to uploaded files before storage',
        ]} />
      </Section>

      <Section title="9. Vulnerability Disclosure" id="disclosure">
        <p>If you discover a security vulnerability in PulseMate Connect, we encourage responsible disclosure. Please report it privately before public disclosure to give us time to address the issue.</p>
        <InfoBox type="warning">
          <p className="font-semibold mb-1">How to report a vulnerability:</p>
          <p>Email: <a href="mailto:support@pulsemateconnect.in" className="underline">support@pulsemateconnect.in</a></p>
          <p>Subject: "Security Vulnerability Report — [Brief Description]"</p>
          <p>We will acknowledge receipt within 48 hours and provide a fix timeline within 7 business days for critical issues.</p>
        </InfoBox>
        <p>We do not take legal action against good-faith security researchers who report issues responsibly.</p>
      </Section>

      <Section title="10. Contact" id="contact">
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
