import LegalPageLayout from './LegalPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const toc = [
  { id: 'encryption',      label: '1. Data Encryption' },
  { id: 'authentication',  label: '2. Authentication' },
  { id: 'access-control',  label: '3. Access Control' },
  { id: 'secure-storage',  label: '4. Secure Storage' },
  { id: 'database',        label: '5. Database Security' },
  { id: 'api-security',    label: '6. API Security' },
  { id: 'reporting',       label: '7. Reporting Security Issues' },
];

export default function SecurityPolicyPage() {
  return (
    <LegalPageLayout
      title="Security Policy"
      subtitle="How PulseMate Connect protects your data and systems."
      lastUpdated="July 2026"
    >
      <p className="text-slate-600 leading-relaxed mb-8">
        Security is a core principle at PulseMate Connect. We take the protection of patient health
        data and personal information very seriously. This policy outlines the technical and
        organizational measures we implement to keep your data safe.
      </p>

      {/* Table of Contents */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <p className="text-sm font-semibold text-blue-800 mb-3">Table of Contents</p>
        <ol className="list-decimal list-inside space-y-1">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-blue-700 hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <Section id="encryption" title="1. Data Encryption">
        <p>All data transmitted between your device and PulseMate Connect servers is protected:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>
            <strong>In Transit:</strong> All communications are encrypted using{' '}
            <strong>HTTPS / TLS 1.2+</strong>. Plain HTTP connections are not accepted or used.
          </li>
          <li>
            <strong>At Rest:</strong> Sensitive data stored in our PostgreSQL database is encrypted
            using AES-256 encryption standards.
          </li>
          <li>
            <strong>Passwords:</strong> Staff and doctor passwords are hashed using{' '}
            <strong>bcrypt</strong> with appropriate salt rounds. Plain-text passwords are never stored.
          </li>
          <li>
            <strong>Payment Data:</strong> Payment processing is handled by Razorpay (PCI-DSS Level 1
            certified). We do not store card numbers, CVV, or full UPI credentials.
          </li>
        </ul>
      </Section>

      <Section id="authentication" title="2. Authentication">
        <p>We use multiple layers of authentication to protect accounts:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>
            <strong>JWT Access Tokens:</strong> Short-lived JSON Web Tokens (15-minute expiry) are
            used for authenticated API requests.
          </li>
          <li>
            <strong>Refresh Tokens:</strong> Secure refresh tokens (7-day expiry) are stored in
            HttpOnly cookies on the web and Expo SecureStore on mobile, preventing JavaScript-level
            access.
          </li>
          <li>
            <strong>Firebase Phone Auth:</strong> Patients authenticate using Firebase Phone
            Authentication (OTP-based), which provides phone number verification without storing
            passwords.
          </li>
          <li>
            <strong>Token Rotation:</strong> Refresh tokens are rotated on each use, invalidating
            old tokens and limiting the risk of token theft.
          </li>
          <li>
            <strong>Forced Logout:</strong> All active sessions are immediately invalidated upon
            account deletion or password change.
          </li>
        </ul>
      </Section>

      <Section id="access-control" title="3. Access Control">
        <p>
          PulseMate Connect implements <strong>Role-Based Access Control (RBAC)</strong> to ensure
          users can only access data and features relevant to their role:
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Patient', 'Own appointments, profile, queue status, payment history'],
                ['Doctor', 'Own schedule, assigned appointments, patient consultation data'],
                ['Receptionist', 'Clinic queue, walk-in bookings, appointment status updates'],
                ['Clinic Owner', 'Clinic profile, staff management, analytics, all clinic data'],
                ['Super Admin', 'Platform-wide administration, clinic verification, user management'],
              ].map(([role, access]) => (
                <tr key={role} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{role}</td>
                  <td className="px-4 py-3 text-slate-600">{access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Cross-role data access is strictly prohibited at the API level. All endpoints validate
          user role and ownership before returning data.
        </p>
      </Section>

      <Section id="secure-storage" title="4. Secure Storage">
        <p>We use platform-appropriate secure storage mechanisms for sensitive tokens:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>
            <strong>Expo SecureStore (Android):</strong> Authentication tokens on the Android app
            are stored in the device's secure hardware-backed storage (Android Keystore).
            These are isolated from other apps and cannot be extracted without device compromise.
          </li>
          <li>
            <strong>HttpOnly Cookies (Web):</strong> Refresh tokens on the web portal are stored
            as HttpOnly cookies, inaccessible to JavaScript and protected against XSS attacks.
          </li>
          <li>
            <strong>No Sensitive Data in AsyncStorage:</strong> Health data and authentication
            credentials are never stored in AsyncStorage (plaintext device storage).
          </li>
        </ul>
      </Section>

      <Section id="database" title="5. Database Security">
        <p>Our database infrastructure follows best practices for healthcare data protection:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>
            <strong>Managed PostgreSQL:</strong> Hosted on a managed cloud provider with access
            controls, VPC isolation, and network-level firewalls.
          </li>
          <li>
            <strong>Regular Backups:</strong> Automated daily backups with point-in-time recovery
            capability.
          </li>
          <li>
            <strong>Security Patches:</strong> Automated security patches are applied regularly
            to the database engine and operating system.
          </li>
          <li>
            <strong>Least Privilege:</strong> Database users have minimal required permissions.
            Application users cannot modify schema or access system tables.
          </li>
          <li>
            <strong>Audit Logging:</strong> Critical database operations are logged for audit
            and incident response purposes.
          </li>
        </ul>
      </Section>

      <Section id="api-security" title="6. API Security">
        <p>Our REST API implements multiple security controls:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>
            <strong>Rate Limiting:</strong> All public endpoints are rate-limited to prevent
            brute-force attacks and abuse.
          </li>
          <li>
            <strong>CORS Restrictions:</strong> Cross-Origin Resource Sharing is configured to
            allow requests only from approved domains (pulsemateconnect.in).
          </li>
          <li>
            <strong>Input Validation:</strong> All user inputs are validated and sanitised on
            the server side before processing.
          </li>
          <li>
            <strong>Parameterized Queries:</strong> All database queries use parameterized
            statements (via Prisma ORM) to prevent SQL injection attacks.
          </li>
          <li>
            <strong>HMAC Signature Verification:</strong> Payment webhooks from Razorpay are
            verified using HMAC-SHA256 signatures to prevent payment fraud.
          </li>
          <li>
            <strong>Helmet.js:</strong> HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
            are enforced on all API responses.
          </li>
        </ul>
      </Section>

      <Section id="reporting" title="7. Reporting Security Issues">
        <p>
          We take security vulnerabilities very seriously. If you discover a security issue or
          vulnerability in PulseMate Connect, please report it responsibly:
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-slate-900 mb-2">Security Disclosure Contact</p>
          <p className="text-sm text-slate-600 mb-1">
            Email:{' '}
            <a href="mailto:security@pulsemateconnect.in" className="text-blue-600 hover:underline">
              security@pulsemateconnect.in
            </a>
          </p>
          <p className="text-sm text-slate-600">
            We acknowledge all security reports within <strong>48 hours</strong> and aim to
            resolve critical issues within 7 days.
          </p>
        </div>
        <p>
          Please <strong>do not</strong> publicly disclose security vulnerabilities before we have
          had the opportunity to investigate and address them. We appreciate responsible disclosure
          and will credit researchers where appropriate.
        </p>
        <p>
          For general support inquiries, use{' '}
          <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
            support@pulsemateconnect.in
          </a>{' '}
          instead.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
