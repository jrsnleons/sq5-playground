import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';

export const MasterStrip: React.FC = () => {
  const {
    sim,
    signalPresence,
    userRole,
    setSelectedMix,
    setMainLRFader,
    toggleMainLRMute,
    setMixFader,
    toggleMixMute
  } = useSimulationStore();

  const isGuest = userRole === 'guest';
  const isSendsOnFaders = sim.digital.session.selectedMixId !== 'main-lr';
  const activeMixId = sim.digital.session.selectedMixId;
  const activeMix = sim.digital.mixes.find((m) => m.id === activeMixId);

  const title = isSendsOnFaders ? activeMix?.name || 'MIX' : 'MAIN LR';
  const faderVal = isSendsOnFaders ? (activeMix?.faderLevel ?? 0) : sim.digital.mainLR.faderLevel;
  const isMuted = isSendsOnFaders ? (activeMix?.mute ?? false) : sim.digital.mainLR.mute;

  let isDcaMuted = false;
  if (isSendsOnFaders && activeMix && (activeMix.dcaGroupMask ?? 0) > 0) {
    for (const dca of sim.digital.dcas) {
      if (((activeMix.dcaGroupMask ?? 0) & (1 << (dca.id - 1))) && dca.mute) {
        isDcaMuted = true;
        break;
      }
    }
  }

  const assignedDcas = isSendsOnFaders && activeMix && (activeMix.dcaGroupMask ?? 0) > 0
    ? sim.digital.dcas.filter((d) => ((activeMix.dcaGroupMask ?? 0) & (1 << (d.id - 1))) !== 0)
    : [];

  const hasSignal = isSendsOnFaders
    ? signalPresence.mixesWithSignal[activeMixId]
    : signalPresence.mainLRHasSignal;

  const handleFaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest) return;
    const val = parseFloat(e.target.value);
    if (isSendsOnFaders) {
      setMixFader(activeMixId, val);
    } else {
      setMainLRFader(val);
    }
  };

  const handleToggleMute = () => {
    if (isGuest) return;
    if (isSendsOnFaders) {
      toggleMixMute(activeMixId);
    } else {
      toggleMainLRMute();
    }
  };

  return (
    <div className="w-24 bg-[#0A0A0A] border-l border-white/[0.08] flex flex-col justify-between p-1.5 shrink-0 select-none">
      {/* Top: SEL */}
      <div className="space-y-1">
        <div className="w-full py-1 text-center text-[10px] font-mono text-zinc-500 bg-zinc-900/80 rounded border border-white/[0.06]">
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
          className="w-full py-1 text-[10px] font-bold font-mono rounded bg-amber-400 hover:bg-amber-300 text-black transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          SEL
        </button>
      </div>

      {/* Center Master Fader Track & Dual LED Meter */}
      <div className="flex-1 flex justify-center items-center py-2 space-x-2">
        {/* Dual Meter Bar */}
        <div className="w-4 h-72 bg-black rounded-xs p-0.5 flex space-x-0.5 justify-between border border-white/[0.08]">
          {/* Left Meter */}
          <div className="w-1.5 h-full flex flex-col justify-between">
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal > 0 ? 'bg-red-500' : 'bg-red-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -6 ? 'bg-amber-400' : 'bg-amber-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -18 ? 'bg-emerald-400' : 'bg-emerald-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -30 ? 'bg-emerald-400' : 'bg-emerald-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal ? 'bg-emerald-500' : 'bg-emerald-950/30 opacity-40'}`} />
          </div>
          {/* Right Meter */}
          <div className="w-1.5 h-full flex flex-col justify-between">
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal > 0 ? 'bg-red-500' : 'bg-red-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -6 ? 'bg-amber-400' : 'bg-amber-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -18 ? 'bg-emerald-400' : 'bg-emerald-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal && faderVal >= -30 ? 'bg-emerald-400' : 'bg-emerald-950/30 opacity-40'}`} />
            <div className={`w-full h-1.5 rounded-xs ${hasSignal ? 'bg-emerald-500' : 'bg-emerald-950/30 opacity-40'}`} />
          </div>
        </div>

        {/* Master Fader */}
        <div className="h-72 flex items-center justify-center relative">
          <input
            type="range"
            min="-90"
            max="10"
            step="0.5"
            disabled={isGuest}
            value={faderVal}
            onChange={handleFaderChange}
            aria-label={`${title} Master Fader`}
            aria-valuenow={faderVal}
            className="fader-slider fader-vertical cursor-pointer"
          />
        </div>
      </div>

      {/* Fader Readout */}
      <div className="text-center font-mono text-[10px] text-amber-300/90 py-0.5 bg-black rounded border border-white/[0.06] my-1 font-semibold tabular-nums">
        {faderVal <= -85 ? '-inf' : `${faderVal > 0 ? '+' : ''}${faderVal.toFixed(1)} dB`}
      </div>

      {/* Mute Button */}
      <div className="space-y-1">
        <button
          onClick={handleToggleMute}
          disabled={isGuest}
          aria-label={`Mute ${title}`}
          className={`w-full py-1.5 text-[10px] font-bold font-mono rounded transition-colors ${
            isGuest ? 'cursor-not-allowed opacity-60' : ''
          } ${
            isMuted || isDcaMuted
              ? isDcaMuted && !isMuted
                ? 'bg-red-950/80 text-red-300 border-2 border-red-500 font-bold animate-pulse'
                : 'bg-red-600 text-white font-semibold'
              : 'bg-zinc-900 text-zinc-300 border border-white/[0.06] hover:bg-zinc-800 hover:text-white'
          }`}
        >
          {isDcaMuted && !isMuted ? 'DCA MUTE' : 'MUTE'}
        </button>

        {/* Scribble Strip */}
        <div className="p-1.5 rounded bg-black border border-white/[0.08] text-center">
          <div className="text-[9px] font-mono text-zinc-500 uppercase flex items-center justify-center space-x-1">
            <span>BUS MASTER</span>
            {assignedDcas.length > 0 && (
              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400 text-black font-bold">
                {assignedDcas.map((d) => `D${d.id}`).join(',')}
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium text-amber-300/90 truncate font-mono">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
