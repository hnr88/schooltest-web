---
id: 134
title: Render the hero headline sentence from real household data — no projection, no percentage
layer: ui
kind: implement
slice: Design metric #8 (hero headline claims), rebuilt honestly
target: src/modules/dashboard/components/DashboardHeroHeadline.tsx, src/modules/dashboard/lib/hero-headline.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:30 · .qa/design/spec/01-portal-dashboard.md#3 #10 (row 8)
status: TODO
depends_on: ["133", "130"]
---

## Objective
The 24px sentence in the navy panel. The design's literal copy makes two claims that this system
cannot make; this task ships the same visual sentence built ONLY from `C-DASH-HOUSEHOLD` fields.

## Contract
`C-DASH-HOUSEHOLD` fields consumed: `children[].givenName`, `children[].cefrBand`,
`children[].focusSkill`, `children[].lastActivityAt`, `household.childCount`.

**What is refused and why.** The design copy is
> Emma is **on track for B2** and Lucas improved reading by 9% since May.

- "on track for B2" is a *projected* CEFR level. `.qa/CONTRACTS.md` governing rules:
  "No composite scores … `DOC0_PLATFORM_PRD_V2.md:25,46,193` forbid cut scores, cross-skill
  composites and any computed CEFR score", and B-4 quotes `:193` — "Do not build a CEFR scorer.
  CEFR is a Crosswalk lookup, not a scale." A projection is a scorer. Not rendered.
- "improved reading by 9% since May" is a per-skill percentage delta against a baseline month.
  `C-DASH-HOUSEHOLD` returns no percentage and no historical baseline; B-3 bans the sibling metric
  for the same reason. Not rendered.

## Design source
- Sentence node (`portal--main.html:30`): `font-size:24px; font-weight:500; line-height:1.35;
  letter-spacing:-0.01em; margin-top:14px; max-width:420px; position:relative`
  → `relative mt-3.5 max-w-105 text-h3 font-medium text-primary-foreground`.
  `--text-h3` = 1.5rem (24px) ✓ exact (its line-height is 1.3 vs the design's 1.35 — accepted);
  `mt-3.5` = 14px ✓; `max-w-105` = 26.25rem = 420px ✓.
  Text colour is the panel's inherited white; use `--color-primary-foreground`
  (`oklch(1 0 89.8756)`) via `text-primary-foreground` — do not write `text-white`.
- Emphasis span: `font-weight:700; border-bottom:2px solid #2DD4BF` →
  `font-bold border-b-2 border-accent-on-dark`.
  `--color-accent-on-dark` = `oklch(0.7845 0.1325 181.912)` (`#2DD4BF`) ✓ exact existing token,
  documented in globals.css as 8.21:1 on `#0E2350`.
- **Copy rules** (i18n, `t.rich` so the emphasis span is markup not a string split):
  1. `childCount === 0` → `Dashboard.hero.headlineNoChildren`:
     "Add a child to start following their progress." No emphasis span.
  2. else pick the *focus child* = the child with the greatest `lastActivityAt` (nulls last; tie →
     first in the response order, which is deterministic server-side).
  3. focus child has `cefrBand` → `Dashboard.hero.headlineBand`:
     `"{name}'s latest official result places them at <b>{band}</b>."` — `<b>` is the emphasis span.
     `{band}` is the raw enum rendered through the shared band label map
     (`pre_A1` → "pre-A1", the rest verbatim). Never a projected next band.
  4. focus child has no `cefrBand` → `Dashboard.hero.headlineNoResults`:
     "{name} has no published results yet — the first one will appear here." No emphasis span.
  5. If a SECOND child exists with a non-null `focusSkill`, append
     `Dashboard.hero.headlineFocusClause`: " {name} is working on {skill} next." Skill label comes
     from the shared `Dashboard.skill.reading|listening|speaking|writing` keys.
- Motion: none of its own. 156 owns the entrance; the sentence must not animate its text.

## Files
- CREATE `src/modules/dashboard/lib/hero-headline.ts` — pure selector:
  `selectHeroHeadline(household, children): { key, values }`. Fully unit-testable, no JSX.
- CREATE `src/modules/dashboard/components/DashboardHeroHeadline.tsx` — dumb, renders `t.rich`.
- CREATE `src/modules/dashboard/constants/cefr.constants.ts` — `CEFR_LADDER = ['pre_A1','A1','A2',
  'B1','B2','C1'] as const` (the API enum, per C-DASH-HOUSEHOLD). Shared with 146.
- i18n: the four headline keys + the clause + `Dashboard.cefr.pre_A1|A1|A2|B1|B2|C1` +
  `Dashboard.skill.*`.

## Depends on
- **133** — the panel it sits in. **130** — the household state.

## Steps
1. `CEFR_LADDER` constant + band label keys.
2. `selectHeroHeadline` with the five branches above; unit tests for each branch.
3. Component renders `t.rich(key, { b: (c) => <span className="border-b-2 border-accent-on-dark
   font-bold">{c}</span>, ...values })`.

## Project rules
- `.claude/rules/i18n.md` — ICU through `t.rich`; six catalogs identical; never concatenate
  translated fragments in code.
- `.claude/rules/module-pattern.md` — selection logic in `lib/`, the constant in `constants/`,
  the component stays dumb.
- `.qa/CONTRACTS.md` governing rules — no composite score, no computed CEFR.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright with the real seeded parent: the hero sentence text equals the sentence rebuilt in the
  test from the live `GET /api/my/progress` body — i.e. the test recomputes the branch from the API
  response and asserts string equality. A hardcoded expected sentence is a fail.
- The emphasised span, when present, has computed `border-bottom-width: 2px` and border colour
  resolving to `oklch(0.7845 0.1325 181.912)`.
- Grep proof of refusal: `grep -rniE "on track for|since May|% ?since|projected" src/modules/dashboard`
  returns nothing.
- Route-stubbed branch coverage: stub `/api/my/progress` with (a) `childCount: 0`, (b) a child with
  `cefrBand: null`, (c) two children where the second has `focusSkill: 'writing'` — assert the
  three distinct sentences.
- `/zh/dashboard` renders the zh sentence with the same emphasis markup. axe clean.
- Six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- `pre_A1` displays as "pre-A1" in every locale's Latin form; translators may localise the prefix.

## Evidence
<filled in as the task runs>
