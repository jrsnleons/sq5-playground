import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { EquipmentInventoryItem } from '../../services/localCache';
import { EditEquipmentModal } from './EditEquipmentModal';
import { ConfirmDialogModal } from '../../components/modals/ConfirmDialogModal';
import {
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Lock,
  LogIn,
  RotateCcw
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const {
    sim,
    userRole,
    inventoryItems,
    inventoryLoading,
    fetchInventory,
    saveInventoryItem,
    deleteInventoryItem,
    updateInventoryStock,
    setAuthModalOpen
  } = useSimulationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<EquipmentInventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EquipmentInventoryItem | null>(null);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // If public guest, display clean read-only guard notice
  if (userRole === 'guest') {
    return (
      <div className="h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-mono">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Church Gear Locker (Members Only)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              The equipment inventory locker is restricted to active church tech ministry members and audio directors.
            </p>
          </div>
          <div className="pt-2 w-full">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as Member or Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate usage counts on active stage canvas
  const getInUseCount = (typeId: string) => {
    return sim.physical.stageItems.filter((item) => item.typeId === typeId).length;
  };

  const categories = [
    { id: 'all', label: 'All Equipment' },
    { id: 'mic', label: 'Microphones' },
    { id: 'di-box', label: 'DI Boxes' },
    { id: 'iem', label: 'IEMs' },
    { id: 'speaker', label: 'Speakers & PA' },
    { id: 'instrument', label: 'Instruments' },
    { id: 'playback', label: 'Playback' },
    { id: 'console', label: 'Consoles' },
    { id: 'stagebox', label: 'Stage Boxes' }
  ];

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalStockCount = inventoryItems.reduce((acc, curr) => acc + curr.total_stock, 0);
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
                {userRole === 'admin' ? 'Admin Full Access' : 'Member Read-Only'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {userRole === 'admin'
                ? 'Manage physical hardware inventory, input specifications, descriptions, and stock quantities in database.'
                : 'Verified inventory listing of church audio gear, input connectors, and available quantities on stage.'}
            </p>
          </div>
        </div>

        {/* Global Stats Badges & Admin Actions */}
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
            onClick={() => fetchInventory()}
            title="Refresh from Database"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${inventoryLoading ? 'animate-spin' : ''}`} />
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsEditModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="h-12 bg-slate-900/60 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 space-x-4">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          {categories.map((cat) => (
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
                <th className="py-3 px-4 font-bold">Connectors / Sockets</th>
                <th className="py-3 px-4 font-bold text-center">In Use</th>
                <th className="py-3 px-4 font-bold text-center">Total Stock</th>
                <th className="py-3 px-4 font-bold text-center">Available</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                {userRole === 'admin' && (
                  <th className="py-3 px-4 font-bold text-right">Admin Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={userRole === 'admin' ? 9 : 8}
                    className="py-12 text-center text-slate-500 font-mono text-xs"
                  >
                    No equipment found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const inUse = getInUseCount(item.id);
                  const totalStock = item.total_stock;
                  const available = Math.max(0, totalStock - inUse);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Name & Description */}
                      <td className="py-3 px-4 font-semibold text-slate-200 max-w-xs">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span>{item.name}</span>
                            {item.is_custom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                Custom
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <span className="text-[10px] font-normal text-slate-400 font-sans line-clamp-1 mt-0.5">
                              {item.description}
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
                      <td className="py-3 px-4 text-slate-400">{item.model || '—'}</td>

                      {/* Connectors */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.connectors && item.connectors.length > 0 ? (
                            item.connectors.map((conn, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-sky-400 border border-slate-800"
                              >
                                {conn}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 text-[10px]">None</span>
                          )}
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

                      {/* Total Stock */}
                      <td className="py-3 px-4 text-center">
                        {userRole === 'admin' ? (
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
                              max="999"
                              value={totalStock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateInventoryStock(item.id, isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              className="w-10 text-center bg-transparent font-bold text-slate-200 focus:outline-none focus:text-sky-400"
                            />
                            <button
                              onClick={() => updateInventoryStock(item.id, totalStock + 1)}
                              className="text-slate-500 hover:text-white p-0.5 rounded"
                              title="Increase Stock"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-300">{totalStock}</span>
                        )}
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

                      {/* Admin Actions */}
                      {userRole === 'admin' && (
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Edit Equipment Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1 rounded bg-rose-950/50 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Equipment Modal */}
      <EditEquipmentModal
        isOpen={isEditModalOpen}
        item={editingItem}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={async (payload) => {
          await saveInventoryItem(payload as any);
        }}
      />

      {/* Delete Item Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={Boolean(itemToDelete)}
        title="Delete Equipment Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}" from the inventory? This will remove it from the gear locker and database.`}
        confirmLabel="Delete Equipment"
        isDestructive={true}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteInventoryItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
