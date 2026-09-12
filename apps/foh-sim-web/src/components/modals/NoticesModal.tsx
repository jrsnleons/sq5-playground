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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 id="notices-modal-title" className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
              System Validation &amp; Warnings ({validationNotices.length})
            </h2>
          </div>
          <button
            onClick={() => setNoticesModalOpen(false)}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices List */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
          {validationNotices.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs font-mono">
              All physical connections and routing rules are verified and valid.
            </div>
          ) : (
            validationNotices.map((notice, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex space-x-3 ${
                  notice.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-200'
                    : notice.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    : 'bg-white/[0.02] border-white/[0.06] text-neutral-300'
                }`}
              >
                {notice.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold uppercase tracking-wider font-mono text-[10px] mb-0.5">
                    {notice.code}
                  </div>
                  <p className="leading-relaxed text-xs">{notice.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] flex justify-end bg-black/40">
          <button
            onClick={() => setNoticesModalOpen(false)}
            className="px-4 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 hover:text-white rounded-lg text-xs font-mono transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
