import React from 'react';
import { Building2, Stethoscope, FileText, Handshake, File, CircleHelp, Check } from 'lucide-react';
import { ONBOARDING_STEPS } from '../../../../utils/constants/clinicTypes';
import DocumentsRequiredModal from './modals/DocumentsRequiredModal';

// Icon mapping
const iconMap = {
  Building2: Building2,
  Stethoscope: Stethoscope,
  FileText: FileText,
  Handshake: Handshake,
};

const OnboardingSidebar = ({ currentStep = 1, completedSteps = [] }) => {
  const [showDocumentsModal, setShowDocumentsModal] = React.useState(false);

  return (
    <>
      <div className="w-96 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900">
          Complete your clinic registration
        </h2>
      </div>

      {/* Steps */}
      <div className="flex-1 p-6 overflow-y-auto">
        <nav className="space-y-2">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isUpcoming = step.id > currentStep;
            const IconComponent = iconMap[step.icon];

            return (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`absolute left-6 top-16 w-0.5 h-14 transition-colors duration-300 ${
                      isCompleted ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Step item */}
                <div
                  className={`
                    relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200
                    ${isCurrent ? 'bg-blue-50 border-l-4 border-blue-500 pl-3' : ''}
                    ${!isCurrent && !isUpcoming ? 'hover:bg-gray-50' : ''}
                  `}
                >
                  {/* Step icon */}
                  <div
                    className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                      ${isCurrent ? 'bg-blue-500 text-white shadow-md' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${isUpcoming ? 'bg-gray-100 text-gray-400' : ''}
                      ${!isCurrent && !isCompleted && !isUpcoming ? 'bg-gray-100 text-gray-600' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" strokeWidth={3} />
                    ) : IconComponent ? (
                      <IconComponent className="w-5 h-5" strokeWidth={2} />
                    ) : (
                      <span className="text-lg font-semibold">{step.id}</span>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3
                      className={`
                        text-base font-semibold transition-colors duration-200
                        ${isCurrent ? 'text-blue-600' : ''}
                        ${isCompleted ? 'text-gray-900' : ''}
                        ${isUpcoming ? 'text-gray-500' : 'text-gray-900'}
                      `}
                    >
                      {step.title}
                    </h3>

                    {/* Continue button for current step */}
                    {isCurrent && (
                      <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Continue
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer sections */}
      <div className="border-t border-gray-100">
        {/* Documents required - Hide on Step 4 */}
        {currentStep !== 4 && (
          <button 
            onClick={() => setShowDocumentsModal(true)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 group border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                <File className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Documents required</p>
                <p className="text-xs text-gray-500">for registration</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Help section */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
              <CircleHelp className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700 mb-1">Need help?</p>
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
              >
                Contact PulseMate Support
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Documents Required Modal */}
    <DocumentsRequiredModal 
      isOpen={showDocumentsModal}
      onClose={() => setShowDocumentsModal(false)}
    />
  </>
  );
};

export default OnboardingSidebar;
