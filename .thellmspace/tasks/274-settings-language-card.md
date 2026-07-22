---
id: 274
title: Build the settings Language card as the real locale switcher in the design's pill chips
layer: ui
kind: implement
slice: Settings → Language — 5-chip single-select row bound to the app's six real locales
target: src/modules/settings/components/LanguageSettingsCard.tsx, src/modules/i18n/components/LocaleSwitcher.tsx, src/modules/i18n/constants/locales.constants.ts, src/modules/settings/components/AuthSettingsPanel.tsx, src/i18n/messages/*.json, tests/e2e/settings-language-card.spec.ts
contract: n/a (client routing surface — design spec quoted below; C-UI-SHELL-NAV locale-aware navigation)
design: .qa/design/screens/portal--settings.html L16-L24; .qa/design/spec/03-portal-forms.md#section-2--language-l16-24
status: TODO
depends_on: [032, 272]
---

## Objective

The design's second settings card is a Language chip row. Build it — bound to the **real** thing
the app can change and persist: the routed locale (`src/i18n/routing.ts`, six locales, URL is the
sole source). Do not fabricate a per-account "report language" preference: no such field exists on
any content-type.

## Contract

n/a — no HTTP operation. The binding spec is `03-portal-forms.md` §4.1 Section 2, plus
`.qa/CONTRACTS.md:255-266` (`C-UI-SHELL-NAV`: "navigation continues to use locale-aware links").

Behaviour preserved: `src/i18n/routing.ts` — `locales: ['en','zh','ko','ms','vi','th']`,
`defaultLocale: 'en'`, `localePrefix: 'as-needed'`, **`localeCookie: false`** ("The URL is the sole
locale source … No locale value is persisted in a cookie", `LocaleSwitcher.tsx:34-35`). The
existing `LocaleSwitcher` navigation logic (`getPathname` + query/hash preservation +
`window.location.replace`) is REUSED, not reimplemented.

## Design source

`.qa/design/screens/portal--settings.html` L16-L24:

```
card : background:#FFFFFF; border-radius:24px; padding:26px 30px; shadow 0 1px 2px rgba(14,35,80,.04)
h2   : margin:0; 16px / 600 / #0E2350                     -> "Language"
p    : margin:5px 0 16px; 13px / #7C8698
       -> "Reports and emails can arrive in your preferred language alongside English."
row  : display:flex; gap:8px; flex-wrap:wrap
chip : height:42px; padding:0 18px; border-radius:999px; font-size:13.5px; font-weight:500
       selected   -> background #0E2350 ; color #FFFFFF ; border 1.5px solid #0E2350
       unselected -> background #FFFFFF ; color #3D4A5C ; border 1.5px solid #D8DFEA
```

Utilities: card `bg-card rounded-3xl py-6.5 px-7.5 shadow-sm`;
`h2` `text-base font-semibold text-navy-900`; `p` `mt-1.25 mb-4 text-caption text-portal-muted`;
row `flex flex-wrap gap-2`; chip `h-10.5 px-4.5 rounded-full text-body-sm font-medium border-1.5`
+ selected `bg-navy-900 text-card border-navy-900` / unselected
`bg-card text-portal-fg border-portal-input`; 44px target via `relative after:absolute
after:-inset-y-0.5` (the visual 42px box is untouched).

Chips: the design's five options (`English only`, `Tiếng Việt`, `简体中文`, `한국어`, `हिन्दी`) are
design fiction — `हिन्दी` is not a supported locale and "English only" is not a locale. Ship the
**six real locales** with their existing endonyms from
`src/modules/i18n/constants/locales.constants.ts` (`LOCALE_LABELS`): English, 中文, 한국어,
Bahasa Melayu, Tiếng Việt, ไทย. Four of the design's five are covered; the fifth is dropped as
unsupported. Record this mapping.

Copy: the design's body line promises reports and emails in the chosen language. Notification
emails are sent by the API and there is no per-account language field, so that promise cannot be
kept — use a truthful string instead: `Settings.language.description` = "Choose the language for
the SchoolTest interface." Record the copy change against the design literal.

A11y (`03-portal-forms.md` ACCESSIBILITY GAPS: "Chips are real `<button>` elements … but carry no
`aria-pressed` and are not grouped in a `radiogroup`"): wrap in `role="radiogroup"` with
`aria-labelledby` pointing at the `h2`, each chip `role="radio"` + `aria-checked`, arrow-key
roving tabindex, visible `focus-visible:ring-2 focus-visible:ring-ring`.

Font coverage: `Google Sans` does not cover 中文/한국어/ไทย. The chip row must set a fallback stack
that does (the `--font-sans` chain already ends in `system-ui, sans-serif`); verify each label
renders without tofu at 375px and 1280px and screenshot it.

Motion: `transition-colors duration-150 ease-out-quart motion-reduce:transition-none` on the chip;
switching locale is a full navigation, so no exit animation is authored.

## Files

- `src/modules/settings/components/LanguageSettingsCard.tsx` — new, ≤120 lines.
- `src/modules/i18n/components/LocaleSwitcher.tsx` — extract its navigation into
  `src/modules/i18n/hooks/use-locale-switch.ts` so both the footer `Select` and this chip row use
  ONE implementation (`.claude/rules/module-pattern.md`: no duplicated business logic; the hook
  goes in `hooks/`, not in the component).
- `src/modules/i18n/index.ts` — export the hook through the barrel (cross-module import rule).
- `src/modules/settings/components/AuthSettingsPanel.tsx` — mount the card in the `auth` tab
  (the portal design puts Language second in the single column; the tabs keep the behaviour).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Settings.language.title`,
  `Settings.language.description`, `Settings.language.groupLabel`.
- `tests/e2e/settings-language-card.spec.ts` — new.

## Depends on

- **272** — the settings column and tab shell.

## Steps

1. Extract the locale-switch hook; prove the existing footer switcher still works
   (`landing`/`LandingFooter` mounts it) before changing anything else.
2. Build the chip row with real radiogroup semantics.
3. Wire `useLocale()` for the active chip.
4. Verify the six endonyms render correctly (no tofu) — screenshot at both widths.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 3, law 14, law 15; §5 pitfall 13 (locale-aware nav).
- `.claude/rules/i18n.md` — six catalogs key-identical; locale-aware routing from
  `next-intl/navigation`; never a bare `<a>`.
- `.claude/rules/module-pattern.md` — shared logic in `hooks/`, cross-module import through the
  barrel only, component ≤120 lines.
- `.claude/rules/quality.md` — radiogroup semantics, roving tabindex, ≥44px targets, visible focus.
- `.claude/rules/tailwind.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/settings-language-card.spec.ts` green against the running app:
  - six chips render with the exact `LOCALE_LABELS` endonyms; exactly one has
    `aria-checked="true"` and it matches the current URL locale;
  - clicking `Tiếng Việt` navigates to `/vi/dashboard/settings?tab=auth` — the query string is
    preserved (the existing switcher guarantees this) — and after the navigation the page's
    strings are the `vi` catalog's (assert one known `vi` value);
  - **persistence:** `page.reload()` on the `/vi/...` URL keeps Vietnamese and keeps the chip
    checked (URL-based persistence is the real mechanism; assert no locale cookie is set —
    `context.cookies()` contains no `NEXT_LOCALE`);
  - keyboard: `ArrowRight` moves the roving focus, `Space` selects, focus ring visible;
  - chip computed `height` = `42px`, `border-radius` = `9999px`, `border-width` = `1.5px`,
    selected `background-color` = resolved `--color-navy-900`.
- `settings-tabs.spec.ts` and any landing-footer locale spec still green.
- Motion: chip colour transition `150ms`; `0s` reduced.
- 375px + 1280px: the row wraps, no horizontal page scroll, every label ≥44px tall target.
- axe zero serious/critical, including no "duplicate radiogroup" or missing-name violations.
- Six catalogs key-identical (+3 keys each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`.

## Assumptions

- A per-account report/email language preference has **no persistence surface** in the API (no
  field on `users-permissions.user`, `notification-preference` or `search-preference`). Binding
  this card to the routed UI locale is the honest maximum; adding a preference field would be a
  new backend contract and is out of W9's scope.

## Evidence

<!-- filled in as the task runs -->
