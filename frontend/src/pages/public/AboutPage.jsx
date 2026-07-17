import { Link } from 'react-router-dom';
import LegalPageLayout from './LegalPageLayout';

const features = [
  { icon: '📅', title: 'Book Appointments',       desc: 'Online appointment booking with verified doctors across India.' },
  { icon: '🔢', title: 'Real-Time Queue Tracking', desc: 'Live token and queue status so you know exactly when your turn is.' },
  { icon: '🚶', title: 'Walk-In Management',        desc: 'Clinics manage walk-in patients digitally, reducing chaos.' },
  { icon: '📄', title: 'Digital Prescriptions',     desc: 'Doctors issue digital prescriptions stored in your appointment history.' },
  { icon: '🏥', title: 'Multi-Session Management',  desc: 'Clinics run multiple doctor sessions simultaneously with ease.' },
  { icon: '📊', title: 'Patient & Doctor Dashboards', desc: 'Dedicated dashboards for patients, doctors, and clinic management.' },
];

const forCards = [
  {
    title: 'For Patients',
    icon: '🧑‍⚕️',
    color: 'bg-blue-50 border-blue-200',
    titleColor: 'text-blue-800',
    items: [
      'Find verified doctors near you',
      'Book appointments without phone calls',
      'Track your queue position live',
      'View your full appointment history',
      'Receive real-time notifications',
    ],
  },
  {
    title: 'For Doctors',
    icon: '👨‍⚕️',
    color: 'bg-emerald-50 border-emerald-200',
    titleColor: 'text-emerald-800',
    items: [
      'Manage your daily schedule easily',
      'View upcoming appointments and queue',
      'Issue digital prescriptions',
      'Track consultation history',
      'Reduce administrative workload',
    ],
  },
  {
    title: 'For Clinics',
    icon: '🏥',
    color: 'bg-violet-50 border-violet-200',
    titleColor: 'text-violet-800',
    items: [
      'Run a paperless appointment system',
      'Manage multiple doctor sessions',
      'Efficient walk-in queue management',
      'Staff access controls (owner, doctor, receptionist)',
      'Analytics and appointment overview',
    ],
  },
];

export default function AboutPage() {
  return (
    <LegalPageLayout
      title="About PulseMate Connect"
      subtitle="Healthcare appointment and queue management platform — built for India."
      lastUpdated="July 2026"
    >
      {/* Mission & Vision */}
      <div className="grid gap-4 md:grid-cols-2 mb-10">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Our Mission</h2>
          <p className="text-blue-800 text-sm leading-relaxed">
            To make healthcare <strong>accessible, organized, and transparent</strong> for every
            patient in India — regardless of where they live or how tech-savvy they are.
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <div className="text-3xl mb-3">🌟</div>
          <h2 className="text-lg font-bold text-emerald-900 mb-2">Our Vision</h2>
          <p className="text-emerald-800 text-sm leading-relaxed">
            A future where <strong>patients never wait blindly</strong>, doctors operate efficiently,
            and clinics run without chaos — powered by simple, reliable technology.
          </p>
        </div>
      </div>

      {/* What We Do */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">
          What We Do
        </h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          PulseMate Connect is a <strong>healthcare appointment booking and live queue management
          platform</strong> that connects patients with doctors and clinics across India.
        </p>
        <p className="text-slate-600 leading-relaxed mb-6">
          We solve a problem every Indian patient knows too well — arriving at a clinic, waiting
          for hours without any information, missing work or school, and leaving without seeing a
          doctor. PulseMate Connect replaces that experience with digital transparency and control.
        </p>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <p className="font-semibold text-slate-900 text-sm mb-1">{feature.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For Patients / Doctors / Clinics */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
          Who Is PulseMate Connect For?
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {forCards.map((card) => (
            <div key={card.title} className={`border rounded-2xl p-5 ${card.color}`}>
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className={`font-bold text-base mb-3 ${card.titleColor}`}>{card.title}</h3>
              <ul className="space-y-2">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Built In India */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">
          Built in India, For India
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-slate-700 leading-relaxed">
            PulseMate Connect was founded in <strong>Karwar, Karnataka, India</strong> with a focus
            on solving real healthcare access problems faced by Indian patients. We started with the
            belief that modern technology should serve everyone — from urban metros to smaller cities
            like Karwar.
          </p>
          <p className="text-slate-700 leading-relaxed mt-3">
            Our platform supports Indian phone numbers (OTP login), INR payments via Razorpay, and
            is designed for the realities of Indian clinics — including walk-in patients, varying
            clinic hours, and multi-doctor setups.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 font-medium">
            <span>🇮🇳</span>
            <span>Proudly made in Karwar, Karnataka, India — 581301</span>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">
          Our Technology
        </h2>
        <p className="text-slate-600 leading-relaxed mb-3">
          PulseMate Connect is built with modern, reliable technology:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Mobile App', 'React Native (Expo) — Android'],
            ['Web Portal', 'React.js + Tailwind CSS'],
            ['Backend API', 'Node.js + Express + Prisma ORM'],
            ['Database', 'PostgreSQL'],
            ['Auth', 'Firebase Phone Authentication'],
            ['Payments', 'Razorpay (PCI-DSS compliant)'],
            ['Push Notifications', 'Firebase Cloud Messaging (FCM)'],
            ['File Storage', 'Cloudinary'],
          ].map(([tech, detail]) => (
            <div key={tech} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-slate-800">{tech}:</span>
                <span className="text-sm text-slate-600 ml-1">{detail}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Legal */}
      <section className="mb-2">
        <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">
          Get in Touch
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Support Email</p>
              <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline font-medium">
                support@pulsemateconnect.in
              </a>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Website</p>
              <a href="https://pulsemateconnect.in" className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                pulsemateconnect.in
              </a>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Location</p>
              <p className="text-slate-700 font-medium">Karwar, Karnataka, India — 581301</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Contact Page</p>
              <Link to="/contact" className="text-blue-600 hover:underline font-medium">
                Visit Contact Us →
              </Link>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          © {new Date().getFullYear()} PulseMate Connect. All rights reserved. PULSEMATE CONNECT,
          Karwar, Karnataka, India.
        </p>
      </section>
    </LegalPageLayout>
  );
}
