import { supabase, isSupabaseConfigured, PracticeSimulation } from './supabase';
import { localCache } from './localCache';

export const simulationService = {
  async fetchSimulations(): Promise<PracticeSimulation[]> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.getSimulations();
    }

    try {
      const { data, error } = await supabase
        .from('simulations')
        .select(`
          id,
          title,
          description,
          category,
          difficulty,
          briefing,
          starting_rig,
          is_published,
          created_by,
          created_at,
          profiles:created_by (display_name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch simulations error, using cache:', error.message);
        return localCache.getSimulations();
      }

      if (data && data.length > 0) {
        const mapped: PracticeSimulation[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          category: item.category,
          difficulty: item.difficulty,
          briefing: item.briefing,
          startingRig: item.starting_rig,
          isPublished: item.is_published,
          createdBy: item.created_by,
          authorName: item.profiles?.display_name || 'Admin',
          createdAt: item.created_at
        }));

        localCache.saveSimulations(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Network error fetching simulations, using local cache:', e);
    }

    return localCache.getSimulations();
  },

  async createSimulation(payload: {
    title: string;
    description: string;
    category: PracticeSimulation['category'];
    difficulty: PracticeSimulation['difficulty'];
    briefing: string;
    startingRig: any;
  }): Promise<{ simulation: PracticeSimulation; savedToCloud: boolean }> {
    const newSim: PracticeSimulation = {
      id: `sim-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      difficulty: payload.difficulty,
      briefing: payload.briefing,
      startingRig: payload.startingRig,
      isPublished: true,
      createdAt: new Date().toISOString(),
      authorName: 'Admin (You)'
    };

    let savedToCloud = false;

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        const { data, error } = await supabase
          .from('simulations')
          .insert({
            title: payload.title,
            description: payload.description,
            category: payload.category,
            difficulty: payload.difficulty,
            briefing: payload.briefing,
            starting_rig: payload.startingRig,
            is_published: true,
            created_by: userId || null
          })
          .select()
          .single();

        if (!error && data) {
          newSim.id = data.id;
          newSim.createdBy = data.created_by;
          savedToCloud = true;
        } else {
          console.warn('Cloud save error:', error?.message);
        }
      } catch (e) {
        console.warn('Failed to save simulation to cloud, saved locally:', e);
      }
    }

    // Always update local cache
    localCache.addSimulation(newSim);

    return { simulation: newSim, savedToCloud };
  }
};
