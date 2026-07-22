# PLAN — mission `st-portal-redesign` (started 2026-07-22)

> The mission-2 plan is archived at `.qa/archive-mission2-20260722/PLAN.md`.

## Mission

Implement the design export at `schooltest-web/dashbaord-design/` across the SchoolTest **parent
portal**, wired to the real Strapi API, following `docs/`, inventing nothing, preserving every
functional behaviour that exists today, adding real motion, and doing mobile properly.

Decoded operator instruction and its binding reading: `.qa/DECISIONS.md` **D-SCOPE-1**.
Scope boundaries: **D-SCOPE-2**. What "drop what you created till now" does and does not
authorise: **D-SCOPE-3**.

## Complexity band — **huge (201-400 tasks)**

Justified against the ladder:

- Not `large` (71-200): the design export contains **114 addressable screen slices**, of which 45
  are in scope. The work spans a full token/typography/motion foundation, ~40 design-system
  component specs, three new backend contract surfaces, nine route groups, six locale catalogs
  that must stay key-identical, and both a mobile and a desktop composition for every screen. Each
  screen additionally needs loading / empty / error states, which the current UI mostly lacks.
- Not beyond 400: the app already exists and is functional. This is a re-skin plus a metrics
  layer, not a build from zero — auth, routing, i18n, the query layer, the Playwright harness and
  48 passing specs are all in place and are preserved, not rebuilt.

Target: **~270 tasks across 12 waves**, inside the 500-task / 50-wave cap.

## What the intake established (read these before planning anything further)

| Artifact | What it settles |
|---|---|
| `.qa/design/screens/` + `screens-index.json` | 114 losslessly-sliced design screens, each citable by path |
| `.qa/design/spec/01-portal-dashboard.md` | The dashboard, and **the 12-row metric inventory** |
| `.qa/design/spec/02-portal-children.md` | Children list, child detail, result detail |
| `.qa/design/spec/03-portal-forms.md` | Add-child wizard, settings, notifications, billing |
| `.qa/design/spec/04-ds-foundations.md` | Colour, type scale, buttons, forms, badges, alerts + OKLCH mapping |
| `.qa/design/spec/05-ds-components.md` | Cards, table, tabs, overlays, navigation, dashboard tiles, dark mode |
| `.qa/design/spec/06-auth-states-landing.md` | Auth screens, skeletons, 404, empty states, landing |
| `.qa/intake/web-inventory.md` | Every existing route, module, query hook and endpoint it calls |
| `.qa/intake/api-inventory.md` | Per-endpoint contract table + **17 numbered gaps (G1-G17)** |
| `.qa/intake/docs-constraints.md` | The product's binding reporting vocabulary + 6 rule conflicts |
| `.qa/CONTRACTS.md` (this mission's addendum) | The 3 new backend surfaces + the 8 BLOCKED metrics |

### The three findings that shape every wave

1. **The design is almost entirely static.** Zero `transition:` and zero `@keyframes` in the whole
   Parent Portal export; the design system defines six keyframes that no screen references. The
   operator nonetheless requires motion, and `.qa/DECISIONS.md` **D-DESIGN-3** makes it part of
   done. So motion is *authored* from the design system's own six keyframes
   (`st-fade-in`, `st-pop-in`, `st-toast-in`, `st-spin`, `st-shimmer`, `st-rec-pulse`) plus
   Tailwind transitions — never a new dependency, always with a `prefers-reduced-motion` variant.
2. **The design has no focus states at all** and explicitly sets `outline:none` on both search
   inputs. WCAG 2.2 AA and `.claude/rules/quality.md` both require visible focus. Focus rings are
   therefore authored from the design's own `--ring` token. Fixing the markup, never suppressing
   the rule.
3. **Some design metrics are forbidden by the product docs, and one has no data at all.**
   `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md` bans cut scores, cross-skill composites and any
   computed CEFR score; and no scheduling model exists anywhere in the API. Those metrics are
   BLOCKED (`.qa/CONTRACTS.md` **B-1 … B-8**) and get the sanctioned vocabulary instead — CEFR
   band lookup, ACARA phase, readiness, per-attribute mastery probability. Nothing is faked.

## Wave structure (vertical slices, dependency-ordered)

Every wave gates on `pnpm tsc --noEmit` + `pnpm lint` clean, a self/critic review of the diff, an
independent verify subagent per task, a real Playwright run, and one commit per wave on `main`.

| Wave | Slice | Depends on | ~Tasks |
|---|---|---|---|
| **W0** | Foundations — OKLCH `@theme` tokens from `tokens.css`, Google Sans via `next/font/local`, radius/shadow/spacing scale, the six keyframes + reduced-motion, dark-mode overrides, focus-ring token | — | 14 |
| **W1** | Design-system primitives — button, input/field, select, checkbox/radio/switch, badge, alert, card family, table, tabs, overlays (dialog/sheet/popover/tooltip/toast), skeleton+shimmer, empty state, pagination | W0 | 38 |
| **W2** | Backend metric surfaces — `C-DASH-HOUSEHOLD`, `C-PARENT-RESULT-VIEW`, `C-CHILD-RESULT-HISTORY`: schema contracts, services, controllers, routes, grants, security tests | — (parallel to W0/W1) | 22 |
| **W3** | Typed client + query layer — Zod mirrors of the three contracts, TanStack Query hooks, error/loading contracts, i18n keys for every new string × 6 locales | W2 | 16 |
| **W4** | App shell — detached sidebar, top bar, breadcrumb, user menu, mobile nav sheet, active/hover/focus states, keyboard nav | W1 | 18 |
| **W5** | Dashboard — navy hero panel, the servable hero stats, practice-minutes chart, "My children" rows with CEFR ticks + focus pill, teacher note, recommended, and the BLOCKED "coming up" handling | W3, W4 | 30 |
| **W6** | Children — list cards, child detail (level journey, skills from per-attribute data, recent results with real pagination), archive/unarchive, empty + error states | W3, W4 | 30 |
| **W7** | Add-child wizard — step rail, all five steps, every field, validation, media upload, review + confirm, success animation | W1, W4 | 26 |
| **W8** | Search — schools list, Leaflet map with the design's animated fly/pan, filter overlay, sort, agents tab, saved preferences | W1, W4 | 24 |
| **W9** | Notifications + settings — feed, preference controls (**including the pre-existing SMS opt-out persistence defect**), account, language, push | W1, W4 | 24 |
| **W10** | Auth + landing — sign-in, sign-up, forgot/reset, 404, loading skeletons, and every landing section | W1 | 24 |
| **W11** | Sweep — full UI sweep at 375 + 1280, axe on every page, motion + reduced-motion audit, API security per endpoint, final regression | all | 20 |

Waves overlap where the DAG allows; readiness is derived from `depends_on` in `.qa/STATE.json`,
never from this table's order. **W2 has no dependency on W0/W1** and is sequenced first in
practice because the dashboard cannot be verified without it.

## Execution discipline

- **Concurrency 1** (operator parameter). One task in flight: a BUILD pass, then an INDEPENDENT
  VERIFY pass by a different agent that never built it. The builder never passes its own task.
- Commit per wave on `main`, task-referenced. Never branch, never revert, never rewrite history.
- After every wave, a fresh CRITIC agent asks what is missing / faked / stubbed / unpersisted /
  off-contract across the whole delivered surface, and its findings become new tasks. The quality
  loop terminates only when the critic AND the banned-pattern grep both come back empty **twice
  consecutively**.
- Fresh session every ~6 waves; `.qa/HANDOFF.md` carries the resume state.

## Definition of done (per task)

Contract conformance on the success path AND every error/auth/ownership path; a real row read or
written in the real Postgres that survives a reload; a passing Playwright run against the running
app; motion present with a `prefers-reduced-motion` variant; correct at 375px and 1280px; zero
axe serious/critical violations on the touched surface; all six locale catalogs key-identical;
`pnpm tsc --noEmit` + `pnpm lint` clean; zero banned-pattern grep hits in the diff.

## Regression baseline (recorded before any edit)

`pnpm exec playwright test` at 2026-07-22 ~20:55 — **157 passed / 1 failed / 2 skipped / 2 did not
run** of 162. The single red is pre-existing and owned by W9:
`notification-preference-controls.spec.ts:75` — after writing both opt-outs off and reloading, the
"Text messages" switch still reports `aria-checked="true"`. Any additional red at any point in
this mission is a regression this mission caused, and is a stop-and-fix.
