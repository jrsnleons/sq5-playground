import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { InputChannel } from '@foh-sim/simulation-core';

interface FaderStripProps {
  channel: InputChannel;
}

export const FaderStrip: React.FC<FaderStripProps> = ({ channel }) => {
  const {
    sim,
    signalPresence,
    setSelectedChannel,
    setChannelFader,
    toggleChannelMute,
    toggleChannelPAFL,
    setChannelSend,
    toggleSendPreFade
  } = useSimulationStore();

  const isSelected = sim.digital.session.selectedChannelId === channel.id;
  const isSendsOnFaders = sim.digital.session.selectedMixId !== 'main-lr';
  const activeMixId = sim.digital.session.selectedMixId;

  const currentSend = channel.sends[activeMixId] || {
    mixId: activeMixId,
    levelDb: -90,
    preFade: false,
    assigned: false
  };

  const faderVal = isSendsOnFaders ? currentSend.levelDb : channel.faderLevel;

  // Check if muted via DCA bitmask
  let isDcaMuted = false;
  if (channel.dcaGroupMask > 0) {
    for (const dca of sim.digital.dcas) {
      if ((channel.dcaGroupMask & (1 << (dca.id - 1))) && dca.mute) {
        isDcaMuted = true;
        break;
      }
    }
  }

  const hasSignal = signalPresence.channelsWithSignal[channel.id];

  const handleFaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isSendsOnFaders) {
      setChannelSend(channel.id, activeMixId, val, true);
    } else {
      setChannelFader(channel.id, val);
    }
  };

  return (
    <div
      className={`w-20 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-1.5 shrink-0 select-none transition-colors ${
        isSelected ? 'bg-slate-850 ring-1 ring-sky-500/50' : ''
      }`}
    >
      {/* Top: PAFL & SEL Buttons */}
      <div className="space-y-1">
        {/* PAFL */}
        <button
          onClick={() => toggleChannelPAFL(channel.id)}
          className={`w-full py-1 text-[10px] font-bold font-mono rounded transition-colors ${
            channel.pafl
              ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_#fbbf24]'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          PAFL
        </button>

        {/* SEL */}
        <button
          onClick={() => setSelectedChannel(channel.id)}
          className={`w-full py-1 text-[10px] font-bold font-mono rounded transition-colors ${
            isSelected
              ? 'bg-sky-500 text-white shadow-[0_0_8px_#38bdf8]'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          SEL
        </button>
      </div>

      {/* Sends-on-Faders Tap Point (Pre/Post) */}
      {isSendsOnFaders && (
        <div className="flex items-center justify-between px-1 py-0.5 my-1 bg-slate-950 rounded border border-slate-800 text-[9px] font-mono">
          <button
            onClick={() => toggleSendPreFade(channel.id, activeMixId)}
            className={`px-1 py-0.5 rounded ${
              currentSend.preFade ? 'text-amber-400 font-bold' : 'text-slate-500'
            }`}
          >
            {currentSend.preFade ? 'PRE' : 'POST'}
          </button>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              currentSend.assigned ? 'bg-emerald-400' : 'bg-slate-700'
            }`}
          />
        </div>
      )}

      {/* Center Fader Well & LED Meter */}
      <div className="flex-1 flex justify-center items-center py-2 space-x-2">
        {/* Vertical LED Meter Bar */}
        <div className="w-2.5 h-48 bg-slate-950 rounded-sm p-0.5 flex flex-col justify-between border border-slate-800">
          <div
            className={`w-full h-1.5 rounded-xs transition-opacity ${
              hasSignal && faderVal > 0 ? 'bg-rose-500 opacity-100 shadow-[0_0_4px_#f43f5e]' : 'bg-rose-950 opacity-40'
            }`}
          />
          <div
            className={`w-full h-1.5 rounded-xs transition-opacity ${
              hasSignal && faderVal >= -6 ? 'bg-amber-400 opacity-100' : 'bg-amber-950 opacity-40'
            }`}
          />
          <div
            className={`w-full h-1.5 rounded-xs transition-opacity ${
              hasSignal && faderVal >= -18 ? 'bg-emerald-400 opacity-100' : 'bg-emerald-950 opacity-40'
            }`}
          />
          <div
            className={`w-full h-1.5 rounded-xs transition-opacity ${
              hasSignal && faderVal >= -30 ? 'bg-emerald-400 opacity-100' : 'bg-emerald-950 opacity-40'
            }`}
          />
          <div
            className={`w-full h-1.5 rounded-xs transition-opacity ${
              hasSignal ? 'bg-emerald-500 opacity-100' : 'bg-emerald-950 opacity-40'
            }`}
          />
        </div>

        {/* Fader Track & Knob */}
        <div className="h-48 flex items-center justify-center relative">
          <input
            type="range"
            min="-90"
            max="10"
            step="0.5"
            value={faderVal}
            onChange={handleFaderChange}
            aria-label={`${channel.name} fader`}
            className="fader-slider fader-vertical cursor-pointer"
          />
        </div>
      </div>

      {/* dB readout */}
      <div className="text-center font-mono text-[10px] text-slate-400 py-0.5 bg-slate-950/80 rounded border border-slate-800/80 my-1">
        {faderVal <= -85 ? '-∞' : `${faderVal > 0 ? '+' : ''}${faderVal.toFixed(1)} dB`}
      </div>

      {/* Mute Button */}
      <div className="space-y-1">
        <button
          onClick={() => toggleChannelMute(channel.id)}
          className={`w-full py-1.5 text-[10px] font-bold font-mono rounded transition-all ${
            channel.mute
              ? 'bg-rose-600 text-white shadow-[0_0_8px_#e11d48]'
              : isDcaMuted
              ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          {isDcaMuted && !channel.mute ? 'DCA MUTE' : 'MUTE'}
        </button>

        {/* Scribble Strip (Digital LCD) */}
        <div
          onClick={() => setSelectedChannel(channel.id)}
          style={{ borderLeftColor: channel.color }}
          className="p-1 rounded bg-slate-950 border border-slate-800 border-l-4 cursor-pointer hover:border-slate-700"
        >
          <div className="text-[9px] font-mono text-slate-500 truncate">
            CH {channel.channelNumber}
          </div>
          <div
            className="text-[11px] font-bold text-slate-200 truncate"
            title={channel.name}
          >
            {channel.name}
          </div>
        </div>
      </div>
    </div>
  );
};
