import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';
import { CustomNodeEditorModal } from './CustomNodeEditorModal';
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
  Plus,
  Cpu,
  Tv,
  Sparkles
} from 'lucide-react';

export const StageItemPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const {
    sim,
    inventory,
    customCatalog,
    adminMode,
    addStageItem
  } = useSimulationStore();

  const categories = [
    { id: 'all', label: 'All Gear' },
    { id: 'mic', label: 'Mics', icon: Mic },
    { id: 'instrument', label: 'Instruments', icon: Music },
    { id: 'di-box', label: 'DI Boxes', icon: Box },
    { id: 'speaker', label: 'Speakers', icon: Speaker },
    { id: 'iem', label: 'IEMs', icon: Headphones },
    { id: 'playback', label: 'Playback', icon: Laptop },
    { id: 'stream', label: 'Broadcast', icon: Tv },
    { id: 'processing', label: 'Processing', icon: Cpu },
    { id: 'comms', label: 'Comms', icon: Radio }
  ];

  // Combined catalog
  const allItems = [
    ...stageItemsCatalog.map((c) => ({
      id: c.id,
      displayName: c.displayName,
      makeModel: c.makeModel,
      category: c.category,
      isCustom: false
    })),
    ...customCatalog.map((c) => ({
      id: c.id,
      displayName: c.name,
      makeModel: c.makeModel || 'Custom Gear',
      category: c.category,
      isCustom: true
    }))
  ];

  const filteredItems = activeCategory === 'all'
    ? allItems
    : allItems.filter((item) => item.category === activeCategory);

  const handleAddItem = (typeId: string, available: number) => {
    if (available <= 0) return;
    const randomOffset = Math.floor(Math.random() * 80);
    addStageItem(typeId, { x: 160 + randomOffset, y: 180 + randomOffset });
  };

  return (
    <>
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
                Stage Palette
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Stock Limits Active</span>
            </div>

            {/* Admin Add Custom Item Button */}
            {adminMode && (
              <div className="p-2 border-b border-slate-800 bg-amber-950/30">
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="w-full py-1.5 px-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded text-amber-300 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all shadow"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>+ New Custom Node</span>
                </button>
              </div>
            )}

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
              {filteredItems.map((item) => {
                const inUse = sim.physical.stageItems.filter((i) => i.typeId === item.id).length;
                const totalStock = inventory[item.id]?.totalStock ?? 6;
                const available = Math.max(0, totalStock - inUse);
                const isOutOfStock = available <= 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddItem(item.id, available)}
                    className={`group p-2 rounded-lg border transition-all flex items-center justify-between ${
                      isOutOfStock
                        ? 'bg-slate-950/40 border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-sky-500 cursor-pointer'
                    }`}
                  >
                    <div className="overflow-hidden pr-2 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isOutOfStock ? 'text-slate-500' : 'text-slate-200 group-hover:text-sky-300'
                          }`}
                        >
                          {item.displayName}
                        </span>
                        {item.isCustom && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center justify-between mt-0.5">
                        <span className="truncate">{item.makeModel}</span>
                        <span
                          className={`font-mono text-[9px] font-bold ${
                            isOutOfStock ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'Depleted' : `${available}/${totalStock}`}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      title={isOutOfStock ? 'Out of Stock in Inventory' : 'Place on stage'}
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                        isOutOfStock
                          ? 'bg-slate-900 text-slate-600'
                          : 'bg-slate-700 group-hover:bg-sky-600 text-slate-300 group-hover:text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggle Button Tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-6 h-12 self-center bg-slate-800 hover:bg-slate-700 border border-slate-700 border-l-0 rounded-r-lg flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors shadow-lg"
          title={isOpen ? 'Collapse palette' : 'Expand palette'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Custom Node Editor Modal */}
      <CustomNodeEditorModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />
    </>
  );
};
