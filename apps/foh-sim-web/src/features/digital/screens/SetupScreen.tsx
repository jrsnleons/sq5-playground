import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Settings, Sliders, ToggleLeft } from 'lucide-react';

export const SetupScreen: React.FC = () => {
  const { sim, cycleGeqFlip } = useSimulationStore();
  const geqFlipActive = sim.digital.session.geqFlipActive;
  const geqPage = sim.digital.session.geqFlipPage;

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto select-none font-sans text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white uppercase font-mono">
            Mixer Configuration &amp; Surface Preferences
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">SQ-5 SYSTEM SETUP</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GEQ Fader Flip (AC-7) */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-amber-400 uppercase font-mono">
              28-Band GEQ Fader Flip
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                geqFlipActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-500'
              }`}
            >
              {geqFlipActive ? `PAGE ${geqPage} (BANDS ${geqPage === 1 ? '1–14' : '15–28'})` : 'OFF'}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Flips physical fader strips into a 28-band 1/3-octave graphic equalizer (31 Hz – 16 kHz) for the currently selected mix bus.
          </p>

          <button
            onClick={cycleGeqFlip}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <Sliders className="w-4 h-4" />
            <span>CYCLE GEQ FLIP (PRESS: {geqPage === 0 ? '1 (Bands 1–14)' : geqPage === 1 ? '2 (Bands 15–28)' : '3 (Exit)'})</span>
          </button>
        </div>

        {/* Bus Configuration Architecture */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
          <span className="text-sm font-bold text-sky-400 uppercase font-mono block">
            Mix Architecture Allocation
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 font-mono">
              <span className="text-slate-400">Total Mix Buses:</span>
              <span className="text-white font-bold">12 Stereo / Mono Configurable</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 font-mono">
              <span className="text-slate-400">Main Stereo Bus:</span>
              <span className="text-white font-bold">Main LR</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 font-mono">
              <span className="text-slate-400">Stereo Matrices:</span>
              <span className="text-white font-bold">3 Stereo (Splittable to 6 Mono)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 font-mono">
              <span className="text-slate-400">DCA &amp; Mute Groups:</span>
              <span className="text-white font-bold">8 DCAs + 8 Mute Groups</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
