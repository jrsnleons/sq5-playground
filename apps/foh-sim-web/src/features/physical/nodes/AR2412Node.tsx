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
      className={`w-[680px] bg-[#161619] border rounded-xl shadow-[0_16px_40px_-6px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.18)] p-3 text-neutral-100 font-sans transition-all ${
        isNodeTraced
          ? 'border-white ring-2 ring-white/50 z-30'
          : selected
          ? 'border-white ring-2 ring-white/40'
          : 'border-white/20 hover:border-white/35'
      }`}
    >
      {/* Faceplate Header */}
      <div className="flex items-center justify-between bg-[#1f1f24] -mx-3 -mt-3 px-3.5 py-2.5 rounded-t-xl border-b border-white/10 mb-3">
        <div className="flex items-center space-x-2.5">
          {/* Left Rack Screw Accent */}
          <div className="w-2.5 h-2.5 rounded-full border border-neutral-600 bg-neutral-800 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-neutral-500 rotate-45" />
          </div>
          <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase font-mono">
            ALLEN &amp; HEATH
          </span>
          <span className="text-sm font-black tracking-wider text-white font-mono bg-white/10 px-2 py-0.5 rounded border border-white/15">
            AR2412
          </span>
          <span className="text-[10px] font-medium text-neutral-300 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded font-mono">
            24 IN / 12 OUT AUDIORACK
          </span>
        </div>

        {/* Status LEDs & Right Rack Screw */}
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400' : 'bg-red-500'
              }`}
            />
            <span className="text-neutral-300 font-semibold">dSNAKE</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-300 font-semibold">POWER</span>
          </div>
          {/* Right Rack Screw Accent */}
          <div className="w-2.5 h-2.5 rounded-full border border-neutral-600 bg-neutral-800 shadow-inner flex items-center justify-center ml-1">
            <div className="w-1.5 h-0.5 bg-neutral-500 -rotate-45" />
          </div>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="flex space-x-4">
        {/* Left Section: 24 Inputs + 12 Outputs */}
        <div className="flex-1 space-y-3">
          {/* Top Row: 24 Mic/Line Inputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1 flex items-center justify-between">
              <span className="font-semibold text-neutral-300">Inputs 1-24 (XLR Female Mic/Line)</span>
              <span className="text-sky-400 font-mono">Remote Preamp 0-60dB</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 p-2 bg-[#0c0c0e] rounded-lg border border-white/10">
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
                          ? '!bg-white !border-white z-30 ring-2 ring-white/40'
                          : connectedCable
                          ? '!bg-white !border-black'
                          : '!bg-[#222228] !border-neutral-500 hover:!border-white'
                      }`}
                    />
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center mt-1 transition-colors ${
                        isSocketTraced
                          ? 'bg-white/10 border-white'
                          : 'bg-[#18181c] border-neutral-600 group-hover:border-neutral-300'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          isSocketTraced ? 'text-white font-black' : 'text-neutral-200'
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

          {/* Bottom Row: 12 XLR Outputs */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1 border-b border-white/[0.08] pb-0.5">
              <span className="font-semibold text-neutral-300">OUTPUTS (1-12)</span>
              <span className="text-neutral-400">LINE LEVEL / AUX / PA</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 p-2 bg-[#0c0c0e] rounded-lg border border-white/10">
              {Array.from({ length: 12 }, (_, i) => {
                const portNum = i + 1;
                const socketId = `ar-out-${portNum}`;
                const isSocketTraced = activeTrace?.socketId === socketId;
                const connectedCable = cables.find(
                  (c) => c.toPort === socketId || c.fromPort === socketId
                );

                return (
                  <div
                    key={socketId}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (connectedCable) setLockedTrace(socketId, 'stagebox-ar2412');
                    }}
                    className={`flex flex-col items-center relative group p-0.5 rounded transition-all ${
                      connectedCable ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center mb-1 transition-colors ${
                        isSocketTraced
                          ? 'bg-white/10 border-white'
                          : 'bg-[#18181c] border-neutral-600 group-hover:border-neutral-300'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          isSocketTraced ? 'text-white font-black' : 'text-neutral-200'
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
                          ? '!bg-white !border-white z-30 ring-2 ring-white/40'
                          : connectedCable
                          ? '!bg-white !border-black'
                          : '!bg-[#222228] !border-neutral-500 hover:!border-white'
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
        <div className="w-32 flex flex-col justify-between border-l border-white/10 pl-3">
          <div className="text-[10px] font-mono text-neutral-300 uppercase font-semibold">Network</div>

          {/* dSNAKE Port */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (hasDsnakeCable) setLockedTrace('ar-dsnake', 'stagebox-ar2412');
            }}
            className={`flex flex-col items-center bg-[#0c0c0e] p-2 rounded-lg border transition-all ${
              activeTrace?.socketId === 'ar-dsnake'
                ? 'border-emerald-400 ring-1 ring-emerald-400/40'
                : 'border-white/10'
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
              <div className="w-8 h-8 rounded-md bg-[#18181c] border border-emerald-500/50 flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id="ar-dsnake"
                className={`!w-4 !h-4 !rounded-sm !border-2 transition-all ${
                  hasDsnakeCable && isConnected
                    ? '!bg-emerald-500 !border-black'
                    : '!bg-[#222228] !border-neutral-500'
                }`}
              />
            </div>
            <span className="text-[9px] text-neutral-400 mt-1 font-mono">To SQ SLink</span>
          </div>

          {/* Expander Port */}
          <div className="flex flex-col items-center bg-[#0c0c0e] p-1.5 rounded border border-white/10">
            <span className="text-[9px] font-mono text-neutral-400">EXPANDER</span>
            <Handle
              type="source"
              position={Position.Right}
              id="ar-expander"
              className="!w-3 !h-3 !rounded-sm !bg-neutral-700 !border !border-neutral-900"
            />
          </div>

          {/* Monitor Port */}
          <div className="flex flex-col items-center bg-[#0c0c0e] p-1.5 rounded border border-white/10">
            <span className="text-[9px] font-mono text-neutral-400">MONITOR</span>
            <Handle
              type="source"
              position={Position.Right}
              id="ar-monitor"
              className="!w-3 !h-3 !rounded-sm !bg-neutral-700 !border !border-neutral-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

