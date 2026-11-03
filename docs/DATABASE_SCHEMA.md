# Database Schema Documentation

## PostgreSQL Relational Architecture with Prisma ORM

The application uses PostgreSQL with a relational schema enforcing multi-tenant isolation, data integrity, atomic database transactions, foreign-key relationships, and indexing.

---

### Entity Relationship Architecture

```
User (Owner)
  │
  ├──► Business (1:N)
  │      ├──► Vehicle (1:N)  ──► Trip (1:N) ──► Expense (1:N)
  │      │                   └──► Booking (1:N)
  │      │                   └──► Expense (1:N)
  │      ├──► Driver (1:N)   ──► Trip (1:N)
  │      │                   └──► Expense (1:N)
  │      ├──► Expense (1:N)
  │      ├──► MobileProduct (1:N) ──► MobilePurchase (1:N)
  │      │                        └──► MobileSale (1:N)
  │      └──► FuelInventory (1:N) ──► FuelPurchase (1:N)
  │                               └──► FuelSale (1:N)
  │
  ├──► VoiceConversation (1:N)
  └──► AuditLog (1:N)
```

---

### Table Definitions & Specifications

#### 1. `users`
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255) (Unique)
- `password`: VARCHAR(255) (bcrypt hashed)
- `name`: VARCHAR(255)
- `role`: VARCHAR(50) (Default: 'OWNER')
- `createdAt`: TIMESTAMP
- `updatedAt`: TIMESTAMP

#### 2. `businesses`
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key -> `users.id` ON DELETE CASCADE)
- `name`: VARCHAR(255) (Must be: `AJ'S TRAVEL`, `AJ'S MOBILE SHOP`, or `AJ'S FUEL STATION`)
- `type`: VARCHAR(50) (`TRAVEL`, `MOBILE`, `FUEL`)
- `currency`: VARCHAR(10) (Default: `INR`)
- `createdAt`: TIMESTAMP
- `updatedAt`: TIMESTAMP
- *Unique Constraint:* `[userId, name]`

#### 3. `vehicles`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `vehicleNumber`: VARCHAR(50) (Unique, e.g. `KA-01-TR-1001`)
- `name`: VARCHAR(100) (e.g. `Bus 1`, `Car 1`, `Car 2`, `Car 3`)
- `type`: VARCHAR(50) (`Bus` or `Car`)
- `status`: VARCHAR(50) (`Available`, `On Trip`, `Under Maintenance`)
- `driverId`: UUID? (Foreign Key -> `drivers.id` ON DELETE SET NULL)
- `lastServiceDate`: TIMESTAMP?
- `nextServiceDate`: TIMESTAMP?

#### 4. `drivers`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `name`: VARCHAR(150)
- `phone`: VARCHAR(50)
- `licenseNumber`: VARCHAR(100)
- `status`: VARCHAR(50) (`Active`, `On Leave`)

#### 5. `trips`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `vehicleId`: UUID (Foreign Key -> `vehicles.id` ON DELETE CASCADE)
- `driverId`: UUID? (Foreign Key -> `drivers.id` ON DELETE SET NULL)
- `origin`: VARCHAR(255)
- `destination`: VARCHAR(255)
- `startDate`: TIMESTAMP
- `endDate`: TIMESTAMP?
- `status`: VARCHAR(50) (`Scheduled`, `Ongoing`, `Completed`, `Cancelled`)
- `revenue`: DOUBLE PRECISION (Default: 0)
- `notes`: TEXT?

#### 6. `bookings`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `vehicleId`: UUID? (Foreign Key -> `vehicles.id` ON DELETE SET NULL)
- `customerName`: VARCHAR(150)
- `customerPhone`: VARCHAR(50)
- `pickupLocation`: VARCHAR(255)
- `dropLocation`: VARCHAR(255)
- `bookingDate`: TIMESTAMP
- `tripDate`: TIMESTAMP
- `fare`: DOUBLE PRECISION
- `status`: VARCHAR(50) (`Confirmed`, `Completed`, `Cancelled`)

#### 7. `expenses`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `category`: VARCHAR(50) (`maintenance`, `fuel`, `driver`, `electricity`, `wages`, `operating`, `other`)
- `amount`: DOUBLE PRECISION
- `description`: TEXT?
- `vehicleId`: UUID? (Foreign Key -> `vehicles.id` ON DELETE SET NULL)
- `driverId`: UUID? (Foreign Key -> `drivers.id` ON DELETE SET NULL)
- `tripId`: UUID? (Foreign Key -> `trips.id` ON DELETE SET NULL)
- `expenseDate`: TIMESTAMP

#### 8. `mobile_products`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `brand`: VARCHAR(100) (e.g. Samsung, Apple, OnePlus, Xiaomi)
- `model`: VARCHAR(150) (e.g. Galaxy S24, iPhone 16)
- `purchasePrice`: DOUBLE PRECISION
- `sellingPrice`: DOUBLE PRECISION
- `availableStock`: INTEGER (Must be >= 0)
- `minimumStock`: INTEGER (Threshold for low-stock alerts)
- `supplier`: VARCHAR(255)?
- `purchaseDate`: TIMESTAMP?
- *Unique Constraint:* `[businessId, brand, model]`

#### 9. `mobile_purchases`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `productId`: UUID (Foreign Key -> `mobile_products.id` ON DELETE CASCADE)
- `quantity`: INTEGER
- `unitPrice`: DOUBLE PRECISION
- `totalAmount`: DOUBLE PRECISION
- `supplier`: VARCHAR(255)?
- `purchaseDate`: TIMESTAMP

#### 10. `mobile_sales`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `productId`: UUID (Foreign Key -> `mobile_products.id` ON DELETE CASCADE)
- `quantity`: INTEGER
- `unitPrice`: DOUBLE PRECISION
- `totalAmount`: DOUBLE PRECISION
- `costPrice`: DOUBLE PRECISION (Recorded at time of sale)
- `grossProfit`: DOUBLE PRECISION (`(unitPrice - costPrice) * quantity`)
- `customerName`: VARCHAR(150)?
- `saleDate`: TIMESTAMP

#### 11. `fuel_inventory`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `fuelType`: VARCHAR(20) (Strictly `Petrol` or `Diesel` only)
- `currentStock`: DOUBLE PRECISION (Litres; must never be negative)
- `openingStock`: DOUBLE PRECISION (Litres)
- `purchasePricePerLitre`: DOUBLE PRECISION
- `sellingPricePerLitre`: DOUBLE PRECISION
- `updatedAt`: TIMESTAMP
- *Unique Constraint:* `[businessId, fuelType]`

#### 12. `fuel_purchases`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `fuelInventoryId`: UUID (Foreign Key -> `fuel_inventory.id` ON DELETE CASCADE)
- `fuelType`: VARCHAR(20) (`Petrol` or `Diesel`)
- `quantityLitres`: DOUBLE PRECISION
- `pricePerLitre`: DOUBLE PRECISION
- `totalAmount`: DOUBLE PRECISION
- `supplier`: VARCHAR(255)?
- `purchaseDate`: TIMESTAMP

#### 13. `fuel_sales`
- `id`: UUID (Primary Key)
- `businessId`: UUID (Foreign Key -> `businesses.id` ON DELETE CASCADE)
- `fuelInventoryId`: UUID (Foreign Key -> `fuel_inventory.id` ON DELETE CASCADE)
- `fuelType`: VARCHAR(20) (`Petrol` or `Diesel`)
- `quantityLitres`: DOUBLE PRECISION
- `pricePerLitre`: DOUBLE PRECISION
- `totalAmount`: DOUBLE PRECISION
- `costPricePerLitre`: DOUBLE PRECISION
- `grossProfit`: DOUBLE PRECISION (`quantityLitres * (pricePerLitre - costPricePerLitre)`)
- `saleDate`: TIMESTAMP

#### 14. `voice_conversations`
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key -> `users.id` ON DELETE CASCADE)
- `businessId`: UUID? (Foreign Key -> `businesses.id` ON DELETE SET NULL)
- `userQuery`: TEXT
- `detectedIntent`: VARCHAR(100)?
- `extractedEntities`: JSONB?
- `clarificationNeeded`: BOOLEAN (Default: false)
- `clarificationPrompt`: TEXT?
- `responseMessage`: TEXT
- `status`: VARCHAR(50) (`SUCCESS`, `CLARIFICATION_REQUESTED`, `ERROR`)
- `createdAt`: TIMESTAMP

#### 15. `audit_logs`
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key -> `users.id` ON DELETE CASCADE)
- `businessId`: UUID? (Foreign Key -> `businesses.id` ON DELETE SET NULL)
- `action`: VARCHAR(100)
- `entityType`: VARCHAR(100)
- `entityId`: VARCHAR(100)?
- `details`: JSONB?
- `timestamp`: TIMESTAMP
