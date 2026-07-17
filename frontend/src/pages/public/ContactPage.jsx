import { useState } from 'react';
import { Link } from 'react-router-dom';
import LegalPageLayout from './LegalPageLayout';

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Appointment Support',
  'Refund Request',
  'Account / Login Issue',
  'Technical Problem',
  'Data Deletion Request',
  'Feedback / Suggestion',
  'Partnership Inquiry',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  return (
    <LegalPageLayout
      title="Contact Us"
      subtitle="We're here to help. Reach out with any questions or concerns."
      lastUpdated="July 2026"
    >
      {/* Main support card */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
              📧
            </div>
            <div>
              <p className="font-semibold text-slate-900">Email Support</p>
              <p className="text-xs text-slate-500">Fastest way to reach us</p>
            </div>
          </div>
          <a
            href="mailto:support@pulsemateconnect.in"
            className="text-blue-600 font-semibold hover:underline break-all"
          >
            support@pulsemateconnect.in
          </a>
          <p className="text-sm text-slate-500 mt-2">
            We respond within <strong>24–48 hours</strong> on business days (Mon–Sat).
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-white text-xl">
              📍
            </div>
            <div>
              <p className="font-semibold text-slate-900">Office Address</p>
              <p className="text-xs text-slate-500">Our registered location</p>
            </div>
          </div>
          <p className="text-slate-700 font-medium">PulseMate Connect</p>
          <p className="text-sm text-slate-600 mt-1">Karwar, Karnataka, India — 581301</p>
          <p className="text-sm text-slate-500 mt-3">
            Website:{' '}
            <a href="https://pulsemateconnect.in" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              pulsemateconnect.in
            </a>
          </p>
        </div>
      </div>

      {/* Developer contact */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
        <p className="text-sm font-semibold text-slate-700 mb-1">Developer Contact</p>
        <p className="text-sm text-slate-600">
          For technical integrations or developer inquiries:{' '}
          <a href="mailto:shubham27052002@gmail.com" className="text-blue-600 hover:underline">
            shubham27052002@gmail.com
          </a>
        </p>
      </div>

      {/* Contact Form */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-6">
          Send Us a Message
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="contact-name">
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="contact-email">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="contact-subject">
              Subject
            </label>
            <select
              id="contact-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select a subject…</option>
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={5}
              placeholder="Describe your question or issue in detail…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href={`mailto:support@pulsemateconnect.in?subject=${encodeURIComponent(form.subject || 'PulseMate Support')}&body=${encodeURIComponent(`Name: ${form.name}\n\n${form.message}`)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Send via Email
              <span>→</span>
            </a>
            <p className="text-xs text-slate-400">
              This will open your email client. We respond within 24–48 business hours.
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">
          Quick Links
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { to: '/privacy',        label: 'Privacy Policy',    icon: '🔐', desc: 'How we handle your data' },
            { to: '/terms',          label: 'Terms & Conditions', icon: '📋', desc: 'Platform usage terms' },
            { to: '/data-deletion',  label: 'Data Deletion',     icon: '🗑️', desc: 'Delete your account' },
            { to: '/refund-policy',  label: 'Refund Policy',     icon: '💰', desc: 'Refund eligibility' },
            { to: '/disclaimer',     label: 'Medical Disclaimer', icon: '⚕️', desc: 'Platform limitations' },
            { to: '/guidelines',     label: 'Community Rules',   icon: '📌', desc: 'Usage guidelines' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-start gap-3 p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-colors"
            >
              <span className="text-xl flex-shrink-0">{link.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                <p className="text-xs text-slate-500">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </LegalPageLayout>
  );
}
