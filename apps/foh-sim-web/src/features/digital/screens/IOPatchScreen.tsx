import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';

export const IOPatchScreen: React.FC = () => {
  const {
    sim,
    signalPresence,
    patchInputSocket,
    unpatchInputSocket
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'inputs' | 'outputs'>('inputs');
  const [selectedSourceType, setSelectedSourceType] = useState<'slink' | 'local'>('slink');
  const isDsnakeConnected = signalPresence.slinkHasSignal;

  // Build Sockets List
  const slinkSockets = Array.from({ length: 24 }, (_, i) => ({
    id: `ar-in-${i + 1}`,
    label: `SLink ${i + 1}`,
    sourceType: 'slink' as const
  }));

  const localSockets = Array.from({ length: 16 }, (_, i) => ({
    id: `sq-in-${i + 1}`,
    label: `Local ${i + 1}`,
    sourceType: 'local' as const
  }));

  const activeSockets = selectedSourceType === 'slink' ? slinkSockets : localSockets;
  const channels = sim.digital.channels;

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Top Controls Bar */}
      <div className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('inputs')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'inputs' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inputs → Channels
          </button>
          <button
            onClick={() => setActiveTab('outputs')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'outputs' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Outputs → Sockets
          </button>
        </div>

        {activeTab === 'inputs' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">SOURCE:</span>
            <button
              onClick={() => setSelectedSourceType('slink')}
              className={`px-2.5 py-1 text-xs rounded font-mono ${
                selectedSourceType === 'slink'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              AR2412 (SLink)
            </button>
            <button
              onClick={() => setSelectedSourceType('local')}
              className={`px-2.5 py-1 text-xs rounded font-mono ${
                selectedSourceType === 'local'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              SQ Local In
            </button>
          </div>
        )}
      </div>

      {/* Disconnection Banner if dSNAKE is unplugged */}
      {selectedSourceType === 'slink' && !isDsnakeConnected && (
        <div className="bg-amber-950/80 border-b border-amber-800 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <span>⚠️ AR2412 dSNAKE connection is unlinked. SLink patches are rendered as unavailable (striped).</span>
          <span className="font-mono text-[10px] text-amber-400">STAGE TAB: PLUG CAT5E TO RESTORE</span>
        </div>
      )}

      {/* Main Virtualized Matrix Area */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'inputs' ? (
          <div className="min-w-[900px] border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
            {/* Header Row: Channels */}
            <div className="flex bg-slate-950 sticky top-0 z-10 border-b border-slate-800">
              <div className="w-32 p-2 font-mono text-[11px] font-bold text-slate-400 border-r border-slate-800 shrink-0 bg-slate-950">
                PHYSICAL SOCKET
              </div>
              <div className="flex overflow-x-auto">
                {channels.slice(0, 32).map((ch) => (
                  <div
                    key={ch.id}
                    className="w-20 p-1.5 text-center border-r border-slate-800 shrink-0"
                  >
                    <div className="text-[9px] font-mono text-slate-400">CH {ch.channelNumber}</div>
                    <div className="text-[10px] font-bold text-slate-200 truncate" title={ch.name}>
                      {ch.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Socket Rows */}
            {activeSockets.map((sock) => {
              const isSlinkUnavailable = sock.sourceType === 'slink' && !isDsnakeConnected;

              return (
                <div
                  key={sock.id}
                  className={`flex border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors ${
                    isSlinkUnavailable ? 'opacity-50 bg-slate-950/40' : ''
                  }`}
                >
                  {/* Socket Label */}
                  <div className="w-32 p-2 text-xs font-mono font-bold text-slate-300 border-r border-slate-800 shrink-0 bg-slate-900/90 flex items-center justify-between">
                    <span>{sock.label}</span>
                    <span className="text-[9px] text-slate-500 font-normal">XLR</span>
                  </div>

                  {/* Channel Cells */}
                  <div className="flex">
                    {channels.slice(0, 32).map((ch) => {
                      const currentPatch = sim.digital.ioPatch.inputs[ch.id];
                      const isPatched = currentPatch?.socketId === sock.id;

                      return (
                        <div
                          key={ch.id}
                          onClick={() => {
                            if (isPatched) {
                              unpatchInputSocket(ch.id);
                            } else {
                              patchInputSocket(ch.id, sock.sourceType, sock.id, ch.name);
                            }
                          }}
                          className={`w-20 h-9 border-r border-slate-800/60 flex items-center justify-center cursor-pointer transition-all ${
                            isPatched
                              ? isSlinkUnavailable
                                ? 'bg-amber-950/60 text-amber-400 border-amber-600'
                                : 'bg-sky-600/90 text-white shadow-inner font-bold'
                              : 'hover:bg-slate-800'
                          }`}
                        >
                          {isPatched && (
                            <span className="text-xs font-mono font-black">
                              {isSlinkUnavailable ? '⚠' : '●'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Output Patches View */
          <div className="min-w-[800px] border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60 p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase font-mono mb-2">
              Output Routing Destinations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AR2412 Outputs */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-teal-400 block border-b border-slate-800 pb-1">
                  AR2412 STAGEBOX OUTPUTS (1–12)
                </span>
                {Array.from({ length: 12 }, (_, i) => {
                  const outId = `ar-out-${i + 1}`;
                  const patch = sim.digital.ioPatch.outputs[outId];
                  return (
                    <div key={outId} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 font-mono">
                      <span className="text-slate-400">AR Out {i + 1}:</span>
                      <span className="font-semibold text-amber-300">
                        {patch ? `${patch.label} (${patch.busId})` : 'Unassigned'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* SQ-5 Local Outputs */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-sky-400 block border-b border-slate-800 pb-1">
                  SQ-5 LOCAL OUTPUTS (1–12)
                </span>
                {Array.from({ length: 12 }, (_, i) => {
                  const outId = `sq-out-${i + 1}`;
                  const patch = sim.digital.ioPatch.outputs[outId];
                  return (
                    <div key={outId} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 font-mono">
                      <span className="text-slate-400">SQ Out {i + 1}:</span>
                      <span className="font-semibold text-sky-300">
                        {patch ? `${patch.label} (${patch.busId})` : 'Unassigned'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
