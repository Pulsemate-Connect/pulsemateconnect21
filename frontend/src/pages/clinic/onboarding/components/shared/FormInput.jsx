import React, { useState } from 'react';

const FormInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  register,
  prefix,
  suffix,
  maxLength,
  helpText,
  className = '',
  showLabel = true, // New prop to control label visibility
  watch, // Optional: watch function from react-hook-form to detect value
  ...props
}) => {
  // Get value from react-hook-form if watch is provided
  const fieldValue = watch ? watch(name) : undefined;
  const hasValue = fieldValue !== undefined && fieldValue !== '' && fieldValue !== null;
  
  // Determine if label should float (has value or is focused)
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = hasValue || isFocused;
  
  // Create placeholder with asterisk if required and no label is shown
  const enhancedPlaceholder = !showLabel && required && placeholder 
    ? `${placeholder} *` 
    : placeholder;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Traditional label (shown when showLabel=true and no floating effect needed) */}
      {label && showLabel && !shouldFloat && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Floating label - shows above input when there's a value or focus */}
        {label && shouldFloat && (
          <label
            htmlFor={name}
            className="absolute left-3 -top-2.5 px-1 bg-white text-xs font-medium text-blue-600 transition-all duration-200 z-10"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <span className="text-gray-500 text-sm">{prefix}</span>
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          placeholder={shouldFloat ? '' : enhancedPlaceholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...(register ? register(name) : {})}
          className={`
            w-full px-4 py-2.5 text-gray-900 placeholder-gray-400
            border rounded-xl transition-all duration-200
            ${prefix ? 'pl-12' : ''}
            ${suffix ? 'pr-12' : ''}
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : shouldFloat
              ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-500/20'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
            }
            ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-4
          `}
          {...props}
        />
        
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {suffix}
          </div>
        )}
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

export default FormInput;
