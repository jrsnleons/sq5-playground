import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { SignalType } from '@foh-sim/simulation-core';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';
import { X, Trash2, Edit3, Check, Plug, Unlink, Camera, RotateCcw } from 'lucide-react';
import { ConfirmDialogModal } from '../../components/modals/ConfirmDialogModal';

export const NodeDetailModal: React.FC = () => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    clearTrace,
    sim,
    updateStageItemDetails,
    removeStageItem,
    removeCable,
    updateCableSignalType,
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
    if (selectedNodeId) {
      clearTrace();
    }
  }, [selectedNodeId, clearTrace]);

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

  const getNodeLabel = (nodeId: string) => {
    if (nodeId === 'stagebox-ar2412') return 'AR2412 Stage Box';
    if (nodeId === 'console-sq5') return 'SQ-5 Console';
    const item = sim.physical.stageItems.find((i) => i.id === nodeId);
    return item?.name || nodeId;
  };

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
      className="absolute right-4 top-4 w-80 bg-[#141417]/95 backdrop-blur-md border border-white/15 rounded-xl shadow-[0_16px_40px_-6px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.15)] z-20 overflow-hidden font-sans text-neutral-100 animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#1c1c20]">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.08] text-neutral-200 border border-white/10 font-bold">
            {stageItem.category}
          </span>
          <span id="node-inspector-title" className="text-xs font-bold text-white tracking-wide">
            Equipment Inspector
          </span>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          aria-label="Close inspector"
          className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
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
          <div className="w-full h-32 bg-black rounded-lg border border-white/[0.08] relative overflow-hidden group">
            <img
              src={customPhoto}
              alt={stageItem.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-black rounded-lg text-[10px] font-semibold flex items-center space-x-1 shadow"
              >
                <Camera className="w-3 h-3" />
                <span>Change</span>
              </button>
              <button
                type="button"
                onClick={() => removeNodePhoto(stageItem.id)}
                className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 rounded-lg text-[10px] font-medium flex items-center space-x-1 border border-white/[0.08]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-black rounded-lg border border-white/[0.08] flex flex-col items-center justify-center relative overflow-hidden group p-2">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/[0.08] text-neutral-300 mb-1">
              <Plug className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-neutral-400 font-mono text-center truncate max-w-[90%]">
              {catalogDef?.defaultPhotoAlt || 'Equipment Stock Photo'}
            </span>
            <span className="text-[9px] text-neutral-500 font-mono mb-1">
              {catalogDef?.makeModel || 'Hardware Unit'}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 rounded-lg text-[10px] font-mono border border-white/[0.08] flex items-center space-x-1 transition-colors"
            >
              <Camera className="w-3 h-3" />
              <span>Upload Photo</span>
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-[10px] text-red-400 font-mono">{uploadError}</p>
        )}

        {/* Editable Name */}
        <div>
          <label className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
            Display Label
          </label>
          {isEditing ? (
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 bg-black border border-white/30 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleSave}
                className="p-1 rounded-lg bg-white hover:bg-neutral-200 text-black"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/[0.06]">
              <span className="font-semibold text-neutral-200">{stageItem.name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Connections List */}
        <div>
          <label className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
            Active Cable Connections ({connectedCables.length})
          </label>
          {connectedCables.length === 0 ? (
            <div className="text-[11px] text-neutral-500 italic p-2 bg-black/40 rounded-lg border border-white/[0.06]">
              No cables connected. Drag from the ports to patch.
            </div>
          ) : (
            <div className="space-y-2">
              {connectedCables.map((c) => {
                const isFromThis = c.fromNode === stageItem.id;
                const remoteNodeName = getNodeLabel(isFromThis ? c.toNode : c.fromNode);
                const remotePort = isFromThis ? c.toPort : c.fromPort;
                const localPort = isFromThis ? c.fromPort : c.toPort;

                return (
                  <div
                    key={c.id}
                    className="p-2 bg-black/60 rounded-lg border border-white/[0.06] font-mono text-[11px] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-neutral-300 min-w-0">
                        <span className="text-white font-semibold shrink-0">{localPort}</span>
                        <span className="text-neutral-500 shrink-0">{isFromThis ? '→' : '←'}</span>
                        <span className="text-neutral-200 truncate max-w-[130px]" title={remoteNodeName}>
                          {remoteNodeName}
                        </span>
                        <span className="text-neutral-400 text-[10px] shrink-0">({remotePort})</span>
                      </div>
                      <button
                        onClick={() => removeCable(c.id)}
                        title="Unplug / disconnect this cable"
                        className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-mono transition-colors ml-2 shrink-0 cursor-pointer"
                      >
                        <Unlink className="w-3 h-3" />
                        <span>Unplug</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[10px]">
                      <span className="text-neutral-400 text-[9px]">Wire Type:</span>
                      <select
                        value={c.signalType}
                        onChange={(e) => updateCableSignalType(c.id, e.target.value as SignalType)}
                        className="bg-neutral-900 border border-white/20 rounded px-1.5 py-0.5 text-[9px] text-neutral-200 font-mono focus:outline-none cursor-pointer"
                      >
                        <option value="mic">Mic (Analog)</option>
                        <option value="instrument">Instrument (1/4" TRS)</option>
                        <option value="speaker">Speaker</option>
                        <option value="iem">IEM</option>
                        <option value="click">Click</option>
                        <option value="comms">Comms</option>
                        <option value="usb">USB Digital</option>
                        <option value="video">Video (HDMI)</option>
                        <option value="dsnake">dSNAKE Cat5e</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operator Notes */}
        <div>
          <label className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
            Sound Tech Notes
          </label>
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            onBlur={handleSave}
            placeholder="e.g., Wireless channel 4, battery status, stage position..."
            className="w-full h-16 bg-black/60 border border-white/[0.08] focus:border-white/40 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none resize-none placeholder:text-neutral-600 font-sans"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 p-1 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Gear</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedNodeId(null)}
            className="px-3 py-1 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-200 rounded-lg text-xs font-mono transition-colors"
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
