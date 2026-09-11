import React, { Suspense, lazy, useEffect } from 'react';
import { useSimulationStore } from './store/simulationStore';
import { TopBar } from './components/layout/TopBar';
import { LeftRail } from './components/layout/LeftRail';
import { BottomStatusStrip } from './components/layout/BottomStatusStrip';
import { NoticesModal } from './components/modals/NoticesModal';
import { EntryModeModal } from './components/modals/EntryModeModal';
import { MobileBlockScreen } from './components/layout/MobileBlockScreen';
import { Loader2, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const PhysicalCanvas = lazy(() =>
  import('./features/physical/PhysicalCanvas').then((m) => ({ default: m.PhysicalCanvas }))
);
const DigitalConsoleView = lazy(() =>
  import('./features/digital/DigitalConsoleView').then((m) => ({ default: m.DigitalConsoleView }))
);
const InventoryScreen = lazy(() =>
  import('./features/inventory/InventoryScreen').then((m) => ({ default: m.InventoryScreen }))
);
const ScenesScreen = lazy(() =>
  import('./features/digital/screens/ScenesScreen').then((m) => ({ default: m.ScenesScreen }))
);
const SetupScreen = lazy(() =>
  import('./features/digital/screens/SetupScreen').then((m) => ({ default: m.SetupScreen }))
);
const HelpScreen = lazy(() =>
  import('./features/digital/screens/HelpScreen').then((m) => ({ default: m.HelpScreen }))
);

const ViewLoadingFallback = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-2">
    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
    <span className="text-xs font-mono tracking-wider">LOADING MODULE...</span>
  </div>
);

export const App: React.FC = () => {
  const { activeTab, toastNotice, setToastNotice } = useSimulationStore();

  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => {
        setToastNotice(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice, setToastNotice]);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden select-none font-sans">
      {/* Mobile Display Restriction Screen */}
      <MobileBlockScreen />

      {/* Top Application Bar */}
      <TopBar />

      {/* Center Layout: Left Nav Rail + Main Canvas/Console Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <LeftRail />

        <main className="flex-1 h-full overflow-hidden relative bg-slate-950">
          <Suspense fallback={<ViewLoadingFallback />}>
            {activeTab === 'stage' && <PhysicalCanvas />}
            {activeTab === 'console' && <DigitalConsoleView />}
            {activeTab === 'inventory' && <InventoryScreen />}
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
          </Suspense>
        </main>
      </div>

      {/* Bottom Status Strip */}
      <BottomStatusStrip />

      {/* Global Toast Notification */}
      {toastNotice && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-10 right-6 z-50 max-w-sm bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-3.5 flex items-start space-x-3 text-xs text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="mt-0.5 shrink-0">
            {toastNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : toastNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <Info className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white font-mono uppercase text-[10px] tracking-wide">
              {toastNotice.type === 'error' ? 'Connection Blocked' : 'System Notice'}
            </p>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
              {toastNotice.message}
            </p>
          </div>
          <button
            onClick={() => setToastNotice(null)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Modals */}
      <NoticesModal />
      <EntryModeModal />
    </div>
  );
};
