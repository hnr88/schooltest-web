---
id: 251
title: Bring the agents tab onto the redesigned search surface
layer: ui
kind: implement
slice: The Agents mode of `/dashboard/search` — tabs, header, cards, filter surface
target: src/modules/unified-search/components/SearchModeTabs.tsx, src/modules/agent-search/components/AgentCard.tsx, AgentsPane.tsx
contract: C-SEARCH-AGENTS (POST /api/search/agents)
design: .qa/design/screens/portal--main.html:150-190 (surface language) · .qa/design/spec/01-portal-dashboard.md#8.1-8.4
status: TODO
depends_on: ["230", "237", "253"]
---

## Objective

Switching to Agents keeps the same surface: the same header band, the same pill-shaped mode tabs,
the same card box and the same filter/sort controls — only the corpus and the fields change. The
agents mode has no map, so its body is rail + list.

## Contract

`POST /api/search/agents` → `200 { data: AgentHit[], meta: { pagination } }`
(`.qa/intake/api-inventory.md` §11). `AgentHit` (STRICT): `documentId, slug|null, name,
photoUrl|null, headline|null, roleTitle|null, countriesServed[], languages[], specialties[],
yearsExperience:int≥0|null, verified, qeacValidationStatus: none|pending|verified,
partnerSchoolsCount:int, completeness:int`. The corpus is unconditionally gated server-side to
`status='verified' AND publicProfileEnabled=true`. Errors `400 "invalid search payload"`,
`403 "Only parents and admins can search agents"`, `429`.

`unified-search-states.spec.ts` asserts: mode persists to `?mode=`, the agents corpus has no
pagination at the seeded size, the service enum filter and `name_desc` sort work, and the two
retired standalone routes still 308-redirect. `agent-search-polish.spec.ts` asserts the first
card's `h3` is `Pacific Bridge Education` and that `[data-slot="agent-card-profile"]` is present.
All of it must still pass.

## Design source

| Element | Design value | Applies to agents as |
|---|---|---|
| Mode tabs | the design has no tabs; the nearest object is the design's pill button family — `height:36px; padding:0 18px; border-radius:999px; font-size:13px; font-weight:600`, active `#0E2350`/white, idle `#FFFFFF`/`#3D4A5C` with `1.5px #D8DFEA` | `SearchModeTabs`: `rounded-full` triggers, `data-active:bg-navy-900 data-active:text-primary-foreground`, idle `bg-card text-body border border-input` |
| Header | §8.1 — 30/500 title + 14px sub-line + 48px pill | already shared (task 230); title/sub keys `UnifiedSearch.titleAgents` / `subtitleAgents` unchanged |
| Card | §8.4 — white, r20, `20px 22px`, name 15.5/600, meta 13, hairline footer | `AgentCard`: same box/typography; keeps `data-slot="agent-card"`, `data-slot="agent-card-profile"` and its `h3` title |
| Card facts | §8.4 footer row, `12.5px`, `·` separated, trailing fact right | `yearsExperience` + `partnerSchoolsCount` (existing rich keys `AgentSearch.footer.*`), countries/languages as the existing `StatusPill` row; the `verified` pill stays |
| Filter surface | §8.6 overlay | `AgentFiltersDialog` — the SAME `SchoolFiltersDialog` shell reused with agent controls, so the two panes have one modal, not two |
| Sort | task 253's dropdown chip | unchanged binding to `AgentSearch.sort.*` |
| Body | §8.3, map column absent | `grid-cols-search-list` (rail · list), retuned in task 247 |

Motion: mode switch keeps the existing keyed `animate-in fade-in slide-in-from-bottom-2
duration-300 ease-out-expo` on the pane container; tabs animate `background-color` over 150 ms;
cards keep the 200 ms hover treatment. All with `motion-reduce:` variants.

375px: identical to the schools pane minus the map — rail hidden, overlay for filters, one
document scroll.

## Files

- `src/modules/unified-search/components/SearchModeTabs.tsx`
- `src/modules/agent-search/components/AgentCard.tsx`, `AgentCardMeta.tsx`, `AgentsPane.tsx`
- `src/modules/agent-search/components/AgentFiltersDialog.tsx` (**new**, thin wrapper over the
  shared dialog shell)
- `src/modules/agent-search/components/AgentCardSkeleton.tsx` (**new**, mirrors task 249)

## Depends on

- **230** — the shared header band.
- **237** — the card box the agent card copies.
- **253** — the sort control both panes use.

## Steps

1. Re-skin the tabs to the navy pill pair. Keep `role="tab"` semantics and the
   `UnifiedSearch.modeSchools`/`modeAgents` names — five spec assertions resolve tabs by role +
   catalog name, including in `zh`.
2. Re-skin `AgentCard` to the §8.4 box; keep the avatar/`AvatarTint` branch (`photoUrl` is a real
   field and zero live agents carry one — the identity disc is the honest fallback and is
   asserted).
3. Extract the dialog shell from task 234 so both panes mount the same component with different
   children; replace the agents pane's `SearchFilterSheet`.
4. Add the agent skeleton and wire it through `SearchCardSkeletonList`'s variant hook.
5. Re-run both agent specs plus `unified-search*.spec.ts`.

## Project rules

`.claude/rules/module-pattern.md`: cross-module imports through the barrel only — the agents
module must import the dialog shell from `@/modules/search-shared` (move it there when it becomes
shared), never from `@/modules/school-search/components/...`.
`.claude/rules/i18n.md`: no new hardcoded string. `.claude/rules/quality.md`: tab semantics,
focus ring, 44px targets.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `?mode=agents` renders the agents corpus; the first `[data-slot="agent-card"] h3`
  is `Pacific Bridge Education` and the card's computed box matches the schools card
  (same `border-radius` and padding, asserted by comparing the two panes' computed styles).
- The active tab's background resolves to `--navy-900`; the idle tab's to `--card`.
- The agents filter surface is the shared dialog (`getByRole('dialog')`), the visa service filter
  still produces a real `POST /api/search/agents` with `services:['visa']`, and `name_desc` sort
  still puts `Seoul Global Pathways` first (`unified-search-states.spec.ts`,
  `agent-search-polish.spec.ts` pass unmodified).
- The two 308 redirects from `/dashboard/search/schools|agents` still hold.
- At 375 the agents pane has no horizontal scroll and no map affordance is rendered.
- axe clean in both modes at 375 + 1280; reduced motion kills the mode-switch animation.
- Six catalogs unchanged or key-identical.

## Assumptions

The agents pane never gains a map: `AgentHit` carries no coordinates, so a map would have nothing
to plot.

## Evidence

_(filled in as the task runs)_
