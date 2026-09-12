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
    <div className="w-full h-full bg-black flex flex-col overflow-hidden select-none font-sans text-neutral-100">
      {/* Top Console Command Header */}
      <div className="h-12 bg-[#0A0A0A] border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0">
        {/* Category Tabs: Inputs / Outputs / Tie Lines */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono uppercase text-neutral-400 font-medium mr-1">
            I/O MATRIX:
          </span>
          <div className="p-0.5 bg-black rounded-lg border border-white/[0.08] flex items-center">
            <button
              onClick={() => setActiveCategory('inputs')}
              className={`px-3 py-1 text-xs font-medium font-mono rounded-md transition-colors ${
                activeCategory === 'inputs'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              INPUTS (48-CH)
            </button>
            <button
              onClick={() => setActiveCategory('outputs')}
              className={`px-3 py-1 text-xs font-medium font-mono rounded-md transition-colors ${
                activeCategory === 'outputs'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              OUTPUTS (12-BUS)
            </button>
            <button
              onClick={() => setActiveCategory('tielines')}
              className={`px-3 py-1 text-xs font-medium font-mono rounded-md transition-colors ${
                activeCategory === 'tielines'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              TIE LINES
            </button>
          </div>
        </div>

        {/* Center: Source / Destination Sockets Selector */}
        {activeCategory === 'inputs' ? (
          <div className="flex items-center space-x-1 bg-black p-0.5 rounded-lg border border-white/[0.08]">
            <span className="text-[9px] text-neutral-400 font-mono uppercase px-1.5 font-medium">SOURCE:</span>
            <button
              onClick={() => setSourceBank('slink')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                sourceBank === 'slink'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              SLink (AR2412 1–24)
            </button>
            <button
              onClick={() => setSourceBank('local')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                sourceBank === 'local'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Local (SQ-5 1–16)
            </button>
            <button
              onClick={() => setSourceBank('usb')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                sourceBank === 'usb'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              USB-B (1–32)
            </button>
          </div>
        ) : activeCategory === 'outputs' ? (
          <div className="flex items-center space-x-1 bg-black p-0.5 rounded-lg border border-white/[0.08]">
            <span className="text-[9px] text-neutral-400 font-mono uppercase px-1.5 font-medium">OUTPUT PORT:</span>
            <button
              onClick={() => setOutputDestBank('local')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                outputDestBank === 'local'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              SQ-5 Local Out (1–12)
            </button>
            <button
              onClick={() => setOutputDestBank('slink')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                outputDestBank === 'slink'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
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
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                  isGuest
                    ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border-white/[0.04] text-neutral-500'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border-white/[0.08]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>1:1 Patch</span>
              </button>
              <button
                onClick={handleUnpatchAll}
                disabled={isGuest}
                title={isGuest ? 'Patching locked in Guest mode' : 'Clear all input channel assignments'}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                  isGuest
                    ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border-white/[0.04] text-neutral-500'
                    : 'bg-white/[0.04] hover:bg-red-500/10 text-neutral-400 hover:text-red-300 border-white/[0.08]'
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
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
              safeIOLocked
                ? 'bg-red-500/10 text-red-300 border-red-500/20'
                : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:border-white/20'
            }`}
          >
            {safeIOLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{safeIOLocked ? 'SAFE I/O: ON' : 'SAFE I/O: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Lock Notice Warning Banner */}
      {lockNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200 flex items-center space-x-2 shrink-0 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">{lockNotice}</span>
        </div>
      )}

      {/* dSNAKE Disconnected Warning */}
      {activeCategory === 'inputs' && sourceBank === 'slink' && !isDsnakeConnected && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>AR2412 dSNAKE connection is unlinked. Remote SLink patches are offline.</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400 font-medium">
            CONNECT CAT5E CABLE ON STAGE CANVAS TO RESTORE
          </span>
        </div>
      )}

      {/* Main Fullscreen Crosspoint Matrix Grid */}
      <div className="flex-1 overflow-auto bg-black p-4">
        {activeCategory === 'inputs' ? (
          /* Single Continuous 48-Channel Vertical Scroll Grid */
          <div className="inline-block border border-white/[0.08] rounded-xl overflow-hidden bg-[#0A0A0A] shadow-2xl">
            {/* Header Row: Socket Columns (Sticky Top) */}
            <div className="flex bg-black sticky top-0 z-30 border-b border-white/[0.08]">
              {/* Top-Left Header: Channels Column Info */}
              <div className="w-56 p-2.5 font-mono text-[10px] font-medium text-neutral-400 border-r border-white/[0.08] shrink-0 bg-black flex items-center justify-between sticky left-0 z-40">
                <span>DEST CHANNEL (1–48)</span>
                <span className="text-neutral-500 text-[9px]">{isGuest ? 'READ-ONLY' : 'DOUBLE-CLICK TO RENAME'}</span>
              </div>

              {/* Socket Headers with Live Status LEDs */}
              <div className="flex">
                {activeSockets.map((sock) => {
                  const cabled = isSocketCabled(sock.id);
                  const hasSignal = isSocketCarryingSignal(sock.id);

                  return (
                    <div
                      key={sock.id}
                      className="w-12 h-14 border-r border-white/[0.06] flex flex-col items-center justify-between py-1.5 shrink-0 bg-black group hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Live LED Status */}
                      <div
                        className={`w-2 h-2 rounded-full transition-all ${
                          hasSignal
                            ? 'bg-emerald-400'
                            : cabled
                            ? 'bg-white/40'
                            : 'bg-neutral-800'
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
                      <span className="text-xs font-mono font-medium text-neutral-200 group-hover:text-white">
                        {String(sock.index).padStart(2, '0')}
                      </span>

                      {/* Port Type */}
                      <span className="text-[8px] font-mono text-neutral-500 uppercase">
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
                  className={`flex border-b border-white/[0.04] transition-colors ${
                    isRowSelected
                      ? 'bg-white/[0.05]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Sticky Channel Row Header with Inline Renaming */}
                  <div
                    className={`w-56 p-2 text-xs font-mono border-r border-white/[0.06] shrink-0 flex items-center justify-between sticky left-0 z-20 transition-colors ${
                      isRowSelected ? 'bg-[#141414] text-white' : 'bg-[#0A0A0A]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate flex-1 mr-1">
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-neutral-300 shrink-0">
                        {String(ch.channelNumber).padStart(2, '0')}
                      </span>
                      {ch.stereo && (
                        <span
                          className="px-1 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.08] text-[8px] font-mono shrink-0"
                          title={ch.isStereoSlave ? 'Stereo Pair: Right Channel' : 'Stereo Pair: Left Channel'}
                        >
                          {ch.isStereoSlave ? 'ST-R' : 'ST-L'}
                        </span>
                      )}

                      {/* Channel Name with Double Click Renaming */}
                      {isEditingThisCh ? (
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
                            className="bg-black text-white text-xs px-1.5 py-0.5 rounded border border-white/40 focus:outline-none w-28 font-mono"
                            autoFocus
                          />
                          <button
                            onClick={() => saveChannelName(ch.id)}
                            className="text-emerald-400 hover:text-emerald-300 p-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onDoubleClick={(e) => !isGuest && startEditingChannel(ch.id, ch.name, e)}
                          className={`font-medium text-neutral-200 truncate text-[11px] ${
                            isGuest ? 'cursor-default' : 'cursor-pointer hover:text-white'
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
                          className="text-neutral-500 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {isChActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
                          className={`w-12 h-10 border-r border-white/[0.04] flex items-center justify-center cursor-pointer transition-all ${
                            isPatched
                              ? isSlinkBlocked
                                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                                : 'bg-white text-black font-semibold'
                              : isRowSelected
                              ? 'hover:bg-white/[0.08]'
                              : 'hover:bg-white/[0.04]'
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
                                <span className="text-[10px] font-mono font-bold tracking-tight">
                                  {String(sock.index).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-neutral-800 group-hover:bg-neutral-600" />
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
          <div className="inline-block border border-white/[0.08] rounded-xl overflow-hidden bg-[#0A0A0A] shadow-2xl">
            {/* Output Header Row: Sockets */}
            <div className="flex bg-black sticky top-0 z-30 border-b border-white/[0.08]">
              <div className="w-60 p-2.5 font-mono text-[10px] font-medium text-neutral-400 border-r border-white/[0.08] shrink-0 bg-black flex items-center justify-between sticky left-0 z-40">
                <span>SOURCE BUS</span>
                <span className="text-neutral-500">▼</span>
              </div>
              <div className="flex">
                {outputSockets.map((sock) => (
                  <div
                    key={sock.id}
                    className="w-24 h-16 border-r border-white/[0.06] flex flex-col items-center justify-center p-1 shrink-0 bg-black text-center"
                  >
                    <span className="text-[11px] font-mono font-medium text-white">
                      {sock.label}
                    </span>
                    {sock.roleBadge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.08] font-medium mt-0.5">
                        {sock.roleBadge}
                      </span>
                    )}
                    <span className="text-[8px] font-mono text-neutral-500 mt-0.5">XLR OUT</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Rows: Buses */}
            {outputBuses.map((bus) => (
              <div
                key={bus.id}
                className="flex border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-60 p-2 text-xs font-mono border-r border-white/[0.06] shrink-0 bg-[#0A0A0A] flex items-center justify-between sticky left-0 z-20">
                  <span className="font-medium text-neutral-200 truncate">{bus.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-400 font-mono">
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
                        className={`w-24 h-10 border-r border-white/[0.04] flex items-center justify-center transition-all ${
                          isGuest ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isPatched
                            ? 'bg-white text-black font-semibold'
                            : isGuest
                            ? ''
                            : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        {isPatched && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-black" />
                            <span className="text-[10px] font-mono uppercase font-semibold">PATCHED</span>
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
          <div className="max-w-2xl bg-[#0A0A0A] rounded-xl border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3">
              <ArrowRightLeft className="w-4 h-4 text-white" />
              <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
                SQ-5 Digital Tie Lines (Point-to-Point Pass-Through)
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Tie lines bypass all console input processing and DSP cores, routing physical input sockets directly to digital output ports or option cards (e.g. SLink to USB-B or Local In to Dante).
            </p>
            <div className="p-4 bg-black rounded-lg border border-white/[0.06] font-mono text-xs text-neutral-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Tie Line 01:</span>
                <span className="text-neutral-200">AR-IN 01 → USB-OUT 01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tie Line 02:</span>
                <span className="text-neutral-200">AR-IN 02 → USB-OUT 02</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tie Line 03:</span>
                <span className="text-neutral-600">Unassigned</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
