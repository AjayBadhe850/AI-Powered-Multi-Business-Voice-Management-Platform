import * as mobileService from '../services/mobile.service.js';
import { successResponse } from '../utils/responseFormatter.js';
import { logAudit } from '../utils/auditLogger.js';

export const getProducts = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { search } = req.query;
    const products = await mobileService.getProducts(businessId, search);
    return successResponse(res, products, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { businessId, productId } = req.params;
    const product = await mobileService.getProductById(businessId, productId);
    return successResponse(res, product, 'Product details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const product = await mobileService.addProduct(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'ADD_MOBILE_PRODUCT',
      entityType: 'MobileProduct',
      entityId: product.id,
      details: product,
    });

    return successResponse(res, product, 'Mobile phone product added successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { businessId, productId } = req.params;
    const { quantityDelta } = req.body;
    const product = await mobileService.updateStock(businessId, productId, quantityDelta);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'UPDATE_MOBILE_STOCK',
      entityType: 'MobileProduct',
      entityId: product.id,
      details: { quantityDelta, newStock: product.availableStock },
    });

    return successResponse(res, product, 'Stock updated successfully');
  } catch (err) {
    next(err);
  }
};

export const recordPurchase = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const purchase = await mobileService.recordPurchase(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'RECORD_MOBILE_PURCHASE',
      entityType: 'MobilePurchase',
      entityId: purchase.id,
      details: purchase,
    });

    return successResponse(res, purchase, 'Mobile purchase recorded and inventory updated', 201);
  } catch (err) {
    next(err);
  }
};

export const recordSale = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const sale = await mobileService.recordSale(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'RECORD_MOBILE_SALE',
      entityType: 'MobileSale',
      entityId: sale.id,
      details: sale,
    });

    return successResponse(res, sale, 'Mobile phone sale recorded and inventory deducted', 201);
  } catch (err) {
    next(err);
  }
};

export const getLowStock = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const lowStock = await mobileService.getLowStockProducts(businessId);
    return successResponse(res, lowStock, 'Low stock alerts retrieved');
  } catch (err) {
    next(err);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const sales = await mobileService.getMobileSales(businessId);
    return successResponse(res, sales, 'Sales history retrieved');
  } catch (err) {
    next(err);
  }
};

