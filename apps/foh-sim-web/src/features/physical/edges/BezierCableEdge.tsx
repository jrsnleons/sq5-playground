import React, { memo } from 'react';
import { EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react';
import { useSimulationStore } from '../../../store/simulationStore';
import { SignalType } from '@foh-sim/simulation-core';

export const BezierCableEdge: React.FC<EdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data
}) => {
  const { setEdges } = useReactFlow();
  const removeCable = useSimulationStore((s) => s.removeCable);
  const hasSignal = useSimulationStore((s) => s.signalPresence.cableHasSignal[id]);
  const activeTrace = useSimulationStore((s) => s.activeTrace);
  const setLockedTrace = useSimulationStore((s) => s.setLockedTrace);
  const setSelectedNodeId = useSimulationStore((s) => s.setSelectedNodeId);
  const cables = useSimulationStore((s) => s.sim.physical.cables);
  const currentCable = cables.find((c) => c.id === id);
  const signalType = (data?.signalType as SignalType) || 'generic';

  const isTraced = activeTrace?.cableId === id;
  const hasActiveTrace = !!activeTrace?.cableId;
  const isDimmed = hasActiveTrace && !isTraced;

  // Calculate standard bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.35
  });

  const getCableColor = () => {
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

  const cableColor = getCableColor();

  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(null);
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        selected: edge.id === id
      }))
    );
    if (currentCable) {
      setLockedTrace(currentCable.toPort, currentCable.toNode, currentCable.id);
    }
  };

  return (
    <>
      {/* Invisible wide hit area for easy clicking and track selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onClick={handleEdgeClick}
        className="cursor-pointer pointer-events-stroke"
      />

      {/* Tracing intense illuminated glow halo */}
      {isTraced && (
        <path
          d={edgePath}
          fill="none"
          stroke={cableColor}
          strokeWidth={11}
          strokeOpacity={0.65}
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* Glow shadow when carrying signal and not dimmed */}
      {!isTraced && hasSignal && !isDimmed && (
        <path
          d={edgePath}
          fill="none"
          stroke={cableColor}
          strokeWidth={6.5}
          strokeOpacity={0.35}
          className="pointer-events-none"
        />
      )}

      {/* Main Cable Line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isTraced ? '#ffffff' : selected ? '#ffffff' : cableColor}
        strokeWidth={isTraced ? 4.5 : selected ? 4 : signalType === 'dsnake' ? 3.5 : 2.5}
        strokeDasharray={signalType === 'dsnake' && !isTraced ? '6 3' : undefined}
        onClick={handleEdgeClick}
        className={`transition-all cursor-pointer ${
          isDimmed
            ? 'opacity-15'
            : isTraced
            ? 'opacity-100'
            : hasSignal
            ? 'opacity-100'
            : 'opacity-70'
        } hover:stroke-white`}
      />

      {/* Animated Traveling Signal Pulse along the wire when traced */}
      {isTraced && (
        <path
          d={edgePath}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.5}
          strokeDasharray="8 12"
          className="pointer-events-none animate-cable-flow"
        />
      )}

      {/* Interactive Unplug Button when cable is selected */}
      {selected && (
        <foreignObject
          width={70}
          height={28}
          x={labelX - 35}
          y={labelY - 14}
          className="overflow-visible"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCable(id);
            }}
            title="Unplug Cable (Backspace / Delete)"
            className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shadow-xl border border-white/50 cursor-pointer transition-transform hover:scale-105"
          >
            <span>×</span>
            <span>Unplug</span>
          </button>
        </foreignObject>
      )}
    </>
  );
});
