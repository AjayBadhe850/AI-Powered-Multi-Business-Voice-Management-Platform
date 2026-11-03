import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import {
  Smartphone,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Search,
  Plus,
  ShoppingCart,
  PackagePlus,
  CheckCircle,
} from 'lucide-react';

export default function MobileShopPage() {
  const { mobileBiz } = useAuth();
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({ brand: '', model: '', purchasePrice: '', sellingPrice: '', availableStock: '', minimumStock: '5', supplier: '' });
  const [saleForm, setSaleForm] = useState({ productId: '', quantity: '1', unitPrice: '', customerName: '' });
  const [purchaseForm, setPurchaseForm] = useState({ productId: '', quantity: '5', unitPrice: '', supplier: '' });

  const [message, setMessage] = useState(null);

  const fetchMobileData = async () => {
    if (!mobileBiz?.id) return;
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        api.get(`/mobile/${mobileBiz.id}/products?search=${encodeURIComponent(search)}`),
        api.get(`/mobile/${mobileBiz.id}/sales`),
      ]);

      if (pRes.data?.success) setProducts(pRes.data.data);
      if (sRes.data?.success) setSales(sRes.data.data);
    } catch (err) {
      console.error('Failed to load mobile shop data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobileData();

    const handleUpdate = () => fetchMobileData();
    window.addEventListener('vocal-labs-data-updated', handleUpdate);
    return () => window.removeEventListener('vocal-labs-data-updated', handleUpdate);
  }, [mobileBiz?.id, search]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/mobile/${mobileBiz.id}/products`, addForm);
      setMessage({ type: 'success', text: 'Mobile phone product added successfully!' });
      setShowAddModal(false);
      setAddForm({ brand: '', model: '', purchasePrice: '', sellingPrice: '', availableStock: '', minimumStock: '5', supplier: '' });
      fetchMobileData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/mobile/${mobileBiz.id}/sales`, saleForm);
      setMessage({ type: 'success', text: 'Mobile sale recorded and stock deducted successfully!' });
      setShowSaleModal(false);
      setSaleForm({ productId: '', quantity: '1', unitPrice: '', customerName: '' });
      fetchMobileData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/mobile/${mobileBiz.id}/purchases`, purchaseForm);
      setMessage({ type: 'success', text: 'Stock restock recorded successfully!' });
      setShowPurchaseModal(false);
      setPurchaseForm({ productId: '', quantity: '5', unitPrice: '', supplier: '' });
      fetchMobileData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalGrossProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
  const totalStock = products.reduce((sum, p) => sum + (p.availableStock || 0), 0);
  const lowStockCount = products.filter((p) => p.availableStock <= p.minimumStock).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AJ'S MOBILE SHOP</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Mobile Phones Only
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Exclusive Retailer of Smartphones (Samsung, Apple, OnePlus, Xiaomi)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSaleModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Record Phone Sale</span>
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold transition"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Restock Inventory</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mobile Model</span>
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

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Sales Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle={`${sales.length} mobile phones sold`}
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Gross Profit"
          value={`₹${totalGrossProfit.toLocaleString('en-IN')}`}
          subtitle="Selling price minus purchase price"
          icon={TrendingUp}
          color="indigo"
        />
        <MetricCard
          title="Phones in Stock"
          value={totalStock}
          subtitle={`Across ${products.length} handset models`}
          icon={Smartphone}
          color="sky"
        />
        <MetricCard
          title="Low Stock Alerts"
          value={lowStockCount}
          subtitle="Stock below minimum threshold"
          icon={AlertTriangle}
          color={lowStockCount > 0 ? 'rose' : 'emerald'}
          badge={lowStockCount > 0 ? 'Attention Required' : 'All Stocked'}
        />
      </div>

      {/* Product Inventory Table with Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Mobile Phone Inventory</h2>
            <p className="text-xs text-slate-500">Live stock levels & pricing for mobile handsets</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand or model..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Brand & Model</th>
                <th className="px-6 py-3.5">Purchase Price</th>
                <th className="px-6 py-3.5">Selling Price</th>
                <th className="px-6 py-3.5">Stock Status</th>
                <th className="px-6 py-3.5">Est. Margin / Unit</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No mobile phones found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.availableStock <= p.minimumStock;
                  const unitMargin = p.sellingPrice - p.purchasePrice;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div>
                          <span>{p.brand} {p.model}</span>
                          <span className="block text-xs font-normal text-slate-400">{p.supplier || 'Authorized Supplier'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">₹{p.purchasePrice.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isLow
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.availableStock} in stock {isLow && `(Low: Min ${p.minimumStock})`}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-600 font-semibold">
                        +₹{unitMargin.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSaleForm({ ...saleForm, productId: p.id, unitPrice: p.sellingPrice });
                            setShowSaleModal(true);
                          }}
                          disabled={p.availableStock <= 0}
                          className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 disabled:opacity-40 text-sky-700 text-xs font-semibold rounded-lg border border-sky-200 transition"
                        >
                          Sell Phone
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Mobile Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-2">Record Mobile Phone Sale</h3>
            <p className="text-xs text-slate-500 mb-4">Stock is verified before transaction commits</p>
            <form onSubmit={handleRecordSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Phone Model</label>
                <select
                  required
                  value={saleForm.productId}
                  onChange={(e) => {
                    const sel = products.find((p) => p.id === e.target.value);
                    setSaleForm({
                      ...saleForm,
                      productId: e.target.value,
                      unitPrice: sel?.sellingPrice || '',
                    });
                  }}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">Choose a mobile phone...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.availableStock <= 0}>
                      {p.brand} {p.model} (Stock: {p.availableStock}) - ₹{p.sellingPrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={saleForm.unitPrice}
                    onChange={(e) => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={saleForm.customerName}
                  onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                  placeholder="Retail Customer"
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
                  Confirm & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Inventory Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Restock Mobile Inventory</h3>
            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Model</label>
                <select
                  required
                  value={purchaseForm.productId}
                  onChange={(e) => {
                    const sel = products.find((p) => p.id === e.target.value);
                    setPurchaseForm({
                      ...purchaseForm,
                      productId: e.target.value,
                      unitPrice: sel?.purchasePrice || '',
                    });
                  }}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">Select phone to restock...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} {p.model} (Current Stock: {p.availableStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Add</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wholesale Cost (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={purchaseForm.unitPrice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unitPrice: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={purchaseForm.supplier}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                  placeholder="e.g. Official Distributor"
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
                  Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Mobile Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Add Mobile Phone</h3>
            <p className="text-xs text-slate-500 mb-4">Mobile handsets only (accessories strictly excluded)</p>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={addForm.brand}
                    onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                    placeholder="e.g. Samsung, Apple"
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.model}
                    onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                    placeholder="e.g. Galaxy S25"
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={addForm.purchasePrice}
                    onChange={(e) => setAddForm({ ...addForm, purchasePrice: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={addForm.sellingPrice}
                    onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addForm.availableStock}
                    onChange={(e) => setAddForm({ ...addForm, availableStock: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addForm.minimumStock}
                    onChange={(e) => setAddForm({ ...addForm, minimumStock: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={addForm.supplier}
                  onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
                  placeholder="Wholesale Partner"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
