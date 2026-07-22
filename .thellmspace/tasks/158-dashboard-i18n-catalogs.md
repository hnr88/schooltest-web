---
id: 158
title: Every dashboard string in all six locale catalogs, key-identical, with correct ICU and formats
layer: frontend
kind: implement
slice: The i18n surface of the redesigned dashboard
target: src/i18n/messages/{en,zh,ko,ms,vi,th}.json
contract: n/a (i18n)
design: .qa/design/spec/01-portal-dashboard.md (every literal string on the screen)
status: TODO
depends_on: ["132", "134", "136", "137", "139", "140", "141", "142", "144", "145", "146", "147", "150", "155"]
---

## Objective
Bring the six catalogs to exact key parity for every string this wave introduced, with ICU that
survives translation and number/date formatting that is locale-correct rather than English-shaped.

## Contract
n/a. Binding rule, `.qa/RULES.md` [schooltest-web] i18n:
> **All six locale catalogs must have identical key shape** — en, zh, ko, ms, vi, th.
> Baseline at intake: 1151 keys each. ICU plurals for counts.

## Design source — the complete string inventory this wave adds
Under the existing `Dashboard` namespace:
| Key | en value | Source |
|---|---|---|
| `greeting.morning` / `.afternoon` / `.evening` | `Good morning, {name}` … | §2 `portal--main.html:10` |
| `hero.eyebrow` | `This week` | §3 `:29` |
| `hero.headlineBand` | `{name}'s latest official result places them at <b>{band}</b>.` | 134 |
| `hero.headlineFocusClause` | ` {name} is working on {skill} next.` | 134 |
| `hero.headlineNoResults` | `{name} has no published results yet — the first one will appear here.` | 134 |
| `hero.headlineNoChildren` | `Add a child to start following their progress.` | 134 |
| `hero.testsCompletedLabel` | `tests completed` | §4.1 `:32` — lowercase, exact |
| `hero.practiceWeekLabel` | `practice this week` | §4.3 `:36` — lowercase, exact |
| `hero.durationHm` | `{hours}h {minutes}m` | §4.3 format |
| `practice.title` | `Practice minutes` | §4.4 `:41` |
| `practice.range` | `last 7 days` | §4.4 `:41` |
| `practice.barLabel` | `{day}: {minutes} minutes` | 141 (a11y name) |
| `practice.strongestDay` | `{day} was the strongest day — <b>{minutes} min</b>.` | §4.4 `:54` |
| `practice.noPractice` | `No practice recorded in the last 7 days.` | 142 |
| `children.title` | `My children` | §5 `:60` |
| `children.seeDetails` | `See details` | §5 `:62` (the `→` is decorative markup, not a string) |
| `children.yearLevel` | `Year {level}` | §5 `:68` |
| `children.yearLevelUnknown` | `Year level not set` | 145 |
| `children.statusEnrolled` | `Enrolled` | 145 |
| `children.openChild` | `Open {name}'s progress` | 145/149 (link name) |
| `children.focusPill` | `Focus: {skill}` | §4.6 `:80` — the `Focus: ` prefix is exact |
| `children.cefrLadder` | `CEFR band: {band}` | 146 (a11y name) |
| `children.cefrNotAssessed` | `No official result yet` | 146 |
| `cefr.pre_A1` … `cefr.C1` | `pre-A1`, `A1`, `A2`, `B1`, `B2`, `C1` | C-DASH-HOUSEHOLD ladder |
| `skill.reading` / `.listening` / `.speaking` / `.writing` | `Reading` … | §4.6 |
| `note.eyebrow` | `Latest update` | 150 |
| `note.view` | `View` | 150 |
| `note.empty` | `No updates yet.` | 150 |
| `error.title` / `.description` / `.forbidden` / `.rateLimited` | | 155 |
| `empty.title` / `.description` / `.addChild` | | 139 |

## Rules this task enforces
- **No key added to `en` without the same key in `zh, ko, ms, vi, th`.** Machine-translated
  placeholders are acceptable content; a MISSING key is not.
- **Superseded keys are removed from all six or from none.** `Dashboard.welcomeTitle`,
  `welcomeSubtitle`, `overviewEyebrow`, `overviewTitle`, `overviewSubtitle`, `familySummaryTitle`,
  `familySummaryDescription`, `planningTitle`, `planningDescription`, `profilesNeedingPlan`,
  `metricsHeading`, `totalProfiles` and friends belong to the composition 131 replaced. Remove a key
  ONLY after `grep -rn "'Dashboard.<key>'" src/ tests/` proves nothing reads it — several are also
  used by `/dashboard/children`, and deleting one of those breaks a passing spec.
- **ICU, not concatenation.** `Focus: {skill}` is one message; `t('Dashboard.children.focusPill')`
  is never composed from two `t()` calls. Same for the two `<b>`-bearing rich messages.
- **Plurals** where a count is rendered: `practice.barLabel`'s `{minutes}` uses
  `{minutes, plural, one {# minute} other {# minutes}}` in `en`; locales without plural categories
  render the `other` form — that is correct, not a bug.
- **Numbers and dates never hand-formatted.** All through next-intl `useFormatter()`:
  `number()` for counts, `dateTime()` for the greeting date and the weekday narrow/long forms,
  `relativeTime()` for the note timestamp. `th` uses the Buddhist era by default in some formats —
  verify the greeting date renders sensibly in `th` and pin the calendar if it does not.
- **`pre-A1`** stays Latin-script in every locale unless the translator says otherwise; it is a CEFR
  identifier, not prose.

## Files
- EDIT `src/i18n/messages/en.json`, `zh.json`, `ko.json`, `ms.json`, `vi.json`, `th.json`.
- CREATE `tests/e2e/dashboard-i18n.spec.ts` — parity + render-in-each-locale.

## Depends on
- All the tasks that introduce strings: 132, 134, 136, 137, 139, 140, 141, 142, 144, 145, 146, 147,
  150, 155.

## Steps
1. Collect every `t(` / `t.rich(` key under `src/modules/dashboard` by grep.
2. Add the missing keys to all six catalogs in the same nesting order.
3. Remove superseded keys only after proving no reader remains.
4. Write the parity spec.

## Project rules
- `.claude/rules/i18n.md` — `useTranslations` (client) / `getTranslations` (server); PascalCase
  namespace + camelCase key; no hardcoded user-facing string anywhere.
- `.qa/RULES.md` — six catalogs, identical key shape.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Parity: a node script (run in the spec) flattens all six catalogs and asserts the key sets are
  **exactly equal** — same count, same paths. Any diff fails.
- Every key referenced under `src/modules/dashboard` exists in `en.json`
  (`grep -ohrE "t(\.rich)?\('([^']+)'" src/modules/dashboard` → each resolves).
- Playwright renders `/dashboard`, `/zh/dashboard`, `/ko/dashboard`, `/ms/dashboard`,
  `/vi/dashboard`, `/th/dashboard` with the seeded parent and asserts, in each:
  no raw key string (`/Dashboard\.[a-z]/i`) is visible anywhere, no `{` or `}` leaks into rendered
  text, `document.documentElement.scrollWidth <= clientWidth` at 375px, and axe is clean.
- The greeting date, the practice weekday letters and the note relative time differ between `en` and
  `zh` — proving they are formatted, not hardcoded.
- No orphan keys: any `Dashboard.*` key removed is removed from all six catalogs and has zero
  readers.
- Zero banned-pattern hits; no hardcoded user-facing string in the diff.

## Assumptions
- Non-en values may be machine-translated; the mission's bar is key parity and correct ICU, not
  translation quality.

## Evidence
<filled in as the task runs>
