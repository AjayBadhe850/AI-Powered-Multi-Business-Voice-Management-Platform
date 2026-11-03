# REST API Documentation

## AI-Powered Multi-Business Voice Management Platform

Base URL: `http://localhost:5000/api`

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

### 1. Authentication APIs

#### `POST /auth/login`
Authenticates the business owner.
- **Request Body:**
  ```json
  {
    "email": "owner@ajbusinesses.com",
    "password": "Password123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "uuid",
        "email": "owner@ajbusinesses.com",
        "name": "AJ (Owner)",
        "role": "OWNER",
        "businesses": [...]
      }
    }
  }
  ```

#### `GET /auth/me`
Retrieves currently logged-in user profile with business details.

---

### 2. Business Management APIs

#### `GET /businesses`
Returns all 3 businesses owned by the authenticated owner.

#### `GET /businesses/:businessId`
Returns detailed metadata for a single authorized business.

---

### 3. Voice Assistant APIs

#### `POST /voice/process`
Primary AI voice command processing endpoint.
- **Request Body:**
  ```json
  {
    "query": "Is my bus available?"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Voice query processed successfully",
    "data": {
      "query": "Is my bus available?",
      "intent": "check_availability",
      "business": "AJ'S TRAVEL",
      "requiresClarification": false,
      "spokenResponse": "Your bus (Bus 1, Reg: KA-01-TR-1001) is currently Available.",
      "displayMessage": "Your bus (Bus 1, Reg: KA-01-TR-1001) is currently Available."
    }
  }
  ```

#### `GET /voice/history`
Returns voice conversation audit history.

---

### 4. AJ'S TRAVEL APIs

#### `GET /travel/:businessId/vehicles`
Lists the official fleet (1 Bus and 3 Cars).

#### `GET /travel/:businessId/availability?query=bus|car 1|car 2|car 3`
Queries fleet availability.

#### `GET /travel/:businessId/trips`
Retrieves trip history with revenues.

#### `POST /travel/:businessId/trips`
Schedules a new trip.
- **Request Body:**
  ```json
  {
    "vehicleId": "uuid",
    "origin": "Bengaluru",
    "destination": "Mysuru",
    "revenue": 15000,
    "notes": "Corporate tour"
  }
  ```

#### `POST /travel/:businessId/revenue`
Directly records trip revenue.

#### `GET /travel/:businessId/bookings`
Returns customer bookings.

#### `POST /travel/:businessId/bookings`
Creates a customer booking.

#### `POST /travel/:businessId/expenses`
Records maintenance, fuel, or driver allowance for a specific vehicle.

---

### 5. AJ'S MOBILE SHOP APIs

#### `GET /mobile/:businessId/products?search=Samsung`
Lists mobile handsets (filtered by brand/model).

#### `POST /mobile/:businessId/products`
Adds a new mobile phone (strictly rejects accessories).

#### `POST /mobile/:businessId/sales`
Records phone sale with atomic stock deduction and gross margin calculation.
- **Request Body:**
  ```json
  {
    "productId": "uuid",
    "quantity": 1,
    "unitPrice": 74999,
    "customerName": "Customer Name"
  }
  ```

#### `POST /mobile/:businessId/purchases`
Restocks inventory from supplier.

#### `PATCH /mobile/:businessId/products/:productId/stock`
Adjusts stock quantity delta.

#### `GET /mobile/:businessId/low-stock`
Returns all phones where stock <= minimumStock.

---

### 6. AJ'S FUEL STATION APIs

#### `GET /fuel/:businessId/inventory`
Returns stock, purchase rate, and selling rate for Petrol and Diesel.

#### `GET /fuel/:businessId/stock?fuelType=Petrol|Diesel`
Returns live volume in litres for specified fuel type.

#### `POST /fuel/:businessId/sales`
Records metered fuel dispensed, prevents negative volume, and logs gross profit.
- **Request Body:**
  ```json
  {
    "fuelType": "Diesel",
    "quantityLitres": 100,
    "pricePerLitre": 89.90
  }
  ```

#### `POST /fuel/:businessId/purchases`
Records bulk fuel delivery into tanks.

---

### 7. Consolidated Reports & Expenses APIs

#### `GET /reports/dashboard?timeframe=today|yesterday|this_month|all`
Returns combined financial metrics, individual performance breakdowns, and recent transactions.

#### `GET /reports/:businessId?timeframe=today|yesterday|this_month|all`
Returns isolated financial report for a specific business.

#### `GET /expenses/:businessId`
Returns business expenses.

#### `POST /expenses/:businessId`
Records business expense.
