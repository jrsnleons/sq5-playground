import React from 'react';
import { Sparkles, Sliders } from 'lucide-react';

export const FXScreen: React.FC = () => {
  const fxSlots = [
    { id: 1, name: 'SMR Reverb (Vocal Hall)', mode: 'Send-Return', returnChan: 'FX Ret 1' },
    { id: 2, name: 'Stereo Tap Delay', mode: 'Send-Return', returnChan: 'FX Ret 2' },
    { id: 3, name: 'ADT Doubler', mode: 'Send-Return', returnChan: 'FX Ret 3' },
    { id: 4, name: 'Symphonic Chorus', mode: 'Send-Return', returnChan: 'FX Ret 4' },
    { id: 5, name: 'Drum Room Reverb', mode: 'Send-Return', returnChan: 'FX Ret 5' },
    { id: 6, name: 'Gated Verb', mode: 'Send-Return', returnChan: 'FX Ret 6' },
    { id: 7, name: 'Acoustic Plate', mode: 'Send-Return', returnChan: 'FX Ret 7' },
    { id: 8, name: 'MOO 12-Stage Phaser', mode: 'Send-Return', returnChan: 'FX Ret 8' }
  ];

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto select-none font-sans text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white uppercase font-mono">
            8 Stereo RackExtra FX Engines
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">SQ-5 V1.6.0 FX RACK</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {fxSlots.map((fx) => (
          <div
            key={fx.id}
            className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 hover:border-amber-500/60 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400">FX {fx.id}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                {fx.mode}
              </span>
            </div>

            <div className="font-bold text-slate-200 text-sm">{fx.name}</div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
              <span>Return: {fx.returnChan}</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
