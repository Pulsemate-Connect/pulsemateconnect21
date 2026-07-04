const logger = require('../config/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File size must be 8 MB or less'
      : err.message;

    return res.status(400).json({
      success: false,
      message,
    });
  }

  // Cloudinary errors (signature, auth, quota etc.)
  if (err.message && err.message.toLowerCase().includes('invalid signature')) {
    return res.status(500).json({
      success: false,
      message: 'File upload service misconfigured (Invalid Cloudinary signature). Contact support.',
    });
  }
  if (err.http_code || (err.message && err.message.toLowerCase().includes('cloudinary'))) {
    return res.status(500).json({
      success: false,
      message: `File upload failed: ${err.message}`,
    });
  }

  // Custom thrown errors with status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Default 500
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    _debug: err.code || err.name || undefined,
  });
};

/**
 * 404 handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

module.exports = { errorHandler, notFound };
