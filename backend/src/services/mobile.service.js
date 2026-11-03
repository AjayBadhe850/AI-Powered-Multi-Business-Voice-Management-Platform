import prisma from '../config/db.js';

// Prohibited non-phone keywords
const FORBIDDEN_ACCESSORIES = ['charger', 'earphone', 'headphone', 'case', 'cover', 'screen protector', 'cable', 'adapter', 'tempered glass', 'accessory'];

export const getProducts = async (businessId, search = '') => {
  const where = { businessId };
  if (search) {
    where.OR = [
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
    ];
  }

  return await prisma.mobileProduct.findMany({
    where,
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
  });
};

export const getProductById = async (businessId, productId) => {
  return await prisma.mobileProduct.findFirst({
    where: { id: productId, businessId },
  });
};

export const addProduct = async (businessId, data) => {
  const { brand, model, purchasePrice, sellingPrice, availableStock = 0, minimumStock = 5, supplier } = data;

  if (!brand || !model || purchasePrice === undefined || sellingPrice === undefined) {
    throw new Error('Brand, model, purchase price and selling price are required');
  }

  // Strict check: only mobile phones permitted!
  const combinedText = `${brand} ${model}`.toLowerCase();
  for (const forbidden of FORBIDDEN_ACCESSORIES) {
    if (combinedText.includes(forbidden)) {
      throw new Error(`Invalid item: '${forbidden}' is not permitted. AJ'S MOBILE SHOP exclusively sells mobile phones only.`);
    }
  }

  const pPrice = parseFloat(purchasePrice);
  const sPrice = parseFloat(sellingPrice);
  const stock = parseInt(availableStock, 10) || 0;
  const minStock = parseInt(minimumStock, 10) || 5;

  if (pPrice < 0 || sPrice < 0 || stock < 0) {
    throw new Error('Prices and stock must be non-negative values');
  }

  return await prisma.mobileProduct.create({
    data: {
      businessId,
      brand: brand.trim(),
      model: model.trim(),
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      availableStock: stock,
      minimumStock: minStock,
      supplier: supplier || null,
      purchaseDate: new Date(),
    },
  });
};

export const updateStock = async (businessId, productId, quantityDelta) => {
  const delta = parseInt(quantityDelta, 10);
  if (isNaN(delta)) {
    throw new Error('Invalid quantity delta');
  }

  return await prisma.$transaction(async (tx) => {
    const product = await tx.mobileProduct.findFirst({
      where: { id: productId, businessId },
    });

    if (!product) {
      throw new Error('Mobile product not found');
    }

    const newStock = product.availableStock + delta;
    if (newStock < 0) {
      throw new Error(`Insufficient stock. Current stock is ${product.availableStock}, cannot reduce by ${Math.abs(delta)}.`);
    }

    return await tx.mobileProduct.update({
      where: { id: productId },
      data: { availableStock: newStock },
    });
  });
};

export const recordPurchase = async (businessId, { productId, quantity, unitPrice, supplier }) => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('A valid positive quantity is required');
  }

  return await prisma.$transaction(async (tx) => {
    const product = await tx.mobileProduct.findFirst({
      where: { id: productId, businessId },
    });

    if (!product) {
      throw new Error('Mobile product not found');
    }

    const price = unitPrice !== undefined ? parseFloat(unitPrice) : product.purchasePrice;
    const totalAmount = qty * price;

    const purchase = await tx.mobilePurchase.create({
      data: {
        businessId,
        productId,
        quantity: qty,
        unitPrice: price,
        totalAmount,
        supplier: supplier || product.supplier || 'Wholesale Supplier',
        purchaseDate: new Date(),
      },
    });

    // Update product stock and optionally update purchase price
    await tx.mobileProduct.update({
      where: { id: productId },
      data: {
        availableStock: product.availableStock + qty,
        purchasePrice: price,
      },
    });

    return purchase;
  });
};

export const recordSale = async (businessId, { productId, quantity, unitPrice, customerName }) => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('A valid positive quantity is required for sale');
  }

  return await prisma.$transaction(async (tx) => {
    const product = await tx.mobileProduct.findFirst({
      where: { id: productId, businessId },
    });

    if (!product) {
      throw new Error('Mobile product not found in inventory');
    }

    // Strict validation: NEVER allow sales when sufficient stock is unavailable!
    if (product.availableStock < qty) {
      throw new Error(`Insufficient stock for ${product.brand} ${product.model}. Available: ${product.availableStock}, Requested: ${qty}`);
    }

    const salePrice = unitPrice !== undefined ? parseFloat(unitPrice) : product.sellingPrice;
    const totalAmount = qty * salePrice;
    const costPrice = product.purchasePrice;
    const grossProfit = (salePrice - costPrice) * qty;

    // 1. Create Sale Record
    const sale = await tx.mobileSale.create({
      data: {
        businessId,
        productId,
        quantity: qty,
        unitPrice: salePrice,
        totalAmount,
        costPrice,
        grossProfit,
        customerName: customerName || 'Retail Customer',
        saleDate: new Date(),
      },
      include: { product: true },
    });

    // 2. Reduce mobile stock atomically
    await tx.mobileProduct.update({
      where: { id: productId },
      data: { availableStock: product.availableStock - qty },
    });

    return sale;
  });
};

export const getLowStockProducts = async (businessId) => {
  const products = await prisma.mobileProduct.findMany({
    where: { businessId },
    orderBy: { availableStock: 'asc' },
  });

  return products.filter((p) => p.availableStock <= p.minimumStock);
};

export const getMobileSales = async (businessId) => {
  return await prisma.mobileSale.findMany({
    where: { businessId },
    include: { product: true },
    orderBy: { saleDate: 'desc' },
  });
};
