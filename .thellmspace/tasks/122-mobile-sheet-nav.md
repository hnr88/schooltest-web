---
id: 122
title: Mobile nav Sheet — the detached rail's contents inside the 288px off-canvas panel at 375px
layer: ui
kind: build
slice: The <768px navigation surface: the Sheet's panel skin, its contents, and its open/close behaviour
target: src/modules/shell/components/AppSidebar.tsx, src/modules/shell/components/SidebarUserCard.tsx
contract: n/a — pure presentation + preserved nav behaviour; design spec quoted below
design: .qa/design/screens/portal--detached-sidebar.html:2-31, .qa/design/spec/01-portal-dashboard.md#9-responsive-hints-present-in-the-markup
status: TODO
depends_on: ["115", "117"]
---

## Objective

Make the mobile Sheet carry the SAME re-skinned rail the desktop card now carries — logo, two
labelled groups, the four nav items with their new geometry and navy active slab, and the account
card with Sign out — inside the vendored primitive's mobile branch, whose width and padding the
caller cannot style.

## Contract

n/a. The design has **zero `@media` queries** (`01-portal-dashboard.md` §9: "All adaptivity is
intrinsic") and no mobile navigation drawing at all, so the panel's own frame is the app's
(existing, working) Sheet; only its CONTENTS are the design's.

**PRESERVED BEHAVIOUR — `shell.spec.ts`'s mobile describe asserts all of it:**
`[data-slot="sidebar"]` is hidden at 375; the button named `Shell.topbar.toggleNav` is visible and
opens `page.getByRole('dialog')`; the dialog contains all 4 links with their exact catalog labels
AND their exact hrefs; `Escape` closes it. Additionally `setOpenMobile(false)` must still fire on
link click (`onNavigate`), so tapping a destination closes the drawer.

## Design source

The vendored mobile branch (`src/components/ui/sidebar.tsx:177-200`, READ-ONLY) is a hard
constraint that must be written down, not discovered by the builder:

- On mobile the primitive renders `<Sheet>{...props}</Sheet>` → `<SheetContent … className="w-(--sidebar-width) bg-sidebar p-0 …">`
  and **drops `Sidebar`'s `className` entirely**, forcing `--sidebar-width: 18rem` (**288px**).
  So: no caller class reaches the mobile panel. Every mobile visual comes from the CHILDREN
  (`SidebarHeader` / `SidebarContent` / `SidebarFooter`), which do receive their classNames.
- The panel's own accessible name is a hard-coded English `<SheetTitle>Sidebar</SheetTitle>`
  (sr-only) inside the vendored file. It cannot be localized from a caller and Law 11 forbids
  editing the file. **Record it as a documented vendored-primitive gap** in the same style as
  `TABLE_SCROLL_EXEMPTION` in `tests/e2e/shell-a11y.spec.ts` — logged loudly with the exact reason,
  never silently dropped, never faked, never "fixed" by editing `ui/`.

Contents spec (identical to the desktop card, all already built by 112-117):

| Element | Value |
|---|---|
| padding | `pt-7 px-4 pb-4` on header/content/footer (design's `28px 16px 16px`) |
| logo | 26px lockup, `mx-3 mb-9` — the collapsed `mark` variant must NOT appear (the Sheet is never "collapsed"; `group-data-[collapsible=icon]` never matches inside it — verify, do not assume) |
| group overlines | `text-micro font-semibold tracking-rail text-muted-foreground uppercase px-3.5 pb-2` |
| nav items | `gap-3 px-3.5 py-2.75 rounded-tile text-lede`, idle `font-medium text-sidebar-foreground`, active `bg-navy-900 text-sidebar-primary-foreground font-semibold` |
| spacer | `flex-1` pushes the Account group + user card to the bottom of the 100svh panel |
| user card | `bg-rail-card rounded-panel py-3 px-3.5 gap-2.75 mt-3.5`, with the working Sign out |

Motion: the Sheet's enter/exit comes from the vendored `SheetContent`'s `data-state` animations
(`tw-animate-css`, ~200ms slide + fade). Add nothing that fights it. `motion-reduce:animate-none`
must apply — verify by reading the computed `animation-name` under `emulateMedia`, and if the
vendored classes do not honour reduced motion, add the override on the shell's own children only
and record the gap.

375px composition: panel 288px of a 375px viewport leaves a 87px scrim — tapping it closes the
Sheet (vendored overlay behaviour, verify). The rail's contents must not scroll horizontally inside
288px: the nav item's `min-w-0 truncate` label handles the longest catalog label in all six locales.

## Files

- `src/modules/shell/components/AppSidebar.tsx` — only if a class needs a mobile-safe variant
  (e.g. removing a `group-data-[collapsible=icon]:*` assumption that misfires inside the Sheet).
- `src/modules/shell/components/SidebarUserCard.tsx` — same.
- `tests/e2e/shell.spec.ts` — extend the existing mobile test; do not add a file.

## Depends on

- **115** — the nav items' final active/idle skin must exist before it can be asserted inside the Sheet.
- **117** — the user card must exist before Sign-out-from-mobile can be proven.

## Steps

1. Open the app at 375 and step through the real Sheet; note every class that misbehaves because
   `group-data-[collapsible=icon]` or `max-md:hidden` was written for the desktop branch.
2. Fix only those; keep every desktop class intact.
3. `pnpm tsc --noEmit && pnpm lint`.
4. Extend `shell.spec.ts`'s mobile test with: the panel computes `width: 288px`; both group
   overlines are visible; the active item inside the Sheet computes `rgb(14, 35, 80)`; the user
   card is visible and its Sign out clears the token and lands on `/sign-in`; the scrim click
   closes the Sheet (in addition to the existing `Escape` leg).
5. Add the localization gap to `shell-a11y.spec.ts` as a named, logged constant with its reason —
   mirroring `TABLE_SCROLL_EXEMPTION`'s treatment.

## Project rules

- `CLAUDE.md` §0 law 11 — never edit `src/components/ui/sidebar.tsx` or `sheet.tsx`; the mobile
  panel's width/padding/title are theirs and stay theirs.
- `.claude/rules/quality.md` — modals trap focus and close on Escape (123 proves the trap);
  ≥44px targets; AA contrast on every state.
- `.claude/rules/i18n.md` — every visible string in the Sheet comes from the catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts tests/e2e/dashboard.spec.ts`
  green — the pre-existing mobile legs (hidden aside, 4 links + hrefs, Escape) untouched and passing.
- **Session proof from mobile:** Sign out inside the Sheet at 375 → `/sign-in`, token `null`,
  and a reload of `/dashboard` still redirects (the cleared session survives the reload).
- Tapping a nav link inside the Sheet navigates AND closes the drawer (assert the dialog is hidden
  after the click).
- New legs pass (288px panel, overlines, navy active, scrim close).
- Motion: the panel's `animation-name` is non-`none` on open and `none` under
  `emulateMedia({ reducedMotion: 'reduce' })`.
- No horizontal scroll at 375 with the Sheet open, in `en` AND in `zh` (the longest-label locale
  check the suite already uses elsewhere).
- axe serious/critical = 0 at 375 closed AND Sheet-open (the existing `shell-a11y.spec.ts` legs).
- Screenshots refreshed: `.qa/screenshots/shell-mobile.png`, `shell-mobile-sheet-open.png`.
- No new strings → six catalogs unchanged (the account-role key came with 117).

## Assumptions

- The primitive's 288px mobile width is kept rather than forced to the design's 248px: the design
  has no mobile drawing, 288px is the shadcn default the app already ships and the existing spec
  passes against, and overriding it is impossible from a caller anyway.

## Evidence

_(filled in as the task runs, including the verbatim reason recorded for the vendored SheetTitle gap)_
