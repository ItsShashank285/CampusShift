# CampusShift: Supabase setup

CampusShift uses Supabase Auth and PostgreSQL for live business job listings and shared student applications. The application-tracking features require the original schema plus the additive marketplace migration.

## 1. Configure Supabase

1. Open https://supabase.com/dashboard and select your CampusShift project.
2. If this is a new project, run the complete `supabase/schema.sql` once in **SQL Editor**. It creates the base `profiles` and `jobs` tables.
3. Then run `supabase/migrations/20261029_marketplace_upgrade.sql` in SQL Editor. This migration is additive: it does not drop or recreate your existing tables or job listings.
4. The migration adds student preferences, availability, shared job applications, shift records, verification requests, and ratings with Row Level Security policies.
5. Do not rerun the original schema as a way to upgrade an existing database. For an existing project, run only the new migration.

## 2. Add environment variables

1. In the project root, copy `.env.example` to `.env.local`.
2. In Supabase, open **Project Settings / API Keys** (or the project's **Connect** panel).
3. Copy the **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the **Publishable key** into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Save `.env.local` and restart the development server (`Ctrl+C`, then `npm run dev`).

Never put a Supabase `service_role` or secret key in `NEXT_PUBLIC_*`, source code, GitHub, or a client component. The browser uses the publishable key and relies on RLS for data protection.

## 3. Test the main flow

1. Create a student account at `/login?role=student`.
2. Create a separate business account at `/login?role=business`.
3. Sign in as the business account and publish a live job.
4. Sign in as the student account and open that live job from `/jobs`.
5. Apply. The application is stored in `job_applications`, and the student dashboard reads applications from Supabase rather than browser-only storage.
6. Check that the same application appears on another device/browser after signing in as the same student.

Sample/demo job cards are for browsing only. They cannot receive a real database application because they do not have a row in the `jobs` table.

For local development, add `http://localhost:3000/login` to Supabase Authentication URL Configuration's allowed redirect URLs if needed. Add the production login URL to the allowlist for your deployed site.

## 4. Deploy

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel under **Project → Settings → Environment Variables** for the environments you use.
2. Merge the reviewed feature branch into `main` after the preview build and test pass.
3. Vercel should deploy the merged commit automatically.

## Security and feature status

- **Live applications:** student submissions and student dashboard reads use the shared database and RLS.
- **Matching:** `src/lib/jobMatching.ts` is a transparent rule-based scoring helper, not a trained AI model. A missing profile does not imply a fabricated high score.
- **Verification:** verification requests can be submitted and read by their owner. Approval is intentionally reserved for a trusted manual/admin process; the UI must not call a user verified until a reviewer actually approves them.
- **Availability, shifts, and ratings:** the database foundation and RLS are included, but a complete scheduling, conflict-prevention, check-in, and two-sided rating UI still requires further integration. Do not treat these tables alone as a finished workflow.
- **Business applicant management:** review the preview build before using this for real hiring. Business-side application listing and accept/reject UI needs to be connected to the new `job_applications` table before that workflow is production-ready.

This repository change does not run SQL in your Supabase project automatically. Apply the migration yourself in the SQL Editor and test with separate student and business accounts.
