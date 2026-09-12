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

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
            Settings &amp; Configuration
          </h2>
        </div>

        {/* Setup Navigation Tabs */}
        <div className="flex items-center space-x-1.5">
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all active:scale-[0.96] cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ADMIN DASHBOARD &amp; USERS
            </button>
          )}

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all active:scale-[0.96] cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            PRESETS &amp; CONFIGURATION
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all active:scale-[0.96] cursor-pointer ${
              activeTab === 'account'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ACCOUNT &amp; PASSWORD
          </button>
        </div>
      </div>

      {/* Save Notice Banner */}
      {saveNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-700 px-6 py-2 text-xs font-mono text-emerald-200 flex items-center space-x-2 shrink-0 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{saveNotice}</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
        {/* ==================================================================== */}
        {/* 1. ADMIN DASHBOARD & USER MANAGEMENT TAB                              */}
        {/* ==================================================================== */}
        {activeTab === 'admin' && userRole === 'admin' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            {/* Admin Header Card */}
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">
                    Admin Dashboard &amp; Team Management
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create volunteer team logins with emails &amp; passwords, assign administrative privileges, and manage presets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchTeamProfiles()}
                disabled={teamProfilesLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${teamProfilesLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Accounts</span>
              </button>
            </div>

            {/* Form: Add New Account with Email & Password */}
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <UserPlus className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white text-xs uppercase">
                  Add Team Account (Email &amp; Password)
                </span>
              </div>

              {createMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                    createMessage.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-800 text-rose-200'
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
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Full Name / Church Team Role
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="e.g. David Miller (Sound Tech)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Account Permission Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewRole('member')}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                          newRole === 'member'
                            ? 'bg-sky-950 border-sky-600 text-sky-200 shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span>Team Member</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewRole('admin')}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                          newRole === 'admin'
                            ? 'bg-amber-950 border-amber-600 text-amber-200 shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Administrator</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="volunteer@church.org"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Initial Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-950 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
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
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-xs uppercase">
                    Registered Team Accounts ({teamProfiles.length})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Backed by Supabase PostgreSQL `profiles`
                </span>
              </div>

              {teamProfiles.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No accounts registered yet. Use the form above to add your sound volunteers.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                        <th className="py-2 px-3">Team Member</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Role</th>
                        <th className="py-2 px-3">Registered</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {teamProfiles.map((user) => {
                        const isSelf = user.id === currentUser?.id;
                        return (
                          <tr key={user.id} className="hover:bg-slate-950/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2.5">
                                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                                  {user.role === 'admin' ? (
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                  ) : (
                                    <User className="w-3.5 h-3.5 text-sky-400" />
                                  )}
                                </div>
                                <span className="font-bold text-white text-xs">
                                  {user.displayName}
                                  {isSelf && (
                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                                      YOU
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-300">{user.email}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold border ${
                                  user.role === 'admin'
                                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                                    : 'bg-sky-950 text-sky-300 border-sky-800'
                                }`}
                              >
                                {user.role === 'admin' ? 'Administrator' : 'Team Member'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[10px]">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  type="button"
                                  disabled={isSelf || actionLoading}
                                  onClick={() => handleToggleRole(user)}
                                  title={isSelf ? 'Cannot modify your own role' : `Switch to ${user.role === 'admin' ? 'Member' : 'Admin'}`}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors flex items-center space-x-1 ${
                                    isSelf
                                      ? 'opacity-30 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-500'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
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
                                  className={`p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-950 transition-colors ${
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
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-sky-400 uppercase block">
                Save Current Canvas as Default Rig Preset
              </span>
              <p className="text-slate-400 text-[11px]">
                Captures stage placement, cable routing, custom hardware definitions, and digital I/O patch. Clicking "Reset to Church Rig" will now restore this customized configuration.
              </p>

              <button
                onClick={handleSavePreset}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-all border border-slate-700"
              >
                <Save className="w-4 h-4 text-sky-400" />
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
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    {userRole === 'admin' ? (
                      <ShieldCheck className="w-6 h-6 text-amber-400" />
                    ) : (
                      <User className="w-6 h-6 text-sky-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {currentUser?.displayName || 'Sound Tech'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email || 'Logged In Account'}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    userRole === 'admin'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-sky-950 text-sky-300 border-sky-800'
                  }`}
                >
                  {userRole === 'admin' ? 'Administrator' : 'Team Member'}
                </span>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white text-xs uppercase">
                  Change Your Password
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">
                Update your account password. Once updated, your new password will take effect immediately across all sessions.
              </p>

              {passwordChangeMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                    passwordChangeMessage.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-800 text-rose-200'
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
                  <label className="block text-[11px] text-slate-400 mb-1">
                    New Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordChangeNew}
                      onChange={(e) => setPasswordChangeNew(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordChangeConfirm}
                      onChange={(e) => setPasswordChangeConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordChangeLoading}
                    className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-950 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
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
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Reset / Load Notice */}
            {resetNotice && (
              <div className="bg-emerald-950/90 border border-emerald-700 rounded-xl px-4 py-3 text-xs font-mono text-emerald-200 flex items-center space-x-2 animate-in fade-in shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{resetNotice}</span>
              </div>
            )}

            {/* Presets Selection Section */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-800/80 text-sky-400">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                      Rig Starting Presets
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select your starting simulation template for the SQ-5 digital console and AR2412 stage box.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  Current: <strong className="text-white">{sim.entryMode === 'church-preset' ? 'Church Rig Default' : 'Scratch Mode'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Church Rig Default */}
                <div
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                    sim.entryMode === 'church-preset'
                      ? 'bg-slate-950 border-sky-500/80 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                      : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                          <Church className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-white font-mono">Church Rig Default</h4>
                      </div>
                      {sim.entryMode === 'church-preset' && (
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Complete church Sunday service configuration: 24 stage inputs, active DI boxes, 7 IEM monitor mixes, click/comms routing, front fills, subwoofers, and broadcast streaming feed.
                    </p>
                  </div>

                  <button
                    onClick={() => handleLoadPreset('church')}
                    disabled={sim.entryMode === 'church-preset'}
                    className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-bold transition-all active:scale-[0.96] shadow cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>{sim.entryMode === 'church-preset' ? 'Currently Loaded' : 'Load Church Rig'}</span>
                  </button>
                </div>

                {/* Start from Scratch */}
                <div
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                    sim.entryMode === 'scratch'
                      ? 'bg-slate-950 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-white font-mono">Start from Scratch</h4>
                      </div>
                      {sim.entryMode === 'scratch' && (
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Clean blank stage with only the AR2412 stage box and SQ-5 console. Drag microphones, instruments, and patch cables from the stage palette to configure from scratch.
                    </p>
                  </div>

                  <button
                    onClick={() => handleLoadPreset('scratch')}
                    disabled={sim.entryMode === 'scratch'}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-mono font-bold transition-all active:scale-[0.96] shadow cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>{sim.entryMode === 'scratch' ? 'Currently Loaded' : 'Load Scratch Template'}</span>
                  </button>
                </div>
              </div>

              {/* Admin Save Preset Action */}
              {userRole === 'admin' && (
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block font-mono">
                      Master Church Preset Management
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Save current stage equipment, cables, and console patch as the master default for all users.
                    </span>
                  </div>
                  <button
                    onClick={handleSavePreset}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 hover:text-white transition-all active:scale-[0.96] flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5 text-sky-400" />
                    <span>Save as Default Preset</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Configuration Card */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                    Reset Configuration
                  </h3>
                  <p className="text-xs text-slate-400">
                    Revert all physical patch cables, custom items, digital routing, and channel names back to the preset defaults.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p>
                  This action clears all unsaved routing, stage placements, and console adjustments made during this session, restoring the selected template to its initial clean state.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-800 hover:border-rose-700 text-rose-200 text-xs font-mono font-bold transition-all active:scale-[0.96] flex items-center space-x-2 shadow-lg cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
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
