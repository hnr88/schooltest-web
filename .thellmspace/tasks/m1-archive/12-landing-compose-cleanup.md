---
id: 12
title: Landing — final composition, metadata, old-code cleanup
layer: integration
kind: build
slice: page.tsx final composition + generateMetadata + remove old tokens/keys/components
target: src/app/page.tsx, src/app/globals.css, src/i18n/messages/*.json, src/modules/landing/
contract: C-PAGE-LANDING
status: DONE
depends_on: [08, 09, 10, 11]
---
## Objective
Finalize `/`: complete section composition in contract order, translated metadata, and
remove everything the new landing made dead — old brand tokens in globals.css, old Home
keys, any leftover old landing files.

## Contract (C-PAGE-LANDING order 1–13 + C-TOKENS cleanup + C-CONTENT cleanup)
- page.tsx: async server component; generateMetadata via getTranslations('Home.meta')
  (title, description); renders in order: AnnouncementBar, LandingHeader,
  `<main id="main-content">` { HeroSection(+HeroFlow), TrustedByStrip, FeaturesSection,
  FeatureDetailSection, StatsBand, HowItWorksSection(+TestimonialCard), PricingSection,
  FaqSection, CtaSection } `</main>`, LandingFooter. Page root div bg-background
  text-foreground min-h-screen.
- globals.css: DELETE the old brand tokens and their @theme mappings: --canvas, --ink,
  --ink-muted, --divider, --progress-track, --rausch-*, --on-rausch, --babu-*, --arches-*,
  --color-canvas, --color-ink, --color-ink-muted, --color-divider, --color-progress-track,
  --color-rausch-*, --color-on-rausch, --color-babu-*, --color-arches-*, and
  --shadow-landing-card (verify zero usages first: grep -rn for each in src/ — if any usage
  remains outside ui/* (ui is read-only and doesn't reference these), FIX the usage or keep
  the token; report what was found). Keep --text-display (new value from task 01).
- messages en/de: DELETE obsolete Home keys: subtitle, articlesCta, docsHint,
  navigationLabel, headerCta, headerCtaShort, eyebrow, heroTitle, heroDescription,
  primaryCta, secondaryCta, trust, benefits{...}, preview{...}, brandPrefix, brandAccent,
  nav.why, nav.plan, nav.expect. KEEP skipToContent. Re-run parity script (task 02).
- landing module: verify old files gone (LandingHeader old version replaced in task 08;
  AssessmentPreview.tsx, SkillProgress.tsx, old LandingHero.tsx, types/landing.types.ts if
  unused — delete). Landing types: create types/landing.types.ts ONLY if shared types exist.

## Files
- EDIT src/app/page.tsx, src/app/globals.css, src/i18n/messages/en.json + de.json
- DELETE dead landing files (verify with grep first)
- EDIT src/modules/landing/index.ts (final export list = the 13 section components)

## Steps
1. grep all old token names + old key names across src/ → fix/report every hit.
2. Apply deletions + final page composition + metadata. 3. Parity script. 4. tsc+lint zero.

## Project rules
ALL schooltest-web rules; NEVER BREAK EXISTING LOGIC (articles route + error/not-found pages
must stay green — they use Common/Articles/Nav namespaces and semantic tokens only).

## Done criteria
- grep for rausch|babu|arches|--canvas|--ink|divider|progress-track|landing-card in src/
  (excluding lockfiles) → ZERO hits.
- Old Home keys absent from BOTH message files; parity OK.
- page.tsx = final composition; metadata translated; landing barrel = 13 sections.
- tsc+lint zero errors; home.spec expectations still satisfiable (title matches /Schooltest/i
  — new title "SchoolTest — Smarter tests. Better results." matches).
## Assumptions
- /articles page keeps working (it uses semantic tokens only — verifier confirms by reading
  its components for old-brand class usage).
## Evidence
PASS after fix (independent verifier, 2026-07-17): initial verdict FAIL — LocaleSwitcher (client) imported LOCALE_COOKIE from server-only @/i18n/request, making / return 500 (latent defect activated by the task-11 footer). Orchestrator fix (D20): LOCALE_COOKIE moved to isomorphic src/i18n/routing.ts. Re-verified: purge clean (old tokens zero refs; 38 obsolete keys removed both locales; PARITY OK 268 keys); generateMetadata from Home.meta; landing barrel = 13 sections; root div bg-background text-foreground min-h-screen; tsc 0 errors, lint 0 errors, `pnpm exec playwright test` 2/2 green.
(filled by builder/verifier)
