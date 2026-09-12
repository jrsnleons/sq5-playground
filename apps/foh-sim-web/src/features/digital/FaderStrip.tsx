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
    userRole,
    setSelectedChannel,
    setActiveScreen,
    setChannelFader,
    toggleChannelMute,
    toggleChannelPAFL,
    setChannelSend,
    toggleSendPreFade
  } = useSimulationStore();

  const isGuest = userRole === 'guest';
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

  const renderMeterBar = (signal: boolean, widthClass: string = 'w-2', label?: string) => (
    <div
      className={`${widthClass} h-72 bg-black rounded-xs p-0.5 flex flex-col justify-between border border-white/[0.08]`}
      title={label}
    >
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal && faderVal > 0 ? 'bg-red-500 opacity-100' : 'bg-red-950/30 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal && faderVal >= -6 ? 'bg-amber-400 opacity-100' : 'bg-amber-950/30 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal && faderVal >= -18 ? 'bg-emerald-400 opacity-100' : 'bg-emerald-950/30 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal ? 'bg-emerald-400 opacity-100' : 'bg-emerald-950/30 opacity-40'
        }`}
      />
      <div
        className={`w-full h-1.5 rounded-xs transition-opacity ${
          signal ? 'bg-emerald-500 opacity-100' : 'bg-emerald-950/30 opacity-40'
        }`}
      />
    </div>
  );

  const handleFaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest) return;
    const val = parseFloat(e.target.value);
    if (isSendsOnFaders) {
      setChannelSend(channel.id, activeMixId, val, true);
    } else {
      setChannelFader(channel.id, val);
    }
  };

  const handleMuteOrAssignClick = () => {
    if (isGuest) return;
    if (isSendsOnFaders) {
      // Toggle assignment in this mix
      setChannelSend(channel.id, activeMixId, currentSend.levelDb, !currentSend.assigned);
    } else {
      toggleChannelMute(channel.id);
    }
  };

  return (
    <div
      className={`${channel.stereo ? 'w-22' : 'w-20'} bg-[#0A0A0A] border-r border-white/[0.06] flex flex-col justify-between p-1.5 shrink-0 select-none transition-colors ${
        isSelected ? 'bg-[#121212] ring-1 ring-white/20' : ''
      } ${isSendsOnFaders ? 'border-t-2 border-t-amber-400' : ''}`}
    >
      {/* Top: PAFL & SEL Buttons */}
      <div className="space-y-1">
        {/* PAFL */}
        <button
          onClick={() => toggleChannelPAFL(channel.id)}
          className={`w-full py-1 text-[10px] font-bold font-mono rounded transition-colors ${
            channel.pafl
              ? 'bg-amber-400 text-black'
              : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:bg-zinc-800 hover:text-white'
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
          title={isSelected ? 'Selected (Click to view Processing)' : 'Select Channel'}
          className={`w-full py-1 text-[10px] font-bold font-mono rounded transition-colors ${
            isSelected
              ? 'bg-white text-black font-semibold'
              : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:bg-zinc-800 hover:text-white'
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
            className={`w-full py-0.5 text-[9px] font-mono font-bold rounded border transition-colors ${
              currentSend.preFade
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/50'
                : 'bg-black text-zinc-400 border-white/[0.08] hover:text-white'
            }`}
            title="Toggle Pre-Fade / Post-Fade send point"
          >
            {currentSend.preFade ? 'PRE' : 'POST'}
          </button>
        </div>
      )}

      {/* Center Fader Well & LED Meter */}
      <div className="flex-1 flex justify-center items-center py-2 space-x-1.5">
        {/* Vertical LED Meter Bar (Dual L/R for stereo, single for mono) */}
        {channel.stereo ? (
          <div className="flex items-center space-x-1" title="Stereo Left / Right Meters">
            {renderMeterBar(hasSignalL, 'w-1.5', 'Left Meter')}
            {renderMeterBar(hasSignalR, 'w-1.5', 'Right Meter')}
          </div>
        ) : (
          renderMeterBar(hasSignalL, 'w-2', 'Channel Meter')
        )}

        {/* Fader Track & Knob */}
        <div className="h-72 flex items-center justify-center relative">
          <input
            type="range"
            min="-90"
            max="10"
            step="0.5"
            disabled={isGuest}
            value={faderVal}
            onChange={handleFaderChange}
            role="slider"
            aria-label={`${channel.name} channel volume fader`}
            aria-valuemin={-90}
            aria-valuemax={10}
            aria-valuenow={faderVal}
            aria-valuetext={faderVal <= -85 ? 'Minus Infinity dB' : `${faderVal.toFixed(1)} dB`}
            className={`fader-slider fader-vertical ${
              isGuest ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            }`}
          />
        </div>
      </div>

      {/* dB readout */}
      <div className="text-center font-mono text-[10px] text-zinc-400 py-0.5 bg-black rounded border border-white/[0.06] my-1 tabular-nums">
        {faderVal <= -85 ? '-∞' : `${faderVal > 0 ? '+' : ''}${faderVal.toFixed(1)} dB`}
      </div>

      {/* Mute / Mix Assignment Button */}
      <div className="space-y-1">
        <button
          onClick={handleMuteOrAssignClick}
          disabled={isGuest}
          aria-label={isSendsOnFaders ? `Toggle Mix Assignment for ${channel.name}` : `Mute ${channel.name}`}
          className={`w-full py-1.5 text-[10px] font-bold font-mono rounded transition-colors ${
            isGuest ? 'cursor-not-allowed opacity-60' : ''
          } ${
            isSendsOnFaders
              ? currentSend.assigned
                ? 'bg-amber-400 text-black font-semibold'
                : 'bg-zinc-900 text-zinc-500 border border-white/[0.06]'
              : channel.mute
              ? 'bg-red-600 text-white font-semibold'
              : isDcaMuted
              ? 'bg-red-950/60 text-red-300 border border-red-800'
              : 'bg-zinc-900 text-zinc-300 border border-white/[0.06] hover:bg-zinc-800 hover:text-white'
          }`}
        >
          {isSendsOnFaders
            ? currentSend.assigned
              ? 'ASSIGNED'
              : 'OFF'
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
          className="p-1.5 rounded bg-black border border-white/[0.08] cursor-pointer hover:border-white/20 transition-colors"
          title="Click to select, double-click to view channel processing"
        >
          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-0.5">
            <div className="flex items-center space-x-1">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: channel.color || '#71717a' }}
              />
              <span>
                {channel.stereo ? `CH ${channel.channelNumber}-${channel.channelNumber + 1}` : `CH ${channel.channelNumber}`}
              </span>
            </div>
            {channel.stereo && (
              <span className="px-1 rounded bg-zinc-800 text-zinc-300 text-[8px] font-bold">
                ST
              </span>
            )}
          </div>
          <div
            className="text-[11px] font-medium text-zinc-200 truncate"
            title={channel.stereo ? `${channel.name} (Stereo Pair)` : channel.name}
          >
            {channel.stereo && channel.name.endsWith(' L') ? `${channel.name.replace(/ L$/, '')} L/R` : channel.name}
          </div>
        </div>
      </div>
    </div>
  );
};

