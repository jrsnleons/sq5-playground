import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  X,
  ShieldCheck,
  User,
  HardDrive,
  Cloud,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../services/supabase';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    currentUser,
    userRole,
    setUserProfile,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authModalOpen) {
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, setAuthModalOpen]);

  // Reset form messages when mode or modal opens
  useEffect(() => {
    if (authModalOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [authModalOpen, mode]);

  if (!authModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMessage('Supabase database client is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please provide both an email address and password.');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const trimmedEmail = email.trim();
        const trimmedName = displayName.trim() || trimmedEmail.split('@')[0];

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { display_name: trimmedName }
          }
        });

        if (error) throw error;

        if (data.user) {
          if (data.session) {
            // Retrieve created profile from PostgreSQL
            let profile = null;
            for (let attempt = 0; attempt < 3; attempt++) {
              const { data: p } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();
              if (p) {
                profile = p;
                break;
              }
              await new Promise((r) => setTimeout(r, 250));
            }

            const role = profile?.role === 'admin' ? 'admin' : 'member';
            setUserProfile({
              id: data.user.id,
              email: data.user.email || trimmedEmail,
              displayName: profile?.display_name || trimmedName,
              role
            });
            setSyncStatus('synced');
            setSuccessMessage(`Account created! Welcome, ${profile?.display_name || trimmedName} (${role.toUpperCase()})`);
            setTimeout(() => setAuthModalOpen(false), 900);
          } else {
            setSuccessMessage('Account registered! Please check your email inbox to confirm your account.');
            setMode('signin');
          }
        }
      } else {
        const trimmedEmail = email.trim();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });

        if (error) throw error;

        if (data.user) {
          let profile = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data: p } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();
            if (p) {
              profile = p;
              break;
            }
            await new Promise((r) => setTimeout(r, 250));
          }

          const role = profile?.role === 'admin' ? 'admin' : 'member';
          setUserProfile({
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            displayName: profile?.display_name || data.user.email?.split('@')[0] || 'Member',
            role
          });
          setSyncStatus('synced');
          setSuccessMessage(`Signed in as ${role.toUpperCase()}`);
          setTimeout(() => setAuthModalOpen(false), 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      console.warn('Supabase sign out error:', err);
    } finally {
      signOut();
      setLoading(false);
      setSuccessMessage('Successfully signed out');
      setTimeout(() => {
        setSuccessMessage(null);
        setAuthModalOpen(false);
      }, 700);
    }
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
              <h2 id="auth-modal-title" className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                Account &amp; Cloud Sync
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {isSupabaseConfigured() ? 'Supabase Authentication' : 'Local Configuration'}
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
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Authenticated Account View */
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700">
                      {userRole === 'admin' ? (
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                      ) : (
                        <User className="w-5 h-5 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{currentUser.displayName}</h3>
                      <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      userRole === 'admin'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-sky-950 text-sky-300 border-sky-800'
                    }`}
                  >
                    {userRole === 'admin' ? 'Administrator' : 'Team Member'}
                  </span>
                </div>
              </div>

              {/* Permission Details */}
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                  Permissions Overview
                </span>
                {userRole === 'admin' ? (
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-400">✓</span>
                      <span>Full CRUD control over PostgreSQL equipment inventory</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-400">✓</span>
                      <span>Manage and overwrite church master reference scenes</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-400">✓</span>
                      <span>Full stage equipment patching and live console mixing</span>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-sky-400">✓</span>
                      <span>Full stage equipment patching and cable routing</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-sky-400">✓</span>
                      <span>Full digital console faders, mutes, and routing</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-sky-400">✓</span>
                      <span>Store personal mix snapshots and recall presets</span>
                    </li>
                    <li className="flex items-center space-x-1.5 text-slate-400">
                      <span className="text-slate-500">•</span>
                      <span>Equipment inventory is in read-only view mode</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Sign Out Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors font-mono"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 hover:border-rose-700 text-rose-200 text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated / Guest View */
            <div className="space-y-4">
              {/* Guest Notice */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are currently exploring in <strong className="text-white">Guest (Read-Only)</strong> mode. Sign in to patch instruments on stage, operate console faders, and manage scenes.
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
                    mode === 'signin'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
                    mode === 'signup'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Display Name / Team Title
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. David Miller (Sound Lead)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tech.volunteer@church.org"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    * The first account registered is automatically granted the <strong className="text-amber-300">Administrator</strong> role.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-lg shadow-sky-950 cursor-pointer mt-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </button>
              </form>

              {/* Guest Dismiss Action */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Prefer to explore without an account?</span>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
