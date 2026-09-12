import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  Settings,
  Save,
  CheckCircle2,
  ShieldCheck,
  User,
  Trash2,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  RotateCcw,
  Church,
  Sparkles,
  FolderOpen,
  Upload,
  Plus,
  LogOut,
  X,
  Search
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
    changePassword,
    settingsSubTab,
    setSettingsSubTab,
    updateUserProfile,
    signOut
  } = useSimulationStore();

  const activeTab = settingsSubTab;
  const setActiveTab = setSettingsSubTab;

  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Admin Search & Account Modal State
  const [accountSearch, setAccountSearch] = useState('');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Account Profile Photo & Name State
  const [nameInput, setNameInput] = useState(currentUser?.displayName || '');
  const [nameUpdating, setNameUpdating] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (currentUser?.displayName) {
      setNameInput(currentUser.displayName);
    }
  }, [currentUser?.displayName]);

  // Adjust active tab if role changes
  useEffect(() => {
    if (userRole !== 'admin' && activeTab === 'admin') {
      setActiveTab('account');
    }
  }, [userRole, activeTab, setActiveTab]);

  const getInitials = (name?: string, email?: string): string => {
    const trimmed = (name || '').trim();
    if (trimmed) {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (email || 'U').charAt(0).toUpperCase();
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ text: 'Please select an image file (JPG, PNG).', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ text: 'Image file size must be less than 5MB.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          setPhotoUpdating(true);
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            await updateUserProfile({ photoUrl: dataUrl });
            setProfileMessage({ text: 'Profile photo updated.', type: 'success' });
            setTimeout(() => setProfileMessage(null), 3000);
          }
        } catch (err: any) {
          setProfileMessage({ text: err.message || 'Failed to update photo.', type: 'error' });
        } finally {
          setPhotoUpdating(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setPhotoUpdating(true);
    try {
      await updateUserProfile({ photoUrl: null });
      setProfileMessage({ text: 'Profile photo removed.', type: 'success' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage({ text: err.message || 'Failed to remove photo.', type: 'error' });
    } finally {
      setPhotoUpdating(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setProfileMessage({ text: 'Name cannot be empty.', type: 'error' });
      return;
    }
    setNameUpdating(true);
    try {
      await updateUserProfile({ displayName: trimmed });
      setProfileMessage({ text: 'Name updated successfully.', type: 'success' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage({ text: err.message || 'Failed to update name.', type: 'error' });
    } finally {
      setNameUpdating(false);
    }
  };

  const handleSavePreset = () => {
    saveStageAsDefaultPreset();
    setSaveNotice('Current stage layout, cables, custom items, and digital patch saved as Default Preset.');
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

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMessage(null);
    if (!newEmail || !newPassword || !newDisplayName) {
      setCreateMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setCreateMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setCreateLoading(true);
    try {
      await adminCreateUser({
        email: newEmail.trim(),
        password: newPassword,
        displayName: newDisplayName.trim(),
        role: newRole
      });
      setCreateMessage({ text: `Account created for ${newDisplayName.trim()}.`, type: 'success' });
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('member');
      setTimeout(() => {
        setShowAddAccountModal(false);
        setCreateMessage(null);
      }, 1500);
    } catch (err: any) {
      setCreateMessage({ text: err.message || 'Failed to create user account.', type: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage(null);
    if (passwordChangeNew.length < 6) {
      setPasswordChangeMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (passwordChangeNew !== passwordChangeConfirm) {
      setPasswordChangeMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    setPasswordChangeLoading(true);
    try {
      await changePassword(passwordChangeNew);
      setPasswordChangeMessage({ text: 'Password updated successfully.', type: 'success' });
      setPasswordChangeNew('');
      setPasswordChangeConfirm('');
    } catch (err: any) {
      setPasswordChangeMessage({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPasswordChangeLoading(false);
    }
  };
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
              ADMIN
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
            ACCOUNT SETTINGS
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
        {/* 1. ADMIN MANAGEMENT TAB                                             */}
        {/* ==================================================================== */}
        {activeTab === 'admin' && userRole === 'admin' && (
          <div className="space-y-4 max-w-5xl mx-auto font-mono text-xs">
            {/* Header: Admin Management only (no subtext) */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                Admin Management
              </h3>
            </div>

            {/* Accounts Table Card */}
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white text-xs uppercase tracking-wide">
                    Accounts
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08]">
                    {teamProfiles.length}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Filter accounts..."
                      className="bg-black border border-white/[0.08] focus:border-white/30 rounded-md pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-neutral-600 focus:outline-none w-44 font-sans"
                    />
                  </div>

                  {/* Refresh Button: Icon-only */}
                  <button
                    onClick={() => fetchTeamProfiles()}
                    disabled={teamProfilesLoading}
                    title="Refresh accounts"
                    aria-label="Refresh accounts"
                    className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${teamProfilesLoading ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Add Account Modal Trigger */}
                  <button
                    onClick={() => {
                      setCreateMessage(null);
                      setShowAddAccountModal(true);
                    }}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Account</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              {(() => {
                const filtered = teamProfiles.filter((user) => {
                  if (!accountSearch.trim()) return true;
                  const q = accountSearch.toLowerCase();
                  return (
                    user.displayName?.toLowerCase().includes(q) ||
                    user.email?.toLowerCase().includes(q) ||
                    user.role?.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-neutral-500 text-xs">
                      {accountSearch ? 'No accounts match your filter.' : 'No accounts registered yet.'}
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[10px] text-neutral-400 uppercase bg-black/40">
                          <th className="py-2.5 px-4 font-semibold">User</th>
                          <th className="py-2.5 px-4 font-semibold">Email</th>
                          <th className="py-2.5 px-4 font-semibold">Role</th>
                          <th className="py-2.5 px-4 font-semibold">Registered</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {filtered.map((user) => {
                          const isSelf = user.id === currentUser?.id;
                          return (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-7 h-7 rounded-full bg-neutral-900 border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0 text-[10px] font-bold text-white">
                                    {user.photoUrl ? (
                                      <img
                                        src={user.photoUrl}
                                        alt={user.displayName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{getInitials(user.displayName, user.email)}</span>
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
                              <td className="py-3 px-4 text-neutral-300 font-mono text-[11px]">{user.email}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-[9px] uppercase px-2 py-0.5 rounded font-semibold border ${
                                    user.role === 'admin'
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                      : 'bg-neutral-900 text-neutral-300 border-white/[0.08]'
                                  }`}
                                >
                                  {user.role === 'admin' ? 'Administrator' : 'Team Member'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-neutral-400 text-[10px]">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    type="button"
                                    disabled={isSelf || actionLoading}
                                    onClick={() => handleToggleRole(user)}
                                    title={isSelf ? 'Cannot modify your own role' : `Switch to ${user.role === 'admin' ? 'Member' : 'Admin'}`}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors flex items-center space-x-1 ${
                                      isSelf
                                        ? 'opacity-30 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-white/[0.08] cursor-pointer'
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
                                    className={`p-1.5 rounded-md text-neutral-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors ${
                                      isSelf ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
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
                );
              })()}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. ACCOUNT SETTINGS TAB                                              */}
        {/* ==================================================================== */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-2xl mx-auto font-mono text-xs">
            {/* Status Feedback Message */}
            {profileMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-900/50 text-rose-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            {/* Profile Information & Photo Card */}
            <div className="p-6 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Profile Information
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-sans">
                    Update your avatar and display name.
                  </span>
                </div>
                <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded border bg-neutral-900 text-neutral-300 border-white/[0.08]">
                  {userRole === 'admin' ? 'Administrator' : 'Team Member'}
                </span>
              </div>

              {/* Avatar Section */}
              <div className="flex items-center space-x-4 pt-1">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full bg-neutral-900 border-2 border-white/20 flex items-center justify-center overflow-hidden text-base font-bold text-white shadow-inner">
                    {currentUser?.photoUrl ? (
                      <img
                        src={currentUser.photoUrl}
                        alt={currentUser.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(currentUser?.displayName, currentUser?.email)}</span>
                    )}
                  </div>
                  {photoUpdating && (
                    <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoSelected}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={photoUpdating}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{currentUser?.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {currentUser?.photoUrl && (
                      <button
                        type="button"
                        disabled={photoUpdating}
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-rose-300 border border-white/[0.08] text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500 font-sans">
                    JPG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>

              {/* Name & Email Form */}
              <form onSubmit={handleSaveName} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-black border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full bg-neutral-900/60 border border-white/[0.05] rounded-md px-3 py-2 text-xs text-neutral-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={nameUpdating || nameInput.trim() === currentUser?.displayName}
                    className="px-4 py-2 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {nameUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Name</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="p-6 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3">
                <KeyRound className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold text-white text-xs uppercase tracking-wide">
                  Change Password
                </span>
              </div>

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
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordChangeNew}
                      onChange={(e) => setPasswordChangeNew(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-black border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordChangeConfirm}
                      onChange={(e) => setPasswordChangeConfirm(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-black border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600 font-sans"
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
                        <span>Updating...</span>
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

            {/* Session / Logout Card */}
            <div className="p-6 bg-[#0A0A0A] rounded-xl border border-white/[0.08] flex items-center justify-between shadow-sm">
              <div>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Sign Out
                </h4>
                <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                  End your current session on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-900/40 text-neutral-300 hover:text-rose-300 text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
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

              {/* Admin Save Current Canvas as Default Rig */}
              {userRole === 'admin' && (
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-white block font-mono">
                      Save Current Canvas as Default Rig
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Overwrite the church starting template with the current stage layout, patch cables, and console routing.
                    </span>
                  </div>
                  <button
                    onClick={handleSavePreset}
                    className="px-3.5 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-black text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Current Rig</span>
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

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A0A0A] border border-white/[0.12] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wide">
                Add Account
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddAccountModal(false);
                  setCreateMessage(null);
                }}
                className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createMessage && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
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

            <form onSubmit={handleAdminCreateUser} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-black border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@church.org"
                  className="w-full bg-black border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-black border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none placeholder:text-neutral-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('member')}
                    className={`py-2 px-3 rounded-md border text-center transition-all cursor-pointer ${
                      newRole === 'member'
                        ? 'bg-neutral-800 border-white/30 text-white font-semibold'
                        : 'bg-black border-white/[0.08] text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`py-2 px-3 rounded-md border text-center transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'bg-neutral-800 border-white/30 text-white font-semibold'
                        : 'bg-black border-white/[0.08] text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setCreateMessage(null);
                  }}
                  className="px-4 py-2 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-md bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
