import React, { useState, useEffect } from 'react';
import { EquipmentInventoryItem } from '../../services/localCache';
import { X, Save, AlertCircle, Package } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-600/40 flex items-center justify-center">
              <Package className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h2 id="modal-title" className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wide">
                {item ? 'Edit Equipment Details' : 'Add New Inventory Item'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Update church inventory specifications, connector types, and stock limits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-800 text-rose-300 px-3 py-2 rounded-lg text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dynamic Vocal Mic"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Make & Model + Stock Quantity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
                Make &amp; Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Shure SM58 / Sennheiser e604"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
                Total Stock Owned
              </label>
              <input
                type="number"
                min="0"
                max="999"
                value={totalStock}
                onChange={(e) => setTotalStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Connectors / Inputs */}
          <div>
            <label className="block text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
              Connectors / Inputs (comma separated)
            </label>
            <input
              type="text"
              value={connectorsStr}
              onChange={(e) => setConnectorsStr(e.target.value)}
              placeholder="e.g. XLR-out, 1/4&quot; TS-in, EtherCon"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Specify the physical socket types for cable matching (e.g. XLR-out, TS-in, RF-in, EtherCon).
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
              Description &amp; Deployment Usage
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe where and how this equipment is used in church production..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Technical Notes */}
          <div>
            <label className="block text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
              Technical &amp; Operating Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires +48V Phantom Power, ground lift switch, cardioid polar pattern"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-colors disabled:opacity-50"
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
