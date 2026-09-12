import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      onClick={onCancel}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDestructive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 id="confirm-dialog-title" className="text-sm font-semibold text-white tracking-wide">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p id="confirm-dialog-desc" className="text-xs text-neutral-400 leading-relaxed font-normal">
            {message}
          </p>
        </div>

        <div className="px-5 py-4 bg-black/40 border-t border-white/[0.06] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors focus-visible:ring-1 focus-visible:outline-none ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white focus-visible:ring-red-400 font-semibold'
                : 'bg-white hover:bg-neutral-200 text-black font-semibold focus-visible:ring-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
