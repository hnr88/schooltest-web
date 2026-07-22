---
id: 238
title: Build the school card's divider footer from real hit fields only
layer: frontend
kind: implement
slice: The design's §8.4 card footer row — check icon, facts, trailing note
target: src/modules/school-search/components/SchoolCardFacts.tsx (new), src/modules/school-search/lib/school-card.helpers.ts
contract: C-SEARCH-SCHOOLS
design: .qa/design/screens/portal--main.html:183-187 · .qa/design/spec/01-portal-dashboard.md#8.4
status: TODO
depends_on: ["237", "246"]
---

## Objective

The card gains the design's hairline-separated footer row of small facts. Every fact is a field
the search endpoint actually returns; the design's three unbacked fixtures (`Accepts SchoolTest
placement`, `s.tag`, `s.note`) are refused per task 246 and replaced with real ones.

## Contract

`POST /api/search/schools` → `SchoolHit` (STRICT, `.qa/intake/api-inventory.md` §10). The fields
available for the footer, and nothing else:

`cricosCode|null, suburb|null, state|null, postcode|null, schoolType|null, sector|null,
levelsOffered|null, hasPrimary, hasJuniorSecondary, hasSeniorSecondary, yearLevelBands[],
atarAvailable, elicosEslSupport, scholarshipAvailable, primaryAnnualTuition|null,
juniorSecAnnualTuition|null, seniorSecAnnualTuition|null, annualTuitionFrom|null,
cricosStatus|null`.

There is **no** rating, tag, note, or placement-acceptance field anywhere in
`schooltest-api/src/api/school/content-types/school/schema.json`, in `HIT_FIELDS`
(`src/utils/school-search.ts:17-23`) or in `schoolHitSchema`. Task 246 records that refusal.

## Design source

`.qa/design/screens/portal--main.html:183-187`:

```
display:flex; align-items:center; gap:6px 14px; flex-wrap:wrap; margin-top:14px;
padding-top:14px; border-top:1px solid #EEF1F6; font-size:12.5px; color:#7C8698
```
- check icon `13×13`, `stroke:#2563EB`, `stroke-width:2`, path `M20 6 9 17l-5-5`
- a `·` separator, then `{{ s.tag }}`
- `{{ s.note }}` at `margin-left:auto; font-weight:600; color:{{ s.noteColor }}`

| Element | Design | Implementation |
|---|---|---|
| Row | `mt:14px; pt:14px; border-top:1px solid #EEF1F6`, gap `6px 14px`, wrap, 12.5px | `mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-divider pt-3.5 text-meta text-body` |
| Check icon | 13×13, `#2563EB`, stroke 2 | lucide `Check` `className="size-3.25 text-primary" strokeWidth={2}` |
| Separator | `·` | a `<span aria-hidden="true">·</span>` |
| Trailing fact | `margin-left:auto; font-weight:600` | `ml-auto font-semibold text-navy-900` |

**Fact mapping (design slot → real field):**

| Design slot | Ships as | Source field |
|---|---|---|
| check + "Accepts SchoolTest placement" | check + CRICOS registration statement, rendered ONLY when `cricosCode !== null` — `SchoolSearch.card.cricosRegistered` | `cricosCode`, `cricosStatus` |
| `·` `{{ s.tag }}` | year-level bands, e.g. "Years 7–12" | `yearLevelBands[]` (fallback `levelsOffered`) |
| `{{ s.note }}` (right, coloured) | tuition-from, the existing `SchoolSearch.card.tuition` rich string, or `—` when `annualTuitionFrom === null` | `annualTuitionFrom` |

`SchoolCardBadges` (sector / school type / CRICOS / scholarships / ELICOS `StatusPill`s) stays
above the footer — it is existing functional presentation of real fields.

Motion: none of its own; the row inherits the card's transition. Facts that appear/disappear on
re-query do so inside the card's existing `animate-in fade-in` list transition.

375px: `flex-wrap` puts the trailing fact on its own line (`ml-auto` still right-aligns it);
nothing truncates.

## Files

- `src/modules/school-search/components/SchoolCardFacts.tsx` (**new**, ≤120 lines)
- `src/modules/school-search/lib/school-card.helpers.ts` (add `getYearBandLabel(hit)`, pure)
- `src/modules/school-search/components/SchoolCard.tsx` (mount the footer)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `SchoolSearch.card.cricosRegistered`,
  `SchoolSearch.card.yearBands`, `SchoolSearch.card.tuitionUnknown`

## Depends on

- **237** — the card frame this footer sits in.
- **246** — the BLOCKED record that authorises these substitutions.

## Steps

1. Add `getYearBandLabel` to `lib/school-card.helpers.ts` (pure; joins `yearLevelBands` with an
   en dash range, falls back to `levelsOffered`, returns `null` when both are empty).
2. Build `SchoolCardFacts`; render each fact only when its field is non-null. A card whose fields
   are all null renders the footer with the tuition `—` only — never a fabricated fact.
3. Reuse the EXISTING `SchoolSearch.card.tuition` rich key and `TUITION_CURRENCY` formatting
   (`AUD`, `narrowSymbol`, 0 fraction digits) — do not re-implement currency formatting.
4. Add the three new keys to all six catalogs.

## Project rules

`.claude/rules/module-pattern.md`: pure helpers in `lib/`, no logic in the component.
`.claude/rules/i18n.md`: every string through `t()`; six catalogs.
`.claude/rules/quality.md`: decorative icons `aria-hidden`; 4.5:1 contrast.
D-SCOPE-1 rule 4: no invented field ever renders.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: intercept `POST /api/search/schools`, take the first hit from the RESPONSE body,
  and assert the first card's footer contains that hit's `yearLevelBands` label and its
  `annualTuitionFrom` formatted as `SchoolSearch.card.tuition` — i.e. the DOM is proved against
  the API payload, not against a fixture.
- A hit with `cricosCode === null` renders NO CRICOS line (find one in the response body and
  assert by index).
- Grep `src/`: zero occurrences of `Accepts SchoolTest placement`, `Applications open`,
  `Emma's school`, `Waitlist`, `Transfers open`, `Open day`, `Scholarships` as a hard-coded note
  string, and zero star/rating glyph in the school card.
- Six catalogs key-identical; the seven W8 regression specs green.
- axe clean at 375 + 1280.
- Zero raw hex / arbitrary values in the diff.

## Assumptions

`yearLevelBands` is a `string[]` on the hit; when it is empty the fallback is `levelsOffered`,
and when both are absent the slot is omitted rather than filled.

## Evidence

_(filled in as the task runs)_
