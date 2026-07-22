---
id: 219
title: Rebuild step 5 Review & confirm as the design's four-row summary table
layer: ui
kind: build
slice: Wizard step 5 summary — Personal / Education / Guardian / Media rows composed from live form values
target: src/modules/student-wizard/components/StepReview.tsx, src/modules/student-wizard/hooks/use-review-model.ts, src/modules/student-wizard/components/ReviewSummaryTable.tsx, src/i18n/messages/*.json
contract: n/a for transport — composed entirely from live RHF values and the wizard media store
design: .qa/design/screens/portal--add-child-multi-step.html:122-130, .qa/design/spec/03-portal-forms.md#28-step-5--review--confirm
status: TODO
depends_on: [202]
---

## Objective
Replace step 5's five stacked panels (`NavyPanel` + three `ReviewPanel`s + a media panel) with the
design's single four-row summary table, composed from the same live form values the current
`useReviewModel` already reads.

## Contract
n/a — no request is made on this step. Values come from `useWatch` over the wizard's RHF form plus
`useWizardMediaStore`. Enum values resolve to localized labels exactly as `use-review-model.ts` does
today (`personal.gender.*`, `education.yearOption`, `education.term`, `guardian.channel.*`).

## Design source
`03-portal-forms.md` §2.8 (`portal--add-child-multi-step.html:125-130`):

```
wrapper : border:1px solid #EEF1F6; border-radius:16px; overflow:hidden
row     : display:flex; justify-content:space-between; gap:16px;
          padding:15px 20px; border-bottom:1px solid #EEF1F6   (last row: no border)
key     : font-size:13px;   color:#7C8698
value   : font-size:13.5px; font-weight:600; color:#0E2350; text-align:right
```

| Key | Design example | Composed from |
|---|---|---|
| `Personal` | `Minh Nguyen · born 14/03/2013 · Vietnamese` | 1.1 + 1.2, `born ` + 1.3, 1.6 |
| `Education` | `Year 7 · testing band 7 · entry Term 1, 2027` | 2.2, `testing band ` + 2.3, `entry ` + 2.5 + `, ` + 2.4 |
| `Guardian` | `Maria Rodriguez · 0400 000 000 · WhatsApp` | 3.1, 3.2, 3.5 |
| `Media` | `Photo added · voice intro skipped` | 4.1 presence, 4.2 presence |

Segment separator is exactly ` · ` (space, U+00B7, space). Empty segments are dropped, never rendered
as `—` inside a joined sentence (the current per-row `—` empty label stays only if a whole row has no
segments at all).

Tailwind: wrapper `overflow-hidden rounded-panel border border-portal-line`; row
`flex justify-between gap-4 px-5 py-3.75 not-last:border-b not-last:border-portal-line`; key
`text-caption text-body`; value `text-right text-body-sm font-semibold text-navy-900`
(design's `#7C8698` key ink substituted per task 200's policy).

Date format: the design prints `14/03/2013` (day-first). The stored value is ISO. Format it with
`Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })` in a pure helper
under `lib/`, so `zh`/`ko` get their own correct order instead of a hardcoded day-first string.

Media strings — the design only shows the "photo added / voice skipped" half
(`03-portal-forms.md` § UNKNOWNS 6), so all four are authored as catalog keys:
`review.media.photoAdded` `Photo added`, `review.media.photoSkipped` `Photo skipped`,
`review.media.voiceAdded` `voice intro added`, `review.media.voiceSkipped` `voice intro skipped`.
New keys also needed: `review.row.personal|education|guardian|media` (`Personal`, `Education`,
`Guardian`, `Media`), `review.born` (`born {date}`), `review.testingBand` (`testing band {n}`),
`review.entry` (`entry {term}, {year}`).

The per-section "Edit" jump is not in the design's table, but the rail (task 201) is free backward
navigation and the row keys mirror the rail titles, so the affordance is not lost. Keep
`goToStep` exported; drop the `ReviewPanel`/`ReviewMedia`/`NavyPanel` composition and delete the
components if grep shows no other consumer.

Motion: rows enter with the card's own transition (task 202); no per-row animation.

## Files
- `src/modules/student-wizard/components/ReviewSummaryTable.tsx` (new)
- `src/modules/student-wizard/components/StepReview.tsx` — table + (task 222's) error alert only
- `src/modules/student-wizard/hooks/use-review-model.ts` — returns four composed rows
- `src/modules/student-wizard/lib/format-review-date.ts` (new, pure)
- `src/modules/student-wizard/components/{ReviewPanel,ReviewMedia}.tsx` — deleted if unreferenced
- `src/modules/student-wizard/index.ts`, `src/i18n/messages/{en,zh,ko,ms,vi,th}.json`

## Depends on
202 — step 5's 24px body gap and the card the table sits in.

## Steps
1. Add the eleven new catalog keys to all six locales.
2. Rewrite `useReviewModel` to compose the four rows (pure joins, no JSX).
3. Build `ReviewSummaryTable`; rewrite `StepReview`; delete the orphaned panels.
4. e2e: fill the wizard, assert each composed row, then check `/zh`.

## Project rules
`.claude/rules/module-pattern.md` (composition logic in `hooks/` + `lib/`, never in the component;
≤120 lines) · `.claude/rules/i18n.md` (ICU for the composed sentences; six catalogs) ·
`.claude/rules/tailwind.md` · `.claude/rules/quality.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: after filling given `Minh`, family `Nguyen`, DOB `2013-03-14`, nationality `Vietnamese`,
  current year `Year 7`, band `7`, term `Term 1`, year `2027`, guardian `Maria Rodriguez` /
  `0400 000 000` / WhatsApp, and uploading a photo but no voice, the four rows read exactly:
  `Minh Nguyen · born 14/03/2013 · Vietnamese`, `Year 7 · testing band 7 · entry Term 1, 2027`,
  `Maria Rodriguez · 0400 000 000 · WhatsApp`, `Photo added · voice intro skipped`.
- The wrapper computes `border-radius: 16px` with a `1px` `--color-portal-line` border; rows compute
  `padding: 15px 20px`; the last row has no bottom border; values compute `font-size: 13.5px;
  font-weight: 600` and right alignment.
- A mononym (no family name) renders without a stray separator; a skipped photo renders
  `Photo skipped · voice intro skipped`.
- `/zh`: the row keys and the composed sentences render from `zh.json`, and the date renders in the
  zh order.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The four media strings are authored because the design only shows two of them (its own UNKNOWNS 6).
No value on this screen is computed from anything other than what the user just typed.

## Evidence
