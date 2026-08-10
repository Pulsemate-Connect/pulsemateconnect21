import React from 'react';

const FormCheckbox = ({
  label,
  name,
  disabled = false,
  error,
  register,
  helpText,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={name}
            name={name}
            type="checkbox"
            disabled={disabled}
            {...(register ? register(name) : {})}
            className={`
              w-4 h-4 rounded border-gray-300 text-blue-600
              transition-all duration-200
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              focus:ring-4 focus:ring-blue-500/20
            `}
            {...props}
          />
        </div>
        
        {label && (
          <label
            htmlFor={name}
            className={`ml-3 text-sm font-medium text-gray-700 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {label}
          </label>
        )}
      </div>
      
      {helpText && !error && (
        <p className="text-xs text-gray-500 ml-7">{helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 ml-7">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormCheckbox;
