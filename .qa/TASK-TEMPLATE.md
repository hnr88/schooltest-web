---
id: NNN
title: <one line, imperative, specific>
layer: data | backend | frontend | integration | ui | security | a11y | regression
kind: scaffold | build | wire | implement | fix | verify
slice: <the ONE feature/screen/component this vertical slice delivers>
target: <exact files / endpoint / route / component>
contract: <CONTRACTS.md entry id(s), or "n/a">
design: <.qa/design/screens/<slice>.html and/or .qa/design/spec/<file>.md#section, or "n/a">
status: TODO
depends_on: []
---

## Objective
<the one slice this delivers, in the mission's terms>

## Contract
<the EXACT request/response/status/errors quoted from .qa/CONTRACTS.md by id — method, path,
body, success + every error status, auth/role, ownership rule, persistence effect. "n/a" for
pure-presentation slices, but then quote the design spec section instead.>

## Design source
<exact slice path + the specific values this task must hit: sizes, colours (as @theme token
names), spacing, states, motion. Never "match the design" — name the numbers.>

## Files
<exact files to create/touch>

## Depends on
<task ids that MUST be DONE first, and why>

## Steps
<ordered, concrete: tokens -> contract -> backend -> typed client -> UI -> i18n -> e2e>

## Project rules
<the EXACT rule files this task must obey, e.g. schooltest-web/.claude/rules/tailwind.md +
module-pattern.md; and the specific clauses that bite here>

## Done criteria
<observable and provable. Must include: tsc + lint clean; a real Playwright assertion against
the running app; persistence proof where it writes; motion + prefers-reduced-motion where it is
UI; 375px + 1280px; axe clean on the touched surface; all 6 locale catalogs key-identical if
strings changed; zero banned-pattern grep hits.>

## Assumptions
<state them, or "none">

## Evidence
<filled in as the task runs: status codes, request/response, DB rows, e2e output, screenshots>
