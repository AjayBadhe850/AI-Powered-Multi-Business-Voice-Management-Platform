import prisma from '../config/db.js';

const getDateFilter = (timeframe) => {
  const now = new Date();
  if (timeframe === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { gte: start, lte: end };
  } else if (timeframe === 'yesterday') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { gte: start, lte: end };
  } else if (timeframe === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    return { gte: start };
  } else if (timeframe === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { gte: start, lte: end };
  }
  return undefined;
};

const formatCurrency = (amt) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amt || 0);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Generate a printable HTML document with embedded styles for browser print dialog
 */
const buildPrintableDocument = ({ title, subtitle, businessName, metaInfo, tables, summaryBox }) => {
  const nowStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${businessName}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .business-subtitle {
      font-size: 14px;
      font-weight: 600;
      color: #0284c7;
      margin: 3px 0 0 0;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .meta-box strong {
      color: #334155;
    }
    .report-title-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .report-heading {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .report-sub {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }
    .summary-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .summary-card {
      flex: 1;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    .summary-card.highlight {
      background: #e0f2fe;
      border-color: #38bdf8;
    }
    .summary-card-title {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .summary-card-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    th {
      background-color: #f8fafc;
      color: #334155;
      font-weight: 600;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
      border-top: 1px solid #e2e8f0;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background-color: #fcfdfe;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .font-semibold {
      font-weight: 600;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">Multi-Business Management Platform</h1>
      <div class="business-subtitle">${businessName}</div>
    </div>
    <div class="meta-box">
      <div><strong>Generated:</strong> ${nowStr} (IST)</div>
      <div><strong>Official Document:</strong> Verified Database Records</div>
    </div>
  </div>

  <div class="report-title-bar">
    <div>
      <h2 class="report-heading">${title}</h2>
      <p class="report-sub">${subtitle}</p>
    </div>
  </div>

  ${summaryBox || ''}

  ${tables}

  <div class="footer">
    <div>System Generated Report • Confidential & Official</div>
    <div>Page 1 of 1</div>
  </div>
</body>
</html>
`;
};

/**
 * 1. Generate Invoices Report for a given business
 */
export const generateInvoicesReport = async (userId, businessType, timeframe = 'all') => {
  const dateFilter = getDateFilter(timeframe);

  // Identify business
  const business = await prisma.business.findFirst({
    where: { userId, type: businessType },
  });

  if (!business) {
    throw new Error(`Business of type ${businessType} not found for this account`);
  }

  const periodLabel = timeframe === 'today' ? 'Today' : timeframe === 'yesterday' ? 'Yesterday' : timeframe === 'this_month' ? 'This Month' : timeframe === 'last_month' ? 'Last Month' : 'All Time';

  // --- AJ'S TRAVEL INVOICES ---
  if (business.type === 'TRAVEL') {
    const bookingWhere = { businessId: business.id };
    if (dateFilter) bookingWhere.tripDate = dateFilter;

    const tripWhere = { businessId: business.id };
    if (dateFilter) tripWhere.startDate = dateFilter;

    const [bookings, trips] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        include: { vehicle: true },
        orderBy: { tripDate: 'desc' },
      }),
      prisma.trip.findMany({
        where: tripWhere,
        include: { vehicle: true, driver: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const totalBookingRevenue = bookings.reduce((sum, b) => sum + (b.fare || 0), 0);
    const totalTripRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
    const grandTotal = totalBookingRevenue + totalTripRevenue;

    const bookingRows = bookings.map((b, idx) => `
      <tr>
        <td class="font-mono">INV-TRV-${1000 + idx + 1}</td>
        <td>${formatDate(b.tripDate)}</td>
        <td class="font-semibold">${b.customerName}</td>
        <td>${b.vehicle ? `${b.vehicle.name} (${b.vehicle.vehicleNumber})` : 'Fleet Vehicle'}</td>
        <td>${b.pickupLocation} &rarr; ${b.dropLocation}</td>
        <td><span style="color:#059669; font-weight:600;">${b.status}</span></td>
        <td class="text-right font-semibold">${formatCurrency(b.fare)}</td>
      </tr>
    `).join('');

    const tripRows = trips.map((t, idx) => `
      <tr>
        <td class="font-mono">TRP-REV-${2000 + idx + 1}</td>
        <td>${formatDate(t.startDate)}</td>
        <td class="font-semibold">Trip Client</td>
        <td>${t.vehicle ? `${t.vehicle.name} (${t.vehicle.vehicleNumber})` : 'Assigned Fleet'}</td>
        <td>${t.origin} &rarr; ${t.destination}</td>
        <td><span style="color:#0284c7; font-weight:600;">${t.status}</span></td>
        <td class="text-right font-semibold">${formatCurrency(t.revenue)}</td>
      </tr>
    `).join('');

    const tables = `
      <h3 style="font-size:13px; margin: 10px 0 6px 0; color:#334155;">Customer Booking Invoices</h3>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Assigned Vehicle</th>
            <th>Route</th>
            <th>Status</th>
            <th class="text-right">Fare Amount</th>
          </tr>
        </thead>
        <tbody>
          ${bookingRows || '<tr><td colspan="7" class="text-center" style="color:#94a3b8;">No customer bookings recorded for this period.</td></tr>'}
        </tbody>
      </table>

      <h3 style="font-size:13px; margin: 16px 0 6px 0; color:#334155;">Fleet Passenger Trip Revenues</h3>
      <table>
        <thead>
          <tr>
            <th>Trip Receipt #</th>
            <th>Date</th>
            <th>Type</th>
            <th>Vehicle</th>
            <th>Route</th>
            <th>Status</th>
            <th class="text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${tripRows || '<tr><td colspan="7" class="text-center" style="color:#94a3b8;">No trip revenue recorded for this period.</td></tr>'}
        </tbody>
      </table>
    `;

    const summaryBox = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-title">Total Bookings</div>
          <div class="summary-card-value">${bookings.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Completed Trips</div>
          <div class="summary-card-value">${trips.length}</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-card-title">Grand Total Invoiced</div>
          <div class="summary-card-value" style="color:#0284c7;">${formatCurrency(grandTotal)}</div>
        </div>
      </div>
    `;

    const html = buildPrintableDocument({
      title: "AJ'S TRAVEL - Invoices & Trip Statements",
      subtitle: `Official Statement for ${periodLabel} • 1 Bus, 3 Cars Fleet`,
      businessName: "AJ'S TRAVEL",
      tables,
      summaryBox,
    });

    return {
      title: "AJ'S TRAVEL Invoices",
      businessName: "AJ'S TRAVEL",
      timeframe,
      totalAmount: grandTotal,
      formattedTotal: formatCurrency(grandTotal),
      itemCount: bookings.length + trips.length,
      html,
    };
  }

  // --- AJ'S MOBILE SHOP INVOICES ---
  if (business.type === 'MOBILE') {
    const saleWhere = { businessId: business.id };
    if (dateFilter) saleWhere.saleDate = dateFilter;

    const sales = await prisma.mobileSale.findMany({
      where: saleWhere,
      include: { product: true },
      orderBy: { saleDate: 'desc' },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
    const totalQuantity = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const saleRows = sales.map((s, idx) => `
      <tr>
        <td class="font-mono">INV-MOB-${1000 + idx + 1}</td>
        <td>${formatDate(s.saleDate)}</td>
        <td class="font-semibold">${s.customerName || 'Retail Customer'}</td>
        <td>${s.product ? `${s.product.brand} ${s.product.model}` : 'Mobile Phone'}</td>
        <td class="text-center">${s.quantity}</td>
        <td class="text-right">${formatCurrency(s.unitPrice)}</td>
        <td class="text-right font-semibold">${formatCurrency(s.totalAmount)}</td>
      </tr>
    `).join('');

    const tables = `
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Mobile Phone Model</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${saleRows || '<tr><td colspan="7" class="text-center" style="color:#94a3b8;">No mobile sales recorded for this period.</td></tr>'}
        </tbody>
      </table>
    `;

    const summaryBox = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-title">Invoices Issued</div>
          <div class="summary-card-value">${sales.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Phones Sold</div>
          <div class="summary-card-value">${totalQuantity} units</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Gross Profit</div>
          <div class="summary-card-value" style="color:#059669;">${formatCurrency(totalProfit)}</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-card-title">Total Invoiced</div>
          <div class="summary-card-value" style="color:#0284c7;">${formatCurrency(totalRevenue)}</div>
        </div>
      </div>
    `;

    const html = buildPrintableDocument({
      title: "AJ'S MOBILE SHOP - Tax Invoices",
      subtitle: `Official Mobile Phone Sales Statement for ${periodLabel}`,
      businessName: "AJ'S MOBILE SHOP",
      tables,
      summaryBox,
    });

    return {
      title: "AJ'S MOBILE SHOP Invoices",
      businessName: "AJ'S MOBILE SHOP",
      timeframe,
      totalAmount: totalRevenue,
      formattedTotal: formatCurrency(totalRevenue),
      itemCount: sales.length,
      html,
    };
  }

  // --- AJ'S FUEL STATION INVOICES / RECEIPTS ---
  if (business.type === 'FUEL') {
    const saleWhere = { businessId: business.id };
    if (dateFilter) saleWhere.saleDate = dateFilter;

    const sales = await prisma.fuelSale.findMany({
      where: saleWhere,
      orderBy: { saleDate: 'desc' },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalLitres = sales.reduce((sum, s) => sum + (s.quantityLitres || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);

    const saleRows = sales.map((s, idx) => `
      <tr>
        <td class="font-mono">RCP-FUEL-${1000 + idx + 1}</td>
        <td>${formatDate(s.saleDate)}</td>
        <td class="font-semibold">${s.fuelType}</td>
        <td class="text-right">${s.quantityLitres.toFixed(2)} L</td>
        <td class="text-right">${formatCurrency(s.pricePerLitre)}</td>
        <td class="text-right font-semibold">${formatCurrency(s.totalAmount)}</td>
      </tr>
    `).join('');

    const tables = `
      <table>
        <thead>
          <tr>
            <th>Receipt #</th>
            <th>Date</th>
            <th>Fuel Type</th>
            <th class="text-right">Volume (Litres)</th>
            <th class="text-right">Rate / Litre</th>
            <th class="text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${saleRows || '<tr><td colspan="6" class="text-center" style="color:#94a3b8;">No fuel sales recorded for this period.</td></tr>'}
        </tbody>
      </table>
    `;

    const summaryBox = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-title">Total Receipts</div>
          <div class="summary-card-value">${sales.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Dispensed Volume</div>
          <div class="summary-card-value">${totalLitres.toFixed(1)} L</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Gross Profit</div>
          <div class="summary-card-value" style="color:#059669;">${formatCurrency(totalProfit)}</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-card-title">Total Fuel Sales</div>
          <div class="summary-card-value" style="color:#0284c7;">${formatCurrency(totalRevenue)}</div>
        </div>
      </div>
    `;

    const html = buildPrintableDocument({
      title: "AJ'S FUEL STATION - Sales Receipts",
      subtitle: `Dispensing & Sales Statement for ${periodLabel} • Petrol & Diesel Only`,
      businessName: "AJ'S FUEL STATION",
      tables,
      summaryBox,
    });

    return {
      title: "AJ'S FUEL STATION Receipts",
      businessName: "AJ'S FUEL STATION",
      timeframe,
      totalAmount: totalRevenue,
      formattedTotal: formatCurrency(totalRevenue),
      itemCount: sales.length,
      html,
    };
  }
};

/**
 * 2. Generate Expenditure Report (Consolidated for all businesses or single business)
 */
export const generateExpenditureReport = async (userId, targetBusinessNameOrType = 'ALL', timeframe = 'this_month') => {
  const dateFilter = getDateFilter(timeframe);
  const businesses = await prisma.business.findMany({ where: { userId } });

  let targetBusinesses = businesses;
  let isConsolidated = true;

  if (targetBusinessNameOrType && targetBusinessNameOrType !== 'ALL') {
    const single = businesses.find(
      (b) => b.type.toLowerCase() === targetBusinessNameOrType.toLowerCase() ||
             b.name.toLowerCase() === targetBusinessNameOrType.toLowerCase()
    );
    if (single) {
      targetBusinesses = [single];
      isConsolidated = false;
    }
  }

  const expWhere = {
    businessId: { in: targetBusinesses.map((b) => b.id) },
    ...(dateFilter ? { expenseDate: dateFilter } : {}),
  };

  const expenses = await prisma.expense.findMany({
    where: expWhere,
    include: { business: true, vehicle: true, driver: true },
    orderBy: { expenseDate: 'desc' },
  });

  const totalExpenditure = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const periodLabel = timeframe === 'today' ? 'Today' : timeframe === 'yesterday' ? 'Yesterday' : timeframe === 'this_month' ? 'This Month' : timeframe === 'last_month' ? 'Last Month' : 'All Time';

  // Category summary
  const categoryTotals = {};
  expenses.forEach((e) => {
    const cat = e.category || 'operating';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  const expenseRows = expenses.map((e, idx) => `
    <tr>
      <td class="font-mono">EXP-${1000 + idx + 1}</td>
      <td>${formatDate(e.expenseDate)}</td>
      <td class="font-semibold">${e.business?.name || 'Business'}</td>
      <td><span style="text-transform: capitalize; background:#f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight:600;">${e.category}</span></td>
      <td>${e.vehicle ? `${e.vehicle.name} (${e.vehicle.vehicleNumber})` : (e.driver?.name || '-')}</td>
      <td>${e.description || 'Verified business expenditure'}</td>
      <td class="text-right font-semibold">${formatCurrency(e.amount)}</td>
    </tr>
  `).join('');

  const catRows = Object.entries(categoryTotals).map(([cat, amt]) => `
    <tr>
      <td style="text-transform: capitalize; font-weight:600;">${cat}</td>
      <td class="text-right font-semibold">${formatCurrency(amt)}</td>
      <td class="text-right">${totalExpenditure > 0 ? ((amt / totalExpenditure) * 100).toFixed(1) : '0'}%</td>
    </tr>
  `).join('');

  const tables = `
    <h3 style="font-size:13px; margin: 10px 0 6px 0; color:#334155;">Detailed Expenses Log</h3>
    <table>
      <thead>
        <tr>
          <th>Ref #</th>
          <th>Date</th>
          <th>Business</th>
          <th>Category</th>
          <th>Vehicle / Target</th>
          <th>Description</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${expenseRows || '<tr><td colspan="7" class="text-center" style="color:#94a3b8;">No expenses recorded for this period.</td></tr>'}
      </tbody>
    </table>

    <h3 style="font-size:13px; margin: 16px 0 6px 0; color:#334155;">Category Breakdown Summary</h3>
    <table style="width: 50%;">
      <thead>
        <tr>
          <th>Category</th>
          <th class="text-right">Total</th>
          <th class="text-right">Share</th>
        </tr>
      </thead>
      <tbody>
        ${catRows || '<tr><td colspan="3" class="text-center" style="color:#94a3b8;">No category breakdown available.</td></tr>'}
      </tbody>
    </table>
  `;

  const summaryBox = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card-title">Expense Transactions</div>
        <div class="summary-card-value">${expenses.length}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Categories Active</div>
        <div class="summary-card-value">${Object.keys(categoryTotals).length}</div>
      </div>
      <div class="summary-card highlight">
        <div class="summary-card-title">Total Expenditure</div>
        <div class="summary-card-value" style="color:#dc2626;">${formatCurrency(totalExpenditure)}</div>
      </div>
    </div>
  `;

  const reportBizName = isConsolidated ? "All 3 Businesses (Consolidated)" : targetBusinesses[0]?.name;

  const html = buildPrintableDocument({
    title: isConsolidated ? "Consolidated Business Expenditure Report" : `${reportBizName} - Expenditure Report`,
    subtitle: `Verified Statement for ${periodLabel} • Covering Operational, Maintenance & Fuel Expenses`,
    businessName: reportBizName,
    tables,
    summaryBox,
  });

  return {
    title: isConsolidated ? "Consolidated Expenditure Report" : `${reportBizName} Expenditure Report`,
    businessName: reportBizName,
    timeframe,
    totalAmount: totalExpenditure,
    formattedTotal: formatCurrency(totalExpenditure),
    itemCount: expenses.length,
    html,
  };
};

/**
 * 3. Generate Sales Report for a given business
 */
export const generateSalesReport = async (userId, targetBusinessNameOrType = 'ALL', timeframe = 'this_month') => {
  const dateFilter = getDateFilter(timeframe);
  const businesses = await prisma.business.findMany({ where: { userId } });

  const targetBiz = businesses.find(
    (b) => b.type.toLowerCase() === targetBusinessNameOrType.toLowerCase() ||
           b.name.toLowerCase() === targetBusinessNameOrType.toLowerCase()
  );

  // If Fuel Station
  if (targetBiz?.type === 'FUEL') {
    return await generateInvoicesReport(userId, 'FUEL', timeframe);
  }

  // If Mobile Shop
  if (targetBiz?.type === 'MOBILE') {
    return await generateInvoicesReport(userId, 'MOBILE', timeframe);
  }

  // If Travel
  if (targetBiz?.type === 'TRAVEL') {
    return await generateInvoicesReport(userId, 'TRAVEL', timeframe);
  }

  // Default to Mobile Shop or Fuel Station if requested generically
  return await generateInvoicesReport(userId, 'FUEL', timeframe);
};

/**
 * 4. Generate Stock / Inventory Report
 */
export const generateStockReport = async (userId, businessType) => {
  const business = await prisma.business.findFirst({
    where: { userId, type: businessType },
  });

  if (!business) {
    throw new Error(`Business of type ${businessType} not found`);
  }

  if (business.type === 'MOBILE') {
    const products = await prisma.mobileProduct.findMany({
      where: { businessId: business.id },
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    });

    const totalStock = products.reduce((sum, p) => sum + p.availableStock, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.availableStock * p.purchasePrice), 0);

    const rows = products.map((p, idx) => `
      <tr>
        <td class="font-mono">PRD-${1000 + idx + 1}</td>
        <td class="font-semibold">${p.brand}</td>
        <td>${p.model}</td>
        <td class="text-right">${formatCurrency(p.purchasePrice)}</td>
        <td class="text-right">${formatCurrency(p.sellingPrice)}</td>
        <td class="text-center font-semibold" style="${p.availableStock <= p.minimumStock ? 'color:#dc2626;' : 'color:#059669;'}">${p.availableStock}</td>
        <td class="text-center">${p.minimumStock}</td>
        <td class="text-right font-semibold">${formatCurrency(p.availableStock * p.purchasePrice)}</td>
      </tr>
    `).join('');

    const tables = `
      <table>
        <thead>
          <tr>
            <th>Item #</th>
            <th>Brand</th>
            <th>Model</th>
            <th class="text-right">Cost Price</th>
            <th class="text-right">Selling Price</th>
            <th class="text-center">Stock</th>
            <th class="text-center">Min Alert</th>
            <th class="text-right">Stock Value</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="8" class="text-center" style="color:#94a3b8;">No mobile inventory recorded.</td></tr>'}
        </tbody>
      </table>
    `;

    const summaryBox = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-title">Phone Models</div>
          <div class="summary-card-value">${products.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Units in Stock</div>
          <div class="summary-card-value">${totalStock}</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-card-title">Total Inventory Valuation</div>
          <div class="summary-card-value" style="color:#0284c7;">${formatCurrency(totalInventoryValue)}</div>
        </div>
      </div>
    `;

    const html = buildPrintableDocument({
      title: "AJ'S MOBILE SHOP - Stock Inventory Statement",
      subtitle: "Current Phone Stock Valuation & Inventory Audit",
      businessName: "AJ'S MOBILE SHOP",
      tables,
      summaryBox,
    });

    return {
      title: "AJ'S MOBILE SHOP Stock Report",
      businessName: "AJ'S MOBILE SHOP",
      totalAmount: totalInventoryValue,
      formattedTotal: formatCurrency(totalInventoryValue),
      itemCount: products.length,
      html,
    };
  }

  if (business.type === 'FUEL') {
    const inventories = await prisma.fuelInventory.findMany({
      where: { businessId: business.id },
      orderBy: { fuelType: 'asc' },
    });

    const rows = inventories.map((inv) => `
      <tr>
        <td class="font-semibold">${inv.fuelType}</td>
        <td class="text-right font-mono font-semibold" style="font-size:14px;">${inv.currentStock.toFixed(2)} L</td>
        <td class="text-right">${formatCurrency(inv.purchasePricePerLitre)}</td>
        <td class="text-right">${formatCurrency(inv.sellingPricePerLitre)}</td>
        <td class="text-right font-semibold">${formatCurrency(inv.currentStock * inv.purchasePricePerLitre)}</td>
      </tr>
    `).join('');

    const tables = `
      <table>
        <thead>
          <tr>
            <th>Fuel Tank</th>
            <th class="text-right">Current Stock (Litres)</th>
            <th class="text-right">Purchase Price / L</th>
            <th class="text-right">Selling Price / L</th>
            <th class="text-right">Stock Valuation</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    const totalValuation = inventories.reduce((sum, i) => sum + (i.currentStock * i.purchasePricePerLitre), 0);

    const summaryBox = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-title">Tanks Monitored</div>
          <div class="summary-card-value">${inventories.length} (Petrol & Diesel)</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-card-title">Fuel Stock Valuation</div>
          <div class="summary-card-value" style="color:#0284c7;">${formatCurrency(totalValuation)}</div>
        </div>
      </div>
    `;

    const html = buildPrintableDocument({
      title: "AJ'S FUEL STATION - Tank Inventory Statement",
      subtitle: "Current Petrol & Diesel Stock Reserves in Litres",
      businessName: "AJ'S FUEL STATION",
      tables,
      summaryBox,
    });

    return {
      title: "AJ'S FUEL STATION Stock Report",
      businessName: "AJ'S FUEL STATION",
      totalAmount: totalValuation,
      formattedTotal: formatCurrency(totalValuation),
      itemCount: inventories.length,
      html,
    };
  }
};

