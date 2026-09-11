import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  Settings,
  Sliders,
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
  ArrowRightLeft
} from 'lucide-react';
import { ConfirmDialogModal } from '../../../components/modals/ConfirmDialogModal';
import { UserProfile } from '../../../services/supabase';

export const SetupScreen: React.FC = () => {
  const {
    sim,
    userRole,
    currentUser,
    cycleGeqFlip,
    toggleInputChannelStereo,
    toggleMixStereo,
    toggleMixMode,
    toggleMatrixStereo,
    setGlobalAuxPreFade,
    adminMode,
    toggleAdminMode,
    saveStageAsDefaultPreset,
    teamProfiles,
    teamProfilesLoading,
    fetchTeamProfiles,
    adminCreateUser,
    adminUpdateUserRole,
    adminDeleteUser,
    changePassword
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'admin' | 'mixer-config' | 'surface' | 'account'>(
    userRole === 'admin' ? 'admin' : 'account'
  );

  const [saveNotice, setSaveNotice] = useState<string | null>(null);

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
    if (userRole === 'member' && (activeTab === 'admin' || activeTab === 'mixer-config')) {
      setActiveTab('account');
    }
  }, [userRole, activeTab]);

  const geqFlipActive = sim.digital.session.geqFlipActive;
  const geqPage = sim.digital.session.geqFlipPage;

  const handleSavePreset = () => {
    saveStageAsDefaultPreset();
    setSaveNotice('Current stage layout, cables, custom items, and digital patch successfully saved as Default Preset!');
    setTimeout(() => setSaveNotice(null), 4000);
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

  const channelPairs = Array.from({ length: 24 }, (_, idx) => {
    const oddNum = idx * 2 + 1;
    const oddCh = sim.digital.channels.find((c) => c.channelNumber === oddNum);
    const evenCh = sim.digital.channels.find((c) => c.channelNumber === oddNum + 1);
    return {
      pairIndex: idx + 1,
      oddCh,
      evenCh,
      isStereo: !!oddCh?.stereo
    };
  });

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
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ADMIN DASHBOARD &amp; USERS
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('mixer-config')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                activeTab === 'mixer-config'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              MIXER CONFIG (BUSES)
            </button>
          )}

          <button
            onClick={() => setActiveTab('surface')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
              activeTab === 'surface'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            SURFACE &amp; GEQ
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
              activeTab === 'account'
                ? 'bg-sky-600 text-white shadow'
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
        {/* 3. MIXER CONFIG TAB (BUS ARCHITECTURE - ADMIN ONLY)                  */}
        {/* ==================================================================== */}
        {activeTab === 'mixer-config' && userRole === 'admin' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Input Channels 1–48 Stereo / Mono Pairing Configuration */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-sm font-bold text-teal-400 uppercase font-mono block">
                    Input Channels 1–48 Configuration (Stereo / Mono Pairing)
                  </span>
                  <span className="text-xs text-slate-400">
                    Pair adjacent odd/even channels into stereo inputs (e.g. ProPresenter PC on CH 25-26). Stereo pairs share fader, mute, processing, and display combined meters.
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  24 Channel Pairs (48 Inputs)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 font-mono text-xs max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {channelPairs.map(({ pairIndex, oddCh, evenCh, isStereo }) => {
                  if (!oddCh || !evenCh) return null;
                  return (
                    <div
                      key={pairIndex}
                      className={`p-2.5 rounded-lg border transition-colors flex flex-col justify-between space-y-2 ${
                        isStereo
                          ? 'bg-slate-950 border-teal-600/80 shadow-[0_0_8px_rgba(20,184,166,0.15)]'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isStereo ? 'text-teal-300' : 'text-slate-300'}`}>
                            CH {String(oddCh.channelNumber).padStart(2, '0')}-{String(evenCh.channelNumber).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isStereo
                                ? 'bg-teal-950 text-teal-300 border border-teal-700 shadow-[0_0_4px_#14b8a6]'
                                : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}
                          >
                            {isStereo ? 'STEREO' : 'MONO'}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 truncate mt-1">
                          L: <span className="text-slate-200">{oddCh.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          R: <span className="text-slate-200">{evenCh.name}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-900">
                        <button
                          onClick={() => {
                            if (isStereo) toggleInputChannelStereo(oddCh.channelNumber);
                          }}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            !isStereo
                              ? 'bg-slate-800 text-slate-200 border-slate-700 shadow'
                              : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          MONO
                        </button>
                        <button
                          onClick={() => {
                            if (!isStereo) toggleInputChannelStereo(oddCh.channelNumber);
                          }}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            isStereo
                              ? 'bg-teal-950 text-teal-300 border-teal-700 shadow-[0_0_6px_#14b8a6]'
                              : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          STEREO
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mix Buses 1–12 Configuration */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-sm font-bold text-sky-400 uppercase font-mono block">
                    Mix Buses 1–12 Configuration (Stereo / Aux / Group)
                  </span>
                  <span className="text-xs text-slate-400">
                    Switch mix buses between Aux (musician monitor / livestream mix) and Group (subgroup summing), or pair into stereo IEM feeds.
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  12 Mix Buses
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono text-xs">
                {sim.digital.mixes.map((mix) => (
                  <div
                    key={mix.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">MIX {mix.mixNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-sky-400 border border-slate-800 uppercase">
                          {mix.mode}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 truncate block mt-0.5">
                        {mix.name}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-900">
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => toggleMixMode(mix.id)}
                          className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                            mix.mode === 'aux'
                              ? 'bg-sky-950 text-sky-300 border-sky-800'
                              : 'bg-purple-950 text-purple-300 border-purple-800'
                          }`}
                        >
                          {mix.mode.toUpperCase()}
                        </button>
                        <button
                          onClick={() => toggleMixStereo(mix.id)}
                          className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                            mix.stereo
                              ? 'bg-teal-950 text-teal-300 border-teal-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {mix.stereo ? 'STEREO' : 'MONO'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Aux Pre/Post Fade Utility */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-sm font-bold text-amber-400 uppercase font-mono block">
                  Global Aux Pre/Post Fade Utility
                </span>
                <span className="text-xs text-slate-400">
                  Set all 12 Mix sends across all 48 channels to Pre-Fade (standard for IEM stage monitors) or Post-Fade.
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setGlobalAuxPreFade(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs font-bold rounded-lg border border-slate-700 transition-colors shadow"
                >
                  SET ALL AUX TO PRE-FADE
                </button>
                <button
                  onClick={() => setGlobalAuxPreFade(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-lg border border-slate-700 transition-colors shadow"
                >
                  SET ALL SENDS TO POST-FADE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. SURFACE & GEQ FLIP TAB                                            */}
        {/* ==================================================================== */}
        {activeTab === 'surface' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* GEQ Fader Flip */}
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-400 uppercase font-mono">
                  28-Band GEQ Fader Flip
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    geqFlipActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  {geqFlipActive ? `PAGE ${geqPage} (BANDS ${geqPage === 1 ? '1–14' : '15–28'})` : 'OFF'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Flips physical fader strips into a 28-band 1/3-octave graphic equalizer (31 Hz – 16 kHz) for the currently selected mix bus.
              </p>

              <button
                onClick={cycleGeqFlip}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>
                  CYCLE GEQ FLIP (PRESS: {geqPage === 0 ? '1 (Bands 1–14)' : geqPage === 1 ? '2 (Bands 15–28)' : '3 (Exit)'})
                </span>
              </button>
            </div>

            {/* Architecture Overview */}
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
              <span className="text-sm font-bold text-sky-400 uppercase font-mono block">
                SQ-5 Hardware Core Specifications
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Processing Core:</span>
                  <span className="text-white font-bold">XCVI 96kHz FPGA</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">SLink Protocol:</span>
                  <span className="text-emerald-400 font-bold">dSnake 48kHz (AR2412)</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Main Stereo Bus:</span>
                  <span className="text-white font-bold">Main LR</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">DCA &amp; Mute Groups:</span>
                  <span className="text-white font-bold">8 DCAs + 8 Mute Groups</span>
                </div>
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
    </div>
  );
};
