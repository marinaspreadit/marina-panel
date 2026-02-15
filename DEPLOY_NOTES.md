# Marina Panel — Deploy notes (Vercel)

## Preconditions
- Repo clean + pushed to remote used by Vercel
- Env vars set in Vercel (Preview + Production as needed)
  - `PANEL_PASSWORD` (or whatever auth gate uses)
  - `DATABASE_URL` (Neon Postgres)
  - Optional: `VERCEL_ENV` is automatic

## Commands (local)
```bash
npm run lint
npm run build
```

## Vercel
1. Import project (if not already) and connect the Git repo.
2. Set env vars.
3. Deploy.

## Smoke tests (mobile-first)
- /login: can log in, keyboard doesn’t break layout
- /: top CTA buttons full width on mobile, no horizontal scroll
- /tasks: create task form stacks nicely, can open a task
- /tasks/[id]: main actions reachable, notes area usable
- /jobs: payload box wraps, artifacts buttons full-width on mobile
- /scraper: run form stacks, RUN button full-width, download works

## Known warnings
- Next.js warning: `middleware` convention deprecated → migrate to `proxy` when touching middleware next.
- ESLint: we currently disable `@typescript-eslint/no-explicit-any` for faster iteration; tighten later.
