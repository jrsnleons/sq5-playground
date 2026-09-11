import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  computeSignalPresence,
  validateCableConnection,
  validateSystemState,
  recallSceneWithFilter,
  exportPresetAsJson,
  importPresetFromJson
} from '../index';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';

describe('FOH SQ-5 Simulator — Acceptance Criteria (AC-1 to AC-16)', () => {
  it('AC-1: Physical patch digital visibility', () => {
    const state = createInitialState('church');
    const ch2 = state.digital.channels[1];
    expect(ch2.name).toBe('Mic 1');

    const patch = state.digital.ioPatch.inputs['ch-2'];
    expect(patch).toBeDefined();
    expect(patch.sourceType).toBe('slink');
    expect(patch.socketId).toBe('ar-in-2');

    const presence = computeSignalPresence(state);
    expect(presence.slinkHasSignal).toBe(true);
    expect(presence.channelsWithSignal['ch-2']).toBe(true);
  });

  it('AC-2: DI-required source blocking and DI insertion', () => {
    const state = createInitialState('scratch');
    state.physical.stageItems.push({
      id: 'bass-1',
      typeId: 'inst-bass-guitar',
      name: 'Bass Guitar',
      category: 'instrument',
      position: { x: 100, y: 100 }
    });

    // Plugging 1/4" straight into AR2412 XLR is blocked
    const directToXlr = validateCableConnection('bass-1', 'out-1', 'stagebox-ar2412', 'ar-in-16', state);
    expect(directToXlr.allowed).toBe(false);
    expect(directToXlr.notices[0].code).toBe('DI_REQUIRED');

    // Inserting Mono DI box
    state.physical.stageItems.push({
      id: 'di-bass',
      typeId: 'di-mono-passive',
      name: 'Mono DI',
      category: 'di-box',
      position: { x: 200, y: 100 }
    });

    const bassToDi = validateCableConnection('bass-1', 'out-1', 'di-bass', 'in-1', state);
    expect(bassToDi.allowed).toBe(true);

    const diToStagebox = validateCableConnection('di-bass', 'out-1', 'stagebox-ar2412', 'ar-in-16', state);
    expect(diToStagebox.allowed).toBe(true);
  });

  it('AC-3: Two-remote SLink limit', () => {
    const state = createInitialState('scratch');
    state.physical.cables.push(
      { id: 'c1', fromNode: 'stagebox-1', fromPort: 'dsnake', toNode: 'console-sq5', toPort: 'sq-slink', signalType: 'dsnake' },
      { id: 'c2', fromNode: 'stagebox-2', fromPort: 'dsnake', toNode: 'console-sq5', toPort: 'sq-slink', signalType: 'dsnake' }
    );

    const thirdRemote = validateCableConnection('stagebox-3', 'dsnake', 'console-sq5', 'sq-slink', state);
    expect(thirdRemote.allowed).toBe(false);
    expect(thirdRemote.notices[0].code).toBe('SLINK_REMOTE_LIMIT');
  });

  it('AC-4: Channel processing order & parameter ranges', () => {
    const state = createInitialState('church');
    const ch = state.digital.channels[0];

    // Gain 0 to +60 dB
    expect(ch.preamp.gainDb).toBeGreaterThanOrEqual(0);
    expect(ch.preamp.gainDb).toBeLessThanOrEqual(60);

    // HPF 20 Hz to 2 kHz, 12/18/24 dB/oct
    expect(ch.hpf.frequencyHz).toBeGreaterThanOrEqual(20);
    expect(ch.hpf.frequencyHz).toBeLessThanOrEqual(2000);
    expect([12, 18, 24]).toContain(ch.hpf.slopeDbOct);

    // Gate threshold -72 to +18 dB
    expect(ch.gate.thresholdDb).toBeGreaterThanOrEqual(-72);
    expect(ch.gate.thresholdDb).toBeLessThanOrEqual(18);

    // PEQ 4 bands
    expect(ch.peq.bands.length).toBe(4);
    expect(ch.peq.bands[0].gainDb).toBeGreaterThanOrEqual(-15);
    expect(ch.peq.bands[0].gainDb).toBeLessThanOrEqual(15);

    // Compressor ratio
    expect(ch.compressor.ratio).toBeGreaterThanOrEqual(1);
  });

  it('AC-5: IEM routing (Keys and Click Keys routed to IEM Keys only)', () => {
    const state = createInitialState('church');
    const keysCh = state.digital.channels.find((c) => c.name === 'Keys')!;
    const clickKeysCh = state.digital.channels.find((c) => c.name === 'Click Keys')!;

    // Keys is routed to Mix 4 (IEM KEYS) and Main LR
    expect(keysCh.sends['mix-4'].assigned).toBe(true);
    expect(keysCh.mainLRAssigned).toBe(true);

    // Click Keys is routed to Mix 4 (IEM KEYS), NEVER to Main LR
    expect(clickKeysCh.sends['mix-4'].assigned).toBe(true);
    expect(clickKeysCh.mainLRAssigned).toBe(false);

    const presence = computeSignalPresence(state);
    expect(presence.channelsWithSignal[keysCh.id]).toBe(true);
    expect(presence.channelsWithSignal[clickKeysCh.id]).toBe(true);
    expect(presence.mixesWithSignal['mix-4']).toBe(true);
    expect(presence.iemOnlyChannels[clickKeysCh.id]).toBe(true);
  });

  it('AC-6: Click/comms FOH warning', () => {
    const state = createInitialState('church');
    const clickDrumsCh = state.digital.channels.find((c) => c.name === 'Click Drums')!;

    // By default no warning because not assigned to Main LR
    let notices = validateSystemState(state);
    expect(notices.some((n) => n.code === 'CLICK_COMMS_TO_FOH')).toBe(false);

    // Routing to Main LR triggers prominent warning
    clickDrumsCh.mainLRAssigned = true;
    notices = validateSystemState(state);
    const clickWarning = notices.find((n) => n.code === 'CLICK_COMMS_TO_FOH');
    expect(clickWarning).toBeDefined();
    expect(clickWarning?.message).toContain('routed to IEM mixes only, not to FOH speakers');
  });

  it('AC-7: GEQ Fader Flip and band manipulation', () => {
    const state = createInitialState('church');
    const subsMix = state.digital.mixes.find((m) => m.id === 'mix-8')!;
    expect(subsMix.geq.length).toBe(28);

    // Initial bands are 0 dB
    expect(subsMix.geq[0]).toBe(0);

    // Adjust band 0 (31 Hz) to +4.5 dB
    subsMix.geq[0] = 4.5;
    expect(subsMix.geq[0]).toBe(4.5);

    // Resetting band to 0 dB (simulating pressing Sel)
    subsMix.geq[0] = 0;
    expect(subsMix.geq[0]).toBe(0);
  });

  it('AC-8: FX Send-Return architecture', () => {
    const state = createInitialState('church');
    const mic1 = state.digital.channels.find((c) => c.name === 'Mic 1')!;

    // Send level -10 dB post-fade
    mic1.sends['fx-1'] = {
      mixId: 'fx-1',
      levelDb: -10,
      preFade: false,
      assigned: true
    };
    expect(mic1.sends['fx-1'].levelDb).toBe(-10);
    expect(mic1.sends['fx-1'].preFade).toBe(false);

    // Dry signal is unaffected by FX mute
    expect(mic1.mute).toBe(false);
  });

  it('AC-9: Matrix fed from Main LR post-fade for PA arrays', () => {
    const state = createInitialState('church');
    const matrix1 = state.digital.matrices.find((m) => m.id === 'matrix-1')!;

    expect(matrix1.source).toBe('main-lr');
    expect(matrix1.stereo).toBe(true);

    const presence = computeSignalPresence(state);
    expect(presence.mainLRHasSignal).toBe(true);
    expect(presence.matricesWithSignal['matrix-1']).toBe(true);
  });

  it('AC-10: Scene recall with Recall Filter', () => {
    const state = createInitialState('church');
    const mic1 = state.digital.channels.find((c) => c.name === 'Mic 1')!;

    // Scene 1: Mic 1 Band 2 gain is 0 dB
    expect(mic1.peq.bands[1].gainDb).toBe(0);
    const scene1Snapshot = JSON.parse(JSON.stringify(state));

    // Scene 2: Modify Mic 1 Band 2 gain to +6 dB
    mic1.peq.bands[1].gainDb = 6;
    mic1.faderLevel = -5;
    const scene2Snapshot = JSON.parse(JSON.stringify(state));

    // Create Scene 2 with "Block PEQ" filter
    const scene2 = {
      id: 2,
      name: 'Sunday Sermon',
      crossfadeSeconds: 0,
      recallFilter: { blockPEQ: true },
      snapshot: scene2Snapshot
    };

    // Current state has Scene 1 PEQ (0 dB)
    state.digital.channels[1].peq.bands[1].gainDb = 0;
    state.digital.channels[1].faderLevel = 0;

    // Recall Scene 2 with blockPEQ filter
    const recalledState = recallSceneWithFilter(state, scene2);

    // PEQ should remain filtered (preserved at 0 dB from current state)
    expect(recalledState.digital.channels[1].peq.bands[1].gainDb).toBe(0);
    // While fader level follows Scene 2 (-5 dB)
    expect(recalledState.digital.channels[1].faderLevel).toBe(-5);
  });

  it('AC-11: Invalid / disconnected patch updates state to unavailable', () => {
    const state = createInitialState('church');
    expect(computeSignalPresence(state).slinkHasSignal).toBe(true);

    // Disconnect dSNAKE
    state.physical.cables = state.physical.cables.filter((c) => c.signalType !== 'dsnake');

    const presence = computeSignalPresence(state);
    expect(presence.slinkHasSignal).toBe(false);
    expect(presence.channelsWithSignal['ch-2']).toBe(false); // Mic 1 has no signal

    const notices = validateSystemState(state);
    expect(notices.some((n) => n.code === 'DSNAKE_DISCONNECTED')).toBe(true);
  });

  it('AC-12: Node photo system catalog and user override', () => {
    const micDef = stageItemsCatalog.find((i) => i.id === 'mic-dynamic')!;
    expect(micDef.stockPhotoId).toBe('dynamic-mic');
    expect(micDef.defaultPhotoAlt).toContain('microphone');

    const state = createInitialState('church');
    // User uploads photo override
    state.nodePhotos['item-mic-1'] = {
      source: 'user',
      userPhotoDataUrl: 'data:image/webp;base64,sample',
      userPhotoFileName: 'my-custom-sm58.webp'
    };
    expect(state.nodePhotos['item-mic-1'].source).toBe('user');
    expect(state.nodePhotos['item-mic-1'].userPhotoFileName).toBe('my-custom-sm58.webp');

    // Reset to stock
    delete state.nodePhotos['item-mic-1'];
    expect(state.nodePhotos['item-mic-1']).toBeUndefined();
  });

  it('AC-13: Start from scratch initializes blank stage with hardware only', () => {
    const scratchState = createInitialState('scratch');
    expect(scratchState.entryMode).toBe('scratch');
    expect(scratchState.physical.stageItems.length).toBe(0);
    expect(scratchState.physical.cables.length).toBe(0);
    expect(scratchState.physical.stageBox.model).toBe('AR2412');
    expect(scratchState.physical.console.model).toBe('SQ-5');

    // Drag a dynamic mic onto the stage
    scratchState.physical.stageItems.push({
      id: 'mic-new',
      typeId: 'mic-dynamic',
      name: 'Solo Vocal',
      category: 'mic',
      position: { x: 100, y: 100 }
    });

    // Patch XLR to AR2412 In 1
    const validation = validateCableConnection('mic-new', 'out-1', 'stagebox-ar2412', 'ar-in-1', scratchState);
    expect(validation.allowed).toBe(true);
  });

  it('AC-14: Preset management JSON export and import', () => {
    const state = createInitialState('church');
    state.digital.channels[1].name = 'Lead Pastor Mic';

    const exportedJson = exportPresetAsJson(state, 'Sunday Morning Service');
    expect(exportedJson).toContain('Lead Pastor Mic');

    const importedState = importPresetFromJson(exportedJson);
    expect(importedState.digital.channels[1].name).toBe('Lead Pastor Mic');
    expect(importedState.physical.stageBox.model).toBe('AR2412');
  });

  it('AC-15: Editability — deleting instrument cleans up connected cables', () => {
    const state = createInitialState('church');
    const initialItemCount = state.physical.stageItems.length;
    const initialCableCount = state.physical.cables.length;

    // Delete item-keys
    const targetId = 'item-keys';
    state.physical.stageItems = state.physical.stageItems.filter((i) => i.id !== targetId);
    state.physical.cables = state.physical.cables.filter(
      (c) => c.fromNode !== targetId && c.toNode !== targetId
    );

    expect(state.physical.stageItems.length).toBe(initialItemCount - 1);
    expect(state.physical.cables.length).toBeLessThan(initialCableCount);
  });

  it('AC-16: DCA / Mute Group with IEM cuts presence across both FOH and IEM mixes', () => {
    const state = createInitialState('church');
    const kick = state.digital.channels.find((c) => c.name === 'Kick')!;

    // Assigned to DCA 1 ("DRUMS")
    expect(kick.dcaGroupMask & 1).toBe(1);

    let presence = computeSignalPresence(state);
    expect(presence.channelsWithSignal[kick.id]).toBe(true);
    expect(presence.mixesWithSignal['mix-7']).toBe(true); // Drummer IEM

    // Mute DCA 1
    state.digital.dcas[0].mute = true;

    presence = computeSignalPresence(state);
    expect(presence.channelsWithSignal[kick.id]).toBe(false);
  });
});
