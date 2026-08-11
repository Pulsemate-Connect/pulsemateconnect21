import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClinicAuthModal from '../../components/modals/ClinicAuthModal';

const ClinicPartnerPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('register'); // 'login' | 'register'
  const [expandedFaq, setExpandedFaq] = useState(null);
  const navigate = useNavigate();

  const handleApplyClick = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const benefits = [
    {
      icon: '👥',
      title: 'Reach More Patients',
      description: 'Help patients discover your clinic and available doctors.',
    },
    {
      icon: '📅',
      title: 'Simplify Appointments',
      description: 'Manage bookings and appointments from one platform.',
    },
    {
      icon: '🩺',
      title: 'Manage Your Clinic',
      description: 'Manage doctors, schedules and live patient queues.',
    },
    {
      icon: '📊',
      title: 'Grow With Insights',
      description: 'Understand appointments, patient activity and clinic operations.',
    },
  ];

  const steps = [
    { number: '01', title: 'Apply as a Clinic' },
    { number: '02', title: 'Complete Clinic Profile' },
    { number: '03', title: 'Submit Required Documents' },
    { number: '04', title: 'Get Verified & Go Live' },
  ];

  const requirements = [
    'Clinic basic information',
    'Owner / administrator details',
    'Clinic contact number',
    'Clinic address and location',
    'Clinic services and operating hours',
    'Required clinic documents',
  ];

  const clinicTypes = [
    'Physiotherapy Clinics',
    'Orthopedic Clinics',
    'Multispecialty Clinics',
    'Rehabilitation Centres',
    'Other Healthcare Clinics',
  ];

  const faqs = [
    {
      question: 'What is PulseMate Connect?',
      answer:
        'PulseMate Connect is a comprehensive clinic management platform that helps clinics manage appointments, doctors, patient queues and patient connections from one unified platform.',
    },
    {
      question: 'Who can register their clinic?',
      answer:
        'Any licensed healthcare clinic or medical facility can register. This includes physiotherapy clinics, orthopedic clinics, multispecialty clinics, rehabilitation centres and other healthcare providers.',
    },
    {
      question: 'How long does verification take?',
      answer:
        'Once you submit all required documents, our team typically completes the verification process within 2-3 business days. You will receive email notifications about your verification status.',
    },
    {
      question: 'What documents are required?',
      answer:
        'You will need to provide clinic registration documents, owner identification, clinic address proof, and any relevant medical licenses. The exact requirements will be shown during the onboarding process.',
    },
    {
      question: 'Is there a fee to register?',
      answer:
        'Registration on PulseMate Connect is completely free. There are no upfront fees or hidden charges to create your clinic profile and start using the platform.',
    },
    {
      question: 'How can I get support during onboarding?',
      answer:
        'Our support team is available to help you through the onboarding process. You can reach us via email at support@pulsemateconnect.in or through the help section in your dashboard.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Partner with PulseMate Connect
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-50 max-w-3xl mx-auto">
            Grow your clinic. Connect with more patients. Simplify clinic management.
          </p>
          <p className="text-lg mb-10 text-blue-100 max-w-2xl mx-auto">
            Bring your clinic onto PulseMate Connect and manage appointments, doctors, live queues
            and patient connections from one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleApplyClick}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition shadow-lg"
            >
              Apply as a Clinic
            </button>
            <button
              onClick={handleLoginClick}
              className="text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition"
            >
              Already a Partner? Login
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Why Partner with PulseMate Connect?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600 text-lg">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <p className="text-lg font-medium text-gray-700">{step.title}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Need Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            What You'll Need
          </h2>
          <div className="bg-blue-50 p-8 rounded-xl border border-blue-200">
            <p className="text-lg text-gray-700 mb-6 font-medium">
              Keep these details ready for a smooth sign-up:
            </p>
            <ul className="space-y-4">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-lg text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Who Is PulseMate For?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {clinicTypes.map((type, index) => (
              <div
                key={index}
                className="bg-blue-50 px-6 py-4 rounded-lg border border-blue-200 text-blue-800 font-medium text-lg"
              >
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Built for Modern Clinic Operations
          </h2>
          <p className="text-xl text-gray-600">
            One platform for appointments, doctors, patient queues and clinic management.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition"
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-6 h-6 text-gray-500 transition-transform ${
                      expandedFaq === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFaq === index && (
                  <div className="p-6 pt-0 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-white">
            Ready to Bring Your Clinic to PulseMate?
          </h2>
          <button
            onClick={handleApplyClick}
            className="bg-white text-blue-600 px-10 py-5 rounded-lg font-semibold text-xl hover:bg-blue-50 transition shadow-lg mb-6"
          >
            Apply as a Clinic →
          </button>
          <p className="text-white text-lg">
            Already registered?{' '}
            <button onClick={handleLoginClick} className="underline hover:text-blue-100">
              Login
            </button>
          </p>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <ClinicAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}
    </div>
  );
};

export default ClinicPartnerPage;
