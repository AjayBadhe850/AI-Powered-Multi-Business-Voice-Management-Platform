import React from 'react';
import { useVoice } from '../context/VoiceContext';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

export default function PrintPreviewModal() {
  const { activePrintReport, isPrintModalOpen, setIsPrintModalOpen, triggerPrint } = useVoice();

  if (!isPrintModalOpen || !activePrintReport) {
    return null;
  }

  const handlePrintClick = () => {
    triggerPrint(activePrintReport.html);
  };

  const handleClose = () => {
    setIsPrintModalOpen(false);
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amt || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {activePrintReport.title || 'Report Print Preview'}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {activePrintReport.businessName || 'Business'} • {activePrintReport.itemCount || 0} records • Total:{' '}
                <span className="font-semibold text-slate-800">
                  {formatCurrency(activePrintReport.totalAmount)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintClick}
              className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-sky-600/20 transition-all hover:scale-102"
              title="Print document or save as PDF"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print / Save as PDF
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Preview Document Iframe */}
        <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex flex-col">
          <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
            <iframe
              title="Print Document Preview"
              srcDoc={activePrintReport.html}
              className="w-full h-full border-0"
            />
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Voice-command initiated by AI Assistant</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Press &quot;Print / Save as PDF&quot; or Ctrl+P to select your printer or PDF destination
          </span>
        </div>
      </div>
    </div>
  );
}

