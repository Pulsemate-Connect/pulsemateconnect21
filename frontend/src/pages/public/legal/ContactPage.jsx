import { Link } from 'react-router-dom';
import LegalLayout, { Section, InfoBox, LEGAL_PAGES } from './LegalLayout';

const FAQ = [
  {
    q: 'How do I cancel an appointment?',
    a: 'Open the PulseMate app → Appointments tab → Select the appointment → Tap "Cancel Appointment". Cancellations made 2+ hours before the slot qualify for a full refund.',
  },
  {
    q: 'My payment was deducted but the booking isn\'t confirmed. What do I do?',
    a: 'Wait up to 10 minutes for Razorpay to confirm the payment status. If it\'s still not confirmed, email us with your Razorpay Payment ID or bank transaction reference and we\'ll resolve it within 2 business days.',
  },
  {
    q: 'How do I delete my account and personal data?',
    a: 'Go to Profile → scroll to the bottom → tap "Delete Account". Alternatively, email support@pulsemateconnect.in with the subject "Account Deletion Request". See our Data Deletion Policy for full details.',
  },
  {
    q: 'How do I register my clinic on PulseMate Connect?',
    a: 'Visit pulsemateconnect.in/register/clinic-owner and complete the registration form. You will need to upload your clinic registration documents. Our team will review and verify your application within 2–3 business days.',
  },
  {
    q: 'Is my medical and personal data safe with PulseMate?',
    a: 'Yes. All data is encrypted in transit using HTTPS/TLS. Tokens are stored in hardware-backed secure storage. We never sell your personal data or use your health information for advertising. See our Privacy Policy and Security Policy for full details.',
  },
];

export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact Us"
      lastUpdated="July 17, 2026"
      toc={[
        { id: 'reach',    label: 'Get in Touch' },
        { id: 'faq',      label: 'Frequently Asked Questions' },
        { id: 'policies', label: 'Legal & Policy Links' },
      ]}
      subtitle="We're here to help. Reach out to the PulseMate Connect team."
    >
      {/* Contact Cards */}
      <Section title="Get in Touch" id="reach">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-2xl mb-2">📧</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Patient & General Support</p>
            <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 dark:text-blue-400 underline text-sm break-all">
              support@pulsemateconnect.in
            </a>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Appointments, refunds, account issues</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-emerald-50 dark:bg-emerald-900/20">
            <p className="text-2xl mb-2">💻</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Developer / Technical</p>
            <a href="mailto:dev@pulsemateconnect.in" className="text-blue-600 dark:text-blue-400 underline text-sm break-all">
              dev@pulsemateconnect.in
            </a>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">API, integration, and technical queries</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-2xl mb-2">🌐</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Website</p>
            <a href="https://pulsemateconnect.in" className="text-blue-600 dark:text-blue-400 underline text-sm" target="_blank" rel="noopener noreferrer">
              pulsemateconnect.in
            </a>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Book appointments, register clinic/doctor</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-amber-50 dark:bg-amber-900/20">
            <p className="text-2xl mb-2">📍</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Address</p>
            <p className="text-slate-700 dark:text-slate-300 text-sm">Karwar, Karnataka</p>
            <p className="text-slate-700 dark:text-slate-300 text-sm">India — 581301</p>
          </div>
        </div>

        <InfoBox type="info">
          <p>Support hours: Monday to Saturday, 9:00 AM – 6:00 PM IST. We typically respond to emails within 2 business days.</p>
        </InfoBox>
      </Section>

      {/* FAQ */}
      <Section title="Frequently Asked Questions" id="faq">
        <div className="space-y-4 mt-2">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800">
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-2">Q: {item.q}</p>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Policy Links */}
      <Section title="Legal & Policy Links" id="policies">
        <p>For detailed information about our practices and policies, refer to:</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {LEGAL_PAGES.map(p => (
            <Link key={p.path} to={p.path}
              className="text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-2 rounded-full transition">
              {p.label}
            </Link>
          ))}
        </div>
      </Section>
    </LegalLayout>
  );
}
