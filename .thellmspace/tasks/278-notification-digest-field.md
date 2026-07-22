---
id: 278
title: Recut the email-frequency digest field to the portal select, keeping the deferred options honestly unselectable
layer: ui
kind: implement
slice: Settings → Notifications → email frequency (digestFrequency) — portal select, 2 selectable + 2 deferred options
target: src/modules/notifications/components/NotificationDigestField.tsx, src/modules/notifications/lib/notification-preferences.ts, src/modules/notifications/constants/notification-preferences.constants.ts, src/i18n/messages/*.json, tests/e2e/notification-digest-field.spec.ts
contract: C-PREF-GET, C-PREF-UPDATE (.qa/CONTRACTS.md:195-196)
design: .qa/design/screens/portal--settings.html L25-L36 (card + row rhythm); .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives (PortalSelect)
status: TODO
depends_on: [013, 025, 272]
---

## Objective

`digestFrequency` is the one non-boolean preference. Recut its field to the portal select dialect,
keep `daily`/`weekly` visibly deferred (the API accepts them, the delivery pipeline does not
implement them yet), and keep the email-off notice that explains what `off` really means.

## Contract

`.qa/CONTRACTS.md:195-196` — `digestFrequency` is the enum
`'immediate' | 'daily' | 'weekly' | 'off'`
(`schemas/notification-preference.schema.ts:5`, mirroring the API's `DIGEST_FREQUENCIES` and the
content-type enumeration). The server validates it and rejects anything else with a typed 400
`ValidationError`.

Client truth already encoded:
`NOTIFICATION_DIGEST_SELECTABLE_FREQUENCIES = ['immediate','off']`
(`constants/notification-preferences.constants.ts`) and `isSelectableDigestFrequency`
(`lib/notification-preferences.ts:9-11`) — `daily`/`weekly` render with the
`digest.deferredOption` suffix ("{label} — coming soon") and are not selectable. That behaviour is
asserted by `notification-preference-controls.spec.ts:140+` and must survive.

## Design source

`03-portal-forms.md` §1.4 `PortalSelect`:

```
identical to PortalInput except padding:0 12px and background:#fff
 -> width:100%; box-sizing:border-box; height:48px;
    border:1.5px solid #D8DFEA; border-radius:12px;
    font-size:14px; color:#0E2350; outline:none
```
and: "**No `:focus` style is declared on any `<select>`**" — a WCAG failure the build must fix, not
copy (`.qa/PLAN.md` finding 2). Author the focus treatment from the design's own `--ring`:
`focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50`.

Label + help text (`03-portal-forms.md` §1.4): `PortalLabel` `12.5px / 600 / #0E2350;
margin-bottom:7px`; `PortalHelpText` `12px / #9AA6B8; margin-top:6px` — re-inked to
`--color-portal-muted` (`#7C8698`) for AA, the same correction recorded in tasks 262/264.

Card: the field sits in its own portal card (`bg-card rounded-3xl py-6.5 px-7.5 shadow-sm`) with
the `h2` type of `portal--settings.html` L26 (`text-base font-semibold text-navy-900`).

Deferred options: keep the existing `digest.deferredOption` ICU string, render them
`aria-disabled="true"` + `data-disabled` so they are announced as unavailable rather than
silently missing (the API would accept them — hiding them would misrepresent the contract).

Email-off notice: keep `digest.emailOffNotice`, shown when `off` is selected, in the design's
`PortalInfoPanel` (small): `bg-portal-surface-2 rounded-xl px-4 py-3 gap-2.5 text-caption
text-portal-fg leading-normal` with a 15×15 lucide `info` icon stroked `--color-primary`
(`03-portal-forms.md` §1.4).

Motion: notice mounts with `animate-in fade-in-0 duration-180 ease-out-quart
motion-reduce:animate-none`; the select trigger's border transitions
`150ms ease-out-quart motion-reduce:transition-none`.

## Files

- `src/modules/notifications/components/NotificationDigestField.tsx` — recut; keep the
  `Controller`, the W1 `Select*` primitives and the existing keys.
- `src/modules/notifications/constants/notification-preferences.constants.ts` — replace
  `NOTIFICATION_SELECT_TRIGGER_CLASS` with the portal box (48px / 12px radius / 1.5px border);
  keep the `data-[size=default]` specificity note verbatim — it documents a real trap.
- `src/modules/notifications/lib/notification-preferences.ts` — unchanged unless the selectable set
  moves; if it does, it moves here (pure helper), never into the component.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — no new keys expected; verify.
- `tests/e2e/notification-digest-field.spec.ts` — new.

## Depends on

- **272** — the settings column and tab shell.

## Steps

1. Run `notification-preference-controls.spec.ts` and record which digest assertions exist.
2. Recut the trigger/box to the portal spec; keep the `min-h-11` 44px floor (48px design height
   already clears it).
3. Author the focus ring (the export has none for selects).
4. Verify `daily`/`weekly` remain announced-but-unselectable and that selecting `off` reveals the
   notice.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 11 (wrap the shadcn/base-ui select, never edit it), law 14, 15.
- `.claude/rules/quality.md` — labelled control (`aria-label`/`<label for>`), visible focus,
  ≥44px target, disabled options announced.
- `.claude/rules/tailwind.md` — tokens only; the border/box-shadow transition is the §I.1
  exception; no arbitrary values.
- `.claude/rules/module-pattern.md` — the selectable-set predicate stays in `lib/`.
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-digest-field.spec.ts` green against the running app:
  - the trigger's computed `height` = `48px`, `border-radius` = `12px`, `border-width` = `1.5px`;
  - focusing it produces a visible ring (non-zero `box-shadow`) — assert it, since the design
    omitted the state;
  - the listbox contains four options; `daily` and `weekly` carry the `— coming soon` suffix and
    `aria-disabled="true"`, and clicking one does NOT change the trigger value;
  - selecting `off` reveals `digest.emailOffNotice`;
  - **persistence:** select `off`, save, `page.reload()` → the trigger still reads
    `digest.options.off` and a direct `GET /api/notification-preferences/me` returns
    `digestFrequency: 'off'`; restore in a `finally` on the isolated parent (task 260's fixture);
  - keyboard: the select opens with `Enter`/`Space`, arrows move, `Escape` closes and returns
    focus.
- **`notification-preference-controls.spec.ts` and `notification-preferences.spec.ts` pass
  unchanged** (the latter's third test selects `digest.options.off` through the UI).
- Motion: notice fade `180ms`; trigger border `150ms`; both `0s` under reduced motion.
- 375px + 1280px: the select is full-width at 375px with no horizontal scroll.
- axe zero serious/critical with the listbox open and closed.
- Six catalogs key-identical (count unchanged).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `h-[`, `p-[`.

## Assumptions

- `daily`/`weekly` remain deferred because no digest scheduler exists in the API
  (`C-NOTIF-EVENTS` describes immediate fan-out only). If a scheduler lands later,
  `NOTIFICATION_DIGEST_SELECTABLE_FREQUENCIES` is the single switch to flip.

## Evidence

<!-- filled in as the task runs -->
