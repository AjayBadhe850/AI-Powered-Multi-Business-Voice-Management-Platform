import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bus,
  Smartphone,
  Fuel,
  Mic,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Owner Dashboard', icon: LayoutDashboard },
  { path: '/travel', label: "AJ'S TRAVEL", icon: Bus },
  { path: '/mobile-shop', label: "AJ'S MOBILE SHOP", icon: Smartphone },
  { path: '/fuel-station', label: "AJ'S FUEL STATION", icon: Fuel },
  { path: '/assistant', label: 'Voice Assistant', icon: Mic },
  { path: '/reports', label: 'Financial Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Businesses & Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">Unified Multi-Business</div>
          <div>All operations verified and stored in independent database records.</div>
        </div>
      </div>
    </aside>
  );
}
