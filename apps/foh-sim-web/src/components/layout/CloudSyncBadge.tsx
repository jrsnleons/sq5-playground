import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { User, ShieldCheck } from 'lucide-react';

export const CloudSyncBadge: React.FC = () => {
  const {
    userRole,
    currentUser,
    setAuthModalOpen,
    setActiveTab,
    setSettingsSubTab
  } = useSimulationStore();

  const getInitials = (): string => {
    if (!currentUser) return '';
    const name = (currentUser.displayName || '').trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (currentUser.email || 'U').charAt(0).toUpperCase();
  };

  const getTitle = () => {
    if (currentUser) {
      const roleLabel = userRole === 'admin' ? 'Administrator' : 'Team Member';
      return `${currentUser.displayName || currentUser.email} (${roleLabel}) - Open Account Settings`;
    }
    return 'Sign In';
  };

  const handleClick = () => {
    if (currentUser) {
      setSettingsSubTab('account');
      setActiveTab('setup');
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={getTitle()}
      aria-label={getTitle()}
      className="relative flex items-center justify-center p-0.5 rounded-full transition-transform active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shrink-0 cursor-pointer"
    >
      {currentUser ? (
        <div
          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-mono font-bold overflow-hidden transition-colors ${
            userRole === 'admin'
              ? 'bg-zinc-900 border border-amber-500/60 text-amber-300 hover:border-amber-400'
              : 'bg-zinc-900 border border-white/20 text-zinc-100 hover:border-white/40'
          }`}
        >
          {currentUser.photoUrl ? (
            <img
              src={currentUser.photoUrl}
              alt={currentUser.displayName || 'Profile'}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>{getInitials()}</span>
          )}
          {userRole === 'admin' && (
            <span
              title="Administrator"
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border border-black flex items-center justify-center z-10"
            >
              <ShieldCheck className="w-2.5 h-2.5 text-black stroke-[3]" />
            </span>
          )}
        </div>
      ) : (
        <div className="w-7.5 h-7.5 rounded-full bg-zinc-900 border border-white/10 hover:border-white/30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </button>
  );
};

