---
id: 273
title: Rebuild the settings Account card to the design's avatar row over the real /api/users/me payload
layer: ui
kind: implement
slice: Settings → Account — 54px initial avatar, name, email · meta line, and an action that goes somewhere real
target: src/modules/settings/components/AccountIdentityPanel.tsx, src/modules/settings/components/AccountSummaryPanel.tsx, src/modules/settings/components/SettingsPanel.tsx, src/i18n/messages/*.json, tests/e2e/settings-account-card.spec.ts
contract: C-AUTH-ME (.qa/CONTRACTS.md:32-35)
design: .qa/design/screens/portal--settings.html L8-L15; .qa/design/spec/03-portal-forms.md#section-1--account-l8-15
status: TODO
depends_on: [035, 038, 272]
---

## Objective

The auth tab currently shows a dark `NavyPanel` identity hero plus a `KeyValueList` summary. The
design's Account card is one white 24px card with a 54px navy initial avatar, the account name, a
`email · phone` meta line and a ghost `Edit` pill. Build that card over the same real
`/api/users/me` data, and resolve the design's dangling `Edit` honestly.

## Contract

`.qa/CONTRACTS.md:32-35` (`C-AUTH-ME`) — `GET /api/users/me` with a Bearer parent JWT returns the
users-permissions user. The client reads it through the existing `useAuth()`
(`@/modules/auth`) — `{ user, isLoading }` with `user.username`, `user.email`, `user.confirmed`,
`user.createdAt`. **There is no profile-update endpoint** (`AccountIdentityPanel.tsx` already
records this, and `.qa/intake/api-inventory.md` lists none).

## Design source

`.qa/design/screens/portal--settings.html` L8-L15:

```
card   : background:#FFFFFF; border-radius:24px; padding:26px 30px;
         box-shadow:0 1px 2px rgba(14,35,80,.04)
h2     : margin:0 0 18px; 16px / 600 / #0E2350          -> "Account"
row    : display:flex; align-items:center; gap:16px
avatar : 54×54; border-radius:999px; background:#0E2350; color:#fff;
         grid place-items:center; font-size:18px; font-weight:600; flex:none   -> "M"
name   : 15px / 600 / #0E2350                            (wrapper flex:1)
meta   : 13px / #7C8698; margin-top:2px                  -> "maria.r@gmail.com · +61 4 1234 5678"
action : PortalGhostButton                                -> "Edit"
```

Utilities: card `bg-card rounded-3xl p-6.5 px-7.5 shadow-sm` (26px 30px → `py-6.5 px-7.5`);
`h2` `mb-4.5 text-base font-semibold text-navy-900`; avatar `size-13.5 rounded-full bg-navy-900
text-card grid place-items-center text-h4 font-semibold shrink-0` (18px = `text-h4`);
name `text-[0.9375rem]`→ **no**: 15px is the existing `--text-button` token (0.9375rem) →
`text-button font-semibold text-navy-900`; meta `mt-0.5 text-caption text-portal-muted`;
`Edit` = PortalGhostButton (`03-portal-forms.md` §1.4) — `bg-card text-navy-900 text-caption
font-semibold px-4.5 py-2.5 rounded-full border border-portal-input hover:border-navy-900`.

Avatar letter: `03-portal-forms.md` §7.1 — "1 uppercase char … first char of account name". Derive
from `user.username`; never from the email.

Meta line: the design shows `email · phone`. **There is no phone field on the users-permissions
user** — do not fabricate one and do not render an empty separator. Render `user.email` alone, and
append the confirmation state as the second segment using the existing keys
(`Settings.account.confirmed` / `unconfirmed`), which is real data the API returns. Record this
substitution.

`Edit`: `03-portal-forms.md` `UNKNOWNS 8` — "`Edit` … has no declared destination". There is no
profile-update endpoint, so a working Edit cannot exist. **Do not render a dead button.** Render
the `Manage`-style ghost button only if it points at something real: link it to
`?tab=auth` anchored at the change-password form (the one account thing a parent CAN change), with
the label `Settings.account.manageSignIn`. If that reads wrong to the builder, omit the action
entirely — an absent control is honest, a dead one is not.

Motion: ghost button `transition-colors duration-150 ease-out-quart motion-reduce:transition-none`
(§A.2: `border-color` → `#0E2350` on hover, no duration declared in the export, 150ms shared).

## Files

- `src/modules/settings/components/AccountIdentityPanel.tsx` — becomes the portal Account card
  (avatar row); drop `NavyPanel`.
- `src/modules/settings/components/AccountSummaryPanel.tsx` — keep the `KeyValueList` of the real
  extra facts (`confirmedLabel`, `memberSinceLabel`) but re-dress to the portal card; if it becomes
  redundant with the new meta line, fold it in and delete the component **and its i18n keys from
  all six catalogs**.
- `src/modules/settings/components/SettingsPanel.tsx` — the shared portal card wrapper
  (`bg-card rounded-3xl shadow-sm`, per-instance padding).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Settings.account.manageSignIn` (if the action is
  kept).
- `tests/e2e/settings-account-card.spec.ts` — new.

## Depends on

- **272** — the settings column, header and tab shell.

## Steps

1. Read `settings-tabs.spec.ts:68-109` and `change-password.spec.ts` for anything selecting the
   account panels. Keep those hooks.
2. Build the card; the avatar is `aria-hidden` decorative and the name is the accessible text.
3. Resolve `Edit` per the rule above and record the decision.
4. Skeleton: keep a real loading state (the panel already renders a `Skeleton` while
   `useAuth().isLoading`) with the card's exact height so the tab does not jump.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 3, law 9 (typed axios via the auth module, never `fetch`),
  law 14, law 15.
- `.claude/rules/quality.md` — AA contrast (white on `#0E2350` is 13.9:1 — fine), decorative
  images/glyphs `aria-hidden`, ≥44px action target, visible focus.
- `.claude/rules/tailwind.md` — tokens only; `text-button` (15px) and `text-h4` (18px) already
  exist in `globals.css`; no arbitrary values.
- `.claude/rules/module-pattern.md`, `.claude/rules/i18n.md`, `.claude/rules/testing.md`,
  **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/settings-account-card.spec.ts` green against the running app:
  - the rendered name equals the `username` from a real `GET /api/users/me` captured in the same
    test, and the meta line contains that response's `email` — i.e. the card is proven to render
    server data, not a placeholder;
  - the avatar's computed `width`/`height` = `54px`, `border-radius` = `9999px`,
    `background-color` = resolved `--color-navy-900`, and its text is the uppercase first letter of
    the real username;
  - the card's computed `border-radius` = `24px` and `padding` = `26px 30px`;
  - **no element in the card contains a phone number or any string not present in the
    `/api/users/me` response** (assert the meta text is a subset of real values);
  - if the action is rendered, clicking it lands on `?tab=auth` with the change-password form
    focused/visible; if it is omitted, assert no `button` exists in the card header row.
- `settings-tabs.spec.ts`, `change-password.spec.ts` still green.
- Motion: ghost border-colour transition `150ms`; `0s` under reduced motion.
- 375px + 1280px: at 375px the avatar/name/action stack without horizontal scroll and the email
  wraps (`break-all` is already the existing guard).
- axe zero serious/critical on the auth tab.
- Six catalogs key-identical (± the keys added/removed, identical in all six).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`.

## Assumptions

- `useAuth()` exposes `user.username`, `user.email`, `user.confirmed`, `user.createdAt` today. If
  it does not expose `createdAt`, drop the "member since" row rather than computing one.
- No phone number exists anywhere in the parent's payload; the design's `+61 4 1234 5678` is
  design fiction and is deliberately not rendered.

## Evidence

<!-- filled in as the task runs -->
