import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { CloudSyncBadge } from './CloudSyncBadge';

export const TopBar: React.FC = () => {
  const {
    sim,
    validationNotices,
    setNoticesModalOpen
  } = useSimulationStore();

  const warningCount = validationNotices.filter((n) => n.type === 'warning').length;
  const errorCount = validationNotices.filter((n) => n.type === 'error').length;
  const currentScene = sim.digital.scenes.find((s) => s.id === sim.digital.activeSceneId);

  return (
    <header className="h-11 bg-black border-b border-white/[0.08] flex items-center justify-between px-3.5 shrink-0 z-30 select-none">
      {/* Brand & Rig Mode */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 py-1">
          <div className="w-6 h-6 rounded-md bg-white/10 border border-white/10 flex items-center justify-center text-zinc-100">
            <Sliders className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold tracking-wider text-xs text-zinc-100 font-mono">SQ-5</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/[0.08]">
            {sim.entryMode === 'church-preset' ? 'Church Rig' : 'Scratch'}
          </span>
        </div>

        {/* Current Scene Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-white/[0.06] font-mono">
          <span className="text-zinc-500 text-[10px] uppercase">SCENE:</span>
          <span className="font-medium text-zinc-200">
            {currentScene ? `${currentScene.id}: ${currentScene.name}` : '1: Sunday Service'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Validation Notices Pill */}
        {(warningCount > 0 || errorCount > 0) && (
          <button
            onClick={() => setNoticesModalOpen(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs border font-mono transition-colors ${
              errorCount > 0
                ? 'bg-red-950/50 text-red-300 border-red-800 hover:bg-red-900/60'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${errorCount > 0 ? 'text-red-400' : 'text-amber-400'}`} />
            <span>
              {errorCount > 0 && `${errorCount} Errors `}
              {warningCount > 0 && `${warningCount} Warnings`}
            </span>
          </button>
        )}

        {/* Profile Picture / Account Avatar */}
        <CloudSyncBadge />
      </div>
    </header>
  );
};

