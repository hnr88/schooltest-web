---
id: 27
title: Locales — adopt schoolgo set (en/zh/ko/ms/vi/th), drop de
layer: frontend
kind: build
slice: 6-locale catalogs seeded from schoolgo translations + switcher + e2e alignment
target: src/i18n/{routing.ts,messages/*}, src/modules/i18n/constants/, tests/e2e/{landing,landing-aria,design-system-de}.spec.ts
contract: C-CONTENT
status: DOING
depends_on: []
---
## Objective (approved plan, user-directed)
Replace locales ['en','de'] with schoolgo's ['en','zh','ko','ms','vi','th'] (cookie mode
kept). Full key parity across 6 files; schoolgo translations for mapped keys (Auth,
Common/Errors, ParentStudents/ParentDashboard/ParentSearch subsets); documented en
fallback for SchoolTest-specific keys (Home landing, DesignSystem, unmapped Auth/
Dashboard extras). "SchoolGo"→"SchoolTest" in borrowed values. Delete de.json.
## Steps
1. Author M2 Auth + Dashboard namespace keys in en.json (aligned to schoolgo key names).
2. One-off merge script writes zh/ko/ms/vi/th.json (mapping table in the script).
3. routing.ts locales; locales.constants.ts (6 codes + endonym labels); delete de.json.
4. e2e: DE specs → ZH (fallback-render for landing keys + zh translations for shared
   keys; no-leak uses en vs zh on translated keys; toggle en→zh→en).
5. Parity (6 files identical shape) + tsc + lint + full suite + screenshots.
## Done criteria
- 6 locale files with identical key shape (parity OK); LocaleSwitcher offers the 6;
  /sign-in renders zh translations from schoolgo catalogs (once task 12 lands);
  full suite green with the ZH specs; tsc/lint zero; decision logged.
## Evidence
(filled by builder/verifier)
