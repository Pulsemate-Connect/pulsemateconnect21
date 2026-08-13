import React from 'react';

const DocumentsRequiredModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const requirements = [
    'Clinic registration details',
    'Clinic PAN / business details',
    'GST number, if applicable',
    'Clinic photos & logo',
    'Clinic license',
  ];

  return (
    <>
      {/* Dark overlay */}
      <div 
        className="fixed inset-0 bg-black/65 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal - Smaller version */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Illustration Section */}
          <div className="bg-[#DCE8FF] px-6 pt-6 pb-4 flex items-center justify-center">
            {/* Healthcare/Clinic Verification Illustration */}
            <svg 
              width="180" 
              height="140" 
              viewBox="0 0 240 180" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-[180px] h-auto"
            >
              {/* Background circle */}
              <circle cx="120" cy="90" r="85" fill="#B8D4FF" opacity="0.3"/>
              
              {/* Clinic License Document (left) */}
              <g transform="translate(30, 50)">
                <rect x="0" y="0" width="60" height="80" rx="4" fill="white" stroke="#2F6FED" strokeWidth="2"/>
                <rect x="8" y="8" width="44" height="4" rx="2" fill="#2F6FED"/>
                <rect x="8" y="20" width="30" height="3" rx="1.5" fill="#9CA3AF"/>
                <rect x="8" y="28" width="35" height="3" rx="1.5" fill="#9CA3AF"/>
                <rect x="8" y="36" width="25" height="3" rx="1.5" fill="#9CA3AF"/>
                {/* Medical cross */}
                <g transform="translate(20, 50)">
                  <rect x="8" y="0" width="4" height="20" rx="2" fill="#34B968"/>
                  <rect x="0" y="8" width="20" height="4" rx="2" fill="#34B968"/>
                </g>
              </g>
              
              {/* PAN/Business Document (right) */}
              <g transform="translate(150, 60)">
                <rect x="0" y="0" width="60" height="70" rx="4" fill="white" stroke="#2F6FED" strokeWidth="2"/>
                <rect x="8" y="8" width="44" height="4" rx="2" fill="#2F6FED"/>
                <rect x="8" y="20" width="35" height="3" rx="1.5" fill="#9CA3AF"/>
                <rect x="8" y="28" width="40" height="3" rx="1.5" fill="#9CA3AF"/>
                <rect x="8" y="36" width="30" height="3" rx="1.5" fill="#9CA3AF"/>
                {/* Building icon */}
                <g transform="translate(15, 48)">
                  <rect x="0" y="8" width="30" height="16" rx="1" fill="#2F6FED"/>
                  <rect x="4" y="12" width="4" height="4" fill="white"/>
                  <rect x="10" y="12" width="4" height="4" fill="white"/>
                  <rect x="16" y="12" width="4" height="4" fill="white"/>
                  <rect x="22" y="12" width="4" height="4" fill="white"/>
                  <rect x="4" y="18" width="4" height="4" fill="white"/>
                  <rect x="10" y="18" width="4" height="4" fill="white"/>
                  <rect x="16" y="18" width="4" height="4" fill="white"/>
                  <rect x="22" y="18" width="4" height="4" fill="white"/>
                </g>
              </g>
              
              {/* Mobile Phone with Verified Badge (center bottom) */}
              <g transform="translate(95, 120)">
                {/* Phone */}
                <rect x="0" y="0" width="50" height="80" rx="8" fill="white" stroke="#2F6FED" strokeWidth="2.5"/>
                <rect x="15" y="3" width="20" height="3" rx="1.5" fill="#E5E7EB"/>
                <rect x="8" y="12" width="34" height="58" rx="2" fill="#F3F4F6"/>
                
                {/* Verified Badge on screen */}
                <g transform="translate(13, 25)">
                  <circle cx="12" cy="12" r="11" fill="#34B968"/>
                  <path d="M8 12l3 3 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </g>
                
                {/* Text on screen */}
                <rect x="12" y="52" width="26" height="2" rx="1" fill="#9CA3AF"/>
                <rect x="12" y="58" width="20" height="2" rx="1" fill="#D1D5DB"/>
                
                {/* Home button */}
                <circle cx="25" cy="72" r="3" fill="#E5E7EB"/>
              </g>
            </svg>
          </div>

          {/* Content Section */}
          <div className="px-6 py-5">
            {/* Heading */}
            <h2 className="text-[18px] font-bold text-[#171717] leading-[26px] mb-4">
              Please be ready with the following<br />for a smooth registration
            </h2>

            {/* Divider */}
            <div className="h-[1px] bg-gray-200 mb-4" />

            {/* Requirements List */}
            <div className="space-y-3 mb-4">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  {/* Green check icon */}
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-[#34B968] flex items-center justify-center mt-0.5">
                    <svg 
                      width="10" 
                      height="8" 
                      viewBox="0 0 12 10" 
                      fill="none"
                      className="text-white"
                    >
                      <path 
                        d="M1 5L4.5 8.5L11 1.5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  
                  {/* Requirement text */}
                  <span className="text-[15px] text-[#171717] leading-[22px]">
                    {requirement}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Button Section */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full bg-[#2F6FED] text-white font-semibold text-[15px] h-[48px] rounded-[12px] hover:bg-[#2557C7] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2F6FED] focus:ring-offset-2"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentsRequiredModal;
