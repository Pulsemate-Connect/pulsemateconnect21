/**
 * profileValidation.js  (Web)
 * Shared validation rules for patient profile fields.
 * Kept in sync with PulseMateApp/src/utils/profileValidation.js
 */

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Male',   icon: '👨' },
  { value: 'FEMALE', label: 'Female', icon: '👩' },
  { value: 'OTHER',  label: 'Other',  icon: '🧑' },
];

export const POPULAR_CITIES = [
  'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra',
  'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi',
  'Amritsar', 'Allahabad', 'Jabalpur', 'Ranchi', 'Coimbatore',
  'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kochi',
  'Chandigarh', 'Guwahati', 'Thiruvananthapuram', 'Mysore', 'Mangalore',
];

export const capitaliseName = (str = '') =>
  str.trimStart().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const validateName = (value = '') => {
  const v = value.trim();
  if (!v)                       return 'Full name is required.';
  if (v.length < 3)             return 'Name must be at least 3 characters.';
  if (v.length > 60)            return 'Name must be 60 characters or fewer.';
  if (/[0-9]/.test(v))          return 'Name cannot contain numbers.';
  if (/[^a-zA-Z\s'-]/.test(v)) return 'Name can only contain letters, spaces, hyphens, or apostrophes.';
  return null;
};

export const validateGender = (value = '') => {
  if (!value) return 'Please select your gender.';
  if (!['MALE', 'FEMALE', 'OTHER'].includes(value)) return 'Invalid gender value.';
  return null;
};

export const validateDob = (value = '') => {
  if (!value) return 'Date of birth is required.';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Enter a valid date.';
  if (d > new Date())     return 'Date of birth cannot be in the future.';
  const ageYears = (new Date() - d) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears > 120)     return 'Age cannot exceed 120 years.';
  return null;
};

export const calcAge = (dob = '') => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const years = Math.floor((new Date() - d) / (365.25 * 24 * 60 * 60 * 1000));
  return years >= 0 && years <= 120 ? years : null;
};

export const validateCity = (value = '') => {
  const v = value.trim();
  if (!v)           return 'City is required.';
  if (v.length < 2) return 'Enter a valid city name.';
  if (v.length > 60) return 'City name is too long.';
  if (/[^a-zA-Z\s.'-]/.test(v)) return 'City name contains invalid characters.';
  return null;
};

export const normalisePhone = (raw = '') =>
  raw.replace(/\D/g, '').replace(/^91/, '').slice(0, 10);

export const validateEmergencyContact = (value = '', userPhone = '') => {
  const digits = normalisePhone(value);
  if (!digits)               return 'Emergency contact is required.';
  if (digits.length !== 10)  return 'Enter exactly 10 digits.';
  if (!/^[6-9]\d{9}$/.test(digits)) return 'Enter a valid Indian mobile number.';
  const userDigits = normalisePhone(userPhone);
  if (userDigits && digits === userDigits) return 'Emergency contact cannot be your own number.';
  return null;
};

export const validateBloodGroup = (value = '') => {
  if (!value) return 'Please select a blood group.';
  if (!BLOOD_GROUPS.includes(value)) return 'Invalid blood group.';
  return null;
};

export const validateStep = (stepKey, form, userPhone = '') => {
  switch (stepKey) {
    case 'name':             return validateName(form.name);
    case 'gender':           return validateGender(form.gender);
    case 'dob':              return validateDob(form.dob);
    case 'city':             return validateCity(form.city);
    case 'emergencyContact': return validateEmergencyContact(form.emergencyContact, userPhone);
    case 'bloodGroup':       return validateBloodGroup(form.bloodGroup);
    case 'medical':          return null;
    default:                 return null;
  }
};

export const isStepValid = (stepKey, form, userPhone = '') =>
  validateStep(stepKey, form, userPhone) === null;
