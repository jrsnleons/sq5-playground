import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { X, Church, Sparkles } from 'lucide-react';

export const EntryModeModal: React.FC = () => {
  const {
    showEntryModal,
    setShowEntryModal,
    loadPreset
  } = useSimulationStore();

  if (!showEntryModal) return null;

  const handleSelectMode = (mode: 'church' | 'scratch') => {
    if (window.confirm('Loading a preset will replace current canvas connections and digital patches. Proceed?')) {
      loadPreset(mode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white uppercase font-mono">
              Select Rig Configuration Mode
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your practice starting point for the SQ-5 and AR2412 simulator
            </p>
          </div>
          <button
            onClick={() => setShowEntryModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Church Rig Option */}
          <div
            onClick={() => handleSelectMode('church')}
            className="p-5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-sky-500 rounded-xl cursor-pointer transition-all space-y-3 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Church className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200 group-hover:text-sky-300">
                Church Rig Default
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full church setup pre-configured: 24 stage inputs, DI boxes, 7 IEM mixes, click/comms routing, front fills, subs, and livestream routing.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 inline-block">
              RECOMMENDED FOR TRAINING
            </span>
          </div>

          {/* Start from Scratch Option */}
          <div
            onClick={() => handleSelectMode('scratch')}
            className="p-5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl cursor-pointer transition-all space-y-3 group shadow-lg"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200 group-hover:text-amber-300">
                Start from Scratch
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Blank stage with only the AR2412 and SQ-5 hardware. Drag instruments, microphones, and cables from the palette to patch from zero.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 inline-block">
              FREE-BUILD MODE
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={() => setShowEntryModal(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
