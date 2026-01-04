/**
 * Utility functions for standardized API responses
 * All responses follow the envelope format: {success, data, meta}
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Object} meta - Optional metadata (pagination, etc.)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data, meta = {}, statusCode = 200) {
  if (res.headersSent) {
    console.warn('Attempted to send success response but headers already sent');
    return;
  }
  res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string|Error} error - Error message or Error object
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function sendError(res, error, statusCode = 500) {
  if (res.headersSent) {
    console.warn('Attempted to send error response but headers already sent', error);
    return;
  }
  const message = error instanceof Error ? error.message : error;
  res.status(statusCode).json({
    success: false,
    data: null,
    meta: {
      error: message,
    },
  });
}

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {string|Object} errors - Validation errors
 */
function sendValidationError(res, errors) {
  if (res.headersSent) {
    console.warn('Attempted to send validation error response but headers already sent', errors);
    return;
  }
  res.status(400).json({
    success: false,
    data: null,
    meta: {
      error: "Validation failed",
      errors: typeof errors === "string" ? { message: errors } : errors,
    },
  });
}

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
};

