import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  X,
  Play,
  Award,
  Sparkles,
  Layers,
  Activity,
  Sliders,
  PlusCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { PracticeSimulation } from '../../services/supabase';

export const SimulationsModal: React.FC = () => {
  const {
    simulationsModalOpen,
    setSimulationsModalOpen,
    simulationsList,
    loadSimulation,
    activeSimulation,
    userRole,
    setAdminCreateModalOpen
  } = useSimulationStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && simulationsModalOpen) {
        setSimulationsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [simulationsModalOpen, setSimulationsModalOpen]);

  if (!simulationsModalOpen) return null;

  const filteredSimulations = simulationsList.filter((sim) => {
    const matchesCategory =
      selectedCategory === 'all' || sim.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === 'all' || sim.difficulty === selectedDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  const getDifficultyBadge = (diff: PracticeSimulation['difficulty']) => {
    switch (diff) {
      case 'beginner':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-neutral-300 border border-white/[0.08]">
            BEGINNER
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-white border border-white/[0.15]">
            INTERMEDIATE
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.12] text-white border border-white/20">
            ADVANCED
          </span>
        );
    }
  };

  const getCategoryIcon = (category: PracticeSimulation['category']) => {
    switch (category) {
      case 'patching':
        return <Layers className="w-4 h-4 text-neutral-300" />;
      case 'iem':
        return <Activity className="w-4 h-4 text-neutral-300" />;
      case 'geq':
        return <Sliders className="w-4 h-4 text-neutral-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-neutral-300" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulations-modal-title"
      onClick={() => setSimulationsModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[85vh] bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-100 cursor-default flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="simulations-modal-title" className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
                  Practice Simulations &amp; Challenges
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  TRAINING HUB
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Select a guided audio engineering challenge to practice patching, mixing, and feedback suppression.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {userRole === 'admin' && (
              <button
                onClick={() => {
                  setSimulationsModalOpen(false);
                  setAdminCreateModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-mono text-xs font-semibold transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Challenge</span>
              </button>
            )}

            <button
              onClick={() => setSimulationsModalOpen(false)}
              aria-label="Close dialog"
              className="text-neutral-400 hover:text-white p-1.5 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-black/30 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'patching', label: 'Stage Patching' },
              { id: 'iem', label: 'IEM Monitoring' },
              { id: 'geq', label: 'GEQ Feedback' },
              { id: 'mixing', label: 'Band Mixing' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black font-semibold'
                    : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Difficulty Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-neutral-400 font-mono">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-black border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-neutral-200 font-mono focus:border-white/40 focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Simulation Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSimulations.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-neutral-500 text-xs font-mono">
              No simulations found matching criteria.
            </div>
          ) : (
            filteredSimulations.map((sim) => {
              const isActive = activeSimulation?.id === sim.id;
              return (
                <div
                  key={sim.id}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'bg-white/[0.05] border-white/30 ring-1 ring-white/20'
                      : 'bg-black/60 hover:bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(sim.category)}
                        <span className="text-[11px] font-mono uppercase text-neutral-400">
                          {sim.category}
                        </span>
                      </div>
                      {getDifficultyBadge(sim.difficulty)}
                    </div>

                    <h3 className="font-semibold text-sm text-white leading-snug">
                      {sim.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {sim.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      By {sim.authorName || 'Church Audio'}
                    </span>

                    <button
                      onClick={() => loadSimulation(sim)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-1.5 transition-all ${
                        isActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold'
                          : 'bg-white hover:bg-neutral-200 text-black font-semibold'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Now</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Launch Practice</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span className="font-mono text-[11px]">
            Offline-Ready: All simulations are cached locally in your browser.
          </span>
          <button
            onClick={() => setSimulationsModalOpen(false)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-300 hover:text-white font-mono text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
