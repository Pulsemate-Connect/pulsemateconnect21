import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const TOC = [
  { id: 'community',   label: '1. Our Community' },
  { id: 'respectful',  label: '2. Respectful Behaviour' },
  { id: 'fakebookings',label: '3. Fake Bookings Policy' },
  { id: 'abuse',       label: '4. No Abuse or Harassment' },
  { id: 'spam',        label: '5. Spam Prevention' },
  { id: 'accurate',    label: '6. Accurate Information' },
  { id: 'restrictions',label: '7. Account Restrictions & Bans' },
  { id: 'reporting',   label: '8. Reporting Violations' },
  { id: 'contact',     label: '9. Contact' },
];

export default function CommunityGuidelinesPage() {
  return (
    <LegalLayout
      title="Community Guidelines"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="The standards of behaviour we expect from all PulseMate Connect users."
    >
      <Section title="1. Our Community" id="community">
        <p>PulseMate Connect is a healthcare booking platform that connects patients with doctors and clinics. Our community includes patients seeking care, healthcare providers delivering care, and administrative staff managing clinics.</p>
        <p>We are committed to building a safe, respectful, and reliable platform for everyone. These guidelines apply to all users of PulseMate Connect, on both mobile and web.</p>
        <InfoBox type="info">By using PulseMate Connect, you agree to follow these Community Guidelines. Violations may result in warnings, account suspension, or permanent bans.</InfoBox>
      </Section>

      <Section title="2. Respectful Behaviour" id="respectful">
        <p>All users are expected to treat each other with dignity and respect. This includes:</p>
        <Ul items={[
          'Using polite and professional language in any platform communications',
          'Respecting doctor and clinic staff as healthcare professionals',
          'Not making discriminatory comments based on gender, religion, caste, or disability',
          'Being patient with clinic staff and doctors, who serve many patients daily',
          'Accepting that healthcare providers may be delayed and communicating constructively',
        ]} />
      </Section>

      <Section title="3. Fake Bookings Policy" id="fakebookings">
        <p>Creating fake, fraudulent, or test appointments on the live platform is strictly prohibited. This includes:</p>
        <Ul items={[
          'Booking appointments with no intention of attending',
          'Creating appointments under a false identity or on behalf of someone without their consent',
          'Booking the same slot multiple times to block availability',
          'Using automated scripts or bots to create bookings',
        ]} />
        <InfoBox type="danger">Fake booking behaviour wastes healthcare capacity and denies slots to patients who genuinely need care. Detected violations will result in immediate account suspension.</InfoBox>
      </Section>

      <Section title="4. No Abuse or Harassment" id="abuse">
        <p>PulseMate Connect has zero tolerance for abuse, harassment, or threatening behaviour directed at doctors, clinic staff, or other users. The following are grounds for immediate account termination:</p>
        <Ul items={[
          'Threatening, intimidating, or bullying any user or healthcare provider',
          'Using offensive, discriminatory, or sexually inappropriate language',
          'Making false complaints or accusations against a clinic or doctor in bad faith',
          'Doxxing or sharing private information of other users without consent',
        ]} />
      </Section>

      <Section title="5. Spam Prevention" id="spam">
        <Ul items={[
          'Do not submit repeated appointment requests to the same doctor within a short period',
          'Do not use the contact/support channel for commercial solicitation',
          'Do not share referral links or promotional content via platform messaging',
          'Automated or bulk interactions with the platform are not permitted without written consent',
        ]} />
      </Section>

      <Section title="6. Accurate Information" id="accurate">
        <p>All users must provide truthful information:</p>
        <Ul items={[
          'Patients must use their real name and contact number when registering',
          'Doctors must submit accurate and current medical credentials during verification',
          'Clinic owners must provide genuine business registration and address details',
          'Symptom descriptions entered during booking should be honest and accurate',
          'Do not misrepresent your identity, qualifications, or reason for booking',
        ]} />
      </Section>

      <Section title="7. Account Restrictions & Bans" id="restrictions">
        <p>PulseMate reserves the right to take the following actions for guideline violations:</p>
        <Ul items={[
          'Warning — for first-time or minor violations with an explanation',
          'Temporary suspension — 7 to 30 days for repeated or moderate violations',
          'Permanent ban — for severe violations including fraud, harassment, or illegal activity',
          'Legal referral — for violations that constitute a criminal offence under Indian law',
        ]} />
        <p>Banned users may appeal within 14 days by emailing our support team with the subject "Account Ban Appeal".</p>
      </Section>

      <Section title="8. Reporting Violations" id="reporting">
        <p>If you witness a violation of these guidelines, please report it immediately:</p>
        <Ul items={[
          'In-app: Use the "Report" option on a profile or appointment screen (where available)',
          'Email: support@pulsemateconnect.in with subject "Community Violation Report"',
          'Include relevant screenshots, appointment IDs, or descriptions to help us investigate',
        ]} />
        <p>All reports are reviewed confidentially. We will not disclose the identity of the reporting user to the reported user.</p>
      </Section>

      <Section title="9. Contact" id="contact">
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
