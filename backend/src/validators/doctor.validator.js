const Joi = require('joi');

const createDoctorSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Doctor name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  mobile: Joi.string()
    .required()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.empty': 'Mobile number is required',
      'string.pattern.base': 'Mobile number must be exactly 10 digits',
    }),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  specialization: Joi.string().required().messages({
    'string.empty': 'Specialization is required',
  }),
  qualification: Joi.string().required().messages({
    'string.empty': 'Qualification is required',
  }),
  experienceYears: Joi.number().integer().min(0).max(70).required().messages({
    'number.base': 'Experience years must be a number',
    'number.min': 'Experience years cannot be negative',
    'number.max': 'Experience years seems too high',
  }),
  consultationFee: Joi.number().min(0).required().messages({
    'number.base': 'Consultation fee must be a number',
    'number.min': 'Consultation fee cannot be negative',
  }),
  availableDays: Joi.array()
    .items(
      Joi.string().valid(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      )
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one available day is required',
    }),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format',
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format',
    }),
  breakStartTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow('', null),
  breakEndTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow('', null),
  consultationMode: Joi.string()
    .valid('OFFLINE', 'ONLINE', 'BOTH')
    .default('OFFLINE')
    .messages({
      'any.only': 'Consultation mode must be OFFLINE, ONLINE, or BOTH',
    }),
});

const updateDoctorSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  specialization: Joi.string().optional(),
  qualification: Joi.string().optional(),
  experienceYears: Joi.number().integer().min(0).max(70).optional(),
  consultationFee: Joi.number().min(0).optional(),
  availableDays: Joi.array()
    .items(
      Joi.string().valid(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      )
    )
    .optional(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  breakStartTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow('', null),
  breakEndTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow('', null),
  consultationMode: Joi.string()
    .valid('OFFLINE', 'ONLINE', 'BOTH')
    .optional(),
  isActive: Joi.boolean().optional(),
});

const updateDoctorProfileSchema = Joi.object({
  profileImage: Joi.string().uri().optional().allow('', null),
  qualification: Joi.string().optional(),
  specialization: Joi.string().optional(),
  experienceYears: Joi.number().integer().min(0).max(70).optional(),
  consultationFee: Joi.number().min(0).optional(),
  bio: Joi.string().max(1000).optional().allow('', null),
  licenseNumber: Joi.string().optional().allow('', null),
  medicalRegistrationNumber: Joi.string().optional().allow('', null),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  education: Joi.string().optional().allow('', null),
  languagesKnown: Joi.array().items(Joi.string()).optional(),
  onlineAvailable: Joi.boolean().optional(),
  offlineAvailable: Joi.boolean().optional(),
});

module.exports = {
  createDoctorSchema,
  updateDoctorSchema,
  updateDoctorProfileSchema,
};
