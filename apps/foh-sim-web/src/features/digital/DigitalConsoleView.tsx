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
import { SetupScreen } from './screens/SetupScreen';
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
    { id: 'faders', label: 'Faders', icon: Sliders },
    { id: 'meters', label: 'Meters', icon: BarChart2 },
    { id: 'routing', label: 'Routing', icon: Share2 },
    { id: 'io', label: 'I/O Patch', icon: Network },
    { id: 'fx', label: 'FX Racks', icon: Sparkles },
    { id: 'scenes', label: 'Scenes', icon: Bookmark },
    { id: 'setup', label: 'Mixer Config', icon: Settings }
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
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* SQ Top Navigation Bar */}
      <nav className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          {screenKeys.map((k) => {
            const Icon = k.icon;
            const isActive =
              activeScreen === k.id ||
              (k.id === 'faders' && (activeScreen as string) === 'home');

            return (
              <button
                key={k.id}
                onClick={() => setActiveScreen(k.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-[0_0_10px_#0284c7]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{k.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Mix Indicator */}
        <div className="hidden md:flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-500">MIX KEY:</span>
          <span
            className={`px-2.5 py-1 rounded font-bold border transition-all ${
              isSendsOnFader
                ? 'bg-teal-950 text-teal-300 border-teal-700 shadow-[0_0_8px_#14b8a6]'
                : 'bg-amber-950 text-amber-300 border-amber-700'
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
        <div className="bg-amber-950/50 border-b border-amber-600/40 px-4 py-2 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center space-x-2 text-amber-300">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">READ-ONLY MODE:</span>
            <span className="text-slate-300 font-sans hidden sm:inline">
              You are exploring the console in preview mode. Faders, routing, patching, and renaming are locked.
            </span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow"
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
        {activeScreen === 'setup' && <SetupScreen />}
        {activeScreen === 'utility' && <HelpScreen />}

        {/* Faders / Surface Screen (Default View) */}
        {(activeScreen === 'faders' || (activeScreen as string) === 'home') && (
          <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">
            {/* Fader Navigation Sub-Bar: Mix Selection & Bank/Layers */}
            <div className="h-11 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 space-x-2 overflow-x-auto">
              {/* Sends on Fader Mix Selector Keys */}
              <div className="flex items-center space-x-1 overflow-x-auto shrink-0 py-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">
                  MIX SELECT:
                </span>

                {/* Main LR */}
                <button
                  onClick={() => setSelectedMix('main-lr')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    activeMixId === 'main-lr'
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  LR (MAIN)
                </button>

                {/* Mixes 1-12 (Auxes and Subgroups) */}
                {sim.digital.mixes.map((mix) => {
                  const isGroup = mix.mode === 'group';
                  const isSelected = activeMixId === mix.id;

                  return (
                    <button
                      key={mix.id}
                      onClick={() => setSelectedMix(mix.id)}
                      title={`${mix.name} (${isGroup ? 'Subgroup' : 'Aux'}, ${mix.stereo ? 'Stereo' : 'Mono'})`}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all whitespace-nowrap border ${
                        isSelected
                          ? isGroup
                            ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_8px_#6366f1]'
                            : 'bg-teal-500 text-slate-950 border-teal-400 shadow-[0_0_8px_#14b8a6]'
                          : isGroup
                          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800 hover:text-white hover:bg-indigo-900/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isGroup ? `[GRP] ${mix.name.replace(/^GRP\s*/, '')}` : mix.name}
                    </button>
                  );
                })}
              </div>

              {/* Surface Bank Navigation & GEQ Flip Controls */}
              <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
                {/* Bank Quick Jumps */}
                <div className="hidden xl:flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px]">JUMP:</span>
                  <button
                    onClick={() => { scrollToBank(1); setLayer('A'); }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px]"
                  >
                    1–16
                  </button>
                  <button
                    onClick={() => { scrollToBank(17); setLayer('B'); }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px]"
                  >
                    17–32
                  </button>
                  <button
                    onClick={() => { scrollToBank(33); setLayer('C'); }}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px]"
                  >
                    33–48
                  </button>
                </div>

                {/* Layer Keys A-F */}
                <div className="flex items-center space-x-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] mr-1 hidden sm:inline">LAYER:</span>
                  {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((layer) => (
                    <button
                      key={layer}
                      onClick={() => {
                        setLayer(layer);
                        if (layer === 'A') scrollToBank(1);
                        if (layer === 'B') scrollToBank(17);
                        if (layer === 'C') scrollToBank(33);
                      }}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${
                        sim.digital.session.layer === layer
                          ? 'bg-sky-500 text-white shadow-[0_0_6px_#38bdf8]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>

                {/* GEQ Flip Action Key */}
                <button
                  onClick={() => cycleGeqFlip()}
                  title="Toggle Motorized GEQ Fader Flip (1/3-Octave ISO Graphic Equalizer on Faders)"
                  className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono border transition-all ${
                    sim.digital.session.geqFlipActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_#f59e0b]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  GEQ FLIP {sim.digital.session.geqFlipActive ? `(P${sim.digital.session.geqFlipPage})` : ''}
                </button>
              </div>
            </div>

            {/* Sends on Fader Notice Banner */}
            {isSendsOnFader && !sim.digital.session.geqFlipActive && (
              <div className="h-7 bg-teal-950/80 border-b border-teal-800 px-4 flex items-center justify-between text-[11px] font-mono text-teal-200 shrink-0">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>
                    <strong>SENDS ON FADER ACTIVE:</strong> Mixing sends for{' '}
                    <span className="text-white font-bold">{selectedMixObj?.name}</span>. Faders
                    control send levels. MUTE buttons toggle channel assignment (ON/OFF) in this mix.
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMix('main-lr')}
                  className="text-[10px] px-2 py-0.5 rounded bg-teal-800 hover:bg-teal-700 text-white font-bold transition-colors"
                >
                  RETURN TO MAIN LR
                </button>
              </div>
            )}

            {/* GEQ Fader Flip Banner */}
            {sim.digital.session.geqFlipActive && (
              <div className="h-8 bg-amber-950/90 border-b border-amber-700/80 px-4 flex items-center justify-between text-xs font-mono text-amber-200 shrink-0">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
                    GEQ FLIP ACTIVE
                  </span>
                  <span className="font-bold text-white">
                    28-Band Graphic Equalizer for &ldquo;{geqTargetMix.name}&rdquo; (±12 dB)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Page Toggles */}
                  <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-amber-800/80">
                    <button
                      onClick={() => setGeqFlipPage(1)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        geqPage === 1 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      BANDS 1–14 (31.5Hz–630Hz)
                    </button>
                    <button
                      onClick={() => setGeqFlipPage(2)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        geqPage === 2 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      BANDS 15–28 (800Hz–16kHz)
                    </button>
                  </div>

                  {/* Reset all bands to 0 dB */}
                  <button
                    onClick={() => resetAllMixGeq(geqTargetMix.id)}
                    title="Flatten all 28 GEQ bands to 0 dB"
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>FLAT ALL</span>
                  </button>

                  {/* Exit GEQ Flip */}
                  <button
                    onClick={() => setGeqFlipPage(0)}
                    className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold text-[10px] transition-colors"
                  >
                    EXIT GEQ FLIP
                  </button>
                </div>
              </div>
            )}

            {/* Fader Surface Area: GEQ Flip vs 48-Channel Continuous Surface */}
            <div className="flex-1 flex overflow-hidden">
              {sim.digital.session.geqFlipActive ? (
                /* GEQ 14-Fader Active Surface */
                <div className="flex-1 flex justify-center items-stretch overflow-x-auto p-4 bg-slate-950">
                  <div className="flex space-x-3 items-stretch">
                    {geqBands.map((freqLabel, i) => {
                      const bandIdx = geqBandStartIndex + i;
                      const gainDb = geqTargetMix.geq[bandIdx] ?? 0;

                      return (
                        <div
                          key={bandIdx}
                          className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col justify-between items-center shadow-lg group hover:border-amber-500/60 transition-colors"
                        >
                          {/* Frequency Tag */}
                          <div className="text-center">
                            <span className="text-[10px] font-mono font-bold text-amber-400 block">
                              {freqLabel}Hz
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              Band {bandIdx + 1}
                            </span>
                          </div>

                          {/* Gain Readout */}
                          <div className="text-center font-mono text-[10px] font-bold text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 w-full">
                            {gainDb > 0 ? `+${gainDb.toFixed(1)}` : `${gainDb.toFixed(1)}`} dB
                          </div>

                          {/* Vertical Fader Track */}
                          <div className="h-64 flex items-center justify-center relative py-2">
                            {/* 0 dB Center Mark */}
                            <div className="absolute w-6 h-[1px] bg-slate-600 top-1/2 pointer-events-none" />

                            <input
                              type="range"
                              min="-12"
                              max="12"
                              step="0.5"
                              value={gainDb}
                              onChange={(e) => setMixGeqBand(geqTargetMix.id, bandIdx, parseFloat(e.target.value))}
                              aria-label={`GEQ ${freqLabel}Hz band`}
                              aria-valuenow={gainDb}
                              className="fader-slider fader-vertical cursor-pointer accent-amber-500"
                            />
                          </div>

                          {/* Zero / Reset Band */}
                          <button
                            type="button"
                            onClick={() => resetMixGeqBand(geqTargetMix.id, bandIdx)}
                            title="Reset this band to 0 dB"
                            className="w-full py-1 text-[9px] font-mono font-bold rounded bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-400 transition-colors border border-slate-700"
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
                  className="flex-1 flex overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950"
                >
                  {sim.digital.channels
                    .filter((channel) => !channel.isStereoSlave)
                    .map((channel) => (
                      <FaderStrip key={channel.id} channel={channel} />
                    ))}
                </div>
              )}

              {/* Context-Sensitive Master Strip on Far Right */}
              <div className="shrink-0 border-l-2 border-slate-800 shadow-2xl z-10">
                <MasterStrip />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
