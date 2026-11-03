import prisma from '../config/db.js';

const ALLOWED_FUEL_TYPES = ['Petrol', 'Diesel'];

export const validateFuelType = (type) => {
  if (!type) throw new Error('Fuel type is required (Petrol or Diesel)');
  const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (!ALLOWED_FUEL_TYPES.includes(normalized)) {
    throw new Error(`Invalid fuel type: '${type}'. Only 'Petrol' and 'Diesel' are permitted at AJ'S FUEL STATION.`);
  }
  return normalized;
};

export const getInventory = async (businessId) => {
  return await prisma.fuelInventory.findMany({
    where: { businessId },
    orderBy: { fuelType: 'asc' },
  });
};

export const getFuelStock = async (businessId, fuelType) => {
  const normalizedType = validateFuelType(fuelType);
  const inv = await prisma.fuelInventory.findFirst({
    where: { businessId, fuelType: normalizedType },
  });

  if (!inv) {
    throw new Error(`Inventory for fuel type ${normalizedType} not found`);
  }

  return inv;
};

export const recordFuelPurchase = async (businessId, { fuelType, quantityLitres, pricePerLitre, supplier }) => {
  const normalizedType = validateFuelType(fuelType);
  const qty = parseFloat(quantityLitres);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('A valid positive fuel quantity in litres is required');
  }

  return await prisma.$transaction(async (tx) => {
    const inv = await tx.fuelInventory.findFirst({
      where: { businessId, fuelType: normalizedType },
    });

    if (!inv) {
      throw new Error(`Fuel inventory for ${normalizedType} does not exist`);
    }

    const rate = pricePerLitre !== undefined ? parseFloat(pricePerLitre) : inv.purchasePricePerLitre;
    const totalAmount = qty * rate;

    // 1. Create fuel purchase record
    const purchase = await tx.fuelPurchase.create({
      data: {
        businessId,
        fuelInventoryId: inv.id,
        fuelType: normalizedType,
        quantityLitres: qty,
        pricePerLitre: rate,
        totalAmount,
        supplier: supplier || 'Refinery Bulk Distribution',
        purchaseDate: new Date(),
      },
    });

    // 2. Increment stock
    await tx.fuelInventory.update({
      where: { id: inv.id },
      data: {
        currentStock: inv.currentStock + qty,
        purchasePricePerLitre: rate,
      },
    });

    return purchase;
  });
};

export const recordFuelSale = async (businessId, { fuelType, quantityLitres, pricePerLitre }) => {
  const normalizedType = validateFuelType(fuelType);
  const qty = parseFloat(quantityLitres);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('A valid positive fuel quantity in litres is required for sale');
  }

  return await prisma.$transaction(async (tx) => {
    const inv = await tx.fuelInventory.findFirst({
      where: { businessId, fuelType: normalizedType },
    });

    if (!inv) {
      throw new Error(`Fuel inventory for ${normalizedType} does not exist`);
    }

    // Strict validation: Fuel quantities must NEVER become negative!
    if (inv.currentStock < qty) {
      throw new Error(`Insufficient fuel stock: only ${inv.currentStock} litres of ${normalizedType} available, requested ${qty} litres.`);
    }

    const rate = pricePerLitre !== undefined ? parseFloat(pricePerLitre) : inv.sellingPricePerLitre;
    const costRate = inv.purchasePricePerLitre;
    const totalAmount = qty * rate;
    const grossProfit = qty * (rate - costRate);

    // 1. Create fuel sale record
    const sale = await tx.fuelSale.create({
      data: {
        businessId,
        fuelInventoryId: inv.id,
        fuelType: normalizedType,
        quantityLitres: qty,
        pricePerLitre: rate,
        totalAmount,
        costPricePerLitre: costRate,
        grossProfit,
        saleDate: new Date(),
      },
    });

    // 2. Reduce stock safely
    await tx.fuelInventory.update({
      where: { id: inv.id },
      data: {
        currentStock: inv.currentStock - qty,
      },
    });

    return sale;
  });
};

export const getFuelSales = async (businessId) => {
  return await prisma.fuelSale.findMany({
    where: { businessId },
    orderBy: { saleDate: 'desc' },
  });
};

export const getFuelPurchases = async (businessId) => {
  return await prisma.fuelPurchase.findMany({
    where: { businessId },
    orderBy: { purchaseDate: 'desc' },
  });
};
