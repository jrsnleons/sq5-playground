import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  Lock,
  Unlock,
  Zap,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Edit2,
  Check
} from 'lucide-react';

export const IOPatchScreen: React.FC = () => {
  const {
    sim,
    signalPresence,
    userRole,
    patchInputSocket,
    unpatchInputSocket,
    patchOutputSocket,
    unpatchOutputSocket,
    updateChannelName
  } = useSimulationStore();

  const isGuest = userRole === 'guest';

  const [activeCategory, setActiveCategory] = useState<'inputs' | 'outputs' | 'tielines'>('inputs');
  const [sourceBank, setSourceBank] = useState<'slink' | 'local' | 'usb'>('slink');
  const [outputDestBank, setOutputDestBank] = useState<'slink' | 'local'>('local');
  const [safeIOLocked, setSafeIOLocked] = useState<boolean>(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  // Selected row for high-visibility full-width highlighting
  const [selectedRowChId, setSelectedRowChId] = useState<string | null>('ch-2');

  // Inline channel renaming
  const [editingChId, setEditingChId] = useState<string | null>(null);
  const [editingChName, setEditingChName] = useState<string>('');

  const isDsnakeConnected = signalPresence.slinkHasSignal;

  // Sockets for the current source bank
  const getSockets = () => {
    switch (sourceBank) {
      case 'slink':
        return Array.from({ length: 24 }, (_, i) => ({
          id: `ar-in-${i + 1}`,
          index: i + 1,
          label: `SLink ${String(i + 1).padStart(2, '0')}`,
          type: 'slink' as const
        }));
      case 'local':
        return Array.from({ length: 16 }, (_, i) => ({
          id: `sq-in-${i + 1}`,
          index: i + 1,
          label: `Local ${String(i + 1).padStart(2, '0')}`,
          type: 'local' as const
        }));
      case 'usb':
        return Array.from({ length: 32 }, (_, i) => ({
          id: `usb-in-${i + 1}`,
          index: i + 1,
          label: `USB ${String(i + 1).padStart(2, '0')}`,
          type: 'usb' as const
        }));
    }
  };

  const activeSockets = getSockets();

  // Socket physical connection & signal detection
  const isSocketCabled = (socketId: string) => {
    return sim.physical.cables.some((c) => c.toPort === socketId || c.fromPort === socketId);
  };

  const isSocketCarryingSignal = (socketId: string) => {
    if (sourceBank === 'slink' && !isDsnakeConnected) return false;
    return sim.physical.cables.some(
      (c) => (c.toPort === socketId || c.fromPort === socketId) && signalPresence.cableHasSignal[c.id]
    );
  };

  const handleCellClick = (chId: string, socket: { id: string; type: 'slink' | 'local' | 'usb'; label: string }, chName: string) => {
    setSelectedRowChId(chId);
    if (isGuest) {
      setLockNotice('Input patching is locked in Guest mode. Sign in as Member or Admin to edit.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }
    if (safeIOLocked) {
      setLockNotice('Safe I/O Lock is active. Unlock in the top toolbar to modify patch.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }

    const currentPatch = sim.digital.ioPatch.inputs[chId];
    if (currentPatch?.socketId === socket.id) {
      unpatchInputSocket(chId);
    } else {
      patchInputSocket(chId, socket.type, socket.id, chName);
    }
  };

  // 1:1 Auto-Patch for visible sockets across channels
  const handleAutoPatch1to1 = () => {
    if (isGuest) {
      setLockNotice('Auto-patching is locked in Guest mode. Sign in as Member or Admin to edit.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }
    if (safeIOLocked) {
      setLockNotice('Safe I/O Lock is active. Unlock in the top toolbar to modify patch.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }

    sim.digital.channels.forEach((ch, idx) => {
      if (idx < activeSockets.length) {
        const sock = activeSockets[idx];
        patchInputSocket(ch.id, sock.type, sock.id, ch.name);
      }
    });
  };

  // Clear all input patches
  const handleUnpatchAll = () => {
    if (isGuest) {
      setLockNotice('Clearing patches is locked in Guest mode. Sign in as Member or Admin to edit.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }
    if (safeIOLocked) {
      setLockNotice('Safe I/O Lock is active. Unlock in the top toolbar to modify patch.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }

    sim.digital.channels.forEach((ch) => {
      unpatchInputSocket(ch.id);
    });
  };

  const startEditingChannel = (chId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) {
      setLockNotice('Channel renaming is locked in Guest mode. Sign in as Member or Admin to edit.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }
    setEditingChId(chId);
    setEditingChName(currentName);
  };

  const saveChannelName = (chId: string) => {
    if (isGuest) {
      setEditingChId(null);
      return;
    }
    if (editingChName.trim()) {
      updateChannelName(chId, editingChName.trim());
    }
    setEditingChId(null);
  };

  // Output Buses Available for Patching (Separated L/R for stereo mixes)
  const outputBuses: Array<{ id: string; name: string; type: 'main-lr' | 'mix' | 'matrix'; isSub?: boolean }> = [];
  outputBuses.push({ id: 'main-lr-l', name: 'Main L', type: 'main-lr' });
  outputBuses.push({ id: 'main-lr-r', name: 'Main R', type: 'main-lr' });

  sim.digital.mixes.forEach((m) => {
    if (m.stereo) {
      outputBuses.push({ id: `${m.id}-l`, name: `${m.name} L (M${m.mixNumber})`, type: 'mix' });
      outputBuses.push({ id: `${m.id}-r`, name: `${m.name} R (M${m.mixNumber})`, type: 'mix' });
    } else {
      outputBuses.push({ id: m.id, name: `${m.name} (M${m.mixNumber})`, type: 'mix' });
    }
  });

  sim.digital.matrices.forEach((mx) => {
    if (mx.stereo) {
      outputBuses.push({ id: `${mx.id}-l`, name: `${mx.name} L`, type: 'matrix' });
      outputBuses.push({ id: `${mx.id}-r`, name: `${mx.name} R`, type: 'matrix' });
    } else {
      outputBuses.push({ id: mx.id, name: mx.name, type: 'matrix' });
    }
  });

  // Output Sockets list
  const outputSockets = outputDestBank === 'slink'
    ? Array.from({ length: 12 }, (_, i) => ({
        id: `ar-out-${i + 1}`,
        num: i + 1,
        label: `AR Out ${String(i + 1).padStart(2, '0')}`,
        roleBadge: null
      }))
    : Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const roleBadge =
          num === 7 ? 'Record L' :
          num === 8 ? 'Record R' :
          num === 9 ? 'Monitor L' :
          num === 10 ? 'Monitor R' :
          num === 11 ? 'Stream L' :
          num === 12 ? 'Stream R' : null;

        return {
          id: `sq-out-${num}`,
          num,
          label: `Local Out ${String(num).padStart(2, '0')}`,
          roleBadge
        };
      });

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Top Console Command Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Category Tabs: Inputs / Outputs / Tie Lines */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
            I/O MATRIX:
          </span>
          <button
            onClick={() => setActiveCategory('inputs')}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded transition-colors ${
              activeCategory === 'inputs'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            INPUTS (48-CH)
          </button>
          <button
            onClick={() => setActiveCategory('outputs')}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded transition-colors ${
              activeCategory === 'outputs'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            OUTPUTS (12-BUS)
          </button>
          <button
            onClick={() => setActiveCategory('tielines')}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded transition-colors ${
              activeCategory === 'tielines'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            TIE LINES
          </button>
        </div>

        {/* Center: Source / Destination Sockets Selector */}
        {activeCategory === 'inputs' ? (
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono uppercase px-1.5">SOURCE:</span>
            <button
              onClick={() => setSourceBank('slink')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                sourceBank === 'slink'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SLink (AR2412 1–24)
            </button>
            <button
              onClick={() => setSourceBank('local')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                sourceBank === 'local'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Local (SQ-5 1–16)
            </button>
            <button
              onClick={() => setSourceBank('usb')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                sourceBank === 'usb'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USB-B (1–32)
            </button>
          </div>
        ) : activeCategory === 'outputs' ? (
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono uppercase px-1.5">OUTPUT PORT:</span>
            <button
              onClick={() => setOutputDestBank('local')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                outputDestBank === 'local'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SQ-5 Local Out (1–12)
            </button>
            <button
              onClick={() => setOutputDestBank('slink')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                outputDestBank === 'slink'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AR2412 SLink Out (1–12)
            </button>
          </div>
        ) : null}

        {/* Right Actions: Auto-Patch, Clear, Safe I/O */}
        <div className="flex items-center space-x-2">
          {activeCategory === 'inputs' && (
            <>
              <button
                onClick={handleAutoPatch1to1}
                disabled={isGuest}
                title={isGuest ? 'Patching locked in Guest mode' : 'Patch sockets 1-to-1 to input channels'}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                  isGuest
                    ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>1:1 Patch</span>
              </button>
              <button
                onClick={handleUnpatchAll}
                disabled={isGuest}
                title={isGuest ? 'Patching locked in Guest mode' : 'Clear all input channel assignments'}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-mono border transition-colors ${
                  isGuest
                    ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                    : 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border-slate-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}

          {/* Safe I/O Toggle (Console Safety Lock) */}
          <button
            onClick={() => setSafeIOLocked(!safeIOLocked)}
            title={safeIOLocked ? 'Safe I/O Lock is ON (Editing blocked)' : 'Safe I/O Lock is OFF (Editing enabled)'}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
              safeIOLocked
                ? 'bg-rose-950 text-rose-300 border-rose-800 shadow-[0_0_6px_#f43f5e]'
                : 'bg-slate-800 text-emerald-400 border-slate-700 hover:border-emerald-500'
            }`}
          >
            {safeIOLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{safeIOLocked ? 'SAFE I/O: ON' : 'SAFE I/O: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Lock Notice Warning Banner */}
      {lockNotice && (
        <div className="bg-amber-950/90 border-b border-amber-700 px-4 py-1.5 text-xs text-amber-200 flex items-center space-x-2 shrink-0 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{lockNotice}</span>
        </div>
      )}

      {/* dSNAKE Disconnected Warning */}
      {activeCategory === 'inputs' && sourceBank === 'slink' && !isDsnakeConnected && (
        <div className="bg-amber-950/80 border-b border-amber-800 px-4 py-2 text-xs text-amber-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>AR2412 dSNAKE connection is unlinked. Remote SLink patches are offline.</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400 font-bold">
            CONNECT CAT5E CABLE ON STAGE CANVAS TO RESTORE
          </span>
        </div>
      )}

      {/* Main Fullscreen Crosspoint Matrix Grid */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4">
        {activeCategory === 'inputs' ? (
          /* Single Continuous 48-Channel Vertical Scroll Grid */
          <div className="inline-block border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-2xl">
            {/* Header Row: Socket Columns (Sticky Top) */}
            <div className="flex bg-slate-950 sticky top-0 z-30 border-b border-slate-800 shadow-md">
              {/* Top-Left Header: Channels Column Info */}
              <div className="w-56 p-2.5 font-mono text-[11px] font-bold text-slate-300 border-r border-slate-800 shrink-0 bg-slate-950 flex items-center justify-between sticky left-0 z-40">
                <span>DEST CHANNEL (1–48)</span>
                <span className="text-slate-500 text-[9px]">{isGuest ? 'READ-ONLY' : 'DOUBLE-CLICK TO RENAME'}</span>
              </div>

              {/* Socket Headers with Live Status LEDs */}
              <div className="flex">
                {activeSockets.map((sock) => {
                  const cabled = isSocketCabled(sock.id);
                  const hasSignal = isSocketCarryingSignal(sock.id);

                  return (
                    <div
                      key={sock.id}
                      className="w-12 h-14 border-r border-slate-800 flex flex-col items-center justify-between py-1.5 shrink-0 bg-slate-950/95 group hover:bg-slate-900 transition-colors"
                    >
                      {/* Live LED Status */}
                      <div
                        className={`w-2 h-2 rounded-full transition-all ${
                          hasSignal
                            ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                            : cabled
                            ? 'bg-sky-500/60'
                            : 'bg-slate-800'
                        }`}
                        title={
                          hasSignal
                            ? `${sock.label}: Audio signal active`
                            : cabled
                            ? `${sock.label}: Cable connected (no signal)`
                            : `${sock.label}: No cable connected`
                        }
                      />

                      {/* Socket Number */}
                      <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-white">
                        {String(sock.index).padStart(2, '0')}
                      </span>

                      {/* Port Type */}
                      <span className="text-[8px] font-mono text-slate-500 uppercase">
                        {sock.type === 'usb' ? 'USB' : 'XLR'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Continuous 48-Channel Rows */}
            {sim.digital.channels.map((ch) => {
              const currentPatch = sim.digital.ioPatch.inputs[ch.id];
              const isChActive = signalPresence.channelsWithSignal[ch.id];
              const isRowSelected = selectedRowChId === ch.id;
              const isEditingThisCh = editingChId === ch.id;

              return (
                <div
                  key={ch.id}
                  onClick={() => setSelectedRowChId(ch.id)}
                  className={`flex border-b border-slate-800/80 transition-colors ${
                    isRowSelected
                      ? 'bg-sky-950/50 border-y border-sky-500/50 shadow-inner'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Sticky Channel Row Header with Inline Renaming */}
                  <div
                    className={`w-56 p-2 text-xs font-mono border-r border-slate-800 shrink-0 flex items-center justify-between sticky left-0 z-20 transition-colors ${
                      isRowSelected ? 'bg-slate-900 text-sky-300' : 'bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate flex-1 mr-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-sky-400 shrink-0">
                        {String(ch.channelNumber).padStart(2, '0')}
                      </span>
                      {ch.stereo && (
                        <span
                          className="px-1 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[8px] font-bold shrink-0"
                          title={ch.isStereoSlave ? 'Stereo Pair: Right Channel' : 'Stereo Pair: Left Channel'}
                        >
                          {ch.isStereoSlave ? 'ST-R' : 'ST-L'}
                        </span>
                      )}

                      {isEditingThisCh && !isGuest ? (
                        <div className="flex items-center space-x-1 flex-1">
                          <input
                            type="text"
                            value={editingChName}
                            onChange={(e) => setEditingChName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveChannelName(ch.id);
                              if (e.key === 'Escape') setEditingChId(null);
                            }}
                            onBlur={() => saveChannelName(ch.id)}
                            autoFocus
                            className="w-full px-1.5 py-0.5 bg-slate-900 text-white rounded border border-sky-500 text-xs font-mono focus:outline-none"
                          />
                          <button
                            onClick={() => saveChannelName(ch.id)}
                            className="text-emerald-400 hover:text-white p-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onDoubleClick={(e) => !isGuest && startEditingChannel(ch.id, ch.name, e)}
                          className={`font-semibold text-slate-200 truncate text-[11px] ${
                            isGuest ? 'cursor-default' : 'cursor-pointer hover:text-sky-300'
                          }`}
                          title={isGuest ? ch.name : 'Double-click to rename'}
                        >
                          {ch.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {!isEditingThisCh && !isGuest && (
                        <button
                          onClick={(e) => startEditingChannel(ch.id, ch.name, e)}
                          title="Rename channel"
                          className="text-slate-600 hover:text-sky-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {isChActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      )}
                    </div>
                  </div>

                  {/* Crosspoint Grid Cells */}
                  <div className="flex">
                    {activeSockets.map((sock) => {
                      const isPatched = currentPatch?.socketId === sock.id;
                      const isSlinkBlocked = sock.type === 'slink' && !isDsnakeConnected;

                      return (
                        <div
                          key={sock.id}
                          onClick={() => handleCellClick(ch.id, sock, ch.name)}
                          className={`w-12 h-10 border-r border-slate-800/60 flex items-center justify-center cursor-pointer transition-all ${
                            isPatched
                              ? isSlinkBlocked
                                ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                                : 'bg-sky-600 text-white shadow-inner font-bold'
                              : isRowSelected
                              ? 'hover:bg-sky-900/40'
                              : 'hover:bg-slate-800/60'
                          }`}
                          title={
                            isPatched
                              ? `CH ${ch.channelNumber} (${ch.name}) ◄── ${sock.label}`
                              : `Click to patch ${sock.label} to CH ${ch.channelNumber}`
                          }
                        >
                          {isPatched ? (
                            <div className="flex flex-col items-center">
                              {isSlinkBlocked ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <span className="text-[10px] font-mono font-black tracking-tighter">
                                  {String(sock.index).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-slate-800 group-hover:bg-slate-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeCategory === 'outputs' ? (
          /* Output 2D Patch Matrix with Local Out 7–12 Stream/Monitor/Record Badges */
          <div className="inline-block border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-2xl">
            {/* Output Header Row: Sockets */}
            <div className="flex bg-slate-950 sticky top-0 z-30 border-b border-slate-800">
              <div className="w-60 p-2.5 font-mono text-[10px] font-bold text-slate-400 border-r border-slate-800 shrink-0 bg-slate-950 flex items-center justify-between sticky left-0 z-40">
                <span>SOURCE BUS</span>
                <span className="text-slate-600">▼</span>
              </div>
              <div className="flex">
                {outputSockets.map((sock) => (
                  <div
                    key={sock.id}
                    className="w-24 h-16 border-r border-slate-800 flex flex-col items-center justify-center p-1 shrink-0 bg-slate-950 text-center"
                  >
                    <span className="text-[11px] font-mono font-bold text-teal-400">
                      {sock.label}
                    </span>
                    {sock.roleBadge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold mt-0.5">
                        {sock.roleBadge}
                      </span>
                    )}
                    <span className="text-[8px] font-mono text-slate-500 mt-0.5">XLR OUT</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Rows: Buses */}
            {outputBuses.map((bus) => (
              <div
                key={bus.id}
                className="flex border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors"
              >
                <div className="w-60 p-2 text-xs font-mono border-r border-slate-800 shrink-0 bg-slate-950/90 flex items-center justify-between sticky left-0 z-20">
                  <span className="font-bold text-slate-200 truncate">{bus.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {bus.type}
                  </span>
                </div>

                <div className="flex">
                  {outputSockets.map((sock) => {
                    const currentPatch = sim.digital.ioPatch.outputs[sock.id];
                    // Match either direct busId or stereo prefix
                    const isPatched =
                      currentPatch?.busId === bus.id ||
                      (bus.id === `${currentPatch?.busId}-l` && sock.num % 2 !== 0) ||
                      (bus.id === `${currentPatch?.busId}-r` && sock.num % 2 === 0);

                    return (
                      <div
                        key={sock.id}
                        onClick={() => {
                          if (isGuest) {
                            setLockNotice('Output patching is locked in Guest mode. Sign in as Member or Admin to edit.');
                            setTimeout(() => setLockNotice(null), 3000);
                            return;
                          }
                          if (safeIOLocked) {
                            setLockNotice('Safe I/O Lock is active.');
                            setTimeout(() => setLockNotice(null), 3000);
                            return;
                          }
                          if (isPatched) {
                            unpatchOutputSocket(sock.id);
                          } else {
                            patchOutputSocket(sock.id, bus.type, bus.id, bus.name);
                          }
                        }}
                        className={`w-24 h-10 border-r border-slate-800/60 flex items-center justify-center transition-all ${
                          isGuest ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isPatched
                            ? 'bg-teal-600 text-white font-bold shadow-inner'
                            : isGuest
                            ? ''
                            : 'hover:bg-slate-800/60'
                        }`}
                      >
                        {isPatched && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-mono uppercase">PATCHED</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Tie Lines View */
          <div className="max-w-2xl bg-slate-900/90 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                SQ-5 Digital Tie Lines (Point-to-Point Pass-Through)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Tie lines bypass all console input processing and DSP cores, routing physical input sockets directly to digital output ports or option cards (e.g. SLink to USB-B or Local In to Dante).
            </p>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tie Line 01:</span>
                <span className="text-indigo-400">AR-IN 01 ──► USB-OUT 01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tie Line 02:</span>
                <span className="text-indigo-400">AR-IN 02 ──► USB-OUT 02</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tie Line 03:</span>
                <span className="text-slate-600">Unassigned</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
