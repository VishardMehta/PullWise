# PullWise

AI-powered code review assistant that analyzes pull requests, detects issues, and suggests fixes. Built with React, Vite, TypeScript, Tailwind CSS, and shadcn-ui. Authentication is powered by Supabase with GitHub OAuth.

## Quick Start

```sh
# 1) Clone and install
git clone <YOUR_REPO_URL>
cd pullwise-ai
npm install

# 2) Configure environment (see Environment below)
cp .env.example .env.local  # then edit values

# 3) Run the app
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run build:dev`: development-mode build (useful for debugging)
- `npm run preview`: preview the built app locally
- `npm run lint`: run ESLint

## Environment

Create `.env.local` in the project root and set:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are required for GitHub OAuth on the `Auth` page. Without them, the UI will prompt you to configure Supabase.

## Supabase Setup

1. Create a Supabase project and obtain the `Project URL` and `anon` key from Project Settings → API.
2. In Supabase SQL Editor, run the migration found at `supabase/migrations/20251013093611_create_user_profiles.sql` to create the `user_profiles` table.
3. In Authentication → Providers, enable GitHub and set the callback URL to:
   - `http://localhost:5173/profile` (for local dev)
4. In this repo, set `.env.local` as shown above and restart the dev server.

The Supabase client is initialized in `src/integrations/supabase/client.ts` and typed via `src/integrations/supabase/types.ts`.

## Features

- AI-themed landing page with feature highlights (`src/pages/Index.tsx`)
- GitHub OAuth login via Supabase (`src/pages/Auth.tsx`)
- Profile dashboard pulling data from `user_profiles` (`src/pages/Profile.tsx`)
- Global auth context and session handling (`src/contexts/AuthContext.tsx`)
- Modern UI components via shadcn-ui and Tailwind

## Project Structure

```
src/
  components/            # UI and visual components
  contexts/              # React context providers (Auth, etc.)
  hooks/                 # Reusable hooks
  integrations/
    supabase/            # Supabase client and types
  pages/                 # Route pages (Index, Auth, Profile, NotFound)
  config/                # App constants
  lib/                   # Utilities
```

Key routes:
- `/` → landing
- `/auth` → GitHub sign-in
- `/profile` → authenticated profile view

## Development

```sh
npm run dev
```

- Hot reload is enabled by Vite.
- Auth flow: `Auth` → GitHub OAuth via Supabase → redirect to `/profile`.

## Build & Preview

```sh
npm run build
npm run preview
```

The preview server hosts the production build locally for testing.

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn-ui (Radix primitives)
- Supabase (Auth + Postgres)
- React Router, React Hook Form, Zod, TanStack Query

## Troubleshooting

- Missing Supabase config: The `Auth` page will show a message if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is not set.
- OAuth redirect mismatch: Ensure your GitHub provider settings in Supabase include `http://localhost:5173/profile` for development.
- Database table missing: Run the migration SQL in Supabase if `user_profiles` queries fail.

## Contributing

Pull requests are welcome. Please run `npm run lint` before submitting changes.
