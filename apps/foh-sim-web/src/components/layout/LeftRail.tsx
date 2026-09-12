import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  Cable,
  Sliders,
  Package,
  Bookmark,
  Settings
} from 'lucide-react';

export const LeftRail: React.FC = () => {
  const { activeTab, setActiveTab, userRole } = useSimulationStore();

  const allNavItems = [
    { id: 'stage', label: 'Stage', icon: Cable, roles: ['guest', 'member', 'admin'] },
    { id: 'console', label: 'Console', icon: Sliders, roles: ['guest', 'member', 'admin'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['member', 'admin'] },
    { id: 'scenes', label: 'Scenes', icon: Bookmark, roles: ['member', 'admin'] },
    { id: 'setup', label: 'Settings', icon: Settings, roles: ['guest', 'member', 'admin'] }
  ] as const;

  const visibleNavItems = allNavItems.filter((item) =>
    (item.roles as readonly string[]).includes(userRole)
  );

  return (
    <aside className="w-14 bg-black border-r border-white/[0.08] flex flex-col items-center py-3 space-y-1.5 shrink-0 z-20 select-none">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-11 h-11 flex flex-col items-center justify-center rounded-lg text-[9px] font-medium tracking-tight transition-colors ${
              isActive
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
