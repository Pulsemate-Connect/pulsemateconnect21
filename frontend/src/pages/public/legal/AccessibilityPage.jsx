import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const TOC = [
  { id: 'commitment',  label: '1. Our Commitment' },
  { id: 'wcag',        label: '2. WCAG Compliance' },
  { id: 'features',    label: '3. Accessible Features' },
  { id: 'mobile',      label: '4. Mobile Accessibility' },
  { id: 'assistive',   label: '5. Assistive Technology Support' },
  { id: 'limitations', label: '6. Known Limitations' },
  { id: 'contact',     label: '7. Feedback & Contact' },
];

export default function AccessibilityPage() {
  return (
    <LegalLayout
      title="Accessibility"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="PulseMate Connect's commitment to accessible healthcare technology for all users."
    >
      <Section title="1. Our Commitment" id="commitment">
        <p>PulseMate Connect is committed to ensuring that our platform is accessible to all users, including those with disabilities. We believe that healthcare technology should serve everyone equally, regardless of ability.</p>
        <p>We are actively working to improve accessibility across our web platform and Android mobile application and welcome feedback from users who encounter barriers.</p>
        <InfoBox type="info">Accessibility is an ongoing effort. We regularly review and improve our platform to reduce barriers for users with different needs.</InfoBox>
      </Section>

      <Section title="2. WCAG Compliance" id="wcag">
        <p>The PulseMate Connect web platform targets conformance with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. Our current efforts include:</p>
        <Ul items={[
          'Sufficient colour contrast ratios for text and interactive elements (minimum 4.5:1)',
          'All form inputs are properly labelled for screen reader compatibility',
          'Keyboard navigation supported for all critical actions (login, booking, profile)',
          'Focus indicators visible on all interactive elements',
          'Error messages are descriptive and associated with relevant form fields',
          'Pages have logical heading hierarchies (H1 → H2 → H3)',
          'Images have alt text where relevant',
        ]} />
        <InfoBox type="warning">Full WCAG 2.1 AA compliance requires manual testing with assistive technologies. While we implement best practices, independent expert verification has not yet been completed.</InfoBox>
      </Section>

      <Section title="3. Accessible Features" id="features">
        <Ul items={[
          'High-contrast text throughout the interface for readability',
          'Clear, plain language used in all content and instructions',
          'Consistent navigation layout across all pages',
          'Responsive design that works at all zoom levels (up to 200%)',
          'No content that flashes more than 3 times per second',
          'Link text is descriptive and not generic ("click here")',
          'Error states communicate issues clearly without relying solely on colour',
        ]} />
      </Section>

      <Section title="4. Mobile Accessibility" id="mobile">
        <p>The PulseMate Connect Android app is developed with React Native/Expo and aims to support Android Accessibility Services:</p>
        <Ul items={[
          'TalkBack compatibility — interactive elements have accessibility labels',
          'Touch targets are sized at minimum 48×48 dp as per Android guidelines',
          'System font size scaling is respected (content reflows gracefully)',
          'High contrast mode compatible with standard OS contrast settings',
          'Navigation between tabs and screens is operable with accessibility shortcuts',
        ]} />
      </Section>

      <Section title="5. Assistive Technology Support" id="assistive">
        <p>We aim to support the following assistive technologies:</p>
        <Ul items={[
          'Screen readers: TalkBack (Android), NVDA/JAWS (web), VoiceOver (iOS web)',
          'Keyboard-only navigation on the web platform',
          'High DPI/Retina display compatibility — all icons and images are crisp at 2x/3x',
          'Browser zoom up to 200% without horizontal scrolling or content loss',
          'Voice control software compatibility for web form interactions',
        ]} />
      </Section>

      <Section title="6. Known Limitations" id="limitations">
        <p>We acknowledge that some areas of our platform may not yet be fully accessible. Known limitations include:</p>
        <Ul items={[
          'Some complex data tables (queue management, appointments grid) may not have full screen reader optimisation yet',
          'The Razorpay payment checkout WebView may not fully support external screen readers — we are working with Razorpay to improve this',
          'Real-time queue update notifications may not be announced by screen readers automatically',
          'Some graphical elements (charts) on the admin dashboard lack detailed text alternatives',
        ]} />
        <p>We are actively working to address these limitations. Timeline for fixes depends on third-party dependencies.</p>
      </Section>

      <Section title="7. Feedback & Contact" id="contact">
        <p>If you experience accessibility barriers on PulseMate Connect, we want to hear from you. Your feedback directly helps us prioritise improvements.</p>
        <p>Please report accessibility issues to:</p>
        <ContactBlock />
        <p className="mt-4">When reporting, please include:</p>
        <Ul items={[
          'The specific page or feature affected',
          'The assistive technology you are using (e.g., TalkBack, NVDA)',
          'Your device and browser/OS version',
          'A description of the barrier you encountered',
        ]} />
        <p>We aim to respond to accessibility feedback within 5 business days.</p>
      </Section>
    </LegalLayout>
  );
}
