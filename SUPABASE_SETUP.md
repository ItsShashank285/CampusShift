# CampusShift: enable shared job listings

This update adds Supabase Auth and a PostgreSQL-backed job-posting flow. **It is not fully connected until you complete the dashboard setup below.**

## 1. Create a Supabase project

1. Open https://supabase.com/dashboard and create a project.
2. Wait for the database to finish provisioning.
3. In **SQL Editor**, create a new query, paste all of `supabase/schema.sql`, and run it.
4. The script creates `profiles` and `jobs`, a signup trigger, indexes, and Row Level Security (RLS) policies. Public visitors can read active jobs; only the business account that owns a listing can edit or close it.

## 2. Add local environment variables

1. In the project root, copy `.env.example` to `.env.local`.
2. In Supabase, open **Project Settings / API Keys** (or the project's **Connect** panel).
3. Copy the **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the **Publishable key** into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Save `.env.local` and restart the dev server (`Ctrl+C`, then `npm run dev`).

Never put a Supabase `service_role` or secret key in `NEXT_PUBLIC_*`, source code, GitHub, or a client component. The browser uses the publishable key and relies on RLS for data protection.

## 3. Install the new dependency

From the project root, run:

```bash
npm install
```

This installs `@supabase/supabase-js` and refreshes `package-lock.json`.

## 4. Create and test a business account

1. Open `/login?role=business`.
2. Choose **Create account**, enter your name, email, and password, then create the account.
3. If Supabase email confirmation is enabled, open the verification email before signing in.
4. Sign in as the business account. Open the business dashboard and click **Post a Job**.
5. Publish a listing, then open `/jobs` in another browser/session or device. The active database job should appear there as a live listing.

For local development, add `http://localhost:3000/login` to Supabase Authentication URL Configuration's allowed redirect URLs if needed. For the live site, add your Vercel production URL ending in `/login` as well.

## 5. Deploy the changes to Vercel

1. Add the same two environment variables in Vercel **Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development** as needed.
2. Add the new/updated source files to your existing GitHub repository and push them to `main`.
3. Vercel should build the new deployment automatically. If it doesn't, open Deployments and redeploy the latest commit.

## Scope note

This milestone makes **job listings** shared and database-backed, including business account sign-up/login, create, edit, and close/reopen operations. Student applications and accept/reject statuses still use browser `localStorage` in the current prototype, so application records are not yet shared across different devices. That's a separate follow-up milestone.
