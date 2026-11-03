import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Database for AI-Powered Multi-Business Voice Management Platform ---');

  // 1. Clean existing records safely for re-seeding
  await prisma.auditLog.deleteMany({});
  await prisma.voiceConversation.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.fuelSale.deleteMany({});
  await prisma.fuelPurchase.deleteMany({});
  await prisma.fuelInventory.deleteMany({});
  await prisma.mobileSale.deleteMany({});
  await prisma.mobilePurchase.deleteMany({});
  await prisma.mobileProduct.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.business.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Owner User
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const owner = await prisma.user.create({
    data: {
      email: 'owner@ajbusinesses.com',
      password: hashedPassword,
      name: 'AJ (Owner)',
      role: 'OWNER',
    },
  });
  console.log(`Created Owner: ${owner.email}`);

  // 3. Create the 3 Official Businesses
  const travelBiz = await prisma.business.create({
    data: {
      userId: owner.id,
      name: "AJ'S TRAVEL",
      type: 'TRAVEL',
      currency: 'INR',
    },
  });

  const mobileBiz = await prisma.business.create({
    data: {
      userId: owner.id,
      name: "AJ'S MOBILE SHOP",
      type: 'MOBILE',
      currency: 'INR',
    },
  });

  const fuelBiz = await prisma.business.create({
    data: {
      userId: owner.id,
      name: "AJ'S FUEL STATION",
      type: 'FUEL',
      currency: 'INR',
    },
  });
  console.log('Created 3 Official Businesses:');
  console.log(` - ${travelBiz.name} (${travelBiz.id})`);
  console.log(` - ${mobileBiz.name} (${mobileBiz.id})`);
  console.log(` - ${fuelBiz.name} (${fuelBiz.id})`);

  // ==========================================
  // BUSINESS 1: AJ'S TRAVEL (1 Bus, 3 Cars)
  // ==========================================
  // Create Drivers
  const driver1 = await prisma.driver.create({
    data: {
      businessId: travelBiz.id,
      name: 'Ramesh Kumar',
      phone: '+91-9876543210',
      licenseNumber: 'DL-BUS-2020-01',
      status: 'Active',
    },
  });
  const driver2 = await prisma.driver.create({
    data: {
      businessId: travelBiz.id,
      name: 'Suresh Patel',
      phone: '+91-9876543211',
      licenseNumber: 'DL-CAR-2021-02',
      status: 'Active',
    },
  });
  const driver3 = await prisma.driver.create({
    data: {
      businessId: travelBiz.id,
      name: 'Mahesh Singh',
      phone: '+91-9876543212',
      licenseNumber: 'DL-CAR-2021-03',
      status: 'Active',
    },
  });
  const driver4 = await prisma.driver.create({
    data: {
      businessId: travelBiz.id,
      name: 'Rajesh Rao',
      phone: '+91-9876543213',
      licenseNumber: 'DL-CAR-2022-04',
      status: 'Active',
    },
  });

  // Create exactly 1 Bus and 3 Cars
  const now = new Date();
  const past30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const next60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const bus1 = await prisma.vehicle.create({
    data: {
      businessId: travelBiz.id,
      name: 'Bus 1',
      vehicleNumber: 'KA-01-TR-1001',
      type: 'Bus',
      status: 'Available',
      driverId: driver1.id,
      lastServiceDate: past30Days,
      nextServiceDate: next60Days,
    },
  });

  const car1 = await prisma.vehicle.create({
    data: {
      businessId: travelBiz.id,
      name: 'Car 1',
      vehicleNumber: 'KA-01-TR-2001',
      type: 'Car',
      status: 'Available',
      driverId: driver2.id,
      lastServiceDate: past30Days,
      nextServiceDate: next60Days,
    },
  });

  const car2 = await prisma.vehicle.create({
    data: {
      businessId: travelBiz.id,
      name: 'Car 2',
      vehicleNumber: 'KA-01-TR-2002',
      type: 'Car',
      status: 'Available',
      driverId: driver3.id,
      lastServiceDate: past30Days,
      nextServiceDate: next60Days,
    },
  });

  const car3 = await prisma.vehicle.create({
    data: {
      businessId: travelBiz.id,
      name: 'Car 3',
      vehicleNumber: 'KA-01-TR-2003',
      type: 'Car',
      status: 'On Trip',
      driverId: driver4.id,
      lastServiceDate: past30Days,
      nextServiceDate: next60Days,
    },
  });
  console.log(`Created fleet for ${travelBiz.name}: 1 Bus (${bus1.name}), 3 Cars (${car1.name}, ${car2.name}, ${car3.name})`);

  // Seed sample initial travel trips & revenue
  const trip1 = await prisma.trip.create({
    data: {
      businessId: travelBiz.id,
      vehicleId: bus1.id,
      driverId: driver1.id,
      origin: 'Bengaluru',
      destination: 'Mysuru',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 8 * 3600 * 1000),
      status: 'Completed',
      revenue: 16500,
      notes: '[Demonstration Data] Weekend group tour booking',
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      businessId: travelBiz.id,
      vehicleId: car1.id,
      driverId: driver2.id,
      origin: 'City Center',
      destination: 'Airport Terminal 2',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 3600 * 1000),
      status: 'Completed',
      revenue: 2800,
      notes: '[Demonstration Data] Airport premium transfer',
    },
  });

  // Travel bookings
  await prisma.booking.create({
    data: {
      businessId: travelBiz.id,
      vehicleId: bus1.id,
      customerName: 'Anil Verma',
      customerPhone: '+91-9988776655',
      pickupLocation: 'Koramangala, Bengaluru',
      dropLocation: 'Mysuru Palace',
      tripDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      fare: 18000,
      status: 'Confirmed',
    },
  });

  // Travel expenses (tracked separately for bus and each car)
  await prisma.expense.create({
    data: {
      businessId: travelBiz.id,
      vehicleId: bus1.id,
      category: 'fuel',
      amount: 4500,
      description: '[Demonstration Data] Diesel fuel refill for Bus 1',
      expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.expense.create({
    data: {
      businessId: travelBiz.id,
      vehicleId: car1.id,
      category: 'maintenance',
      amount: 2000,
      description: '[Demonstration Data] Periodic brake pad check and wheel alignment for Car 1',
      expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.expense.create({
    data: {
      businessId: travelBiz.id,
      driverId: driver1.id,
      category: 'driver',
      amount: 1500,
      description: '[Demonstration Data] Driver allowance for Mysuru trip',
      expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // BUSINESS 2: AJ'S MOBILE SHOP (Mobile phones only!)
  // ==========================================
  const s24 = await prisma.mobileProduct.create({
    data: {
      businessId: mobileBiz.id,
      brand: 'Samsung',
      model: 'Galaxy S24',
      purchasePrice: 65000,
      sellingPrice: 74999,
      availableStock: 8,
      minimumStock: 3,
      supplier: 'Samsung Distribution India',
      purchaseDate: past30Days,
    },
  });

  const a55 = await prisma.mobileProduct.create({
    data: {
      businessId: mobileBiz.id,
      brand: 'Samsung',
      model: 'Galaxy A55',
      purchasePrice: 28000,
      sellingPrice: 34999,
      availableStock: 15,
      minimumStock: 5,
      supplier: 'Samsung Distribution India',
      purchaseDate: past30Days,
    },
  });

  const ip16 = await prisma.mobileProduct.create({
    data: {
      businessId: mobileBiz.id,
      brand: 'Apple',
      model: 'iPhone 16',
      purchasePrice: 72000,
      sellingPrice: 79900,
      availableStock: 6,
      minimumStock: 2,
      supplier: 'Apple Authorized Distributor',
      purchaseDate: past30Days,
    },
  });

  const ip15 = await prisma.mobileProduct.create({
    data: {
      businessId: mobileBiz.id,
      brand: 'Apple',
      model: 'iPhone 15',
      purchasePrice: 58000,
      sellingPrice: 65999,
      availableStock: 2, // Low stock indicator! (2 <= 3)
      minimumStock: 3,
      supplier: 'Apple Authorized Distributor',
      purchaseDate: past30Days,
    },
  });

  const op12 = await prisma.mobileProduct.create({
    data: {
      businessId: mobileBiz.id,
      brand: 'OnePlus',
      model: 'OnePlus 12',
      purchasePrice: 54000,
      sellingPrice: 62999,
      availableStock: 7,
      minimumStock: 3,
      supplier: 'OnePlus Direct',
      purchaseDate: past30Days,
    },
  });

  const redmi = await prisma.mobileProduct.create({
    data: {
      businessId: mobileBiz.id,
      brand: 'Xiaomi',
      model: 'Redmi Note 13 Pro',
      purchasePrice: 18000,
      sellingPrice: 21999,
      availableStock: 12,
      minimumStock: 4,
      supplier: 'Mi India Wholesalers',
      purchaseDate: past30Days,
    },
  });

  console.log(`Created mobile phone products for ${mobileBiz.name} (strictly mobile phones only)`);

  // Seed initial purchases
  await prisma.mobilePurchase.create({
    data: {
      businessId: mobileBiz.id,
      productId: s24.id,
      quantity: 10,
      unitPrice: 65000,
      totalAmount: 650000,
      supplier: 'Samsung Distribution India',
      purchaseDate: past30Days,
    },
  });

  // Seed sample mobile sales with gross profit
  await prisma.mobileSale.create({
    data: {
      businessId: mobileBiz.id,
      productId: s24.id,
      quantity: 2,
      unitPrice: 74999,
      totalAmount: 149998,
      costPrice: 65000,
      grossProfit: (74999 - 65000) * 2,
      customerName: 'Kavitha R',
      saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.mobileSale.create({
    data: {
      businessId: mobileBiz.id,
      productId: ip16.id,
      quantity: 1,
      unitPrice: 79900,
      totalAmount: 79900,
      costPrice: 72000,
      grossProfit: 79900 - 72000,
      customerName: 'Praveen Nair',
      saleDate: now,
    },
  });

  // Mobile shop operating expense
  await prisma.expense.create({
    data: {
      businessId: mobileBiz.id,
      category: 'operating',
      amount: 4500,
      description: '[Demonstration Data] Store internet, security system & utilities',
      expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // ==========================================
  // BUSINESS 3: AJ'S FUEL STATION (Petrol & Diesel ONLY)
  // ==========================================
  const petrolInv = await prisma.fuelInventory.create({
    data: {
      businessId: fuelBiz.id,
      fuelType: 'Petrol',
      openingStock: 5000,
      currentStock: 8450,
      purchasePricePerLitre: 92.50,
      sellingPricePerLitre: 102.80,
    },
  });

  const dieselInv = await prisma.fuelInventory.create({
    data: {
      businessId: fuelBiz.id,
      fuelType: 'Diesel',
      openingStock: 7000,
      currentStock: 11200,
      purchasePricePerLitre: 82.00,
      sellingPricePerLitre: 89.90,
    },
  });
  console.log(`Created fuel inventory for ${fuelBiz.name}: Petrol (${petrolInv.currentStock}L) and Diesel (${dieselInv.currentStock}L) only`);

  // Seed sample fuel purchases
  await prisma.fuelPurchase.create({
    data: {
      businessId: fuelBiz.id,
      fuelInventoryId: petrolInv.id,
      fuelType: 'Petrol',
      quantityLitres: 4000,
      pricePerLitre: 92.50,
      totalAmount: 4000 * 92.50,
      supplier: 'Indian Oil Corporation Depot',
      purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.fuelPurchase.create({
    data: {
      businessId: fuelBiz.id,
      fuelInventoryId: dieselInv.id,
      fuelType: 'Diesel',
      quantityLitres: 5000,
      pricePerLitre: 82.00,
      totalAmount: 5000 * 82.00,
      supplier: 'Bharat Petroleum Depot',
      purchaseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed sample fuel sales
  await prisma.fuelSale.create({
    data: {
      businessId: fuelBiz.id,
      fuelInventoryId: petrolInv.id,
      fuelType: 'Petrol',
      quantityLitres: 550,
      pricePerLitre: 102.80,
      totalAmount: 550 * 102.80,
      costPricePerLitre: 92.50,
      grossProfit: 550 * (102.80 - 92.50),
      saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.fuelSale.create({
    data: {
      businessId: fuelBiz.id,
      fuelInventoryId: dieselInv.id,
      fuelType: 'Diesel',
      quantityLitres: 800,
      pricePerLitre: 89.90,
      totalAmount: 800 * 89.90,
      costPricePerLitre: 82.00,
      grossProfit: 800 * (89.90 - 82.00),
      saleDate: now,
    },
  });

  // Fuel station operating expense
  await prisma.expense.create({
    data: {
      businessId: fuelBiz.id,
      category: 'electricity',
      amount: 3200,
      description: '[Demonstration Data] Monthly high-voltage pump and canopy lighting bill',
      expenseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
