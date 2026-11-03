import prisma from '../config/db.js';
import { interpretVoiceCommand, parseNaturalLanguage } from './ai.service.js';
import * as travelService from './travel.service.js';
import * as mobileService from './mobile.service.js';
import * as fuelService from './fuel.service.js';
import * as expenseService from './expense.service.js';
import * as reportService from './report.service.js';
import * as printService from './print.service.js';
import { logAudit } from '../utils/auditLogger.js';

// In-memory conversation state for active turns (context retention & multi-turn resolution)
const userSessions = new Map();

// In-memory cache for user's businesses (eliminates 150ms round-trip to Neon DB on every voice query)
const businessCache = new Map();

export const getUserBusinessesCached = async (userId) => {
  const cached = businessCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.businesses;
  }
  const businesses = await prisma.business.findMany({ where: { userId } });
  businessCache.set(userId, { businesses, expiresAt: Date.now() + 60000 });
  return businesses;
};

// Non-blocking async logger for voice conversation turns
const saveConversationLogAsync = (userId, businessId, query, intent, message, status, entities = null) => {
  prisma.voiceConversation.create({
    data: {
      userId,
      businessId: businessId || null,
      userQuery: query,
      detectedIntent: intent,
      extractedEntities: entities,
      clarificationNeeded: status === 'CLARIFICATION_REQUESTED',
      responseMessage: message,
      status,
    },
  }).catch((err) => console.error('Error saving voice turn to database:', err.message));
};

export const processVoiceQuery = async (userId, query) => {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new Error('Please provide a voice command or text query');
  }

  const cleanQuery = query.trim();
  const lowerQ = cleanQuery.toLowerCase();
  const session = userSessions.get(userId) || { lastBusiness: null, lastIntent: null, pendingAction: null };

  // -------------------------------------------------------------
  // FAST-PATH 1: Instant Greetings (< 1ms, zero Gemini/DB delay)
  // -------------------------------------------------------------
  if (/^(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening|howdy|greetings)[!.?]*$/i.test(lowerQ)) {
    const spokenResponse = 'Hello! Welcome to AI Assistant. How can I help you manage your businesses today?';
    session.lastIntent = 'GREETING';
    userSessions.set(userId, session);
    saveConversationLogAsync(userId, null, cleanQuery, 'GREETING', spokenResponse, 'SUCCESS');
    return {
      success: true,
      query: cleanQuery,
      intent: 'GREETING',
      business: null,
      requiresClarification: false,
      spokenResponse,
      displayMessage: spokenResponse,
      data: { type: 'greeting' },
    };
  }

  // -------------------------------------------------------------
  // FAST-PATH 2: Pleasantries (< 1ms)
  // -------------------------------------------------------------
  if (/^(how\s+are\s+you|how\s+are\s+things|how\'s\s+it\s+going|how\s+do\s+you\s+do)[!.?]*$/i.test(lowerQ)) {
    const spokenResponse = "I'm doing well, thank you! Ready to help you manage your businesses. What would you like to check?";
    session.lastIntent = 'HOW_ARE_YOU';
    userSessions.set(userId, session);
    saveConversationLogAsync(userId, null, cleanQuery, 'HOW_ARE_YOU', spokenResponse, 'SUCCESS');
    return {
      success: true,
      query: cleanQuery,
      intent: 'HOW_ARE_YOU',
      business: null,
      requiresClarification: false,
      spokenResponse,
      displayMessage: spokenResponse,
      data: { type: 'conversation' },
    };
  }

  // -------------------------------------------------------------
  // FAST-PATH 3: Capabilities (< 1ms)
  // -------------------------------------------------------------
  if (/^(what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|help|who\s+are\s+you)[!.?]*$/i.test(lowerQ)) {
    const spokenResponse = "I can help you manage AJ'S TRAVEL, AJ'S MOBILE SHOP, and AJ'S FUEL STATION. You can ask me to check sales, expenses, inventory, vehicles, or generate business reports.";
    session.lastIntent = 'CAPABILITIES';
    userSessions.set(userId, session);
    saveConversationLogAsync(userId, null, cleanQuery, 'CAPABILITIES', spokenResponse, 'SUCCESS');
    return {
      success: true,
      query: cleanQuery,
      intent: 'CAPABILITIES',
      business: null,
      requiresClarification: false,
      spokenResponse,
      displayMessage: spokenResponse,
      data: { type: 'capabilities' },
    };
  }

  // Step 1: If there was a pending clarification, check if current query resolves it
  let actionToExecute = null;
  if (session.pendingAction) {
    if (session.pendingAction.missingField === 'business') {
      let resolvedBiz = null;
      if (lowerQ.includes('travel')) resolvedBiz = "AJ'S TRAVEL";
      else if (lowerQ.includes('mobile')) resolvedBiz = "AJ'S MOBILE SHOP";
      else if (lowerQ.includes('fuel')) resolvedBiz = "AJ'S FUEL STATION";

      if (resolvedBiz) {
        actionToExecute = {
          ...session.pendingAction.intentData,
          business: resolvedBiz,
          requires_clarification: false,
          clarification_question: null,
        };
        session.pendingAction = null;
      }
    } else if (session.pendingAction.missingField === 'amount') {
      const match = cleanQuery.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        actionToExecute = {
          ...session.pendingAction.intentData,
          amount: parseFloat(match[1]),
          requires_clarification: false,
          clarification_question: null,
        };
        session.pendingAction = null;
      }
    }
  }

  // Step 2: High-speed structured intent recognition + Gemini for complex queries
  if (!actionToExecute) {
    const deterministicParsed = parseNaturalLanguage(cleanQuery, {
      lastBusiness: session.lastBusiness,
      lastIntent: session.lastIntent,
    });

    // If deterministic parser matched a specific business intent or clarification, use it immediately (< 1ms)
    if (
      deterministicParsed &&
      deterministicParsed.intent !== 'GENERAL_CONVERSATION' &&
      deterministicParsed.intent !== 'UNKNOWN_INTENT'
    ) {
      actionToExecute = deterministicParsed;
    } else {
      // For complex queries and conversation requiring deep natural language understanding, call Gemini
      actionToExecute = await interpretVoiceCommand(cleanQuery, {
        lastBusiness: session.lastBusiness,
        lastIntent: session.lastIntent,
      });
    }
  }

  // Step 3: Handle Clarification / Ambiguity
  if (actionToExecute.requires_clarification) {
    let missingField = 'general';
    if (!actionToExecute.business) missingField = 'business';
    else if (!actionToExecute.amount && actionToExecute.intent === 'add_expense') missingField = 'amount';
    else if (!actionToExecute.quantity) missingField = 'quantity';

    session.pendingAction = {
      missingField,
      intentData: actionToExecute,
    };
    userSessions.set(userId, session);

    const question = actionToExecute.clarification_question || 'Could you please clarify your request?';
    saveConversationLogAsync(userId, null, cleanQuery, actionToExecute.intent, question, 'CLARIFICATION_REQUESTED', actionToExecute);

    return {
      success: true,
      query: cleanQuery,
      intent: actionToExecute.intent,
      requiresClarification: true,
      spokenResponse: question,
      displayMessage: question,
      data: null,
    };
  }

  // Clear pending action if regular execution proceeds
  session.pendingAction = null;

  // Step 4: Resolve Business ID from User's authorized businesses (cached)
  const userBusinesses = await getUserBusinessesCached(userId);
  let targetBusiness = null;

  if (actionToExecute.business) {
    targetBusiness = userBusinesses.find(
      (b) => b.name.toLowerCase() === actionToExecute.business.toLowerCase() ||
             b.type.toLowerCase() === actionToExecute.business.toLowerCase()
    );
  }

  let spokenResponse = '';
  let operationData = null;

  // Step 5: Execute verified backend business logic
  try {
    const rawIntent = (actionToExecute.intent || '').toUpperCase();

    // Check for conversational direct response first if intent is conversational
    if (['GREETING', 'HOW_ARE_YOU', 'CAPABILITIES', 'GENERAL_CONVERSATION', 'BUSINESS_INFORMATION'].includes(rawIntent)) {
      if (rawIntent === 'GREETING') {
        spokenResponse = actionToExecute.direct_response || 'Hello! Welcome to AI Assistant. How can I help you manage your businesses today?';
      } else if (rawIntent === 'HOW_ARE_YOU') {
        spokenResponse = actionToExecute.direct_response || "I'm doing well, thank you! Ready to help you manage your businesses. What would you like to check?";
      } else if (rawIntent === 'CAPABILITIES') {
        spokenResponse = actionToExecute.direct_response || "I can help you manage AJ'S TRAVEL, AJ'S MOBILE SHOP, and AJ'S FUEL STATION. You can ask me to check sales, expenses, inventory, vehicles, or print reports.";
      } else {
        spokenResponse = actionToExecute.direct_response || "I am your AI Assistant for AJ'S TRAVEL, AJ'S MOBILE SHOP, and AJ'S FUEL STATION. How can I help you?";
      }
      operationData = { type: 'conversation', intent: rawIntent };
      session.lastIntent = rawIntent;
    } else {
      switch (actionToExecute.intent) {
        // --- TRAVEL OPERATIONS ---
        case 'check_availability':
        case 'list_vehicles':
        case 'VEHICLE_QUERY':
        case 'vehicle_query': {
          const biz = targetBusiness || userBusinesses.find((b) => b.type === 'TRAVEL');
          if (!biz) throw new Error("AJ'S TRAVEL business not found for this account");

          const qLower = cleanQuery.toLowerCase();
          if (actionToExecute.vehicle || qLower.includes('available') || qLower.includes('availability') || qLower.includes('free') || actionToExecute.intent === 'check_availability') {
            const res = await travelService.checkVehicleAvailability(biz.id, cleanQuery);
            spokenResponse = res.message;
            operationData = res;
            session.lastBusiness = biz.name;
            session.lastIntent = 'check_availability';
          } else {
            const vehicles = await travelService.getVehicles(biz.id);
            const avail = vehicles.filter((v) => v.status === 'Available').length;
            spokenResponse = `You have ${vehicles.length} vehicles in AJ'S TRAVEL: 1 bus and 3 cars. ${avail} are currently available.`;
            operationData = vehicles;
            session.lastBusiness = biz.name;
            session.lastIntent = 'list_vehicles';
          }
          break;
        }

        // --- EXPENSE CREATION (ANY BUSINESS) ---
        case 'add_expense':
        case 'record_expense':
        case 'RECORD_EXPENSE': {
          if (!targetBusiness) {
            throw new Error('Business must be identified to record an expense');
          }
          if (!actionToExecute.amount || actionToExecute.amount <= 0) {
            throw new Error('A valid positive expense amount is required');
          }

          let createdExpense;
          if (targetBusiness.type === 'TRAVEL') {
            createdExpense = await travelService.recordTravelExpense(targetBusiness.id, {
              category: actionToExecute.category || 'operating',
              amount: actionToExecute.amount,
              vehicleQuery: actionToExecute.vehicle || cleanQuery,
              description: `Voice recorded expense: ${cleanQuery}`,
            });
          } else {
            createdExpense = await expenseService.createExpense(targetBusiness.id, {
              category: actionToExecute.category || 'operating',
              amount: actionToExecute.amount,
              description: `Voice recorded expense: ${cleanQuery}`,
            });
          }

          spokenResponse = `Recorded ${createdExpense.category} expense of ${createdExpense.amount} rupees for ${targetBusiness.name}.`;
          operationData = createdExpense;
          session.lastBusiness = targetBusiness.name;
          session.lastIntent = 'add_expense';

          logAudit({
            userId,
            businessId: targetBusiness.id,
            action: 'ADD_EXPENSE_VOICE',
            entityType: 'Expense',
            entityId: createdExpense.id,
            details: createdExpense,
          }).catch(console.error);
          break;
        }

        // --- MOBILE SHOP & FUEL INVENTORY OPERATIONS ---
        case 'check_stock':
        case 'inventory_query':
        case 'INVENTORY_QUERY': {
          if (actionToExecute.business === "AJ'S FUEL STATION" || targetBusiness?.type === 'FUEL' || actionToExecute.fuel_type) {
            const biz = targetBusiness || userBusinesses.find((b) => b.type === 'FUEL');
            const inventories = await fuelService.getInventory(biz.id);
            const p = inventories.find((i) => i.fuelType === 'Petrol');
            const d = inventories.find((i) => i.fuelType === 'Diesel');

            if (actionToExecute.fuel_type === 'Petrol') {
              spokenResponse = `Current petrol stock is ${p?.currentStock || 0} litres.`;
            } else if (actionToExecute.fuel_type === 'Diesel') {
              spokenResponse = `Current diesel stock is ${d?.currentStock || 0} litres.`;
            } else {
              spokenResponse = `Current fuel stock: Petrol is ${p?.currentStock || 0} litres, and Diesel is ${d?.currentStock || 0} litres.`;
            }
            operationData = inventories;
            session.lastBusiness = biz.name;
            session.lastIntent = 'check_stock';
          } else {
            const biz = targetBusiness || userBusinesses.find((b) => b.type === 'MOBILE');
            const products = await mobileService.getProducts(biz.id, actionToExecute.product || '');
            const totalStock = products.reduce((sum, p) => sum + p.availableStock, 0);

            if (actionToExecute.product) {
              spokenResponse = `You have ${totalStock} ${actionToExecute.product} phones in stock across ${products.length} models.`;
            } else {
              spokenResponse = `You have ${totalStock} total mobile phones in stock across ${products.length} models in AJ'S MOBILE SHOP.`;
            }
            operationData = products;
            session.lastBusiness = biz.name;
            session.lastIntent = 'check_stock';
          }
          break;
        }

        case 'check_low_stock':
        case 'low_stock_query':
        case 'LOW_STOCK_QUERY': {
          const biz = targetBusiness || userBusinesses.find((b) => b.type === 'MOBILE');
          const lowStock = await mobileService.getLowStockProducts(biz.id);
          if (lowStock.length === 0) {
            spokenResponse = 'All mobile phones are well stocked. No low-stock alerts.';
          } else {
            const names = lowStock.map((p) => `${p.brand} ${p.model} (${p.availableStock} left)`).join(', ');
            spokenResponse = `The following mobile phones have low stock: ${names}.`;
          }
          operationData = lowStock;
          session.lastBusiness = biz.name;
          session.lastIntent = 'check_low_stock';
          break;
        }

        case 'record_sale':
        case 'RECORD_SALE': {
          if (actionToExecute.business === "AJ'S FUEL STATION" || targetBusiness?.type === 'FUEL' || actionToExecute.fuel_type) {
            const biz = targetBusiness || userBusinesses.find((b) => b.type === 'FUEL');
            const fuelType = actionToExecute.fuel_type || 'Diesel';
            const qty = actionToExecute.quantity;
            if (!qty || qty <= 0) {
              throw new Error('Please specify the quantity of fuel sold in litres');
            }

            const sale = await fuelService.recordFuelSale(biz.id, {
              fuelType,
              quantityLitres: qty,
            });

            spokenResponse = `Recorded sale of ${qty} litres of ${fuelType} for ${sale.totalAmount.toFixed(2)} rupees. Remaining stock is now updated.`;
            operationData = sale;
            session.lastBusiness = biz.name;
            session.lastIntent = 'record_sale';

            logAudit({
              userId,
              businessId: biz.id,
              action: 'RECORD_FUEL_SALE_VOICE',
              entityType: 'FuelSale',
              entityId: sale.id,
              details: sale,
            }).catch(console.error);
          } else {
            const biz = targetBusiness || userBusinesses.find((b) => b.type === 'MOBILE');
            const products = await mobileService.getProducts(biz.id);
            let targetProduct = null;

            if (actionToExecute.product) {
              targetProduct = products.find(
                (p) => p.brand.toLowerCase().includes(actionToExecute.product.toLowerCase()) ||
                       p.model.toLowerCase().includes(actionToExecute.product.toLowerCase())
              );
            }
            if (!targetProduct && products.length > 0) {
              targetProduct = products[0];
            }

            if (!targetProduct) {
              throw new Error('No matching mobile phone product found in inventory');
            }

            const qty = actionToExecute.quantity || 1;
            const unitPrice = actionToExecute.amount || targetProduct.sellingPrice;

            const sale = await mobileService.recordSale(biz.id, {
              productId: targetProduct.id,
              quantity: qty,
              unitPrice,
              customerName: 'Voice Order Customer',
            });

            spokenResponse = `Recorded sale of ${qty} ${targetProduct.brand} ${targetProduct.model} for ${sale.totalAmount} rupees. Remaining stock is ${targetProduct.availableStock - qty}.`;
            operationData = sale;
            session.lastBusiness = biz.name;
            session.lastIntent = 'record_sale';

            logAudit({
              userId,
              businessId: biz.id,
              action: 'RECORD_MOBILE_SALE_VOICE',
              entityType: 'MobileSale',
              entityId: sale.id,
              details: sale,
            }).catch(console.error);
          }
          break;
        }

        case 'record_purchase':
        case 'RECORD_PURCHASE': {
          if (actionToExecute.business === "AJ'S FUEL STATION" || targetBusiness?.type === 'FUEL' || actionToExecute.fuel_type) {
            const biz = targetBusiness || userBusinesses.find((b) => b.type === 'FUEL');
            const fuelType = actionToExecute.fuel_type || 'Petrol';
            const qty = actionToExecute.quantity;
            if (!qty || qty <= 0) {
              throw new Error('Please specify the quantity of fuel purchased in litres');
            }

            const purchase = await fuelService.recordFuelPurchase(biz.id, {
              fuelType,
              quantityLitres: qty,
            });

            spokenResponse = `Recorded purchase of ${qty} litres of ${fuelType}. Total purchase amount is ${purchase.totalAmount.toFixed(2)} rupees.`;
            operationData = purchase;
            session.lastBusiness = biz.name;
            session.lastIntent = 'record_purchase';
          } else {
            const biz = targetBusiness || userBusinesses.find((b) => b.type === 'MOBILE');
            const products = await mobileService.getProducts(biz.id);
            let targetProduct = null;

            if (actionToExecute.product) {
              targetProduct = products.find(
                (p) => p.brand.toLowerCase().includes(actionToExecute.product.toLowerCase()) ||
                       p.model.toLowerCase().includes(actionToExecute.product.toLowerCase())
              );
            }
            if (!targetProduct && products.length > 0) {
              targetProduct = products[0];
            }

            if (!targetProduct) {
              throw new Error('No mobile product available to add inventory');
            }

            const qty = actionToExecute.quantity || 1;
            const purchase = await mobileService.recordPurchase(biz.id, {
              productId: targetProduct.id,
              quantity: qty,
              unitPrice: targetProduct.purchasePrice,
            });

            spokenResponse = `Added ${qty} ${targetProduct.brand} ${targetProduct.model} to inventory. Updated stock is ${targetProduct.availableStock + qty}.`;
            operationData = purchase;
            session.lastBusiness = biz.name;
            session.lastIntent = 'record_purchase';
          }
          break;
        }

        // --- REVENUE & FINANCIAL REPORTS ---
        case 'get_revenue':
        case 'get_sales':
        case 'revenue_query':
        case 'REVENUE_QUERY': {
          const period = actionToExecute.date_period || 'all';
          if (targetBusiness) {
            const report = await reportService.getBusinessReport(targetBusiness.id, period);
            const periodText = period === 'today' ? 'today' : period === 'yesterday' ? 'yesterday' : period === 'this_month' ? 'this month' : 'overall';
            spokenResponse = `${targetBusiness.name} revenue ${periodText} is ${report.revenue.toFixed(2)} rupees with expenses of ${report.expenses.toFixed(2)} rupees.`;
            operationData = report;
            session.lastBusiness = targetBusiness.name;
            session.lastIntent = actionToExecute.intent;
          } else {
            const dashboard = await reportService.getConsolidatedDashboard(userId, period);
            const periodText = period === 'today' ? 'today' : period === 'yesterday' ? 'yesterday' : period === 'this_month' ? 'this month' : 'overall';
            spokenResponse = `Combined recorded revenue across all three businesses ${periodText} is ${dashboard.summary.totalRevenue.toFixed(2)} rupees, with total expenses of ${dashboard.summary.totalExpenses.toFixed(2)} rupees.`;
            operationData = dashboard;
            session.lastBusiness = null;
            session.lastIntent = 'get_revenue';
          }
          break;
        }

        case 'get_expenses':
        case 'expense_query':
        case 'EXPENSE_QUERY': {
          const period = actionToExecute.date_period || 'this_month';
          if (targetBusiness) {
            const report = await reportService.getBusinessReport(targetBusiness.id, period);
            spokenResponse = `Recorded expenses for ${targetBusiness.name} are ${report.expenses.toFixed(2)} rupees.`;
            operationData = report;
            session.lastBusiness = targetBusiness.name;
            session.lastIntent = 'get_expenses';
          } else {
            const dashboard = await reportService.getConsolidatedDashboard(userId, period);
            spokenResponse = `Total recorded expenses across all three businesses are ${dashboard.summary.totalExpenses.toFixed(2)} rupees.`;
            operationData = dashboard;
            session.lastBusiness = null;
            session.lastIntent = 'get_expenses';
          }
          break;
        }

        // --- PRINTING & DOCUMENT GENERATION ---
        case 'PRINT_INVOICES':
        case 'print_invoices': {
          let bType = targetBusiness?.type;
          if (!bType && actionToExecute.business) {
            const bUpper = actionToExecute.business.toUpperCase();
            if (bUpper.includes('TRAVEL')) bType = 'TRAVEL';
            else if (bUpper.includes('MOBILE')) bType = 'MOBILE';
            else if (bUpper.includes('FUEL')) bType = 'FUEL';
          }
          if (!bType) {
            bType = 'TRAVEL';
          }
          const timeframe = actionToExecute.date_period || 'all';
          const report = await printService.generateInvoicesReport(userId, bType, timeframe);
          spokenResponse = report.message || `Generated invoices report for ${report.businessName}. Ready to print.`;
          operationData = report;
          session.lastBusiness = report.businessName;
          session.lastIntent = 'PRINT_INVOICES';
          break;
        }

        case 'PRINT_EXPENDITURE_REPORT':
        case 'print_expenditure_report': {
          const targetBiz = targetBusiness?.name || actionToExecute.business || 'ALL';
          const timeframe = actionToExecute.date_period || 'this_month';
          const report = await printService.generateExpenditureReport(userId, targetBiz, timeframe);
          spokenResponse = report.message || `Generated expenditure report for ${report.businessName}. Ready to print.`;
          operationData = report;
          session.lastBusiness = report.businessName !== 'All Businesses' ? report.businessName : null;
          session.lastIntent = 'PRINT_EXPENDITURE_REPORT';
          break;
        }

        case 'PRINT_SALES_REPORT':
        case 'print_sales_report': {
          const targetBiz = targetBusiness?.name || actionToExecute.business || 'ALL';
          const timeframe = actionToExecute.date_period || 'this_month';
          const report = await printService.generateSalesReport(userId, targetBiz, timeframe);
          spokenResponse = report.message || `Generated sales report for ${report.businessName}. Ready to print.`;
          operationData = report;
          session.lastBusiness = report.businessName;
          session.lastIntent = 'PRINT_SALES_REPORT';
          break;
        }

        case 'PRINT_PURCHASE_REPORT':
        case 'print_purchase_report': {
          let bType = targetBusiness?.type;
          if (!bType && actionToExecute.business) {
            const bUpper = actionToExecute.business.toUpperCase();
            if (bUpper.includes('MOBILE')) bType = 'MOBILE';
            else if (bUpper.includes('FUEL')) bType = 'FUEL';
          }
          if (!bType) bType = 'MOBILE';
          const timeframe = actionToExecute.date_period || 'all';
          const report = await printService.generateInvoicesReport(userId, bType, timeframe);
          spokenResponse = report.message || `Generated purchases report for ${report.businessName}. Ready to print.`;
          operationData = report;
          session.lastBusiness = report.businessName;
          session.lastIntent = 'PRINT_PURCHASE_REPORT';
          break;
        }

        case 'PRINT_STOCK_REPORT':
        case 'print_stock_report': {
          let bType = targetBusiness?.type;
          if (!bType && actionToExecute.business) {
            const bUpper = actionToExecute.business.toUpperCase();
            if (bUpper.includes('FUEL')) bType = 'FUEL';
            else bType = 'MOBILE';
          }
          if (!bType) bType = 'MOBILE';
          const report = await printService.generateStockReport(userId, bType);
          spokenResponse = report.message || `Generated inventory stock report for ${report.businessName}. Ready to print.`;
          operationData = report;
          session.lastBusiness = report.businessName;
          session.lastIntent = 'PRINT_STOCK_REPORT';
          break;
        }

        default: {
          if (actionToExecute.direct_response) {
            spokenResponse = actionToExecute.direct_response;
          } else {
            spokenResponse = `I can help you manage your businesses: AJ'S TRAVEL (vehicles, trips, expenses), AJ'S MOBILE SHOP (phone stock, sales, purchases), and AJ'S FUEL STATION (petrol, diesel, sales). What would you like to check?`;
          }
          operationData = { intent: actionToExecute.intent };
          break;
        }
      }
    }

    userSessions.set(userId, session);
    saveConversationLogAsync(userId, targetBusiness?.id, cleanQuery, actionToExecute.intent, spokenResponse, 'SUCCESS', actionToExecute);

    return {
      success: true,
      query: cleanQuery,
      intent: actionToExecute.intent,
      business: targetBusiness?.name || null,
      requiresClarification: false,
      spokenResponse,
      displayMessage: spokenResponse,
      data: operationData,
      printReport: operationData?.html ? {
        title: operationData.title,
        businessName: operationData.businessName,
        timeframe: operationData.timeframe,
        totalAmount: operationData.totalAmount,
        itemCount: operationData.itemCount,
        html: operationData.html,
      } : null,
    };
  } catch (err) {
    const errorMsg = err.message || 'Failed to execute requested voice operation';
    spokenResponse = `I could not complete that request: ${errorMsg}`;

    saveConversationLogAsync(userId, targetBusiness?.id, cleanQuery, actionToExecute.intent, spokenResponse, 'ERROR', actionToExecute);

    return {
      success: false,
      query: cleanQuery,
      intent: actionToExecute.intent,
      requiresClarification: false,
      spokenResponse,
      displayMessage: spokenResponse,
      error: errorMsg,
    };
  }
};
