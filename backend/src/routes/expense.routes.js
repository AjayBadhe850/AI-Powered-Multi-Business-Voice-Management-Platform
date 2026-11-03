import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import { authenticateToken, verifyBusinessOwnership } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/:businessId', verifyBusinessOwnership, expenseController.getExpenses);
router.post('/:businessId', verifyBusinessOwnership, expenseController.createExpense);

export default router;
