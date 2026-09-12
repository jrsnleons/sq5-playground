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
  UserCheck,
  KeyRound
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
    setSyncStatus,
    changePassword,
    setActiveTab
  } = useSimulationStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-modal password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [modalNewPassword, setModalNewPassword] = useState('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

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
          role
        });
        setSyncStatus('synced');
        setSuccessMessage(`Signed in as ${role.toUpperCase()}`);
        setTimeout(() => setAuthModalOpen(false), 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!modalNewPassword || !modalConfirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }
    if (modalNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (modalNewPassword !== modalConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setPasswordUpdating(true);
    try {
      await changePassword(modalNewPassword);
      setSuccessMessage('Password updated successfully!');
      setModalNewPassword('');
      setModalConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setPasswordUpdating(false);
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0A0A0A] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden font-sans text-neutral-100 cursor-default animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-200">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
                Account &amp; Cloud Sync
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {isSupabaseConfigured() ? 'Supabase Authentication' : 'Local Configuration'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close dialog"
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg transition-colors focus-visible:ring-1 focus-visible:ring-white focus-visible:outline-none hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
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
            /* Authenticated Account View */
            <div className="space-y-4">
              <div className="p-4 bg-black/60 rounded-lg border border-white/[0.06] space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                      {userRole === 'admin' ? (
                        <ShieldCheck className="w-5 h-5 text-amber-400" />
                      ) : (
                        <User className="w-5 h-5 text-neutral-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white">{currentUser.displayName}</h3>
                      <p className="text-xs text-neutral-400 font-mono">{currentUser.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded border ${
                      userRole === 'admin'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        : 'bg-white/[0.05] text-neutral-300 border-white/[0.1]'
                    }`}
                  >
                    {userRole === 'admin' ? 'Administrator' : 'Team Member'}
                  </span>
                </div>
              </div>

              {/* Permission Details */}
              <div className="p-3.5 bg-black/40 rounded-lg border border-white/[0.06] text-xs text-neutral-300 space-y-2">
                <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider font-medium block">
                  Permissions Overview
                </span>
                {userRole === 'admin' ? (
                  <ul className="space-y-1.5 text-[11px] text-neutral-300">
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
                  <ul className="space-y-1.5 text-[11px] text-neutral-300">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-white">✓</span>
                      <span>Full stage equipment patching and cable routing</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-white">✓</span>
                      <span>Full digital console faders, mutes, and routing</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-white">✓</span>
                      <span>Store personal mix snapshots and recall presets</span>
                    </li>
                    <li className="flex items-center space-x-1.5 text-neutral-500">
                      <span className="text-neutral-600">•</span>
                      <span>Equipment inventory is in read-only view mode</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Change Password Collapsible Section */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="text-xs text-neutral-300 hover:text-white font-mono flex items-center space-x-1.5 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{showPasswordChange ? 'Hide Password Form' : 'Change Password...'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setActiveTab('setup');
                    }}
                    className="text-[11px] text-neutral-400 hover:text-white font-mono transition-colors"
                  >
                    Open Settings →
                  </button>
                </div>

                {showPasswordChange && (
                  <form onSubmit={handleModalPasswordChange} className="mt-3 p-3 bg-black rounded-lg border border-white/[0.08] space-y-2.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                        New Password (min 6 chars)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={modalNewPassword}
                        onChange={(e) => setModalNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-white/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder:text-neutral-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={modalConfirmPassword}
                        onChange={(e) => setModalConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-white/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder:text-neutral-600 font-mono"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={passwordUpdating}
                        className="px-3 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-mono font-medium transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                      >
                        {passwordUpdating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <KeyRound className="w-3 h-3" />
                        )}
                        <span>Update Password</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sign Out Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-neutral-300 hover:text-white transition-colors font-mono"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-mono font-medium transition-all flex items-center space-x-1.5 disabled:opacity-50"
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
              <div className="p-3.5 bg-white/[0.02] rounded-lg border border-white/[0.06] flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-300 leading-relaxed">
                  You are currently exploring in <strong className="text-white font-mono">Guest (Read-Only)</strong> mode. Sign in to patch instruments on stage, operate console faders, and recall scenes.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tech.volunteer@church.org"
                      className="w-full bg-black border border-white/[0.08] focus:border-white/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none placeholder:text-neutral-600 font-mono transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
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

                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                    * Accounts are provisioned directly by the Administrator. If you do not have an account, please contact your audio team lead.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-200 text-black font-mono text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* Guest Dismiss Action */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">Prefer to explore without an account?</span>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="text-xs font-mono text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] active:scale-[0.98] transition-all cursor-pointer"
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
