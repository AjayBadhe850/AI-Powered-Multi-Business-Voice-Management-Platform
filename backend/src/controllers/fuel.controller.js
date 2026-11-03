import * as fuelService from '../services/fuel.service.js';
import { successResponse } from '../utils/responseFormatter.js';
import { logAudit } from '../utils/auditLogger.js';

export const getInventory = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const inventory = await fuelService.getInventory(businessId);
    return successResponse(res, inventory, 'Fuel inventory retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getStock = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { fuelType } = req.query;
    const stock = await fuelService.getFuelStock(businessId, fuelType);
    return successResponse(res, stock, 'Fuel stock retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const recordPurchase = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const purchase = await fuelService.recordFuelPurchase(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'RECORD_FUEL_PURCHASE',
      entityType: 'FuelPurchase',
      entityId: purchase.id,
      details: purchase,
    });

    return successResponse(res, purchase, 'Fuel purchase recorded and stock incremented', 201);
  } catch (err) {
    next(err);
  }
};

export const recordSale = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const sale = await fuelService.recordFuelSale(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'RECORD_FUEL_SALE',
      entityType: 'FuelSale',
      entityId: sale.id,
      details: sale,
    });

    return successResponse(res, sale, 'Fuel sale recorded and stock deducted', 201);
  } catch (err) {
    next(err);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const sales = await fuelService.getFuelSales(businessId);
    return successResponse(res, sales, 'Fuel sales history retrieved');
  } catch (err) {
    next(err);
  }
};

export const getPurchases = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const purchases = await fuelService.getFuelPurchases(businessId);
    return successResponse(res, purchases, 'Fuel purchases history retrieved');
  } catch (err) {
    next(err);
  }
};

