import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const NoticesModal: React.FC = () => {
  const {
    noticesModalOpen,
    setNoticesModalOpen,
    validationNotices
  } = useSimulationStore();

  if (!noticesModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden font-sans text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase font-mono">
              System Validation &amp; Warnings ({validationNotices.length})
            </h2>
          </div>
          <button
            onClick={() => setNoticesModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices List */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
          {validationNotices.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              All physical connections and routing rules are verified and valid.
            </div>
          ) : (
            validationNotices.map((notice, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex space-x-3 ${
                  notice.type === 'error'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                    : notice.type === 'warning'
                    ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                {notice.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold uppercase tracking-wider font-mono text-[10px] mb-0.5">
                    {notice.code}
                  </div>
                  <p className="leading-relaxed">{notice.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={() => setNoticesModalOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
