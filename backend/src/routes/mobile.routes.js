import { Router } from 'express';
import * as mobileController from '../controllers/mobile.controller.js';
import { authenticateToken, verifyBusinessOwnership } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/:businessId/products', verifyBusinessOwnership, mobileController.getProducts);
router.get('/:businessId/products/:productId', verifyBusinessOwnership, mobileController.getProductById);
router.post('/:businessId/products', verifyBusinessOwnership, mobileController.addProduct);
router.patch('/:businessId/products/:productId/stock', verifyBusinessOwnership, mobileController.updateStock);
router.post('/:businessId/purchases', verifyBusinessOwnership, mobileController.recordPurchase);
router.post('/:businessId/sales', verifyBusinessOwnership, mobileController.recordSale);
router.get('/:businessId/low-stock', verifyBusinessOwnership, mobileController.getLowStock);
router.get('/:businessId/sales', verifyBusinessOwnership, mobileController.getSales);

export default router;

