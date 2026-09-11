import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Bookmark, Save, Play, Plus } from 'lucide-react';

export const ScenesScreen: React.FC = () => {
  const { sim, saveScene, recallScene } = useSimulationStore();
  const [newSceneName, setNewSceneName] = useState('');

  const activeSceneId = sim.digital.activeSceneId;

  const handleCreateScene = () => {
    const nextId = sim.digital.scenes.length + 1;
    saveScene(nextId, newSceneName.trim() || `Scene ${nextId}`);
    setNewSceneName('');
  };

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto select-none font-sans text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white uppercase font-mono">
            SQ Scene Manager (300 Slots)
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="New scene title..."
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleCreateScene}
            className="flex items-center space-x-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Store Next</span>
          </button>
        </div>
      </div>

      {/* Scenes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sim.digital.scenes.map((scene) => {
          const isActive = scene.id === activeSceneId;

          return (
            <div
              key={scene.id}
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-amber-400">
                  SLOT {scene.id}
                </span>
                {isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold">
                    CURRENT
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-slate-200 mb-3">{scene.name}</div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => recallScene(scene.id)}
                  className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-mono font-bold transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>RECALL</span>
                </button>
                <button
                  onClick={() => saveScene(scene.id)}
                  title="Update slot with current console state"
                  className="p-1.5 rounded bg-slate-800 hover:bg-sky-600 text-slate-400 hover:text-white transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
