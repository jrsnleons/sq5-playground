import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

export const MobileBlockScreen: React.FC = () => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isPhoneDevice, setIsPhoneDevice] = useState<boolean>(false);

  useEffect(() => {
    const evaluateDevice = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });

      const ua = navigator.userAgent || '';
      const isPhoneUA =
        (/Android/i.test(ua) && /Mobile/i.test(ua)) ||
        /iPhone|iPod/i.test(ua) ||
        /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

      setIsPhoneDevice(isPhoneUA);

      // Block if width < 768px (standard phone portrait / small screens)
      // Block if mobile phone in landscape (height < 600 or width < 1024)
      // Block if height < 500px on any device (cannot accommodate SQ-5 mixer vertical faders & matrix)
      const shouldBlock = w < 768 || (isPhoneUA && (h < 600 || w < 1024)) || h < 500;
      setIsMobile(shouldBlock);
    };

    evaluateDevice();
    window.addEventListener('resize', evaluateDevice);
    window.addEventListener('orientationchange', evaluateDevice);

    return () => {
      window.removeEventListener('resize', evaluateDevice);
      window.removeEventListener('orientationchange', evaluateDevice);
    };
  }, []);

  if (!isMobile) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="mobile-block-title"
      aria-describedby="mobile-block-desc"
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 select-none overflow-y-auto font-sans"
    >
      {/* Background Decorative Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.3) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-md space-y-6 text-center">
        {/* Top Hardware Warning Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-600/60 text-amber-300 text-xs font-mono font-bold tracking-wide uppercase">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Hardware Display Restriction</span>
        </div>

        {/* Icon & Headline */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-3 text-sky-400 py-1">
            <div className="relative">
              <Smartphone className="w-10 h-10 text-rose-400" />
              <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-slate-600 font-mono text-xl">→</span>
            <div className="relative">
              <Tablet className="w-9 h-9 text-teal-400" />
              <div className="absolute -top-1 -right-1 bg-teal-500 text-slate-950 rounded-full p-0.5 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="relative">
              <Monitor className="w-10 h-10 text-sky-400" />
              <div className="absolute -top-1 -right-1 bg-teal-500 text-slate-950 rounded-full p-0.5 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <h1 id="mobile-block-title" className="text-lg sm:text-xl font-bold text-white font-mono uppercase tracking-tight">
            Tablet or Desktop Required
          </h1>
          <p id="mobile-block-desc" className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The <strong>Allen &amp; Heath SQ-5 Simulator</strong> requires a minimum screen resolution of{' '}
            <span className="text-sky-300 font-mono font-bold">768px width</span> (iPad, Tablet, or Desktop).
            Mobile phone screens cannot accommodate the 48-channel fader ribbons, physical stage patchbay, and 12-bus routing matrices.
          </p>
        </div>

        {/* Supported Device Matrix */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3.5 space-y-2.5 text-left font-mono text-xs">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800/80 pb-1">
            Device Compatibility Matrix
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200">
              <Monitor className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Desktop / Laptop</span>
            </div>
            <span className="flex items-center space-x-1 text-teal-400 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SUPPORTED</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200">
              <Tablet className="w-4 h-4 text-teal-400 shrink-0" />
              <span>iPad / Android Tablet</span>
            </div>
            <span className="flex items-center space-x-1 text-teal-400 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SUPPORTED (768px+)</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-400">
              <Smartphone className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Mobile Phone</span>
            </div>
            <span className="flex items-center space-x-1 text-rose-400 font-bold text-[11px]">
              <XCircle className="w-3.5 h-3.5" />
              <span>NOT SUPPORTED</span>
            </span>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        <div className="bg-slate-950/60 rounded-lg border border-slate-800/80 p-3 space-y-1.5 text-left font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Detected Display:</span>
            <span className="text-white font-bold">
              {dimensions.width} × {dimensions.height} px
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Device Classification:</span>
            <span className={isPhoneDevice ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
              {isPhoneDevice ? 'Mobile Phone' : 'Compact Viewport (< 768px)'}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Required Minimum:</span>
            <span className="text-sky-400 font-bold">768 × 500 px</span>
          </div>
        </div>

        {/* Action Prompt */}
        <div className="pt-1 text-xs text-slate-400 space-y-2">
          {!isPhoneDevice && (
            <div className="flex items-center justify-center space-x-1.5 text-sky-400">
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>Maximize or expand your browser window to unlock</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Please switch to an iPad, Android Tablet, or Desktop/Laptop browser to continue.
          </p>
        </div>
      </div>
    </div>
  );
};
