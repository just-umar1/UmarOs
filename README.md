# UMAR.OS — Developer portfolio platform

UMAR.OS is an early-stage, multi-user portfolio platform. Developers can register, shape a profile, manage projects, preview one of three themes, and publish a stable `/u/[username]` page. Public visitors do not need an account. Draft account data is protected by Supabase Row Level Security (RLS); the public renderer reads only through allowlisted database functions.

## Architecture

- **Next.js App Router + React + TypeScript** for server-rendered public routes and authenticated application pages.
- **Supabase Auth + PostgreSQL + Storage** for sessions, user-owned content, allowlisted public portfolio reads, and private media that is readable only by its owner or when referenced by an active published portfolio.
- **Cookie-based SSR sessions** through `@supabase/ssr`; `proxy.ts` refreshes claims and dashboard routes also verify the user server-side.
- The original static portfolio was replaced by the platform app. Shared UMAR.OS identity and visual direction remain; the public portfolio renderer is reused for the landing preview, design preview, and published profile page.

## Local setup

Requirements: Node.js 20.9 or newer, pnpm, and a Supabase project.

1. Install dependencies: `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`.
3. Apply `supabase/migrations/202610240001_initial_schema.sql` to a new Supabase project. You can use the Supabase SQL editor or link the Supabase CLI to the project and run `supabase db push`.
4. Configure Supabase Auth → URL Configuration with the local Site URL `http://localhost:3000` and allowed redirect URL `http://localhost:3000/auth/callback`. Add the production equivalents before deployment. Email confirmation and password recovery links use this callback.
5. Run `pnpm dev`, then open `http://localhost:3000`.

The app shows a backend-setup notice when environment variables are missing. It never substitutes mock authentication or fake Explore entries. The landing template preview is clearly labeled and uses illustrative placeholder content.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (legacy anon key also works with current Supabase projects, but prefer the publishable key).
- `NEXT_PUBLIC_SITE_URL`: canonical public site origin; use localhost for local development and the production origin after deployment.

No service-role key is used or needed by this app. Do not put privileged secrets in `NEXT_PUBLIC_*` variables or commit `.env.local`.

## Database and security

The migration creates:

- `profiles` — owner-linked identity, optional public contact, skills, social links, and discovery setting.
- `projects` — owner-linked work, visibility, featured state, order, technologies, links, and media references.
- `portfolio_settings` — template, appearance, accent, publication snapshot, contact visibility, and SEO fields.

RLS is enabled on all three tables. Authenticated policies scope select/insert/update/delete to `auth.uid()`. Settings publication columns cannot be updated directly by the client; only the owner-scoped publish/unpublish RPCs can change them. Anonymous users receive no direct table grants. `publish_my_portfolio()` snapshots the owner’s current approved content after validating the required profile fields. Draft edits do not alter the public snapshot. `unpublish_my_portfolio()` clears it. `get_public_portfolio(username)` and `explore_portfolios(...)` are `SECURITY DEFINER` functions with a pinned empty search path and explicit JSON allowlists. They only return published portfolio content; individual projects are included only when visibility is public. The profile email appears only when `show_email` is enabled. The private `portfolio-assets` bucket accepts only JPEG, PNG, and WebP files up to 5 MB. Upload, update, and delete are scoped to the authenticated user's folder. A narrowly-scoped RLS helper allows anonymous storage reads only for image paths referenced by a published snapshot; the same-origin `/media/[...path]` route fetches through Supabase Storage RLS with no-store caching. Draft uploads remain inaccessible anonymously.

`is_published_asset(path)` allows the media route to read an object only when an active published snapshot references it; project visibility is checked again at read time. `delete_my_account()` can delete only the authenticated caller. The client first attempts to remove that user's media; if storage removal fails, account deletion is not called. Supabase backup retention still applies after deletion.

The RLS integration assertions live in `supabase/tests/rls.test.sql`; run them in a disposable Supabase test database with `supabase test db`. They create two isolated test users and check direct anonymous access, cross-user profile/project reads and mutations, draft hiding, public allowlists, and email visibility.

## Features and routes

Public: `/`, `/explore`, `/u/[username]`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/privacy`, `/terms`.

Authenticated: `/dashboard`, `/dashboard/onboarding`, `/dashboard/editor`, `/dashboard/projects`, `/dashboard/design`, `/dashboard/settings`.

The editor supports profile fields, HTTPS social links, optional profile/project uploads, public/private projects, featured work, ordering, three templates, five accent colors, light/dark public appearance, draft preview, publish/unpublish confirmation, copy/share links, email visibility, Explore opt-in, sign-out, and self-service account deletion. Email and password authentication are implemented through Supabase Auth; no OAuth buttons are shown because no OAuth provider is configured.

## Verification

- `pnpm test` runs dependency-free Node tests for username validation, redirect safety, HTTPS links, and content length rules.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` check the application after `pnpm install`.
- `supabase test db` checks the RLS workflow in an isolated local Supabase database.

Authentication, mail delivery, storage, publishing, and multi-user policies require a configured Supabase project and were not exercised by the local unit tests. No Supabase credentials or project connection are present in this checkout.

## Deployment

Deploy the Next.js server to Vercel or another Node-compatible host. Add the three environment variables in that host, apply the SQL migration to the production Supabase project, set Supabase Auth Site URL and allowed callback URLs for the production domain, and test verification/reset emails before opening registration. `NEXT_PUBLIC_SITE_URL` drives canonical metadata and copy/share URLs. Public routes are request-rendered so unpublishing takes effect without a stale static page; authenticated responses are not cached as shared public data.

Custom domains, analytics, subscriptions, visitor metrics, OAuth, education/experience models, and a custom contact form are intentionally outside this MVP.
