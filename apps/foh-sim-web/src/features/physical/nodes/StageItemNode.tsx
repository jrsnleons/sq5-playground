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
    if (isItemTraced) return 'border-sky-400 ring-2 ring-sky-400/60 shadow-[0_0_18px_rgba(56,189,248,0.4)] z-30';
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
      case 'stream':
        return 'border-cyan-800/80';
      case 'processing':
        return 'border-violet-800/80';
      default:
        return 'border-slate-700';
    }
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
      return '!w-3 !h-3 !rounded-full !border-2 !bg-slate-800 !border-slate-600 hover:!border-slate-400 transition-all';
    }
    switch (connector.toLowerCase()) {
      case 'rf':
      case 'rf-in':
      case 'rf-out':
        return '!w-3 !h-3 !rounded-full !border-2 !bg-purple-400 !border-slate-950 shadow-[0_0_6px_#c084fc] transition-all';
      case 'trs':
      case 'ts':
      case 'instrument':
        return '!w-3 !h-3 !rounded-full !border-2 !bg-amber-500 !border-slate-950 shadow-[0_0_6px_#f59e0b] transition-all';
      case 'ethercon':
        return '!w-3 !h-3 !rounded-sm !border-2 !bg-emerald-500 !border-slate-950 shadow-[0_0_6px_#10b981] transition-all';
      case 'thru':
      case 'speaker':
        return '!w-3 !h-3 !rounded-full !border-2 !bg-teal-400 !border-slate-950 shadow-[0_0_6px_#2dd4bf] transition-all';
      case 'usb':
        return '!w-3 !h-3 !rounded-sm !border-2 !bg-amber-400 !border-slate-950 shadow-[0_0_6px_#fbbf24] transition-all';
      case 'hdmi':
      case 'hdmi-in':
      case 'hdmi-out':
        return '!w-3 !h-3 !rounded-sm !border-2 !bg-indigo-400 !border-slate-950 shadow-[0_0_6px_#818cf8] transition-all';
      case 'xlr':
      default:
        return '!w-3 !h-3 !rounded-full !border-2 !bg-sky-400 !border-slate-950 shadow-[0_0_6px_#38bdf8] transition-all';
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
