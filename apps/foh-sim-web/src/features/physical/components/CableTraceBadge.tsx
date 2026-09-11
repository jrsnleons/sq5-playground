import React from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { useReactFlow } from '@xyflow/react';
import {
  Zap,
  Radio,
  ArrowRight,
  Target,
  Trash2,
  X,
  Lock,
  Compass
} from 'lucide-react';

export const CableTraceBadge: React.FC = () => {
  const activeTrace = useSimulationStore((s) => s.activeTrace);
  const clearTrace = useSimulationStore((s) => s.clearTrace);
  const removeCable = useSimulationStore((s) => s.removeCable);
  const sim = useSimulationStore((s) => s.sim);
  const signalPresence = useSimulationStore((s) => s.signalPresence);

  const { setCenter, getNode } = useReactFlow();

  if (!activeTrace || !activeTrace.cableId) {
    return null;
  }

  const cable = sim.physical.cables.find((c) => c.id === activeTrace.cableId);
  if (!cable) return null;

  const hasSignal = signalPresence.cableHasSignal[cable.id];

  // Resolve source node details
  const getSourceDetails = () => {
    if (cable.fromNode === 'stagebox-ar2412') {
      return { name: 'AR2412 Stage Box', port: cable.fromPort, type: 'Stage Box Out' };
    }
    if (cable.fromNode === 'console-sq5') {
      return { name: 'SQ-5 Console Rear', port: cable.fromPort, type: 'Local Out' };
    }
    const item = sim.physical.stageItems.find((i) => i.id === cable.fromNode);
    return {
      name: item?.name || cable.fromNode,
      port: cable.fromPort,
      type: item?.category ? item.category.toUpperCase() : 'STAGE'
    };
  };

  // Resolve target node details
  const getTargetDetails = () => {
    if (cable.toNode === 'stagebox-ar2412') {
      return { name: 'AR2412 Stage Box', port: cable.toPort, type: 'Remote Preamp In' };
    }
    if (cable.toNode === 'console-sq5') {
      return { name: 'SQ-5 Console Rear', port: cable.toPort, type: 'Console In' };
    }
    const item = sim.physical.stageItems.find((i) => i.id === cable.toNode);
    return {
      name: item?.name || cable.toNode,
      port: cable.toPort,
      type: item?.category ? item.category.toUpperCase() : 'STAGE'
    };
  };

  const source = getSourceDetails();
  const target = getTargetDetails();

  // Find Digital Console Patch Mapping
  const getDigitalMapping = () => {
    // Check if target is an input socket
    const inputEntry = Object.entries(sim.digital.ioPatch.inputs).find(
      ([_, patch]) => patch.socketId === cable.toPort
    );
    if (inputEntry) {
      const ch = sim.digital.channels.find((c) => c.id === inputEntry[0]);
      if (ch) {
        return {
          type: 'INPUT',
          label: `CH ${ch.channelNumber}: ${ch.name}`,
          details: `${ch.stereo ? 'Stereo Linked' : 'Mono'} | Fader: ${ch.faderLevel > -80 ? `${ch.faderLevel} dB` : '-∞'}`
        };
      }
    }

    // Check if source is an output socket
    const outPatch = sim.digital.ioPatch.outputs[cable.fromPort];
    if (outPatch) {
      return {
        type: 'OUTPUT',
        label: `${outPatch.label || outPatch.busId}`,
        details: `Destination: ${outPatch.destType.toUpperCase()} (${outPatch.busId})`
      };
    }

    return null;
  };

  const digitalMapping = getDigitalMapping();

  // Camera navigation: Jump smoothly to either end
  const handleJumpTo = (nodeId: string) => {
    const flowNode = getNode(nodeId);
    if (flowNode) {
      const x = flowNode.position.x + (flowNode.measured?.width || 120) / 2;
      const y = flowNode.position.y + (flowNode.measured?.height || 80) / 2;
      setCenter(x, y, { duration: 600, zoom: 1.15 });
    }
  };

  const handleUnplug = () => {
    removeCable(cable.id);
    clearTrace();
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-2 select-none">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-sky-500/80 rounded-xl shadow-2xl p-3.5 text-slate-100 font-mono text-xs w-[480px] max-w-[90vw] space-y-2.5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
            <span className="font-bold text-sky-400 uppercase tracking-wide">
              Physical Cable Trace
            </span>
            <span className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
              <span>SELECTED</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px]">
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase border ${
                hasSignal
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-[0_0_6px_#10b981]'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {hasSignal ? 'SIGNAL ACTIVE' : 'NO SIGNAL'}
            </span>
            <button
              onClick={clearTrace}
              title="Close trace (or press Escape)"
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Physical Connection Route: Source -> Destination */}
        <div className="grid grid-cols-11 gap-1 items-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          {/* Source Box */}
          <div className="col-span-5 space-y-0.5">
            <div className="text-[9px] text-slate-400 flex items-center justify-between">
              <span>SOURCE ({source.type})</span>
              <button
                onClick={() => handleJumpTo(cable.fromNode)}
                title="Pan camera to source device"
                className="text-sky-400 hover:text-white flex items-center space-x-0.5 text-[8px] font-bold"
              >
                <Compass className="w-2.5 h-2.5" />
                <span>JUMP</span>
              </button>
            </div>
            <div className="font-bold text-white truncate text-[11px]" title={source.name}>
              {source.name}
            </div>
            <div className="text-[10px] text-sky-300 truncate">
              Port: <span className="font-bold">{source.port}</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="col-span-1 flex items-center justify-center text-slate-500">
            <ArrowRight className="w-4 h-4 text-sky-400" />
          </div>

          {/* Destination Box */}
          <div className="col-span-5 space-y-0.5">
            <div className="text-[9px] text-slate-400 flex items-center justify-between">
              <span>DESTINATION ({target.type})</span>
              <button
                onClick={() => handleJumpTo(cable.toNode)}
                title="Pan camera to destination socket"
                className="text-sky-400 hover:text-white flex items-center space-x-0.5 text-[8px] font-bold"
              >
                <Compass className="w-2.5 h-2.5" />
                <span>JUMP</span>
              </button>
            </div>
            <div className="font-bold text-white truncate text-[11px]" title={target.name}>
              {target.name}
            </div>
            <div className="text-[10px] text-teal-300 truncate">
              Socket: <span className="font-bold">{target.port}</span>
            </div>
          </div>
        </div>

        {/* Digital Console Patching Context */}
        {digitalMapping && (
          <div className="bg-sky-950/40 rounded-lg p-2 border border-sky-800/50 flex items-center justify-between text-[11px]">
            <div className="truncate">
              <span className="text-[9px] text-sky-400 block font-bold">
                SQ-5 DIGITAL CONSOLE PATCH ({digitalMapping.type}):
              </span>
              <span className="font-bold text-white">{digitalMapping.label}</span>
              <span className="text-slate-400 text-[10px] ml-2 font-normal">
                {digitalMapping.details}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Actions Toolbar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
          <span className="text-slate-500">
            Click anywhere on canvas or press <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-300">Esc</kbd> to exit trace
          </span>

          <button
            onClick={handleUnplug}
            className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white rounded border border-rose-700 flex items-center space-x-1 font-bold transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>UNPLUG WIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
