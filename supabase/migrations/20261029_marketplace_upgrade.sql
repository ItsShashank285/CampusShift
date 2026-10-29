-- CampusShift marketplace upgrade (additive; preserves existing profiles/jobs and data).
-- Apply once in Supabase SQL Editor after the original schema.sql.

create table if not exists public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  college text not null default '',
  course text not null default '',
  year_of_study smallint check (year_of_study between 1 and 8),
  skills text[] not null default '{}',
  preferred_categories text[] not null default '{}',
  minimum_hourly_pay numeric(10,2) check (minimum_hourly_pay is null or minimum_hourly_pay >= 0),
  preferred_location text not null default '',
  bio text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.student_availability (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (student_id, weekday, start_time, end_time)
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  cover_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.job_applications(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','checked_in','completed','cancelled','no_show')),
  checked_in_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_type text not null check (account_type in ('student','business')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  evidence_note text not null default '',
  reviewer_note text not null default '',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  check (reviewer_id <> reviewee_id),
  unique (shift_id, reviewer_id)
);

create index if not exists job_applications_job_status_idx on public.job_applications(job_id, status, created_at desc);
create index if not exists job_applications_student_idx on public.job_applications(student_id, created_at desc);
create index if not exists shifts_student_time_idx on public.shifts(student_id, start_at, end_at);
create index if not exists shifts_job_idx on public.shifts(job_id);
create index if not exists availability_student_weekday_idx on public.student_availability(student_id, weekday);

alter table public.student_profiles enable row level security;
alter table public.student_availability enable row level security;
alter table public.job_applications enable row level security;
alter table public.shifts enable row level security;
alter table public.verification_requests enable row level security;
alter table public.ratings enable row level security;

grant select, insert, update on public.student_profiles to authenticated;
grant select, insert, update, delete on public.student_availability to authenticated;
grant select, insert, update on public.job_applications to authenticated;
grant select, insert, update on public.shifts to authenticated;
grant select, insert on public.verification_requests to authenticated;
grant select, insert on public.ratings to authenticated;

drop policy if exists "Students manage their own preferences" on public.student_profiles;
create policy "Students manage their own preferences" on public.student_profiles
for all to authenticated
using (user_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'student'))
with check (user_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'student'));

drop policy if exists "Students manage their own availability" on public.student_availability;
create policy "Students manage their own availability" on public.student_availability
for all to authenticated
using (student_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'student'))
with check (student_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'student'));

drop policy if exists "Students and job owners can read applications" on public.job_applications;
create policy "Students and job owners can read applications" on public.job_applications
for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = (select auth.uid()))
);

drop policy if exists "Students apply to active jobs" on public.job_applications;
create policy "Students apply to active jobs" on public.job_applications
for insert to authenticated
with check (
  student_id = (select auth.uid())
  and status = 'pending'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'student')
  and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
);

drop policy if exists "Students withdraw and business owners decide applications" on public.job_applications;
create policy "Students withdraw and business owners decide applications" on public.job_applications
for update to authenticated
using (
  (student_id = (select auth.uid()) and status = 'pending')
  or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'business'))
)
with check (
  (student_id = (select auth.uid()) and status = 'withdrawn')
  or (exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'business')) and status in ('accepted','rejected','pending'))
);

drop policy if exists "Participants and job owners read shifts" on public.shifts;
create policy "Participants and job owners read shifts" on public.shifts
for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = (select auth.uid()))
);

drop policy if exists "Business owners create shifts for their jobs" on public.shifts;
create policy "Business owners create shifts for their jobs" on public.shifts
for insert to authenticated
with check (
  exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = (select auth.uid()))
  and exists (select 1 from public.job_applications a where a.id = application_id and a.job_id = job_id and a.student_id = student_id and a.status = 'accepted')
);

drop policy if exists "Business owners update shifts" on public.shifts;
create policy "Business owners update shifts" on public.shifts
for update to authenticated
using (exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = (select auth.uid())))
with check (exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = (select auth.uid())));

drop policy if exists "Users read their own verification requests" on public.verification_requests;
create policy "Users read their own verification requests" on public.verification_requests
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users submit verification requests" on public.verification_requests;
create policy "Users submit verification requests" on public.verification_requests
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and account_type = (select p.role from public.profiles p where p.id = (select auth.uid()))
);

drop policy if exists "Shift participants read ratings" on public.ratings;
create policy "Shift participants read ratings" on public.ratings
for select to authenticated
using (
  reviewer_id = (select auth.uid()) or reviewee_id = (select auth.uid())
  or exists (select 1 from public.shifts s join public.jobs j on j.id = s.job_id where s.id = shift_id and j.owner_id = (select auth.uid()))
);

drop policy if exists "Participants rate each other after completed shifts" on public.ratings;
create policy "Participants rate each other after completed shifts" on public.ratings
for insert to authenticated
with check (
  reviewer_id = (select auth.uid())
  and exists (
    select 1 from public.shifts s join public.jobs j on j.id = s.job_id
    where s.id = shift_id and s.status = 'completed'
      and ((s.student_id = (select auth.uid()) and j.owner_id = reviewee_id)
        or (j.owner_id = (select auth.uid()) and s.student_id = reviewee_id))
  )
);

create or replace function public.set_marketplace_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_student_profiles_updated_at on public.student_profiles;
create trigger set_student_profiles_updated_at before update on public.student_profiles
for each row execute procedure public.set_marketplace_updated_at();
drop trigger if exists set_job_applications_updated_at on public.job_applications;
create trigger set_job_applications_updated_at before update on public.job_applications
for each row execute procedure public.set_marketplace_updated_at();
drop trigger if exists set_verification_requests_updated_at on public.verification_requests;
create trigger set_verification_requests_updated_at before update on public.verification_requests
for each row execute procedure public.set_marketplace_updated_at();

-- Note: approval/rejection of verification requests is intentionally reserved for a trusted
-- manual/admin workflow; no user-facing self-approval policy is granted here.


-- Allow a business to read basic profile details only for students who applied
-- to one of that business's jobs. This is needed for the applicant dashboard.
drop policy if exists "Businesses read profiles of their applicants" on public.profiles;
create policy "Businesses read profiles of their applicants" on public.profiles
for select to authenticated
using (
  exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    where a.student_id = profiles.id
      and j.owner_id = (select auth.uid())
  )
);

drop policy if exists "Businesses read student details for their applicants" on public.student_profiles;
create policy "Businesses read student details for their applicants" on public.student_profiles
for select to authenticated
using (
  exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    where a.student_id = student_profiles.user_id
      and j.owner_id = (select auth.uid())
  )
);
