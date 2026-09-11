import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const NoticesModal: React.FC = () => {
  const {
    noticesModalOpen,
    setNoticesModalOpen,
    validationNotices
  } = useSimulationStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && noticesModalOpen) {
        setNoticesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [noticesModalOpen, setNoticesModalOpen]);

  if (!noticesModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notices-modal-title"
      onClick={() => setNoticesModalOpen(false)}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden font-sans text-slate-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 id="notices-modal-title" className="text-sm font-bold text-white uppercase font-mono">
              System Validation &amp; Warnings ({validationNotices.length})
            </h2>
          </div>
          <button
            onClick={() => setNoticesModalOpen(false)}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white p-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices List */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
          {validationNotices.length === 0 ? (
            <div className="text-center py-8 text-slate-300 text-xs">
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
                    : 'bg-slate-950/60 border-slate-800 text-slate-200'
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
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
