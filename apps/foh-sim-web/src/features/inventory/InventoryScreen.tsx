import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';
import {
  Package,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const {
    sim,
    inventory,
    updateInventoryStock,
    customCatalog,
    adminMode,
    toggleAdminMode
  } = useSimulationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Combine default catalog with custom catalog items
  const allCatalogItems = [
    ...stageItemsCatalog.map((c) => ({
      id: c.id,
      name: c.displayName,
      model: c.makeModel,
      category: c.category,
      connectors: c.connectorTypes,
      notes: c.defaultPhotoAlt || ''
    })),
    ...customCatalog.map((c) => ({
      id: c.id,
      name: c.name,
      model: c.makeModel || 'Custom Gear',
      category: c.category,
      connectors: c.connectorTypes,
      notes: c.notes || 'Custom node created in Admin Mode'
    }))
  ];

  // Calculate usage counts
  const getInUseCount = (typeId: string) => {
    return sim.physical.stageItems.filter((item) => item.typeId === typeId).length;
  };

  const filteredItems = allCatalogItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalStockCount = Object.values(inventory).reduce((acc, curr) => acc + curr.totalStock, 0);
  const totalDeployedCount = sim.physical.stageItems.length;
  const totalAvailableCount = Math.max(0, totalStockCount - totalDeployedCount);

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/40 flex items-center justify-center">
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase font-mono tracking-wide flex items-center space-x-2">
              <span>Equipment Inventory &amp; Gear Locker</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                Live Stock Limits
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Manages available hardware inventory. Dictates deployment quantities on the physical stage canvas.
            </p>
          </div>
        </div>

        {/* Global Stats Badges */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500">Total Owned:</span>
            <span className="font-bold text-slate-200">{totalStockCount}</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500">On Stage:</span>
            <span className="font-bold text-amber-400">{totalDeployedCount}</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500">Available:</span>
            <span className="font-bold text-emerald-400">{totalAvailableCount}</span>
          </div>

          <button
            onClick={toggleAdminMode}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
              adminMode
                ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-[0_0_8px_#f59e0b]'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {adminMode ? 'ADMIN MODE: ON' : 'ADMIN MODE: OFF'}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="h-12 bg-slate-900/60 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 space-x-4">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'mic', label: 'Mics' },
            { id: 'di-box', label: 'DIs' },
            { id: 'iem', label: 'IEMs' },
            { id: 'speaker', label: 'Speakers' },
            { id: 'playback', label: 'Playback' },
            { id: 'comms', label: 'Comms' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gear by name, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Equipment Name</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Make &amp; Model</th>
                <th className="py-3 px-4 font-bold">Connectors</th>
                <th className="py-3 px-4 font-bold text-center">In Use</th>
                <th className="py-3 px-4 font-bold text-center">Total Stock</th>
                <th className="py-3 px-4 font-bold text-center">Available</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => {
                const inUse = getInUseCount(item.id);
                const totalStock = inventory[item.id]?.totalStock ?? 6;
                const available = Math.max(0, totalStock - inUse);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex items-center space-x-2">
                        <span>{item.name}</span>
                        {customCatalog.some((c) => c.id === item.id) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Model */}
                    <td className="py-3 px-4 text-slate-400">{item.model}</td>

                    {/* Connectors */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.connectors.map((conn, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-sky-400 border border-slate-800"
                          >
                            {conn}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* In Use */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold ${
                          inUse > 0 ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        {inUse}
                      </span>
                    </td>

                    {/* Total Stock (Editable) */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        <button
                          onClick={() => updateInventoryStock(item.id, Math.max(0, totalStock - 1))}
                          className="text-slate-500 hover:text-white p-0.5 rounded"
                          title="Decrease Stock"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={totalStock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateInventoryStock(item.id, isNaN(val) ? 0 : Math.max(0, val));
                          }}
                          className="w-8 text-center bg-transparent font-bold text-slate-200 focus:outline-none focus:text-sky-400"
                        />
                        <button
                          onClick={() => updateInventoryStock(item.id, totalStock + 1)}
                          className="text-slate-500 hover:text-white p-0.5 rounded"
                          title="Increase Stock"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Available */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={available > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {available}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {available > 0 ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3" />
                          <span>Depleted</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
