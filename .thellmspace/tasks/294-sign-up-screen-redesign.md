---
id: 294
title: Re-skin the sign-up screen to the register form card, with only the fields the API accepts
layer: ui
kind: implement
slice: /[locale]/sign-up — heading block, white form card, field rows, terms line, submit, footer link
target: src/modules/auth/components/SignUpCard.tsx, src/modules/auth/components/SignUpForm.tsx
contract: n/a (presentation over the existing POST /api/auth/local/register wiring)
design: .qa/design/screens/app--register.html:1-35 · .qa/design/spec/06-auth-states-landing.md#12-register-app-registerhtml--centred-single-column-role-picker--form
status: TODO
depends_on: [290, 291]
---

## Objective

Bring `/sign-up` to the design's register composition — centred column, 28px heading, and the white
`radius:16px` form card with `padding:28px` and a 16px field rhythm — carrying **only** the four
fields `POST /api/auth/local/register` actually accepts. The register mutation, its Zod schema, the
password-mismatch check and the DOM focus order are untouched.

## Contract

n/a — presentation over existing wiring. Behaviour preserved verbatim:

- `useRegisterMutation` → `POST /api/auth/local/register` with `{ username, email, password }`.
- `signUpSchema` + `zodResolver`; the client-side `passwordMismatch` check stays client-side.
- On 200 the card swaps to `SignUpConfirmState` with the submitted email — **no JWT, no redirect**
  (D-AUTH-1). Taken email/username still renders an inline error, no Strapi text leaked.
- `SignUpCard` hydrates `useAuthStore` and `router.replace('/dashboard')` when a token exists.

**Focus-order contract** (`tests/e2e/a11y-auth.spec.ts:309`):
`logo → Google → username → email → password → toggle → confirm-password → confirm-toggle →
submit → sign-in link`. No node moves.

## Design source

`.qa/design/screens/app--register.html`, values literal:

| Element | Value | Token / utility |
|---|---|---|
| Column | centred, `width:560px`, children `gap:26px`, frame `padding:48px 0` | `w-140 max-w-full`, `gap-6`, `py-12` |
| Logo | `height:36px`, full colour, top-centre | existing `Logo` — but see the one-visible-logo rule below |
| Heading block | `gap:8px; text-align:center` | `gap-2 text-center` |
| `h1` | `28px / 700 / -0.015em / #0E2350` | 28px `--text-*` token, `font-bold tracking-tight text-foreground` |
| Sub `p` | `14.5px / #64748B` | `text-sm text-muted-foreground` |
| Form card | `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; gap:16px; box-shadow:0 1px 2px rgba(14,35,80,.06)` | `bg-card border border-border rounded-panel p-7 gap-4 shadow-sm` (`--radius-panel` = 16px) |
| Two-up rows | `grid 1fr 1fr; gap:14px` | `grid grid-cols-1 sm:grid-cols-2 gap-3.5` |
| Field label / input | `13.5px/600/#16326E`; input `1px #CBD5E1`, r10, `11px 14px`, `14.5px`, `#0E2350` | task 291's `TextField` / `PasswordField` — do not re-declare |
| Terms consent line | `flex; align-items:flex-start; gap:9px; 13.5px / line-height 1.5 / #475569`; unchecked box `18×18; radius:5px; border:1.5px solid #CBD5E1; background:#fff; margin-top:1px` | `--color-body`; `items-start gap-2.5 text-sm` |
| Submit | `#2563EB`, white, `15px/600`, `padding:13px`, r10, hover `#1D4ED8`, full width | `w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors duration-150` |
| Footer link line | `text-align:center; 14px; #64748B`, link `font-weight:600` | `text-center text-sm text-muted-foreground` + `font-semibold text-primary` |

**Fields NOT built, and why.** The design draws First name / Last name / Mobile phone
(`app--register.html:22-27`). `POST /api/auth/local/register` accepts `username`, `email`,
`password` only (`.qa/intake/web-inventory.md` §3), and there is no profile endpoint to write a
phone number to. Adding them would be a form that discards what the user types — forbidden by
`.qa/DECISIONS.md` D-SCOPE-1 §4 ("do not invent" is absolute). The existing `username`,
`email`, `password`, `confirmPassword` set is kept and dressed in the design's card. Record this in
Evidence.

**Terms consent line:** ship the design's copy line with its two links to `/` anchors only if a
Terms and a Privacy route exist; today neither does. Render the sentence as **text with no links**
and no checkbox — a checkbox that gates nothing and links that 404 are both inventions. Recorded
here; the checkbox returns when the legal pages do.

**Role cards** ("I'm a parent" / "I'm a school", `:8-20`) are BLOCKED — see task 299.

## Files

- `src/modules/auth/components/SignUpCard.tsx` (markup only; keep `'use client'`, both effects, the
  `registeredEmail` state and the `SignUpConfirmState` swap)
- `src/modules/auth/components/SignUpForm.tsx` (swap to `TextField`/`PasswordField`; keep `useForm`,
  `zodResolver(signUpSchema)`, `defaultValues`, `noValidate`, `onRegistered`)

## Depends on

- **290** — the shell and its rail width.
- **291** — the field kit; the two-up row is a grid of those fields, not new field styling.

## Steps

1. Read both files plus `tests/e2e/sign-up.spec.ts`, `sign-up-confirm.spec.ts`, `a11y-auth.spec.ts`.
2. Rebuild `SignUpCard` as heading block → status banner slot (task 293's component, reused) →
   Google slot → "or" divider → form card → footer link. Node order unchanged.
3. Rebuild the form as the white card with `gap-4`, the password/confirm pair in the two-up grid at
   `sm:` and stacked at 375px.
4. Motion: card entrance `motion-safe:animate-in motion-safe:fade-in
   motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:ease-out-expo
   motion-reduce:animate-none`; submit `transition-colors duration-150`; pending submit uses the
   `Button` primitive's `st-spin` spinner with the `Auth.signingUp` label.
5. 375px: single column throughout, card `p-5`, no horizontal scroll, every control ≥44px.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 9, 11, 14, 15.
- `.claude/rules/tailwind.md` — tokens, no arbitrary values, `gap-*` over margins.
- `.claude/rules/state-data.md` — `useForm` + `zodResolver` + schema in `schemas/`, unchanged.
- `.claude/rules/i18n.md` — no new keys; all six catalogs stay key-identical.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sign-up.spec.ts tests/e2e/a11y-auth.spec.ts
  tests/e2e/auth-logo.spec.ts` green — including the exact sign-up forward-Tab order and the six
  ≥44px target assertions at both viewports.
- **Persistence proof:** `tests/e2e/sign-up-confirm.spec.ts` still completes end-to-end — register a
  throwaway parent, open the real Mailpit message, follow the confirmation link to
  `/sign-in?confirmed=1`, sign in, and confirm the new `up_users` row exists (the spec's existing
  SQL helper) and survives a reload.
- Playwright computed-style assertion that the form card's `border-radius` is 16px and its
  `background-color` resolves to `--color-card`.
- axe zero serious/critical on `/sign-up` and `/zh/sign-up` at 375 and 1280.
- Exactly one visible `[data-slot="logo"]` at both viewports (`auth-logo.spec.ts`).
- Reduced-motion: no entrance animation, no transition.
- Six catalogs key-identical.
- Zero banned-pattern grep hits.

## Assumptions

First name / last name / mobile phone, the terms checkbox and the role cards are deliberately not
shipped; each refusal is recorded above with the rule that forbids it.

## Evidence

_(filled in as the task runs)_
