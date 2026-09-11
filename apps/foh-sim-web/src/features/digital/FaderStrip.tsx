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
    setActiveScreen,
    setChannelFader,
    toggleChannelMute,
    toggleChannelPAFL,
    setChannelSend,
    toggleSendPreFade
  } = useSimulationStore();

  const isSelected = sim.digital.session.selectedChannelId === channel.id;
  const activeMixId = sim.digital.session.selectedMixId;
  const isSendsOnFaders = activeMixId !== 'main-lr';

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

  // Bind meters to raw input signal (pre-mute / pre-fader physical input presence)
  const hasSignalL = signalPresence.rawInputsWithSignal?.[channel.id] ?? signalPresence.channelsWithSignal[channel.id];
  const hasSignalR = channel.stereo && channel.linkedChannelId
    ? (signalPresence.rawInputsWithSignal?.[channel.linkedChannelId] ?? signalPresence.channelsWithSignal[channel.linkedChannelId])
    : hasSignalL;

  const renderMeterBar = (signal: boolean, widthClass: string = 'w-2.5', label?: string) => (
    <div
      className={`${widthClass} h-72 bg-slate-950 rounded-xs p-0.5 flex flex-col justify-between border border-slate-800`}
      title={label}
    >
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal && faderVal > 0 ? 'bg-rose-500 opacity-100 shadow-[0_0_4px_#f43f5e]' : 'bg-rose-950 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal && faderVal >= -6 ? 'bg-amber-400 opacity-100' : 'bg-amber-950 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal && faderVal >= -18 ? 'bg-emerald-400 opacity-100' : 'bg-emerald-950 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal ? 'bg-emerald-400 opacity-100' : 'bg-emerald-950 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal ? 'bg-emerald-500 opacity-100 shadow-[0_0_4px_#10b981]' : 'bg-emerald-950 opacity-40'
        }`}
      />
    </div>
  );

  const handleFaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isSendsOnFaders) {
      setChannelSend(channel.id, activeMixId, val, true);
    } else {
      setChannelFader(channel.id, val);
    }
  };

  const handleMuteOrAssignClick = () => {
    if (isSendsOnFaders) {
      // Toggle assignment in this mix
      setChannelSend(channel.id, activeMixId, currentSend.levelDb, !currentSend.assigned);
    } else {
      toggleChannelMute(channel.id);
    }
  };

  return (
    <div
      className={`${channel.stereo ? 'w-22' : 'w-20'} bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-1.5 shrink-0 select-none transition-colors ${
        isSelected ? 'bg-slate-850 ring-1 ring-sky-500/50' : ''
      } ${isSendsOnFaders ? 'border-t-2 border-t-teal-500' : ''}`}
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
          onClick={() => {
            if (isSelected) {
              setActiveScreen('processing');
            } else {
              setSelectedChannel(channel.id);
            }
          }}
          title={isSelected ? 'Already selected (Click again to view Processing)' : 'Select Channel'}
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
        <div className="my-1">
          <button
            onClick={() => toggleSendPreFade(channel.id, activeMixId)}
            className={`w-full py-0.5 text-[9px] font-mono font-bold rounded border transition-all ${
              currentSend.preFade
                ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-[0_0_4px_#f59e0b]'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Pre-Fade / Post-Fade send point"
          >
            {currentSend.preFade ? 'PRE-FADE' : 'POST-FADE'}
          </button>
        </div>
      )}

      {/* Center Fader Well & LED Meter */}
      <div className="flex-1 flex justify-center items-center py-2 space-x-1.5">
        {/* Vertical LED Meter Bar (Dual L/R for stereo, single for mono) */}
        {channel.stereo ? (
          <div className="flex items-center space-x-1" title="Stereo Left / Right LED Meters">
            {renderMeterBar(hasSignalL, 'w-1.5', 'Left Meter')}
            {renderMeterBar(hasSignalR, 'w-1.5', 'Right Meter')}
          </div>
        ) : (
          renderMeterBar(hasSignalL, 'w-2.5', 'Channel Meter')
        )}

        {/* Fader Track & Knob */}
        <div className="h-72 flex items-center justify-center relative">
          <input
            type="range"
            min="-90"
            max="10"
            step="0.5"
            value={faderVal}
            onChange={handleFaderChange}
            role="slider"
            aria-label={`${channel.name} channel volume fader`}
            aria-valuemin={-90}
            aria-valuemax={10}
            aria-valuenow={faderVal}
            aria-valuetext={faderVal <= -85 ? 'Minus Infinity dB' : `${faderVal.toFixed(1)} dB`}
            className="fader-slider fader-vertical cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
          />
        </div>
      </div>

      {/* dB readout */}
      <div className="text-center font-mono text-[10px] text-slate-300 py-0.5 bg-slate-950/80 rounded border border-slate-800/80 my-1">
        {faderVal <= -85 ? '-∞' : `${faderVal > 0 ? '+' : ''}${faderVal.toFixed(1)} dB`}
      </div>

      {/* Mute / Mix Assignment Button */}
      <div className="space-y-1">
        <button
          onClick={handleMuteOrAssignClick}
          aria-label={isSendsOnFaders ? `Toggle Mix Assignment for ${channel.name}` : `Mute ${channel.name}`}
          className={`w-full py-1.5 text-[10px] font-bold font-mono rounded transition-all focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
            isSendsOnFaders
              ? currentSend.assigned
                ? 'bg-teal-600 text-white shadow-[0_0_6px_#14b8a6]'
                : 'bg-rose-950 text-rose-300 border border-rose-700'
              : channel.mute
              ? 'bg-rose-600 text-white shadow-[0_0_8px_#e11d48]'
              : isDcaMuted
              ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isSendsOnFaders
            ? currentSend.assigned
              ? 'ON (ASSIGN)'
              : 'OFF (MUTED)'
            : isDcaMuted && !channel.mute
            ? 'DCA MUTE'
            : 'MUTE'}
        </button>

        {/* Scribble Strip (Digital LCD) */}
        <div
          onClick={() => setSelectedChannel(channel.id)}
          onDoubleClick={() => {
            setSelectedChannel(channel.id);
            setActiveScreen('processing');
          }}
          style={{ borderLeftColor: channel.color }}
          className="p-1 rounded bg-slate-950 border border-slate-800 border-l-4 cursor-pointer hover:border-slate-700 transition-colors"
          title="Click to select, double-click to view channel processing"
        >
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>
              {channel.stereo ? `CH ${channel.channelNumber}-${channel.channelNumber + 1}` : `CH ${channel.channelNumber}`}
            </span>
            {channel.stereo && (
              <span className="px-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[8px] font-bold">
                ST
              </span>
            )}
          </div>
          <div
            className="text-[11px] font-bold text-slate-200 truncate"
            title={channel.stereo ? `${channel.name} (Stereo Pair)` : channel.name}
          >
            {channel.stereo && channel.name.endsWith(' L') ? `${channel.name.replace(/ L$/, '')} L/R` : channel.name}
          </div>
        </div>
      </div>
    </div>
  );
};
