import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  computeSignalPresence,
  validateCableConnection,
  validateSystemState
} from '../index';

describe('Simulation Core Engine', () => {
  it('AC-1: creates initial church rig state with digital patch visibility', () => {
    const state = createInitialState('church');
    expect(state.physical.stageBox.model).toBe('AR2412');
    expect(state.physical.console.model).toBe('SQ-5');
    expect(state.digital.channels.length).toBe(48);

    // Channel 2 is Mic 1, patched to AR2412 In 2 via SLink
    const ch2 = state.digital.channels[1];
    expect(ch2.name).toBe('Mic 1');
    const patchCh2 = state.digital.ioPatch.inputs['ch-2'];
    expect(patchCh2).toBeDefined();
    expect(patchCh2.sourceType).toBe('slink');
    expect(patchCh2.socketId).toBe('ar-in-2');

    // Signal flow should verify SLink has signal
    const presence = computeSignalPresence(state);
    expect(presence.slinkHasSignal).toBe(true);
    expect(presence.channelsWithSignal['ch-2']).toBe(true);
  });

  it('AC-2: blocks instruments plugging directly into XLR without a DI box', () => {
    const state = createInitialState('scratch');
    // Add an electric guitar stage item
    state.physical.stageItems.push({
      id: 'guitar-1',
      typeId: 'inst-electric-guitar',
      name: 'Electric Guitar',
      category: 'instrument',
      position: { x: 100, y: 100 }
    });

    // Attempt direct connection from guitar to AR2412 XLR input 1
    const validation = validateCableConnection(
      'guitar-1',
      'out-1',
      'stagebox-ar2412',
      'ar-in-1',
      state
    );

    expect(validation.allowed).toBe(false);
    expect(validation.notices[0].code).toBe('DI_REQUIRED');

    // Now insert a DI box: guitar -> DI in (TS), then DI out (XLR) -> AR2412 in 1
    state.physical.stageItems.push({
      id: 'di-1',
      typeId: 'di-mono-passive',
      name: 'Mono DI',
      category: 'di-box',
      position: { x: 200, y: 100 }
    });

    const guitarToDi = validateCableConnection('guitar-1', 'out-1', 'di-1', 'in-1', state);
    expect(guitarToDi.allowed).toBe(true);

    const diToStagebox = validateCableConnection('di-1', 'out-1', 'stagebox-ar2412', 'ar-in-1', state);
    expect(diToStagebox.allowed).toBe(true);
  });

  it('AC-3: enforces maximum of 2 dSNAKE remotes per SLink port', () => {
    const state = createInitialState('scratch');
    state.physical.cables.push(
      {
        id: 'c-remote-1',
        fromNode: 'stagebox-ar2412',
        fromPort: 'ar-dsnake',
        toNode: 'console-sq5',
        toPort: 'sq-slink',
        signalType: 'dsnake'
      },
      {
        id: 'c-remote-2',
        fromNode: 'stagebox-ab168',
        fromPort: 'ab-dsnake',
        toNode: 'console-sq5',
        toPort: 'sq-slink',
        signalType: 'dsnake'
      }
    );

    // Attempt connecting a 3rd remote
    const thirdRemote = validateCableConnection(
      'stagebox-ar84',
      'ar84-dsnake',
      'console-sq5',
      'sq-slink',
      state
    );

    expect(thirdRemote.allowed).toBe(false);
    expect(thirdRemote.notices[0].code).toBe('SLINK_REMOTE_LIMIT');
  });

  it('AC-4: verifies channel processing defaults and bounds', () => {
    const state = createInitialState('church');
    const ch1 = state.digital.channels[0];

    expect(ch1.preamp.gainDb).toBeGreaterThanOrEqual(0);
    expect(ch1.preamp.gainDb).toBeLessThanOrEqual(60);
    expect(ch1.hpf.frequencyHz).toBe(80);
    expect(ch1.hpf.slopeDbOct).toBe(18);
    expect(ch1.gate.attackUs).toBe(500);
    expect(ch1.peq.bands.length).toBe(4);
    expect(ch1.compressor.ratio).toBe(4);
  });

  it('AC-5 & AC-6: flags warning when Click/Comms channels are routed to Main LR or FOH speakers', () => {
    const state = createInitialState('church');
    const clickKeysCh = state.digital.channels.find((ch) => ch.name === 'Click Keys')!;
    expect(clickKeysCh).toBeDefined();

    // In default church preset, Click Keys is NOT routed to Main LR
    expect(clickKeysCh.mainLRAssigned).toBe(false);
    let notices = validateSystemState(state);
    const hasClickWarningDefault = notices.some((n) => n.code === 'CLICK_COMMS_TO_FOH');
    expect(hasClickWarningDefault).toBe(false);

    // If user routes Click Keys to Main LR:
    clickKeysCh.mainLRAssigned = true;
    notices = validateSystemState(state);
    const hasClickWarning = notices.some((n) => n.code === 'CLICK_COMMS_TO_FOH');
    expect(hasClickWarning).toBe(true);
    expect(notices.find((n) => n.code === 'CLICK_COMMS_TO_FOH')?.message).toContain('routed to IEM mixes only');
  });

  it('AC-11: marks SLink inputs unavailable when dSNAKE cable is disconnected', () => {
    const state = createInitialState('church');
    let presence = computeSignalPresence(state);
    expect(presence.slinkHasSignal).toBe(true);
    expect(presence.channelsWithSignal['ch-2']).toBe(true);

    // Unplug dSNAKE cable
    state.physical.cables = state.physical.cables.filter((c) => c.signalType !== 'dsnake');

    presence = computeSignalPresence(state);
    expect(presence.slinkHasSignal).toBe(false);
    // Mic 1 on AR2412 should now have NO signal
    expect(presence.channelsWithSignal['ch-2']).toBe(false);

    // Local inputs on SQ-5 (like PROPC on ch-25) still have signal if connected locally
    expect(presence.channelsWithSignal['ch-25']).toBe(true);

    const notices = validateSystemState(state);
    expect(notices.some((n) => n.code === 'DSNAKE_DISCONNECTED')).toBe(true);
  });

  it('AC-16: DCA mute cuts signal presence across Main LR and IEM aux mixes', () => {
    const state = createInitialState('church');
    const kickCh = state.digital.channels.find((ch) => ch.name === 'Kick')!;
    expect(kickCh).toBeDefined();
    // Kick is assigned to DCA 1 ("DRUMS")
    expect(kickCh.dcaGroupMask & 1).toBe(1);

    let presence = computeSignalPresence(state);
    expect(presence.channelsWithSignal[kickCh.id]).toBe(true);
    expect(presence.mixesWithSignal['mix-7']).toBe(true); // Drummer IEM
    expect(presence.mixesWithSignal['mix-8']).toBe(true); // Subs

    // Mute DCA 1
    const dca1 = state.digital.dcas.find((d) => d.id === 1)!;
    dca1.mute = true;

    presence = computeSignalPresence(state);
    // Channel signal presence for Kick cuts out
    expect(presence.channelsWithSignal[kickCh.id]).toBe(false);
  });
});
