import LegalPageLayout from './LegalPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-20">
    <h2 className="text-xl font-semibold text-slate-900 border-l-4 border-blue-600 pl-4 mb-4">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const toc = [
  { id: 'not-a-provider',   label: '1. Not a Medical Provider' },
  { id: 'no-advice',        label: '2. No Medical Advice' },
  { id: 'doctor-resp',      label: '3. Doctor Responsibility' },
  { id: 'emergency',        label: '4. Emergency Situations' },
  { id: 'accuracy',         label: '5. Accuracy of Information' },
  { id: 'second-opinion',   label: '6. Seeking a Second Opinion' },
];

export default function MedicalDisclaimerPage() {
  return (
    <LegalPageLayout
      title="Medical Disclaimer"
      subtitle="Important information about the nature and limitations of PulseMate Connect."
      lastUpdated="July 2026"
    >
      {/* Important Notice Box */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-amber-900 text-lg mb-2">Important Notice</p>
            <p className="text-amber-800 text-sm leading-relaxed">
              PulseMate Connect is a <strong>healthcare appointment and queue management platform</strong>.
              We are <strong>NOT</strong> a medical provider, hospital, diagnostic centre, or pharmacy.
              Nothing on this platform constitutes medical advice, diagnosis, or treatment.
              Always consult a qualified and licensed healthcare professional for medical decisions.
            </p>
          </div>
        </div>
      </div>

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

      <Section id="not-a-provider" title="1. Not a Medical Provider">
        <p>
          PulseMate Connect is a <strong>technology platform</strong> that facilitates the booking
          of appointments with independent healthcare professionals and clinics. We are not:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>A hospital, clinic, or medical institution</li>
          <li>A provider of medical services or treatments</li>
          <li>A diagnostic or laboratory service</li>
          <li>A pharmacy or drug dispensary</li>
          <li>An emergency medical service</li>
        </ul>
        <p>
          The doctors, clinics, and healthcare professionals listed on PulseMate Connect are
          independent practitioners. PulseMate Connect acts only as a facilitating platform
          connecting patients with these professionals.
        </p>
      </Section>

      <Section id="no-advice" title="2. No Medical Advice">
        <p>
          All content, information, and features provided on the PulseMate Connect platform —
          including but not limited to symptom descriptions, doctor specializations, clinic
          categories, and appointment booking flows — are provided for <strong>informational
          and administrative purposes only</strong>.
        </p>
        <p>
          None of the content on this platform should be interpreted as:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Medical advice or a substitute for professional medical advice</li>
          <li>A medical diagnosis of any condition or disease</li>
          <li>A treatment recommendation or prescription</li>
          <li>An endorsement of any specific doctor, clinic, treatment, or medication</li>
        </ul>
        <p>
          Always seek the advice of a qualified healthcare professional for any questions you
          may have regarding your health or medical condition. Never disregard professional
          medical advice or delay seeking it because of information you have read on this platform.
        </p>
      </Section>

      <Section id="doctor-resp" title="3. Doctor Responsibility">
        <p>
          All medical advice, clinical assessments, diagnoses, prescriptions, and treatment
          decisions made during or after consultations facilitated through PulseMate Connect are
          the <strong>sole responsibility of the licensed healthcare professional (doctor)</strong>
          you consult.
        </p>
        <p>
          PulseMate Connect:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Does not supervise or monitor medical consultations</li>
          <li>Is not responsible for the quality of medical care provided by doctors or clinics</li>
          <li>Does not validate, review, or endorse clinical decisions made by healthcare professionals</li>
          <li>
            Is not liable for any outcomes arising from medical consultations facilitated through
            the platform
          </li>
        </ul>
        <p>
          By using PulseMate Connect to book appointments, you acknowledge that any healthcare
          decisions are made between you and the healthcare professional, and that PulseMate
          Connect bears no responsibility for those decisions.
        </p>
      </Section>

      <Section id="emergency" title="4. Emergency Situations">
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
          <p className="font-bold text-red-900 text-lg mb-2">🚨 PulseMate Connect is NOT for medical emergencies.</p>
          <p className="text-red-800 text-sm leading-relaxed mb-3">
            If you or someone else is experiencing a medical emergency, do not use this app.
            Seek immediate emergency medical assistance:
          </p>
          <ul className="list-disc list-inside space-y-2 text-red-800 text-sm">
            <li><strong>Emergency Services India: Call 112</strong></li>
            <li><strong>Ambulance: Call 108</strong></li>
            <li>Go immediately to the nearest hospital emergency room</li>
            <li>Contact your nearest healthcare facility</li>
          </ul>
        </div>
        <p>
          PulseMate Connect is designed for <strong>planned, non-emergency</strong> healthcare
          appointments. It is not monitored in real-time and cannot dispatch emergency services.
          Do not rely on this platform for urgent or life-threatening medical situations.
        </p>
      </Section>

      <Section id="accuracy" title="5. Accuracy of Information">
        <p>
          Doctor and clinic profiles on PulseMate Connect are created and maintained by the
          healthcare professionals and clinic owners themselves. While PulseMate Connect
          verifies basic credentials during the clinic and doctor onboarding process, we:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>
            <strong>Cannot guarantee</strong> the accuracy, completeness, or currency of all
            medical qualifications, specializations, or experience listed.
          </li>
          <li>Do not independently verify every degree, certificate, or claim made by healthcare professionals.</li>
          <li>Are not responsible for information that becomes outdated after verification.</li>
        </ul>
        <p>
          We strongly encourage patients to verify a doctor's credentials independently, especially
          for specialized or complex medical procedures. You may check credentials with:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
          <li>Indian Medical Council (NMC) — <a href="https://www.nmc.org.in" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">nmc.org.in</a></li>
          <li>State Medical Council of Karnataka</li>
          <li>The doctor's clinic or hospital directly</li>
        </ul>
      </Section>

      <Section id="second-opinion" title="6. Seeking a Second Opinion">
        <p>
          PulseMate Connect <strong>encourages</strong> patients to seek second opinions from
          other qualified healthcare professionals for:
        </p>
        <ul className="list-disc list-inside space-y-2 text-slate-600">
          <li>Serious, complex, or life-altering medical diagnoses</li>
          <li>Recommended surgical procedures or major treatments</li>
          <li>Situations where you feel uncertain about a diagnosis or treatment plan</li>
          <li>Chronic conditions requiring long-term management</li>
        </ul>
        <p>
          Seeking a second opinion is your right as a patient and is a responsible approach to
          healthcare decision-making. PulseMate Connect supports this by making it easy to
          find and book appointments with multiple healthcare professionals.
        </p>
        <p>
          If you have concerns about the medical information or advice you received, contact the
          appropriate medical regulatory body or patient rights organization in your region.
        </p>
      </Section>
    </LegalPageLayout>
  );
}
