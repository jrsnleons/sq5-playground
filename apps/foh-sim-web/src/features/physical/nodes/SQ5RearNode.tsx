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
      className={`w-[680px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 rounded-xl shadow-2xl p-3 text-slate-100 font-sans transition-all ${
        isNodeTraced
          ? 'border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.35)] ring-2 ring-sky-400/40'
          : selected
          ? 'border-sky-500 shadow-sky-500/20'
          : 'border-slate-700'
      }`}
    >
      {/* SQ-5 Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-inner" />
          <span className="text-xs font-bold tracking-widest text-slate-300 uppercase font-mono">
            ALLEN &amp; HEATH
          </span>
          <span className="text-sm font-black tracking-wider text-sky-400 font-mono">
            SQ-5
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            REAR I/O PANEL (48-CH CORE)
          </span>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isSlinkConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-400">SLINK</span>
          </div>
          <div className="flex items-center space-x-1">
            <span
              className={`w-2 h-2 rounded-full ${
                hasUsbCable ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-400">USB-B</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Left Section: 16 Local XLR Inputs + ST1/2/3 */}
        <div className="col-span-8 space-y-3">
          {/* 16 Local Inputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Local Inputs 1–16 (XLR Female Mic/Line)</span>
              <span className="text-sky-400">Digitally Controlled Preamp</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
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

          {/* 12 Local Outputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Local Outputs 1–12 (Line XLR)</span>
              <span className="text-teal-400">7-8 Rec | 9-10 Mon | 11-12 Stream</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
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
                      className={`w-6 h-6 rounded-full border flex flex-col items-center justify-center mb-1 shadow-inner transition-colors ${
                        isSocketTraced
                          ? 'bg-teal-950 border-teal-400 shadow-[0_0_8px_#14b8a6]'
                          : 'bg-slate-800 border-slate-700 group-hover:border-slate-500'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-mono font-bold leading-none ${
                          isSocketTraced ? 'text-white font-black' : 'text-slate-300'
                        }`}
                      >
                        {portNum}
                      </span>
                      {role && (
                        <span
                          className={`text-[6px] font-mono uppercase tracking-tighter ${
                            isSocketTraced ? 'text-teal-300 font-bold' : 'text-teal-400/80'
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

        {/* Right Section: Digital & Special I/O (SLink, USB, ST, AES) */}
        <div className="col-span-4 flex flex-col justify-between border-l border-slate-800 pl-3 space-y-2">
          {/* SLink Port (EtherCon) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (hasDsnakeCable) setLockedTrace('sq-slink', 'console-sq5');
            }}
            className={`bg-slate-950/90 p-2 rounded-lg border transition-all ${
              activeTrace?.socketId === 'sq-slink'
                ? 'border-emerald-400 shadow-[0_0_12px_#10b981]'
                : 'border-slate-800'
            } ${hasDsnakeCable ? 'cursor-pointer' : ''} flex items-center justify-between`}
          >
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 block">SLink</span>
              <span className="text-[9px] text-slate-500">From AR2412</span>
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
                className={`w-8 h-8 rounded bg-slate-800 border-2 flex items-center justify-center shadow-inner ${
                  hasDsnakeCable && isSlinkConnected ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-500'
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
                    ? '!bg-emerald-500 !border-slate-950 shadow-[0_0_8px_#10b981]'
                    : '!bg-slate-800 !border-slate-600'
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
            className={`bg-slate-950/90 p-2 rounded-lg border transition-all ${
              activeTrace?.socketId === 'sq-usb-b'
                ? 'border-amber-400 shadow-[0_0_12px_#fbbf24]'
                : 'border-slate-800'
            } ${hasUsbCable ? 'cursor-pointer' : ''} flex items-center justify-between`}
          >
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 block">USB-B Audio</span>
              <span className="text-[9px] text-slate-500">32x32 Host Interface</span>
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
                className={`w-8 h-8 rounded bg-slate-800 border-2 flex items-center justify-center shadow-inner ${
                  hasUsbCable ? 'border-amber-500 text-amber-400' : 'border-slate-700 text-slate-500'
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
                    ? '!bg-amber-400 !border-slate-950 shadow-[0_0_8px_#fbbf24]'
                    : '!bg-slate-800 !border-slate-600 hover:!border-slate-400'
                }`}
              />
            </div>
          </div>

          {/* ST1 / ST2 TRS Inputs */}
          <div className="bg-slate-950/50 p-2 rounded border border-slate-800/80">
            <span className="text-[9px] font-mono text-slate-400 block mb-1">STEREO INPUTS</span>
            <div className="flex justify-around">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-slate-500">ST1 L/R</span>
                <Handle
                  type="target"
                  position={Position.Bottom}
                  id="sq-in-st1-l"
                  className="!w-2.5 !h-2.5 !bg-slate-700 !border !border-slate-900"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-slate-500">ST2 L/R</span>
                <Handle
                  type="target"
                  position={Position.Bottom}
                  id="sq-in-st2-l"
                  className="!w-2.5 !h-2.5 !bg-slate-700 !border !border-slate-900"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-slate-500">ST3 3.5mm</span>
                <Handle
                  type="target"
                  position={Position.Bottom}
                  id="sq-in-st3"
                  className="!w-2.5 !h-2.5 !bg-slate-700 !border !border-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

