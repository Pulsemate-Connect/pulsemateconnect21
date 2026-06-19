import { Link } from 'react-router-dom';
import PulsemateLogo from '../../components/PulsemateLogo';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/"><PulsemateLogo size="md" theme="light" /></Link>
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: June 19, 2026 · Effective: June 19, 2026</p>

          <p className="text-slate-600 leading-relaxed mb-8">
            PulseMate Connect ("PulseMate", "we", "our", or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use the PulseMate mobile application and website (collectively, the "Service").
            Please read this policy carefully. By using the Service, you agree to the collection and use
            of information in accordance with this policy.
          </p>

          <Section title="1. Information We Collect">
            <p><strong>a) Phone Number</strong></p>
            <p>We collect your mobile phone number to create and authenticate your account using Firebase Phone Authentication (OTP). Your phone number is stored securely and used only for identity verification and account recovery. It is never shared with third parties for marketing purposes.</p>
            <p className="mt-2"><strong>b) Name and Profile Information</strong></p>
            <p>You may optionally provide your full name, date of birth, gender, blood group, city, emergency contact number, known allergies, and existing medical conditions. This information personalises your experience and assists healthcare providers.</p>
            <p className="mt-2"><strong>c) Location Data</strong></p>
            <p>With your explicit permission, we collect your device's precise GPS location (latitude and longitude) solely to show you nearby clinics and doctors. Location is collected only while the app is in use (foreground) and is never collected in the background. You can deny or revoke location permission at any time in your device settings.</p>
            <p className="mt-2"><strong>d) Payment Information</strong></p>
            <p>Appointment booking fees are processed via Razorpay, a PCI-DSS compliant payment gateway. PulseMate does not store your card numbers, UPI IDs, or banking credentials. We only store payment status, Razorpay Order ID, and Payment ID for appointment confirmation and refund purposes.</p>
            <p className="mt-2"><strong>e) Appointment and Health Data</strong></p>
            <p>We store appointment details including doctor, clinic, date, time, symptoms, queue position, and status. This data is used to provide the Service and is not sold to third parties.</p>
            <p className="mt-2"><strong>f) Device and Usage Data</strong></p>
            <p>We may collect device identifiers (FCM token for push notifications), app usage logs, and crash reports to improve app performance. This data is anonymised and not linked to your personal identity.</p>
          </Section>

          <Section title="2. Firebase Authentication">
            <p>PulseMate uses <strong>Firebase Authentication</strong> (provided by Google LLC) for phone number-based OTP login. Firebase processes your phone number to send an SMS verification code. Google's Privacy Policy applies to Firebase services: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></p>
            <p>Firebase may temporarily store your phone number and device token to deliver the OTP. This data is governed by Google's data processing terms.</p>
          </Section>

          <Section title="3. Push Notifications (FCM)">
            <p>With your permission, PulseMate sends push notifications via <strong>Firebase Cloud Messaging (FCM)</strong> to inform you about appointment confirmations, queue updates, reminders, and important health updates.</p>
            <p>You can disable notifications at any time through your device's notification settings or within the PulseMate app under Profile → Notification Settings.</p>
            <p>FCM tokens are stored on our servers and linked to your account to deliver relevant notifications. Tokens are deleted when you log out or delete your account.</p>
          </Section>

          <Section title="4. Razorpay Payments">
            <p>Booking fee payments are processed by <strong>Razorpay Software Private Limited</strong>. When you make a payment, you are subject to Razorpay's Privacy Policy: <a href="https://razorpay.com/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://razorpay.com/privacy/</a></p>
            <p>PulseMate receives only payment status confirmations (PAID/FAILED) and transaction references. We do not have access to your full payment credentials.</p>
          </Section>

          <Section title="5. Location Permission">
            <p>Location access is requested with explicit in-app disclosure before collection. Location is used <strong>only</strong> to find nearby clinics and doctors on the home screen. We do not track your location in the background, share it with third parties, or use it for advertising.</p>
            <p>To revoke location access: Go to your device's Settings → Apps → PulseMate → Permissions → Location → Deny.</p>
          </Section>

          <Section title="6. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your account</li>
              <li>To facilitate appointment bookings and queue management</li>
              <li>To process payments and issue refunds</li>
              <li>To send appointment reminders and queue updates</li>
              <li>To show relevant clinics and doctors near you</li>
              <li>To improve app performance and fix bugs</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell your personal data. We do <strong>not</strong> use your health information for advertising.</p>
          </Section>

          <Section title="7. Data Sharing">
            <p>We share your data only in the following limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Healthcare Providers:</strong> Your appointment details and symptoms are shared with the doctor/clinic you book with, solely to provide the medical service.</li>
              <li><strong>Firebase (Google):</strong> For authentication and push notifications.</li>
              <li><strong>Razorpay:</strong> For payment processing.</li>
              <li><strong>Cloudinary:</strong> For storing clinic logo and document images uploaded by clinic owners.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect rights and safety.</li>
            </ul>
          </Section>

          <Section title="8. Data Retention">
            <p>We retain your personal data for as long as your account is active or as needed to provide the Service. After account deletion, your PII (name, phone, email) is anonymised within 30 days. Appointment records are retained in anonymised form for legal and audit purposes.</p>
          </Section>

          <Section title="9. Account Deletion">
            <p>You have the right to delete your account at any time. Upon deletion:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name, phone number, and email are permanently anonymised</li>
              <li>All active appointments are cancelled</li>
              <li>FCM tokens are deleted</li>
              <li>Your profile and health information is cleared</li>
              <li>You are signed out of all devices immediately</li>
            </ul>
            <p className="mt-2">To delete your account:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>In-app:</strong> Profile → Delete Account</li>
              <li><strong>Web:</strong> <Link to="/delete-account" className="text-blue-600 hover:underline">pulsemateconnect.in/delete-account</Link></li>
              <li><strong>Email:</strong> support@pulsemateconnect.in with subject "Account Deletion Request"</li>
            </ul>
          </Section>

          <Section title="10. Security">
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>HTTPS encryption for all data in transit</li>
              <li>JWT tokens with short expiry for session management</li>
              <li>Passwords hashed using bcrypt</li>
              <li>Sensitive tokens stored in device's secure enclave (Expo SecureStore)</li>
              <li>Razorpay HMAC-SHA256 signature verification for payments</li>
              <li>Cloudinary for secure file storage</li>
            </ul>
          </Section>

          <Section title="11. Children's Privacy">
            <p>PulseMate is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, contact us at support@pulsemateconnect.in.</p>
          </Section>

          <Section title="12. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for location or notifications</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes via in-app notification or email. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="14. Contact Us">
            <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
            <div className="mt-2 p-4 bg-blue-50 rounded-xl">
              <p><strong>PulseMate Connect</strong></p>
              <p>Email: <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">support@pulsemateconnect.in</a></p>
              <p>Website: <a href="https://www.pulsemateconnect.in" className="text-blue-600 hover:underline">www.pulsemateconnect.in</a></p>
            </div>
          </Section>
        </div>
      </main>

      <footer className="text-center py-8 text-sm text-slate-400">
        <p>© 2026 PulseMate Connect. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-2">
          <Link to="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-600">Terms of Service</Link>
          <Link to="/delete-account" className="hover:text-slate-600">Delete Account</Link>
        </div>
      </footer>
    </div>
  );
}
