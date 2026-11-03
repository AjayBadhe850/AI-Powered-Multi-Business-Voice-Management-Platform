import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { Mic, Volume2, VolumeX, LogOut, Building2, User } from 'lucide-react';

export default function Navbar({ onOpenVoiceModal }) {
  const { user, logout, businesses } = useAuth();
  const { isListening, isTtsEnabled, setIsTtsEnabled } = useVoice();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBusinessChange = (e) => {
    const val = e.target.value;
    if (val === 'TRAVEL') navigate('/travel');
    else if (val === 'MOBILE') navigate('/mobile-shop');
    else if (val === 'FUEL') navigate('/fuel-station');
    else if (val === 'ALL') navigate('/');
  };

  const getCurrentBusinessValue = () => {
    if (location.pathname.startsWith('/travel')) return 'TRAVEL';
    if (location.pathname.startsWith('/mobile-shop')) return 'MOBILE';
    if (location.pathname.startsWith('/fuel-station')) return 'FUEL';
    return 'ALL';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
                AI Voice Platform
              </span>
              <span className="text-xs text-slate-500 font-medium block">

              </span>
            </div>
          </div>

          {/* Business Switcher Selector */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500 ml-2" />
            <select
              value={getCurrentBusinessValue()}
              onChange={handleBusinessChange}
              className="bg-transparent text-sm font-semibold text-slate-800 pr-6 py-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Businesses (Consolidated)</option>
              <option value="TRAVEL">AJ'S TRAVEL</option>
              <option value="MOBILE">AJ'S MOBILE SHOP</option>
              <option value="FUEL">AJ'S FUEL STATION</option>
            </select>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Quick Voice Button */}
            <button
              onClick={onOpenVoiceModal}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${isListening
                ? 'bg-rose-500 text-white animate-voice-listening'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                }`}
              title="Activate AI Assistant"
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isListening ? 'Listening...' : 'AI Assistant'}</span>
            </button>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={`p-2 rounded-lg border transition ${isTtsEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                }`}
              title={isTtsEnabled ? 'Voice playback enabled' : 'Voice playback muted'}
            >
              {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* User Info & Logout */}
            <div className="flex items-center pl-3 border-l border-slate-200 space-x-3">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold text-slate-900 block leading-none">
                  {user?.name || 'AJ (Owner)'}
                </span>
                <span className="text-[11px] text-slate-500">Business Owner</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

