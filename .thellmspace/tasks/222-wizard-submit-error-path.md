---
id: 222
title: Re-skin the wizard submit error path — offline, validation and server faults on step 5
layer: integration
kind: implement
slice: Wizard submit failure states and recovery
target: src/modules/student-wizard/components/StepReview.tsx, src/modules/student-wizard/lib/classify-wizard-error.ts, src/modules/student-wizard/hooks/use-wizard-submit.ts, src/i18n/messages/*.json
contract: C-STUDENT-CREATE error envelope — see below
design: .qa/design/spec/03-portal-forms.md#unknowns (item 1), .qa/design/spec/04-ds-foundations.md#unknowns (item 6)
status: TODO
depends_on: [221]
---

## Objective
Make every way `Confirm & add child` can fail land on a readable, localized, dismissible, recoverable
state in the portal dialect — the design ships none, and a re-skin that loses the existing alert is a
regression.

## Contract
Strapi error envelope (`.qa/CONTRACTS.md`, governing rules):
`{ "data": null, "error": { "status", "name", "message", "details" } }`.
`lib/classify-wizard-error.ts` maps it today and stays the single classifier:

| Condition | Kind | Surfaced as |
|---|---|---|
| `error.response === undefined` (no response) | `offline` | `error.offlineTitle` / `error.offlineBody` |
| `400` | `validation` | `error.validationTitle` + `error.details.issues.join(' ')` when present, else `error.message`, else `error.validationBody` |
| `403` (grant regression) and any other status | `server` | `error.serverTitle` / `error.serverBody` |
| `401` | handled globally — the axios response interceptor clears the token and the guard sends the user to `/sign-in?error=session` | — |

The error is state, not a toast: it must survive on screen until dismissed or resubmitted
(`useWizardSubmit`'s `error` + `dismissError`).

## Design source
No design source — `03-portal-forms.md` § UNKNOWNS 1 ("no error state, no error message component…")
and `04-ds-foundations.md` § UNKNOWNS 6. Authored from the design's own destructive/warning tokens and
the W1 `Alert`:

- placement: directly above the summary table inside the step card, so the message is adjacent to the
  button that failed and inside the same scroll container.
- `validation` → `Alert variant="warning"`; `offline` and `server` → `Alert variant="error"`; each has
  a title, a body, and a dismiss control with the accessible name `StudentWizard.review.error.dismiss`.
- retry: the footer primary stays enabled after a failure so the user can press it again; nothing is
  cleared from the form.
- `role="alert"` on the container so a screen reader hears it without a focus move, plus a
  programmatic focus move to the alert on appearance (it is off-screen for a user who has scrolled).

Motion: `animate-in fade-in slide-in-from-top-1 duration-200 ease-out-expo
motion-reduce:animate-none`; dismissal is instant.

All eight strings already exist under `StudentWizard.review.error.*` — verify their presence and
parity across the six catalogs rather than adding new ones.

## Files
- `src/modules/student-wizard/components/StepReview.tsx` — alert placement + focus move
- `src/modules/student-wizard/lib/classify-wizard-error.ts` — unchanged unless the live 400 body shape
  differs from the typed `WizardSubmitErrorPayload` (assert it against the real API)
- `src/modules/student-wizard/hooks/use-wizard-submit.ts` — keep `error`/`dismissError`; ensure a
  failure does NOT navigate and does NOT toast success
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — parity check only

## Depends on
221 — the success path this is the counterpart of.

## Steps
1. Verify the eight error keys in all six catalogs.
2. Re-skin the alert placement + add the focus move and `role="alert"`.
3. Drive all three failure kinds against the REAL API with Playwright route interception for the
   transport-level ones, and a real 400 by submitting a payload the server rejects.
4. Prove recovery: fix the input, resubmit, real 200, real row.

## Project rules
`.claude/rules/quality.md` (errors announced; visible focus; 4.5:1) · `.claude/rules/i18n.md` (no
raw server message rendered untranslated except the typed `details.issues`, which is the API's own
validation text) · `.claude/rules/state-data.md` · `.claude/rules/testing.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `page.route('**/api/students', route => route.abort())` on submit → the offline alert
  appears with `role="alert"`, the URL does not change, no success toast fires, and the form values
  survive.
- A real `400` from the API (submit with a server-rejected field) → the warning alert renders the
  API's own `details.issues` text; removing the interception and resubmitting yields `200` and a real
  persisted row that survives a reload.
- A forced `500` (route fulfil) → the server alert; dismissing it removes the alert and leaves the
  form untouched.
- The alert takes focus on appearance and is dismissible by keyboard.
- `/zh`: each of the three alerts renders from `zh.json`.
- Reduced motion: computed `animation-name: none` on the alert.
- axe zero serious/critical while an alert is shown; six catalogs key-identical; zero banned-pattern
  grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green; created students cleaned
  up in `finally`.

## Assumptions
The `401` path is already owned by the axios interceptor and `change-password.spec.ts` covers it; it
is asserted here only to the extent that the wizard does not swallow it.

## Evidence
