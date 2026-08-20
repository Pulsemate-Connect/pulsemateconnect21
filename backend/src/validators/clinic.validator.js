const Joi = require('joi');

const createClinicSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  phone: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  openingTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  closingTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  description: Joi.string().optional().allow(''),
});

const updateClinicSchema = createClinicSchema.fork(
  ['name'],
  (schema) => schema.optional()
);

const addStaffSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  mobile: Joi.string().pattern(/^\+?[0-9\s-]{10,15}$/).required().messages({
    'string.pattern.base': 'Mobile number must be 10-15 digits, can include +, spaces, or dashes',
    'any.required': 'Mobile number is required'
  }),
  role: Joi.string().valid('DOCTOR', 'RECEPTIONIST').required().messages({
    'any.required': 'Role is required',
    'any.only': 'Role must be either DOCTOR or RECEPTIONIST'
  }),
  name: Joi.string().optional().allow(''),
  email: Joi.string().email().optional().allow('').messages({
    'string.email': 'Email must be a valid email address'
  }),
  password: Joi.string().min(6).optional().allow('', null).messages({
    'string.min': 'Password must be at least 6 characters'
  }),
  specialization: Joi.string().optional().allow('', null),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    console.error('[Validation Error]', {
      url: req.url,
      method: req.method,
      body: req.body,
      errors: errors,
      errorDetails: error.details,
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
    });
  }
  req.body = value;
  next();
};

module.exports = { createClinicSchema, updateClinicSchema, addStaffSchema, validate };
