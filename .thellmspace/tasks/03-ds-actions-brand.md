---
id: 03
title: design-system module — actions & brand (Button, Badge, Tag, Logo, layout)
layer: ui
kind: build
slice: Button/Badge/StatusBadge/Tag/CountBadge/Logo/Eyebrow/Container/Section wrappers
target: src/modules/design-system/{components,types,index.ts}
contract: C-DS
status: TODO
depends_on: [01]
---
## Objective
Create `src/modules/design-system/` and implement the actions+brand group from the C-DS
contract: `Button` (extended variants + loading), `Badge` (extended variants),
`StatusBadge`, `Tag` (client, removable), `CountBadge`, `Logo`, `Eyebrow`, `Container`,
`Section`. Wrappers over the read-only ui primitives — never edit `src/components/ui/*`.

## Contract (C-DS entries — read .qa/CONTRACTS.md first)
- Button variants: default | navy | accent | secondary | outline | ghost | destructive |
  link | white | outline-white. Sizes: all ui sizes + `xl` (h-12 px-7 rounded-xl text-[15px]).
  `loading?: boolean` → ui Spinner + disabled + aria-busy.
  Variant styles (spec): navy = bg-navy-900 text-white hover:bg-navy-800; accent =
  bg-accent text-accent-foreground hover:bg-teal-600; white = bg-white text-navy-900
  hover:bg-blue-50; outline-white = border-white/40 bg-transparent text-white
  hover:bg-white/10 (for navy panels). Implement via a local cva that composes
  `buttonVariants` from ui/button with the extra variants (cn() merge).
- Badge variants: default | secondary | navy | accent | success | warning | error |
  outline | ghost | link. success = bg-green-100 text-green-800 (use token-based:
  bg-success/10 text-success or spec tints #DCFCE7/#15803D → add matching utilities with
  existing Tailwind palette classes e.g. bg-green-100 text-green-800, dark:bg-green-950
  dark:text-green-300 — keep OKLCH rule by relying on Tailwind's built-in palette which is
  OKLCH in v4); warning = amber-100/amber-800; error = red-100/red-800; navy =
  bg-navy-900 text-white; accent = bg-teal-100 text-teal-700 (dark: teal-950/teal-300).
- StatusBadge: status live|scheduled|draft → colored dot + label (live=green-600,
  scheduled=amber-600, draft=slate-400; text slate-600 dark:slate-300).
- Tag: 'use client'; rounded-full secondary-styled chip with X remove button;
  props label, onRemove, ariaLabel for the remove button via prop `removeLabel?: string`.
- CountBadge: destructive circle, min-w-5 h-5 px-1, text-[11px] font-bold.
- Logo: next/image from /brand/logo.png (503×160) or /brand/logo-mark.png (179×119);
  variant lockup|mark; theme color|white (white adds `brightness-0 invert` filter classes);
  required alt; height prop (default 30 for lockup, 32 for mark), width auto from aspect.
- Eyebrow: `<p>` uppercase tracking-[0.1em] text-xs font-bold; tone blue → text-blue-600,
  teal → text-teal-600.
- Container: div mx-auto w-full max-w-[1200px] px-6; Section: `<section>` with
  py-16 sm:py-20 + optional id, className merge. (max-w-[1200px] is a design-token value —
  add `--breakpoint`/container token? Tailwind v4: add `--container-landing: 1200px` in
  globals.css @theme so class is `max-w-landing`. Do that — no arbitrary values rule.)

## Files
- CREATE src/modules/design-system/components/{button,badge,status-badge,tag,count-badge,logo,eyebrow,layout}.tsx
- CREATE src/modules/design-system/types/design-system.types.ts (shared prop types that are
  imported by more than one component; single-component cva VariantProps may co-locate)
- CREATE src/modules/design-system/index.ts (barrel — ONLY new exports for now; re-exports
  land in tasks 04–06)
- EDIT src/app/globals.css — add `--container-landing: 1200px` to @theme (one line).

## Steps
1. Read ui/button.tsx + ui/badge.tsx (already read: button uses cva + Base UI Button,
   exports buttonVariants; badge exports badgeVariants) — compose, don't duplicate base
   classes.
2. Implement components per contract; every component takes className and cn()-merges.
3. Barrel exports. 4. tsc+lint zero errors.

## Project rules
schooltest-web: module-pattern (barrel, file placement, dumb components), tailwind.md
(no arbitrary values; tokens), imports.md (@/ alias; same-module relative imports allowed),
CLAUDE.md naming (PascalCase files? — components PascalCase per naming table; kebab for
utilities; match ui/* which is kebab-case files with PascalCase exports — follow ui/*
convention: kebab file names, PascalCase components).

## Done criteria
- All 9 exports exist, typed (no any), className-merge works, variants exactly as contract.
- Button renders ui Spinner when loading and is disabled; Tag calls onRemove; Logo uses
  next/image with correct intrinsic dims.
- tsc+lint zero errors. Files ≤200 lines each; components ≤120.
- Verifier: fresh tsc+lint run; grep for banned patterns (no hex, no any, no ui/* edits via
  git diff --stat); render-check deferred to task 07 showcase + e2e.

## Assumptions
- Tailwind built-in palette (green/amber/slate/red) is OKLCH in v4 → allowed for status tints.
## Evidence
(filled by builder/verifier)
