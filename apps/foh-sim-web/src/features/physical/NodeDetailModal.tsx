import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';
import { X, Trash2, Edit3, Check, Plug } from 'lucide-react';

export const NodeDetailModal: React.FC = () => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    sim,
    updateStageItemDetails,
    removeStageItem
  } = useSimulationStore();

  const stageItem = sim.physical.stageItems.find((i) => i.id === selectedNodeId);
  const [nameInput, setNameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (stageItem) {
      setNameInput(stageItem.name);
      setNotesInput(stageItem.notes || '');
      setIsEditing(false);
    }
  }, [stageItem]);

  if (!stageItem) return null;

  const catalogDef = stageItemsCatalog.find((c) => c.id === stageItem.typeId);

  // Find cables connected to this node
  const connectedCables = sim.physical.cables.filter(
    (c) => c.fromNode === stageItem.id || c.toNode === stageItem.id
  );

  const handleSave = () => {
    updateStageItemDetails(stageItem.id, {
      name: nameInput.trim() || stageItem.name,
      notes: notesInput.trim()
    });
    setIsEditing(false);
  };

  return (
    <div className="absolute right-4 top-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl z-20 overflow-hidden font-sans text-slate-100 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
            {stageItem.category}
          </span>
          <span className="text-xs font-bold text-slate-200">Equipment Inspector</span>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Gear Photo Placeholder with stock representation */}
        <div className="w-full h-32 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700 text-sky-400">
            <Plug className="w-7 h-7" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-2">
            {catalogDef?.defaultPhotoAlt || 'Equipment Stock Photo'}
          </span>
          <span className="text-[9px] text-slate-600 font-mono">
            {catalogDef?.makeModel || 'Hardware Unit'}
          </span>
        </div>

        {/* Editable Name */}
        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Display Label
          </label>
          {isEditing ? (
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-sky-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleSave}
                className="p-1 rounded bg-sky-600 hover:bg-sky-500 text-white"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="font-semibold text-slate-200">{stageItem.name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-sky-400 p-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Connections List */}
        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Active Cable Connections ({connectedCables.length})
          </label>
          {connectedCables.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic p-2 bg-slate-950/30 rounded border border-slate-800">
              No cables connected. Drag from the ports to patch.
            </div>
          ) : (
            <div className="space-y-1">
              {connectedCables.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded border border-slate-800/80 font-mono text-[10px]"
                >
                  <span className="text-sky-300">{c.fromPort}</span>
                  <span className="text-slate-500">──►</span>
                  <span className="text-amber-300">{c.toPort}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operator Notes */}
        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Sound Tech Notes
          </label>
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            onBlur={handleSave}
            placeholder="e.g., Wireless channel 4, battery status, stage position..."
            className="w-full h-16 bg-slate-950/80 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-slate-600 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => {
              if (window.confirm(`Delete ${stageItem.name} from stage?`)) {
                removeStageItem(stageItem.id);
              }
            }}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 p-1 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Gear</span>
          </button>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
