import LegalPageLayout from './LegalPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const toc = [
  { id: 'patient-cancellation',  label: '1. Patient Cancellation' },
  { id: 'cancellation-window',   label: '2. Cancellation Window' },
  { id: 'no-show-policy',        label: '3. No-Show Policy' },
  { id: 'clinic-cancellation',   label: '4. Doctor / Clinic Cancellation' },
  { id: 'emergency',             label: '5. Emergency Cancellation' },
  { id: 'walkin-cancellation',   label: '6. Walk-In Cancellation' },
  { id: 'free-booking-effect',   label: '7. Effect on Free Booking' },
];

export default function CancellationPolicyPage() {
  return (
    <LegalPageLayout
      title="Cancellation Policy"
      subtitle="Understand how cancellations are handled on PulseMate Connect."
      lastUpdated="July 2026"
    >
      <p className="text-slate-600 leading-relaxed mb-8">
        PulseMate Connect allows patients and clinics to cancel appointments under specific conditions.
        This policy ensures fairness for patients, doctors, and clinic staff alike.
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

      <Section id="patient-cancellation" title="1. Patient Cancellation">
        <p>
          Patients may cancel a confirmed appointment at any time before the appointment date
          directly from the <strong>Appointments</strong> tab in the PulseMate Connect app.
        </p>
        <p>
          Cancellation by the patient is <strong>free of charge</strong>. However, the ₹10 platform
          booking fee (if already paid) is non-refundable for voluntary patient cancellations.
          Please refer to our <a href="/refund-policy" className="text-blue-600 hover:underline">Refund Policy</a> for details.
        </p>
      </Section>

      <Section id="cancellation-window" title="2. Cancellation Window">
        <p>
          To avoid being marked as a <strong>No-Show</strong>, cancellations must be made at least
          <strong> 30 minutes</strong> before the scheduled appointment slot.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>⚠ Late Cancellations:</strong> Cancellations made within 30 minutes of the scheduled
            slot time may be recorded as a No-Show at the clinic's discretion.
          </p>
        </div>
      </Section>

      <Section id="no-show-policy" title="3. No-Show Policy">
        <p>
          A <strong>No-Show</strong> is recorded when a patient does not attend their confirmed appointment
          without prior cancellation. The following consequences apply:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>The appointment is marked as "No-Show" in the system.</li>
          <li>The ₹10 platform fee (if paid) is non-refundable for no-shows.</li>
          <li>
            Repeated no-shows (3 or more within 90 days) may result in temporary restrictions
            on new bookings or account review by the PulseMate team.
          </li>
        </ol>
        <p>
          We understand emergencies happen. If you missed an appointment due to a genuine emergency,
          please contact <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">support@pulsemateconnect.in</a>.
        </p>
      </Section>

      <Section id="clinic-cancellation" title="4. Doctor / Clinic Cancellation">
        <p>
          If a doctor or clinic cancels a confirmed appointment (e.g., due to unavailability, emergency,
          or clinic closure), the patient will be:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>Notified immediately via in-app notification and push notification.</li>
          <li>Offered the option to reschedule or cancel at their discretion.</li>
          <li>Eligible for a full refund of the platform fee as per our Refund Policy.</li>
        </ol>
        <p>
          Rescheduling is at the patient's discretion. If the patient prefers not to reschedule,
          a refund of the platform fee will be processed.
        </p>
      </Section>

      <Section id="emergency" title="5. Emergency Cancellation">
        <p>
          In emergency situations such as sudden clinic closure, natural disaster, or medical emergency
          affecting the clinic, PulseMate Connect will:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>Communicate the cancellation to all affected patients as soon as possible.</li>
          <li>Process a full refund of the platform fee for all affected appointments.</li>
          <li>Assist with rescheduling where possible.</li>
        </ol>
      </Section>

      <Section id="walkin-cancellation" title="6. Walk-In Cancellation">
        <p>
          Walk-in queue entries (added by the receptionist or by the patient at the clinic) may be
          cancelled in the following ways:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>By the <strong>receptionist</strong> from the clinic's queue management interface.</li>
          <li>By the <strong>patient</strong> before they are called for their turn.</li>
        </ol>
        <p>
          Walk-in entries typically do not involve an online platform fee payment, so no refund
          is applicable in most walk-in cancellation scenarios.
        </p>
      </Section>

      <Section id="free-booking-effect" title="7. Effect on Free Booking">
        <p>
          Each account is entitled to <strong>one free first booking</strong>. Cancelling the free
          (first) booking <strong>does not reclaim</strong> the free booking benefit.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> Once a free booking is made and subsequently cancelled by the patient,
            the free booking slot is considered used. Subsequent bookings will be subject to the ₹10 platform fee.
          </p>
        </div>
        <p>
          This policy exists to prevent abuse of the free booking benefit. We appreciate your understanding.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
