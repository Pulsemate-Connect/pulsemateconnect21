import React from 'react';
import FormTimePicker from '../shared/FormTimePicker';
import FormCheckboxGroup from '../shared/FormCheckboxGroup';
import { DAYS_OF_WEEK } from '../../../../../utils/constants/clinicTypes';

const OperatingHoursCard = ({ register, errors, watch, setValue }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Operating Hours
        </h2>
        <p className="text-sm text-gray-600">
          Define your clinic's operating hours and weekly off days.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Opening & Closing Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormTimePicker
            label="Opening Time"
            name="openingTime"
            required
            register={register}
            watch={watch}
            setValue={setValue}
            error={errors?.openingTime?.message}
            helpText="When does your clinic open?"
          />

          <FormTimePicker
            label="Closing Time"
            name="closingTime"
            required
            register={register}
            watch={watch}
            setValue={setValue}
            error={errors?.closingTime?.message}
            helpText="When does your clinic close?"
          />
        </div>

        {/* Weekly Off Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Weekly Off Days (Optional)
          </label>
          <div className="flex flex-wrap gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const selectedDays = watch?.('weeklyOffDays') || [];
              const isSelected = selectedDays.includes(day.value);

              return (
                <label
                  key={day.value}
                  className={`
                    px-5 py-2.5 rounded-lg border-2 cursor-pointer transition-all duration-200 font-medium text-sm
                    ${
                      isSelected
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    value={day.value}
                    {...register('weeklyOffDays')}
                    className="sr-only"
                  />
                  {day.label}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Select the days when your clinic is closed
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperatingHoursCard;
