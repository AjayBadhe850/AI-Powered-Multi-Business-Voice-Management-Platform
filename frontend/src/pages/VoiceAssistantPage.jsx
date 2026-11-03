import React, { useState } from 'react';
import { useVoice } from '../context/VoiceContext';
import {
  Mic,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Bus,
  Smartphone,
  Fuel,
  CornerDownRight,
  Clock,
} from 'lucide-react';

const CATEGORIZED_EXAMPLES = [
  {
    category: "AJ'S TRAVEL",
    icon: Bus,
    color: 'sky',
    queries: [
      "Show my travel vehicles.",
      "Is my bus available?",
      "Add 2000 rupees maintenance expense for car one.",
      "Record a trip revenue of 12000 rupees.",
      "Show my travel expenses this month.",
    ],
  },
  {
    category: "AJ'S MOBILE SHOP",
    icon: Smartphone,
    color: 'indigo',
    queries: [
      "Show my mobile phone stock.",
      "Add 10 Samsung phones to inventory.",
      "Record one Samsung phone sale for 25000 rupees.",
      "Show all iPhones available.",
      "Show today's mobile shop sales.",
      "Which mobile phones have low stock?",
    ],
  },
  {
    category: "AJ'S FUEL STATION",
    icon: Fuel,
    color: 'amber',
    queries: [
      "Show current petrol stock.",
      "How much diesel was sold today?",
      "Record a purchase of 500 litres of petrol.",
      "Record a sale of 100 litres of diesel.",
      "Show today's fuel station revenue.",
      "Add 1000 rupees electricity expense to AJ'S FUEL STATION.",
    ],
  },
  {
    category: "Intelligent Clarification & Follow-Up",
    icon: HelpCircle,
    color: 'rose',
    queries: [
      "Add 2000 rupees expense.", // Ambiguous business!
      "Show today's mobile shop sales.",
      "What about yesterday?", // Context retention follow-up!
    ],
  },
];

export default function VoiceAssistantPage() {
  const {
    isListening,
    transcript,
    setTranscript,
    isProcessing,
    startListening,
    stopListening,
    processQuery,
    lastResponse,
    activeClarification,
    errorMessage,
    conversationHistory,
    isTtsEnabled,
    setIsTtsEnabled,
    speak,
  } = useVoice();

  const [inputVal, setInputVal] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const query = inputVal.trim() || transcript.trim();
    if (!query) return;

    if (isListening) stopListening();
    setInputVal('');
    await processQuery(query);
  };

  const handleRunExample = async (q) => {
    setInputVal(q);
    await processQuery(q);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Central Voice Assistant</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Primary Interface
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Speaks, validates, and executes verified database operations across all three businesses
          </p>
        </div>

        <button
          onClick={() => setIsTtsEnabled(!isTtsEnabled)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
            isTtsEnabled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
          }`}
        >
          {isTtsEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          <span>{isTtsEnabled ? 'Voice Playback On' : 'Voice Playback Muted'}</span>
        </button>
      </div>

      {/* Main Interactive Assistant Console */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 flex flex-col items-center relative overflow-hidden">
        {/* Ambiguous Clarification Banner */}
        {activeClarification && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900 animate-fadeIn">
            <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
                Clarification Requested by AI
              </span>
              <p className="text-sm font-semibold mt-0.5">{activeClarification}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  onClick={() => handleRunExample("AJ'S TRAVEL")}
                  className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-300 transition"
                >
                  AJ'S TRAVEL
                </button>
                <button
                  onClick={() => handleRunExample("AJ'S MOBILE SHOP")}
                  className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-300 transition"
                >
                  AJ'S MOBILE SHOP
                </button>
                <button
                  onClick={() => handleRunExample("AJ'S FUEL STATION")}
                  className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-300 transition"
                >
                  AJ'S FUEL STATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-800 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Big Central Microphone Button */}
        <div className="relative my-4">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isListening
                ? 'bg-rose-500 text-white animate-voice-listening shadow-rose-500/40 scale-105'
                : 'bg-gradient-to-tr from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-600/30'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to speak'}
          >
            <Mic className={`w-12 h-12 ${isListening ? 'animate-bounce' : ''}`} />
          </button>
        </div>

        {/* Status Text & Live Transcript */}
        <div className="text-center max-w-lg mt-2 mb-6">
          <span className="text-base font-bold text-slate-800 block">
            {isListening
              ? 'Listening to microphone... Speak naturally'
              : isProcessing
              ? 'Interpreting voice intent & verifying with backend...'
              : 'Tap the microphone or type below to command your businesses'}
          </span>

          {transcript && (
            <p className="mt-3 text-sm text-sky-700 font-semibold bg-sky-50 px-4 py-2 rounded-2xl border border-sky-200 inline-block shadow-sm">
              "{transcript}"
            </p>
          )}
        </div>

        {/* Typed Input Fallback */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex items-center space-x-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type your command (e.g. 'Is my bus available?', 'Show current petrol stock')..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={isProcessing || (!inputVal.trim() && !transcript.trim())}
            className="px-5 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm flex items-center space-x-2 shadow-md shadow-sky-600/20 transition"
          >
            <span>Execute</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Suggested Voice Commands Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">Recommended Natural Voice Commands</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIZED_EXAMPLES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{cat.category}</h3>
                </div>

                <div className="space-y-1.5">
                  {cat.queries.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleRunExample(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium transition flex items-center justify-between group"
                    >
                      <span className="truncate">"{q}"</span>
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 ml-2 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversation Log / Turn History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">Voice Interaction History</h3>
          </div>
          <span className="text-xs text-slate-400">Context retained across turns</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {conversationHistory.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No conversations recorded yet. Speak a command above to begin.
            </div>
          ) : (
            conversationHistory.map((turn) => (
              <div key={turn.id} className="p-5 space-y-2 hover:bg-slate-50/50 transition">
                {/* User Turn */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">Owner:</span>
                    <span className="text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-medium">
                      "{turn.query}"
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{turn.timestamp}</span>
                </div>

                {/* Assistant Response */}
                <div className="pl-4 border-l-2 border-sky-400 py-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-sky-700">Voice Assistant:</span>
                    {turn.business && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-100">
                        {turn.business}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {turn.response}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
