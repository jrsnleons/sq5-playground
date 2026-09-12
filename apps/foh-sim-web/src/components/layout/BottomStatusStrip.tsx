import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { Volume2 } from 'lucide-react';

export const BottomStatusStrip: React.FC = () => {
  const { sim } = useSimulationStore();
  const selectedCh = sim.digital.channels.find((c) => c.id === sim.digital.session.selectedChannelId);
  const selectedMix = sim.digital.session.selectedMixId === 'main-lr'
    ? 'Main LR'
    : sim.digital.mixes.find((m) => m.id === sim.digital.session.selectedMixId)?.name || 'Mix';

  return (
    <footer className="h-7 bg-black border-t border-white/[0.08] px-3.5 flex items-center justify-between text-[11px] text-zinc-400 select-none z-20 shrink-0 font-mono">
      <div className="flex items-center space-x-3.5">
        {/* Selected Channel Indicator */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="text-zinc-500 text-[10px] uppercase">SEL:</span>
          {selectedCh ? (
            <span className="font-semibold text-zinc-100 truncate max-w-[120px] sm:max-w-[200px] text-xs">
              CH {selectedCh.channelNumber}: {selectedCh.name}
            </span>
          ) : (
            <span className="text-zinc-600">None</span>
          )}
        </div>

        <span className="text-zinc-800">/</span>

        {/* Selected Mix / Master Target */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-zinc-500 text-[10px] uppercase">TARGET:</span>
          <span className="font-medium text-amber-300/90 text-xs">{selectedMix}</span>
        </div>

        <span className="text-zinc-800">/</span>

        {/* Current Layer */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-zinc-500 text-[10px] uppercase">LAYER:</span>
          <span className="text-zinc-100 font-bold text-xs">{sim.digital.session.layer}</span>
        </div>
      </div>

      {/* Clean System Telemetry (Glossary Clutter Purged) */}
      <div className="flex items-center space-x-3 text-[10px]">
        <div className="flex items-center space-x-1.5 text-zinc-400">
          <Volume2 className="w-3 h-3 text-zinc-500" />
          <span>PAFL: {sim.digital.session.geqFlipActive ? 'GEQ FLIP' : 'READY'}</span>
        </div>
        <span className="text-zinc-800">|</span>
        <div className="flex items-center space-x-1.5 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
          <span>96kHz ENGINE</span>
        </div>
      </div>
    </footer>
  );
};

