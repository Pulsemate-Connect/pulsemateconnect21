import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const FormTimePicker = ({
  label,
  name,
  required = false,
  error,
  register,
  watch,
  setValue,
  helpText,
}) => {
  const fieldValue = watch ? watch(name) : '';
  
  // Parse the stored 24-hour format (HH:mm) into 12-hour components
  const parseTime = (time24) => {
    if (!time24) return { hour: '', minute: '', period: 'AM' };
    
    const [hourStr, minuteStr] = time24.split(':');
    const hour24 = parseInt(hourStr, 10);
    const minute = minuteStr;
    
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    
    return { hour: hour12.toString(), minute, period };
  };

  // Convert 12-hour format to 24-hour format (HH:mm)
  const formatTo24Hour = (hour12, minute, period) => {
    if (!hour12 || !minute) return '';
    
    let hour24 = parseInt(hour12, 10);
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  const parsed = parseTime(fieldValue);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  // Update local state when fieldValue changes
  useEffect(() => {
    const parsed = parseTime(fieldValue);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
  }, [fieldValue]);

  const handleHourChange = (newHour) => {
    setHour(newHour);
    if (newHour && minute && setValue) {
      const time24 = formatTo24Hour(newHour, minute, period);
      setValue(name, time24, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleMinuteChange = (newMinute) => {
    setMinute(newMinute);
    if (hour && newMinute && setValue) {
      const time24 = formatTo24Hour(hour, newMinute, period);
      setValue(name, time24, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (hour && minute && setValue) {
      const time24 = formatTo24Hour(hour, minute, newPeriod);
      setValue(name, time24, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Generate hours 1-12
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  
  // Generate minutes 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="space-y-1.5">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Hidden input for form registration */}
      <input type="hidden" {...(register ? register(name) : {})} value={fieldValue} />

      {/* Time Picker Grid */}
      <div className="flex gap-2">
        {/* Hour Select */}
        <div className="flex-1">
          <select
            value={hour}
            onChange={(e) => handleHourChange(e.target.value)}
            className={`
              w-full px-3 py-2.5 text-gray-900 text-center
              border rounded-xl transition-all duration-200
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : fieldValue
                ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-500/20'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }
              bg-white focus:outline-none focus:ring-4 cursor-pointer font-medium
            `}
          >
            <option value="">HH</option>
            {hours.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center text-gray-400 font-bold text-lg">:</div>

        {/* Minute Select */}
        <div className="flex-1">
          <select
            value={minute}
            onChange={(e) => handleMinuteChange(e.target.value)}
            className={`
              w-full px-3 py-2.5 text-gray-900 text-center
              border rounded-xl transition-all duration-200
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : fieldValue
                ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-500/20'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }
              bg-white focus:outline-none focus:ring-4 cursor-pointer font-medium
            `}
          >
            <option value="">MM</option>
            {minutes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* AM/PM Select */}
        <div className="flex-1">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className={`
              w-full px-3 py-2.5 text-gray-900 text-center
              border rounded-xl transition-all duration-200
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : fieldValue
                ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-500/20'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }
              bg-white focus:outline-none focus:ring-4 cursor-pointer font-medium
            `}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>

        {/* Clock Icon */}
        <div className="flex items-center">
          <Clock className={`w-5 h-5 ${fieldValue ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
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

export default FormTimePicker;
