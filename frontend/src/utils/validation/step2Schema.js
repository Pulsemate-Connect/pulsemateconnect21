import * as yup from 'yup';

export const step2Schema = yup.object().shape({
  // Services Offered
  specialties: yup
    .array()
    .of(yup.string())
    .min(1, 'Select at least one specialty')
    .required('Primary specialties are required'),
  
  specialtyOther: yup
    .string()
    .nullable()
    .when('specialties', {
      is: (specialties) => specialties && specialties.includes('OTHER'),
      then: (schema) => schema.required('Please specify the specialty'),
      otherwise: (schema) => schema.nullable(),
    }),
  
  consultationTypes: yup
    .array()
    .of(yup.string())
    .min(1, 'Select at least one consultation type')
    .required('Consultation types are required'),
  
  // Operating Hours
  openingTime: yup
    .string()
    .required('Opening time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  
  closingTime: yup
    .string()
    .required('Closing time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
    .test('is-greater', 'Closing time must be after opening time', function (value) {
      const { openingTime } = this.parent;
      if (!openingTime || !value) return true;
      
      const [openHour, openMin] = openingTime.split(':').map(Number);
      const [closeHour, closeMin] = value.split(':').map(Number);
      
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      return closeMinutes > openMinutes;
    }),
  
  weeklyOffDays: yup
    .array()
    .of(yup.string())
    .default([]),
  
  // Appointment Mode
  appointmentMode: yup
    .string()
    .required('Appointment mode is required')
    .oneOf(['APPOINTMENT_ONLY', 'WALK_IN_ONLY', 'BOTH'], 'Invalid appointment mode'),
});
