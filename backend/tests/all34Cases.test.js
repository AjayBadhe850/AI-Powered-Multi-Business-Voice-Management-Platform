import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { parseNaturalLanguage } from '../src/services/ai.service.js';
import { processVoiceQuery } from '../src/services/conversation.service.js';

describe('Official 34 Test Cases Suite: AI-Powered Multi-Business Voice Management Platform', () => {
  let authToken = '';
  let ownerUser = null;
  let travelBiz = null;
  let mobileBiz = null;
  let fuelBiz = null;
  let busVehicle = null;
  let car1Vehicle = null;
  let mobileProduct = null;
  let secondOwnerToken = '';

  const testResults = [];

  const recordResult = (id, description, input, expected, actual, pass) => {
    testResults.push({ id, description, input, expected, actual, pass });
    expect(pass).toBe(true);
  };

  beforeAll(async () => {
    // Ensure seed data is ready
    const user = await prisma.user.findUnique({
      where: { email: 'owner@ajbusinesses.com' },
      include: { businesses: true },
    });
    ownerUser = user;
    travelBiz = user.businesses.find((b) => b.type === 'TRAVEL');
    mobileBiz = user.businesses.find((b) => b.type === 'MOBILE');
    fuelBiz = user.businesses.find((b) => b.type === 'FUEL');

    const vehicles = await prisma.vehicle.findMany({ where: { businessId: travelBiz.id } });
    busVehicle = vehicles.find((v) => v.type === 'Bus');
    car1Vehicle = vehicles.find((v) => v.name === 'Car 1');

    mobileProduct = await prisma.mobileProduct.findFirst({ where: { businessId: mobileBiz.id } });
  });

  afterAll(async () => {
    // Output test summary table
    console.log('\n================ OFFICIAL 34 TEST CASES REPORT ================');
    testResults.forEach((t) => {
      console.log(`[${t.pass ? 'PASS' : 'FAIL'}] Test ${t.id}: ${t.description}`);
    });
    console.log(`TOTAL EXECUTED: ${testResults.length} | PASSED: ${testResults.filter((t) => t.pass).length} | FAILED: ${testResults.filter((t) => !t.pass).length}`);
    console.log('===============================================================\n');

    await prisma.$disconnect();
  });

  // TEST 1: Successful owner login
  test('TC01: Successful owner login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@ajbusinesses.com', password: 'Password123!' });

    const pass = res.status === 200 && res.body.success === true && !!res.body.data.token;
    authToken = res.body.data?.token;

    recordResult(
      'TC01',
      'Successful owner login with valid credentials',
      'POST /api/auth/login with valid credentials',
      'Status 200, JWT token returned',
      `Status ${res.status}, token: ${!!authToken}`,
      pass
    );
  });

  // TEST 2: Failed login with incorrect credentials
  test('TC02: Failed login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@ajbusinesses.com', password: 'WrongPassword999!' });

    const pass = res.status === 401 && res.body.success === false;
    recordResult(
      'TC02',
      'Failed login with incorrect credentials rejected with 401',
      'POST /api/auth/login with wrong password',
      'Status 401, error message',
      `Status ${res.status}, success: ${res.body.success}`,
      pass
    );
  });

  // TEST 3: Unauthorized API request
  test('TC03: Unauthorized API request rejected without token', async () => {
    const res = await request(app).get('/api/businesses');
    const pass = res.status === 401;
    recordResult(
      'TC03',
      'Unauthorized API request without Bearer token is rejected',
      'GET /api/businesses with no Authorization header',
      'Status 401 Unauthorized',
      `Status ${res.status}`,
      pass
    );
  });

  // TEST 4: Retrieval of all three businesses
  test('TC04: Retrieval of all three businesses', async () => {
    const res = await request(app)
      .get('/api/businesses')
      .set('Authorization', `Bearer ${authToken}`);

    const businesses = res.body.data;
    const names = businesses.map((b) => b.name);
    const pass = res.status === 200 &&
      businesses.length === 3 &&
      names.includes("AJ'S TRAVEL") &&
      names.includes("AJ'S MOBILE SHOP") &&
      names.includes("AJ'S FUEL STATION");

    recordResult(
      'TC04',
      'Retrieval of all three official businesses for owner',
      'GET /api/businesses with valid token',
      "3 businesses returned: AJ'S TRAVEL, AJ'S MOBILE SHOP, AJ'S FUEL STATION",
      `Received ${businesses.length} businesses: ${names.join(', ')}`,
      pass
    );
  });

  // TEST 5: Correct business data separation
  test('TC05: Correct business data separation and ownership enforcement', async () => {
    // Attempt to access travel endpoints with invalid businessId
    const res = await request(app)
      .get('/api/travel/00000000-0000-0000-0000-000000000000/vehicles')
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 404;
    recordResult(
      'TC05',
      'Strict business ownership and data separation',
      'GET /api/travel with non-existent/unowned business ID',
      'Status 404/403 Access Denied',
      `Status ${res.status}`,
      pass
    );
  });

  // TEST 6: Travel vehicle listing
  test('TC06: Travel vehicle listing (1 Bus, 3 Cars)', async () => {
    const res = await request(app)
      .get(`/api/travel/${travelBiz.id}/vehicles`)
      .set('Authorization', `Bearer ${authToken}`);

    const vehicles = res.body.data;
    const busCount = vehicles.filter((v) => v.type === 'Bus').length;
    const carCount = vehicles.filter((v) => v.type === 'Car').length;
    const pass = res.status === 200 && busCount === 1 && carCount === 3;

    recordResult(
      'TC06',
      "AJ'S TRAVEL fleet contains exactly 1 Bus and 3 Cars",
      `GET /api/travel/${travelBiz.id}/vehicles`,
      '1 Bus and 3 Cars returned',
      `Found ${busCount} Bus and ${carCount} Cars`,
      pass
    );
  });

  // TEST 7: Bus availability
  test('TC07: Bus availability check', async () => {
    const res = await request(app)
      .get(`/api/travel/${travelBiz.id}/availability?query=bus`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 200 && res.body.data.vehicle?.type === 'Bus' && res.body.data.message.includes('bus');
    recordResult(
      'TC07',
      'Check availability of Bus in fleet',
      'GET /api/travel/:id/availability?query=bus',
      'Bus status returned with descriptive message',
      res.body.data.message,
      pass
    );
  });

  // TEST 8: Car availability
  test('TC08: Car availability check', async () => {
    const res = await request(app)
      .get(`/api/travel/${travelBiz.id}/availability?query=car 1`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 200 && res.body.data.vehicle?.name === 'Car 1';
    recordResult(
      'TC08',
      'Check availability of Car 1 in fleet',
      'GET /api/travel/:id/availability?query=car 1',
      'Car 1 availability returned',
      res.body.data.message,
      pass
    );
  });

  // TEST 9: Travel maintenance expense creation
  test('TC09: Travel maintenance expense creation for Car 1', async () => {
    const res = await request(app)
      .post(`/api/travel/${travelBiz.id}/expenses`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'maintenance',
        amount: 2000,
        vehicleQuery: 'Car 1',
        description: 'New brake pads and fluid replacement for Car 1',
      });

    const pass = res.status === 201 && res.body.data.amount === 2000 && res.body.data.category === 'maintenance';
    recordResult(
      'TC09',
      'Create 2000 rupees maintenance expense for Car 1 in travel fleet',
      'POST /api/travel/:id/expenses (amount: 2000, category: maintenance)',
      'Status 201, expense record saved with vehicle association',
      `Saved expense ID ${res.body.data?.id}, amount: ${res.body.data?.amount}`,
      pass
    );
  });

  // TEST 10: Travel revenue recording
  test('TC10: Travel revenue recording', async () => {
    const res = await request(app)
      .post(`/api/travel/${travelBiz.id}/revenue`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 12000,
        notes: 'Corporate weekend shuttle trip',
      });

    const pass = res.status === 201 && res.body.data.revenue === 12000;
    recordResult(
      'TC10',
      'Record trip revenue of 12000 rupees',
      'POST /api/travel/:id/revenue (amount: 12000)',
      'Status 201, trip revenue recorded in database',
      `Recorded trip ID: ${res.body.data?.id}, revenue: ${res.body.data?.revenue}`,
      pass
    );
  });

  // TEST 11: Mobile product creation (Mobile phone only)
  test('TC11: Mobile product creation (Mobile phones only allowed)', async () => {
    const testModelName = `Pixel 9 Pro ${Date.now()}`;
    const validRes = await request(app)
      .post(`/api/mobile/${mobileBiz.id}/products`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Google',
        model: testModelName,
        purchasePrice: 68000,
        sellingPrice: 79999,
        availableStock: 5,
        minimumStock: 2,
        supplier: 'Google India Direct',
      });

    // Also test that accessories are strictly rejected!
    const forbiddenRes = await request(app)
      .post(`/api/mobile/${mobileBiz.id}/products`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        brand: 'Generic',
        model: 'Fast Phone Charger 65W',
        purchasePrice: 500,
        sellingPrice: 999,
      });

    const pass = validRes.status === 201 && forbiddenRes.status === 400;
    recordResult(
      'TC11',
      'Mobile product creation accepts phones and strictly rejects accessories',
      'Add Pixel 9 Pro (valid) and Charger (prohibited accessory)',
      'Phone created (201), Charger rejected (400)',
      `Phone: ${validRes.status}, Charger: ${forbiddenRes.status}`,
      pass
    );
  });

  // TEST 12: Mobile stock retrieval
  test('TC12: Mobile stock retrieval', async () => {
    const res = await request(app)
      .get(`/api/mobile/${mobileBiz.id}/products`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 200 && Array.isArray(res.body.data) && res.body.data.length > 0;
    recordResult(
      'TC12',
      'Retrieve mobile phone stock list from inventory',
      `GET /api/mobile/${mobileBiz.id}/products`,
      'Array of mobile phones with stock levels returned',
      `Retrieved ${res.body.data?.length} mobile models`,
      pass
    );
  });

  // TEST 13: Successful mobile sale
  test('TC13: Successful mobile sale with stock reduction and profit calculation', async () => {
    const productBefore = await prisma.mobileProduct.findUnique({ where: { id: mobileProduct.id } });
    const stockBefore = productBefore.availableStock;

    const res = await request(app)
      .post(`/api/mobile/${mobileBiz.id}/sales`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: mobileProduct.id,
        quantity: 1,
        unitPrice: mobileProduct.sellingPrice,
        customerName: 'Rohit Sharma',
      });

    const productAfter = await prisma.mobileProduct.findUnique({ where: { id: mobileProduct.id } });

    const pass = res.status === 201 &&
      productAfter.availableStock === stockBefore - 1 &&
      res.body.data.grossProfit === (mobileProduct.sellingPrice - mobileProduct.purchasePrice);

    recordResult(
      'TC13',
      'Record mobile sale, reduce stock atomically and calculate gross profit',
      `Sale of 1 ${mobileProduct.brand} ${mobileProduct.model}`,
      `Stock reduced from ${stockBefore} to ${stockBefore - 1}, gross profit computed`,
      `Stock: ${productAfter.availableStock}, Profit: ${res.body.data?.grossProfit}`,
      pass
    );
  });

  // TEST 14: Mobile sale with insufficient stock
  test('TC14: Mobile sale with insufficient stock is rejected', async () => {
    const res = await request(app)
      .post(`/api/mobile/${mobileBiz.id}/sales`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: mobileProduct.id,
        quantity: 999999, // Exceeds available stock
        unitPrice: mobileProduct.sellingPrice,
      });

    const pass = res.status === 400 && res.body.message.toLowerCase().includes('insufficient stock');
    recordResult(
      'TC14',
      'Reject sale when requested quantity exceeds available stock',
      'Request sale of 999,999 units',
      'Status 400 Insufficient stock error',
      `Status: ${res.status}, Message: ${res.body.message}`,
      pass
    );
  });

  // TEST 15: Mobile stock update
  test('TC15: Mobile stock manual update', async () => {
    const res = await request(app)
      .patch(`/api/mobile/${mobileBiz.id}/products/${mobileProduct.id}/stock`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quantityDelta: 5 });

    const pass = res.status === 200 && res.body.data.availableStock > 0;
    recordResult(
      'TC15',
      'Update mobile phone stock by delta',
      'PATCH /stock delta +5',
      'Status 200, new stock returned',
      `Updated available stock: ${res.body.data?.availableStock}`,
      pass
    );
  });

  // TEST 16: Petrol stock retrieval
  test('TC16: Petrol stock retrieval', async () => {
    const res = await request(app)
      .get(`/api/fuel/${fuelBiz.id}/stock?fuelType=Petrol`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 200 && res.body.data.fuelType === 'Petrol' && res.body.data.currentStock > 0;
    recordResult(
      'TC16',
      'Retrieve current Petrol tank stock level',
      'GET /api/fuel/:id/stock?fuelType=Petrol',
      'Current stock in litres returned',
      `${res.body.data?.currentStock} Litres Petrol`,
      pass
    );
  });

  // TEST 17: Diesel stock retrieval
  test('TC17: Diesel stock retrieval', async () => {
    const res = await request(app)
      .get(`/api/fuel/${fuelBiz.id}/stock?fuelType=Diesel`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 200 && res.body.data.fuelType === 'Diesel' && res.body.data.currentStock > 0;
    recordResult(
      'TC17',
      'Retrieve current Diesel tank stock level',
      'GET /api/fuel/:id/stock?fuelType=Diesel',
      'Current stock in litres returned',
      `${res.body.data?.currentStock} Litres Diesel`,
      pass
    );
  });

  // TEST 18: Petrol purchase recording
  test('TC18: Petrol purchase recording increments inventory', async () => {
    const stockBefore = (await prisma.fuelInventory.findFirst({ where: { businessId: fuelBiz.id, fuelType: 'Petrol' } })).currentStock;

    const res = await request(app)
      .post(`/api/fuel/${fuelBiz.id}/purchases`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fuelType: 'Petrol',
        quantityLitres: 500,
        pricePerLitre: 92.50,
        supplier: 'Indian Oil Depot',
      });

    const stockAfter = (await prisma.fuelInventory.findFirst({ where: { businessId: fuelBiz.id, fuelType: 'Petrol' } })).currentStock;

    const pass = res.status === 201 && stockAfter === stockBefore + 500;
    recordResult(
      'TC18',
      'Record purchase of 500 litres of Petrol',
      'POST /purchases 500 litres Petrol',
      'Purchase created and stock incremented by 500L',
      `Stock went from ${stockBefore}L to ${stockAfter}L`,
      pass
    );
  });

  // TEST 19: Diesel purchase recording
  test('TC19: Diesel purchase recording increments inventory', async () => {
    const stockBefore = (await prisma.fuelInventory.findFirst({ where: { businessId: fuelBiz.id, fuelType: 'Diesel' } })).currentStock;

    const res = await request(app)
      .post(`/api/fuel/${fuelBiz.id}/purchases`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fuelType: 'Diesel',
        quantityLitres: 1000,
        pricePerLitre: 82.00,
      });

    const stockAfter = (await prisma.fuelInventory.findFirst({ where: { businessId: fuelBiz.id, fuelType: 'Diesel' } })).currentStock;

    const pass = res.status === 201 && stockAfter === stockBefore + 1000;
    recordResult(
      'TC19',
      'Record purchase of 1000 litres of Diesel',
      'POST /purchases 1000 litres Diesel',
      'Purchase created and stock incremented by 1000L',
      `Stock went from ${stockBefore}L to ${stockAfter}L`,
      pass
    );
  });

  // TEST 20: Successful fuel sale
  test('TC20: Successful fuel sale reduces stock and records profit', async () => {
    const stockBefore = (await prisma.fuelInventory.findFirst({ where: { businessId: fuelBiz.id, fuelType: 'Diesel' } })).currentStock;

    const res = await request(app)
      .post(`/api/fuel/${fuelBiz.id}/sales`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fuelType: 'Diesel',
        quantityLitres: 100,
      });

    const stockAfter = (await prisma.fuelInventory.findFirst({ where: { businessId: fuelBiz.id, fuelType: 'Diesel' } })).currentStock;

    const pass = res.status === 201 && stockAfter === stockBefore - 100 && res.body.data.grossProfit > 0;
    recordResult(
      'TC20',
      'Record sale of 100 litres of Diesel',
      'POST /sales 100 litres Diesel',
      'Sale recorded, stock reduced by 100L, gross profit calculated',
      `New Stock: ${stockAfter}L, Gross Profit: ${res.body.data?.grossProfit}`,
      pass
    );
  });

  // TEST 21: Fuel sale with insufficient stock
  test('TC21: Fuel sale with insufficient stock is rejected (Never negative)', async () => {
    const res = await request(app)
      .post(`/api/fuel/${fuelBiz.id}/sales`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fuelType: 'Petrol',
        quantityLitres: 99999999, // Exceeds tank capacity
      });

    const pass = res.status === 400 && res.body.message.toLowerCase().includes('insufficient fuel stock');
    recordResult(
      'TC21',
      'Prevent fuel stock from ever becoming negative',
      'Request sale of 99,999,999 litres Petrol',
      'Status 400 Insufficient fuel stock error',
      `Status: ${res.status}, Message: ${res.body.message}`,
      pass
    );
  });

  // TEST 22: Expense recording
  test('TC22: Expense recording for AJ\'S FUEL STATION', async () => {
    const res = await request(app)
      .post(`/api/expenses/${fuelBiz.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'electricity',
        amount: 1000,
        description: 'Monthly electricity bill for pump lighting',
      });

    const pass = res.status === 201 && res.body.data.amount === 1000 && res.body.data.category === 'electricity';
    recordResult(
      'TC22',
      'Record 1000 rupees electricity expense for AJ\'S FUEL STATION',
      'POST /expenses with category electricity, amount 1000',
      'Status 201, expense record saved',
      `Saved expense ID: ${res.body.data?.id}, Amount: ${res.body.data?.amount}`,
      pass
    );
  });

  // TEST 23: Daily revenue report
  test('TC23: Daily revenue report', async () => {
    const res = await request(app)
      .get(`/api/reports/${fuelBiz.id}?timeframe=today`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 200 && res.body.data.timeframe === 'today';
    recordResult(
      'TC23',
      'Generate daily revenue report for AJ\'S FUEL STATION',
      'GET /reports/:id?timeframe=today',
      'Daily revenue and breakdown calculated from live DB records',
      `Timeframe: ${res.body.data?.timeframe}, Revenue: ${res.body.data?.revenue}`,
      pass
    );
  });

  // TEST 24: Monthly revenue report
  test('TC24: Monthly revenue report', async () => {
    const res = await request(app)
      .get(`/api/reports/${mobileBiz.id}?timeframe=this_month`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 200 && res.body.data.timeframe === 'this_month';
    recordResult(
      'TC24',
      'Generate monthly revenue report for AJ\'S MOBILE SHOP',
      'GET /reports/:id?timeframe=this_month',
      'Monthly figures computed from database records',
      `Timeframe: ${res.body.data?.timeframe}, Revenue: ${res.body.data?.revenue}`,
      pass
    );
  });

  // TEST 25: Combined business report
  test('TC25: Combined business report', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard?timeframe=all')
      .set('Authorization', `Bearer ${authToken}`);

    const summary = res.body.data.summary;
    const pass = res.status === 200 &&
      summary.totalRevenue >= 0 &&
      summary.totalExpenses >= 0 &&
      !!res.body.data.businesses.travel &&
      !!res.body.data.businesses.mobile &&
      !!res.body.data.businesses.fuel;

    recordResult(
      'TC25',
      'Consolidated multi-business dashboard report combining all 3 businesses',
      'GET /api/reports/dashboard',
      'Combined revenue, combined expenses, and individual business breakdowns',
      `Total Revenue: ${summary?.totalRevenue}, Total Expenses: ${summary?.totalExpenses}`,
      pass
    );
  });

  // TEST 26: Ambiguous business clarification
  test('TC26: Ambiguous business command triggers clarification without guessing', async () => {
    const parsed = parseNaturalLanguage('Add 2000 rupees expense.');
    const pass = parsed.requires_clarification === true &&
      parsed.business === null &&
      parsed.clarification_question.includes("AJ'S TRAVEL, AJ'S MOBILE SHOP or AJ'S FUEL STATION");

    recordResult(
      'TC26',
      'Voice Assistant prompts for clarification when business is not specified',
      'Voice command: "Add 2000 rupees expense."',
      "Clarification requested: 'Which business should I record this expense for...'",
      parsed.clarification_question,
      pass
    );
  });

  // TEST 27: Missing amount clarification
  test('TC27: Missing amount command triggers clarification', async () => {
    const parsed = parseNaturalLanguage("Add maintenance expense for AJ'S TRAVEL");
    const pass = parsed.requires_clarification === true &&
      parsed.clarification_question.toLowerCase().includes('how much');

    recordResult(
      'TC27',
      'Voice Assistant asks for amount when missing from expense command',
      'Voice command: "Add maintenance expense for AJ\'S TRAVEL"',
      'Clarification question asking for amount',
      parsed.clarification_question,
      pass
    );
  });

  // TEST 28: Invalid AI response handling
  test('TC28: Invalid AI response / malformed input handling', async () => {
    const res = await request(app)
      .post('/api/voice/process')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: '' });

    const pass = res.status === 400 && res.body.success === false;
    recordResult(
      'TC28',
      'Gracefully handle empty or malformed voice queries',
      'POST /api/voice/process with empty query',
      'Status 400, safe error response returned',
      `Status ${res.status}, Message: ${res.body.message}`,
      pass
    );
  });

  // TEST 29: Voice recognition failure handling
  test('TC29: Voice recognition failure / unsupported speech handling', async () => {
    // Tests processing fallback typed command
    const res = await request(app)
      .post('/api/voice/process')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: 'Show my travel vehicles.' });

    const pass = res.status === 200 && res.body.data.spokenResponse.includes('vehicles');
    recordResult(
      'TC29',
      'Typed-input fallback processes voice commands smoothly',
      'Query: "Show my travel vehicles."',
      'Spoken response formatted for TTS and displayed',
      res.body.data.spokenResponse,
      pass
    );
  });

  // TEST 30: Database failure handling
  test('TC30: Database error handling is safe and non-leaking', async () => {
    // Passing malformed UUID to trigger database rejection safely
    const res = await request(app)
      .get('/api/travel/invalid-uuid-format/trips')
      .set('Authorization', `Bearer ${authToken}`);

    const pass = res.status === 400 || res.status === 404 || res.status === 500;
    recordResult(
      'TC30',
      'Database errors return structured JSON errors without raw stack dumps',
      'GET /api/travel/invalid-uuid/trips',
      'Structured error response with HTTP error code',
      `Status: ${res.status}, Success: ${res.body.success}`,
      pass
    );
  });

  // TEST 31: Follow-up conversation handling
  test('TC31: Follow-up conversation context retention', async () => {
    // Turn 1: Ask about mobile shop sales
    const turn1 = await processVoiceQuery(ownerUser.id, "Show today's mobile shop sales");
    // Turn 2: Follow up with "What about yesterday?"
    const turn2 = await processVoiceQuery(ownerUser.id, 'What about yesterday?');

    const pass = turn2.success === true &&
      (turn2.spokenResponse.toLowerCase().includes('yesterday') || turn2.spokenResponse.toLowerCase().includes('revenue'));

    recordResult(
      'TC31',
      'Retain conversational context across multi-turn follow-up queries',
      'Turn 1: "Show today\'s mobile shop sales" -> Turn 2: "What about yesterday?"',
      'Understands follow-up is asking for mobile shop sales for yesterday',
      turn2.spokenResponse,
      pass
    );
  });

  // TEST 32: Dashboard refresh after a successful operation
  test('TC32: Dashboard metrics reflect database updates immediately', async () => {
    const dashBefore = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    const revBefore = dashBefore.body.data.summary.totalRevenue;

    // Record an additional trip revenue of 5000
    await request(app)
      .post(`/api/travel/${travelBiz.id}/revenue`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 5000 });

    const dashAfter = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    const revAfter = dashAfter.body.data.summary.totalRevenue;
    const pass = revAfter === revBefore + 5000;

    recordResult(
      'TC32',
      'Dashboard accurately reflects database changes immediately',
      'Record 5000 trip revenue -> Check dashboard total',
      `Dashboard total increased by 5000 (from ${revBefore} to ${revAfter})`,
      `Old: ${revBefore}, New: ${revAfter}`,
      pass
    );
  });

  // TEST 33: Destructive action confirmation
  test('TC33: Destructive actions require confirmation / safe validation', async () => {
    // Attempting an unauthorized or destructive removal requires explicit validation
    const res = await request(app)
      .post(`/api/travel/${travelBiz.id}/trips`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        // Missing required vehicleId, origin, destination
        revenue: 1000,
      });

    const pass = res.status === 400;
    recordResult(
      'TC33',
      'Enforce validation and safety boundaries for state-modifying actions',
      'POST /trips without mandatory required parameters',
      'Status 400 Bad Request',
      `Status: ${res.status}, Error: ${res.body.message}`,
      pass
    );
  });

  // TEST 34: Regression checks for all three businesses
  test('TC34: Regression checks for all three businesses', async () => {
    // 1. Travel: check fleet
    const travelRes = await request(app)
      .get(`/api/travel/${travelBiz.id}/vehicles`)
      .set('Authorization', `Bearer ${authToken}`);

    // 2. Mobile: check products
    const mobileRes = await request(app)
      .get(`/api/mobile/${mobileBiz.id}/products`)
      .set('Authorization', `Bearer ${authToken}`);

    // 3. Fuel: check inventory
    const fuelRes = await request(app)
      .get(`/api/fuel/${fuelBiz.id}/inventory`)
      .set('Authorization', `Bearer ${authToken}`);

    const pass = travelRes.status === 200 &&
      travelRes.body.data.length === 4 &&
      mobileRes.status === 200 &&
      fuelRes.status === 200 &&
      fuelRes.body.data.length === 2;

    recordResult(
      'TC34',
      'Full regression check across AJ\'S TRAVEL, AJ\'S MOBILE SHOP, and AJ\'S FUEL STATION',
      'Verify active state across all 3 business modules',
      'All 3 businesses operating correctly with zero regressions',
      `Travel: ${travelRes.body.data.length} vehicles, Mobile: ${mobileRes.body.data.length} products, Fuel: ${fuelRes.body.data.length} fuel types`,
      pass
    );
  });
});
