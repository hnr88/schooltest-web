---
id: 337
title: i18n parity sweep — all six catalogs key-identical and zero hardcoded user-facing strings in the mission diff
layer: frontend
kind: verify
slice: Mission-wide i18n conformance across en, zh, ko, ms, vi, th
target: src/i18n/messages/{en,zh,ko,ms,vi,th}.json; tests/e2e/i18n-parity.spec.ts (new); any component still holding a literal
contract: n/a
design: n/a
status: TODO
depends_on: ["320", "321", "322", "323", "324", "325", "326"]
---

## Objective

Prove that the six locale catalogs have an **identical key shape** after the whole mission, that
every key added by the mission exists in all six with a real translation (not an English
fallback pasted in), and that **no user-facing string was hardcoded** anywhere in the mission's
diff.

## Contract

n/a. The binding rules, quoted from `.qa/RULES.md` [schooltest-web] i18n and
`.claude/rules/i18n.md`:

- **Never hardcode a user-facing string** — everything through `t()`.
- Server Components: `getTranslations` from `next-intl/server`. Client: `useTranslations`.
- Keys: PascalCase namespace, camelCase key (`Home.welcomeMessage`).
- **All six locale catalogs must have identical key shape** — en, zh, ko, ms, vi, th.
  **Baseline at intake: 1151 keys each.** ICU plurals for counts.
- Locale-aware `<Link>`/routing from `next-intl/navigation`; never a bare `<a>` for internal nav.

Routing facts (`src/i18n/routing.ts:3-9`, via `.qa/intake/web-inventory.md` §1):
locales `en, zh, ko, ms, vi, th`, default `en`, `localePrefix: 'as-needed'`,
`localeCookie: false`, `localeDetection: false`.

## Design source

n/a. Note the design export supplies **English literals only** (e.g. the wizard's
`Personal details` / `Step 1 of 5 · Who the student is`, the search pill's
`Show {n} schools`, the alert dismiss `aria-label="Dismiss"`). Every one of those becomes a
catalog key with an ICU-safe placeholder — the count in `Show {n} schools` is an ICU plural,
not a concatenation.

## Files

- `tests/e2e/i18n-parity.spec.ts` (new) — the runtime half of the proof
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — any key added to close a gap
- Any component in `src/modules/**` or `src/app/**` still holding a literal
- Never `src/components/ui/**` (vendored primitives carry no product copy; if one does, the
  string is overridden at the module wrapper, not in the vendored file)

## Depends on

- **320-326** — the seven UI sweeps deliver the final copy surface.
- Wave gate (prose): every wave that added strings (**W1, W3-W10**) DONE.

## Steps

1. **Static parity check.** Write a check (runnable from the spec or as a node one-liner in the
   task's Evidence) that loads all six JSON catalogs, flattens each to a dotted key set, and
   asserts:
   - the six key sets are **exactly equal** (report the symmetric difference per pair on
     failure);
   - the six key **counts** are equal and `>= 1151` (the intake baseline — a lower count means
     keys were deleted, which is a regression);
   - no value is an empty string, and no value in a non-`en` catalog is byte-identical to the
     `en` value **unless** it is a proper noun, a brand token, a number or a bare ICU
     placeholder — every other identical value is reported as a suspected untranslated paste and
     must be either translated or explicitly listed in the spec with a reason;
   - every value containing `{` parses as valid ICU (compile each message with next-intl's
     formatter and assert no throw), and the **placeholder set is identical across all six**
     locales for the same key (a missing `{count}` in `th` is a runtime crash).
2. **Hardcoded-string grep over the mission diff.** Compute the mission diff
   (`git diff <mission base commit>..HEAD -- 'src/**'`) and grep the added lines for
   user-facing literals in JSX/TSX:
   - text nodes between JSX tags containing two or more consecutive alphabetic words;
   - `aria-label=`, `alt=`, `title=`, `placeholder=`, `label=` with a string literal;
   - `toast.success('…')` / `toast.error('…')` / `new Error('…')` surfaced to the user.
   Every hit must be either replaced with a `t()` call or justified in the spec (technical
   identifiers, `data-*` values, test ids, and non-user-facing strings are exempt).
3. **Runtime proof.** In `tests/e2e/i18n-parity.spec.ts`, for **each of the six locales**, visit
   the full route set — `/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/dashboard`,
   `/dashboard/children`, `/dashboard/children/[documentId]`, `/dashboard/children/new`,
   `/dashboard/search`, `/dashboard/notifications`, `/dashboard/settings` — and assert:
   - **zero** occurrences of the raw key form in the rendered text (next-intl renders the key
     path when a key is missing — assert `body.innerText` contains no `/^[A-Z][A-Za-z]+\.[a-z]/`
     token that also exists as a key path in `en.json`);
   - `watchErrors(page)` is empty — next-intl logs a `console.error` for a missing message, so a
     missing key in any locale fails here;
   - the `<html lang>` attribute equals the locale;
   - the page renders a non-empty `<h1>`.
4. **Locale-routing preservation:** assert `localePrefix: 'as-needed'` still holds — `/dashboard`
   stays English, `/zh/dashboard` renders zh, the locale switcher preserves the current route
   and its query string, and `/en/...` canonicalises (the existing
   `tests/e2e/locale-routing.spec.ts` guarantees — keep them green).
5. **Plural correctness:** for every key whose `en` value uses `{count, plural, ...}`, assert the
   same key in all six locales also uses `plural` (not a concatenated string), and render each at
   `count = 0, 1, 2` in the app or via the formatter, asserting no throw and no `{count}`
   leaking into the output.
6. Fix every gap: add the missing key to all six catalogs with a real translation; replace every
   hardcoded literal with a `t()` call in the owning component.
7. Re-run steps 1-5 until clean twice in a row.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 15; §5 pitfall 11 (hardcoded user-facing
  strings) and pitfall 13 (`<Link>` from `next-intl/navigation`).
- `.claude/rules/i18n.md` — the full clause list above.
- `.claude/rules/module-pattern.md` — a component that needs copy takes it from `t()`, not from a
  constants file of English strings.
- `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- The six catalogs are proven **key-identical** with equal counts `>= 1151`; the symmetric
  difference between every pair is empty.
- Every value is non-empty; every suspected untranslated paste is either translated or listed
  with a cited reason in the spec.
- Every ICU message compiles in all six locales and carries the **same placeholder set** per key.
- `pnpm exec playwright test tests/e2e/i18n-parity.spec.ts` passes for **all six locales** across
  the eleven routes, with zero rendered key paths, zero console errors, correct `<html lang>`,
  and a non-empty `<h1>` on each.
- The hardcoded-string grep over the mission diff returns **zero** unjustified hits; the
  justification list (if any) is in the spec file with reasons, not in a hidden allow-list.
- Every plural key is a real ICU plural in all six locales and renders correctly at 0, 1 and 2.
- `tests/e2e/locale-routing.spec.ts`, `design-system-zh.spec.ts`, `landing.spec.ts` and
  `landing-aria.spec.ts` still pass in the same run.
- Zero banned-pattern grep hits in the diff.

## Assumptions

- Translations for new keys are authored, not machine-pasted English. Where a genuinely
  untranslatable token exists (brand name, CEFR band label such as `B1`, ACARA phase names), it
  is identical across locales **by design** and appears on the explicit exemption list in the
  spec with that reason.
- The 1151 baseline is the intake number (`.qa/RULES.md` i18n section); the final count will be
  higher, and the assertion is `>=`, never `==`.

## Evidence

<!-- filled in as the task runs: per-locale key counts, the symmetric-difference report, the grep output -->
