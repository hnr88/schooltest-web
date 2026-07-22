---
id: 323
title: UI sweep the add-child wizard and edit mode — every field, step, upload and submit at 375 and 1280
layer: ui
kind: verify
slice: `/[locale]/dashboard/children/new` and `/[locale]/dashboard/children/[documentId]/edit`
target: src/modules/student-wizard/** (WizardScreen, WizardStepper, StepPersonal/Education/Guardian/Media/Review, WizardNav, MediaUpload), new spec tests/e2e/sweep-add-child-wizard.spec.ts
contract: n/a for presentation; the wizard writes through `POST /api/upload`, `POST /api/students`, `PUT /api/students/:documentId`
design: .qa/design/screens/portal--add-child-multi-step.html, .qa/design/spec/03-portal-forms.md#2-add-child-wizard-portal
status: TODO
depends_on: ["320"]
---

## Objective

Sweep every control in the five-step add-child wizard and its edit mode at 375px and 1280px:
every field renders and is enabled, validation fires on the client with the same Zod schema the
server uses, the media upload really uploads, the submit really inserts a `students` row that
survives a reload, and every error path (400 payload, 400 media, 403, 429) is honest.

## Contract

Quoted from `.qa/intake/api-inventory.md`:

**`POST /api/students` (#4)** — grant `api::student.student.create`; the controller **deletes**
`parent, teacher, class, user, student_key, status` before validation and injects
`parent: caller.documentId` + `status: 'active'` **after** `sanitizeInput`, so a client-sent
`status`/`parent` is inert. Required fields: `given_name` (1..100), `nationality` (1..100),
`target_entry_year` (4-digit string, 2000 ≤ y ≤ currentYear+10), `target_entry_term` (1..50),
`parent_guardian_name` (1..200), `parent_guardian_phone` (1..50). Optional: `family_name`,
`year_level` int 7..12, `email`, `date_of_birth` `YYYY-MM-DD` (real date, not future, year ≥1900),
`gender` ∈ `male|female|other|prefer_not_to_say`, `passport_number` ≤50, `current_school` ≤255,
`current_year_level` ∈ the 13-value enum `Prep, Year 1 … Year 12`, `parent_guardian_email`,
`parent_guardian_wechat` ≤100, `preferred_contact_channel` ∈ `whatsapp|wechat|email|sms`,
`photo`/`voice_intro` positive int (upload numeric id) or `null`.
Success **200** (parent path) `{ data: { …sanitized row…, parent: { documentId } }, meta: {} }`.
Errors: `400 ValidationError "invalid student payload"` (+ `details.fields[]`/`details.issues[]`),
`400 ValidationError "invalid student media"`, `403 ForbiddenError "Forbidden"`, `429`.
**DB effect:** INSERT `students` (parent FK = caller, `status='active'`), `files_related_mph`
rows when media ids are present, **plus** a `notifications` row (`student_created`, category
`children`).

**`POST /api/upload` (#26)** — stock upload plugin, multipart, part name `files`; success **201**
with a bare JSON **array** of file objects (no `data`/`meta`). The mime/size gate is **not** here
— it is `parent-media.ts` on the student write: `image/*` ≤ 15360 KB for `photo`,
`audio/*` ≤ 10240 KB for `voice_intro`.

**`PUT /api/students/:documentId` (#5)** — the create schema `.partial()`; `undefined` keys are
dropped so absent fields stay unchanged; an explicit `null` on `photo`/`voice_intro` CLEARS.
Ownership: missing ⇒ **404** `"Student <id> not found"`; owner mismatch ⇒ **403**
`ForbiddenError "You do not own this student"`.

## Design source

`.qa/design/screens/portal--add-child-multi-step.html`, digested in
`.qa/design/spec/03-portal-forms.md#2`:

- **Step rail** (left column, **230px** wide, `03-portal-forms.md#2.2`): each step row is
  `display:flex; gap:14px; cursor:pointer` and **every step is directly clickable** (the rail is
  free navigation). Dot states:
  | state | dot | dotBg | dotFg | dotBorder | connector | title colour | title weight |
  |---|---|---|---|---|---|---|---|
  | done (`n < step`) | `✓` | `#0E2350` → `--color-navy-900` | `#FFFFFF` → `--color-primary-foreground` | `#0E2350` | `#0E2350` | `#3D4A5C` → `--color-body` | 500 |
  | current (`n === step`) | `String(n)` | `#0E2350` | `#FFFFFF` | `#0E2350` | `#E4E9F2` → `--color-rule` | `#0E2350` | 600 |
  | upcoming (`n > step`) | `String(n)` | `#FFFFFF` | `#9AA6B8` → `--color-muted-foreground-soft` | `#D8DFEA` → `--color-input` | `#E4E9F2` | `#9AA6B8` | 500 |
  Step 5 has no trailing connector (`lineDisplay: none`).
- **Step card**: body `display:flex; flex-direction:column; gap:22px` (step 5 `gap:24px`).
  Headings/subs verbatim: `Personal details` / `Step 1 of 5 · Who the student is`;
  `Education` / `Step 2 of 5 · Current schooling and target entry`;
  `Parent or guardian` / `Step 3 of 5 · Who we contact about results and enrolment`;
  `Photo & voice` / `Step 4 of 5 · Optional photo and voice introduction`;
  step 5 sub `Step 5 of 5 · You can change any of this later in the student's profile.`
  **Every one of these is an i18n key, never a literal in TSX.**
- **Nav row** (`#2.9`): `← Back` — `background:transparent; border:none; font-size:14px;
  font-weight:600; padding:12px 10px`, colour `#3D4A5C` when `step > 1` and `#9AA6B8` at step 1;
  **never disabled**. Step counter `font-size:12.5px; color:#9AA6B8`, literal `Step {n} of 5`.
  Next button label `Continue` for steps 1-4, `Confirm & add child` for step 5.
- Input (`04-ds-foundations.md#5`): `padding:10px 13px; border-radius:10px; border:1px solid
  #CBD5E1` → `--color-input`; `font-size:14px; color:#0E2350`;
  `transition: border-color .15s, box-shadow .15s`; focus
  `border-color:#2563EB` → `--color-primary` + `box-shadow: 0 0 0 3px rgba(37,99,235,.16)`;
  error `border:1px solid #DC2626` → `--color-destructive` + `box-shadow: 0 0 0 3px rgba(220,38,38,.10)`.
- **Design↔rule conflict, recorded:** `03-portal-forms.md:463` — "No client-side validation gate
  is present in the design; `stepNext` advances unconditionally." The app's existing behaviour
  (`STEP_FIELDS` + `createStudentWizardSchema`, react-hook-form + zodResolver) **is preserved**
  per D-SCOPE-3; the design's gate-less rail navigation is kept for backwards steps only.
- Motion: step transition is an `opacity` + `translateX(8px)` enter, 180ms `--ease-out-quart`
  (`st-fade-in`); the submit button's loading spinner is `st-spin` 700ms linear infinite; the
  success state uses `st-pop-in` 180ms. All with a `prefers-reduced-motion: reduce` variant at
  `0.01ms` (the spinner keeps rotating but at a reduced-motion-safe opacity pulse only if the
  reduced-motion variant is set — otherwise it is replaced by a static "Saving…" label).

## Files

- `tests/e2e/sweep-add-child-wizard.spec.ts` (new)
- Fix-in-place authority: `src/modules/student-wizard/components/**`,
  `src/modules/student-wizard/hooks/**`, `src/modules/student-wizard/schemas/**`,
  `src/modules/student-wizard/queries/**`, `src/modules/children/components/EditStudentScreen.tsx`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` if a string is missing
- Never `src/components/ui/**`

## Depends on

- **320** — the shell wraps both routes.
- Wave gate (prose): **all of W7 (Add-child wizard, ids 200-225)** must be DONE.

## Steps

1. Log in with `loginAsParent`, open `/dashboard/children/new` at 1280×800.
2. Assert the rail renders 5 rows with the dot/colour/weight state table above read from the
   real computed styles, that every row is clickable, and that clicking a **completed** row
   moves back without losing entered values.
3. Step 1-3: for every field named in the create contract, assert it renders, is enabled, is
   labelled (`getByLabel` succeeds — proves a real `<label for>`), accepts input, and that
   submitting an invalid value shows the translated inline error and **fires no network call**
   (`page.route` counter stays 0). Cover at least: empty `given_name`, empty `nationality`,
   `target_entry_year` out of range, `year_level` outside 7..12, a future `date_of_birth`,
   and a malformed `parent_guardian_phone`.
4. Step 4 (media): assert the client gate rejects an oversize/wrong-mime file with a translated
   message and no upload request; then upload a real small PNG and assert
   `POST /api/upload` returns **201** with an array whose `[0].id` is a positive integer, and
   that the preview renders that file's absolute URL (`toAbsoluteStrapiMediaUrl`). Assert the
   remove control clears it and a re-upload works.
5. Step 5 (review): assert every value entered in steps 1-4 is echoed, then click
   `Confirm & add child`. Assert `POST /api/students` → **200**, the response `data.parent.
   documentId` equals the signed-in parent, and the app navigates to the roster with the new
   child visible.
6. **Persistence proof:** reload `/dashboard/children`, assert the child is still listed, then
   read the row directly with `runSql` from `tests/e2e/helpers/auth-db.ts`:
   `select given_name, status from students where document_id = '<documentId>'` → the entered
   name and `active`. Also assert one `notifications` row exists with
   `event_type = 'student_created'`. Delete the fixture at the end with
   `tests/e2e/helpers/student-cleanup.ts`.
7. Error paths, each asserted with a real refusal: (a) intercept `POST /api/students` with the
   real `400 "invalid student payload"` envelope and assert the field-level translated errors
   map back onto the right steps; (b) same for `400 "invalid student media"`;
   (c) `403 Forbidden`; (d) `429` with `Retry-After` → assert a translated rate-limit surface,
   never a raw Strapi message and never a silent swallow. `watchErrors(page)` stays empty.
8. Edit mode: open `/dashboard/children/<documentId>/edit`, assert the form is prefilled from
   the real `GET /api/my/students/:documentId` (and that `passport_number` is **empty**, being
   `private: true` and stripped by `sanitizeOutput`). Change one field, save, assert
   `PUT /api/students/:documentId` → **200**, reload and assert the change persisted, and prove
   it with a direct SQL read.
9. Repeat 2-5 and 8 at **375×812**: the 230px rail collapses to a horizontal/compact stepper,
   no horizontal scroll (`scrollWidth <= 376`), every control ≥44×44, the file input is
   reachable by keyboard, and the sticky nav row does not cover the last field.
10. Motion: measure the step-transition duration (150-200ms) and re-measure under
    `page.emulateMedia({ reducedMotion: 'reduce' })` (`<= 0.02s`) with the final step fully
    opaque and untranslated.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 7, 8, 9, 11, 12, 14; §5 pitfalls 10, 11, 15, 16, 17.
- `.claude/rules/state-data.md` — `useForm` + `zodResolver` always, schema in `schemas/`,
  shadcn `Form*` components, always `defaultValues`, the same Zod schema validates client and
  server; mutations live in `queries/*.mutation.ts` and must invalidate the roster query.
- `.claude/rules/module-pattern.md` — components dumb (no >3 `useState`, no business logic);
  200/120-line caps.
- `.claude/rules/quality.md` — every input labelled; `next/image` for the preview.
- `.claude/rules/tailwind.md`, `.claude/rules/i18n.md`, `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sweep-add-child-wizard.spec.ts` passes at 375×812 and
  1280×800.
- A **real child row** is created through the real UI, proven by a `200` from
  `POST /api/students`, a visible roster entry after a full reload, and a direct
  `select … from students where document_id = …` read; the accompanying `student_created`
  notification row is asserted; the fixture is cleaned up.
- A **real media file** is uploaded (`POST /api/upload` → 201, positive integer id) and the
  preview renders it; the client size/mime gate is proven to refuse before any request.
- Edit mode round-trip proven with a `PUT` 200 + reload + SQL read.
- All four error paths (400 payload, 400 media, 403, 429) asserted with translated surfaces and
  no raw Strapi message leak; `watchErrors(page)` empty.
- Every field asserted labelled and keyboard-operable; the rail's three dot states asserted from
  real computed styles.
- No horizontal scroll at 375; every control ≥44×44.
- Motion 150-200ms measured; `<= 0.02s` under `reducedMotion: 'reduce'`.
- All six locale catalogs key-identical if any string changed.
- Zero banned-pattern grep hits; no hardcoded option array standing in for `COUNTRY_CODES` /
  `YEAR_LEVEL_VALUES` / `TERM_VALUES` (those constants already exist in
  `src/modules/student-wizard/constants/`).

## Assumptions

- A small real PNG and a small real audio file are available as e2e fixtures (or are generated
  in-test as buffers); no binary is committed that is not needed.
- `SEED=false` in `schooltest-api/.env` stays as-is (root `.qa` D-INT-11) — this task creates
  its fixture through the real API, never through a seed run.

## Evidence

<!-- filled in as the task runs -->
