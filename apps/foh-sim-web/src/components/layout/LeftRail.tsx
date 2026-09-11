import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  Cable,
  Sliders,
  BarChart2,
  Bookmark,
  Settings,
  HelpCircle
} from 'lucide-react';

export const LeftRail: React.FC = () => {
  const { activeTab, setActiveTab } = useSimulationStore();

  const navItems = [
    { id: 'stage', label: 'Stage', icon: Cable },
    { id: 'console', label: 'Console', icon: Sliders },
    { id: 'meters', label: 'Meters', icon: BarChart2 },
    { id: 'scenes', label: 'Scenes', icon: Bookmark },
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ] as const;

  return (
    <aside className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-2 space-y-1.5 shrink-0 z-20 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-13 h-13 flex flex-col items-center justify-center rounded-lg text-[10px] font-medium transition-all ${
              isActive
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
