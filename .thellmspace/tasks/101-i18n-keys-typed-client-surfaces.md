---
id: "101"
title: Add the household / result-history / delta i18n keys to all six catalogs, with a parity guard
layer: integration
kind: build
slice: Every user-facing string the W3 data layer makes necessary, in en · zh · ko · ms · vi · th, key-identical
target: src/i18n/messages/{en,zh,ko,ms,vi,th}.json · tests/e2e/i18n-catalog-parity.spec.ts
contract: C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY · C-PARENT-RESULT-VIEW
design: .qa/design/spec/01-portal-dashboard.md#4. THE STATS STRIP / METRIC CARDS · .qa/design/spec/02-portal-children.md#A.5 ChildCard · #B.2 KPI strip · #B.6 RecentResults
status: TODO
depends_on: ["093", "096", "099", "100"]
---

## Objective

The W3 helpers deliberately return numbers and enum tones, never English. This task supplies the
strings those tones and numbers resolve to — in all six catalogs, with identical key shape and real
ICU plurals — plus a spec that makes catalog drift a failing test instead of a review comment.

## Contract

No HTTP operation. The strings enumerated below are the exact rendering vocabulary of three
contracts, and two of them exist BECAUSE a design string is refused:

- **C-DASH-HOUSEHOLD** — `practiceSecondsThisWeek`, `practiceByDay` (7), `strongestDay` (nullable),
  `focusSkill` / `practiceDayStreak` per child; `cefrBand` / `readiness` per SKILL
  (`children[].skills[]`, always four entries, `not_assessed` when unassessed). **AMENDMENT A1**
  (`.qa/CONTRACTS.md`) deletes the per-child `cefrBand` / `cefrStageIndex` this task's v1 assumed —
  there is no per-child level string to author (BLOCKED **B-9**).
- **C-CHILD-RESULT-HISTORY** — `previousResultDocumentId` (nullable) drives the delta phrasing;
  `meta.pagination` drives the pager copy.
- **C-PARENT-RESULT-VIEW** — `attributes` items counts and the `not_assessed` literal.
- `.qa/CONTRACTS.md` **B-3 / B-4** — no key in this task may contain a `%` score, a cut score, or a
  computed CEFR level. The delta keys are band/level STEP counts.
- `.qa/CONTRACTS.md` **B-1 / B-2** — no `coming up` key is added. See task 102.

## Design source

Exact copy from the export, and what each becomes:

| Design string | Slice | Key added | en value |
|---|---|---|---|
| `tests completed` (lowercase, exact) | `.qa/design/spec/01-portal-dashboard.md` §4.1, `portal--main.html:32` | `Dashboard.householdTestsCompletedLabel` | `tests completed` |
| `practice this week` | §4.3, `portal--main.html:36` | `Dashboard.householdPracticeLabel` | `practice this week` |
| `4h 20m` — format `{H}h {MM}m`, hour unpadded, minutes zero-padded to 2 | §4.3 | `Dashboard.practiceDuration` | `{hours}h {minutes}m` |
| `Practice minutes` | §4.4 header `h2` `16px/600/#0E2350` | `Dashboard.practiceChartTitle` | `Practice minutes` |
| `last 7 days` | §4.4 range label `12.5px/#7C8698` | `Dashboard.practiceChartRange` | `last 7 days` |
| `Thursday was the strongest day — 88 min, mostly Emma's speaking drills.` | §4.4 caption `13px/#7C8698` | `Dashboard.practiceStrongestDay` | `{weekday} was the strongest day — {minutes, plural, one {# min} other {# min}}` |
| *(undesigned)* zero-practice week | — | `Dashboard.practiceChartEmpty` | `No practice recorded in the last 7 days.` |
| `Focus: Speaking` | §4.6 / `.qa/design/spec/02-portal-children.md` | `Dashboard.focusSkillPill` | `Focus: {skill}` |
| `Level B1` pill (`12px/600/#0E2350`, `1px solid #D8DFEA`, `5px 12px`, `999px`) | `.qa/design/spec/02-portal-children.md` §A.5 L20 | **refused (B-9, AMENDMENT A1)** → no key; a single per-child level is a cross-skill composite | — |
| `12` + `day streak` (value `20px/700/-0.01em`, label `12px/#7C8698`) | §A.5 cell 2 | `Dashboard.dayStreakLabel` | `{count, plural, one {# day streak} other {# day streak}}` |
| `Since joining` / `+2 levels` (blue `#2563EB`) | §B.2 row 5, L26 | `Children.sinceJoiningLabel` / `Children.sinceJoiningValue` | `Since joining` / `{steps, plural, one {+# level} other {+# levels}}` |
| `+6% vs May` | §B.6 L67 | **refused (B-4)** → `Children.resultDeltaUp` + `Children.resultDeltaSince` | `{steps, plural, one {+# band} other {+# bands}}` / `vs {date}` |
| `first attempt` (neutral `#9AA6B8`) | §B.6, Lucas row 3 | `Children.resultDeltaFirst` | `First attempt` |
| *(undesigned — the spec's own UNKNOWN: "No negative-delta example exists")* | §B.6 | `Children.resultDeltaDown` / `Children.resultDeltaFlat` / `Children.resultDeltaUnknown` | `{steps, plural, one {−# band} other {−# bands}}` (U+2212) / `No band change` / `Not comparable` |
| `B1 · 74%` score column | §B.6 L66 | **the `74%` half is refused (B-3)**; no key | — |
| `All reports →` (dead link) | §B.6 L61 | replaced by real pagination | `Children.resultsPagerLabel` = `Result pages` |

## Files

Touch (all six, identical key shape):
- `src/i18n/messages/en.json`
- `src/i18n/messages/zh.json`
- `src/i18n/messages/ko.json`
- `src/i18n/messages/ms.json`
- `src/i18n/messages/vi.json`
- `src/i18n/messages/th.json`

Create:
- `tests/e2e/i18n-catalog-parity.spec.ts`

Do NOT touch `src/i18n/messages/home/*.json` (landing namespace, W10's surface).

## Depends on

- **093** — decides the attribute row vocabulary (`items` counts, `not_assessed`).
- **096** — decides the duration/chart/caption shape (numbers + a padded minutes string).
- **099** — decides the five delta `tone` values that need copy.
- **100** — decides the empty/paging states that need copy.

## Steps

1. **Reuse before adding.** These already exist and must NOT be duplicated:
   `Children.resultSkills.{reading,listening,speaking,writing}`,
   `Children.resultReadinessValues.{met,approaching,not_yet,not_assessed}`,
   `Children.untitledResult`, `Children.emptyResults`, `Children.notBanded`, `Children.notPublished`,
   `Children.skillNotAssessed`, `Children.skillsPendingTitle/Description`,
   `Children.showing`, `Children.pagerNext/pagerPrevious/pagerPage/pagerGoTo`,
   `Dashboard.retry`, `Dashboard.valueMissing`, and every `QueryError.*` key.
   The `{skill}` placeholder in `Dashboard.focusSkillPill` is filled from `Children.resultSkills.*`,
   not from a second skill vocabulary.
2. Add the new keys under the EXISTING `Dashboard` and `Children` namespaces (no new namespace):
   these strings render inside the dashboard and child-detail surfaces, and a third namespace would
   split one screen's copy across two files for no benefit. Keys are camelCase under a PascalCase
   namespace, per `.claude/rules/i18n.md`.
   - `Dashboard`: `householdTestsCompletedLabel`, `householdPracticeLabel`, `practiceDuration`,
     `practiceChartTitle`, `practiceChartRange`, `practiceChartEmpty`, `practiceStrongestDay`,
     `practiceBarLabel` (`{weekday}: {minutes, plural, one {# min} other {# min}}` — the accessible
     name for one bar), `focusSkillPill`, `focusSkillNone` (`No focus skill yet`), `dayStreakLabel`,
     `cefrJourneyLabel` (`{skill} journey: {band}, step {step} of {total}` — the `{skill}`
     placeholder is new: AMENDMENT A1 makes this **one rail per skill**, not one per child, so the
     accessible name must name which skill's journey it is), `cefrJourneyNotAssessed`
     (`{skill}: no official result yet`), `householdLoading`, `householdError`,
     `householdErrorDescription`. **`levelPill` and `levelPillNone` are NOT added** — the per-child
     `Level {band}` pill they would have served is BLOCKED **B-9** (a single per-child band is a
     cross-skill composite); adding either key would give a home to a forbidden string.
   - `Children`: `sinceJoiningLabel`, `sinceJoiningValue`, `sinceJoiningUnknown`
     (`Not enough results yet`), `resultDeltaUp`, `resultDeltaDown`, `resultDeltaFlat`,
     `resultDeltaFirst`, `resultDeltaUnknown`, `resultDeltaSince`, `resultsPagerLabel`,
     `resultsHistoryLoading`, `resultsHistoryEmptyFiltered` (`No {skill} results yet.`),
     `resultsHistoryClearFilter` (`Show all skills`), `attributeItemsLabel`
     (`{count, plural, one {# item} other {# items}}`).
3. **ICU plurals are mandatory for every count** (`.claude/rules/i18n.md`). zh, ko, th, vi and ms all
   have a single plural category — write `{count, plural, other {…}}` for them rather than copying
   the English `one/other` pair, which is what a native catalog looks like. The KEY SET stays
   identical; only the ICU category set differs per locale. That is correct and is what the parity
   spec checks (keys, not values).
4. Translate for real: zh (Simplified), ko, ms, vi, th. No English fallback values, no
   `"TODO"`, no machine-transliterated placeholder. The minus sign in `resultDeltaDown` is U+2212 in
   every locale, matching the design's own convention
   (`.qa/design/spec/01-portal-dashboard.md` §10.1: "U+2212 for negative").
5. **Weekday names are NOT catalog keys.** `{weekday}` in `practiceStrongestDay` / `practiceBarLabel`
   is filled at render time from the row's ISO `date` via
   `new Intl.DateTimeFormat(locale, { weekday: 'long' | 'narrow' })`. Do not translate, and do not
   render, the API's `weekday` letter field — it is server-side English shorthand. Record this
   decision in the task Evidence so W5 follows it.
6. Create `tests/e2e/i18n-catalog-parity.spec.ts`: load all six catalogs with the existing
   `loadMessages` helper (`tests/e2e/helpers/i18n.ts`, which already flattens to dot keys and already
   accepts all six locales via `AnyLocale`), and assert every locale's flattened key SET is exactly
   equal to en's — reporting the symmetric difference in the failure message. Then assert every new
   key from step 2 is present in all six.

## Project rules

- `schooltest-web/.claude/rules/i18n.md` — never hardcode a user-facing string; PascalCase namespace
  + camelCase key; **all six catalogs identical in key shape**; ICU plurals for counts;
  `useTranslations` in client components, `getTranslations` in server components.
- `schooltest-web/.claude/rules/testing.md` + **D-VERIFY-1** — proof is a real Playwright run.
- `.qa/RULES.md` [schooltest-web] i18n — baseline at intake was 1151 keys per catalog; after this
  task all six must again be equal to each other.
- `.qa/CONTRACTS.md` **B-1..B-4** — no refused metric gets a string.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/i18n-catalog-parity.spec.ts` passes: all six catalogs have an
  identical flattened key set, and every key listed in step 2 exists in all six.
- Evidence records the per-catalog key count before and after; all six numbers are equal on both sides.
- `grep -rn "TODO\|FIXME\|xxx" src/i18n/messages/*.json` → zero hits.
- `python3 -c "import json;[json.load(open(f'src/i18n/messages/{l}.json')) for l in ['en','zh','ko','ms','vi','th']]"` exits 0 (all six are valid JSON).
- `grep -n "coming up\|comingUp" src/i18n/messages/en.json` → zero hits (B-1 stays refused).
- `grep -n "levelPill" src/i18n/messages/en.json` → zero hits (B-9 stays refused, AMENDMENT A1).
- `grep -nE "\{[a-z]+\}%" src/i18n/messages/en.json` returns only the pre-existing
  `Dashboard.percentValue` / `Children.completionPercent` keys — no NEW percent-formatted string.
- No existing key is renamed, moved or deleted: `git diff` on the six catalogs shows additions only.
- Every existing i18n-dependent spec still passes (`landing.spec.ts`, `design-system-zh.spec.ts`,
  `students-list.spec.ts`, `children-profile.spec.ts`), and the Playwright baseline is unchanged.
- Non-UI slice: no motion / viewport / axe criteria; the strings are rendered in W5/W6.

## Assumptions

- The `Dashboard` and `Children` namespaces are the right homes (rather than a new `Results`
  namespace) because every string above renders on the dashboard or the child-detail route. If W6
  later adds a standalone result-detail route, its copy gets a `Results` namespace then — this task
  does not pre-create one.

## Evidence

<!-- filled in as the task runs -->
