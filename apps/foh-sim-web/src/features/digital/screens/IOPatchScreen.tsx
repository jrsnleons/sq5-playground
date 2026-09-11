import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  Lock,
  Unlock,
  Zap,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  Plug
} from 'lucide-react';

export const IOPatchScreen: React.FC = () => {
  const {
    sim,
    signalPresence,
    patchInputSocket,
    unpatchInputSocket,
    patchOutputSocket,
    unpatchOutputSocket
  } = useSimulationStore();

  const [activeCategory, setActiveCategory] = useState<'inputs' | 'outputs' | 'tielines'>('inputs');
  const [sourceBank, setSourceBank] = useState<'slink' | 'local' | 'usb'>('slink');
  const [channelBank, setChannelBank] = useState<number>(0); // 0 = 1-16, 1 = 17-32, 2 = 33-48
  const [outputDestBank, setOutputDestBank] = useState<'slink' | 'local'>('slink');
  const [safeIOLocked, setSafeIOLocked] = useState<boolean>(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  const isDsnakeConnected = signalPresence.slinkHasSignal;

  // Channels for the current active bank (16 channels per bank)
  const bankChannels = sim.digital.channels.slice(channelBank * 16, (channelBank + 1) * 16);

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

  // 1:1 Auto-Patch for visible bank
  const handleAutoPatch1to1 = () => {
    if (safeIOLocked) {
      setLockNotice('Safe I/O Lock is active. Unlock in the top toolbar to modify patch.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }

    bankChannels.forEach((ch, idx) => {
      if (idx < activeSockets.length) {
        const sock = activeSockets[idx];
        patchInputSocket(ch.id, sock.type, sock.id, ch.name);
      }
    });
  };

  // Clear visible bank
  const handleUnpatchBank = () => {
    if (safeIOLocked) {
      setLockNotice('Safe I/O Lock is active. Unlock in the top toolbar to modify patch.');
      setTimeout(() => setLockNotice(null), 3000);
      return;
    }

    bankChannels.forEach((ch) => {
      unpatchInputSocket(ch.id);
    });
  };

  // Output Buses Available for Patching
  const outputBuses: Array<{ id: string; name: string; type: 'main-lr' | 'mix' | 'matrix' }> = [
    { id: 'main-lr', name: 'Main LR', type: 'main-lr' },
    ...sim.digital.mixes.map((m) => ({ id: m.id, name: m.name, type: 'mix' as const })),
    ...sim.digital.matrices.map((mx) => ({ id: mx.id, name: mx.name, type: 'matrix' as const }))
  ];

  const outputSockets = outputDestBank === 'slink'
    ? Array.from({ length: 12 }, (_, i) => ({ id: `ar-out-${i + 1}`, label: `AR Out ${i + 1}` }))
    : Array.from({ length: 12 }, (_, i) => ({ id: `sq-out-${i + 1}`, label: `SQ Out ${i + 1}` }));

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Top Console Command Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Category Tabs: Inputs / Outputs / Tie Lines */}
        <div className="flex items-center space-x-1.5">
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
            INPUTS
          </button>
          <button
            onClick={() => setActiveCategory('outputs')}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded transition-colors ${
              activeCategory === 'outputs'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            OUTPUTS
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

        {/* Center: Source Bank Selectors */}
        {activeCategory === 'inputs' && (
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono uppercase px-1.5">SOURCE:</span>
            <button
              onClick={() => setSourceBank('slink')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
                sourceBank === 'slink'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SLink (AR2412)
            </button>
            <button
              onClick={() => setSourceBank('local')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
                sourceBank === 'local'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Local (SQ-5)
            </button>
            <button
              onClick={() => setSourceBank('usb')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
                sourceBank === 'usb'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USB-B
            </button>
          </div>
        )}

        {/* Right Actions: Auto-Patch, Unpatch, Safe I/O */}
        <div className="flex items-center space-x-2">
          {activeCategory === 'inputs' && (
            <>
              <button
                onClick={handleAutoPatch1to1}
                title="Patch sockets 1-to-1 to current channel bank"
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-mono font-bold border border-slate-700 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>1:1 Patch</span>
              </button>
              <button
                onClick={handleUnpatchBank}
                title="Clear all assignments in visible channel bank"
                className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs font-mono border border-slate-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Bank</span>
              </button>
            </>
          )}

          {/* Safe I/O Toggle (Console Safety Lock) */}
          <button
            onClick={() => setSafeIOLocked(!safeIOLocked)}
            title={safeIOLocked ? 'Safe I/O Lock is ON (Changes blocked)' : 'Safe I/O Lock is OFF (Editing enabled)'}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border ${
              safeIOLocked
                ? 'bg-rose-950 text-rose-300 border-rose-800'
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
            <span>AR2412 dSNAKE connection is unlinked. SLink patches are offline.</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400">CONNECT CAT5E ON STAGE CANVAS TO RESTORE</span>
        </div>
      )}

      {/* Secondary Sub-Bar: Channel Banks for Inputs */}
      {activeCategory === 'inputs' && (
        <div className="h-9 bg-slate-900/80 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">DESTINATION BANK:</span>
            {[
              { id: 0, label: 'CH 01 – 16' },
              { id: 1, label: 'CH 17 – 32' },
              { id: 2, label: 'CH 33 – 48' }
            ].map((bank) => (
              <button
                key={bank.id}
                onClick={() => setChannelBank(bank.id)}
                className={`px-3 py-0.5 text-xs font-mono font-bold rounded ${
                  channelBank === bank.id
                    ? 'bg-slate-800 text-sky-400 border border-sky-600/60'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {bank.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>Signal Active</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span>Unplugged</span>
            </div>
          </div>
        </div>
      )}

      {/* OUTPUTS Secondary Bar */}
      {activeCategory === 'outputs' && (
        <div className="h-9 bg-slate-900/80 border-b border-slate-800 px-4 flex items-center space-x-2 shrink-0">
          <span className="text-[10px] font-mono uppercase text-slate-400">DESTINATION SOCKETS:</span>
          <button
            onClick={() => setOutputDestBank('slink')}
            className={`px-3 py-0.5 text-xs font-mono font-bold rounded ${
              outputDestBank === 'slink'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            AR2412 Out (1–12)
          </button>
          <button
            onClick={() => setOutputDestBank('local')}
            className={`px-3 py-0.5 text-xs font-mono font-bold rounded ${
              outputDestBank === 'local'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            SQ-5 Local Out (1–12)
          </button>
        </div>
      )}

      {/* Main 2D Crosspoint Matrix Grid */}
      <div className="flex-1 overflow-auto p-4">
        {activeCategory === 'inputs' ? (
          <div className="inline-block border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-2xl">
            {/* Header Row: Socket Columns */}
            <div className="flex bg-slate-950 sticky top-0 z-20 border-b border-slate-800">
              {/* Top-Left Corner Box */}
              <div className="w-44 p-2.5 font-mono text-[10px] font-bold text-slate-400 border-r border-slate-800 shrink-0 bg-slate-950 flex items-center justify-between">
                <span>DEST CHANNEL</span>
                <span className="text-slate-600">▼</span>
              </div>

              {/* Socket Column Headers with Live LEDs */}
              <div className="flex">
                {activeSockets.map((sock) => {
                  const cabled = isSocketCabled(sock.id);
                  const hasSignal = isSocketCarryingSignal(sock.id);

                  return (
                    <div
                      key={sock.id}
                      className="w-12 h-14 border-r border-slate-800 flex flex-col items-center justify-between py-1.5 shrink-0 bg-slate-950/90 group hover:bg-slate-900 transition-colors"
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

            {/* Matrix Rows (Channels) */}
            {bankChannels.map((ch) => {
              const currentPatch = sim.digital.ioPatch.inputs[ch.id];
              const isChActive = signalPresence.channelsWithSignal[ch.id];

              return (
                <div
                  key={ch.id}
                  className="flex border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Channel Row Header */}
                  <div className="w-44 p-2 text-xs font-mono border-r border-slate-800 shrink-0 bg-slate-950/80 flex items-center justify-between sticky left-0 z-10">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-sky-400 shrink-0">
                        {String(ch.channelNumber).padStart(2, '0')}
                      </span>
                      <span className="font-semibold text-slate-200 truncate text-[11px]" title={ch.name}>
                        {ch.name}
                      </span>
                    </div>
                    {isChActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_4px_#34d399]" />
                    )}
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
          /* Outputs 2D Patch Matrix */
          <div className="inline-block border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-2xl">
            {/* Output Header Row: Output Sockets */}
            <div className="flex bg-slate-950 sticky top-0 z-20 border-b border-slate-800">
              <div className="w-48 p-2.5 font-mono text-[10px] font-bold text-slate-400 border-r border-slate-800 shrink-0 bg-slate-950 flex items-center justify-between">
                <span>SOURCE BUS</span>
                <span className="text-slate-600">▼</span>
              </div>
              <div className="flex">
                {outputSockets.map((sock) => (
                  <div
                    key={sock.id}
                    className="w-16 h-12 border-r border-slate-800 flex flex-col items-center justify-center shrink-0 bg-slate-950 text-center"
                  >
                    <span className="text-[11px] font-mono font-bold text-teal-400">
                      {sock.label}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">XLR OUT</span>
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
                <div className="w-48 p-2 text-xs font-mono border-r border-slate-800 shrink-0 bg-slate-950/80 flex items-center justify-between sticky left-0 z-10">
                  <span className="font-bold text-slate-200 truncate">{bus.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {bus.type}
                  </span>
                </div>

                <div className="flex">
                  {outputSockets.map((sock) => {
                    const currentPatch = sim.digital.ioPatch.outputs[sock.id];
                    const isPatched = currentPatch?.busId === bus.id;

                    return (
                      <div
                        key={sock.id}
                        onClick={() => {
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
                        className={`w-16 h-9 border-r border-slate-800/60 flex items-center justify-center cursor-pointer transition-all ${
                          isPatched
                            ? 'bg-teal-600 text-white font-bold shadow-inner'
                            : 'hover:bg-slate-800/60'
                        }`}
                      >
                        {isPatched && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
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

