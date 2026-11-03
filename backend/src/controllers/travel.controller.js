import * as travelService from '../services/travel.service.js';
import { successResponse } from '../utils/responseFormatter.js';
import { logAudit } from '../utils/auditLogger.js';

export const getVehicles = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const vehicles = await travelService.getVehicles(businessId);
    return successResponse(res, vehicles, 'Vehicles retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const checkAvailability = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { query } = req.query;
    const result = await travelService.checkVehicleAvailability(businessId, query);
    return successResponse(res, result, 'Availability checked successfully');
  } catch (err) {
    next(err);
  }
};

export const getTrips = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const trips = await travelService.getTrips(businessId);
    return successResponse(res, trips, 'Trips retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createTrip = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const trip = await travelService.createTrip(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'CREATE_TRIP',
      entityType: 'Trip',
      entityId: trip.id,
      details: trip,
    });

    return successResponse(res, trip, 'Trip scheduled successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const bookings = await travelService.getBookings(businessId);
    return successResponse(res, bookings, 'Bookings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const booking = await travelService.createBooking(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'CREATE_BOOKING',
      entityType: 'Booking',
      entityId: booking.id,
      details: booking,
    });

    return successResponse(res, booking, 'Customer booking created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const recordRevenue = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const tripRevenue = await travelService.recordTripRevenue(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'RECORD_TRIP_REVENUE',
      entityType: 'Trip',
      entityId: tripRevenue.id,
      details: tripRevenue,
    });

    return successResponse(res, tripRevenue, 'Trip revenue recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const recordTravelExpense = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const expense = await travelService.recordTravelExpense(businessId, req.body);

    await logAudit({
      userId: req.user.id,
      businessId,
      action: 'RECORD_TRAVEL_EXPENSE',
      entityType: 'Expense',
      entityId: expense.id,
      details: expense,
    });

    return successResponse(res, expense, 'Travel expense recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};
