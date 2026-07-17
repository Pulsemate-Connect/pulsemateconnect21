import LegalPageLayout from './LegalPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const toc = [
  { id: 'respectful-conduct', label: '1. Respectful Conduct' },
  { id: 'genuine-bookings',   label: '2. Genuine Bookings Only' },
  { id: 'accurate-info',      label: '3. Accurate Information' },
  { id: 'no-spam',            label: '4. No Spam' },
  { id: 'privacy-others',     label: '5. Privacy of Others' },
  { id: 'reporting',          label: '6. Reporting Violations' },
  { id: 'consequences',       label: '7. Consequences of Violations' },
];

export default function CommunityGuidelinesPage() {
  return (
    <LegalPageLayout
      title="Community Guidelines"
      subtitle="Standards for respectful and responsible use of PulseMate Connect."
      lastUpdated="July 2026"
    >
      <p className="text-slate-600 leading-relaxed mb-8">
        PulseMate Connect is a healthcare platform that serves patients, doctors, and clinic staff.
        To maintain a safe, respectful, and effective environment for everyone, all users are
        expected to follow these Community Guidelines. Violations may result in account restrictions.
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

      <Section id="respectful-conduct" title="1. Respectful Conduct">
        <p>
          All users of PulseMate Connect — patients, doctors, receptionists, clinic owners, and
          administrative staff — must treat each other with <strong>respect and dignity</strong> at
          all times while using the platform.
        </p>
        <p>The following behaviours are strictly prohibited:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Abusive, threatening, or harassing language in any communication on the platform</li>
          <li>Personal attacks, insults, or discriminatory language of any kind</li>
          <li>Harassment of doctors, clinic staff, receptionists, or fellow patients</li>
          <li>Intimidation or coercion of any platform user</li>
          <li>Any form of hate speech based on religion, caste, gender, race, disability, or other protected characteristics</li>
        </ul>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            Abusive language, harassment, or threats will result in immediate account suspension
            pending investigation.
          </p>
        </div>
      </Section>

      <Section id="genuine-bookings" title="2. Genuine Bookings Only">
        <p>
          Book appointments on PulseMate Connect only when you <strong>genuinely intend to attend</strong>
          the appointment.
        </p>
        <p>Fake or frivolous bookings are harmful because they:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Waste the limited appointment slots of doctors and clinics</li>
          <li>Deny other genuinely ill patients the opportunity to book</li>
          <li>Disrupt clinic scheduling and queue management</li>
          <li>Waste healthcare resources</li>
        </ul>
        <p>
          If your plans change, please <strong>cancel your appointment</strong> promptly via the
          Appointments tab so the slot can be made available to others.
        </p>
      </Section>

      <Section id="accurate-info" title="3. Accurate Information">
        <p>
          Providing accurate and truthful information is essential for your safety and the quality
          of care you receive.
        </p>
        <p>You must provide accurate information when:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Registering your account (name, mobile number)</li>
          <li>Filling in your health profile (date of birth, blood group, known allergies, existing conditions)</li>
          <li>Booking appointments (symptoms, reason for visit)</li>
          <li>Providing emergency contact information</li>
        </ul>
        <p>
          Providing false or misleading health information may affect the quality and safety of
          your medical care. Deliberate misrepresentation may also result in account termination.
        </p>
      </Section>

      <Section id="no-spam" title="4. No Spam">
        <p>Do not submit repeated, unnecessary, or automated appointment requests. Spam activity includes:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Booking multiple appointments for the same slot intentionally</li>
          <li>Repeatedly booking and cancelling to test the system</li>
          <li>Using automated tools or scripts to interact with the platform</li>
          <li>Creating multiple accounts to circumvent restrictions or policies</li>
          <li>Attempting to probe or test payment flows repeatedly</li>
        </ul>
        <p>
          Spam activity disrupts the platform for genuine users and will result in account restrictions
          and potentially permanent bans.
        </p>
      </Section>

      <Section id="privacy-others" title="5. Privacy of Others">
        <p>
          Respect the privacy and personal information of all other users on the platform.
          You must not:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Share, distribute, or disclose the personal information of other patients</li>
          <li>Share appointment details, contact information, or health data of other users</li>
          <li>Photograph or record any part of the app displaying another user's information without consent</li>
          <li>Attempt to access, view, or obtain data belonging to other accounts</li>
          <li>Share screenshots or information about doctors or clinic staff without their consent</li>
        </ul>
        <p>
          Patient health information is sensitive and protected. Any breach of other users' privacy
          is a serious violation and may result in immediate account termination and legal action.
        </p>
      </Section>

      <Section id="reporting" title="6. Reporting Violations">
        <p>
          If you witness or experience a violation of these guidelines by another user, please
          report it to us immediately:
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="font-semibold text-slate-900 mb-1">Report Violations</p>
          <p className="text-sm text-slate-600 mb-2">
            Email:{' '}
            <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
              support@pulsemateconnect.in
            </a>
          </p>
          <p className="text-sm text-slate-600">
            Subject: <em>Community Guidelines Violation Report</em>
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Please include: your account details, a description of the violation, any relevant
            screenshots or evidence, and the date/time of the incident.
          </p>
        </div>
        <p>
          We investigate all reports and take action within <strong>48 business hours</strong>.
          We take user safety and platform integrity seriously.
        </p>
      </Section>

      <Section id="consequences" title="7. Consequences of Violations">
        <p>
          PulseMate Connect reserves the right to take appropriate action against users who
          violate these guidelines. Consequences may include, but are not limited to:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>
            <strong>Warning:</strong> A formal warning notification sent to the user's account
            for minor or first-time violations.
          </li>
          <li>
            <strong>Temporary Suspension:</strong> Temporary restriction of account features or
            booking capabilities for moderate violations.
          </li>
          <li>
            <strong>Permanent Account Ban:</strong> Permanent termination of the account and all
            associated data for serious, repeated, or egregious violations.
          </li>
          <li>
            <strong>Legal Action:</strong> Referral to appropriate law enforcement or legal action
            where violations constitute criminal behaviour (e.g., harassment, threats, fraud).
          </li>
        </ol>
        <p>
          PulseMate Connect's decisions regarding guideline violations are final. If you believe
          your account was incorrectly suspended, you may appeal by contacting{' '}
          <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
            support@pulsemateconnect.in
          </a>.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
