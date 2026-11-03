import prisma from '../config/db.js';

const getDateFilter = (timeframe) => {
  const now = new Date();
  if (timeframe === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { gte: start };
  } else if (timeframe === 'yesterday') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { gte: start, lt: end };
  } else if (timeframe === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: start };
  }
  return undefined;
};

export const getConsolidatedDashboard = async (userId, timeframe = 'all') => {
  const dateFilter = getDateFilter(timeframe);

  // 1. Fetch businesses with related fleet and inventories
  const businesses = await prisma.business.findMany({
    where: { userId },
    include: {
      vehicles: { include: { driver: true } },
      mobileProducts: true,
      fuelInventories: true,
    },
  });

  const travelBiz = businesses.find((b) => b.type === 'TRAVEL' || b.name === "AJ'S TRAVEL");
  const mobileBiz = businesses.find((b) => b.type === 'MOBILE' || b.name === "AJ'S MOBILE SHOP");
  const fuelBiz = businesses.find((b) => b.type === 'FUEL' || b.name === "AJ'S FUEL STATION");

  // Prepare where conditions
  const tripWhere = travelBiz ? { businessId: travelBiz.id, ...(dateFilter ? { startDate: dateFilter } : {}) } : null;
  const bookingWhere = travelBiz ? { businessId: travelBiz.id, ...(dateFilter ? { tripDate: dateFilter } : {}) } : null;
  const expWhereTravel = travelBiz ? { businessId: travelBiz.id, ...(dateFilter ? { expenseDate: dateFilter } : {}) } : null;

  const saleWhereMobile = mobileBiz ? { businessId: mobileBiz.id, ...(dateFilter ? { saleDate: dateFilter } : {}) } : null;
  const expWhereMobile = mobileBiz ? { businessId: mobileBiz.id, ...(dateFilter ? { expenseDate: dateFilter } : {}) } : null;

  const saleWhereFuel = fuelBiz ? { businessId: fuelBiz.id, ...(dateFilter ? { saleDate: dateFilter } : {}) } : null;
  const expWhereFuel = fuelBiz ? { businessId: fuelBiz.id, ...(dateFilter ? { expenseDate: dateFilter } : {}) } : null;

  const allBizIds = businesses.map((b) => b.id);

  // 2. Execute ALL metrics queries concurrently in ONE parallel round-trip
  const [
    trips,
    bookings,
    travelExpensesRows,
    mobileSales,
    mobileExpensesRows,
    fuelSales,
    fuelExpensesRows,
    recentTrips,
    recentMobileSales,
    recentFuelSales,
    recentExpenses,
  ] = await Promise.all([
    tripWhere ? prisma.trip.findMany({ where: tripWhere, select: { revenue: true } }) : Promise.resolve([]),
    bookingWhere ? prisma.booking.findMany({ where: bookingWhere, select: { id: true } }) : Promise.resolve([]),
    expWhereTravel ? prisma.expense.findMany({ where: expWhereTravel, select: { amount: true } }) : Promise.resolve([]),

    saleWhereMobile ? prisma.mobileSale.findMany({ where: saleWhereMobile, select: { totalAmount: true, grossProfit: true } }) : Promise.resolve([]),
    expWhereMobile ? prisma.expense.findMany({ where: expWhereMobile, select: { amount: true } }) : Promise.resolve([]),

    saleWhereFuel ? prisma.fuelSale.findMany({ where: saleWhereFuel, select: { totalAmount: true, grossProfit: true } }) : Promise.resolve([]),
    expWhereFuel ? prisma.expense.findMany({ where: expWhereFuel, select: { amount: true } }) : Promise.resolve([]),

    travelBiz ? prisma.trip.findMany({ where: { businessId: travelBiz.id }, take: 5, orderBy: { startDate: 'desc' } }) : Promise.resolve([]),
    mobileBiz ? prisma.mobileSale.findMany({ where: { businessId: mobileBiz.id }, take: 5, include: { product: true }, orderBy: { saleDate: 'desc' } }) : Promise.resolve([]),
    fuelBiz ? prisma.fuelSale.findMany({ where: { businessId: fuelBiz.id }, take: 5, orderBy: { saleDate: 'desc' } }) : Promise.resolve([]),
    allBizIds.length > 0 ? prisma.expense.findMany({ where: { businessId: { in: allBizIds } }, take: 5, include: { business: true }, orderBy: { expenseDate: 'desc' } }) : Promise.resolve([]),
  ]);

  // Travel calculation
  const travelTripsCount = trips.length;
  const travelRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const travelBookingsCount = bookings.length;
  const travelExpenses = travelExpensesRows.reduce((sum, e) => sum + (e.amount || 0), 0);

  const fleetStatus = { total: 0, available: 0, onTrip: 0, maintenance: 0, busAvailable: false, carsAvailable: 0 };
  if (travelBiz) {
    const vehicles = travelBiz.vehicles || [];
    fleetStatus.total = vehicles.length;
    fleetStatus.available = vehicles.filter((v) => v.status === 'Available').length;
    fleetStatus.onTrip = vehicles.filter((v) => v.status === 'On Trip').length;
    fleetStatus.maintenance = vehicles.filter((v) => v.status === 'Under Maintenance').length;
    const bus = vehicles.find((v) => v.type === 'Bus' || v.name.toLowerCase().includes('bus'));
    fleetStatus.busAvailable = bus?.status === 'Available';
    fleetStatus.carsAvailable = vehicles.filter((v) => (v.type === 'Car' || v.name.toLowerCase().includes('car')) && v.status === 'Available').length;
  }

  // Mobile calculations
  const mobileSalesCount = mobileSales.length;
  const mobileRevenue = mobileSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const mobileGrossProfit = mobileSales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
  const mobileExpenses = mobileExpensesRows.reduce((sum, e) => sum + (e.amount || 0), 0);
  const mobileProducts = mobileBiz?.mobileProducts || [];
  const lowStockProducts = mobileProducts.filter((p) => p.availableStock <= p.minimumStock);

  // Fuel calculations
  const fuelSalesCount = fuelSales.length;
  const fuelRevenue = fuelSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const fuelGrossProfit = fuelSales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
  const fuelExpenses = fuelExpensesRows.reduce((sum, e) => sum + (e.amount || 0), 0);

  const inventories = fuelBiz?.fuelInventories || [];
  const petrol = inventories.find((i) => i.fuelType === 'Petrol');
  const diesel = inventories.find((i) => i.fuelType === 'Diesel');
  const petrolStock = petrol?.currentStock || 0;
  const dieselStock = diesel?.currentStock || 0;

  // Combined totals
  const totalRevenue = travelRevenue + mobileRevenue + fuelRevenue;
  const totalExpenses = travelExpenses + mobileExpenses + fuelExpenses;
  const totalGrossProfit = (travelRevenue - travelExpenses) + mobileGrossProfit + fuelGrossProfit;
  const estimatedNetProfit = totalRevenue - totalExpenses;

  return {
    timeframe,
    summary: {
      totalRevenue,
      totalExpenses,
      totalGrossProfit,
      estimatedNetProfit,
    },
    businesses: {
      travel: {
        id: travelBiz?.id,
        name: travelBiz?.name || "AJ'S TRAVEL",
        revenue: travelRevenue,
        expenses: travelExpenses,
        netIncome: travelRevenue - travelExpenses,
        tripsCount: travelTripsCount,
        bookingsCount: travelBookingsCount,
        fleetStatus,
      },
      mobile: {
        id: mobileBiz?.id,
        name: mobileBiz?.name || "AJ'S MOBILE SHOP",
        revenue: mobileRevenue,
        grossProfit: mobileGrossProfit,
        expenses: mobileExpenses,
        netIncome: mobileGrossProfit - mobileExpenses,
        salesCount: mobileSalesCount,
        lowStockAlertsCount: lowStockProducts.length,
        lowStockProducts,
      },
      fuel: {
        id: fuelBiz?.id,
        name: fuelBiz?.name || "AJ'S FUEL STATION",
        revenue: fuelRevenue,
        grossProfit: fuelGrossProfit,
        expenses: fuelExpenses,
        netIncome: fuelGrossProfit - fuelExpenses,
        salesCount: fuelSalesCount,
        stocks: {
          petrolLitres: petrolStock,
          dieselLitres: dieselStock,
        },
      },
    },
    recentTransactions: {
      trips: recentTrips,
      mobileSales: recentMobileSales,
      fuelSales: recentFuelSales,
      expenses: recentExpenses,
    },
  };
};

export const getBusinessReport = async (businessId, timeframe = 'all') => {
  const dateFilter = getDateFilter(timeframe);

  // 1. Fetch business with relations
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      vehicles: true,
      fuelInventories: true,
      mobileProducts: true,
    },
  });

  if (!business) {
    throw new Error('Business not found');
  }

  const expWhere = { businessId, ...(dateFilter ? { expenseDate: dateFilter } : {}) };

  // 2. Fetch expenses and business-specific collections in parallel
  if (business.type === 'TRAVEL' || business.name === "AJ'S TRAVEL") {
    const tripWhere = { businessId, ...(dateFilter ? { startDate: dateFilter } : {}) };

    const [expenses, trips] = await Promise.all([
      prisma.expense.findMany({
        where: expWhere,
        include: { vehicle: true, driver: true },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.trip.findMany({
        where: tripWhere,
        include: { vehicle: true, driver: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const revenue = trips.reduce((sum, t) => sum + t.revenue, 0);

    return {
      business,
      timeframe,
      revenue,
      expenses: totalExpenses,
      netProfit: revenue - totalExpenses,
      trips,
      expenseList: expenses,
    };
  }

  if (business.type === 'MOBILE' || business.name === "AJ'S MOBILE SHOP") {
    const saleWhere = { businessId, ...(dateFilter ? { saleDate: dateFilter } : {}) };
    const purchaseWhere = { businessId, ...(dateFilter ? { purchaseDate: dateFilter } : {}) };

    const [expenses, sales, purchases] = await Promise.all([
      prisma.expense.findMany({
        where: expWhere,
        include: { vehicle: true, driver: true },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.mobileSale.findMany({
        where: saleWhere,
        include: { product: true },
        orderBy: { saleDate: 'desc' },
      }),
      prisma.mobilePurchase.findMany({
        where: purchaseWhere,
        include: { product: true },
        orderBy: { purchaseDate: 'desc' },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);

    return {
      business,
      timeframe,
      revenue,
      grossProfit,
      expenses: totalExpenses,
      netProfit: grossProfit - totalExpenses,
      sales,
      purchases,
      expenseList: expenses,
    };
  }

  if (business.type === 'FUEL' || business.name === "AJ'S FUEL STATION") {
    const saleWhere = { businessId, ...(dateFilter ? { saleDate: dateFilter } : {}) };
    const purchaseWhere = { businessId, ...(dateFilter ? { purchaseDate: dateFilter } : {}) };

    const [expenses, sales, purchases] = await Promise.all([
      prisma.expense.findMany({
        where: expWhere,
        include: { vehicle: true, driver: true },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.fuelSale.findMany({
        where: saleWhere,
        orderBy: { saleDate: 'desc' },
      }),
      prisma.fuelPurchase.findMany({
        where: purchaseWhere,
        orderBy: { purchaseDate: 'desc' },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);

    return {
      business,
      timeframe,
      revenue,
      grossProfit,
      expenses: totalExpenses,
      netProfit: grossProfit - totalExpenses,
      sales,
      purchases,
      expenseList: expenses,
    };
  }

  const expenses = await prisma.expense.findMany({ where: expWhere });
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  return { business, revenue: 0, expenses: totalExpenses, netProfit: -totalExpenses };
};
