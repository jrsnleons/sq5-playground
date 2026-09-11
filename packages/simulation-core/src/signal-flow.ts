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

  // 2. Identify cables carrying signal from stage sources (Pass 1: sources, transmitters, DIs)
  const itemOutgoingCables: Record<string, string[]> = {};
  for (const cable of state.physical.cables) {
    if (!itemOutgoingCables[cable.fromNode]) {
      itemOutgoingCables[cable.fromNode] = [];
    }
    itemOutgoingCables[cable.fromNode].push(cable.id);
  }

  // Identify source generators (instruments, standard mics, handheld wireless transmitters, playback, click, comms)
  for (const cable of state.physical.cables) {
    if (cable.signalType === 'dsnake') {
      cableHasSignal[cable.id] = slinkHasSignal;
      continue;
    }

    const sourceItem = state.physical.stageItems.find((i) => i.id === cable.fromNode);
    if (!sourceItem) continue;

    if (sourceItem.category === 'di-box') {
      // Handled in pass 2
      continue;
    }

    if (sourceItem.id === 'item-wireless-rx' || sourceItem.typeId === 'rx-wireless-dual') {
      // Check if this receiver is fed by transmitters
      const inPort = cable.fromPort === 'out-1' ? 'in-1' : 'in-2';
      const feedingRfCable = state.physical.cables.find(
        (c) => c.toNode === sourceItem.id && c.toPort === inPort
      );
      if (feedingRfCable) {
        cableHasSignal[cable.id] = !!cableHasSignal[feedingRfCable.id];
      } else {
        // Standalone receiver without explicit wireless transmitters default active
        cableHasSignal[cable.id] = true;
      }
      continue;
    }

    if (sourceItem.category === 'speaker' || sourceItem.category === 'iem') {
      // Daisy chain speaker handled after output bus computation
      continue;
    }

    // Default sound generator (mics, instruments, click, playback, comms)
    cableHasSignal[cable.id] = true;
  }

  // Handle DI boxes and intermediate converters
  for (const cable of state.physical.cables) {
    const sourceItem = state.physical.stageItems.find((i) => i.id === cable.fromNode);
    if (sourceItem?.category === 'di-box') {
      const feedingCable = state.physical.cables.find((c) => c.toNode === sourceItem.id);
      cableHasSignal[cable.id] = feedingCable ? !!cableHasSignal[feedingCable.id] : false;
    }
  }

  // Re-verify receiver outputs now that transmitters have been evaluated
  for (const cable of state.physical.cables) {
    if (cable.fromNode === 'item-wireless-rx' || cable.fromNode.includes('wireless-rx')) {
      const inPort = cable.fromPort === 'out-1' ? 'in-1' : 'in-2';
      const feedingRfCable = state.physical.cables.find(
        (c) => c.toNode === cable.fromNode && c.toPort === inPort
      );
      if (feedingRfCable) {
        cableHasSignal[cable.id] = !!cableHasSignal[feedingRfCable.id];
      }
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

  // 7. Compute StageBox / Console output socket signal presence and propagate to connected cables
  for (const cable of state.physical.cables) {
    if (cable.fromNode === 'stagebox-ar2412') {
      if (!slinkHasSignal) {
        cableHasSignal[cable.id] = false;
        continue;
      }
      const portMatch = cable.fromPort.match(/^ar-out-(\d+)$/);
      if (portMatch) {
        const portNum = parseInt(portMatch[1], 10);
        if (portNum >= 1 && portNum <= 8) {
          // IEM Mixes 1–8
          cableHasSignal[cable.id] = !!mixesWithSignal[`mix-${portNum}`];
        } else if (portNum === 9) {
          // Front Fills (Matrix 1 or Main LR)
          cableHasSignal[cable.id] = !!matricesWithSignal['matrix-1'] || mainLRHasSignal;
        } else if (portNum === 10) {
          // Subwoofers (Matrix 2 or Main LR)
          cableHasSignal[cable.id] = !!matricesWithSignal['matrix-2'] || mainLRHasSignal;
        } else if (portNum === 11 || portNum === 12) {
          // Main PA Left / Right (Main LR)
          cableHasSignal[cable.id] = mainLRHasSignal;
        }
      }
    } else if (cable.fromNode === 'console-sq5') {
      const portMatch = cable.fromPort.match(/^sq-out-(\d+)$/);
      if (portMatch) {
        const portNum = parseInt(portMatch[1], 10);
        if (portNum >= 1 && portNum <= 8) {
          cableHasSignal[cable.id] = !!mixesWithSignal[`mix-${portNum}`];
        } else if (portNum === 9 || portNum === 10) {
          cableHasSignal[cable.id] = !!matricesWithSignal['matrix-1'] || mainLRHasSignal;
        } else if (portNum === 11 || portNum === 12) {
          cableHasSignal[cable.id] = mainLRHasSignal;
        }
      }
    }
  }

  // 8. Propagate signal through daisy-chained speakers (e.g. Front Fill 1 -> Front Fill 2, Sub 1 -> Sub 2)
  for (let pass = 0; pass < 3; pass++) {
    for (const cable of state.physical.cables) {
      if (cable.fromPort === 'thru-1' || cable.fromPort.includes('thru') || cable.fromPort.includes('link')) {
        // Find the cable coming into this speaker
        const incomingCable = state.physical.cables.find(
          (c) => c.toNode === cable.fromNode && (c.toPort === 'in-1' || c.toPort.includes('in'))
        );
        cableHasSignal[cable.id] = incomingCable ? !!cableHasSignal[incomingCable.id] : false;
      }
    }
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
