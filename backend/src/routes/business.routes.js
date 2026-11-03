import { Router } from 'express';
import * as businessController from '../controllers/business.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', businessController.getAllBusinesses);
router.get('/:businessId', businessController.getBusinessById);

export default router;
