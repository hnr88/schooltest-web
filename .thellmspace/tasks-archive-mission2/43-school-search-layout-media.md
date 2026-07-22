---
id: 43
title: Rebuild school search layout with persistent filters and Strapi cover media
layer: integration
kind: fix
slice: school search API media contract plus aligned desktop search/map/filter composition
target: schooltest-api/src/api/school/content-types/school/schema.json; schooltest-api/src/contracts/search-domains.ts; schooltest-api/src/api/search/services/search-schools.ts; schooltest-api/src/utils/school-search.ts; schooltest-web/src/modules/school-search/**; tests/e2e/school-search-presentation.spec.ts
contract: C-SEARCH-SCHOOLS
status: DONE
depends_on: [42]
---
## Objective

Replace the misleading static card photo, dropdown-first filters, and cramped map/cards layout
with a desktop-aligned discovery workspace driven by real Strapi cover media and live results.

## Contract

Implement the C-SEARCH-SCHOOLS cover-media amendment exactly. The request and all existing
authorization/filter/pagination behavior remain unchanged; every response item adds the strict
`coverImage` media view or `null`. The UI uses only this real relation for an image; a missing
relation produces an honest identity tile, never a fabricated or local-photo fallback.

## Files

The named API schema/contract/search mapping files, regenerated API types/migration as required,
school-search module layout/components/schema/query helpers, locale catalogs, test fixtures only
through real Strapi persistence, and E2E.

## Depends on

Task 42 stabilizes the shell/header width and navigation behavior this workspace occupies.

## Steps

1. Write red API/UI assertions for the additive strict media field, a real upload relation,
   persistent desktop filter rail, compact cards and expanded map.
2. Add optional `coverImage` to the school content type, explicitly populate it through Document
   Service, regenerate types, and use an idempotent real persistence path for any directory art
   or verified media. Never map a local `/public` asset into the response.
3. Parse the same field in the web module, resolve its Strapi URL, and rebuild desktop as a
   persistent grouped filter rail plus results/map workspace; retain a mobile sheet only where
   viewport constraints require it.
4. Prove API success/error/auth compatibility, image origin from API :5500, filter request
   changes, map/card synchronization, reload, mobile/desktop sizing, axe and type/lint gates.

## Project rules

Read the web module/state/next/tailwind/i18n/testing/quality rules and API `CLAUDE.md` plus
scaffolding/document-service/services rules before edits. Use Zod, typed Axios/TanStack Query,
explicit Strapi populate, documentId, no `entityService`, and no static/mocked result data.

## Done criteria

Live browser/API proof shows an actual Strapi media URL when one exists, no incorrect local
image fallback, logically aligned always-visible desktop filters, a materially larger map,
compact data-rich cards, and surviving real search reload.

## Assumptions

The current directory data has no verified per-school media relation; absent media must remain
honest rather than inferred from a school name or replaced by an unrelated photograph.

## Evidence

- Real Strapi upload and Document Service relation: the Abbotsleigh record now returns the
  persisted `/uploads/abbotsleigh_marian_clarke_5a44838c99.jpg` relation after API reload;
  `HEAD http://localhost:5500/uploads/abbotsleigh_marian_clarke_5a44838c99.jpg` returned
  `200 image/jpeg`.
- API contract: `pnpm exec playwright test tests/e2e/search-schools.spec.ts --reporter=line`
  passed 19/19 against live API `:5500`, including exact strict four-field media projection,
  malformed request and both authorization refusals. API `pnpm tsc --noEmit` and `pnpm lint`
  passed.
- Browser: presentation/filter/map Playwright suite passed 9/9 against live web `:3100` and
  API `:5500`; it proves the permanent filter rail, real `:5500/uploads/` image, compact
  card identity tile when no media exists, loaded map tiles and a visible in-map cluster.
  Screenshot: `.qa/screenshots/school-search-workspace.png`.
- Web `pnpm tsc --noEmit` passed; `pnpm lint` has zero errors and one known unrelated
  React Compiler warning in `CreateArticleForm.tsx`.
