---
id: 145
title: Build the "My children" row — avatar, name block, chevron, whole-row link to the child
layer: ui
kind: implement
slice: One child row in the dashboard's "My children" list (design §5 row children 1, 2, 5)
target: src/modules/dashboard/components/DashboardChildRow.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:65-71,81 · .qa/design/spec/01-portal-dashboard.md#5
status: TODO
depends_on: ["144", "130"]
---

## Objective
The row skeleton every child gets: initial avatar, name + meta, and a chevron, with the whole row a
real link to that child's detail page. The CEFR strip (146) and focus pill (147) slot between the
name block and the chevron.

## Contract
`C-DASH-HOUSEHOLD` → `children[]`: `documentId`, `givenName`, `familyName|null`, `yearLevel|null`,
`status` (`active | archived | enrolled`).

Ownership is server-side; the client renders whatever `children[]` contains. `familyName` is
nullable because mononyms exist — the name and initial must both be mononym-safe.

## Design source
- Row (`portal--main.html:66`): `display:flex; align-items:center; gap:20px; padding:20px 0;
  border-bottom:1px solid {{ dk.divider }}; cursor:pointer` where
  `dk.divider = i === last ? 'transparent' : '#EEF1F6'`
  → `flex items-center gap-5 border-b border-divider py-5 last:border-b-0`.
  `gap-5` = 20px ✓, `py-5` = 20px ✓, `--color-divider` = `oklch(0.9595 0.008 253.8534)` (`#EEF2F7`;
  design `#EEF1F6`, sanctioned nearest). `last:border-b-0` replaces the transparent-divider hack.
- Whole row is clickable (`Parent Portal.dc.html:971` → `view:'detail', kidIdx:i`). Implement as a
  locale-aware `<Link href={\`/dashboard/children/${documentId}\`}>` **as the row element itself** —
  never a `div` with `onClick` (`.claude/rules/quality.md`), never a nested interactive element
  inside the link. `data-slot="dashboard-child-row"` + `data-child-id={documentId}`.
- Avatar (`:67`): `44×44; border-radius:999px; background:#EEF1F6; color:#0E2350; display:grid;
  place-items:center; font-weight:600; font-size:15px; flex:none`
  → `grid size-11 shrink-0 place-items-center rounded-full bg-surface-well text-button
  font-semibold text-navy-900`.
  `size-11` = 2.75rem = 44px ✓ exact; `--text-button` = 0.9375rem (15px) ✓ exact;
  `--color-surface-well` = `oklch(0.9595 0.008 253.8534)` (design `#EEF1F6`).
  Content = the child's initial. **Reuse `getStudentInitials()` from `@/lib/student-name.ts`** —
  it is already the single mononym-safe place a student's initials are composed. Do not write a
  second initials helper. Render only the FIRST character to match the design's single-letter `E`.
  Avatar is `aria-hidden` — the name is right next to it.
- Name block (`:68`): `width:190px; flex:none; min-width:0` → `w-48 min-w-0 shrink-0`
  (`w-48` = 12rem = 192px, 2px delta).
  - name — `15px / 600 / #0E2350` → `truncate text-button font-semibold text-navy-900`.
    Value = `getStudentDisplayName()` from `@/lib/student-name.ts` (mononym-safe), fed
    `{ given_name: givenName, family_name: familyName }`.
  - meta — `12.5px / #7C8698 / margin-top:2px` → `mt-0.5 truncate text-meta text-muted-foreground`.
    Design copy is `Year 7 · Riverside College, Parramatta`. **The school half is not rendered**:
    `.qa/intake/api-inventory.md` **G11 — No class / teacher context for a child** ("`student.class`
    and `student.teacher` relations exist … but no [parent-reachable endpoint returns them]"), and
    `C-DASH-HOUSEHOLD` carries no school field. Shipped meta:
    `yearLevel !== null` ⇒ `Dashboard.children.yearLevel` = `"Year {level}"`;
    `yearLevel === null` ⇒ `Dashboard.children.yearLevelUnknown` = `"Year level not set"`.
    When `status === 'enrolled'` append `" · "` + `Dashboard.children.statusEnrolled` through a
    single ICU message, not string concatenation.
- Chevron (`:81`): SVG `16×16`, `stroke:#9AA6B8`, `stroke-width:2`, path `m9 18 6-6-6-6`
  → lucide-react `ChevronRight` `className="size-4 shrink-0 text-slate-400"` (lucide's default
  stroke-width is 2 ✓, and its path is exactly `m9 18 6-6-6-6`). `aria-hidden`.
- Row order: which children and in what order — render `children[]` **in the response order**
  (`C-DASH-HOUSEHOLD` returns a deterministic server-side order). Do not re-sort client-side; do not
  cap the list on the dashboard (the design shows 2 because the example family has 2).
- Motion: `transition-colors duration-150 ease-out-expo motion-reduce:transition-none` +
  `hover:bg-surface-well/60`. The design declares no hover on the row (spec §5: "No hover, focus,
  selected or disabled state is declared on the row") — this is an authored addition required by
  `.claude/rules/quality.md`; focus states are 149's.
- 375px: the fixed `w-48` name column is wrong at 375px — see 157, which reflows the row to a
  two-line stack. This task must leave the name block `min-w-0 truncate` so the reflow is possible.

## Files
- CREATE `src/modules/dashboard/components/DashboardChildRow.tsx` (≤120 lines).
- EDIT `DashboardChildrenPanel` — map `children[]` to rows.
- i18n: `Dashboard.children.yearLevel`, `.yearLevelUnknown`, `.statusEnrolled`, `.openChild`
  (the link's accessible name: `"Open {name}'s progress"` — the visible row text is a name plus
  data, so the link needs an explicit name).

## Depends on
- **144** (the list card), **130** (household data).

## Steps
1. Row as a `<Link>`, avatar + name block + chevron, slots for 146/147.
2. Wire `getStudentDisplayName` / `getStudentInitials` from `@/lib/student-name`.
3. Six-catalog keys.

## Project rules
- `.claude/rules/quality.md` — never `<div onClick>`; no nested interactive inside a link; alt/aria
  on decorative glyphs.
- `.claude/rules/module-pattern.md` — no logic in the component; the name/initials helpers already
  exist in `src/lib/`.
- `.claude/rules/i18n.md` — one ICU message per sentence; locale-aware `Link`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright against live data: `[data-slot="dashboard-child-row"]` count equals
  `GET /api/my/progress` `data.children.length`; the nth row's `data-child-id` equals the nth
  `documentId`; its `href` is `/dashboard/children/<that documentId>`.
- Persistence: click the first row ⇒ `/dashboard/children/<id>` renders the real child profile
  (`useChildProgressQuery` fires, 200); go back and reload ⇒ same `href` (the existing
  `dashboard.spec.ts` reload assertion, preserved).
- Postgres cross-check: the rendered names match `select given_name, family_name from students`
  for the seeded parent's rows on `127.0.0.1:5540`.
- Mononym: stub a child with `familyName: null` ⇒ the name renders with no trailing space and the
  avatar shows one letter.
- `yearLevel: null` stub ⇒ meta renders `Dashboard.children.yearLevelUnknown`, never "Year null".
- `grep -rniE "Riverside|Parramatta|Oakwood|Strathfield" src/modules/dashboard` returns nothing.
- Hover changes the row background; with `reducedMotion: 'reduce'` `transition-duration` is `0s`.
- axe clean (no nested-interactive, no link-name violations); six catalogs key-identical.

## Assumptions
- `children[]` includes archived children only if the API returns them; the client does not filter.
  If archived children appear and should not, that is a `C-DASH-HOUSEHOLD` question, not a UI patch.

## Evidence
<filled in as the task runs>
