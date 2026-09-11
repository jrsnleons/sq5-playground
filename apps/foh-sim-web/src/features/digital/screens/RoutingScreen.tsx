import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { AlertTriangle, Share2 } from 'lucide-react';

export const RoutingScreen: React.FC = () => {
  const {
    sim,
    toggleChannelMainLR,
    setChannelPan,
    setChannelSend,
    toggleSendPreFade
  } = useSimulationStore();

  const selectedChId = sim.digital.session.selectedChannelId;
  const channel = sim.digital.channels.find((c) => c.id === selectedChId) || sim.digital.channels[0];

  const isClickOrComms =
    channel.name.toLowerCase().includes('click') ||
    channel.name.toLowerCase().includes('comms');

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Header */}
      <div className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Share2 className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono uppercase text-slate-400">Routing Matrix:</span>
          <span className="text-sm font-black text-sky-400 font-mono">
            CH {channel.channelNumber} — {channel.name}
          </span>
        </div>
      </div>

      {/* Warning if Click/Comms assigned to Main LR */}
      {isClickOrComms && channel.mainLRAssigned && (
        <div className="bg-amber-950/90 border-b border-amber-800 px-4 py-2 text-xs text-amber-200 flex items-center space-x-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Warning:</strong> {channel.name} is routed to Main LR. Click tracks and comms talkback mics should only route to musician IEM mixes, never to FOH PA speakers!
          </span>
        </div>
      )}

      {/* Routing Sections */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Main LR Assignment & Pan */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400 block font-bold">
              Main LR Master Bus
            </span>
            <span className="text-[11px] text-slate-500">
              Assigns this channel directly to the FOH PA stereo mix
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleChannelMainLR(channel.id)}
              className={`px-4 py-2 rounded text-xs font-mono font-bold transition-all ${
                channel.mainLRAssigned
                  ? 'bg-sky-600 text-white shadow-[0_0_8px_#0284c7]'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {channel.mainLRAssigned ? 'ASSIGNED TO LR' : 'NOT ASSIGNED'}
            </button>
          </div>
        </div>

        {/* Mix 1–12 Aux/IEM Sends */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono uppercase text-sky-400 font-bold">
              Mix Aux Sends (1–12) — IEMs &amp; Monitors
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Pre-fade protects musicians from FOH fader changes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sim.digital.mixes.map((mix) => {
              const send = channel.sends[mix.id] || {
                mixId: mix.id,
                levelDb: -90,
                preFade: false,
                assigned: false
              };

              return (
                <div
                  key={mix.id}
                  className={`p-3 rounded-lg border transition-all ${
                    send.assigned
                      ? 'bg-slate-950 border-sky-600/80 shadow-inner'
                      : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="checkbox"
                        checked={send.assigned}
                        onChange={(e) =>
                          setChannelSend(channel.id, mix.id, send.levelDb, e.target.checked)
                        }
                        className="rounded accent-sky-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200">
                        {mix.name}
                      </span>
                    </div>

                    {/* Pre/Post toggle */}
                    <button
                      onClick={() => toggleSendPreFade(channel.id, mix.id)}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        send.preFade ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {send.preFade ? 'PRE' : 'POST'}
                    </button>
                  </div>

                  {/* Level Slider */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="-90"
                      max="10"
                      step="1"
                      disabled={!send.assigned}
                      value={send.levelDb}
                      onChange={(e) =>
                        setChannelSend(channel.id, mix.id, parseFloat(e.target.value))
                      }
                      className="flex-1 cursor-pointer accent-sky-500"
                    />
                    <span className="text-[10px] font-mono w-10 text-right text-slate-300">
                      {send.levelDb <= -85 ? '-∞' : `${send.levelDb > 0 ? '+' : ''}${send.levelDb}dB`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DCA Groups Assignment */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-mono uppercase text-sky-400 font-bold block border-b border-slate-800 pb-2">
            DCA Groups (1–8)
          </span>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {sim.digital.dcas.map((dca) => {
              const isMember = (channel.dcaGroupMask & (1 << (dca.id - 1))) !== 0;
              return (
                <button
                  key={dca.id}
                  onClick={() => {
                    const newMask = channel.dcaGroupMask ^ (1 << (dca.id - 1));
                    useSimulationStore.setState((state) => {
                      const ch = state.sim.digital.channels.find((c) => c.id === channel.id);
                      if (ch) ch.dcaGroupMask = newMask;
                    });
                  }}
                  className={`p-2 rounded border text-center font-mono text-xs transition-colors ${
                    isMember
                      ? 'bg-sky-600 text-white border-sky-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[9px]">DCA {dca.id}</div>
                  <div className="truncate text-[10px]">{dca.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
