import * as expenseService from '../services/expense.service.js';
import { successResponse } from '../utils/responseFormatter.js';
import { logAudit } from '../utils/auditLogger.js';

export const getExpenses = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { category, vehicleId } = req.query;
    const expenses = await expenseService.getExpenses(businessId, { category, vehicleId });
    return successResponse(res, expenses, 'Expenses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const expense = await expenseService.createExpense(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'RECORD_EXPENSE',
      entityType: 'Expense',
      entityId: expense.id,
      details: expense,
    });

    return successResponse(res, expense, 'Expense recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};
