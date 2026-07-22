---
id: 276
title: Rebuild the four delivery-channel toggle rows to the portal switch — 46×27 track, 19px transform travel, SMS caveat intact
layer: ui
kind: implement
slice: Settings → Notifications → delivery channels (email, in-app, push, SMS) as portal toggle rows
target: src/modules/notifications/components/NotificationPreferenceToggle.tsx, src/modules/notifications/components/NotificationPreferenceToggleGroup.tsx, src/modules/notifications/components/NotificationPreferenceFields.tsx, src/modules/design-system/components/toggle-row.tsx, src/modules/notifications/constants/notification-preferences.constants.ts, tests/e2e/notification-channel-toggles.spec.ts
contract: C-PREF-GET, C-PREF-UPDATE (.qa/CONTRACTS.md:195-196)
design: .qa/design/screens/portal--settings.html L25-L36; .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives (PortalToggle) + #section-3--notifications-l25-36 + #a1-declared--settings-toggle
status: TODO
depends_on: [010, 028, 260, 272]
---

## Objective

The channel rows currently use the design-system `ToggleRow` with a 42×24 app-dialect switch
(`toggle-row.tsx:25`). The portal switch is **46×27 with a 21px knob and 19px travel**, on 16px
hairline rows inside a `padding:8px 30px` card. Rebuild the rows to that, keep the SMS
blocked-delivery caveat and its `aria-describedby` link, and keep every assertion in
`notification-preference-controls.spec.ts` and `notification-preferences.spec.ts` true.

## Contract

`.qa/CONTRACTS.md:195-196` (`C-PREF-GET` / `C-PREF-UPDATE`). The four channel booleans are
`emailEnabled`, `inAppEnabled`, `pushEnabled`, `smsEnabled`
(`schemas/notification-preference.schema.ts:7-16`). The PUT payload shape is **frozen**:
`notification-preferences.spec.ts:139-142` asserts the body is exactly
`children,digestFrequency,emailEnabled,inAppEnabled,pushEnabled,smsEnabled,testActivity,testResults`.
Do not switch to a dirty-fields payload (see task 260's rejected alternatives).

Preserved behaviour: `useNotificationPreferenceForm` (`react-hook-form` + `zodResolver` +
`form.reset` from the server response), the `Controller`-driven `checked`/`onCheckedChange`, the
`role="switch"` + `aria-checked` semantics, keyboard `Space` operation, the SMS helper text
(`Settings.notificationPreferences.channels.sms.blocked`) and its id being present in the switch's
`aria-describedby` (`notification-preference-controls.spec.ts:126-138`).

## Design source

`03-portal-forms.md` §1.4 `PortalToggle` (from `portal--settings.html` L30-L32):

```
track : width:46px; height:27px; border-radius:999px; position:relative; flex:none;
        cursor:pointer; transition:background .2s;
        ON #0E2350 | OFF #D8DFEA
knob  : position:absolute; top:3px; left: ON 22px | OFF 3px;
        width:21px; height:21px; border-radius:999px; background:#fff;
        box-shadow:0 1px 3px rgba(14,35,80,.25); transition:left .2s
```
Travel = 19px; knob inset 3px both ends.

Row (`portal--settings.html` L26-L35):
```
card  : padding:8px 30px  (so the row hairlines span the card)
h2    : margin:0; padding:22px 0 8px; 16px / 600 / #0E2350   -> "Notifications"
row   : display:flex; align-items:center; gap:16px; padding:16px 0;
        border-bottom:1px solid #EEF1F6      (the LAST row keeps its border)
label : 14px / 600 / #0E2350
sub   : 12.5px / #7C8698; margin-top:2px
after last row: <div style="padding:6px 0 14px">
```

Utilities: card `bg-card rounded-3xl py-2 px-7.5 shadow-sm`; `h2` `pt-5.5 pb-2 text-base
font-semibold text-navy-900`; row `flex items-center gap-4 py-4 border-b border-portal-line`
(keep it on the last row, then `pt-1.5 pb-3.5` spacer); label `text-sm font-semibold text-navy-900`;
sub `mt-0.5 text-meta text-portal-muted`; track `h-6.75 w-11.5 rounded-full` ON `bg-navy-900` /
OFF `bg-portal-input`; knob `size-5.25 rounded-full bg-card shadow-knob` at `left-0.75 top-0.75`.

**Motion — the one real animation in the whole export** (§A.1), reimplemented compliantly (§A.1
build note + `.claude/rules/tailwind.md:19`): animate `transform: translateX(0 → 19px)` on the
knob, NOT `left`; `transition: transform 180ms var(--ease-out-quart), background-color 180ms
var(--ease-out-quart)` (W0's `--duration-switch: 180ms`, the design's `.2s` snapped to the token —
record the 20ms delta), with `motion-reduce:transition-none` on both.

A11y: the export's toggle is a `<div onClick>` with no `role`, no `aria-checked` and no focus
(`03-portal-forms.md` ACCESSIBILITY GAPS). The current implementation is already correct — a real
`role="switch"` with `aria-checked`, `aria-labelledby` from the SSR label, and
`aria-describedby`. **Keep all of it**; only geometry, colour and motion change. The 44px target
comes from the existing `after:-inset-y-3` pseudo-element pattern
(`toggle-row.tsx:20-24`) — recompute it for the 27px track (`27 + 9 + 9 = 45`) → `after:-inset-y-2.25`
minimum; state the arithmetic in a comment as that file already does.

## Files

- `src/modules/design-system/components/toggle-row.tsx` — portal geometry variant. This is a W1
  design-system file: add a `size` prop (`'app' | 'portal'`) rather than replacing the app
  geometry, because `push-subscription`/other screens may still use the 42×24 form. Never edit
  `src/components/ui/switch.tsx` (CLAUDE.md law 11) — override by class as the file already does.
- `src/modules/notifications/components/NotificationPreferenceToggle.tsx` — pass the portal size;
  keep `useSwitchDescribedBy`, `data-field`, the helper paragraph.
- `src/modules/notifications/components/NotificationPreferenceToggleGroup.tsx` /
  `NotificationPreferenceFields.tsx` — the card + `h2` + hairline rhythm above.
- `src/modules/notifications/constants/notification-preferences.constants.ts` — replace the
  mission-2 ink overrides with the portal ink; keep `NOTIFICATION_CHANNEL_TOGGLES` order
  **email, in-app, push, SMS** (the SMS row must stay last so its caveat sits above the spacer).
- `tests/e2e/notification-channel-toggles.spec.ts` — new.

## Depends on

- **260** — the round-trip spec must be green before this file is touched; otherwise a real
  regression here is indistinguishable from the known red.
- **272** — the settings column and tab shell.
- **028** — W1 rebuilds the Switch (40×22 track, 18px travel) and the settings `ToggleRow`. That is
  the **app/design-system** dialect; the portal dialect here is 46×27 with 19px travel. Add the
  portal size to the primitive 028 delivers — never fork a second switch, never edit
  `src/components/ui/switch.tsx`.
- **010** — the easing/duration tokens (`--duration-switch`, `--ease-out-quart`).

## Steps

1. Run `notification-preference-controls.spec.ts` and `notification-preferences.spec.ts` and record
   the green baseline (post-260).
2. Add the `portal` size to `ToggleRow` with the exact geometry above; keep the `app` size intact.
3. Recut the rows/card.
4. Convert the knob motion to `transform`.
5. Re-verify the SMS `aria-describedby` link survives (it is stamped by `useSwitchDescribedBy`
   after hydration AND passed as `describedById` — both paths must still work).
6. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 11 (never edit `src/components/ui/*`), law 3, law 14, law 15.
- `.claude/rules/tailwind.md` — **animate transform and opacity only** (this is exactly why `left`
  becomes `translateX`); the track's `background-color` is the documented §I.1 exception;
  exponential easing; no arbitrary values.
- `.claude/rules/quality.md` — `role="switch"` + `aria-checked`, keyboard operable, ≥44px target,
  visible focus, AA contrast on the label (`#0E2350` on white) and the sub (`#7C8698` = 4.63:1).
- `.claude/rules/module-pattern.md` (component ≤120 lines), `.claude/rules/i18n.md`,
  `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-channel-toggles.spec.ts` green against the running app:
  - four switches render in the order email, in-app, push, SMS, each with `role="switch"`;
  - track computed `width` = `46px`, `height` = `27px`; knob computed `width`/`height` = `21px`;
  - ON track `background-color` = resolved `--color-navy-900`, OFF = `--color-portal-input`;
  - toggling moves the knob by exactly `19px` measured from `boundingBox().x` before/after;
  - each switch's hit target is ≥44px tall (`boundingBox()` of the row's interactive area);
  - keyboard: `Tab` + `Space` toggles, focus ring visible;
  - **persistence:** switch SMS off, save, `page.reload()` → `aria-checked="false"`, and a direct
    `GET /api/notification-preferences/me` in the same test returns `smsEnabled: false`; restore in
    a `finally` **on an isolated parent** (task 260's fixture).
- **`notification-preference-controls.spec.ts` (3 tests) and `notification-preferences.spec.ts`
  (3 tests) pass unchanged**, including the exact-8-key payload assertion. Paste the run.
- Motion: knob `transition-property` includes `transform` and NOT `left`; `transition-duration`
  `180ms`; `0s` under reduced motion, with the knob still landing in the correct end position.
- 375px + 1280px: at 375px the row keeps label and switch on one line with the label wrapping, and
  `scrollWidth <= clientWidth` (the existing `notification-preferences.spec.ts:161-164` assertion
  must stay true).
- axe zero serious/critical on the notifications tab.
- Six catalogs key-identical (no new keys expected — assert count unchanged).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`, `left-[`.

## Assumptions

- `ToggleRow` is delivered by W1 task **028** (40×22 app dialect). Adding a `size="portal"` variant
  is the sanctioned way to serve two dialects; if 028 already shipped a portal variant, use it and
  delete nothing.
- The design's `.2s` becomes W0's `--duration-switch: 180ms`; the 20ms delta is recorded, not
  hidden.

## Evidence

<!-- filled in as the task runs -->
