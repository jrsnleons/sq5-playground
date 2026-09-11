import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { Award, ChevronDown, ChevronUp, X, CheckSquare } from 'lucide-react';

export const SimulationBriefingBanner: React.FC = () => {
  const { activeSimulation, briefingBannerVisible, exitSimulation } = useSimulationStore();
  const [expanded, setExpanded] = useState(true);

  if (!activeSimulation || !briefingBannerVisible) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-900/95 border border-sky-500/80 shadow-2xl rounded-xl backdrop-blur-md overflow-hidden font-sans text-slate-100 animate-in fade-in slide-in-from-top-3 duration-200">
      {/* Top Banner Bar */}
      <div className="px-4 py-2.5 bg-slate-950/80 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-sky-950 border border-sky-700 flex items-center justify-center text-sky-400 shrink-0">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 uppercase font-semibold shrink-0">
                PRACTICE CHALLENGE
              </span>
              <h3 className="text-xs font-bold text-white truncate font-mono">
                {activeSimulation.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 ml-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={expanded ? 'Minimize Briefing' : 'Expand Briefing'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={exitSimulation}
            className="flex items-center space-x-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 transition-colors"
            title="Exit Practice Simulation"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Expandable Briefing Body */}
      {expanded && (
        <div className="p-4 space-y-2 bg-slate-900/60 max-h-44 overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeSimulation.description}
          </p>
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block mb-1">
              Instructions:
            </span>
            <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {activeSimulation.briefing}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
