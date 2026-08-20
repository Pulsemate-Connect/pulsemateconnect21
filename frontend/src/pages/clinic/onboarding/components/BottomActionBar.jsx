import React from 'react';
import { ArrowRight, Send } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const BottomActionBar = ({
  onSaveAndExit,
  onNext,
  isNextDisabled = false,
  isSaving = false,
  isSubmitting = false,
  showSaveButton = true,
  nextButtonText = 'Next',
  nextButtonIcon = 'ArrowRight',
}) => {
  const IconComponent = LucideIcons[nextButtonIcon] || ArrowRight;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-[1100]">
      <div className="max-w-full lg:ml-[calc(10vw+24rem)] px-6 lg:pl-12 lg:pr-[10vw] py-5 flex items-center justify-end">
        {/* Right: Next button */}
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || isSubmitting}
          className={`
            px-8 py-3.5 text-base font-semibold rounded-lg transition-all duration-200
            flex items-center gap-2 shadow-lg
            ${
              isNextDisabled || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:scale-105'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              {nextButtonText}
              <IconComponent className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomActionBar;
