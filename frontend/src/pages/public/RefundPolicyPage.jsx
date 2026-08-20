import LegalPageLayout from './LegalPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const toc = [
  { id: 'free-booking',      label: '1. First Booking Free' },
  { id: 'platform-fee',      label: '2. Platform Booking Fee' },
  { id: 'eligible-refunds',  label: '3. Eligible Refund Conditions' },
  { id: 'non-refundable',    label: '4. Non-Refundable Situations' },
  { id: 'failed-payment',    label: '5. Failed Payment' },
  { id: 'duplicate-payment', label: '6. Duplicate Payment' },
  { id: 'processing-time',   label: '7. Processing Time' },
  { id: 'how-to-request',    label: '8. How to Request a Refund' },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      subtitle="Our commitment to fair and transparent refunds."
      lastUpdated="July 2026"
    >
      {/* Intro */}
      <p className="text-slate-600 leading-relaxed mb-8">
        PulseMate Connect is committed to fair and transparent billing. This policy explains when
        refunds are applicable for the ₹10 platform booking fee and how to request them.
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

      <Section id="free-booking" title="1. First Booking Free">
        <p>
          Your very first appointment booking on PulseMate Connect is completely <strong>free of charge</strong>.
          No payment is required, and therefore no refund is applicable for the first booking.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800">✓ First appointment booking = ₹0 — no payment, no refund needed.</p>
        </div>
      </Section>

      <Section id="platform-fee" title="2. Platform Booking Fee">
        <p>
          From the <strong>second booking onward</strong>, a ₹10 platform fee applies per appointment.
          This fee enables our queue management system, real-time tracking, digital appointment confirmation,
          and all infrastructure required to deliver the service.
        </p>
        <p>
          This fee is separate from any consultation or treatment fees charged directly by the doctor or clinic.
        </p>
      </Section>

      <Section id="eligible-refunds" title="3. Eligible Refund Conditions">
        <p>A refund of the ₹10 platform fee will be issued in the following situations:</p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>
            <strong>Technical Error:</strong> Payment was deducted but the appointment was not confirmed
            due to a system or technical error on our platform.
          </li>
          <li>
            <strong>Duplicate / Double Charge:</strong> The same appointment was charged more than once
            due to a payment processing error.
          </li>
          <li>
            <strong>Clinic Cancellation:</strong> The clinic or doctor cancelled the confirmed appointment
            after the platform fee was paid by the patient.
          </li>
        </ol>
      </Section>

      <Section id="non-refundable" title="4. Non-Refundable Situations">
        <p>The ₹10 platform fee is <strong>non-refundable</strong> in the following situations:</p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>The patient voluntarily cancels the appointment after successful booking.</li>
          <li>The patient does not show up for the appointment (No-Show).</li>
          <li>The appointment was successfully confirmed and the patient attended the consultation.</li>
        </ol>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> The platform fee covers the cost of booking infrastructure and queue
            management regardless of whether a consultation occurs. It is not a consultation fee.
          </p>
        </div>
      </Section>

      <Section id="failed-payment" title="5. Failed Payment">
        <p>
          If a payment attempt fails and the appointment is not created, <strong>no charge is applied</strong>.
          You will not be billed for failed transactions.
        </p>
        <p>
          In the rare event that a payment failure results in a charge without appointment creation,
          an automatic reversal will be initiated within <strong>5–7 business days</strong> to your
          original payment method.
        </p>
      </Section>

      <Section id="duplicate-payment" title="6. Duplicate Payment">
        <p>
          If a duplicate charge occurs for the same appointment (e.g., double tap or network retry),
          the second amount will be refunded within <strong>3–5 business days</strong> to the original
          payment method used.
        </p>
        <p>
          Please contact us at <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">support@pulsemateconnect.in</a> with
          your booking ID and payment details so we can process this promptly.
        </p>
      </Section>

      <Section id="processing-time" title="7. Processing Time">
        <p>
          Approved refunds are processed to the original payment method within <strong>5–7 business days</strong>
          from the date of approval. The time for the amount to reflect in your account depends on
          your bank or payment provider.
        </p>
        <p>
          Razorpay (our payment partner) may take an additional 2–3 business days after processing
          to reflect in your bank account or wallet.
        </p>
      </Section>

      <Section id="how-to-request" title="8. How to Request a Refund">
        <p>To request a refund, email us at:</p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="font-semibold text-slate-900 mb-2">support@pulsemateconnect.in</p>
          <p className="text-sm text-slate-600 mb-1">Subject: <em>Refund Request — [Your Booking ID]</em></p>
          <p className="text-sm text-slate-600 mb-3">Please include:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
            <li>Your registered mobile number</li>
            <li>Booking / Appointment ID</li>
            <li>Payment reference or Razorpay Order ID</li>
            <li>Reason for refund request</li>
          </ul>
        </div>
        <p>We will acknowledge your request within 24–48 business hours and process eligible refunds promptly.</p>
      </Section>
    </LegalPageLayout>
  );
}
