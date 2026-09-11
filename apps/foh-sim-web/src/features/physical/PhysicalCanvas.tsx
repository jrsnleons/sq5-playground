import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSimulationStore } from '../../store/simulationStore';
import { AR2412Node } from './nodes/AR2412Node';
import { SQ5RearNode } from './nodes/SQ5RearNode';
import { StageItemNode } from './nodes/StageItemNode';
import { BezierCableEdge } from './edges/BezierCableEdge';
import { StageItemPalette } from './StageItemPalette';
import { NodeDetailModal } from './NodeDetailModal';
import { SignalType } from '@foh-sim/simulation-core';

export const PhysicalCanvas: React.FC = () => {
  const {
    sim,
    updateStageItemPosition,
    connectCable,
    removeCable,
    setSelectedNodeId
  } = useSimulationStore();

  const nodeTypes = useMemo(
    () => ({
      ar2412: AR2412Node,
      sq5rear: SQ5RearNode,
      stageItem: StageItemNode
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      bezierCable: BezierCableEdge
    }),
    []
  );

  const nodes: Node[] = useMemo(() => {
    const list: Node[] = [
      {
        id: 'stagebox-ar2412',
        type: 'ar2412',
        position: sim.physical.stageBox.position,
        data: { label: 'AR2412 Stage Box' }
      },
      {
        id: 'console-sq5',
        type: 'sq5rear',
        position: sim.physical.console.position,
        data: { label: 'SQ-5 Console' }
      }
    ];

    for (const item of sim.physical.stageItems) {
      list.push({
        id: item.id,
        type: 'stageItem',
        position: item.position,
        data: { item }
      });
    }

    return list;
  }, [sim.physical]);

  const edges: Edge[] = useMemo(() => {
    return sim.physical.cables.map((cable) => ({
      id: cable.id,
      source: cable.fromNode,
      target: cable.toNode,
      sourceHandle: cable.fromPort,
      targetHandle: cable.toPort,
      type: 'bezierCable',
      data: { signalType: cable.signalType }
    }));
  }, [sim.physical.cables]);

  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      updateStageItemPosition(node.id, node.position);
    },
    [updateStageItemPosition]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
      ) {
        return;
      }

      let signalType: SignalType = 'mic';
      if (connection.sourceHandle.includes('dsnake') || connection.targetHandle.includes('slink')) {
        signalType = 'dsnake';
      } else if (connection.sourceHandle.includes('thru') || connection.sourceHandle.includes('in-1')) {
        signalType = 'instrument';
      } else if (connection.sourceHandle.includes('ar-out-') && Number(connection.sourceHandle.split('-')[2]) <= 8) {
        signalType = 'iem';
      } else if (connection.sourceHandle.includes('click')) {
        signalType = 'click';
      } else if (connection.sourceHandle.includes('comms')) {
        signalType = 'comms';
      } else if (connection.targetHandle.includes('speaker') || connection.sourceHandle.includes('speaker')) {
        signalType = 'speaker';
      }

      connectCable(
        connection.source,
        connection.sourceHandle,
        connection.target,
        connection.targetHandle,
        signalType
      );
    },
    [connectCable]
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 select-none">
      {/* Logical Zone Labels Background */}
      <div className="absolute inset-0 pointer-events-none flex z-0">
        {/* STAGE ZONE */}
        <div className="w-1/2 h-full border-r border-slate-800/60 p-6 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-black text-slate-800 tracking-wider font-mono">
              STAGE ZONE
            </span>
            <span className="text-[11px] text-slate-600 uppercase font-mono">
              (Sources, DIs, AR2412)
            </span>
          </div>
        </div>

        {/* FOH ZONE */}
        <div className="w-1/2 h-full p-6 flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-black text-slate-800 tracking-wider font-mono">
              FOH / CONSOLE ZONE
            </span>
            <span className="text-[11px] text-slate-600 uppercase font-mono">
              (SQ-5 Local I/O, PA &amp; Stream)
            </span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2.5}
        deleteKeyCode={['Backspace', 'Delete']}
        onEdgesDelete={(edgesToDelete) => {
          edgesToDelete.forEach((edge) => removeCable(edge.id));
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls className="!bg-slate-900 !border-slate-700 !fill-slate-300" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'ar2412') return '#38bdf8';
            if (node.type === 'sq5rear') return '#34d399';
            return '#f59e0b';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="!bottom-4 !right-4"
        />
      </ReactFlow>

      {/* Stage Item Draggable Palette */}
      <StageItemPalette />

      {/* Node Details Inspector Modal */}
      <NodeDetailModal />
    </div>
  );
};
