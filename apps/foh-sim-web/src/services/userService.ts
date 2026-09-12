import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, UserProfile, UserRole } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY;

const USERS_CACHE_KEY = 'foh_cached_team_users';

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'member';
}

export const userService = {
  /**
   * Fetch all registered team profiles from Supabase PostgreSQL
   */
  async fetchTeamProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return this.getCachedTeamProfiles();
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching team profiles from Supabase:', error.message);
        return this.getCachedTeamProfiles();
      }

      if (data && Array.isArray(data)) {
        const profiles: UserProfile[] = data.map((d) => ({
          id: d.id,
          email: d.email,
          displayName: d.display_name || d.email.split('@')[0],
          role: (d.role as UserRole) || 'member',
          createdAt: d.created_at,
          photoUrl: d.avatar_url || undefined
        }));

        this.saveCachedTeamProfiles(profiles);
        return profiles;
      }
    } catch (err) {
      console.warn('Network error fetching team profiles:', err);
    }

    return this.getCachedTeamProfiles();
  },

  /**
   * Admin-only: Create a new account with email & password without terminating the active admin session.
   * Uses an ephemeral client with persistSession: false.
   */
  async adminCreateUser(input: CreateUserInput): Promise<{ user: UserProfile; success: boolean }> {
    const trimmedEmail = input.email.trim();
    const trimmedName = input.displayName.trim() || trimmedEmail.split('@')[0];

    if (!trimmedEmail || !input.password) {
      throw new Error('Please enter both an email address and initial password.');
    }
    if (input.password.length < 6) {
      throw new Error('Initial password must be at least 6 characters.');
    }

    if (!isSupabaseConfigured() || !supabaseUrl || !supabaseAnonKey) {
      // Local fallback
      const newLocalProfile: UserProfile = {
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        displayName: trimmedName,
        role: input.role,
        createdAt: new Date().toISOString()
      };
      const existing = this.getCachedTeamProfiles();
      this.saveCachedTeamProfiles([newLocalProfile, ...existing]);
      return { user: newLocalProfile, success: true };
    }

    // Ephemeral client prevents overwriting active Admin session in localStorage
    const ephemeralClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const { data, error } = await ephemeralClient.auth.signUp({
      email: trimmedEmail,
      password: input.password,
      options: {
        data: {
          display_name: trimmedName,
          role: input.role
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create user account');

    // Wait briefly for PostgreSQL trigger to insert profile
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Ensure role matches requested role in case count was > 0
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            role: input.role,
            display_name: trimmedName
          })
          .eq('id', data.user.id);
      } catch (err) {
        console.warn('Profile role confirmation notice:', err);
      }
    }

    const createdProfile: UserProfile = {
      id: data.user.id,
      email: trimmedEmail,
      displayName: trimmedName,
      role: input.role,
      createdAt: new Date().toISOString()
    };

    const cached = this.getCachedTeamProfiles();
    this.saveCachedTeamProfiles([createdProfile, ...cached.filter((u) => u.id !== createdProfile.id)]);

    return { user: createdProfile, success: true };
  },

  /**
   * Admin-only: Toggle user role between 'admin' and 'member'
   */
  async adminUpdateUserRole(userId: string, newRole: 'admin' | 'member'): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    }

    const cached = this.getCachedTeamProfiles();
    const updated = cached.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    this.saveCachedTeamProfiles(updated);
  },

  /**
   * Admin-only: Delete a team user account
   */
  async adminDeleteUser(userId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
      });

      if (error) throw error;
    }

    const cached = this.getCachedTeamProfiles();
    this.saveCachedTeamProfiles(cached.filter((u) => u.id !== userId));
  },

  /**
   * Member / Admin: Change password for currently authenticated user
   */
  async changePassword(newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    if (!isSupabaseConfigured() || !supabase) {
      return; // Local mock success
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },

  /**
   * Update display name and/or avatar URL for a user
   */
  async updateUserProfile(userId: string, updates: { displayName?: string; photoUrl?: string | null }): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.displayName !== undefined) payload.display_name = updates.displayName.trim();
      if (updates.photoUrl !== undefined) payload.avatar_url = updates.photoUrl;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      if (error) {
        console.warn('Supabase profile update error:', error.message);
      }
    }

    const cached = this.getCachedTeamProfiles();
    const updated = cached.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          ...(updates.displayName !== undefined ? { displayName: updates.displayName.trim() } : {}),
          ...(updates.photoUrl !== undefined ? { photoUrl: updates.photoUrl || undefined } : {})
        };
      }
      return u;
    });
    this.saveCachedTeamProfiles(updated);
  },

  getCachedTeamProfiles(): UserProfile[] {
    try {
      const raw = localStorage.getItem(USERS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCachedTeamProfiles(profiles: UserProfile[]) {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Failed to cache team profiles:', e);
    }
  }
};
