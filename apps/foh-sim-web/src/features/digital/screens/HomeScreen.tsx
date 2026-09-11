import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Activity, Clock, ShieldCheck, Cpu } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { sim, signalPresence } = useSimulationStore();
  const currentScene = sim.digital.scenes.find((s) => s.id === sim.digital.activeSceneId);

  return (
    <div className="h-full bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto">
      {/* Top Welcome & Mixer Status */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div>
            <h1 className="text-xl font-black tracking-wide text-white font-mono flex items-center space-x-2">
              <span>ALLEN &amp; HEATH SQ-5</span>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-sans">
                v1.6.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              XCVI 96kHz FPGA Core Engine • 48 Input Channels • 36 Mix Buses
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
            <Clock className="w-4 h-4" />
            <span>INTERNAL 96kHz CLOCK LOCKED</span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* SLink Network Card */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">SLink Port</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  signalPresence.slinkHasSignal
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {signalPresence.slinkHasSignal ? 'LOCKED' : 'NO LINK'}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {signalPresence.slinkHasSignal
                ? 'AR2412 AudioRack (24 In / 12 Out)'
                : 'Disconnected (Patch Cat5e in Stage tab)'}
            </div>
            <p className="text-[11px] text-slate-500">
              Operating Mode: dSnake 48kHz (Automatic rate conversion)
            </p>
          </div>

          {/* Current Show & Scene */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Active Scene</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                SCENE {sim.digital.activeSceneId}
              </span>
            </div>
            <div className="text-sm font-semibold text-amber-300">
              {currentScene?.name || 'Default Sunday Service'}
            </div>
            <p className="text-[11px] text-slate-500">
              Total Scenes: {sim.digital.scenes.length} / 300 slots available
            </p>
          </div>

          {/* Surface & Session */}
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Surface Layer</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                LAYER {sim.digital.session.layer}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {sim.digital.session.selectedMixId === 'main-lr'
                ? 'Main LR Mix Active'
                : `Sends-on-Faders: ${
                    sim.digital.mixes.find((m) => m.id === sim.digital.session.selectedMixId)?.name
                  }`}
            </div>
            <p className="text-[11px] text-slate-500">
              Selected Channel: {sim.digital.session.selectedChannelId.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>FOH Simulator Mode: Volatile offline session preserved via IndexedDB</span>
        </div>
        <span className="font-mono text-slate-500">SQ-5 V1.6.0 COMPLIANT</span>
      </div>
    </div>
  );
};
