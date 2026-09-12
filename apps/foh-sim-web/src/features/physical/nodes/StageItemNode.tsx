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
  Trash2,
  Tv,
  Monitor,
  Cpu
} from 'lucide-react';

export const StageItemNode: React.FC<NodeProps> = memo(({ id, selected, data }) => {
  const setSelectedNodeId = useSimulationStore((s) => s.setSelectedNodeId);
  const removeStageItem = useSimulationStore((s) => s.removeStageItem);
  const activeTrace = useSimulationStore((s) => s.activeTrace);
  const setLockedTrace = useSimulationStore((s) => s.setLockedTrace);
  
  const stageItem = data?.item as StageItem;

  if (!stageItem) return null;

  const cables = useSimulationStore((s) => s.sim.physical.cables);

  const isItemTraced =
    activeTrace?.nodeId === id ||
    cables.some(
      (c) =>
        c.id === activeTrace?.cableId &&
        (c.fromNode === id || c.toNode === id)
    );

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
      case 'stream':
        return <Tv className="w-3.5 h-3.5 text-cyan-400" />;
      case 'processing':
        return <Cpu className="w-3.5 h-3.5 text-violet-400" />;
      default:
        return <Box className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBorderColor = () => {
    if (isItemTraced) return 'border-white ring-2 ring-white/50 z-30 shadow-[0_0_0_1px_rgba(255,255,255,0.4)]';
    if (selected) return 'border-white ring-2 ring-white/40';
    return 'border-white/20 hover:border-white/40';
  };

  const isDI = stageItem.category === 'di-box';
  const isSpeaker = stageItem.category === 'speaker';
  const isIEM = stageItem.category === 'iem';
  const isWirelessDualRx = stageItem.typeId === 'rx-wireless-dual' || stageItem.id === 'item-wireless-rx';
  const isWavesPC = stageItem.typeId === 'waves-superrack-pc' || stageItem.id === 'item-waves-pc';
  const isBehringerInterface = stageItem.typeId === 'interface-behringer-umc' || stageItem.id === 'item-behringer-interface';
  const isStreamPC = stageItem.typeId === 'stream-pc' || stageItem.id === 'item-stream-pc';
  const isOseeSwitcher = stageItem.typeId === 'switcher-osee-basic' || stageItem.id === 'item-osee-switcher';
  const isStreamMonitor = stageItem.typeId === 'monitor-stream-display' || stageItem.id === 'item-stream-monitor';
  const isStereo = stageItem.typeId.includes('stereo') || stageItem.typeId.includes('propresenter') || isWirelessDualRx;

  const isPortConnected = (portId: string) =>
    cables.some(
      (c) =>
        (c.fromNode === id && c.fromPort === portId) ||
        (c.toNode === id && c.toPort === portId)
    );

  const getHandleClass = (connector: string, portId: string) => {
    const isConnected = isPortConnected(portId);
    if (!isConnected) {
      return '!w-3 !h-3 !rounded-full !border !bg-[#24242a] !border-neutral-400 hover:!border-white hover:!bg-neutral-600 transition-all';
    }
    switch (connector.toLowerCase()) {
      case 'ethercon':
      case 'usb':
      case 'hdmi':
      case 'hdmi-in':
      case 'hdmi-out':
        return '!w-3 !h-3 !rounded-sm !border !bg-white !border-black transition-all';
      default:
        return '!w-3 !h-3 !rounded-full !border !bg-white !border-black transition-all';
    }
  };

  const isCustom = Boolean(stageItem.customPorts && stageItem.customPorts.length > 0);
  const customInputs = stageItem.customPorts?.filter((p) => p.direction === 'in') || [];
  const customOutputs = stageItem.customPorts?.filter((p) => p.direction === 'out' || p.direction === 'thru') || [];

  return (
    <div
      onClick={() => {
        setSelectedNodeId(id);
        const nodeCable = cables.find((c) => c.fromNode === id || c.toNode === id);
        if (nodeCable) setLockedTrace(null, id);
      }}
      className={`min-w-[175px] max-w-[225px] bg-[#161619] border rounded-xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.18)] p-2.5 text-neutral-100 font-sans cursor-pointer transition-all ${getBorderColor()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="p-1 rounded bg-white/[0.06] border border-white/10 shrink-0">
            {getCategoryIcon()}
          </div>
          <span className="text-xs font-semibold truncate text-white tracking-wide" title={stageItem.name}>
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
            className="text-neutral-400 hover:text-red-400 p-0.5 rounded transition-colors ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Ports Area */}
      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 py-0.5">
        {/* Left Side: Input Handles */}
        {isCustom ? (
          <div className="flex flex-col space-y-1">
            {customInputs.map((port) => (
              <div key={port.id} className="flex items-center space-x-1">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={port.id}
                  className={getHandleClass(port.connector, port.id)}
                />
                <span className="text-[8px] text-slate-300">{port.label || port.id}</span>
              </div>
            ))}
          </div>
        ) : isWavesPC ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="usb-1"
                className={getHandleClass('usb', 'usb-1')}
              />
              <span className="text-[9px] text-amber-300 font-mono">USB 32x32</span>
            </div>
          </div>
        ) : isBehringerInterface ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-1"
                className={getHandleClass('xlr', 'in-1')}
              />
              <span className="text-[9px] text-sky-300 font-mono">IN 1 (L)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-2"
                className={getHandleClass('xlr', 'in-2')}
              />
              <span className="text-[9px] text-sky-300 font-mono">IN 2 (R)</span>
            </div>
          </div>
        ) : isStreamPC ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="usb-in"
                className={getHandleClass('usb', 'usb-in')}
              />
              <span className="text-[9px] text-amber-300 font-mono">USB AUD</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="usb-cam"
                className={getHandleClass('usb', 'usb-cam')}
              />
              <span className="text-[9px] text-amber-300 font-mono">USB CAM</span>
            </div>
          </div>
        ) : isOseeSwitcher ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-1"
                className={getHandleClass('xlr', 'in-1')}
              />
              <span className="text-[9px] text-sky-300 font-mono">AUD L (7)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-2"
                className={getHandleClass('xlr', 'in-2')}
              />
              <span className="text-[9px] text-sky-300 font-mono">AUD R (8)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="hdmi-in-1"
                className={getHandleClass('hdmi', 'hdmi-in-1')}
              />
              <span className="text-[9px] text-indigo-300 font-mono">CAM 1</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="hdmi-in-2"
                className={getHandleClass('hdmi', 'hdmi-in-2')}
              />
              <span className="text-[9px] text-indigo-300 font-mono">CAM 2</span>
            </div>
          </div>
        ) : isStreamMonitor ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-1"
                className={getHandleClass('xlr', 'in-1')}
              />
              <span className="text-[9px] text-teal-300 font-mono">MON L (9)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-2"
                className={getHandleClass('xlr', 'in-2')}
              />
              <span className="text-[9px] text-teal-300 font-mono">MON R (10)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="hdmi-in"
                className={getHandleClass('hdmi', 'hdmi-in')}
              />
              <span className="text-[9px] text-indigo-300 font-mono">HDMI IN</span>
            </div>
          </div>
        ) : isWirelessDualRx ? (
          // Dual Wireless Receiver RF Inputs
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-1"
                className={getHandleClass('rf', 'in-1')}
              />
              <span className="text-[9px] text-purple-300">RF A</span>
            </div>
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-2"
                className={getHandleClass('rf', 'in-2')}
              />
              <span className="text-[9px] text-purple-300">RF B</span>
            </div>
          </div>
        ) : (isDI || isSpeaker || isIEM) ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                id="in-1"
                className={getHandleClass(isSpeaker ? 'speaker' : 'trs', 'in-1')}
              />
              <span className="text-[9px] text-amber-300">{isStereo ? 'IN L' : 'IN'}</span>
            </div>
            {isStereo && isDI && (
              <div className="flex items-center space-x-1">
                <Handle
                  type="target"
                  position={Position.Left}
                  id="in-2"
                  className={getHandleClass('trs', 'in-2')}
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
          {isCustom ? (
            <div className="flex flex-col space-y-1 items-end">
              {customOutputs.map((port) => (
                <div key={port.id} className="flex items-center space-x-1">
                  <span className="text-[8px] text-slate-300">{port.label || port.id}</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={port.id}
                    className={getHandleClass(port.connector, port.id)}
                  />
                </div>
              ))}
            </div>
          ) : isWavesPC ? (
            <div className="flex flex-col space-y-1 items-end">
              <span className="text-[8px] font-mono font-bold text-violet-400 bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-800/60">
                WAVES LIVE
              </span>
            </div>
          ) : isBehringerInterface ? (
            <div className="flex flex-col space-y-1 items-end">
              <div className="flex items-center space-x-1">
                <span className="text-[9px] text-amber-300 font-mono">USB OUT</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id="usb-out"
                  className={getHandleClass('usb', 'usb-out')}
                />
              </div>
            </div>
          ) : isStreamPC ? (
            <div className="flex flex-col space-y-1 items-end">
              <div className="flex items-center space-x-1">
                <span className="text-[9px] text-indigo-300 font-mono">HDMI OUT</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id="hdmi-out"
                  className={getHandleClass('hdmi', 'hdmi-out')}
                />
              </div>
            </div>
          ) : isOseeSwitcher ? (
            <div className="flex flex-col space-y-1 items-end">
              <div className="flex items-center space-x-1">
                <span className="text-[9px] text-indigo-300 font-mono">PGM HDMI</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id="pgm-out"
                  className={getHandleClass('hdmi', 'pgm-out')}
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[9px] text-amber-300 font-mono">UVC USB</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id="usb-out"
                  className={getHandleClass('usb', 'usb-out')}
                />
              </div>
            </div>
          ) : isStreamMonitor ? (
            <div className="flex flex-col space-y-1 items-end">
              <span className="text-[8px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60 animate-pulse">
                ON AIR
              </span>
            </div>
          ) : (
            <>
              {/* DI Thru Jack */}
              {isDI && (
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] text-slate-400">THRU</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="thru-1"
                    className={getHandleClass('trs', 'thru-1')}
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
                    className={getHandleClass('thru', 'thru-1')}
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
                      className={getHandleClass('xlr', 'out-1')}
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
                        className={getHandleClass('xlr', 'out-2')}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
