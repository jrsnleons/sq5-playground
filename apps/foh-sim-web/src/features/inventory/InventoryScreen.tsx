import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { EquipmentInventoryItem } from '../../services/localCache';
import { EditEquipmentModal } from './EditEquipmentModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { ConfirmDialogModal } from '../../components/modals/ConfirmDialogModal';
import { Dropdown, DropdownOption } from '../../components/ui/Dropdown';
import {
  Package,
  Search,
  Plus,
  RotateCcw,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Lock,
  LogIn,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mic,
  Box,
  Headphones,
  Speaker,
  Music,
  Laptop,
  Sliders,
  Network,
  Radio,
  Layers,
  LayoutGrid,
  List
} from 'lucide-react';

const CATEGORIES: DropdownOption[] = [
  { id: 'all', label: 'All Categories', icon: Layers },
  { id: 'mic', label: 'Microphones', icon: Mic },
  { id: 'di-box', label: 'DI Boxes', icon: Box },
  { id: 'iem', label: 'In-Ear Monitors', icon: Headphones },
  { id: 'speaker', label: 'Speakers & PA', icon: Speaker },
  { id: 'instrument', label: 'Instruments', icon: Music },
  { id: 'playback', label: 'Playback', icon: Laptop },
  { id: 'console', label: 'Consoles', icon: Sliders },
  { id: 'stagebox', label: 'Stage Boxes', icon: Network },
  { id: 'comms', label: 'Comms', icon: Radio },
  { id: 'other', label: 'Other Gear', icon: Layers }
];

const CATEGORY_LABELS: Record<string, string> = {
  mic: 'Microphone',
  'di-box': 'DI Box',
  iem: 'In-Ear Monitor',
  speaker: 'Speaker / PA',
  instrument: 'Instrument',
  playback: 'Playback',
  console: 'Console',
  stagebox: 'Stage Box',
  comms: 'Comms',
  other: 'Other'
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'mic':
      return Mic;
    case 'di-box':
      return Box;
    case 'iem':
      return Headphones;
    case 'speaker':
      return Speaker;
    case 'instrument':
      return Music;
    case 'playback':
      return Laptop;
    case 'console':
      return Sliders;
    case 'stagebox':
      return Network;
    case 'comms':
      return Radio;
    default:
      return Layers;
  }
};

const ITEMS_PER_PAGE = 12;

export const InventoryScreen: React.FC = () => {
  const {
    sim,
    userRole,
    inventoryItems,
    inventoryLoading,
    fetchInventory,
    saveInventoryItem,
    deleteInventoryItem,
    setAuthModalOpen
  } = useSimulationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const [selectedDetailItem, setSelectedDetailItem] = useState<EquipmentInventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<EquipmentInventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EquipmentInventoryItem | null>(null);

  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Global click outside listener for row action menus
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveActionMenuId(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveActionMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Calculate usage counts on active stage canvas
  const getInUseCount = (typeId: string) => {
    return sim.physical.stageItems.filter((item) => item.typeId === typeId).length;
  };

  // If public guest, display clean read-only guard notice
  if (userRole === 'guest') {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center p-6 text-center select-none font-mono">
        <div className="max-w-md w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-8 flex flex-col items-center space-y-4 shadow-2xl">
          <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-neutral-300">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-100 uppercase tracking-wide">
              Church Gear Locker (Members Only)
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              The equipment inventory locker is restricted to active church tech ministry members and audio directors.
            </p>
          </div>
          <div className="pt-2 w-full">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-md text-xs font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as Member or Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter items based on query and category
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination computations
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const displayStart = totalItems === 0 ? 0 : startIndex + 1;
  const displayEnd = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const handleCategoryBadgeClick = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="h-full bg-black flex flex-col overflow-hidden select-none font-sans text-neutral-100" ref={menuContainerRef}>
      {/* Top Header */}
      <div className="h-14 bg-black border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-sm font-semibold text-white tracking-tight">
                Equipment Locker
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-white/10">
                {inventoryItems.length} items
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">
              Manage stage hardware, port configurations, and church audio stock.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchInventory()}
            aria-label="Refresh Inventory"
            className="p-2 rounded-lg bg-neutral-900 border border-white/[0.08] text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${inventoryLoading ? 'animate-spin' : ''}`} />
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsEditModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-white hover:bg-neutral-200 text-black transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="h-13 bg-black border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0 space-x-4">
        {/* Left: Search & Category Dropdown */}
        <div className="flex items-center space-x-3 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by gear name, model, notes, connectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-[#0D0D10] rounded-lg border border-white/10 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Category Dropdown */}
          <Dropdown
            value={selectedCategory}
            onChange={(catId) => {
              setSelectedCategory(catId);
              setCurrentPage(1);
            }}
            options={CATEGORIES}
            triggerPrefix="Category:"
          />

          {/* Active Category Filter Tag */}
          {selectedCategory !== 'all' && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/15 text-xs font-mono text-neutral-200 shrink-0">
              <Filter className="w-3 h-3 text-neutral-400" />
              <span>{CATEGORY_LABELS[selectedCategory] || selectedCategory}</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-neutral-400 hover:text-white ml-0.5 p-0.5"
                aria-label="Clear category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Layout Switcher & Count */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-xs font-mono text-neutral-500">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center bg-[#0D0D10] border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              aria-label="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6 flex flex-col">
        {paginatedItems.length === 0 ? (
          <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-500 mb-3">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-neutral-300">No equipment found</div>
            <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4 font-sans">
              No gear in the locker matches your search or category filter.
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* High-Hierarchy Table View */
          <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0E0E11] border-b border-white/[0.08] text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    <th className="py-3 px-5 font-semibold">Equipment &amp; Model</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Connectors &amp; Technical Notes</th>
                    <th className="py-3 px-5 font-semibold text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {paginatedItems.map((item) => {
                    const isMenuOpen = activeActionMenuId === item.id;
                    const CategoryIcon = getCategoryIcon(item.category);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedDetailItem(item)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedDetailItem(item);
                          }
                        }}
                        className="relative transition-all duration-150 cursor-pointer group hover:bg-[#121217] active:bg-[#17171F]"
                      >
                        {/* Equipment Identity: Icon + Name + Make/Model */}
                        <td className="py-3.5 px-5 max-w-sm relative">
                          {/* Left visual accent indicator on hover */}
                          <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-transparent group-hover:bg-white/80 rounded-r transition-all duration-150" />

                          <div className="flex items-center space-x-3.5 pl-1">
                            <div className="w-9 h-9 rounded-lg bg-[#141418] border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-white/25 transition-all shrink-0">
                              <CategoryIcon className="w-4.5 h-4.5" />
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold text-neutral-100 group-hover:text-white transition-colors truncate">
                                  {item.name}
                                </span>
                                {item.is_custom && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-white/[0.08] shrink-0">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-neutral-400 group-hover:text-neutral-300 mt-0.5 truncate">
                                {item.model || 'Standard Church Hardware'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={(e) => handleCategoryBadgeClick(item.category, e)}
                            className="inline-flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 transition-all"
                          >
                            <CategoryIcon className="w-3 h-3 text-neutral-400" />
                            <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                          </button>
                        </td>

                        {/* Connectors & Technical Notes */}
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="flex flex-col space-y-1">
                            {item.connectors && item.connectors.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                {item.connectors.map((conn, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-neutral-300 border border-white/[0.08]"
                                  >
                                    {conn}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-xs text-neutral-400 group-hover:text-neutral-300 font-sans line-clamp-1">
                              {item.notes || item.description || 'No operating notes recorded.'}
                            </span>
                          </div>
                        </td>

                        {/* Actions (Inspect Hint + Three Dots Menu) */}
                        <td className="py-3.5 px-5 text-right relative">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] font-mono text-neutral-400 flex items-center space-x-0.5 pointer-events-none select-none mr-1">
                              <span>Inspect</span>
                              <ChevronRight className="w-3 h-3 text-neutral-500" />
                            </span>

                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(isMenuOpen ? null : item.id);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isMenuOpen
                                    ? 'bg-neutral-800 text-white border border-white/20'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent hover:border-white/[0.08]'
                                }`}
                                aria-label="Item options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {/* Custom Context Menu */}
                              {isMenuOpen && (
                                <div
                                  className="absolute right-0 mt-1.5 w-40 bg-[#141418] border border-white/15 rounded-xl shadow-2xl shadow-black/90 p-1 z-30 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-neutral-500 font-semibold border-b border-white/[0.06] mb-1">
                                    Equipment
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionMenuId(null);
                                      setSelectedDetailItem(item);
                                    }}
                                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>View Details</span>
                                  </button>

                                  {userRole === 'admin' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionMenuId(null);
                                          setEditingItem(item);
                                          setIsEditModalOpen(true);
                                        }}
                                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>Edit Gear</span>
                                      </button>

                                      <div className="h-px bg-white/[0.06] my-1" />

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveActionMenuId(null);
                                          setItemToDelete(item);
                                        }}
                                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors text-left"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete Item</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="h-11 bg-[#0E0E11] border-t border-white/[0.08] px-5 flex items-center justify-between shrink-0 font-mono text-xs text-neutral-400">
              <div>
                Showing {displayStart} to {displayEnd} of {totalItems} items
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/[0.08] text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-2.5 py-1 text-neutral-300">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/[0.08] text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Studio Deck / Grid View */
          <div className="flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 overflow-y-auto pr-1 pb-4">
              {paginatedItems.map((item) => {
                const CategoryIcon = getCategoryIcon(item.category);
                const isMenuOpen = activeActionMenuId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDetailItem(item)}
                    className="bg-[#0E0E11] hover:bg-[#141418] border border-white/10 hover:border-white/25 rounded-xl p-4 transition-all duration-150 group cursor-pointer shadow-sm flex flex-col justify-between space-y-3"
                  >
                    {/* Top Row: Category Pill & Menu */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-[#18181D] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white transition-colors">
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-300 border border-white/10">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      </div>

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuId(isMenuOpen ? null : item.id);
                          }}
                          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-0 mt-1 w-36 bg-[#141418] border border-white/15 rounded-xl shadow-2xl p-1 z-30 backdrop-blur-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(null);
                                setSelectedDetailItem(item);
                              }}
                              className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Details</span>
                            </button>

                            {userRole === 'admin' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(null);
                                    setEditingItem(item);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(null);
                                    setItemToDelete(item);
                                  }}
                                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Equipment Name & Model */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-semibold text-white group-hover:text-white transition-colors truncate">
                          {item.name}
                        </h3>
                        {item.is_custom && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-white/10 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-neutral-400 truncate">
                        {item.model || 'Standard Church Hardware'}
                      </p>
                      {item.description && (
                        <p className="text-[11px] font-sans text-neutral-500 line-clamp-2 leading-relaxed pt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom: Connectors */}
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {item.connectors && item.connectors.length > 0 ? (
                          item.connectors.slice(0, 3).map((conn, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-neutral-400 border border-white/10"
                            >
                              {conn}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-600">No I/O ports</span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300 flex items-center space-x-0.5 transition-colors">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Pagination Footer */}
            <div className="h-11 bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 flex items-center justify-between shrink-0 font-mono text-xs text-neutral-400 mt-2">
              <div>
                Showing {displayStart} to {displayEnd} of {totalItems} items
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/[0.08] text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-2.5 py-1 text-neutral-300">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/[0.08] text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row Click: Equipment Detail Modal */}
      <EquipmentDetailModal
        isOpen={Boolean(selectedDetailItem)}
        item={selectedDetailItem}
        inUseCount={selectedDetailItem ? getInUseCount(selectedDetailItem.id) : 0}
        userRole={userRole}
        onClose={() => setSelectedDetailItem(null)}
        onEdit={(item) => {
          setSelectedDetailItem(null);
          setEditingItem(item);
          setIsEditModalOpen(true);
        }}
      />

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
