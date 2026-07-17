---
id: 11
title: Landing — CTA panel + footer (with LocaleSwitcher)
layer: ui
kind: build
slice: landing sections 12–13
target: src/modules/landing/components/{CtaSection,LandingFooter}.tsx
contract: C-PAGE-LANDING
status: TODO
depends_on: [01, 02, 03, 06]
---
## Objective
Build the final two landing sections: the navy gradient CTA panel and the full footer with
link columns, socials, language switcher, and bottom bar. All copy from Home.* keys.

## Contract (C-PAGE-LANDING 12–13; link policy = DECISIONS.md D7)
12. CtaSection id=`cta`: Container; relative overflow-hidden rounded-4xl p-10 sm:p-16,
    gradient bg `bg-[linear-gradient(...)]` — NO arbitrary values: add a token in globals.css
    (`--background-image-cta-gradient: linear-gradient(135deg, var(--navy-900) 0%,
    var(--navy-800) 60%, var(--blue-700) 140%)` inside @theme) then `bg-cta-gradient`;
    watermark Logo mark white opacity-10 absolute; centered content max-w-2xl mx-auto
    text-center: h2 text-4xl font-bold text-white, p text-blue-100/85 text-lg, button row
    justify-center: white xl → `#pricing` (cta.primary), outline-white xl → `#pricing`
    (cta.secondary).
13. LandingFooter: `<footer>` bg-navy-900 text-blue-100/80; Container py-14:
    top grid (lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10):
    - brand col: Logo lockup theme white (alt footer.logoAlt), tagline text-sm max-w-xs,
      social row (3 icon links: X→https://x.com/schooltest, Youtube→
      https://www.youtube.com/@schooltest, Linkedin→
      https://www.linkedin.com/company/schooltest; lucide icons, aria-labels footer.social*,
      target _blank rel noopener, size-10 grid place-items-center rounded-full hover:bg-white/10).
    - 3 link columns: title text-white text-sm font-semibold + ul text-sm space-y-2.5,
      hover:text-white; mapping (D7): Product column → #product (builder), #ai-feedback
      (feedback), #product (analytics), #pricing (pricing); For schools → #for-schools (all
      four); Company → #cta (all four).
    - language row: existing LocaleSwitcher from '@/modules/i18n' (barrel) — READ its
      current implementation first and reuse as-is; if its trigger styling clashes on navy,
      pass a className only if it already supports one — otherwise wrap in a div; DO NOT
      modify the i18n module beyond what it already allows (it's another module).
    bottom bar: border-t border-white/10 mt-12 pt-8 flex justify-between text-sm:
    footer.copyright + status pill (green-500 dot + footer.status, ring-1 ring-white/15
    rounded-full px-3 py-1).

## Files
- CREATE CtaSection.tsx, LandingFooter.tsx; EDIT globals.css (cta-gradient token);
  EDIT landing/index.ts; EDIT src/app/page.tsx (append; footer LAST, after main closes —
  check composition: HeroSection currently opens `<main id="main-content">`; RESTRUCTURE in
  this task: page.tsx owns `<main>` wrapper around ALL sections 3–12, HeroSection drops its
  main tag (keep id on its section), footer outside main. Adjust task-08 code accordingly.)

## Steps
1. Read src/modules/i18n (LocaleSwitcher + barrel) — reuse. 2. Add cta-gradient token.
3. Build both components. 4. Fix main/footer structure in page.tsx + HeroSection.
5. tsc+lint zero errors.

## Project rules
i18n.md, tailwind.md (gradient via token, not arbitrary value), quality.md (footer landmark,
aria-labels on icon links, external-link rel), imports.md (barrel-only cross-module).

## Done criteria
- Both components; page renders ALL 13 sections; main/section/footer landmarks correct;
  every string from messages; LocaleSwitcher present and functional in footer (it writes
  NEXT_LOCALE cookie + refresh — existing behavior); tsc+lint zero errors.
## Assumptions
- Social hrefs are real external URLs (D7). Legal links omitted (D7).
## Evidence
(filled by builder/verifier)
