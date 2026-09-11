import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Radio } from 'lucide-react';
import { PhysicalPlugGraphic } from '../components/PhysicalPlugGraphic';

export const AR2412Node: React.FC<NodeProps> = memo(({ selected }) => {
  const isConnected = useSimulationStore((s) => s.signalPresence.slinkHasSignal);
  const cables = useSimulationStore((s) => s.sim.physical.cables);
  const activeTrace = useSimulationStore((s) => s.activeTrace);
  const setLockedTrace = useSimulationStore((s) => s.setLockedTrace);

  const hasDsnakeCable = cables.some(
    (c) =>
      (c.fromPort === 'ar-dsnake' && c.toPort === 'sq-slink') ||
      (c.toPort === 'ar-dsnake' && c.fromPort === 'sq-slink')
  );

  const isNodeTraced =
    activeTrace?.nodeId === 'stagebox-ar2412' ||
    cables.some(
      (c) =>
        c.id === activeTrace?.cableId &&
        (c.fromNode === 'stagebox-ar2412' || c.toNode === 'stagebox-ar2412')
    );

  return (
    <div
      className={`w-[660px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 rounded-xl shadow-2xl p-3 text-slate-100 font-sans transition-all ${
        isNodeTraced
          ? 'border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.35)] ring-2 ring-sky-400/40'
          : selected
          ? 'border-sky-500 shadow-sky-500/20'
          : 'border-slate-700'
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
                const connectedCable = cables.find(
                  (c) => c.toPort === socketId || c.fromPort === socketId
                );
                const isSocketTraced =
                  activeTrace?.socketId === socketId ||
                  (activeTrace?.cableId && connectedCable?.id === activeTrace.cableId);

                return (
                  <div
                    key={socketId}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (connectedCable) setLockedTrace(socketId, 'stagebox-ar2412');
                    }}
                    className={`flex flex-col items-center group relative ${
                      connectedCable ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Minimalist Plug Indicator only appears when active trace */}
                    {connectedCable && isSocketTraced && (
                      <PhysicalPlugGraphic
                        signalType={connectedCable.signalType}
                        connectorType="xlr"
                        direction="up"
                        isTraced={true}
                      />
                    )}

                    <Handle
                      type="target"
                      position={Position.Top}
                      id={socketId}
                      className={`!w-3.5 !h-3.5 !rounded-full !border-2 transition-all ${
                        isSocketTraced
                          ? '!bg-white !border-sky-400 shadow-[0_0_12px_#38bdf8] z-30'
                          : connectedCable
                          ? '!bg-sky-400 !border-slate-950 shadow-[0_0_6px_#38bdf8]'
                          : '!bg-slate-800 !border-slate-600 hover:!border-slate-400'
                      }`}
                    />
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center mt-1 shadow-inner transition-colors ${
                        isSocketTraced
                          ? 'bg-sky-950 border-sky-400 shadow-[0_0_8px_#38bdf8]'
                          : 'bg-slate-800 border-slate-700 group-hover:border-slate-500'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          isSocketTraced ? 'text-white font-black' : 'text-slate-300'
                        }`}
                      >
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
                const connectedCable = cables.find(
                  (c) => c.fromPort === socketId || c.toPort === socketId
                );
                const isSocketTraced =
                  activeTrace?.socketId === socketId ||
                  (activeTrace?.cableId && connectedCable?.id === activeTrace.cableId);

                return (
                  <div
                    key={socketId}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (connectedCable) setLockedTrace(socketId, 'stagebox-ar2412');
                    }}
                    className={`flex flex-col items-center group relative ${
                      connectedCable ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center mb-1 shadow-inner transition-colors ${
                        isSocketTraced
                          ? 'bg-teal-950 border-teal-400 shadow-[0_0_8px_#14b8a6]'
                          : 'bg-slate-800 border-slate-700 group-hover:border-slate-500'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          isSocketTraced ? 'text-white font-black' : 'text-slate-300'
                        }`}
                      >
                        {portNum}
                      </span>
                    </div>

                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id={socketId}
                      className={`!w-3.5 !h-3.5 !rounded-full !border-2 transition-all ${
                        isSocketTraced
                          ? '!bg-white !border-teal-400 shadow-[0_0_12px_#2dd4bf] z-30'
                          : connectedCable
                          ? '!bg-teal-400 !border-slate-950 shadow-[0_0_6px_#2dd4bf]'
                          : '!bg-slate-800 !border-slate-600 hover:!border-slate-400'
                      }`}
                    />

                    {/* Minimalist Plug Indicator only appears when active trace */}
                    {connectedCable && isSocketTraced && (
                      <PhysicalPlugGraphic
                        signalType={connectedCable.signalType}
                        connectorType="xlr"
                        direction="down"
                        isTraced={true}
                      />
                    )}
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
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (hasDsnakeCable) setLockedTrace('ar-dsnake', 'stagebox-ar2412');
            }}
            className={`flex flex-col items-center bg-slate-950/90 p-2 rounded-lg border transition-all ${
              activeTrace?.socketId === 'ar-dsnake'
                ? 'border-emerald-400 shadow-[0_0_12px_#10b981]'
                : 'border-slate-800'
            } ${hasDsnakeCable ? 'cursor-pointer' : ''}`}
          >
            <span className="text-[10px] font-mono font-bold text-emerald-400 mb-1">dSNAKE</span>
            <div className="relative">
              {hasDsnakeCable && activeTrace?.socketId === 'ar-dsnake' && (
                <PhysicalPlugGraphic
                  signalType="dsnake"
                  connectorType="ethercon"
                  direction="up"
                  isTraced={true}
                />
              )}
              <div className="w-8 h-8 rounded-md bg-slate-800 border-2 border-emerald-600/80 flex items-center justify-center shadow-inner">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id="ar-dsnake"
                className={`!w-4 !h-4 !rounded-sm !border-2 transition-all ${
                  hasDsnakeCable && isConnected
                    ? '!bg-emerald-500 !border-slate-950 shadow-[0_0_8px_#10b981]'
                    : '!bg-slate-800 !border-slate-600'
                }`}
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

