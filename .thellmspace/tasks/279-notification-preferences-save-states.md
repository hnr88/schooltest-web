---
id: 279
title: Recut the preference save affordance and its four states — idle, saving, saved, refused — in the portal dialect
layer: integration
kind: implement
slice: Saving notification preferences — primary pill button, loading/skeleton/error panels, and the real PUT round-trip
target: src/modules/notifications/components/NotificationPreferencesForm.tsx, src/modules/notifications/components/NotificationPreferencesPanel.tsx, src/modules/notifications/hooks/use-notification-preference-form.ts, src/i18n/messages/*.json, tests/e2e/notification-preferences-save.spec.ts
contract: C-PREF-GET, C-PREF-UPDATE (.qa/CONTRACTS.md:195-196)
design: .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives (PortalPrimaryButton) + #a3 (shimmer for async surfaces); .qa/design/screens/portal--settings.html L25-L36
status: TODO
depends_on: [020, 033, 034, 049, 276, 277, 278]
---

## Objective

One save for the whole notification card. Recut the submit control to the portal primary pill,
give the panel a real loading skeleton and a retryable load-error state in the portal card dialect,
and keep the toast success/error behaviour that two specs already assert.

## Contract

`.qa/CONTRACTS.md:195-196`:

> `C-PREF-GET`/`C-PREF-UPDATE`: `GET`/`PUT /api/notification-preferences/me`, each parent-owned and
> runtime-validated.

Frozen behaviour:
- the PUT body is exactly the eight writable keys (`notification-preferences.spec.ts:139-142`);
- on success the form resets from the **server response**, not from local state
  (`use-notification-preference-form.ts:31-34`) — this is what makes a server-side clamp visible;
- success toast `Settings.notificationPreferences.saved`; failure toast
  `Settings.notificationPreferences.saveError` (asserted by
  `notification-mutation-error.spec.ts`);
- the load-error panel keeps its retry (`notificationPreferences.loadErrorTitle` /
  `loadErrorDescription` / `Settings.retry`) and **must not swallow the push control**
  (`NotificationPreferencesPanel.tsx:31-36` records why).

## Design source

`PortalPrimaryButton` (`03-portal-forms.md` §1.4, from the wizard footer):

```
background:#0E2350; color:#fff; font-size:14px; font-weight:600;
padding:13px 26px; border-radius:999px; border:none; cursor:pointer;
:hover -> background:#16326E
```
→ `bg-navy-900 text-card text-sm font-semibold px-6.5 py-3.25 rounded-full hover:bg-navy-800`
with `transition-colors duration-150 ease-out-quart motion-reduce:transition-none` (§A.2: the
export declares the hover target with no duration; 150ms is the shared value).
Placement: `self-start` after the card stack (`03-portal-forms.md` §2.9 / §4 — the canonical
primary sits at `align-self:flex-start`, never right-aligned).

Loading: the design has no skeleton for settings, but §A.3 states the shimmer token "should [be
reused by] the add-child wizard, **settings**, notification feed and invoice list". Build the
skeleton with the portal card's exact box (`rounded-3xl`, the card padding) and one shimmer block
per real row so the settle causes no layout shift; W0's `--animate-shimmer`, transform-based,
`motion-reduce:animate-none`.

Saving state: label swaps to `notificationPreferences.saving`, button `aria-busy="true"` and
disabled, with the W1 `st-spin` spinner (`04-ds-foundations.md` §I) — 14×14, 2px ring,
`animate-spin`, `motion-reduce:animate-none`.

Saved state: keep the sonner toast (design has no toast for settings; the DS sheet specifies one —
`04-ds-foundations.md` §ALR toast: `--animate-toast-in` 250ms, bottom-right, 4s auto-dismiss).

## Files

- `src/modules/notifications/components/NotificationPreferencesForm.tsx` — portal composition: the
  toggle card, the digest card, the always-on card, the push card, then the save button
  `self-start`. Keep the existing `lg:grid-cols-2` only if it survives the portal 820px column —
  if the settings column is capped at 820px (task 272), a single column is correct; record which.
- `src/modules/notifications/components/NotificationPreferencesPanel.tsx` — skeleton + error
  states in the portal card dialect; keep the push control visible in the error branch.
- `src/modules/notifications/hooks/use-notification-preference-form.ts` — unchanged except any
  state the button needs (`form.formState.isDirty` may disable the button when nothing changed;
  if you add that, verify `notification-mutation-error.spec.ts` still saves — it clicks save
  **without changing anything**, so a dirty-gated button would break it: therefore DO NOT gate on
  dirty).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — no new keys expected; verify.
- `tests/e2e/notification-preferences-save.spec.ts` — new.

## Depends on

- **276**, **277**, **278** — the three field groups this one save submits.

## Steps

1. Re-read `notification-mutation-error.spec.ts` (it clicks save with an invalid token and expects
   the localized error). Note the no-dirty-gate constraint above.
2. Recut the button + states.
3. Skeleton geometry: measure the loaded card and match it.
4. Verify the server-response reset still wins over local state (flip a switch, save, and confirm
   the rendered state equals the response body, not the click).
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 3, law 9, law 14, law 15.
- `.claude/rules/state-data.md` — `useForm` + `zodResolver`, schema in `schemas/`, always
  `defaultValues`, mutation in `queries/`, cache updated after success.
- `.claude/rules/quality.md` — `aria-busy`, ≥44px target, visible focus, toast announced
  (`role="status"`), skeleton `aria-hidden` with an `sr-only` status line.
- `.claude/rules/tailwind.md` (transform/opacity, `--animate-spin`/`--animate-shimmer`,
  no arbitrary values), `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-preferences-save.spec.ts` green against the running app, on the isolated
  parent from task 260:
  - the button's computed `border-radius` = `9999px`, `font-size` = `14px`, `background-color` =
    resolved `--color-navy-900`, and its box is ≥44px tall;
  - clicking save issues `PUT /api/notification-preferences/me` **200** whose request body has
    exactly the eight writable keys;
  - during the request the button is `aria-busy="true"`, disabled, and shows a spinner with a
    non-`none` `animation-name`;
  - the success toast `notificationPreferences.saved` appears and auto-dismisses;
  - **persistence:** after `page.reload()` every switch and the digest match the values a direct
    `GET /api/notification-preferences/me` returns;
  - **load error:** with the GET routed to 500, the error panel renders inside a portal card AND
    the push control is still visible; `retry` issues a real new GET;
  - **save error:** with an invalid token (as `notification-mutation-error.spec.ts` does) the
    `saveError` toast appears and no switch state is lost.
- **`notification-preferences.spec.ts` (3), `notification-preference-controls.spec.ts` (3),
  `notification-mutation-error.spec.ts` (1), `settings-tabs.spec.ts` (3) all pass unchanged.**
- Motion: spinner + shimmer animate; both `none` under reduced motion; button colour transition
  `150ms`.
- 375px + 1280px: the button is full-width-safe at 375px (never wider than the column) and the
  page does not scroll horizontally (the existing assertion in
  `notification-preferences.spec.ts:161-164` must stay true).
- axe zero serious/critical in loaded, loading and error states.
- Six catalogs key-identical (count unchanged).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`.

## Assumptions

- The save button must NOT be gated on `isDirty` — `notification-mutation-error.spec.ts` saves an
  unchanged form on purpose. This is written down because gating looks like an obvious
  improvement and would turn a passing spec red.

## Evidence

<!-- filled in as the task runs -->
