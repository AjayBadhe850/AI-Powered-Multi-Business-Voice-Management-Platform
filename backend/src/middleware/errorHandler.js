import { errorResponse } from '../utils/responseFormatter.js';

export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Application Error:', err);
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return errorResponse(res, `Duplicate field value: ${err.meta?.target || 'Resource already exists'}`, 409);
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found in database', 404);
  }

  const msg = err.message || '';
  const isClientError =
    err.statusCode === 400 ||
    msg.toLowerCase().includes('required') ||
    msg.toLowerCase().includes('insufficient') ||
    msg.toLowerCase().includes('invalid') ||
    msg.toLowerCase().includes('not permitted') ||
    msg.toLowerCase().includes('must be');

  const statusCode = err.statusCode || (isClientError ? 400 : 500);
  const message = msg || 'Internal server error occurred';

  return errorResponse(res, message, statusCode);
};
