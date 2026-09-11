import { SignalPresenceMap, SimulationState } from './types';

export function computeSignalPresence(state: SimulationState): SignalPresenceMap {
  const channelsWithSignal: Record<string, boolean> = {};
  const iemOnlyChannels: Record<string, boolean> = {};
  const mixesWithSignal: Record<string, boolean> = {};
  const matricesWithSignal: Record<string, boolean> = {};
  const cableHasSignal: Record<string, boolean> = {};

  // 1. Check dSNAKE connection
  const slinkHasSignal = state.physical.cables.some(
    (c) =>
      ((c.fromPort === 'ar-dsnake' && c.toPort === 'sq-slink') ||
        (c.fromPort === 'sq-slink' && c.toPort === 'ar-dsnake'))
  );

  // 2. Identify cables carrying signal from stage sources
  for (const cable of state.physical.cables) {
    if (cable.signalType === 'dsnake') {
      cableHasSignal[cable.id] = slinkHasSignal;
      continue;
    }
    // Check if source node is an active stage item
    const sourceItem = state.physical.stageItems.find((i) => i.id === cable.fromNode);
    if (sourceItem) {
      cableHasSignal[cable.id] = true;
    } else {
      // Could be a DI box or thru connection
      const feedingCable = state.physical.cables.find((c) => c.toNode === cable.fromNode);
      cableHasSignal[cable.id] = feedingCable ? !!cableHasSignal[feedingCable.id] : false;
    }
  }

  // 3. Compute signal presence for digital input channels
  for (const channel of state.digital.channels) {
    const patch = state.digital.ioPatch.inputs[channel.id];
    let hasPhysicalInput = false;

    if (patch) {
      if (patch.sourceType === 'slink') {
        if (slinkHasSignal) {
          // Check if there is a cable connected to this AR2412 socket
          const cable = state.physical.cables.find(
            (c) => c.toPort === patch.socketId && cableHasSignal[c.id]
          );
          hasPhysicalInput = !!cable;
        }
      } else if (patch.sourceType === 'local') {
        const cable = state.physical.cables.find(
          (c) => c.toPort === patch.socketId && cableHasSignal[c.id]
        );
        hasPhysicalInput = !!cable;
      }
    }

    // Check Mute and DCA / Mute Group states
    let isMuted = channel.mute;

    // Check DCA mute
    if (!isMuted && channel.dcaGroupMask > 0) {
      for (const dca of state.digital.dcas) {
        const maskBit = 1 << (dca.id - 1);
        if ((channel.dcaGroupMask & maskBit) && dca.mute) {
          isMuted = true;
          break;
        }
      }
    }

    // Check Mute Group
    if (!isMuted && channel.muteGroupMask > 0) {
      for (const mg of state.digital.muteGroups) {
        const maskBit = 1 << (mg.id - 1);
        if ((channel.muteGroupMask & maskBit) && mg.active) {
          isMuted = true;
          break;
        }
      }
    }

    // Signal present if physical input exists and channel is not muted
    channelsWithSignal[channel.id] = hasPhysicalInput && !isMuted;

    // Flag IEM-only channels
    const isClickOrComms =
      channel.name.toLowerCase().includes('click') ||
      channel.name.toLowerCase().includes('comms');
    iemOnlyChannels[channel.id] = isClickOrComms;
  }

  // 4. Compute Mix presence (Auxes)
  for (const mix of state.digital.mixes) {
    let mixHasSignal = false;
    if (!mix.mute) {
      for (const channel of state.digital.channels) {
        if (channelsWithSignal[channel.id]) {
          const send = channel.sends[mix.id];
          if (send && send.assigned && send.levelDb > -80) {
            mixHasSignal = true;
            break;
          }
        }
      }
    }
    mixesWithSignal[mix.id] = mixHasSignal;
  }

  // 5. Compute Main LR presence
  let mainLRHasSignal = false;
  if (!state.digital.mainLR.mute) {
    for (const channel of state.digital.channels) {
      // IEM-only channels should not count towards Main LR signal if proper warning is active,
      // but if routed anyway, they will physically pass unless muted.
      if (channelsWithSignal[channel.id] && channel.mainLRAssigned && channel.faderLevel > -80) {
        mainLRHasSignal = true;
        break;
      }
    }
  }

  // 6. Compute Matrix presence
  for (const matrix of state.digital.matrices) {
    let matrixHasSignal = false;
    if (!matrix.mute) {
      if (matrix.source === 'main-lr') {
        matrixHasSignal = mainLRHasSignal;
      }
    }
    matricesWithSignal[matrix.id] = matrixHasSignal;
  }

  return {
    channelsWithSignal,
    iemOnlyChannels,
    mixesWithSignal,
    mainLRHasSignal,
    matricesWithSignal,
    cableHasSignal,
    slinkHasSignal
  };
}
