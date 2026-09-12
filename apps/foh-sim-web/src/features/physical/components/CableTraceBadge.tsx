import React, { useEffect } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { useReactFlow } from '@xyflow/react';
import {
  ArrowDown,
  Trash2,
  X,
  Compass
} from 'lucide-react';

export const CableTraceBadge: React.FC = () => {
  const activeTrace = useSimulationStore((s) => s.activeTrace);
  const clearTrace = useSimulationStore((s) => s.clearTrace);
  const setSelectedNodeId = useSimulationStore((s) => s.setSelectedNodeId);
  const removeCable = useSimulationStore((s) => s.removeCable);
  const sim = useSimulationStore((s) => s.sim);
  const signalPresence = useSimulationStore((s) => s.signalPresence);

  const { setCenter, getNode } = useReactFlow();

  // Clear node inspector if cable trace opens so they don't collide on the right side
  useEffect(() => {
    if (activeTrace?.cableId) {
      setSelectedNodeId(null);
    }
  }, [activeTrace?.cableId, setSelectedNodeId]);

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

  const getCableColor = (signalType?: string) => {
    switch (signalType) {
      case 'mic':
        return '#38bdf8';
      case 'instrument':
        return '#fb923c';
      case 'dsnake':
        return '#34d399';
      case 'iem':
        return '#2dd4bf';
      case 'click':
      case 'comms':
        return '#facc15';
      case 'speaker':
        return '#94a3b8';
      case 'usb':
        return '#fbbf24';
      case 'video':
        return '#818cf8';
      default:
        return '#64748b';
    }
  };

  const cableColor = getCableColor(cable.signalType);

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
          details: `${ch.stereo ? 'Stereo Linked' : 'Mono'} | Fader: ${ch.faderLevel > -80 ? `${ch.faderLevel} dB` : '-inf'}`
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cable-trace-title"
      className="absolute right-4 top-4 w-80 sm:w-88 bg-[#141417]/95 backdrop-blur-md border border-white/15 rounded-xl shadow-[0_16px_40px_-6px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.15)] z-20 overflow-hidden font-sans text-neutral-100 animate-in fade-in slide-in-from-right-4 duration-200 select-none"
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#1c1c20]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <h2 id="cable-trace-title" className="font-semibold text-xs tracking-wider text-white uppercase font-mono">
            Cable Trace
          </h2>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-medium border ${
              hasSignal
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-white/[0.04] text-neutral-400 border-white/[0.08]'
            }`}
          >
            {hasSignal ? 'LIVE SIGNAL' : 'IDLE'}
          </span>
        </div>

        <button
          onClick={clearTrace}
          title="Close trace (Esc)"
          className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-3 font-mono text-xs max-h-[calc(100vh-140px)] overflow-y-auto">
        {/* Physical Connection Route: Source -> Divider -> Destination */}
        <div className="bg-black/60 rounded-lg border border-white/[0.08] p-3 space-y-2.5">
          {/* Source Box */}
          <div className="space-y-1">
            <div className="text-[9px] text-neutral-400 flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-neutral-400">SOURCE ({source.type})</span>
              <button
                onClick={() => handleJumpTo(cable.fromNode)}
                title="Pan camera to source device"
                className="text-neutral-400 hover:text-white flex items-center space-x-1 text-[9px] font-mono hover:underline"
              >
                <Compass className="w-3 h-3" />
                <span>JUMP</span>
              </button>
            </div>
            <div className="font-semibold text-white text-xs truncate" title={source.name}>
              {source.name}
            </div>
            <div className="text-[10px] text-neutral-300">
              Port: <span className="text-white font-medium">{source.port}</span>
            </div>
          </div>

          {/* Wire Flow Indicator */}
          <div className="flex items-center justify-between py-1 px-2 bg-white/[0.03] rounded border border-white/[0.06]">
            <div className="flex items-center space-x-2 text-[10px]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cableColor }}
              />
              <span className="text-neutral-300 uppercase tracking-wider text-[9px]">
                {cable.signalType || 'standard'} wire
              </span>
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-neutral-400" />
          </div>

          {/* Destination Box */}
          <div className="space-y-1">
            <div className="text-[9px] text-neutral-400 flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-neutral-400">DESTINATION ({target.type})</span>
              <button
                onClick={() => handleJumpTo(cable.toNode)}
                title="Pan camera to destination socket"
                className="text-neutral-400 hover:text-white flex items-center space-x-1 text-[9px] font-mono hover:underline"
              >
                <Compass className="w-3 h-3" />
                <span>JUMP</span>
              </button>
            </div>
            <div className="font-semibold text-white text-xs truncate" title={target.name}>
              {target.name}
            </div>
            <div className="text-[10px] text-neutral-300">
              Socket: <span className="text-white font-medium">{target.port}</span>
            </div>
          </div>
        </div>

        {/* Digital Console Patching Context */}
        {digitalMapping && (
          <div className="bg-black/50 rounded-lg p-2.5 border border-white/[0.08] text-[11px] space-y-1">
            <span className="text-[9px] text-neutral-400 block font-mono uppercase tracking-wider font-semibold">
              SQ-5 CONSOLE PATCH ({digitalMapping.type})
            </span>
            <div className="font-semibold text-white truncate">{digitalMapping.label}</div>
            <div className="text-neutral-400 text-[10px] font-normal">{digitalMapping.details}</div>
          </div>
        )}

        {/* Bottom Actions Toolbar */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.08] text-[10px]">
          <span className="text-neutral-500 text-[9px]">
            Press <kbd className="px-1 py-0.5 bg-white/[0.08] rounded border border-white/10 text-neutral-300">Esc</kbd> to exit
          </span>

          <button
            onClick={handleUnplug}
            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white rounded-lg border border-red-500/20 flex items-center space-x-1 font-mono transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>UNPLUG WIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
