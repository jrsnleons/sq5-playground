import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../services/supabase';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    currentUser,
    setUserProfile,
    signOut,
    setSyncStatus,
    setActiveTab,
    setSettingsSubTab
  } = useSimulationStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Reset form messages and inputs when modal opens
  useEffect(() => {
    if (authModalOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setEmail('');
      setPassword('');
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMessage('Authentication client is not configured.');
      setLoading(false);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please provide both an email address and password.');
      setLoading(false);
      return;
    }

    try {
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
          role,
          photoUrl: profile?.avatar_url || undefined
        });
        setSyncStatus('synced');
        setSuccessMessage(`Signed in as ${role.toUpperCase()}`);
        setTimeout(() => setAuthModalOpen(false), 700);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      console.warn('Supabase sign out error:', err);
    } finally {
      signOut();
      setLoading(false);
      setSuccessMessage('Signed out');
      setTimeout(() => {
        setSuccessMessage(null);
        setAuthModalOpen(false);
      }, 500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={() => setAuthModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 id="auth-modal-title" className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Account Sign In
          </h2>
          <button
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Already Signed In View */
            <div className="space-y-4">
              <div className="p-4 bg-black/60 rounded-lg border border-white/[0.06] flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-neutral-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-xs text-white truncate">{currentUser.displayName}</h3>
                  <p className="text-[11px] text-neutral-400 font-mono truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    setSettingsSubTab('account');
                    setActiveTab('setup');
                  }}
                  className="flex-1 py-2 px-3 rounded-md bg-white hover:bg-neutral-200 text-black font-mono text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account Settings</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="py-2 px-3 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white font-mono text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@church.org"
                    className="w-full bg-black border border-white/[0.08] focus:border-white/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none placeholder:text-neutral-600 font-mono transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-white/[0.08] focus:border-white/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none placeholder:text-neutral-600 font-mono transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-mono text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
