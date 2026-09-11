import {
  InputChannel,
  MixChannel,
  MatrixChannel,
  DCA,
  MuteGroup,
  ProcessingPEQ,
  ProcessingCompressor,
  ProcessingGate,
  ProcessingHPF,
  ProcessingPreamp,
  SimulationState,
  Scene
} from './types';
import churchPresetJson from '@foh-sim/hardware-profiles/church-default.json';
import scratchPresetJson from '@foh-sim/hardware-profiles/scratch-default.json';

export function createDefaultPreamp(): ProcessingPreamp {
  return {
    gainDb: 30,
    pad: false,
    phantom48V: false,
    trimDb: 0,
    delayMs: 0,
    polarityInverted: false
  };
}

export function createDefaultHPF(): ProcessingHPF {
  return {
    enabled: false,
    frequencyHz: 80,
    slopeDbOct: 18
  };
}

export function createDefaultGate(): ProcessingGate {
  return {
    enabled: false,
    attackUs: 500,
    holdMs: 50,
    releaseMs: 100,
    thresholdDb: -40,
    depthDb: 20
  };
}

export function createDefaultPEQ(): ProcessingPEQ {
  return {
    enabled: true,
    bands: [
      { type: 'Shelf', frequencyHz: 80, gainDb: 0, q: 1.0 },
      { type: 'Bell', frequencyHz: 400, gainDb: 0, q: 1.0 },
      { type: 'Bell', frequencyHz: 2500, gainDb: 0, q: 1.0 },
      { type: 'Shelf', frequencyHz: 10000, gainDb: 0, q: 1.0 }
    ]
  };
}

export function createDefaultCompressor(): ProcessingCompressor {
  return {
    enabled: false,
    thresholdDb: -20,
    ratio: 4,
    attackUs: 20000,
    releaseMs: 200,
    makeupGainDb: 0,
    softKnee: true,
    parallelMixPercent: 100
  };
}

export function createInitialChannels(presetType: 'church' | 'scratch'): InputChannel[] {
  const channels: InputChannel[] = [];

  const churchNames: Record<number, string> = {
    1: 'Audience R',
    2: 'Mic 1',
    3: 'Mic 2',
    4: 'Mic 3',
    5: 'Mic 4',
    6: 'Mic 5',
    7: 'Click Keys',
    8: 'Click Drums',
    9: 'Lapel',
    10: 'Comms Keys',
    11: 'Comms Bass',
    12: 'Comms Drums',
    13: 'Keys',
    14: 'Electric Guitar',
    15: 'Acoustic Guitar',
    16: 'Bass Guitar',
    17: 'Kick',
    18: 'Snare Top',
    19: 'Tom 1',
    20: 'Snare Bottom',
    21: 'Floor Tom',
    22: 'Hihats',
    23: 'Overheads',
    24: 'Audience L',
    25: 'PROPC L',
    26: 'PROPC R',
    27: 'WIRELESS 1',
    28: 'WIRELESS 2'
  };

  for (let i = 1; i <= 48; i++) {
    const chId = `ch-${i}`;
    const name = presetType === 'church' && churchNames[i] ? churchNames[i] : `CH ${i}`;
    const isClickOrComms =
      name.toLowerCase().includes('click') || name.toLowerCase().includes('comms');

    const sends: InputChannel['sends'] = {};
    for (let m = 1; m <= 12; m++) {
      const mixId = `mix-${m}`;
      let assigned = false;
      let levelDb = -90;

      if (presetType === 'church') {
        // Stream Aux 1
        if (!isClickOrComms && mixId === 'mix-1') { assigned = true; levelDb = 0; }
        // IEM mixes:
        // mix-2: AG, mix-3: WL, mix-4: BACKUP, mix-5: KEYS, mix-6: EG, mix-7: BASS, mix-8: DRUMS, mix-9: Subwoofer
        if (name === 'Acoustic Guitar' && mixId === 'mix-2') { assigned = true; levelDb = 0; }
        if ((name === 'Mic 1' || name.startsWith('WIRELESS')) && mixId === 'mix-3') { assigned = true; levelDb = 0; }
        if (name.startsWith('Mic') && mixId === 'mix-4') { assigned = true; levelDb = 0; }
        if (name === 'Keys' && mixId === 'mix-5') { assigned = true; levelDb = 0; }
        if (name === 'Electric Guitar' && mixId === 'mix-6') { assigned = true; levelDb = 0; }
        if (name === 'Bass Guitar' && mixId === 'mix-7') { assigned = true; levelDb = 0; }
        if (name.includes('Snare') || name === 'Kick' || name.includes('Tom') || name === 'Hihats' || name === 'Overheads') {
          if (mixId === 'mix-8') { assigned = true; levelDb = 0; } // Drummer IEM
          if (mixId === 'mix-9') { assigned = true; levelDb = name === 'Kick' ? 0 : -6; } // Subwoofer Aux
          // Subgroup: GRP Drums (mix-12)
          if (mixId === 'mix-12') { assigned = true; levelDb = 0; }
        }
        if (name.startsWith('Mic') || name === 'Lapel' || name.startsWith('WIRELESS')) {
          // Subgroup: GRP Vocals (mix-10)
          if (mixId === 'mix-10') { assigned = true; levelDb = 0; }
        }
        if (name === 'Keys' || name === 'Electric Guitar' || name === 'Acoustic Guitar' || name === 'Bass Guitar') {
          // Subgroup: GRP Instruments (mix-11)
          if (mixId === 'mix-11') { assigned = true; levelDb = 0; }
        }
        if (name === 'Click Keys' && (mixId === 'mix-5' || mixId === 'mix-3')) { assigned = true; levelDb = 0; }
        if (name === 'Click Drums' && mixId === 'mix-8') { assigned = true; levelDb = 0; }
      }

      sends[mixId] = {
        mixId,
        levelDb,
        preFade: isClickOrComms || m <= 9, // Auxes 1-9 pre-fade by default
        assigned
      };
    }

    // Drum channels belong to DCA 1 in church rig
    let dcaGroupMask = 0;
    if (presetType === 'church' && (name.includes('Snare') || name === 'Kick' || name.includes('Tom') || name === 'Hihats' || name === 'Overheads')) {
      dcaGroupMask = 1; // DCA 1
    }

    const preamp = createDefaultPreamp();
    if (name === 'Hihats' || name === 'Overheads') {
      preamp.phantom48V = true;
    }

    const isStereoMaster = presetType === 'church' && i === 25;
    const isStereoSlave = presetType === 'church' && i === 26;
    const isStereoLinked = isStereoMaster || isStereoSlave;

    channels.push({
      id: chId,
      channelNumber: i,
      name,
      color: isClickOrComms ? '#eab308' : i <= 6 ? '#3b82f6' : i <= 16 ? '#f97316' : '#a855f7',
      faderLevel: 0,
      pan: isStereoMaster ? -100 : isStereoSlave ? 100 : 0,
      mute: false,
      pafl: false,
      dcaGroupMask,
      muteGroupMask: 0,
      stereo: isStereoLinked,
      isStereoSlave: isStereoSlave,
      linkedChannelId: isStereoMaster ? 'ch-26' : isStereoSlave ? 'ch-25' : undefined,
      preamp,
      hpf: createDefaultHPF(),
      gate: createDefaultGate(),
      peq: createDefaultPEQ(),
      compressor: createDefaultCompressor(),
      sends,
      mainLRAssigned: !isClickOrComms, // Click & Comms NEVER assigned to Main LR
      mainLRPan: isStereoMaster ? -100 : isStereoSlave ? 100 : 0
    });
  }

  return channels;
}

export function createInitialMixes(presetType: 'church' | 'scratch' = 'church'): MixChannel[] {
  if (presetType === 'scratch') {
    return Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      return {
        id: `mix-${num}`,
        mixNumber: num,
        name: `Mix ${num}`,
        mode: 'aux' as const,
        stereo: false,
        faderLevel: 0,
        mute: false,
        pafl: false,
        geq: new Array(28).fill(0),
        peq: createDefaultPEQ(),
        compressor: createDefaultCompressor(),
        delayMs: 0,
        mainLRAssigned: false
      };
    });
  }

  const mixDefs: Array<{ id: string; num: number; name: string; mode: 'aux' | 'group'; stereo: boolean; mainLRAssigned?: boolean }> = [
    { id: 'mix-1', num: 1, name: 'Stream', mode: 'aux', stereo: true },
    { id: 'mix-2', num: 2, name: 'IEM AG', mode: 'aux', stereo: false },
    { id: 'mix-3', num: 3, name: 'IEM WL', mode: 'aux', stereo: false },
    { id: 'mix-4', num: 4, name: 'IEM BACKUP', mode: 'aux', stereo: false },
    { id: 'mix-5', num: 5, name: 'IEM KEYS', mode: 'aux', stereo: false },
    { id: 'mix-6', num: 6, name: 'IEM EG', mode: 'aux', stereo: false },
    { id: 'mix-7', num: 7, name: 'IEM BASS', mode: 'aux', stereo: false },
    { id: 'mix-8', num: 8, name: 'IEM DRUMS', mode: 'aux', stereo: false },
    { id: 'mix-9', num: 9, name: 'Subwoofer', mode: 'aux', stereo: false },
    { id: 'mix-10', num: 10, name: 'GRP Vocals', mode: 'group', stereo: true, mainLRAssigned: true },
    { id: 'mix-11', num: 11, name: 'GRP Instruments', mode: 'group', stereo: true, mainLRAssigned: true },
    { id: 'mix-12', num: 12, name: 'GRP Drums', mode: 'group', stereo: true, mainLRAssigned: true }
  ];

  return mixDefs.map((m) => ({
    id: m.id,
    mixNumber: m.num,
    name: m.name,
    mode: m.mode,
    stereo: m.stereo,
    faderLevel: 0,
    mute: false,
    pafl: false,
    geq: new Array(28).fill(0),
    peq: createDefaultPEQ(),
    compressor: createDefaultCompressor(),
    delayMs: 0,
    mainLRAssigned: m.mainLRAssigned ?? false
  }));
}

export function createInitialMatrices(): MatrixChannel[] {
  return [
    { id: 'matrix-1', name: 'Left Array Matrix', stereo: true, source: 'main-lr', faderLevel: 0, mute: false, pafl: false },
    { id: 'matrix-2', name: 'Right Array Matrix', stereo: true, source: 'main-lr', faderLevel: 0, mute: false, pafl: false },
    { id: 'matrix-3', name: 'Matrix 3', stereo: true, source: 'main-lr', faderLevel: 0, mute: false, pafl: false }
  ];
}

export function createInitialDCAs(presetType: 'church' | 'scratch' = 'church'): DCA[] {
  if (presetType === 'scratch') {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `DCA ${i + 1}`,
      levelDb: 0,
      mute: false
    }));
  }
  return [
    { id: 1, name: 'DRUMS', levelDb: 0, mute: false },
    { id: 2, name: 'VOCALS', levelDb: 0, mute: false },
    { id: 3, name: 'BAND', levelDb: 0, mute: false },
    { id: 4, name: 'PLAYBACK', levelDb: 0, mute: false },
    { id: 5, name: 'DCA 5', levelDb: 0, mute: false },
    { id: 6, name: 'DCA 6', levelDb: 0, mute: false },
    { id: 7, name: 'DCA 7', levelDb: 0, mute: false },
    { id: 8, name: 'DCA 8', levelDb: 0, mute: false }
  ];
}

export function createInitialMuteGroups(): MuteGroup[] {
  return [
    { id: 1, name: 'BAND', active: false },
    { id: 2, name: 'MICS', active: false },
    { id: 3, name: 'FX MUTE', active: false },
    { id: 4, name: 'ALL MUTE', active: false },
    { id: 5, name: 'MG 5', active: false },
    { id: 6, name: 'MG 6', active: false },
    { id: 7, name: 'MG 7', active: false },
    { id: 8, name: 'MG 8', active: false }
  ];
}

export function createInitialState(preset: 'church' | 'scratch' = 'church'): SimulationState {
  const isChurch = preset === 'church';
  const rawPreset = isChurch
    ? JSON.parse(JSON.stringify(churchPresetJson))
    : JSON.parse(JSON.stringify(scratchPresetJson));

  return {
    entryMode: isChurch ? 'church-preset' : 'scratch',
    physical: {
      stageItems: rawPreset.physical.stageItems || [],
      cables: rawPreset.physical.cables || [],
      stageBox: {
        model: 'AR2412',
        connectedToSQ: isChurch,
        position: { ...rawPreset.physical.stageBox.position }
      },
      console: {
        model: 'SQ-5',
        slinkMode: 'dSnake',
        position: { ...rawPreset.physical.console.position }
      }
    },
    digital: {
      ioPatch: rawPreset.digital.ioPatch || { inputs: {}, outputs: {} },
      channels: createInitialChannels(preset),
      mixes: createInitialMixes(preset),
      matrices: createInitialMatrices(),
      dcas: createInitialDCAs(preset),
      muteGroups: createInitialMuteGroups(),
      mainLR: {
        faderLevel: 0,
        mute: false,
        pafl: false
      },
      scenes: [
        { id: 1, name: 'Default Sunday Service', crossfadeSeconds: 0, recallFilter: {} }
      ],
      activeSceneId: 1,
      session: {
        selectedChannelId: 'ch-2', // Mic 1 default
        selectedMixId: 'main-lr',
        activeScreen: 'home',
        layer: 'A',
        geqFlipActive: false,
        geqFlipPage: 0
      }
    },
    nodePhotos: {},
    activePresetId: isChurch ? 'church-default' : 'scratch-default'
  };
}

export function recallSceneWithFilter(
  currentState: SimulationState,
  targetScene: Scene
): SimulationState {
  if (!targetScene.snapshot || !targetScene.snapshot.digital) {
    return currentState;
  }
  const snap = targetScene.snapshot as SimulationState;
  const filter = targetScene.recallFilter || {};

  const nextChannels = currentState.digital.channels.map((currentCh, index) => {
    const snapCh = snap.digital.channels[index];
    if (!snapCh) return currentCh;

    return {
      ...snapCh,
      peq: filter.blockPEQ ? currentCh.peq : snapCh.peq,
      preamp: filter.blockPreamp ? currentCh.preamp : snapCh.preamp,
      gate: filter.blockDynamics ? currentCh.gate : snapCh.gate,
      compressor: filter.blockDynamics ? currentCh.compressor : snapCh.compressor,
      faderLevel: filter.blockFaders ? currentCh.faderLevel : snapCh.faderLevel,
      sends: filter.blockRouting ? currentCh.sends : snapCh.sends
    };
  });

  return {
    ...currentState,
    digital: {
      ...currentState.digital,
      activeSceneId: targetScene.id,
      channels: nextChannels,
      mixes: filter.blockFaders ? currentState.digital.mixes : (snap.digital.mixes || currentState.digital.mixes),
      ioPatch: filter.blockRouting ? currentState.digital.ioPatch : (snap.digital.ioPatch || currentState.digital.ioPatch),
      dcas: filter.blockFaders ? currentState.digital.dcas : (snap.digital.dcas || currentState.digital.dcas),
      matrices: filter.blockFaders ? currentState.digital.matrices : (snap.digital.matrices || currentState.digital.matrices),
      mainLR: filter.blockFaders ? currentState.digital.mainLR : (snap.digital.mainLR || currentState.digital.mainLR),
      muteGroups: snap.digital.muteGroups || currentState.digital.muteGroups
    }
  };
}

export function exportPresetAsJson(state: SimulationState, name: string): string {
  const payload = {
    metadata: {
      id: `preset-${Date.now()}`,
      name,
      schemaVersion: 1,
      createdAt: new Date().toISOString()
    },
    state
  };
  return JSON.stringify(payload, null, 2);
}

export function importPresetFromJson(jsonString: string): SimulationState {
  const parsed = JSON.parse(jsonString);
  if (!parsed.state || !parsed.state.digital || !parsed.state.physical) {
    throw new Error('Invalid preset JSON format');
  }
  return parsed.state;
}

