import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { X, Church, Sparkles } from 'lucide-react';
import { ConfirmDialogModal } from './ConfirmDialogModal';

export const EntryModeModal: React.FC = () => {
  const {
    showEntryModal,
    setShowEntryModal,
    loadPreset
  } = useSimulationStore();

  const [pendingMode, setPendingMode] = useState<'church' | 'scratch' | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEntryModal && !pendingMode) {
        setShowEntryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEntryModal, setShowEntryModal, pendingMode]);

  if (!showEntryModal) return null;

  const handleSelectMode = (mode: 'church' | 'scratch') => {
    setPendingMode(mode);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-mode-modal-title"
      onClick={() => setShowEntryModal(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40">
          <div>
            <h2 id="entry-mode-modal-title" className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
              Select Rig Configuration Mode
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Choose your practice starting point for the SQ-5 and AR2412 simulator
            </p>
          </div>
          <button
            onClick={() => setShowEntryModal(false)}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Church Rig Option */}
          <div
            onClick={() => handleSelectMode('church')}
            className="p-5 bg-black/60 hover:bg-white/[0.03] border border-white/[0.08] hover:border-white/30 rounded-xl cursor-pointer transition-all space-y-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <Church className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-neutral-200 group-hover:text-white">
                Church Rig Default
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Full church setup pre-configured: 24 stage inputs, DI boxes, 7 IEM mixes, click/comms routing, front fills, subs, and livestream routing.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1] inline-block">
              RECOMMENDED FOR TRAINING
            </span>
          </div>

          {/* Start from Scratch Option */}
          <div
            onClick={() => handleSelectMode('scratch')}
            className="p-5 bg-black/60 hover:bg-white/[0.03] border border-white/[0.08] hover:border-white/30 rounded-xl cursor-pointer transition-all space-y-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-neutral-200 group-hover:text-white">
                Start from Scratch
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Blank stage with only the AR2412 and SQ-5 hardware. Drag instruments, microphones, and cables from the palette to patch from zero.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1] inline-block">
              FREE-BUILD MODE
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex justify-end bg-black/40">
          <button
            onClick={() => setShowEntryModal(false)}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white rounded-lg text-xs font-mono transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
          >
            Cancel
          </button>
        </div>
      </div>

      <ConfirmDialogModal
        isOpen={pendingMode !== null}
        title="Load Rig Configuration"
        message="Loading a preset will replace current canvas connections and digital console patches. Are you sure you want to proceed?"
        confirmLabel="Load Configuration"
        isDestructive={false}
        onConfirm={() => {
          if (pendingMode) loadPreset(pendingMode);
          setPendingMode(null);
        }}
        onCancel={() => setPendingMode(null)}
      />
    </div>
  );
};
