---
id: 221
title: Wire Confirm & add child to the real create mutation with the st-pop-in success confirmation
layer: integration
kind: wire
slice: Wizard submit — full-schema parse → POST /api/students → success animation → children list
target: src/modules/student-wizard/hooks/use-wizard-submit.ts, src/modules/student-wizard/components/WizardSubmitSuccess.tsx, src/modules/student-wizard/components/WizardScreen.tsx, src/i18n/messages/*.json
contract: C-STUDENT-CREATE — `POST /api/students` (existing); see below
design: .qa/design/screens/portal--add-child-multi-step.html:142, .qa/design/spec/03-portal-forms.md#a4-not-present-in-the-design
status: TODO
depends_on: [203, 219]
---

## Objective
Keep the existing create path exactly as it is, and add the success confirmation the design has no
answer for — `03-portal-forms.md` §A.4 lists "toast / success confirmation after `Confirm & add
child`" as motion the build must originate.

## Contract
`POST /api/students`, body `{ data: StudentCreatePayload }` via `useCreateStudentFullMutation`
(`queries/use-create-student-full.mutation.ts`), response parsed by `createStudentResponseSchema`.
Payload keys come only from the server whitelist built in `lib/build-student-payload.ts`:
`given_name`, `nationality`, `target_entry_year`, `target_entry_term`, `parent_guardian_name`,
`parent_guardian_phone`, `preferred_contact_channel`, `photo`, `voice_intro` always; `family_name`,
`email`, `date_of_birth`, `gender`, `passport_number`, `current_school`, `current_year_level`,
`year_level`, `parent_guardian_email`, `parent_guardian_wechat` only when non-empty. `parent`,
`status`, `student_key`, `teacher`, `class`, `user` are never written by the client.
Auth: parent JWT from `localStorage` via the axios request interceptor. Observed success status on
this build is **200** (`student-wizard-contrast.spec.ts` asserts `200`, not 201).

Preserved behaviour: `form.handleSubmit(submit)` runs the FULL-schema parse before the request; on
success `toast.success(t('toastCreated'))` fires and the router pushes `/dashboard/children`; the
mutation invalidates the students query so the new child is on the list without a manual reload.

## Design source
The design's only submit affordance is the footer button label `Confirm & add child` (task 203) and
`view:'children'` afterwards — there is no success state at all (§A.4). Authored, using the design
system's own keyframe vocabulary (`04-ds-foundations.md` §I): `--animate-pop-in: st-pop-in 180ms
var(--ease-out-quart)`, registered by W0.

Success confirmation:
- an inline confirmation replaces the step card's body for the moment before navigation: a
  `size-12 rounded-full bg-navy-900 text-primary-foreground grid place-items-center` medallion with a
  lucide `Check` (`size-5 stroke-3`), a `text-xl font-semibold text-navy-900` line
  (`StudentWizard.success.title`, `{name} has been added`) and a `text-body-sm text-body` line
  (`StudentWizard.success.body`).
- it enters with `animate-pop-in` (medallion) + `animate-in fade-in duration-200 ease-out-expo`
  (text), then the router push fires after **450ms**.
- `motion-reduce`: `motion-reduce:animate-none` on both, and the push fires **immediately** —
  `student-wizard-contrast.spec.ts` runs under `emulateMedia({ reducedMotion: 'reduce' })` and
  asserts `toHaveURL(/\/dashboard\/children$/)` right after the response, so a reduced-motion user
  must never wait on an animation.
- the sonner toast stays (it is the confirmation that survives the navigation).
- the footer primary shows the existing `loading` state while the mutation is pending, and is
  disabled for the duration so a double-click cannot create two children.

## Files
- `src/modules/student-wizard/components/WizardSubmitSuccess.tsx` (new)
- `src/modules/student-wizard/hooks/use-wizard-submit.ts` — success phase + the reduced-motion branch
  (read via `window.matchMedia('(prefers-reduced-motion: reduce)')`, guarded for SSR)
- `src/modules/student-wizard/components/WizardScreen.tsx` — render the success state
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `success.title`, `success.body`

## Depends on
203 — the footer button that fires this. 219 — the review screen it submits from.

## Steps
1. Add the two catalog keys ×6.
2. Add the success phase to `use-wizard-submit` (no change to the mutation, the payload builder or the
   toast).
3. Build `WizardSubmitSuccess`; render it from `WizardScreen`.
4. Prove persistence against real Postgres, then run the suite.

## Project rules
`.claude/rules/state-data.md` (mutations live in `queries/`; always invalidate after success) ·
`.claude/rules/tailwind.md` (transform/opacity only; the six design keyframes; no new dependency) ·
`.claude/rules/i18n.md` · `.claude/rules/testing.md` + D-VERIFY-1 (a real Playwright run and a real
row that survives a reload).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, as a throwaway parent (`tests/e2e/helpers/throwaway-parent.ts`), filling all five steps:
  one `POST /api/students` returning `200`; the request body contains `given_name`,
  `target_entry_year`, `target_entry_term`, `parent_guardian_name`, `parent_guardian_phone`,
  `preferred_contact_channel` and the uploaded `photo` id, and contains none of `parent`, `status`,
  `student_key`, `teacher`, `class`, `user`.
- **Persistence**: the returned `documentId` is read back through `GET /api/my/students/:documentId`
  after a full page reload and shows the same `given_name`/`target_entry_year`; the row is visible in
  the children roster after `page.reload()`.
- The success medallion reports a running `animation-name` matching the pop-in keyframe; under
  `emulateMedia({ reducedMotion: 'reduce' })` it reports `none` and the URL is
  `/dashboard/children` without an added delay.
- The primary is disabled while pending; a double-click produces exactly one POST.
- axe zero serious/critical on the success state; six catalogs key-identical; zero banned-pattern
  grep hits.
- `student-wizard-contrast.spec.ts` passes unchanged (it drives this exact path under reduced motion),
  plus `051`, `052`, `053`, `dashboard-students`.
- Test hygiene: every student created by a spec is deleted in `finally`
  (`tests/e2e/helpers/student-cleanup.ts`).

## Assumptions
450ms is an authored duration, not a design value — it is the shortest interval at which the pop-in
completes, and it is skipped entirely under reduced motion.

## Evidence
