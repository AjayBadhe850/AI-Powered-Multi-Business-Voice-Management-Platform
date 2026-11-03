import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import {
  Bus,
  Car,
  Calendar,
  DollarSign,
  Plus,
  Wrench,
  CheckCircle,
  AlertCircle,
  Fuel,
  Users,
  RefreshCw,
} from 'lucide-react';

export default function TravelPage() {
  const { travelBiz } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showTripModal, setShowTripModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Forms state
  const [tripForm, setTripForm] = useState({ vehicleId: '', origin: '', destination: '', revenue: '', notes: '' });
  const [bookingForm, setBookingForm] = useState({ customerName: '', customerPhone: '', pickupLocation: '', dropLocation: '', fare: '', vehicleId: '', tripDate: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'maintenance', amount: '', vehicleId: '', description: '' });

  const [message, setMessage] = useState(null);

  const fetchTravelData = async () => {
    if (!travelBiz?.id) return;
    try {
      setLoading(true);
      const [vRes, tRes, bRes, eRes] = await Promise.all([
        api.get(`/travel/${travelBiz.id}/vehicles`),
        api.get(`/travel/${travelBiz.id}/trips`),
        api.get(`/travel/${travelBiz.id}/bookings`),
        api.get(`/expenses/${travelBiz.id}`),
      ]);

      if (vRes.data?.success) setVehicles(vRes.data.data);
      if (tRes.data?.success) setTrips(tRes.data.data);
      if (bRes.data?.success) setBookings(bRes.data.data);
      if (eRes.data?.success) setExpenses(eRes.data.data);
    } catch (err) {
      console.error('Failed to load travel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelData();

    const handleUpdate = () => fetchTravelData();
    window.addEventListener('business-data-updated', handleUpdate);
    return () => window.removeEventListener('business-data-updated', handleUpdate);
  }, [travelBiz?.id]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/travel/${travelBiz.id}/trips`, tripForm);
      setMessage({ type: 'success', text: 'Trip scheduled and recorded successfully!' });
      setShowTripModal(false);
      setTripForm({ vehicleId: '', origin: '', destination: '', revenue: '', notes: '' });
      fetchTravelData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/travel/${travelBiz.id}/bookings`, bookingForm);
      setMessage({ type: 'success', text: 'Customer booking confirmed!' });
      setShowBookingModal(false);
      setBookingForm({ customerName: '', customerPhone: '', pickupLocation: '', dropLocation: '', fare: '', vehicleId: '', tripDate: '' });
      fetchTravelData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/travel/${travelBiz.id}/expenses`, expenseForm);
      setMessage({ type: 'success', text: 'Travel expense recorded!' });
      setShowExpenseModal(false);
      setExpenseForm({ category: 'maintenance', amount: '', vehicleId: '', description: '' });
      fetchTravelData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message });
    }
  };

  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const availableVehiclesCount = vehicles.filter((v) => v.status === 'Available').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AJ'S TRAVEL</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Official Business
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Fleet Management: Exactly 1 Bus & 3 Dedicated Cars
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowTripModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Trip</span>
          </button>
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold transition"
          >
            <Calendar className="w-4 h-4" />
            <span>New Booking</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-semibold transition"
          >
            <DollarSign className="w-4 h-4" />
            <span>Record Expense</span>
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
          title="Total Travel Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle="All completed trips"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Fleet Expenses"
          value={`₹${totalExpenses.toLocaleString('en-IN')}`}
          subtitle="Fuel, maintenance & driver allowances"
          icon={Wrench}
          color="rose"
        />
        <MetricCard
          title="Net Fleet Income"
          value={`₹${(totalRevenue - totalExpenses).toLocaleString('en-IN')}`}
          subtitle="Revenue minus recorded expenses"
          icon={CheckCircle}
          color="indigo"
        />
        <MetricCard
          title="Available Vehicles"
          value={`${availableVehiclesCount} / ${vehicles.length}`}
          subtitle="1 Bus, 3 Cars configuration"
          icon={Bus}
          color="sky"
        />
      </div>

      {/* Official Fleet Grid (1 Bus, 3 Cars) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Official Fleet (1 Bus, 3 Cars)</h2>
          <span className="text-xs text-slate-500 font-medium">Independent logs per vehicle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vehicles.map((v) => {
            const isBus = v.type === 'Bus';
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-xl ${isBus ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'}`}>
                        {isBus ? <Bus className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{v.name}</h3>
                        <span className="text-[11px] font-mono text-slate-500 block">{v.vehicleNumber}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        v.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'On Trip'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Driver</span>
                      <span className="font-semibold text-slate-800">{v.driver?.name || 'Unassigned'}</span>
                      {v.driver?.phone && <span className="block text-slate-500 text-[11px]">{v.driver.phone}</span>}
                    </div>
                    <div className="pt-1 border-t border-slate-200/60 flex justify-between">
                      <span>Service Due:</span>
                      <span className="font-medium text-slate-700">
                        {v.nextServiceDate ? new Date(v.nextServiceDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{v._count?.trips || 0} Trips</span>
                  <span>{v._count?.expenses || 0} Expense logs</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trips & Bookings Tabs / Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trips Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Trip History & Revenue</h3>
            <span className="text-xs text-slate-400">{trips.length} Total Trips</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {trips.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No trips recorded yet.</div>
            ) : (
              trips.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-900 block">{t.origin} → {t.destination}</span>
                    <span className="text-xs text-slate-500">
                      {t.vehicle?.name} ({t.vehicle?.vehicleNumber}) • {new Date(t.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">₹{t.revenue.toLocaleString('en-IN')}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer Bookings Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Customer Bookings</h3>
            <span className="text-xs text-slate-400">{bookings.length} Bookings</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No bookings recorded yet.</div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-900 block">{b.customerName}</span>
                    <span className="text-xs text-slate-500">
                      {b.pickupLocation} → {b.dropLocation} • {new Date(b.tripDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">₹{b.fare.toLocaleString('en-IN')}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule Trip Modal */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Schedule a Trip</h3>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vehicle</label>
                <select
                  required
                  value={tripForm.vehicleId}
                  onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">Select fleet vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type}) - {v.vehicleNumber} [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Origin</label>
                <input
                  type="text"
                  required
                  value={tripForm.origin}
                  onChange={(e) => setTripForm({ ...tripForm, origin: e.target.value })}
                  placeholder="e.g. Bengaluru Central"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  value={tripForm.destination}
                  onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                  placeholder="e.g. Mysuru"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Revenue (INR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={tripForm.revenue}
                  onChange={(e) => setTripForm({ ...tripForm, revenue: e.target.value })}
                  placeholder="e.g. 12000"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTripModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  Save Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Record Customer Booking</h3>
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  placeholder="Customer Full Name"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.pickupLocation}
                    onChange={(e) => setBookingForm({ ...bookingForm, pickupLocation: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Drop Location</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.dropLocation}
                    onChange={(e) => setBookingForm({ ...bookingForm, dropLocation: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fare (INR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bookingForm.fare}
                    onChange={(e) => setBookingForm({ ...bookingForm, fare: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.tripDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, tripDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Record Fleet Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="maintenance">Vehicle Maintenance</option>
                  <option value="fuel">Vehicle Fuel</option>
                  <option value="driver">Driver Allowance</option>
                  <option value="operating">General Operating</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle (Tracked Separately)</label>
                <select
                  value={expenseForm.vehicleId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">General Fleet Expense</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type}) - {v.vehicleNumber}
                    </option>
                  ))}
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
                  placeholder="e.g. 2000"
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Brake pad check for car one"
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

