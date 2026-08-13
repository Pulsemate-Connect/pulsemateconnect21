import * as yup from 'yup';

export const step4Schema = yup.object().shape({
  // Acceptance Checkboxes
  confirmAuthorized: yup
    .boolean()
    .oneOf([true], 'You must confirm that you are authorized to register this clinic')
    .required('This confirmation is required'),
  
  termsAccepted: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions to proceed')
    .required('Acceptance of terms is required'),
  
  confirmAccurate: yup
    .boolean()
    .oneOf([true], 'You must confirm that the information submitted is accurate')
    .required('This confirmation is required'),
  
  confirmCompliance: yup
    .boolean()
    .oneOf([true], 'You must agree to comply with applicable requirements')
    .required('This confirmation is required'),
});
