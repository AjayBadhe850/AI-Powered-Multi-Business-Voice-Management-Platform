import { Router } from 'express';
import * as travelController from '../controllers/travel.controller.js';
import { authenticateToken, verifyBusinessOwnership } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/:businessId/vehicles', verifyBusinessOwnership, travelController.getVehicles);
router.get('/:businessId/availability', verifyBusinessOwnership, travelController.checkAvailability);
router.get('/:businessId/trips', verifyBusinessOwnership, travelController.getTrips);
router.post('/:businessId/trips', verifyBusinessOwnership, travelController.createTrip);
router.post('/:businessId/revenue', verifyBusinessOwnership, travelController.recordRevenue);
router.get('/:businessId/bookings', verifyBusinessOwnership, travelController.getBookings);
router.post('/:businessId/bookings', verifyBusinessOwnership, travelController.createBooking);
router.post('/:businessId/expenses', verifyBusinessOwnership, travelController.recordTravelExpense);

export default router;
