import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Radio, Usb } from 'lucide-react';

export const SQ5RearNode: React.FC<NodeProps> = memo(({ selected }) => {
  const isSlinkConnected = useSimulationStore((s) => s.signalPresence.slinkHasSignal);
  const cables = useSimulationStore((s) => s.sim.physical.cables);

  return (
    <div
      className={`w-[680px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 rounded-xl shadow-2xl p-3 text-slate-100 font-sans transition-all ${
        selected ? 'border-sky-500 shadow-sky-500/20' : 'border-slate-700'
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
            REAR I/O PANEL (48-CH FPGA CORE)
          </span>
        </div>

        {/* SLink Mode Badge */}
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <span className="text-slate-400">SLINK PROTOCOL:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
            dSnake (48kHz)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Left Section: 16 Local XLR Inputs + ST1/2/3 */}
        <div className="col-span-8 space-y-3">
          {/* 16 Local Inputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Local Inputs 1–16 (Mic/Line XLR)</span>
              <span className="text-sky-400">Digitally Controlled Preamp</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
              {Array.from({ length: 16 }, (_, i) => {
                const portNum = i + 1;
                const socketId = `sq-in-${portNum}`;
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

          {/* 12 Local Outputs */}
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Local Outputs 1–12 (Line XLR)</span>
              <span className="text-teal-400">Livestream &amp; Record Feeds</span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
              {Array.from({ length: 12 }, (_, i) => {
                const portNum = i + 1;
                const socketId = `sq-out-${portNum}`;
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

        {/* Right Section: Digital & Special I/O (SLink, USB, ST, AES) */}
        <div className="col-span-4 flex flex-col justify-between border-l border-slate-800 pl-3 space-y-2">
          {/* SLink Port (EtherCon) */}
          <div className="bg-slate-950/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 block">SLink</span>
              <span className="text-[9px] text-slate-500">From AR2412</span>
            </div>
            <div className="relative">
              <div
                className={`w-8 h-8 rounded bg-slate-800 border-2 flex items-center justify-center shadow-inner ${
                  isSlinkConnected ? 'border-emerald-500 text-emerald-400' : 'border-slate-700 text-slate-500'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <Handle
                type="target"
                position={Position.Left}
                id="sq-slink"
                className="!w-4 !h-4 !rounded-sm !bg-emerald-500 !border-2 !border-slate-950 hover:scale-125"
              />
            </div>
          </div>

          {/* USB-B Port */}
          <div className="bg-slate-950/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 block">USB-B Audio</span>
              <span className="text-[9px] text-slate-500">32x32 @ 48kHz</span>
            </div>
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
              <Usb className="w-4 h-4" />
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

