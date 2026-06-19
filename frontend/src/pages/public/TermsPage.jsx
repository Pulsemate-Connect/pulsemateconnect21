import { Link } from 'react-router-dom';
import PulsemateLogo from '../../components/PulsemateLogo';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: June 19, 2026</p>

          <p className="text-slate-600 leading-relaxed mb-8">
            Welcome to PulseMate Connect. By accessing or using our Service, you agree to be bound by
            these Terms of Service ("Terms"). Please read them carefully.
          </p>

          <Section title="1. Acceptance of Terms">
            <p>By creating an account or using PulseMate Connect, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>PulseMate Connect is a healthcare appointment booking and queue management platform that connects patients with verified clinics and doctors. The Service allows patients to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Search for doctors and clinics</li>
              <li>Book appointments online</li>
              <li>Track live queue positions</li>
              <li>Make platform booking fee payments</li>
              <li>Receive appointment notifications</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>You must provide a valid mobile number and complete OTP verification to create an account. You are responsible for maintaining the security of your account. PulseMate is not liable for losses due to unauthorised access.</p>
          </Section>

          <Section title="4. Booking and Payments">
            <p>A platform booking fee of ₹10 is charged per appointment (first appointment is free). Consultation fees are paid directly to the healthcare provider. All payments are processed securely via Razorpay.</p>
            <p>Refunds are subject to our refund policy. Contact support@pulsemateconnect.in for refund requests.</p>
          </Section>

          <Section title="5. Medical Disclaimer">
            <p>PulseMate is a technology platform and not a medical service provider. We do not provide medical advice, diagnosis, or treatment. Always seek qualified medical advice from licensed healthcare professionals.</p>
          </Section>

          <Section title="6. Account Deletion">
            <p>You may delete your account at any time via Profile → Delete Account or by emailing support@pulsemateconnect.in. Upon deletion, your personal data will be anonymised within 30 days as described in our Privacy Policy.</p>
          </Section>

          <Section title="7. Prohibited Activities">
            <ul className="list-disc pl-5 space-y-1">
              <li>Providing false medical or personal information</li>
              <li>Using the Service for any unlawful purpose</li>
              <li>Attempting to gain unauthorised access to our systems</li>
              <li>Interfering with the proper working of the Service</li>
            </ul>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>To the maximum extent permitted by law, PulseMate shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service. Our total liability shall not exceed the amounts paid by you in the six months preceding the claim.</p>
          </Section>

          <Section title="9. Governing Law">
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Karnataka, India.</p>
          </Section>

          <Section title="10. Contact">
            <p>For questions about these Terms: <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">support@pulsemateconnect.in</a></p>
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
