import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const TOC = [
  { id: 'overview',   label: '1. Overview' },
  { id: 'patient',    label: '2. Patient Cancellation' },
  { id: 'clinic',     label: '3. Clinic / Doctor Cancellation' },
  { id: 'emergency',  label: '4. Emergency Cancellation' },
  { id: 'noshow',     label: '5. No-Show Policy' },
  { id: 'how',        label: '6. How to Cancel' },
  { id: 'contact',    label: '7. Contact' },
];

export default function CancellationPolicyPage() {
  return (
    <LegalLayout
      title="Cancellation Policy"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="Rules governing appointment cancellations on PulseMate Connect."
    >
      <Section title="1. Overview" id="overview">
        <p>This Cancellation Policy applies to all appointments booked through PulseMate Connect. Cancellations may be initiated by patients, doctors, or clinics. The refund entitlement depends on who cancels and how far in advance.</p>
        <InfoBox type="info">Only the PulseMate platform booking fee (₹10) is subject to this policy. Consultation fees charged by clinics are governed by the clinic's own cancellation terms.</InfoBox>
      </Section>

      <Section title="2. Patient Cancellation" id="patient">
        <p><strong>Free Cancellation (2+ hours before appointment):</strong></p>
        <p>If you cancel your appointment at least 2 hours before the scheduled slot time, you will receive a full refund of the platform booking fee. No questions asked.</p>
        <p><strong>Late Cancellation (less than 2 hours before appointment):</strong></p>
        <p>Cancellations made within 2 hours of the scheduled appointment time are non-refundable. This is to protect doctors' and clinics' time and capacity management.</p>
        <Ul items={[
          'Cancel 2+ hours before → Full ₹10 refund',
          'Cancel within 2 hours → No refund',
          'Cancel after appointment time has passed → No refund',
        ]} />
      </Section>

      <Section title="3. Clinic / Doctor Cancellation" id="clinic">
        <p>If a clinic or doctor cancels your confirmed appointment for any reason, you are entitled to a <strong>full refund</strong> of the platform booking fee, regardless of how close to the appointment time the cancellation occurs.</p>
        <InfoBox type="success">Clinic-initiated cancellations always qualify for a full refund. The refund is initiated automatically within 24 hours of the cancellation notification.</InfoBox>
        <p>Clinics and doctors that repeatedly cancel confirmed appointments may face penalties or suspension from the platform to protect patient trust.</p>
      </Section>

      <Section title="4. Emergency Cancellation" id="emergency">
        <p>In cases of genuine medical emergencies (e.g., a doctor hospitalised, a clinic shut due to natural disaster), cancellations will be treated as clinic-initiated cancellations and full refunds will be issued regardless of timing.</p>
        <p>Emergency cancellations require supporting documentation submitted to our support team within 48 hours of the event.</p>
      </Section>

      <Section title="5. No-Show Policy" id="noshow">
        <p>A "no-show" occurs when a patient does not attend their appointment and does not cancel in advance. No-shows:</p>
        <Ul items={[
          'Do not qualify for a refund of the platform booking fee',
          'Are recorded against your account',
          'Three no-shows within 60 days may result in temporary booking restrictions',
          'If you are unable to attend, please cancel as early as possible so the slot can be given to another patient',
        ]} />
        <InfoBox type="danger">Repeated no-shows waste healthcare providers' time and delay care for other patients. Please cancel proactively if your plans change.</InfoBox>
      </Section>

      <Section title="6. How to Cancel" id="how">
        <p><strong>In-App (recommended):</strong></p>
        <p>Go to the Appointments tab → Select the appointment → Tap "Cancel Appointment" → Confirm in the dialog. The cancellation is immediate and eligible refunds are automatically initiated.</p>
        <p><strong>Email / Support:</strong></p>
        <p>If you are unable to cancel in-app, contact support with your appointment ID and we will process the cancellation manually. Emergency or urgent cancellations outside app hours can be submitted to <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 underline">support@pulsemateconnect.in</a>.</p>
      </Section>

      <Section title="7. Contact" id="contact">
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
