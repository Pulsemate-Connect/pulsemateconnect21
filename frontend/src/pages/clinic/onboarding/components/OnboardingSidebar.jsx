import React from 'react';
import { ONBOARDING_STEPS } from '../../../../utils/constants/clinicTypes';

const OnboardingSidebar = ({ currentStep = 1, completedSteps = [] }) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Complete your clinic registration
        </h2>
        <p className="text-sm text-gray-600">
          Set up your clinic on PulseMate Connect
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 p-8 overflow-y-auto">
        <nav className="space-y-1">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isUpcoming = step.id > currentStep;

            return (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`absolute left-7 top-14 w-0.5 h-10 transition-colors duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Step item */}
                <div
                  className={`
                    relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200
                    ${isCurrent ? 'bg-blue-50 border-2 border-blue-500' : ''}
                    ${isCompleted ? 'bg-green-50/50' : ''}
                    ${isUpcoming ? 'opacity-60' : ''}
                  `}
                >
                  {/* Step icon/number */}
                  <div
                    className={`
                      flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-200
                      ${isCurrent ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${isUpcoming ? 'bg-gray-100 text-gray-400' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3
                      className={`
                        text-sm font-semibold mb-1 transition-colors duration-200
                        ${isCurrent ? 'text-blue-600' : ''}
                        ${isCompleted ? 'text-green-600' : ''}
                        ${isUpcoming ? 'text-gray-500' : 'text-gray-900'}
                      `}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer sections */}
      <div className="border-t border-gray-100">
        {/* Documents required */}
        <button className="w-full px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Documents required</p>
              <p className="text-xs text-gray-500">for registration</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Help section */}
        <div className="px-8 py-4 bg-gray-50">
          <p className="text-xs font-medium text-gray-700 mb-2">Need help?</p>
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
  );
};

export default OnboardingSidebar;
