import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { BarChart2 } from 'lucide-react';

export const MetersScreen: React.FC = () => {
  const { sim, signalPresence } = useSimulationStore();

  return (
    <div className="h-full bg-black p-4 flex flex-col overflow-hidden select-none font-sans text-zinc-100">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-4 shrink-0">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-semibold text-zinc-100 uppercase font-mono tracking-wider">
            Console Metering Bridge (48 Channels + Mix Buses)
          </h2>
        </div>
      </div>

      <div className="flex-1 grid grid-rows-2 gap-4 overflow-hidden">
        {/* Top: 48 Channel Input Meters */}
        <div className="bg-[#0A0A0A] p-3.5 rounded-xl border border-white/[0.08] flex flex-col overflow-hidden">
          <span className="text-[10px] font-mono text-zinc-500 uppercase mb-2 block font-semibold">
            Channels 1-48 Input Meters
          </span>
          <div className="flex-1 grid grid-cols-24 gap-1 overflow-x-auto items-end pb-1">
            {sim.digital.channels.map((ch) => {
              const hasSignal = signalPresence.rawInputsWithSignal?.[ch.id] ?? signalPresence.channelsWithSignal[ch.id];
              const level = hasSignal ? 72 : 5;

              return (
                <div key={ch.id} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-2 flex-1 bg-black rounded-xs p-0.5 flex flex-col justify-end border border-white/[0.06]">
                    <div
                      style={{ height: `${level}%` }}
                      className={`w-full rounded-xs transition-all duration-150 ${
                        hasSignal ? 'bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500' : 'bg-zinc-900'
                      }`}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500 mt-1 truncate w-4 text-center">
                    {ch.channelNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: Mix Buses + Main LR + 31-Band RTA */}
        <div className="grid grid-cols-12 gap-3 overflow-hidden">
          {/* Mix Buses */}
          <div className="col-span-8 bg-[#0A0A0A] p-3.5 rounded-xl border border-white/[0.08] flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase mb-2 block font-semibold">
              Mixes 1-12 &amp; Main LR Output Meters
            </span>
            <div className="flex-1 flex justify-between items-end pb-1">
              {sim.digital.mixes.map((mix) => {
                const hasSignal = signalPresence.mixesWithSignal[mix.id];
                const level = hasSignal ? 65 : 5;

                return (
                  <div key={mix.id} className="flex flex-col items-center h-full justify-end">
                    <div className="w-2.5 flex-1 bg-black rounded-xs p-0.5 flex flex-col justify-end border border-white/[0.06]">
                      <div
                        style={{ height: `${level}%` }}
                        className={`w-full rounded-xs ${
                          hasSignal ? 'bg-gradient-to-t from-emerald-500 to-amber-400' : 'bg-zinc-900'
                        }`}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500 mt-1 truncate w-8 text-center" title={mix.name}>
                      M{mix.mixNumber}
                    </span>
                  </div>
                );
              })}

              {/* Main LR Meter */}
              <div className="flex flex-col items-center h-full justify-end border-l border-white/[0.08] pl-3">
                <div className="flex space-x-0.5 flex-1 bg-black rounded-xs p-0.5 border border-white/[0.06]">
                  <div
                    style={{ height: `${signalPresence.mainLRHasSignal ? 80 : 5}%` }}
                    className={`w-2 rounded-xs self-end ${
                      signalPresence.mainLRHasSignal ? 'bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500' : 'bg-zinc-900'
                    }`}
                  />
                  <div
                    style={{ height: `${signalPresence.mainLRHasSignal ? 80 : 5}%` }}
                    className={`w-2 rounded-xs self-end ${
                      signalPresence.mainLRHasSignal ? 'bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500' : 'bg-zinc-900'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-300 mt-1">LR</span>
              </div>
            </div>
          </div>

          {/* 31-Band RTA Analyzer */}
          <div className="col-span-4 bg-[#0A0A0A] p-3.5 rounded-xl border border-white/[0.08] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
              31-Band Real-Time Analyzer (RTA)
            </span>
            <div className="flex-1 flex items-end justify-between py-2">
              {Array.from({ length: 31 }, (_, i) => {
                const height = Math.floor(Math.sin((i / 31) * Math.PI) * 70) + 15;
                return (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className="w-1 bg-white/70 rounded-t-xs"
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] font-mono text-zinc-500">
              <span>31 Hz</span>
              <span>1 kHz</span>
              <span>16 kHz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

