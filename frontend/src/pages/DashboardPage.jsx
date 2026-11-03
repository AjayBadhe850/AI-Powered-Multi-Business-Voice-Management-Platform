import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import {
  TrendingUp,
  CreditCard,
  PieChart,
  Bus,
  Smartphone,
  Fuel,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export default function DashboardPage({ onOpenVoiceModal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async (period = timeframe) => {
    try {
      setRefreshing(true);
      const res = await api.get(`/reports/dashboard?timeframe=${period}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(timeframe);

    // Event listener for voice operations update
    const handleDataUpdate = () => {
      fetchDashboardData(timeframe);
    };
    window.addEventListener('business-data-updated', handleDataUpdate);
    return () => window.removeEventListener('business-data-updated', handleDataUpdate);
  }, [timeframe]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading Consolidated Dashboard...</span>
        </div>
      </div>
    );
  }

  const { summary, businesses, recentTransactions } = data || {
    summary: { totalRevenue: 0, totalExpenses: 0, totalGrossProfit: 0, estimatedNetProfit: 0 },
    businesses: {},
    recentTransactions: {},
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Owner Dashboard</h1>
          <p className="text-sm text-slate-500">
            Consolidated overview for AJ'S TRAVEL, AJ'S MOBILE SHOP and AJ'S FUEL STATION
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Timeframe Selector */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold text-slate-700">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === t.id ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboardData(timeframe)}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Combined Revenue"
          value={`₹${(summary.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="All recorded sales & trips"
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Combined Expenses"
          value={`₹${(summary.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Operating, fuel & maintenance"
          icon={CreditCard}
          color="rose"
        />
        <MetricCard
          title="Gross Margin"
          value={`₹${(summary.totalGrossProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Sales revenue minus unit cost"
          icon={PieChart}
          color="indigo"
        />
        <MetricCard
          title="Estimated Net Profit"
          value={`₹${(summary.estimatedNetProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Total revenue minus all expenses"
          icon={Sparkles}
          color={summary.estimatedNetProfit >= 0 ? 'emerald' : 'rose'}
          badge={summary.estimatedNetProfit >= 0 ? 'Profitable' : 'Deficit'}
        />
      </div>

      {/* Individual Business Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business 1: AJ'S TRAVEL */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">AJ'S TRAVEL</h3>
                  <span className="text-xs text-slate-500">Fleet & Passenger Logistics</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/travel')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Revenue</span>
                <span className="text-lg font-bold text-slate-900">
                  ₹{(businesses.travel?.revenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Expenses</span>
                <span className="text-lg font-bold text-rose-600">
                  ₹{(businesses.travel?.expenses || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Fleet Status */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Fleet Availability</span>
                <span className="text-sky-700 font-bold">
                  {businesses.travel?.fleetStatus?.available || 0} / {businesses.travel?.fleetStatus?.total || 4} Available
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Bus 1 (KA-01-TR-1001)</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    businesses.travel?.fleetStatus?.busAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {businesses.travel?.fleetStatus?.busAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cars (3 Units)</span>
                  <span className="font-semibold text-slate-700">
                    {businesses.travel?.fleetStatus?.carsAvailable || 0} of 3 Available
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{businesses.travel?.tripsCount || 0} Total Trips</span>
            <span>{businesses.travel?.bookingsCount || 0} Bookings</span>
          </div>
        </div>

        {/* Business 2: AJ'S MOBILE SHOP */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">AJ'S MOBILE SHOP</h3>
                  <span className="text-xs text-slate-500">Smartphones & Handsets Only</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/mobile-shop')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Sales Revenue</span>
                <span className="text-lg font-bold text-slate-900">
                  ₹{(businesses.mobile?.revenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Gross Profit</span>
                <span className="text-lg font-bold text-emerald-600">
                  ₹{(businesses.mobile?.grossProfit || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Low Stock Alert Section */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Inventory Status</span>
                {businesses.mobile?.lowStockAlertsCount > 0 ? (
                  <span className="text-rose-600 flex items-center space-x-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{businesses.mobile?.lowStockAlertsCount} Low Stock</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center space-x-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Healthy Stock</span>
                  </span>
                )}
              </div>
              {businesses.mobile?.lowStockProducts?.length > 0 ? (
                <div className="space-y-1 pt-1">
                  {businesses.mobile.lowStockProducts.map((p) => (
                    <div key={p.id} className="text-xs flex justify-between items-center text-slate-600">
                      <span className="truncate">{p.brand} {p.model}</span>
                      <span className="font-semibold text-rose-600">{p.availableStock} left (Min: {p.minimumStock})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 pt-1">All mobile phones sufficiently stocked.</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{businesses.mobile?.salesCount || 0} Recorded Sales</span>
            <span>Mobile Phones Only</span>
          </div>
        </div>

        {/* Business 3: AJ'S FUEL STATION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">AJ'S FUEL STATION</h3>
                  <span className="text-xs text-slate-500">Petrol & Diesel Retail Only</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/fuel-station')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Fuel Revenue</span>
                <span className="text-lg font-bold text-slate-900">
                  ₹{(businesses.fuel?.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Gross Profit</span>
                <span className="text-lg font-bold text-emerald-600">
                  ₹{(businesses.fuel?.grossProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </span>
              </div>
            </div>

            {/* Live Tank Stock Levels */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Tank Reserves</span>
                <span className="text-slate-500 font-normal">Litres Remaining</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800">Petrol</span>
                    <span className="font-bold text-sky-700">
                      {(businesses.fuel?.stocks?.petrolLitres || 0).toLocaleString()} L
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((businesses.fuel?.stocks?.petrolLitres || 0) / 10000) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800">Diesel</span>
                    <span className="font-bold text-amber-700">
                      {(businesses.fuel?.stocks?.dieselLitres || 0).toLocaleString()} L
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((businesses.fuel?.stocks?.dieselLitres || 0) / 15000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{businesses.fuel?.salesCount || 0} Dispense Operations</span>
            <span>Petrol & Diesel Only</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Across All Businesses */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Confirmed Business Transactions</h3>
          </div>
          <span className="text-xs text-slate-400">Live database records</span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.mobileSales?.slice(0, 3).map((sale) => (
            <div key={sale.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  AJ'S MOBILE SHOP
                </span>
                <span className="font-medium text-slate-900">
                  Sold {sale.quantity}x {sale.product?.brand} {sale.product?.model}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-600 block">
                  +₹{sale.totalAmount?.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(sale.saleDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {recentTransactions.fuelSales?.slice(0, 3).map((sale) => (
            <div key={sale.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  AJ'S FUEL STATION
                </span>
                <span className="font-medium text-slate-900">
                  Sold {sale.quantityLitres}L of {sale.fuelType}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-600 block">
                  +₹{sale.totalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(sale.saleDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {recentTransactions.trips?.slice(0, 2).map((trip) => (
            <div key={trip.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                  AJ'S TRAVEL
                </span>
                <span className="font-medium text-slate-900">
                  Trip: {trip.origin} → {trip.destination}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-600 block">
                  +₹{trip.revenue?.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(trip.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {recentTransactions.expenses?.slice(0, 3).map((exp) => (
            <div key={exp.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                  {exp.business?.name || 'EXPENSE'}
                </span>
                <span className="font-medium text-slate-800">
                  {exp.description || `${exp.category} expense`}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-rose-600 block">
                  -₹{exp.amount?.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(exp.expenseDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

