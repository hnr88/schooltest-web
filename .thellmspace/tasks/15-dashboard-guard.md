---
id: 15
title: /dashboard route + client-side parent guard
layer: frontend
kind: build
slice: dashboard shell gated by the auth store (redirect to /sign-in without JWT)
target: schooltest-web/src/app/dashboard/page.tsx, src/modules/auth/hooks/, src/modules/dashboard/
contract: frontend (guard behavior)
status: TODO
depends_on: []
---
## Objective
Create the dashboard route + guard primitive the later slices plug into:
- src/modules/dashboard/ module scaffold (components/, queries/, stores?, types/, index.ts
  — module-pattern structure; keep only what's needed).
- Guard: a useRequireParent hook (client) in modules/auth/hooks/: reads the auth store
  (jwt + hydrated), and on hydration without jwt → router.replace('/sign-in'); returns
  {isReady, isAuthenticated}. A ParentGuard component wrapping the dashboard content
  (loading skeleton while hydrating, matching our DS Spinner/Skeleton patterns).
- /dashboard/page.tsx: server shell (generateMetadata from Dashboard.meta, en+de)
  rendering the client DashboardScreen (stub content for now — the real sections land
  in tasks 16-18) wrapped in ParentGuard. Add the Dashboard namespace keys (title,
  meta.title/description).
## Files
- src/app/dashboard/page.tsx, src/modules/auth/hooks/use-require-parent.ts,
  src/modules/auth/components/ParentGuard.tsx, src/modules/dashboard/**
## Done criteria
- Incognito browser hitting /dashboard → redirected to /sign-in (REAL run); with the
  seeded parent session → dashboard shell renders; tsc+lint zero; axe clean; parity.
## Evidence
(filled by builder/verifier)
