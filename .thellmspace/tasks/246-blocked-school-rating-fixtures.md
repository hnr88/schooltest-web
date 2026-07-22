---
id: 246
title: BLOCKED — school star rating, tag, note and placement claim have no data source
layer: data
kind: verify
slice: Design metric #10 (school rating) and the card fixtures `s.tag` / `s.note` / the placement claim
target: .qa/CONTRACTS.md (BLOCKED table, append-only) — NO src/ change
contract: C-SEARCH-SCHOOLS
design: .qa/design/spec/01-portal-dashboard.md#8.4 · #8.5 · §10 metrics 9-11 · portal--main.html:181,183-187,195-202
status: BLOCKED
depends_on: []
---

## Objective

Record, visibly and once, that four things the Find-a-school design prints cannot be rendered
from any data this product holds, and fix the substitution every other W8 task uses so no builder
invents one privately.

## Contract

`POST /api/search/schools` returns `SchoolHit` (STRICT allow-list,
`.qa/intake/api-inventory.md` §10):

```
documentId, slug, name, cricosCode|null, suburb|null, state|null, postcode|null,
schoolType|null, sector|null, levelsOffered|null, hasPrimary, hasJuniorSecondary,
hasSeniorSecondary, yearLevelBands[], atarAvailable, elicosEslSupport, scholarshipAvailable,
primaryAnnualTuition|null, juniorSecAnnualTuition|null, seniorSecAnnualTuition|null,
annualTuitionFrom|null, cricosStatus|null, coverImage|null, latitude|null, longitude|null
```

Nothing in that list is a rating, a marketing tag, an application-status note, or a
placement-acceptance flag. The gate is `.qa/CONTRACTS.md` governing rules + D-SCOPE-1 rule 4:

> "Do not invent" is absolute. A design screen with no data behind it is not to be faked.

and `.qa/CONTRACTS.md`, BLOCKED table preamble:

> Recorded here so they are visibly refused rather than quietly faked. Each gets a task file
> whose terminal state is BLOCKED with this reason.

## Design source

The four refused fixtures:

| # | Design element | Slice | Example values in the export |
|---|---|---|---|
| 1 | Star + rating on every card (metric #10) | `portal--main.html:181` | `4.9 4.8 4.7 4.6 4.5` (`Parent Portal.dc.html:808-815`) |
| 2 | `{{ s.tag }}` in the card footer | `portal--main.html:185` | `Scholarships`, `EAL/D support`, `Boarding`, `Selective entry` |
| 3 | `{{ s.note }}` + `{{ s.noteColor }}` | `portal--main.html:186` | `Applications open`, `Emma's school`, `Waitlist`, `Transfers open`, `Open day 9 Aug` |
| 4 | Hard-coded "Accepts SchoolTest placement" on every card + "{n} schools across Australia accept SchoolTest placement" | `portal--main.html:184,153` | literal copy |

Consequential fixtures that inherit the refusal: the pin label pill's rating text
(§8.5, *unselected: text = rating only*), the selected pill's `{rating} · {name}`, and the map
card's `40×40` rating tile (§8.5).

**Sanctioned substitutions** (binding on tasks 231, 238, 243, 245):

| Refused | Ships instead | Real source |
|---|---|---|
| star rating on the card | nothing in that slot; the trailing fact is tuition-from | `annualTuitionFrom` |
| `s.tag` | year-level bands | `yearLevelBands[]` / `levelsOffered` |
| `s.note` | CRICOS registration statement, only when present | `cricosCode`, `cricosStatus` |
| placement claim | count-only sentence | `meta.pagination.total` |
| pin pill rating (unselected) | the design's own graduation-cap glyph | — |
| pin pill `{rating} · {name}` (selected) | `{name}` | `name` |
| map card 40×40 rating tile | school initials (DS `getInitials`) | `name` |

## Files

- `.qa/CONTRACTS.md` — append ONE row to the BLOCKED table (the file is append-only; earlier
  entries stay binding). **No file under `src/` changes in this task.**

## Depends on

None.

## Steps

1. Re-run the proof greps below and paste the output into Evidence.
2. Append to the `.qa/CONTRACTS.md` BLOCKED table, verbatim:

   > **B-9** | School star rating, `tag`, `note`, and the "Accepts SchoolTest placement" claim |
   > `portal--main.html:153,181,184-186,195-202` | No rating, tag, note or placement field exists:
   > `school/content-types/school/schema.json` has none, `HIT_FIELDS`
   > (`schooltest-api/src/utils/school-search.ts:17-23`) cannot return one, and `schoolHitSchema`
   > does not declare one. G22 also blocks a detail read that could carry them. The card, the map
   > pin and the map card render real fields instead (task 246 substitution table).

3. Mark the task BLOCKED. It never becomes TODO; the substitutions it fixes are delivered by
   238 / 243 / 245 / 231.

## Project rules

`.qa/CONTRACTS.md` is append-only (root `.qa` rule, restated in `.qa/RULES.md` [workspace]).
D-SCOPE-1 rule 4 (no invention). `.claude/rules/quality.md` (nothing user-facing without a
source). `schooltest-web/CLAUDE.md` §0.1 (do exactly what is asked — do not "helpfully" seed a
rating field in Strapi to unblock a visual).

## Done criteria

This task is DONE-as-BLOCKED when:

- The B-9 row exists in `.qa/CONTRACTS.md`.
- `grep -rn "rating" schooltest-api/src/api/school/content-types/school/schema.json` → no match.
- `grep -rn "rating" schooltest-web/src/modules/school-search/schemas/school-search.schema.ts` →
  no match.
- `grep -rniE "accepts schooltest placement|applications open|waitlist|transfers open|open day"
  schooltest-web/src` → no match.
- No star glyph is present in any school-search component.
- Zero `src/` files changed by this task.

## Assumptions

None. This is a refusal, not a design.

## Evidence

Pre-authoring probe (2026-07-22), to be re-run and pasted by the verifier:

- `schooltest-api/src/api/school/content-types/school/schema.json` — attributes are
  `name, slug, cricosCode, acaraId, suburb, state, postcode, schoolType, sector, levelsOffered,
  hasPrimary, hasJuniorSecondary, hasSeniorSecondary, atarAvailable, elicosEslSupport, …`.
  No `rating`, no `tag`, no `note`, no placement flag.
- `schooltest-web/src/modules/school-search/schemas/school-search.schema.ts:31-57` — the Zod
  mirror declares 25 fields; none is a rating.
- `.qa/intake/api-inventory.md` §10 — the STRICT `SchoolHit` allow-list, identical set.
- `.qa/intake/api-inventory.md` G22 — no school detail read exists, so no other endpoint can
  supply them.
