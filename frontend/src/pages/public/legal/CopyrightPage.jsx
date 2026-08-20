import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const YEAR = new Date().getFullYear();

const TOC = [
  { id: 'notice',    label: '1. Copyright Notice' },
  { id: 'ownership', label: '2. Ownership' },
  { id: 'permitted', label: '3. Permitted Use' },
  { id: 'prohibited',label: '4. Prohibited Use' },
  { id: 'dmca',      label: '5. DMCA / IP Infringement' },
  { id: 'trademarks',label: '6. Trademarks' },
  { id: 'contact',   label: '7. Contact' },
];

export default function CopyrightPage() {
  return (
    <LegalLayout
      title="Copyright Notice"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="Intellectual property rights and permitted use of PulseMate Connect content."
    >
      <Section title="1. Copyright Notice" id="notice">
        <InfoBox type="info">
          <p>© {YEAR} PULSEMATE CONNECT. All rights reserved.</p>
          <p className="mt-1">All content on this platform is protected by Indian and international copyright laws.</p>
        </InfoBox>
        <p>The PulseMate Connect platform, including its mobile application, web interface, API, design, text, graphics, logos, and all other content, is the proprietary property of PulseMate Connect and is protected under the Copyright Act, 1957 (India) and applicable international treaties.</p>
      </Section>

      <Section title="2. Ownership" id="ownership">
        <p>PulseMate Connect owns or has valid licences to use all intellectual property displayed on or in the platform, including:</p>
        <Ul items={[
          'The PulseMate Connect brand name, logo, and visual identity',
          'All software code comprising the mobile app, web app, and backend API',
          'User interface designs, layouts, and component designs',
          'All written content, policy documents, and marketing text on this website',
          'Icons, illustrations, and graphic elements created for PulseMate Connect',
        ]} />
        <p>Third-party content (e.g., open source libraries, icons from third-party icon packs) is used under their respective licences. See our <a href="/open-source" className="text-blue-600 underline">Open Source Notices</a> for attribution.</p>
      </Section>

      <Section title="3. Permitted Use" id="permitted">
        <p>You are permitted to:</p>
        <Ul items={[
          'Use the PulseMate Connect platform for its intended purpose as a patient, doctor, or clinic',
          'Share links to public pages of pulsemateconnect.in for informational purposes',
          'Quote brief excerpts from our policy documents with clear attribution and a link back to the source',
          'Use PulseMate\'s public API in accordance with our API Terms of Service',
        ]} />
      </Section>

      <Section title="4. Prohibited Use" id="prohibited">
        <p>Without prior written permission from PulseMate Connect, you may not:</p>
        <Ul items={[
          'Copy, reproduce, or redistribute any substantial portion of the platform\'s content',
          'Modify, adapt, or create derivative works based on PulseMate Connect content',
          'Scrape or extract data from the platform using automated tools or bots',
          'Republish, sell, or sublicense any PulseMate Connect content',
          'Use PulseMate Connect\'s logo, brand name, or trademarks in your own products or marketing without permission',
          'Frame or mirror any part of the platform on another website',
          'Reverse-engineer or decompile the PulseMate Connect application',
        ]} />
        <InfoBox type="danger">Unauthorised reproduction or commercial use of PulseMate Connect content may result in legal action under the Copyright Act, 1957 and the Information Technology Act, 2000.</InfoBox>
      </Section>

      <Section title="5. DMCA / IP Infringement" id="dmca">
        <p>If you believe that any content on PulseMate Connect infringes your intellectual property rights, please submit an infringement notice to us with:</p>
        <Ul items={[
          'Identification of the copyrighted work you claim has been infringed',
          'The URL or specific location of the allegedly infringing content on our platform',
          'Your contact information (name, email, physical address)',
          'A statement that you believe, in good faith, that the use is not authorised',
          'A declaration that the information in your notice is accurate',
        ]} />
        <p>Send your notice to: <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 underline">support@pulsemateconnect.in</a> with the subject "IP Infringement Notice".</p>
        <p>We will respond within 10 business days and take appropriate action including removing infringing content if the claim is valid.</p>
      </Section>

      <Section title="6. Trademarks" id="trademarks">
        <p>"PulseMate Connect", "PulseMate", and the PulseMate logo are trademarks or service marks of PulseMate Connect. These marks may not be used in connection with any product or service that is not affiliated with PulseMate Connect, or in any manner that is likely to cause confusion, or in any manner that disparages or discredits PulseMate Connect.</p>
        <p>All other trademarks, product names, and company names or logos mentioned on the platform are the property of their respective owners.</p>
      </Section>

      <Section title="7. Contact" id="contact">
        <p>For copyright, licensing, or trademark enquiries:</p>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
