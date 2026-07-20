---
id: 32
title: Useful, grouped agent search
layer: ui
kind: fix
slice: agent query and result presentation
target: src/modules/agent-search/components/{AgentsPane,AgentFilterChips,AgentFilterPanel,AgentCard}.tsx; src/modules/agent-search/index.ts; messages/*.json; tests/e2e/agent-search-polish.spec.ts
contract: C-SEARCH-AGENTS
status: DONE
depends_on: [31]
---
## Objective

Improve the agent-search experience with grouped filters, compact information-rich result cards
and proof that a real relevant query returns real verified agents.

## Contract

Uses the existing validated `POST /api/search/agents` contract via the established typed query
hook. Country, language and service filter store values remain the exact API vocabulary.

## Files

The named agent-search components/barrel, all locale files, and focused live E2E coverage.

## Depends on

Task 31 establishes the grouped-filter interaction pattern without sharing a mutable component.

## Steps

1. Verify a representative real query against the running API.
2. Create an accessible grouped agent filter surface with clear selected counts/state.
3. Refine cards from actual profile fields only; retain no-photo fallback instead of inventing
   agent photographs.
4. Test a search term, filters, response visibility and keyboard interaction in Playwright.

## Project rules

All data access remains in the existing TanStack query layer, with i18n keys added to all six
catalogs and no new UI library.

## Done criteria

Relevant real agents appear for a live search, grouped filters alter the server-backed result
set, cards remain readable without photos, and responsive E2E passes.

## Assumptions

Null profile photos are authoritative absence of data, not a reason to add stock portraits.

## Evidence

Builder proof: the first live agent test failed because the prior card had no structured profile
surface; after card/panel work its axe run disclosed real AA failures in initials, verified
badges, muted card copy and active chips. Those were fixed in module consumers, never by editing
primitives. Independent sequential verification: `pnpm exec playwright test
tests/e2e/agent-search-polish.spec.ts tests/e2e/unified-search-states.spec.ts
tests/e2e/unified-search.spec.ts --project=chromium` passed 9/9 with one documented skipped
test. It proves the real Pacific query, Visa enum request, grouped filters, verified card,
sorting, redirects and both-mode axe. Six-locale parity is 716 × 6; `pnpm tsc --noEmit`, `pnpm
lint` (0 errors; unchanged warning) and `git diff --check` passed.
