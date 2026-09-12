import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-ref.supabase.co' &&
    supabaseAnonKey !== 'your-supabase-anon-key-here'
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type UserRole = 'admin' | 'member' | 'guest';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  photoUrl?: string;
}

export interface PracticeSimulation {
  id: string;
  title: string;
  description: string;
  category: 'patching' | 'iem' | 'mixing' | 'geq' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  briefing: string;
  startingRig: any;
  solutionCriteria?: any;
  isPublished: boolean;
  createdBy?: string;
  authorName?: string;
  createdAt?: string;
}
