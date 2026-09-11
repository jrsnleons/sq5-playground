import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';
import {
  Mic,
  Music,
  Box,
  Laptop,
  Radio,
  Speaker,
  Headphones,
  ChevronRight,
  ChevronLeft,
  Plus
} from 'lucide-react';

export const StageItemPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { addStageItem } = useSimulationStore();

  const categories = [
    { id: 'all', label: 'All Gear' },
    { id: 'mic', label: 'Vocals', icon: Mic },
    { id: 'instrument', label: 'Instruments', icon: Music },
    { id: 'di-box', label: 'DI Boxes', icon: Box },
    { id: 'click', label: 'Click', icon: Radio },
    { id: 'comms', label: 'Comms', icon: Radio },
    { id: 'playback', label: 'Playback', icon: Laptop },
    { id: 'speaker', label: 'Speakers', icon: Speaker },
    { id: 'iem', label: 'IEMs', icon: Headphones }
  ];

  const filteredItems = activeCategory === 'all'
    ? stageItemsCatalog
    : stageItemsCatalog.filter((item) => item.category === activeCategory);

  const handleAddItem = (typeId: string) => {
    // Drop at a staggered visible position on STAGE side
    const randomOffset = Math.floor(Math.random() * 80);
    addStageItem(typeId, { x: 160 + randomOffset, y: 180 + randomOffset });
  };

  return (
    <div
      className={`absolute left-0 top-0 bottom-0 z-10 transition-all duration-300 flex ${
        isOpen ? 'w-64' : 'w-10'
      }`}
    >
      {/* Palette Body */}
      {isOpen && (
        <div className="flex-1 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Stage Inventory
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Click to place</span>
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto p-1.5 gap-1 border-b border-slate-800/80 bg-slate-950/50 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-sky-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleAddItem(item.id)}
                className="group p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="overflow-hidden pr-2">
                  <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-300">
                    {item.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {item.makeModel}
                  </div>
                </div>
                <button
                  title="Place on stage"
                  className="w-6 h-6 rounded bg-slate-700 group-hover:bg-sky-600 text-slate-300 group-hover:text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse/Expand Toggle Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-12 bg-slate-800 hover:bg-slate-700 border-y border-r border-slate-700 rounded-r self-center flex items-center justify-center text-slate-400 hover:text-white shadow-lg cursor-pointer"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
};
