import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Sliders,
  FolderOpen,
  Award,
  ShieldCheck
} from 'lucide-react';
import { ConfirmDialogModal } from '../modals/ConfirmDialogModal';
import { CloudSyncBadge } from './CloudSyncBadge';

export const TopBar: React.FC = () => {
  const {
    sim,
    signalPresence,
    validationNotices,
    setNoticesModalOpen,
    setShowEntryModal,
    resetCurrentPreset,
    userRole,
    setSimulationsModalOpen,
    setAdminCreateModalOpen
  } = useSimulationStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isDsnakeConnected = signalPresence.slinkHasSignal;
  const warningCount = validationNotices.filter((n) => n.type === 'warning').length;
  const errorCount = validationNotices.filter((n) => n.type === 'error').length;
  const currentScene = sim.digital.scenes.find((s) => s.id === sim.digital.activeSceneId);

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0 z-30 select-none">
      {/* Brand & Mode */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-bold tracking-wide text-xs text-white">SQ-5 SIMULATOR</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            {sim.entryMode === 'church-preset' ? 'Church Rig' : 'Scratch'}
          </span>
        </div>

        {/* Current Scene Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
          <span className="text-slate-400 text-[11px]">SCENE:</span>
          <span className="font-medium text-amber-300">
            {currentScene ? `${currentScene.id}: ${currentScene.name}` : '1: Sunday Service'}
          </span>
        </div>
      </div>

      {/* Center Hardware / Network Status Pill */}
      <div className="hidden md:flex items-center space-x-2">
        <div
          className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            isDsnakeConnected
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
              : 'bg-rose-950/80 text-rose-300 border-rose-700'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isDsnakeConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isDsnakeConnected ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            ></span>
          </span>
          <span className="font-mono text-[11px] font-semibold">
            SLink: {isDsnakeConnected ? 'AR2412 CONNECTED (dSnake 48kHz)' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
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

        {/* Challenges and Create Sim buttons hidden for now as requested */}

        {/* Cloud Sync & Role Badge */}
        <CloudSyncBadge />

        {/* Presets Button */}
        <button
          onClick={() => setShowEntryModal(true)}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Presets</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          title="Reset Preset"
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <ConfirmDialogModal
        isOpen={showResetConfirm}
        title="Reset Configuration"
        message="Are you sure you want to reset the current rig and mixer settings back to the preset defaults? All unsaved routing and patch changes will be lost."
        confirmLabel="Reset Defaults"
        isDestructive={true}
        onConfirm={resetCurrentPreset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </header>
  );
};
