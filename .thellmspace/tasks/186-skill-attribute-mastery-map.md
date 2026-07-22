---
id: 186
title: Expand a skill row into its per-attribute mastery map from C-PARENT-RESULT-VIEW
layer: integration
kind: implement
slice: The per-attribute detail behind a skill — attribute name, attribute_status, evidence count and direction of change, read from the real result.
target: src/modules/children/components/ChildSkillAttributes.tsx (new), src/modules/children/constants/child-attributes.constants.ts (new), src/modules/children/lib/child-attributes.ts (new), src/i18n/messages/*.json
contract: C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md §B.5 (the "Skills" section this data backs) · .qa/CONTRACTS.md C-PARENT-RESULT-VIEW
status: TODO
depends_on: ["185"]
---

## Objective

Give the Skills card real depth: expanding a skill loads that skill's latest official result and
lists its attributes with `attribute_status`, the evidence count, and the direction of `delta` —
the mastery map the design's percentage bar was standing in for.

## Contract

`C-PARENT-RESULT-VIEW` — `GET /api/results/:documentId`, parent JWT, new grant `result.getResult` → `parent`.

> **Ownership:** the result's `student.parent.documentId` MUST equal the caller's `documentId` **and**
> `destination` MUST be `official`. Anything else ⇒ `404 NotFoundError` (never 403 — a parent must not
> be able to probe which result ids exist).

`200` returns the EXISTING `ResultView` shape. Fields this UI consumes: `scope`, `skill`,
`attributes` (`{status, prob, prob_se?, items, delta}` per attribute code), `display_label`,
`acara_phase`, `cefr_band`, `readiness`, `low_confidence`, `effort_valid`, `status`, `published_at`.
Errors: `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child, or transient.

The id to fetch is `children[].skills[].resultDocumentId` from `C-DASH-HOUSEHOLD` ("for deep-linking
to C-PARENT-RESULT-VIEW").

Vocabulary and rules (`.qa/intake/docs-constraints.md`):
- §2 — `attribute_status` ∈ `mastered, emerging, not_mastered, not_assessed`.
- §2 — attribute codes and their plain-English names, e.g. reading `R1 Decoding … R7 Critical`,
  listening `L1 Sound decoding … L7 Attitude`, speaking `S1 Pronunciation … S6 Interaction`,
  writing `W1 Spelling … W5 Register`; R6/L6 display name is **"Propositional Inference"**
  (`SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:30`).
- §3h — "evidence counts travel with every claim" — `attributes[].items` is that count and MUST be shown.
- §3i — never render false precision: `prob` is NOT printed as a percentage.

## Design source

The portal slice has no expanded state (§UNKNOWNS), so this is built in the portal idiom:
row expands into a nested list, `pt-3 border-t border-portal-rule`, each attribute a
`grid-cols-[1fr_auto_auto] gap-3 py-2`; name 13px `text-navy-900`; status chip identical to §B.5's
readiness chip geometry (`rounded-full`, 12px/600, `px-3 py-1`) with the tone map
`mastered` → success-soft, `emerging` → warning-soft, `not_mastered` → portal-rule/navy,
`not_assessed` → portal-rule/muted-2; evidence count 12px `text-portal-muted-2` as
`Children.evidenceCount` (`{count, plural, one {# item} other {# items}}`); `delta` shown only as an
up/down/flat arrow glyph with an `aria-label`, never a number.

## Files

- `src/modules/children/components/ChildSkillAttributes.tsx` (new).
- `src/modules/children/constants/child-attributes.constants.ts` (new) — the code → catalog-key map
  for all four skills, in the docs' order.
- `src/modules/children/lib/child-attributes.ts` (new) — pure ordering/grouping.
- Catalogs: `Children.attributes.{R1..R7,L1..L7,S1..S6,W1..W5}`,
  `Children.attributeStatus.{mastered,emerging,not_mastered,not_assessed}`,
  `Children.evidenceCount`, `Children.deltaUp/Down/Flat`, `Children.attributesHeading`.

## Depends on

- `185` — the skill rows this expands.

## Steps

1. Use the W3 typed hook for `C-PARENT-RESULT-VIEW`, enabled only when the row is expanded
   (`enabled: isOpen && Boolean(resultDocumentId)`) so a collapsed card issues zero extra requests.
2. Render attributes in the docs' declared order for that skill; an attribute absent from the response
   is rendered `not_assessed` with `items: 0`.
3. Show `items` for every attribute, including `0` — thin evidence must look thin (§3h).
4. `delta` → arrow only (`↑` improved, `↓` declined, `→` unchanged) with an `aria-label` from the
   catalog; `null` (first sitting) renders no arrow.
5. Never print `prob`, `prob_se`, or any percentage.
6. Handle every contract error: `404` (foreign/unknown/transient) → the row shows
   `Children.resultUnavailable` inline and does not break the card; `401` is handled by the axios
   interceptor; `403` shows the same inline message.

## Project rules

- `.claude/rules/state-data.md` — the query lives in `queries/` (W3's hook), never in the component.
- `.claude/rules/module-pattern.md` — code→label map in `constants/`, ordering in `lib/`.
- `.qa/intake/docs-constraints.md` §3a, §3g, §3h, §3i.
- `.claude/rules/quality.md` — the expander is a real `<button aria-expanded aria-controls>`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, live: expanding an assessed skill issues exactly one `GET /api/results/{id}` returning
  `200`; every attribute row's status text equals `attributes[code].status` from that body and its
  evidence count equals `attributes[code].items`.
- Security proof in the same run: requesting another parent's child's result id returns `404`
  (never `403`), and the UI shows `Children.resultUnavailable` rather than a crash.
- No `%`, no `prob` value, and no `0.65` threshold string is rendered anywhere.
- Collapsed rows issue zero `/api/results/` requests (network log assertion).
- Motion: expand uses opacity + `translateY` 180ms `--ease-out-quart` (never animated height);
  reduced-motion inert.
- 375px: attributes stack with the chip under the name, no h-scroll; 1280px: three columns.
- axe zero serious/critical in both states; six catalogs key-identical.

## Assumptions

W3 ships the `ResultView` Zod mirror; this task adds no second parse of the same shape.

## Evidence

<!-- filled in as the task runs -->
