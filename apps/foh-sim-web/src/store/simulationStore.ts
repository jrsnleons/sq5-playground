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
  CustomPortDef,
  createInitialState,
  computeSignalPresence,
  validateSystemState,
  validateCableConnection
} from '@foh-sim/simulation-core';
import stageItemsCatalog from '@foh-sim/hardware-profiles/stage-items.json';
import { localCache, MemberScene, DEFAULT_OFFICIAL_SCENES, EquipmentInventoryItem } from '../services/localCache';
import { simulationService } from '../services/simulationService';
import { sceneService } from '../services/sceneService';
import { inventoryService } from '../services/inventoryService';
import { userService, CreateUserInput } from '../services/userService';
import {
  UserProfile,
  UserRole,
  PracticeSimulation,
  isSupabaseConfigured,
  supabase
} from '../services/supabase';

export interface CustomEquipmentCatalogItem {
  id: string;
  name: string;
  category: StageItem['category'];
  connectorTypes: string[];
  makeModel?: string;
  notes?: string;
  ports?: CustomPortDef[];
}

interface SimulationStoreState {
  sim: SimulationState;
  signalPresence: SignalPresenceMap;
  validationNotices: ValidationNotice[];
  selectedNodeId: string | null;
  activeTab: 'stage' | 'console' | 'inventory' | 'scenes' | 'setup' | 'help';
  showEntryModal: boolean;
  noticesModalOpen: boolean;
  toastNotice: { id: string; message: string; type: 'error' | 'warning' | 'info' } | null;
  setToastNotice: (notice: { message: string; type?: 'error' | 'warning' | 'info' } | null) => void;

  // Node Photo Customization
  setNodePhoto: (nodeId: string, photoData: string) => void;
  removeNodePhoto: (nodeId: string) => void;

  // Inventory Tracking
  inventory: Record<string, { totalStock: number; notes?: string }>;
  inventoryItems: EquipmentInventoryItem[];
  inventoryLoading: boolean;
  fetchInventory: () => Promise<void>;
  updateInventoryStock: (typeId: string, totalStock: number) => void;
  saveInventoryItem: (
    item: Partial<EquipmentInventoryItem> & { id: string; name: string; category: string }
  ) => Promise<{ success: boolean; savedToCloud: boolean }>;
  deleteInventoryItem: (itemId: string) => Promise<boolean>;

  // Admin & Custom Nodes
  adminMode: boolean;
  toggleAdminMode: () => void;
  customCatalog: CustomEquipmentCatalogItem[];
  addCustomEquipmentType: (entry: {
    id: string;
    name: string;
    category: StageItem['category'];
    ports: CustomPortDef[];
    makeModel?: string;
    totalStock?: number;
  }) => void;
  saveStageAsDefaultPreset: () => void;

  // Actions
  setActiveTab: (tab: 'stage' | 'console' | 'inventory' | 'scenes' | 'setup' | 'help') => void;
  setSelectedNodeId: (id: string | null) => void;
  setNoticesModalOpen: (open: boolean) => void;
  setShowEntryModal: (show: boolean) => void;

  // Auth & Roles (Admin / Member / Guest)
  currentUser: UserProfile | null;
  userRole: UserRole;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  signOut: () => void;

  // Team Users & Password Management
  teamProfiles: UserProfile[];
  teamProfilesLoading: boolean;
  fetchTeamProfiles: () => Promise<void>;
  adminCreateUser: (input: CreateUserInput) => Promise<{ user: UserProfile; success: boolean }>;
  adminUpdateUserRole: (userId: string, newRole: 'admin' | 'member') => Promise<void>;
  adminDeleteUser: (userId: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;

  // Practice Simulations & Training Challenges
  simulationsList: PracticeSimulation[];
  activeSimulation: PracticeSimulation | null;
  simulationsModalOpen: boolean;
  adminCreateModalOpen: boolean;
  briefingBannerVisible: boolean;
  setSimulationsModalOpen: (open: boolean) => void;
  setAdminCreateModalOpen: (open: boolean) => void;
  setBriefingBannerVisible: (visible: boolean) => void;
  loadSimulation: (sim: PracticeSimulation) => void;
  exitSimulation: () => void;
  refreshSimulations: () => Promise<void>;
  publishNewSimulation: (payload: {
    title: string;
    description: string;
    category: PracticeSimulation['category'];
    difficulty: PracticeSimulation['difficulty'];
    briefing: string;
  }) => Promise<boolean>;

  // Cloud Sync
  syncStatus: 'offline' | 'local-only' | 'syncing' | 'synced' | 'error';
  setSyncStatus: (status: 'offline' | 'local-only' | 'syncing' | 'synced' | 'error') => void;

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

  // Wire Tracing & Physical Inspection
  activeTrace: {
    cableId: string | null;
    socketId: string | null;
    nodeId: string | null;
    isLocked: boolean;
  } | null;
  setHoverTrace: (socketId: string | null, nodeId: string | null) => void;
  setLockedTrace: (socketId: string | null, nodeId: string | null) => void;
  clearTrace: () => void;

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
  setGeqFlipPage: (page: 0 | 1 | 2) => void;
  setMixGeqBand: (mixId: string, bandIndex: number, gainDb: number) => void;
  resetMixGeqBand: (mixId: string, bandIndex: number) => void;
  resetAllMixGeq: (mixId: string) => void;

  // Bus Architecture & Stereo Linking (Setup > Mixer Config)
  toggleInputChannelStereo: (channelNumber: number) => void;
  toggleMixStereo: (mixId: string) => void;
  toggleMixMode: (mixId: string) => void;
  toggleMixMainLR: (mixId: string) => void;
  setSendTapPoint: (channelId: string, mixId: string, tapPoint: InputChannel['sends'][string]['tapPoint']) => void;
  toggleMatrixStereo: (matrixId: string) => void;
  setMatrixFader: (matrixId: string, levelDb: number) => void;
  setMatrixSource: (matrixId: string, source: 'main-lr' | 'mix') => void;
  toggleMatrixMute: (matrixId: string) => void;
  setGlobalAuxPreFade: (preFade: boolean) => void;

  // DCA Group Management
  setDcaMembership: (channelId: string, dcaId: number, isMember: boolean) => void;
  setDcaAllMembers: (dcaId: number, channelIds: string[]) => void;
  updateDcaName: (dcaId: number, name: string) => void;

  // I/O Patch Matrix
  patchInputSocket: (channelId: string, sourceType: 'local' | 'slink' | 'usb', socketId: string, label: string) => void;
  unpatchInputSocket: (channelId: string) => void;
  patchOutputSocket: (socketId: string, destType: 'mix' | 'matrix' | 'main-lr' | 'direct-out', busId: string, label: string) => void;
  unpatchOutputSocket: (socketId: string) => void;

  // Scenes
  saveScene: (sceneId: number, name?: string) => void;
  recallScene: (sceneId: number) => void;
  officialScenes: MemberScene[];
  userScenes: MemberScene[];
  scenesLoading: boolean;
  fetchScenes: () => Promise<void>;
  recallMemberScene: (scene: MemberScene) => void;
  saveUserScene: (
    name: string,
    description?: string,
    isOfficial?: boolean,
    existingId?: string,
    sceneNumber?: number,
    sceneDataOverride?: any
  ) => Promise<{ success: boolean; savedToCloud: boolean }>;
  deleteUserScene: (sceneId: string, isOfficial?: boolean) => Promise<boolean>;
}

const defaultInventory: Record<string, { totalStock: number; notes?: string }> = {
  'mic-dynamic': { totalStock: 8, notes: 'Shure SM58' },
  'mic-condenser': { totalStock: 4, notes: 'Rode NT5 / AKG P170' },
  'mic-lapel': { totalStock: 4, notes: 'Wireless Lavalier Bodypack' },
  'mic-wireless-hh-1': { totalStock: 2, notes: 'Shure PG28 Handheld 1' },
  'mic-wireless-hh-2': { totalStock: 2, notes: 'Shure PG28 Handheld 2' },
  'mic-kick': { totalStock: 2, notes: 'Shure Beta 52A' },
  'mic-snare': { totalStock: 4, notes: 'Shure SM57' },
  'mic-tom': { totalStock: 4, notes: 'Sennheiser e604' },
  'mic-fl-tom': { totalStock: 2, notes: 'Sennheiser e604' },
  'mic-hihat': { totalStock: 2, notes: 'Shure SM81' },
  'mic-oh': { totalStock: 2, notes: 'AKG C414 / Rode NT5' },
  'di-passive-mono': { totalStock: 6, notes: 'Radial ProDI' },
  'di-active-mono': { totalStock: 4, notes: 'Radial Pro48' },
  'di-stereo-pc': { totalStock: 2, notes: 'Radial ProD2 Stereo' },
  'rx-wireless-dual': { totalStock: 2, notes: 'Shure SVX288 Dual' },
  'iem-receiver': { totalStock: 8, notes: 'Sennheiser G4 / PSM300' },
  'speaker-front-fill': { totalStock: 4, notes: 'Turbosound Milan 10' },
  'speaker-subwoofer': { totalStock: 4, notes: 'Turbosound Milan 18B' },
  'speaker-array-l': { totalStock: 2, notes: 'Left Main Array' },
  'speaker-array-r': { totalStock: 2, notes: 'Right Main Array' },
  'playback-laptop': { totalStock: 2, notes: 'ProPresenter / DAW' },
  'click-track': { totalStock: 2, notes: 'Ableton / Drummer Click' },
  'comms-talkback': { totalStock: 4, notes: 'Worship / MD Comms' },
  'stream-pc': { totalStock: 2, notes: 'OBS / vMix Streaming PC' },
  'interface-behringer-umc': { totalStock: 2, notes: 'Behringer U-Phoria UMC202HD' },
  'switcher-osee-basic': { totalStock: 1, notes: 'Osee Switcher Basic / GoStream' },
  'monitor-stream-display': { totalStock: 2, notes: '24" Stream Output / Program Monitor' },
  'waves-superrack-pc': { totalStock: 1, notes: 'Waves SuperRack Live PC (USB 32x32)' }
};

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
    activeTrace: null,
    toastNotice: null,
    officialScenes: DEFAULT_OFFICIAL_SCENES,
    userScenes: localCache.getUserScenes(),
    scenesLoading: false,

    setToastNotice: (notice) =>
      set((state) => {
        state.toastNotice = notice ? { id: String(Date.now()), message: notice.message, type: notice.type || 'info' } : null;
      }),

    setNodePhoto: (nodeId, photoData) =>
      set((state) => {
        if (!state.sim.nodePhotos) state.sim.nodePhotos = {};
        state.sim.nodePhotos[nodeId] = {
          source: 'user',
          userPhotoDataUrl: photoData,
          lastModified: new Date().toISOString()
        };
        const item = state.sim.physical.stageItems.find((i) => i.id === nodeId);
        if (item) {
          item.photoOverride = photoData;
        }
      }),

    removeNodePhoto: (nodeId) =>
      set((state) => {
        if (state.sim.nodePhotos) {
          delete state.sim.nodePhotos[nodeId];
        }
        const item = state.sim.physical.stageItems.find((i) => i.id === nodeId);
        if (item) {
          delete item.photoOverride;
        }
      }),

    // Inventory
    inventory: defaultInventory,
    inventoryItems: localCache.getInventoryItems(),
    inventoryLoading: false,

    fetchInventory: async () => {
      set((state) => {
        state.inventoryLoading = true;
      });
      try {
        const items = await inventoryService.fetchInventory();
        set((state) => {
          state.inventoryItems = items;
          state.inventoryLoading = false;
          items.forEach((item) => {
            if (!state.inventory[item.id]) {
              state.inventory[item.id] = { totalStock: item.total_stock, notes: item.notes };
            } else {
              state.inventory[item.id].totalStock = item.total_stock;
            }
          });
        });
      } catch (e) {
        console.warn('fetchInventory error:', e);
        set((state) => {
          state.inventoryLoading = false;
        });
      }
    },

    updateInventoryStock: (typeId, totalStock) => {
      set((state) => {
        if (!state.inventory[typeId]) {
          state.inventory[typeId] = { totalStock };
        } else {
          state.inventory[typeId].totalStock = totalStock;
        }
        const item = state.inventoryItems.find((i) => i.id === typeId);
        if (item) {
          item.total_stock = totalStock;
        }
      });
      const found = get().inventoryItems.find((i) => i.id === typeId);
      if (found) {
        inventoryService.saveInventoryItem({ ...found, total_stock: totalStock }).catch(console.warn);
      }
    },

    saveInventoryItem: async (itemPayload) => {
      const res = await inventoryService.saveInventoryItem(itemPayload);
      await get().fetchInventory();
      return { success: true, savedToCloud: res.savedToCloud };
    },

    deleteInventoryItem: async (itemId) => {
      const res = await inventoryService.deleteInventoryItem(itemId);
      await get().fetchInventory();
      return res;
    },

    // Admin & Custom Nodes
    adminMode: false,
    toggleAdminMode: () =>
      set((state) => {
        state.adminMode = !state.adminMode;
      }),

    customCatalog: [],
    addCustomEquipmentType: (entry) =>
      set((state) => {
        state.customCatalog.push({
          id: entry.id,
          name: entry.name,
          category: entry.category,
          connectorTypes: entry.ports.map((p) => `${p.connector}-${p.direction}`),
          makeModel: entry.makeModel || 'Custom Gear',
          ports: entry.ports
        });
        state.inventory[entry.id] = { totalStock: entry.totalStock ?? 5 };
      }),

    saveStageAsDefaultPreset: () =>
      set((state) => {
        const customPreset = {
          stageItems: JSON.parse(JSON.stringify(state.sim.physical.stageItems)),
          cables: JSON.parse(JSON.stringify(state.sim.physical.cables)),
          ioPatch: JSON.parse(JSON.stringify(state.sim.digital.ioPatch)),
          customCatalog: JSON.parse(JSON.stringify(state.customCatalog)),
          inventory: JSON.parse(JSON.stringify(state.inventory))
        };
        try {
          localStorage.setItem('foh_sim_custom_default_preset', JSON.stringify(customPreset));
        } catch (e) {
          console.warn('LocalStorage save failed', e);
        }
      }),

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

    // Auth & Roles
    currentUser: localCache.getUserProfile(),
    userRole: localCache.getUserRole(),
    authModalOpen: false,
    setAuthModalOpen: (open) =>
      set((state) => {
        state.authModalOpen = open;
      }),
    setUserProfile: (profile) =>
      set((state) => {
        state.currentUser = profile;
        state.userRole = profile?.role || 'guest';
        localCache.saveUserProfile(profile);
      }),
    signOut: () =>
      set((state) => {
        state.currentUser = null;
        state.userRole = 'guest';
        localCache.saveUserProfile(null);
        if (isSupabaseConfigured() && supabase) {
          supabase.auth.signOut().catch(console.warn);
        }
      }),

    // Team Users & Password Management
    teamProfiles: userService.getCachedTeamProfiles(),
    teamProfilesLoading: false,
    fetchTeamProfiles: async () => {
      set((state) => {
        state.teamProfilesLoading = true;
      });
      try {
        const profiles = await userService.fetchTeamProfiles();
        set((state) => {
          state.teamProfiles = profiles;
        });
      } finally {
        set((state) => {
          state.teamProfilesLoading = false;
        });
      }
    },
    adminCreateUser: async (input) => {
      const res = await userService.adminCreateUser(input);
      set((state) => {
        state.teamProfiles = [
          res.user,
          ...state.teamProfiles.filter((u) => u.id !== res.user.id)
        ];
      });
      return res;
    },
    adminUpdateUserRole: async (userId, newRole) => {
      await userService.adminUpdateUserRole(userId, newRole);
      set((state) => {
        state.teamProfiles = state.teamProfiles.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        );
        if (state.currentUser?.id === userId) {
          state.currentUser = { ...state.currentUser, role: newRole };
          state.userRole = newRole;
        }
      });
    },
    adminDeleteUser: async (userId) => {
      await userService.adminDeleteUser(userId);
      set((state) => {
        state.teamProfiles = state.teamProfiles.filter((u) => u.id !== userId);
      });
    },
    changePassword: async (newPassword) => {
      await userService.changePassword(newPassword);
    },

    // Practice Simulations
    simulationsList: localCache.getSimulations(),
    activeSimulation: null,
    simulationsModalOpen: false,
    adminCreateModalOpen: false,
    briefingBannerVisible: false,
    setSimulationsModalOpen: (open) =>
      set((state) => {
        state.simulationsModalOpen = open;
      }),
    setAdminCreateModalOpen: (open) =>
      set((state) => {
        state.adminCreateModalOpen = open;
      }),
    setBriefingBannerVisible: (visible) =>
      set((state) => {
        state.briefingBannerVisible = visible;
      }),
    loadSimulation: (sim) =>
      set((state) => {
        state.activeSimulation = sim;
        state.briefingBannerVisible = true;
        state.simulationsModalOpen = false;
        if (sim.startingRig) {
          if (sim.startingRig.stageItems) {
            state.sim.physical.stageItems = JSON.parse(JSON.stringify(sim.startingRig.stageItems));
          }
          if (sim.startingRig.cables) {
            state.sim.physical.cables = JSON.parse(JSON.stringify(sim.startingRig.cables));
          }
          if (sim.startingRig.ioPatch) {
            state.sim.digital.ioPatch = JSON.parse(JSON.stringify(sim.startingRig.ioPatch));
          }
          if (sim.startingRig.channels) {
            state.sim.digital.channels = JSON.parse(JSON.stringify(sim.startingRig.channels));
          }
          if (sim.startingRig.mixes) {
            state.sim.digital.mixes = JSON.parse(JSON.stringify(sim.startingRig.mixes));
          }
        } else {
          const mode = sim.category === 'patching' ? 'scratch' : 'church';
          state.sim = createInitialState(mode);
        }
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),
    exitSimulation: () =>
      set((state) => {
        state.activeSimulation = null;
        state.briefingBannerVisible = false;
      }),
    refreshSimulations: async () => {
      const list = await simulationService.fetchSimulations();
      set((state) => {
        state.simulationsList = list;
      });
    },
    publishNewSimulation: async (payload) => {
      const currentSim = get().sim;
      const startingRig = {
        stageItems: JSON.parse(JSON.stringify(currentSim.physical.stageItems)),
        cables: JSON.parse(JSON.stringify(currentSim.physical.cables)),
        ioPatch: JSON.parse(JSON.stringify(currentSim.digital.ioPatch)),
        channels: JSON.parse(JSON.stringify(currentSim.digital.channels)),
        mixes: JSON.parse(JSON.stringify(currentSim.digital.mixes))
      };
      const res = await simulationService.createSimulation({
        ...payload,
        startingRig
      });
      set((state) => {
        state.simulationsList = [
          res.simulation,
          ...state.simulationsList.filter((s) => s.id !== res.simulation.id)
        ];
        state.adminCreateModalOpen = false;
        state.activeSimulation = res.simulation;
        state.briefingBannerVisible = true;
      });
      return res.savedToCloud;
    },

    // Cloud Sync Status
    syncStatus:
      typeof navigator !== 'undefined' && !navigator.onLine
        ? 'offline'
        : isSupabaseConfigured()
        ? 'synced'
        : 'local-only',
    setSyncStatus: (status) =>
      set((state) => {
        state.syncStatus = status;
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

        if (mode === 'church') {
          try {
            const saved = localStorage.getItem('foh_sim_custom_default_preset');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.stageItems) state.sim.physical.stageItems = parsed.stageItems;
              if (parsed.cables) state.sim.physical.cables = parsed.cables;
              if (parsed.ioPatch) state.sim.digital.ioPatch = parsed.ioPatch;
              if (parsed.customCatalog) state.customCatalog = parsed.customCatalog;
              if (parsed.inventory) state.inventory = { ...state.inventory, ...parsed.inventory };
            }
          } catch (e) {
            console.warn('Failed to parse saved preset', e);
          }
        }

        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    addStageItem: (typeId, position) =>
      set((state) => {
        const customItem = state.customCatalog.find((c) => c.id === typeId);
        const catalogItem = customItem || stageItemsCatalog.find((c) => c.id === typeId);
        if (!catalogItem) return;

        const currentCount = state.sim.physical.stageItems.filter((i) => i.typeId === typeId).length;
        const maxStock = state.inventory[typeId]?.totalStock ?? 10;
        if (currentCount >= maxStock) {
          return;
        }

        const uniqueId = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const newItem: StageItem = {
          id: uniqueId,
          typeId: catalogItem.id,
          name: customItem ? customItem.name : (catalogItem as any).displayName,
          category: (catalogItem as any).category as StageItem['category'],
          position,
          customPorts: customItem?.ports
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
          const firstErr = validation.notices[0];
          state.toastNotice = {
            id: String(Date.now()),
            message: firstErr?.message || 'Cable connection rejected',
            type: firstErr?.type || 'error'
          };
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
        if (state.activeTrace?.cableId === cableId) {
          state.activeTrace = null;
        }
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    // Tracing is purely click-activated to prevent hover flickering/shakiness
    setHoverTrace: () => {},

    setLockedTrace: (socketId, nodeId) =>
      set((state) => {
        if (!socketId && !nodeId) {
          state.activeTrace = null;
          return;
        }

        const cable = state.sim.physical.cables.find(
          (c) =>
            (socketId && (c.fromPort === socketId || c.toPort === socketId)) ||
            (!socketId && nodeId && (c.fromNode === nodeId || c.toNode === nodeId))
        );

        // If clicking the same already-locked trace, unlock and clear it
        if (
          state.activeTrace?.isLocked &&
          (cable
            ? state.activeTrace.cableId === cable.id
            : state.activeTrace.socketId === socketId && state.activeTrace.nodeId === nodeId)
        ) {
          state.activeTrace = null;
          return;
        }

        if (cable) {
          state.activeTrace = {
            cableId: cable.id,
            socketId: socketId || (cable.toNode === 'stagebox-ar2412' || cable.toNode === 'console-sq5' ? cable.toPort : cable.fromPort),
            nodeId: nodeId || (cable.fromNode === 'stagebox-ar2412' || cable.fromNode === 'console-sq5' ? cable.toNode : cable.fromNode),
            isLocked: true
          };
        } else {
          state.activeTrace = {
            cableId: null,
            socketId,
            nodeId,
            isLocked: true
          };
        }
      }),

    clearTrace: () =>
      set((state) => {
        state.activeTrace = null;
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
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) linked.faderLevel = levelDb;
          }
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
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) linked.mute = ch.mute;
          }
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    toggleChannelPAFL: (channelId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          ch.pafl = !ch.pafl;
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) linked.pafl = ch.pafl;
          }
        }
      }),

    toggleChannelMainLR: (channelId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          ch.mainLRAssigned = !ch.mainLRAssigned;
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) linked.mainLRAssigned = ch.mainLRAssigned;
          }
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
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) {
              if (!linked.sends[mixId]) {
                linked.sends[mixId] = { mixId, levelDb, preFade: ch.sends[mixId].preFade, assigned: ch.sends[mixId].assigned };
              } else {
                linked.sends[mixId].levelDb = levelDb;
                if (assigned !== undefined) linked.sends[mixId].assigned = assigned;
              }
            }
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
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked && linked.sends[mixId]) {
              linked.sends[mixId].preFade = ch.sends[mixId].preFade;
            }
          }
        }
      }),

    updateChannelPreamp: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          Object.assign(ch.preamp, updates);
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) Object.assign(linked.preamp, updates);
          }
          state.validationNotices = validateSystemState(state.sim);
        }
      }),

    updateChannelHPF: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          Object.assign(ch.hpf, updates);
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) Object.assign(linked.hpf, updates);
          }
        }
      }),

    updateChannelGate: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          Object.assign(ch.gate, updates);
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) Object.assign(linked.gate, updates);
          }
        }
      }),

    updateChannelPEQBand: (channelId, bandIndex, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch && ch.peq.bands[bandIndex]) {
          Object.assign(ch.peq.bands[bandIndex], updates);
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked && linked.peq.bands[bandIndex]) {
              Object.assign(linked.peq.bands[bandIndex], updates);
            }
          }
        }
      }),

    toggleChannelPEQ: (channelId) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          ch.peq.enabled = !ch.peq.enabled;
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) linked.peq.enabled = ch.peq.enabled;
          }
        }
      }),

    updateChannelCompressor: (channelId, updates) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch) {
          Object.assign(ch.compressor, updates);
          if (ch.stereo && ch.linkedChannelId) {
            const linked = state.sim.digital.channels.find((c) => c.id === ch.linkedChannelId);
            if (linked) Object.assign(linked.compressor, updates);
          }
        }
      }),

    updateChannelName: (channelId, name) =>
      set((state) => {
        if (state.userRole === 'guest') return;
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

    setGeqFlipPage: (page) =>
      set((state) => {
        state.sim.digital.session.geqFlipPage = page;
        state.sim.digital.session.geqFlipActive = page > 0;
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

    resetAllMixGeq: (mixId) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix) {
          mix.geq = new Array(28).fill(0);
        }
      }),

    toggleInputChannelStereo: (channelNumber) =>
      set((state) => {
        const oddNum = channelNumber % 2 === 1 ? channelNumber : channelNumber - 1;
        const oddCh = state.sim.digital.channels.find((c) => c.channelNumber === oddNum);
        const evenCh = state.sim.digital.channels.find((c) => c.channelNumber === oddNum + 1);
        if (!oddCh || !evenCh) return;

        const willBeStereo = !oddCh.stereo;
        if (willBeStereo) {
          oddCh.stereo = true;
          oddCh.isStereoSlave = false;
          oddCh.linkedChannelId = evenCh.id;
          oddCh.pan = -100;
          oddCh.mainLRPan = -100;

          evenCh.stereo = true;
          evenCh.isStereoSlave = true;
          evenCh.linkedChannelId = oddCh.id;
          evenCh.pan = 100;
          evenCh.mainLRPan = 100;

          // Mirror master settings to slave channel
          evenCh.faderLevel = oddCh.faderLevel;
          evenCh.mute = oddCh.mute;
          evenCh.pafl = oddCh.pafl;
          evenCh.dcaGroupMask = oddCh.dcaGroupMask;
          evenCh.muteGroupMask = oddCh.muteGroupMask;
          evenCh.mainLRAssigned = oddCh.mainLRAssigned;
          evenCh.preamp = JSON.parse(JSON.stringify(oddCh.preamp));
          evenCh.hpf = JSON.parse(JSON.stringify(oddCh.hpf));
          evenCh.gate = JSON.parse(JSON.stringify(oddCh.gate));
          evenCh.peq = JSON.parse(JSON.stringify(oddCh.peq));
          evenCh.compressor = JSON.parse(JSON.stringify(oddCh.compressor));
          evenCh.sends = JSON.parse(JSON.stringify(oddCh.sends));
        } else {
          oddCh.stereo = false;
          oddCh.isStereoSlave = false;
          oddCh.linkedChannelId = undefined;
          oddCh.pan = 0;
          oddCh.mainLRPan = 0;

          evenCh.stereo = false;
          evenCh.isStereoSlave = false;
          evenCh.linkedChannelId = undefined;
          evenCh.pan = 0;
          evenCh.mainLRPan = 0;
        }

        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    toggleMixStereo: (mixId) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix) {
          mix.stereo = !mix.stereo;
        }
      }),

    toggleMixMode: (mixId) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix) {
          mix.mode = mix.mode === 'aux' ? 'group' : 'aux';
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    toggleMixMainLR: (mixId) =>
      set((state) => {
        const mix = state.sim.digital.mixes.find((m) => m.id === mixId);
        if (mix) {
          mix.mainLRAssigned = !mix.mainLRAssigned;
          state.signalPresence = computeSignalPresence(state.sim);
        }
      }),

    setSendTapPoint: (channelId, mixId, tapPoint) =>
      set((state) => {
        const ch = state.sim.digital.channels.find((c) => c.id === channelId);
        if (ch && ch.sends[mixId]) {
          ch.sends[mixId].tapPoint = tapPoint;
          // Synchronize preFade boolean (post-fade is post-fade, others are pre)
          ch.sends[mixId].preFade = tapPoint !== 'post-fade';
        }
      }),

    toggleMatrixStereo: (matrixId) =>
      set((state) => {
        const mtx = state.sim.digital.matrices.find((m) => m.id === matrixId);
        if (mtx) {
          mtx.stereo = !mtx.stereo;
        }
      }),

    setMatrixFader: (matrixId, levelDb) =>
      set((state) => {
        const mtx = state.sim.digital.matrices.find((m) => m.id === matrixId);
        if (mtx) {
          mtx.faderLevel = levelDb;
        }
      }),

    setMatrixSource: (matrixId, source) =>
      set((state) => {
        const mtx = state.sim.digital.matrices.find((m) => m.id === matrixId);
        if (mtx) {
          mtx.source = source;
        }
      }),

    toggleMatrixMute: (matrixId) =>
      set((state) => {
        const mtx = state.sim.digital.matrices.find((m) => m.id === matrixId);
        if (mtx) {
          mtx.mute = !mtx.mute;
        }
      }),

    setGlobalAuxPreFade: (preFade) =>
      set((state) => {
        state.sim.digital.channels.forEach((ch) => {
          Object.values(ch.sends).forEach((send) => {
            send.preFade = preFade;
          });
        });
      }),

    setDcaMembership: (memberId, dcaId, isMember) =>
      set((state) => {
        if (state.userRole === 'guest') return;
        const bit = 1 << (dcaId - 1);
        const ch = state.sim.digital.channels.find((c) => c.id === memberId);
        if (ch) {
          if (isMember) {
            ch.dcaGroupMask |= bit;
          } else {
            ch.dcaGroupMask &= ~bit;
          }
        }
        const mix = state.sim.digital.mixes.find((m) => m.id === memberId);
        if (mix) {
          if (mix.dcaGroupMask === undefined) mix.dcaGroupMask = 0;
          if (isMember) {
            mix.dcaGroupMask |= bit;
          } else {
            mix.dcaGroupMask &= ~bit;
          }
        }
        state.signalPresence = computeSignalPresence(state.sim);
      }),

    setDcaAllMembers: (dcaId, memberIds) =>
      set((state) => {
        if (state.userRole === 'guest') return;
        const bit = 1 << (dcaId - 1);
        state.sim.digital.channels.forEach((ch) => {
          if (memberIds.includes(ch.id)) {
            ch.dcaGroupMask |= bit;
          } else {
            ch.dcaGroupMask &= ~bit;
          }
        });
        state.sim.digital.mixes.forEach((m) => {
          if (m.dcaGroupMask === undefined) m.dcaGroupMask = 0;
          if (memberIds.includes(m.id)) {
            m.dcaGroupMask |= bit;
          } else {
            m.dcaGroupMask &= ~bit;
          }
        });
        state.signalPresence = computeSignalPresence(state.sim);
      }),

    updateDcaName: (dcaId, name) =>
      set((state) => {
        if (state.userRole === 'guest') return;
        const dca = state.sim.digital.dcas.find((d) => d.id === dcaId);
        if (dca) {
          dca.name = name.trim();
        }
      }),

    patchInputSocket: (channelId, sourceType, socketId, label) =>
      set((state) => {
        if (state.userRole === 'guest') return;
        state.sim.digital.ioPatch.inputs[channelId] = { sourceType, socketId, label };
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    unpatchInputSocket: (channelId) =>
      set((state) => {
        if (state.userRole === 'guest') return;
        delete state.sim.digital.ioPatch.inputs[channelId];
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    patchOutputSocket: (socketId, destType, busId, label) =>
      set((state) => {
        if (state.userRole === 'guest') return;
        state.sim.digital.ioPatch.outputs[socketId] = { destType, busId, label };
        state.signalPresence = computeSignalPresence(state.sim);
        state.validationNotices = validateSystemState(state.sim);
      }),

    unpatchOutputSocket: (socketId) =>
      set((state) => {
        if (state.userRole === 'guest') return;
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
            if (snap.digital.dcas) state.sim.digital.dcas = JSON.parse(JSON.stringify(snap.digital.dcas));
            if (snap.digital.matrices) state.sim.digital.matrices = JSON.parse(JSON.stringify(snap.digital.matrices));
            if (snap.digital.mainLR) state.sim.digital.mainLR = JSON.parse(JSON.stringify(snap.digital.mainLR));
            if (snap.digital.muteGroups) state.sim.digital.muteGroups = JSON.parse(JSON.stringify(snap.digital.muteGroups));
            state.signalPresence = computeSignalPresence(state.sim);
            state.validationNotices = validateSystemState(state.sim);
          }
        }
        state.sim.digital.activeSceneId = sceneId;
      }),

    fetchScenes: async () => {
      set((state) => {
        state.scenesLoading = true;
      });
      try {
        const { officialScenes, userScenes } = await sceneService.fetchScenes();
        set((state) => {
          state.officialScenes = officialScenes;
          state.userScenes = userScenes;
          state.scenesLoading = false;
        });
      } catch (e) {
        console.warn('fetchScenes error:', e);
        set((state) => {
          state.scenesLoading = false;
        });
      }
    },

    recallMemberScene: (scene: MemberScene) =>
      set((state) => {
        if (scene.scene_data?.digital) {
          const d = scene.scene_data.digital;
          if (d.channels) state.sim.digital.channels = JSON.parse(JSON.stringify(d.channels));
          if (d.mixes) state.sim.digital.mixes = JSON.parse(JSON.stringify(d.mixes));
          if (d.ioPatch) state.sim.digital.ioPatch = JSON.parse(JSON.stringify(d.ioPatch));
          if (d.dcas) state.sim.digital.dcas = JSON.parse(JSON.stringify(d.dcas));
          if (d.matrices) state.sim.digital.matrices = JSON.parse(JSON.stringify(d.matrices));
          if (d.mainLR) state.sim.digital.mainLR = JSON.parse(JSON.stringify(d.mainLR));
          if (d.muteGroups) state.sim.digital.muteGroups = JSON.parse(JSON.stringify(d.muteGroups));
          state.sim.digital.activeSceneId = scene.scene_number;
          state.signalPresence = computeSignalPresence(state.sim);
          state.validationNotices = validateSystemState(state.sim);
          state.toastNotice = {
            id: String(Date.now()),
            message: `Recalled Scene: ${scene.name}`,
            type: 'info'
          };
        }
      }),

    saveUserScene: async (
      name: string,
      description?: string,
      isOfficial?: boolean,
      existingId?: string,
      sceneNumber?: number,
      sceneDataOverride?: any
    ) => {
      const currentState = get().sim;
      const sceneData = sceneDataOverride || {
        digital: {
          channels: JSON.parse(JSON.stringify(currentState.digital.channels)),
          mixes: JSON.parse(JSON.stringify(currentState.digital.mixes)),
          ioPatch: JSON.parse(JSON.stringify(currentState.digital.ioPatch)),
          dcas: JSON.parse(JSON.stringify(currentState.digital.dcas)),
          matrices: JSON.parse(JSON.stringify(currentState.digital.matrices)),
          mainLR: JSON.parse(JSON.stringify(currentState.digital.mainLR)),
          muteGroups: JSON.parse(JSON.stringify(currentState.digital.muteGroups))
        },
        description
      };
      const res = await sceneService.saveScene({
        name,
        description,
        isOfficial,
        existingId,
        sceneNumber,
        sceneData
      });
      await get().fetchScenes();
      return { success: true, savedToCloud: res.savedToCloud };
    },

    deleteUserScene: async (sceneId: string, isOfficial?: boolean) => {
      const res = await sceneService.deleteScene(sceneId, isOfficial);
      await get().fetchScenes();
      return res;
    }
  }))
);

if (typeof window !== 'undefined') {
  (window as any).__SIM_STORE__ = useSimulationStore;
}
