import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useSimulationStore } from '../../../store/simulationStore';
import { StageItem } from '@foh-sim/simulation-core';
import {
  Mic,
  Music,
  Box,
  Laptop,
  Clock,
  Radio,
  Speaker,
  Headphones,
  Trash2
} from 'lucide-react';

export const StageItemNode: React.FC<NodeProps> = memo(({ id, selected, data }) => {
  const setSelectedNodeId = useSimulationStore((s) => s.setSelectedNodeId);
  const removeStageItem = useSimulationStore((s) => s.removeStageItem);
  const storeItem = useSimulationStore((s) => s.sim.physical.stageItems.find((i) => i.id === id));
  
  const stageItem = (data?.item as StageItem) || storeItem;

  if (!stageItem) return null;

  const getCategoryIcon = () => {
    switch (stageItem.category) {
      case 'mic':
        return <Mic className="w-3.5 h-3.5 text-sky-400" />;
      case 'instrument':
        return <Music className="w-3.5 h-3.5 text-orange-400" />;
      case 'di-box':
        return <Box className="w-3.5 h-3.5 text-amber-400" />;
      case 'playback':
        return <Laptop className="w-3.5 h-3.5 text-indigo-400" />;
      case 'click':
        return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
      case 'comms':
        return <Radio className="w-3.5 h-3.5 text-emerald-400" />;
      case 'speaker':
        return <Speaker className="w-3.5 h-3.5 text-slate-300" />;
      case 'iem':
        return <Headphones className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Box className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBorderColor = () => {
    if (selected) return 'border-sky-400 ring-2 ring-sky-400/30';
    switch (stageItem.category) {
      case 'mic':
        return 'border-sky-800/80';
      case 'instrument':
        return 'border-orange-800/80';
      case 'di-box':
        return 'border-amber-800/80';
      case 'speaker':
        return 'border-slate-700';
      case 'iem':
        return 'border-teal-800/80';
      case 'click':
      case 'comms':
        return 'border-yellow-800/80';
      default:
        return 'border-slate-700';
    }
  };

  const isDI = stageItem.category === 'di-box';
  const isSpeaker = stageItem.category === 'speaker';
  const isIEM = stageItem.category === 'iem';
  const isWirelessDualRx = stageItem.typeId === 'rx-wireless-dual' || stageItem.id === 'item-wireless-rx';
  const isStereo = stageItem.typeId.includes('stereo') || stageItem.typeId.includes('propresenter') || isWirelessDualRx;

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      className={`min-w-[160px] max-w-[210px] bg-slate-900/95 backdrop-blur border rounded-lg shadow-xl px-2.5 py-1.5 text-slate-100 font-sans cursor-pointer transition-all ${getBorderColor()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 mb-1">
        <div className="flex items-center space-x-1.5 overflow-hidden">
          {getCategoryIcon()}
          <span className="text-xs font-semibold truncate text-slate-200" title={stageItem.name}>
            {stageItem.name}
          </span>
        </div>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeStageItem(id);
            }}
            title="Delete item"
            className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors ml-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Ports Area */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 py-0.5">
        {/* Left Side: Input Handles */}
        {isWirelessDualRx ? (
          // Dual Wireless Receiver RF Inputs
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-1"
                className="!w-3 !h-3 !rounded-full !bg-sky-400 !border-2 !border-slate-950"
              />
              <span className="text-[9px] text-sky-300">RF A</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-2"
                className="!w-3 !h-3 !rounded-full !bg-sky-400 !border-2 !border-slate-950"
              />
              <span className="text-[9px] text-sky-300">RF B</span>
            </div>
          </div>
        ) : (isDI || isSpeaker || isIEM) ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-1"
                className="!w-3 !h-3 !rounded-full !bg-amber-500 !border-2 !border-slate-950"
              />
              <span className="text-[9px] text-amber-300">{isStereo ? 'IN L' : 'IN'}</span>
            </div>
            {isStereo && isDI && (
              <div className="flex items-center space-x-1">
                <Handle
                  type="target"
                  position={Position.Left}
                  id="in-2"
                  className="!w-3 !h-3 !rounded-full !bg-amber-500 !border-2 !border-slate-950"
                />
                <span className="text-[9px] text-amber-300">IN R</span>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Right Side: Output & Thru Handles */}
        <div className="flex items-center space-x-2 ml-auto">
          {/* DI Thru Jack */}
          {isDI && (
            <div className="flex items-center space-x-1">
              <span className="text-[9px] text-slate-400">THRU</span>
              <Handle
                type="source"
                position={Position.Right}
                id="thru-1"
                className="!w-2.5 !h-2.5 !rounded-full !bg-slate-600 !border !border-slate-950"
              />
            </div>
          )}

          {/* Speaker Thru / Daisy Chain Jack */}
          {isSpeaker && (
            <div className="flex items-center space-x-1">
              <span className="text-[9px] text-teal-300">THRU</span>
              <Handle
                type="source"
                position={Position.Right}
                id="thru-1"
                className="!w-3 !h-3 !rounded-full !bg-teal-500 !border-2 !border-slate-950 shadow-[0_0_6px_#14b8a6]"
              />
            </div>
          )}

          {/* Audio Outputs */}
          {!isSpeaker && !isIEM && (
            <div className="flex flex-col space-y-1 items-end">
              <div className="flex items-center space-x-1">
                <span className="text-[9px] text-sky-400">
                  {isWirelessDualRx ? 'CH A' : isStereo ? 'OUT L' : 'OUT'}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id="out-1"
                  className="!w-3 !h-3 !rounded-full !bg-sky-500 !border-2 !border-slate-950"
                />
              </div>
              {isStereo && (
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] text-sky-400">
                    {isWirelessDualRx ? 'CH B' : 'OUT R'}
                  </span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="out-2"
                    className="!w-3 !h-3 !rounded-full !bg-sky-500 !border-2 !border-slate-950"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
