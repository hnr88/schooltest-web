---
id: 09
title: Landing — features, AI feature-detail, stats band
layer: ui
kind: build
slice: landing sections 6–8
target: src/modules/landing/components/{FeaturesSection,FeatureDetailSection,AiFeedbackCard,StatsBand}.tsx
contract: C-PAGE-LANDING
status: TODO
depends_on: [01, 02, 03, 05]
---
## Objective
Build landing sections 6–8 as separate server components. All copy from Home.* keys.

## Contract (C-PAGE-LANDING 6–8)
6. FeaturesSection id=`product`: Container; Eyebrow (features.eyebrow) + h2 text-4xl
   font-bold tracking-tight (features.title); grid md:grid-cols-3 gap-6 of FeatureCard:
   - FileText icon, features.questionTypes.*, tone light
   - Sparkles icon, features.aiGrading.*, tone NAVY
   - BarChart3 icon, features.analytics.*, tone light
7. FeatureDetailSection id=`ai-feedback`: Container, grid lg:grid-cols-2 gap-12 items-center;
   left: Eyebrow teal (featureDetail.eyebrow), h3 text-3xl font-bold (featureDetail.title),
   p text-muted-foreground (featureDetail.description), checklist (3 items, CircleCheck
   text-teal-600, text-sm font-medium); right: AiFeedbackCard — Card shadow-lg rounded-2xl:
   header row (Sparkles tile + featureDetail.card.title + Badge accent BETA), 3 score rows
   (label + value 8.5/7.0/6.5 from messages? scores are spec content → keys
   featureDetail.card.scoreGrammar "8.5" etc. — ADD these 3 keys + suggestionHighlight
   "on the other hand" to en/de messages in THIS task (they were missed in task 02's
   literal; note in Evidence), then ProgressBar per row (values 85/70/65, tones
   solid-blue/solid-teal/navy → ProgressBar supports tone solid with indicator className
   override via className prop: pass per-row classes), aria-labels via scoreLabel ICU
   {skill}/{score}), suggestion box (bg-blue-50 dark:bg-blue-950/40 rounded-xl p-4 text-sm;
   suggestion text with the quoted phrase highlighted: split via ICU? Simplest: message
   contains the full sentence; highlight via t.rich with <mark> tag → change key to use
   rich: "Try linking your second and third paragraphs — <mark>\"on the other hand\"</mark>
   would make the contrast clearer." — UPDATE the key in en/de in this task accordingly;
   mark → bg-teal-100 dark:bg-teal-900 text-inherit rounded px-0.5).
8. StatsBand: Container; navy-900 rounded-[28px]→rounded-4xl relative overflow-hidden p-10
   sm:p-14; watermark logo-mark white/10 absolute right bottom (Logo mark theme white with
   opacity-10, aria-hidden); grid sm:grid-cols-3 gap-8 text-white: big value text-5xl
   font-bold (accuracy value text-teal-500? spec: 98% teal, 6 hrs light blue →
   text-teal-500 / text-blue-100), label text-blue-100/80 text-sm.

## Files
- CREATE the 4 components; EDIT src/modules/landing/index.ts; EDIT src/app/page.tsx to
  append these sections; EDIT src/i18n/messages/{en,de}.json (3 score keys +
  rich-mark suggestion + parity re-check).

## Steps
1. Add missing keys (scoreGrammar "8.5"/scoreVocabulary "7.0"/scoreCoherence "6.5" under
   featureDetail.card; suggestion → rich <mark> form) in BOTH locales; run parity script
   from task 02. 2. Build components via design-system barrel (FeatureCard, ProgressBar,
   Badge, Logo, Eyebrow, Container). 3. Compose into page. 4. tsc+lint zero errors.

## Project rules
i18n.md (all strings incl. scores from messages), tailwind.md, quality.md (hierarchy: only
ONE h1 on the page — section headings are h2/h3; FeaturesSection h2 ok, FeatureDetail h3 ok,
keep order), imports.md.

## Done criteria
- 4 components; page renders sections 1–8; new keys in both locales + PARITY OK; no
  hardcoded strings/numbers; tsc+lint zero errors; files ≤200 lines.
## Assumptions
- Scores 8.5/7.0/6.5 and bar percentages (85/70/65) are spec content; percentages as plain
  numbers in the component props (not user-facing text) — labels/values come from messages.
## Evidence
(filled by builder/verifier)
