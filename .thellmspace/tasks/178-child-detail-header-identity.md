---
id: 178
title: Build the child detail header — back link, 60px navy avatar, name and meta line
layer: ui
kind: build
slice: DetailHeader identity half: "← My children", the inverted avatar, the 28px name and the real meta line.
target: src/modules/children/components/ChildProfileHeader.tsx, src/i18n/messages/*.json
contract: C-PARENT-CHILD-PROGRESS (student projection)
design: .qa/design/screens/portal--child-detail.html (L4-11) · .qa/design/spec/02-portal-children.md §B.1
status: TODO
depends_on: ["177"]
---

## Objective

Ship the design's identity row exactly, with a meta line built only from fields the parent-safe
student projection actually carries.

## Contract

`C-PARENT-CHILD-PROGRESS` `data.student` = `{ documentId, given_name, family_name, year_level,
nationality, current_year_level, target_entry_year, target_entry_term, status, createdAt, updatedAt }`
— "all scalar profile fields except `documentId`/`status`/timestamps **may be null**; no passport,
guardian, parent, user, teacher, class, or numeric id". There is **no school relation and no home
language field**, so the design's `{{kid.meta}} · Home language {{kid.homeLang}}` cannot be rendered
in full; the meta line uses year level, nationality and target entry, omitting each null.

## Design source

`portal--child-detail.html`:
- Back link (L5): 13.5px / 500 / `#7C8698` → `text-body-sm font-medium text-portal-muted`;
  hover `color:#2563EB` (`hover:text-primary`); copy `← My children` with the literal arrow.
  Wired to `<Link href="/dashboard/children">` (never a `<span onClick>`).
- Identity row (L6): `flex items-center gap-[18px] mt-3.5 flex-wrap` (18px gap → W0 token or `gap-4`).
- Avatar (L7): 60px (`size-15`), `rounded-full`, `background:#0E2350` (`bg-navy-900`), `color:#fff`,
  `grid place-items-center`, `font-weight:600`, 21px, `flex-none`. **Inverted vs the list card**
  (navy fill / white glyph, 60px not 52px) — do not reuse the list avatar's tint.
- Text stack (L8): `flex-1 min-w-50` (200px).
- `h1` (L9): 28px / 500 / `-0.02em` / `#0E2350` — the 28px step is the W0 `--text-portal-title`
  token (1.75rem); Tailwind's stock `text-3xl` is 30px and must not be silently substituted.
- Meta (L10): 14px / `#7C8698` / `mt-0.75` → `text-sm text-portal-muted`.

## Files

- `ChildProfileHeader.tsx` — rewritten to the slice.
- Catalogs: `Children.backToList` already exists (`Back to my children`) — reuse it for the link's
  accessible name; add `Children.detailMeta` only if a joiner string is needed.

## Depends on

- `177` — the stack that hosts the header.

## Steps

1. `<h1>` is the page's only `h1` and its text is the composed display name from
   `getStudentDisplayName` (mononym-safe) — `children-profile.spec.ts` asserts
   `heading level 1 name 'Mia Keller'`; keep that true.
2. Avatar content from `getStudentInitials`. The design's one-vs-two-letter rule is an explicit
   UNKNOWN in `.qa/design/spec/02-portal-children.md §UNKNOWNS`; the existing mononym-safe helper wins
   and the choice is recorded in Evidence.
3. Meta line: `Year {n}` (from `current_year_level` else `year_level`), `nationality`,
   `Target entry {term} {year}` — each part omitted when null, joined with ` · `. When every part is
   null render `Children.heroNoDetails` (already in all six catalogs).
4. Back link keeps the visible focus ring and a >=44px target via the existing `after:` inset pattern.

## Project rules

- `.claude/rules/quality.md` — one `<h1>`, visible focus, no `<div onClick>`, alt/aria on the avatar
  (`aria-hidden` since the name is adjacent).
- `.claude/rules/tailwind.md` — no arbitrary values; 28px comes from a `@theme` size token.
- `.claude/rules/i18n.md` — six catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `h1` equals the child's real name from the live response; the meta line contains only
  values present in that response (assert each fragment against the parsed body, and assert the
  absence of any school or home-language text).
- Back link navigates to `/dashboard/children` and is keyboard-reachable with a visible ring.
- Motion: back-link colour transition 200ms `ease-out-quart`; header enters with `st-fade-in` 180ms;
  reduced-motion inert.
- 375px: avatar + name stack on one row, meta wraps, no h-scroll. 1280px: matches the slice.
- axe zero serious/critical; `children-profile.spec.ts` (name + mobile tests) green.

## Assumptions

`--text-portal-title` (1.75rem) is emitted by W0; if W0 chose the normalised spacing/type option, the
nearest existing step is used and the drift is recorded, never a bracket value.

## Evidence

<!-- filled in as the task runs -->
