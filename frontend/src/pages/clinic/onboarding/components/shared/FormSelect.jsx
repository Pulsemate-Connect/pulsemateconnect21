import React from 'react';

const FormSelect = ({
  label,
  name,
  options = [],
  required = false,
  disabled = false,
  error,
  register,
  placeholder = 'Select an option',
  helpText,
  className = '',
  showLabel = true, // New prop to control label visibility
  ...props
}) => {
  // Create placeholder with asterisk if required and no label is shown
  const enhancedPlaceholder = !showLabel && required && placeholder 
    ? `${placeholder} *` 
    : placeholder;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && showLabel && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          id={name}
          name={name}
          disabled={disabled}
          {...(register ? register(name) : {})}
          className={`
            w-full px-4 py-2.5 text-gray-900
            border rounded-xl transition-all duration-200
            appearance-none cursor-pointer
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-4
          `}
          {...props}
        >
          <option value="">{enhancedPlaceholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
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

export default FormSelect;
