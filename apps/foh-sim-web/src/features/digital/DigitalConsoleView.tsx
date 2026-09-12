import React, { useRef } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { FaderStrip } from './FaderStrip';
import { MasterStrip } from './MasterStrip';
import { IOPatchScreen } from './screens/IOPatchScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { MetersScreen } from './screens/MetersScreen';
import { RoutingScreen } from './screens/RoutingScreen';
import { FXScreen } from './screens/FXScreen';
import { ScenesScreen } from './screens/ScenesScreen';
import { MixerConfigScreen } from './screens/MixerConfigScreen';
import { HelpScreen } from './screens/HelpScreen';
import {
  Sliders,
  Network,
  Activity,
  BarChart2,
  Share2,
  Sparkles,
  Bookmark,
  Settings,
  HelpCircle,
  Volume2,
  RotateCcw,
  Layers,
  Lock
} from 'lucide-react';

const ISO_FREQUENCIES = [
  '31.5', '40', '50', '63', '80', '100', '125', '160', '200', '250', '315', '400', '500', '630',
  '800', '1k', '1.25k', '1.6k', '2k', '2.5k', '3.15k', '4k', '5k', '6.3k', '8k', '10k', '12.5k', '16k'
];

export const DigitalConsoleView: React.FC = () => {
  const {
    sim,
    userRole,
    setAuthModalOpen,
    setActiveScreen,
    setSelectedMix,
    setLayer,
    cycleGeqFlip,
    setGeqFlipPage,
    setMixGeqBand,
    resetMixGeqBand,
    resetAllMixGeq
  } = useSimulationStore();

  const fadersContainerRef = useRef<HTMLDivElement>(null);

  const activeScreen = sim.digital.session.activeScreen || 'faders';
  const activeMixId = sim.digital.session.selectedMixId;
  const isSendsOnFader = activeMixId !== 'main-lr';

  // SQ-MixPad Primary Navigation Tabs (processing and helpguide hidden for now as requested)
  const screenKeys = [
    {
      id: 'faders',
      label: 'Faders',
      icon: Sliders,
      description: 'Motorized channel faders, preamp gains, pans, and DCA strips'
    },
    {
      id: 'meters',
      label: 'Meters',
      icon: BarChart2,
      description: 'High-density 48-channel broadcast meter bridge and peak indicators'
    },
    {
      id: 'routing',
      label: 'Routing',
      icon: Share2,
      description: 'Mix bus sends, aux routing matrix, and DCA assignments'
    },
    {
      id: 'io',
      label: 'I/O Patch',
      icon: Network,
      description: 'Crosspoint digital patch matrix for stageboxes and console I/O'
    },
    {
      id: 'fx',
      label: 'FX Racks',
      icon: Sparkles,
      description: '4 stereo studio FX processors (Reverbs, Delays, Chorus)'
    },
    {
      id: 'scenes',
      label: 'Scenes',
      icon: Bookmark,
      description: 'Console snapshot deck and church worship presets'
    },
    {
      id: 'setup',
      label: 'Mixer Config',
      icon: Settings,
      description: 'Console utilities, routing modes, and preferences'
    }
  ] as const;

  const selectedMixObj = sim.digital.mixes.find((m) => m.id === activeMixId);
  const geqTargetMix = selectedMixObj || sim.digital.mixes[0];
  const geqPage = sim.digital.session.geqFlipPage === 2 ? 2 : 1;
  const geqBandStartIndex = geqPage === 1 ? 0 : 14;
  const geqBands = ISO_FREQUENCIES.slice(geqBandStartIndex, geqBandStartIndex + 14);

  const scrollToBank = (channelNum: number) => {
    if (!fadersContainerRef.current) return;
    const targetOffset = (channelNum - 1) * 80;
    fadersContainerRef.current.scrollTo({ left: targetOffset, behavior: 'smooth' });
  };

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden select-none">
      {/* SQ Top Navigation Bar */}
      <nav className="h-11 bg-black border-b border-white/[0.08] px-3.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          {screenKeys.map((k) => {
            const Icon = k.icon;
            const isActive =
              activeScreen === k.id ||
              (k.id === 'faders' && (activeScreen as string) === 'home');

            return (
              <button
                key={k.id}
                onClick={() => setActiveScreen(k.id as any)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/10 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{k.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Mix Indicator */}
        <div className="hidden md:flex items-center space-x-2 font-mono text-xs">
          <span className="text-zinc-500 text-[10px] uppercase">TARGET:</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${
              isSendsOnFader
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/50'
                : 'bg-zinc-900 text-zinc-200 border-white/10'
            }`}
          >
            {activeMixId === 'main-lr'
              ? 'MAIN LR'
              : `${activeMixId.toUpperCase()} (${selectedMixObj?.name || 'AUX'})`}
          </span>
        </div>
      </nav>

      {/* Guest Read-Only Mode Banner */}
      {userRole === 'guest' && (
        <div className="bg-zinc-900/90 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center space-x-2 text-amber-300">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">PREVIEW MODE:</span>
            <span className="text-zinc-300 font-sans hidden sm:inline">
              Faders, routing, patching, and renaming are locked. Sign in to mix live.
            </span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-2 py-0.5 rounded bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
          >
            Sign In to Mix
          </button>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 overflow-hidden relative">
        {/* Dedicated Screens */}
        {activeScreen === 'io' && <IOPatchScreen />}
        {activeScreen === 'processing' && <ProcessingScreen />}
        {activeScreen === 'meters' && <MetersScreen />}
        {activeScreen === 'routing' && <RoutingScreen />}
        {activeScreen === 'fx' && <FXScreen />}
        {activeScreen === 'scenes' && <ScenesScreen />}
        {activeScreen === 'setup' && <MixerConfigScreen />}
        {activeScreen === 'utility' && <HelpScreen />}

        {/* Faders / Surface Screen (Default View) */}
        {(activeScreen === 'faders' || (activeScreen as string) === 'home') && (
          <div className="w-full h-full flex flex-col bg-black overflow-hidden">
            {/* Fader Navigation Sub-Bar: Mix Selection & Bank/Layers */}
            <div className="h-10 bg-black border-b border-white/[0.08] px-3.5 flex items-center justify-between shrink-0 space-x-2 overflow-x-auto">
              {/* Sends on Fader Mix Selector Keys */}
              <div className="flex items-center space-x-1 overflow-x-auto shrink-0 py-0.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">
                  MIX:
                </span>

                {/* Main LR */}
                <button
                  onClick={() => setSelectedMix('main-lr')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors border ${
                    activeMixId === 'main-lr'
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900 text-zinc-400 border-white/[0.06] hover:text-white'
                  }`}
                >
                  MAIN LR
                </button>

                {/* Mixes 1-12 (Auxes and Subgroups) */}
                {sim.digital.mixes.map((mix) => {
                  const isGroup = mix.mode === 'group';
                  const isSelected = activeMixId === mix.id;
                  let isMixDcaMuted = false;
                  if ((mix.dcaGroupMask ?? 0) > 0) {
                    for (const dca of sim.digital.dcas) {
                      if (((mix.dcaGroupMask ?? 0) & (1 << (dca.id - 1))) && dca.mute) {
                        isMixDcaMuted = true;
                        break;
                      }
                    }
                  }

                  return (
                    <button
                      key={mix.id}
                      onClick={() => setSelectedMix(mix.id)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors whitespace-nowrap border flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                          : isMixDcaMuted
                          ? 'bg-red-950/40 text-red-300 border-red-500/40 hover:border-red-400'
                          : 'bg-zinc-900 text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/20'
                      }`}
                    >
                      {isMixDcaMuted && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                      <span>{isGroup ? `[GRP] ${mix.name.replace(/^GRP\s*/, '')}` : mix.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Surface Bank Navigation & GEQ Flip Controls */}
              <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
                {/* Bank Quick Jumps */}
                <div className="hidden xl:flex items-center space-x-1 bg-zinc-950 px-2 py-0.5 rounded border border-white/[0.06]">
                  <span className="text-zinc-500 text-[10px]">BANK:</span>
                  <button
                    onClick={() => { scrollToBank(1); setLayer('A'); }}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px]"
                  >
                    1-16
                  </button>
                  <button
                    onClick={() => { scrollToBank(17); setLayer('B'); }}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px]"
                  >
                    17-32
                  </button>
                  <button
                    onClick={() => { scrollToBank(33); setLayer('C'); }}
                    className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px]"
                  >
                    33-48
                  </button>
                </div>

                {/* Layer Keys A-F */}
                <div className="flex items-center space-x-0.5 bg-zinc-950 px-1 py-0.5 rounded border border-white/[0.06]">
                  <span className="text-zinc-500 text-[10px] mr-1 hidden sm:inline">LAYER:</span>
                  {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((layer) => (
                    <button
                      key={layer}
                      onClick={() => {
                        setLayer(layer);
                        if (layer === 'A') scrollToBank(1);
                        if (layer === 'B') scrollToBank(17);
                        if (layer === 'C') scrollToBank(33);
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-colors ${
                        sim.digital.session.layer === layer
                          ? 'bg-white text-black'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>

                {/* GEQ Flip Action Key */}
                <button
                  onClick={() => cycleGeqFlip()}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono border transition-colors ${
                    sim.digital.session.geqFlipActive
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-zinc-900 text-zinc-300 border-white/[0.08] hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  GEQ FLIP {sim.digital.session.geqFlipActive ? `(P${sim.digital.session.geqFlipPage})` : ''}
                </button>
              </div>
            </div>

            {/* Sends on Fader Notice Banner */}
            {isSendsOnFader && !sim.digital.session.geqFlipActive && (
              <div className="h-7 bg-zinc-900 border-b border-white/[0.08] px-4 flex items-center justify-between text-[11px] font-mono text-zinc-300 shrink-0">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">SENDS ON FADER:</strong> Mixing for{' '}
                    <span className="text-amber-300 font-semibold">{selectedMixObj?.name}</span>. Faders
                    control send levels; MUTE toggles assignment.
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMix('main-lr')}
                  className="text-[10px] px-2 py-0.5 rounded bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
                >
                  RETURN TO MAIN LR
                </button>
              </div>
            )}

            {/* GEQ Fader Flip Banner */}
            {sim.digital.session.geqFlipActive && (
              <div className="h-8 bg-zinc-900 border-b border-white/[0.08] px-4 flex items-center justify-between text-xs font-mono text-zinc-200 shrink-0">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-bold text-[10px]">
                    GEQ FLIP ACTIVE
                  </span>
                  <span className="font-medium text-zinc-100">
                    28-Band Equalizer for &ldquo;{geqTargetMix.name}&rdquo; (±12 dB)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Page Toggles */}
                  <div className="flex items-center space-x-1 bg-black px-1.5 py-0.5 rounded border border-white/[0.08]">
                    <button
                      onClick={() => setGeqFlipPage(1)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        geqPage === 1 ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      BANDS 1-14 (31.5Hz-630Hz)
                    </button>
                    <button
                      onClick={() => setGeqFlipPage(2)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        geqPage === 2 ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      BANDS 15-28 (800Hz-16kHz)
                    </button>
                  </div>

                  {/* Reset all bands to 0 dB */}
                  <button
                    onClick={() => resetAllMixGeq(geqTargetMix.id)}
                    title="Flatten all 28 GEQ bands to 0 dB"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-medium border border-white/[0.08]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>FLAT ALL</span>
                  </button>

                  {/* Exit GEQ Flip */}
                  <button
                    onClick={() => setGeqFlipPage(0)}
                    className="px-2 py-1 rounded bg-white text-black font-semibold text-[10px] hover:bg-zinc-200 transition-colors"
                  >
                    EXIT GEQ
                  </button>
                </div>
              </div>
            )}

            {/* Fader Surface Area: GEQ Flip vs 48-Channel Continuous Surface */}
            <div className="flex-1 flex overflow-hidden">
              {sim.digital.session.geqFlipActive ? (
                /* GEQ 14-Fader Active Surface */
                <div className="flex-1 flex justify-center items-stretch overflow-x-auto p-4 bg-black">
                  <div className="flex space-x-3 items-stretch">
                    {geqBands.map((freqLabel, i) => {
                      const bandIdx = geqBandStartIndex + i;
                      const gainDb = geqTargetMix.geq[bandIdx] ?? 0;

                      return (
                        <div
                          key={bandIdx}
                          className="w-16 bg-[#0A0A0A] border border-white/[0.06] rounded-lg p-2 flex flex-col justify-between items-center group hover:border-amber-400/50 transition-colors"
                        >
                          {/* Frequency Tag */}
                          <div className="text-center">
                            <span className="text-[10px] font-mono font-bold text-amber-400 block">
                              {freqLabel}Hz
                            </span>
                            <span className="text-[9px] font-mono text-zinc-500">
                              Band {bandIdx + 1}
                            </span>
                          </div>

                          {/* Gain Readout */}
                          <div className="text-center font-mono text-[10px] font-semibold text-zinc-200 bg-black px-1.5 py-0.5 rounded border border-white/[0.06] w-full">
                            {gainDb > 0 ? `+${gainDb.toFixed(1)}` : `${gainDb.toFixed(1)}`} dB
                          </div>

                          {/* Vertical Fader Track */}
                          <div className="h-64 flex items-center justify-center relative py-2">
                            {/* 0 dB Center Mark */}
                            <div className="absolute w-6 h-[1px] bg-zinc-700 top-1/2 pointer-events-none" />

                            <input
                              type="range"
                              min="-12"
                              max="12"
                              step="0.5"
                              value={gainDb}
                              onChange={(e) => setMixGeqBand(geqTargetMix.id, bandIdx, parseFloat(e.target.value))}
                              aria-label={`GEQ ${freqLabel}Hz band`}
                              aria-valuenow={gainDb}
                              className="fader-slider fader-vertical cursor-pointer"
                            />
                          </div>

                          {/* Zero / Reset Band */}
                          <button
                            type="button"
                            onClick={() => resetMixGeqBand(geqTargetMix.id, bandIdx)}
                            title="Reset this band to 0 dB"
                            className="w-full py-0.5 text-[9px] font-mono font-medium rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-white/[0.06]"
                          >
                            0 dB
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Continuous 48-Channel Fader Surface Ribbon */
                <div
                  ref={fadersContainerRef}
                  className="flex-1 flex overflow-x-auto overflow-y-hidden scroll-smooth bg-black"
                >
                  {sim.digital.channels
                    .filter((channel) => !channel.isStereoSlave)
                    .map((channel) => (
                      <FaderStrip key={channel.id} channel={channel} />
                    ))}
                </div>
              )}

              {/* Context-Sensitive Master Strip on Far Right */}
              <div className="shrink-0 border-l border-white/[0.08] z-10 bg-black">
                <MasterStrip />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
