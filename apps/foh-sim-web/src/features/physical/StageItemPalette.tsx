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
    userRole,
    setAuthModalOpen,
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
    if (userRole === 'guest') {
      setAuthModalOpen(true);
      return;
    }
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
          <div className="flex-1 bg-[#121215]/95 backdrop-blur-md border-r border-white/10 flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider text-neutral-200 font-mono">
                Stage Palette
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Stock Limits</span>
            </div>

            {/* Admin Add Custom Item Button */}
            {adminMode && (
              <div className="p-2 border-b border-white/10 bg-neutral-900/60">
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-md text-neutral-200 text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>+ New Custom Node</span>
                </button>
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex overflow-x-auto p-1.5 gap-1 border-b border-white/10 bg-[#0d0d10] scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-white/15 text-white font-semibold border border-white/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]'
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
                        ? 'bg-black/40 border-white/[0.04] opacity-50 cursor-not-allowed'
                        : 'bg-[#16161a] hover:bg-[#1f1f25] border-white/10 hover:border-white/30 cursor-pointer shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors">
                        {item.displayName}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {item.makeModel}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          available > 0
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        {available} left
                      </span>
                      <button
                        disabled={isOutOfStock}
                        className={`p-1 rounded text-white ${
                          isOutOfStock ? 'opacity-20' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggle Button Tab */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-6 h-12 self-center bg-[#141417] hover:bg-neutral-800 border border-white/15 border-l-0 rounded-r-lg flex items-center justify-center text-neutral-300 hover:text-white transition-colors shadow-lg"
          title={isOpen ? 'Collapse stage palette' : 'Expand stage palette'}
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
