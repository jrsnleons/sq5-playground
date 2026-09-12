import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  Sliders,
  Layers,
  Share2,
  Cpu,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Radio,
  Volume2
} from 'lucide-react';

export const MixerConfigScreen: React.FC = () => {
  const {
    sim,
    userRole,
    setToastNotice,
    cycleGeqFlip,
    toggleInputChannelStereo,
    toggleMixStereo,
    toggleMixMode,
    toggleMixMainLR,
    toggleMatrixStereo,
    setGlobalAuxPreFade
  } = useSimulationStore();

  const isGuest = userRole === 'guest';
  const geqFlipActive = sim.digital.session.geqFlipActive;
  const geqPage = sim.digital.session.geqFlipPage;

  const [activeSubTab, setActiveSubTab] = useState<'buses' | 'channels' | 'matrices' | 'surface'>('buses');
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
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
    <div className="w-full h-full bg-black flex flex-col overflow-hidden select-none font-sans text-neutral-100">
      {/* Header Bar */}
      <div className="h-11 bg-black border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Sliders className="w-3.5 h-3.5 text-neutral-400" />
          <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Mixer Configuration
          </h2>
          <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
            SQ-5 Bus Architecture &bull; Stereo Linking &bull; Surface Parameters
          </span>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-neutral-900 border border-white/[0.08] text-xs font-mono">
          <button
            onClick={() => setActiveSubTab('buses')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeSubTab === 'buses'
                ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            MIX BUSES (1-12)
          </button>
          <button
            onClick={() => setActiveSubTab('channels')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeSubTab === 'channels'
                ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            CHANNELS (1-48)
          </button>
          <button
            onClick={() => setActiveSubTab('matrices')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeSubTab === 'matrices'
                ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            MATRICES (1-3)
          </button>
          <button
            onClick={() => setActiveSubTab('surface')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeSubTab === 'surface'
                ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            SURFACE &bull; GEQ
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-6 py-2 text-xs font-mono text-emerald-300 flex items-center space-x-2 shrink-0 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-neutral-800">
        {/* ==================================================================== */}
        {/* 1. MIX BUSES 1-12 (AUX / SUBGROUP & STEREO FORMAT)                   */}
        {/* ==================================================================== */}
        {activeSubTab === 'buses' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Mix 1-12 Bus Configuration
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure each bus as an Auxiliary monitor send or an Audio Subgroup, and toggle Stereo / Mono pairing.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                    12 Total Mix Buses
                  </span>
                </div>
              </div>

              {/* Grid of 12 Mix Buses */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sim.digital.mixes.map((mix) => {
                  const isGroup = mix.mode === 'group';

                  return (
                    <div
                      key={mix.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        isGroup
                          ? 'bg-black border-amber-400/30 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.1)]'
                          : 'bg-black border-white/[0.08]'
                      }`}
                    >
                      {/* Mix Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isGroup
                                ? 'bg-amber-400 text-black'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {isGroup ? 'GROUP' : 'AUX'}
                          </span>
                          <span className="font-semibold text-white truncate text-xs" title={mix.name}>
                            M{mix.mixNumber}: {mix.name}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                            mix.stereo
                              ? 'bg-white/10 text-white border-white/20'
                              : 'bg-neutral-900 text-neutral-400 border-white/[0.06]'
                          }`}
                        >
                          {mix.stereo ? 'STEREO' : 'MONO'}
                        </span>
                      </div>

                      {/* Controls: Mode & Format */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
                        {/* Aux vs Group */}
                        <button
                          onClick={() => {
                            if (isGuest) {
                              setToastNotice({ message: 'Mix configuration is locked in Guest mode.', type: 'info' });
                              return;
                            }
                            toggleMixMode(mix.id);
                            showNotice(`Toggled ${mix.name} to ${!isGroup ? 'GROUP' : 'AUX'} mode.`);
                          }}
                          disabled={isGuest}
                          className={`py-1.5 px-2 rounded text-[10px] font-semibold border transition-all ${
                            isGuest ? 'cursor-default opacity-80' : 'cursor-pointer'
                          } ${
                            isGroup
                              ? 'bg-amber-400/15 text-amber-300 border-amber-400/40 hover:bg-amber-400/25'
                              : 'bg-neutral-900 text-neutral-300 border-white/[0.08] hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          {isGroup ? 'MODE: GROUP' : 'MODE: AUX'}
                        </button>

                        {/* Mono vs Stereo */}
                        <button
                          onClick={() => {
                            if (isGuest) {
                              setToastNotice({ message: 'Mix configuration is locked in Guest mode.', type: 'info' });
                              return;
                            }
                            toggleMixStereo(mix.id);
                            showNotice(`Toggled ${mix.name} to ${!mix.stereo ? 'STEREO' : 'MONO'} format.`);
                          }}
                          disabled={isGuest}
                          className={`py-1.5 px-2 rounded text-[10px] font-semibold border transition-all ${
                            isGuest ? 'cursor-default opacity-80' : 'cursor-pointer'
                          } ${
                            mix.stereo
                              ? 'bg-white/15 text-white border-white/30 hover:bg-white/20'
                              : 'bg-neutral-900 text-neutral-400 border-white/[0.08] hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          {mix.stereo ? 'FORMAT: STEREO' : 'FORMAT: MONO'}
                        </button>
                      </div>

                      {/* Group Main LR Route Toggle */}
                      {isGroup && (
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span className="text-neutral-400">Sum to Main LR:</span>
                          <button
                            onClick={() => {
                              if (isGuest) {
                                setToastNotice({ message: 'Mix configuration is locked in Guest mode.', type: 'info' });
                                return;
                              }
                              toggleMixMainLR(mix.id);
                            }}
                            disabled={isGuest}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                              mix.mainLRAssigned
                                ? 'bg-white text-black border-white'
                                : 'bg-neutral-900 text-neutral-500 border-white/[0.08] hover:text-neutral-300'
                            }`}
                          >
                            {mix.mainLRAssigned ? 'ROUTED TO MAIN LR' : 'MAIN LR: OFF'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Aux Send Tap Point Defaults */}
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Global Aux Send Tap Point Defaults
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Batch sets default tap point across all 48 input channels. Individual channels can still be customized in Routing.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    if (isGuest) {
                      setToastNotice({ message: 'Mix configuration is locked in Guest mode.', type: 'info' });
                      return;
                    }
                    setGlobalAuxPreFade(true);
                    showNotice('All 48 channel sends set to PRE-FADE default.');
                  }}
                  disabled={isGuest}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    isGuest
                      ? 'opacity-50 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  SET ALL SENDS TO PRE-FADE
                </button>

                <button
                  onClick={() => {
                    if (isGuest) {
                      setToastNotice({ message: 'Mix configuration is locked in Guest mode.', type: 'info' });
                      return;
                    }
                    setGlobalAuxPreFade(false);
                    showNotice('All 48 channel sends set to POST-FADE default.');
                  }}
                  disabled={isGuest}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    isGuest
                      ? 'opacity-50 cursor-not-allowed bg-neutral-900 border-white/[0.08] text-neutral-500'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  SET ALL SENDS TO POST-FADE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. CHANNELS 1-48 STEREO / MONO PAIRING                                */}
        {/* ==================================================================== */}
        {activeSubTab === 'channels' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Input Channels 1-48 Configuration (Stereo / Mono Pairing)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Pair adjacent odd/even channels into stereo inputs (e.g., Keys, Playback PC). Stereo pairs share fader, mute, and processing.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                  24 Channel Pairs (48 Inputs)
                </span>
              </div>

              {/* 24 Channel Pairs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {channelPairs.map(({ pairIndex, oddCh, evenCh, isStereo }) => {
                  if (!oddCh || !evenCh) return null;

                  return (
                    <div
                      key={pairIndex}
                      className={`p-3 rounded-lg border transition-all flex flex-col justify-between space-y-2.5 ${
                        isStereo
                          ? 'bg-black border-white/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                          : 'bg-black border-white/[0.08]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isStereo ? 'text-white' : 'text-neutral-300'}`}>
                            CH {String(oddCh.channelNumber).padStart(2, '0')}-{String(evenCh.channelNumber).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isStereo
                                ? 'bg-white text-black'
                                : 'bg-neutral-900 text-neutral-400 border border-white/[0.08]'
                            }`}
                          >
                            {isStereo ? 'STEREO LINKED' : 'MONO'}
                          </span>
                        </div>

                        <div className="text-[10px] text-neutral-400 truncate mt-1">
                          L: <span className="text-neutral-200">{oddCh.name}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          R: <span className="text-neutral-200">{evenCh.name}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/[0.06]">
                        <button
                          onClick={() => {
                            if (isGuest) {
                              setToastNotice({ message: 'Channel pairing is locked in Guest mode.', type: 'info' });
                              return;
                            }
                            if (isStereo) {
                              toggleInputChannelStereo(oddCh.channelNumber);
                              showNotice(`Unlinked CH ${oddCh.channelNumber}-${evenCh.channelNumber} into discrete mono channels.`);
                            }
                          }}
                          disabled={isGuest}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            !isStereo
                              ? 'bg-neutral-800 text-white border-white/20'
                              : 'bg-neutral-900/60 text-neutral-500 border-white/[0.06] hover:text-neutral-300'
                          }`}
                        >
                          MONO
                        </button>
                        <button
                          onClick={() => {
                            if (isGuest) {
                              setToastNotice({ message: 'Channel pairing is locked in Guest mode.', type: 'info' });
                              return;
                            }
                            if (!isStereo) {
                              toggleInputChannelStereo(oddCh.channelNumber);
                              showNotice(`Linked CH ${oddCh.channelNumber}-${evenCh.channelNumber} as Stereo Pair.`);
                            }
                          }}
                          disabled={isGuest}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            isStereo
                              ? 'bg-white text-black border-white'
                              : 'bg-neutral-900/60 text-neutral-500 border-white/[0.06] hover:text-neutral-300'
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
          </div>
        )}

        {/* ==================================================================== */}
        {/* 3. MATRICES 1-3 CONFIGURATION                                        */}
        {/* ==================================================================== */}
        {activeSubTab === 'matrices' && (
          <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
            <div className="bg-[#0A0A0A] rounded-xl border border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    Stereo Matrices 1-3 Configuration
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Matrix outputs can drive PA speaker arrays, overflow rooms, or record feeds with custom delay and EQ.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-white/[0.08]">
                  3 Matrix Buses
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sim.digital.matrices.map((mtx) => (
                  <div
                    key={mtx.id}
                    className="p-4 bg-black rounded-xl border border-white/[0.08] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{mtx.name}</span>
                        <span className="text-[9px] text-neutral-500 uppercase">{mtx.id}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">
                        Source: <span className="text-neutral-200 font-semibold">{mtx.source.toUpperCase()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (isGuest) {
                          setToastNotice({ message: 'Matrix configuration is locked in Guest mode.', type: 'info' });
                          return;
                        }
                        toggleMatrixStereo(mtx.id);
                        showNotice(`Toggled ${mtx.name} to ${!mtx.stereo ? 'STEREO' : 'MONO'}.`);
                      }}
                      disabled={isGuest}
                      className={`py-1.5 px-3 rounded text-[10px] font-semibold border transition-all ${
                        mtx.stereo
                          ? 'bg-white/15 text-white border-white/30 hover:bg-white/20'
                          : 'bg-neutral-900 text-neutral-400 border-white/[0.08] hover:text-white'
                      }`}
                    >
                      {mtx.stereo ? 'FORMAT: STEREO' : 'FORMAT: MONO'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. SURFACE & GEQ FLIP SPECIFICATIONS                                 */}
        {/* ==================================================================== */}
        {activeSubTab === 'surface' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto font-mono text-xs">
            {/* GEQ Fader Flip */}
            <div className="p-5 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span className="text-sm font-semibold text-white uppercase tracking-wide">
                  28-Band GEQ Fader Flip
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                    geqFlipActive
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : 'bg-neutral-900 text-neutral-500 border-white/[0.08]'
                  }`}
                >
                  {geqFlipActive ? `PAGE ${geqPage} (BANDS ${geqPage === 1 ? '1-14' : '15-28'})` : 'OFF'}
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Flips physical console fader strips into a 28-band 1/3-octave graphic equalizer (31 Hz to 16 kHz) for the currently selected mix bus.
              </p>

              <button
                onClick={cycleGeqFlip}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-all border border-white/[0.08] hover:border-white/20 flex items-center justify-center space-x-2"
              >
                <Sliders className="w-4 h-4 text-neutral-400" />
                <span>
                  CYCLE GEQ FLIP (PRESS: {geqPage === 0 ? '1 (Bands 1-14)' : geqPage === 1 ? '2 (Bands 15-28)' : '3 (Exit)'})
                </span>
              </button>
            </div>

            {/* Hardware Specifications */}
            <div className="p-5 bg-[#0A0A0A] rounded-xl border border-white/[0.08] space-y-4">
              <div className="border-b border-white/[0.08] pb-2">
                <span className="text-sm font-semibold text-white uppercase tracking-wide block">
                  SQ-5 Hardware Core Specifications
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-black rounded-lg border border-white/[0.06]">
                  <span className="text-neutral-400">Processing Core:</span>
                  <span className="text-white font-semibold">XCVI 96kHz FPGA</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-black rounded-lg border border-white/[0.06]">
                  <span className="text-neutral-400">SLink Protocol:</span>
                  <span className="text-emerald-400 font-semibold">dSnake 48kHz (AR2412)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-black rounded-lg border border-white/[0.06]">
                  <span className="text-neutral-400">Main Stereo Bus:</span>
                  <span className="text-white font-semibold">Main LR</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-black rounded-lg border border-white/[0.06]">
                  <span className="text-neutral-400">Mix &amp; Matrix Buses:</span>
                  <span className="text-white font-semibold">12 Mixes + 3 Matrices</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-black rounded-lg border border-white/[0.06]">
                  <span className="text-neutral-400">DCA &amp; Mute Groups:</span>
                  <span className="text-white font-semibold">8 DCAs + 8 Mute Groups</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
