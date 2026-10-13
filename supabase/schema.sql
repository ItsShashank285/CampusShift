-- CampusShift database setup for Supabase.
-- Run the complete file once in Supabase Dashboard > SQL Editor.
-- It creates student/business profiles and shared job listings with Row Level Security.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'business')),
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  company text not null check (char_length(company) between 2 and 120),
  pay numeric(10, 2) not null check (pay >= 0),
  location text not null check (char_length(location) between 2 and 160),
  shift_day text not null,
  shift_time text not null,
  category text not null,
  work_mode text not null check (work_mode in ('On-site', 'Remote', 'Hybrid')),
  shift_type text not null check (shift_type in ('Weekday', 'Weekend', 'Flexible')),
  description text not null check (char_length(description) between 20 and 3000),
  requirements text[] not null default '{}',
  workers_needed integer not null default 1 check (workers_needed between 1 and 100),
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_owner_id_idx on public.jobs (owner_id);
create index if not exists jobs_status_created_at_idx on public.jobs (status, created_at desc);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

-- Profiles are created by the trigger below. Users can only read their own profile.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- A trusted database trigger creates a profile when someone registers.
create or replace function public.handle_new_campusshift_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text;
begin
  selected_role := case
    when new.raw_user_meta_data ->> 'role' = 'business' then 'business'
    else 'student'
  end;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    selected_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_campusshift_auth_user_created on auth.users;
create trigger on_campusshift_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_campusshift_user();

-- Public visitors can browse active listings. A signed-in owner can also see their own closed listings.
grant select on table public.jobs to anon, authenticated;
grant insert, update, delete on table public.jobs to authenticated;
drop policy if exists "Anyone can browse active jobs and owners can view their jobs" on public.jobs;
create policy "Anyone can browse active jobs and owners can view their jobs"
  on public.jobs for select to anon, authenticated
  using (status = 'active' or owner_id = (select auth.uid()));

-- Only accounts whose trusted profile role is business may create or manage listings.
drop policy if exists "Businesses can create their own jobs" on public.jobs;
create policy "Businesses can create their own jobs"
  on public.jobs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'business'
    )
  );

drop policy if exists "Businesses can update their own jobs" on public.jobs;
create policy "Businesses can update their own jobs"
  on public.jobs for update to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'business'
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'business'
    )
  );

drop policy if exists "Businesses can delete their own jobs" on public.jobs;
create policy "Businesses can delete their own jobs"
  on public.jobs for delete to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'business'
    )
  );

-- Keep updated_at fresh when a listing is changed.
create or replace function public.set_job_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
before update on public.jobs
for each row execute procedure public.set_job_updated_at();
