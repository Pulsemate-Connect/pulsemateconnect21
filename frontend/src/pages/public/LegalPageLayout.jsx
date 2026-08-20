import { Link } from 'react-router-dom';
import PulsemateLogo from '../../components/PulsemateLogo';

const LEGAL_LINKS = [
  { to: '/privacy',             label: 'Privacy Policy' },
  { to: '/terms',               label: 'Terms & Conditions' },
  { to: '/refund-policy',       label: 'Refund Policy' },
  { to: '/cancellation-policy', label: 'Cancellation Policy' },
  { to: '/data-deletion',       label: 'Data Deletion' },
  { to: '/cookies',             label: 'Cookie Policy' },
  { to: '/security',            label: 'Security Policy' },
  { to: '/disclaimer',          label: 'Medical Disclaimer' },
  { to: '/guidelines',          label: 'Community Guidelines' },
  { to: '/accessibility',       label: 'Accessibility' },
  { to: '/contact',             label: 'Contact Us' },
  { to: '/about',               label: 'About Us' },
];

export default function LegalPageLayout({ title, subtitle, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/"><PulsemateLogo size="md" theme="light" /></Link>
          <Link to="/" className="text-sm text-blue-600 hover:underline font-medium">← Back to Home</Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
          {subtitle && <p className="text-lg text-slate-500 mb-2">{subtitle}</p>}
          {lastUpdated && (
            <p className="text-sm text-slate-400 mb-8">
              Last Updated: {lastUpdated} · Effective Date: {lastUpdated}
            </p>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 mt-4">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Legal & Policies</p>
          <div className="flex flex-wrap gap-3">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-slate-500 hover:text-blue-600 hover:underline transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} PulseMate Connect. All rights reserved. Karwar, Karnataka, India.</p>
            <p>Built for healthcare in India 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
