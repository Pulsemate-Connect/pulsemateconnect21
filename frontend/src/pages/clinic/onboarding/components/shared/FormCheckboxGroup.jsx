import React from 'react';
import * as LucideIcons from 'lucide-react';

const FormCheckboxGroup = ({
  label,
  name,
  options,
  required = false,
  error,
  register,
  watch,
  helpText,
  columns = 2,
}) => {
  const selectedValues = watch ? watch(name) : [];

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Checkbox Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-3`}>
        {options.map((option) => {
          const isChecked = selectedValues && selectedValues.includes(option.value);
          
          // Get Lucide Icon component
          const IconComponent = option.icon ? LucideIcons[option.icon] : null;
          
          return (
            <label
              key={option.value}
              className={`
                relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${
                  isChecked
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="checkbox"
                value={option.value}
                {...(register ? register(name) : {})}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {IconComponent && (
                    <IconComponent 
                      className={`w-5 h-5 ${isChecked ? 'text-blue-600' : 'text-gray-500'}`}
                    />
                  )}
                  <span className={`text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-gray-900'}`}>
                    {option.label}
                  </span>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Help Text */}
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormCheckboxGroup;
