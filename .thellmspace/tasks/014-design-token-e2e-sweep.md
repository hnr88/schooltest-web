---
id: 014
title: Consolidate the W0 foundation into one table-driven design-token e2e across light, dark, reduced-motion and both viewports
layer: regression
kind: verify
slice: The foundation's proof — every token, keyframe and utility W0 landed, asserted against the running app in one spec, with the tailwind-merge parity guard extended to every new namespace
target: tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--colors.html, ds--typography.html, ds--dark-mode.html · .qa/design/spec/04-ds-foundations.md#TAILWIND-V4-MAPPING
status: TODO
depends_on: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013']
---

## Objective

Tasks 001–013 each extend `tests/e2e/design-tokens.spec.ts` with their own assertions. This slice
turns that accumulation into one maintainable, table-driven contract: a single source list of every
W0 token and its expected value, exercised in light and dark, at 375 and 1280, with and without
`prefers-reduced-motion` — so a later wave that edits a token in `globals.css` gets a red test, not
a silently drifted design.

## Contract

n/a. The assertion table IS the contract; its rows are the tokens 001–013 landed, each with the
design hex or px it came from. `.qa/DECISIONS.md` **D-VERIFY-1** is the standard being met: "A slice
is DONE only when … a real Playwright run against the running app exercises it … and an independent
verifier — never the builder — reproduces that evidence."

## Design source

The spec file already exists and MUST be extended, never duplicated. Its current contents, which
stay intact:

- the `for (const [group, tokens] of Object.entries(THEME_CLASS_GROUPS))` parity loop — after W0 it
  covers `font-size`, `rounded`, `ease`, `tracking`, `shadow`, `max-w` **and the new `animate` group
  from 011**;
- `TOKENS: custom sizes and radii survive cn() in the real DOM` — the ToggleRow 13.5px, ScoreText
  14px and MetricCard 16px assertions, which are the live tailwind-merge regression fence.

What this task adds:

1. **One exported table per namespace**, each row `{ token, expected, source }` where `source` is
   the design hex/px and slice cite. Namespaces: colour (light), colour (dark), interaction states,
   `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--animate-*`, `--container-*`.
2. **A single parameterised test per namespace** that resolves each token on
   `document.documentElement` and compares to `expected` exactly.
3. **A light↔dark round trip**: apply `dark` to `document.documentElement.classList` in-page, assert
   the dark table, remove it, assert the light table returns. The app stays `forcedTheme="light"`
   (003) — assert that a fresh load carries `light` and not `dark`.
4. **A viewport matrix**: every table runs at 1280×720 and 375×812. Colour, radius, shadow, easing
   and animation tokens must be byte-identical at both; only `--text-display` legitimately differs
   (56px vs 36px, per 005) and that difference is asserted, not tolerated.
5. **A reduced-motion pass**: with `page.emulateMedia({ reducedMotion: 'reduce' })` — the four
   `st-*` animation utilities compute `animation-name: none` (011); the skeleton `::after` computes
   `display: none` while the skeleton itself stays visible (012); the `focus-ring` outline is STILL
   painted (013); colour, type, radius and shadow tokens are unchanged (none of them is motion).
6. **A keyframe inventory test**: all six design keyframes — `st-fade-in`, `st-pop-in`,
   `st-toast-in`, `st-spin`, `st-shimmer`, `st-rec-pulse` — exist as `CSSKeyframesRule`s in
   `document.styleSheets`, and **none of them declares a property other than `transform` or
   `opacity`** (walk each rule's `style` and assert the property set) — the machine-checkable form of
   `.claude/rules/tailwind.md:9`.
7. **A provenance test**: read `src/app/globals.css` from disk (the spec already does this for the
   parity loop) and assert every `--color-*`, `--text-*`, `--radius-*`, `--shadow-*` declaration
   added by W0 carries a `/* … */` comment on its line or the line above — D-DESIGN-2's provenance
   requirement, enforced rather than trusted.
8. **A banned-pattern test**: grep `src/**/*.{ts,tsx,css}` and assert zero raw hex colour literals
   outside a CSS comment, and zero square-bracket arbitrary values in any `className` string.

## Files

- `tests/e2e/design-tokens.spec.ts` — the only file this task writes. It is refactored into the
  table form above; the eight blocks 001–013 appended are consolidated into it, not deleted
  wholesale — every assertion those tasks proved must still run.
- No source file is touched. If an assertion fails, the fix belongs to the owning task (001–013),
  which is reopened; this task never "fixes" `globals.css` to make itself pass.

## Depends on

All of **001–013**. Every row of the table is one of their outputs; running earlier would assert
values that do not exist yet.

## Steps

1. Read the current `tests/e2e/design-tokens.spec.ts` in full, plus every block 001–013 appended.
2. Extract the per-namespace tables to module-level `const`s at the top of the file.
3. Rewrite the appended blocks as parameterised tests over those tables, preserving every distinct
   assertion (real-element assertions such as the eyebrow, icon-button focus, dialog panel and
   skeleton `::after` stay as they are — they are not table rows).
4. Add the viewport matrix, the dark round trip, the reduced-motion pass, the keyframe inventory,
   the provenance test and the banned-pattern test.
5. Keep the file under the 200-line project limit by splitting the tables into
   `tests/e2e/helpers/design-tokens.fixtures.ts` if needed — helpers already live in
   `tests/e2e/helpers/`.

## Project rules

- `.claude/rules/testing.md` — Playwright is the proof standard; a unit test does not count.
- **D-VERIFY-1** — the builder of 001–013 must not be the agent that runs this task's verify pass.
- CLAUDE.md law 12 — `pnpm exec playwright test` only; never `pnpm dev`/`build`/`start`.
- `.claude/rules/quality.md` — file size limits apply to test files too; extract fixtures rather
  than growing one 600-line spec.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/design-tokens.spec.ts` green, and the run output records:
  the number of token rows asserted per namespace; the light and dark passes; the 375 and 1280
  passes; the reduced-motion pass.
- The six-keyframe inventory test passes AND its negative form is demonstrated once: temporarily add
  a `background-position` stop to one keyframe, watch the test fail, revert.
- The parity loop covers seven classGroups (`font-size`, `rounded`, `ease`, `tracking`, `shadow`,
  `max-w`, `animate`) with zero unregistered and zero orphaned tokens in any of them.
- The three pre-existing real-DOM assertions (ToggleRow 13.5px, ScoreText 14px, MetricCard 16px)
  still run and still pass.
- The provenance test reports every W0-added declaration as commented.
- The banned-pattern test reports zero hits.
- **Full-suite regression**: `pnpm exec playwright test` matches the PLAN.md baseline — 157 passed
  / 1 failed / 2 skipped / 2 did not run of 162, where the single red is the pre-existing
  `notification-preference-controls.spec.ts:75` SMS opt-out defect owned by W9. Any other red is a
  regression this wave caused and is a stop-and-fix, not a note.
- axe zero serious/critical on `/`, `/design-system` and `/dashboard` at 375 and 1280.
- Six locale catalogs key-identical at 1151 keys (no string changed anywhere in W0).

## Assumptions

- `page.emulateMedia({ reducedMotion: 'reduce' })` is the reduced-motion mechanism; the repo's
  Playwright version (`@playwright/test ^1.61.1`) supports it and the config declares a single
  `chromium` project, so no per-project matrix is needed.
- Applying the `dark` class in-page is the only way to exercise the dark layer while the app remains
  `forcedTheme="light"` (003). If a later wave introduces a real theme control, this test's round
  trip is the thing that must be repointed at it.

## Evidence

<!-- full playwright output for the spec, the token-row counts per namespace, the negative keyframe
     run, the parity summary for all seven groups, the full-suite tally against the baseline, axe
     summaries for three routes × two viewports, catalog key counts -->
