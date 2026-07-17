import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './legal/LegalLayout';

const TOC = [
  { id: 'right',      label: '1. Your Right to Delete' },
  { id: 'deleted',    label: '2. What Gets Deleted' },
  { id: 'retained',   label: '3. What Gets Retained' },
  { id: 'how',        label: '4. How to Request Deletion' },
  { id: 'timeline',   label: '5. Processing Timeline' },
  { id: 'warning',    label: '6. Irreversibility Warning' },
  { id: 'contact',    label: '7. Contact' },
];

export default function DeleteAccountPage() {
  return (
    <LegalLayout
      title="Data Deletion Policy"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="Your rights to delete your account and personal data from PulseMate Connect."
    >
      <Section title="1. Your Right to Delete" id="right">
        <p>You have the right to request the permanent deletion of your PulseMate Connect account and all associated personal data at any time, at no cost.</p>
        <p>This policy is compliant with Google Play's Data Deletion requirements and applicable Indian privacy regulations. We honour all valid deletion requests within 30 calendar days.</p>
        <InfoBox type="info">Account deletion is a permanent action. Once completed, your account cannot be recovered. You will need to create a new account to use PulseMate Connect again.</InfoBox>
      </Section>

      <Section title="2. What Gets Deleted" id="deleted">
        <p>Upon account deletion, the following personal data is permanently removed or anonymised:</p>
        <Ul items={[
          'Full name and display name',
          'Registered mobile phone number',
          'Email address (if provided)',
          'Date of birth, gender, blood group',
          'City, emergency contact number',
          'Known allergies and existing medical conditions',
          'Profile photo',
          'FCM push notification tokens (all devices)',
          'Payment method preferences and transaction linkage',
          'All active and pending appointments (cancelled with applicable refunds)',
          'Session tokens across all logged-in devices',
        ]} />
      </Section>

      <Section title="3. What Gets Retained" id="retained">
        <p>Certain records are retained in anonymised or aggregate form to comply with legal, audit, and healthcare regulatory requirements:</p>
        <Ul items={[
          'Appointment history — retained in anonymised form (no name, no contact, no identifiers) for healthcare audit trails',
          'Payment transaction records — retained for GST, tax audit, and financial compliance as required under Indian law',
          'Abuse or fraud reports — retained in anonymised form if your account was flagged for safety violations',
          'Aggregate analytics — anonymised usage statistics that cannot be linked back to any individual',
        ]} />
        <InfoBox type="warning">Retained records are anonymised and cannot be used to identify you. They are kept solely to satisfy statutory obligations and are never used for marketing or profiling.</InfoBox>
      </Section>

      <Section title="4. How to Request Deletion" id="how">
        <p>You can request account deletion through any of the following methods:</p>
        <p><strong>In-App (recommended):</strong></p>
        <p>Open PulseMate Connect → Profile tab → Scroll to bottom → Tap "Delete Account" → Confirm in the two-step dialog.</p>
        <p><strong>Web Portal:</strong></p>
        <p>Visit <a href="https://pulsemateconnect.in/delete-account" className="text-blue-600 underline">pulsemateconnect.in/delete-account</a> and follow the instructions.</p>
        <p><strong>Email Request:</strong></p>
        <p>Send an email to <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 underline">support@pulsemateconnect.in</a> with the subject line: <strong>"Account Deletion Request"</strong> and include your registered phone number for verification.</p>
      </Section>

      <Section title="5. Processing Timeline" id="timeline">
        <Ul items={[
          'In-app deletion: immediate anonymisation of PII, account deactivated within minutes',
          'Email or web requests: verified and processed within 30 calendar days',
          'Confirmation email sent upon completion of deletion',
          'Anonymised records retained for legal purposes as described above',
        ]} />
      </Section>

      <Section title="6. Irreversibility Warning" id="warning">
        <InfoBox type="danger">
          <p className="font-bold mb-1">⚠️ This action cannot be undone.</p>
          <p>Once your account is deleted, all your personal data, appointment history, and profile information will be permanently removed. You will be immediately logged out of all devices. Any pending refunds will be processed before deletion is finalised.</p>
        </InfoBox>
        <p>If you have active upcoming appointments, we recommend cancelling them first to ensure any eligible refunds are processed promptly.</p>
      </Section>

      <Section title="7. Contact" id="contact">
        <p>For assistance with account deletion or to confirm your request has been processed:</p>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
