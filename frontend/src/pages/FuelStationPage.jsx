import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import {
  Fuel,
  DollarSign,
  TrendingUp,
  Droplets,
  Plus,
  Zap,
  ShoppingCart,
  PackagePlus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function FuelStationPage() {
  const { fuelBiz } = useAuth();
  const [inventories, setInventories] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Forms state
  const [saleForm, setSaleForm] = useState({ fuelType: 'Diesel', quantityLitres: '', pricePerLitre: '' });
  const [purchaseForm, setPurchaseForm] = useState({ fuelType: 'Petrol', quantityLitres: '', pricePerLitre: '', supplier: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'electricity', amount: '', description: '' });

  const [message, setMessage] = useState(null);

  const fetchFuelData = async () => {
    if (!fuelBiz?.id) return;
    try {
      setLoading(true);
      const [iRes, sRes, pRes, eRes] = await Promise.all([
        api.get(`/fuel/${fuelBiz.id}/inventory`),
        api.get(`/fuel/${fuelBiz.id}/sales`),
        api.get(`/fuel/${fuelBiz.id}/purchases`),
        api.get(`/expenses/${fuelBiz.id}`),
      ]);

      if (iRes.data?.success) setInventories(iRes.data.data);
      if (sRes.data?.success) setSales(sRes.data.data);
      if (pRes.data?.success) setPurchases(pRes.data.data);
      if (eRes.data?.success) setExpenses(eRes.data.data);
    } catch (err) {
      console.error('Failed to load fuel station data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelData();

    const handleUpdate = () => fetchFuelData();
    window.addEventListener('vocal-labs-data-updated', handleUpdate);
    return () => window.removeEventListener('vocal-labs-data-updated', handleUpdate);
  }, [fuelBiz?.id]);

  const handleRecordSale = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fuel/${fuelBiz.id}/sales`, saleForm);
      setMessage({ type: 'success', text: `Sale of ${saleForm.quantityLitres}L of ${saleForm.fuelType} recorded successfully!` });
      setShowSaleModal(false);
      setSaleForm({ fuelType: 'Diesel', quantityLitres: '', pricePerLitre: '' });
      fetchFuelData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fuel/${fuelBiz.id}/purchases`, purchaseForm);
      setMessage({ type: 'success', text: `Purchase of ${purchaseForm.quantityLitres}L of ${purchaseForm.fuelType} recorded and stock incremented!` });
      setShowPurchaseModal(false);
      setPurchaseForm({ fuelType: 'Petrol', quantityLitres: '', pricePerLitre: '', supplier: '' });
      fetchFuelData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/expenses/${fuelBiz.id}`, expenseForm);
      setMessage({ type: 'success', text: 'Station operating expense recorded!' });
      setShowExpenseModal(false);
      setExpenseForm({ category: 'electricity', amount: '', description: '' });
      fetchFuelData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const petrol = inventories.find((i) => i.fuelType === 'Petrol');
  const diesel = inventories.find((i) => i.fuelType === 'Diesel');

  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalGrossProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AJ'S FUEL STATION</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Petrol & Diesel Only
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Fuel Tank Reserves, Metered Sales & Operating Expenses
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSaleModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Record Fuel Dispensed</span>
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold transition"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Receive Bulk Fuel</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-semibold transition"
          >
            <Zap className="w-4 h-4" />
            <span>Electricity & Expenses</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Fuel Sales Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`}
          subtitle="Combined petrol & diesel pump sales"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Gross Margin"
          value={`₹${totalGrossProfit.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`}
          subtitle="Sales price minus purchase price"
          icon={TrendingUp}
          color="indigo"
        />
        <MetricCard
          title="Station Operating Expenses"
          value={`₹${totalExpenses.toLocaleString('en-IN')}`}
          subtitle="Electricity, maintenance & utilities"
          icon={Zap}
          color="rose"
        />
        <MetricCard
          title="Net Fuel Margin"
          value={`₹${(totalGrossProfit - totalExpenses).toLocaleString('en-IN', { maximumFractionDigits: 1 })}`}
          subtitle="Gross margin minus station expenses"
          icon={CheckCircle}
          color="sky"
        />
      </div>

      {/* Dedicated Tank Gauges (Petrol & Diesel ONLY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Petrol Tank */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Petrol Tank (Underground)</h3>
                  <span className="text-xs text-slate-500">Retail Motor Spirit (MS)</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                Active Reserve
              </span>
            </div>

            <div className="my-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Volume</span>
                <span className="text-3xl font-extrabold text-slate-900">
                  {(petrol?.currentStock || 0).toLocaleString()} <span className="text-lg font-medium text-slate-500">Litres</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-sky-400 to-sky-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((petrol?.currentStock || 0) / 12000) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-medium">
                <span>0 L (Min)</span>
                <span>Tank Capacity: 12,000 L</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Selling Rate</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  ₹{petrol?.sellingPricePerLitre?.toFixed(2)} <span className="text-xs font-normal text-slate-500">/L</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">Purchase Rate</span>
                <span className="text-lg font-bold text-slate-700 font-mono">
                  ₹{petrol?.purchasePricePerLitre?.toFixed(2)} <span className="text-xs font-normal text-slate-500">/L</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Opening: {(petrol?.openingStock || 0).toLocaleString()} L</span>
            <button
              onClick={() => {
                setSaleForm({ ...saleForm, fuelType: 'Petrol', pricePerLitre: petrol?.sellingPricePerLitre });
                setShowSaleModal(true);
              }}
              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-lg border border-sky-200 transition"
            >
              Dispense Petrol
            </button>
          </div>
        </div>

        {/* Diesel Tank */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Fuel className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Diesel Tank (Underground)</h3>
                  <span className="text-xs text-slate-500">High-Speed Diesel (HSD)</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                Active Reserve
              </span>
            </div>

            <div className="my-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Volume</span>
                <span className="text-3xl font-extrabold text-slate-900">
                  {(diesel?.currentStock || 0).toLocaleString()} <span className="text-lg font-medium text-slate-500">Litres</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((diesel?.currentStock || 0) / 16000) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-medium">
                <span>0 L (Min)</span>
                <span>Tank Capacity: 16,000 L</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Selling Rate</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  ₹{diesel?.sellingPricePerLitre?.toFixed(2)} <span className="text-xs font-normal text-slate-500">/L</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">Purchase Rate</span>
                <span className="text-lg font-bold text-slate-700 font-mono">
                  ₹{diesel?.purchasePricePerLitre?.toFixed(2)} <span className="text-xs font-normal text-slate-500">/L</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Opening: {(diesel?.openingStock || 0).toLocaleString()} L</span>
            <button
              onClick={() => {
                setSaleForm({ ...saleForm, fuelType: 'Diesel', pricePerLitre: diesel?.sellingPricePerLitre });
                setShowSaleModal(true);
              }}
              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-lg border border-amber-200 transition"
            >
              Dispense Diesel
            </button>
          </div>
        </div>
      </div>

      {/* Sales & Purchases Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Fuel Sales Log</h3>
            <span className="text-xs text-slate-400">{sales.length} Dispenses</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {sales.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No fuel sales recorded yet.</div>
            ) : (
              sales.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      {s.quantityLitres} Litres of {s.fuelType}
                    </span>
                    <span className="text-xs text-slate-500">
                      Rate: ₹{s.pricePerLitre}/L • {new Date(s.saleDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">
                      ₹{s.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Margin: +₹{s.grossProfit?.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operating Expenses Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Station Operating Expenses</h3>
            <span className="text-xs text-slate-400">{expenses.length} Records</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No operating expenses recorded yet.</div>
            ) : (
              expenses.map((e) => (
                <div key={e.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-900 block uppercase text-xs tracking-wider">
                      {e.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {e.description} • {new Date(e.expenseDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 block">
                      -₹{e.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Record Fuel Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Record Fuel Sale</h3>
            <p className="text-xs text-slate-500 mb-4">Stock verified so inventory never becomes negative</p>
            <form onSubmit={handleRecordSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type</label>
                <select
                  value={saleForm.fuelType}
                  onChange={(e) => {
                    const selInv = inventories.find((i) => i.fuelType === e.target.value);
                    setSaleForm({
                      ...saleForm,
                      fuelType: e.target.value,
                      pricePerLitre: selInv?.sellingPricePerLitre || '',
                    });
                  }}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Dispensed (Litres)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={saleForm.quantityLitres}
                  onChange={(e) => setSaleForm({ ...saleForm, quantityLitres: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Rate / Litre (INR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={saleForm.pricePerLitre}
                  onChange={(e) => setSaleForm({ ...saleForm, pricePerLitre: e.target.value })}
                  placeholder="Leave blank for default rate"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                >
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Fuel Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Receive Bulk Fuel Delivery</h3>
            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type</label>
                <select
                  value={purchaseForm.fuelType}
                  onChange={(e) => {
                    const selInv = inventories.find((i) => i.fuelType === e.target.value);
                    setPurchaseForm({
                      ...purchaseForm,
                      fuelType: e.target.value,
                      pricePerLitre: selInv?.purchasePricePerLitre || '',
                    });
                  }}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Litres)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    value={purchaseForm.quantityLitres}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantityLitres: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Rate / L</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseForm.pricePerLitre}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, pricePerLitre: e.target.value })}
                    placeholder="Default wholesale"
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Depot</label>
                <input
                  type="text"
                  value={purchaseForm.supplier}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                  placeholder="e.g. Oil Marketing Company Depot"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  Add to Tank Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Station Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Record Station Operating Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="electricity">Electricity Bill (High Voltage Pumps & Canopy)</option>
                  <option value="wages">Pump Attendant Wages</option>
                  <option value="maintenance">Dispenser Maintenance</option>
                  <option value="operating">General Operating Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="e.g. 1000"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Monthly electricity expense"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
