import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const TOC = [
  { id: 'overview',    label: '1. Overview' },
  { id: 'first',       label: '2. First Booking Free' },
  { id: 'fee',         label: '3. Platform Booking Fee (₹10)' },
  { id: 'eligibility', label: '4. Refund Eligibility' },
  { id: 'failed',      label: '5. Failed Payment Handling' },
  { id: 'duplicate',   label: '6. Duplicate Payments' },
  { id: 'cancellation',label: '7. Cancellation Refunds' },
  { id: 'nonrefund',   label: '8. Non-Refundable Cases' },
  { id: 'timeline',    label: '9. Processing Time' },
  { id: 'request',     label: '10. How to Request' },
  { id: 'contact',     label: '11. Contact' },
];

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund Policy"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="PulseMate Connect's refund terms for platform booking fees."
    >
      <Section title="1. Overview" id="overview">
        <p>This Refund Policy governs refunds of the PulseMate Connect platform booking fee. PulseMate facilitates appointment bookings — we do not collect consultation fees charged by doctors or clinics. All refunds under this policy apply only to the PulseMate platform booking fee.</p>
        <InfoBox type="info">Consultation fees paid directly to clinics are subject to the individual clinic's refund policy. PulseMate is not responsible for those refunds.</InfoBox>
      </Section>

      <Section title="2. First Booking Free" id="first">
        <p>Every new patient account receives <strong>one free booking</strong> on PulseMate Connect. No platform fee is charged for the first appointment, and therefore no refund is applicable or necessary for that booking.</p>
        <p>The free booking benefit is tied to the registered phone number and cannot be transferred.</p>
      </Section>

      <Section title="3. Platform Booking Fee (₹10)" id="fee">
        <p>From the second appointment onwards, a platform booking fee of <strong>₹10 (plus applicable GST)</strong> is charged at the time of booking confirmation. This fee covers:</p>
        <Ul items={[
          'Appointment slot reservation and confirmation',
          'Real-time queue management and live tracking',
          'SMS/push notification reminders',
          'Platform maintenance and customer support',
        ]} />
      </Section>

      <Section title="4. Refund Eligibility" id="eligibility">
        <p>You are eligible for a full refund of the platform booking fee in the following circumstances:</p>
        <Ul items={[
          'The appointment is cancelled by the clinic or doctor',
          'You cancel the appointment at least 2 hours before the scheduled slot time',
          'The payment was charged twice for the same appointment (duplicate payment)',
          'Payment failed but the booking fee was still debited from your account',
          'A technical error on our platform caused an incorrect charge',
        ]} />
      </Section>

      <Section title="5. Failed Payment Handling" id="failed">
        <p>If your payment fails (network timeout, bank decline, etc.) but the amount was debited from your account, we will initiate an automatic refund within 5–7 business days.</p>
        <p>Failed payments are identified via Razorpay's payment failure webhooks. If you experience a deduction without a booking confirmation, contact us with your Razorpay Payment ID or bank transaction reference.</p>
        <InfoBox type="warning">Do not attempt to re-book immediately if a payment fails — wait 10 minutes for Razorpay to confirm the status. Duplicate bookings due to impatient re-attempts are not automatically refundable.</InfoBox>
      </Section>

      <Section title="6. Duplicate Payments" id="duplicate">
        <p>If you are charged more than once for the same appointment booking, PulseMate will detect and flag the duplicate charge through our payment reconciliation process. A full refund of the excess charge will be initiated within 5–7 business days.</p>
        <p>To expedite, report duplicate charges by emailing us with both Razorpay Payment IDs.</p>
      </Section>

      <Section title="7. Cancellation Refunds" id="cancellation">
        <Ul items={[
          'Cancelled by patient — 2+ hours before slot: full refund of ₹10',
          'Cancelled by patient — less than 2 hours before slot: no refund',
          'Cancelled by clinic or doctor (any time): full refund of ₹10',
          'Emergency cancellation by clinic with documented reason: full refund',
        ]} />
        <p>Refunds for cancellations are initiated automatically within 24 hours of cancellation confirmation and credited to the original payment method within 5–7 business days.</p>
      </Section>

      <Section title="8. Non-Refundable Cases" id="nonrefund">
        <p>The following situations do not qualify for a refund:</p>
        <Ul items={[
          'Patient cancels within 2 hours of the scheduled appointment time',
          'Patient no-shows without cancellation',
          'Appointment completed successfully',
          'First free booking (no fee was charged)',
          'Refund request submitted more than 7 days after the appointment date',
          'Account deletion requested after appointment completion',
        ]} />
        <InfoBox type="danger">No-shows are not eligible for refunds. Please cancel your appointment in advance if you cannot attend.</InfoBox>
      </Section>

      <Section title="9. Processing Time (5–7 Business Days)" id="timeline">
        <p>Once a refund is approved and initiated by PulseMate, the timeline for credit is:</p>
        <Ul items={[
          'UPI payments: 1–3 business days',
          'Debit/Credit cards: 5–7 business days',
          'Net banking: 3–5 business days',
          'Wallets: 1–2 business days',
        ]} />
        <p>Business days exclude weekends and Indian public holidays. Delays beyond 7 business days should be escalated to our support team.</p>
      </Section>

      <Section title="10. How to Request a Refund" id="request">
        <p>Eligible refunds for cancellations are processed automatically. For all other refund requests:</p>
        <Ul items={[
          'Email support@pulsemateconnect.in with subject "Refund Request"',
          'Include your registered phone number, appointment ID, and Razorpay Payment ID',
          'We will respond within 2 business days',
        ]} />
      </Section>

      <Section title="11. Contact" id="contact">
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
