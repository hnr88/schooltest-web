---
id: 052
title: Build the DropzoneCard — dashed 1.5px border, hover-transitioned shell, browse fallback
layer: ui
kind: implement
slice: Dropzone (file drop + browse) — the only card in the export with a hover transition
target: src/modules/design-system/components/dropzone-card.tsx, src/modules/design-system/hooks/useFileDrop.ts, src/modules/design-system/types/media.types.ts, src/modules/design-system/components/showcase/media-section.tsx, tests/e2e/ds-dropzone.spec.ts
contract: n/a (presentation slice — the upload endpoint is wired in W7)
design: .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#6.7
status: TODO
depends_on: [001, 002, 004, 006, 007, 010, 013, 020, 035]
---

## Objective

W7's add-child wizard has a media step. Ship the drop surface here, presentation + interaction
only — the upload call is the wizard's.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §6.7 (`ds--dashboard-components.html:81-85`),
verbatim:

```
background:#FFFFFF; border:1.5px dashed #CBD5E1; border-radius:16px;
padding:26px; display:flex; flex-direction:column; align-items:center;
text-align:center; cursor:pointer;
transition:border-color .15s, background .15s
```
**Hover**: `border-color:#2563EB; background:#FBFCFE` — the only card in the whole export with a
hover transition on its own shell.

- Icon tile: `inline-grid; place-items:center; width:44px; height:44px; border-radius:14px;
  background:#EFF5FF`; 19×19 upload glyph `stroke:#2563EB; stroke-width:2`.
- Title: `font-size:14px; font-weight:600; color:#0E2350; margin-top:12px` — `Import questions`.
- Hint: `font-size:12.5px; color:#94A3B8; margin-top:3px` — `Drop a CSV or DOCX here, or ` +
  inline `browse` at `color:#2563EB; font-weight:600`.

## Design source

Tokens: `bg-card`, dashed `border-input` at 1.5px (W0 `--border-control`), `--radius-2xl` (16px),
padding 26px token; hover `border-primary` + `--color-surface-faint` (`#FBFCFE` — a W0 addition,
the palest surface step); tile `bg-secondary` + `text-primary`, `--radius-xl` (14px), 44px box;
title `--font-size-body-sm` (14px) weight 600 `text-foreground`; hint `--font-size-caption`
(12.5px) `text-muted-foreground` (not `#94A3B8`, which fails 4.5:1 — recorded).

Motion: `transition-[border-color,background-color] duration-150 ease-out-quart` exactly as the
design declares. A **drag-over** state (not in the export) reuses the hover values plus a
`scale-[1.01]` — transform only, 150ms. Reduced-motion from W0.

## Files

- `src/modules/design-system/components/dropzone-card.tsx` — **new**.
- `src/modules/design-system/hooks/useFileDrop.ts` — **new**; owns the drag counter, `accept`
  filtering and the `onFiles` callback. All the logic lives here so the component stays dumb.
- `types/media.types.ts` — `DropzoneCardProps { accept, multiple, maxSizeBytes, onFiles, title,
  hint }`.
- showcase `media-section.tsx`; `tests/e2e/ds-dropzone.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **002** — the hover / disabled interaction colour roles taken from the design's `style-hover`.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **035** — the card shell it deviates from (dashed, hoverable).
- **020** — the `browse` link affordance.

## Steps

1. **Keyboard first**: the surface is a `<label>` wrapping a visually-hidden `<input type="file">`,
   so `Tab` + `Enter` opens the picker. A `<div onClick>` drop zone is an automatic failure
   (`.claude/rules/quality.md`).
2. `useFileDrop` handles `dragenter/dragover/dragleave/drop` with a depth counter so nested
   children do not flicker the state; it calls `preventDefault` on `dragover` only.
3. Rejected files (wrong type, too large) surface through `onFiles`' second argument — the
   component itself renders no error; the wizard decides the message (i18n lives there).
4. `aria-describedby` points at the hint so the accepted formats are announced.
5. i18n title/hint/browse/`aria-label`; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 8 (`'use client'` first line — this holds drag state), law 14, law 15.
- `.claude/rules/module-pattern.md` (drag logic in `hooks/`, never inline in the component;
  component ≤120 lines); `.claude/rules/tailwind.md` (no `border-[1.5px]`, no `bg-[#FBFCFE]`);
  `.claude/rules/quality.md` (keyboard reachable, labelled, visible focus);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-dropzone.spec.ts` asserts on `/design-system`:
  - the shell has `border-style: dashed`, `border-width: 1.5px`, 16px radius, 26px padding;
  - hovering transitions `border-color` to `--color-primary` and `background-color` to the faint
    surface over 150ms;
  - `Tab` reaches the file input and it has an accessible name;
  - `setInputFiles` with a valid file calls the handler (assert the showcase renders the file
    name), and with an oversized/wrong-type file the handler receives it in the rejected list;
  - a simulated `dragenter` sets the drag-over state and `dragleave` on a **child** element does
    not clear it (depth counter proven).
- Motion 150ms; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the tile and copy stay centred with no overflow; 1280px unchanged.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- The drag-over visual reuses the hover values (the export defines no drag state).
- No upload happens here — the endpoint is W7's, and this component never calls the network.

## Evidence
