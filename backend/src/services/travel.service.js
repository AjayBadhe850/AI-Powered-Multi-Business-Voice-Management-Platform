import prisma from '../config/db.js';

export const getVehicles = async (businessId) => {
  return await prisma.vehicle.findMany({
    where: { businessId },
    include: {
      driver: true,
      _count: {
        select: { trips: true, bookings: true, expenses: true },
      },
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
};

export const checkVehicleAvailability = async (businessId, query = '') => {
  const q = (query || '').toLowerCase().trim();
  const vehicles = await prisma.vehicle.findMany({
    where: { businessId },
    include: { driver: true },
    orderBy: { name: 'asc' },
  });

  if (q.includes('bus')) {
    const bus = vehicles.find((v) => v.type === 'Bus' || v.name.toLowerCase().includes('bus'));
    if (!bus) return { available: false, message: 'No bus found in fleet' };
    return {
      available: bus.status === 'Available',
      vehicle: bus,
      message: `Your bus (${bus.name}, Reg: ${bus.vehicleNumber}) is currently ${bus.status}.`,
    };
  }

  if (q.includes('car 1') || q.includes('car one') || q.includes('first car')) {
    const car = vehicles.find((v) => v.name.toLowerCase() === 'car 1');
    if (!car) return { available: false, message: 'Car 1 not found in fleet' };
    return {
      available: car.status === 'Available',
      vehicle: car,
      message: `${car.name} (${car.vehicleNumber}) is currently ${car.status}.`,
    };
  }

  if (q.includes('car 2') || q.includes('car two') || q.includes('second car')) {
    const car = vehicles.find((v) => v.name.toLowerCase() === 'car 2');
    if (!car) return { available: false, message: 'Car 2 not found in fleet' };
    return {
      available: car.status === 'Available',
      vehicle: car,
      message: `${car.name} (${car.vehicleNumber}) is currently ${car.status}.`,
    };
  }

  if (q.includes('car 3') || q.includes('car three') || q.includes('third car')) {
    const car = vehicles.find((v) => v.name.toLowerCase() === 'car 3');
    if (!car) return { available: false, message: 'Car 3 not found in fleet' };
    return {
      available: car.status === 'Available',
      vehicle: car,
      message: `${car.name} (${car.vehicleNumber}) is currently ${car.status}.`,
    };
  }

  // General availability summary
  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  return {
    total: vehicles.length,
    availableCount: availableVehicles.length,
    vehicles,
    message: `${availableVehicles.length} of ${vehicles.length} vehicles are currently available.`,
  };
};

export const getTrips = async (businessId) => {
  return await prisma.trip.findMany({
    where: { businessId },
    include: {
      vehicle: true,
      driver: true,
    },
    orderBy: { startDate: 'desc' },
  });
};

export const createTrip = async (businessId, data) => {
  const { vehicleId, driverId, origin, destination, startDate, endDate, revenue = 0, notes } = data;

  if (!vehicleId || !origin || !destination) {
    throw new Error('Vehicle, origin, and destination are required to create a trip');
  }

  return await prisma.trip.create({
    data: {
      businessId,
      vehicleId,
      driverId: driverId || null,
      origin,
      destination,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      revenue: parseFloat(revenue) || 0,
      notes: notes || null,
    },
    include: {
      vehicle: true,
      driver: true,
    },
  });
};

export const getBookings = async (businessId) => {
  return await prisma.booking.findMany({
    where: { businessId },
    include: { vehicle: true },
    orderBy: { tripDate: 'desc' },
  });
};

export const createBooking = async (businessId, data) => {
  const { customerName, customerPhone, pickupLocation, dropLocation, tripDate, fare, vehicleId } = data;

  if (!customerName || !pickupLocation || !dropLocation || fare === undefined) {
    throw new Error('Customer name, locations, and fare amount are required');
  }

  return await prisma.booking.create({
    data: {
      businessId,
      vehicleId: vehicleId || null,
      customerName,
      customerPhone: customerPhone || 'N/A',
      pickupLocation,
      dropLocation,
      tripDate: tripDate ? new Date(tripDate) : new Date(),
      fare: parseFloat(fare),
      status: 'Confirmed',
    },
    include: { vehicle: true },
  });
};

export const recordTripRevenue = async (businessId, { amount, vehicleId = null, tripId = null, notes = '' }) => {
  const revAmount = parseFloat(amount);
  if (isNaN(revAmount) || revAmount <= 0) {
    throw new Error('A valid positive revenue amount is required');
  }

  if (tripId) {
    const existing = await prisma.trip.findFirst({
      where: { id: tripId, businessId },
    });
    if (existing) {
      return await prisma.trip.update({
        where: { id: tripId },
        data: { revenue: existing.revenue + revAmount },
      });
    }
  }

  // If vehicleId not provided, default to first available vehicle or bus
  let assignedVehicleId = vehicleId;
  if (!assignedVehicleId) {
    const defaultVehicle = await prisma.vehicle.findFirst({ where: { businessId } });
    assignedVehicleId = defaultVehicle?.id;
  }

  if (!assignedVehicleId) {
    throw new Error('No vehicle available to assign trip revenue');
  }

  return await prisma.trip.create({
    data: {
      businessId,
      vehicleId: assignedVehicleId,
      origin: 'Recorded Trip Revenue',
      destination: 'Service Area',
      startDate: new Date(),
      endDate: new Date(),
      status: 'Completed',
      revenue: revAmount,
      notes: notes || 'Directly recorded trip revenue',
    },
    include: { vehicle: true },
  });
};

export const recordTravelExpense = async (businessId, { category, amount, vehicleId = null, driverId = null, vehicleQuery = null, description = '' }) => {
  const expAmount = parseFloat(amount);
  if (isNaN(expAmount) || expAmount <= 0) {
    throw new Error('A valid positive expense amount is required');
  }

  let finalVehicleId = vehicleId;

  // Resolve vehicle from text query if vehicleId wasn't passed directly (e.g. "car one", "bus")
  if (!finalVehicleId && vehicleQuery) {
    const vQuery = vehicleQuery.toLowerCase();
    const vehicles = await prisma.vehicle.findMany({ where: { businessId } });
    if (vQuery.includes('bus')) {
      finalVehicleId = vehicles.find((v) => v.type === 'Bus' || v.name.toLowerCase().includes('bus'))?.id;
    } else if (vQuery.includes('car 1') || vQuery.includes('car one') || vQuery.includes('car_1')) {
      finalVehicleId = vehicles.find((v) => v.name.toLowerCase() === 'car 1')?.id;
    } else if (vQuery.includes('car 2') || vQuery.includes('car two') || vQuery.includes('car_2')) {
      finalVehicleId = vehicles.find((v) => v.name.toLowerCase() === 'car 2')?.id;
    } else if (vQuery.includes('car 3') || vQuery.includes('car three') || vQuery.includes('car_3')) {
      finalVehicleId = vehicles.find((v) => v.name.toLowerCase() === 'car 3')?.id;
    }
  }

  const validCategories = ['maintenance', 'fuel', 'driver', 'operating', 'other'];
  const cat = validCategories.includes((category || '').toLowerCase()) ? category.toLowerCase() : 'operating';

  return await prisma.expense.create({
    data: {
      businessId,
      category: cat,
      amount: expAmount,
      vehicleId: finalVehicleId || null,
      driverId: driverId || null,
      description: description || `Travel ${cat} expense`,
      expenseDate: new Date(),
    },
    include: {
      vehicle: true,
      driver: true,
    },
  });
};

