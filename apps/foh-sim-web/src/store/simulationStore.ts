import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  SimulationState,
  StageItem,
  Cable,
  SignalType,
  InputChannel,
  MixChannel,
  SignalPresenceMap,
  ValidationNotice,
  createInitialState,
  computeSignalPresence,
  validateSystemState,
  validateCableConnection
} from '@foh-sim/simulation-core';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';

interface SimulationStoreState {
  sim: SimulationState;
  signalPresence: SignalPresenceMap;
  validationNotices: ValidationNotice[];
  selectedNodeId: string | null;
  activeTab: 'stage' | 'console' | 'meters' | 'scenes' | 'setup' | 'help';
  showEntryModal: boolean;
  noticesModalOpen: boolean;

  // Actions
  setActiveTab: (tab: 'stage' | 'console' | 'meters' | 'scenes' | 'setup' | 'help') => void;
  setSelectedNodeId: (id: string | null) => void;
  setNoticesModalOpen: (open: boolean) => void;
  setShowEntryModal: (show: boolean) => void;

  // Presets & Modes
  loadPreset: (mode: 'church' | 'scratch') => void;
  resetCurrentPreset: () => void;

  // Physical actions
  addStageItem: (typeId: string, position: { x: number; y: number }) => void;
  updateStageItemPosition: (id: string, position: { x: number; y: number }) => void;
  updateStageItemDetails: (id: string, updates: { name?: string; notes?: string }) => void;
  removeStageItem: (id: string) => void;
  connectCable: (fromNode: string, fromPort: string, toNode: string, toPort: string, signalType: SignalType) => boolean;
  removeCable: (cableId: string) => void;

  // Digital Console actions
  setActiveScreen: (screen: SimulationState['digital']['session']['activeScreen']) => void;
  setSelectedChannel: (channelId: string) => void;
  setSelectedMix: (mixId: string) => void;
  setLayer: (layer: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => void;
  setChannelFader: (channelId: string, levelDb: number) => void;
  setChannelPan: (channelId: string, pan: number) => void;
  toggleChannelMute: (channelId: string) => void;
  toggleChannelPAFL: (channelId: string) => void;
  toggleChannelMainLR: (channelId: string) => void;
  setChannelSend: (channelId: string, mixId: string, levelDb: number, assigned?: boolean) => void;
  toggleSendPreFade: (channelId: string, mixId: string) => void;
  updateChannelPreamp: (channelId: string, updates: Partial<InputChannel['preamp']>) => void;
  updateChannelHPF: (channelId: string, updates: Partial<InputChannel['hpf']>) => void;
  updateChannelGate: (channelId: string, updates: Partial<InputChannel['gate']>) => void;
  updateChannelPEQBand: (channelId: string, bandIndex: number, updates: Partial<InputChannel['peq']['bands'][number]>) => void;
  toggleChannelPEQ: (channelId: string) => void;
  updateChannelCompressor: (channelId: string, updates: Partial<InputChannel['compressor']>) => void;
  updateChannelName: (channelId: string, name: string) => void;

  // Master & Bus actions
  setMainLRFader: (levelDb: number) => void;
  toggleMainLRMute: () => void;
  setMixFader: (mixId: string, levelDb: number) => void;
  toggleMixMute: (mixId: string) => void;
  toggleDCAMute: (dcaId: number) => void;
  setDCALevel: (dcaId: number, levelDb: number) => void;
  toggleMuteGroup: (mgId: number) => void;
  cycleGeqFlip: () => void;
  setMixGeqBand: (mixId: string, bandIndex: number, gainDb: number) => void;
  resetMixGeqBand: (mixId: string, bandIndex: number) => void;

  // I/O Patch Matrix
  patchInputSocket: (channelId: string, sourceType: 'local' | 'slink' | 'usb', socketId: string, label: string) => void;
  unpatchInputSocket: (channelId: string) => void;
  patchOutputSocket: (socketId: string, destType: 'mix' | 'matrix' | 'main-lr' | 'direct-out', busId: string, label: string) => void;
  unpatchOutputSocket: (socketId: string) => void;

  // Scenes
  saveScene: (sceneId: number, name?: string) => void;
  recallScene: (sceneId: number) => void;
}

const initialSim = createInitialState('church');
const initialPresence = computeSignalPresence(initialSim);
const initialNotices = validateSystemState(initialSim);

export const useSimulationStore = create<SimulationStoreState>()(
  immer((set, get) => ({
    sim: initialSim,
    signalPresence: initialPresence,
    validationNotices: initialNotices,
    selectedNodeId: null,
    activeTab: 'stage',
    showEntryModal: false,
    noticesModalOpen: false,

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    setSelectedNodeId: (id) =>
      set((state) => {
        state.selectedNodeId = id;
      }),

    setNoticesModalOpen: (open) =>
      set((state) => {
        state.noticesModalOpen = open;
      }),

    setShowEntryModal: (show) =>
      set((state) => {
        state.showEntryModal = show;
      }),

    loadPreset: (mode) =>
      set((state) => {
        state.sim = createInitialState(mode);
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
        state.selectedNodeId = null;
        state.showEntryModal = false;
      }),

    resetCurrentPreset: () =>
      set((state) => {
        const mode = state.sim.entryMode === 'church-preset' ? 'church' : 'scratch';
        state.sim = createInitialState(mode);
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    addStageItem: (typeId, position) =>
      set((state) => {
        const catalogItem = stageItemsCatalog.find((c) => c.id === typeId);
        if (!catalogItem) return;

        const uniqueId = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const newItem: StageItem = {
          id: uniqueId,
          typeId: catalogItem.id,
          name: catalogItem.displayName,
          category: catalogItem.category as StageItem['category'],
          position
        };

        state.sim.physical.stageItems.push(newItem);
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    updateStageItemPosition: (id, position) =>
      set((state) => {
        const item = state.sim.physical.stageItems.find((i) => i.id === id);
        if (item) {
          item.position = position;
        } else if (id === 'stagebox-ar2412') {
          state.sim.physical.stageBox.position = position;
        } else if (id === 'console-sq5') {
          state.sim.physical.console.position = position;
        }
      }),

    updateStageItemDetails: (id, updates) =>
      set((state) => {
        const item = state.sim.physical.stageItems.find((i) => i.id === id);
        if (item) {
          if (updates.name !== undefined) item.name = updates.name;
          if (updates.notes !== undefined) item.notes = updates.notes;
        }
      }),

    removeStageItem: (id) =>
      set((state) => {
        state.sim.physical.stageItems = state.sim.physical.stageItems.filter((i) => i.id !== id);
        state.sim.physical.cables = state.sim.physical.cables.filter(
          (c) => c.fromNode !== id && c.toNode !== id
        );
        if (state.selectedNodeId === id) state.selectedNodeId = null;
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    connectCable: (fromNode, fromPort, toNode, toPort, signalType) => {
      let allowed = false;
      set((state) => {
        const validation = validateCableConnection(fromNode, fromPort, toNode, toPort, state.sim);
        if (!validation.allowed) {
          state.validationNotices = [...state.validationNotices, ...validation.notices];
          allowed = false;
          return;
        }

        // Avoid duplicate cables between exact same ports
        const exists = state.sim.physical.cables.some(
          (c) => c.fromPort === fromPort && c.toPort === toPort && c.fromNode === fromNode && c.toNode === toNode
        );
        if (exists) return;

        const newCable: Cable = {
          id: `cable-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          fromNode,
          fromPort,
          toNode,
          toPort,
          signalType
        };

        state.sim.physical.cables.push(newCable);

        if (signalType === 'dsnake') {
          state.sim.physical.stageBox.connectedToSQ = true;
        }

        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
        allowed = true;
      });
      return allowed;
    },

    removeCable: (cableId) =>
      set((state) => {
        const cable = state.sim.physical.cables.find((c) => c.id === cableId);
        if (cable && cable.signalType === 'dsnake') {
          state.sim.physical.stageBox.connectedToSQ = false;
        }
        state.sim.physical.cables = state.sim.physical.cables.filter((c) => c.id !== cableId);
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    setActiveScreen: (screen) =>
      set((state) => {
        state.sim.digital.session.activeScreen = screen;
      }),

    setSelectedChannel: (channelId) =>
      set((state) => {
        state.sim.digital.session.selectedChannelId = channelId;
      }),

    setSelectedMix: (mixId) =>
      set((state) => {
        state.sim.digital.session.selectedMixId = mixId;
      }),

    setLayer: (layer) =>
      set((state) => {
        state.sim.digital.session.layer = layer;
      }),

    setChannelFader: (channelId, levelDb) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          ch.faderLevel = levelDb;
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    setChannelPan: (channelId, pan) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) ch.pan = pan;
      }),

    toggleChannelMute: (channelId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          ch.mute = !ch.mute;
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    toggleChannelPAFL: (channelId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) ch.pafl = !ch.pafl;
      }),

    toggleChannelMainLR: (channelId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          ch.mainLRAssigned = !ch.mainLRAssigned;
          state.signalPresence = computeSignalPresence(state.sim);
          state.validationNotices = validateSystemState(state.sim);
        }
      }),

    setChannelSend: (channelId, mixId, levelDb, assigned) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          if (!ch.sends[mixId]) {
            ch.sends[mixId] = { mixId, levelDb, preFade: false, assigned: assigned ?? true };
          } else {
            ch.sends[mixId].levelDb = levelDb;
            if (assigned !== undefined) ch.sends[mixId].assigned = assigned;
          }
          state.signalPresence = computeSignalPresence(state.sim);
          state.validationNotices = validateSystemState(state.sim);
        }
      }),

    toggleSendPreFade: (channelId, mixId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch && ch.sends[mixId]) {
          ch.sends[mixId].preFade = !ch.sends[mixId].preFade;
        }
      }),

    updateChannelPreamp: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          Object.assign(ch.preamp, updates);
          state.validationNotices = validateSystemState(state.sim);
        }
      }),

    updateChannelHPF: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) Object.assign(ch.hpf, updates);
      }),

    updateChannelGate: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) Object.assign(ch.gate, updates);
      }),

    updateChannelPEQBand: (channelId, bandIndex, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch && ch.peq.bands[bandIndex]) {
          Object.assign(ch.peq.bands[bandIndex], updates);
        }
      }),

    toggleChannelPEQ: (channelId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) ch.peq.enabled = !ch.peq.enabled;
      }),

    updateChannelCompressor: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) Object.assign(ch.compressor, updates);
      }),

    updateChannelName: (channelId, name) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          ch.name = name;
          state.validationNotices = validateSystemState(state.sim);
        }
      }),

    setMainLRFader: (levelDb) =>
      set((state) => {
        state.sim.digital.mainLR.faderLevel = levelDb;
        state.signalPresence = computeSignalPresence(state.sim);
      }),

    toggleMainLRMute: () =>
      set((state) => {
        state.sim.digital.mainLR.mute = !state.sim.digital.mainLR.mute;
        state.signalPresence = computeSignalPresence(state.sim);
      }),

    setMixFader: (mixId, levelDb) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix) {
          mix.faderLevel = levelDb;
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    toggleMixMute: (mixId) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix) {
          mix.mute = !mix.mute;
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    toggleDCAMute: (dcaId) =>
      set((state) => {
        const dca = state.sim.digital.dcas.find((d) => d.id === dcaId);
        if (dca) {
          dca.mute = !dca.mute;
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    setDCALevel: (dcaId, levelDb) =>
      set((state) => {
        const dca = state.sim.digital.dcas.find((d) => d.id === dcaId);
        if (dca) dca.levelDb = levelDb;
      }),

    toggleMuteGroup: (mgId) =>
      set((state) => {
        const mg = state.sim.digital.muteGroups.find((m) => m.id === mgId);
        if (mg) {
          mg.active = !mg.active;
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    cycleGeqFlip: () =>
      set((state) => {
        const current = state.sim.digital.session.geqFlipPage;
        const next = current === 0 ? 1 : current === 1 ? 2 : 0;
        state.sim.digital.session.geqFlipPage = next;
        state.sim.digital.session.geqFlipActive = next > 0;
      }),

    setMixGeqBand: (mixId, bandIndex, gainDb) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix && mix.geq[bandIndex] !== undefined) {
          mix.geq[bandIndex] = gainDb;
        }
      }),

    resetMixGeqBand: (mixId, bandIndex) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix && mix.geq[bandIndex] !== undefined) {
          mix.geq[bandIndex] = 0;
        }
      }),

    patchInputSocket: (channelId, sourceType, socketId, label) =>
      set((state) => {
        state.sim.digital.ioPatch.inputs[channelId] = { sourceType, socketId, label };
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    unpatchInputSocket: (channelId) =>
      set((state) => {
        delete state.sim.digital.ioPatch.inputs[channelId];
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    patchOutputSocket: (socketId, destType, busId, label) =>
      set((state) => {
        state.sim.digital.ioPatch.outputs[socketId] = { destType, busId, label };
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    unpatchOutputSocket: (socketId) =>
      set((state) => {
        delete state.sim.digital.ioPatch.outputs[socketId];
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    saveScene: (sceneId, name) =>
      set((state) => {
        const existing = state.sim.digital.scenes.find((s) => s.id === sceneId);
        if (existing) {
          if (name) existing.name = name;
          existing.snapshot = JSON.parse(JSON.stringify(state.sim));
        } else {
          state.sim.digital.scenes.push({
            id: sceneId,
            name: name || `Scene ${sceneId}`,
            crossfadeSeconds: 0,
            recallFilter: {},
            snapshot: JSON.parse(JSON.stringify(state.sim))
          });
        }
      }),

    recallScene: (sceneId) =>
      set((state) => {
        const targetScene = state.sim.digital.scenes.find((s) => s.id === sceneId);
        if (targetScene && targetScene.snapshot) {
          // Restore snapshotted channel processing and faders while respecting filters
          const snap = targetScene.snapshot as SimulationState;
          if (snap.digital) {
            state.sim.digital.channels = JSON.parse(JSON.stringify(snap.digital.channels));
            state.sim.digital.mixes = JSON.parse(JSON.stringify(snap.digital.mixes));
            state.sim.digital.ioPatch = JSON.parse(JSON.stringify(snap.digital.ioPatch));
            state.signalPresence = computeSignalPresence(state.sim);
            state.validationNotices = validateSystemState(state.sim);
          }
        }
        state.sim.digital.activeSceneId = sceneId;
      })
  }))
);
