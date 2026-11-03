/**
 * Standardized API response formatters
 */

export const successResponse = (res, data, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};

