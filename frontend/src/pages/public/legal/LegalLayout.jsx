import { Link, useLocation } from 'react-router-dom';
import PulsemateLogo from '../../../components/PulsemateLogo';

const YEAR = new Date().getFullYear();

export const LEGAL_PAGES = [
  { path: '/privacy',       label: 'Privacy Policy' },
  { path: '/terms',         label: 'Terms & Conditions' },
  { path: '/refund-policy', label: 'Refund Policy' },
  { path: '/cancellation-policy', label: 'Cancellation Policy' },
  { path: '/data-deletion', label: 'Data Deletion' },
  { path: '/cookies',       label: 'Cookies Policy' },
  { path: '/security',      label: 'Security Policy' },
  { path: '/medical-disclaimer', label: 'Medical Disclaimer' },
  { path: '/community-guidelines', label: 'Community Guidelines' },
  { path: '/contact',       label: 'Contact Us' },
  { path: '/about',         label: 'About Us' },
  { path: '/accessibility', label: 'Accessibility' },
  { path: '/copyright',     label: 'Copyright' },
  { path: '/open-source',   label: 'Open Source' },
];

export const Section = ({ title, id, children }) => (
  <section id={id} className="mb-10 scroll-mt-24">
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">{title}</h2>
    <div className="text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const InfoBox = ({ children, type = 'info' }) => {
  const styles = {
    info:    'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200',
    danger:  'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[type]}`}>{children}</div>
  );
};

export const Ul = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

export const ContactBlock = () => (
  <InfoBox type="info">
    <p className="font-semibold text-slate-900 dark:text-white mb-2">PULSEMATE CONNECT</p>
    <p>📧 <a href="mailto:support@pulsemateconnect.in" className="underline">support@pulsemateconnect.in</a></p>
    <p>🌐 <a href="https://pulsemateconnect.in" className="underline" target="_blank" rel="noopener noreferrer">pulsemateconnect.in</a></p>
    <p>📍 Karwar, Karnataka, India</p>
  </InfoBox>
);

export default function LegalLayout({ title, subtitle, lastUpdated, toc, children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/"><PulsemateLogo size="md" theme="light" /></Link>
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {LEGAL_PAGES.slice(0, 6).map(p => (
              <Link key={p.path} to={p.path}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  location.pathname === p.path
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}>
                {p.label}
              </Link>
            ))}
            <span className="text-slate-300 dark:text-slate-600">|</span>
            {LEGAL_PAGES.slice(6).map(p => (
              <Link key={p.path} to={p.path}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  location.pathname === p.path
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}>
                {p.label}
              </Link>
            ))}
          </nav>
          <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">← Home</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-8">
          {/* Sidebar TOC — desktop */}
          {toc && toc.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Contents</p>
                <nav className="space-y-1">
                  {toc.map(item => (
                    <a key={item.id} href={`#${item.id}`}
                      className="block text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition truncate">
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-10">
              {/* Page header */}
              <div className="mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full">
                    ⚖️ Legal
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h1>
                {subtitle && <p className="text-slate-500 dark:text-slate-400 text-base">{subtitle}</p>}
                {lastUpdated && (
                  <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                    Last updated: <strong>{lastUpdated}</strong> · Effective immediately
                  </p>
                )}
              </div>

              {children}

              {/* Footer navigation */}
              <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Other Policies</p>
                <div className="flex flex-wrap gap-2">
                  {LEGAL_PAGES.filter(p => p.path !== location.pathname).map(p => (
                    <Link key={p.path} to={p.path}
                      className="text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-full transition">
                      {p.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8 px-4 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <PulsemateLogo size="sm" theme="light" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              {LEGAL_PAGES.map(p => (
                <Link key={p.path} to={p.path} className="hover:text-blue-600 dark:hover:text-blue-400 transition">{p.label}</Link>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-slate-400 dark:text-slate-500">
            <p>© {YEAR} PULSEMATE CONNECT. All rights reserved.</p>
            <p>Karwar, Karnataka, India · <a href="mailto:support@pulsemateconnect.in" className="hover:text-blue-600 transition">support@pulsemateconnect.in</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
