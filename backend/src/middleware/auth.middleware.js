import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/responseFormatter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vocal_labs_secure_jwt_secret_key_2026_super_safe';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 'Authentication required: No token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return errorResponse(res, 'User session invalid or user no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired authentication token', 403);
  }
};

export const verifyBusinessOwnership = async (req, res, next) => {
  const businessId = req.params.businessId || req.body.businessId || req.query.businessId;

  if (!businessId) {
    return errorResponse(res, 'Business ID is required for this operation', 400);
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return errorResponse(res, 'Business not found', 404);
    }

    if (business.userId !== req.user.id) {
      return errorResponse(res, 'Access denied: You do not own this business', 403);
    }

    req.business = business;
    next();
  } catch (err) {
    return errorResponse(res, 'Error verifying business authorization', 500);
  }
};
