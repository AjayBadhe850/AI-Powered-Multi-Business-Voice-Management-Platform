import { GoogleGenerativeAI } from '@google/generative-ai';

const BUSINESS_TRAVEL = "AJ'S TRAVEL";
const BUSINESS_MOBILE = "AJ'S MOBILE SHOP";
const BUSINESS_FUEL = "AJ'S FUEL STATION";

/**
 * Natural Language Parser & Entity Extractor (Rule Engine)
 * Provides deterministic, guaranteed intent extraction and fallback for AI.
 */
export const parseNaturalLanguage = (query, context = {}) => {
  const text = (query || '').toLowerCase().trim();

  let intent = 'general_query';
  let business = null;
  let amount = null;
  let quantity = null;
  let category = null;
  let vehicle = null;
  let product = null;
  let fuelType = null;
  let datePeriod = null;
  let requiresClarification = false;
  let clarificationQuestion = null;

  // 1. Date Period Detection
  if (text.includes('today')) {
    datePeriod = 'today';
  } else if (text.includes('yesterday')) {
    datePeriod = 'yesterday';
  } else if (text.includes('this month') || text.includes('monthly')) {
    datePeriod = 'this_month';
  }

  // 2. Business Identification
  if (text.includes("travel") || text.includes("bus") || text.includes("car") || text.includes("trip") || text.includes("fleet") || text.includes("booking") || text.includes("driver")) {
    business = BUSINESS_TRAVEL;
  }
  if (text.includes("mobile") || text.includes("phone") || text.includes("samsung") || text.includes("iphone") || text.includes("apple") || text.includes("oneplus") || text.includes("redmi") || text.includes("xiaomi")) {
    // If text specifically mentions travel car or bus, do not confuse with mobile
    if (!text.includes("car") && !text.includes("bus")) {
      business = BUSINESS_MOBILE;
    }
  }
  if (text.includes("fuel") || text.includes("petrol") || text.includes("diesel") || text.includes("pump") || text.includes("station")) {
    business = BUSINESS_FUEL;
  }

  // 3. Amount and Quantity Extraction
  // Match rupees/rs/inr
  const rupeeMatch = text.match(/(?:(?:rs\.?|inr|rupees)\s*(\d+(?:\.\d+)?))|(?:(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees))/i);
  if (rupeeMatch) {
    amount = parseFloat(rupeeMatch[1] || rupeeMatch[2]);
  }

  // Match litres for fuel
  const litreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:litres?|liters?|ltrs?|l\b)/i);
  if (litreMatch) {
    quantity = parseFloat(litreMatch[1]);
  }

  // Match general number if quantity or amount not yet set
  if (!quantity && !amount) {
    const numWords = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10 };
    for (const [w, val] of Object.entries(numWords)) {
      if (new RegExp(`\\b${w}\\b`).test(text)) {
        quantity = val;
        break;
      }
    }
    const genericNumber = text.match(/\b(\d+)\b/);
    if (!quantity && genericNumber) {
      const parsedNum = parseFloat(genericNumber[1]);
      // If query is about expense or revenue, treat as amount; else as quantity
      if (text.includes('expense') || text.includes('revenue') || text.includes('cost') || text.includes('price')) {
        amount = parsedNum;
      } else {
        quantity = parsedNum;
      }
    }
  }

  // 4. Vehicle Extraction (Travel)
  if (text.includes('bus')) {
    vehicle = 'Bus 1';
  } else if (text.includes('car 1') || text.includes('car one')) {
    vehicle = 'Car 1';
  } else if (text.includes('car 2') || text.includes('car two')) {
    vehicle = 'Car 2';
  } else if (text.includes('car 3') || text.includes('car three')) {
    vehicle = 'Car 3';
  } else if (text.includes('car')) {
    vehicle = 'Car';
  }

  // 5. Fuel Type Extraction (Fuel Station)
  if (text.includes('petrol')) {
    fuelType = 'Petrol';
  } else if (text.includes('diesel')) {
    fuelType = 'Diesel';
  }

  // 6. Mobile Brand/Model Extraction (Mobile Shop)
  if (text.includes('samsung')) {
    product = 'Samsung';
  } else if (text.includes('iphone') || text.includes('apple')) {
    product = 'iPhone';
  } else if (text.includes('oneplus')) {
    product = 'OnePlus';
  } else if (text.includes('redmi') || text.includes('xiaomi')) {
    product = 'Xiaomi';
  }

  // 7. Context Retention & Follow-up Recognition
  if (!business && context.lastBusiness) {
    // If user asks "what about yesterday?", "how much today?", "show sales", retain business and intent from context
    if (text.includes('yesterday') || text.includes('today') || text.includes('what about') || text.includes('how much') || text.includes('show sales') || text.includes('stock')) {
      business = context.lastBusiness;
      if (context.lastIntent) intent = context.lastIntent;
    }
  }

  // 8. Intent Recognition
  // Check availability
  if (text.includes('available') || text.includes('availability') || text.includes('free')) {
    intent = 'check_availability';
    if (!business) business = BUSINESS_TRAVEL;
  }
  // List vehicles
  else if (text.includes('vehicles') || text.includes('fleet') || (text.includes('show') && text.includes('cars'))) {
    intent = 'list_vehicles';
    business = BUSINESS_TRAVEL;
  }
  // Record sale
  else if (text.includes('sale') || text.includes('sold') || text.includes('sell')) {
    intent = 'record_sale';
    if (text.includes('how much') || text.includes('show') || text.includes('what was')) {
      intent = 'get_sales';
    }
  }
  // Record purchase / inventory addition
  else if (text.includes('purchase') || text.includes('bought') || text.includes('buy') || (text.includes('add') && text.includes('inventory'))) {
    intent = 'record_purchase';
  }
  // Check stock / inventory
  else if (text.includes('stock') || text.includes('inventory') || text.includes('how many') || text.includes('how much diesel') || text.includes('how much petrol')) {
    intent = 'check_stock';
    if (text.includes('low')) {
      intent = 'check_low_stock';
    }
  }
  // Revenue / Reports
  else if (text.includes('revenue') || text.includes('income') || text.includes('earnings') || text.includes('profit') || text.includes('report') || text.includes('summary')) {
    intent = 'get_revenue';
  }
  // Expenses
  else if (text.includes('expense') || text.includes('maintenance') || text.includes('fuel expense') || text.includes('electricity') || text.includes('salary') || text.includes('bill')) {
    if (text.includes('show') || text.includes('how much') || text.includes('what are')) {
      intent = 'get_expenses';
    } else {
      intent = 'add_expense';
    }

    if (text.includes('maintenance')) category = 'maintenance';
    else if (text.includes('electricity')) category = 'electricity';
    else if (text.includes('fuel')) category = 'fuel';
    else if (text.includes('driver')) category = 'driver';
    else category = 'operating';
  }

  // 9. Ambiguity and Clarification Detection (Strict Rule #4)
  // If user says "Add 2000 rupees expense." without naming business
  if ((intent === 'add_expense' || intent === 'get_expenses') && !business) {
    requiresClarification = true;
    clarificationQuestion = "Which business should I record this expense for: AJ'S TRAVEL, AJ'S MOBILE SHOP or AJ'S FUEL STATION?";
    return {
      intent,
      business: null,
      amount,
      category,
      vehicle,
      requires_clarification: true,
      clarification_question: clarificationQuestion,
    };
  }

  // If user says "Add expense to AJ'S TRAVEL" but missing amount
  if (intent === 'add_expense' && business && !amount) {
    requiresClarification = true;
    clarificationQuestion = `How much expense would you like to record for ${business}?`;
    return {
      intent,
      business,
      category,
      vehicle,
      requires_clarification: true,
      clarification_question: clarificationQuestion,
    };
  }

  // If user says "Record petrol sale" but missing quantity
  if (intent === 'record_sale' && business === BUSINESS_FUEL && !quantity) {
    requiresClarification = true;
    clarificationQuestion = `How many litres of ${fuelType || 'fuel'} were sold?`;
    return {
      intent,
      business,
      fuel_type: fuelType,
      requires_clarification: true,
      clarification_question: clarificationQuestion,
    };
  }

  // If user says "Record diesel purchase" but missing quantity
  if (intent === 'record_purchase' && business === BUSINESS_FUEL && !quantity) {
    requiresClarification = true;
    clarificationQuestion = `How many litres of ${fuelType || 'fuel'} did you purchase?`;
    return {
      intent,
      business,
      fuel_type: fuelType,
      requires_clarification: true,
      clarification_question: clarificationQuestion,
    };
  }

  return {
    intent,
    business,
    amount,
    quantity,
    category,
    vehicle,
    product,
    fuel_type: fuelType,
    date_period: datePeriod,
    requires_clarification: requiresClarification,
    clarification_question: clarificationQuestion,
  };
};

/**
 * Call Gemini API if GEMINI_API_KEY is configured, else fallback gracefully to NLP Parser
 */
export const interpretVoiceCommand = async (query, context = {}) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are the AI Voice Assistant for a multi-business owner.
Manage three official businesses:
1. "AJ'S TRAVEL" (1 Bus, 3 Cars: Car 1, Car 2, Car 3. Trips, Bookings, Drivers, Vehicle Fuel & Maintenance expenses).
2. "AJ'S MOBILE SHOP" (Mobile phones ONLY: Samsung, iPhone/Apple, OnePlus, Xiaomi. Stock, sales, purchases).
3. "AJ'S FUEL STATION" (Petrol and Diesel ONLY. Stocks, sales, purchases, operating expenses).

Rules:
- NEVER guess the business. If the command says "Add 2000 rupees expense" without specifying the business, set "requires_clarification": true and "clarification_question": "Which business should I record this expense for: AJ'S TRAVEL, AJ'S MOBILE SHOP or AJ'S FUEL STATION?".
- Never guess missing amounts or quantities. If missing, set "requires_clarification": true and ask clearly.
- Output ONLY a valid JSON object matching this schema:
{
  "intent": "check_availability" | "add_expense" | "record_sale" | "record_purchase" | "check_stock" | "check_low_stock" | "get_revenue" | "get_sales" | "get_expenses" | "list_vehicles" | "general_query",
  "business": "AJ'S TRAVEL" | "AJ'S MOBILE SHOP" | "AJ'S FUEL STATION" | null,
  "amount": number | null,
  "quantity": number | null,
  "category": "maintenance" | "fuel" | "driver" | "electricity" | "operating" | null,
  "vehicle": string | null,
  "product": string | null,
  "fuel_type": "Petrol" | "Diesel" | null,
  "date_period": "today" | "yesterday" | "this_month" | null,
  "requires_clarification": boolean,
  "clarification_question": string | null
}`;

      const prompt = `Context: ${JSON.stringify(context)}\nUser Voice Query: "${query}"`;
      const result = await model.generateContent([systemPrompt, prompt]);
      const responseText = result.response.text();

      // Clean markdown formatting if present
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Backend safety validation
      if (parsed && parsed.intent) {
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini API call bypassed or failed, using robust rule parser:', err.message);
    }
  }

  // Deterministic NLP Parser fallback
  return parseNaturalLanguage(query, context);
};
