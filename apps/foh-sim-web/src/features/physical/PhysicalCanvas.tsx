import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useSimulationStore } from '../../store/simulationStore';
import { AR2412Node } from './nodes/AR2412Node';
import { SQ5RearNode } from './nodes/SQ5RearNode';
import { StageItemNode } from './nodes/StageItemNode';
import { BezierCableEdge } from './edges/BezierCableEdge';
import { StageItemPalette } from './StageItemPalette';
import { NodeDetailModal } from './NodeDetailModal';
import { CableTraceBadge } from './components/CableTraceBadge';
import { SignalType } from '@foh-sim/simulation-core';

const PhysicalCanvasContent: React.FC = () => {
  const stageItems = useSimulationStore((s) => s.sim.physical.stageItems);
  const cables = useSimulationStore((s) => s.sim.physical.cables);
  const stageBoxPosition = useSimulationStore((s) => s.sim.physical.stageBox.position);
  const consolePosition = useSimulationStore((s) => s.sim.physical.console.position);
  const updateStageItemPosition = useSimulationStore((s) => s.updateStageItemPosition);
  const removeStageItem = useSimulationStore((s) => s.removeStageItem);
  const connectCable = useSimulationStore((s) => s.connectCable);
  const removeCable = useSimulationStore((s) => s.removeCable);
  const setSelectedNodeId = useSimulationStore((s) => s.setSelectedNodeId);
  const clearTrace = useSimulationStore((s) => s.clearTrace);

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

  const initialNodes: Node[] = useMemo(() => {
    const list: Node[] = [
      {
        id: 'stagebox-ar2412',
        type: 'ar2412',
        position: stageBoxPosition,
        data: { label: 'AR2412 Stage Box' }
      },
      {
        id: 'console-sq5',
        type: 'sq5rear',
        position: consolePosition,
        data: { label: 'SQ-5 Console' }
      }
    ];

    for (const item of stageItems) {
      list.push({
        id: item.id,
        type: 'stageItem',
        position: item.position,
        data: { item }
      });
    }

    return list;
  }, [stageBoxPosition, consolePosition, stageItems]);

  const initialEdges: Edge[] = useMemo(() => {
    return cables.map((cable) => ({
      id: cable.id,
      source: cable.fromNode,
      target: cable.toNode,
      sourceHandle: cable.fromPort,
      targetHandle: cable.toPort,
      type: 'bezierCable',
      data: { signalType: cable.signalType }
    }));
  }, [cables]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize state when physical stage items or cables change
  useEffect(() => {
    setNodes((prevNodes) => {
      const prevMap = new Map(prevNodes.map((n) => [n.id, n]));
      const nextList: Node[] = [
        {
          id: 'stagebox-ar2412',
          type: 'ar2412',
          position: stageBoxPosition,
          data: { label: 'AR2412 Stage Box' }
        },
        {
          id: 'console-sq5',
          type: 'sq5rear',
          position: consolePosition,
          data: { label: 'SQ-5 Console' }
        }
      ];

      for (const item of stageItems) {
        const existing = prevMap.get(item.id);
        nextList.push({
          id: item.id,
          type: 'stageItem',
          position: existing?.position || item.position,
          data: { item }
        });
      }
      return nextList;
    });
  }, [stageItems, stageBoxPosition, consolePosition, setNodes]);

  useEffect(() => {
    setEdges(
      cables.map((cable) => ({
        id: cable.id,
        source: cable.fromNode,
        target: cable.toNode,
        sourceHandle: cable.fromPort,
        targetHandle: cable.toPort,
        type: 'bezierCable',
        data: { signalType: cable.signalType }
      }))
    );
  }, [cables, setEdges]);

  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node, allNodes: Node[]) => {
      const selectedNodes = allNodes?.filter((n) => n.selected) || [];
      if (selectedNodes.length > 1) {
        selectedNodes.forEach((n) => {
          if (n.id !== 'stagebox-ar2412' && n.id !== 'console-sq5') {
            updateStageItemPosition(n.id, n.position);
          }
        });
      } else {
        updateStageItemPosition(node.id, node.position);
      }
    },
    [updateStageItemPosition]
  );

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          selected: e.id === edge.id
        }))
      );
    },
    [setEdges]
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
      } else if (connection.sourceHandle.includes('usb') || connection.targetHandle.includes('usb')) {
        signalType = 'usb';
      } else if (
        connection.sourceHandle.includes('hdmi') ||
        connection.targetHandle.includes('hdmi') ||
        connection.sourceHandle.includes('pgm') ||
        connection.targetHandle.includes('pgm')
      ) {
        signalType = 'video';
      } else if (connection.sourceHandle.includes('thru-1') && (connection.source.includes('speaker') || connection.source.includes('fill') || connection.source.includes('sub'))) {
        signalType = 'speaker';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTrace();
        setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearTrace, setSelectedNodeId]);

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        onPaneClick={() => {
          setSelectedNodeId(null);
          clearTrace();
        }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
        onlyRenderVisibleElements={true}
        elementsSelectable={true}
        selectionMode={SelectionMode.Partial}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        deleteKeyCode={['Backspace', 'Delete']}
        onNodesDelete={(nodesToDelete) => {
          nodesToDelete.forEach((node) => {
            if (node.id !== 'stagebox-ar2412' && node.id !== 'console-sq5') {
              removeStageItem(node.id);
            }
          });
        }}
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

      {/* Floating Cable Trace HUD Badge */}
      <CableTraceBadge />

      {/* Stage Item Draggable Palette */}
      <StageItemPalette />

      {/* Node Details Inspector Modal */}
      <NodeDetailModal />
    </div>
  );
};

export const PhysicalCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <PhysicalCanvasContent />
    </ReactFlowProvider>
  );
};
