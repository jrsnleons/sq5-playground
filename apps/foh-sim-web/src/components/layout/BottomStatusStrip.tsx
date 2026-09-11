import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { Info, Volume2 } from 'lucide-react';

export const BottomStatusStrip: React.FC = () => {
  const { sim, signalPresence } = useSimulationStore();
  const selectedCh = sim.digital.channels.find((c) => c.id === sim.digital.session.selectedChannelId);
  const selectedMix = sim.digital.session.selectedMixId === 'main-lr'
    ? 'Main LR'
    : sim.digital.mixes.find((m) => m.id === sim.digital.session.selectedMixId)?.name || 'Mix';

  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-20 shrink-0">
      <div className="flex items-center space-x-4">
        {/* Selected Channel Indicator */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-mono">SEL:</span>
          {selectedCh ? (
            <span className="font-semibold text-slate-100">
              CH {selectedCh.channelNumber} — {selectedCh.name}
            </span>
          ) : (
            <span className="text-slate-400">None</span>
          )}
        </div>

        {/* Selected Mix / Master Target */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-mono">TARGET:</span>
          <span className="font-semibold text-amber-300">{selectedMix}</span>
        </div>

        {/* Current Layer */}
        <div className="flex items-center space-x-1 font-mono">
          <span className="text-slate-400">LAYER:</span>
          <span className="text-sky-400 font-bold">{sim.digital.session.layer}</span>
        </div>
      </div>

      {/* Audio Glossary Quick Tooltip Terms */}
      <div className="hidden md:flex items-center space-x-3 text-slate-300 text-[11px]">
        <span
          title="dSNAKE: Allen & Heath proprietary protocol transmitting 40 in / 20 out uncompressed 48 kHz digital audio over standard Cat5e Ethernet cable up to 100m."
          className="hover:text-white cursor-help underline decoration-dotted decoration-slate-500"
        >
          dSNAKE 48kHz
        </span>
        <span>•</span>
        <span
          title="Pre-fade: Audio tapped before the channel fader, so adjustments to the FOH fader do not alter the musician's IEM mix level."
          className="hover:text-white cursor-help underline decoration-dotted decoration-slate-500"
        >
          Pre-fade IEM
        </span>
        <span>•</span>
        <span
          title="DCA (Digitally Controlled Amplifier): Controls the combined level of assigned channels without summing them into a separate audio bus."
          className="hover:text-white cursor-help underline decoration-dotted decoration-slate-500"
        >
          8 DCAs Active
        </span>
        <span>•</span>
        <span
          title="PEQ: 4-band parametric equalizer with bell, shelf, and filter modes."
          className="hover:text-white cursor-help underline decoration-dotted decoration-slate-500"
        >
          4-Band PEQ
        </span>
      </div>

      {/* System stats */}
      <div className="flex items-center space-x-3 font-mono text-[10px]">
        <div className="flex items-center space-x-1">
          <Volume2 className="w-3 h-3 text-slate-300" />
          <span className="text-slate-300">PAFL: {sim.digital.session.geqFlipActive ? 'GEQ FLIP' : 'READY'}</span>
        </div>
        <span className="text-slate-400">|</span>
        <span className="text-emerald-400">96kHz FPGA CORE</span>
      </div>
    </footer>
  );
};
