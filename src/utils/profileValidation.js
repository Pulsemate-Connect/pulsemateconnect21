/**
 * profileValidation.js
 * Shared validation rules for patient profile fields.
 * Used by both ProfileWizardScreen and EditProfileScreen (mobile).
 * Keep this in sync with the equivalent web util.
 */

// ── Constants ────────────────────────────────────────────────────────────────
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Male',   emoji: '👨' },
  { value: 'FEMALE', label: 'Female', emoji: '👩' },
  { value: 'OTHER',  label: 'Other',  emoji: '🧑' },
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

// ── Name ─────────────────────────────────────────────────────────────────────
/**
 * Capitalise the first letter of each word.
 * e.g. "rahul kumar sharma" → "Rahul Kumar Sharma"
 */
export const capitaliseName = (str = '') =>
  str
    .trimStart()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Validate full name.
 * Returns null if valid, or an error string.
 */
export const validateName = (value = '') => {
  const v = value.trim();
  if (!v)                          return 'Full name is required.';
  if (v.length < 3)                return 'Name must be at least 3 characters.';
  if (v.length > 60)               return 'Name must be 60 characters or fewer.';
  if (/[0-9]/.test(v))             return 'Name cannot contain numbers.';
  if (/[^a-zA-Z\s'-]/.test(v))    return 'Name can only contain letters, spaces, hyphens, or apostrophes.';
  return null;
};

// ── Gender ────────────────────────────────────────────────────────────────────
export const validateGender = (value = '') => {
  if (!value) return 'Please select your gender.';
  if (!['MALE', 'FEMALE', 'OTHER'].includes(value)) return 'Invalid gender value.';
  return null;
};

// ── Date of Birth ─────────────────────────────────────────────────────────────
export const validateDob = (value = '') => {
  if (!value) return 'Date of birth is required.';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Enter a valid date (YYYY-MM-DD).';
  if (d > new Date())     return 'Date of birth cannot be in the future.';
  const ageYears = (new Date() - d) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears > 120)     return 'Age cannot exceed 120 years.';
  return null;
};

/** Calculate age in whole years from a YYYY-MM-DD string. Returns null if invalid. */
export const calcAge = (dob = '') => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const years = Math.floor((new Date() - d) / (365.25 * 24 * 60 * 60 * 1000));
  return years >= 0 && years <= 120 ? years : null;
};

// ── City ──────────────────────────────────────────────────────────────────────
export const validateCity = (value = '') => {
  const v = value.trim();
  if (!v)          return 'City is required.';
  if (v.length < 2) return 'Enter a valid city name.';
  if (v.length > 60) return 'City name is too long.';
  if (/[^a-zA-Z\s.'-]/.test(v)) return 'City name contains invalid characters.';
  return null;
};

// ── Emergency Contact ─────────────────────────────────────────────────────────
/**
 * Strips all non-digits and returns the 10-digit local number.
 * Handles "+91XXXXXXXXXX", "91XXXXXXXXXX", "XXXXXXXXXX".
 */
export const normalisePhone = (raw = '') =>
  raw.replace(/\D/g, '').replace(/^91/, '').slice(0, 10);

/**
 * Validate emergency contact.
 * @param {string} value     - Already-normalised 10-digit string
 * @param {string} userPhone - Logged-in user's mobile (E.164 or 10-digit) to prevent self-reference
 */
export const validateEmergencyContact = (value = '', userPhone = '') => {
  const digits = normalisePhone(value);
  if (!digits)         return 'Emergency contact is required.';
  if (digits.length !== 10) return 'Enter exactly 10 digits.';
  if (!/^[6-9]\d{9}$/.test(digits)) return 'Enter a valid Indian mobile number.';
  const userDigits = normalisePhone(userPhone);
  if (userDigits && digits === userDigits) return 'Emergency contact cannot be your own number.';
  return null;
};

// ── Blood Group ────────────────────────────────────────────────────────────────
export const validateBloodGroup = (value = '') => {
  if (!value) return 'Please select a blood group.';
  if (!BLOOD_GROUPS.includes(value)) return 'Invalid blood group.';
  return null;
};

// ── Full form validation (wizard step-by-step) ────────────────────────────────
export const validateStep = (stepKey, form, userPhone = '') => {
  switch (stepKey) {
    case 'name':             return validateName(form.name);
    case 'gender':           return validateGender(form.gender);
    case 'dob':              return validateDob(form.dob);
    case 'city':             return validateCity(form.city);
    case 'emergencyContact': return validateEmergencyContact(form.emergencyContact, userPhone);
    case 'bloodGroup':       return validateBloodGroup(form.bloodGroup);
    case 'medical':          return null; // optional step
    default:                 return null;
  }
};

/** Returns true only when the step has a valid value (used to enable Continue). */
export const isStepValid = (stepKey, form, userPhone = '') =>
  validateStep(stepKey, form, userPhone) === null;
