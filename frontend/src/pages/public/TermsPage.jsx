import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './legal/LegalLayout';

const TOC = [
  { id: 'acceptance',     label: '1. Acceptance of Terms' },
  { id: 'service',        label: '2. Description of Service' },
  { id: 'accounts',       label: '3. User Accounts & Eligibility' },
  { id: 'booking',        label: '4. Appointment Booking Rules' },
  { id: 'cancellation',   label: '5. Cancellation & Rescheduling' },
  { id: 'queue',          label: '6. Queue Management' },
  { id: 'walkin',         label: '7. Walk-in Appointments' },
  { id: 'online',         label: '8. Online Consultations' },
  { id: 'availability',   label: '9. Doctor Availability' },
  { id: 'clinic',         label: '10. Clinic Responsibility' },
  { id: 'fee',            label: '11. Platform Booking Fee' },
  { id: 'refund',         label: '12. Refund Policy Summary' },
  { id: 'prohibited',     label: '13. Prohibited Activities' },
  { id: 'ip',             label: '14. Intellectual Property' },
  { id: 'liability',      label: '15. Limitation of Liability' },
  { id: 'suspension',     label: '16. Account Suspension & Termination' },
  { id: 'law',            label: '17. Governing Law & Jurisdiction' },
  { id: 'amendments',     label: '18. Amendments' },
  { id: 'contact',        label: '19. Contact' },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="Please read these terms carefully before using PulseMate Connect."
    >
      <Section title="1. Acceptance of Terms" id="acceptance">
        <p>By downloading, installing, or using the PulseMate Connect application or website, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree, do not use the Service.</p>
        <InfoBox type="warning">These Terms constitute a legally binding agreement between you and PulseMate Connect. Please read them in full before using the platform.</InfoBox>
      </Section>

      <Section title="2. Description of Service" id="service">
        <p>PulseMate Connect is a digital healthcare appointment management platform that enables patients to discover, book, and manage appointments with registered doctors and clinics. The platform provides real-time queue tracking, online consultations, and payment processing.</p>
        <p>PulseMate Connect is a technology intermediary. We do not provide medical services directly. All medical care is provided by independent healthcare professionals registered on our platform.</p>
      </Section>

      <Section title="3. User Accounts & Eligibility" id="accounts">
        <Ul items={[
          'You must be at least 13 years old to create an account',
          'One phone number may be associated with one patient account',
          'You are responsible for maintaining the confidentiality of your account',
          'You must provide accurate information during registration',
          'Accounts created using false information may be suspended without notice',
          'Clinic owners and doctors must complete identity and credential verification before listing',
        ]} />
      </Section>

      <Section title="4. Appointment Booking Rules" id="booking">
        <Ul items={[
          'Bookings are confirmed only after successful payment (where applicable)',
          'A platform booking fee of ₹10 is charged per appointment (first booking free)',
          'You may book only for yourself or an immediate family member',
          'Double-booking the same doctor at the same time is not permitted',
          'Appointment slots are subject to doctor availability and session capacity',
        ]} />
      </Section>

      <Section title="5. Cancellation & Rescheduling" id="cancellation">
        <p>Cancellations made at least 2 hours before the appointment time are eligible for a full refund of the platform booking fee. Cancellations made within 2 hours of the appointment are non-refundable.</p>
        <p>Rescheduling is treated as a new booking. The original booking must be cancelled and a new appointment created. Platform fees for the new booking apply.</p>
        <p>See our full <a href="/cancellation-policy" className="text-blue-600 underline">Cancellation Policy</a> for detailed terms.</p>
      </Section>

      <Section title="6. Queue Management" id="queue">
        <p>PulseMate provides a real-time live queue tracking feature. Queue positions are dynamic and subject to change based on doctor pace, patient no-shows, and emergency consultations.</p>
        <Ul items={[
          'Estimated wait times are indicative and not guaranteed',
          'You must check in at the clinic upon arrival to activate your queue position',
          'Failure to check in within a reasonable time may result in skipping your turn',
          'PulseMate is not liable for delays caused by clinic-side factors',
        ]} />
      </Section>

      <Section title="7. Walk-in Appointments" id="walkin">
        <p>Clinics may enable walk-in bookings through the receptionist portal. Walk-in patients are added to the queue and do not receive a booking confirmation in advance. Platform fees do not apply to walk-in bookings managed by the clinic.</p>
      </Section>

      <Section title="8. Online Consultations" id="online">
        <p>Where offered by a doctor, online video consultations are conducted through the platform. You are responsible for having a stable internet connection. Technical failures on your end do not qualify for a refund. Consultation recordings are not stored by PulseMate.</p>
      </Section>

      <Section title="9. Doctor Availability" id="availability">
        <p>Doctor availability is managed by the clinic and is subject to change without prior notice. PulseMate endeavors to display accurate schedules but does not guarantee that a doctor's listed availability will match actual availability at the time of booking.</p>
        <p>If your appointment is cancelled due to doctor unavailability, you will receive a full refund of the platform booking fee.</p>
      </Section>

      <Section title="10. Clinic Responsibility" id="clinic">
        <p>Registered clinics are solely responsible for the quality and accuracy of medical care provided by their affiliated doctors. PulseMate is a booking intermediary and bears no responsibility for medical outcomes, misdiagnosis, or treatment errors.</p>
        <p>Clinics are required to honour confirmed appointments. Repeated cancellations by a clinic may result in suspension from the platform.</p>
      </Section>

      <Section title="11. Platform Booking Fee" id="fee">
        <p>A non-refundable platform booking fee of <strong>₹10 (plus applicable GST)</strong> is charged per appointment to facilitate the booking service. The first appointment booked on PulseMate is free of the platform fee.</p>
        <InfoBox type="info">The platform booking fee is separate from any consultation fee charged by the doctor or clinic. PulseMate does not collect consultation fees.</InfoBox>
      </Section>

      <Section title="12. Refund Policy Summary" id="refund">
        <p>Refunds of the platform booking fee are issued in these scenarios:</p>
        <Ul items={[
          'Appointment cancelled by the clinic or doctor — full refund',
          'Patient cancels at least 2 hours before the appointment — full refund',
          'Duplicate or failed payments — full refund',
        ]} />
        <p>See our full <a href="/refund-policy" className="text-blue-600 underline">Refund Policy</a> for complete terms and processing timelines.</p>
      </Section>

      <Section title="13. Prohibited Activities" id="prohibited">
        <Ul items={[
          'Creating fake appointments or spamming the booking system',
          'Impersonating another patient, doctor, or clinic',
          'Attempting to bypass authentication or hack the platform',
          'Uploading false medical credentials or clinic documents',
          'Using the platform for any non-medical commercial activity',
          'Reverse-engineering or scraping the app or API',
          'Harassing or abusing healthcare providers or other users',
        ]} />
        <InfoBox type="danger">Violations will result in immediate account suspension and may be reported to law enforcement.</InfoBox>
      </Section>

      <Section title="14. Intellectual Property" id="ip">
        <p>All content, trademarks, logos, software, and designs on PulseMate Connect are owned by or licensed to PulseMate Connect. You may not reproduce, distribute, or create derivative works without written permission.</p>
        <p>User-generated content (profile photos, clinic images) remains your property. By uploading, you grant PulseMate a limited licence to display it within the Service.</p>
      </Section>

      <Section title="15. Limitation of Liability" id="liability">
        <p>To the fullest extent permitted by applicable Indian law, PulseMate Connect shall not be liable for:</p>
        <Ul items={[
          'Any medical outcomes, treatment results, or health decisions made based on platform information',
          'Service interruptions, data loss, or technical failures beyond our reasonable control',
          'Actions or omissions of doctors, clinics, or third-party service providers',
          'Indirect, incidental, or consequential damages arising from use of the platform',
        ]} />
        <p>Our aggregate liability shall not exceed the platform booking fees paid by you in the 3 months preceding the claim.</p>
      </Section>

      <Section title="16. Account Suspension & Termination" id="suspension">
        <p>PulseMate reserves the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or negatively impact other users or healthcare providers.</p>
        <p>You may terminate your account at any time by using the in-app Delete Account feature or by contacting our support team.</p>
      </Section>

      <Section title="17. Governing Law & Jurisdiction" id="law">
        <p>These Terms are governed by the laws of India. Any disputes arising from the use of PulseMate Connect shall be subject to the exclusive jurisdiction of courts located in <strong>Karwar, Karnataka, India</strong>.</p>
        <p>Disputes shall first be attempted to be resolved through mutual negotiation within 30 days before escalation to legal proceedings.</p>
      </Section>

      <Section title="18. Amendments" id="amendments">
        <p>We may revise these Terms at any time. Updated terms will be posted on this page with a revised "Last Updated" date. Continued use of the Service after changes constitutes your acceptance of the new terms. For material changes, we will provide at least 14 days' notice via in-app notification.</p>
      </Section>

      <Section title="19. Contact" id="contact">
        <p>For questions about these Terms, contact:</p>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
