import React, { useState, useEffect } from 'react';
import { EquipmentInventoryItem } from '../../services/localCache';
import { X, Save, AlertCircle, Box, Plus, Minus } from 'lucide-react';

interface EditEquipmentModalProps {
  isOpen: boolean;
  item: EquipmentInventoryItem | null;
  onClose: () => void;
  onSave: (item: Partial<EquipmentInventoryItem> & { id: string; name: string; category: string }) => Promise<void>;
}

const CATEGORIES = [
  { id: 'mic', label: 'Microphone' },
  { id: 'di-box', label: 'DI Box' },
  { id: 'iem', label: 'In-Ear Monitor' },
  { id: 'speaker', label: 'Speaker / PA' },
  { id: 'instrument', label: 'Instrument' },
  { id: 'playback', label: 'Playback / Computer' },
  { id: 'console', label: 'Console' },
  { id: 'stagebox', label: 'Stage Box' },
  { id: 'comms', label: 'Comms' },
  { id: 'other', label: 'Other Gear' }
];

const COMMON_CONNECTORS = ['XLR-out', 'XLR-in', '1/4" TS', '1/4" TRS', 'EtherCon', 'SpeakON', 'RCA', 'USB'];

export const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('mic');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [connectorsStr, setConnectorsStr] = useState('');
  const [totalStock, setTotalStock] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category || 'mic');
      setModel(item.model || '');
      setDescription(item.description || '');
      setConnectorsStr(item.connectors ? item.connectors.join(', ') : '');
      setTotalStock(item.total_stock ?? 1);
      setNotes(item.notes || '');
      setError(null);
    } else {
      setName('');
      setCategory('mic');
      setModel('');
      setDescription('');
      setConnectorsStr('XLR-out');
      setTotalStock(1);
      setNotes('');
      setError(null);
    }
  }, [item, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddConnectorChip = (connector: string) => {
    const current = connectorsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!current.includes(connector)) {
      const updated = [...current, connector].join(', ');
      setConnectorsStr(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Equipment name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const connectors = connectorsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const itemId = item?.id || `custom-${Date.now().toString(36)}`;

    try {
      await onSave({
        id: itemId,
        name: name.trim(),
        category,
        model: model.trim(),
        description: description.trim(),
        connectors,
        total_stock: Math.max(0, totalStock),
        notes: notes.trim(),
        is_custom: item ? item.is_custom : true
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save inventory item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-equipment-title"
        className="w-full max-w-xl bg-[#0F0F12] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#141418] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-300">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-equipment-title" className="text-sm font-semibold text-white tracking-tight">
                {item ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Configure locker specifications and physical hardware details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="flex items-center space-x-2 bg-rose-950/40 border border-rose-900/50 text-rose-300 px-3.5 py-2.5 rounded-lg text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: General Information */}
          <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-4 space-y-3.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold pb-1 border-b border-white/[0.06]">
              General Details
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-sans">
                Equipment Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shure SM58 / Passive DI Box"
                className="w-full px-3 py-2 bg-[#0A0A0C] border border-white/10 rounded-md text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-sans">
                  Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0C] border border-white/10 rounded-md text-xs font-mono text-neutral-100 focus:outline-none focus:border-neutral-400 transition-colors cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-sans">
                  Make &amp; Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Shure SM58 / Radial ProDI"
                  className="w-full px-3 py-2 bg-[#0A0A0C] border border-white/10 rounded-md text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Stock & Quantities */}
          <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-4 space-y-3.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold pb-1 border-b border-white/[0.06]">
              Inventory Stock
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-medium text-neutral-300 font-sans">
                  Total Locker Stock
                </label>
                <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
                  Total units physically owned in the church equipment inventory.
                </p>
              </div>

              <div className="flex items-center space-x-1 bg-[#0A0A0C] border border-white/10 rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setTotalStock((prev) => Math.max(0, prev - 1))}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Decrease stock"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={totalStock}
                  onChange={(e) => setTotalStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-12 text-center bg-transparent text-xs font-mono font-semibold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setTotalStock((prev) => prev + 1)}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="Increase stock"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Hardware & Specifications */}
          <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-4 space-y-3.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold pb-1 border-b border-white/[0.06]">
              Hardware &amp; Technical Specifications
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-sans">
                Connectors &amp; Port Types (comma separated)
              </label>
              <input
                type="text"
                value={connectorsStr}
                onChange={(e) => setConnectorsStr(e.target.value)}
                placeholder="e.g. XLR-out, 1/4&quot; TS, EtherCon"
                className="w-full px-3 py-2 bg-[#0A0A0C] border border-white/10 rounded-md text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
              />
              {/* Quick connector insert chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-mono text-neutral-500 mr-1">Quick add:</span>
                {COMMON_CONNECTORS.map((conn) => (
                  <button
                    key={conn}
                    type="button"
                    onClick={() => handleAddConnectorChip(conn)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0A0A0C] hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-white/[0.08] transition-colors"
                  >
                    + {conn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-sans">
                Technical Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Requires +48V Phantom Power, cardioid pattern, ground lift switch"
                className="w-full px-3 py-2 bg-[#0A0A0C] border border-white/10 rounded-md text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-sans">
                Description &amp; Deployment Usage
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Operational notes, where on stage this is typically deployed, or special instructions..."
                className="w-full px-3 py-2 bg-[#0A0A0C] border border-white/10 rounded-md text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-mono text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-md text-xs font-mono font-medium bg-white hover:bg-neutral-200 text-black transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Equipment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
