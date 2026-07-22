---
id: 321
title: UI sweep /dashboard — every hero/chart/child-row/note control at 375 and 1280, plus the B-1/B-2 refusal
layer: ui
kind: verify
slice: The parent dashboard route `/[locale]/dashboard` and every control on it
target: src/modules/dashboard/** (DashboardScreen and its children), src/app/[locale]/dashboard/page.tsx, new spec tests/e2e/sweep-dashboard.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html, .qa/design/spec/01-portal-dashboard.md#10-metric-inventory, .qa/design/spec/05-ds-components.md#dashboard-tiles
status: TODO
depends_on: ["320"]
---

## Objective

Sweep every interactive control on `/dashboard` at 375px and 1280px, prove each one fires the
right endpoint against the real API and renders the real response, and prove that the two
BLOCKED design metrics (**B-1** `coming up`, **B-2** the "Coming up" list) are **absent** rather
than faked. The dashboard is the mission's headline surface — its metrics are a hard requirement
(D-SCOPE-1 §3) and its invented metrics are a hard refusal (D-SCOPE-1 §4).

## Contract

**C-DASH-HOUSEHOLD — `GET /api/my/progress`** (`.qa/CONTRACTS.md`):

- Auth: parent JWT required; grant `parent-dashboard.getHouseholdProgress` → `parent` only.
- Request: no path params; **no query key is accepted** — any query parameter ⇒
  `400 ValidationError 'household progress does not accept query parameters'`.
- Success `200`:
  `data.household = { childCount, testsCompleted, testsCompletedThisWeek, resultsPublished,
  practiceSecondsThisWeek, practiceByDay[7] ({date, weekday, seconds}, oldest→newest),
  strongestDay ({date, weekday, seconds} | null when every day is 0) }`;
  `data.children[] = { documentId, givenName, familyName|null, yearLevel|null, status,
  testsCompleted, practiceSecondsThisWeek, practiceDayStreak, lastActivityAt|null,
  focusSkill|null, skills[] }`. **Per AMENDMENT A1 (`.qa/CONTRACTS.md`), there is no per-child
  `cefrBand`/`cefrStageIndex`/`acaraPhase` — those are DELETED (cross-skill composite, BLOCKED
  **B-9**). A band exists only inside each `skills[]` entry, which always has four entries (one per
  skill), padded with `readiness: "not_assessed"` when a skill has no official result.**
- Errors: `400 ValidationError` (any query param) · `401 UnauthorizedError` (absent/invalid JWT)
  · `403 ForbiddenError 'Only parents can view household progress'` (non-parent role).
- Persistence effect: **none** — read-only over `students`, `students_parent_lnk`, `sessions`,
  `results`.
- `CEFR_LADDER` is exactly `["pre_A1","A1","A2","B1","B2","C1"]`. The design draws six ticks
  labelled `A1 A2 B1 B2 C1 C2`; `C2` does not exist and `pre_A1` does. The UI renders the **real**
  ladder with the design's tick visual.

**BLOCKED, quoted verbatim from `.qa/CONTRACTS.md` § BLOCKED:**

> **B-1** | `coming up` hero stat (`2`) | `portal--main.html:34` | No scheduling model exists
> anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class`
> is only `{name, year_band, teacher, students}`. Nothing to count.
>
> **B-2** | "Coming up" list (3 dated rows) | `portal--main.html:120-140` | Same as B-1.

## Design source

`.qa/design/screens/portal--main.html` + `.qa/design/spec/01-portal-dashboard.md`:

- Page background `#EEF1F6` → `--color-surface-well`; `<main>` is `flex:1` inside the
  `gap:24px; padding:24px` frame.
- Navy hero panel: `#0E2350` → `--color-navy-900`; eyebrow `THIS WEEK` at `#8FA3C7` →
  `--color-navy-label`; the `on track for B2` underline is `2px` `#2DD4BF` → `--color-accent`
  (a dark-mode token used in light mode — recorded, not silently swapped).
- Hero stats (metric inventory rows #1, #3): `tests completed` = integer from
  `household.testsCompletedThisWeek`; `practice this week` = `{H}h {MM}m` formatted from
  `household.practiceSecondsThisWeek`.
- Practice-minutes chart (row #4): exactly 7 bars, one per `household.practiceByDay[]` entry,
  oldest→newest, weekday letter beneath; inactive bars `#E4E9F2` → `--color-rule`, the argmax
  bar navy `--color-navy-900`. Caption (row #5) names `strongestDay.weekday` + its minutes.
- "My children" rows (rows #6, #7): **one CEFR tick rail per skill** (four per child, AMENDMENT
  A1 — not one per child) + `Focus: {skill}` pill on `#EEF3FE` → `--color-brand-50` with
  `#2563EB` → `--color-primary` text. No per-child `Level {band}` pill (BLOCKED **B-9**).
- Base card shell (`05-ds-components.md#1.0`): `background:#FFFFFF; border:1px solid #E3E8F0`
  → `--color-border`; `border-radius:16px` → `--radius-panel`; `padding:22px`;
  `box-shadow:0 1px 2px rgba(14,35,80,.05)` → `--shadow-sm`.
- Motion: card entrance `st-fade-in` 180ms `--ease-out-quart`; bar-height reveal is a
  `transform: scaleY()` (never `height` — `.claude/rules/tailwind.md:19`), 180ms, staggered
  ≤ 7 × 20ms; hover on a child row transitions `background` 150ms. All wrapped in
  `@media (prefers-reduced-motion: reduce)` collapsing to `0.01ms` with the end state intact.

## Files

- `tests/e2e/sweep-dashboard.spec.ts` (new)
- Fix-in-place authority: `src/modules/dashboard/components/**`,
  `src/modules/dashboard/lib/dashboard-overview.ts`, `src/modules/dashboard/queries/**`,
  `src/app/[locale]/dashboard/page.tsx`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` if a string is missing
- Never `src/components/ui/**`

## Depends on

- **320** — the shell wraps this route; a shell defect would be re-reported here.
- Wave gate (prose): **all of W5 (Dashboard, ids 130-159)** and **W3 (typed client, 090-105)**
  must be DONE.

## Steps

1. Log in with `loginAsParent`. At 1280×800 wait for `**/api/my/progress` and capture the real
   response body; assert `status() === 200`.
2. Assert every rendered hero number equals the value derived from that captured body — never a
   literal. `tests completed` === `data.household.testsCompletedThisWeek`;
   `practice this week` === the `{H}h {MM}m` formatting of
   `data.household.practiceSecondsThisWeek`.
3. Assert the chart renders exactly `data.household.practiceByDay.length === 7` bars in the
   body's order, and that the highlighted bar's index equals the index of
   `data.household.strongestDay.date` within `practiceByDay` (or that no bar is highlighted
   when `strongestDay` is `null`).
4. Assert each child row renders **four** CEFR tick rails (one per skill, `SKILL_ORDER`), each with
   exactly **six** ticks labelled `pre_A1 A1 A2 B1 B2 C1` — and assert `page.getByText('C2')` has
   count 0 anywhere on the page. Assert no child row renders a single per-child `Level {band}` pill
   (BLOCKED **B-9**, AMENDMENT A1) — `page.getByText(/^Level /)` count 0.
5. **B-1 / B-2 refusal proof:** assert `page.getByText(/coming up/i)` has count 0 and that no
   element renders a scheduled/dated upcoming row; assert the page body text contains no
   standalone `2` presented as a "coming up" stat. Record the refusal in the spec's own comment
   citing `.qa/CONTRACTS.md` B-1/B-2 so a future reader sees why the slot is empty.
6. Sweep every interactive control: each "My children" row link (lands on
   `/dashboard/children/<documentId>` where `documentId` comes from the captured body), the
   `Focus:` pill if interactive, every "See details →" link, the teacher-note action, the
   recommended-card actions, and the chart's day cells if focusable. For each: visible, enabled,
   keyboard reachable, `:focus-visible` outline colour non-transparent, and the activation
   lands on the contracted URL.
7. Error path: intercept `**/api/my/progress` with `{ status: 500 }` and assert the screen shows
   the translated error state with a working retry that re-fires the request and recovers on a
   real 200. Then intercept with `{ status: 403, body: <the real ForbiddenError envelope> }` and
   assert the screen does not leak the raw Strapi message.
8. Contract-negative proof against the live API: from the spec, issue
   `GET /api/my/progress?foo=1` with the real parent JWT via `request.get` and assert `400`
   with `error.name === 'ValidationError'`; and with no `Authorization` header assert `401`.
9. Repeat 2-7 at **375×812**: assert the hero stacks (no horizontal scroll — `document.
   documentElement.scrollWidth <= 375 + 1`), the 7 bars remain 7 and stay inside the viewport,
   and every control is still reachable and ≥44×44.
10. Motion: measure `transition-duration` / `animation-duration` on the card entrance and the
    child-row hover (must be 150-200ms), then re-measure under
    `page.emulateMedia({ reducedMotion: 'reduce' })` (must be `<= 0.02s`) with the end state
    still correct (opacity 1, `scaleY(1)`).

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 9, 11, 12, 14; §5 pitfalls 10, 11, 17.
- `.claude/rules/state-data.md` — `useQuery` only inside `queries/use-x.query.ts`; array query
  keys starting with the resource name; never `import axios` in a component.
- `.claude/rules/tailwind.md` — animate transform/opacity only (the bar reveal is `scaleY`,
  never `height`), no arbitrary values, OKLCH only.
- `.claude/rules/quality.md` — one `<h1>`, ordered headings, visible focus, `next/image` for
  every image.
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`, D-VERIFY-1.
- `.qa/CONTRACTS.md` B-1/B-2 — the refusal is binding; no placeholder number, ever.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sweep-dashboard.spec.ts` passes at both 375×812 and
  1280×800 against the running app.
- Every rendered metric is asserted **equal to a value read out of the live
  `GET /api/my/progress` response body** in the same test run — zero literal expectations.
- Live contract negatives proven in-run: `?foo=1` → `400 ValidationError`; no JWT → `401`.
- B-1/B-2 refusal asserted: zero "coming up" stat, zero upcoming-list rows, zero `C2` tick.
- Error path asserted for 500 and 403, with recovery on retry, and `watchErrors(page)` empty.
- No horizontal scroll at 375; every control ≥44×44 at 375.
- Motion measured 150-200ms in the real DOM and `<= 0.02s` under `reducedMotion: 'reduce'`.
- Zero axe serious/critical introduced (task 327 owns the page-level axe gate).
- All six locale catalogs key-identical if any string changed.
- Zero banned-pattern grep hits in the diff; no hardcoded array standing in for
  `data.children` or `data.household.practiceByDay`.

## Assumptions

- The seeded parent has at least one child with at least one complete session, so
  `practiceByDay` is not uniformly zero. If it is, the test asserts the honest zero-state
  (`strongestDay === null`, no highlighted bar) rather than skipping.

## Evidence

<!-- filled in as the task runs -->
