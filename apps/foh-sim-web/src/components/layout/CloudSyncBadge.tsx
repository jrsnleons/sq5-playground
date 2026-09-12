import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { User, ShieldCheck } from 'lucide-react';

export const CloudSyncBadge: React.FC = () => {
  const { userRole, currentUser, setAuthModalOpen } = useSimulationStore();

  const getInitials = (): string => {
    if (!currentUser) return '';
    const name = (currentUser.displayName || '').trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (currentUser.email || 'U').charAt(0).toUpperCase();
  };

  const getTitle = () => {
    if (userRole === 'admin') {
      return `${currentUser?.displayName || currentUser?.email || 'Administrator'} (Admin)`;
    }
    if (userRole === 'member') {
      return `${currentUser?.displayName || currentUser?.email || 'Team Member'} (Member)`;
    }
    return 'Sign In / Account Settings';
  };

  return (
    <button
      onClick={() => setAuthModalOpen(true)}
      title={getTitle()}
      aria-label={getTitle()}
      className="relative flex items-center justify-center p-0.5 rounded-full transition-transform active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shrink-0 cursor-pointer"
    >
      {currentUser ? (
        <div
          className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
            userRole === 'admin'
              ? 'bg-zinc-900 border border-amber-500/60 text-amber-300 hover:border-amber-400'
              : 'bg-zinc-900 border border-white/20 text-zinc-100 hover:border-white/40'
          }`}
        >
          <span>{getInitials()}</span>
          {userRole === 'admin' && (
            <span
              title="Administrator"
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border border-black flex items-center justify-center"
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

