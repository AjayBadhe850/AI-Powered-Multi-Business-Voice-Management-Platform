import prisma from '../config/db.js';
import { interpretVoiceCommand } from './ai.service.js';
import * as travelService from './travel.service.js';
import * as mobileService from './mobile.service.js';
import * as fuelService from './fuel.service.js';
import * as expenseService from './expense.service.js';
import * as reportService from './report.service.js';
import { logAudit } from '../utils/auditLogger.js';

// In-memory conversation state for active turns (context retention & multi-turn resolution)
const userSessions = new Map();

export const processVoiceQuery = async (userId, query) => {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new Error('Please provide a voice command or text query');
  }

  const cleanQuery = query.trim();
  const session = userSessions.get(userId) || { lastBusiness: null, lastIntent: null, pendingAction: null };

  // Step 1: If there was a pending clarification, check if the current query resolves it
  let actionToExecute = null;
  if (session.pendingAction) {
    const qLower = cleanQuery.toLowerCase();
    // Resolving ambiguous business
    if (session.pendingAction.missingField === 'business') {
      let resolvedBiz = null;
      if (qLower.includes('travel')) resolvedBiz = "AJ'S TRAVEL";
      else if (qLower.includes('mobile')) resolvedBiz = "AJ'S MOBILE SHOP";
      else if (qLower.includes('fuel')) resolvedBiz = "AJ'S FUEL STATION";

      if (resolvedBiz) {
        actionToExecute = {
          ...session.pendingAction.intentData,
          business: resolvedBiz,
          requires_clarification: false,
          clarification_question: null,
        };
        session.pendingAction = null;
      }
    }
    // Resolving missing amount
    else if (session.pendingAction.missingField === 'amount') {
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

  // Step 2: If not resolved via pending action, interpret query using AI / NLP
  if (!actionToExecute) {
    actionToExecute = await interpretVoiceCommand(cleanQuery, {
      lastBusiness: session.lastBusiness,
      lastIntent: session.lastIntent,
    });
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

    // Store in DB
    await prisma.voiceConversation.create({
      data: {
        userId,
        userQuery: cleanQuery,
        detectedIntent: actionToExecute.intent,
        extractedEntities: actionToExecute,
        clarificationNeeded: true,
        clarificationPrompt: question,
        responseMessage: question,
        status: 'CLARIFICATION_REQUESTED',
      },
    });

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

  // Step 4: Resolve Business ID from User's authorized businesses
  const userBusinesses = await prisma.business.findMany({ where: { userId } });
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
    switch (actionToExecute.intent) {
      // --- TRAVEL OPERATIONS ---
      case 'check_availability': {
        const biz = targetBusiness || userBusinesses.find((b) => b.type === 'TRAVEL');
        if (!biz) throw new Error("AJ'S TRAVEL business not found for this account");
        const res = await travelService.checkVehicleAvailability(biz.id, cleanQuery);
        spokenResponse = res.message;
        operationData = res;
        session.lastBusiness = biz.name;
        session.lastIntent = 'check_availability';
        break;
      }

      case 'list_vehicles': {
        const biz = targetBusiness || userBusinesses.find((b) => b.type === 'TRAVEL');
        if (!biz) throw new Error("AJ'S TRAVEL business not found");
        const vehicles = await travelService.getVehicles(biz.id);
        const avail = vehicles.filter((v) => v.status === 'Available').length;
        spokenResponse = `You have ${vehicles.length} vehicles in AJ'S TRAVEL: 1 bus and 3 cars. ${avail} are currently available.`;
        operationData = vehicles;
        session.lastBusiness = biz.name;
        session.lastIntent = 'list_vehicles';
        break;
      }

      // --- EXPENSE CREATION (ANY BUSINESS) ---
      case 'add_expense': {
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

        await logAudit({
          userId,
          businessId: targetBusiness.id,
          action: 'ADD_EXPENSE_VOICE',
          entityType: 'Expense',
          entityId: createdExpense.id,
          details: createdExpense,
        });
        break;
      }

      // --- MOBILE SHOP OPERATIONS ---
      case 'check_stock': {
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

      case 'check_low_stock': {
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

      case 'record_sale': {
        if (actionToExecute.business === "AJ'S FUEL STATION" || targetBusiness?.type === 'FUEL' || actionToExecute.fuel_type) {
          // Fuel sale
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

          await logAudit({
            userId,
            businessId: biz.id,
            action: 'RECORD_FUEL_SALE_VOICE',
            entityType: 'FuelSale',
            entityId: sale.id,
            details: sale,
          });
        } else {
          // Mobile sale
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

          await logAudit({
            userId,
            businessId: biz.id,
            action: 'RECORD_MOBILE_SALE_VOICE',
            entityType: 'MobileSale',
            entityId: sale.id,
            details: sale,
          });
        }
        break;
      }

      case 'record_purchase': {
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
          // Mobile purchase / stock addition
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
      case 'get_sales': {
        const period = actionToExecute.date_period || 'all';
        if (targetBusiness) {
          const report = await reportService.getBusinessReport(targetBusiness.id, period);
          const periodText = period === 'today' ? 'today' : period === 'yesterday' ? 'yesterday' : period === 'this_month' ? 'this month' : 'overall';
          spokenResponse = `${targetBusiness.name} revenue ${periodText} is ${report.revenue.toFixed(2)} rupees with expenses of ${report.expenses.toFixed(2)} rupees.`;
          operationData = report;
          session.lastBusiness = targetBusiness.name;
          session.lastIntent = actionToExecute.intent;
        } else {
          // Combined business revenue
          const dashboard = await reportService.getConsolidatedDashboard(userId, period);
          const periodText = period === 'today' ? 'today' : period === 'yesterday' ? 'yesterday' : period === 'this_month' ? 'this month' : 'overall';
          spokenResponse = `Combined recorded revenue across all three businesses ${periodText} is ${dashboard.summary.totalRevenue.toFixed(2)} rupees, with total expenses of ${dashboard.summary.totalExpenses.toFixed(2)} rupees.`;
          operationData = dashboard;
          session.lastBusiness = null;
          session.lastIntent = 'get_revenue';
        }
        break;
      }

      case 'get_expenses': {
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

      default: {
        spokenResponse = `I understood your request for ${targetBusiness?.name || 'your businesses'}. How else can I assist with travel, mobile shop, or fuel station operations?`;
        operationData = { intent: actionToExecute.intent };
        break;
      }
    }

    userSessions.set(userId, session);

    // Save to conversation history in DB
    await prisma.voiceConversation.create({
      data: {
        userId,
        businessId: targetBusiness?.id || null,
        userQuery: cleanQuery,
        detectedIntent: actionToExecute.intent,
        extractedEntities: actionToExecute,
        clarificationNeeded: false,
        responseMessage: spokenResponse,
        status: 'SUCCESS',
      },
    });

    return {
      success: true,
      query: cleanQuery,
      intent: actionToExecute.intent,
      business: targetBusiness?.name || null,
      requiresClarification: false,
      spokenResponse,
      displayMessage: spokenResponse,
      data: operationData,
    };
  } catch (err) {
    const errorMsg = err.message || 'Failed to execute requested voice operation';
    spokenResponse = `I could not complete that request: ${errorMsg}`;

    await prisma.voiceConversation.create({
      data: {
        userId,
        businessId: targetBusiness?.id || null,
        userQuery: cleanQuery,
        detectedIntent: actionToExecute.intent,
        extractedEntities: actionToExecute,
        clarificationNeeded: false,
        responseMessage: spokenResponse,
        status: 'ERROR',
      },
    });

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
