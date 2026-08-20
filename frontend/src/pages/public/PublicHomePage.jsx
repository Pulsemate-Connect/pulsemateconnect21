import React from 'react';
import { Link } from 'react-router-dom';
import PulsemateLogo from '../../components/PulsemateLogo';

const trustStats = [
  { value: '5000+', label: 'Clinics onboarded' },
  { value: '1.2L+', label: 'Appointments managed' },
  { value: '4.9/5', label: 'Patient trust rating' },
];

const valueCards = [
  {
    title: 'Trusted doctors',
    body: 'Discover verified specialists, clinics and available slots in one place.',
    icon: 'heart',
    accent: 'from-sky-400 to-cyan-300',
  },
  {
    title: 'Live queue tracking',
    body: 'Know your expected wait time before you leave home for the clinic.',
    icon: 'pulse',
    accent: 'from-emerald-400 to-cyan-300',
  },
  {
    title: 'Digital care journey',
    body: 'Keep appointments, prescriptions and visit details organized digitally.',
    icon: 'document',
    accent: 'from-violet-400 to-fuchsia-300',
  },
];

const reassuranceItems = [
  { title: 'Verified care providers', body: 'Doctors and clinics are reviewed before they go live.', icon: 'shield' },
  { title: 'Appointment clarity', body: 'Track timings, tokens and visit updates without phone follow-ups.', icon: 'clock' },
  { title: 'Mobile-first access', body: 'Fast OTP login built for patients on the go.', icon: 'phone' },
];

const portalFeatures = [
  { title: 'Clinic staff portal', body: 'Owners, doctors and reception teams get a separate internal workspace.' },
  { title: 'Queue operations', body: 'Handle live queue, bookings and clinic flow without mixing patient screens.' },
];

const iconPaths = {
  heart: 'M31.8 53.5 11.2 33.3a11 11 0 0 1 15.6-15.5l5 4.8 5-4.8a11 11 0 0 1 15.6 15.5L31.8 53.5Z M17 31h10l4-8 5 16 3-8h8',
  shield: 'M32 8 49 14v13.5c0 10.6-6.5 17.4-17 21.5C21.5 44.9 15 38.1 15 27.5V14L32 8Z',
  pulse: 'M10 34h12l4-9 6 18 4-9h18',
  document: 'M22 10h14l10 10v30H22a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Zm14 0v10h10M26 30h14m-14 8h14',
  clock: 'M32 12a20 20 0 1 0 20 20 20 20 0 0 0-20-20Zm0 11v10l7 4',
  phone: 'M23 12h18a5 5 0 0 1 5 5v30a5 5 0 0 1-5 5H23a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5Zm8 31h2',
  location: 'M32 54s14-12.8 14-24a14 14 0 1 0-28 0c0 11.2 14 24 14 24Zm0-18a6 6 0 1 0-6-6 6 6 0 0 0 6 6Z',
  check: 'M17 32 27 42 47 22',
};

const MarkIcon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {iconPaths[name]
      .split(' M')
      .map((segment, index) => (
        <path key={`${name}-${index}`} d={`${index === 0 ? 'M' : 'M'}${segment.replace(/^M/, '')}`} />
      ))}
  </svg>
);

const PulseMateLogo = () => (
  <PulsemateLogo size="md" theme="light" showTagline={true} />
);

const PublicHomePage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_48%,#f6f9ff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-7rem] h-80 w-80 rounded-full bg-cyan-200/70 blur-3xl" />
        <div className="absolute right-[-8rem] top-10 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute left-[20%] top-[32%] h-40 w-40 rounded-full bg-emerald-100/70 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-sky-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/">
            <PulseMateLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#home" className="transition hover:text-sky-700">Home</a>
            <a href="#find-doctors" className="transition hover:text-sky-700">Find Doctors</a>
            <a href="#clinics" className="transition hover:text-sky-700">Clinics</a>
            <Link to="/clinic-partner" className="transition hover:text-sky-700">Clinic Partner</Link>
            <a href="#about" className="transition hover:text-sky-700">About</a>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/portal"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Clinic Portal
            </Link>
            <Link
              to="/login"
              className="inline-flex rounded-full bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.22)] transition hover:brightness-105"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-sky-100 bg-white/95 backdrop-blur-xl">
            <nav className="mx-auto max-w-7xl px-4 py-4 space-y-3">
              <a href="#home" className="block py-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition">
                Home
              </a>
              <a href="#find-doctors" className="block py-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition">
                Find Doctors
              </a>
              <a href="#clinics" className="block py-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition">
                Clinics
              </a>
              <Link to="/clinic-partner" className="block py-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition">
                Clinic Partner
              </Link>
              <a href="#about" className="block py-2 text-sm font-semibold text-slate-600 hover:text-sky-700 transition">
                About
              </a>
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <Link
                  to="/portal"
                  className="block text-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Clinic Portal
                </Link>
                <Link
                  to="/login"
                  className="block text-center rounded-full bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.22)] transition hover:brightness-105"
                >
                  Login
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="home" className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/85 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Healthcare made simpler for patients
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl">
                Book appointments
                <br />
                without waiting
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-600">
                Find trusted doctors, track live queue and manage your healthcare digitally.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(37,99,235,0.25)] transition hover:brightness-105"
                >
                  Login with Mobile
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-[1.2rem] border border-sky-200 bg-white px-6 py-4 text-base font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Create Patient Account
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {trustStats.map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_14px_40px_rgba(125,162,196,0.12)]">
                    <p className="text-2xl font-bold text-slate-950">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {valueCards.map((card) => (
                  <div key={card.title} className="rounded-[1.6rem] border border-white/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(125,162,196,0.12)]">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}>
                      <MarkIcon name={card.icon} className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-4 top-8 hidden h-24 w-24 rounded-full bg-cyan-200/50 blur-2xl sm:block" />
              <div className="absolute -left-2 bottom-10 hidden h-24 w-24 rounded-full bg-emerald-200/50 blur-2xl sm:block" />

              <div className="rounded-[2.2rem] border border-white/80 bg-white/90 p-4 shadow-[0_24px_80px_rgba(148,181,215,0.22)]">
                <div className="rounded-[1.9rem] bg-[linear-gradient(160deg,#eff8ff_0%,#fbfeff_48%,#eef6ff_100%)] p-5">
                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-4">
                      <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_12px_30px_rgba(125,162,196,0.12)]">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-500">Live queue</p>
                            <p className="mt-3 text-4xl font-bold text-slate-950">12 min</p>
                            <p className="mt-1 text-sm text-emerald-600">Updated just now</p>
                          </div>
                          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                            Queue moving
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] p-5 text-white shadow-[0_16px_45px_rgba(37,99,235,0.25)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-100">Appointments today</p>
                        <p className="mt-3 text-5xl font-bold">24</p>
                        <p className="mt-2 text-sm leading-7 text-sky-100">Managed seamlessly in one place for patients and clinics.</p>
                      </div>

                      <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_12px_30px_rgba(125,162,196,0.12)]">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-slate-900">Trusted clinic nearby</p>
                          <div className="flex items-center gap-1 text-amber-500">
                            <span>★</span>
                            <span className="text-sm font-semibold">4.9</span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-500">PulseCare Cardiology</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">Next slot today at 4:20 PM with Dr. Arjun Mehta.</p>
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] bg-white p-5 shadow-[0_12px_30px_rgba(125,162,196,0.12)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-500">Your care journey</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">Appointments, prescriptions and queue</p>
                        </div>
                        <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                          Mobile-first
                        </div>
                      </div>

                      <div className="mt-6 rounded-[1.4rem] bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-500">Upcoming appointment</p>
                            <p className="mt-1 text-xl font-semibold text-slate-900">Dr. Neha Kapoor</p>
                            <p className="mt-1 text-sm text-slate-500">Dermatology consultation</p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Token</p>
                            <p className="mt-1 text-3xl font-bold text-blue-600">14</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {[
                          ['Appointment booked', 'Confirmed with clinic', 'check'],
                          ['Queue updated', 'Expected wait time reduced', 'pulse'],
                          ['Prescription ready', 'View post-visit instructions digitally', 'document'],
                        ].map(([title, body, icon]) => (
                          <div key={title} className="flex items-start gap-3 rounded-[1.3rem] border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                              <MarkIcon name={icon} className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{title}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 h-3 rounded-full bg-slate-100">
                        <div className="h-3 w-[74%] rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#10b981_100%)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {reassuranceItems.map((item) => (
              <div key={item.title} className="rounded-[1.8rem] border border-sky-100 bg-white/90 p-6 shadow-[0_14px_40px_rgba(125,162,196,0.1)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <MarkIcon name={item.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-[linear-gradient(135deg,#03153f_0%,#112e78_55%,#2758da_100%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(13,27,74,0.25)] sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">For doctors and clinics</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Manage appointments, queue and clinic operations.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
                  PulseMate also includes a dedicated internal portal for clinic owners, doctors and reception teams, separate from the patient website.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {portalFeatures.map((feature) => (
                    <div key={feature.title} className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="font-semibold text-white">{feature.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-200">{feature.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="rounded-[1.7rem] bg-white p-6 text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <MarkIcon name="location" className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Clinic staff portal</p>
                      <p className="text-sm text-slate-500">Internal access for verified staff only</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {['Clinic Owner workspace', 'Doctor dashboard', 'Reception queue operations'].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <MarkIcon name="check" className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/portal"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] px-5 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.24)] transition hover:brightness-105"
                  >
                    Open Clinic Portal
                  </Link>
                  
                  <Link
                    to="/clinic-partner"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-[1.2rem] border-2 border-white bg-white/10 px-5 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Become a Partner Clinic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0a1e3d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Logo and Social */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 10 12 6.16-1.26 10-6.45 10-12V7l-10-5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold">PulseMate <span className="text-sky-400">Connect</span></div>
                  <div className="text-xs text-slate-400">Healthcare made simpler</div>
                </div>
              </div>
              
              {/* Social Media */}
              <div className="mt-6 flex gap-3">
                <a href="https://www.facebook.com/pulsemateconnect" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/pulsemateconnect" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://twitter.com/pulsemateconnect" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/pulsemate-connect-health/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Patients Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Patients</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#find-doctors" className="text-slate-400 transition hover:text-white">Find Doctors</a></li>
                <li><a href="#appointments" className="text-slate-400 transition hover:text-white">Appointments</a></li>
                <li><a href="#queue" className="text-slate-400 transition hover:text-white">Live Queue</a></li>
                <li><a href="#health-tips" className="text-slate-400 transition hover:text-white">Health Tips</a></li>
              </ul>
            </div>

            {/* For Clinics Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">For Clinics</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link to="/clinic-partner" className="text-slate-400 transition hover:text-white">Clinic Partner</Link></li>
                <li><Link to="/portal" className="text-slate-400 transition hover:text-white">Clinic Portal</Link></li>
                <li><a href="#register-clinic" className="text-slate-400 transition hover:text-white">Register Clinic</a></li>
                <li><a href="#resources" className="text-slate-400 transition hover:text-white">Resources</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Company</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#about" className="text-slate-400 transition hover:text-white">About Us</a></li>
                <li><a href="#contact" className="text-slate-400 transition hover:text-white">Contact Us</a></li>
                <li><a href="#privacy" className="text-slate-400 transition hover:text-white">Privacy Policy</a></li>
                <li><a href="#terms" className="text-slate-400 transition hover:text-white">Terms & Conditions</a></li>
              </ul>
            </div>

            {/* Download App Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Download Our App</h3>
              <div className="mt-4 space-y-3">
                <a 
                  href="https://play.google.com/store/apps/details?id=in.pulsemateconnect.patient" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 transition hover:bg-white/20"
                >
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-slate-400">GET IT ON</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </a>
                <a 
                  href="https://apps.apple.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2.5 transition hover:bg-white/20"
                >
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-slate-400">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-slate-400">
              © 2026 PulseMate Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicHomePage;
