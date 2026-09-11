import React from 'react';
import { SignalType } from '@foh-sim/simulation-core';

interface PhysicalPlugGraphicProps {
  signalType?: SignalType;
  connectorType?: 'xlr' | 'ethercon' | 'trs' | 'usb';
  direction?: 'up' | 'down';
  isTraced?: boolean;
  className?: string;
}

export const PhysicalPlugGraphic: React.FC<PhysicalPlugGraphicProps> = ({
  signalType = 'generic',
  connectorType = 'xlr',
  direction = 'up',
  isTraced = false,
  className = ''
}) => {
  // Only render when the device or socket is clicked / active trace
  if (!isTraced) {
    return null;
  }

  const getSignalColor = () => {
    switch (signalType) {
      case 'mic':
        return '#38bdf8'; // Sky blue
      case 'instrument':
        return '#fb923c'; // Orange
      case 'dsnake':
        return '#34d399'; // Emerald green
      case 'iem':
        return '#2dd4bf'; // Teal
      case 'click':
      case 'comms':
        return '#facc15'; // Yellow
      case 'speaker':
        return '#94a3b8'; // Slate
      case 'usb':
        return '#fbbf24'; // Amber
      case 'video':
        return '#818cf8'; // Indigo
      default:
        return '#38bdf8';
    }
  };

  const signalColor = getSignalColor();
  const isDown = direction === 'down';

  // Minimalist EtherCon Indicator (Only on Active Trace)
  if (connectorType === 'ethercon') {
    return (
      <div
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 flex items-center justify-center ${
          isDown ? 'top-full mt-0.5' : 'bottom-full mb-0.5'
        } ${className}`}
      >
        <div
          style={{ borderColor: signalColor, boxShadow: `0 0 10px ${signalColor}` }}
          className="w-5 h-4 rounded bg-slate-950/95 border-2 flex items-center justify-center relative"
        >
          <div
            style={{ backgroundColor: signalColor }}
            className="w-2.5 h-1.5 rounded-2xs animate-pulse"
          />
        </div>
      </div>
    );
  }

  // Minimalist USB Indicator (Only on Active Trace)
  if (connectorType === 'usb') {
    return (
      <div
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 flex items-center justify-center ${
          isDown ? 'top-full mt-0.5' : 'bottom-full mb-0.5'
        } ${className}`}
      >
        <div
          style={{ borderColor: signalColor, boxShadow: `0 0 10px ${signalColor}` }}
          className="w-4 h-3.5 rounded bg-slate-950/95 border-2 flex items-center justify-center"
        >
          <div
            style={{ backgroundColor: signalColor }}
            className="w-2 h-1 rounded-2xs animate-pulse"
          />
        </div>
      </div>
    );
  }

  // Minimalist Precision XLR Dot & Ring Indicator (Only on Active Trace)
  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none ${
        isDown ? 'top-full mt-0.5' : 'bottom-full mb-0.5'
      } ${className}`}
    >
      {/* Precision Circular XLR Pin Disc */}
      <div
        style={{
          borderColor: signalColor,
          boxShadow: `0 0 10px ${signalColor}, inset 0 0 4px ${signalColor}40`
        }}
        className="w-4 h-4 rounded-full bg-slate-950/95 border-2 flex items-center justify-center relative"
      >
        {/* Minimalist 3-Pin XLR Configuration */}
        <div className="relative w-2 h-2">
          {/* Top Pin 1 */}
          <span
            style={{ backgroundColor: signalColor }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full shadow-[0_0_2px_currentColor]"
          />
          {/* Bottom Left Pin 2 */}
          <span
            style={{ backgroundColor: signalColor }}
            className="absolute bottom-0 left-0 w-0.5 h-0.5 rounded-full shadow-[0_0_2px_currentColor]"
          />
          {/* Bottom Right Pin 3 */}
          <span
            style={{ backgroundColor: signalColor }}
            className="absolute bottom-0 right-0 w-0.5 h-0.5 rounded-full shadow-[0_0_2px_currentColor]"
          />
        </div>

        {/* Outer Expanding Pulse Beacon */}
        <span
          style={{ borderColor: signalColor }}
          className="absolute -inset-1 rounded-full border border-current opacity-75 animate-ping pointer-events-none"
        />
      </div>

      {/* Subtle Mini Lead Tip */}
      <div
        style={{ backgroundColor: signalColor }}
        className="w-0.5 h-1 opacity-80"
      />
    </div>
  );
};
