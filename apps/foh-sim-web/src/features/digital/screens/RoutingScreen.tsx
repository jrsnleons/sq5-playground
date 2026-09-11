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

  const [activeTab, setActiveTab] = useState<'channel' | 'dca' | 'matrix'>('dca');
  const [selectedDcaId, setSelectedDcaId] = useState<number>(1);
  const [editingDcaId, setEditingDcaId] = useState<number | null>(null);
  const [editingDcaName, setEditingDcaName] = useState<string>('');

  const startEditingDca = (dcaId: number, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDcaId(dcaId);
    setEditingDcaName(currentName);
  };

  const saveDcaName = (dcaId: number) => {
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

  const selectedDca = sim.digital.dcas.find((d) => d.id === selectedDcaId) || sim.digital.dcas[0];

  // Members of currently selected DCA
  const dcaMembers = sim.digital.channels.filter(
    (ch) => (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0
  );

  const handleToggleDcaChannel = (chId: string) => {
    const ch = sim.digital.channels.find((c) => c.id === chId);
    if (!ch) return;
    const isMember = (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0;
    setDcaMembership(chId, selectedDcaId, !isMember);
  };

  const handleAssignAllDca = () => {
    setDcaAllMembers(
      selectedDcaId,
      sim.digital.channels.map((c) => c.id)
    );
  };

  const handleClearAllDca = () => {
    setDcaAllMembers(selectedDcaId, []);
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Header with Sub-tabs */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Share2 className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono uppercase text-slate-400 font-bold mr-2">
            ROUTING:
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dca')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                activeTab === 'dca'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              DCA ASSIGN MATRIX (1–8)
            </button>
            <button
              onClick={() => setActiveTab('channel')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                activeTab === 'channel'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              CHANNEL ROUTING (CH {channel.channelNumber})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              MATRIX SENDS (1–3)
            </button>
          </div>
        </div>

        {activeTab === 'channel' && (
          <div className="text-xs font-mono text-slate-400">
            SELECTED: <span className="text-sky-400 font-bold">{channel.name}</span>
          </div>
        )}
      </div>

      {/* Warning if Click/Comms assigned to Main LR */}
      {activeTab === 'channel' && isClickOrComms && channel.mainLRAssigned && (
        <div className="bg-amber-950/90 border-b border-amber-800 px-4 py-2 text-xs text-amber-200 flex items-center space-x-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Warning:</strong> {channel.name} is routed to Main LR. Click tracks and comms talkback mics should only route to musician IEM mixes, never to FOH PA speakers!
          </span>
        </div>
      )}

      {/* Main Tab Contents */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dca' ? (
          /* DCA Assignment Screen */
          <div className="space-y-6">
            {/* DCA Master Selector Bar */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-sky-400 font-bold">
                  Select DCA Group (1–8):
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-400">
                    Active Members in {selectedDca.name}:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono text-xs font-bold">
                    {dcaMembers.length} Channels
                  </span>
                </div>
              </div>

              {/* 8 DCA Buttons with Inline Renaming */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {sim.digital.dcas.map((dca) => {
                  const isSelected = selectedDcaId === dca.id;
                  const isEditingThisDca = editingDcaId === dca.id;
                  const memberCount = sim.digital.channels.filter(
                    (ch) => (ch.dcaGroupMask & (1 << (dca.id - 1))) !== 0
                  ).length;

                  return (
                    <div
                      key={dca.id}
                      onClick={() => setSelectedDcaId(dca.id)}
                      className={`p-2 rounded-lg border font-mono text-center transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-400 shadow-[0_0_10px_#0284c7]'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                        <span>DCA {dca.id}</span>
                        {!isEditingThisDca && (
                          <button
                            onClick={(e) => startEditingDca(dca.id, dca.name, e)}
                            title="Rename DCA (or double-click name)"
                            className="text-slate-500 hover:text-white p-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {isEditingThisDca ? (
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
                            className="w-full px-1 py-0.5 bg-slate-900 text-white rounded border border-sky-300 text-xs font-mono font-bold focus:outline-none text-center"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveDcaName(dca.id);
                            }}
                            className="text-emerald-300 hover:text-white p-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={(e) => startEditingDca(dca.id, dca.name, e)}
                          title="Double click to rename"
                          className="text-xs font-bold truncate my-0.5 hover:underline cursor-text"
                        >
                          {dca.name}
                        </div>
                      )}

                      <div className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                        {memberCount} assigned
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Actions for Selected DCA */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
                <span className="text-slate-400">
                  Assign or unassign channels below to <strong>{selectedDca.name}</strong>:
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAssignAllDca}
                    className="flex items-center space-x-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold border border-slate-700"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Assign All 48 Channels</span>
                  </button>
                  <button
                    onClick={handleClearAllDca}
                    className="flex items-center space-x-1 px-3 py-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs border border-slate-700"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Clear DCA {selectedDcaId}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 48-Channel Interactive Assignment Grid */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono uppercase text-slate-300 font-bold">
                  Channel Assignment Checklist for {selectedDca.name} (Click channel to toggle)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  48 Input Channels Available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {sim.digital.channels.map((ch) => {
                  const isMember = (ch.dcaGroupMask & (1 << (selectedDcaId - 1))) !== 0;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleToggleDcaChannel(ch.id)}
                      className={`p-2 rounded-lg border text-left font-mono transition-all flex items-center justify-between ${
                        isMember
                          ? 'bg-sky-600/30 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="overflow-hidden pr-1">
                        <div className="text-[10px] text-slate-500">CH {ch.channelNumber}</div>
                        <div className="text-xs font-bold truncate text-slate-200" title={ch.name}>
                          {ch.name}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isMember ? (
                          <CheckCircle2 className="w-4 h-4 text-sky-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-900" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comprehensive 48-Channel x 8-DCA Overview Matrix */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-300 font-bold">
                  Complete 48-Channel × 8-DCA Matrix Overview
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Touch any cell to toggle assignment
                </span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Channel</th>
                      {sim.digital.dcas.map((dca) => (
                        <th key={dca.id} className="py-2.5 px-2 text-center">
                          DCA {dca.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sim.digital.channels.map((ch) => (
                      <tr key={ch.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-3 text-slate-300 font-semibold truncate">
                          CH {ch.channelNumber}: {ch.name}
                        </td>
                        {sim.digital.dcas.map((dca) => {
                          const isMember = (ch.dcaGroupMask & (1 << (dca.id - 1))) !== 0;
                          return (
                            <td
                              key={dca.id}
                              onClick={() => setDcaMembership(ch.id, dca.id, !isMember)}
                              className="py-2 px-2 text-center cursor-pointer hover:bg-sky-950/40 transition-colors"
                            >
                              {isMember ? (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-sky-600 text-white font-bold text-[10px]">
                                  ON
                                </span>
                              ) : (
                                <span className="text-slate-700">·</span>
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
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block font-bold">
                  Main LR Master Bus Assignment
                </span>
                <span className="text-[11px] text-slate-500">
                  Assigns this channel directly to the FOH PA stereo mix
                </span>
              </div>

              <button
                onClick={() => toggleChannelMainLR(channel.id)}
                className={`px-4 py-2 rounded text-xs font-mono font-bold transition-all ${
                  channel.mainLRAssigned
                    ? 'bg-sky-600 text-white shadow-[0_0_8px_#0284c7]'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {channel.mainLRAssigned ? 'ASSIGNED TO LR' : 'NOT ASSIGNED'}
              </button>
            </div>

            {/* Subgroups & Main LR Assignment Section */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono uppercase text-indigo-400 font-bold">
                  Subgroups to Main LR Routing
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Route drum, vocal, and band subgroups directly to Main FOH PA
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sim.digital.mixes.filter((m) => m.mode === 'group').map((grp) => (
                  <div key={grp.id} className="p-3 rounded-lg border border-indigo-900/60 bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-300 font-mono">{grp.name}</div>
                      <div className="text-[10px] text-slate-500">Group Bus ({grp.stereo ? 'Stereo' : 'Mono'})</div>
                    </div>
                    <button
                      onClick={() => toggleMixMainLR(grp.id)}
                      className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-all border ${
                        grp.mainLRAssigned
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_8px_#6366f1]'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {grp.mainLRAssigned ? 'TO MAIN LR: ON' : 'TO MAIN LR: OFF'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mix 1–12 Aux/IEM Sends */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono uppercase text-sky-400 font-bold">
                  Mix Sends (1–12) — Auxes, IEMs &amp; Groups
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
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
                          ? isGroup
                            ? 'bg-slate-950 border-indigo-500/80 shadow-inner'
                            : 'bg-slate-950 border-sky-600/80 shadow-inner'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="checkbox"
                            checked={send.assigned}
                            onChange={(e) =>
                              setChannelSend(channel.id, mix.id, send.levelDb, e.target.checked)
                            }
                            className={`rounded cursor-pointer ${isGroup ? 'accent-indigo-500' : 'accent-sky-500'}`}
                          />
                          <span className={`text-xs font-bold ${isGroup ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {isGroup ? `[GRP] ${mix.name.replace(/^GRP\s*/, '')}` : mix.name}
                          </span>
                        </div>

                        {/* Tap Point Selector */}
                        <div className="flex items-center space-x-1">
                          <select
                            value={currentTap}
                            onChange={(e) => setSendTapPoint(channel.id, mix.id, e.target.value as any)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:border-sky-500"
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
                          disabled={!send.assigned}
                          value={send.levelDb}
                          onChange={(e) =>
                            setChannelSend(channel.id, mix.id, parseFloat(e.target.value))
                          }
                          className={`flex-1 cursor-pointer ${isGroup ? 'accent-indigo-500' : 'accent-sky-500'}`}
                        />
                        <span className="text-[10px] font-mono w-10 text-right text-slate-300">
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
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
              <span className="text-xs font-mono uppercase text-sky-400 font-bold block border-b border-slate-800 pb-2">
                Matrix Feeds (Matrices 1–3)
              </span>
              <p className="text-xs text-slate-400">
                In the SQ-5 architecture, Matrices 1–3 are typically fed from Main LR, Aux Mixes, or Subgroups to drive PA delay zones, front fills, and overflow rooms.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sim.digital.matrices.map((mtx) => (
                  <div key={mtx.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{mtx.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleMatrixStereo(mtx.id)}
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border transition-colors ${
                          mtx.stereo
                            ? 'bg-teal-950 text-teal-300 border-teal-700'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {mtx.stereo ? 'STEREO' : 'MONO'}
                      </button>
                    </div>

                    {/* Source Selector */}
                    <div>
                      <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                        Input Feed Source
                      </label>
                      <select
                        value={mtx.source}
                        onChange={(e) => setMatrixSource(mtx.id, e.target.value as 'main-lr' | 'mix')}
                        className="w-full bg-slate-900 border border-slate-700 text-sky-400 text-xs font-mono rounded p-1.5 focus:outline-none focus:border-sky-500"
                      >
                        <option value="main-lr">Main LR Master Bus</option>
                        <option value="mix">Assigned Mix Bus Sum</option>
                      </select>
                    </div>

                    {/* Fader & Mute */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-slate-400">Master Level</span>
                        <span className="text-slate-200 font-bold">
                          {mtx.faderLevel <= -85 ? '-∞' : `${mtx.faderLevel > 0 ? '+' : ''}${mtx.faderLevel} dB`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="-90"
                          max="10"
                          step="1"
                          value={mtx.faderLevel}
                          onChange={(e) => setMatrixFader(mtx.id, parseFloat(e.target.value))}
                          className="flex-1 accent-sky-500 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => toggleMatrixMute(mtx.id)}
                          className={`px-2 py-1 text-[10px] font-bold font-mono rounded transition-colors ${
                            mtx.mute
                              ? 'bg-rose-600 text-white shadow-[0_0_6px_#f43f5e]'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
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
