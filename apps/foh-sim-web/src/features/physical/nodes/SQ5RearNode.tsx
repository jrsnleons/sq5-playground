import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Radio, Usb } from 'lucide-react';
import { PhysicalPlugGraphic } from '../components/PhysicalPlugGraphic';

export const SQ5RearNode: React.FC<NodeProps> = memo(({ selected }) => {
  const isSlinkConnected = useSimulationStore((s) => s.signalPresence.slinkHasSignal);
  const cables = useSimulationStore((s) => s.sim.physical.cables);
  const activeTrace = useSimulationStore((s) => s.activeTrace);
  const setLockedTrace = useSimulationStore((s) => s.setLockedTrace);

  const hasDsnakeCable = cables.some(
    (c) =>
      (c.fromPort === 'ar-dsnake' && c.toPort === 'sq-slink') ||
      (c.toPort === 'ar-dsnake' && c.fromPort === 'sq-slink')
  );
  const hasUsbCable = cables.some((c) => c.fromPort === 'sq-usb-b' || c.toPort === 'sq-usb-b');

  const isNodeTraced =
    activeTrace?.nodeId === 'console-sq5' ||
    cables.some(
      (c) =>
        c.id === activeTrace?.cableId &&
        (c.fromNode === 'console-sq5' || c.toNode === 'console-sq5')
    );

  return (
    <div
      className={`w-[700px] bg-[#161619] border rounded-xl shadow-[0_16px_40px_-6px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.18)] p-3 text-neutral-100 font-sans transition-all ${
        isNodeTraced
          ? 'border-white ring-2 ring-white/50 z-30'
          : selected
          ? 'border-white ring-2 ring-white/40'
          : 'border-white/20 hover:border-white/35'
      }`}
    >
      {/* SQ-5 Header */}
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
            SQ-5
          </span>
          <span className="text-[10px] font-medium text-neutral-300 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded font-mono">
            REAR I/O PANEL (48-CH CORE)
          </span>
        </div>

        {/* Status Indicators & Right Rack Screw */}
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSlinkConnected ? 'bg-emerald-400' : 'bg-neutral-600'
              }`}
            />
            <span className="text-neutral-300 font-semibold">SLINK</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hasUsbCable ? 'bg-amber-400' : 'bg-neutral-600'
              }`}
            />
            <span className="text-neutral-300 font-semibold">USB-B</span>
          </div>
          {/* Right Rack Screw Accent */}
          <div className="w-2.5 h-2.5 rounded-full border border-neutral-600 bg-neutral-800 shadow-inner flex items-center justify-center ml-1">
            <div className="w-1.5 h-0.5 bg-neutral-500 -rotate-45" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Left Section: 16 Local XLR Inputs + ST1/2/3 */}
        <div className="col-span-8 space-y-3">
          {/* 16 Local Inputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1 flex items-center justify-between">
              <span className="font-semibold text-neutral-300">Local Inputs 1-16 (XLR Female Mic/Line)</span>
              <span className="text-sky-400 font-mono">Digitally Controlled Preamp</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#0c0c0e] rounded-lg border border-white/10">
              {Array.from({ length: 16 }, (_, i) => {
                const portNum = i + 1;
                const socketId = `sq-in-${portNum}`;
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
                      if (connectedCable) setLockedTrace(socketId, 'console-sq5');
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

          {/* 12 Local Outputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-neutral-400 mb-1 flex items-center justify-between">
              <span className="font-semibold text-neutral-300">Local Outputs 1-12 (Line XLR)</span>
              <span className="text-teal-400 font-mono">7-8 Rec | 9-10 Mon | 11-12 Stream</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 p-2 bg-[#0c0c0e] rounded-lg border border-white/10">
              {Array.from({ length: 12 }, (_, i) => {
                const portNum = i + 1;
                const socketId = `sq-out-${portNum}`;
                const connectedCable = cables.find(
                  (c) => c.fromPort === socketId || c.toPort === socketId
                );
                const isSocketTraced =
                  activeTrace?.socketId === socketId ||
                  (activeTrace?.cableId && connectedCable?.id === activeTrace.cableId);

                const role =
                  portNum === 7 ? 'REC L' :
                  portNum === 8 ? 'REC R' :
                  portNum === 9 ? 'MON L' :
                  portNum === 10 ? 'MON R' :
                  portNum === 11 ? 'STR L' :
                  portNum === 12 ? 'STR R' : null;

                return (
                  <div
                    key={socketId}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (connectedCable) setLockedTrace(socketId, 'console-sq5');
                    }}
                    className={`flex flex-col items-center group relative ${
                      connectedCable ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex flex-col items-center justify-center mb-1 transition-colors ${
                        isSocketTraced
                          ? 'bg-white/10 border-white'
                          : 'bg-[#18181c] border-neutral-600 group-hover:border-neutral-300'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-mono font-bold leading-none ${
                          isSocketTraced ? 'text-white font-black' : 'text-neutral-200'
                        }`}
                      >
                        {portNum}
                      </span>
                      {role && (
                        <span
                          className={`text-[6px] font-mono uppercase tracking-tighter ${
                            isSocketTraced ? 'text-white font-bold' : 'text-neutral-400'
                          }`}
                        >
                          {role}
                        </span>
                      )}
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

        {/* Right Section: Digital & Special I/O (SLink, USB, ST, AES) */}
        <div className="col-span-4 flex flex-col justify-between border-l border-white/10 pl-3 space-y-2">
          {/* SLink Port (EtherCon) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (hasDsnakeCable) setLockedTrace('sq-slink', 'console-sq5');
            }}
            className={`bg-[#0c0c0e] p-2 rounded-lg border transition-all ${
              activeTrace?.socketId === 'sq-slink'
                ? 'border-emerald-400 ring-1 ring-emerald-400/40'
                : 'border-white/10'
            } ${hasDsnakeCable ? 'cursor-pointer' : ''} flex items-center justify-between`}
          >
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 block">SLink</span>
              <span className="text-[9px] text-neutral-400 font-mono">From AR2412</span>
            </div>
            <div className="relative">
              {hasDsnakeCable && activeTrace?.socketId === 'sq-slink' && (
                <PhysicalPlugGraphic
                  signalType="dsnake"
                  connectorType="ethercon"
                  direction="up"
                  isTraced={true}
                />
              )}
              <div
                className={`w-8 h-8 rounded bg-[#18181c] border flex items-center justify-center ${
                  hasDsnakeCable && isSlinkConnected ? 'border-emerald-500 text-emerald-400' : 'border-neutral-700 text-neutral-500'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <Handle
                type="target"
                position={Position.Left}
                id="sq-slink"
                className={`!w-4 !h-4 !rounded-sm !border-2 transition-all ${
                  hasDsnakeCable && isSlinkConnected
                    ? '!bg-emerald-500 !border-black'
                    : '!bg-[#222228] !border-neutral-500'
                }`}
              />
            </div>
          </div>

          {/* USB-B Port */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (hasUsbCable) setLockedTrace('sq-usb-b', 'console-sq5');
            }}
            className={`bg-[#0c0c0e] p-2 rounded-lg border transition-all ${
              activeTrace?.socketId === 'sq-usb-b'
                ? 'border-amber-400 ring-1 ring-amber-400/40'
                : 'border-white/10'
            } ${hasUsbCable ? 'cursor-pointer' : ''} flex items-center justify-between`}
          >
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 block">USB-B Audio</span>
              <span className="text-[9px] text-neutral-400 font-mono">32x32 Host Interface</span>
            </div>
            <div className="relative">
              {hasUsbCable && activeTrace?.socketId === 'sq-usb-b' && (
                <PhysicalPlugGraphic
                  signalType="usb"
                  connectorType="usb"
                  direction="up"
                  isTraced={true}
                />
              )}
              <div
                className={`w-8 h-8 rounded bg-[#18181c] border flex items-center justify-center ${
                  hasUsbCable ? 'border-amber-500 text-amber-400' : 'border-neutral-700 text-neutral-500'
                }`}
              >
                <Usb className="w-4 h-4" />
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id="sq-usb-b"
                className={`!w-3.5 !h-3.5 !rounded-sm !border-2 transition-all ${
                  hasUsbCable
                    ? '!bg-amber-400 !border-black'
                    : '!bg-[#222228] !border-neutral-500 hover:!border-white'
                }`}
              />
            </div>
          </div>

          {/* ST1 / ST2 TRS Inputs */}
          <div className="bg-[#0c0c0e] p-2 rounded-lg border border-white/10">
            <span className="text-[9px] font-mono text-neutral-300 font-semibold block mb-1">STEREO INPUTS</span>
            <div className="flex justify-around">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-neutral-400 font-mono">ST1 L/R</span>
                <Handle
                  type="target"
                  position={Position.Bottom}
                  id="sq-in-st1-l"
                  className="!w-2.5 !h-2.5 !bg-neutral-600 !border !border-black"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-neutral-400 font-mono">ST2 L/R</span>
                <Handle
                  type="target"
                  position={Position.Bottom}
                  id="sq-in-st2-l"
                  className="!w-2.5 !h-2.5 !bg-neutral-600 !border !border-black"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-neutral-400 font-mono">ST3 3.5mm</span>
                <Handle
                  type="target"
                  position={Position.Bottom}
                  id="sq-in-st3"
                  className="!w-2.5 !h-2.5 !bg-neutral-600 !border !border-black"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

