---
id: 272
title: Recut the settings shell to the portal column — 30px title, portal subtitle, and the URL-addressable tab row re-dressed
layer: ui
kind: implement
slice: Settings page chrome — header + tab strip + panel slot, in the portal dialect, with tab addressability preserved
target: src/modules/settings/components/SettingsScreen.tsx, src/modules/settings/components/SettingsTabs.tsx, src/modules/settings/constants/settings.constants.ts, src/i18n/messages/*.json, tests/e2e/settings-portal-shell.spec.ts
contract: C-UI-SHELL-NAV (.qa/CONTRACTS.md:255-266)
design: .qa/design/screens/portal--settings.html L3-L7; .qa/design/spec/03-portal-forms.md#41-settings--portal-canonical; .qa/design/spec/05-ds-components.md (underline tabs)
status: TODO
depends_on: [042, 110, 261]
---

## Objective

Give `/[locale]/dashboard/settings` the portal shell: an 820px column, a 30px/500 title, the
portal subtitle, and a tab strip re-dressed to the portal dialect — **without** losing the
URL-addressable, keyboard-operable tabs that `settings-tabs.spec.ts` proves.

## Contract

`.qa/CONTRACTS.md:255-266` (`C-UI-SHELL-NAV`) — no new HTTP operation; navigation stays
locale-aware; no route title or label may be hard-coded.

Behaviour preserved (from `tests/e2e/settings-tabs.spec.ts:68-109`):

- `?tab=auth|search|notifications|children` selects the panel; the default is `auth`
  (`lib/settings-tab.ts:5`);
- the tab row is a real `role="tablist"` with `aria-selected` and arrow-key operation;
- `useSettingsTabSync` keeps `router.replace` (no history spam) and the locale prefix;
- each panel keeps its `role="tabpanel"` + `aria-label`.

## Design source

**Design conflict, resolved and recorded.** `03-portal-forms.md` §4.1: "There are **no tabs** on
the portal settings screen — it is four stacked cards in a single scrolling column." But
`settings-tabs.spec.ts` is a passing e2e that requires tabs, and `.qa/PLAN.md:113` makes breaking a
passing spec a failure. Resolution: **keep the tabs, re-dress them**; the four portal cards become
the content of the tabs they belong to (Account + Password&security → `auth`; Language → `auth`;
Notifications → `notifications`; Search + Children keep their existing tabs). Record this in
Evidence as the design-vs-behaviour reconciliation. Nothing is invented and nothing is lost.

`.qa/design/screens/portal--settings.html` L3-L7:

```
column : display:flex; flex-direction:column; gap:22px; padding:8px 4px 8px 8px; max-width:820px
h1     : 30px / 500 / -0.02em / #0E2350          -> "Settings"
p      : margin:6px 0 0; 14px / #7C8698          -> "Your account, language and notification preferences"
```
→ `flex flex-col gap-5.5 max-w-portal`; `text-portal-h1 font-medium text-navy-900`;
`mt-1.5 text-sm text-portal-muted`. Both tokens (`--text-portal-h1`, `--container-portal`) come
from task 261.

Tab strip: keep the W1 `UnderlineTabs` primitive but re-ink to the portal dialect —
idle `text-portal-muted`, active `text-navy-900` with a `2px` `bg-navy-900` underline, label
`text-body-sm font-semibold` (13.5px/600, the portal's action type), gap `gap-6.5` (26px, the
DS §5.6 label gap), and a `1px` `border-portal-line` rule under the row. Keep
`overflow-x-auto` so four labels never make the page scroll horizontally at 375px.

Subtitle copy: the design's exact string is `Your account, language and notification preferences`.
The existing `Settings.subtitle` is `Manage your account preferences and security.` — replace the
en value with the design's literal and re-translate in all six catalogs (same key, new value).

Motion: keep the existing panel entrance (`animate-in fade-in-0 slide-in-from-bottom-1
duration-200 ease-out-expo motion-reduce:animate-none`, keyed on the tab) and add
`transition-colors duration-150 ease-out-quart motion-reduce:transition-none` on the tab labels.
The active underline slides with `transition-transform` if the primitive supports it; if it does
not, do NOT animate `left`/`width` (`.claude/rules/tailwind.md:19`).

## Files

- `src/modules/settings/components/SettingsScreen.tsx` — column + header; ≤120 lines.
- `src/modules/settings/components/SettingsTabs.tsx` — portal re-ink; keep `UnderlineTabs`,
  `isSettingsTab` guard and the `ariaLabel`.
- `src/modules/settings/constants/settings.constants.ts` — replace the mission-2 ink constants
  (`SETTINGS_LEDE_INK`) if the portal ink supersedes them; keep the CONTRAST note.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Settings.subtitle` new value in all six.
- `tests/e2e/settings-portal-shell.spec.ts` — new.

## Depends on

- **261** — emits `--text-portal-h1` and `--container-portal`.
- **042** the `UnderlineTabs` primitive (2px indicator over the 1px rule, 150ms colour transition)
  — this task re-inks it for the portal, it does not re-implement it.
- **110** the portal shell frame the settings column sits inside.

## Steps

1. Run `settings-tabs.spec.ts` and record the green baseline before touching anything.
2. Rebuild the header to the portal values.
3. Re-ink the tab strip; verify `role="tablist"`/`aria-selected`/arrow keys survive the re-ink
   (they belong to the primitive, not the classes).
4. Update `Settings.subtitle` in all six catalogs.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 3 (never break existing logic), law 8, law 11, law 14, law 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, transform/opacity, exponential
  easing.
- `.claude/rules/quality.md` — one `<h1>`, `role="tablist"` semantics, visible focus, ≥44px tab
  targets, AA contrast (the portal `#7C8698` on white is 4.63:1 — passes; `#9AA6B8` does not and
  must not be used for the idle tab label).
- `.claude/rules/i18n.md` (six catalogs), `.claude/rules/module-pattern.md`,
  `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/settings-portal-shell.spec.ts` green:
  - one `h1` with computed `font-size` `30px`, `font-weight` `500`, `letter-spacing` `-0.6px`;
  - the column's computed `max-width` is `820px`;
  - subtitle text equals the design literal via `t('Settings.subtitle')`;
  - the tab row is `role="tablist"` with exactly 4 `role="tab"` children; the active one has
    `aria-selected="true"` and a 2px underline in `--color-navy-900`;
  - `?tab=notifications` deep link selects the notifications tab on first paint (no flash of
    `auth`), and switching tabs updates the URL via `replace` (assert history length unchanged).
- **`settings-tabs.spec.ts` (all 3 tests) passes unchanged**, plus `change-password.spec.ts`,
  `notification-preferences.spec.ts`, `notification-preference-controls.spec.ts`,
  `push-subscription.spec.ts`. Paste the run.
- Motion: tab label colour transition `150ms`, `0s` reduced; the panel entrance animation is
  present and `none` under reduced motion.
- 375px + 1280px: at 375px the tab strip scrolls horizontally INSIDE itself and
  `document.documentElement.scrollWidth <= clientWidth` (the existing
  `notification-preferences.spec.ts:161-164` already asserts this — keep it true).
- axe zero serious/critical on all four tabs.
- Six catalogs key-identical (value change only, count unchanged).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `max-w-[`, `p-[`.

## Assumptions

- The four-tab structure is behaviour, not design, and is preserved deliberately (see the design
  conflict resolution above). If a later critic wants the design's four stacked cards, that is a
  product decision requiring `settings-tabs.spec.ts` to be rewritten — out of scope here.

## Evidence

<!-- filled in as the task runs -->
