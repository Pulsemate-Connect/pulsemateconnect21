/**
 * Medical Systems and Specializations for PulseMate Connect India
 * 
 * This file contains all medical systems recognized in India and their
 * corresponding specializations for doctor profile creation.
 * 
 * Note: Dentistry is kept separate as its own medical system, not mixed
 * with Modern Medicine (Allopathy).
 */

// ============================================================================
// MEDICAL SYSTEMS
// ============================================================================

export const MEDICAL_SYSTEMS = [
  "Modern Medicine (Allopathy)",
  "Ayurveda",
  "Homeopathy",
  "Unani",
  "Siddha",
  "Sowa-Rigpa",
  "Dentistry",
  "Other / Not Listed"
];

// ============================================================================
// SPECIALIZATIONS BY MEDICAL SYSTEM
// ============================================================================

export const MODERN_MEDICINE_SPECIALIZATIONS = [
  "General Medicine / General Physician",
  "Family Medicine",
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Diabetology",
  "Endocrinology",
  "Gastroenterology",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Oncology",
  "Orthopaedics",
  "Paediatrics",
  "Psychiatry",
  "Pulmonology",
  "Rheumatology",
  "Urology",
  "General Surgery",
  "Plastic Surgery",
  "Cardiothoracic Surgery",
  "Vascular Surgery",
  "Paediatric Surgery",
  "Obstetrics & Gynaecology",
  "Ophthalmology",
  "ENT",
  "Anaesthesiology",
  "Radiology",
  "Pathology",
  "Emergency Medicine",
  "Nuclear Medicine",
  "Physical Medicine & Rehabilitation",
  "Preventive & Social Medicine",
  "Other / Not Listed"
];

export const AYURVEDA_SPECIALIZATIONS = [
  "General Ayurveda",
  "Kayachikitsa",
  "Panchakarma",
  "Shalya Tantra",
  "Shalakya Tantra",
  "Prasuti Tantra & Stree Roga",
  "Kaumarabhritya",
  "Swasthavritta & Yoga",
  "Dravyaguna",
  "Rasashastra & Bhaishajya Kalpana",
  "Other / Not Listed"
];

export const HOMEOPATHY_SPECIALIZATIONS = [
  "General Homeopathy",
  "Paediatrics",
  "Dermatology",
  "Psychiatry",
  "Gynaecology",
  "Internal Medicine",
  "Other / Not Listed"
];

export const UNANI_SPECIALIZATIONS = [
  "General Unani / Moalajat",
  "Ilmul Qabalat wa Naaswan",
  "Ilmul Atfal",
  "Ilmul Saidla",
  "Tahaffuzi wa Samaji Tib",
  "Other / Not Listed"
];

export const SIDDHA_SPECIALIZATIONS = [
  "General Siddha",
  "Maruthuvam",
  "Gunapadam",
  "Sirappu Maruthuvam",
  "Kuzhanthai Maruthuvam",
  "Other / Not Listed"
];

export const SOWA_RIGPA_SPECIALIZATIONS = [
  "General Sowa-Rigpa",
  "Internal Medicine",
  "Paediatrics",
  "External Therapies",
  "Other / Not Listed"
];

export const DENTISTRY_SPECIALIZATIONS = [
  "General Dentistry",
  "Oral & Maxillofacial Surgery",
  "Orthodontics",
  "Periodontics",
  "Prosthodontics",
  "Conservative Dentistry & Endodontics",
  "Paediatric Dentistry",
  "Oral Medicine & Radiology",
  "Oral Pathology",
  "Public Health Dentistry",
  "Other / Not Listed"
];

// ============================================================================
// SPECIALIZATIONS MAP
// ============================================================================

export const SPECIALIZATIONS_MAP = {
  "Modern Medicine (Allopathy)": MODERN_MEDICINE_SPECIALIZATIONS,
  "Ayurveda": AYURVEDA_SPECIALIZATIONS,
  "Homeopathy": HOMEOPATHY_SPECIALIZATIONS,
  "Unani": UNANI_SPECIALIZATIONS,
  "Siddha": SIDDHA_SPECIALIZATIONS,
  "Sowa-Rigpa": SOWA_RIGPA_SPECIALIZATIONS,
  "Dentistry": DENTISTRY_SPECIALIZATIONS,
  "Other / Not Listed": [] // Allow custom text input
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get specializations for a given medical system
 * @param {string} medicalSystem - The selected medical system
 * @returns {string[]} Array of specialization options
 */
export function getSpecializationsForSystem(medicalSystem) {
  return SPECIALIZATIONS_MAP[medicalSystem] || [];
}

/**
 * Check if a medical system is valid
 * @param {string} medicalSystem - The medical system to validate
 * @returns {boolean} True if valid
 */
export function isValidMedicalSystem(medicalSystem) {
  return MEDICAL_SYSTEMS.includes(medicalSystem);
}

/**
 * Check if a specialization is valid for the given medical system
 * @param {string} medicalSystem - The medical system
 * @param {string} specialization - The specialization to validate
 * @returns {boolean} True if valid
 */
export function isValidSpecialization(medicalSystem, specialization) {
  if (!specialization) return false;
  
  const validSpecializations = getSpecializationsForSystem(medicalSystem);
  
  // If medical system is "Other / Not Listed", allow any specialization
  if (medicalSystem === "Other / Not Listed") return true;
  
  // If no valid specializations defined, allow any
  if (validSpecializations.length === 0) return true;
  
  // Check if specialization is in the list
  return validSpecializations.includes(specialization);
}

/**
 * Check if custom specialization input should be shown
 * @param {string} specialization - The selected specialization
 * @returns {boolean} True if custom input should be shown
 */
export function shouldShowCustomSpecialization(specialization) {
  return specialization === "Other / Not Listed";
}

/**
 * Validate medical system and specialization combination
 * @param {Object} data - Object containing medicalSystem, specialization, customSpecialization
 * @returns {Object} Validation result with valid boolean and error message
 */
export function validateMedicalSystemAndSpecialization(data) {
  const { medicalSystem, specialization, customSpecialization } = data;
  
  // Check medical system is selected
  if (!medicalSystem) {
    return { 
      valid: false, 
      error: "Please select a medical system" 
    };
  }
  
  // Check medical system is valid
  if (!isValidMedicalSystem(medicalSystem)) {
    return { 
      valid: false, 
      error: "Please select a valid medical system" 
    };
  }
  
  // Check specialization is selected
  if (!specialization) {
    return { 
      valid: false, 
      error: "Please select a specialization" 
    };
  }
  
  // If "Other / Not Listed" selected, check custom input
  if (shouldShowCustomSpecialization(specialization)) {
    if (!customSpecialization || customSpecialization.trim() === "") {
      return { 
        valid: false, 
        error: "Please enter your specialization" 
      };
    }
    
    // Validate custom specialization length
    if (customSpecialization.trim().length < 2) {
      return { 
        valid: false, 
        error: "Specialization must be at least 2 characters" 
      };
    }
    
    if (customSpecialization.trim().length > 100) {
      return { 
        valid: false, 
        error: "Specialization must be less than 100 characters" 
      };
    }
  }
  
  // Validate specialization matches medical system
  if (!isValidSpecialization(medicalSystem, specialization) && 
      specialization !== "Other / Not Listed") {
    return { 
      valid: false, 
      error: "Invalid specialization for selected medical system" 
    };
  }
  
  return { valid: true };
}

/**
 * Get display value for specialization (handles custom specialization)
 * @param {string} specialization - The stored specialization value
 * @param {string} customSpecialization - The custom specialization if "Other" was selected
 * @returns {string} Display value
 */
export function getSpecializationDisplayValue(specialization, customSpecialization) {
  if (shouldShowCustomSpecialization(specialization) && customSpecialization) {
    return customSpecialization;
  }
  return specialization;
}

// ============================================================================
// REGISTRATION AUTHORITIES (for reference/validation)
// ============================================================================

export const REGISTRATION_AUTHORITIES = {
  "Modern Medicine (Allopathy)": [
    "National Medical Commission (NMC)",
    "Medical Council of India (MCI)",
    "Andhra Pradesh Medical Council",
    "Arunachal Pradesh Medical Council",
    "Assam Medical Council",
    "Bihar Medical Council",
    "Chhattisgarh Medical Council",
    "Delhi Medical Council",
    "Goa Medical Council",
    "Gujarat Medical Council",
    "Haryana Medical Council",
    "Himachal Pradesh Medical Council",
    "Jammu & Kashmir Medical Council",
    "Jharkhand Medical Council",
    "Karnataka Medical Council",
    "Kerala Medical Council",
    "Madhya Pradesh Medical Council",
    "Maharashtra Medical Council",
    "Manipur Medical Council",
    "Meghalaya Medical Council",
    "Mizoram Medical Council",
    "Nagaland Medical Council",
    "Odisha Council of Medical Registration",
    "Punjab Medical Council",
    "Rajasthan Medical Council",
    "Sikkim Medical Council",
    "Tamil Nadu Medical Council",
    "Telangana Medical Council",
    "Tripura Medical Council",
    "Uttar Pradesh Medical Council",
    "Uttarakhand Medical Council",
    "West Bengal Medical Council"
  ],
  "Dentistry": [
    "Dental Council of India (DCI)",
    "State Dental Councils"
  ],
  "Ayurveda": [
    "Central Council of Indian Medicine (CCIM)",
    "State AYUSH Councils"
  ],
  "Homeopathy": [
    "Central Council of Homoeopathy (CCH)",
    "State Homoeopathy Councils"
  ],
  "Unani": [
    "Central Council of Indian Medicine (CCIM)",
    "State AYUSH Councils"
  ],
  "Siddha": [
    "Central Council of Indian Medicine (CCIM)",
    "State AYUSH Councils"
  ],
  "Sowa-Rigpa": [
    "Central Council of Indian Medicine (CCIM)"
  ]
};

/**
 * Get registration authorities for a medical system
 * @param {string} medicalSystem - The medical system
 * @returns {string[]} Array of registration authority options
 */
export function getRegistrationAuthoritiesForSystem(medicalSystem) {
  return REGISTRATION_AUTHORITIES[medicalSystem] || [
    "Other / Not Listed"
  ];
}
