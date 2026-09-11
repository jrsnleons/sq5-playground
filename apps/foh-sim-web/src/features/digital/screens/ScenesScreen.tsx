import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Info
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

  const [activeTab, setActiveTab] = useState<'all' | 'official' | 'custom'>('all');
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [isOfficialFlag, setIsOfficialFlag] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  const activeSceneNumber = sim.digital.activeSceneId;

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
          ? `Scene "${sceneTitle}" saved to Supabase Cloud!`
          : `Scene "${sceneTitle}" saved locally!`,
        type: 'info'
      });
      setStoreModalOpen(false);
      setSceneTitle('');
      setSceneDescription('');
      setIsOfficialFlag(false);
    } catch (err) {
      setToastNotice({
        message: 'Failed to save scene',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateToMyScenes = async (scene: MemberScene) => {
    try {
      await saveUserScene(
        `${scene.name} (My Copy)`,
        `Personal editable duplicate based on ${scene.name}.`,
        false
      );
      setToastNotice({
        message: `Duplicated "${scene.name}" to My Scenes!`,
        type: 'info'
      });
      setActiveTab('custom');
    } catch (e) {
      setToastNotice({
        message: 'Failed to duplicate scene',
        type: 'error'
      });
    }
  };

  const handleDelete = async (scene: MemberScene) => {
    if (confirm(`Are you sure you want to delete scene "${scene.name}"?`)) {
      await deleteUserScene(scene.id);
      setToastNotice({
        message: `Deleted "${scene.name}"`,
        type: 'info'
      });
    }
  };

  const filteredOfficial = activeTab === 'custom' ? [] : officialScenes;
  const filteredCustom = activeTab === 'official' ? [] : userScenes;

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto select-none font-sans text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
              SQ Scene Manager & Truth Profiles
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              300 SLOTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access official church reference scenes (&ldquo;solid truths&rdquo;) or build and sync your own custom mixes.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchScenes()}
            disabled={scenesLoading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-mono transition-colors disabled:opacity-50"
            title="Sync latest scenes from Cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scenesLoading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => {
              setSceneTitle(`Sunday Mix ${new Date().toLocaleDateString()}`);
              setStoreModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold font-mono shadow-md shadow-sky-950/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Store Current Console</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All Scenes ({officialScenes.length + userScenes.length})
        </button>
        <button
          onClick={() => setActiveTab('official')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
            activeTab === 'official'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Church Truths ({officialScenes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
            activeTab === 'custom'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
          <span>My Custom Scenes ({userScenes.length})</span>
        </button>
      </div>

      {/* Official Church Reference Scenes Section */}
      {filteredOfficial.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">
              Official Church Reference Scenes (Solid Truths)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono">
              VERIFIED BASELINES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredOfficial.map((scene) => {
              const isActive = scene.scene_number === activeSceneNumber;

              return (
                <div
                  key={scene.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isActive
                      ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/50'
                      : 'bg-slate-900/50 border-amber-900/40 hover:border-amber-700/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          SLOT {scene.scene_number}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold flex items-center space-x-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>TRUTH</span>
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-white mb-1.5">{scene.name}</div>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {scene.description || 'Verified church audio baseline reference.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <div className="text-[10px] text-slate-400 mb-2 font-mono flex items-center justify-between">
                      <span>Auth: {scene.author_name || 'Church Audio Director'}</span>
                      <span className="text-amber-400/80">Locked Baseline</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => recallMemberScene(scene)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-bold transition-colors shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>RECALL</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateToMyScenes(scene)}
                        title="Duplicate as an editable custom scene"
                        className="p-1.5 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Custom Scenes Section */}
      {(filteredCustom.length > 0 || activeTab === 'custom') && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Bookmark className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-sky-400 uppercase font-mono tracking-wider">
              My Custom Scenes & Mix Snapshots
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300 font-mono">
              USER SAVES
            </span>
          </div>

          {filteredCustom.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-300 mb-1">No Custom Scenes Yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Dial in your mix, adjust faders, and click &ldquo;Store Current Console&rdquo; to save your personal scene.
              </p>
              <button
                onClick={() => setStoreModalOpen(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium font-mono"
              >
                Store Current Mix as Scene
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredCustom.map((scene) => {
                const isActive = scene.scene_number === activeSceneNumber;

                return (
                  <div
                    key={scene.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isActive
                        ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/30 ring-1 ring-sky-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-sky-400">
                          SLOT {scene.scene_number}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {scene.id.startsWith('local-') ? (
                            <span
                              title="Saved in browser local storage"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono flex items-center space-x-1"
                            >
                              <HardDrive className="w-2.5 h-2.5" />
                              <span>Local</span>
                            </span>
                          ) : (
                            <span
                              title="Synced with Supabase Cloud"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono flex items-center space-x-1"
                            >
                              <Cloud className="w-2.5 h-2.5" />
                              <span>Cloud</span>
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-sm font-bold text-white mb-1.5">{scene.name}</div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {scene.description || 'User console snapshot.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      <div className="text-[10px] text-slate-400 mb-2 font-mono flex items-center justify-between">
                        <span>By: {scene.author_name || 'You'}</span>
                        <span>{scene.created_at ? new Date(scene.created_at).toLocaleDateString() : 'Just now'}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => recallMemberScene(scene)}
                          className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-mono font-bold transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>RECALL</span>
                        </button>
                        <button
                          onClick={() => handleDelete(scene)}
                          title="Delete scene"
                          className="p-1.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Store Current Console */}
      {storeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Save className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Store Current Console Scene
                </h3>
              </div>
              <button
                onClick={() => setStoreModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStoreScene} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Scene Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Morning Worship"
                  value={sceneTitle}
                  onChange={(e) => setSceneTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Acoustic set, lead vocal on CH 2, IEM mixes pre-faded..."
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {userRole === 'admin' && (
                <div className="p-3 rounded bg-amber-950/40 border border-amber-800/60 flex items-start space-x-2.5">
                  <input
                    type="checkbox"
                    id="officialToggle"
                    checked={isOfficialFlag}
                    onChange={(e) => setIsOfficialFlag(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="officialToggle" className="text-xs cursor-pointer">
                    <span className="font-bold text-amber-300 block">
                      Mark as Official Church Reference Scene (&ldquo;Solid Truth&rdquo;)
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Locks this scene as a verified baseline available to all team members and trainees.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStoreModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !sceneTitle.trim()}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Storing...' : 'Store Scene'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
