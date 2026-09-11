import React, { useState } from 'react';
import { HelpCircle, Search, BookOpen } from 'lucide-react';

export const HelpScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const glossaryItems = [
    {
      term: 'dSNAKE',
      category: 'hardware',
      short: 'Allen & Heath 48kHz digital multicore protocol over Cat5e.',
      long: 'Transmits up to 40 audio channels to the console and 20 return channels over standard Cat5e STP cable up to 100 meters, eliminating heavy analog copper snakes.'
    },
    {
      term: 'Pre-fade vs Post-fade',
      category: 'routing',
      short: 'Tap point before or after the channel volume fader.',
      long: 'Musician in-ear monitors (IEMs) should always be pre-fade so that Front-of-House (FOH) volume adjustments during the service do not change what the musician hears in their ears.'
    },
    {
      term: 'DCA (Digitally Controlled Amplifier)',
      category: 'mixing',
      short: 'Controls the combined volume of multiple channels with a single fader.',
      long: 'Unlike an audio subgroup, a DCA does not sum or process audio. It digitally offsets the volume of assigned member channels while preserving their individual relative balance.'
    },
    {
      term: 'DI Box (Direct Injection)',
      category: 'hardware',
      short: 'Converts high-impedance unbalanced instrument signals (1/4") to low-impedance balanced mic signals (XLR).',
      long: 'Required for electric guitars, acoustic guitars, keyboards, and bass guitars to prevent high-frequency loss, hum, impedance mismatch, and level distortion when plugging into stagebox mic inputs.'
    },
    {
      term: '+48V Phantom Power',
      category: 'processing',
      short: 'DC voltage sent over the balanced XLR cable to power condenser microphones and active DI boxes.',
      long: 'Dynamic microphones (like the Shure SM58 or Beta 52A) do not require phantom power. Condenser microphones (overheads, hihats, choir/ambient) require +48V to polarize their capsule.'
    },
    {
      term: 'GEQ Fader Flip',
      category: 'surface',
      short: 'Maps the 28-band Graphic EQ directly onto the physical console fader strips.',
      long: 'Allows rapid physical feedback control for monitor wedges or room tuning without having to turn individual rotary encoders on a screen.'
    },
    {
      term: 'Click & Comms Isolation',
      category: 'routing',
      short: 'Routing rule preventing metronomes and talkback mics from reaching audience speakers.',
      long: 'Metronome click tracks and stage talkback microphones must be routed exclusively to musician IEM aux mixes. Never assign them to Main LR, line arrays, subwoofers, or livestream outputs.'
    }
  ];

  const filtered = glossaryItems.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.long.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto select-none font-sans text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white uppercase font-mono">
            Audio Engineering &amp; SQ-5 Knowledge Base
          </h2>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search audio terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.term}
            className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 hover:border-sky-500/50 transition-all shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-sky-300 font-mono">{item.term}</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                {item.category}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{item.short}</p>
            <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
              {item.long}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
