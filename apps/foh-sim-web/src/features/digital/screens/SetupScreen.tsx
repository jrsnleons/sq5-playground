import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import {
  Settings,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Share2,
  Layers,
  Cpu
} from 'lucide-react';

export const SetupScreen: React.FC = () => {
  const {
    sim,
    cycleGeqFlip,
    toggleInputChannelStereo,
    toggleMixStereo,
    toggleMixMode,
    toggleMatrixStereo,
    setGlobalAuxPreFade,
    adminMode,
    toggleAdminMode,
    saveStageAsDefaultPreset
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'mixer-config' | 'admin' | 'surface'>('mixer-config');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const geqFlipActive = sim.digital.session.geqFlipActive;
  const geqPage = sim.digital.session.geqFlipPage;

  const handleSavePreset = () => {
    saveStageAsDefaultPreset();
    setSaveNotice('Current stage layout, cables, custom items, and digital patch successfully saved as Default Preset!');
    setTimeout(() => setSaveNotice(null), 4000);
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
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
            SQ-5 Setup &amp; Mixer Configuration
          </h2>
        </div>

        {/* Setup Navigation Tabs */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTab('mixer-config')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
              activeTab === 'mixer-config'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            MIXER CONFIG (BUSES)
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ADMIN &amp; PRESET DEFAULTS
          </button>
          <button
            onClick={() => setActiveTab('surface')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
              activeTab === 'surface'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            SURFACE &amp; GEQ
          </button>
        </div>
      </div>

      {/* Save Notice Banner */}
      {saveNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-700 px-6 py-2 text-xs font-mono text-emerald-200 flex items-center space-x-2 shrink-0 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{saveNotice}</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'mixer-config' ? (
          /* Authentic Allen & Heath Mixer Config (Bus Architecture) */
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Input Channels 1–48 Stereo / Mono Pairing Configuration */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-sm font-bold text-teal-400 uppercase font-mono block">
                    Input Channels 1–48 Configuration (Stereo / Mono Pairing)
                  </span>
                  <span className="text-xs text-slate-400">
                    Pair adjacent odd/even channels into stereo inputs (e.g. ProPresenter PC on CH 25-26). Stereo pairs share fader, mute, processing, and display combined meters.
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  24 Channel Pairs (48 Inputs)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 font-mono text-xs max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {channelPairs.map(({ pairIndex, oddCh, evenCh, isStereo }) => {
                  if (!oddCh || !evenCh) return null;
                  return (
                    <div
                      key={pairIndex}
                      className={`p-2.5 rounded-lg border transition-colors flex flex-col justify-between space-y-2 ${
                        isStereo
                          ? 'bg-slate-950 border-teal-600/80 shadow-[0_0_8px_rgba(20,184,166,0.15)]'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isStereo ? 'text-teal-300' : 'text-slate-300'}`}>
                            CH {String(oddCh.channelNumber).padStart(2, '0')}-{String(evenCh.channelNumber).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              isStereo
                                ? 'bg-teal-950 text-teal-300 border border-teal-700 shadow-[0_0_4px_#14b8a6]'
                                : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}
                          >
                            {isStereo ? 'STEREO' : 'MONO'}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 truncate mt-1">
                          L: <span className="text-slate-200">{oddCh.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          R: <span className="text-slate-200">{evenCh.name}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-900">
                        <button
                          onClick={() => {
                            if (isStereo) toggleInputChannelStereo(oddCh.channelNumber);
                          }}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            !isStereo
                              ? 'bg-slate-800 text-slate-200 border-slate-700 shadow'
                              : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          MONO
                        </button>
                        <button
                          onClick={() => {
                            if (!isStereo) toggleInputChannelStereo(oddCh.channelNumber);
                          }}
                          className={`py-1 rounded text-[10px] font-bold border transition-all ${
                            isStereo
                              ? 'bg-teal-950 text-teal-300 border-teal-700 shadow-[0_0_6px_#14b8a6]'
                              : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
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

            {/* Mix Buses 1–12 Configuration */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-sm font-bold text-sky-400 uppercase font-mono block">
                    Mix 1–12 Bus Configuration (Aux / Group &amp; Stereo / Mono)
                  </span>
                  <span className="text-xs text-slate-400">
                    Switch buses between Auxiliary monitor sends and Subgroups, or toggle Stereo/Mono pairing.
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  12 Total Buses
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {sim.digital.mixes.map((mix) => (
                  <div
                    key={mix.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        M{mix.mixNumber}: {mix.name}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{mix.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Mode: Aux vs Group */}
                      <button
                        onClick={() => toggleMixMode(mix.id)}
                        className={`py-1 px-2 rounded text-[10px] font-bold border transition-all ${
                          mix.mode === 'aux'
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        }`}
                        title="Click to toggle between Aux monitor send and Audio Subgroup"
                      >
                        {mix.mode === 'aux' ? 'MODE: AUX' : 'MODE: GROUP'}
                      </button>

                      {/* Stereo vs Mono */}
                      <button
                        onClick={() => toggleMixStereo(mix.id)}
                        className={`py-1 px-2 rounded text-[10px] font-bold border transition-all ${
                          mix.stereo
                            ? 'bg-teal-950 text-teal-300 border-teal-700 shadow-[0_0_6px_#14b8a6]'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                        title="Click to toggle between Mono and Stereo bus format"
                      >
                        {mix.stereo ? 'FORMAT: STEREO' : 'FORMAT: MONO'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix 1–3 Configuration */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-sm font-bold text-teal-400 uppercase font-mono block">
                    Matrix 1–3 Configuration (Stereo / Mono)
                  </span>
                  <span className="text-xs text-slate-400">
                    Matrix buses feed delay speakers, infills, and auxiliary zones.
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  3 Matrix Buses
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                {sim.digital.matrices.map((mtx) => (
                  <div
                    key={mtx.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{mtx.name}</div>
                      <div className="text-[10px] text-slate-500">Source: {mtx.source.toUpperCase()}</div>
                    </div>

                    <button
                      onClick={() => toggleMatrixStereo(mtx.id)}
                      className={`py-1.5 px-3 rounded text-[10px] font-bold border transition-all ${
                        mtx.stereo
                          ? 'bg-teal-950 text-teal-300 border-teal-700 shadow-[0_0_6px_#14b8a6]'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {mtx.stereo ? 'FORMAT: STEREO' : 'FORMAT: MONO'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Send Defaults */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
              <span className="text-sm font-bold text-amber-400 uppercase font-mono block">
                Global Aux Send Tap Point Defaults
              </span>
              <p className="text-xs text-slate-400">
                Sets the global default tap point across all 48 input channels. Individual channels can still be overridden in the Routing screen or fader strips.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setGlobalAuxPreFade(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-mono font-bold text-amber-300 border border-slate-700"
                >
                  SET ALL SENDS TO PRE-FADE
                </button>
                <button
                  onClick={() => setGlobalAuxPreFade(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-mono font-bold text-slate-300 border border-slate-700"
                >
                  SET ALL SENDS TO POST-FADE
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'admin' ? (
          /* Admin & Preset Defaults */
          <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-white uppercase">
                    Admin Privileges &amp; Default Rig Editor
                  </span>
                </div>
                <button
                  onClick={toggleAdminMode}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    adminMode
                      ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {adminMode ? 'ADMIN MODE: ACTIVE' : 'ADMIN MODE: DISABLED'}
                </button>
              </div>

              <p className="text-slate-400 leading-relaxed">
                When Admin Mode is active, you can create custom hardware nodes in the Stage Palette, specify their input/output connectors (XLR, 1/4" TRS, EtherCon, RF, USB), and update inventory stock numbers.
              </p>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-sky-400 uppercase block">
                  Save Current Canvas as Default Rig Preset
                </span>
                <p className="text-slate-400 text-[11px]">
                  Clicking below captures your exact current stage placement, cable routing, custom hardware definitions, and digital I/O patch. Clicking "Reset to Church Rig" will now restore this customized configuration.
                </p>

                <button
                  onClick={handleSavePreset}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-950"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Current Stage as Default Preset</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Surface & GEQ Flip */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* GEQ Fader Flip */}
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-400 uppercase font-mono">
                  28-Band GEQ Fader Flip
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    geqFlipActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-950 text-slate-500'
                  }`}
                >
                  {geqFlipActive ? `PAGE ${geqPage} (BANDS ${geqPage === 1 ? '1–14' : '15–28'})` : 'OFF'}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Flips physical fader strips into a 28-band 1/3-octave graphic equalizer (31 Hz – 16 kHz) for the currently selected mix bus.
              </p>

              <button
                onClick={cycleGeqFlip}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Sliders className="w-4 h-4" />
                <span>
                  CYCLE GEQ FLIP (PRESS: {geqPage === 0 ? '1 (Bands 1–14)' : geqPage === 1 ? '2 (Bands 15–28)' : '3 (Exit)'})
                </span>
              </button>
            </div>

            {/* Architecture Overview */}
            <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
              <span className="text-sm font-bold text-sky-400 uppercase font-mono block">
                SQ-5 Hardware Core Specifications
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Processing Core:</span>
                  <span className="text-white font-bold">XCVI 96kHz FPGA</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">SLink Protocol:</span>
                  <span className="text-emerald-400 font-bold">dSnake 48kHz (AR2412)</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Main Stereo Bus:</span>
                  <span className="text-white font-bold">Main LR</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">DCA &amp; Mute Groups:</span>
                  <span className="text-white font-bold">8 DCAs + 8 Mute Groups</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
