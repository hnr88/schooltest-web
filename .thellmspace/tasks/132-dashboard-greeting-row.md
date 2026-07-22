---
id: 132
title: Build the dashboard greeting row — date line and time-of-day H1
layer: ui
kind: implement
slice: The dashboard's top greeting row (design §2 left stack)
target: src/modules/dashboard/components/DashboardGreeting.tsx, src/modules/dashboard/lib/greeting.ts
contract: n/a (reads GET /api/users/me via the existing useAuth)
design: .qa/design/screens/portal--main.html:7-11 · .qa/design/spec/01-portal-dashboard.md#2
status: TODO
depends_on: ["131"]
---

## Objective
Replace the current "Welcome back, {name}!" header block with the design's greeting row: a muted
date line above a 32px medium-weight H1. Keeps the live username from `GET /api/users/me`.

## Contract
n/a for the row itself. The name is `user.username` from the existing `useAuth()` →
`useMeQuery` → `GET /api/users/me`. **That wiring is preserved verbatim** — no new request.

## Design source
`portal--main.html:7-11`, spec §2:
- Row: `display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap`
  → `flex flex-wrap items-end justify-between gap-5`.
- Date line (`:9`): **"Tuesday, July 22"** — `font-size:13px; color:#7C8698; margin-bottom:6px`
  → `text-caption text-muted-foreground mb-1.5`.
  `--text-caption` = `0.8125rem` (13px) ✓ exact. `--color-muted-foreground` = `oklch(0.5544 0.0407
  257.4166)` (`#64748B`) — the design's `#7C8698` has no token; this is the sanctioned nearest.
  Format `dddd, MMMM D` via next-intl `useFormatter().dateTime(now, { weekday:'long', month:'long',
  day:'numeric' })` — locale-aware, never a hand-built English string.
- `<h1>` (`:10`): **"Good morning, Maria"** — `font-size:32px; font-weight:500;
  letter-spacing:-0.02em; color:#0E2350` → `text-h2 font-medium text-navy-900`.
  `--text-h2` = `2rem` (32px) ✓ exact; its `--text-h2--letter-spacing` is `-0.015em` vs the design's
  `-0.02em` — accept the 0.005em delta rather than adding a token, and record it.
- Time-of-day rule (the design shows only "Good morning"; the slot is `{greeting}, {name}`):
  local hour `< 12` → morning, `< 18` → afternoon, else evening. Three i18n keys, no invention
  beyond the three-way split the copy implies.
- **Right cluster is NOT built here.** `portal--main.html:12-20` puts a 240px search pill and a
  44px bell button there; both already exist in `AppTopbar` (`@/modules/shell`) and W4 owns them.
  Duplicating them on the page would ship two search fields and two bells. Metric 12 (spec §10 row
  12, the unread dot) is therefore W4's, not W5's — recorded, not dropped.
- Motion: none of its own; 156 gives the row its entrance.

## Files
- EDIT `src/modules/dashboard/components/DashboardGreeting.tsx` — rewrite. Drop the `overview` prop
  (the stat strip it fed is gone with 131); take `name: string`.
- CREATE `src/modules/dashboard/lib/greeting.ts` — `getGreetingKey(date: Date): 'morning' |
  'afternoon' | 'evening'`. Pure, unit-testable, no JSX, no `Date.now()` inside a cached component.
- i18n: `Dashboard.greeting.morning|afternoon|evening` = `"Good morning, {name}"` etc.

## Depends on
- **131** — the stack the row sits in.

## Steps
1. `getGreetingKey` in `lib/`, taking the date as an argument (never reading the clock itself).
2. Rewrite `DashboardGreeting` as a dumb component: `data-slot="dashboard-greeting"`, the formatted
   date line, the `<h1>`.
3. Add the six-catalog keys (158 audits parity).
4. Update `tests/e2e/dashboard.spec.ts`'s `Welcome back, parent!` heading assertion to the new
   heading — the h1 still carries the LIVE username, which is the functional assertion to keep.

## Project rules
- `.claude/rules/i18n.md` — `useTranslations` in the client component; no hardcoded string; keys
  `PascalCase.camelCase`.
- `.claude/rules/quality.md` — exactly one `<h1>` per page; this is it.
- `.claude/rules/nextjs-patterns.md` — non-deterministic `new Date()` in a client component is fine;
  never inside a cached Server Component without `connection()`.
- `.claude/rules/module-pattern.md` — the hour→key rule is business logic, so it lives in `lib/`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, seeded parent: `getByRole('heading', { level: 1 })` matches
  `/^(Good morning|Good afternoon|Good evening), /` AND contains the username returned by a live
  `GET /api/users/me` in the same test — never a literal.
- Exactly one `h1` on `/dashboard` (`page.locator('h1')` count === 1).
- The date line's text equals `new Intl.DateTimeFormat('en', {weekday:'long', month:'long',
  day:'numeric'}).format(new Date())` computed in the test.
- Computed styles: h1 `font-size: 32px`, `font-weight: 500`; date line `font-size: 13px`.
- Locale proof: same page at `/zh/dashboard` renders the zh greeting and a zh-formatted date.
- 375px: row wraps, no horizontal overflow. axe clean. Six catalogs key-identical.

## Assumptions
- `user.username` remains the display name source; the design's "Maria" is example data.

## Evidence
<filled in as the task runs>
