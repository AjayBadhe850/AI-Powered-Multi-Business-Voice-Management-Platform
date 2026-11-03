import prisma from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export const getAllBusinesses = async (req, res, next) => {
  try {
    const businesses = await prisma.business.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, businesses, 'Businesses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getBusinessById = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: req.user.id },
      include: {
        vehicles: true,
        fuelInventories: true,
        mobileProducts: true,
      },
    });

    if (!business) {
      return errorResponse(res, 'Business not found or access denied', 404);
    }

    return successResponse(res, business, 'Business retrieved successfully');
  } catch (err) {
    next(err);
  }
};

