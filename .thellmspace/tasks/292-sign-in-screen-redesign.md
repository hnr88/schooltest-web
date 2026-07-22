---
id: 292
title: Re-skin the sign-in screen to app--login.html without reordering a single focusable node
layer: ui
kind: implement
slice: /[locale]/sign-in — heading block, field group, submit, "or" divider, Google slot, footer link
target: src/modules/auth/components/SignInCard.tsx, src/modules/auth/components/SignInForm.tsx
contract: n/a (presentation over the existing POST /api/auth/local wiring)
design: .qa/design/screens/app--login.html:15-39 · .qa/design/screens/ds--footers.html:88-101 · .qa/design/spec/06-auth-states-landing.md#11-login--split-layout-app-loginhtml
status: TODO
depends_on: [290, 291]
---

## Objective

Bring `/sign-in` to the design's right-hand form panel: 28px heading block, 16px-gapped field
group, full-width primary submit, hairline "or" divider, Google slot and the centred footer link —
while `useLoginMutation` → `POST /api/auth/local`, the redirect to `/dashboard`, the
already-signed-in redirect, and the DOM focus order all stay exactly as they are.

## Contract

n/a — presentation over existing wiring. Behaviour that MUST be preserved verbatim:

- `useLoginMutation` (`src/modules/auth/queries/use-login.mutation.ts`) → `POST /api/auth/local`
  with `{ identifier, password }`; `signInSchema` + `zodResolver` remain the only validation.
- On success `router.push('/dashboard')`; token written by the mutation, not by this component.
- `SignInCard` hydrates `useAuthStore` and `router.replace('/dashboard')` when a token exists.
- i18n keys stay: `Auth.signInTitle`, `signInSubtitle`, `emailLabel`, `emailPlaceholder`,
  `passwordLabel`, `passwordPlaceholder`, `forgotPasswordLink`, `signInButton`, `signingIn`,
  `showPassword`, `hidePassword`, `orDivider`, `googleButton`, `noAccount`, `signUp`.

**Focus-order contract** (`tests/e2e/a11y-auth.spec.ts:218`, asserted by forward `Tab` only):
`logo home link → Google button → email → password → show-password toggle → submit → sign-up link`.
The design draws Google *below* the submit (`app--login.html:37-38`); the design's own compact auth
card draws it *above* the fields (`ds--footers.html:92`, spec §1.6 "placed **above** the fields").
**Take the compact-card order** — it is design-sanctioned and it preserves the contract. Record this
choice in the task Evidence; do not move the Google node.

## Design source

`.qa/design/screens/app--login.html:15-39`, values literal:

| Element | Value | Token / utility |
|---|---|---|
| Form column | `width:420px`, children `gap:24px` | `w-105 max-w-full`, `gap-6` (from task 290) |
| Heading block | `gap:8px` | `gap-2` |
| `h1` ("Welcome back") | `28px / 700 / letter-spacing -0.015em / #0E2350` | 28px `--text-*` token, `font-bold tracking-tight text-foreground` |
| Sub `p` | `14.5px / #64748B` | `text-sm text-muted-foreground` |
| Field group | `gap:16px` | `gap-4` |
| Password label row | `flex; justify-content:space-between; align-items:baseline` with "Forgot password?" `13px/600` | `flex items-baseline justify-between`, link `text-sm font-semibold text-primary hover:text-brand-700 transition-colors duration-150` |
| Primary submit | `#2563EB` bg, `#fff`, `15px/600`, `padding:13px`, `radius:10px`, `box-shadow:0 1px 2px rgba(14,35,80,.08)`, hover `#1D4ED8`, full width | `w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary-hover transition-colors duration-150` |
| "or" divider | `gap:14px`; two `1px` rules `background:#E3E8F0`; label `12.5px; color:#94A3B8` | `gap-3.5`, `bg-border` rules, `text-xs text-muted-foreground-soft`, wrapper `aria-hidden="true"` |
| Footer link line | `text-align:center; 14px; #64748B`; link `font-weight:600` | `text-center text-sm text-muted-foreground`, link `font-semibold text-primary` |

Colour tokens: `#2563EB` → `--color-primary` · `#1D4ED8` → `--color-primary-hover` · `#E3E8F0` →
`--color-border` · `#94A3B8` → `--color-muted-foreground-soft` · `#64748B` →
`--color-muted-foreground` · `#0E2350` → `--color-foreground`.

**Not built here:** the "Keep me signed in" checkbox (`app--login.html:34`) and the Parent/School
segmented control (`:21-24`). The checkbox has no backing behaviour — the JWT lifetime is the
server's and no "remember" flag exists on `POST /api/auth/local` — so shipping it would be a control
that does nothing (no-invention rule, `.qa/DECISIONS.md` D-SCOPE-1 §4). The role selector is
recorded BLOCKED in task 299.

## Files

- `src/modules/auth/components/SignInCard.tsx` (markup only — keep `'use client'`, the two effects
  and the props signature)
- `src/modules/auth/components/SignInForm.tsx` (replace the inlined field markup with `TextField` /
  `PasswordField` from task 291; keep `useForm`, `zodResolver(signInSchema)`, `defaultValues`,
  `noValidate`, the submit handler and the error classification untouched)

## Depends on

- **290** — the 420px rail, its gap and the panel padding come from the layout shell.
- **291** — the field kit and its error affordance; this task must not re-declare field styling.

## Steps

1. Read `SignInCard.tsx`, `SignInForm.tsx` and `tests/e2e/sign-in.spec.ts` + `a11y-auth.spec.ts`
   in full before touching anything.
2. Restructure `SignInCard` to heading block → status/error slot (task 293) → Google slot → divider
   → `SignInForm` → footer link, keeping node order identical to today.
3. Replace `SignInForm`'s hand-rolled `Label`/`Input` blocks with `TextField` and `PasswordField`.
4. Apply the table above; the submit stays `type="submit"`, keeps `loading={login.isPending}` and
   swaps its label to `Auth.signingIn` while pending.
5. Motion: card entrance `motion-safe:animate-in motion-safe:fade-in
   motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-out-expo
   motion-reduce:animate-none` (design keyframes `st-fade-in` + `st-toast-in`, §6.1); submit hover
   is `transition-colors duration-150` (§6.3 prescribes adding exactly this); pending submit shows
   the `st-spin` spinner the `Button` primitive already carries.
6. 375px: the card fills the viewport width minus `px-5`; heading drops one step; the
   password-label row wraps without clipping the "Forgot password?" link; no horizontal scroll.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 8, 9, 11, 14, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, `gap-*` not margins.
- `.claude/rules/state-data.md` — no `fetch`, no new query hook, no logic moved into the component.
- `.claude/rules/i18n.md` — every string via `t()`; no new key in this task.
- `.claude/rules/testing.md` + D-VERIFY-1 — proof is a real Playwright run.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sign-in.spec.ts tests/e2e/parent-auth.spec.ts
  tests/e2e/a11y-auth.spec.ts tests/e2e/auth-logo.spec.ts` all green, zero new failures.
- **Persistence proof:** logging in as the seeded `parent@schooltest.local` still lands on
  `/dashboard`, `localStorage['app.auth.token']` holds a JWT, and after a full page reload the
  dashboard still renders the two seeded students (i.e. the token survived the reload).
- Playwright assertion of the exact forward-Tab order `logo → Google → email → password → toggle →
  submit → sign-up link` (the existing helper `expectForwardFocusOrder` already does this — it must
  pass unmodified).
- Playwright assertion that the submit's computed `background-color` equals the `--color-primary`
  value and that hovering resolves to `--color-primary-hover`.
- axe zero serious/critical on `/sign-in` and `/zh/sign-in` at 375 and 1280.
- Reduced-motion emulation: no card entrance animation, no colour transition.
- Six locale catalogs key-identical (no key change expected — assert the count is unchanged).
- Zero banned-pattern grep hits in the diff.

## Assumptions

"Keep me signed in" and the role segmented control are deliberately not shipped; both are recorded
above and in task 299 rather than silently dropped.

## Evidence

_(filled in as the task runs)_
