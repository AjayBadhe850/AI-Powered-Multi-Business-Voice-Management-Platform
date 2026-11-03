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

  // Fetch all businesses owned by this user
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

  // 1. AJ'S TRAVEL METRICS
  let travelRevenue = 0;
  let travelExpenses = 0;
  let travelTripsCount = 0;
  let travelBookingsCount = 0;
  let fleetStatus = { total: 0, available: 0, onTrip: 0, maintenance: 0, busAvailable: false, carsAvailable: 0 };

  if (travelBiz) {
    const tripWhere = { businessId: travelBiz.id };
    if (dateFilter) tripWhere.startDate = dateFilter;
    const trips = await prisma.trip.findMany({ where: tripWhere });
    travelTripsCount = trips.length;
    travelRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

    const bookingWhere = { businessId: travelBiz.id };
    if (dateFilter) bookingWhere.tripDate = dateFilter;
    const bookings = await prisma.booking.findMany({ where: bookingWhere });
    travelBookingsCount = bookings.length;

    const expWhere = { businessId: travelBiz.id };
    if (dateFilter) expWhere.expenseDate = dateFilter;
    const expenses = await prisma.expense.findMany({ where: expWhere });
    travelExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Fleet breakdown
    const vehicles = travelBiz.vehicles || [];
    fleetStatus.total = vehicles.length;
    fleetStatus.available = vehicles.filter((v) => v.status === 'Available').length;
    fleetStatus.onTrip = vehicles.filter((v) => v.status === 'On Trip').length;
    fleetStatus.maintenance = vehicles.filter((v) => v.status === 'Under Maintenance').length;
    const bus = vehicles.find((v) => v.type === 'Bus' || v.name.toLowerCase().includes('bus'));
    fleetStatus.busAvailable = bus?.status === 'Available';
    fleetStatus.carsAvailable = vehicles.filter((v) => (v.type === 'Car' || v.name.toLowerCase().includes('car')) && v.status === 'Available').length;
  }

  // 2. AJ'S MOBILE SHOP METRICS
  let mobileRevenue = 0;
  let mobileGrossProfit = 0;
  let mobileExpenses = 0;
  let mobileSalesCount = 0;
  let lowStockProducts = [];

  if (mobileBiz) {
    const saleWhere = { businessId: mobileBiz.id };
    if (dateFilter) saleWhere.saleDate = dateFilter;
    const sales = await prisma.mobileSale.findMany({ where: saleWhere });
    mobileSalesCount = sales.length;
    mobileRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    mobileGrossProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);

    const expWhere = { businessId: mobileBiz.id };
    if (dateFilter) expWhere.expenseDate = dateFilter;
    const expenses = await prisma.expense.findMany({ where: expWhere });
    mobileExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Stock alerts
    const products = mobileBiz.mobileProducts || [];
    lowStockProducts = products.filter((p) => p.availableStock <= p.minimumStock);
  }

  // 3. AJ'S FUEL STATION METRICS
  let fuelRevenue = 0;
  let fuelGrossProfit = 0;
  let fuelExpenses = 0;
  let fuelSalesCount = 0;
  let petrolStock = 0;
  let dieselStock = 0;

  if (fuelBiz) {
    const saleWhere = { businessId: fuelBiz.id };
    if (dateFilter) saleWhere.saleDate = dateFilter;
    const sales = await prisma.fuelSale.findMany({ where: saleWhere });
    fuelSalesCount = sales.length;
    fuelRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    fuelGrossProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);

    const expWhere = { businessId: fuelBiz.id };
    if (dateFilter) expWhere.expenseDate = dateFilter;
    const expenses = await prisma.expense.findMany({ where: expWhere });
    fuelExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Fuel levels
    const inventories = fuelBiz.fuelInventories || [];
    const petrol = inventories.find((i) => i.fuelType === 'Petrol');
    const diesel = inventories.find((i) => i.fuelType === 'Diesel');
    petrolStock = petrol?.currentStock || 0;
    dieselStock = diesel?.currentStock || 0;
  }

  // Combined totals
  const totalRevenue = travelRevenue + mobileRevenue + fuelRevenue;
  const totalExpenses = travelExpenses + mobileExpenses + fuelExpenses;
  const totalGrossProfit = (travelRevenue - travelExpenses) + mobileGrossProfit + fuelGrossProfit;
  const estimatedNetProfit = totalRevenue - totalExpenses;

  // Recent Transactions across all 3 businesses
  const recentTrips = await prisma.trip.findMany({
    where: { businessId: travelBiz?.id },
    take: 5,
    orderBy: { startDate: 'desc' },
  });

  const recentMobileSales = await prisma.mobileSale.findMany({
    where: { businessId: mobileBiz?.id },
    take: 5,
    include: { product: true },
    orderBy: { saleDate: 'desc' },
  });

  const recentFuelSales = await prisma.fuelSale.findMany({
    where: { businessId: fuelBiz?.id },
    take: 5,
    orderBy: { saleDate: 'desc' },
  });

  const recentExpenses = await prisma.expense.findMany({
    where: { businessId: { in: businesses.map((b) => b.id) } },
    take: 5,
    include: { business: true },
    orderBy: { expenseDate: 'desc' },
  });

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

  const dateFilter = getDateFilter(timeframe);

  const expWhere = { businessId };
  if (dateFilter) expWhere.expenseDate = dateFilter;
  const expenses = await prisma.expense.findMany({
    where: expWhere,
    include: { vehicle: true, driver: true },
    orderBy: { expenseDate: 'desc' },
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (business.type === 'TRAVEL' || business.name === "AJ'S TRAVEL") {
    const tripWhere = { businessId };
    if (dateFilter) tripWhere.startDate = dateFilter;
    const trips = await prisma.trip.findMany({
      where: tripWhere,
      include: { vehicle: true, driver: true },
      orderBy: { startDate: 'desc' },
    });

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
    const saleWhere = { businessId };
    if (dateFilter) saleWhere.saleDate = dateFilter;
    const sales = await prisma.mobileSale.findMany({
      where: saleWhere,
      include: { product: true },
      orderBy: { saleDate: 'desc' },
    });

    const purchaseWhere = { businessId };
    if (dateFilter) purchaseWhere.purchaseDate = dateFilter;
    const purchases = await prisma.mobilePurchase.findMany({
      where: purchaseWhere,
      include: { product: true },
      orderBy: { purchaseDate: 'desc' },
    });

    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);
    const purchaseTotal = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

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
    const saleWhere = { businessId };
    if (dateFilter) saleWhere.saleDate = dateFilter;
    const sales = await prisma.fuelSale.findMany({
      where: saleWhere,
      orderBy: { saleDate: 'desc' },
    });

    const purchaseWhere = { businessId };
    if (dateFilter) purchaseWhere.purchaseDate = dateFilter;
    const purchases = await prisma.fuelPurchase.findMany({
      where: purchaseWhere,
      orderBy: { purchaseDate: 'desc' },
    });

    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const grossProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);
    const purchaseTotal = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

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

  return { business, revenue: 0, expenses: totalExpenses, netProfit: -totalExpenses };
};
