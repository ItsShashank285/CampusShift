# CampusShift

CampusShift is a student-focused job marketplace built with Next.js, React, TypeScript, and Tailwind CSS. It includes a dark animated interface, job search and filters, job detail pages, student/application prototype pages, and a Supabase-backed business job-posting workflow.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Set up shared job listings and business accounts

1. Read [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).
2. Create a Supabase project.
3. Run [`supabase/schema.sql`](./supabase/schema.sql) in Supabase SQL Editor.
4. Copy `.env.example` to `.env.local` and enter `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project.
5. Restart the dev server.
6. Open `/login?role=business&mode=signup` to create a business account, sign in, and post a job from the business dashboard.

Never put a service-role key or any secret in a `NEXT_PUBLIC_*` variable. Public access relies on the database's Row Level Security policies.

## Key routes

- `/` — homepage
- `/jobs` — public job listings (includes demo listings and live published listings)
- `/jobs/[id]` — job detail page
- `/login` — sign-in and account creation
- `/business` — business dashboard and job management
- `/business/jobs/new` — publish a job
- `/business/jobs/[id]/edit` — edit a listing
- `/dashboard` — student dashboard prototype

## Current scope

Business accounts can create, edit, close, and reopen shared job listings after Supabase is configured. Job listings are protected by Row Level Security so each business can only manage its own jobs. Student application records and accept/reject statuses still use browser `localStorage`; connecting those records to the shared database is a follow-up milestone.
