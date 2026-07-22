---
id: 275
title: Rebuild the Password & security card in the portal dialect over the real change-password flow, without the two facts that have no data
layer: ui
kind: implement
slice: Settings → Password & security — the card, its Manage affordance, and the change-password form re-dressed
target: src/modules/settings/components/SecuritySettingsCard.tsx, src/modules/settings/components/AuthSettingsPanel.tsx, src/modules/auth/components/ChangePasswordForm.tsx, src/i18n/messages/*.json, tests/e2e/settings-security-card.spec.ts
contract: C-AUTH-CHANGE (root .qa/CONTRACTS.md:316 — POST /api/auth/change-password), C-AUTH-ME (.qa/CONTRACTS.md:32-35)
design: .qa/design/screens/portal--settings.html L37-L40; .qa/design/spec/03-portal-forms.md#section-4--password--security-l37-40
status: TODO
depends_on: [013, 020, 022, 272]
---

## Objective

Deliver the design's fourth settings card — a single 22px×30px row with a title, a sub-line and a
ghost `Manage` pill — over the change-password flow that already works, and refuse the two facts
the design's sub-line encodes that no data source can supply.

## Contract

Root `.qa/CONTRACTS.md:316` (`C-AUTH-CHANGE`, still binding per `.qa/RULES.md` workspace section):
`POST /api/auth/change-password` with a parent JWT; wrong current password → real 400 with a
translated alert; success → toast and the old password dead. All of that is proved today by
`tests/e2e/change-password.spec.ts` and `tests/e2e/settings-tabs.spec.ts:154-196` and must survive
byte-for-byte.

`.qa/CONTRACTS.md:32-35` (`C-AUTH-ME`) supplies the only account facts available:
`username`, `email`, `confirmed`, `createdAt`, `updatedAt`.

## Design source

`.qa/design/screens/portal--settings.html` L37-L40:

```
card  : background:#FFFFFF; border-radius:24px; padding:22px 30px;
        box-shadow:0 1px 2px rgba(14,35,80,.04);
        display:flex; align-items:center; gap:16px
title : 14px / 600 / #0E2350                 -> "Password & security"
sub   : 12.5px / #7C8698; margin-top:2px     -> "Last changed 4 months ago · two-step sign-in on"
action: PortalGhostButton                     -> "Manage"
```

Utilities: `bg-card rounded-3xl py-5.5 px-7.5 shadow-sm flex items-center gap-4`;
title `text-sm font-semibold text-navy-900`; sub `mt-0.5 text-meta text-portal-muted`;
`Manage` = PortalGhostButton — `bg-card text-navy-900 text-caption font-semibold px-4.5 py-2.5
rounded-full border border-portal-input hover:border-navy-900`, with
`transition-colors duration-150 ease-out-quart motion-reduce:transition-none` (§A.2 hover intent:
`border-color` → `#0E2350`).

**The sub-line is refused as written.** `03-portal-forms.md` §7.1 records it as two computed
facts — password `updatedAt` and a 2FA enabled flag:

- there is **no password-changed timestamp** anywhere in the API (the users-permissions user's
  `updatedAt` changes on any write, so presenting it as "last changed" would be a lie);
- there is **no two-factor authentication** in the product at all — no field, no endpoint, no
  provider (`.qa/intake/api-inventory.md` lists none).

So render a truthful sub-line instead: `Settings.security.subtitle` = "Change the password you use
to sign in." Do not print a date. Do not print a 2FA state. Record the refusal in Evidence — this
is the same no-invention rule that produced the B-1…B-8 table, applied to a fact that is not on it.

`Manage` must go somewhere real: it expands/reveals the existing `ChangePasswordForm` in place
(`aria-expanded` + `aria-controls`), or scrolls it into view when it is already mounted. Never a
dead button (`UNKNOWNS 8`).

The `ChangePasswordForm` itself keeps every field, label, validation message and submit behaviour;
only its shell moves into the portal card dialect (`PortalInput`: `height:48px; border:1.5px solid
#D8DFEA; border-radius:12px; padding:0 15px; font-size:14px; color:#0E2350`, focus
`border-color:#2563EB` — `03-portal-forms.md` §1.4 — plus the authored
`focus-visible:ring-2 ring-ring` that the export omits, per `.qa/PLAN.md` finding 2).

## Files

- `src/modules/settings/components/SecuritySettingsCard.tsx` — new, ≤120 lines; hosts the row and
  the disclosure.
- `src/modules/settings/components/AuthSettingsPanel.tsx` — compose Account (273), Language (274)
  and this card as the portal column inside the `auth` tab.
- `src/modules/auth/components/ChangePasswordForm.tsx` — field dialect only. **Read the file and
  every assertion in `change-password.spec.ts` before editing**; labels come from `Auth.*` keys and
  must not change.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Settings.security.title`,
  `Settings.security.subtitle`, `Settings.security.manage`.
- `tests/e2e/settings-security-card.spec.ts` — new.

## Depends on

- **272** — the settings column and tabs.

## Steps

1. Run `change-password.spec.ts` and `settings-tabs.spec.ts` and record the green baseline.
2. Build the card + disclosure with real `aria-expanded`/`aria-controls`.
3. Re-dress the form inputs to the portal input spec; keep labels, ids, `aria-describedby` and
   error wiring untouched.
4. Confirm the two refused facts appear nowhere in the markup.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 1 (do exactly what is asked — no 2FA scaffolding), law 3,
  law 14, law 15.
- `.claude/rules/quality.md` — labelled inputs with `for`/`id` (the export has none — fix, do not
  copy), visible focus, ≥44px targets, disclosure semantics.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, 150ms colour transition
  (§I.1 exception), exponential easing.
- `.claude/rules/i18n.md`, `.claude/rules/module-pattern.md`, `.claude/rules/testing.md`,
  **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/settings-security-card.spec.ts` green against the running app:
  - the card's computed `border-radius` = `24px`, `padding` = `22px 30px`;
  - the sub-line text equals `t('Settings.security.subtitle')` and the page contains **no** match
    for `/two-step|two-factor|2FA|Last changed/i` (assert on `page.content()`);
  - `Manage` toggles `aria-expanded` and reveals the change-password form;
  - a real password change round-trip still works end to end on a THROWAWAY parent (reuse
    `tests/e2e/helpers/throwaway-parent.ts`, never the shared seeded parent —
    `change-password.spec.ts:8-12` states why): wrong current password → real 400 + translated
    alert; correct → `POST /api/auth/change-password` 200 + success toast; the new password signs
    in after a reload;
  - input computed `height` = `48px`, `border-radius` = `12px`, `border-width` = `1.5px`, and on
    focus the `border-color` becomes the resolved `--color-primary` **and** a visible ring exists.
- **`change-password.spec.ts` (both tests) and `settings-tabs.spec.ts` (all three) pass
  unchanged.** Paste the run.
- Motion: ghost/border transitions `150ms`; `0s` reduced.
- 375px + 1280px: at 375px the row stacks (title block above the action) with no horizontal scroll.
- axe zero serious/critical on the auth tab, form expanded and collapsed.
- Six catalogs key-identical (+3 keys each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`.

## Assumptions

- No password-change timestamp and no 2FA exist. If a later wave adds either, the sub-line becomes
  a real computed string — this task deliberately does not scaffold for it.

## Evidence

<!-- filled in as the task runs -->
