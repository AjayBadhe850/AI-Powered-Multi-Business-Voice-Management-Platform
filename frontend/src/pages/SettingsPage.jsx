import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import api from '../services/api';
import {
  Settings,
  ShieldCheck,
  Building2,
  Mic,
  Database,
  Volume2,
  CheckCircle2,
  User,
  Server,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, businesses } = useAuth();
  const { isTtsEnabled, setIsTtsEnabled, isSpeechSupported, speak } = useVoice();
  const [dbStatus, setDbStatus] = useState('checking');
  const [testSpeechText, setTestSpeechText] = useState('Welcome to the AI-Powered Multi-Business Voice Management Platform. All systems are operational.');

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        if (res.data?.status === 'healthy') {
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      })
      .catch(() => setDbStatus('error'));
  }, []);

  const handleTestSpeech = () => {
    speak(testSpeechText);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Settings & Status</h1>
        <p className="text-sm text-slate-500">
          Configuration, service health and official business profiles
        </p>
      </div>

      {/* System Health Check Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Database Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">PostgreSQL Database</span>
            <span className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{dbStatus === 'connected' ? 'Connected & Synced' : 'Checking...'}</span>
            </span>
          </div>
        </div>

        {/* Web Speech API */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Voice STT Engine</span>
            <span className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isSpeechSupported ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isSpeechSupported ? 'Browser Web Speech API' : 'Fallback Typed Input'}</span>
            </span>
          </div>
        </div>

        {/* Backend Server */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Express Backend</span>
            <span className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>REST API Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Official Business Directory */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-sky-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Business Directory</h2>
            <p className="text-xs text-slate-500">Exactly three businesses registered under this owner account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {businesses.map((b) => (
            <div key={b.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{b.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
                  {b.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">ID: {b.id.slice(0, 13)}...</p>
              <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                {b.type === 'TRAVEL' && 'Fleet: 1 Bus, 3 Cars. Passenger trips & driver logistics.'}
                {b.type === 'MOBILE' && 'Products: Mobile phones only (no accessories).'}
                {b.type === 'FUEL' && 'Permitted: Petrol and Diesel only (no CNG/EV).'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Controls & Audio Test */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <Volume2 className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Assistant Voice Configuration</h2>
            <p className="text-xs text-slate-500">Test speech feedback and customize AI Assistant audio settings</p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="font-semibold text-sm text-slate-800 block">Automatic Speech Playback</span>
              <span className="text-xs text-slate-500">Speak confirmed responses after voice command</span>
            </div>
            <button
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isTtsEnabled
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isTtsEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Preview Voice Text</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testSpeechText}
                onChange={(e) => setTestSpeechText(e.target.value)}
                className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
              <button
                onClick={handleTestSpeech}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Test Voice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Profile */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-3">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Owner Profile Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 block uppercase font-semibold">Name</span>
            <span className="font-semibold text-slate-900">{user?.name}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase font-semibold">Email</span>
            <span className="font-semibold text-slate-900">{user?.email}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase font-semibold">Role</span>
            <span className="font-semibold text-slate-900">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

