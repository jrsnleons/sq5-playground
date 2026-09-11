-- ==============================================================================
-- FOH SQ-5 Simulator: Supabase Database Schema & RLS Policies
-- ==============================================================================

-- 1. Create Profiles Table with Role-Based Access Control (Admin / Member)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete any profile"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 2. Trigger to Automatically Create Profile on Signup
-- The first user to ever sign up is automatically granted 'admin' role. Subsequent users default to 'member' or requested role.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count int;
  initial_role text;
begin
  select count(*) into user_count from public.profiles;
  if user_count = 0 then
    initial_role := 'admin';
  else
    initial_role := coalesce(new.raw_user_meta_data->>'role', 'member');
    if initial_role not in ('admin', 'member') then
      initial_role := 'member';
    end if;
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    initial_role
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name),
    role = coalesce(excluded.role, profiles.role),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper function for Admins to delete user accounts
create or replace function public.admin_delete_user(target_user_id uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) then
    raise exception 'Unauthorized: Only administrators can delete users';
  end if;

  if auth.uid() = target_user_id then
    raise exception 'Cannot delete your own administrator account';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;

grant execute on function public.admin_delete_user(uuid) to authenticated;

-- 3. Practice Simulations & Training Challenges Table
-- Created and published by Admins for members and trainees to practice on.
create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'patching' check (category in ('patching', 'iem', 'mixing', 'geq', 'general')),
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  briefing text not null, -- Markdown / text instructions for the challenge
  starting_rig jsonb not null, -- Snapshot of stage items, cables, ioPatch, channels, mixes
  solution_criteria jsonb, -- Optional automated criteria
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on simulations
alter table public.simulations enable row level security;

-- Simulations Policies
-- Anyone (members, trainees, anonymous guests) can view published simulations
create policy "Published simulations are viewable by all"
  on public.simulations for select
  using (is_published = true or auth.uid() = created_by);

-- Only Admins can insert, update, or delete simulations
create policy "Admins can insert simulations"
  on public.simulations for insert
  with check (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update simulations"
  on public.simulations for update
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete simulations"
  on public.simulations for delete
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 4. Member Presets (Personal Saved Rigs)
-- 4. Member & Official Presets (Factory Rigs and Personal Saves)
create table if not exists public.member_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  simulation_id uuid references public.simulations(id) on delete set null,
  name text not null,
  description text,
  is_official boolean not null default false,
  author_name text,
  physical_data jsonb not null,
  digital_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_presets enable row level security;

create policy "Public can view official presets and users view their own"
  on public.member_presets for select
  using (is_official = true or auth.uid() = user_id);

create policy "Users can insert presets"
  on public.member_presets for insert
  with check (auth.uid() = user_id or (is_official = true and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

create policy "Users can update presets"
  on public.member_presets for update
  using (auth.uid() = user_id or (is_official = true and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

create policy "Users can delete presets"
  on public.member_presets for delete
  using (auth.uid() = user_id or (is_official = true and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

-- 5. Official Church Reference Scenes ("Solid Truths") & User Scenes
create table if not exists public.member_scenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  scene_number int not null,
  name text not null,
  description text,
  is_official boolean not null default false,
  author_name text,
  scene_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_scenes enable row level security;

create policy "Public can view official scenes and users can view their own"
  on public.member_scenes for select
  using (is_official = true or auth.uid() = user_id);

create policy "Users can insert scenes"
  on public.member_scenes for insert
  with check (auth.uid() = user_id or (is_official = true and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

create policy "Users can update scenes"
  on public.member_scenes for update
  using (auth.uid() = user_id or (is_official = true and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

create policy "Users can delete scenes"
  on public.member_scenes for delete
  using (auth.uid() = user_id or (is_official = true and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

-- 6. Supabase Storage Bucket for Equipment Photos
-- Create bucket 'equipment-photos' if storage schema is available
insert into storage.buckets (id, name, public)
values ('equipment-photos', 'equipment-photos', true)
on conflict (id) do nothing;

create policy "Public equipment photo access"
  on storage.objects for select
  using (bucket_id = 'equipment-photos');

create policy "Authenticated users can upload equipment photos"
  on storage.objects for insert
  with check (bucket_id = 'equipment-photos' and auth.role() = 'authenticated');

-- 7. Equipment Inventory & Gear Locker Table
-- Fully relational database storage for physical audio gear, microphones, DI boxes, and consoles.
-- Admin can edit all fields (description, category, connectors, stock limits).
-- Members and public have read-only access.
create table if not exists public.equipment_inventory (
  id text primary key,
  name text not null,
  category text not null,
  model text,
  description text,
  total_stock integer not null default 1 check (total_stock >= 0),
  connectors text[] not null default '{}',
  notes text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_equipment_inventory_category on public.equipment_inventory(category);

alter table public.equipment_inventory enable row level security;

-- Policies: Viewable by everyone (public, members, admins)
create policy "Public can view equipment inventory"
  on public.equipment_inventory for select
  using (true);

-- Mutations restricted to Admins only
create policy "Admins can insert equipment inventory"
  on public.equipment_inventory for insert
  with check (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update equipment inventory"
  on public.equipment_inventory for update
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete equipment inventory"
  on public.equipment_inventory for delete
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

