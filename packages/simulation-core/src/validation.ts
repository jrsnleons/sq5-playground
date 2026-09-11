import { Cable, SimulationState, ValidationNotice } from './types';

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
