import React from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';
import { useSimulationStore } from '../../../store/simulationStore';
import { SignalType } from '@foh-sim/simulation-core';

export const BezierCableEdge: React.FC<EdgeProps> = ({
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
  const { removeCable, signalPresence } = useSimulationStore();
  const signalType = (data?.signalType as SignalType) || 'generic';
  const hasSignal = signalPresence.cableHasSignal[id];

  // Calculate standard bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.35 // realistic cable curve
  });

  const getCableColor = () => {
    switch (signalType) {
      case 'mic':
        return '#38bdf8'; // Sky blue
      case 'instrument':
        return '#fb923c'; // Orange
      case 'dsnake':
        return '#34d399'; // Emerald green
      case 'iem':
        return '#2dd4bf'; // Teal
      case 'click':
      case 'comms':
        return '#facc15'; // Yellow
      case 'speaker':
        return '#94a3b8'; // Grey
      default:
        return '#64748b';
    }
  };

  const cableColor = getCableColor();

  return (
    <>
      {/* Glow shadow when carrying signal */}
      {hasSignal && (
        <path
          d={edgePath}
          fill="none"
          stroke={cableColor}
          strokeWidth={6}
          strokeOpacity={0.25}
          className="pointer-events-none filter blur-[2px]"
        />
      )}

      {/* Main Cable Line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={cableColor}
        strokeWidth={selected ? 4 : signalType === 'dsnake' ? 3.5 : 2.5}
        strokeDasharray={signalType === 'dsnake' ? '6 3' : undefined}
        className={`transition-all cursor-pointer ${
          hasSignal ? 'opacity-100' : 'opacity-60'
        } hover:stroke-white`}
      />

      {/* Interactive Delete Handle on Hover / Selection */}
      {selected && (
        <foreignObject
          width={24}
          height={24}
          x={labelX - 12}
          y={labelY - 12}
          className="overflow-visible"
        >
          <button
            onClick={() => removeCable(id)}
            title="Unplug cable"
            className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-lg border border-white/40 cursor-pointer"
          >
            ×
          </button>
        </foreignObject>
      )}
    </>
  );
};
