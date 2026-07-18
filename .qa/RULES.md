# RULES.md — binding project rules, tagged by package (mission 2: auth + dashboard + search)

Three packages in play. Read the matching section before every change.

## [schooltest-api] Strapi v5.50.1 backend (src: schooltest-api/CLAUDE.md + .claude/rules/)
- pnpm ONLY, TS only, `pnpm tsc --noEmit` must pass; NEVER run the server manually (it already
  runs on :5500; restarts only via the run task).
- `strapi.documents()` ONLY (never Entity Service); `documentId` (never numeric id);
  explicit populate (NEVER `'*'`); `@strapi/utils` typed errors only.
- Content-types as schema.json FILES by hand (NEVER the admin Content-Type Builder);
  after schema changes run `pnpm strapi ts:generate-types`.
- Custom routes in `01-custom-<name>.ts` (loads before core); never `auth:true` in route
  config (omit = required; only `false` or `{scope}`); policies referenced as
  `global::` / `api::<api>.` / `plugin::`.
- Controllers: factory style or direct default export; replaced core actions MUST
  validateQuery/sanitizeQuery/sanitizeOutput/transformResponse; thin controllers, logic
  in services (`factories.createCoreService`).
- Roles/permissions/seed users ONLY in code (bootstrap src/bootstrap/roles.ts +
  permissions-actions.ts + seed files) — NEVER the admin UI.
- Document middleware must `return next()` on every path.

## [schooltest-web] Next.js 16 parent portal (src: schooltest-web/CLAUDE.md + .claude/rules/)
- pnpm ONLY; TS only; `pnpm tsc --noEmit` + `pnpm lint` zero errors; ≤200 lines/file,
  ≤120/component; @/ imports only (no ../ upward); Server Components default,
  'use client' line 1 only where required.
- NEVER edit src/components/ui/* — use the design-system module
  (src/modules/design-system barrel: Button/Input/Card/Dialog/Table/Command…).
- NEVER fetch from components — TanStack Query hooks in queries/ over the typed axios
  instance (src/lib/axios/strapi.ts, JWT in localStorage app.auth.token via
  readClientToken/writeClientToken; server token via env where needed).
- i18n: NO hardcoded user-facing strings — everything via messages/{en,de}.json,
  identical key shape (run the parity script); PascalCase namespaces.
- Forms: react-hook-form + zodResolver + same schema client-side as the API contract.
- OKLCH tokens only; no arbitrary class values (use @theme tokens); next/font + next/image.
- Playwright for e2e (config boots `next dev -p 3100` itself); axe serious/critical = 0.

## [schooltest-app] Electron desktop (student test app) (src: schooltest-app/CLAUDE.md + .claude/rules/)
- pnpm ONLY; strict TS (never `any`); static export — NO Server Actions/Route Handlers/
  middleware/cookies; client-first authed UI; auth = JWT + localStorage + magic-link.
- NEVER fetch in components (axios instances + TanStack Query); NEVER edit src/components/ui/*.
- i18n single-locale en (messages/en.json); router/Link from @/i18n/navigation only.
- The magic-link client flow EXISTS — do NOT rewrite it; extend only if the api contract
  forces it (it must not — the api implements the app's existing client contract).
- ≤200 lines/file, ≤120/component; `pnpm tsc --noEmit && pnpm lint` before done.

## Borrow rules (schoolgo)
- schoolgo is READ-ONLY reference. Copy patterns/code into our repos and adapt to our
  contracts — never import across repos, never edit schoolgo.
