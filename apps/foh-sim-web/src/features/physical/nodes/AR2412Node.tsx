import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Radio } from 'lucide-react';

export const AR2412Node: React.FC<NodeProps> = memo(({ id, selected }) => {
  const isConnected = useSimulationStore((s) => s.signalPresence.slinkHasSignal);
  const cables = useSimulationStore((s) => s.sim.physical.cables);

  return (
    <div
      className={`w-[660px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 rounded-xl shadow-2xl p-3 text-slate-100 font-sans transition-all ${
        selected ? 'border-sky-500 shadow-sky-500/20' : 'border-slate-700'
      }`}
    >
      {/* Faceplate Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-inner" />
          <span className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
            ALLEN &amp; HEATH
          </span>
          <span className="text-sm font-black tracking-wider text-sky-400 font-mono">
            AR2412
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            24 IN / 12 OUT AUDIORACK
          </span>
        </div>

        {/* Status LEDs */}
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
              }`}
            />
            <span className="text-slate-400">dSNAKE</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-slate-400">POWER</span>
          </div>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="flex space-x-4">
        {/* Left Section: 24 Inputs + 12 Outputs */}
        <div className="flex-1 space-y-3">
          {/* Top Row: 24 Mic/Line Inputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Inputs 1–24 (XLR Female Mic/Line)</span>
              <span className="text-sky-400">Remote Preamp 0–60dB</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
              {Array.from({ length: 24 }, (_, i) => {
                const portNum = i + 1;
                const socketId = `ar-in-${portNum}`;
                const hasConnectedCable = cables.some(
                  (c) => c.toPort === socketId || c.fromPort === socketId
                );

                return (
                  <div key={socketId} className="flex flex-col items-center group relative">
                    <Handle
                      type="target"
                      position={Position.Top}
                      id={socketId}
                      className={`!w-3.5 !h-3.5 !rounded-full !border-2 transition-all ${
                        hasConnectedCable
                          ? '!bg-sky-400 !border-slate-950 shadow-[0_0_8px_#38bdf8]'
                          : '!bg-slate-800 !border-slate-600 hover:!bg-sky-400'
                      }`}
                    />
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mt-1 shadow-inner group-hover:border-sky-400">
                      <span className="text-[9px] font-mono font-bold text-slate-300">
                        {portNum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: 12 Line Outputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Outputs 1–12 (XLR Male Line Out)</span>
              <span className="text-teal-400">IEM &amp; PA Feeds</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
              {Array.from({ length: 12 }, (_, i) => {
                const portNum = i + 1;
                const socketId = `ar-out-${portNum}`;
                const hasConnectedCable = cables.some(
                  (c) => c.fromPort === socketId || c.toPort === socketId
                );

                return (
                  <div key={socketId} className="flex flex-col items-center group relative">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-1 shadow-inner group-hover:border-teal-400">
                      <span className="text-[9px] font-mono font-bold text-slate-300">
                        {portNum}
                      </span>
                    </div>
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id={socketId}
                      className={`!w-3.5 !h-3.5 !rounded-full !border-2 transition-all ${
                        hasConnectedCable
                          ? '!bg-teal-400 !border-slate-950 shadow-[0_0_8px_#2dd4bf]'
                          : '!bg-slate-800 !border-slate-600 hover:!bg-teal-400'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: EtherCon Network Ports */}
        <div className="w-32 flex flex-col justify-between border-l border-slate-800 pl-3">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Network</div>

          {/* dSNAKE Port */}
          <div className="flex flex-col items-center bg-slate-950/90 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono font-bold text-emerald-400 mb-1">dSNAKE</span>
            <div className="relative">
              <div className="w-8 h-8 rounded-md bg-slate-800 border-2 border-emerald-600/80 flex items-center justify-center shadow-inner">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id="ar-dsnake"
                className="!w-4 !h-4 !rounded-sm !bg-emerald-500 !border-2 !border-slate-950 hover:scale-125"
              />
            </div>
            <span className="text-[9px] text-slate-500 mt-1">To SQ SLink</span>
          </div>

          {/* Expander Port */}
          <div className="flex flex-col items-center bg-slate-950/50 p-1.5 rounded border border-slate-800/80">
            <span className="text-[9px] font-mono text-slate-400">EXPANDER</span>
            <Handle
              type="source"
              position={Position.Right}
              id="ar-expander"
              className="!w-3 !h-3 !rounded-sm !bg-slate-700 !border !border-slate-900"
            />
          </div>

          {/* Monitor Port */}
          <div className="flex flex-col items-center bg-slate-950/50 p-1.5 rounded border border-slate-800/80">
            <span className="text-[9px] font-mono text-slate-400">MONITOR</span>
            <Handle
              type="source"
              position={Position.Right}
              id="ar-monitor"
              className="!w-3 !h-3 !rounded-sm !bg-slate-700 !border !border-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

