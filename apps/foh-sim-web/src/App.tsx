import React, { Suspense, lazy, useEffect } from 'react';
import { useSimulationStore } from './store/simulationStore';
import { TopBar } from './components/layout/TopBar';
import { LeftRail } from './components/layout/LeftRail';
import { BottomStatusStrip } from './components/layout/BottomStatusStrip';
import { NoticesModal } from './components/modals/NoticesModal';
import { EntryModeModal } from './components/modals/EntryModeModal';
import { SimulationBriefingBanner } from './components/layout/SimulationBriefingBanner';
import { MobileBlockScreen } from './components/layout/MobileBlockScreen';
import { Loader2, X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './services/supabase';

const AuthModal = lazy(() =>
  import('./components/modals/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const SimulationsModal = lazy(() =>
  import('./components/modals/SimulationsModal').then((m) => ({ default: m.SimulationsModal }))
);
const AdminCreateSimulationModal = lazy(() =>
  import('./components/modals/AdminCreateSimulationModal').then((m) => ({ default: m.AdminCreateSimulationModal }))
);

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
  const {
    activeTab,
    setActiveTab,
    userRole,
    toastNotice,
    setToastNotice,
    setSyncStatus,
    setUserProfile,
    fetchInventory,
    fetchScenes
  } = useSimulationStore();

  useEffect(() => {
    // Initial fetch of equipment inventory and official scenes
    fetchInventory().catch(console.warn);
    fetchScenes().catch(console.warn);

    // Guard tab access based on active role
    if (userRole === 'guest' && activeTab !== 'stage' && activeTab !== 'console' && activeTab !== 'setup') {
      setActiveTab('stage');
    } else if ((activeTab as string) === 'help') {
      setActiveTab('stage');
    }

    // Online / Offline Detection
    const handleOnline = () => {
      setSyncStatus(isSupabaseConfigured() ? 'synced' : 'local-only');
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Supabase Auth State Change Listener
    let authSubscription: { unsubscribe: () => void } | null = null;
    const client = supabase;
    if (isSupabaseConfigured() && client) {
      const { data } = client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          try {
            let profile = null;
            // Retry up to 3 times to allow the PostgreSQL handle_new_user trigger to populate on initial signup
            for (let attempt = 0; attempt < 3; attempt++) {
              const { data: p } = await client
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              if (p) {
                profile = p;
                break;
              }
              await new Promise((r) => setTimeout(r, 300));
            }

            const role = profile?.role === 'admin' ? 'admin' : 'member';
            setUserProfile({
              id: session.user.id,
              email: session.user.email || '',
              displayName: profile?.display_name || session.user.email?.split('@')[0] || 'Member',
              role
            });
            setSyncStatus('synced');
          } catch (err) {
            console.warn('Failed to load user profile on auth state change:', err);
          }
        } else {
          setUserProfile(null);
          setSyncStatus(isSupabaseConfigured() ? 'synced' : 'local-only');
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, [setSyncStatus, setUserProfile, fetchInventory, fetchScenes, userRole, activeTab, setActiveTab]);

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
          {/* SimulationBriefingBanner hidden for now as challenges are hidden */}

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
      <Suspense fallback={null}>
        <AuthModal />
        <SimulationsModal />
        <AdminCreateSimulationModal />
      </Suspense>
    </div>
  );
};
