---
id: 218
title: Author step 4's uploading, uploaded-preview and remove states in the portal dialect
layer: ui
kind: build
slice: Wizard step 4 filled states — spinner, photo thumbnail, audio player, remove control
target: src/modules/student-wizard/components/MediaPreview.tsx, src/modules/student-wizard/components/MediaUpload.tsx, src/i18n/messages/*.json
contract: C-UPLOAD-PARENT (`POST /api/upload`) — unchanged; the store/field wiring below is preserved
design: .qa/design/spec/03-portal-forms.md#unknowns (item 5), .qa/design/screens/portal--add-child-multi-step.html:100-117
status: TODO
depends_on: [217]
---

## Objective
`03-portal-forms.md` § UNKNOWNS 5 is explicit: "No uploaded-photo state, no audio-recorded state, no
progress indicator, no preview, no replace/remove control. Only the empty dropzone is drawn." Those
states exist and are proven today (`052-step-media`), so this task authors them in the portal dialect
instead of letting the re-skin regress them.

## Contract
Transport unchanged. Preserved wiring (`hooks/use-media-field.ts`, `stores/use-wizard-media-store.ts`):
upload runs on selection; on success the `UploadedMedia` (`{ id, url, name, mime }`) goes into the
wizard media store keyed `photo` / `voice_intro` AND the numeric id onto the RHF field; `remove()`
clears the store entry and sets the field to `null` with **no server delete** (contract); the preview
`url` is absolutized by `lib/media-url.ts` against the API origin, and `052` asserts that URL serves
`200` and contains `/uploads/`.

## Design source
No design source for these states — authored, and recorded as such. Built only from values the design
does define:
- container: the same `rounded-panel` (16px) footprint as the dropzone it replaces, `border-hairline
  border-portal-input bg-card` (the solid sibling of the dashed empty state) with `overflow-hidden`,
  so swapping states never shifts the grid.
- photo: `next/image` `unoptimized` (the API origin is not in `images.remotePatterns` — the existing
  comment), `h-44 w-full object-cover`.
- audio: file name `truncate text-meta text-body` over a native `<audio controls>` at `w-full`.
- remove control: the portal ghost button (§1.4 `PortalGhostButton`) — `rounded-full border-hairline
  border-portal-input bg-card px-4.5 py-2.5 text-caption font-semibold text-navy-900
  transition-colors duration-150 ease-out-expo hover:border-navy-900
  motion-reduce:transition-none` — positioned `absolute right-2 top-2`, accessible name
  `StudentWizard.media.remove` (the exact name `052` clicks), pointer target ≥44×44 via the `after:`
  expansion.
- uploading: the dropzone stays in place, `disabled`, its icon well swapped for a `Loader2` at
  `animate-spin` (the design system's `st-spin`, 700ms linear — `04-ds-foundations.md` §I) and its
  title swapped to `StudentWizard.media.uploading`. No fake progress bar: the upload is a single
  request with no progress events, and inventing a percentage is forbidden.
- error line: task 207's message treatment, reused verbatim.

Motion: preview enters with `animate-in fade-in zoom-in-95 duration-200 ease-out-expo
motion-reduce:animate-none`; the spinner is `animate-spin` with `motion-reduce:animate-none` (a
reduced-motion user gets the static icon plus the `uploading` label, never a silent state).

## Files
- `src/modules/student-wizard/components/MediaPreview.tsx`
- `src/modules/student-wizard/components/MediaUpload.tsx` — pending branch
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — reuse `media.uploading` / `media.remove`; add nothing
  unless a new string is genuinely required

## Depends on
217 — the empty dropzone this state replaces and the container geometry it must match.

## Steps
1. Re-skin `MediaPreview` (photo + audio) and the remove control.
2. Re-skin the pending branch inside `MediaUpload`.
3. Run `052` (EN + ZH) — upload, preview, URL fetch, remove, voice — then the rest.

## Project rules
`.claude/rules/quality.md` (`next/image` with width/height; accessible name on the remove control;
44px) · `.claude/rules/tailwind.md` (animate transform/opacity only) · `.claude/rules/i18n.md` ·
`.claude/rules/state-data.md` (mutation state stays in the query hook, not the component).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: uploading a real 1px PNG fires one `POST /api/upload` → 201; the preview `<img>` appears
  with `alt` = `media.photo.previewAlt`, its `src` contains `/uploads/` and fetches `200`; the remove
  button's accessible name is `media.remove` and it measures ≥44×44.
- Clicking remove restores the dropzone (`media.photo.dropTitle` visible), clears the RHF value (no
  `photo` id in the later submit body) and issues no DELETE request.
- The voice field accepts a real `.wav` and renders an `<audio>` element — `052`'s assertion.
- While pending, the zone is `disabled` and the spinner element reports a running `animation-name`;
  under reduced motion it reports `none` while the `uploading` label is still visible.
- Preview and dropzone containers compute the same width and radius (no layout shift on state change).
- axe zero serious/critical in both states; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
No upload progress percentage is invented (the mutation exposes none). No server-side delete is added
on remove — the contract says the uploaded file is simply detached from the form.

## Evidence
