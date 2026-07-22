---
id: 327
title: axe — zero serious/critical on the dashboard shell, /dashboard, children list and child detail
layer: a11y
kind: verify
slice: Automated accessibility gate for the four authenticated pages W4-W6 deliver
target: tests/e2e/axe-dashboard-children.spec.ts (new); markup fixes in src/modules/{shell,dashboard,children,design-system}/**
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#unknowns (no focus states in the export), .qa/design/spec/05-ds-components.md#navigation
status: TODO
depends_on: ["321", "322"]
---

## Objective

Run `@axe-core/playwright` over the dashboard shell, `/dashboard`, `/dashboard/children` and
`/dashboard/children/[documentId]` at 375px and 1280px and require **zero serious and zero
critical violations**. Every violation is fixed in the markup at the module call site — never
suppressed, never filtered out of the results, never turned into an allow-list entry.

## Contract

n/a — pure accessibility gate. The binding rules instead:

`.claude/rules/quality.md` (WCAG AA): 4.5:1 body / 3:1 large text; keyboard reachable; visible
focus rings; labelled inputs; alt on every image; modals trap focus and close on Escape;
**never `<div onClick>`**; one `<h1>` per page; semantic landmarks; ordered headings.

`.qa/PLAN.md` finding 2, quoted: *"The design has no focus states at all and explicitly sets
`outline:none` on both search inputs. WCAG 2.2 AA and `.claude/rules/quality.md` both require
visible focus. Focus rings are therefore authored from the design's own `--ring` token. Fixing
the markup, never suppressing the rule."*

**Pre-existing exemption to close, not inherit** — `.qa/DECISIONS.md` **D22**(2) records
`scrollable-region-focusable` (axe, serious) on the students `Table` at 375px, exempted at the
time because the scrolling wrapper lives in vendored `src/components/ui/table.tsx` and Law 11
forbids editing it. In this mission the table is re-authored as a **module-level** wrapper in
`src/modules/design-system/components/` (W1), which owns its own scroll container — so the fix
is now reachable: give that container `tabindex="0"`, `role="region"` and an `aria-label` from
the i18n catalog. **The exemption is removed, not carried forward.** If W1's table wrapper still
delegates the scroll container to the vendored file, this task is BLOCKED with that exact fact
rather than re-adding the exemption.

## Design source

The design export declares **no** `:focus`/`:focus-visible` anywhere
(`.qa/design/spec/04-ds-foundations.md` UNKNOWN 1: *"No `:focus` / `:focus-visible` style exists
for buttons… `tokens.css` defines `--ring: rgba(37,99,235,0.35)` but nothing in the markup
consumes it"*). The authored ring, used identically on every interactive element:

```
:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
```
with `--color-ring: oklch(0.5461 0.2152 262.88 / 0.35)` (hex provenance `rgba(37,99,235,.35)`).
Text inputs additionally carry the design's own focus treatment:
`border-color: var(--color-primary)` + `box-shadow: 0 0 0 3px rgba(37,99,235,.16)`
(`04-ds-foundations.md:339`, `[FRM:8,25,39]`).

Contrast anchors that must survive the sweep, from the OKLCH mapping in
`04-ds-foundations.md#TAILWIND V4 MAPPING`: body text `--color-body`
`oklch(0.4455 0.0374 257.28)` (#475569) on `--color-card`; muted meta
`--color-muted-foreground` `oklch(0.5544 0.0407 257.42)` (#64748B);
`--color-muted-foreground-soft` `oklch(0.7107 0.0351 256.79)` (#94A3B8) — **this one is 2.8:1 on
white and must never carry body copy**, only decorative/disabled text with a non-text-dependent
meaning.

## Files

- `tests/e2e/axe-dashboard-children.spec.ts` (new)
- Markup fixes only, at the call site: `src/modules/shell/components/**`,
  `src/modules/dashboard/components/**`, `src/modules/children/components/**`,
  `src/modules/design-system/components/**`, `src/app/[locale]/dashboard/**`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` for any new `aria-label` / `alt` string
- Never `src/components/ui/**` (CLAUDE.md law 11)

## Depends on

- **321** and **322** — those sweeps deliver the final markup for these pages; running axe
  before they land would gate an intermediate state.
- Wave gate (prose): **W4 (110-127), W5 (130-159), W6 (165-194)** DONE.

## Steps

1. Write `tests/e2e/axe-dashboard-children.spec.ts` using `AxeBuilder` from
   `@axe-core/playwright` (already a dependency, v4.12.1). Do **not** pass `.disableRules()`,
   `.exclude()` on app markup, or any result filter other than the impact threshold.
2. For each page below, at **1280×800** and at **375×812**, `analyze()` and assert
   `violations.filter(v => v.impact === 'serious' || v.impact === 'critical')` is empty,
   printing the full node list on failure:
   - `/dashboard` (the shell + the dashboard content)
   - `/dashboard` at 375 with the mobile nav Sheet **open** (a second scan)
   - `/dashboard/children`
   - `/dashboard/children` with the archive confirm dialog **open** (a third scan — dialogs are
     the usual source of `aria-dialog-name` and focus-trap violations)
   - `/dashboard/children/[documentId]` on a real seeded child, once per tab in
     `ChildProfileTabs` (each panel is different markup)
3. Also scan the `zh` variants of `/dashboard` and `/dashboard/children` — RTL is not in play but
   longer/shorter strings change layout and can reintroduce `target-size` and overlap failures.
4. For every violation found: fix the markup at the module call site. The permitted fixes are
   real ones — add the missing `<label for>`/`aria-label`/`aria-labelledby` (from the i18n
   catalog, never a literal), correct the heading order, add the landmark, replace a
   `<div onClick>` with a `<button>`, give the scroll container `tabindex="0"` + `role="region"`
   + `aria-label`, raise a contrast token. **Never** `aria-hidden` on interactive content, never
   a rule disable, never a results filter.
5. Assert one `<h1>` per page and an ordered heading sequence (no skipped level) via a DOM query,
   in addition to axe.
6. Assert every interactive element's `:focus-visible` outline resolves to a non-transparent
   colour, by focusing it and reading `getComputedStyle(el).outlineColor` /
   `outlineWidth` — axe does not check this, and the design ships no focus state at all.
7. Re-run the whole spec until it is clean twice in a row.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 12, 15.
- `.claude/rules/quality.md` — the full WCAG AA clause list above.
- `.claude/rules/i18n.md` — every `aria-label`/`alt` added is a catalog key in all six locales.
- `.claude/rules/module-pattern.md` — fixes live in the owning module's `components/`.
- `.claude/rules/testing.md`, D-VERIFY-1 — a real Playwright run against the running app.
- `.qa/DECISIONS.md` D22 — the two historic exemptions are closed here, not inherited.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/axe-dashboard-children.spec.ts` passes with **zero**
  serious and **zero** critical axe violations on every scan listed in step 2 and step 3
  (that is ≥ 16 scans: 8 surfaces × 2 widths, plus the zh pair).
- The spec contains **no** `disableRules`, no rule allow-list, no `exclude()` of app markup, and
  no filtering beyond the serious/critical impact threshold — verified by grepping the spec.
- D22's `scrollable-region-focusable` exemption is **gone**: the string
  `TABLE_SCROLL_EXEMPTION` no longer appears in `tests/e2e/**`, and the 375px table/scroll
  container scan is clean. (Or the task is BLOCKED with the vendored-file reason quoted.)
- One `<h1>` per page and an ordered heading sequence asserted programmatically.
- Every interactive element focused in the spec reports a non-transparent, ≥2px
  `:focus-visible` outline.
- Any string added exists in all six catalogs, key-identical.
- Zero banned-pattern grep hits in the diff; no file under `src/components/ui/` in the diff.

## Assumptions

- The seeded parent has ≥1 child so the child-detail page is reachable; `students-list.spec.ts`
  already depends on this.
- `@axe-core/playwright` 4.12.1 stays the version of record — no new dependency is added.

## Evidence

<!-- filled in as the task runs: per-scan violation counts, node lists for anything fixed -->
