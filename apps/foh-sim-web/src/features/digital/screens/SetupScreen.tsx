import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  Settings,
  Save,
  CheckCircle2,
  ShieldCheck,
  User,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowRightLeft,
  RotateCcw,
  Church,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { ConfirmDialogModal } from '../../../components/modals/ConfirmDialogModal';
import { UserProfile } from '../../../services/supabase';

export const SetupScreen: React.FC = () => {
  const {
    sim,
    userRole,
    currentUser,
    saveStageAsDefaultPreset,
    loadPreset,
    resetCurrentPreset,
    teamProfiles,
    teamProfilesLoading,
    fetchTeamProfiles,
    adminCreateUser,
    adminUpdateUserRole,
    adminDeleteUser,
    changePassword
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'admin' | 'presets' | 'account'>(
    userRole === 'admin' ? 'admin' : 'presets'
  );

  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Admin User Creation Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password Change Form State
  const [passwordChangeNew, setPasswordChangeNew] = useState('');
  const [passwordChangeConfirm, setPasswordChangeConfirm] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchTeamProfiles().catch(console.warn);
    }
  }, [userRole, fetchTeamProfiles]);

  // Adjust active tab if role changes
  useEffect(() => {
    if (userRole !== 'admin' && activeTab === 'admin') {
      setActiveTab('presets');
    }
  }, [userRole, activeTab]);

  const handleSavePreset = () => {
    saveStageAsDefaultPreset();
    setSaveNotice('Current stage layout, cables, custom items, and digital patch successfully saved as Default Preset!');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleLoadPreset = (mode: 'church' | 'scratch') => {
    loadPreset(mode);
    setResetNotice(`Switched rig configuration to ${mode === 'church' ? 'Church Rig Default' : 'Scratch Mode'}.`);
    setTimeout(() => setResetNotice(null), 4000);
  };

  const handleResetPreset = () => {
    resetCurrentPreset();
    setShowResetConfirm(false);
    setResetNotice('Current rig and mixer configuration have been reset to factory defaults.');
    setTimeout(() => setResetNotice(null), 4000);
  };

  // Handle Admin User Creation
  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMessage(null);

    const trimmedEmail = newEmail.trim();
    const trimmedName = newDisplayName.trim() || trimmedEmail.split('@')[0];

    if (!trimmedEmail || !newPassword) {
      setCreateMessage({ text: 'Please provide both an email address and initial password.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setCreateMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setCreateLoading(true);
    try {
      await adminCreateUser({
        email: trimmedEmail,
        password: newPassword,
        displayName: trimmedName,
        role: newRole
      });

      setCreateMessage({
        text: `Successfully created ${newRole.toUpperCase()} account for ${trimmedName} (${trimmedEmail}).`,
        type: 'success'
      });
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('member');
    } catch (err: any) {
      setCreateMessage({
        text: err.message || 'Failed to create user account.',
        type: 'error'
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage(null);

    if (!passwordChangeNew || !passwordChangeConfirm) {
      setPasswordChangeMessage({ text: 'Please fill in both password fields.', type: 'error' });
      return;
    }
    if (passwordChangeNew.length < 6) {
      setPasswordChangeMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (passwordChangeNew !== passwordChangeConfirm) {
      setPasswordChangeMessage({ text: 'Passwords do not match. Please re-enter.', type: 'error' });
      return;
    }

    setPasswordChangeLoading(true);
    try {
      await changePassword(passwordChangeNew);
      setPasswordChangeMessage({ text: 'Your password has been updated successfully!', type: 'success' });
      setPasswordChangeNew('');
      setPasswordChangeConfirm('');
    } catch (err: any) {
      setPasswordChangeMessage({
        text: err.message || 'Failed to update password. Please try again.',
        type: 'error'
      });
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  // Handle Role Toggle
  const handleToggleRole = async (user: UserProfile) => {
    if (user.id === currentUser?.id) return;
    const nextRole = user.role === 'admin' ? 'member' : 'admin';
    setActionLoading(true);
    try {
      await adminUpdateUserRole(user.id, nextRole);
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Confirm User Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await adminDeleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (userRole === 'guest') {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-8 h-8 text-neutral-600 mb-3" />
        <h3 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">Access Restricted</h3>
        <p className="text-xs text-neutral-400 max-w-sm mt-1">
          Settings are restricted to team members and administrators. Please sign in to manage credentials or presets.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden select-none font-sans text-neutral-100">
      {/* Header */}
      <div className="h-11 bg-black border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <Settings className="w-4 h-4 text-neutral-400" />
          <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Settings &amp; Preferences
          </h2>
        </div>

        {/* Setup Navigation Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-white/[0.08] text-xs font-mono">
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'admin'
                  ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ADMIN &amp; TEAM
            </button>
          )}

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'presets'
                ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            RIG &amp; PRESETS
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'account'
                ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ACCOUNT &amp; SECURITY
          </button>
        </div>
      </div>

      {/* Save Notice Banner */}
      {saveNotice && (
        <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-6 py-2 text-xs font-mono text-emerald-300 flex items-center space-x-2 shrink-0 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveNotice}</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-800">
        {/* ==================================================================== */}
        {/* 1. ADMIN DASHBOARD & USER MANAGEMENT TAB                              */}
        {/* ==================================================================== */}
        {activeTab === 'admin' && userRole === 'admin' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            {/* Admin Header Card */}
            <div className="p-5 bg-[#0A0A0A] rounded-xl border border-white/[0.08] flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-neutral-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Admin Dashboard &amp; Team Management
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Create volunteer team logins with emails &amp; passwords, assign administrative privileges, and manage presets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchTeamProfiles()}
                disabled={teamProfilesLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition-colors border border-white/[0.08]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${teamProfilesLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Accounts</span>
              </button>
            </div>

            {/* Form: Add New Account with Email & Password */}
            <div className="p-5 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                <UserPlus className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold text-white text-xs uppercase tracking-wide">
                  Add Team Account (Email &amp; Password)
                </span>
              </div>

              {createMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                    createMessage.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-900/50 text-rose-200'
                  }`}
                >
                  {createMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{createMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleAdminCreateUser} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Full Name / Church Team Role
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="e.g. David Miller (Sound Tech)"
                        className="w-full bg-black border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Account Permission Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewRole('member')}
                        className={`py-2 px-3 rounded-md border text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                          newRole === 'member'
                            ? 'bg-neutral-800 border-white/30 text-white shadow-sm'
                            : 'bg-black border-white/[0.08] text-neutral-400 hover:border-white/20'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Team Member</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewRole('admin')}
                        className={`py-2 px-3 rounded-md border text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                          newRole === 'admin'
                            ? 'bg-neutral-800 border-white/30 text-white shadow-sm'
                            : 'bg-black border-white/[0.08] text-neutral-400 hover:border-white/20'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Administrator</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="volunteer@church.org"
                        className="w-full bg-black border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Initial Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {createLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating User...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create &amp; Provision Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            {/* Table: Registered Team Accounts */}
            <div className="p-5 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="font-semibold text-white text-xs uppercase tracking-wide">
                    Registered Team Accounts ({teamProfiles.length})
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  Backed by Supabase PostgreSQL `profiles`
                </span>
              </div>

              {teamProfiles.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  No accounts registered yet. Use the form above to add your sound volunteers.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] text-neutral-400 uppercase">
                        <th className="py-2 px-3 font-semibold">Team Member</th>
                        <th className="py-2 px-3 font-semibold">Email</th>
                        <th className="py-2 px-3 font-semibold">Role</th>
                        <th className="py-2 px-3 font-semibold">Registered</th>
                        <th className="py-2 px-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {teamProfiles.map((user) => {
                        const isSelf = user.id === currentUser?.id;
                        return (
                          <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2.5">
                                <div className="p-1.5 rounded-md bg-neutral-900 border border-white/[0.08] shrink-0">
                                  {user.role === 'admin' ? (
                                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-300" />
                                  ) : (
                                    <User className="w-3.5 h-3.5 text-neutral-400" />
                                  )}
                                </div>
                                <span className="font-semibold text-white text-xs">
                                  {user.displayName}
                                  {isSelf && (
                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-normal">
                                      YOU
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-neutral-300">{user.email}</td>
                            <td className="py-3 px-3">
                              <span className="text-[9px] uppercase px-2 py-0.5 rounded font-semibold border bg-neutral-900 text-neutral-300 border-white/[0.08]">
                                {user.role === 'admin' ? 'Administrator' : 'Team Member'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-neutral-400 text-[10px]">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  type="button"
                                  disabled={isSelf || actionLoading}
                                  onClick={() => handleToggleRole(user)}
                                  title={isSelf ? 'Cannot modify your own role' : `Switch to ${user.role === 'admin' ? 'Member' : 'Admin'}`}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors flex items-center space-x-1 ${
                                    isSelf
                                      ? 'opacity-30 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-white/[0.08]'
                                  }`}
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  <span>{user.role === 'admin' ? 'Make Member' : 'Make Admin'}</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isSelf || actionLoading}
                                  onClick={() => setUserToDelete(user)}
                                  title={isSelf ? 'Cannot delete your own account' : 'Delete user account'}
                                  className={`p-1 rounded-md text-neutral-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors ${
                                    isSelf ? 'opacity-30 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Default Rig Presets */}
            <div className="p-5 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-3 shadow-sm">
              <span className="text-xs font-semibold text-neutral-200 uppercase block tracking-wide">
                Save Current Canvas as Default Rig Preset
              </span>
              <p className="text-neutral-400 text-[11px]">
                Captures stage placement, cable routing, custom hardware definitions, and digital I/O patch. Clicking "Reset to Church Rig" will now restore this customized configuration.
              </p>

              <button
                onClick={handleSavePreset}
                className="flex items-center space-x-2 px-4 py-2 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Current Stage as Default Preset</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. ACCOUNT & SECURITY (CHANGE PASSWORD) TAB                           */}
        {/* ==================================================================== */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-2xl mx-auto font-mono text-xs">
            {/* User Profile Card */}
            <div className="p-5 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/[0.08]">
                    {userRole === 'admin' ? (
                      <ShieldCheck className="w-5 h-5 text-neutral-300" />
                    ) : (
                      <User className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {currentUser?.displayName || 'Sound Tech'}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{currentUser?.email || 'Logged In Account'}</p>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded border bg-neutral-900 text-neutral-300 border-white/[0.08]">
                  {userRole === 'admin' ? 'Administrator' : 'Team Member'}
                </span>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="p-6 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                <KeyRound className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold text-white text-xs uppercase tracking-wide">
                  Change Your Password
                </span>
              </div>

              <p className="text-neutral-400 text-xs leading-relaxed">
                Update your account password. Once updated, your new password will take effect immediately across all sessions.
              </p>

              {passwordChangeMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                    passwordChangeMessage.type === 'success'
                      ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-900/50 text-rose-200'
                  }`}
                >
                  {passwordChangeMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{passwordChangeMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    New Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordChangeNew}
                      onChange={(e) => setPasswordChangeNew(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordChangeConfirm}
                      onChange={(e) => setPasswordChangeConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="px-4 py-2 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {passwordChangeLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 3. PRESETS & RIG CONFIGURATION TAB                                   */}
        {/* ==================================================================== */}
        {activeTab === 'presets' && (
          <div className="space-y-6 max-w-5xl mx-auto font-sans text-xs">
            {/* Reset / Load Notice */}
            {resetNotice && (
              <div className="bg-emerald-950/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs font-mono text-emerald-200 flex items-center space-x-2 animate-in fade-in shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{resetNotice}</span>
              </div>
            )}

            {/* Presets Selection Section */}
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-white/[0.08] text-neutral-300">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wide">
                      Rig Starting Presets
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Select your starting simulation template for the SQ-5 digital console and AR2412 stage box.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-neutral-900 text-neutral-400 border border-white/[0.08]">
                  Current: <strong className="text-white">{sim.entryMode === 'church-preset' ? 'Church Rig Default' : 'Scratch Mode'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Church Rig Default */}
                <div
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 bg-black ${
                    sim.entryMode === 'church-preset'
                      ? 'border-white/40 ring-1 ring-white/20'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-neutral-300">
                          <Church className="w-4 h-4" />
                        </div>
                        <h4 className="font-semibold text-sm text-white font-mono">Church Rig Default</h4>
                      </div>
                      {sim.entryMode === 'church-preset' && (
                        <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-white text-black">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Complete church Sunday service configuration: 24 stage inputs, active DI boxes, 7 IEM monitor mixes, click/comms routing, front fills, subwoofers, and broadcast streaming feed.
                    </p>
                  </div>

                  <button
                    onClick={() => handleLoadPreset('church')}
                    disabled={sim.entryMode === 'church-preset'}
                    className={`w-full py-2 px-3 rounded-md text-xs font-mono font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                      sim.entryMode === 'church-preset'
                        ? 'bg-neutral-900 text-neutral-500 border border-white/[0.08] cursor-not-allowed'
                        : 'bg-white hover:bg-neutral-200 text-black cursor-pointer'
                    }`}
                  >
                    <span>{sim.entryMode === 'church-preset' ? 'Currently Loaded' : 'Load Church Rig'}</span>
                  </button>
                </div>

                {/* Start from Scratch */}
                <div
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 bg-black ${
                    sim.entryMode === 'scratch'
                      ? 'border-white/40 ring-1 ring-white/20'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/[0.08] flex items-center justify-center text-neutral-300">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="font-semibold text-sm text-white font-mono">Start from Scratch</h4>
                      </div>
                      {sim.entryMode === 'scratch' && (
                        <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-white text-black">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Clean blank stage with only the AR2412 stage box and SQ-5 console. Drag microphones, instruments, and patch cables from the stage palette to configure from scratch.
                    </p>
                  </div>

                  <button
                    onClick={() => handleLoadPreset('scratch')}
                    disabled={sim.entryMode === 'scratch'}
                    className={`w-full py-2 px-3 rounded-md text-xs font-mono font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                      sim.entryMode === 'scratch'
                        ? 'bg-neutral-900 text-neutral-500 border border-white/[0.08] cursor-not-allowed'
                        : 'bg-white hover:bg-neutral-200 text-black cursor-pointer'
                    }`}
                  >
                    <span>{sim.entryMode === 'scratch' ? 'Currently Loaded' : 'Load Scratch Template'}</span>
                  </button>
                </div>
              </div>

              {/* Admin Save Preset Action */}
              {userRole === 'admin' && (
                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-200 block font-mono">
                      Master Church Preset Management
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Save current stage equipment, cables, and console patch as the master default for all users.
                    </span>
                  </div>
                  <button
                    onClick={handleSavePreset}
                    className="px-3.5 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-white/[0.08] text-xs font-mono font-medium text-neutral-200 hover:text-white transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Save as Default Preset</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Configuration Card */}
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] p-6 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-neutral-900 border border-white/[0.08] text-neutral-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wide">
                    Reset Configuration
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Revert all physical patch cables, custom items, digital routing, and channel names back to the preset defaults.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-black rounded-lg border border-white/[0.08] text-xs text-neutral-400 space-y-1">
                <p>
                  This action clears all unsaved routing, stage placements, and console adjustments made during this session, restoring the selected template to its initial clean state.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-900/40 text-neutral-300 hover:text-rose-300 text-xs font-mono font-medium transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Configuration to Defaults</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={userToDelete !== null}
        title="Delete Team User"
        message={`Are you sure you want to permanently delete the account for ${userToDelete?.displayName} (${userToDelete?.email})? All member presets and scene links associated with this user will be removed.`}
        confirmLabel="Delete User"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
      />

      {/* Reset Preset Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={showResetConfirm}
        title="Reset Configuration"
        message="Are you sure you want to reset the current rig and mixer settings back to the preset defaults? All unsaved routing and patch changes will be lost."
        confirmLabel="Reset Defaults"
        isDestructive={true}
        onConfirm={handleResetPreset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
