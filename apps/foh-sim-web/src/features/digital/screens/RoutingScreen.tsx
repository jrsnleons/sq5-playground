import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  AlertTriangle,
  Share2,
  Layers,
  Sliders,
  CheckCircle2,
  XCircle,
  PlusCircle,
  MinusCircle,
  Edit2,
  Check
} from 'lucide-react';

export const RoutingScreen: React.FC = () => {
  const {
    sim,
    userRole,
    setToastNotice,
    toggleChannelMainLR,
    setChannelSend,
    toggleSendPreFade,
    setSendTapPoint,
    toggleMixMainLR,
    setDcaMembership,
    setDcaAllMembers,
    updateDcaName,
    toggleMatrixStereo,
    setMatrixFader,
    setMatrixSource,
    toggleMatrixMute
  } = useSimulationStore();

  const isGuest = userRole === 'guest';

  const [activeTab, setActiveTab] = useState<'channel' | 'dca' | 'matrix'>('dca');
  const [selectedDcaId, setSelectedDcaId] = useState<number>(1);
  const [editingDcaId, setEditingDcaId] = useState<number | null>(null);
  const [editingDcaName, setEditingDcaName] = useState<string>('');

  const startEditingDca = (dcaId: number, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) {
      setToastNotice({ message: 'DCA renaming is locked in Guest mode. Sign in to edit.', type: 'info' });
      return;
    }
    setEditingDcaId(dcaId);
    setEditingDcaName(currentName);
  };

  const saveDcaName = (dcaId: number) => {
    if (isGuest) {
      setEditingDcaId(null);
      return;
    }
    if (editingDcaName.trim()) {
      updateDcaName(dcaId, editingDcaName.trim());
    }
    setEditingDcaId(null);
  };

  const selectedChId = sim.digital.session.selectedChannelId;
  const channel = sim.digital.channels.find((c) => c.id === selectedChId) || sim.digital.channels[0];

  const isClickOrComms =
    channel.name.toLowerCase().includes('click') ||
    channel.name.toLowerCase().includes('comms');

  const [dcaMatrixFilter, setDcaMatrixFilter] = useState<'all' | 'mixes' | 'channels'>('all');

  const selectedDca = sim.digital.dcas.find((d) => d.id === selectedDcaId) || sim.digital.dcas[0];

  // Members of currently selected DCA
  const dcaChannelMembers = sim.digital.channels.filter(
    (ch) => (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0
  );
  const dcaMixMembers = sim.digital.mixes.filter(
    (m) => ((m.dcaGroupMask ?? 0) & (1 << (selectedDcaId - 1))) !== 0
  );
  const totalDcaMembersCount = dcaChannelMembers.length + dcaMixMembers.length;

  const handleToggleDcaMember = (memberId: string) => {
    if (isGuest) {
      setToastNotice({ message: 'DCA assignment is locked in Guest mode. Sign in to edit.', type: 'info' });
      return;
    }
    const ch = sim.digital.channels.find((c) => c.id === memberId);
    if (ch) {
      const isMember = (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0;
      setDcaMembership(memberId, selectedDcaId, !isMember);
      return;
    }
    const mix = sim.digital.mixes.find((m) => m.id === memberId);
    if (mix) {
      const isMember = ((mix.dcaGroupMask ?? 0) & (1 << (selectedDcaId - 1))) !== 0;
      setDcaMembership(memberId, selectedDcaId, !isMember);
      return;
    }
  };

  const handleAssignAllChannels = () => {
    if (isGuest) {
      setToastNotice({ message: 'DCA assignment is locked in Guest mode. Sign in to edit.', type: 'info' });
      return;
    }
    const currentMixMembers = sim.digital.mixes
      .filter((m) => ((m.dcaGroupMask ?? 0) & (1 << (selectedDcaId - 1))) !== 0)
      .map((m) => m.id);
    setDcaAllMembers(
      selectedDcaId,
      [...sim.digital.channels.map((c) => c.id), ...currentMixMembers]
    );
  };

  const handleAssignMixGroups = () => {
    if (isGuest) {
      setToastNotice({ message: 'DCA assignment is locked in Guest mode. Sign in to edit.', type: 'info' });
      return;
    }
    const currentChMembers = sim.digital.channels
      .filter((ch) => (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0)
      .map((c) => c.id);
    const currentMixMembers = sim.digital.mixes
      .filter((m) => ((m.dcaGroupMask ?? 0) & (1 << (selectedDcaId - 1))) !== 0)
      .map((m) => m.id);
    const groupMixIds = sim.digital.mixes.filter((m) => m.mode === 'group').map((m) => m.id);
    const combined = Array.from(new Set([...currentChMembers, ...currentMixMembers, ...groupMixIds]));
    setDcaAllMembers(selectedDcaId, combined);
  };

  const handleAssignAllMixes = () => {
    if (isGuest) {
      setToastNotice({ message: 'DCA assignment is locked in Guest mode. Sign in to edit.', type: 'info' });
      return;
    }
    const currentChMembers = sim.digital.channels
      .filter((ch) => (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0)
      .map((c) => c.id);
    const allMixIds = sim.digital.mixes.map((m) => m.id);
    const combined = Array.from(new Set([...currentChMembers, ...allMixIds]));
    setDcaAllMembers(selectedDcaId, combined);
  };

  const handleClearAllDca = () => {
    if (isGuest) {
      setToastNotice({ message: 'DCA assignment is locked in Guest mode. Sign in to edit.', type: 'info' });
      return;
    }
    setDcaAllMembers(selectedDcaId, []);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden select-none font-sans text-neutral-100">
      {/* Header with Sub-tabs */}
      <div className="h-11 bg-black border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Share2 className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 font-semibold mr-1">
            ROUTING
          </span>

          <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-white/[0.08] text-xs">
            <button
              onClick={() => setActiveTab('dca')}
              className={`px-3 py-1 text-[11px] font-mono font-medium rounded-md transition-all ${
                activeTab === 'dca'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              DCA ASSIGN (1-8)
            </button>
            <button
              onClick={() => setActiveTab('channel')}
              className={`px-3 py-1 text-[11px] font-mono font-medium rounded-md transition-all ${
                activeTab === 'channel'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              CHANNEL (CH {channel.channelNumber})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 text-[11px] font-mono font-medium rounded-md transition-all ${
                activeTab === 'matrix'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              MATRIX (1-3)
            </button>
          </div>
        </div>

        {activeTab === 'channel' && (
          <div className="text-[11px] font-mono text-neutral-400">
            SELECTED: <span className="text-white font-semibold">{channel.name}</span>
          </div>
        )}
      </div>

      {/* Warning if Click/Comms assigned to Main LR */}
      {activeTab === 'channel' && isClickOrComms && channel.mainLRAssigned && (
        <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-2 text-xs text-amber-200 flex items-center space-x-2 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Warning:</strong> {channel.name} is routed to Main LR. Click tracks and comms talkback mics should only route to musician IEM mixes, never to FOH PA speakers.
          </span>
        </div>
      )}

      {/* Main Tab Contents */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dca' ? (
          /* DCA Assignment Screen */
          <div className="space-y-6">
            {/* DCA Master Selector Bar */}
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-neutral-300 font-semibold tracking-wide">
                  Select DCA Group (1-8):
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-neutral-500">
                    Active Members in {selectedDca.name}:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-200 border border-white/[0.08] font-mono text-xs font-semibold">
                    {totalDcaMembersCount} Total ({dcaChannelMembers.length} Ch &bull; {dcaMixMembers.length} Mix)
                  </span>
                </div>
              </div>

              {/* 8 DCA Buttons with Inline Renaming */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {sim.digital.dcas.map((dca) => {
                  const isSelected = selectedDcaId === dca.id;
                  const isEditingThisDca = editingDcaId === dca.id;
                  const chCount = sim.digital.channels.filter(
                    (ch) => (ch.dcaGroupMask & (1 << (dca.id - 1))) !== 0
                  ).length;
                  const mixCount = sim.digital.mixes.filter(
                    (m) => ((m.dcaGroupMask ?? 0) & (1 << (dca.id - 1))) !== 0
                  ).length;
                  const memberCount = chCount + mixCount;

                  return (
                    <div
                      key={dca.id}
                      onClick={() => setSelectedDcaId(dca.id)}
                      className={`p-2 rounded-lg border font-mono text-center transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-neutral-800 text-white border-white/30 shadow-sm'
                          : 'bg-black border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-semibold">
                        <span>DCA {dca.id}</span>
                        {!isEditingThisDca && !isGuest && (
                          <button
                            onClick={(e) => startEditingDca(dca.id, dca.name, e)}
                            title="Rename DCA (or double-click name)"
                            className="text-neutral-500 hover:text-white p-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {isEditingThisDca && !isGuest ? (
                        <div className="flex items-center space-x-1 my-1">
                          <input
                            type="text"
                            value={editingDcaName}
                            onChange={(e) => setEditingDcaName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveDcaName(dca.id);
                              if (e.key === 'Escape') setEditingDcaId(null);
                            }}
                            onBlur={() => saveDcaName(dca.id)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-1 py-0.5 bg-neutral-900 text-white rounded border border-white/30 text-xs font-mono font-semibold focus:outline-none text-center"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveDcaName(dca.id);
                            }}
                            className="text-emerald-400 hover:text-white p-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={(e) => !isGuest && startEditingDca(dca.id, dca.name, e)}
                          title={isGuest ? dca.name : 'Double click to rename'}
                          className={`text-xs font-semibold truncate my-0.5 ${
                            isGuest ? 'cursor-default' : 'hover:underline cursor-text'
                          }`}
                        >
                          {dca.name}
                        </div>
                      )}

                      <div className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {memberCount} assigned
                        {mixCount > 0 && (
                          <span className="text-[9px] text-amber-400 block font-medium">
                            ({mixCount} mix{mixCount > 1 ? 'es' : ''})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Actions for Selected DCA */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08] text-xs font-mono">
                <span className="text-neutral-400">
                  Assign or unassign below to <strong>{selectedDca.name}</strong>:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAssignMixGroups}
                    disabled={isGuest}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isGuest
                        ? 'opacity-50 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                        : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/30'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Groups (10-12)</span>
                  </button>
                  <button
                    onClick={handleAssignAllMixes}
                    disabled={isGuest}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isGuest
                        ? 'opacity-50 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>+ All 12 Mixes</span>
                  </button>
                  <button
                    onClick={handleAssignAllChannels}
                    disabled={isGuest}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isGuest
                        ? 'opacity-50 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>+ All 48 Channels</span>
                  </button>
                  <button
                    onClick={handleClearAllDca}
                    disabled={isGuest}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors ${
                      isGuest
                        ? 'opacity-50 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                        : 'bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-300 border-white/[0.08] hover:border-rose-900/40'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Clear DCA {selectedDcaId}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mix Groups & Aux Buses Interactive Assignment Grid */}
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase text-neutral-200 font-semibold">
                    Mix Groups & Aux Buses for {selectedDca.name} (Click to toggle)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {dcaMixMembers.length} / {sim.digital.mixes.length} Mixes Assigned
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {sim.digital.mixes.map((mix) => {
                  const isMember = ((mix.dcaGroupMask ?? 0) & (1 << (selectedDcaId - 1))) !== 0;
                  const isGroup = mix.mode === 'group';

                  return (
                    <button
                      key={mix.id}
                      onClick={() => handleToggleDcaMember(mix.id)}
                      disabled={isGuest}
                      className={`p-2 rounded-lg border text-left font-mono transition-all flex items-center justify-between ${
                        isGuest ? 'cursor-default opacity-80' : 'cursor-pointer hover:border-white/30'
                      } ${
                        isMember
                          ? isGroup
                            ? 'bg-amber-400/15 border-amber-400/40 text-amber-200'
                            : 'bg-white/15 border-white/30 text-white'
                          : 'bg-black border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:border-white/20'
                      }`}
                    >
                      <div className="overflow-hidden pr-1">
                        <div className="flex items-center space-x-1">
                          <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                            isGroup ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {isGroup ? 'GROUP' : 'AUX'}
                          </span>
                          <span className="text-[10px] text-neutral-400">MIX {mix.mixNumber}</span>
                        </div>
                        <div className="text-xs font-semibold truncate text-white mt-0.5" title={mix.name}>
                          {mix.name}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isMember ? (
                          <CheckCircle2 className={`w-4 h-4 ${isGroup ? 'text-amber-400' : 'text-white'}`} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/20 bg-neutral-900" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 48-Channel Interactive Assignment Grid */}
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-xs font-mono uppercase text-neutral-300 font-semibold">
                  Input Channels for {selectedDca.name} (Click channel to toggle)
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {dcaChannelMembers.length} / {sim.digital.channels.length} Channels Assigned
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {sim.digital.channels.map((ch) => {
                  const isMember = (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleToggleDcaMember(ch.id)}
                      disabled={isGuest}
                      className={`p-2 rounded-lg border text-left font-mono transition-all flex items-center justify-between ${
                        isGuest ? 'cursor-default opacity-80' : ''
                      } ${
                        isMember
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-black border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:border-white/20'
                      }`}
                    >
                      <div className="overflow-hidden pr-1">
                        <div className="text-[10px] text-neutral-500">CH {ch.channelNumber}</div>
                        <div className="text-xs font-semibold truncate text-neutral-200" title={ch.name}>
                          {ch.name}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isMember ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/20 bg-neutral-900" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comprehensive DCA Assignment Matrix */}
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] overflow-hidden">
              <div className="p-3 bg-black border-b border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-neutral-300 font-semibold">
                  Comprehensive DCA Assignment Matrix
                </span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-neutral-900 rounded p-0.5 border border-white/[0.08] text-[10px] font-mono">
                    <button
                      onClick={() => setDcaMatrixFilter('all')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        dcaMatrixFilter === 'all'
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      All (60)
                    </button>
                    <button
                      onClick={() => setDcaMatrixFilter('mixes')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        dcaMatrixFilter === 'mixes'
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Mix Groups (12)
                    </button>
                    <button
                      onClick={() => setDcaMatrixFilter('channels')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        dcaMatrixFilter === 'channels'
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Channels (48)
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
                    {isGuest ? 'Locked in Guest Mode' : 'Click cell to toggle'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead className="bg-black sticky top-0 z-10 border-b border-white/[0.08] text-[10px] text-neutral-400 uppercase">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Target / Channel</th>
                      {sim.digital.dcas.map((dca) => (
                        <th key={dca.id} className="py-2 px-2 text-center font-semibold">
                          DCA {dca.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {/* Mix Groups & Aux Rows */}
                    {(dcaMatrixFilter === 'all' || dcaMatrixFilter === 'mixes') &&
                      sim.digital.mixes.map((mix) => {
                        const isGroup = mix.mode === 'group';
                        return (
                          <tr key={mix.id} className="hover:bg-white/[0.02] transition-colors bg-white/[0.01]">
                            <td className="py-1.5 px-3 text-neutral-200 font-medium truncate">
                              <span className={`inline-block text-[8px] px-1 py-0.2 rounded mr-1.5 font-bold uppercase ${
                                isGroup ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300'
                              }`}>
                                {isGroup ? 'GRP' : 'AUX'}
                              </span>
                              MIX {mix.mixNumber}: {mix.name}
                            </td>
                            {sim.digital.dcas.map((dca) => {
                              const isMember = ((mix.dcaGroupMask ?? 0) & (1 << (dca.id - 1))) !== 0;
                              return (
                                <td
                                  key={dca.id}
                                  onClick={() => {
                                    if (isGuest) {
                                      setToastNotice({ message: 'DCA assignment is locked in Guest mode. Sign in to edit.', type: 'info' });
                                      return;
                                    }
                                    handleToggleDcaMember(mix.id);
                                  }}
                                  className={`py-1.5 px-2 text-center transition-colors ${
                                    isGuest ? 'cursor-default' : 'cursor-pointer hover:bg-white/10'
                                  }`}
                                >
                                  {isMember ? (
                                    <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                      isGroup ? 'bg-amber-400 text-black' : 'bg-white text-black'
                                    }`}>
                                      ON
                                    </span>
                                  ) : (
                                    <span className="text-neutral-600">&middot;</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                    {/* Input Channel Rows */}
                    {(dcaMatrixFilter === 'all' || dcaMatrixFilter === 'channels') &&
                      sim.digital.channels.map((ch) => (
                        <tr key={ch.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-1.5 px-3 text-neutral-300 font-medium truncate">
                            CH {ch.channelNumber}: {ch.name}
                          </td>
                          {sim.digital.dcas.map((dca) => {
                            const isMember = (ch.dcaGroupMask & (1 << (dca.id - 1))) !== 0;
                            return (
                              <td
                                key={dca.id}
                                onClick={() => {
                                  if (isGuest) {
                                    setToastNotice({ message: 'DCA assignment is locked in Guest mode. Sign in to edit.', type: 'info' });
                                    return;
                                  }
                                  handleToggleDcaMember(ch.id);
                                }}
                                className={`py-1.5 px-2 text-center transition-colors ${
                                  isGuest ? 'cursor-default' : 'cursor-pointer hover:bg-white/10'
                                }`}
                              >
                                {isMember ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-white text-black font-bold text-[10px]">
                                    ON
                                  </span>
                                ) : (
                                  <span className="text-neutral-600">&middot;</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'channel' ? (
          /* Channel Routing View */
          <div className="space-y-6">
            {/* Main LR Assignment */}
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-300 block font-semibold">
                  Main LR Master Bus Assignment
                </span>
                <span className="text-[11px] text-neutral-500">
                  Assigns this channel directly to the FOH PA stereo mix
                </span>
              </div>

              <button
                onClick={() => {
                  if (isGuest) {
                    setToastNotice({ message: 'Main LR routing is locked in Guest mode. Sign in to edit.', type: 'info' });
                    return;
                  }
                  toggleChannelMainLR(channel.id);
                }}
                disabled={isGuest}
                className={`px-4 py-2 rounded-md text-xs font-mono font-semibold transition-all border ${
                  isGuest ? 'cursor-not-allowed opacity-70' : ''
                } ${
                  channel.mainLRAssigned
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 text-neutral-400 border-white/[0.08] hover:text-white hover:border-white/20'
                }`}
              >
                {channel.mainLRAssigned ? 'ASSIGNED TO LR' : 'NOT ASSIGNED'}
              </button>
            </div>

            {/* Subgroups & Main LR Assignment Section */}
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-xs font-mono uppercase text-neutral-300 font-semibold">
                  Subgroups to Main LR Routing
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Route drum, vocal, and band subgroups directly to Main FOH PA
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sim.digital.mixes.filter((m) => m.mode === 'group').map((grp) => (
                  <div key={grp.id} className="p-3 rounded-lg border border-white/[0.08] bg-black flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200 font-mono">{grp.name}</div>
                      <div className="text-[10px] text-neutral-500">Group Bus ({grp.stereo ? 'Stereo' : 'Mono'})</div>
                    </div>
                    <button
                      onClick={() => {
                        if (isGuest) {
                          setToastNotice({ message: 'Subgroup routing is locked in Guest mode. Sign in to edit.', type: 'info' });
                          return;
                        }
                        toggleMixMainLR(grp.id);
                      }}
                      disabled={isGuest}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-medium transition-all border ${
                        isGuest ? 'cursor-not-allowed opacity-70' : ''
                      } ${
                        grp.mainLRAssigned
                          ? 'bg-white text-black border-white'
                          : 'bg-neutral-900 text-neutral-400 border-white/[0.08] hover:text-white hover:border-white/20'
                      }`}
                    >
                      {grp.mainLRAssigned ? 'TO MAIN LR: ON' : 'TO MAIN LR: OFF'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mix 1-12 Aux/IEM Sends */}
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-xs font-mono uppercase text-neutral-300 font-semibold">
                  Mix Sends (1-12): Auxes, IEMs &amp; Groups
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Tap points: Post-Preamp, Post-PEQ, Post-Comp, Post-Fade (AMM)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sim.digital.mixes.map((mix) => {
                  const isGroup = mix.mode === 'group';
                  const send = channel.sends[mix.id] || {
                    mixId: mix.id,
                    levelDb: -90,
                    preFade: false,
                    assigned: false,
                    tapPoint: 'post-fade'
                  };
                  const currentTap = send.tapPoint || (send.preFade ? 'post-peq' : 'post-fade');

                  return (
                    <div
                      key={mix.id}
                      className={`p-3 rounded-lg border transition-all ${
                        send.assigned
                          ? 'bg-black border-white/20'
                          : 'bg-black/50 border-white/[0.06] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={send.assigned}
                            disabled={isGuest}
                            onChange={(e) => {
                              if (isGuest) return;
                              setChannelSend(channel.id, mix.id, send.levelDb, e.target.checked);
                            }}
                            className={`rounded bg-neutral-900 border-white/20 ${isGuest ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} accent-white`}
                          />
                          <span className={`text-xs font-semibold ${isGroup ? 'text-neutral-300' : 'text-neutral-200'}`}>
                            {isGroup ? `[GRP] ${mix.name.replace(/^GRP\s*/, '')}` : mix.name}
                          </span>
                        </div>

                        {/* Tap Point Selector */}
                        <div className="flex items-center space-x-1">
                          <select
                            value={currentTap}
                            disabled={isGuest}
                            onChange={(e) => !isGuest && setSendTapPoint(channel.id, mix.id, e.target.value as any)}
                            className={`bg-neutral-900 border border-white/[0.08] text-neutral-300 text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:border-white/30 ${isGuest ? 'cursor-not-allowed opacity-75' : ''}`}
                          >
                            <option value="post-preamp">PRE (Preamp)</option>
                            <option value="post-peq">PRE (PEQ)</option>
                            <option value="post-compressor">PRE (Comp)</option>
                            <option value="post-fade">POST (Fade)</option>
                          </select>
                        </div>
                      </div>

                      {/* Level Slider */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="-90"
                          max="10"
                          step="1"
                          disabled={!send.assigned || isGuest}
                          value={send.levelDb}
                          onChange={(e) =>
                            !isGuest && setChannelSend(channel.id, mix.id, parseFloat(e.target.value))
                          }
                          className={`flex-1 accent-white ${isGuest || !send.assigned ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        />
                        <span className="text-[10px] font-mono w-10 text-right text-neutral-300">
                          {send.levelDb <= -85 ? '-∞' : `${send.levelDb > 0 ? '+' : ''}${send.levelDb}dB`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Matrix Sends View */
          <div className="space-y-6">
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4">
              <span className="text-xs font-mono uppercase text-neutral-300 font-semibold block border-b border-white/[0.08] pb-2">
                Matrix Feeds (Matrices 1-3)
              </span>
              <p className="text-xs text-neutral-400">
                In the SQ-5 architecture, Matrices 1-3 are typically fed from Main LR, Aux Mixes, or Subgroups to drive PA delay zones, front fills, and overflow rooms.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sim.digital.matrices.map((mtx) => (
                  <div key={mtx.id} className="p-4 bg-black rounded-lg border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white font-mono">{mtx.name}</span>
                      <button
                        type="button"
                        disabled={isGuest}
                        onClick={() => {
                          if (isGuest) {
                            setToastNotice({ message: 'Matrix routing is locked in Guest mode. Sign in to edit.', type: 'info' });
                            return;
                          }
                          toggleMatrixStereo(mtx.id);
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-medium border transition-colors ${
                          isGuest ? 'cursor-not-allowed opacity-75' : ''
                        } ${
                          mtx.stereo
                            ? 'bg-neutral-800 text-white border-white/20'
                            : 'bg-neutral-900 text-neutral-400 border-white/[0.08] hover:text-white'
                        }`}
                      >
                        {mtx.stereo ? 'STEREO' : 'MONO'}
                      </button>
                    </div>

                    {/* Source Selector */}
                    <div>
                      <label className="text-[10px] uppercase font-mono text-neutral-400 block mb-1">
                        Input Feed Source
                      </label>
                      <select
                        value={mtx.source}
                        disabled={isGuest}
                        onChange={(e) => !isGuest && setMatrixSource(mtx.id, e.target.value as 'main-lr' | 'mix')}
                        className={`w-full bg-neutral-900 border border-white/[0.08] text-neutral-200 text-xs font-mono rounded p-1.5 focus:outline-none focus:border-white/30 ${isGuest ? 'cursor-not-allowed opacity-75' : ''}`}
                      >
                        <option value="main-lr">Main LR Master Bus</option>
                        <option value="mix">Assigned Mix Bus Sum</option>
                      </select>
                    </div>

                    {/* Fader & Mute */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-neutral-400">Master Level</span>
                        <span className="text-neutral-200 font-semibold">
                          {mtx.faderLevel <= -85 ? '-∞' : `${mtx.faderLevel > 0 ? '+' : ''}${mtx.faderLevel} dB`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="-90"
                          max="10"
                          step="1"
                          disabled={isGuest}
                          value={mtx.faderLevel}
                          onChange={(e) => !isGuest && setMatrixFader(mtx.id, parseFloat(e.target.value))}
                          className={`flex-1 accent-white ${isGuest ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        />
                        <button
                          type="button"
                          disabled={isGuest}
                          onClick={() => {
                            if (isGuest) {
                              setToastNotice({ message: 'Matrix routing is locked in Guest mode. Sign in to edit.', type: 'info' });
                              return;
                            }
                            toggleMatrixMute(mtx.id);
                          }}
                          className={`px-2 py-1 text-[10px] font-semibold font-mono rounded border transition-colors ${
                            isGuest ? 'cursor-not-allowed opacity-75' : ''
                          } ${
                            mtx.mute
                              ? 'bg-red-600 text-white border-red-500'
                              : 'bg-neutral-900 text-neutral-400 border-white/[0.08] hover:text-white'
                          }`}
                        >
                          {mtx.mute ? 'MUTED' : 'MUTE'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
