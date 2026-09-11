import React, { memo } from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';
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
  const removeCable = useSimulationStore((s) => s.removeCable);
  const hasSignal = useSimulationStore((s) => s.signalPresence.cableHasSignal[id]);
  const signalType = (data?.signalType as SignalType) || 'generic';

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
      default:
        return '#64748b';
    }
  };

  const cableColor = getCableColor();

  return (
    <>
      {/* Invisible wide hit area for easy clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer pointer-events-stroke"
      />

      {/* Glow shadow when carrying signal */}
      {hasSignal && (
        <path
          d={edgePath}
          fill="none"
          stroke={cableColor}
          strokeWidth={7}
          strokeOpacity={0.3}
          className="pointer-events-none filter blur-[2px]"
        />
      )}

      {/* Main Cable Line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={selected ? '#ffffff' : cableColor}
        strokeWidth={selected ? 4 : signalType === 'dsnake' ? 3.5 : 2.5}
        strokeDasharray={signalType === 'dsnake' ? '6 3' : undefined}
        className={`transition-all cursor-pointer ${
          hasSignal ? 'opacity-100' : 'opacity-70'
        } hover:stroke-white`}
      />

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
