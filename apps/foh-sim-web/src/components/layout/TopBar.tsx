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
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0 z-30 select-none">
      {/* Brand & Mode */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-bold tracking-wide text-xs text-white font-mono">SQ-5 SIMULATOR</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            {sim.entryMode === 'church-preset' ? 'Church Rig' : 'Scratch'}
          </span>
        </div>

        {/* Current Scene Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 font-mono">
          <span className="text-slate-400 text-[11px]">SCENE:</span>
          <span className="font-medium text-amber-300">
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
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs border font-medium transition-all ${
              errorCount > 0
                ? 'bg-rose-950 text-rose-200 border-rose-600 animate-pulse'
                : 'bg-amber-950/80 text-amber-200 border-amber-600 hover:bg-amber-900/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
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
