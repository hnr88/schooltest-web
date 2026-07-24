# STATE — mission `st-portal-redesign` (human mirror of STATE.json)

Implement the `dashbaord-design` export across the SchoolTest parent portal, wired to the real
Strapi API, inventing nothing, preserving existing behaviour, with real motion and mobile.
Plan: `.qa/PLAN.md` · Contracts: `.qa/CONTRACTS.md` · Resume: `.qa/HANDOFF.md`

**Totals:** 286 tasks · DONE 0 · DOING 0 · TODO 267 · BLOCKED 19

## Waves

| # | Slice | Tasks | Done | Blocked |
|---|---|---|---|---|
| W0 | Foundations — tokens, font, motion, dark mode | 14 | 0/14 | 0 |
| W1 | Design-system primitives | 38 | 0/38 | 0 |
| W2 | Backend metric surfaces (Strapi) | 22 | 0/22 | 3 |
| W3 | Typed client + query layer | 16 | 0/16 | 1 |
| W4 | App shell | 18 | 0/18 | 1 |
| W5 | Dashboard | 30 | 0/30 | 4 |
| W6 | Children list + child detail | 30 | 0/30 | 5 |
| W7 | Add-child wizard | 26 | 0/26 | 1 |
| W8 | Search — schools + agents | 24 | 0/24 | 1 |
| W9 | Notifications + settings | 24 | 0/24 | 2 |
| W10 | Auth screens + landing | 24 | 0/24 | 1 |
| W11 | Sweep — UI, a11y, security, regression | 20 | 0/20 | 0 |

## Per layer

| Layer | Tasks | Done |
|---|---|---|
| a11y | 8 | 0 |
| backend | 18 | 0 |
| data | 16 | 0 |
| frontend | 15 | 0 |
| integration | 18 | 0 |
| regression | 10 | 0 |
| security | 8 | 0 |
| ui | 193 | 0 |

## Ready now (deps satisfied, status TODO)

- **001** Land the design's 21 swatch-board colours as OKLCH `@theme` tokens with hex provenance (light) _(W0, ui)_
- **004** Settle the spacing scale against the design's off-4pt values and land the 1240px page frame token _(W0, ui)_
- **005** Land the design's eight published type steps as `--text-*` tokens with exact line-height and tracking _(W0, ui)_
- **007** Complete the radius scale with the design's 5px, 7px and 9px steps and publish the design-name→token map _(W0, ui)_
- **008** Confirm the four-step shadow scale and add the seven component elevations the design actually paints _(W0, ui)_
- **009** Prove and correct the self-hosted Google Sans stack — provenance, variable axis, and the design's exact fallback chain _(W0, ui)_
- **010** Land the exponential easing tokens and publish the design's five canonical transition durations _(W0, ui)_
- **060** Author the C-DASH-HOUSEHOLD Zod contract module and prove it against real Postgres rows _(W2, backend)_
- **061** Author the pure ISO-week / trailing-7-day / practice-streak helpers for the household aggregate _(W2, backend)_
- **069** Author the C-CHILD-RESULT-HISTORY Zod contract module and prove it against real result rows _(W2, backend)_
- **075** Add the parent branch to the result-view ownership matrix and grant getResult to parent _(W2, backend)_
- **100** Add one typed loading / empty / ready / error view-state contract over TanStack results _(W3, data)_
- **110** Portal shell frame — 24px detached gutter, 1600px cap, and the four @theme tokens the shell is missing _(W4, ui)_
- **200** Add the portal wizard token block and rebuild /dashboard/children/new as the portal two-column frame _(W7, ui)_
- **230** Re-skin the Find-a-school header band and the 48px search pill to the design _(W8, ui)_
- **237** Re-skin the school result card frame, typography and hover state to the design _(W8, ui)_
- **241** Re-skin the map panel frame and move the zoom controls to the design's top-right stack _(W8, ui)_
- **260** Fix the red notification-preference-controls round-trip — the SMS opt-out is clobbered by a concurrent spec writing the same parent's preference row _(W9, regression)_
- **290** Rebuild the auth split layout to the login brand panel (560px navy / 1fr form column) _(W10, ui)_
- **291** Rebuild the auth text/password field to the DS field states, incl. the error affordance _(W10, ui)_
- **300** Build the app-shell route skeleton from the design's shimmer system _(W10, ui)_
- **302** Rebuild the 404 page as the design's full-page numeral-plus-badge composition _(W10, ui)_
- **303** Rebuild the page-level empty-state pattern to app--empty-state.html and prove it on the real children empty state _(W10, ui)_
- **304** Re-skin the landing announcement bar and sticky nav, incl. the 375px sheet composition _(W10, ui)_
- **305** Re-skin the landing hero — media card, scrim, eyebrow pill, 68px h1, CTA row, value strip, logo wall _(W10, ui)_
- **306** Re-skin the landing features grid, including the navy highlighted card and the hover lift _(W10, ui)_
- **307** Re-skin the feature-detail split and its AI-feedback mock panel with real meter semantics _(W10, ui)_
- **308** Re-skin the navy stats band with its logo watermark and three coloured figures _(W10, ui)_
- **309** Re-skin the how-it-works steps card and the testimonial card beside it _(W10, ui)_
- **310** Re-skin the pricing grid — Free, the shadowed navy Pro card with its ribbon, and School _(W10, ui)_
- **311** Re-skin the FAQ accordion, with the chevron rotation the design actually declares _(W10, ui)_
- **312** Re-skin the closing CTA panel — three-stop navy gradient, watermark, white and ghost buttons _(W10, ui)_
- **320** UI sweep the app shell — every sidebar/topbar/user-menu/mobile-nav control at 375 and 1280 _(W11, ui)_
- **326** UI sweep auth, landing, 404 and loading states — every control at 375 and 1280 _(W11, ui)_
- **333** API security — the parent student surface and the two new aggregates refuse every unauthorized and forged request _(W11, security)_
- **334** API security — the widened result read refuses foreign, transient and forged requests _(W11, security)_
- **335** API security — search, search preferences, identity and upload refuse every unauthorized and forged request _(W11, security)_
- **336** API security — notifications, notification preferences and push subscriptions refuse every unauthorized and forged request _(W11, security)_

## BLOCKED

- **079** BLOCKED — no backend can serve the "coming up" hero stat or the "Coming up" list (B-1, B-2) — see task file
- **080** BLOCKED — no backend may serve composite scores, band-progress percentages or cohort percentiles (B-3, B-4, B-5, B-6) — see task file
- **081** BLOCKED — no content-type backs billing/credits or a per-child unread notification count (B-7, B-8) — see task file
- **102** BLOCKED — no query hook may be authored for the scheduling and composite-score metrics — see task file
- **116** Rail Billing nav entry — BLOCKED (B-7, no billing surface exists to link to) — see task file
- **138** BLOCKED — "coming up" hero stat has no data source (B-1) — see task file
- **151** BLOCKED — the teacher-authored "Note from school" with named author and Reply has no data source — see task file
- **152** BLOCKED — "Recommended this week" has neither a recommendation source nor an Assign action — see task file
- **153** BLOCKED — the "Coming up" list has no scheduling data source (B-2) — see task file
- **169** BLOCKED — the design's `last result 74%` metric has no honest data source — see task file
- **170** BLOCKED — `Progress to {nextLevel} 68%` requires a CEFR scorer the product forbids — see task file
- **180** BLOCKED — "Share with teacher" and "Assign practice" have no model, no endpoint and no handler — see task file
- **188** BLOCKED — `Avg. score`, `Trend` and `Of grade Top 15%` are a composite and a cohort percentile — see task file
- **189** BLOCKED — subject bars, letter grades and class averages are not this product's domain — see task file
- **220** BLOCKED — step 5's per-child cost notice has no pricing, plan or invoice data source — see task file
- **246** BLOCKED — school star rating, tag, note and placement claim have no data source — see task file
- **282** BLOCKED — the portal Billing screen and every plan/credit/invoice surface has no data model to build against — see task file
- **283** BLOCKED — a per-child unread notification count cannot be derived; the feed deliberately withholds the child id — see task file
- **299** BLOCKED — the login Parent/School segmented control and the register role cards — see task file

## DAG (adjacency list)

```
001 [TODO] Land the design's 21 swatch-board colours as OKLCH `@theme` tokens with hex provenance (light)
      deps: (none)
002 [TODO] Author the hover / disabled colour role tokens from the design's `style-hover` attributes
      deps: 001
003 [TODO] Complete and prove the `.dark` token layer, including the dark-only component tints the board shows
      deps: 001
004 [TODO] Settle the spacing scale against the design's off-4pt values and land the 1240px page frame token
      deps: (none)
005 [TODO] Land the design's eight published type steps as `--text-*` tokens with exact line-height and tracking
      deps: (none)
006 [TODO] Land the seven chrome type steps the typography board omits (masthead, section, eyebrow, group label, form label, count, inline code)
      deps: 005
007 [TODO] Complete the radius scale with the design's 5px, 7px and 9px steps and publish the design-name→token map
      deps: (none)
008 [TODO] Confirm the four-step shadow scale and add the seven component elevations the design actually paints
      deps: (none)
009 [TODO] Prove and correct the self-hosted Google Sans stack — provenance, variable axis, and the design's exact fallback chain
      deps: (none)
010 [TODO] Land the exponential easing tokens and publish the design's five canonical transition durations
      deps: (none)
011 [TODO] Land `st-fade-in`, `st-pop-in`, `st-toast-in` and `st-spin` as `--animate-*` tokens with a reduced-motion variant, and wire the dialog panel to `st-pop-in`
      deps: 010
012 [TODO] Re-author `st-shimmer` and `st-rec-pulse` to animate transform/opacity only, preserving the shipped skeleton visual
      deps: 010, 011
013 [TODO] Author the focus-ring foundation from `--ring` — a WCAG-conformant `focus-ring` utility, the design's input halo, and the error ring
      deps: 001, 008
014 [TODO] Consolidate the W0 foundation into one table-driven design-token e2e across light, dark, reduced-motion and both viewports
      deps: 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013
020 [TODO] Rebuild the design-system Button to the export's 8 variants, 5 sizes and 7 states
      deps: 001, 002, 004, 005, 006, 007, 008, 010, 011, 013
021 [TODO] Cut the IconButton family to the export's five square sizes and three tones
      deps: 001, 002, 004, 007, 010, 013, 020
022 [TODO] Rebuild the text Field shell — label, required marker, helper, inline error, disabled
      deps: 001, 004, 006, 007, 008, 010, 013
023 [TODO] Build the SearchInput primitive — leading magnifier, 38px inset, clear affordance
      deps: 001, 004, 006, 007, 008, 010, 013, 022
024 [TODO] Build the Textarea field — 3 rows, vertical resize, 1.5 line-height, focus + error rings
      deps: 001, 004, 006, 007, 008, 010, 013, 022
025 [TODO] Rebuild SelectField and SelectRow — custom chevron, three sizes, listbox popup animation
      deps: 001, 002, 004, 006, 007, 008, 010, 011, 013, 022
026 [TODO] Rebuild the Checkbox — 18px box, 5px radius, 1.5px border, white tick, disabled row
      deps: 001, 004, 007, 010, 011, 013, 022
027 [TODO] Rebuild the RadioGroup — 18px ring, 8px dot, roving focus, disabled state
      deps: 001, 004, 010, 011, 013, 022, 026
028 [TODO] Rebuild the Switch (40×22 track, 18px travel) and the settings ToggleRow it sits in
      deps: 001, 004, 006, 007, 008, 010, 013, 026
029 [TODO] Build the Slider control — 120px track, 16px thumb, fixed-width value readout
      deps: 001, 004, 007, 008, 010, 013, 028
030 [TODO] Rebuild the Badge — nine colour variants at 12.5px/600, pill radius, outline compensation
      deps: 001, 003, 006, 007
031 [TODO] Rebuild the status-dot pills and the count badges (notification, nav, avatar overflow)
      deps: 001, 006, 007, 010, 011, 030
032 [TODO] Rebuild the removable Tag and the filter chips (active, removable, dashed "Add filter")
      deps: 001, 002, 006, 007, 010, 011, 021, 030
033 [TODO] Rebuild the Alert — four variants, 36px icon chip, dismiss and action rows
      deps: 001, 003, 006, 007, 008, 010, 011, 020, 021, 030
034 [TODO] Skin sonner to the export's toast — navy surface, st-toast-in, 4s auto-dismiss, progress rail
      deps: 001, 003, 006, 007, 008, 010, 011, 021
035 [TODO] Rebuild the card shell family — 16px radius, 1px border, .05-alpha shadow, four paddings
      deps: 001, 003, 004, 006, 007, 008, 010, 011
036 [TODO] Rebuild the StatCard with icon chip and delta row (34px value, diagonal arrow)
      deps: 001, 003, 005, 006, 007, 035
037 [TODO] Rebuild ProgressBar (6px rail, gradient + solid fills) and the progress StatCard variant
      deps: 001, 003, 007, 010, 035, 036
038 [TODO] Rebuild the Avatar family — five sizes, presence dot, overlapping stack with overflow chip
      deps: 001, 006, 007, 010, 011
039 [TODO] Rebuild the navy featured card and the NavyPanel surface (watermark, eyebrow, white CTA)
      deps: 001, 004, 006, 007, 010, 020, 035
040 [TODO] Rebuild the Table — clipped card shell, toolbar, uppercase head row, hover row transition
      deps: 001, 004, 006, 007, 008, 010, 021, 031, 035
041 [TODO] Rebuild Pagination — range caption, chevron buttons, active/inactive pages, ellipsis
      deps: 001, 006, 007, 010, 021, 040
042 [TODO] Rebuild UnderlineTabs — 2px indicator over the 1px rule, 150ms colour transition
      deps: 001, 004, 005, 007, 010, 011, 013
043 [TODO] Rebuild the SegmentedControl in both documented sizes (11px and 10px tracks)
      deps: 001, 006, 007, 008, 010, 013, 027
044 [TODO] Rebuild the Dialog — blurred navy scrim (st-fade-in) and a pop-in panel, focus-trapped
      deps: 001, 003, 005, 006, 007, 008, 010, 011, 020, 021
045 [TODO] Build the Sheet — side/bottom drawer with Base UI starting/ending-style slide
      deps: 003, 007, 008, 010, 011, 021, 044
046 [TODO] Rebuild the DropdownMenu — 200px surface, 8px items, destructive item, separator
      deps: 001, 003, 006, 007, 008, 010, 011, 021
047 [TODO] Rebuild the Popover — 14px radius, 250px cap, readonly input + copy row
      deps: 001, 003, 006, 007, 008, 010, 011, 020, 022
048 [TODO] Rebuild the Tooltip — navy bubble, 12.5px/500, 8px offset, keyboard-reachable
      deps: 001, 006, 007, 008, 010, 011, 021
049 [TODO] Rebuild Skeleton + st-shimmer as a transform sweep, and the SkeletonCard composition
      deps: 001, 003, 007, 010, 012, 035
050 [TODO] Rebuild the EmptyState — 52px tinted icon tile, 280px measure, primary CTA
      deps: 001, 006, 007, 010, 011, 020, 035
051 [TODO] Rebuild the 404 block — 64px numeral with the logo mark as the zero
      deps: 001, 006, 007, 010, 011, 020, 035, 039
052 [TODO] Build the DropzoneCard — dashed 1.5px border, hover-transitioned shell, browse fallback
      deps: 001, 002, 004, 006, 007, 010, 013, 020, 035
053 [TODO] Build the navigation primitives — sidebar NavItem, topbar link and Breadcrumbs
      deps: 001, 003, 004, 005, 007, 010, 013, 031, 038
054 [TODO] Rebuild the BarChart primitive on recharts — 140px plot, 3-tier recency ramp, 38px cap
      deps: 001, 003, 006, 007, 008, 010, 035
055 [TODO] Rebuild the Sparkline (area + polyline) and the donut GaugeRing (dashoffset maths)
      deps: 001, 003, 006, 007, 010, 035, 036
056 [TODO] Rebuild the dashboard list rows — activity feed, upcoming event, rank row
      deps: 001, 003, 006, 007, 010, 011, 020, 031, 035, 038
057 [TODO] Rebuild the footer family — navy marketing footer, light app footer, cookie banner
      deps: 001, 003, 006, 007, 008, 010, 011, 020, 025, 039
060 [TODO] Author the C-DASH-HOUSEHOLD Zod contract module and prove it against real Postgres rows
      deps: (none)
061 [TODO] Author the pure ISO-week / trailing-7-day / practice-streak helpers for the household aggregate
      deps: (none)
062 [TODO] Stand up GET /api/my/progress end-to-end returning the four household count aggregates
      deps: 060
063 [TODO] Add practiceSecondsThisWeek, the 7-day practiceByDay series and strongestDay to /api/my/progress
      deps: 061, 062
064 [TODO] Add per-child testsCompleted, practiceSecondsThisWeek, practiceDayStreak and lastActivityAt
      deps: 061, 063
065 [TODO] Add per-child cefrBand, cefrStageIndex, acaraPhase and the skills[] array to /api/my/progress
      deps: 060, 064
066 [TODO] Derive focusSkill from readiness rank with the attribute-probability tiebreak, and close the C-DASH-HOUSEHOLD shape
      deps: 065
067 [TODO] Harden /api/my/progress edge cases — zero children, archived children, empty week, unknown enum
      deps: 066
068 [TODO] SECURITY — prove /api/my/progress leaks no other household and no private column
      deps: 067
069 [TODO] Author the C-CHILD-RESULT-HISTORY Zod contract module and prove it against real result rows
      deps: (none)
070 [TODO] Stand up GET /api/my/students/:documentId/results with ownership, official-only scope and pagination
      deps: 069
071 [TODO] Enforce the strict query contract on /api/my/students/:documentId/results — page, pageSize, skill, unknown keys
      deps: 070
072 [TODO] Add previousResultDocumentId and sessionDocumentId to the child result history (closes G12/G5)
      deps: 070
073 [TODO] Prove pagination arithmetic and sort determinism on the child result history
      deps: 071, 072
074 [TODO] SECURITY — prove the child result history refuses foreign children, transient results and bad queries
      deps: 073
075 [TODO] Add the parent branch to the result-view ownership matrix and grant getResult to parent
      deps: (none)
076 [TODO] Enforce 404-only failure and combined-scope child gating on the parent result read
      deps: 075
077 [TODO] SECURITY — prove the widened result read leaks no PII, no artefacts and no other family's data
      deps: 076
078 [TODO] Regenerate Strapi types, typecheck both packages, and prove W2 changed no existing endpoint
      deps: 068, 074, 077
079 [BLOCKED] BLOCKED — no backend can serve the "coming up" hero stat or the "Coming up" list (B-1, B-2)
      deps: (none)
080 [BLOCKED] BLOCKED — no backend may serve composite scores, band-progress percentages or cohort percentiles (B-3, B-4, B-5, B-6)
      deps: (none)
081 [BLOCKED] BLOCKED — no content-type backs billing/credits or a per-child unread notification count (B-7, B-8)
      deps: (none)
090 [TODO] Create the `results` module and mirror the C-PARENT-RESULT-VIEW body as a strict Zod schema
      deps: 071
091 [TODO] Encode the real CEFR ladder, skill order and readiness rank as shared constants + pure lookups
      deps: 090
092 [TODO] Add `useParentResultQuery` — the TanStack hook for one parent-readable official result
      deps: 090, 071
093 [TODO] Turn the raw `attributes` map into an ordered per-attribute mastery view model
      deps: 090, 091
094 [TODO] Mirror C-DASH-HOUSEHOLD (`GET /api/my/progress`) as a strict Zod schema + types
      deps: 065
095 [TODO] Add `useHouseholdProgressQuery` with an explicit loading / no-children / error contract
      deps: 094, 065
096 [TODO] Derive the practice duration, the 7-bar chart model and the strongest-day model from the household payload
      deps: 094
097 [TODO] Mirror C-CHILD-RESULT-HISTORY request params + paginated response as strict Zod schemas
      deps: 077
098 [TODO] Add `useChildResultHistoryQuery` — paginated, skill-filterable, with a real empty state
      deps: 097, 077
099 [TODO] Derive the honest band delta ("Since joining", per-row change) from the result history
      deps: 097, 091
100 [TODO] Add one typed loading / empty / ready / error view-state contract over TanStack results
      deps: (none)
101 [TODO] Add the household / result-history / delta i18n keys to all six catalogs, with a parity guard
      deps: 093, 096, 099, 100
102 [BLOCKED] BLOCKED — no query hook may be authored for the scheduling and composite-score metrics
      deps: (none)
103 [TODO] Make the three student mutations invalidate the new household and result-history caches
      deps: 095, 098
104 [TODO] Prove the household + result-history round-trip end to end against the running API
      deps: 095, 096, 098, 099
105 [TODO] Prove the C-PARENT-RESULT-VIEW ownership and error matrix from the client boundary
      deps: 092, 093
110 [TODO] Portal shell frame — 24px detached gutter, 1600px cap, and the four @theme tokens the shell is missing
      deps: (none)
111 [TODO] Detach the sidebar into the design's 248px floating card (24px radius, two-layer shadow, 28/16/16 padding)
      deps: 110
112 [TODO] Sidebar logo lockup — 26px, flush left, 36px breathing room, focus ring the design never drew
      deps: 111
113 [TODO] Rail groups — Manage/Account overlines, 2px nav gap, and the flex spacer that pins Account to the bottom
      deps: 111
114 [TODO] Nav item base — 11/14 padding, 12px radius, 14.5px label, 18px icon, plus the hover and focus the design never drew
      deps: 113
115 [TODO] Nav item ACTIVE state — the design's navy #0E2350 slab, 600 weight, white ink, and the e2e re-baseline that keeps it honest
      deps: 114
116 [BLOCKED] Rail Billing nav entry — BLOCKED (B-7, no billing surface exists to link to)
      deps: 113
117 [TODO] Rail user card — the design's #F4F6FA account card, carrying the existing user menu and Sign out
      deps: 111
118 [TODO] Top row — drop the 64px white bar for the design's chrome-less row over the page well
      deps: 110
119 [TODO] Breadcrumb — the design system's 13.5px trail with a 13px chevron separator, replacing the / text
      deps: 118
120 [TODO] Search pill — the design's 240x44 white capsule with a 16px magnifier, on the well
      deps: 118
121 [TODO] Notification bell — the design's 44px white circle, keeping the real unread count
      deps: 118
122 [TODO] Mobile nav Sheet — the detached rail's contents inside the 288px off-canvas panel at 375px
      deps: 115, 117
123 [TODO] Shell keyboard path — Ctrl+B, a complete visible focus ring set, and a proven Sheet focus trap
      deps: 115, 117, 118, 122
124 [TODO] Collapsed icon rail — keep the working Ctrl+B feature the export omits, re-skinned to the detached card
      deps: 115
125 [TODO] The shell at 375 — one composition pass over the frame, row and drawer with real measurements
      deps: 118, 119, 120, 121, 122
126 [TODO] Shell motion — one audited set of transitions from the design system's six keyframes, each with a reduced-motion variant
      deps: 115, 122, 124
127 [TODO] Shell wave close-out — full regression, six-locale parity, axe sweep, and the re-baseline record
      deps: 116, 123, 125, 126
130 [TODO] Wire the dashboard screen to GET /api/my/progress and define its page-level query contract
      deps: 090, 091, 110
131 [TODO] Rebuild the dashboard page composition — 28px section stack and the two auto-fit 2-up grids
      deps: 130
132 [TODO] Build the dashboard greeting row — date line and time-of-day H1
      deps: 131
133 [TODO] Build the navy hero panel shell — 24px navy card, two decorative circles, "This week" eyebrow
      deps: 131
134 [TODO] Render the hero headline sentence from real household data — no projection, no percentage
      deps: 133, 130
135 [TODO] Build the hero stat row with the servable stats only — two cells, one separator, no third slot
      deps: 133, 130
136 [TODO] Metric 1 — "tests completed" hero stat from household.testsCompletedThisWeek
      deps: 135
137 [TODO] Metric 3 — "practice this week" hero stat, {H}h {MM}m from practiceSecondsThisWeek
      deps: 135
138 [BLOCKED] BLOCKED — "coming up" hero stat has no data source (B-1)
      deps: 135
139 [TODO] Dashboard zero-children state — honest hero, add-a-child CTA, suppressed child sections
      deps: 133, 134, 144
140 [TODO] Build the "Practice minutes" card shell — header, range label, 120px plot area
      deps: 131
141 [TODO] Metric 4 — seven practice bars with heights NORMALISED from the week's max, not px==minutes
      deps: 140, 130
142 [TODO] Metric 5 — strongest-day caption from household.strongestDay, without the unservable clause
      deps: 140, 130
143 [TODO] Practice-minutes card loading, zero-week and error states
      deps: 141, 142
144 [TODO] Build the "My children" section — header, "See details" link, 24px list card
      deps: 131
145 [TODO] Build the "My children" row — avatar, name block, chevron, whole-row link to the child
      deps: 144, 130
146 [TODO] Metric 6 — per-child CEFR tick row rendering the REAL ladder pre_A1..C1, not the design's A1..C2
      deps: 145, 130
147 [TODO] Metric 7 — per-child "Focus: {skill}" pill from children[].focusSkill
      deps: 145, 130
148 [TODO] "My children" list loading, single-child and error behaviour
      deps: 145, 146, 147
149 [TODO] Child-row interaction states — hover, visible focus ring, keyboard traversal, contrast
      deps: 145, 146, 147
150 [TODO] Build the "Latest update" card in the design's note-card shell, fed by the real notification feed
      deps: 131
151 [BLOCKED] BLOCKED — the teacher-authored "Note from school" with named author and Reply has no data source
      deps: 150
152 [BLOCKED] BLOCKED — "Recommended this week" has neither a recommendation source nor an Assign action
      deps: 131
153 [BLOCKED] BLOCKED — the "Coming up" list has no scheduling data source (B-2)
      deps: 131
154 [TODO] Whole-page dashboard loading skeleton matching the final composition
      deps: 133, 140, 144, 150
155 [TODO] Dashboard page error state — real classification, real retry, no stale metrics
      deps: 130, 154
156 [TODO] Dashboard entrance motion — staggered section reveal with a full reduced-motion path
      deps: 133, 140, 144, 150, 154
157 [TODO] 375px composition of the whole dashboard — row reflow, collapsed grids, no fixed widths
      deps: 132, 135, 141, 142, 145, 146, 147, 150
158 [TODO] Every dashboard string in all six locale catalogs, key-identical, with correct ICU and formats
      deps: 132, 134, 136, 137, 139, 140, 141, 142, 144, 145, 146, 147, 150, 155
159 [TODO] Rewrite the dashboard e2e suite for the redesign, keeping every functional assertion green
      deps: 135, 136, 137, 139, 141, 142, 145, 146, 147, 149, 150, 154, 155, 156, 157, 158
165 [TODO] Join C-STUDENT-LIST with C-DASH-HOUSEHOLD into one children-list view model
      deps: 090, 110
166 [TODO] Rebuild the "My children" page header to the portal slice with an honest count subline
      deps: 165
167 [TODO] Build the ChildCard shell, auto-fit grid and identity row with the CEFR level pill
      deps: 165, 166
168 [TODO] Build the ChildCard metric strip from real household metrics (streak, tests, last assessed)
      deps: 167
169 [BLOCKED] BLOCKED — the design's `last result 74%` metric has no honest data source
      deps: 168
170 [BLOCKED] BLOCKED — `Progress to {nextLevel} 68%` requires a CEFR scorer the product forbids
      deps: 168, 181
171 [TODO] Build the child card footer — focus-skill note line and the "Details →" affordance
      deps: 167
172 [TODO] Build the dashed "Add a child" tile and the portal zero-children state
      deps: 166, 167
173 [TODO] Build the children-list shimmer skeleton and the error/retry state
      deps: 167
174 [TODO] Preserve archive/unarchive on the redesigned child card (menu, confirm dialog, toasts, DB proof)
      deps: 167
175 [TODO] Keep the archived filter and roster paging working on the card grid
      deps: 167, 174
176 [TODO] Prove the redesigned children list at 375/1280 — motion, axe, six locales, and the e2e regression
      deps: 166, 167, 168, 171, 172, 173, 174, 175
177 [TODO] Recompose the child detail route as the design's single vertical stack and join its three reads
      deps: 090, 110
178 [TODO] Build the child detail header — back link, 60px navy avatar, name and meta line
      deps: 177
179 [TODO] Ship the detail header's two pill actions as Edit and Archive/Unarchive
      deps: 178, 174
180 [BLOCKED] BLOCKED — "Share with teacher" and "Assign practice" have no model, no endpoint and no handler
      deps: 179
181 [TODO] Build the child-detail KPI strip from real household metrics
      deps: 177, 178
182 [TODO] Build the "Since joining" cell as an honest per-skill CEFR band movement
      deps: 181
183 [TODO] Build the "Level journey" six-tick CEFR ladder on the real API ladder, with its note
      deps: 177, 178
184 [TODO] Re-dress the activity snapshot and session-completion block into the portal card
      deps: 181
185 [TODO] Build the "Skills" card as four readiness rows in the sanctioned vocabulary
      deps: 177, 178
186 [TODO] Expand a skill row into its per-attribute mastery map from C-PARENT-RESULT-VIEW
      deps: 185
187 [TODO] Render not_assessed, low_confidence and effort_valid as first-class states on the Skills card
      deps: 185, 186
188 [BLOCKED] BLOCKED — `Avg. score`, `Trend` and `Of grade Top 15%` are a composite and a cohort percentile
      deps: 181, 185
189 [BLOCKED] BLOCKED — subject bars, letter grades and class averages are not this product's domain
      deps: 186, 190
190 [TODO] Build the "Recent results" rows from C-CHILD-RESULT-HISTORY
      deps: 177, 178
191 [TODO] Wire real pagination and the skill filter into Recent results
      deps: 190
192 [TODO] Open a full official-result report from a result row (C-PARENT-RESULT-VIEW)
      deps: 190, 186
193 [TODO] Build the child-detail skeleton, error and gone states
      deps: 178, 181, 185, 190
194 [TODO] Prove the redesigned child detail at 375/1280 — motion, axe, six locales, security and regression
      deps: 178, 179, 181, 182, 183, 184, 185, 186, 187, 190, 191, 192, 193
200 [TODO] Add the portal wizard token block and rebuild /dashboard/children/new as the portal two-column frame
      deps: (none)
201 [TODO] Build the 230px vertical step rail with the done/current/upcoming state matrix and gated jumps
      deps: 200
202 [TODO] Build the portal step card with the per-step heading block and the step-change transition
      deps: 200
203 [TODO] Build the wizard nav footer — Back, the Step n of 5 counter, and Continue / Confirm & add child
      deps: 202
204 [TODO] Re-skin the wizard text field to the portal label + 48px input + help text stack
      deps: 200
205 [TODO] Re-skin the wizard select trigger and popup to the portal 48px box, keeping localized item labels
      deps: 200, 204
206 [TODO] Add the portal chip variant to ChoicePillGroup — wide, medium and square sizes at 44px
      deps: 200
207 [TODO] Author the wizard's per-field invalid state — border, message, icon and ARIA — that the design omits
      deps: 204
208 [TODO] Rebuild step 1 Personal — given/family name, email and passport in the design's row grouping
      deps: 204, 207
209 [TODO] Ship step 1's Date of birth field and resolve the design's DD/MM/YYYY text input against the ISO wire format
      deps: 204, 207
210 [TODO] Ship step 1's Gender chip group as a full-width portal wide-chip radiogroup
      deps: 206
211 [TODO] Re-skin the Nationality control to the portal select box and keep the full country list
      deps: 204, 205
212 [TODO] Rebuild step 2's Current school and Current year level row in the portal dialect
      deps: 204, 205
213 [TODO] Ship step 2's Test year level field with the design's help text, and resolve the square-chip conflict
      deps: 205
214 [TODO] Ship step 2's required Target entry year select and Target entry term medium-chip row
      deps: 205, 206
215 [TODO] Rebuild step 3 Parent or guardian — name, phone, email and WeChat ID in the design's row grouping
      deps: 204, 207
216 [TODO] Ship step 3's Preferred contact channel as a full-width portal wide-chip radiogroup
      deps: 206
217 [TODO] Rebuild step 4 Photo & voice — the info panel and the two portal dropzones
      deps: 202, 204
218 [TODO] Author step 4's uploading, uploaded-preview and remove states in the portal dialect
      deps: 217
219 [TODO] Rebuild step 5 Review & confirm as the design's four-row summary table
      deps: 202
220 [BLOCKED] BLOCKED — step 5's per-child cost notice has no pricing, plan or invoice data source
      deps: 219
221 [TODO] Wire Confirm & add child to the real create mutation with the st-pop-in success confirmation
      deps: 203, 219
222 [TODO] Re-skin the wizard submit error path — offline, validation and server faults on step 5
      deps: 221
223 [TODO] Compose the whole wizard at 375px — horizontal rail, stacked rows, reachable footer
      deps: 201, 202, 203, 217, 219
224 [TODO] Carry the re-skinned wizard through edit mode without breaking the prefill or the PUT
      deps: 203, 219
225 [TODO] Sweep the re-skinned wizard — full regression, axe at 375 and 1280, motion audit, six-catalog parity
      deps: 221, 222, 223, 224
230 [TODO] Re-skin the Find-a-school header band and the 48px search pill to the design
      deps: (none)
231 [TODO] Render the school result count from the real pagination total in the header sub-line
      deps: 230
232 [TODO] Build the filter bar row — All-filters pill, divider, no-filters hint
      deps: 230
233 [TODO] Derive and render the applied-filter chip row with per-chip removal
      deps: 232
234 [TODO] Build the Filters overlay dialog shell with enter/exit motion and a focus trap
      deps: 232
235 [TODO] Re-skin the filter groups to the design's 42px on/off chips, shared by rail and dialog
      deps: 234
236 [TODO] Wire the filters dialog footer — Clear all and the live "Show N schools" action
      deps: 234, 235
237 [TODO] Re-skin the school result card frame, typography and hover state to the design
      deps: (none)
238 [TODO] Build the school card's divider footer from real hit fields only
      deps: 237, 246
239 [TODO] Add click-to-select on school cards with the design's selected border and shadow
      deps: 237
240 [TODO] Implement the design's animated map camera — setView below zoom 9, panTo above
      deps: 239, 241
241 [TODO] Re-skin the map panel frame and move the zoom controls to the design's top-right stack
      deps: (none)
242 [TODO] Adopt the design's CARTO Light basemap and whole-Australia initial view
      deps: 241
243 [TODO] Re-skin the map pins to the design's label pill and stem, with a selected variant
      deps: 239
244 [TODO] Re-skin the cluster bubbles and move the clustering threshold to zoom 9
      deps: 242
245 [TODO] Add the floating selected-school card to the map panel
      deps: 239, 246
246 [BLOCKED] BLOCKED — school star rating, tag, note and placement claim have no data source
      deps: (none)
247 [TODO] Lay out the desktop list/map split on the design's fixed 340px list rail
      deps: 237, 241
248 [TODO] Compose the search surface at 375px — the map collapses, filters go to the overlay
      deps: 247, 234
249 [TODO] Match the search loading skeleton to the new card geometry with a shimmer
      deps: 237
250 [TODO] Re-skin the search empty and error states to the redesigned surface
      deps: 237
251 [TODO] Bring the agents tab onto the redesigned search surface
      deps: 230, 237, 253
252 [TODO] Apply the parent's saved search preferences to the school search, and let them save the current filters
      deps: 235
253 [TODO] Re-skin the sort control as the design's dropdown chip and keep both panes on one component
      deps: 231
260 [TODO] Fix the red notification-preference-controls round-trip — the SMS opt-out is clobbered by a concurrent spec writing the same parent's preference row
      deps: (none)
261 [TODO] Recut the notifications page to the portal shell — 820px column, 30px title, live unread subtitle, single 24px feed card
      deps: 001, 004, 005, 006, 007, 008, 010, 011, 013, 035, 110
262 [TODO] Rebuild the notification row to the design — 40px glyph tile, hairline rows, and the unread/read tile+dot state pair
      deps: 001, 006, 007, 010, 013, 261
263 [TODO] Ship the design's three-tier notification timestamp — relative hours, weekday name, then D MMMM
      deps: 262
264 [TODO] Group the feed into the design's TODAY / EARLIER sections with the 12px uppercase group header
      deps: 006, 262
265 [TODO] Recut per-row mark-as-read to the design's dot affordance with a real optimistic write that survives reload
      deps: 010, 013, 020, 262
266 [TODO] Build the header "Mark all as read" text action with its real bulk write and honest disabled state
      deps: 010, 020, 034, 261, 265
267 [TODO] Add the category + unread filter chips over the real ?category= and ?read= query parameters
      deps: 013, 032, 261, 264
268 [TODO] Make the whole notification row its deep link, preserving every calm not-found path
      deps: 013, 262
269 [TODO] Recut feed pagination to the portal dialect over the real server pagination meta
      deps: 041, 261
270 [TODO] Give the feed its three honest states — shimmer skeleton, empty card, and a retryable error inside the card
      deps: 012, 033, 049, 050, 261
271 [TODO] Rebuild the topbar bell popover to the app dropdown panel — 420px, semantic icon tiles, NEW count badge, unread tint
      deps: 031, 047, 121, 262, 263
272 [TODO] Recut the settings shell to the portal column — 30px title, portal subtitle, and the URL-addressable tab row re-dressed
      deps: 042, 110, 261
273 [TODO] Rebuild the settings Account card to the design's avatar row over the real /api/users/me payload
      deps: 035, 038, 272
274 [TODO] Build the settings Language card as the real locale switcher in the design's pill chips
      deps: 032, 272
275 [TODO] Rebuild the Password & security card in the portal dialect over the real change-password flow, without the two facts that have no data
      deps: 013, 020, 022, 272
276 [TODO] Rebuild the four delivery-channel toggle rows to the portal switch — 46×27 track, 19px transform travel, SMS caveat intact
      deps: 010, 028, 260, 272
277 [TODO] Recut the category toggles and give the non-suppressible account/security rows a truthful locked state
      deps: 031, 276
278 [TODO] Recut the email-frequency digest field to the portal select, keeping the deferred options honestly unselectable
      deps: 013, 025, 272
279 [TODO] Recut the preference save affordance and its four states — idle, saving, saved, refused — in the portal dialect
      deps: 020, 033, 034, 049, 276, 277, 278
280 [TODO] Recut the device-notification control to the portal card, keeping every real push status and both real endpoints
      deps: 020, 031, 272
281 [TODO] Compose notifications and settings at 375px — the mobile rules the design never wrote
      deps: 125, 267, 270, 271, 279, 280
282 [BLOCKED] BLOCKED — the portal Billing screen and every plan/credit/invoice surface has no data model to build against
      deps: 116, 272
283 [BLOCKED] BLOCKED — a per-child unread notification count cannot be derived; the feed deliberately withholds the child id
      deps: 266
290 [TODO] Rebuild the auth split layout to the login brand panel (560px navy / 1fr form column)
      deps: (none)
291 [TODO] Rebuild the auth text/password field to the DS field states, incl. the error affordance
      deps: (none)
292 [TODO] Re-skin the sign-in screen to app--login.html without reordering a single focusable node
      deps: 290, 291
293 [TODO] Build the auth status/error banner set (invalid credentials, unconfirmed, google, session, confirmed)
      deps: 292
294 [TODO] Re-skin the sign-up screen to the register form card, with only the fields the API accepts
      deps: 290, 291
295 [TODO] Re-skin the "check your inbox" confirm state and its resend countdown button
      deps: 294
296 [TODO] Re-skin the forgot-password screen — request card and sent card as two states of one screen
      deps: 290, 291
297 [TODO] Re-skin the reset-password screen, including the missing/garbage-code invalid-link state
      deps: 290, 291
298 [TODO] Re-skin the Google social button and the callback screen, keeping the flow env-gated
      deps: 292, 294
299 [BLOCKED] BLOCKED — the login Parent/School segmented control and the register role cards
      deps: 292, 294
300 [TODO] Build the app-shell route skeleton from the design's shimmer system
      deps: (none)
301 [TODO] Build the public/auth route loading skeleton and wire every auth submit to st-spin
      deps: 300
302 [TODO] Rebuild the 404 page as the design's full-page numeral-plus-badge composition
      deps: (none)
303 [TODO] Rebuild the page-level empty-state pattern to app--empty-state.html and prove it on the real children empty state
      deps: (none)
304 [TODO] Re-skin the landing announcement bar and sticky nav, incl. the 375px sheet composition
      deps: (none)
305 [TODO] Re-skin the landing hero — media card, scrim, eyebrow pill, 68px h1, CTA row, value strip, logo wall
      deps: (none)
306 [TODO] Re-skin the landing features grid, including the navy highlighted card and the hover lift
      deps: (none)
307 [TODO] Re-skin the feature-detail split and its AI-feedback mock panel with real meter semantics
      deps: (none)
308 [TODO] Re-skin the navy stats band with its logo watermark and three coloured figures
      deps: (none)
309 [TODO] Re-skin the how-it-works steps card and the testimonial card beside it
      deps: (none)
310 [TODO] Re-skin the pricing grid — Free, the shadowed navy Pro card with its ribbon, and School
      deps: (none)
311 [TODO] Re-skin the FAQ accordion, with the chevron rotation the design actually declares
      deps: (none)
312 [TODO] Re-skin the closing CTA panel — three-stop navy gradient, watermark, white and ghost buttons
      deps: (none)
313 [TODO] Re-skin the marketing footer — 1.4fr brand column, three link columns, bottom bar and status chip
      deps: 312
320 [TODO] UI sweep the app shell — every sidebar/topbar/user-menu/mobile-nav control at 375 and 1280
      deps: (none)
321 [TODO] UI sweep /dashboard — every hero/chart/child-row/note control at 375 and 1280, plus the B-1/B-2 refusal
      deps: 320
322 [TODO] UI sweep the children list and child detail — archive/unarchive/pagination/tabs at 375 and 1280
      deps: 320
323 [TODO] UI sweep the add-child wizard and edit mode — every field, step, upload and submit at 375 and 1280
      deps: 320
324 [TODO] UI sweep unified search — schools, agents, map, filter rail and sort at 375 and 1280
      deps: 320
325 [TODO] UI sweep notifications and settings — feed, mark-read, all four settings tabs and push at 375 and 1280
      deps: 320
326 [TODO] UI sweep auth, landing, 404 and loading states — every control at 375 and 1280
      deps: (none)
327 [TODO] axe — zero serious/critical on the dashboard shell, /dashboard, children list and child detail
      deps: 321, 322
328 [TODO] axe — zero serious/critical on the add-child wizard, edit form, all four settings tabs and the notification feed
      deps: 323, 325
329 [TODO] axe — zero serious/critical on unified search (incl. map), the five auth screens, landing, 404 and /design-system
      deps: 324, 326
330 [TODO] Motion audit — every interactive element has a 150-200ms transition and a prefers-reduced-motion variant
      deps: 320, 321, 322, 323, 324, 325, 326
331 [TODO] Touch-target audit — every interactive control is at least 44x44 CSS px at 375 and 1280
      deps: 320, 321, 322, 323, 324, 325, 326
332 [TODO] No-broken-UI audit — zero horizontal scroll, overflow, clipping, FOUC or console errors at 375 and 1280
      deps: 320, 321, 322, 323, 324, 325, 326
333 [TODO] API security — the parent student surface and the two new aggregates refuse every unauthorized and forged request
      deps: (none)
334 [TODO] API security — the widened result read refuses foreign, transient and forged requests
      deps: (none)
335 [TODO] API security — search, search preferences, identity and upload refuse every unauthorized and forged request
      deps: (none)
336 [TODO] API security — notifications, notification preferences and push subscriptions refuse every unauthorized and forged request
      deps: (none)
337 [TODO] i18n parity sweep — all six catalogs key-identical and zero hardcoded user-facing strings in the mission diff
      deps: 320, 321, 322, 323, 324, 325, 326
338 [TODO] Banned-pattern grep gate — zero mock/fake/stub/dummy/placeholder/TODO/FIXME and zero hardcoded array standing in for a query
      deps: 330, 331, 332, 333, 334, 335, 336, 337
339 [TODO] FINAL REGRESSION — the whole Playwright suite green, at or above the 157-passing baseline, with the one known red fixed
      deps: 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338
```
