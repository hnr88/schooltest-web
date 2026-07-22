---
id: 322
title: UI sweep the children list and child detail — archive/unarchive/pagination/tabs at 375 and 1280
layer: ui
kind: verify
slice: `/[locale]/dashboard/children` and `/[locale]/dashboard/children/[documentId]`
target: src/modules/children/** (ChildrenScreen, ChildProfileScreen and their components), new spec tests/e2e/sweep-children.spec.ts
contract: C-CHILD-RESULT-HISTORY, C-PARENT-RESULT-VIEW, C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--my-children-list.html, .qa/design/screens/portal--child-detail.html, .qa/design/spec/02-portal-children.md
status: TODO
depends_on: ["320"]
---

## Objective

Sweep every interactive control on the children list and the child detail page at 375px and
1280px — including the two controls that **write** (archive / unarchive) — and prove the
BLOCKED metrics **B-3, B-4, B-5, B-6** are absent rather than invented.

## Contract

**C-CHILD-RESULT-HISTORY — `GET /api/my/students/:documentId/results`** (`.qa/CONTRACTS.md`):

- Auth: parent JWT; grant → `parent`. Ownership: unknown/foreign child ⇒ **404** (never 403).
- Query (all optional, strictly validated, unknown key ⇒ `400`): `page` int ≥1 default `1`;
  `pageSize` int 1..50 default `10` (>50 ⇒ `400 ValidationError`);
  `skill` ∈ `reading|listening|speaking|writing`.
- Success `200 { data: [ { documentId, scope, skill|null, displayLabel|null, cefrBand|null,
  acaraPhase|null, readiness|null, lowConfidence, effortValid, status, publishedAt|null,
  createdAt, previousResultDocumentId|null, sessionDocumentId|null } ],
  meta: { pagination: { page, pageSize, pageCount, total } } }`.
- Scope: `destination='official'` ONLY. Sort `published_at_field:desc, createdAt:desc`.
- Errors: `400` bad/unknown query · `401` no JWT · `403` non-parent role · `404` unknown or
  foreign child. Persistence effect: none.

**C-PARENT-RESULT-VIEW — `GET /api/results/:documentId` (parent branch)** — the Skills section's
per-attribute source; ownership violation or `destination='transient'` ⇒ **404**, never 403.

**Existing writes preserved (`.qa/intake/api-inventory.md` §6&7):**
`POST /api/students/:documentId/archive` and `POST /api/students/:documentId/unarchive` —
parent-only grants, `loadOwnedStudent` (404 missing / 403 `"You do not own this student"`),
idempotent (`setStudentStatus` writes only when the status differs), success
`200 { data: { …row…, parent: { documentId } }, meta: {} }`. **DB effect: `students.status`
flips to `archived` / `active`.**

**BLOCKED, quoted verbatim from `.qa/CONTRACTS.md` § BLOCKED:**

> **B-3** | `last result` `74%` | `portal--my-children-list.html:27` | A single percentage across
> a sitting is a composite score. `DOC0_PLATFORM_PRD_V2.md:25,46` — "no cut scores", "no
> cross-skill composite score anywhere in the system". The slot renders CEFR band + readiness +
> date instead.
>
> **B-4** | `Progress to {next} 68%` | `portal--my-children-list.html:23`,
> `portal--child-detail.html:20` | Requires band-entry thresholds and a CEFR score.
> `DOC0_PLATFORM_PRD_V2.md:193` — "Do not build a CEFR scorer".
>
> **B-5** | `Avg. score 86%`, `Trend +4%`, `Of grade Top 15%` | `app--child-profile.html:29-31` |
> Composite + cohort percentile. No cohort/percentile data is parent-reachable.
>
> **B-6** | Subject bars Math/Danish/English, class average, letter grade | These slices are a
> generic school-test composition, not SchoolTest's domain.

## Design source

`.qa/design/screens/portal--my-children-list.html` + `portal--child-detail.html`, digested in
`.qa/design/spec/02-portal-children.md`:

- Child row card: base shell `background:#FFFFFF; border:1px solid #E3E8F0` → `--color-border`;
  `border-radius:16px` → `--radius-panel`; `padding:22px`;
  `box-shadow:0 1px 2px rgba(14,35,80,.05)` → `--shadow-sm`.
- `day streak` and `Level {band}` come from C-DASH-HOUSEHOLD `children[].practiceDayStreak`
  and `children[].cefrBand`.
- Row hover: `background:#F8FAFD`, `transition: background .12s` → authored at
  `var(--duration-fast, 150ms) var(--ease-out-quart)`.
- Tabs (`05-ds-components.md:246`): tab button `padding:0 2px 12px; font-size:14px;
  font-weight:600; border-bottom:2px solid; margin-bottom:-1px; transition: color .15s`;
  active border `--color-primary`, inactive `transparent`.
- Focus ring authored from `--color-ring: oklch(0.5461 0.2152 262.88 / 0.35)` —
  `outline: 2px solid var(--color-ring); outline-offset: 2px`.
- Motion: list rows enter with `st-fade-in` 180ms `--ease-out-quart` staggered ≤ 6 × 20ms;
  the archive confirm dialog uses `st-fade-in` (scrim, 180ms) + `st-pop-in` (panel, 180ms,
  `scale(.96) → 1`); all with a `prefers-reduced-motion: reduce` variant at `0.01ms`.

## Files

- `tests/e2e/sweep-children.spec.ts` (new)
- Fix-in-place authority: `src/modules/children/components/**`,
  `src/modules/children/hooks/**`, `src/modules/children/lib/**`,
  `src/modules/children/queries/**`, `src/app/[locale]/dashboard/children/**`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` if a string is missing
- Never `src/components/ui/**`

## Depends on

- **320** — the shell wraps both routes.
- Wave gate (prose): **all of W6 (Children, ids 165-194)** must be DONE; C-CHILD-RESULT-HISTORY
  and C-PARENT-RESULT-VIEW come from **W2 (060-081)** via **W3 (090-105)**.

## Steps

1. Log in with `loginAsParent`; go to `/dashboard/children` at 1280×800. Capture the real
   `GET /api/my/students` response and assert the rendered roster length equals
   `meta.pagination.total` (default filter excludes `archived`).
2. Sweep the list controls: the search/filter field in `ChildrenToolbar`, the "Include archived"
   toggle (assert it re-fires `GET /api/my/students` with
   `filters[status][$in]=active,archived,enrolled` and that the row count grows to the second
   response's `meta.pagination.total`), the sort/pager (`ChildrenRosterPager` — assert page 2
   requests the real `pagination[page]=2` and renders different `documentId`s), every row link,
   and `ChildrenRowActions` (edit / archive / unarchive).
3. **Write proof (archive):** open `ArchiveConfirmDialog` on a known child, confirm, assert
   `POST /api/students/<documentId>/archive` returns `200`, the row disappears from the default
   roster, then **reload the page** and assert it is still absent. Prove the DB row with a
   direct query using `runSql` from `tests/e2e/helpers/auth-db.ts`:
   `select status from students where document_id = '<documentId>'` → `archived`.
4. **Write proof (unarchive):** flip "Include archived" on, unarchive the same child, assert
   `200`, reload, assert the row is back in the default roster and the same SQL reads `active`.
   Leave the fixture in its original state (use `tests/e2e/helpers/student-cleanup.ts`).
5. Error path: intercept the archive POST with `{ status: 403, body: <real ForbiddenError
   envelope, message "You do not own this student"> }`; assert a translated error surface
   (sonner toast or inline Alert), the row does **not** disappear optimistically without
   rollback, and `watchErrors(page)` stays empty.
6. Open a child detail page from a real row. Capture
   `GET /api/my/students/:documentId/results` and assert: rendered result rows === `data.length`;
   the pager reflects `meta.pagination.pageCount`; clicking page 2 sends
   `?page=2&pageSize=<n>` and renders the second page's real rows; a skill filter sends
   `?skill=reading` and every rendered row's skill is `reading`.
7. Live contract negatives from the spec via `request.get` with the real parent JWT:
   `?pageSize=51` → `400 ValidationError`; `?bogus=1` → `400`; a foreign child's
   `documentId` → `404` (never 403); no `Authorization` header → `401`.
8. Sweep the detail controls: every tab in `ChildProfileTabs` (assert `role="tab"`,
   `aria-selected` moves, arrow-key roving, and the panel content changes), each recent-result
   row's deep link (lands on the result view backed by C-PARENT-RESULT-VIEW), the
   archive/unarchive action, and the edit link (lands on
   `/dashboard/children/<documentId>/edit`).
9. **B-3…B-6 refusal proof:** assert count 0 for each of — any `%` rendered as a "last result"
   or "progress to next band" value, `Avg. score`, `Trend`, `Of grade`, `Top 15%`, any subject
   name (`Math`, `Danish`, `English` as a subject bar), any class average, and any letter grade.
   Assert the B-3 slot instead renders the sanctioned trio (CEFR band + readiness + date) read
   from the live response body.
10. Repeat 1-9 at **375×812**: no horizontal scroll, every control ≥44×44, the row grid
    collapses to a stack, the tabs remain operable, the confirm dialog traps focus and closes
    on `Escape` returning focus to its trigger.
11. Motion: measure row-entrance and dialog animation durations (150-200ms) and re-measure
    under `reducedMotion: 'reduce'` (`<= 0.02s`), with the end state intact.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 9, 11, 12, 14; §5 pitfalls 6, 10, 11, 17.
- `.claude/rules/module-pattern.md` — `useQuery`/`useMutation` only in `queries/`; hooks in
  `hooks/`; pure helpers in `lib/`; 200/120-line caps.
- `.claude/rules/state-data.md` — always invalidate or `setQueryData` after a successful
  mutation (the archive/unarchive round-trip must refresh the roster query, not mutate local
  state only).
- `.claude/rules/tailwind.md`, `.claude/rules/quality.md`, `.claude/rules/i18n.md`,
  `.claude/rules/testing.md`, D-VERIFY-1.
- `.qa/CONTRACTS.md` B-3/B-4/B-5/B-6 — binding refusals.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sweep-children.spec.ts` passes at 375×812 and 1280×800.
- Archive **and** unarchive each proven by: a real `200`, a visible list change, a page reload
  that keeps the change, and a direct `students.status` SQL read via
  `tests/e2e/helpers/auth-db.ts`. The fixture is restored at the end of the run.
- Pagination and the `skill` filter proven against real request query strings and real response
  bodies; `?pageSize=51`, `?bogus=1`, foreign id and no-JWT negatives all proven live.
- B-3/B-4/B-5/B-6 refusals asserted with count-0 locators; the B-3 slot renders the sanctioned
  CEFR band + readiness + date from the live body.
- Error path asserted with no lost rollback and `watchErrors(page)` empty.
- No horizontal scroll at 375; every control ≥44×44; dialog traps focus, `Escape` closes and
  restores focus.
- Motion 150-200ms measured, and `<= 0.02s` under `reducedMotion: 'reduce'`.
- All six locale catalogs key-identical if any string changed.
- Zero banned-pattern grep hits in the diff.

## Assumptions

- The seeded parent's two children (Mia, Jonas per `tests/e2e/students-list.spec.ts`) exist and
  at least one has ≥1 official result. If no child has an official result, the sweep asserts the
  honest empty state for the results list instead of skipping.

## Evidence

<!-- filled in as the task runs -->
