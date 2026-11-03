import { Router } from 'express';
import * as fuelController from '../controllers/fuel.controller.js';
import { authenticateToken, verifyBusinessOwnership } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/:businessId/inventory', verifyBusinessOwnership, fuelController.getInventory);
router.get('/:businessId/stock', verifyBusinessOwnership, fuelController.getStock);
router.post('/:businessId/purchases', verifyBusinessOwnership, fuelController.recordPurchase);
router.post('/:businessId/sales', verifyBusinessOwnership, fuelController.recordSale);
router.get('/:businessId/sales', verifyBusinessOwnership, fuelController.getSales);
router.get('/:businessId/purchases', verifyBusinessOwnership, fuelController.getPurchases);

export default router;
