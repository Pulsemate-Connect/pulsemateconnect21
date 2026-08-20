import LegalLayout, { Section, InfoBox, Ul, ContactBlock } from './LegalLayout';

const TOC = [
  { id: 'purpose',    label: '1. Platform Purpose' },
  { id: 'notadvice',  label: '2. Not Medical Advice' },
  { id: 'responsibility', label: '3. Doctor & Clinic Responsibility' },
  { id: 'emergency',  label: '4. Emergency Disclaimer' },
  { id: 'relationship', label: '5. No Doctor-Patient Relationship' },
  { id: 'accuracy',   label: '6. Accuracy of Information' },
  { id: 'consult',    label: '7. Consult a Professional' },
  { id: 'contact',    label: '8. Contact' },
];

export default function MedicalDisclaimerPage() {
  return (
    <LegalLayout
      title="Medical Disclaimer"
      lastUpdated="July 17, 2026"
      toc={TOC}
      subtitle="Important information about PulseMate Connect's role as a booking platform, not a medical provider."
    >
      <Section title="1. Platform Purpose" id="purpose">
        <p>PulseMate Connect is a <strong>technology platform</strong> that enables patients to discover and book appointments with registered doctors and clinics. PulseMate does not provide, practice, or offer medical services of any kind.</p>
        <InfoBox type="warning">PulseMate Connect is a booking and queue management tool. It is NOT a medical service, hospital, or healthcare provider.</InfoBox>
      </Section>

      <Section title="2. Not Medical Advice" id="notadvice">
        <p>No content available on PulseMate Connect — including doctor profiles, specialisation descriptions, clinic listings, app notifications, or any text on this website — constitutes medical advice, diagnosis, or treatment.</p>
        <Ul items={[
          'Doctor specialisation descriptions are for informational and filtering purposes only',
          'Symptom fields collected during booking are shared with doctors, not interpreted by PulseMate',
          'Any health-related information on the platform is general in nature',
          'PulseMate does not recommend specific doctors, treatments, or medications',
        ]} />
      </Section>

      <Section title="3. Doctor & Clinic Responsibility" id="responsibility">
        <p>All medical care, diagnoses, prescriptions, and treatment decisions are the sole responsibility of the registered doctor and clinic you consult. PulseMate verifies professional credentials at registration but does not supervise, oversee, or endorse individual clinical decisions.</p>
        <p>Doctors and clinics listed on PulseMate are independent practitioners and are not employees or agents of PulseMate Connect.</p>
      </Section>

      <Section title="4. Emergency Disclaimer" id="emergency">
        <InfoBox type="danger">
          <p className="font-bold text-lg mb-2">⚠️ IF YOU ARE EXPERIENCING A MEDICAL EMERGENCY, DO NOT USE THIS APP.</p>
          <p>Call the National Emergency Number <strong>112</strong> or your nearest emergency services immediately.</p>
          <p className="mt-1">For ambulance services, call <strong>108</strong> (National Ambulance Service, India).</p>
        </InfoBox>
        <p>PulseMate Connect is not designed for emergency medical situations. In a life-threatening situation, please contact emergency services rather than attempting to book an appointment.</p>
      </Section>

      <Section title="5. No Doctor-Patient Relationship" id="relationship">
        <p>Using PulseMate Connect to browse doctor profiles, read specialisation information, or book an appointment does not in itself establish a doctor-patient relationship. A formal doctor-patient relationship is established only when a doctor accepts you as a patient and you receive medical consultation.</p>
      </Section>

      <Section title="6. Accuracy of Information" id="accuracy">
        <p>PulseMate endeavors to display accurate and up-to-date information about doctors, clinics, and their services. However, we cannot guarantee that all information is current, complete, or error-free. Clinic timings, doctor availability, and fees displayed on the platform may change without prior notice.</p>
        <p>Always confirm appointment details and fees directly with the clinic before your visit.</p>
      </Section>

      <Section title="7. Consult a Professional" id="consult">
        <p>Always seek the advice of a qualified healthcare professional for any medical condition, symptom, or health-related concern. Do not disregard professional medical advice or delay seeking it because of information you found on PulseMate Connect.</p>
        <p>PulseMate Connect is not responsible for any health decisions or outcomes arising from the use of information available on the platform.</p>
      </Section>

      <Section title="8. Contact" id="contact">
        <p>For questions about this disclaimer:</p>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}
