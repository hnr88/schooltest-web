---
id: 003
title: Make every wizard field mandatory incl. photo + voice_intro uploads
layer: frontend
kind: fix
slice: add-child wizard required fields
target: schooltest-web/src/modules/student-wizard
contract: n/a
status: DONE
depends_on: []
---
## Objective
User: "audio upload video upload they are not optional they are mandatory, everything in
the student add is mandatory." The form has exactly two uploads: photo (image) and
voice_intro (audio) — there is NO video field in the data model (decision D-G-1: the pair
IS what the user means; both become mandatory). All other wizard fields become required too.
## Files
- schemas/student-wizard.schema.ts (lines 52-103: make family_name, email, date_of_birth,
  gender, passport_number, current_school, current_year_level, parent_guardian_email,
  photo, voice_intro required; keep sensible formats; photo/voice_intro: z.number().int().positive())
- components/StepPersonal.tsx / StepEducation.tsx / StepGuardian.tsx / StepMedia.tsx
  (required * markers, remove "optional" copy incl. media.optionalNote en.json:1236)
- components/MediaUpload.tsx + hooks/use-media-field.ts if they special-case optional
- src/i18n/messages/{en,zh,ko,ms,vi,th}.json (new required-error keys under
  StudentWizardSchema incl. photoRequired / voiceIntroRequired; replace optionalNote copy)
- lib/build-student-payload.ts (photo/voice_intro now always set — keep null-tolerance for edit mode)
## Steps
1. Schema: every step's fields required with clear messages.
2. UI: mark fields required, drop optional notes.
3. i18n all 6 catalogs.
## Done criteria
- Final submit with missing audio or missing photo is BLOCKED by validation (never reaches POST).
- Every step field shows required; pnpm tsc --noEmit + pnpm lint clean.
