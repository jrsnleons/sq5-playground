import React from 'react';
import { useSimulationStore } from './store/simulationStore';
import { TopBar } from './components/layout/TopBar';
import { LeftRail } from './components/layout/LeftRail';
import { BottomStatusStrip } from './components/layout/BottomStatusStrip';
import { PhysicalCanvas } from './features/physical/PhysicalCanvas';
import { DigitalConsoleView } from './features/digital/DigitalConsoleView';
import { MetersScreen } from './features/digital/screens/MetersScreen';
import { ScenesScreen } from './features/digital/screens/ScenesScreen';
import { SetupScreen } from './features/digital/screens/SetupScreen';
import { HelpScreen } from './features/digital/screens/HelpScreen';
import { NoticesModal } from './components/modals/NoticesModal';
import { EntryModeModal } from './components/modals/EntryModeModal';

export const App: React.FC = () => {
  const { activeTab } = useSimulationStore();

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top Application Bar */}
      <TopBar />

      {/* Center Layout: Left Nav Rail + Main Canvas/Console Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <LeftRail />

        <main className="flex-1 h-full overflow-hidden relative bg-slate-950">
          {activeTab === 'stage' && <PhysicalCanvas />}
          {activeTab === 'console' && <DigitalConsoleView />}
          {activeTab === 'meters' && (
            <div className="h-full p-4 overflow-hidden">
              <MetersScreen />
            </div>
          )}
          {activeTab === 'scenes' && (
            <div className="h-full p-4 overflow-hidden">
              <ScenesScreen />
            </div>
          )}
          {activeTab === 'setup' && (
            <div className="h-full p-4 overflow-hidden">
              <SetupScreen />
            </div>
          )}
          {activeTab === 'help' && (
            <div className="h-full p-4 overflow-hidden">
              <HelpScreen />
            </div>
          )}
        </main>
      </div>

      {/* Bottom Status Strip */}
      <BottomStatusStrip />

      {/* Global Modals */}
      <NoticesModal />
      <EntryModeModal />
    </div>
  );
};
