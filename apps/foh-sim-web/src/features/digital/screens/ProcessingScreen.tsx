import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/simulationStore';
import { Zap, Activity, Filter, Volume2, Shield } from 'lucide-react';

export const ProcessingScreen: React.FC = () => {
  const {
    sim,
    updateChannelPreamp,
    updateChannelHPF,
    updateChannelGate,
    updateChannelPEQBand,
    toggleChannelPEQ,
    updateChannelCompressor
  } = useSimulationStore();

  const selectedChId = sim.digital.session.selectedChannelId;
  const channel = sim.digital.channels.find((c) => c.id === selectedChId) || sim.digital.channels[0];
  const [activeBlock, setActiveBlock] = useState<'preamp' | 'hpf' | 'gate' | 'peq' | 'comp'>('peq');

  return (
    <div className="h-full bg-black flex flex-col overflow-hidden select-none font-sans text-zinc-100">
      {/* Top Channel Header */}
      <div className="h-11 bg-black border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono uppercase text-zinc-500">Processing:</span>
          <span className="text-sm font-semibold text-zinc-100 font-mono">
            CH {channel.channelNumber}: {channel.name}
          </span>
        </div>

        {/* Processing Chain Tabs */}
        <div className="flex items-center space-x-1 bg-zinc-950 p-0.5 rounded-lg border border-white/[0.06]">
          {(['preamp', 'hpf', 'gate', 'peq', 'comp'] as const).map((block) => (
            <button
              key={block}
              onClick={() => setActiveBlock(block)}
              className={`px-3 py-1 text-xs rounded-md font-mono uppercase transition-colors ${
                activeBlock === block
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {block === 'comp' ? 'Compressor' : block}
            </button>
          ))}
        </div>
      </div>

      {/* Main Block Editor */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-center">
        {/* PREAMP BLOCK */}
        {activeBlock === 'preamp' && (
          <div className="max-w-2xl mx-auto w-full bg-[#0A0A0A] p-6 rounded-xl border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-semibold text-zinc-100 uppercase font-mono">
                Analog Preamp &amp; Polarity
              </span>
              <span className="text-xs text-zinc-500 font-mono">0 dB to +60 dB</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Gain Rotary */}
              <div className="p-3 bg-black rounded-lg border border-white/[0.06] text-center space-y-2">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Gain</span>
                <span className="text-xl font-mono font-bold text-amber-400">
                  +{channel.preamp.gainDb} dB
                </span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={channel.preamp.gainDb}
                  onChange={(e) => updateChannelPreamp(channel.id, { gainDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              {/* Trim */}
              <div className="p-3 bg-black rounded-lg border border-white/[0.06] text-center space-y-2">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Trim</span>
                <span className="text-xl font-mono font-bold text-zinc-200">
                  {channel.preamp.trimDb > 0 ? '+' : ''}{channel.preamp.trimDb} dB
                </span>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  value={channel.preamp.trimDb}
                  onChange={(e) => updateChannelPreamp(channel.id, { trimDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              {/* +48V Phantom */}
              <div className="p-3 bg-black rounded-lg border border-white/[0.06] flex flex-col justify-between items-center">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Phantom</span>
                <button
                  onClick={() => updateChannelPreamp(channel.id, { phantom48V: !channel.preamp.phantom48V })}
                  className={`w-14 py-2 rounded text-xs font-bold font-mono transition-colors ${
                    channel.preamp.phantom48V
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  +48V
                </button>
                <span className="text-[9px] text-zinc-500">Condensers</span>
              </div>

              {/* Pad -20dB */}
              <div className="p-3 bg-black rounded-lg border border-white/[0.06] flex flex-col justify-between items-center">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Pad</span>
                <button
                  onClick={() => updateChannelPreamp(channel.id, { pad: !channel.preamp.pad })}
                  className={`w-14 py-2 rounded text-xs font-bold font-mono transition-colors ${
                    channel.preamp.pad
                      ? 'bg-amber-400 text-black'
                      : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  -20dB
                </button>
                <span className="text-[9px] text-zinc-500">Hot inputs</span>
              </div>
            </div>
          </div>
        )}

        {/* HPF BLOCK */}
        {activeBlock === 'hpf' && (
          <div className="max-w-xl mx-auto w-full bg-[#0A0A0A] p-6 rounded-xl border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-semibold text-zinc-100 uppercase font-mono">
                High Pass Filter (HPF)
              </span>
              <button
                onClick={() => updateChannelHPF(channel.id, { enabled: !channel.hpf.enabled })}
                className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                  channel.hpf.enabled ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-white/[0.06]'
                }`}
              >
                {channel.hpf.enabled ? 'IN (ACTIVE)' : 'OUT (BYPASS)'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black rounded-lg border border-white/[0.06] space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs uppercase font-mono text-zinc-500">Frequency</span>
                  <span className="text-base font-mono font-bold text-amber-400">
                    {channel.hpf.frequencyHz} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="2000"
                  step="5"
                  value={channel.hpf.frequencyHz}
                  onChange={(e) => updateChannelHPF(channel.id, { frequencyHz: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              <div className="p-4 bg-black rounded-lg border border-white/[0.06] flex items-center justify-between">
                <span className="text-xs uppercase font-mono text-zinc-500">Slope (Butterworth)</span>
                <div className="flex space-x-2">
                  {([12, 18, 24] as const).map((slope) => (
                    <button
                      key={slope}
                      onClick={() => updateChannelHPF(channel.id, { slopeDbOct: slope })}
                      className={`px-3 py-1 text-xs rounded font-mono transition-colors ${
                        channel.hpf.slopeDbOct === slope
                          ? 'bg-white text-black font-semibold'
                          : 'bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {slope} dB/oct
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GATE BLOCK */}
        {activeBlock === 'gate' && (
          <div className="max-w-2xl mx-auto w-full bg-[#0A0A0A] p-6 rounded-xl border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-semibold text-zinc-100 uppercase font-mono">
                Noise Gate
              </span>
              <button
                onClick={() => updateChannelGate(channel.id, { enabled: !channel.gate.enabled })}
                className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                  channel.gate.enabled ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-white/[0.06]'
                }`}
              >
                {channel.gate.enabled ? 'IN' : 'OUT'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Threshold</span>
                <div className="text-lg font-mono font-bold text-amber-400">{channel.gate.thresholdDb} dB</div>
                <input
                  type="range"
                  min="-72"
                  max="18"
                  value={channel.gate.thresholdDb}
                  onChange={(e) => updateChannelGate(channel.id, { thresholdDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              <div className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Depth</span>
                <div className="text-lg font-mono font-bold text-zinc-200">{channel.gate.depthDb} dB</div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={channel.gate.depthDb}
                  onChange={(e) => updateChannelGate(channel.id, { depthDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              <div className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Hold</span>
                <div className="text-lg font-mono font-bold text-zinc-200">{channel.gate.holdMs} ms</div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={channel.gate.holdMs}
                  onChange={(e) => updateChannelGate(channel.id, { holdMs: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* PEQ BLOCK (4 Bands with interactive visual SVG) */}
        {activeBlock === 'peq' && (
          <div className="max-w-3xl mx-auto w-full bg-[#0A0A0A] p-6 rounded-xl border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-semibold text-zinc-100 uppercase font-mono">
                4-Band Parametric Equalizer (PEQ)
              </span>
              <button
                onClick={() => toggleChannelPEQ(channel.id)}
                className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                  channel.peq.enabled ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-white/[0.06]'
                }`}
              >
                {channel.peq.enabled ? 'IN' : 'OUT'}
              </button>
            </div>

            {/* EQ Curve Display */}
            <div className="w-full h-36 bg-black rounded-lg border border-white/[0.08] p-2 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 400 120">
                {/* Grid lines */}
                <line x1="0" y1="60" x2="400" y2="60" stroke="#27272a" strokeDasharray="3 3" />
                <line x1="100" y1="0" x2="100" y2="120" stroke="#18181b" />
                <line x1="200" y1="0" x2="200" y2="120" stroke="#18181b" />
                <line x1="300" y1="0" x2="300" y2="120" stroke="#18181b" />

                {/* EQ Curve line */}
                <path
                  d={`M 0 60 Q 50 ${60 - channel.peq.bands[0].gainDb * 2.5} 100 ${60 - channel.peq.bands[0].gainDb * 2.5} T 200 ${60 - channel.peq.bands[1].gainDb * 2.5} T 300 ${60 - channel.peq.bands[2].gainDb * 2.5} T 400 ${60 - channel.peq.bands[3].gainDb * 2.5}`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* 4 Bands Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {channel.peq.bands.map((band, idx) => (
                <div key={idx} className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-2 text-center">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">
                    Band {idx + 1} ({band.type})
                  </span>
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {band.gainDb > 0 ? '+' : ''}{band.gainDb.toFixed(1)} dB
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={band.gainDb}
                    onChange={(e) => updateChannelPEQBand(channel.id, idx, { gainDb: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer accent-white"
                  />
                  <div className="text-[9px] text-zinc-500 font-mono">
                    Freq: {band.frequencyHz >= 1000 ? `${(band.frequencyHz / 1000).toFixed(1)}k` : `${band.frequencyHz}`} Hz
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPRESSOR BLOCK */}
        {activeBlock === 'comp' && (
          <div className="max-w-2xl mx-auto w-full bg-[#0A0A0A] p-6 rounded-xl border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-semibold text-zinc-100 uppercase font-mono">
                Channel Compressor
              </span>
              <button
                onClick={() => updateChannelCompressor(channel.id, { enabled: !channel.compressor.enabled })}
                className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                  channel.compressor.enabled ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-white/[0.06]'
                }`}
              >
                {channel.compressor.enabled ? 'IN' : 'OUT'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Threshold</span>
                <div className="text-lg font-mono font-bold text-amber-400">{channel.compressor.thresholdDb} dB</div>
                <input
                  type="range"
                  min="-46"
                  max="18"
                  value={channel.compressor.thresholdDb}
                  onChange={(e) => updateChannelCompressor(channel.id, { thresholdDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              <div className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Ratio</span>
                <div className="text-lg font-mono font-bold text-zinc-200">{channel.compressor.ratio}:1</div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={channel.compressor.ratio}
                  onChange={(e) => updateChannelCompressor(channel.id, { ratio: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              <div className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Attack</span>
                <div className="text-lg font-mono font-bold text-zinc-200">{(channel.compressor.attackUs / 1000).toFixed(1)} ms</div>
                <input
                  type="range"
                  min="30"
                  max="100000"
                  step="500"
                  value={channel.compressor.attackUs}
                  onChange={(e) => updateChannelCompressor(channel.id, { attackUs: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>

              <div className="p-3 bg-black rounded-lg border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Release</span>
                <div className="text-lg font-mono font-bold text-zinc-200">{channel.compressor.releaseMs} ms</div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="20"
                  value={channel.compressor.releaseMs}
                  onChange={(e) => updateChannelCompressor(channel.id, { releaseMs: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
