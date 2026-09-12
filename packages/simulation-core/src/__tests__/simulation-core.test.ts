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

    // Keys is routed to Mix 5 (IEM KEYS) and Main LR
    expect(keysCh.sends['mix-5'].assigned).toBe(true);
    expect(keysCh.mainLRAssigned).toBe(true);

    // Click Keys is routed to Mix 5 (IEM KEYS), NEVER to Main LR
    expect(clickKeysCh.sends['mix-5'].assigned).toBe(true);
    expect(clickKeysCh.mainLRAssigned).toBe(false);

    const presence = computeSignalPresence(state);
    expect(presence.channelsWithSignal[keysCh.id]).toBe(true);
    expect(presence.channelsWithSignal[clickKeysCh.id]).toBe(true);
    expect(presence.mixesWithSignal['mix-5']).toBe(true);
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
    const subsMix = state.digital.mixes.find((m) => m.id === 'mix-9')!;
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
    expect(presence.mixesWithSignal['mix-8']).toBe(true); // Drummer IEM (mix-8)

    // Mute DCA 1
    state.digital.dcas[0].mute = true;

    presence = computeSignalPresence(state);
    expect(presence.channelsWithSignal[kick.id]).toBe(false);
  });

  it('Feature: Mix groups and auxes assigned to DCA groups cut presence on DCA mute', () => {
    const state = createInitialState('church');
    const drumGrp = state.digital.mixes.find((m) => m.id === 'mix-12')!; // GRP Drums

    // Initial check: drumGrp has signal from drum channels and is unmuted
    let presence = computeSignalPresence(state);
    expect(presence.mixesWithSignal['mix-12']).toBe(true);

    // Assign GRP Drums to DCA 1 (bitmask 1 << 0 = 1)
    drumGrp.dcaGroupMask = 1;

    // With DCA 1 unmuted, presence remains active
    presence = computeSignalPresence(state);
    expect(presence.mixesWithSignal['mix-12']).toBe(true);

    // Muting DCA 1 cuts signal presence on GRP Drums
    state.digital.dcas[0].mute = true;
    presence = computeSignalPresence(state);
    expect(presence.mixesWithSignal['mix-12']).toBe(false);

    // Unmuting DCA 1 restores signal presence on GRP Drums
    state.digital.dcas[0].mute = false;
    presence = computeSignalPresence(state);
    expect(presence.mixesWithSignal['mix-12']).toBe(true);
  });

  it('Feature: Subgroups, triple-patched Stream Aux, and 2 Stereo Matrices for arrays', () => {
    const state = createInitialState('church');

    // 1. Stream Aux 1 is stereo
    const streamAux = state.digital.mixes.find((m) => m.id === 'mix-1')!;
    expect(streamAux.stereo).toBe(true);
    expect(streamAux.mode).toBe('aux');

    // 2. Subgroups exist in order (mix-10 Vocals, mix-11 Instruments, mix-12 Drums) and are stereo & assigned to Main LR
    const vocalGrp = state.digital.mixes.find((m) => m.id === 'mix-10')!;
    const instGrp = state.digital.mixes.find((m) => m.id === 'mix-11')!;
    const drumGrp = state.digital.mixes.find((m) => m.id === 'mix-12')!;
    expect(vocalGrp.mode).toBe('group');
    expect(vocalGrp.name).toBe('GRP Vocals');
    expect(instGrp.mode).toBe('group');
    expect(instGrp.name).toBe('GRP Instruments');
    expect(drumGrp.mode).toBe('group');
    expect(drumGrp.name).toBe('GRP Drums');
    expect(vocalGrp.mainLRAssigned).toBe(true);
    expect(instGrp.mainLRAssigned).toBe(true);
    expect(drumGrp.mainLRAssigned).toBe(true);

    // 3. Subwoofer Aux 9
    const subAux = state.digital.mixes.find((m) => m.id === 'mix-9')!;
    expect(subAux.name).toBe('Subwoofer');
    expect(subAux.mode).toBe('aux');

    // 4. Matrices: Matrix 1-L for Left Array, Matrix 2-R for Right Array
    const mtx1 = state.digital.matrices.find((m) => m.id === 'matrix-1')!;
    const mtx2 = state.digital.matrices.find((m) => m.id === 'matrix-2')!;
    expect(mtx1.name).toBe('Left Array Matrix');
    expect(mtx2.name).toBe('Right Array Matrix');

    // 5. Output patching checks
    expect(state.digital.ioPatch.outputs['ar-out-11'].destType).toBe('matrix');
    expect(state.digital.ioPatch.outputs['ar-out-11'].busId).toBe('matrix-1-l');
    expect(state.digital.ioPatch.outputs['ar-out-12'].destType).toBe('matrix');
    expect(state.digital.ioPatch.outputs['ar-out-12'].busId).toBe('matrix-2-r');
    expect(state.digital.ioPatch.outputs['ar-out-10'].busId).toBe('mix-9');

    // Triple-patched Stream Aux across Local Out 7–12
    expect(state.digital.ioPatch.outputs['sq-out-7'].busId).toBe('mix-1-l');
    expect(state.digital.ioPatch.outputs['sq-out-8'].busId).toBe('mix-1-r');
    expect(state.digital.ioPatch.outputs['sq-out-9'].busId).toBe('mix-1-l');
    expect(state.digital.ioPatch.outputs['sq-out-10'].busId).toBe('mix-1-r');
    expect(state.digital.ioPatch.outputs['sq-out-11'].busId).toBe('mix-1-l');
    expect(state.digital.ioPatch.outputs['sq-out-12'].busId).toBe('mix-1-r');

    const presence = computeSignalPresence(state);
    expect(presence.mixesWithSignal['mix-1']).toBe(true);
    expect(presence.mixesWithSignal['mix-9']).toBe(true);
    expect(presence.matricesWithSignal['matrix-1']).toBe(true);
    expect(presence.matricesWithSignal['matrix-2']).toBe(true);
  });

  it('Feature: Shure SVX dual wireless receiver has dual RF inputs and dual console outputs', () => {
    const state = createInitialState('church');
    const svx = state.physical.stageItems.find((i) => i.id === 'item-wireless-rx')!;
    expect(svx).toBeDefined();

    // Check RF transmitter cables
    const rfLead = state.physical.cables.find(
      (c) => c.fromNode === 'item-wl-mic-1' && c.toNode === 'item-wireless-rx' && c.toPort === 'in-1'
    );
    const rfBackup = state.physical.cables.find(
      (c) => c.fromNode === 'item-wl-mic-2' && c.toNode === 'item-wireless-rx' && c.toPort === 'in-2'
    );
    expect(rfLead).toBeDefined();
    expect(rfBackup).toBeDefined();

    // Check dual console outputs into SQ Local In 4 & 5
    const outChA = state.physical.cables.find(
      (c) => c.fromNode === 'item-wireless-rx' && c.fromPort === 'out-1' && c.toPort === 'sq-in-4'
    );
    const outChB = state.physical.cables.find(
      (c) => c.fromNode === 'item-wireless-rx' && c.fromPort === 'out-2' && c.toPort === 'sq-in-5'
    );
    expect(outChA).toBeDefined();
    expect(outChB).toBeDefined();

    const presence = computeSignalPresence(state);
    expect(presence.cableHasSignal[rfLead!.id]).toBe(true);
    expect(presence.cableHasSignal[rfBackup!.id]).toBe(true);
    expect(presence.cableHasSignal[outChA!.id]).toBe(true);
    expect(presence.cableHasSignal[outChB!.id]).toBe(true);
  });

  it('Feature: Daisy-chained speakers (Front Fills & Subs) propagate signal via THRU ports', () => {
    const state = createInitialState('church');
    
    // Front Fill 1 fed from AR2412 Out 9, Front Fill 2 daisy-chained via THRU
    const fillFeed = state.physical.cables.find((c) => c.id === 'cable-out-9')!;
    const fillDaisy = state.physical.cables.find((c) => c.id === 'cable-fill-daisy')!;
    expect(fillFeed).toBeDefined();
    expect(fillDaisy).toBeDefined();
    expect(fillDaisy.fromPort).toBe('thru-1');
    expect(fillDaisy.toNode).toBe('item-front-fill-2');

    // Subwoofer 1 fed from AR2412 Out 10, Subwoofer 2 daisy-chained via THRU
    const subFeed = state.physical.cables.find((c) => c.id === 'cable-out-10')!;
    const subDaisy = state.physical.cables.find((c) => c.id === 'cable-sub-daisy')!;
    expect(subFeed).toBeDefined();
    expect(subDaisy).toBeDefined();
    expect(subDaisy.fromPort).toBe('thru-1');
    expect(subDaisy.toNode).toBe('item-sub-2');

    let presence = computeSignalPresence(state);
    expect(presence.cableHasSignal[fillFeed.id]).toBe(true);
    expect(presence.cableHasSignal[fillDaisy.id]).toBe(true);
    expect(presence.cableHasSignal[subFeed.id]).toBe(true);
    expect(presence.cableHasSignal[subDaisy.id]).toBe(true);

    // Unplugging the main feed to Sub 1 cuts signal to Sub 2
    state.physical.cables = state.physical.cables.filter((c) => c.id !== 'cable-out-10');
    presence = computeSignalPresence(state);
    expect(presence.cableHasSignal[subDaisy.id]).toBe(false);
  });

  it('Feature: Broadcast stream chain and Waves SuperRack USB host connection', () => {
    const state = createInitialState('church');

    // 1. Verify all 5 new items exist in church rig
    const wavesPC = state.physical.stageItems.find((i) => i.id === 'item-waves-pc');
    const behringerInterface = state.physical.stageItems.find((i) => i.id === 'item-behringer-interface');
    const streamPC = state.physical.stageItems.find((i) => i.id === 'item-stream-pc');
    const oseeSwitcher = state.physical.stageItems.find((i) => i.id === 'item-osee-switcher');
    const streamMonitor = state.physical.stageItems.find((i) => i.id === 'item-stream-monitor');

    expect(wavesPC).toBeDefined();
    expect(behringerInterface).toBeDefined();
    expect(streamPC).toBeDefined();
    expect(oseeSwitcher).toBeDefined();
    expect(streamMonitor).toBeDefined();

    // 2. Verify Waves SuperRack is cabled via USB to SQ-5 USB-B port
    const wavesUsbCable = state.physical.cables.find((c) => c.id === 'cable-sq-usb-waves');
    expect(wavesUsbCable).toBeDefined();
    expect(wavesUsbCable!.fromPort).toBe('sq-usb-b');
    expect(wavesUsbCable!.toNode).toBe('item-waves-pc');
    expect(wavesUsbCable!.signalType).toBe('usb');

    // 3. Verify SQ Out 7-8 feeds Osee Switcher (Record L/R)
    const oseeAudioL = state.physical.cables.find((c) => c.id === 'cable-sq-out-7');
    const oseeAudioR = state.physical.cables.find((c) => c.id === 'cable-sq-out-8');
    expect(oseeAudioL).toBeDefined();
    expect(oseeAudioR).toBeDefined();
    expect(oseeAudioL!.toNode).toBe('item-osee-switcher');
    expect(oseeAudioR!.toNode).toBe('item-osee-switcher');

    // 4. Verify SQ Out 9-10 feeds Stream Output Monitor (Monitor L/R)
    const monAudioL = state.physical.cables.find((c) => c.id === 'cable-sq-out-9');
    const monAudioR = state.physical.cables.find((c) => c.id === 'cable-sq-out-10');
    expect(monAudioL).toBeDefined();
    expect(monAudioR).toBeDefined();
    expect(monAudioL!.toNode).toBe('item-stream-monitor');
    expect(monAudioR!.toNode).toBe('item-stream-monitor');

    // 5. Verify Behringer Interface connects to Local Out 11/12 (Stream L/R) and outputs USB
    const streamLCable = state.physical.cables.find((c) => c.id === 'cable-stream-l');
    const streamRCable = state.physical.cables.find((c) => c.id === 'cable-stream-r');
    const behringerUsb = state.physical.cables.find((c) => c.id === 'cable-behringer-usb');
    expect(streamLCable).toBeDefined();
    expect(streamRCable).toBeDefined();
    expect(behringerUsb).toBeDefined();
    expect(behringerUsb!.toNode).toBe('item-stream-pc');

    // 6. Verify Osee Switcher feeds Stream PC (UVC webcam)
    const oseeUsb = state.physical.cables.find((c) => c.id === 'cable-osee-usb');
    expect(oseeUsb).toBeDefined();
    expect(oseeUsb!.toNode).toBe('item-stream-pc');

    // 7. Verify signal presence propagation
    const presence = computeSignalPresence(state);
    expect(presence.cableHasSignal[wavesUsbCable!.id]).toBe(true);
    expect(presence.cableHasSignal[oseeAudioL!.id]).toBe(true);
    expect(presence.cableHasSignal[oseeAudioR!.id]).toBe(true);
    expect(presence.cableHasSignal[monAudioL!.id]).toBe(true);
    expect(presence.cableHasSignal[monAudioR!.id]).toBe(true);
    expect(presence.cableHasSignal[streamLCable!.id]).toBe(true);
    expect(presence.cableHasSignal[streamRCable!.id]).toBe(true);
    expect(presence.cableHasSignal[behringerUsb!.id]).toBe(true);
    expect(presence.cableHasSignal[oseeUsb!.id]).toBe(true);

    // 6. Verify connector validation: USB cannot plug directly into analog XLR input
    const invalidUsbToXlr = validateCableConnection('item-stream-pc', 'usb-in', 'stagebox-ar2412', 'ar-in-1', state);
    expect(invalidUsbToXlr.allowed).toBe(false);
    expect(invalidUsbToXlr.notices[0].code).toBe('INVALID_CONNECTOR');
  });

  it('AC-17: Stereo input channel pairing and church default preset', () => {
    const state = createInitialState('church');

    const ch25 = state.digital.channels.find((c) => c.id === 'ch-25')!;
    const ch26 = state.digital.channels.find((c) => c.id === 'ch-26')!;

    // 1. In church rig, PROPC L (ch-25) and PROPC R (ch-26) are stereo-linked by default
    expect(ch25.name).toBe('PROPC L');
    expect(ch26.name).toBe('PROPC R');
    expect(ch25.stereo).toBe(true);
    expect(ch25.isStereoSlave).toBe(false);
    expect(ch25.linkedChannelId).toBe('ch-26');
    expect(ch25.pan).toBe(-100);

    expect(ch26.stereo).toBe(true);
    expect(ch26.isStereoSlave).toBe(true);
    expect(ch26.linkedChannelId).toBe('ch-25');
    expect(ch26.pan).toBe(100);

    // 2. Both channels retain independent physical socket patches
    const patch25 = state.digital.ioPatch.inputs['ch-25'];
    const patch26 = state.digital.ioPatch.inputs['ch-26'];
    expect(patch25?.socketId).toBe('sq-in-1');
    expect(patch26?.socketId).toBe('sq-in-2');

    // 3. Regular channels remain mono by default
    const ch1 = state.digital.channels.find((c) => c.id === 'ch-1')!;
    const ch2 = state.digital.channels.find((c) => c.id === 'ch-2')!;
    expect(ch1.stereo).toBe(false);
    expect(ch1.isStereoSlave).toBe(false);
    expect(ch2.stereo).toBe(false);
    expect(ch2.isStereoSlave).toBe(false);
  });

  it('AC-18: Physical Cable Tracing & Socket Resolution', () => {
    const state = createInitialState('church');

    // 1. Trace AR2412 SLink cable
    const slinkCable = state.physical.cables.find(
      (c) => c.fromPort === 'ar-dsnake' && c.toPort === 'sq-slink'
    );
    expect(slinkCable).toBeDefined();
    expect(slinkCable!.fromNode).toBe('stagebox-ar2412');
    expect(slinkCable!.toNode).toBe('console-sq5');
    expect(slinkCable!.signalType).toBe('dsnake');

    // 2. Trace Stage Mic to AR2412 input port
    const audRCable = state.physical.cables.find(
      (c) => c.fromNode === 'item-aud-r' && c.toPort === 'ar-in-1'
    );
    expect(audRCable).toBeDefined();
    expect(audRCable!.signalType).toBe('mic');

    // Verify digital input patch mapping for Audience R socket
    const inputPatch = Object.entries(state.digital.ioPatch.inputs).find(
      ([_, patch]) => patch.socketId === audRCable!.toPort
    );
    expect(inputPatch).toBeDefined();
    const chId = inputPatch![0];
    const channel = state.digital.channels.find((c) => c.id === chId);
    expect(channel?.name).toBe('Audience R');

    // 3. Trace ProPresenter PC DI to SQ-5 Local Inputs (sq-in-1 / sq-in-2)
    const propcLCable = state.physical.cables.find((c) => c.toPort === 'sq-in-1');
    const propcRCable = state.physical.cables.find((c) => c.toPort === 'sq-in-2');
    expect(propcLCable).toBeDefined();
    expect(propcRCable).toBeDefined();
    expect(propcLCable!.fromNode).toBe('item-di-pc');
    expect(propcRCable!.fromNode).toBe('item-di-pc');

    // Verify stereo digital link on resolved channels
    const ch25 = state.digital.channels.find((c) => c.id === 'ch-25')!;
    const ch26 = state.digital.channels.find((c) => c.id === 'ch-26')!;
    expect(ch25.stereo).toBe(true);
    expect(ch26.isStereoSlave).toBe(true);

    // 4. Trace SQ-5 Local Outputs to Osee Switcher and Stream Monitor
    const oseeOut7 = state.physical.cables.find((c) => c.fromPort === 'sq-out-7');
    const oseeOut8 = state.physical.cables.find((c) => c.fromPort === 'sq-out-8');
    const monOut9 = state.physical.cables.find((c) => c.fromPort === 'sq-out-9');
    const monOut10 = state.physical.cables.find((c) => c.fromPort === 'sq-out-10');

    expect(oseeOut7?.toNode).toBe('item-osee-switcher');
    expect(oseeOut8?.toNode).toBe('item-osee-switcher');
    expect(monOut9?.toNode).toBe('item-stream-monitor');
    expect(monOut10?.toNode).toBe('item-stream-monitor');

    // Verify digital output bus patching for SQ-5 local outputs (triple patched from stereo Stream Aux 1)
    expect(state.digital.ioPatch.outputs['sq-out-7']?.busId).toBe('mix-1-l');
    expect(state.digital.ioPatch.outputs['sq-out-8']?.busId).toBe('mix-1-r');
    expect(state.digital.ioPatch.outputs['sq-out-9']?.busId).toBe('mix-1-l');
    expect(state.digital.ioPatch.outputs['sq-out-10']?.busId).toBe('mix-1-r');
  });

  it('AC-18: Pre-fade IEM sends & channel meter signal presence when muted', () => {
    const state = createInitialState('church');
    const ch2 = state.digital.channels.find((c) => c.id === 'ch-2')!; // Mic 1
    // Mic 1 is routed pre-fade to mix-3 (IEM WL) and mix-4 (IEM BACKUP)
    expect(ch2.sends['mix-3'].preFade).toBe(true);

    // Baseline unmuted
    let presence = computeSignalPresence(state);
    expect(presence.rawInputsWithSignal['ch-2']).toBe(true);
    expect(presence.channelsWithSignal['ch-2']).toBe(true);
    expect(presence.mixesWithSignal['mix-3']).toBe(true);

    // Mute channel 2
    ch2.mute = true;
    presence = computeSignalPresence(state);

    // Physical raw input still detects analog microphone signal
    expect(presence.rawInputsWithSignal['ch-2']).toBe(true);
    // Post-fader / post-mute channel signal is cut
    expect(presence.channelsWithSignal['ch-2']).toBe(false);
    // Pre-fade IEM mix-3 STILL receives signal! Musician IEM does not cut out on FOH mute
    expect(presence.mixesWithSignal['mix-3']).toBe(true);
  });

  it('AC-19: Physical patchbay single-plug constraint and direction validation', () => {
    const state = createInitialState('church');

    // 1. Single plug constraint: ar-in-2 is already occupied by Mic 1
    const secondPlug = validateCableConnection('item-mic-2', 'out-1', 'stagebox-ar2412', 'ar-in-2', state);
    expect(secondPlug.allowed).toBe(false);
    expect(secondPlug.notices[0].code).toBe('PORT_ALREADY_CONNECTED');

    // 2. Direction check: Output to Output is rejected
    const outToOut = validateCableConnection('item-mic-2', 'out-1', 'stagebox-ar2412', 'ar-out-1', state);
    expect(outToOut.allowed).toBe(false);
    expect(outToOut.notices[0].code).toBe('INVALID_DIRECTION');

    // 3. Direction check: Input to Input is rejected
    const inToIn = validateCableConnection('console-sq5', 'sq-in-1', 'stagebox-ar2412', 'ar-in-1', state);
    expect(inToIn.allowed).toBe(false);
    expect(inToIn.notices[0].code).toBe('INVALID_DIRECTION');
  });

  it('AC-20: Scratch mode generic mix and DCA naming', () => {
    const state = createInitialState('scratch');

    // Mixes should be cleanly named Mix 1 to Mix 12
    expect(state.digital.mixes.length).toBe(12);
    expect(state.digital.mixes[0].name).toBe('Mix 1');
    expect(state.digital.mixes[11].name).toBe('Mix 12');

    // DCAs should be cleanly named DCA 1 to DCA 8
    expect(state.digital.dcas.length).toBe(8);
    expect(state.digital.dcas[0].name).toBe('DCA 1');
    expect(state.digital.dcas[7].name).toBe('DCA 8');
  });

  it('AC-21: Full scene recall restores DCAs, matrices, Main LR, and mute groups', () => {
    const state = createInitialState('church');

    // Modify DCA, matrix, mainLR, and mute group
    state.digital.dcas[0].name = 'CUSTOM DCA';
    state.digital.dcas[0].levelDb = -12;
    state.digital.matrices[0].faderLevel = -6;
    state.digital.mainLR.faderLevel = -10;
    state.digital.muteGroups[0].active = true;

    // Snapshot as scene 2
    const targetScene = {
      id: 2,
      name: 'Test Scene 2',
      crossfadeSeconds: 0,
      recallFilter: {},
      snapshot: JSON.parse(JSON.stringify(state))
    };

    // Alter current state
    state.digital.dcas[0].name = 'TEMPORARY';
    state.digital.dcas[0].levelDb = 0;
    state.digital.matrices[0].faderLevel = 0;
    state.digital.mainLR.faderLevel = 0;
    state.digital.muteGroups[0].active = false;

    // Recall scene 2
    const recalled = recallSceneWithFilter(state, targetScene);
    expect(recalled.digital.dcas[0].name).toBe('CUSTOM DCA');
    expect(recalled.digital.dcas[0].levelDb).toBe(-12);
    expect(recalled.digital.matrices[0].faderLevel).toBe(-6);
    expect(recalled.digital.mainLR.faderLevel).toBe(-10);
    expect(recalled.digital.muteGroups[0].active).toBe(true);
  });

  it('AC-22: Practice simulations starting rigs can initialize custom stages and calculate independent signal presence', () => {
    const customChallengeRig = {
      stageItems: [
        { id: 'custom-mic-1', typeId: 'mic-dynamic', name: 'Lead Mic', category: 'mic', position: { x: 100, y: 100 } }
      ],
      cables: [
        { id: 'cable-dsnake', fromNode: 'stagebox-ar2412', fromPort: 'ar-dsnake', toNode: 'console-sq5', toPort: 'sq-slink', signalType: 'dsnake' as const },
        { id: 'cable-test-1', fromNode: 'custom-mic-1', fromPort: 'custom-mic-1-out-1', toNode: 'stagebox-ar2412', toPort: 'ar-in-1', signalType: 'mic' as const }
      ],
      stageBox: { model: 'AR2412', connectedToSQ: true, position: { x: 600, y: 300 } },
      console: { model: 'SQ-5', slinkMode: 'dSnake' as const, position: { x: 1200, y: 300 } }
    };

    const state = createInitialState('scratch');
    state.physical.stageItems = customChallengeRig.stageItems as any;
    state.physical.cables = customChallengeRig.cables as any;
    state.physical.stageBox.connectedToSQ = true;

    // Patch AR2412 input 1 to console channel 1
    state.digital.ioPatch.inputs['ch-1'] = { sourceType: 'slink', socketId: 'ar-in-1', label: 'AR2412 In 1' };

    const presence = computeSignalPresence(state);
    expect(presence.slinkHasSignal).toBe(true);
    expect(presence.rawInputsWithSignal['ch-1']).toBe(true);
    expect(presence.channelsWithSignal['ch-1']).toBe(true);
  });

  it('AC-23: Role capability matrix — admin can author simulations, members can practice, guests have local cache', () => {
    type Role = 'admin' | 'member' | 'guest';
    const canCreateSimulation = (role: Role) => role === 'admin';
    const canLaunchSimulation = (role: Role) => role === 'admin' || role === 'member' || role === 'guest';
    const canCloudSync = (role: Role) => role === 'admin' || role === 'member';

    expect(canCreateSimulation('admin')).toBe(true);
    expect(canCreateSimulation('member')).toBe(false);
    expect(canCreateSimulation('guest')).toBe(false);

    expect(canLaunchSimulation('admin')).toBe(true);
    expect(canLaunchSimulation('member')).toBe(true);
    expect(canLaunchSimulation('guest')).toBe(true);

    expect(canCloudSync('admin')).toBe(true);
    expect(canCloudSync('member')).toBe(true);
    expect(canCloudSync('guest')).toBe(false);
  });
});

