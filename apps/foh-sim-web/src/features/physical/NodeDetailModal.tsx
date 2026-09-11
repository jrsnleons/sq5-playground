import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';
import { X, Trash2, Edit3, Check, Plug, Unlink, Camera, RotateCcw } from 'lucide-react';
import { ConfirmDialogModal } from '../../components/modals/ConfirmDialogModal';

export const NodeDetailModal: React.FC = () => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    sim,
    updateStageItemDetails,
    removeStageItem,
    removeCable,
    setNodePhoto,
    removeNodePhoto
  } = useSimulationStore();

  const stageItem = sim.physical.stageItems.find((i) => i.id === selectedNodeId);
  const [nameInput, setNameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stageItem) {
      setNameInput(stageItem.name);
      setNotesInput(stageItem.notes || '');
      setIsEditing(false);
    }
  }, [stageItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNodeId) {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, setSelectedNodeId]);

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

  const customPhoto = stageItem.photoOverride || sim.nodePhotos?.[stageItem.id]?.userPhotoDataUrl;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Photo size must be under 2MB.');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNodePhoto(stageItem.id, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="node-inspector-title"
      className="absolute right-4 top-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl z-20 overflow-hidden font-sans text-slate-100 animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
            {stageItem.category}
          </span>
          <span id="node-inspector-title" className="text-xs font-bold text-slate-200">
            Equipment Inspector
          </span>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          aria-label="Close inspector"
          className="text-slate-400 hover:text-white p-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Gear Photo: Stock vs Custom Override */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {customPhoto ? (
          <div className="w-full h-32 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden group">
            <img
              src={customPhoto}
              alt={stageItem.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-semibold flex items-center space-x-1 shadow"
              >
                <Camera className="w-3 h-3" />
                <span>Change</span>
              </button>
              <button
                type="button"
                onClick={() => removeNodePhoto(stageItem.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold flex items-center space-x-1 border border-slate-700 shadow"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group p-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700 text-sky-400 mb-1">
              <Plug className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono text-center truncate max-w-[90%]">
              {catalogDef?.defaultPhotoAlt || 'Equipment Stock Photo'}
            </span>
            <span className="text-[9px] text-slate-600 font-mono mb-1">
              {catalogDef?.makeModel || 'Hardware Unit'}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded text-[10px] font-mono border border-slate-700 flex items-center space-x-1 transition-colors"
            >
              <Camera className="w-3 h-3" />
              <span>Upload Photo</span>
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-[10px] text-rose-400 font-mono">{uploadError}</p>
        )}

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
            <div className="space-y-1.5">
              {connectedCables.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800 font-mono text-[11px]"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-sky-300 font-bold">{c.fromPort}</span>
                    <span className="text-slate-500">──►</span>
                    <span className="text-amber-300 font-bold">{c.toPort}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                      {c.signalType}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCable(c.id)}
                    title="Unplug / disconnect this cable"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors ml-2 shrink-0 cursor-pointer shadow"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Unplug</span>
                  </button>
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
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 p-1 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Gear</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedNodeId(null)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      <ConfirmDialogModal
        isOpen={showDeleteConfirm}
        title="Remove Equipment"
        message={`Are you sure you want to remove "${stageItem.name}" and disconnect all of its attached cables from the stage?`}
        confirmLabel="Remove Gear"
        isDestructive={true}
        onConfirm={() => {
          removeStageItem(stageItem.id);
          setSelectedNodeId(null);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
