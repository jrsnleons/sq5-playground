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
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden select-none font-sans text-slate-100">
      {/* Top Channel Header */}
      <div className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono uppercase text-slate-400">Processing:</span>
          <span className="text-sm font-black text-sky-400 font-mono">
            CH {channel.channelNumber} — {channel.name}
          </span>
        </div>

        {/* Processing Chain Tabs (in documented SQ order!) */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveBlock('preamp')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              activeBlock === 'preamp' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Preamp
          </button>
          <button
            onClick={() => setActiveBlock('hpf')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              activeBlock === 'hpf' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            HPF
          </button>
          <button
            onClick={() => setActiveBlock('gate')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              activeBlock === 'gate' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Gate
          </button>
          <button
            onClick={() => setActiveBlock('peq')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              activeBlock === 'peq' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            PEQ
          </button>
          <button
            onClick={() => setActiveBlock('comp')}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              activeBlock === 'comp' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Compressor
          </button>
        </div>
      </div>

      {/* Main Block Editor */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-center">
        {/* PREAMP BLOCK */}
        {activeBlock === 'preamp' && (
          <div className="max-w-2xl mx-auto w-full bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-sky-400 uppercase font-mono">
                Analog Preamp &amp; Polarity
              </span>
              <span className="text-xs text-slate-500 font-mono">0 dB to +60 dB</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Gain Rotary */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Gain</span>
                <span className="text-xl font-mono font-black text-amber-400">
                  +{channel.preamp.gainDb} dB
                </span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={channel.preamp.gainDb}
                  onChange={(e) => updateChannelPreamp(channel.id, { gainDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              {/* Trim */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Trim</span>
                <span className="text-xl font-mono font-black text-slate-200">
                  {channel.preamp.trimDb > 0 ? '+' : ''}{channel.preamp.trimDb} dB
                </span>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  value={channel.preamp.trimDb}
                  onChange={(e) => updateChannelPreamp(channel.id, { trimDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              {/* +48V Phantom */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between items-center">
                <span className="text-[10px] uppercase font-mono text-slate-400">Phantom</span>
                <button
                  onClick={() => updateChannelPreamp(channel.id, { phantom48V: !channel.preamp.phantom48V })}
                  className={`w-14 py-2 rounded text-xs font-bold font-mono transition-colors ${
                    channel.preamp.phantom48V
                      ? 'bg-rose-600 text-white shadow-[0_0_8px_#e11d48]'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  +48V
                </button>
                <span className="text-[9px] text-slate-500">Condensers only</span>
              </div>

              {/* Pad -20dB */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between items-center">
                <span className="text-[10px] uppercase font-mono text-slate-400">Pad</span>
                <button
                  onClick={() => updateChannelPreamp(channel.id, { pad: !channel.preamp.pad })}
                  className={`w-14 py-2 rounded text-xs font-bold font-mono transition-colors ${
                    channel.preamp.pad
                      ? 'bg-amber-600 text-white shadow-[0_0_8px_#d97706]'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  -20dB
                </button>
                <span className="text-[9px] text-slate-500">Hot inputs</span>
              </div>
            </div>
          </div>
        )}

        {/* HPF BLOCK */}
        {activeBlock === 'hpf' && (
          <div className="max-w-xl mx-auto w-full bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-sky-400 uppercase font-mono">
                High Pass Filter (HPF)
              </span>
              <button
                onClick={() => updateChannelHPF(channel.id, { enabled: !channel.hpf.enabled })}
                className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                  channel.hpf.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {channel.hpf.enabled ? 'IN (ACTIVE)' : 'OUT (BYPASS)'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs uppercase font-mono text-slate-400">Frequency</span>
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
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-xs uppercase font-mono text-slate-400">Slope (Butterworth)</span>
                <div className="flex space-x-2">
                  {([12, 18, 24] as const).map((slope) => (
                    <button
                      key={slope}
                      onClick={() => updateChannelHPF(channel.id, { slopeDbOct: slope })}
                      className={`px-3 py-1 text-xs rounded font-mono ${
                        channel.hpf.slopeDbOct === slope
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400'
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
          <div className="max-w-2xl mx-auto w-full bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-sky-400 uppercase font-mono">
                Noise Gate
              </span>
              <button
                onClick={() => updateChannelGate(channel.id, { enabled: !channel.gate.enabled })}
                className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                  channel.gate.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {channel.gate.enabled ? 'IN' : 'OUT'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Threshold</span>
                <div className="text-lg font-mono font-bold text-amber-400">{channel.gate.thresholdDb} dB</div>
                <input
                  type="range"
                  min="-72"
                  max="18"
                  value={channel.gate.thresholdDb}
                  onChange={(e) => updateChannelGate(channel.id, { thresholdDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Depth</span>
                <div className="text-lg font-mono font-bold text-slate-200">{channel.gate.depthDb} dB</div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={channel.gate.depthDb}
                  onChange={(e) => updateChannelGate(channel.id, { depthDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Hold</span>
                <div className="text-lg font-mono font-bold text-slate-200">{channel.gate.holdMs} ms</div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={channel.gate.holdMs}
                  onChange={(e) => updateChannelGate(channel.id, { holdMs: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* PEQ BLOCK (4 Bands with interactive visual SVG) */}
        {activeBlock === 'peq' && (
          <div className="max-w-3xl mx-auto w-full bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-sky-400 uppercase font-mono">
                4-Band Parametric Equalizer (PEQ)
              </span>
              <button
                onClick={() => toggleChannelPEQ(channel.id)}
                className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                  channel.peq.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {channel.peq.enabled ? 'IN' : 'OUT'}
              </button>
            </div>

            {/* EQ Curve Display */}
            <div className="w-full h-36 bg-slate-950 rounded-lg border border-slate-800 p-2 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 400 120">
                {/* Grid lines */}
                <line x1="0" y1="60" x2="400" y2="60" stroke="#334155" strokeDasharray="3 3" />
                <line x1="100" y1="0" x2="100" y2="120" stroke="#1e293b" />
                <line x1="200" y1="0" x2="200" y2="120" stroke="#1e293b" />
                <line x1="300" y1="0" x2="300" y2="120" stroke="#1e293b" />

                {/* EQ Curve line */}
                <path
                  d={`M 0 60 Q 50 ${60 - channel.peq.bands[0].gainDb * 2.5} 100 ${60 - channel.peq.bands[0].gainDb * 2.5} T 200 ${60 - channel.peq.bands[1].gainDb * 2.5} T 300 ${60 - channel.peq.bands[2].gainDb * 2.5} T 400 ${60 - channel.peq.bands[3].gainDb * 2.5}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            {/* 4 Bands Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {channel.peq.bands.map((band, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-center">
                  <span className="text-[10px] font-mono uppercase text-sky-400 block font-bold">
                    Band {idx + 1} ({band.type})
                  </span>
                  <div className="text-xs font-mono font-bold text-amber-300">
                    {band.gainDb > 0 ? '+' : ''}{band.gainDb.toFixed(1)} dB
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={band.gainDb}
                    onChange={(e) => updateChannelPEQBand(channel.id, idx, { gainDb: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer accent-sky-500"
                  />
                  <div className="text-[9px] text-slate-400 font-mono">
                    Freq: {band.frequencyHz >= 1000 ? `${(band.frequencyHz / 1000).toFixed(1)}k` : `${band.frequencyHz}`} Hz
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPRESSOR BLOCK */}
        {activeBlock === 'comp' && (
          <div className="max-w-2xl mx-auto w-full bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-sky-400 uppercase font-mono">
                Channel Compressor
              </span>
              <button
                onClick={() => updateChannelCompressor(channel.id, { enabled: !channel.compressor.enabled })}
                className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                  channel.compressor.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {channel.compressor.enabled ? 'IN' : 'OUT'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Threshold</span>
                <div className="text-lg font-mono font-bold text-amber-400">{channel.compressor.thresholdDb} dB</div>
                <input
                  type="range"
                  min="-46"
                  max="18"
                  value={channel.compressor.thresholdDb}
                  onChange={(e) => updateChannelCompressor(channel.id, { thresholdDb: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Ratio</span>
                <div className="text-lg font-mono font-bold text-slate-200">{channel.compressor.ratio}:1</div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={channel.compressor.ratio}
                  onChange={(e) => updateChannelCompressor(channel.id, { ratio: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Attack</span>
                <div className="text-lg font-mono font-bold text-slate-200">{(channel.compressor.attackUs / 1000).toFixed(1)} ms</div>
                <input
                  type="range"
                  min="30"
                  max="100000"
                  step="500"
                  value={channel.compressor.attackUs}
                  onChange={(e) => updateChannelCompressor(channel.id, { attackUs: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Release</span>
                <div className="text-lg font-mono font-bold text-slate-200">{channel.compressor.releaseMs} ms</div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="20"
                  value={channel.compressor.releaseMs}
                  onChange={(e) => updateChannelCompressor(channel.id, { releaseMs: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
