# AI-Powered Multi-Business Voice Management Platform

A unified, real-time voice-driven business management system enabling a single owner to operate three diverse enterprises—**AJ'S TRAVEL**, **AJ'S MOBILE SHOP**, and **AJ'S FUEL STATION**—through natural speech commands, strict relational data isolation, atomic database transactions, and live financial reporting.

---

## 1. Official Business Configuration

The platform manages three independent businesses under one verified owner account:

### 1. AJ'S TRAVEL
- **Fleet Architecture:** Exactly 1 Bus (`Bus 1` / `KA-01-TR-1001`) and exactly 3 Cars (`Car 1`, `Car 2`, `Car 3`).
- **Vehicle Data:** Registration number, vehicle name, type (`Bus`, `Car`), assigned driver details, availability status (`Available`, `On Trip`, `Under Maintenance`), last and next service dates.
- **Operations:**
  - Schedule and manage trips with assigned vehicles and drivers.
  - Record customer bookings.
  - Track trip revenues.
  - Record vehicle fuel and maintenance expenses separately for the bus and each car.
  - Query real-time fleet availability by voice (e.g., *"Is my bus available?"*).

### 2. AJ'S MOBILE SHOP
- **Product Scope:** Strictly mobile handsets only (smartphones from Samsung, Apple, OnePlus, Xiaomi). Prohibits accessories, chargers, earphones, and cases.
- **Product Data:** Brand, model, purchase price, selling price, available stock, minimum threshold for low-stock alerts, supplier, purchase date.
- **Operations:**
  - Add mobile phone models with strict category validation.
  - Atomic mobile sales transactions (strictly verifies stock availability; never allows sales with insufficient stock).
  - Restock inventory through purchase records.
  - Track real-time gross profit per unit and across all sales.
  - Low-stock visual alerts and voice reporting.

### 3. AJ'S FUEL STATION
- **Fuel Types:** Strictly `Petrol` and `Diesel` only (no CNG, LPG, or EV charging).
- **Tank Management:** Tracks opening stock, bulk deliveries, metered sales, purchase price per litre, selling price per litre, closing stock in litres.
- **Operations:**
  - Record metered petrol and diesel dispenses (fuel volumes are transactionally guarded so tanks can never become negative).
  - Record bulk fuel deliveries to underground reserves.
  - Track station operating expenses (high-voltage pump electricity, maintenance, attendant wages).
  - Live tank level gauges and daily/monthly sales reports.

---

## 2. Central Voice Assistant

Voice is the primary interaction method for the platform:
1. **Speech-to-Text:** Browser Web Speech API (`SpeechRecognition`) converts spoken audio to text in real time.
2. **AI Intent & Entity Parsing:** Google Gemini API (`@google/generative-ai`) paired with a deterministic NLP parser extracts structured intent, business, numerical quantities, amounts, dates, and vehicle/product entities.
3. **Ambiguity Resolution:** Never guesses the target business. When an ambiguous command like *"Add 2000 rupees expense."* is spoken, the assistant asks:
   > *"Which business should I record this expense for: AJ'S TRAVEL, AJ'S MOBILE SHOP or AJ'S FUEL STATION?"*
4. **Context Retention (Multi-Turn):** Retains recent context. Asking *"Show today's mobile shop sales"* followed by *"What about yesterday?"* accurately evaluates yesterday's mobile sales.
5. **Backend Database Verification:** AI responses never touch the database directly. All operations pass through backend validation, business ownership verification, and atomic Prisma transactions.
6. **Confirmed Spoken Results:** Browser `speechSynthesis` speaks the confirmed backend result to the owner.
7. **Typed Input Fallback:** A text input box is always accessible when speech recognition is unsupported or muted.

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, JavaScript, Tailwind CSS, Axios, Lucide React icons.
- **Backend:** Node.js, Express.js, REST APIs.
- **Database & ORM:** PostgreSQL / Neon PostgreSQL, Prisma ORM.
- **AI Engine:** Google Gemini API (`@google/generative-ai`) + Robust NLP Parser Engine.
- **Speech Technologies:** Browser Web Speech API (STT) + Browser SpeechSynthesis API (TTS).
- **Authentication & Security:** JWT (JSON Web Tokens), bcryptjs password hashing, ownership middleware.
- **Testing:** Jest with Supertest executing all 34 required test cases against live database instances.

---

## 4. Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (Local or Neon Cloud PostgreSQL)

### Step 1: Clone and Install
```bash
git clone https://github.com/vocal-labs/multi-business-voice-platform.git
cd "c:\Vocal Labs"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vocal_labs_db?schema=public"
JWT_SECRET="vocal_labs_secure_jwt_secret_key_2026_super_safe"
GEMINI_API_KEY="" # Optional: Add Google Gemini API key
```
*(An `.env.example` file with placeholder values is provided in `backend/.env.example`)*

### Step 3: Initialize Database Schema & Seed Data
```bash
cd backend
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### Step 4: Run the Application
You can run both services together or separately:

**Option A (Unified Production Build):**
```bash
cd frontend
npm run build
cd ../backend
node src/server.js
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

**Option B (Vite Dev Server + Express API):**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 5. Demonstration Credentials

The database seeder pre-configures a demonstration owner account:
- **Email:** `owner@ajbusinesses.com`
- **Password:** `Password123!`
- **Role:** `OWNER`

*(The login screen also features an "Auto Fill" button for convenience).*

---

## 6. Automated Testing Suite (All 34 Cases)

The project includes an automated test runner validating all 34 required test cases:

```bash
cd backend
npm test
```

### Test Suite Execution Summary
```
================ OFFICIAL 34 TEST CASES REPORT ================
[PASS] Test TC01: Successful owner login with valid credentials
[PASS] Test TC02: Failed login with incorrect credentials rejected with 401
[PASS] Test TC03: Unauthorized API request without Bearer token is rejected
[PASS] Test TC04: Retrieval of all three official businesses for owner
[PASS] Test TC05: Strict business ownership and data separation
[PASS] Test TC06: AJ'S TRAVEL fleet contains exactly 1 Bus and 3 Cars
[PASS] Test TC07: Check availability of Bus in fleet
[PASS] Test TC08: Check availability of Car 1 in fleet
[PASS] Test TC09: Create 2000 rupees maintenance expense for Car 1 in travel fleet
[PASS] Test TC10: Record trip revenue of 12000 rupees
[PASS] Test TC11: Mobile product creation accepts phones and strictly rejects accessories
[PASS] Test TC12: Retrieve mobile phone stock list from inventory
[PASS] Test TC13: Record mobile sale, reduce stock atomically and calculate gross profit
[PASS] Test TC14: Reject sale when requested quantity exceeds available stock
[PASS] Test TC15: Update mobile phone stock by delta
[PASS] Test TC16: Retrieve current Petrol tank stock level
[PASS] Test TC17: Retrieve current Diesel tank stock level
[PASS] Test TC18: Record purchase of 500 litres of Petrol
[PASS] Test TC19: Record purchase of 1000 litres of Diesel
[PASS] Test TC20: Record sale of 100 litres of Diesel
[PASS] Test TC21: Prevent fuel stock from ever becoming negative
[PASS] Test TC22: Record 1000 rupees electricity expense for AJ'S FUEL STATION
[PASS] Test TC23: Generate daily revenue report for AJ'S FUEL STATION
[PASS] Test TC24: Generate monthly revenue report for AJ'S MOBILE SHOP
[PASS] Test TC25: Consolidated multi-business dashboard report combining all 3 businesses
[PASS] Test TC26: Voice Assistant prompts for clarification when business is not specified
[PASS] Test TC27: Voice Assistant asks for amount when missing from expense command
[PASS] Test TC28: Gracefully handle empty or malformed voice queries
[PASS] Test TC29: Typed-input fallback processes voice commands smoothly
[PASS] Test TC30: Database errors return structured JSON errors without raw stack dumps
[PASS] Test TC31: Retain conversational context across multi-turn follow-up queries
[PASS] Test TC32: Dashboard accurately reflects database changes immediately
[PASS] Test TC33: Enforce validation and safety boundaries for state-modifying actions
[PASS] Test TC34: Full regression check across AJ'S TRAVEL, AJ'S MOBILE SHOP, and AJ'S FUEL STATION
TOTAL EXECUTED: 34 | PASSED: 34 | FAILED: 0
===============================================================
```
Detailed input/output matrices are recorded in [docs/TEST_REPORT.md](file:///C:/Vocal%20Labs/docs/TEST_REPORT.md).

---

## 7. Cloud Deployment Guide

### Database (Neon PostgreSQL)
1. Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech).
2. Copy the connection string and configure `DATABASE_URL` in your environment.
3. Run migrations and seed: `npx prisma db push && node prisma/seed.js`.

### Backend (Render / Railway)
1. Deploy the `backend/` directory as a Node.js web service on [Render](https://render.com).
2. Build command: `npm install && npx prisma generate`.
3. Start command: `node src/server.js`.
4. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`.

### Frontend (Vercel)
1. Deploy `frontend/` on [Vercel](https://vercel.com).
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.

---

## 8. Known Limitations

1. **Browser Speech Recognition Permissions:** Speech recognition requires microphone permissions in Chromium browsers (Chrome, Edge) or Safari. In non-supporting browsers or when permissions are denied, the system seamlessly transitions to typed input without failing.
2. **Synthetic Voices:** Text-to-speech voice quality depends on the operating system's installed speech synthesis voices.
3. **Direct Hardware Integrations:** The platform simulates real metered fuel transactions and GPS fleet management through manual/voice inputs; it intentionally does not integrate physical fuel tank telemetry sensors or OBD-II vehicle tracking hardware without dedicated physical devices.
