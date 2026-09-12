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
      className="relative flex items-center justify-center p-0.5 rounded-full transition-all active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none shrink-0 cursor-pointer"
    >
      {currentUser ? (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all shadow-md ${
            userRole === 'admin'
              ? 'bg-gradient-to-br from-amber-900/60 to-slate-900 border border-amber-600/70 text-amber-300 ring-2 ring-amber-500/20 hover:ring-amber-500/50'
              : 'bg-gradient-to-br from-sky-900/60 to-slate-900 border border-sky-600/70 text-sky-300 ring-2 ring-sky-500/20 hover:ring-sky-500/50'
          }`}
        >
          <span>{getInitials()}</span>
          {userRole === 'admin' && (
            <span
              title="Administrator"
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center"
            >
              <ShieldCheck className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
            </span>
          )}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-800/90 border border-slate-700 hover:border-slate-500 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-sm">
          <User className="w-4 h-4" />
        </div>
      )}
    </button>
  );
};
