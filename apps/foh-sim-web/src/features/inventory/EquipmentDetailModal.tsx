import React, { useEffect } from 'react';
import { EquipmentInventoryItem } from '../../services/localCache';
import { X, Edit2, Layers, Cpu, Box, Radio } from 'lucide-react';

interface EquipmentDetailModalProps {
  isOpen: boolean;
  item: EquipmentInventoryItem | null;
  inUseCount: number;
  userRole: string;
  onClose: () => void;
  onEdit?: (item: EquipmentInventoryItem) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  isOpen,
  item,
  inUseCount,
  userRole,
  onClose,
  onEdit
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const totalStock = item.total_stock ?? 0;
  const availableStock = Math.max(0, totalStock - inUseCount);
  const isDepleted = availableStock === 0;

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
        aria-labelledby="equipment-detail-title"
        className="w-full max-w-lg bg-[#0F0F12] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#141418] border-b border-white/[0.08] flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-300 mt-0.5 shrink-0">
              <Box className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="equipment-detail-title" className="text-sm font-semibold text-white tracking-tight">
                  {item.name}
                </h2>
                {item.is_custom && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-white/10">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                {item.model || 'Standard Church Hardware'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Inventory Availability Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Total Stock
              </span>
              <span className="text-lg font-mono font-semibold text-white mt-0.5 block">
                {totalStock}
              </span>
            </div>

            <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                In Use
              </span>
              <span className={`text-lg font-mono font-semibold mt-0.5 block ${inUseCount > 0 ? 'text-sky-400' : 'text-neutral-500'}`}>
                {inUseCount}
              </span>
            </div>

            <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-3 text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Available
              </span>
              <span className={`text-lg font-mono font-semibold mt-0.5 block ${isDepleted ? 'text-rose-400' : 'text-emerald-400'}`}>
                {availableStock}
              </span>
            </div>
          </div>

          {/* Classification & Category */}
          <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-mono">Category</span>
              <span className="font-mono uppercase text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-white/10 text-neutral-200">
                {item.category}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-white/[0.05] pt-2">
              <span className="text-neutral-400 font-mono">Locker Status</span>
              <span className={`text-[11px] font-mono font-medium ${isDepleted ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isDepleted ? 'All Units Deployed' : `${availableStock} Units Ready`}
              </span>
            </div>
          </div>

          {/* Physical Connectors */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-medium flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-neutral-500" />
              <span>Connectors &amp; I/O Ports</span>
            </label>
            <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-3">
              {item.connectors && item.connectors.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {item.connectors.map((conn, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono px-2 py-1 rounded bg-[#0A0A0C] text-neutral-200 border border-white/10"
                    >
                      {conn}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-mono text-neutral-500">
                  No physical socket connectors specified.
                </span>
              )}
            </div>
          </div>

          {/* Description & Deployment */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-medium flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              <span>Description &amp; Deployment Usage</span>
            </label>
            <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-3">
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {item.description || 'No specific description recorded for this item.'}
              </p>
            </div>
          </div>

          {/* Technical Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-medium flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-neutral-500" />
              <span>Technical &amp; Operating Notes</span>
            </label>
            <div className="bg-[#141418] border border-white/[0.08] rounded-lg p-3">
              <p className="text-xs font-mono text-neutral-300 leading-relaxed">
                {item.notes || 'Standard operation. Refer to manufacturer specifications.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#141418] border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] font-mono text-neutral-500">
            ID: {item.id}
          </span>

          <div className="flex items-center space-x-2">
            {userRole === 'admin' && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Equipment</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-mono bg-white hover:bg-neutral-200 text-black font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
