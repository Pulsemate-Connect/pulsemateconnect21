import LegalLayout, { Section, InfoBox } from './LegalLayout';

const FEATURES = [
  { icon: '📅', title: 'Smart Appointment Booking', desc: 'Book appointments with doctors at verified clinics in seconds. Real-time slot availability, instant confirmation.' },
  { icon: '📡', title: 'Live Queue Tracking', desc: 'Track your queue position in real time. Know exactly when your turn is coming — no more waiting in crowded lobbies.' },
  { icon: '🏥', title: 'Multi-Role Platform', desc: 'Designed for patients, doctors, receptionists, and clinic owners. Each role has a tailored experience.' },
  { icon: '💳', title: 'Integrated Payments', desc: 'Secure Razorpay-powered booking fee payments with automatic refunds for cancelled appointments.' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Get appointment confirmations, queue updates, and reminders via push notifications. Stay informed without checking the app.' },
  { icon: '🔒', title: 'Privacy & Security First', desc: 'Healthcare data deserves maximum protection. We use encryption, RBAC, and secure storage throughout the platform.' },
];

const PATIENT_BENEFITS = [
  'Find verified doctors and clinics near your location',
  'Book appointments 24/7 without phone calls',
  'Track your live queue position from home',
  'Receive real-time updates and reminders',
  'Manage all your appointments in one place',
  'Get instant refunds for cancelled appointments',
];

const PROVIDER_BENEFITS = [
  'Reduce front-desk load with digital bookings',
  'Manage doctor schedules and session slots easily',
  'Real-time queue dashboard for receptionists',
  'Reduce patient wait time frustration',
  'Built-in payment collection and tracking',
  'Grow patient reach with a searchable online presence',
];

export default function AboutPage() {
  return (
    <LegalLayout
      title="About PulseMate Connect"
      lastUpdated="July 17, 2026"
      toc={[
        { id: 'mission',  label: 'Mission & Vision' },
        { id: 'what',     label: 'What We Do' },
        { id: 'features', label: 'Key Features' },
        { id: 'benefits', label: 'Who We Serve' },
        { id: 'values',   label: 'Our Values' },
        { id: 'company',  label: 'Company Info' },
      ]}
      subtitle="Simplifying healthcare access in India through technology."
    >
      <Section title="Mission & Vision" id="mission">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
            <p className="text-2xl mb-2">🎯</p>
            <p className="font-bold text-slate-900 dark:text-white mb-2">Our Mission</p>
            <p className="text-slate-600 dark:text-slate-300 text-sm">To make quality healthcare accessible to every Indian by eliminating the friction between patients and doctors through intelligent, reliable technology.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
            <p className="text-2xl mb-2">🔭</p>
            <p className="font-bold text-slate-900 dark:text-white mb-2">Our Vision</p>
            <p className="text-slate-600 dark:text-slate-300 text-sm">A future where no patient waits needlessly in a clinic lobby, and no doctor loses time to scheduling chaos — powered by digital infrastructure built for India.</p>
          </div>
        </div>
      </Section>

      <Section title="What We Do" id="what">
        <p>PulseMate Connect is a full-stack healthcare appointment management platform built for the Indian healthcare ecosystem. It bridges the gap between patients seeking timely care and clinics working to deliver it efficiently.</p>
        <p>We handle the entire appointment journey — from doctor discovery and booking, through real-time queue management, to payment processing and notifications — so that healthcare providers can focus on care, and patients can focus on getting better.</p>
        <InfoBox type="success">PulseMate Connect is available as a native Android app and a progressive web application, accessible from any device.</InfoBox>
      </Section>

      <Section title="Key Features" id="features">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-5">
              <p className="text-2xl mb-2">{f.icon}</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{f.title}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Who We Serve" id="benefits">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
          <div>
            <p className="font-bold text-slate-900 dark:text-white mb-3">👤 For Patients</p>
            <ul className="space-y-2">
              {PATIENT_BENEFITS.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white mb-3">🏥 For Clinics & Doctors</p>
            <ul className="space-y-2">
              {PROVIDER_BENEFITS.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-blue-500 font-bold shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Our Values" id="values">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {[
            { icon: '🤝', val: 'Trust', desc: 'Every interaction on PulseMate is built on verified identities and honest information.' },
            { icon: '⚡', val: 'Efficiency', desc: 'Healthcare time is precious. We exist to save it — for patients and providers alike.' },
            { icon: '🛡️', val: 'Privacy', desc: 'Your health data is personal. We protect it with the same care you\'d expect from your doctor.' },
          ].map((v, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-center bg-white dark:bg-slate-800/50">
              <p className="text-3xl mb-2">{v.icon}</p>
              <p className="font-bold text-slate-900 dark:text-white mb-1">{v.val}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{v.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Company Info" id="company">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
          <p className="font-bold text-slate-900 dark:text-white text-lg mb-4">PULSEMATE CONNECT</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div><span className="font-semibold text-slate-800 dark:text-slate-200">Type:</span> Healthcare Technology Platform</div>
            <div><span className="font-semibold text-slate-800 dark:text-slate-200">Founded:</span> 2025</div>
            <div><span className="font-semibold text-slate-800 dark:text-slate-200">Based in:</span> Karwar, Karnataka, India</div>
            <div><span className="font-semibold text-slate-800 dark:text-slate-200">Platform:</span> Android App + Web</div>
            <div><span className="font-semibold text-slate-800 dark:text-slate-200">Website:</span> <a href="https://pulsemateconnect.in" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">pulsemateconnect.in</a></div>
            <div><span className="font-semibold text-slate-800 dark:text-slate-200">Email:</span> <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 underline">support@pulsemateconnect.in</a></div>
          </div>
        </div>
      </Section>
    </LegalLayout>
  );
}
