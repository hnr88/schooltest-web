---
id: 006
title: Compact school + agent result cards
layer: ui
kind: fix
slice: search result density
target: schooltest-web/src/modules/school-search, agent-search
contract: n/a
status: DONE
depends_on: []
---
## Objective
User: "make the fucking cards more compact they are huge" (schools) and same for agents.
Today: school grid is 1 column (map open by default + 340px rail, SchoolResults.tsx:58),
card p-2 pb-5 + 16:9 cover; agent grid caps at md:2 (AgentResults.tsx:18), card p-5.5.
## Files
- school-search/components/SchoolResults.tsx (grid-cols up to 3 on xl when map closed)
- school-search/components/SchoolCard.tsx, SchoolCardCover.tsx, SchoolCardFacts.tsx (tighter padding/gaps)
- school-search/stores/use-school-search-store.ts (isMapOpen default false — map still one click away)
- agent-search/components/AgentResults.tsx (md:2 xl:3), AgentCard.tsx, AgentCardMeta.tsx (tighter)
## Constraints
- Keep map toggle + mobile sheet working; design tokens only; no new libs; 6-locale i18n unchanged unless copy changes.
## Done criteria
- Desktop school results render >=2 columns (3 when space allows) with visibly denser cards;
  agent results 3-up on xl; axe has no new serious/critical; screenshots in .qa/screenshots.
