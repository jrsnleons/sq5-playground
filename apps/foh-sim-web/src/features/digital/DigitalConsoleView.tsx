import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { FaderStrip } from './FaderStrip';
import { MasterStrip } from './MasterStrip';
import { HomeScreen } from './screens/HomeScreen';
import { IOPatchScreen } from './screens/IOPatchScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { RoutingScreen } from './screens/RoutingScreen';
import { FXScreen } from './screens/FXScreen';
import { MetersScreen } from './screens/MetersScreen';
import { ScenesScreen } from './screens/ScenesScreen';
import { SetupScreen } from './screens/SetupScreen';
import { HelpScreen } from './screens/HelpScreen';
import {
  Home,
  Network,
  Activity,
  Share2,
  Sparkles,
  BarChart2,
  Bookmark,
  Settings,
  HelpCircle
} from 'lucide-react';

export const DigitalConsoleView: React.FC = () => {
  const {
    sim,
    setActiveScreen,
    setLayer,
    setSelectedMix
  } = useSimulationStore();

  const activeScreen = sim.digital.session.activeScreen;
  const currentLayer = sim.digital.session.layer;
  const activeMixId = sim.digital.session.selectedMixId;

  // Screen Keys config per MP §6.1
  const screenKeys = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'io', label: 'I/O', icon: Network },
    { id: 'processing', label: 'Processing', icon: Activity },
    { id: 'routing', label: 'Routing', icon: Share2 },
    { id: 'fx', label: 'FX', icon: Sparkles },
    { id: 'meters', label: 'Meters', icon: BarChart2 },
    { id: 'scenes', label: 'Scenes', icon: Bookmark },
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'utility', label: 'Help/Glossary', icon: HelpCircle }
  ] as const;

  // Determine channels to display on current layer (16 faders)
  const getVisibleChannels = () => {
    switch (currentLayer) {
      case 'A':
        return sim.digital.channels.slice(0, 16);
      case 'B':
        return sim.digital.channels.slice(16, 32);
      case 'C':
        return sim.digital.channels.slice(32, 48);
      default:
        return sim.digital.channels.slice(0, 16);
    }
  };

  const visibleChannels = getVisibleChannels();

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* SQ Screen Navigation Banner */}
      <nav className="h-11 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {screenKeys.map((k) => {
            const Icon = k.icon;
            const isActive = activeScreen === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setActiveScreen(k.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-[0_0_8px_#0284c7]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{k.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Mix Indicator */}
        <div className="hidden sm:flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">MIX KEY:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
            {activeMixId === 'main-lr' ? 'LR (MAIN)' : activeMixId.toUpperCase()}
          </span>
        </div>
      </nav>

      {/* Screen Viewport (Top Half) */}
      <div className="flex-1 min-h-[220px] max-h-[55%] border-b border-slate-800 overflow-hidden relative">
        {activeScreen === 'home' && <HomeScreen />}
        {activeScreen === 'io' && <IOPatchScreen />}
        {activeScreen === 'processing' && <ProcessingScreen />}
        {activeScreen === 'routing' && <RoutingScreen />}
        {activeScreen === 'fx' && <FXScreen />}
        {activeScreen === 'meters' && <MetersScreen />}
        {activeScreen === 'scenes' && <ScenesScreen />}
        {activeScreen === 'setup' && <SetupScreen />}
        {activeScreen === 'utility' && <HelpScreen />}
      </div>

      {/* Fader Control Surface (Bottom Half) */}
      <div className="h-[45%] min-h-[280px] bg-slate-920 flex flex-col justify-between overflow-hidden">
        {/* Layer & Mix Selection Strips */}
        <div className="h-9 bg-slate-900/90 border-b border-slate-800 px-3 flex items-center justify-between shrink-0">
          {/* Layer Buttons A–F */}
          <div className="flex items-center space-x-1 font-mono text-xs">
            <span className="text-slate-500 mr-1 text-[10px] uppercase">Layers:</span>
            {(['A', 'B', 'C'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setLayer(layer)}
                className={`w-7 h-6 rounded text-xs font-bold transition-all ${
                  currentLayer === layer
                    ? 'bg-sky-500 text-white shadow-[0_0_6px_#38bdf8]'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          {/* Mix Selection Keys (LR, Mix 1-12) */}
          <div className="flex items-center space-x-1 font-mono text-xs overflow-x-auto py-1">
            <span className="text-slate-500 mr-1 text-[10px] uppercase">Mixes:</span>
            <button
              onClick={() => setSelectedMix('main-lr')}
              className={`px-2.5 h-6 rounded text-[11px] font-bold transition-all ${
                activeMixId === 'main-lr'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_6px_#f59e0b]'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              LR
            </button>
            {sim.digital.mixes.slice(0, 7).map((mix) => (
              <button
                key={mix.id}
                onClick={() => setSelectedMix(mix.id)}
                title={mix.name}
                className={`px-2 h-6 rounded text-[10px] font-bold transition-all ${
                  activeMixId === mix.id
                    ? 'bg-teal-500 text-slate-950 shadow-[0_0_6px_#14b8a6]'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                M{mix.mixNumber}
              </button>
            ))}
          </div>
        </div>

        {/* 16 Channel Fader Strips + Master Strip */}
        <div className="flex-1 flex overflow-x-auto overflow-y-hidden">
          {visibleChannels.map((channel) => (
            <FaderStrip key={channel.id} channel={channel} />
          ))}
          {/* Context-Sensitive Master Strip on Right */}
          <MasterStrip />
        </div>
      </div>
    </div>
  );
};
