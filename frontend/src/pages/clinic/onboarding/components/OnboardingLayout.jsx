import React from 'react';
import OnboardingSidebar from './OnboardingSidebar';
import OnboardingHeader from './OnboardingHeader';

const OnboardingLayout = ({ 
  currentStep = 1, 
  completedSteps = [],
  children,
  hideOnMobile = false,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <OnboardingHeader />

      {/* Two-column layout - Add padding-top to account for fixed navbar */}
      <div className="flex flex-1 pt-16">
        {/* Left spacing - 10% of screen width */}
        <div className="hidden lg:block lg:w-[10vw] flex-shrink-0" />
        
        {/* Left Sidebar - Hidden on mobile, sticky on desktop */}
        <aside className={`hidden lg:block ${hideOnMobile ? 'lg:hidden' : ''}`}>
          <OnboardingSidebar 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
          />
        </aside>

        {/* Mobile Progress Header */}
        <div className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 z-30 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">
                Step {currentStep} of 4
              </p>
              <h1 className="text-sm font-semibold text-gray-900 mt-0.5">
                {currentStep === 1 && 'Clinic Information'}
                {currentStep === 2 && 'Services & Operations'}
                {currentStep === 3 && 'Clinic Documents'}
                {currentStep === 4 && 'Partner Agreement'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step < currentStep
                      ? 'w-8 bg-green-500'
                      : step === currentStep
                      ? 'w-12 bg-blue-500'
                      : 'w-8 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <main className="flex-1">
          {/* Content wrapper with padding - 10% spacing on right only */}
          <div className="pt-24 lg:pt-0 pb-24 px-6 lg:pl-12 lg:pr-[10vw] max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OnboardingLayout;
