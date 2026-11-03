import { GoogleGenerativeAI } from '@google/generative-ai';

const BUSINESS_TRAVEL = "AJ'S TRAVEL";
const BUSINESS_MOBILE = "AJ'S MOBILE SHOP";
const BUSINESS_FUEL = "AJ'S FUEL STATION";

// High-performance Gemini models in order of priority (fastest TTFB first)
const GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite'];

// Circuit-breaker for API rate limits (skips remote network delays on 429 quota exhaustion)
let geminiRateLimitUntil = 0;

/**
 * Natural Language Parser & Entity Extractor (Rule Engine & Offline Fallback)
 * Ensures 100% deterministic intent recognition and handles greetings,
 * general queries, business identification, and ambiguity detection.
 */
export const parseNaturalLanguage = (query, context = {}) => {
  const text = (query || '').toLowerCase().trim();

  let intent = 'GENERAL_CONVERSATION';
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
  let directResponse = null;

  // 1. Greetings & Conversational Small Talk
  if (/^(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/i.test(text) || text === 'hello' || text === 'hi' || text === 'hey') {
    return {
      intent: 'GREETING',
      business: null,
      amount: null,
      quantity: null,
      category: null,
      vehicle: null,
      product: null,
      fuel_type: null,
      date_period: null,
      requires_clarification: false,
      clarification_question: null,
      direct_response: 'Hello! Welcome to AI Assistant. How can I help you manage your businesses today?',
    };
  }

  if (text.includes('how are you') || text.includes('how are you doing') || text.includes('how do you do')) {
    return {
      intent: 'HOW_ARE_YOU',
      business: null,
      amount: null,
      quantity: null,
      category: null,
      vehicle: null,
      product: null,
      fuel_type: null,
      date_period: null,
      requires_clarification: false,
      clarification_question: null,
      direct_response: "I'm doing well! Ready to help you manage your businesses. What would you like to check?",
    };
  }

  if (text.includes('what can you do') || text.includes('who are you') || text.includes('what are your capabilities') || text.includes('help me') || text === 'help') {
    return {
      intent: 'CAPABILITIES',
      business: null,
      amount: null,
      quantity: null,
      category: null,
      vehicle: null,
      product: null,
      fuel_type: null,
      date_period: null,
      requires_clarification: false,
      clarification_question: null,
      direct_response: "I can help manage AJ'S TRAVEL, AJ'S MOBILE SHOP and AJ'S FUEL STATION. You can ask me about sales, expenses, inventory, vehicles and business reports.",
    };
  }

  // 2. Date Period Detection (India Standard Time aware)
  if (text.includes('today')) {
    datePeriod = 'today';
  } else if (text.includes('yesterday')) {
    datePeriod = 'yesterday';
  } else if (text.includes('last month') || text.includes('previous month')) {
    datePeriod = 'last_month';
  } else if (text.includes('this month') || text.includes('monthly') || text.includes('current month')) {
    datePeriod = 'this_month';
  }

  // 3. Business Identification
  if (text.includes("all business") || text.includes("all businesses") || text.includes("consolidated") || text.includes("everything")) {
    business = 'ALL';
  } else if (text.includes("travel") || text.includes("bus") || text.includes("car") || text.includes("trip") || text.includes("fleet") || text.includes("booking") || text.includes("driver")) {
    business = BUSINESS_TRAVEL;
  }
  if (text.includes("mobile") || text.includes("phone") || text.includes("samsung") || text.includes("iphone") || text.includes("apple") || text.includes("oneplus") || text.includes("redmi") || text.includes("xiaomi")) {
    if (!text.includes("car") && !text.includes("bus")) {
      business = BUSINESS_MOBILE;
    }
  }
  if (text.includes("fuel") || text.includes("petrol") || text.includes("diesel") || text.includes("pump") || text.includes("station")) {
    business = BUSINESS_FUEL;
  }

  // 4. Amount and Quantity Extraction
  const rupeeMatch = text.match(/(?:(?:rs\.?|inr|rupees)\s*(\d+(?:\.\d+)?))|(?:(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees))/i);
  if (rupeeMatch) {
    amount = parseFloat(rupeeMatch[1] || rupeeMatch[2]);
  }

  const litreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:litres?|liters?|ltrs?|l\b)/i);
  if (litreMatch) {
    quantity = parseFloat(litreMatch[1]);
  }

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
      if (text.includes('expense') || text.includes('revenue') || text.includes('cost') || text.includes('price')) {
        amount = parsedNum;
      } else {
        quantity = parsedNum;
      }
    }
  }

  // 5. Vehicle Extraction (Travel)
  if (text.includes('bus')) {
    vehicle = 'Bus 1';
  } else if (text.includes('car 1') || text.includes('car one') || text.includes('car_1')) {
    vehicle = 'Car 1';
  } else if (text.includes('car 2') || text.includes('car two') || text.includes('car_2')) {
    vehicle = 'Car 2';
  } else if (text.includes('car 3') || text.includes('car three') || text.includes('car_3')) {
    vehicle = 'Car 3';
  } else if (text.includes('car')) {
    vehicle = 'Car';
  }

  // 6. Fuel Type Extraction (Fuel Station)
  if (text.includes('petrol')) {
    fuelType = 'Petrol';
  } else if (text.includes('diesel')) {
    fuelType = 'Diesel';
  }

  // 7. Mobile Brand/Model Extraction (Mobile Shop)
  if (text.includes('samsung')) {
    product = 'Samsung';
  } else if (text.includes('iphone') || text.includes('apple')) {
    product = 'iPhone';
  } else if (text.includes('oneplus')) {
    product = 'OnePlus';
  } else if (text.includes('redmi') || text.includes('xiaomi')) {
    product = 'Xiaomi';
  }

  // 8. Context Retention & Follow-up Recognition
  if (!business && context.lastBusiness) {
    if (text.includes('yesterday') || text.includes('today') || text.includes('what about') || text.includes('how much') || text.includes('show sales') || text.includes('stock')) {
      business = context.lastBusiness;
      if (context.lastIntent) intent = context.lastIntent;
    }
  }

  // 8.5. Print & Document Generation Command Recognition
  const isPrint = text.includes('print') || text.includes('download') || text.includes('generate pdf') || text.includes('export');

  if (isPrint) {
    if (text.includes('invoice') || text.includes('receipt') || text.includes('bill')) {
      intent = 'PRINT_INVOICES';
      if (!business) {
        requiresClarification = true;
        clarificationQuestion = "Which business would you like to print invoices for: AJ'S TRAVEL, AJ'S MOBILE SHOP, or AJ'S FUEL STATION?";
        return {
          intent,
          business: null,
          date_period: datePeriod,
          requires_clarification: true,
          clarification_question: clarificationQuestion,
          direct_response: null,
        };
      }
      return {
        intent,
        business,
        date_period: datePeriod,
        requires_clarification: false,
        clarification_question: null,
        direct_response: null,
      };
    } else if (text.includes('expenditure') || text.includes('expense') || text.includes('cost') || text.includes('spending')) {
      intent = 'PRINT_EXPENDITURE_REPORT';
      return {
        intent,
        business: business || 'ALL',
        date_period: datePeriod,
        requires_clarification: false,
        clarification_question: null,
        direct_response: null,
      };
    } else if (text.includes('sale') || text.includes('sales report') || text.includes('revenue')) {
      intent = 'PRINT_SALES_REPORT';
      return {
        intent,
        business: business || 'ALL',
        date_period: datePeriod,
        requires_clarification: false,
        clarification_question: null,
        direct_response: null,
      };
    } else if (text.includes('purchase') || text.includes('bought')) {
      intent = 'PRINT_PURCHASE_REPORT';
      if (!business) {
        requiresClarification = true;
        clarificationQuestion = "Which business purchases would you like to print: AJ'S MOBILE SHOP or AJ'S FUEL STATION?";
        return {
          intent,
          business: null,
          date_period: datePeriod,
          requires_clarification: true,
          clarification_question: clarificationQuestion,
          direct_response: null,
        };
      }
      return {
        intent,
        business,
        date_period: datePeriod,
        requires_clarification: false,
        clarification_question: null,
        direct_response: null,
      };
    } else if (text.includes('stock') || text.includes('inventory')) {
      intent = 'PRINT_STOCK_REPORT';
      if (!business) {
        requiresClarification = true;
        clarificationQuestion = "Which business stock would you like to print: AJ'S MOBILE SHOP or AJ'S FUEL STATION?";
        return {
          intent,
          business: null,
          date_period: datePeriod,
          requires_clarification: true,
          clarification_question: clarificationQuestion,
          direct_response: null,
        };
      }
      return {
        intent,
        business,
        date_period: datePeriod,
        requires_clarification: false,
        clarification_question: null,
        direct_response: null,
      };
    } else if (text.includes('report') || text.includes('statement')) {
      intent = 'PRINT_SALES_REPORT';
      return {
        intent,
        business: business || 'ALL',
        date_period: datePeriod,
        requires_clarification: false,
        clarification_question: null,
        direct_response: null,
      };
    }
  }

  // 9. Intent Recognition
  if (text.includes('available') || text.includes('availability') || text.includes('free')) {
    intent = 'VEHICLE_QUERY';
    if (!business) business = BUSINESS_TRAVEL;
  } else if (text.includes('vehicles') || text.includes('fleet') || (text.includes('show') && text.includes('cars'))) {
    intent = 'list_vehicles';
    business = BUSINESS_TRAVEL;
  } else if (text.includes('sale') || text.includes('sold') || text.includes('sell')) {
    if (text.includes('how much') || text.includes('show') || text.includes('what was')) {
      intent = 'REVENUE_QUERY';
    } else {
      intent = 'RECORD_SALE';
    }
  } else if (text.includes('purchase') || text.includes('bought') || text.includes('buy') || (text.includes('add') && text.includes('inventory'))) {
    intent = 'RECORD_PURCHASE';
  } else if (text.includes('stock') || text.includes('inventory') || text.includes('how many') || text.includes('how much diesel') || text.includes('how much petrol')) {
    if (text.includes('low')) {
      intent = 'LOW_STOCK_QUERY';
    } else {
      intent = 'INVENTORY_QUERY';
    }
  } else if (text.includes('revenue') || text.includes('income') || text.includes('earnings') || text.includes('profit') || text.includes('report') || text.includes('summary')) {
    intent = 'REVENUE_QUERY';
  } else if (text.includes('expense') || text.includes('maintenance') || text.includes('fuel expense') || text.includes('electricity') || text.includes('salary') || text.includes('bill')) {
    if (text.includes('show') || text.includes('how much') || text.includes('what are')) {
      intent = 'EXPENSE_QUERY';
    } else {
      intent = 'RECORD_EXPENSE';
    }

    if (text.includes('maintenance')) category = 'maintenance';
    else if (text.includes('electricity')) category = 'electricity';
    else if (text.includes('fuel')) category = 'fuel';
    else if (text.includes('driver')) category = 'driver';
    else category = 'operating';
  }

  // 10. Ambiguity and Clarification Detection (Strict Rule #4)
  if ((intent === 'RECORD_EXPENSE' || intent === 'EXPENSE_QUERY') && !business) {
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
      direct_response: null,
    };
  }

  if (intent === 'RECORD_EXPENSE' && business && !amount) {
    requiresClarification = true;
    clarificationQuestion = `How much expense would you like to record for ${business}?`;
    return {
      intent,
      business,
      category,
      vehicle,
      requires_clarification: true,
      clarification_question: clarificationQuestion,
      direct_response: null,
    };
  }

  if (intent === 'RECORD_SALE' && business === BUSINESS_FUEL && !quantity) {
    requiresClarification = true;
    clarificationQuestion = `How many litres of ${fuelType || 'fuel'} were sold?`;
    return {
      intent,
      business,
      fuel_type: fuelType,
      requires_clarification: true,
      clarification_question: clarificationQuestion,
      direct_response: null,
    };
  }

  if (intent === 'RECORD_PURCHASE' && business === BUSINESS_FUEL && !quantity) {
    requiresClarification = true;
    clarificationQuestion = `How many litres of ${fuelType || 'fuel'} did you purchase?`;
    return {
      intent,
      business,
      fuel_type: fuelType,
      requires_clarification: true,
      clarification_question: clarificationQuestion,
      direct_response: null,
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
    direct_response: directResponse,
  };
};

/**
 * Call Gemini API using modern Google Generative AI models.
 * Automatically tries available models and falls back cleanly to the rule parser.
 */
export const interpretVoiceCommand = async (query, context = {}) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Circuit breaker: skip network calls if quota is currently exhausted
  if (Date.now() < geminiRateLimitUntil) {
    return parseNaturalLanguage(query, context);
  }

  if (geminiApiKey && geminiApiKey.trim() !== '') {
    const genAI = new GoogleGenerativeAI(geminiApiKey.trim());

    const systemPrompt = `You are the AI Assistant for the multi-business platform.
Businesses:
1. "AJ'S TRAVEL" (1 Bus: Bus 1, 3 Cars: Car 1, Car 2, Car 3. Passenger trips, Bookings, Drivers, Vehicle Fuel & Maintenance expenses).
2. "AJ'S MOBILE SHOP" (Mobile phones ONLY: Samsung, iPhone/Apple, OnePlus, Xiaomi. Purchases, Sales, Stock inventory).
3. "AJ'S FUEL STATION" (Petrol and Diesel ONLY. Stocks in litres, Purchases, Sales, Operating expenses).

Respond ONLY with valid JSON:
{
  "intent": "GREETING" | "HOW_ARE_YOU" | "CAPABILITIES" | "GENERAL_CONVERSATION" | "BUSINESS_INFORMATION" | "REVENUE_QUERY" | "EXPENSE_QUERY" | "INVENTORY_QUERY" | "LOW_STOCK_QUERY" | "VEHICLE_QUERY" | "RECORD_SALE" | "RECORD_EXPENSE" | "RECORD_PURCHASE" | "PRINT_INVOICES" | "PRINT_EXPENDITURE_REPORT" | "PRINT_SALES_REPORT" | "PRINT_PURCHASE_REPORT" | "PRINT_STOCK_REPORT" | "CLARIFICATION_REQUIRED" | "UNKNOWN_INTENT",
  "business": "AJ'S TRAVEL" | "AJ'S MOBILE SHOP" | "AJ'S FUEL STATION" | "ALL" | null,
  "amount": number | null,
  "quantity": number | null,
  "category": "maintenance" | "fuel" | "driver" | "electricity" | "operating" | null,
  "vehicle": string | null,
  "product": string | null,
  "fuel_type": "Petrol" | "Diesel" | null,
  "date_period": "today" | "yesterday" | "this_month" | "last_month" | "all" | null,
  "requires_clarification": boolean,
  "clarification_question": string | null,
  "direct_response": string | null
}
Rules:
- For greetings, intent="GREETING" and direct_response="Hello! Welcome to AI Assistant. How can I help you manage your businesses today?".
- If printing invoices without business (e.g. "Print the invoices"), set requires_clarification=true and clarification_question="Which business would you like to print invoices for: AJ'S TRAVEL, AJ'S MOBILE SHOP, or AJ'S FUEL STATION?".
- If printing expenditure (e.g. "Print this month's expenditure", "Print today's expenses", "Print all business expenditure"), intent="PRINT_EXPENDITURE_REPORT". If no business is specified or "all", set business="ALL".
- If printing sales (e.g. "Print AJ'S FUEL STATION sales report"), intent="PRINT_SALES_REPORT".
- If ambiguous business for expense recording, set requires_clarification=true and clarification_question="Which business should I record this expense for: AJ'S TRAVEL, AJ'S MOBILE SHOP or AJ'S FUEL STATION?".
- For database queries/actions, direct_response is null.`;

    // Try candidate models in order with timeout
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `Context: ${JSON.stringify(context)}\nUser Voice Query: "${query}"`;

        // 1800ms timeout guard
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 1800)
        );

        const geminiPromise = model.generateContent([systemPrompt, prompt]);
        const result = await Promise.race([geminiPromise, timeoutPromise]);
        const responseText = result.response.text();

        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed && parsed.intent) {
          parsed.intent = parsed.intent.toUpperCase();
          return parsed;
        }
      } catch (err) {
        // If 429 quota reached, activate 60s circuit-breaker immediately
        if (err.message && (err.message.includes('429') || err.message.includes('Quota exceeded') || err.message.includes('ResourceExhausted'))) {
          geminiRateLimitUntil = Date.now() + 60000;
          console.warn(`[Gemini Circuit-Breaker Activated for 60s]: ${err.message.substring(0, 100)}`);
          break; // Stop attempting other models, fallback immediately
        } else {
          console.warn(`Gemini attempt with model ${modelName} failed or timed out:`, err.message);
        }
      }
    }
  }

  // Graceful deterministic NLP rule engine fallback (< 1ms)
  return parseNaturalLanguage(query, context);
};
