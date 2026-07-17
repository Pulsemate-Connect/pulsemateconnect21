import LegalPageLayout from './LegalPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const toc = [
  { id: 'right-to-delete',    label: '1. Your Right to Delete' },
  { id: 'what-deleted',       label: '2. What Gets Deleted' },
  { id: 'what-retained',      label: '3. What Is Retained' },
  { id: 'how-to-delete',      label: '4. How to Delete Your Account' },
  { id: 'timeline',           label: '5. Processing Timeline' },
  { id: 'data-portability',   label: '6. Data Portability' },
];

export default function DataDeletionPage() {
  return (
    <LegalPageLayout
      title="Data Deletion Policy"
      subtitle="Your right to delete your account and personal data from PulseMate Connect."
      lastUpdated="July 2026"
    >
      <p className="text-slate-600 leading-relaxed mb-8">
        PulseMate Connect respects your privacy and your right to control your personal data.
        This policy explains what happens when you delete your account, what data is removed,
        and what may be retained for legal or operational purposes.
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

      <Section id="right-to-delete" title="1. Your Right to Delete">
        <p>
          You have the <strong>full right</strong> to delete your PulseMate Connect account and all
          associated personal data at any time, without needing to provide a reason.
        </p>
        <p>
          This right is provided in accordance with applicable data protection laws in India and
          our commitment to user privacy.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            Your deletion request will be processed within <strong>30 days</strong>. During this period,
            you may cancel the request by contacting support.
          </p>
        </div>
      </Section>

      <Section id="what-deleted" title="2. What Gets Deleted">
        <p>Upon account deletion, the following data is permanently removed or anonymised:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Personal information (name, phone number, email address)</li>
          <li>Full appointment history and booking records</li>
          <li>Profile data (date of birth, gender, blood group, known allergies, medical conditions)</li>
          <li>Notification history and FCM device tokens</li>
          <li>Uploaded documents (prescriptions, medical records)</li>
          <li>Payment records (subject to legal retention requirements — see Section 3)</li>
          <li>Location preferences and saved searches</li>
          <li>Emergency contact information</li>
        </ul>
        <p>
          You will be immediately signed out of all devices and your account will no longer be
          accessible upon initiation of the deletion process.
        </p>
      </Section>

      <Section id="what-retained" title="3. What Is Retained">
        <p>
          Some data may be retained even after account deletion, strictly in the following circumstances:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>
            <strong>Anonymised / Aggregated Data:</strong> Statistical data that cannot be linked
            to your identity (e.g., total appointments in a region, platform usage trends). This
            data is never linked back to you.
          </li>
          <li>
            <strong>Legal Retention:</strong> Records required by law, tax regulations, or for
            legitimate dispute resolution may be retained for up to <strong>3 years</strong> in
            anonymised form. This includes payment transaction records as required by financial
            compliance regulations.
          </li>
          <li>
            <strong>Fraud Prevention:</strong> In cases of suspected fraud or misuse, relevant
            records may be retained for investigation purposes as permitted by law.
          </li>
        </ol>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            All retained data is stored in anonymised form and is <strong>not linked to your
            personal identity</strong> after deletion.
          </p>
        </div>
      </Section>

      <Section id="how-to-delete" title="4. How to Delete Your Account">
        <p>You can delete your account through any of the following methods:</p>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 mb-1">Option A: Mobile App</p>
            <p className="text-sm text-slate-600">
              Open the PulseMate Connect app → Go to <strong>Profile</strong> tab →
              Scroll to <strong>Settings</strong> → Tap <strong>Delete Account</strong> →
              Confirm your choice.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 mb-1">Option B: Web Portal</p>
            <p className="text-sm text-slate-600">
              Log in at <a href="https://pulsemateconnect.in" className="text-blue-600 hover:underline">pulsemateconnect.in</a> →
              Go to <strong>Profile Settings</strong> → Click <strong>Delete Account</strong> →
              Confirm deletion. <br />
              Direct link:{' '}
              <a href="/delete-account" className="text-blue-600 hover:underline">
                pulsemateconnect.in/delete-account
              </a>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-slate-900 mb-1">Option C: Email Request</p>
            <p className="text-sm text-slate-600">
              Send an email to{' '}
              <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
                support@pulsemateconnect.in
              </a>{' '}
              with the subject: <em>"Account Deletion Request"</em>. Include your registered
              mobile number for verification.
            </p>
          </div>
        </div>
      </Section>

      <Section id="timeline" title="5. Processing Timeline">
        <p>
          Account deletion requests are processed within <strong>30 days</strong> of submission.
          The process involves:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>Immediate sign-out from all active sessions.</li>
          <li>Cancellation of all pending/upcoming appointments.</li>
          <li>Deletion of FCM tokens and notification data.</li>
          <li>Anonymisation of personal information (name, phone, email) within 30 days.</li>
          <li>Removal of uploaded documents and profile data.</li>
        </ol>
        <p>
          During the 30-day window, you may <strong>cancel the deletion request</strong> by
          contacting{' '}
          <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
            support@pulsemateconnect.in
          </a>. After 30 days, deletion is irreversible.
        </p>
      </Section>

      <Section id="data-portability" title="6. Data Portability">
        <p>
          Before deleting your account, you may request a copy of your personal data. To do so,
          email{' '}
          <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
            support@pulsemateconnect.in
          </a>{' '}
          with the subject: <em>"Data Export Request"</em>.
        </p>
        <p>
          We will provide your data in a machine-readable format (JSON or CSV) within <strong>7 business days</strong>.
          The export will include your profile information, appointment history, and payment records.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
