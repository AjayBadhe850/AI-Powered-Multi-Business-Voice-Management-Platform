import React, { useState } from 'react';
import { useVoice } from '../context/VoiceContext';
import { Mic, MicOff, Send, X, AlertCircle, CheckCircle2, HelpCircle, Sparkles, Volume2 } from 'lucide-react';

const SUGGESTIONS = [
  "Show my travel vehicles.",
  "Is my bus available?",
  "Add 2000 rupees maintenance expense for car one.",
  "Record a trip revenue of 12000 rupees.",
  "Show my mobile phone stock.",
  "Record one Samsung phone sale for 25000 rupees.",
  "Which mobile phones have low stock?",
  "Show current petrol stock.",
  "Record a sale of 100 litres of diesel.",
  "Show today's fuel station revenue.",
  "Add 1000 rupees electricity expense to AJ'S FUEL STATION.",
  "Add 2000 rupees expense.", // Tests clarification!
];

export default function VoiceAssistantModal({ isOpen, onClose }) {
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
  } = useVoice();

  const [typedInput, setTypedInput] = useState('');

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    const query = typedInput.trim() || transcript.trim();
    if (!query) return;

    if (isListening) {
      stopListening();
    }

    setTypedInput('');
    await processQuery(query);
  };

  const handleSuggestionClick = async (suggestion) => {
    setTypedInput(suggestion);
    await processQuery(suggestion);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Central Voice Assistant</h2>
              <p className="text-xs text-slate-500">Speaking & Managing All 3 Businesses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Chat Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Clarification Alert Banner */}
          {activeClarification && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                  Clarification Needed
                </span>
                <p className="text-sm text-amber-900 font-medium mt-0.5">{activeClarification}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSuggestionClick("AJ'S TRAVEL")}
                    className="text-xs px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100 font-medium"
                  >
                    AJ'S TRAVEL
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("AJ'S MOBILE SHOP")}
                    className="text-xs px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100 font-medium"
                  >
                    AJ'S MOBILE SHOP
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("AJ'S FUEL STATION")}
                    className="text-xs px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100 font-medium"
                  >
                    AJ'S FUEL STATION
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center space-x-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Central Microphone Visualizer */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-50/70 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isListening
                  ? 'bg-rose-500 text-white animate-voice-listening shadow-rose-500/40'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start voice input'}
            >
              {isListening ? <Mic className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
            </button>

            <div className="mt-4 text-center">
              <span className="text-sm font-semibold text-slate-800 block">
                {isListening
                  ? 'Listening... Speak your command clearly'
                  : isProcessing
                  ? 'Understanding & verifying with backend...'
                  : 'Tap microphone to speak or type below'}
              </span>
              {transcript && (
                <p className="mt-2 text-sm text-sky-700 font-medium bg-sky-50 px-4 py-1.5 rounded-full border border-sky-200 max-w-md mx-auto">
                  "{transcript}"
                </p>
              )}
            </div>
          </div>

          {/* Recent Response Display */}
          {lastResponse && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Assistant Confirmed Result</span>
                </span>
                {lastResponse.business && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                    {lastResponse.business}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {lastResponse.spokenResponse || lastResponse.displayMessage}
              </p>
            </div>
          )}

          {/* Suggestion Pills */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Suggested Voice Commands
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 6).map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(cmd)}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium text-left"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Typed Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-slate-50 border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Type your command or question here..."
            className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={isProcessing || (!typedInput.trim() && !transcript.trim())}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm flex items-center space-x-1.5 transition shadow-sm"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
