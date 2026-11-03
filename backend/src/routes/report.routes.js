import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticateToken, verifyBusinessOwnership } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', reportController.getConsolidatedDashboard);
router.get('/:businessId', verifyBusinessOwnership, reportController.getBusinessReport);

export default router;

