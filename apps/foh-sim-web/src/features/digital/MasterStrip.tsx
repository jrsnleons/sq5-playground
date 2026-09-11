import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';

export const MasterStrip: React.FC = () => {
  const {
    sim,
    signalPresence,
    setSelectedMix,
    setMainLRFader,
    toggleMainLRMute,
    setMixFader,
    toggleMixMute
  } = useSimulationStore();

  const isSendsOnFaders = sim.digital.session.selectedMixId !== 'main-lr';
  const activeMixId = sim.digital.session.selectedMixId;
  const activeMix = sim.digital.mixes.find((m) => m.id === activeMixId);

  const title = isSendsOnFaders ? activeMix?.name || 'MIX' : 'MAIN LR';
  const faderVal = isSendsOnFaders ? (activeMix?.faderLevel ?? 0) : sim.digital.mainLR.faderLevel;
  const isMuted = isSendsOnFaders ? (activeMix?.mute ?? false) : sim.digital.mainLR.mute;
  const hasSignal = isSendsOnFaders
    ? signalPresence.mixesWithSignal[activeMixId]
    : signalPresence.mainLRHasSignal;

  const handleFaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isSendsOnFaders) {
      setMixFader(activeMixId, val);
    } else {
      setMainLRFader(val);
    }
  };

  const handleToggleMute = () => {
    if (isSendsOnFaders) {
      toggleMixMute(activeMixId);
    } else {
      toggleMainLRMute();
    }
  };

  return (
    <div className="w-24 bg-slate-950 border-l-2 border-slate-800 flex flex-col justify-between p-1.5 shrink-0 select-none">
      {/* Top: SEL */}
      <div className="space-y-1">
        <div className="w-full py-1 text-center text-[10px] font-bold font-mono text-slate-400 bg-slate-900 rounded border border-slate-800">
          MASTER
        </div>
        <button
          onClick={() => {
            if (isSendsOnFaders) {
              setSelectedMix(activeMixId);
            } else {
              setSelectedMix('main-lr');
            }
          }}
          title={isSendsOnFaders ? `Selected: ${activeMix?.name || 'Mix'} Master` : 'Selected: Main LR Master'}
          className="w-full py-1 text-[10px] font-bold font-mono rounded bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_8px_#f59e0b] transition-colors focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
        >
          SEL
        </button>
      </div>

      {/* Center Master Fader Track & Dual LED Meter */}
      <div className="flex-1 flex justify-center items-center py-2 space-x-2">
        {/* Dual Meter Bar */}
        <div className="w-4 h-72 bg-slate-950 rounded-sm p-0.5 flex space-x-0.5 justify-between border border-slate-800">
          {/* Left Meter */}
          <div className="w-1.5 h-full flex flex-col justify-between">
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal > 0 ? 'bg-rose-500' : 'bg-rose-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -6 ? 'bg-amber-400' : 'bg-amber-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -18 ? 'bg-emerald-400' : 'bg-emerald-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -30 ? 'bg-emerald-400' : 'bg-emerald-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal ? 'bg-emerald-500' : 'bg-emerald-950 opacity-40'}`} />
          </div>
          {/* Right Meter */}
          <div className="w-1.5 h-full flex flex-col justify-between">
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal > 0 ? 'bg-rose-500' : 'bg-rose-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -6 ? 'bg-amber-400' : 'bg-amber-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -18 ? 'bg-emerald-400' : 'bg-emerald-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -30 ? 'bg-emerald-400' : 'bg-emerald-950 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal ? 'bg-emerald-500' : 'bg-emerald-950 opacity-40'}`} />
          </div>
        </div>

        {/* Master Fader */}
        <div className="h-72 flex items-center justify-center relative">
          <input
            type="range"
            min="-90"
            max="10"
            step="0.5"
            value={faderVal}
            onChange={handleFaderChange}
            role="slider"
            aria-label={`${title} Master Fader`}
            aria-valuemin={-90}
            aria-valuemax={10}
            aria-valuenow={faderVal}
            aria-valuetext={faderVal <= -85 ? 'Minus Infinity dB' : `${faderVal.toFixed(1)} dB`}
            className="fader-slider fader-vertical cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          />
        </div>
      </div>

      {/* dB readout */}
      <div className="text-center font-mono text-[10px] text-amber-400 py-0.5 bg-slate-900 rounded border border-slate-800 my-1 font-bold">
        {faderVal <= -85 ? '-∞' : `${faderVal > 0 ? '+' : ''}${faderVal.toFixed(1)} dB`}
      </div>

      {/* Mute Button */}
      <div className="space-y-1">
        <button
          onClick={handleToggleMute}
          aria-label={`Mute ${title}`}
          className={`w-full py-1.5 text-[10px] font-bold font-mono rounded transition-all focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
            isMuted
              ? 'bg-rose-600 text-white shadow-[0_0_8px_#e11d48]'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          MUTE
        </button>

        {/* Scribble Strip */}
        <div className="p-1 rounded bg-slate-900 border border-amber-600/80 text-center">
          <div className="text-[9px] font-mono text-slate-300">BUS MASTER</div>
          <div className="text-[11px] font-black text-amber-300 truncate font-mono">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
