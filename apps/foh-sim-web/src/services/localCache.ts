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

export const localCache = {
  getUserProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(CACHE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveUserProfile(profile: UserProfile | null) {
    try {
      if (profile) {
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
      const role = localStorage.getItem(CACHE_KEYS.USER_ROLE);
      if (role === 'admin' || role === 'member' || role === 'guest') {
        return role;
      }
      return 'guest';
    } catch {
      return 'guest';
    }
  },

  setUserRole(role: UserRole) {
    try {
      localStorage.setItem(CACHE_KEYS.USER_ROLE, role);
    } catch (e) {
      console.warn('LocalStorage setUserRole failed', e);
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
  }
};
