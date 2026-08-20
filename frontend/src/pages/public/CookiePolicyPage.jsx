import LegalPageLayout from './LegalPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const toc = [
  { id: 'what-are-cookies', label: '1. What Are Cookies' },
  { id: 'cookies-we-use',   label: '2. Cookies We Use' },
  { id: 'no-ad-cookies',    label: '3. No Advertising Cookies' },
  { id: 'managing-cookies', label: '4. Managing Cookies' },
  { id: 'mobile-app',       label: '5. Mobile App Storage' },
  { id: 'updates',          label: '6. Updates to This Policy' },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="How PulseMate Connect uses cookies and local storage on web and mobile."
      lastUpdated="July 2026"
    >
      <p className="text-slate-600 leading-relaxed mb-8">
        This Cookie Policy explains what cookies are, how PulseMate Connect uses them on our website
        and web application, and how you can manage your cookie preferences.
      </p>

      {/* Table of Contents */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <p className="text-sm font-semibold text-blue-800 mb-3">Table of Contents</p>
        <ol className="list-decimal list-inside space-y-1">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-blue-700 hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <Section id="what-are-cookies" title="1. What Are Cookies">
        <p>
          Cookies are small text files stored on your device (computer, smartphone, or tablet) when
          you visit a website. They are widely used to make websites work efficiently and to provide
          information to website owners about how users interact with their site.
        </p>
        <p>
          Cookies can be <strong>session cookies</strong> (deleted when you close your browser) or
          <strong> persistent cookies</strong> (remain on your device for a set period or until you
          delete them).
        </p>
      </Section>

      <Section id="cookies-we-use" title="2. Cookies We Use">
        <p>PulseMate Connect uses the following categories of cookies on our web platform:</p>

        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 mb-2">🔐 Essential Cookies (Required)</p>
            <p className="text-sm text-slate-600 mb-2">
              These cookies are strictly necessary for the website to function. Without them,
              core features like login and secure sessions would not work.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>Authentication tokens (JWT access tokens)</li>
              <li>Session management (keeping you logged in)</li>
              <li>CSRF protection tokens</li>
              <li>Security-related session identifiers</li>
            </ul>
            <p className="text-xs text-slate-400 mt-2">These cannot be disabled without breaking the service.</p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 mb-2">⚙️ Functional Cookies</p>
            <p className="text-sm text-slate-600 mb-2">
              These cookies remember your preferences to provide a better experience.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>Language and display preferences</li>
              <li>UI state preferences (dark/light mode, if applicable)</li>
              <li>Previously viewed clinics or doctors (local storage)</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 mb-2">📊 Analytics Cookies</p>
            <p className="text-sm text-slate-600 mb-2">
              We use anonymous usage analytics to understand how users interact with our platform
              and to improve the service. All analytics data is anonymous and not linked to any
              personal identity.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li>Firebase Analytics (provided by Google) — anonymous usage patterns</li>
              <li>Page views, feature usage frequency</li>
              <li>App performance and crash reporting</li>
            </ul>
            <p className="text-xs text-slate-400 mt-2">
              Google's Privacy Policy applies:{' '}
              <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                policies.google.com/privacy
              </a>
            </p>
          </div>
        </div>
      </Section>

      <Section id="no-ad-cookies" title="3. No Advertising Cookies">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            ✓ PulseMate Connect does NOT use advertising cookies.
          </p>
          <p className="text-sm text-blue-700">
            We do not use tracking cookies for advertising, retargeting, or behavioural profiling.
            We do not share your browsing data with advertising networks or third-party data brokers.
          </p>
        </div>
      </Section>

      <Section id="managing-cookies" title="4. Managing Cookies">
        <p>
          You can manage or clear cookies at any time through your browser settings. Most browsers
          allow you to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>View and delete individual cookies</li>
          <li>Block all cookies (this may break core functionality)</li>
          <li>Accept cookies only from specific websites</li>
          <li>Configure cookies to expire when you close your browser</li>
        </ul>
        <p>
          Common browser instructions:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and Other Site Data</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
        </ul>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Clearing essential authentication cookies will sign you out of
            PulseMate Connect and require you to log in again.
          </p>
        </div>
      </Section>

      <Section id="mobile-app" title="5. Mobile App Storage">
        <p>
          The PulseMate Connect Android application does not use browser cookies. Instead, it uses
          device-level secure storage for session management:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>
            <strong>Expo SecureStore:</strong> Authentication tokens are stored in the device's
            secure enclave (Android Keystore). This is more secure than browser cookies.
          </li>
          <li>
            <strong>AsyncStorage:</strong> Non-sensitive preferences and UI state may be stored
            in AsyncStorage (device local storage).
          </li>
          <li>
            <strong>FCM Token:</strong> Firebase Cloud Messaging device token is stored to enable
            push notifications. This is removed upon logout or account deletion.
          </li>
        </ul>
        <p>
          To clear app storage, go to your device's <strong>Settings → Apps → PulseMate Connect
          → Clear Storage</strong>. Note this will sign you out of the app.
        </p>
      </Section>

      <Section id="updates" title="6. Updates to This Policy">
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology,
          legal requirements, or our services. We will notify you of significant changes via
          in-app notification.
        </p>
        <p>
          Continued use of PulseMate Connect after changes to this policy are posted implies
          your acceptance of the updated policy.
        </p>
        <p>
          For questions about our cookie practices, contact{' '}
          <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
            support@pulsemateconnect.in
          </a>.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
