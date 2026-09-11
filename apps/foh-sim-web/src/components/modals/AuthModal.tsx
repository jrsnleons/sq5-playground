import React, { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  X,
  ShieldCheck,
  User,
  HardDrive,
  Cloud,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../services/supabase';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    currentUser,
    userRole,
    setUserProfile,
    setUserRole,
    signOut,
    syncStatus,
    setSyncStatus
  } = useSimulationStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authModalOpen) {
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, setAuthModalOpen]);

  if (!authModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
      // Local demo mode if Supabase credentials are not configured
      const simulatedRole = email.toLowerCase().includes('admin') ? 'admin' : 'member';
      setUserProfile({
        id: `user-${Date.now()}`,
        email: email || 'soundtech@church.org',
        displayName: displayName || (email ? email.split('@')[0] : 'Sound Tech'),
        role: simulatedRole
      });
      setSyncStatus('local-only');
      setSuccessMessage(`Signed in as ${simulatedRole.toUpperCase()} (Local Profile)`);
      setLoading(false);
      setTimeout(() => setAuthModalOpen(false), 800);
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split('@')[0] }
          }
        });
        if (error) throw error;
        if (data.user) {
          setSuccessMessage('Account created! Please check your email for confirmation.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          setUserProfile({
            id: data.user.id,
            email: data.user.email || email,
            displayName: profile?.display_name || data.user.email?.split('@')[0] || 'Member',
            role: profile?.role || 'member'
          });
          setSyncStatus('synced');
          setSuccessMessage('Successfully signed in!');
          setTimeout(() => setAuthModalOpen(false), 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchDemoRole = (role: 'admin' | 'member') => {
    setUserRole(role);
    if (!currentUser) {
      setUserProfile({
        id: `demo-${role}`,
        email: `${role}@church.org`,
        displayName: role === 'admin' ? 'Sound Director' : 'Trainee Volunteer',
        role
      });
    }
    setSuccessMessage(`Switched active role to ${role.toUpperCase()}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={() => setAuthModalOpen(false)}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-bold text-white uppercase font-mono">
                Cloud Sync &amp; Account
              </h2>
              <p className="text-[11px] text-slate-400">
                {isSupabaseConfigured() ? 'Connected to Supabase' : 'Offline / Local-First Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white p-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Active Account Status */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                {userRole === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                ) : userRole === 'member' ? (
                  <User className="w-4 h-4 text-sky-400" />
                ) : (
                  <HardDrive className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-white">
                    {currentUser?.displayName || (userRole === 'admin' ? 'Admin' : 'Guest')}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      userRole === 'admin'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : userRole === 'member'
                        ? 'bg-sky-950 text-sky-300 border border-sky-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {userRole}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {currentUser?.email || 'Local Browser Storage'}
                </p>
              </div>
            </div>

            {currentUser && (
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Role Switcher (For testing admin vs member workflows) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              Active Role Switcher (Simulator Roles):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSwitchDemoRole('admin')}
                className={`py-2 px-3 text-xs font-mono font-bold rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                  userRole === 'admin'
                    ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin (Creator)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDemoRole('member')}
                className={`py-2 px-3 text-xs font-mono font-bold rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                  userRole === 'member'
                    ? 'bg-sky-950/80 border-sky-600 text-sky-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Member (Trainee)</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              *Admins can create and publish new practice challenges. Members can launch and practice them.
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Cloud Auth Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                {mode === 'signin' ? 'Sign In to Cloud' : 'Create Member Account'}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-xs text-sky-400 hover:underline font-mono"
              >
                {mode === 'signin' ? 'Need an account?' : 'Already have account?'}
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="audio.tech@church.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-lg shadow-sky-950"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <span>{mode === 'signin' ? 'Sign In & Sync' : 'Register Account'}</span>
              )}
            </button>
          </form>

          {/* Guest Action */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Want to practice offline?</span>
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
