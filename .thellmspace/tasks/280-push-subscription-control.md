---
id: 280
title: Recut the device-notification control to the portal card, keeping every real push status and both real endpoints
layer: integration
kind: implement
slice: Settings → Notifications → device notifications — subscribe / unsubscribe against the real VAPID + push-subscription endpoints
target: src/modules/notifications/components/PushSubscriptionControl.tsx, src/modules/notifications/hooks/use-browser-push-subscription.ts, src/modules/notifications/constants/push-subscription.constants.ts, src/i18n/messages/*.json, tests/e2e/push-subscription-control.spec.ts
contract: C-PUSH-VAPID-CONFIG (.qa/CONTRACTS.md:180-186), C-PUSH-SUBSCRIBE (.qa/CONTRACTS.md:233-244), C-PUSH-UNSUBSCRIBE (.qa/CONTRACTS.md:246-253)
design: .qa/design/screens/portal--settings.html L37-L40 (row + ghost action); .qa/design/spec/03-portal-forms.md#42-settings--app-variant (Security card row shape)
status: TODO
depends_on: [020, 031, 272]
---

## Objective

Re-dress the push control to the portal card without weakening a single honesty property it
already has: it is always rendered, it shows its REAL browser/server status, it is disabled when it
cannot act, and it never becomes an enabled no-op.

## Contract

`.qa/CONTRACTS.md:180-186` (`C-PUSH-VAPID-CONFIG`):

> 200: `{ data: { publicKey: string|null } }`. `null` honestly reports an unavailable server
> configuration; the endpoint never exposes a VAPID private key or any user data.

`.qa/CONTRACTS.md:233-244` (`C-PUSH-SUBSCRIBE`): parent JWT only, owner server-derived, strict
`{ endpoint, keys: { p256dh, auth }, expirationTime?, userAgent? }`, unknown/missing keys → typed
400, foreign endpoint → generic 403, persists exactly one `push_subscriptions` row.

`.qa/CONTRACTS.md:246-253` (`C-PUSH-UNSUBSCRIBE`): strict `{ endpoint }`, `200 { data: { deleted:
0|1 } }`, missing/foreign → `deleted: 0`, retry stays 0.

Frozen behaviour (`push-subscription.spec.ts`, `push-subscription-security.spec.ts`):
- config is parent-only and never exposes a private key;
- subscriptions persist, are owner-scoped and delete idempotently;
- the browser registers a **same-origin** service worker and honours its real permission state;
- a parent cannot claim another parent's endpoint;
- **a failed VAPID config request leaves no enabled no-op control**
  (`push-subscription-security.spec.ts:87`).

The seven statuses in `constants/push-subscription.constants.ts` (`checking`, `ready`,
`subscribed`, `unsupported`, `permissionDenied`, `notConfigured`, `error`) and their i18n keys stay.

## Design source

The portal export has no push card. Use its **Security-row** vocabulary
(`03-portal-forms.md` §4.2 Card C / `portal--settings.html` L37-L40), which is exactly this shape —
a title with its state beside it, a 12.5px explanation under it, and the action pinned right:

```
card   : background:#FFFFFF; border-radius:24px; padding:22px 30px; shadow 0 1px 2px rgba(14,35,80,.04)
title  : 14px / 600 / #0E2350
state  : status pill — 11.5px / 600; #0E2350 on #EEF1F6; padding:4px 11px; border-radius:999px
         (design §6.3 pill geometry; tone per status)
sub    : 12.5px / #7C8698; margin-top:2px
action : PortalGhostButton  (subscribed) | PortalPrimaryButton (not subscribed)
```

Utilities: card `bg-card rounded-3xl py-5.5 px-7.5 shadow-sm`;
title `text-sm font-semibold text-navy-900`; sub `mt-0.5 text-meta text-portal-muted`;
pill `text-overline font-semibold px-2.75 py-1 rounded-full` with tones —
ready/subscribed `bg-success-soft text-success-strong`, permissionDenied/error
`bg-destructive-soft text-destructive-strong`, unsupported/notConfigured/checking
`bg-portal-line text-navy-900` (`04-ds-foundations.md` §C supplies every soft/strong pair and they
are AA-verified);
primary action = PortalPrimaryButton (`bg-navy-900 text-card text-sm font-semibold px-6.5 py-3.25
rounded-full hover:bg-navy-800`); ghost action = PortalGhostButton.

Disabled: `disabled:bg-muted disabled:text-body disabled:opacity-100 disabled:cursor-not-allowed`
— keep the existing "never opacity-faded into illegibility" treatment already in the file.

Motion: `transition-colors duration-150 ease-out-quart motion-reduce:transition-none` on the
action; the status pill changes with `animate-in fade-in-0 duration-150 ease-out-quart
motion-reduce:animate-none`; the pending action shows the `st-spin` spinner
(`--animate-spin`, `motion-reduce:animate-none`).

## Files

- `src/modules/notifications/components/PushSubscriptionControl.tsx` — recut; keep
  `data-surface="push-subscription-control"`, `aria-describedby`, and the always-rendered rule.
- `src/modules/notifications/constants/push-subscription.constants.ts` — add the tone per status
  next to the existing label keys.
- `src/modules/notifications/hooks/use-browser-push-subscription.ts` — **do not change the logic.**
  Read it first; it owns permission probing, worker registration, VAPID fetch and the
  subscribe/unsubscribe mutations. Only touch it if a status is missing from the UI.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — no new keys expected; verify.
- `tests/e2e/push-subscription-control.spec.ts` — new.

## Depends on

- **272** — the settings column and tabs.

## Steps

1. Run `push-subscription.spec.ts` and `push-subscription-security.spec.ts` and record the green
   baseline. These are the strictest specs in the wave.
2. Recut the card; map each of the seven statuses to a tone and verify each renders.
3. Verify the disabled-when-it-cannot-act rule for `unsupported`, `notConfigured`,
   `permissionDenied` and `error`.
4. Prove one real subscribe → unsubscribe round trip with a real Postgres row.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 3 (never break existing logic — this hook is load-bearing),
  law 9, law 14, law 15.
- `.claude/rules/quality.md` — status announced in text (never colour alone), `aria-describedby`
  on the action, ≥44px target, visible focus.
- `.claude/rules/state-data.md` — mutations stay in `queries/`; cache invalidated after success.
- `.claude/rules/tailwind.md`, `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/push-subscription-control.spec.ts` green against the running app:
  - the card's computed `border-radius` = `24px`, `padding` = `22px 30px`; the status pill's
    computed `border-radius` = `9999px`, `font-size` = `11.5px`;
  - with notification permission GRANTED (`context.grantPermissions(['notifications'])`), the
    control reaches `status.ready` or `status.subscribed` and the action is enabled;
  - clicking enable issues a real `POST /api/push-subscriptions` returning **200** with
    `{ data: { documentId, endpoint } }`;
  - **persistence:** a `psql` read shows exactly one `push_subscriptions` row for that parent with
    that endpoint, and it is still there after `page.reload()` with the control showing
    `status.subscribed`;
  - clicking disable issues `DELETE /api/push-subscriptions` returning `{ data: { deleted: 1 } }`,
    a second click returns `deleted: 0`, and the row is gone from Postgres;
  - with the VAPID config routed to a failure, the action is **disabled** and the status reads
    `status.notConfigured`/`status.error` — never an enabled no-op
    (this mirrors `push-subscription-security.spec.ts:87`).
- **`push-subscription.spec.ts` (3 tests) and `push-subscription-security.spec.ts` (2 tests) pass
  unchanged.** Paste the run.
- Motion: action colour transition `150ms`; pending spinner animates; both `none`/`0s` under
  reduced motion.
- 375px + 1280px: at 375px title/pill/sub/action stack without horizontal scroll.
- axe zero serious/critical in at least three distinct statuses.
- Six catalogs key-identical (count unchanged).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`.

## Assumptions

- `use-browser-push-subscription.ts` already covers every status; this is a presentation task. Any
  logic change found necessary must be justified in Evidence against the two push specs.

## Evidence

<!-- filled in as the task runs -->
