import React, { useState } from 'react';
import { Sparkles, Sliders, Power } from 'lucide-react';
import { useSimulationStore } from '../../../store/simulationStore';

interface FXEngineParams {
  param1: number; // Decay or Time
  param2: number; // Pre-delay or Feedback
  mix: number;    // Wet / Dry %
  active: boolean;
}

export const FXScreen: React.FC = () => {
  const { userRole, setToastNotice } = useSimulationStore();
  const isGuest = userRole === 'guest';

  const initialEngines = [
    { id: 1, name: 'SMR Reverb (Vocal Hall)', mode: 'Send-Return', returnChan: 'FX Ret 1', p1Label: 'Decay', p1Min: 0.5, p1Max: 8.0, p1Step: 0.1, p1Unit: 's', p2Label: 'Pre-delay', p2Min: 0, p2Max: 150, p2Step: 5, p2Unit: 'ms' },
    { id: 2, name: 'Stereo Tap Delay', mode: 'Send-Return', returnChan: 'FX Ret 2', p1Label: 'Delay Time', p1Min: 50, p1Max: 1200, p1Step: 10, p1Unit: 'ms', p2Label: 'Feedback', p2Min: 0, p2Max: 90, p2Step: 1, p2Unit: '%' },
    { id: 3, name: 'ADT Doubler', mode: 'Send-Return', returnChan: 'FX Ret 3', p1Label: 'Detune', p1Min: 1, p1Max: 50, p1Step: 1, p1Unit: 'cents', p2Label: 'Separation', p2Min: 5, p2Max: 60, p2Step: 1, p2Unit: 'ms' },
    { id: 4, name: 'Symphonic Chorus', mode: 'Send-Return', returnChan: 'FX Ret 4', p1Label: 'Rate', p1Min: 0.1, p1Max: 10.0, p1Step: 0.1, p1Unit: 'Hz', p2Label: 'Depth', p2Min: 0, p2Max: 100, p2Step: 1, p2Unit: '%' },
    { id: 5, name: 'Drum Room Reverb', mode: 'Send-Return', returnChan: 'FX Ret 5', p1Label: 'Decay', p1Min: 0.3, p1Max: 4.0, p1Step: 0.1, p1Unit: 's', p2Label: 'Pre-delay', p2Min: 0, p2Max: 80, p2Step: 5, p2Unit: 'ms' },
    { id: 6, name: 'Gated Verb', mode: 'Send-Return', returnChan: 'FX Ret 6', p1Label: 'Gate Time', p1Min: 50, p1Max: 500, p1Step: 10, p1Unit: 'ms', p2Label: 'Threshold', p2Min: -40, p2Max: 0, p2Step: 1, p2Unit: 'dB' },
    { id: 7, name: 'Acoustic Plate', mode: 'Send-Return', returnChan: 'FX Ret 7', p1Label: 'Decay', p1Min: 0.4, p1Max: 6.0, p1Step: 0.1, p1Unit: 's', p2Label: 'Pre-delay', p2Min: 0, p2Max: 100, p2Step: 5, p2Unit: 'ms' },
    { id: 8, name: 'MOO 12-Stage Phaser', mode: 'Send-Return', returnChan: 'FX Ret 8', p1Label: 'Rate', p1Min: 0.1, p1Max: 8.0, p1Step: 0.1, p1Unit: 'Hz', p2Label: 'Resonance', p2Min: 0, p2Max: 100, p2Step: 1, p2Unit: '%' }
  ];

  const [engineState, setEngineState] = useState<Record<number, FXEngineParams>>({
    1: { param1: 2.4, param2: 25, mix: 100, active: true },
    2: { param1: 375, param2: 35, mix: 100, active: true },
    3: { param1: 12, param2: 20, mix: 80, active: true },
    4: { param1: 1.2, param2: 50, mix: 75, active: true },
    5: { param1: 1.1, param2: 10, mix: 100, active: true },
    6: { param1: 220, param2: -18, mix: 100, active: true },
    7: { param1: 2.8, param2: 15, mix: 100, active: true },
    8: { param1: 0.8, param2: 60, mix: 70, active: true }
  });

  const updateParam = (id: number, key: keyof FXEngineParams, val: any) => {
    if (isGuest) {
      setToastNotice({ message: 'FX editing is locked in Guest mode.', type: 'info' });
      return;
    }
    setEngineState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: val
      }
    }));
  };

  return (
    <div className="h-full bg-black p-6 overflow-y-auto select-none font-sans text-neutral-100">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-white uppercase font-mono tracking-wide">
            8 Stereo RackExtra FX Engines
          </h2>
        </div>
        <span className="text-xs text-neutral-500 font-mono">SQ-5 V1.6.0 FX RACK</span>
      </div>

      {isGuest && (
        <div className="mb-5 px-4 py-2 rounded-lg bg-neutral-900 border border-white/[0.08] text-xs font-mono text-neutral-400 flex items-center justify-between">
          <span>Read-only view. Sign in as a team member or administrator to edit FX engine parameters and bypass states.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {initialEngines.map((fx) => {
          const st = engineState[fx.id] || { param1: 2.0, param2: 20, mix: 100, active: true };

          return (
            <div
              key={fx.id}
              className={`p-4 bg-[#0A0A0A] rounded-xl border transition-all space-y-3 ${
                st.active ? 'border-white/[0.12] hover:border-white/30' : 'border-white/[0.04] opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-400">FX {fx.id}</span>
                <button
                  type="button"
                  onClick={() => updateParam(fx.id, 'active', !st.active)}
                  disabled={isGuest}
                  className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border transition-colors ${
                    isGuest ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  } ${
                    st.active
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-neutral-900 text-neutral-500 border-white/[0.08]'
                  }`}
                >
                  <Power className="w-2.5 h-2.5" />
                  <span>{st.active ? 'ACTIVE' : 'BYPASS'}</span>
                </button>
              </div>

              <div className="font-semibold text-neutral-200 text-sm">{fx.name}</div>

              {/* Sliders */}
              <div className="space-y-2.5 pt-1">
                {/* Param 1 */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span>{fx.p1Label}</span>
                    <span className="text-white font-medium">{st.param1}{fx.p1Unit}</span>
                  </div>
                  <input
                    type="range"
                    min={fx.p1Min}
                    max={fx.p1Max}
                    step={fx.p1Step}
                    value={st.param1}
                    disabled={!st.active || isGuest}
                    onChange={(e) => updateParam(fx.id, 'param1', parseFloat(e.target.value))}
                    className={`w-full accent-white ${isGuest ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} disabled:opacity-40`}
                  />
                </div>

                {/* Param 2 */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span>{fx.p2Label}</span>
                    <span className="text-white font-medium">{st.param2}{fx.p2Unit}</span>
                  </div>
                  <input
                    type="range"
                    min={fx.p2Min}
                    max={fx.p2Max}
                    step={fx.p2Step}
                    value={st.param2}
                    disabled={!st.active || isGuest}
                    onChange={(e) => updateParam(fx.id, 'param2', parseFloat(e.target.value))}
                    className={`w-full accent-white ${isGuest ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} disabled:opacity-40`}
                  />
                </div>

                {/* Mix % */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span>Wet Mix</span>
                    <span className="text-neutral-300 font-medium">{st.mix}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={st.mix}
                    disabled={!st.active || isGuest}
                    onChange={(e) => updateParam(fx.id, 'mix', parseInt(e.target.value, 10))}
                    className={`w-full accent-white ${isGuest ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} disabled:opacity-40`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-[10px] text-neutral-400 font-mono">
                <span>Return: {fx.returnChan}</span>
                <span className="text-neutral-500">{fx.mode}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
