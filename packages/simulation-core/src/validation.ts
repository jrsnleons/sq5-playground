import { Cable, SimulationState, ValidationNotice } from './types';

export function getPortDirection(
  nodeId: string,
  portId: string,
  state: SimulationState
): 'in' | 'out' | 'bidirectional' {
  if (
    portId.includes('slink') ||
    portId.includes('dsnake') ||
    portId.includes('expander') ||
    portId.includes('monitor')
  ) {
    return 'bidirectional';
  }
  if (portId.toLowerCase().includes('usb')) {
    if (portId.includes('in')) return 'in';
    if (portId.includes('out')) return 'out';
    return 'bidirectional';
  }
  if (portId.toLowerCase().includes('hdmi')) {
    if (portId.includes('in')) return 'in';
    if (portId.includes('out') || portId.includes('pgm') || portId.includes('aux')) return 'out';
    return 'bidirectional';
  }
  if (
    portId.startsWith('ar-in-') ||
    portId.startsWith('sq-in-') ||
    portId.startsWith('in-') ||
    portId.endsWith('-in') ||
    portId.includes('-in-')
  ) {
    return 'in';
  }
  if (
    portId.startsWith('ar-out-') ||
    portId.startsWith('sq-out-') ||
    portId.startsWith('out-') ||
    portId.endsWith('-out') ||
    portId.includes('-out-') ||
    portId.startsWith('thru-') ||
    portId.startsWith('main-')
  ) {
    return 'out';
  }

  const item = state.physical.stageItems.find((i) => i.id === nodeId);
  if (item) {
    if (item.category === 'mic' || item.category === 'instrument') return 'out';
    if (item.category === 'speaker' || item.category === 'iem') return 'in';
  }
  return 'bidirectional';
}

export function validateCableConnection(
  fromNode: string,
  fromPort: string,
  toNode: string,
  toPort: string,
  state: SimulationState
): { allowed: boolean; notices: ValidationNotice[] } {
  const notices: ValidationNotice[] = [];

  // Check instrument straight into stagebox/console XLR without DI
  const isFromInstrument = state.physical.stageItems.some(
    (item) => item.id === fromNode && item.category === 'instrument'
  );
  const isToXlrIn = toPort.startsWith('ar-in-') || toPort.startsWith('sq-in-');

  if (isFromInstrument && isToXlrIn && !toPort.includes('footswitch')) {
    // If instrument plugged directly into XLR
    notices.push({
      type: 'error',
      code: 'DI_REQUIRED',
      message: 'Instruments requiring a DI box cannot plug straight into an XLR mic input without a DI box.',
      context: { fromNode, fromPort, toNode, toPort }
    });
    return { allowed: false, notices };
  }

  // Network Cat5e check
  const isFromEtherCon = fromPort.includes('dsnake') || fromPort.includes('slink') || fromPort.includes('expander');
  const isToEtherCon = toPort.includes('dsnake') || toPort.includes('slink') || toPort.includes('expander');
  if (isFromEtherCon !== isToEtherCon) {
    notices.push({
      type: 'error',
      code: 'INVALID_CONNECTOR',
      message: 'Cannot plug network EtherCon/Cat5e into an analog audio port.',
      context: { fromNode, fromPort, toNode, toPort }
    });
    return { allowed: false, notices };
  }

  // USB mismatch check
  const isFromUsb = fromPort.toLowerCase().includes('usb');
  const isToUsb = toPort.toLowerCase().includes('usb');
  if (isFromUsb !== isToUsb && (fromPort.startsWith('ar-') || toPort.startsWith('ar-') || fromPort.startsWith('sq-in') || toPort.startsWith('sq-in'))) {
    notices.push({
      type: 'error',
      code: 'INVALID_CONNECTOR',
      message: 'Cannot plug USB digital interface cable into an analog audio port.',
      context: { fromNode, fromPort, toNode, toPort }
    });
    return { allowed: false, notices };
  }

  // HDMI mismatch check
  const isFromHdmi = fromPort.toLowerCase().includes('hdmi') || fromPort.toLowerCase().includes('pgm');
  const isToHdmi = toPort.toLowerCase().includes('hdmi') || toPort.toLowerCase().includes('pgm');
  if (isFromHdmi !== isToHdmi && (fromPort.startsWith('ar-') || toPort.startsWith('ar-') || fromPort.includes('usb') || toPort.includes('usb'))) {
    notices.push({
      type: 'error',
      code: 'INVALID_CONNECTOR',
      message: 'HDMI video cables cannot plug into audio or USB ports.',
      context: { fromNode, fromPort, toNode, toPort }
    });
    return { allowed: false, notices };
  }

  // Check SLink 2-remote limit
  if (toPort === 'sq-slink' || fromPort === 'sq-slink') {
    const existingRemotes = state.physical.cables.filter(
      (c) =>
        (c.fromPort === 'sq-slink' || c.toPort === 'sq-slink') &&
        c.signalType === 'dsnake'
    );
    if (existingRemotes.length >= 2) {
      notices.push({
        type: 'error',
        code: 'SLINK_REMOTE_LIMIT',
        message: 'SLink dSnake mode supports up to 2 remotes per port.',
        context: { count: existingRemotes.length }
      });
      return { allowed: false, notices };
    }
  }

  // Port direction validation
  const fromDir = getPortDirection(fromNode, fromPort, state);
  const toDir = getPortDirection(toNode, toPort, state);

  if (fromDir === 'out' && toDir === 'out') {
    notices.push({
      type: 'error',
      code: 'INVALID_DIRECTION',
      message: 'Cannot connect an output port directly to another output port.',
      context: { fromNode, fromPort, toNode, toPort }
    });
    return { allowed: false, notices };
  }

  if (fromDir === 'in' && toDir === 'in') {
    notices.push({
      type: 'error',
      code: 'INVALID_DIRECTION',
      message: 'Cannot connect an input port directly to another input port.',
      context: { fromNode, fromPort, toNode, toPort }
    });
    return { allowed: false, notices };
  }

  if (fromDir === 'in' && toDir === 'out') {
    notices.push({
      type: 'error',
      code: 'INVALID_DIRECTION',
      message: 'Signal must flow from an output to an input.',
      context: { fromNode, fromPort, toNode, toPort }
    });
    return { allowed: false, notices };
  }

  // Single plug per physical socket constraint (excluding daisy-chainable network ports)
  const isNetworkPort = (port: string) =>
    port.includes('slink') || port.includes('dsnake') || port.includes('expander') || port.includes('monitor');

  if (!isNetworkPort(toPort)) {
    const isToOccupied = state.physical.cables.some(
      (c) => (c.toNode === toNode && c.toPort === toPort) || (c.fromNode === toNode && c.fromPort === toPort)
    );
    if (isToOccupied) {
      notices.push({
        type: 'error',
        code: 'PORT_ALREADY_CONNECTED',
        message: `Socket "${toPort}" on "${toNode}" already has a cable connected. Each physical socket only accepts one plug.`,
        context: { node: toNode, port: toPort }
      });
      return { allowed: false, notices };
    }
  }

  if (!isNetworkPort(fromPort)) {
    const isFromOccupied = state.physical.cables.some(
      (c) => (c.fromNode === fromNode && c.fromPort === fromPort) || (c.toNode === fromNode && c.toPort === fromPort)
    );
    if (isFromOccupied) {
      notices.push({
        type: 'error',
        code: 'PORT_ALREADY_CONNECTED',
        message: `Socket "${fromPort}" on "${fromNode}" already has a cable connected. Each physical socket only accepts one plug.`,
        context: { node: fromNode, port: fromPort }
      });
      return { allowed: false, notices };
    }
  }

  return { allowed: true, notices };
}

export function validateSystemState(state: SimulationState): ValidationNotice[] {
  const notices: ValidationNotice[] = [];

  // 1. Check dSNAKE connection
  const hasDsnake = state.physical.cables.some(
    (c) =>
      ((c.fromPort === 'ar-dsnake' && c.toPort === 'sq-slink') ||
        (c.fromPort === 'sq-slink' && c.toPort === 'ar-dsnake'))
  );

  if (!hasDsnake) {
    notices.push({
      type: 'warning',
      code: 'DSNAKE_DISCONNECTED',
      message: 'AR2412 dSNAKE cable is disconnected. SLink inputs and outputs on the SQ-5 are unavailable.'
    });
  }

  // 2. Check Click & Comms routed to FOH
  const clickOrCommsChannels = state.digital.channels.filter(
    (ch) =>
      ch.name.toLowerCase().includes('click') ||
      ch.name.toLowerCase().includes('comms')
  );

  for (const ch of clickOrCommsChannels) {
    if (ch.mainLRAssigned && !ch.mute) {
      notices.push({
        type: 'warning',
        code: 'CLICK_COMMS_TO_FOH',
        message: `Click/metronome channel "${ch.name}" is routed to Main LR. Click/comms channels are typically routed to IEM mixes only, not to FOH speakers.`,
        context: { channelId: ch.id, channelName: ch.name }
      });
    }

    // Check if routed to speaker mixes (Subs, Fills, Matrix arrays)
    for (const [mixId, send] of Object.entries(ch.sends)) {
      if (send.assigned && send.levelDb > -80) {
        const mix = state.digital.mixes.find((m) => m.id === mixId);
        if (
          mix &&
          (mix.name.toLowerCase().includes('sub') ||
            mix.name.toLowerCase().includes('fill') ||
            mix.name.toLowerCase().includes('array'))
        ) {
          notices.push({
            type: 'warning',
            code: 'CLICK_COMMS_TO_SPEAKER',
            message: `Click/comms channel "${ch.name}" is routed to "${mix.name}". This should only route to musician IEMs.`,
            context: { channelId: ch.id, mixId, mixName: mix.name }
          });
        }
      }
    }
  }

  // 3. Check Phantom Power on Dynamic Mics
  for (const ch of state.digital.channels) {
    if (ch.preamp.phantom48V) {
      const patch = state.digital.ioPatch.inputs[ch.id];
      if (patch) {
        // Find which stage item is feeding this socket
        const feedingCable = state.physical.cables.find(
          (c) => c.toPort === patch.socketId
        );
        if (feedingCable) {
          const item = state.physical.stageItems.find(
            (i) => i.id === feedingCable.fromNode
          );
          if (item && item.typeId === 'mic-dynamic') {
            notices.push({
              type: 'warning',
              code: 'PHANTOM_ON_DYNAMIC',
              message: `+48V phantom power is active on channel "${ch.name}" connected to dynamic mic "${item.name}". Dynamic mics do not require phantom power.`,
              context: { channelId: ch.id, itemName: item.name }
            });
          }
        }
      }
    }
  }

  return notices;
}
