import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { Cloud, CloudOff, RefreshCw, HardDrive, ShieldCheck, User } from 'lucide-react';

export const CloudSyncBadge: React.FC = () => {
  const { userRole, currentUser, syncStatus, setAuthModalOpen } = useSimulationStore();

  const getRoleIcon = () => {
    if (userRole === 'admin') {
      return <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (userRole === 'member') {
      return <User className="w-3.5 h-3.5 text-sky-400" />;
    }
    return <HardDrive className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />;
      case 'synced':
        return <Cloud className="w-3 h-3 text-emerald-400" />;
      case 'offline':
        return <CloudOff className="w-3 h-3 text-rose-400" />;
      default:
        return <HardDrive className="w-3 h-3 text-slate-400" />;
    }
  };

  const getLabel = () => {
    if (userRole === 'admin') {
      return 'Admin';
    }
    if (userRole === 'member' && currentUser) {
      return currentUser.displayName || 'Member';
    }
    return 'Guest';
  };

  return (
    <button
      onClick={() => setAuthModalOpen(true)}
      title="Cloud Sync & Account Settings"
      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
    >
      <div className="flex items-center space-x-1">
        {getRoleIcon()}
        <span className="font-medium font-mono text-[11px]">{getLabel()}</span>
      </div>
      <div className="h-3 w-px bg-slate-800 mx-0.5" />
      <div className="flex items-center space-x-1">
        {getSyncIcon()}
        <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
          {syncStatus === 'synced'
            ? 'Cloud'
            : syncStatus === 'syncing'
            ? 'Syncing'
            : syncStatus === 'offline'
            ? 'Offline'
            : 'Local'}
        </span>
      </div>
    </button>
  );
};
