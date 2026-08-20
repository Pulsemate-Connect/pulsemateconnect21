import React from 'react';

const OnboardingHeader = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex flex-col">
              <span className="text-xl font-bold">
                <span className="text-blue-600">PulseMate </span>
                <span className="text-green-600">Connect</span>
              </span>
              <span className="text-xs text-center -mt-1 text-gray-500">
                — Clinic Partner —
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default OnboardingHeader;
