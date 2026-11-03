import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Printer,
  Bus,
  Smartphone,
  Fuel,
  RefreshCw,
} from 'lucide-react';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchReports = async (period = timeframe) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/dashboard?timeframe=${period}`);
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(timeframe);

    const handleUpdate = () => fetchReports(timeframe);
    window.addEventListener('vocal-labs-data-updated', handleUpdate);
    return () => window.removeEventListener('vocal-labs-data-updated', handleUpdate);
  }, [timeframe]);

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || { totalRevenue: 0, totalExpenses: 0, totalGrossProfit: 0, estimatedNetProfit: 0 };
  const biz = reportData?.businesses || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial Reports & Statements</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Verified Database Data
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Consolidated & Business-Specific Financial Performance Analysis
          </p>
        </div>

        <div className="flex items-center space-x-3">
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
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Consolidated Revenue"
          value={`₹${summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Sum of travel, mobile & fuel revenues"
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Consolidated Expenses"
          value={`₹${summary.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="All recorded operating & maintenance costs"
          icon={DollarSign}
          color="rose"
        />
        <MetricCard
          title="Total Gross Profit"
          value={`₹${summary.totalGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Sales margin across products"
          icon={PieChart}
          color="indigo"
        />
        <MetricCard
          title="Estimated Net Profit"
          value={`₹${summary.estimatedNetProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Consolidated net bottom line"
          icon={BarChart3}
          color={summary.estimatedNetProfit >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Breakdown by Business Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Per-Business Performance Breakdown</h2>
          <span className="text-xs text-slate-500">Separately calculated records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Business Name</th>
                <th className="px-6 py-3.5">Core Category</th>
                <th className="px-6 py-3.5">Revenue</th>
                <th className="px-6 py-3.5">Expenses</th>
                <th className="px-6 py-3.5">Gross Margin</th>
                <th className="px-6 py-3.5 font-bold text-slate-800">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Business 1 */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                    <Bus className="w-4 h-4" />
                  </div>
                  <span>AJ'S TRAVEL</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">Fleet Operations (1 Bus, 3 Cars)</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                  ₹{(biz.travel?.revenue || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 font-mono text-rose-600">
                  ₹{(biz.travel?.expenses || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 font-mono text-slate-700">
                  ₹{((biz.travel?.revenue || 0) - (biz.travel?.expenses || 0)).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                  ₹{(biz.travel?.netIncome || 0).toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Business 2 */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span>AJ'S MOBILE SHOP</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">Mobile Phones Only</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                  ₹{(biz.mobile?.revenue || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 font-mono text-rose-600">
                  ₹{(biz.mobile?.expenses || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 font-mono text-emerald-600">
                  ₹{(biz.mobile?.grossProfit || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                  ₹{(biz.mobile?.netIncome || 0).toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Business 3 */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <span>AJ'S FUEL STATION</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">Petrol & Diesel Retail Only</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                  ₹{(biz.fuel?.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td className="px-6 py-4 font-mono text-rose-600">
                  ₹{(biz.fuel?.expenses || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 font-mono text-emerald-600">
                  ₹{(biz.fuel?.grossProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                  ₹{(biz.fuel?.netIncome || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td colSpan="2" className="px-6 py-4 uppercase text-xs tracking-wider">
                  Total Consolidated Sums
                </td>
                <td className="px-6 py-4 font-mono">
                  ₹{summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 font-mono text-rose-600">
                  ₹{summary.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 font-mono text-indigo-700">
                  ₹{summary.totalGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 font-mono text-emerald-700">
                  ₹{summary.estimatedNetProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
