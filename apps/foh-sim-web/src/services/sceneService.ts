import { supabase, isSupabaseConfigured } from './supabase';
import { localCache, MemberScene, DEFAULT_OFFICIAL_SCENES } from './localCache';

export const sceneService = {
  async fetchScenes(): Promise<{ officialScenes: MemberScene[]; userScenes: MemberScene[] }> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return {
        officialScenes: DEFAULT_OFFICIAL_SCENES,
        userScenes: localCache.getUserScenes()
      };
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      const { data, error } = await supabase
        .from('member_scenes')
        .select('*')
        .order('scene_number', { ascending: true });

      if (error) {
        console.warn('Supabase fetch scenes error, using local cache:', error.message);
        return {
          officialScenes: DEFAULT_OFFICIAL_SCENES,
          userScenes: localCache.getUserScenes()
        };
      }

      if (data && data.length > 0) {
        const officialScenes: MemberScene[] = [];
        const userScenes: MemberScene[] = [];

        for (const item of data) {
          const scene: MemberScene = {
            id: item.id,
            scene_number: item.scene_number,
            name: item.name,
            description: item.description || '',
            is_official: Boolean(item.is_official),
            author_name: item.author_name || 'Admin',
            scene_data: item.scene_data,
            created_at: item.created_at,
            user_id: item.user_id
          };

          if (scene.is_official) {
            officialScenes.push(scene);
          } else {
            userScenes.push(scene);
          }
        }

        // Cache them locally
        localCache.saveUserScenes(userScenes);
        return {
          officialScenes: officialScenes.length > 0 ? officialScenes : DEFAULT_OFFICIAL_SCENES,
          userScenes
        };
      }
    } catch (e) {
      console.warn('Network error fetching scenes, using local cache:', e);
    }

    return {
      officialScenes: DEFAULT_OFFICIAL_SCENES,
      userScenes: localCache.getUserScenes()
    };
  },

  async saveScene(payload: {
    name: string;
    description?: string;
    isOfficial?: boolean;
    sceneData: any;
    sceneNumber?: number;
    existingId?: string;
  }): Promise<{ scene: MemberScene; savedToCloud: boolean }> {
    const isOfficial = Boolean(payload.isOfficial);
    const sceneNumber = payload.sceneNumber || Date.now() % 10000;

    const newScene: MemberScene = {
      id: payload.existingId || `local-scene-${Date.now()}`,
      scene_number: sceneNumber,
      name: payload.name,
      description: payload.description || '',
      is_official: isOfficial,
      author_name: isOfficial ? 'Church Audio Director' : 'You',
      scene_data: payload.sceneData,
      created_at: new Date().toISOString()
    };

    let savedToCloud = false;

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        const dbPayload: any = {
          name: payload.name,
          description: payload.description || '',
          is_official: isOfficial,
          author_name: isOfficial ? 'Church Audio Director' : (userData?.user?.email?.split('@')[0] || 'Member'),
          scene_data: payload.sceneData,
          scene_number: sceneNumber,
          user_id: isOfficial ? null : (userId || null)
        };

        if (payload.existingId && !payload.existingId.startsWith('local-')) {
          dbPayload.id = payload.existingId;
        }

        const { data, error } = await supabase
          .from('member_scenes')
          .upsert(dbPayload)
          .select()
          .single();

        if (!error && data) {
          newScene.id = data.id;
          newScene.user_id = data.user_id;
          savedToCloud = true;
        } else {
          console.warn('Cloud scene save error:', error?.message);
        }
      } catch (e) {
        console.warn('Failed to save scene to cloud, saving locally:', e);
      }
    }

    localCache.saveUserScene(newScene);
    return { scene: newScene, savedToCloud };
  },

  async deleteScene(sceneId: string): Promise<boolean> {
    localCache.removeUserScene(sceneId);

    if (isSupabaseConfigured() && supabase && navigator.onLine && !sceneId.startsWith('local-')) {
      try {
        const { error } = await supabase.from('member_scenes').delete().eq('id', sceneId);
        return !error;
      } catch (e) {
        console.warn('Failed to delete scene from cloud:', e);
      }
    }
    return true;
  }
};
