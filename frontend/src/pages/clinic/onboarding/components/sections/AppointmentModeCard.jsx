import React from 'react';
import * as LucideIcons from 'lucide-react';
import { APPOINTMENT_MODES } from '../../../../../utils/constants/clinicTypes';

const AppointmentModeCard = ({ register, errors, watch }) => {
  const selectedMode = watch?.('appointmentMode');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Appointment Mode
        </h2>
        <p className="text-sm text-gray-600">
          How do you accept patients at your clinic?
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Select Appointment Mode
          <span className="text-red-500 ml-1">*</span>
        </label>

        <div className="grid grid-cols-1 gap-3">
          {APPOINTMENT_MODES.map((mode) => {
            const isSelected = selectedMode === mode.value;
            const IconComponent = LucideIcons[mode.icon];

            return (
              <label
                key={mode.value}
                className={`
                  relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  value={mode.value}
                  {...register('appointmentMode')}
                  className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                
                {IconComponent && (
                  <IconComponent 
                    className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                  />
                )}
                
                <span className={`text-base font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {mode.label}
                </span>
              </label>
            );
          })}
        </div>

        {errors?.appointmentMode && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.appointmentMode.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppointmentModeCard;
