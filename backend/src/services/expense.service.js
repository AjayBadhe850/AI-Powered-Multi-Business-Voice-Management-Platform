import prisma from '../config/db.js';

export const getExpenses = async (businessId, filters = {}) => {
  const where = { businessId };
  if (filters.category) {
    where.category = filters.category.toLowerCase();
  }
  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }

  return await prisma.expense.findMany({
    where,
    include: {
      vehicle: true,
      driver: true,
    },
    orderBy: { expenseDate: 'desc' },
  });
};

export const createExpense = async (businessId, { category, amount, description, vehicleId = null, driverId = null, expenseDate = null }) => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('A valid positive expense amount is required');
  }

  if (!category) {
    throw new Error('Expense category is required');
  }

  return await prisma.expense.create({
    data: {
      businessId,
      category: category.toLowerCase().trim(),
      amount: parsedAmount,
      description: description || `Recorded ${category} expense`,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    },
    include: {
      vehicle: true,
      driver: true,
    },
  });
};
