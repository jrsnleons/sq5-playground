import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { CustomPortDef } from '@foh-sim/simulation-core';
import { X, Plus, Trash2, Cpu, Check, AlertTriangle } from 'lucide-react';

interface CustomNodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomNodeEditorModal: React.FC<CustomNodeEditorModalProps> = ({
  isOpen,
  onClose
}) => {
  const addCustomEquipmentType = useSimulationStore((s) => s.addCustomEquipmentType);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'mic' | 'instrument' | 'di-box' | 'speaker' | 'iem' | 'playback' | 'comms'>('di-box');
  const [makeModel, setMakeModel] = useState('');
  const [totalStock, setTotalStock] = useState(4);
  const [ports, setPorts] = useState<CustomPortDef[]>([
    { id: 'in-1', label: 'IN 1', direction: 'in', connector: 'xlr' },
    { id: 'out-1', label: 'OUT 1', direction: 'out', connector: 'xlr' }
  ]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddPort = () => {
    const nextIndex = ports.length + 1;
    const newPort: CustomPortDef = {
      id: `port-${nextIndex}`,
      label: `PORT ${nextIndex}`,
      direction: 'in',
      connector: 'xlr'
    };
    setPorts([...ports, newPort]);
  };

  const handleRemovePort = (index: number) => {
    if (ports.length <= 1) return;
    setPorts(ports.filter((_, i) => i !== index));
  };

  const handleUpdatePort = (index: number, updates: Partial<CustomPortDef>) => {
    setPorts(
      ports.map((p, i) => {
        if (i !== index) return p;
        return { ...p, ...updates };
      })
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide a name for the custom gear.');
      return;
    }
    if (ports.length === 0) {
      setError('Please add at least one input, output, or thru port.');
      return;
    }

    const customId = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    addCustomEquipmentType({
      id: customId,
      name: name.trim(),
      category,
      makeModel: makeModel.trim() || 'Custom Gear',
      ports,
      totalStock
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-13 bg-black/40 border-b border-white/[0.06] px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-white" />
            <h2 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              Create Custom Stage Node (Admin)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs text-neutral-200">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-neutral-400 uppercase mb-1">
                Node Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sub-Snake 4CH, IEM Transmitter"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-1.5 bg-black rounded-lg border border-white/[0.08] text-white focus:outline-none focus:border-white/40 placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-black rounded-lg border border-white/[0.08] text-neutral-200 focus:outline-none focus:border-white/40"
              >
                <option value="di-box">Direct Box (DI)</option>
                <option value="mic">Microphone</option>
                <option value="instrument">Instrument / Line</option>
                <option value="speaker">Speaker / PA</option>
                <option value="iem">In-Ear Monitor (IEM)</option>
                <option value="playback">Playback / Digital</option>
                <option value="comms">Comms / Talkback</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 uppercase mb-1">
                Make &amp; Model
              </label>
              <input
                type="text"
                placeholder="e.g. Radial / Behringer / Custom"
                value={makeModel}
                onChange={(e) => setMakeModel(e.target.value)}
                className="w-full px-3 py-1.5 bg-black rounded-lg border border-white/[0.08] text-white focus:outline-none focus:border-white/40 placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 uppercase mb-1">
                Initial Inventory Stock
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={totalStock}
                onChange={(e) => setTotalStock(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-1.5 bg-black rounded-lg border border-white/[0.08] text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          {/* Configurable Ports Section */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase text-neutral-400 font-medium tracking-wider">
                Configurable Connectors &amp; Ports ({ports.length})
              </span>
              <button
                onClick={handleAddPort}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[10px] font-medium border border-white/[0.08] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Port</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ports.map((port, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-2 bg-black rounded-lg border border-white/[0.06]"
                >
                  {/* Port ID/Label */}
                  <input
                    type="text"
                    value={port.label}
                    onChange={(e) => handleUpdatePort(idx, { label: e.target.value, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="Port Label (e.g. IN 1)"
                    className="flex-1 px-2 py-1 bg-[#0A0A0A] rounded border border-white/[0.08] text-white text-xs focus:outline-none focus:border-white/40"
                  />

                  {/* Direction */}
                  <select
                    value={port.direction}
                    onChange={(e) => handleUpdatePort(idx, { direction: e.target.value as any })}
                    className="w-20 px-2 py-1 bg-[#0A0A0A] rounded border border-white/[0.08] text-neutral-300 text-xs focus:outline-none focus:border-white/40"
                  >
                    <option value="in">IN</option>
                    <option value="out">OUT</option>
                    <option value="thru">THRU</option>
                  </select>

                  {/* Connector Type */}
                  <select
                    value={port.connector}
                    onChange={(e) => handleUpdatePort(idx, { connector: e.target.value as any })}
                    className="w-36 px-2 py-1 bg-[#0A0A0A] rounded border border-white/[0.08] text-neutral-300 text-xs focus:outline-none focus:border-white/40"
                  >
                    <option value="xlr">XLR (3-Pin)</option>
                    <option value="trs">1/4" TRS Jack</option>
                    <option value="ts">1/4" TS Jack</option>
                    <option value="ethercon">EtherCon (Cat5e)</option>
                    <option value="rf">RF Wireless</option>
                    <option value="usb">USB Type-B</option>
                  </select>

                  {/* Remove Port */}
                  <button
                    onClick={() => handleRemovePort(idx)}
                    disabled={ports.length <= 1}
                    className="text-neutral-500 hover:text-red-400 p-1 rounded disabled:opacity-30 transition-colors"
                    title="Remove Port"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-14 bg-black/40 border-t border-white/[0.06] px-5 flex items-center justify-end space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-mono text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-medium text-black bg-white hover:bg-neutral-200 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Create &amp; Add to Catalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
