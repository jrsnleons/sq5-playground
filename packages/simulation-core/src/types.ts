export type ConnectorType =
  | 'XLR-in'
  | 'XLR-out'
  | 'XLR-link'
  | 'TS'
  | 'TS-in'
  | 'TS-out'
  | 'TS-thru'
  | 'TRS'
  | 'TRS-in'
  | 'TRS-out'
  | '3.5mm'
  | 'EtherCon'
  | 'USB-B'
  | 'AES-XLR';

export type SignalType =
  | 'mic'
  | 'instrument'
  | 'dsnake'
  | 'aes'
  | 'speaker'
  | 'iem'
  | 'click'
  | 'comms'
  | 'generic';

export interface StageItem {
  id: string;
  typeId: string;
  name: string;
  category: 'mic' | 'instrument' | 'di-box' | 'playback' | 'click' | 'comms' | 'speaker' | 'iem' | 'cable';
  position: { x: number; y: number };
  notes?: string;
  photoOverride?: string;
}

export interface Cable {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
  signalType: SignalType;
}

export interface ProcessingPreamp {
  gainDb: number; // 0 to +60 dB
  pad: boolean; // -20 dB
  phantom48V: boolean;
  trimDb: number; // -24 to +24 dB
  delayMs: number; // 0.00 to 341.00 ms
  polarityInverted: boolean;
}

export interface ProcessingHPF {
  enabled: boolean;
  frequencyHz: number; // 20 Hz to 2 kHz
  slopeDbOct: 12 | 18 | 24;
}

export interface ProcessingGate {
  enabled: boolean;
  attackUs: number; // 50 us to 300 ms
  holdMs: number; // 10 ms to 5000 ms
  releaseMs: number; // 10 ms to 1000 ms
  thresholdDb: number; // -72 to +18 dB
  depthDb: number; // 0 to 60 dB
}

export interface ProcessingPEQBand {
  type: 'Shelf' | 'Bell' | 'HPF' | 'LPF';
  frequencyHz: number; // 20 to 20000 Hz
  gainDb: number; // -15 to +15 dB
  q: number; // 0.7 to 10
}

export interface ProcessingPEQ {
  enabled: boolean;
  bands: [ProcessingPEQBand, ProcessingPEQBand, ProcessingPEQBand, ProcessingPEQBand];
}

export interface ProcessingCompressor {
  enabled: boolean;
  thresholdDb: number; // -46 to +18 dB
  ratio: number; // 1 to 100 (inf)
  attackUs: number; // 30 us to 300 ms
  releaseMs: number; // 50 ms to 2000 ms
  makeupGainDb: number; // 0 to 18 dB
  softKnee: boolean;
  parallelMixPercent: number; // 0 to 100
}

export interface ChannelSend {
  mixId: string;
  levelDb: number; // -inf to +10 dB (-90 to +10)
  preFade: boolean;
  assigned: boolean;
}

export interface InputChannel {
  id: string; // "ch-1" ... "ch-48"
  channelNumber: number; // 1 ... 48
  name: string;
  color: string;
  sourceSocketId?: string;
  faderLevel: number; // -90 to +10 dB
  pan: number; // -100 (L) to +100 (R)
  mute: boolean;
  pafl: boolean;
  dcaGroupMask: number; // bitmask for DCA 1-8
  muteGroupMask: number; // bitmask for Mute Group 1-8
  preamp: ProcessingPreamp;
  hpf: ProcessingHPF;
  gate: ProcessingGate;
  peq: ProcessingPEQ;
  compressor: ProcessingCompressor;
  sends: Record<string, ChannelSend>; // keyed by mixId
  mainLRAssigned: boolean;
  mainLRPan: number;
}

export interface MixChannel {
  id: string; // "mix-1" ... "mix-12"
  mixNumber: number;
  name: string;
  mode: 'aux' | 'group';
  stereo: boolean;
  faderLevel: number;
  mute: boolean;
  pafl: boolean;
  geq: number[]; // 28 bands (-12 to +12 dB)
  peq: ProcessingPEQ;
  compressor: ProcessingCompressor;
  delayMs: number; // 0 to 682 ms
  mainLRAssigned: boolean;
}

export interface MatrixChannel {
  id: string; // "matrix-1" ... "matrix-3"
  name: string;
  stereo: boolean;
  source: 'main-lr' | 'mix';
  faderLevel: number;
  mute: boolean;
  pafl: boolean;
}

export interface DCA {
  id: number; // 1 ... 8
  name: string;
  levelDb: number;
  mute: boolean;
}

export interface MuteGroup {
  id: number; // 1 ... 8
  name: string;
  active: boolean;
}

export interface IOPatchMatrix {
  inputs: Record<string, { sourceType: 'local' | 'slink' | 'usb'; socketId: string; label: string }>;
  outputs: Record<string, { destType: 'mix' | 'matrix' | 'main-lr' | 'direct-out'; busId: string; label: string }>;
}

export interface Scene {
  id: number; // 1 ... 300
  name: string;
  crossfadeSeconds: number;
  recallFilter: {
    blockPreamp?: boolean;
    blockPEQ?: boolean;
    blockDynamics?: boolean;
    blockFaders?: boolean;
    blockRouting?: boolean;
  };
  snapshot?: Partial<SimulationState>;
}

export interface PresetMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastModifiedAt: string;
  isFactoryPreset: boolean;
  schemaVersion: number;
}

export interface NodePhoto {
  source: 'stock' | 'user';
  stockPhotoId?: string;
  userPhotoDataUrl?: string;
  userPhotoFileName?: string;
  lastModified?: string;
}

export interface SimulationState {
  entryMode: 'church-preset' | 'scratch';
  physical: {
    stageItems: StageItem[];
    cables: Cable[];
    stageBox: {
      model: 'AR2412';
      connectedToSQ: boolean;
      position: { x: number; y: number };
    };
    console: {
      model: 'SQ-5';
      slinkMode: 'dSnake' | 'DX' | 'gigaACE';
      position: { x: number; y: number };
    };
  };
  digital: {
    ioPatch: IOPatchMatrix;
    channels: InputChannel[];
    mixes: MixChannel[];
    matrices: MatrixChannel[];
    dcas: DCA[];
    muteGroups: MuteGroup[];
    mainLR: {
      faderLevel: number;
      mute: boolean;
      pafl: boolean;
    };
    scenes: Scene[];
    activeSceneId: number;
    session: {
      selectedChannelId: string;
      selectedMixId: string; // "main-lr" or "mix-X"
      activeScreen: 'home' | 'io' | 'processing' | 'routing' | 'fx' | 'meters' | 'scenes' | 'setup' | 'utility';
      layer: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      geqFlipActive: boolean;
      geqFlipPage: 0 | 1 | 2; // 0=off, 1=bands 1-14, 2=bands 15-28
    };
  };
  nodePhotos: Record<string, NodePhoto>;
  activePresetId: string;
}

export interface ValidationNotice {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface SignalPresenceMap {
  channelsWithSignal: Record<string, boolean>;
  iemOnlyChannels: Record<string, boolean>;
  mixesWithSignal: Record<string, boolean>;
  mainLRHasSignal: boolean;
  matricesWithSignal: Record<string, boolean>;
  cableHasSignal: Record<string, boolean>;
  slinkHasSignal: boolean;
}
