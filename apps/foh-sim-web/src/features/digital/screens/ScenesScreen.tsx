import React, { useState, useEffect, useMemo } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { MemberScene } from '../../../services/localCache';
import {
  Bookmark,
  Save,
  Play,
  Plus,
  ShieldCheck,
  Cloud,
  HardDrive,
  Copy,
  Trash2,
  RefreshCw,
  Sparkles,
  Pencil,
  Search,
  Check,
  X,
  Radio,
  SlidersHorizontal,
  Layers
} from 'lucide-react';

export const ScenesScreen: React.FC = () => {
  const {
    sim,
    officialScenes,
    userScenes,
    scenesLoading,
    fetchScenes,
    recallMemberScene,
    saveUserScene,
    deleteUserScene,
    userRole,
    setToastNotice
  } = useSimulationStore();

  const isGuest = userRole === 'guest';

  const [activeTab, setActiveTab] = useState<'all' | 'official' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Store Current Console Modal
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [isOfficialFlag, setIsOfficialFlag] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Scene Details Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<MemberScene | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSlotNumber, setEditSlotNumber] = useState(1);
  const [editIsOfficial, setEditIsOfficial] = useState(false);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  const activeSceneNumber = sim.digital.activeSceneId;

  // Active scene object
  const activeScene = useMemo(() => {
    return (
      [...officialScenes, ...userScenes].find(
        (s) => s.scene_number === activeSceneNumber
      ) || null
    );
  }, [officialScenes, userScenes, activeSceneNumber]);

  const handleStoreScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sceneTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await saveUserScene(
        sceneTitle.trim(),
        sceneDescription.trim(),
        userRole === 'admin' ? isOfficialFlag : false
      );
      setToastNotice({
        message: res.savedToCloud
          ? `Scene "${sceneTitle}" saved to Cloud!`
          : `Scene "${sceneTitle}" saved locally!`,
        type: 'info'
      });
      setStoreModalOpen(false);
      setSceneTitle('');
      setSceneDescription('');
      setIsOfficialFlag(false);
    } catch {
      setToastNotice({
        message: 'Failed to save scene',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverwriteWithConsole = async (scene: MemberScene) => {
    const isOfficial = scene.is_official;
    const promptMsg = isOfficial
      ? `ADMIN ACTION: Overwrite Official Preset Slot ${scene.scene_number} ("${scene.name}") with current live console settings?`
      : `Update Slot ${scene.scene_number} ("${scene.name}") with current console settings?`;

    if (!confirm(promptMsg)) return;

    try {
      const res = await saveUserScene(
        scene.name,
        scene.description || '',
        isOfficial,
        scene.id,
        scene.scene_number
      );
      setToastNotice({
        message: res.savedToCloud
          ? `Updated Slot ${scene.scene_number} and synced to Cloud!`
          : `Updated Slot ${scene.scene_number} locally!`,
        type: 'info'
      });
    } catch {
      setToastNotice({
        message: 'Failed to update scene settings',
        type: 'error'
      });
    }
  };

  const openEditModal = (scene: MemberScene) => {
    setEditingScene(scene);
    setEditTitle(scene.name);
    setEditDescription(scene.description || '');
    setEditSlotNumber(scene.scene_number);
    setEditIsOfficial(scene.is_official);
    setEditModalOpen(true);
  };

  const handleSaveEditedDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScene || !editTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await saveUserScene(
        editTitle.trim(),
        editDescription.trim(),
        userRole === 'admin' ? editIsOfficial : editingScene.is_official,
        editingScene.id,
        editSlotNumber,
        editingScene.scene_data
      );
      setToastNotice({
        message: res.savedToCloud
          ? `Updated "${editTitle.trim()}" in Cloud!`
          : `Updated "${editTitle.trim()}" locally!`,
        type: 'info'
      });
      setEditModalOpen(false);
      setEditingScene(null);
    } catch {
      setToastNotice({
        message: 'Failed to save scene details',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateToMyScenes = async (scene: MemberScene) => {
    try {
      await saveUserScene(
        `${scene.name} (Copy)`,
        `Personal duplicate of ${scene.name}.`,
        false
      );
      setToastNotice({
        message: `Duplicated "${scene.name}" to My Snapshots!`,
        type: 'info'
      });
      setActiveTab('custom');
    } catch {
      setToastNotice({
        message: 'Failed to duplicate scene',
        type: 'error'
      });
    }
  };

  const handleDelete = async (scene: MemberScene) => {
    const isOfficial = scene.is_official;
    const confirmMsg = isOfficial
      ? `ADMIN WARNING: Delete Official Preset "${scene.name}"?`
      : `Delete snapshot "${scene.name}"?`;

    if (confirm(confirmMsg)) {
      await deleteUserScene(scene.id, isOfficial);
      setToastNotice({
        message: `Deleted "${scene.name}"`,
        type: 'info'
      });
    }
  };

  // Filtered lists
  const filteredOfficial = useMemo(() => {
    if (activeTab === 'custom') return [];
    return officialScenes.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.scene_number.toString().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });
  }, [officialScenes, activeTab, searchQuery]);

  const filteredCustom = useMemo(() => {
    if (activeTab === 'official') return [];
    return userScenes.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.scene_number.toString().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });
  }, [userScenes, activeTab, searchQuery]);

  const totalVisible = filteredOfficial.length + filteredCustom.length;

  return (
    <div className="h-full bg-black p-6 overflow-y-auto select-none font-sans text-neutral-100">
      {/* Top Deck Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-4 mb-5 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <Bookmark className="w-4 h-4 text-neutral-300" />
            <h1 className="text-sm font-bold tracking-wider text-white font-mono uppercase">
              Scenes &amp; Snapshots
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/10">
              300 SLOTS
            </span>
            {userRole === 'admin' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Store, recall, and manage 48-channel console state snapshots and verified house presets.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchScenes()}
            disabled={scenesLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#141417] hover:bg-[#1f1f25] border border-white/15 text-neutral-300 rounded-lg text-xs font-mono transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scenesLoading ? 'animate-spin text-white' : ''}`} />
            <span>Sync</span>
          </button>

          {!isGuest && (
            <button
              onClick={() => {
                setSceneTitle(`Sunday Mix ${new Date().toLocaleDateString()}`);
                setStoreModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-bold font-mono transition-colors shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Store Current Mix</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-only Guest Banner */}
      {isGuest && (
        <div className="mb-5 px-4 py-2 rounded-xl bg-neutral-900 border border-white/[0.08] text-xs font-mono text-neutral-400 flex items-center justify-between">
          <span>Preview mode: You can recall snapshots to preview console setups. Creating and editing scenes requires signing in.</span>
        </div>
      )}

      {/* Active Scene Console Telemetry HUD */}
      <div className="mb-6 bg-[#141417] border border-white/15 rounded-xl p-4 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.18)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center font-mono font-black text-sm text-white shrink-0">
            {activeSceneNumber ? String(activeSceneNumber).padStart(2, '0') : '--'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE ON CONSOLE</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                SLOT {activeSceneNumber || 1}
              </span>
            </div>
            <div className="text-sm font-bold text-white tracking-wide mt-0.5">
              {activeScene?.name || 'Custom Live Console Mix'}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              {activeScene?.description || 'Active live mixing configuration.'}
            </div>
          </div>
        </div>

        {/* Snapshot Footprint Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="px-2 py-1 rounded-md bg-[#1c1c22] border border-white/10 text-neutral-300 flex items-center space-x-1">
            <Radio className="w-3 h-3 text-sky-400" />
            <span>48 CH Preamp / PEQ</span>
          </span>
          <span className="px-2 py-1 rounded-md bg-[#1c1c22] border border-white/10 text-neutral-300 flex items-center space-x-1">
            <SlidersHorizontal className="w-3 h-3 text-amber-400" />
            <span>12 Aux / IEM Mixes</span>
          </span>
          <span className="px-2 py-1 rounded-md bg-[#1c1c22] border border-white/10 text-neutral-300 flex items-center space-x-1">
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>8 DCAs &bull; 4 FX</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Segmented Category Control */}
        <div className="flex items-center space-x-1 p-1 rounded-lg bg-[#141417] border border-white/15 text-xs font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({officialScenes.length + userScenes.length})
          </button>

          <button
            onClick={() => setActiveTab('official')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
              activeTab === 'official'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Presets ({officialScenes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
              activeTab === 'custom'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>My Snapshots ({userScenes.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search scenes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#141417] border border-white/15 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Empty Search State */}
      {totalVisible === 0 && (
        <div className="p-12 rounded-xl border border-dashed border-white/15 bg-[#121215] text-center">
          <Sparkles className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
          <div className="text-sm font-bold text-white mb-1">
            {searchQuery ? 'No Matching Scenes' : 'No Snapshots in this Category'}
          </div>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No scenes match "${searchQuery}". Try a different search term.`
              : 'Save your current console state as a snapshot to access it anytime.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 bg-[#1c1c22] hover:bg-[#26262e] border border-white/15 text-white rounded-lg text-xs font-mono font-medium transition-colors"
            >
              Clear Search
            </button>
          ) : !isGuest ? (
            <button
              onClick={() => setStoreModalOpen(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-bold font-mono transition-colors"
            >
              Store Current Mix
            </button>
          ) : null}
        </div>
      )}

      {/* Official Presets Section */}
      {filteredOfficial.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-bold text-neutral-300 uppercase font-mono tracking-wider">
                Standard House Presets
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              {filteredOfficial.length} {filteredOfficial.length === 1 ? 'preset' : 'presets'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredOfficial.map((scene) => {
              const isActive = scene.scene_number === activeSceneNumber;

              return (
                <div
                  key={scene.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isActive
                      ? 'bg-[#151a17] border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(16,185,129,0.2)]'
                      : 'bg-[#161619] border-white/15 hover:border-white/35 hover:bg-[#1a1a1f] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                  }`}
                >
                  <div>
                    {/* Top Row: Slot Number & Preset Tag */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                          SLOT {String(scene.scene_number).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60 font-mono font-semibold flex items-center space-x-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>PRESET</span>
                        </span>
                      </div>

                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    {/* Scene Title & Description */}
                    <div className="text-sm font-bold text-white mb-1.5 tracking-tight">
                      {scene.name}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
                      {scene.description || 'Standard console configuration.'}
                    </p>

                    {/* Micro footprint telemetry */}
                    <div className="flex items-center space-x-2 text-[9px] font-mono text-neutral-400 mb-4">
                      <span>48 IN / 12 OUT</span>
                      <span>&bull;</span>
                      <span>DCA 1-8</span>
                      <span>&bull;</span>
                      <span>FX 1-4</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-white/10 flex items-center space-x-1.5">
                    {isActive ? (
                      <div className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-mono font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>ACTIVE MIX</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => recallMemberScene(scene)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold transition-colors shadow"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>RECALL</span>
                      </button>
                    )}

                    {/* Duplicate action */}
                    {!isGuest && (
                      <button
                        onClick={() => handleDuplicateToMyScenes(scene)}
                        title="Clone to My Snapshots"
                        className="p-1.5 rounded-lg bg-[#141417] hover:bg-neutral-800 border border-white/15 text-neutral-300 hover:text-white transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Admin Overwrite / Edit / Delete */}
                    {userRole === 'admin' && (
                      <>
                        <button
                          onClick={() => handleOverwriteWithConsole(scene)}
                          title="Admin: Overwrite with current live mix"
                          className="p-1.5 rounded-lg bg-[#141417] hover:bg-neutral-800 border border-white/15 text-neutral-300 hover:text-white transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(scene)}
                          title="Admin: Edit preset details"
                          className="p-1.5 rounded-lg bg-[#141417] hover:bg-neutral-800 border border-white/15 text-neutral-300 hover:text-white transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(scene)}
                          title="Admin: Delete preset"
                          className="p-1.5 rounded-lg bg-[#141417] hover:bg-red-950/50 border border-white/15 hover:border-red-900/50 text-neutral-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Custom Snapshots Section */}
      {filteredCustom.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-neutral-300 uppercase font-mono tracking-wider">
                My Custom Snapshots
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              {filteredCustom.length} {filteredCustom.length === 1 ? 'snapshot' : 'snapshots'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredCustom.map((scene) => {
              const isActive = scene.scene_number === activeSceneNumber;
              const isLocal = scene.id.startsWith('local-');

              return (
                <div
                  key={scene.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isActive
                      ? 'bg-[#151a17] border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(16,185,129,0.2)]'
                      : 'bg-[#161619] border-white/15 hover:border-white/35 hover:bg-[#1a1a1f] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                  }`}
                >
                  <div>
                    {/* Top Row: Slot & Cloud Status */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                          SLOT {String(scene.scene_number).padStart(2, '0')}
                        </span>
                        {isLocal ? (
                          <span
                            title="Saved in browser local storage"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-white/10 font-mono flex items-center space-x-1"
                          >
                            <HardDrive className="w-2.5 h-2.5" />
                            <span>Local</span>
                          </span>
                        ) : (
                          <span
                            title="Synced with Cloud"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-white/10 font-mono flex items-center space-x-1"
                          >
                            <Cloud className="w-2.5 h-2.5 text-sky-400" />
                            <span>Cloud</span>
                          </span>
                        )}
                      </div>

                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Notes */}
                    <div className="text-sm font-bold text-white mb-1.5 tracking-tight">
                      {scene.name}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
                      {scene.description || 'Personal mixing snapshot.'}
                    </p>

                    {/* Metadata */}
                    <div className="text-[10px] text-neutral-400 font-mono mb-4 flex items-center justify-between">
                      <span>{scene.author_name || 'Personal Save'}</span>
                      <span>
                        {scene.created_at
                          ? new Date(scene.created_at).toLocaleDateString()
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-3 border-t border-white/10 flex items-center space-x-1.5">
                    {isActive ? (
                      <div className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-mono font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>ACTIVE MIX</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => recallMemberScene(scene)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold transition-colors shadow"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>RECALL</span>
                      </button>
                    )}

                    {!isGuest && (
                      <>
                        <button
                          onClick={() => handleOverwriteWithConsole(scene)}
                          title="Update slot with current console state"
                          className="p-1.5 rounded-lg bg-[#141417] hover:bg-neutral-800 border border-white/15 text-neutral-300 hover:text-white transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(scene)}
                          title="Edit scene title and slot"
                          className="p-1.5 rounded-lg bg-[#141417] hover:bg-neutral-800 border border-white/15 text-neutral-300 hover:text-white transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(scene)}
                          title="Delete snapshot"
                          className="p-1.5 rounded-lg bg-[#141417] hover:bg-red-950/50 border border-white/15 hover:border-red-900/50 text-neutral-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Store Current Console */}
      {storeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161619] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-[0_20px_50px_-8px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.18)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Store Current Console Mix
                </h3>
              </div>
              <button
                onClick={() => setStoreModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStoreScene} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Scene Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Morning Worship"
                  value={sceneTitle}
                  onChange={(e) => setSceneTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0c0c0e] border border-white/15 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Acoustic worship set, lead vocal CH 2, IEMs pre-faded..."
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0c0c0e] border border-white/15 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                />
              </div>

              {userRole === 'admin' && (
                <div className="p-3 rounded-lg bg-[#0c0c0e] border border-white/15 flex items-start space-x-2.5">
                  <input
                    type="checkbox"
                    id="officialToggle"
                    checked={isOfficialFlag}
                    onChange={(e) => setIsOfficialFlag(e.target.checked)}
                    className="mt-0.5 rounded accent-white"
                  />
                  <label htmlFor="officialToggle" className="text-xs cursor-pointer">
                    <span className="font-bold text-white block">
                      Mark as Standard House Preset
                    </span>
                    <span className="text-neutral-400 text-[11px] block mt-0.5">
                      Locks this scene as an official reference baseline available to all operators.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStoreModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#141417] hover:bg-[#1f1f25] border border-white/15 text-neutral-300 rounded-lg text-xs font-mono font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !sceneTitle.trim()}
                  className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-mono font-bold disabled:opacity-50 transition-colors shadow"
                >
                  {isSubmitting ? 'Storing...' : 'Store Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Scene Details */}
      {editModalOpen && editingScene && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161619] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-[0_20px_50px_-8px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.18)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Edit Scene (Slot {editingScene.scene_number})
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedDetails} className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    Slot #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={editSlotNumber}
                    onChange={(e) => setEditSlotNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-2 text-xs bg-[#0c0c0e] border border-white/15 rounded-lg text-white focus:outline-none focus:border-white/40 font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    Scene Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0c0c0e] border border-white/15 rounded-lg text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0c0c0e] border border-white/15 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>

              {userRole === 'admin' && (
                <div className="p-3 rounded-lg bg-[#0c0c0e] border border-white/15 flex items-start space-x-2.5">
                  <input
                    type="checkbox"
                    id="editOfficialToggle"
                    checked={editIsOfficial}
                    onChange={(e) => setEditIsOfficial(e.target.checked)}
                    className="mt-0.5 rounded accent-white"
                  />
                  <label htmlFor="editOfficialToggle" className="text-xs cursor-pointer">
                    <span className="font-bold text-white block">
                      Standard House Preset
                    </span>
                    <span className="text-neutral-400 text-[11px] block mt-0.5">
                      Toggle whether this scene is locked as an official team baseline.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#141417] hover:bg-[#1f1f25] border border-white/15 text-neutral-300 rounded-lg text-xs font-mono font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editTitle.trim()}
                  className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-mono font-bold disabled:opacity-50 transition-colors shadow"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
