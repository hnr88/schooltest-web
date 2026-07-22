---
id: 217
title: Rebuild step 4 Photo & voice — the info panel and the two portal dropzones
layer: ui
kind: build
slice: Wizard step 4 empty state — optional-media notice + photo and voice dropzones
target: src/modules/student-wizard/components/StepMedia.tsx, src/modules/student-wizard/components/MediaUpload.tsx, src/modules/student-wizard/components/PortalInfoPanel.tsx, src/i18n/messages/*.json
contract: C-UPLOAD-PARENT (`POST /api/upload`) — unchanged by this task; see below
design: .qa/design/screens/portal--add-child-multi-step.html:92-119, .qa/design/spec/03-portal-forms.md#27-step-4--photo--voice
status: TODO
depends_on: [202, 204]
---

## Objective
Re-skin step 4's empty state to the design: the small info panel, then a two-up grid of dashed
dropzones with the icon well, title, sub and constraint line — while the client-side type/size gate
and the real upload that `052-step-media` proves stay byte-for-byte intact.

## Contract
Transport is unchanged and NOT re-implemented here. `queries/use-upload-media.mutation.ts`:
`POST /api/upload`, multipart, part name `files`, one file, no forced `Content-Type`; response parsed
by `schemas/upload.schema.ts`; the numeric `[0].id` is what lands on the form
(`photo` / `voice_intro`, `z.number().int().positive().nullable().optional()`).
The client gate runs BEFORE any request (`hooks/use-media-field.ts`): wrong MIME prefix →
`invalidType`, over `PHOTO_MAX_BYTES` (15MB) / `VOICE_INTRO_MAX_BYTES` (10MB) → `tooLarge`, and in
both cases **zero network requests** — `052` counts them.

## Design source
`03-portal-forms.md` §2.7 (`portal--add-child-multi-step.html:95-117`).

Info panel (`PortalInfoPanel`, small variant, §1.4):
```
display:flex; align-items:flex-start; gap:10px; background:#F4F6FA;
border-radius:12px; padding:12px 16px; font-size:13px; color:#3D4A5C; line-height:1.5
icon: lucide "info", 15×15, stroke #2563EB, stroke-width 2, flex:none, margin-top:2px
copy: "Both are optional. You can add or replace them later from the student's profile."
```
→ `flex items-start gap-2.5 rounded-tile bg-portal-surface-2 px-4 py-3 text-caption/relaxed
text-portal-fg` with a `size-3.75` aria-hidden `Info` icon in `text-blue-600 mt-0.5`. This replaces
the current `BorderedCallout`. Copy already exists as `StudentWizard.media.optionalNote`.

Dropzone grid: `grid gap-4 sm:grid-cols-2` (16px).

`PortalDropzone` (§2.7):
```
container : border:1.5px dashed #C4CEDC; border-radius:16px; padding:30px 20px;
            text-align:center; cursor:pointer;   :hover -> border-color:#2563EB
icon well : 46×46; border-radius:999px; background:#EEF1F6; grid place-items:center; margin:0 auto 12px
icon      : 20×20; stroke:#0E2350; stroke-width:1.8
title     : 14px / 600 / #0E2350
sub       : 12.5px / #7C8698 / margin-top:3px
limit     : 11.5px / #9AA6B8 / margin-top:8px
```
→ `w-full rounded-panel border-hairline border-dashed border-portal-dash px-5 py-7.5 text-center
transition-colors duration-150 ease-out-expo hover:border-blue-600 focus-visible:ring-2
focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none`; well
`mx-auto mb-3 grid size-11.5 place-items-center rounded-full bg-portal-line`; icon `size-5`
`text-navy-900`; title `text-sm font-semibold text-navy-900`; sub `mt-0.75 text-meta text-body`;
limit `mt-2 text-overline text-muted-foreground` (inks substituted per task 200's policy).

| # | Field label | Icon | Title | Sub | Constraint copy |
|---|---|---|---|---|---|
| 4.1 | `Student photo` | lucide `image` | `Add a photo` | `Drag & drop or click to upload` | `JPG or PNG, up to 15MB.` |
| 4.2 | `Voice introduction` | lucide `mic` | `Add a voice intro` | `Drag & drop or click to upload` | `MP3 or M4A, up to 2 minutes.` |

Every one of those strings already exists (`media.photo.label/dropTitle/helper`, `media.browse`,
`media.voice.*`) — reuse the keys, and reassign `browse` to the "Drag & drop" sub line and `helper` to
the constraint line so the design's three-line stack is honest.

**Truthfulness deviation, recorded**: the design's voice constraint says `MP3 or M4A, up to 2 minutes`.
No duration gate exists anywhere in the code and inventing one is forbidden (D-SCOPE-1 rule 4); the
real gate is `audio/*` ≤10MB. The shipped copy stays the truthful
`MP3 or WAV, up to 10MB.` (`media.voice.helper`). Recorded, not silently swapped.

The dropzone stays a real `<button>` driving a hidden `<input type="file">` (the export's `<div>` has
no file input at all — `03-portal-forms.md` § ACCESSIBILITY GAPS), keeps drag-and-drop, keeps
`disabled` while pending, and keeps `data-dragging` with the blue border.

Motion: 150ms border-colour transitions; pending/preview motion is task 218.

## Files
- `src/modules/student-wizard/components/PortalInfoPanel.tsx` (new — `size: 'sm' | 'lg'`; the lg
  variant is used by task 220's blocked panel and by W9's settings screens)
- `src/modules/student-wizard/components/StepMedia.tsx` — info panel + two-up grid
- `src/modules/student-wizard/components/MediaUpload.tsx` — dropzone skin only
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — only if a value must change (verify first)

## Depends on
202 — the card body rhythm. 204 — the portal field label above each dropzone.

## Steps
1. Build `PortalInfoPanel`; replace `BorderedCallout` in `StepMedia`.
2. Re-skin the `MediaUpload` empty state to the dropzone spec; keep the hidden input, the drag
   handlers, `disabled` and `data-dragging`.
3. Re-check every media string against the design table; record the voice-duration deviation.
4. Run `052` (EN + ZH) first — it is the tightest guard — then the rest.

## Project rules
`.claude/rules/quality.md` (never `<div onClick>`; visible focus; labelled controls) ·
`.claude/rules/tailwind.md` · `.claude/rules/i18n.md` · `.claude/rules/module-pattern.md`
(component ≤120 lines — `MediaUpload` is 103 today) · `CLAUDE.md` §0 law 15 (no unsolicited comments,
but a recorded deviation belongs in the task, and one header line in the component).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright at step 4: the info panel computes `background-color` = `--color-portal-surface-2`,
  `border-radius: 12px`, `padding: 12px 16px`, `font-size: 13px`; each dropzone computes
  `border-style: dashed`, `border-width: 1.5px`, `border-radius: 16px`, `padding: 30px 20px`; each
  icon well computes `46px` square and a full radius; hovering a dropzone resolves
  `--color-blue-600` on the border.
- `052` passes unchanged: `notes.txt` → `invalidType` with `uploadRequests === 0`; a 16MB PNG →
  `tooLarge` with `uploadRequests === 0`; a valid PNG → a real `POST /api/upload` returning 201 with a
  numeric `[0].id`.
- Both dropzones are keyboard-reachable with a visible focus ring and measure ≥44×44.
- Reduced motion: computed `transition-property: none`.
- 375px: the grid stacks; no horizontal scroll.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The design's `MP3 or M4A, up to 2 minutes` is a mock constraint; the truthful gate ships instead and
the difference is recorded rather than implemented as an invented duration check.

## Evidence
