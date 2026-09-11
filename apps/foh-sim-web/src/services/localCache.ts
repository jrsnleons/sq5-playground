import { PracticeSimulation, UserProfile, UserRole } from './supabase';

const CACHE_KEYS = {
  PROFILE: 'foh_sim_cached_profile',
  SIMULATIONS: 'foh_sim_cached_simulations',
  CUSTOM_PRESET: 'foh_sim_custom_default_preset',
  USER_ROLE: 'foh_sim_user_role'
};

// Built-in starter practice simulations (available offline and without Supabase)
export const DEFAULT_STOCK_SIMULATIONS: PracticeSimulation[] = [
  {
    id: 'sim-stage-patching-101',
    title: 'Stage Patching 101: Vocal Mics to AR2412',
    description: 'Learn physical stage patching. Connect vocal mics to the digital stage box and verify signal flow.',
    category: 'patching',
    difficulty: 'beginner',
    briefing: '### Objectives\n1. From the Stage Palette on the left, locate **Mic 1** and **Mic 2**.\n2. Click Mic 1 output socket and drag an XLR cable to **AR2412 Input 1**.\n3. Drag Mic 2 to **AR2412 Input 2**.\n4. Click **Console** in the left rail to confirm green signal presence on Channels 1 and 2.',
    startingRig: null,
    isPublished: true,
    authorName: 'Church Audio Lead'
  },
  {
    id: 'sim-iem-prefade-201',
    title: 'Musician In-Ear Monitors (Pre-Fade Independence)',
    description: 'Ensure musicians never lose their monitor mix when FOH mutes a vocal channel.',
    category: 'iem',
    difficulty: 'intermediate',
    briefing: '### Objectives\n1. Navigate to **Console > Routing > Channel Routing (CH 2)**.\n2. Verify that **IEM AG (Aux 2)** and **IEM WL (Aux 3)** are set to **PRE-FADE**.\n3. Return to **Faders** and press **MUTE** on Channel 2 (Lead Vocal).\n4. Observe the channel LED ladder and IEM Aux send meters — notice that pre-fade sends continue flowing to the musicians even with FOH muted!',
    startingRig: null,
    isPublished: true,
    authorName: 'FOH Systems Engineer'
  },
  {
    id: 'sim-geq-feedback-301',
    title: 'Acoustic Feedback Ringing with 28-Band GEQ Flip',
    description: 'Use the motorized fader flip surface to notch resonant room feedback on the Main PA.',
    category: 'geq',
    difficulty: 'intermediate',
    briefing: '### Objectives\n1. Go to **Console > Faders**.\n2. In the sub-bar, click **GEQ FLIP** to throw the 28 graphic EQ bands across the 14 motorized faders.\n3. On **Page 1 (31.5Hz–630Hz)**, pull down **160Hz** by -3.5 dB to eliminate boomy stage wash.\n4. Click **Bands 15–28 (800Hz–16kHz)** and cut **3.15kHz** by -4.0 dB to tame feedback.\n5. Click **EXIT GEQ FLIP** to restore normal input faders.',
    startingRig: null,
    isPublished: true,
    authorName: 'Acoustic Specialist'
  },
  {
    id: 'sim-dca-subgroups-401',
    title: 'Drum Kit DCA Grouping & Subgroup Control',
    description: 'Assign a 7-piece drum kit to DCA 1 (DRUMS) and verify single-fader volume control.',
    category: 'mixing',
    difficulty: 'advanced',
    briefing: '### Objectives\n1. Navigate to **Console > Routing > DCA ASSIGN MATRIX (1–8)**.\n2. Select **DCA 1 (DRUMS)**.\n3. In the channel assignment checklist, toggle channels **17 through 23** (Kick, Snare Top, Snare Bottom, Toms, Hihat, Overheads).\n4. Return to **Faders**, switch to **Layer E (DCAs)**, and adjust DCA 1 fader to verify master control over all drum channels.',
    startingRig: null,
    isPublished: true,
    authorName: 'Production Director'
  }
];

export interface MemberScene {
  id: string;
  scene_number: number;
  name: string;
  description?: string;
  is_official: boolean;
  author_name?: string;
  scene_data: any;
  created_at?: string;
  user_id?: string | null;
}

export const DEFAULT_OFFICIAL_SCENES: MemberScene[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    scene_number: 1,
    name: 'Sunday Morning Worship (Church Master Truth)',
    description: 'Official Baseline Truth: Full 24-ch stage patching to AR2412 via dSNAKE, 7 IEM aux mixes pre-faded, ProPresenter & wireless mics, Drum DCA 1, Main LR to line arrays & subs.',
    is_official: true,
    author_name: 'Church Audio Director',
    scene_data: null
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    scene_number: 2,
    name: 'Midweek Acoustic & Prayer (Official Reference)',
    description: 'Acoustic worship setup: Acoustic Guitar (CH 15), Keys (CH 13), Lead Vocal (CH 2), and Pastor Lapel (CH 9). Drums and electrics muted to maintain a reverent atmosphere.',
    is_official: true,
    author_name: 'Church Audio Director',
    scene_data: null
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    scene_number: 3,
    name: 'Youth Service / High-Energy Band (Official Reference)',
    description: 'High-energy youth worship: Punchy drum gates & compressors, dual electric guitars, aggressive vocal presence boost (+3dB at 3kHz), and hot IEM monitor feeds.',
    is_official: true,
    author_name: 'Church Audio Director',
    scene_data: null
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    scene_number: 4,
    name: 'Zeroed Board / Clean Slate (Console Reset Reference)',
    description: 'Completely zeroed console: All faders at -inf dB, preamps at 0 dB, EQ flat, no sends assigned. Perfect for trainees to build a mix from scratch.',
    is_official: true,
    author_name: 'Church Audio Director',
    scene_data: null
  }
];

export const localCache = {
  getUserProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(CACHE_KEYS.PROFILE);
      if (!data) return null;
      const profile = JSON.parse(data);
      // Purge any legacy simulator / mock IDs
      if (!profile || !profile.id || profile.id.startsWith('demo-') || profile.id.startsWith('user-')) {
        localStorage.removeItem(CACHE_KEYS.PROFILE);
        localStorage.removeItem(CACHE_KEYS.USER_ROLE);
        return null;
      }
      return profile;
    } catch {
      return null;
    }
  },

  saveUserProfile(profile: UserProfile | null) {
    try {
      if (profile && (profile.role === 'admin' || profile.role === 'member')) {
        localStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile));
        localStorage.setItem(CACHE_KEYS.USER_ROLE, profile.role);
      } else {
        localStorage.removeItem(CACHE_KEYS.PROFILE);
        localStorage.setItem(CACHE_KEYS.USER_ROLE, 'guest');
      }
    } catch (e) {
      console.warn('LocalStorage saveUserProfile failed', e);
    }
  },

  getUserRole(): UserRole {
    try {
      const profile = this.getUserProfile();
      if (profile && (profile.role === 'admin' || profile.role === 'member')) {
        return profile.role;
      }
      return 'guest';
    } catch {
      return 'guest';
    }
  },

  getSimulations(): PracticeSimulation[] {
    try {
      const data = localStorage.getItem(CACHE_KEYS.SIMULATIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read cached simulations', e);
    }
    return DEFAULT_STOCK_SIMULATIONS;
  },

  saveSimulations(simulations: PracticeSimulation[]) {
    try {
      localStorage.setItem(CACHE_KEYS.SIMULATIONS, JSON.stringify(simulations));
    } catch (e) {
      console.warn('Failed to save simulations to cache', e);
    }
  },

  addSimulation(sim: PracticeSimulation) {
    const list = this.getSimulations();
    const updated = [sim, ...list.filter((s) => s.id !== sim.id)];
    this.saveSimulations(updated);
    return updated;
  },

  getUserScenes(): MemberScene[] {
    try {
      const data = localStorage.getItem('foh_sim_cached_user_scenes');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read cached user scenes', e);
    }
    return [];
  },

  saveUserScenes(scenes: MemberScene[]) {
    try {
      localStorage.setItem('foh_sim_cached_user_scenes', JSON.stringify(scenes));
    } catch (e) {
      console.warn('Failed to save user scenes', e);
    }
  },

  saveUserScene(scene: MemberScene) {
    const list = this.getUserScenes();
    const updated = [scene, ...list.filter((s) => s.id !== scene.id)];
    this.saveUserScenes(updated);
    return updated;
  },

  removeUserScene(sceneId: string) {
    const list = this.getUserScenes();
    const updated = list.filter((s) => s.id !== sceneId);
    this.saveUserScenes(updated);
    return updated;
  },

  getOfficialScenes(): MemberScene[] {
    try {
      const data = localStorage.getItem('foh_sim_cached_official_scenes');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read cached official scenes', e);
    }
    return DEFAULT_OFFICIAL_SCENES;
  },

  saveOfficialScenes(scenes: MemberScene[]) {
    try {
      localStorage.setItem('foh_sim_cached_official_scenes', JSON.stringify(scenes));
    } catch (e) {
      console.warn('Failed to save official scenes to cache', e);
    }
  },

  saveOfficialScene(scene: MemberScene) {
    const list = this.getOfficialScenes();
    const updated = [scene, ...list.filter((s) => s.id !== scene.id)];
    this.saveOfficialScenes(updated);
    return updated;
  },

  removeOfficialScene(sceneId: string) {
    const list = this.getOfficialScenes();
    const updated = list.filter((s) => s.id !== sceneId);
    this.saveOfficialScenes(updated);
    return updated;
  },

  getInventoryItems(): EquipmentInventoryItem[] {
    try {
      const data = localStorage.getItem('foh_sim_cached_inventory');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read cached inventory', e);
    }
    return DEFAULT_INVENTORY_ITEMS;
  },

  saveInventoryItems(items: EquipmentInventoryItem[]) {
    try {
      localStorage.setItem('foh_sim_cached_inventory', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save inventory to cache', e);
    }
  },

  saveInventoryItem(item: EquipmentInventoryItem) {
    const list = this.getInventoryItems();
    const updated = [item, ...list.filter((i) => i.id !== item.id)];
    this.saveInventoryItems(updated);
    return updated;
  },

  removeInventoryItem(itemId: string) {
    const list = this.getInventoryItems();
    const updated = list.filter((i) => i.id !== itemId);
    this.saveInventoryItems(updated);
    return updated;
  }
};

export interface EquipmentInventoryItem {
  id: string;
  name: string;
  category: string;
  model: string;
  description: string;
  total_stock: number;
  connectors: string[];
  notes?: string;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_INVENTORY_ITEMS: EquipmentInventoryItem[] = [
  {
    id: 'mic-dynamic',
    name: 'Dynamic Vocal Mic',
    category: 'mic',
    model: 'Shure SM58',
    description: 'Industry-standard dynamic cardioid vocal microphone for lead singers and worship leaders.',
    total_stock: 8,
    connectors: ['XLR-out'],
    notes: 'Durable steel mesh grille with integrated pop filter. Requires no phantom power.'
  },
  {
    id: 'mic-condenser',
    name: 'Small Diaphragm Condenser',
    category: 'mic',
    model: 'Rode NT5 / AKG P170',
    description: 'Sensitive pencil condenser microphone for acoustic guitars, hi-hats, and drum overheads.',
    total_stock: 4,
    connectors: ['XLR-out'],
    notes: 'Cardioid polar pattern. Requires +48V phantom power from AR2412 or SQ-5 preamp.'
  },
  {
    id: 'mic-lapel',
    name: 'Wireless Lavalier / Lapel Mic',
    category: 'mic',
    model: 'Shure BLX1 Bodypack + WL185',
    description: 'Discreet cardioid lapel microphone designed for pastor sermon speaking and service hosts.',
    total_stock: 2,
    connectors: ['XLR-out'],
    notes: 'Requires bodypack receiver plugged into stagebox. Position 6-8 inches below mouth.'
  },
  {
    id: 'mic-wireless-hh-1',
    name: 'Wireless Handheld 1 (Lead Vocal)',
    category: 'mic',
    model: 'Shure PG28 / Beta 58A',
    description: 'Primary wireless handheld channel dedicated to the lead worship vocalist.',
    total_stock: 1,
    connectors: ['RF-out'],
    notes: 'Ch A on dual wireless receiver unit.'
  },
  {
    id: 'mic-wireless-hh-2',
    name: 'Wireless Handheld 2 (Backup Vocal)',
    category: 'mic',
    model: 'Shure PG28 / Beta 58A',
    description: 'Secondary wireless handheld channel dedicated to backing vocalist or guest speaker.',
    total_stock: 1,
    connectors: ['RF-out'],
    notes: 'Ch B on dual wireless receiver unit.'
  },
  {
    id: 'rx-wireless-dual',
    name: 'Dual Wireless Receiver Base',
    category: 'mic',
    model: 'Shure SVX288',
    description: 'Dual channel wireless microphone receiver base unit located on the stage rack.',
    total_stock: 1,
    connectors: ['RF-in', 'RF-in', 'XLR-out', 'XLR-out'],
    notes: 'Provides two balanced XLR line/mic outputs to the AR2412 stagebox.'
  },
  {
    id: 'inst-electric-guitar',
    name: 'Electric Guitar',
    category: 'instrument',
    model: 'Fender Stratocaster / Line 6 Helix',
    description: 'High-impedance instrument source requiring passive or active DI box matching.',
    total_stock: 2,
    connectors: ['1/4" TS-out'],
    notes: 'Connect via 1/4" TS cable to DI box input before feeding stagebox.'
  },
  {
    id: 'inst-acoustic-guitar',
    name: 'Acoustic Guitar',
    category: 'instrument',
    model: 'Taylor / Martin (Piezo Onboard)',
    description: 'Acoustic guitar with active piezo pickup and onboard battery preamp.',
    total_stock: 2,
    connectors: ['1/4" TS-out'],
    notes: 'Pairs best with Passive DI box or Active DI with ground lift engaged.'
  },
  {
    id: 'inst-bass-guitar',
    name: 'Bass Guitar',
    category: 'instrument',
    model: 'Fender Jazz Bass / Active Pre',
    description: 'Deep low-end electric bass guitar requiring clean DI isolation and punchy low-mid focus.',
    total_stock: 1,
    connectors: ['1/4" TS-out'],
    notes: 'Connects directly to Active/Passive DI box with thru to bassist stage amp.'
  },
  {
    id: 'inst-keys',
    name: 'Stage Piano / Keyboard (Stereo)',
    category: 'instrument',
    model: 'Nord Stage 3 / Roland RD-88',
    description: 'Stereo stage keyboard producing rich grand piano, Rhodes, and synthesizer pads.',
    total_stock: 1,
    connectors: ['1/4" TS-L', '1/4" TS-R'],
    notes: 'Feeds Stereo DI Box (L/R) into adjacent channels on AR2412.'
  },
  {
    id: 'drum-kick',
    name: 'Kick Drum Microphone',
    category: 'instrument',
    model: 'Shure Beta 52A',
    description: 'High-output dynamic microphone optimized for low-frequency punch and acoustic bass drums.',
    total_stock: 1,
    connectors: ['XLR-out'],
    notes: 'Handles up to 174 dB SPL. Internal shockmount reduces mechanical stage vibrations.'
  },
  {
    id: 'drum-snare-top',
    name: 'Snare Top Microphone',
    category: 'instrument',
    model: 'Shure SM57',
    description: 'Industry-standard dynamic microphone for snare top crack and articulate transient response.',
    total_stock: 2,
    connectors: ['XLR-out'],
    notes: 'Aimed at snare center from 1-2 inches above rim at 45 degree angle.'
  },
  {
    id: 'drum-tom',
    name: 'Tom Drum Microphones',
    category: 'instrument',
    model: 'Sennheiser e604',
    description: 'Compact clip-on dynamic microphones for rack toms and floor tom.',
    total_stock: 3,
    connectors: ['XLR-out'],
    notes: 'Integrated rim clip eliminates stand clutter around the drum kit.'
  },
  {
    id: 'di-mono-passive',
    name: 'Mono Passive DI Box',
    category: 'di-box',
    model: 'Radial ProDI',
    description: 'High-quality passive direct box with MuMETAL shielding for acoustic instruments and active bass.',
    total_stock: 6,
    connectors: ['1/4" TS-in', '1/4" TS-thru', 'XLR-out'],
    notes: '15 dB pad switch and ground lift. Requires zero battery or phantom power.'
  },
  {
    id: 'di-stereo-passive',
    name: 'Stereo Passive DI Box',
    category: 'di-box',
    model: 'Radial ProD2',
    description: 'Dual-channel passive DI for stereo keyboards, drum machines, and media playback devices.',
    total_stock: 2,
    connectors: ['1/4" TS-in L', '1/4" TS-in R', 'XLR-out L', 'XLR-out R'],
    notes: 'Independent ground lift per channel prevents ground hum on complex stereo rigs.'
  },
  {
    id: 'di-mono-active',
    name: 'Mono Active DI Box',
    category: 'di-box',
    model: 'Radial Pro48',
    description: 'Active direct box providing high input impedance for low-output passive pickups.',
    total_stock: 2,
    connectors: ['1/4" TS-in', '1/4" TS-thru', 'XLR-out'],
    notes: 'Powered via +48V phantom power from console channel preamp.'
  },
  {
    id: 'iem-transmitter',
    name: 'Wireless IEM Transmitter System',
    category: 'iem',
    model: 'Sennheiser ew G4 / Shure PSM300',
    description: 'Stereo/mono in-ear monitor transmitter feeding stage wireless beltpacks.',
    total_stock: 4,
    connectors: ['XLR-in L', 'XLR-in R', 'RF-out'],
    notes: 'Receives pre-fader aux mix from AR2412 XLR outputs 1-8.'
  },
  {
    id: 'speaker-wedge',
    name: 'Active Stage Floor Wedge',
    category: 'speaker',
    model: 'QSC K10.2 / Yamaha DXR10',
    description: 'Powered 2-way floor wedge monitor for worship leaders, choir, and guest speakers.',
    total_stock: 4,
    connectors: ['XLR-in', 'XLR-thru', 'IEC Power'],
    notes: 'Class-D 2000W onboard amplification. Fed by console Aux Mix.'
  },
  {
    id: 'speaker-main-pa',
    name: 'Main PA Left / Right Line Array',
    category: 'speaker',
    model: 'Electro-Voice EVA / d&b Audiotechnik',
    description: 'Main Front of House speaker array delivering coverage to the sanctuary congregation.',
    total_stock: 2,
    connectors: ['XLR-in', 'NL4 Speakon'],
    notes: 'Receives Main LR Master bus post-fader from SQ-5 or AR2412 outputs.'
  },
  {
    id: 'speaker-sub',
    name: 'Subwoofer PA System',
    category: 'speaker',
    model: '18" Powered Subwoofer',
    description: 'Dedicated low-frequency reinforcement (30 Hz - 100 Hz) for kick drum and bass guitar.',
    total_stock: 2,
    connectors: ['XLR-in', 'XLR-thru'],
    notes: 'Driven from Matrix 3 or dedicated Sub Aux send with low-pass filter.'
  },
  {
    id: 'console-sq5',
    name: 'Allen & Heath SQ-5 Digital Console',
    category: 'console',
    model: 'SQ-5 48-Channel FPGA Console',
    description: 'Core Front of House mixing console with 96kHz XCVI processing core, 16 preamps, 12 XLR outs.',
    total_stock: 1,
    connectors: ['16x XLR-in', '12x XLR-out', 'SLink EtherCon', 'USB-B', 'Network'],
    notes: 'Primary console located at church FOH sound booth.'
  },
  {
    id: 'stagebox-ar2412',
    name: 'Allen & Heath AR2412 Stage Box',
    category: 'stagebox',
    model: 'AR2412 24 In / 12 Out Remote AudioRack',
    description: 'Stage rack expander providing 24 remote preamps and 12 XLR aux/line outputs via dSNAKE.',
    total_stock: 1,
    connectors: ['24x XLR-in', '12x XLR-out', 'dSNAKE EtherCon', 'EXPANDER EtherCon'],
    notes: 'Positioned upstage left. Connected to SQ-5 via Cat5e/Cat6 STP snake.'
  },
  {
    id: 'playback-laptop',
    name: 'ProPresenter / Media Playback Computer',
    category: 'playback',
    model: 'Mac Studio / PC Playback',
    description: 'Dedicated presentation computer for worship tracks, sermon videos, and walk-in music.',
    total_stock: 1,
    connectors: ['3.5mm TRS / USB audio'],
    notes: 'Converted to dual balanced XLR lines via Stereo DI or USB interface.'
  }
];
