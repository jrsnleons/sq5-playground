import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
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
import { NodeDetailModal } from './NodeDetailModal';
import { CableTraceBadge } from './components/CableTraceBadge';
import { SignalType } from '@foh-sim/simulation-core';
import { Lock, Save, Bookmark, Check } from 'lucide-react';

const PhysicalCanvasContent: React.FC = () => {
  const userRole = useSimulationStore((s) => s.userRole);
  const setAuthModalOpen = useSimulationStore((s) => s.setAuthModalOpen);
  const isGuest = userRole === 'guest';

  const [savedNotice, setSavedNotice] = React.useState<string | null>(null);

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
  const setLockedTrace = useSimulationStore((s) => s.setLockedTrace);
  const saveActiveStageLayout = useSimulationStore((s) => s.saveActiveStageLayout);
  const saveStageAsDefaultPreset = useSimulationStore((s) => s.saveStageAsDefaultPreset);
  const setActiveTab = useSimulationStore((s) => s.setActiveTab);

  const handleSaveStage = () => {
    saveActiveStageLayout();
    setSavedNotice('Stage layout saved');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSetDefaultRig = () => {
    saveStageAsDefaultPreset();
    setSavedNotice('Saved as master default rig');
    setTimeout(() => setSavedNotice(null), 3000);
  };

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
        initialWidth: 680,
        initialHeight: 280,
        data: { label: 'AR2412 Stage Box' }
      },
      {
        id: 'console-sq5',
        type: 'sq5rear',
        position: consolePosition,
        initialWidth: 700,
        initialHeight: 320,
        data: { label: 'SQ-5 Console' }
      }
    ];

    for (const item of stageItems) {
      list.push({
        id: item.id,
        type: 'stageItem',
        position: item.position,
        initialWidth: 200,
        initialHeight: 120,
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
          initialWidth: 680,
          initialHeight: 280,
          data: { label: 'AR2412 Stage Box' }
        },
        {
          id: 'console-sq5',
          type: 'sq5rear',
          position: consolePosition,
          initialWidth: 700,
          initialHeight: 320,
          data: { label: 'SQ-5 Console' }
        }
      ];

      for (const item of stageItems) {
        const existing = prevMap.get(item.id);
        nextList.push({
          id: item.id,
          type: 'stageItem',
          position: existing?.position || item.position,
          initialWidth: 200,
          initialHeight: 120,
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
      setSelectedNodeId(null);
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          selected: e.id === edge.id
        }))
      );
      const cable = cables.find((c) => c.id === edge.id);
      if (cable) {
        setLockedTrace(cable.toPort, cable.toNode, cable.id);
      }
    },
    [cables, setEdges, setLockedTrace, setSelectedNodeId]
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

      const sourceItem = stageItems.find((i) => i.id === connection.source);
      const targetItem = stageItems.find((i) => i.id === connection.target);

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
      } else if (
        (connection.sourceHandle.includes('thru-1') && (connection.source.includes('speaker') || connection.source.includes('fill') || connection.source.includes('sub'))) ||
        targetItem?.category === 'speaker' ||
        sourceItem?.category === 'speaker' ||
        connection.targetHandle.includes('speaker') ||
        connection.sourceHandle.includes('speaker')
      ) {
        signalType = 'speaker';
      } else if (
        targetItem?.category === 'iem' ||
        (connection.sourceHandle.includes('ar-out-') && Number(connection.sourceHandle.split('-')[2]) <= 8)
      ) {
        signalType = 'iem';
      } else if (
        sourceItem?.category === 'instrument' ||
        connection.sourceHandle.includes('thru') ||
        (sourceItem?.category === 'playback' && targetItem?.category === 'di-box')
      ) {
        signalType = 'instrument';
      } else if (sourceItem?.category === 'click' || connection.sourceHandle.includes('click')) {
        signalType = 'click';
      } else if (sourceItem?.category === 'comms' || connection.sourceHandle.includes('comms')) {
        signalType = 'comms';
      }

      connectCable(
        connection.source,
        connection.sourceHandle,
        connection.target,
        connection.targetHandle,
        signalType
      );
    },
    [connectCable, stageItems]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearTrace();
        setSelectedNodeId(null);
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearTrace, setSelectedNodeId, setEdges]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black select-none">
      {/* Logical Zone Labels Background */}
      <div className="absolute inset-0 pointer-events-none flex z-0">
        {/* STAGE ZONE */}
        <div className="w-1/2 h-full border-r border-dashed border-white/[0.12] p-6 flex flex-col justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl font-bold text-neutral-400/80 tracking-widest font-mono uppercase">
              STAGE ZONE
            </span>
            <span className="text-[11px] text-neutral-400 uppercase font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
              Sources &bull; DIs &bull; AR2412
            </span>
          </div>
        </div>

        {/* FOH ZONE */}
        <div className="w-1/2 h-full p-6 flex flex-col justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl font-bold text-neutral-400/80 tracking-widest font-mono uppercase">
              FOH / CONSOLE ZONE
            </span>
            <span className="text-[11px] text-neutral-400 uppercase font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
              SQ-5 Local I/O &bull; PA &bull; Broadcast
            </span>
          </div>
        </div>
      </div>

      {/* Guest Read-Only Mode Banner */}
      {isGuest && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 bg-[#0A0A0A]/95 border border-white/[0.08] px-4 py-2 rounded-lg shadow-xl backdrop-blur-md">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-neutral-300">
            <Lock className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
            <span className="font-semibold">PREVIEW:</span>
          </div>
          <span className="text-neutral-400 text-xs font-sans hidden sm:inline">
            Sign in as Member or Admin to position equipment and patch cables on stage.
          </span>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-2.5 py-1 text-xs font-mono font-semibold bg-white hover:bg-neutral-200 text-black rounded-md transition-colors"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Stage Toolbar (Save Stage / Store as Scene / Set Default) */}
      {!isGuest && (
        <div className="absolute top-3 right-4 z-30 flex items-center space-x-2 bg-[#0A0A0A]/95 border border-white/[0.08] px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md font-mono text-xs">
          {savedNotice ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{savedNotice}</span>
            </div>
          ) : (
            <button
              onClick={handleSaveStage}
              title="Save current stage equipment positions and cables to browser storage"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-neutral-400" />
              <span>Save Stage</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('scenes')}
            title="Open Scenes snapshot manager to save or recall complete stage & console setups"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
            <span>Store as Scene</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={handleSetDefaultRig}
              title="Save current stage and console layout as the default starting rig for all users"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white hover:bg-neutral-200 text-black font-semibold transition-colors cursor-pointer"
            >
              <span>Set as Default Rig</span>
            </button>
          )}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!isGuest}
        nodesConnectable={!isGuest}
        onNodesChange={!isGuest ? onNodesChange : undefined}
        onEdgesChange={!isGuest ? onEdgesChange : undefined}
        onNodeDragStop={!isGuest ? handleNodeDragStop : undefined}
        onEdgeClick={handleEdgeClick}
        onConnect={!isGuest ? handleConnect : undefined}
        onPaneClick={() => {
          setSelectedNodeId(null);
          clearTrace();
          setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
        }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
        elementsSelectable={true}
        selectionMode={SelectionMode.Partial}
        selectionKeyCode={!isGuest ? 'Shift' : undefined}
        multiSelectionKeyCode={!isGuest ? 'Shift' : undefined}
        deleteKeyCode={!isGuest ? ['Backspace', 'Delete'] : []}
        onNodesDelete={
          !isGuest
            ? (nodesToDelete) => {
                nodesToDelete.forEach((node) => {
                  if (node.id !== 'stagebox-ar2412' && node.id !== 'console-sq5') {
                    removeStageItem(node.id);
                  }
                });
              }
            : undefined
        }
        onEdgesDelete={
          !isGuest
            ? (edgesToDelete) => {
                edgesToDelete.forEach((edge) => removeCable(edge.id));
              }
            : undefined
        }
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#333338" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'ar2412') return '#38bdf8';
            if (node.type === 'sq5rear') return '#c084fc';
            return '#fbbf24';
          }}
          nodeStrokeColor="#ffffff"
          nodeStrokeWidth={1.5}
          nodeBorderRadius={3}
          maskColor="rgba(0, 0, 0, 0.6)"
          maskStrokeColor="rgba(255, 255, 255, 0.35)"
          maskStrokeWidth={1}
          className="!bottom-4 !right-4 !bg-[#141417] !border-white/[0.15] shadow-2xl rounded-lg overflow-hidden"
        />
      </ReactFlow>

      {/* Floating Cable Trace HUD Badge */}
      <CableTraceBadge />

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
