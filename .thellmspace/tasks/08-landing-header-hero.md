---
id: 08
title: Landing — announcement bar, header (+mobile nav), hero, flow, trusted-by
layer: ui
kind: build
slice: landing sections 1–5 as separate server components
target: src/modules/landing/components/{AnnouncementBar,LandingHeader,MobileNav,HeroSection,HeroFlow,TrustedByStrip}.tsx
contract: C-PAGE-LANDING
status: TODO
depends_on: [01, 02, 03]
---
## Objective
Build landing sections 1–5 from the spec (Landing.dc.html) as SEPARATE server components in
the existing `src/modules/landing/`, replacing the old LandingHeader/LandingHero. All copy
from `Home.*` keys (task 02). Uses design-system barrel (Logo, Button, Badge, Container).

## Contract (C-PAGE-LANDING 1–5; copy keys in en.json Home.*)
1. AnnouncementBar: navy-900 bg, white text-sm, centered flex; message + link (font-semibold
   underline-offset hover) → `#ai-feedback`.
2. LandingHeader: sticky top-0 z-50, bg-background/88 backdrop-blur, border-b border-border;
   Container row: Logo lockup (alt footer.logoAlt), desktop nav (hidden lg:flex, 4 anchor
   links: #product/#for-schools/#pricing/#resources, text-sm font-medium
   text-muted-foreground hover:text-foreground), right: Sign in ghost → `#cta` + Start free
   default Button → `#pricing`. Skip-to-content link (sr-only focus:not-sr-only) →
   `#main-content`. Mobile (<lg): MobileNav client component — icon button (Menu, aria-label
   nav.openMenu) opening ui Sheet with the 4 anchors + Sign in + Start free (SheetClose on
   click); close label nav.closeMenu.
3. HeroSection: `<main id="main-content">` starts here. Section padding; navy rounded-4xl
   (rounded-[32px] → use rounded-4xl token) card, overflow-hidden, relative, min-h-[600px]:
   next/image fill hero-field.webp (alt hero.imageAlt, priority, cover) + navy gradient
   scrim overlay (bg-gradient-to-r from-navy-950/90 via-navy-900/70 to-navy-900/40);
   content: Badge-like pill (bg-white/10 text-white ring-1 ring-white/20) hero.badge;
   h1 text-white text-display font-bold t.rich('hero.title', {br: () => <br/>});
   subtitle text-blue-100/90 text-lg max-w-xl; CTA row: primary white Button xl → `#pricing`
   (ArrowRight), secondary outline-white xl → `#product` (Play); microcopy text-sm
   text-blue-100/80.
4. HeroFlow: inside the same navy card BELOW hero content (border-t border-white/10):
   h2 t.rich flow.title with blue→text-blue-500? On navy: blue span text-blue-100? Spec:
   blue span #3B82F6-ish on navy → text-blue-500? readable: blue span `text-blue-100`? NO —
   spec says blue span (blue-500 #3B82F6) and teal span (#14B8A6) on navy → use text-blue-500
   and text-teal-500? On navy-900 bg, blue-500 (#3B82F6) contrast ~4.5+ ok, teal-500 ok.
   Use text-blue-500 / text-teal-500, rest text-white. 3 steps row (numbered 1-3 in
   white/10 rounded-full squares, text white, ArrowRight between, hidden on mobile → column).
5. TrustedByStrip: below hero card, py-10; label uppercase tracking-widest text-xs
   font-semibold text-muted-foreground + 5 wordmarks text-slate-400? token: text-muted-
   foreground/70 font-semibold text-lg; flex wrap gap-8 justify-center.

## Files
- CREATE the 6 components above + EDIT src/modules/landing/index.ts (export new ones; REMOVE
  old LandingHeader/LandingHero/AssessmentPreview/SkillProgress exports and DELETE those 4
  files + types/landing.types.ts if unused — the old hero is replaced; page.tsx updated in
  task 12, so ALSO update src/app/page.tsx NOW to render the new sections completed so far
  (AnnouncementBar, LandingHeader, HeroSection+HeroFlow, TrustedByStrip) so the page never
  breaks mid-build).
- MobileNav is 'use client' (line 1) — Sheet from design-system barrel? Sheet is NOT in the
  re-export list — add Sheet family to the barrel in this task (read ui/sheet.tsx exports).

## Steps
1. Read en.json Home.* for exact keys; read ui/sheet.tsx. 2. Add Sheet re-export to
   design-system barrel. 3. Build components (server by default; MobileNav client).
4. Rewire landing/index.ts + page.tsx (interim composition). 5. tsc+lint zero errors.

## Project rules
i18n.md (zero hardcoded strings incl. aria labels/alt), nextjs-patterns (async server
components, getTranslations), tailwind.md (tokens, no arbitrary values: min-h-[600px] →
use min-h-150 (Tailwind v4 spacing scale = 4pt → 150*4=600px OK)), quality.md (one h1,
next/image priority for LCP, semantic landmarks), imports.md.

## Done criteria
- 6 components exist, page.tsx renders them, old hero/header files deleted, barrel updated.
- Every string traced to a Home.* key (grep for hardcoded JSX text → none).
- tsc+lint zero errors. Verifier: read each file vs contract; verify page composition; run
  tsc/lint; confirm old files gone and interim page compiles.
## Assumptions
- Sections 6–13 land in tasks 09–11; interim page = sections 1–5 only (fine).
- HeroFlow lives inside HeroSection's card as a child component (separate file, composed).
## Evidence
(filled by builder/verifier)
