import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  X,
  ShieldCheck,
  Sparkles,
  Save,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { PracticeSimulation } from '../../services/supabase';

export const AdminCreateSimulationModal: React.FC = () => {
  const {
    adminCreateModalOpen,
    setAdminCreateModalOpen,
    publishNewSimulation,
    sim
  } = useSimulationStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PracticeSimulation['category']>('patching');
  const [difficulty, setDifficulty] = useState<PracticeSimulation['difficulty']>('beginner');
  const [briefing, setBriefing] = useState(
    '### Challenge Objectives\n1. Connect the required instruments into the stage box.\n2. In Console Routing, configure the auxiliary monitor feeds.\n3. Verify unmuted signal presence reaching the master bus.'
  );
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && adminCreateModalOpen) {
        setAdminCreateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminCreateModalOpen, setAdminCreateModalOpen]);

  if (!adminCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const savedToCloud = await publishNewSimulation({
        title: title.trim(),
        description: description.trim() || 'Custom practice challenge for sound trainees.',
        category,
        difficulty,
        briefing: briefing.trim()
      });

      setStatusMessage({
        text: savedToCloud
          ? 'Simulation published to cloud and cached locally!'
          : 'Simulation saved to local browser training library!',
        type: 'success'
      });

      setTimeout(() => {
        setAdminCreateModalOpen(false);
        setStatusMessage(null);
      }, 1000);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to publish simulation',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const stageItemCount = sim.physical.stageItems.length;
  const cableCount = sim.physical.cables.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-create-modal-title"
      onClick={() => setAdminCreateModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="admin-create-modal-title" className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
                Admin: Create Practice Challenge
              </h2>
              <p className="text-[11px] text-neutral-400">
                Publish current workspace layout as a guided training simulation
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminCreateModalOpen(false)}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Summary Pill */}
        <div className="px-6 pt-4">
          <div className="p-3 bg-black/60 border border-white/[0.06] rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">Current Workspace Captured:</span>
            <div className="flex items-center space-x-3 text-neutral-200">
              <span>{stageItemCount} Stage Items</span>
              <span className="text-neutral-600">•</span>
              <span>{cableCount} Cables</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1 uppercase">
              Simulation Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Service Drum & Vocal Patch Challenge"
              className="w-full bg-black border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none placeholder:text-neutral-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1 uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-black border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-neutral-200 focus:border-white/40 focus:outline-none font-mono"
              >
                <option value="patching">Stage Patching</option>
                <option value="iem">IEM Monitoring</option>
                <option value="geq">GEQ Feedback</option>
                <option value="mixing">Band Mixing</option>
                <option value="general">General Audio</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-neutral-400 mb-1 uppercase">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-black border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-neutral-200 focus:border-white/40 focus:outline-none font-mono"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1 uppercase">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what the trainee will learn..."
              className="w-full bg-black border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:border-white/40 focus:outline-none placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1 uppercase">
              Task Briefing &amp; Objectives (Markdown)
            </label>
            <textarea
              rows={4}
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              className="w-full bg-black border border-white/[0.08] rounded-lg p-3 text-xs text-neutral-200 font-mono focus:border-white/40 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAdminCreateModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-neutral-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-mono text-xs font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Publishing...' : 'Publish Challenge'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
