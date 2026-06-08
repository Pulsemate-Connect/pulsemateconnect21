import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';

const STORAGE_KEY = 'pulsemate_notif_settings';

const DEFAULT_SETTINGS = {
  appointments: true,
  queueUpdates: true,
  reminders: true,
  marketing: false,
};

const SETTINGS_CONFIG = [
  {
    key: 'appointments',
    title: 'Appointment Notifications',
    description: 'Booking confirmations, cancellations, and status updates',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'queueUpdates',
    title: 'Queue Updates',
    description: "When your turn is near, queue paused or resumed",
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'reminders',
    title: 'Appointment Reminders',
    description: '24-hour and 2-hour reminders before your appointment',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    key: 'marketing',
    title: 'Offers & Promotions',
    description: 'Health check-up offers and promotional updates',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

const Toggle = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
      checked ? 'bg-primary-600' : 'bg-gray-200'
    }`}
  >
    <span className="sr-only">Toggle notification</span>
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [justSaved, setJustSaved] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const toggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <DashboardLayout>
      <div className="page-container max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/notifications"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-muted hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Back to notifications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">Notification Settings</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Choose what you want to be notified about
            </p>
          </div>
          {justSaved && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              ✓ Saved
            </span>
          )}
        </div>

        {/* Settings rows */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {SETTINGS_CONFIG.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center gap-4 px-5 py-4 ${
                i < SETTINGS_CONFIG.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.iconBg}`}
              >
                <span className={item.iconColor}>{item.icon}</span>
              </div>

              {/* Label */}
              <label
                htmlFor={`toggle-${item.key}`}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </label>

              {/* Toggle */}
              <Toggle
                id={`toggle-${item.key}`}
                checked={settings[item.key]}
                onChange={() => toggle(item.key)}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-text-muted text-center mt-5 leading-relaxed px-4">
          System-critical notifications (appointment status changes from your doctor or clinic) are
          always delivered regardless of these settings.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettingsPage;
