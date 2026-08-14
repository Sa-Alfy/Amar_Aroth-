# Amar Aroth — agent rules

Next.js 16 App Router + TypeScript (strict) + Tailwind v4 + Supabase (Postgres, RLS).
Bangla-first UI. Early-stage build: mock data and known bugs are expected.

## Scope discipline
- Only edit files named in the prompt. If the fix needs another file, STOP and report it. Do not expand scope.
- Minimal diffs. Do not reformat, reorder imports, rename things, or "clean up" code you were not asked to change.
- Never delete a file. Never mass-rewrite a file that is over 300 lines — patch the specific block.
- No new dependencies, no version bumps, no `npm audit fix`, no lockfile edits unless the prompt says so.
- Do not create new abstractions, folders, or config files unless asked.

## Hard no-touch list
- `.env*`, `.mcp.json`, `package-lock.json`, `.agents/**`
- Existing files in `supabase/migrations/` — they are applied. NEVER edit or delete one.
  New schema changes go in a NEW file: `supabase/migrations/00NN_short_name.sql`.
- Never run destructive commands: `supabase db reset`, `db push`, `rm -rf`, `git reset --hard`,
  `git push --force`, `npm install -g`. Do not run migrations or seeds. Do not start a dev server.

## Truth sources
- Database shape: read `supabase/migrations/*.sql`. Never guess a column, table, policy, or RPC signature.
- Types in `lib/mockData.ts` are used by many pages. If you change a type, list every consumer you
  must also update — or stop and report instead.
- Frontend talks to the backend ONLY through `lib/client/api.ts` → `/api/*` route handlers.
  Never import a Supabase client into a component or page.
- `lib/supabase/server.ts` uses the anon key and inherits the caller's RLS. Privileged/system writes
  need a separate service-role client; if a task needs one and it doesn't exist, report it.

## Conventions
- User-facing strings: Bangla. Code, comments, commits: English.
- Server routes return `{ success: boolean, ... }` and real HTTP status codes.
  Never return `success: true` with fallback mock data to hide an error.
- API routes must check auth before doing work, and must not trust body fields for identity
  (user id, seller id, role) — derive those from the session.

## Definition of done
1. `npx tsc --noEmit` passes.
2. Report as: files changed → what changed → what you did NOT do → manual steps left for me
   (SQL to run, env vars, things to click-test).
3. Do not commit or push. I review and commit.
