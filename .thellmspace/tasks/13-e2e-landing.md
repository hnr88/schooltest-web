---
id: 13
title: E2E — landing localized render (en + de), no-hardcoded, composition, anchors
layer: integration
kind: verify
slice: Playwright specs proving landing runs on langs JSONs end-to-end
target: tests/e2e/landing.spec.ts
contract: C-E2E (E2E-LANDING-EN/DE, E2E-COMPOSITION)
status: DONE
depends_on: [12]
---
## Objective
Write and pass Playwright specs against the real running app (webServer on port 3100)
proving: the landing renders fully from the message catalogs in both locales, contains no
hardcoded copy, is composed of the 13 separate section components, and every anchor resolves.

## Contract (C-E2E entries 1 & 4)
Specs (read src/i18n/messages/en.json + de.json IN THE SPEC and assert from the catalogs —
never duplicate strings into the test):
1. EN render: goto '/'; assert document title = en Home.meta.title; assert visible:
   announcement.message, hero badge/title/subtitle/CTAs/microcopy, flow stepOne..Three,
   trustedBy label + all 5 wordmarks, features eyebrow/title + 3 card titles+descriptions,
   featureDetail eyebrow/title/description + 3 checks + card title/badge/suggestion,
   stats 3 values+labels, howItWorks eyebrow + 3 step titles+descriptions, testimonial
   quote/name/role, pricing title + 3 tiers (names/prices/all features/CTAs) + proBadge,
   faq title + 4 questions (open each, assert answers), cta title/subtitle/buttons,
   footer tagline + all column titles/links + copyright + status. Assert hero image
   visible with alt = hero.imageAlt.
2. DE render: context with cookie NEXT_LOCALE=de on localhost:3100; same assertions from
   de.json (spot: at least hero, features, pricing, faq, footer + title).
3. No-leak: in DE mode assert NONE of the en-only strings appear (hero.title line 2,
   pricing.proFeatureTwo, footer.tagline, cta.title) and vice versa in EN mode (assert no
   German umlaut-heavy strings like de footer.tagline present).
4. Composition/order: assert sections appear in DOM order via ids: main-content →
   (hero) → product → ai-feedback → for-schools → pricing → resources → cta, plus header
   and footer landmarks; assert each is a DISTINCT element (separate components).
5. Anchors: collect every a[href^="#"] in header+footer+CTAs; assert each target id exists
   in the DOM; click header "Pricing" link → URL hash updates + section in viewport.
6. One h1 exactly; header is sticky (position check); locale cookie absent → EN default.

## Files
- CREATE tests/e2e/landing.spec.ts (≤200 lines — split helpers into
  tests/e2e/helpers/i18n.ts if needed: loadMessages(locale), assertVisibleTexts(page, strings[]))

## Steps
1. Write helpers + spec. 2. Run `pnpm exec playwright test tests/e2e/landing.spec.ts`
   (webServer boots the app). 3. Fix forward until green. 4. Also run existing
   home.spec.ts — must stay green.

## Project rules
testing.md (Playwright for server components), quality.md, CLAUDE.md allowed commands.

## Done criteria
- All specs pass against the REAL app (attach the playwright output tail as evidence);
  no test-only fakes/stubs; assertions derive from the JSON catalogs at runtime.
- Verifier: re-runs the full command fresh; reads the spec for catalog-driven assertions.
## Assumptions
- webServer in playwright.config.ts (port 3100) is already enabled (boot-gate).
## Evidence
PASS (independent verifier, 2026-07-17): fresh full suite 7/7 green (5 landing + 2 home); catalog-driven assertions (zero hardcoded copy in spec); full C-E2E 1+4 coverage (99-key EN render, 33-key DE spots, no-leak both directions, DOM order, anchors + Pricing hash click); exact:true/role queries, no force/skip; D21 href path verified — real anchors, nativeButton warning gone. Orchestrator note: aria-label spot assertions (nav.*, social) intentionally out of task scope.

(filled by builder/verifier)
