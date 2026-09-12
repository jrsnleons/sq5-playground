import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  triggerPrefix?: string;
  align?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  triggerPrefix,
  align = 'left',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between space-x-2 px-3 py-1.5 rounded-lg bg-[#0E0E11] hover:bg-[#15151A] border ${
          isOpen ? 'border-white/30 text-white' : 'border-white/10 text-neutral-300'
        } text-xs font-mono transition-all duration-150 focus:outline-none focus:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center space-x-1.5 truncate">
          {triggerPrefix && (
            <span className="text-neutral-500 font-normal">{triggerPrefix}</span>
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          )}
          <span className="font-medium text-neutral-200 truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-40 mt-1.5 min-w-[190px] w-max max-w-xs bg-[#141418] border border-white/15 rounded-xl shadow-2xl shadow-black/90 p-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.id === value;
              const Icon = option.icon;

              return (
                <button
                  key={option.id}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={(e) => handleSelect(option.id, e)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                    isSelected
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate mr-2">
                    {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                    <div className="truncate">
                      <div className="truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-[10px] text-neutral-500 font-sans truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
