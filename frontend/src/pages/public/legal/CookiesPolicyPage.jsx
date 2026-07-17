import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const TOC = [
  { id: 'what',      label: '1. What Are Cookies' },
  { id: 'weuse',     label: '2. Cookies We Use' },
  { id: 'third',     label: '3. Third-Party Cookies' },
  { id: 'managing',  label: '4. Managing Cookies' },
  { id: 'contact',   label: '5. Contact' },
];

export default function CookiesPolicyPage() {
  return (
    <LegalLayout
      title="Cookies Policy"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="How PulseMate Connect uses cookies and similar tracking technologies."
    >
      <Section title="1. What Are Cookies" id="what">
        <p>Cookies are small text files stored on your browser or device when you visit a website. They help websites remember your preferences, maintain your login session, and understand how you interact with the site.</p>
        <p>The PulseMate Connect web platform uses cookies to deliver a secure and personalised experience. The mobile app does not use browser cookies but may use equivalent local storage mechanisms.</p>
      </Section>

      <Section title="2. Cookies We Use" id="weuse">
        <p><strong>Session Cookies (Strictly Necessary)</strong></p>
        <p>These cookies are essential for the platform to function. They maintain your authenticated session after login, store temporary form data, and enable secure navigation between pages. Session cookies are deleted when you close your browser.</p>
        <Ul items={[
          'auth_token — stores your JWT session token for authentication',
          'session_id — tracks your current web session',
        ]} />

        <p className="mt-4"><strong>Preference Cookies (Functional)</strong></p>
        <p>These cookies remember your settings and customisations across visits.</p>
        <Ul items={[
          'theme — remembers your preferred display mode (light/dark)',
          'lang — stores your language preference',
        ]} />

        <p className="mt-4"><strong>Analytics Cookies (Performance)</strong></p>
        <p>We use anonymised analytics to understand how users interact with the platform so we can improve it. These cookies do not collect any personally identifiable information.</p>
        <Ul items={[
          'Page view tracking — which pages are most visited',
          'Error tracking — JavaScript errors and app crashes',
          'Session duration — how long users engage with features',
        ]} />
        <InfoBox type="info">Analytics data is aggregated and anonymised. It cannot be used to identify individual users.</InfoBox>
      </Section>

      <Section title="3. Third-Party Cookies" id="third">
        <p><strong>Firebase (Google LLC)</strong></p>
        <p>Firebase sets cookies for authentication and analytics. These are governed by Google's Cookie Policy. Firebase analytics data may be transferred to Google servers in the United States.</p>

        <p className="mt-4"><strong>Google Analytics</strong></p>
        <p>We may use Google Analytics to measure website traffic and user behaviour in aggregate. Google Analytics uses cookies such as <code>_ga</code> and <code>_gid</code>. You can opt out using the <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</p>

        <p className="mt-4"><strong>Razorpay</strong></p>
        <p>When you proceed to payment, Razorpay's checkout interface may set session cookies to manage the payment flow. These are governed by Razorpay's Privacy Policy.</p>
      </Section>

      <Section title="4. Managing Cookies" id="managing">
        <p>You can control cookies through your browser settings:</p>
        <Ul items={[
          'Chrome: Settings → Privacy and Security → Cookies and other site data',
          'Firefox: Settings → Privacy & Security → Cookies and Site Data',
          'Safari: Settings → Privacy → Manage Website Data',
          'Edge: Settings → Cookies and site permissions',
        ]} />
        <InfoBox type="warning">Disabling strictly necessary cookies (session/auth cookies) will prevent you from logging in and using PulseMate Connect. Other cookies are optional and can be disabled without breaking core functionality.</InfoBox>
        <p>On mobile, app-level local storage can be cleared by going to your device's Settings → Apps → PulseMate → Storage → Clear Data.</p>
      </Section>

      <Section title="5. Contact" id="contact">
        <p>For questions about our cookie practices:</p>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
