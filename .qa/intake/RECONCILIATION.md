# RECONCILIATION.md — design vs API vs existing code

Authoritative gap analysis for the "implement dashbaord-design, wired to the real API" mission.

**Inputs read in full** (nothing here is inferred from any other source):
`.qa/design/spec/01-portal-dashboard.md`, `02-portal-children.md`, `03-portal-forms.md`,
`04-ds-foundations.md`, `05-ds-components.md`, `06-auth-states-landing.md`,
`.qa/intake/web-inventory.md`, `.qa/intake/api-inventory.md`, `.qa/intake/docs-constraints.md`,
`.qa/design/screens-index.json`.
Two facts were verified directly against the working tree because the plan depends on them:
`src/app/globals.css:1-4` imports `tailwindcss` + `tw-animate-css` + `shadcn/tailwind.css` + `leaflet`,
and `package.json:46` pins `tw-animate-css ^1.4.0` (`package.json:65` `tailwindcss ^4.3.2`,
`package.json:42` `recharts 3.9.2`). `git status --short` reports **219 entries**.

Endpoint references use the numbering in `.qa/intake/api-inventory.md` §1 (`#1`…`#26`).
Gap references use `.qa/intake/api-inventory.md` §GAPS (`G1`…`G24`).

---

## SURFACE MAP

Verdict vocabulary is exactly as specified. `screens-index.json` has 112 entries; every entry that is
PARENT-PORTAL, AUTH or LANDING relevant is listed. Entries that are unambiguously the Electron student
runner, the item bank, or the teacher/school console are grouped at the end so the table stays readable.

### A. Parent portal — canonical chrome (`dashbaord-design/Parent Portal.dc.html`)

| Design slice | Design label | Existing route | Existing module | Verdict | Evidence |
|---|---|---|---|---|---|
| `portal--detached-sidebar.html` | DETACHED SIDEBAR | `/[locale]/dashboard/*` (layout) | `shell` | **REDESIGN** | `dashboard/layout.tsx:20-39` already renders `ParentGuard > SidebarProvider(--sidebar-width:248px) > AppSidebar + AppTopbar` (web-inventory §1). Design sidebar is also 248px (spec 01 §1.2). Nav differs: design has 5 items in 2 groups (Overview/My children/Search + Billing/Settings), code has 4 (`shell/constants/nav.constants.ts:9-32`). Billing is BLOCKED (row B7) so the rail ships with 4 + Notifications. |
| `portal--main.html` (dashboard view, `isDash`) | MAIN — dashboard | `/[locale]/dashboard` | `dashboard` | **REDESIGN** | Route is FUNCTIONAL today: `useAuth`→`GET /api/users/me`, `useDashboardOverviewStudentsQuery`→`GET /api/my/students` (web-inventory §1). Layout, hero panel, children rows and Coming-up list are new; **3 of the 4 hero metrics are not servable** — see §DASHBOARD METRICS rows 1-5. |
| `portal--main.html` (search view, `isSearch`) | MAIN — Find a school | `/[locale]/dashboard/search?mode=schools` | `unified-search`, `school-search` | **REDESIGN** | `POST /api/search/schools` (#10) is live via `useSchoolSearchQuery`; Leaflet + `react-leaflet-cluster` already ship (web-inventory stack line). Design's 340px rail + fluid map maps onto the existing `grid-cols-search-workspace` utility (globals.css). School `rating` and the "accepts SchoolTest placement" line are BLOCKED (rows 11, 9). |
| `portal--my-children-list.html` | MY CHILDREN — LIST | `/[locale]/dashboard/children` | `children` | **REDESIGN** | `GET /api/my/students` (#1) + archive/unarchive (#6/#7) already wired (web-inventory §1). Design's ChildCard metric strip is 3 cells of which **0 are servable as designed** (rows 16-18). |
| `portal--child-detail.html` | CHILD DETAIL | `/[locale]/dashboard/children/[documentId]` | `children` | **REDESIGN** | `GET /api/my/students/:id` (#2) + `…/progress` (#3) already wired. Design has **no tabs**; code has `ChildProfileTabs` — the tabs are a code-only construct and must be reconciled (spec 02 §B: "There are NO tabs on this screen"). |
| `portal--add-child-multi-step.html` | ADD CHILD — MULTI-STEP | `/[locale]/dashboard/children/new` and `…/[documentId]/edit` | `student-wizard` | **REDESIGN** | 5-step wizard already exists with the same step names (`WizardStepper`, `StepPersonal/Education/Guardian/Media/Review`), `POST /api/upload` (#26) + `POST /api/students` (#4) / `PUT /api/students/:id` (#5). Field-for-field the design's 19 fields are a subset of `parentStudentCreateSchema` (api-inventory #4 body table) — the only mismatch is the design's 9-item `Nationality` list vs the code's `NationalityCombobox`. |
| `portal--notifications.html` | NOTIFICATIONS | `/[locale]/dashboard/notifications` | `notifications` | **REDESIGN** | `GET /api/notifications` (#14), `PUT …/:id/read` (#17), `POST …/read-all` (#16) all wired. Design's per-row glyph (`B1`, `$`, `5`) needs `notification.data`, which is deliberately withheld (`services/notification.ts:15-18`, G13) — glyph must be derived from `category`/`eventType` instead. |
| `portal--settings.html` | SETTINGS | `/[locale]/dashboard/settings` | `settings`, `notifications`, `auth` | **REDESIGN** | 4 of the design's 4 cards have a backing endpoint: Account `GET/PUT /api/users/me` (#23/#24), Language → **no endpoint** (see note), Notifications `GET/PUT /api/notification-preferences/me` (#18/#19), Password `POST /api/auth/change-password` (#25). Code today uses tabs (`SettingsTabs`, `?tab=`); design uses 4 stacked cards with **no tabs** (spec 03 §4.1). |
| `portal--billing.html` | BILLING | NONE | — | **BLOCKED-NO-API** | Missing precisely: there is no plan, subscription, invoice, payment-method or credit content-type anywhere in `schooltest-api/src/api/` (api-inventory §1 lists all 26 parent-reachable endpoints; none is billing) and no billing action appears in the parent grant list (`permissions-actions.ts:144-152`). Every value on the screen — `A$36`, `Family plan`, `Visa ending 4242`, the 4 invoice rows — has no source. Do not build. |

**Portal Language card (settings §2):** the 5 language chips have no persistence endpoint. `PUT /api/users/me`
(#24) accepts `preferences: Record<string, unknown>` (update-me.ts:23-47), so a report-language preference
**is** storable there — that is the only servable path, and it is a re-purposing, not a designed one.

### B. Parent surfaces drawn only in the App chrome (`SchoolTest App Screens.dc.html`)

| Design slice | Design label | Existing route | Existing module | Verdict | Evidence |
|---|---|---|---|---|---|
| `app--login.html` | Login | `/[locale]/sign-in` | `auth` | **REDESIGN** | `POST /api/auth/local` wired; `AuthSplitLayout > SignInCard > SignInForm` already exists (web-inventory §1). Design is a `560px 1fr` split with a navy brand panel — the module is already named `AuthSplitLayout`. Google button is the only social provider in the design and `/auth/google/callback` is already FUNCTIONAL. |
| `app--register.html` | Register | `/[locale]/sign-up` | `auth` | **REDESIGN** | `POST /api/auth/local/register` + `POST /api/auth/send-email-confirmation` wired. Design's 2-card role picker (parent/school) has **no backing role selection** — `POST /api/students`/registration assigns the parent role server-side; a "school" role sign-up has no endpoint. Ship the parent card only, or drop the picker. |
| `app--forgot-password.html` | Forgot password | `/[locale]/forgot-password` (+ `/reset-password`) | `auth` | **REDESIGN** | `POST /api/auth/forgot-password` + `POST /api/auth/reset-password` wired; `ForgotPasswordSentState` + `ResendCountdownButton` already implement the design's `Resend email (0:42)` cooldown. |
| `app--loading-skeleton.html` | Loading skeleton | all `/dashboard/*` | `dashboard`, `children`, `notifications`, `design-system` | **REDESIGN** | `DashboardSkeleton`, `ChildrenRosterSkeleton`, `ChildProfileSkeleton`, `SearchCardSkeletonList`, `app/[locale]/loading.tsx` all exist. `@keyframes st-shimmer` + `@utility shimmer-sweep` already live in `globals.css` (web-inventory §5). |
| `app--404.html` | 404 | `/[locale]` catch-all | root chrome | **REDESIGN** | `src/app/[locale]/not-found.tsx` and `src/app/global-error.tsx` exist. |
| `app--empty-state.html` | Empty state | `/[locale]/dashboard/children` (zero children) | `children` | **REDESIGN** | `ChildrenEmptyState` exists and `students-list.spec.ts` asserts "fresh parent sees the real empty state". **The design's student-code card is BLOCKED**: no code-verify/link endpoint exists (`student-magic-link` exposes only `request`/`verify`/`me` + parent `issueMagicLink` #8; G19). Ship the shell + copy, replace the code card with "Add a child" → `/dashboard/children/new`. |
| `app--parent-overview.html` | Parent overview | `/[locale]/dashboard` | `dashboard` | **REDESIGN** | Explicitly a **non-canonical variant** of the same surface (spec 01 §1.4: "Record it as a variant, not the target"; spec 03 §1.1 names the portal canonical). Build the portal composition. Its unique metrics (Test credits, Avg. score, Tests taken, vs last month, credit ledger) are rows 14, 19-23 below — 5 of 6 BLOCKED. |
| `app--add-child.html` | Add child (modal) | `/[locale]/dashboard/children/new` | `student-wizard` | **REDESIGN** | Reference-only: spec 03 §1.1 and UNKNOWN 18 record the modal and the 5-step wizard as "mutually incompatible" designs for one feature; the portal wizard is canonical. Its `Student code` segment is BLOCKED (same as the empty state). |
| `app--onboarding-add-child.html` | Onboarding add child | NONE | `auth`, `student-wizard` | **BUILD-WIRED** | The "Add manually" branch is exactly `POST /api/students` (#4), which is live. Nothing exists at a post-signup step-2 route today (`/sign-up` ends in `SignUpConfirmState`). The `Student code → Verify → match found → Link` branch is BLOCKED (no endpoint). Build the manual branch only, as a thin route that redirects into the wizard. |
| `app--parent-settings.html` | Parent settings | `/[locale]/dashboard/settings` | `settings` | **REDESIGN** | Reference-only variant (2-column card grid vs the portal's 4 stacked cards; spec 03 UNKNOWN 18). Its `Two-factor authentication · Enabled · SMS` and `Delete account` rows are BLOCKED — `/api/users/me` (#23) returns no 2FA flag and no account-deletion action is granted (`permissions-actions.ts:144-152`). |
| `app--notifications.html` | Notifications (dropdown panel) | topbar bell on `/dashboard/*` | `notifications` | **REDESIGN** | `NotificationBell` + `NotificationPreviewPanel/List/Item` already exist and call `useNotificationsQuery`. The panel's `4 NEW` badge = `meta.unreadCount` (#14). Semantic icon tints map to `category` (5 values) and `eventType` (9 values), both in the exposed whitelist. |
| `app--child-profile.html` | Child profile | `/[locale]/dashboard/children/[documentId]` | `children` | **REDESIGN** | Reference-only variant of the portal child detail (spec 02 §0: "Do not merge them"). Its subject cards (Math/Danish/English) model a subject system SchoolTest does not have — the real axis is reading/listening/speaking/writing (docs-constraints §2). Metrics rows 40-47. |
| `app--result-detail.html` | Result detail | NONE | — | **BLOCKED-NO-API** | Missing precisely: `GET /api/results/:documentId` (`api::result.result.getResult`) is granted to student/teacher/admin only (`permissions-actions.ts:118,126,138`) **and** `result-view.ts:54-68` has no `parent` branch — a parent caller hits `throw new ForbiddenError('role may not read results (C-4)')` at `:67`. Both locks must be removed before any result-detail page can exist (G2). |
| `app--all-results.html` | All results | NONE (`All reports →` link on child detail) | — | **BLOCKED-NO-API** | `recentResults` is hard-capped at 5 with no `page`, no `skill=`, no date range and no `limit` override (`parent-progress.ts:143`, `contracts/parent-child-progress.ts:45`, G4). No parent-reachable results-history endpoint exists. |
| `app--admissions-profile.html` | Admissions profile | NONE | — | **BLOCKED-NO-API** | The Admissions Profile is one of the three report views (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:197-207`) and renders `attributes` (per-attribute `{status, prob, items, delta}`), `acara_phase`, `low_confidence`, `effort_valid` — the entire `ResultView` (`src/contracts/results.ts:69-95`), all unreachable for a parent (G2). |
| `app--glance-report.html` | Glance report | NONE | — | **BLOCKED-NO-API** | Needs four display labels + four ACARA phases side by side, i.e. the latest result per skill. Parent sees at most 5 mixed-skill summary rows with no `acara_phase` field at all (`parent-child-progress.ts:32-40`). G2 + G6. |
| `app--progress-report.html`, `app--progress-report-2.html` | Progress report | NONE | — | **BLOCKED-NO-API** | Needs per-attribute transition statements and probability deltas vs the previous sitting (`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:72`). `previous_result` and `delta` live only inside `ResultView` (G2); `recentResults` carries no `previousResultDocumentId` (G12). |
| `app--assign-test.html` | Assign test | NONE (`Assign practice` button on child detail) | — | **BLOCKED-NO-API** | No content-type models a scheduled or assigned test (G18); `POST /api/sessions` is student/teacher/admin only (api-inventory §3.2). The design's `Assign` actions on the dashboard "Recommended this week" card have the same blocker. |
| `app--not-enough-credits.html`, `app--buy-credits.html`, `app--checkout.html`, `app--payment-success.html`, `app--payment-failed.html`, `app--receipt.html`, `app--auto-top-up.html`, `app--billing.html`, `app--test-catalog.html` | credits / billing / catalog | NONE | — | **BLOCKED-NO-API** | No credit, order, invoice, payment-method or purchasable-product content-type exists; `/api/forms` find/findOne is teacher/admin only (`src/api/form/routes/form.ts:7-8`, api-inventory §3.2). Nine screens, zero backing data. |
| `app--invite-co-parent.html` | Invite co-parent | NONE | — | **BLOCKED-NO-API** | `student.parent` is a single relation; there is no co-parent/household/invite content-type and no invite action in the parent grant list. The only invite-shaped endpoint is `POST /api/students/:id/magic-link` (#8), which invites the **child**, not a second parent. |
| `app--remove-child.html` | Remove child | `/[locale]/dashboard/children` (dialog) | `children` | **REDESIGN** | `ArchiveConfirmDialog` + `POST /api/students/:id/archive` (#6) already implement a reversible removal (`dashboard-students.spec.ts` proves archive→unarchive against the DB). Hard delete is BLOCKED — `student.delete` is not in the parent grant list. Slice not read by any extractor (see UNKNOWNS). |
| `app--export-preview.html` | Export preview | NONE | — | **OUT-OF-SCOPE** | `api::result.export.exportDiagnostic` is teacher+admin (`permissions-action-refs.ts:69-74`) and the docs scope the diagnostic export to "Teacher role, own students only" (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:182`). |

### C. Landing (`SchoolTest Landing.dc.html`)

All eight slices map onto `/[locale]` which is **STATIC** today (`src/app/[locale]/page.tsx:28-54`, zero hooks)
and already renders a component per section from `@/modules/landing`.

| Design slice | Existing component | Verdict |
|---|---|---|
| `landing--hero.html` | `HeroSection`, `HeroFlow`, `TrustedByStrip`, `AnnouncementBar`, `LandingHeader` | **REDESIGN** |
| `landing--features.html` | `FeaturesSection` | **REDESIGN** |
| `landing--feature-detail.html` | `FeatureDetailSection`, `AiFeedbackCard` | **REDESIGN** |
| `landing--stats.html` | `StatsBand` | **REDESIGN** |
| `landing--how-it-works.html` | `HowItWorksSection`, `TestimonialCard` | **REDESIGN** |
| `landing--pricing.html` | `PricingSection`, `PricingCard` | **REDESIGN** |
| `landing--faq.html` | `FaqSection` | **REDESIGN** |
| `landing--cta.html` | `CtaSection`, `LandingFooter` | **REDESIGN** |

Landing numbers (`2.4M`, `98%`, `6 hrs`, `1,200+ schools`, `$0`/`$29`) are marketing copy with no data
source (spec 06 §8.1) **and** are gated by the pre-launch claim constraint
(`SCHOOLTEST_ONSHORE_HANDOFF.md:13-18`: no "trusted by X schools" claims, no "validated"/"proven").
Treat every one as an i18n string a human owns, never as a metric.

### D. Design-system slices (`SchoolTest Design System.dc.html`)

All map onto `/[locale]/design-system`, which exists and is **STATIC** (`design-system/page.tsx:33-56`,
12 showcase sections) plus the `design-system` module (~100 components + `primitives.ts`).

| Design slice | Verdict | Note |
|---|---|---|
| `ds--header`, `ds--logo`, `ds--colors`, `ds--typography` | **REDESIGN** | Feeds the token layer (Wave 1) and the `BrandSection` showcase. |
| `ds--buttons`, `ds--forms`, `ds--badges`, `ds--alerts` | **REDESIGN** | `ButtonsSection`, `FormsSection`, `BadgesSection`, `AlertsSection`, `ChoicesSection` exist. |
| `ds--cards`, `ds--table`, `ds--tabs`, `ds--overlays`, `ds--navigation` | **REDESIGN** | `CardsSection`, `DataSection`, `OverlaysSection`, `RecordsSection` exist. |
| `ds--dashboard-components` | **REDESIGN** | 16 components specced (spec 05 §6). `BarChart`, `Sparkline`, `SkeletonCard`, `ActivityFeedRow`, `RankRow`, `UpcomingEventRow`, `FilterRail` already exist as untracked new files. Showcase-only for the ones whose data is BLOCKED. |
| `ds--landing-components`, `ds--footers` | **REDESIGN** | `ds--footers` also carries the compact AuthCard, the compact 404 card and the cookie banner. |
| `ds--dark-mode` | **REDESIGN** (token + showcase only) | `.dark` block already exists in `globals.css:267-304` but is **unreachable**: `providers.tsx:36-52` sets `forcedTheme="light"`, and `/home/hnr/Code/schooltest/.qa/RULES.md:90-91` records force-light as a deliberate prior decision, do not revert. Ship the dark tokens; do not ship a theme toggle. |
| `ds--test-components`, `ds--pte-task-library` | **OUT-OF-SCOPE** | Item renderers and PTE task types for the Electron student runner. |

### E. Bulk OUT-OF-SCOPE (Electron student app / unbuilt teacher-school portal)

**OUT-OF-SCOPE**, all of them — no parent grant and no route in this repo:
`app--student-home`, `app--practice-setup`, `app--placement-start`, `app--system-check`,
`app--microphone-check`, `app--headphones-check`, `app--camera-check`, `app--identity-confirm`,
`app--accessibility-panel`, `app--resume-prompt`, `app--stage-gate`, `app--connection-lost`,
`app--proctoring-warning`, `app--session-end`, `app--practice-feedback`,
the 16 `app--item-*` slices, `app--student-test-taking`, `app--test-submitted`,
`app--live-monitor`, `app--reports-list`, `app--item-bank`, `app--question-editor`,
`app--publish-test`, `app--grading`, `app--class-detail`, `app--student-detail`,
`app--message-parents`, `app--test-calendar`, `app--school-overview`, `app--students`,
`app--parents`, `app--create-test`, `app--school-analytics`, `app--school-settings`.
Evidence: none of `getSession`, `createSession`, `myStudentsSessions`, `myStudentsResults`,
`media.resolveRef`, `export.*`, `/api/items`, `/api/forms`, `/api/classes`, `/api/schools` CRUD is
granted to `parent` (api-inventory §3.2), and `schooltest-web` is the parent portal
(`schooltest-web/.qa/RULES.md:22`, corroborated by `src/i18n/messages/en.json:188`).

### F. Functional surfaces with NO design slice (must not be lost)

| Route | Module | Note |
|---|---|---|
| `/[locale]/dashboard/search?mode=agents` | `agent-search`, `unified-search` | `POST /api/search/agents` (#11) is live with 6 filters, 5 sorts and a verified-only gate. **The design contains no agent-search screen at all.** Extend the school-search visual language; do not delete the feature. |
| `/[locale]/dashboard/search/schools`, `…/agents` | — | 308 `permanentRedirect` into `?mode=` (web-inventory §1). Keep. |
| `/[locale]/dashboard/settings` search-preferences panel | `settings` | `GET/PUT /api/search-preferences/me` (#12/#13). No design slice. Keep as a 5th settings card. |
| `/[locale]/dashboard/settings` push-subscription control | `notifications` | `#20/#21/#22`. No design slice. Keep. |
| `/[locale]/articles` | `articles` | Self-described example module (`page.tsx:9`). No design slice, not parent-facing. Leave untouched. |
| `/[locale]/auth/google/callback` | `auth` | No design slice. Keep. |

---

## DASHBOARD METRICS — THE CRITICAL TABLE

This is the mission-deciding table. Every row is one metric from a design metric inventory, with the exact
endpoint and field that can serve it, or the exact thing that is missing.

Verdicts:
- **SERVABLE** — computable today from a parent-reachable endpoint. Derivation given.
- **NEEDS-BACKEND** — the underlying rows exist in the database but no parent-reachable endpoint projects
  them. The exact aggregate + source content-type + fields are named.
- **BLOCKED** — the data does not exist anywhere, or the product docs forbid the value. Do not invent it.

Two product laws override availability and are applied throughout:
1. **No cross-skill composite, no overall score, no cut line** — `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193`;
   `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:304` ("There are no cross-skill composite fields").
   Any single per-child "level", "average score" or "progress %" is therefore forbidden even where a number
   could be manufactured.
2. **No false precision, no raw probability arithmetic** — `DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:72,383`.
   Progress is a transition statement ("detail: emerging → mastered"), never "+6%".

### 2.1 Dashboard hero + chart (spec 01 §10, rows 1-13)

| # | Metric label (exact design wording) | Design example | Format | Endpoint + field(s) / derivation | Verdict |
|---|---|---|---|---|---|
| 1 | `tests completed` | `7` | integer | `#3 GET /api/my/students/:documentId/progress` → `data.metrics.completedSessions` (`parent-progress.ts:132-134`, `sessions.status='complete'`), summed over the N children from `#1 GET /api/my/students`. **This gives a lifetime total, not "this week"** — no endpoint accepts a date window and `/progress` rejects *all* query params (`parent-progress.ts:24-26`). Needed aggregate: `GET /api/my/progress?from=&to=` returning `{ completedSessions }` per child + household total, from `sessions` filtered on `ended_at`/`createdAt` (columns exist, `session/schema.json:13-90`). | **NEEDS-BACKEND** (SERVABLE today only if the hero eyebrow drops "This week" and the label becomes an all-time count; costs 1+N requests against a 120 req/min/IP limiter, `config/middlewares.ts:53`, G1) |
| 2 | `coming up` | `2` | integer | Nothing. No content-type in `schooltest-api/src/api/` models a scheduled, assigned or upcoming test (G18); sessions are created on demand and `POST /api/sessions` is student/teacher/admin only (§3.2). The design's own example is self-inconsistent anyway — value `2`, list renders 3 rows (spec 01 §4.2). | **BLOCKED** |
| 3 | `practice this week` | `4h 20m` | duration `{H}h {MM}m` | Source rows exist: `sessions.mode='practice'` + `started_at` + `ended_at` (`session/schema.json:13-90`). No parent grant on any session read (`getSession`, `mySessions`, `myStudentsSessions` — §3.2, G3), and practice results are `destination='transient'` and explicitly filtered out of `/progress` (`parent-progress.ts:125-128`, G8). Needed aggregate: `practiceMinutes` scalar on a parent progress endpoint = `SUM(ended_at − started_at)` over `sessions` where `student.parent = caller` AND `mode='practice'` AND `started_at` in window. | **NEEDS-BACKEND** |
| 4 | `Practice minutes` / `last 7 days` (7 bars) | `34,52,42,88,60,26,14` | integer minutes per weekday | Same source as row 3, bucketed by calendar day. Needed aggregate: `practiceMinutesByDay: [{ date, minutes }]` (7 entries). Note the design's own bars total 316 min = 5h16m, contradicting the hero's 4h20m (spec 01 §4.4 IMPLICATION) — normalise bar height to the series max, never px = minutes. | **NEEDS-BACKEND** |
| 5 | caption `Thursday was the strongest day — 88 min, mostly Emma's speaking drills.` | `Thursday`, `88 min` | weekday + integer minutes + child + skill | argmax over row 4, plus `sessions.skill` and the owning student. `skill` is on the session row but unreachable (G3). Needed: add `skill` + `studentDocumentId` to the per-day buckets in row 4. Practice sessions are transient and "never visible to teachers" (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:207`) — parent visibility of practice must be a product decision before this ships. | **NEEDS-BACKEND** |
| 6 | CEFR journey ticks `A1 A2 B1 B2 C1 C2` | Emma stage `3` (B1) | 1-based ordinal on a 6-item ladder | `#3` → `data.recentResults[].cefrBand`, enum `pre_A1\|A1\|A2\|B1\|B2\|C1` (`contracts/parent-child-progress.ts`, docs-constraints §2). **The ladder must be relabelled** — the API has `pre_A1` and has no `C2`. Render **one rail per skill** (latest non-null `cefrBand` per `skill` within the ≤5 window); a single per-child rail is a cross-skill composite and is forbidden. Skills absent from the window render `not_assessed` explicitly, never blank or 0 (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:14`). | **SERVABLE** (per skill, ≤5-row window) |
| 7 | `Focus: {skill}` | `Focus: Speaking` | enum Reading/Listening/Speaking/Writing | Design derives it from per-skill percentages, which do not exist for a parent (G6). Best available proxy: order the skills present in `recentResults[]` by `readiness` (`not_yet` < `approaching` < `met`), tie-break on `cefrBand` ordinal. Correct only when all four skills fall inside the 5-row window, which cannot be guaranteed (G4). Needed: `latestBySkill: { reading, listening, speaking, writing }` on the progress payload, from `results` where `destination='official'` grouped by `skill`, latest `published_at_field`. | **NEEDS-BACKEND** (best-effort SERVABLE from the ≤5 window; must show `not_assessed` when a skill is missing) |
| 8 | hero prose `on track for B2` / `improved reading by 9% since May` | prose | CEFR string + signed percent + month | No projection/forecast field exists in any parent-reachable payload. Additionally forbidden: percent progress deltas are raw probability arithmetic, which the docs replace with transition statements (`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:72`), and forward claims collide with the "designed to / never validated-proven" claim rule (`SCHOOLTEST_ONSHORE_HANDOFF.md:142-153`). The servable substitute is a factual band transition per skill (e.g. "Reading moved A2 → B1 on 14 Jul") from two same-skill rows in `recentResults[]` — valid only when both fall in the window. | **BLOCKED** |
| 9 | `{n} schools across Australia accept SchoolTest placement` | `8` | integer | `#10 POST /api/search/schools` → `meta.pagination.total` (re-validated by `search-schools.ts:143-147`). **The "accept SchoolTest placement" clause has no backing field** — `SchoolHit` (`search-domains.ts:60-91`) has no such attribute, and the strict schema rejects extra keys. Ship the count; drop or rewrite the claim. | **SERVABLE** (count only) |
| 10 | `Show {n} schools` (filters modal footer) | `8` | integer | Same as row 9 — `meta.pagination.total` for the pending filter set. Note the design has no singular form (spec 01 UNKNOWNS); i18n needs plural rules. | **SERVABLE** |
| 11 | school `rating` (star + number) | `4.9` | decimal 1 dp, 0–5 | `SchoolHit` has no rating, review-count or score field (`search-domains.ts:60-91`; `src/utils/school-search.ts:17-23` `HIT_FIELDS`). No `reviews` content-type exists. The response schema is STRICT, so an extra key would fail contract validation (`search-schools.ts:145`, 500). | **BLOCKED** |
| 12 | map city-cluster count | Sydney `4`, Melbourne `2`, Brisbane `2` | integer | `#10` → `data[].latitude` / `data[].longitude` (both in `SchoolHit`), clustered client-side. `react-leaflet-cluster ^4.1.3` and `SchoolMapClusterLayer` already ship (web-inventory stack + `school-search` module). **Page-scoped only** — `pageSize` maxes at 50 (`search-domains.ts:32-51`), so cluster counts describe the current page, not the corpus. Corpus-wide facet counts would need a new aggregate endpoint. | **SERVABLE** (page-scoped) |
| 13 | bell unread dot (boolean, no number) | dot always rendered | boolean | `#15 GET /api/notifications/unread-count` → `data.count > 0`, or `#14 GET /api/notifications` → `meta.unreadCount` in the same round trip (`controllers/notification.ts:74`). | **SERVABLE** |

### 2.2 `app--parent-overview.html` variant-only metrics (spec 01 §10.1)

Recorded so they are never merged into the canonical dashboard.

| # | Metric label | Design example | Format | Endpoint + field(s) / derivation | Verdict |
|---|---|---|---|---|---|
| 14 | `Test credits` (+ `12 credits` pill) | `12` | integer | No credit, wallet, ledger or entitlement content-type exists in `schooltest-api/src/api/`; nothing in the 26-endpoint parent surface returns a balance. | **BLOCKED** |
| 15 | `Tests taken` | `14` / `9` | integer | `#3` → `data.metrics.totalSessions` (`parent-progress.ts:131`, COUNT of that child's sessions) or `data.metrics.officialResults` (`destination='official'`) if "taken" means "produced a report". Per child, 1 request each. | **SERVABLE** |
| 16 | `Avg. score` | `86%` / `71%` | integer percent | `recentResults[]` carries **no numeric score at all** — the seven keys are `documentId, skill, displayLabel, cefrBand, readiness, status, publishedAt` (`contracts/parent-child-progress.ts:32-40`). Numeric scores live only inside `ResultView` (`productive_scores`, `attributes[].prob`), which is unreachable (G2). An "average score" is also a cross-skill composite and an overall score — doubly forbidden (`DOC0:46`, `DOC1:304`). | **BLOCKED** |
| 17 | `vs last month` | `+4%` / `−2%` | signed percent, colour = sign | Requires row 16 plus a time series. No results/sessions time-series endpoint exists (G5), `publishedAt` is nullable and `createdAt` is absent from the projection. | **BLOCKED** |
| 18 | Recent-results `Score` column | `92%`, `88%`, `54%`, `73%` | percent, colour-banded | Same as row 16. The servable substitute per row is `cefrBand` + `readiness` + `displayLabel`. | **BLOCKED** |
| 19 | Credit activity `−1 / +10 / −1` | signed integers | signed integer | Same as row 14. | **BLOCKED** |

### 2.3 Children list — `portal--my-children-list.html` (spec 02 metric inventory, screen A)

| # | Metric label | Design example | Format | Endpoint + field(s) / derivation | Verdict |
|---|---|---|---|---|---|
| 20 | header subline `{n} children` | `2 children` | integer | `#1 GET /api/my/students` → `meta.pagination.total` (default filter excludes `archived`, `parent-student-read-actions.ts:76-80`). Archived/enrolled counts need one extra request each with `filters[status][$eq]=` (G24, no count-only mode). | **SERVABLE** |
| 21 | header subline `Family plan covers up to 4` | `4` | integer cap | No plan/subscription content-type. Same blocker as row 14. | **BLOCKED** |
| 22 | `Level {x}` pill | `Level B1` | CEFR band string | A single per-child band is a cross-skill composite (`DOC1:304`). Per-skill bands are servable — see row 6. Replace the single pill with per-skill chips, or with `student.status` (`active\|archived\|enrolled`, `student/schema.json:130-135`), which **is** in the list projection. | **BLOCKED** (as a single value) |
| 23 | `to {nextLevel}` | `68%` → `to B2` | integer percent | Requires a band-entry threshold table and a composite score; neither exists. Percent progress toward a CEFR band is exactly the "CEFR scorer" the docs forbid building (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:193`). | **BLOCKED** |
| 24 | `day streak` | `12` | integer | Rows exist: `sessions.started_at` per child (`session/schema.json`). No parent session access (G3), no `lastActivityAt` anywhere (G9). Needed: `practiceStreakDays` integer on the progress payload = count of consecutive calendar days (viewer timezone) with ≥1 session for that student. | **NEEDS-BACKEND** |
| 25 | `last result` | `74%` | percent string | Percent: **BLOCKED** (row 16). Servable substitute from `#3` → `recentResults[0]`: `displayLabel` + `cefrBand` + `readiness` + `publishedAt`, e.g. "Gist Reader · B1 · approaching · 14 Jul". | **BLOCKED** (numeric); substitute SERVABLE |
| 26 | card note line | `Speaking is the current growth area` | sentence | Same derivation and same blocker as row 7. When it ships it must be a template with a `not_assessed` branch, not generated prose. | **NEEDS-BACKEND** |
| 27 | card meta `Year {n}` | `Year 7` | `Year {n}` | `#1` → `data[].year_level` (int 7-12) or `data[].current_year_level` (13-value enum `Prep, Year 1…Year 12`), both in the list `fields` whitelist (`parent-student-read-actions.ts:85-88`). | **SERVABLE** |
| 28 | card meta school + suburb | `Riverside College, Parramatta` | `{school}, {suburb}` | School name: `#2 GET /api/my/students/:documentId` → `data.current_school` (free text, in `STUDENT_DETAIL_FIELDS`, `parent-student-schemas.ts:106-112`) — **detail endpoint only, +N requests**, it is not in the list projection. Suburb: no such column on `student`; `student.class`/`student.teacher` exist but no parent endpoint projects them (G11). | **SERVABLE** (school, +N requests) / **BLOCKED** (suburb) |
| 29 | card avatar initial | `E` | 1 uppercase char | `#1` → `data[].given_name`; `src/lib/student-name.ts` already owns `getStudentInitials()` (mononym-safe). Photo avatars are BLOCKED on the list: `photo` is populated only on the detail read (`parent-student-read-actions.ts:122`, G10). | **SERVABLE** |

### 2.4 Child detail — `portal--child-detail.html` (spec 02, screen B)

| # | Metric label | Design example | Format | Endpoint + field(s) / derivation | Verdict |
|---|---|---|---|---|---|
| 30 | KPI `Overall level` | `B1` | CEFR band | Same as row 22 — cross-skill composite. | **BLOCKED** |
| 31 | KPI `Progress to {nextLevel}` | `68%` | integer percent | Same as row 23. | **BLOCKED** |
| 32 | KPI `Practice streak` | `12 days` | `{int} days` | Same as row 24. | **NEEDS-BACKEND** |
| 33 | KPI `Last result` | `74%` | percent | Same as row 25. | **BLOCKED** (numeric); substitute SERVABLE |
| 34 | KPI `Since joining` | `+2 levels` | signed integer + "level(s)" | Needs the band at signup and the band now, i.e. full result history. `recentResults` is capped at 5 with no paging (G4) and there is no history endpoint (G5). `data.student.createdAt` gives the join date only. | **BLOCKED** |
| 35 | Level-journey rail + `journeyStage` | Emma stage 3 | ordinal 1-6 | Row 6 — per skill, relabelled ladder. | **SERVABLE** (per skill) |
| 36 | journey note (`…roughly one level every 8 months. At this pace, B2 is likely by early 2027.`) | sentence | sentence | Requires band history (row 34) plus a forward projection. Projection is additionally barred by the claim rules. | **BLOCKED** |
| 37 | Skills bars `Reading 78%` … | `78%` / `70%` / `52%` / `64%` | integer percent | No per-skill percentage is reachable: `metrics` is exactly 4 scalars (`contracts/parent-child-progress.ts:25-30`), and attribute probabilities live inside the unreachable `ResultView` (G2, G6). Mastery probability is also explicitly banned as public wording (`SCHOOLTEST_ONSHORE_HANDOFF.md:142-153`). Servable substitute per skill: `readiness` chip (`met/approaching/not_yet/not_assessed`) + `cefrBand` + `displayLabel` from `recentResults`. | **BLOCKED** (percent); substitute SERVABLE |
| 38 | Skills grade `B1+`, `A2+` | `B1+` | CEFR band + `+` | The `+` sub-bands do not exist — the enum is `pre_A1\|A1\|A2\|B1\|B2\|C1` with no modifiers. Render the bare band. | **BLOCKED** (`+` modifier) / **SERVABLE** (bare band) |
| 39 | skill note (`Speaking lags about half a level behind…`) | sentence | sentence | "Half a level" is manufactured precision over data that does not exist. | **BLOCKED** |
| 40 | Recent-results row name | `Listening check-in` | test title | `#3` → `recentResults[].displayLabel` (nullable). Fallback: the `skill` enum, title-cased via `t()`. | **SERVABLE** |
| 41 | Recent-results row date | `Jul 14, 2026` | `MMM D, YYYY` | `#3` → `recentResults[].publishedAt` (ISO **or null**, `result/schema.json:85-87`). There is no `createdAt` in the projection, so null-published rows cannot be ordered or dated on the client (G5). Render "Publishing" for null, never a fabricated date. | **SERVABLE** (with an explicit null branch) |
| 42 | Recent-results row score `B1 · 74%` | `B1 · 74%` | `{band} · {int}%` | Band SERVABLE (`cefrBand`); percent BLOCKED (row 16). Render `{band} · {readiness}` instead. | **BLOCKED** (percent) / **SERVABLE** (band) |
| 43 | Recent-results row delta `+6% vs May` | `+6% vs May` | signed percent + month | `delta` is a per-attribute field inside `ResultView` (G2) and `recentResults` carries no `previousResultDocumentId` (G12). Percent deltas are also the exact thing the docs replace with transition statements. | **BLOCKED** |
| 44 | Recent-results row delta `first attempt` | literal | literal | Determining "first attempt" needs the full same-skill history; the 5-row window cannot prove absence. Needed: a `previousResult: { cefrBand, publishedAt } \| null` stub on each `recentResults` item. | **NEEDS-BACKEND** |
| 45 | `Report` row action / `All reports →` | link | link | `GET /api/results/:documentId` not granted + no parent branch in `result-view.ts:54-68` (G2); no results-list endpoint (G4). | **BLOCKED** |
| 46 | result pipeline state | — (not drawn in the design) | enum | `#3` → `recentResults[].status` (`scoring\|partial_pending\|complete`). **This is servable and the design omits it** — partial publishing is mandatory per `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:205`, so a "Speaking pending" state must be added to the design. | **SERVABLE** (design gap, must be added) |
| 47 | `Share with teacher` / `Assign practice` buttons | — | action | No teacher-share and no assign endpoint (G18, §3.2). Both are unbound in the design too (spec 02 UNKNOWNS). | **BLOCKED** |

### 2.5 `app--child-profile.html` and `app--result-detail.html` (spec 02, screens C and D)

| # | Metric label | Design example | Format | Endpoint + field(s) / derivation | Verdict |
|---|---|---|---|---|---|
| 48 | `14 TESTS TAKEN` badge | `14` | integer | Row 15 — `metrics.totalSessions` / `metrics.officialResults`. | **SERVABLE** |
| 49 | `LINKED · CONFIRMED BY SCHOOL` badge | — | enum badge | No link-verification state exists. Nearest real value: `student.status` (`active\|archived\|enrolled`), in both the list and detail projections. Relabel to the real enum. | **BLOCKED** (as worded) / **SERVABLE** (as `status`) |
| 50 | `Avg. score` `86%`, `Trend` `+4%` | `86%`, `+4%` | percent / signed percent | Rows 16-17. | **BLOCKED** |
| 51 | `Of grade` `Top 15%` / `Of grade 4` `Top 12%` | `Top 15%` | `Top {int}%` | No cohort or percentile data is reachable; `student.class` is unprojected (G11); and aggregate reporting requires small-cell suppression (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:186`). | **BLOCKED** |
| 52 | Subject cards `Math 91%` / `Danish 85%` / `English 74%` | percents | integer percent | SchoolTest has no subject axis — the axis is `reading\|listening\|speaking\|writing` (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`). No subject content-type, no per-subject scores. | **BLOCKED** |
| 53 | Test-history `Status` `SCHEDULED` / `COMPLETED` | enum pill | pill | `SCHEDULED` needs G18 (no scheduling model). `COMPLETED` maps to `recentResults[].status='complete'`. | **BLOCKED** (scheduled) / **SERVABLE** (complete/scoring/partial_pending) |
| 54 | Result donut `92%`, `Correct 22/24`, `Grade A`, `completed in 22 min` | `92%`, `22/24`, `A`, `22 min` | percent / ratio / letter / minutes | All four live behind `GET /api/results/:documentId` (G2) and `GET /api/sessions/:documentId` (G3). A letter grade does not exist in the data model at all and would be an overall score (`DOC0:25`). | **BLOCKED** |
| 55 | `Performance by topic` 4 bars | `100/90/75/95%` | integer percent | The real equivalent is `attributes[]` (`{status, prob, items, delta}`) inside `ResultView` — unreachable (G2). Even when reachable, it must render `attribute_status` chips + evidence counts, not bare percentages (`DOC1:356`, `DOC1:287`). | **BLOCKED** |
| 56 | `Score history — Math` polyline (7 points) | y=70,62,66,48,40,30,18 | 7 monthly values | No time series (G5), no history endpoint (G4). | **BLOCKED** |
| 57 | `Class average 78%` / `Emma's average 86% · +8 pts` | percents | percent + signed points | Cohort statistics + overall score. Both blocked, both forbidden. | **BLOCKED** |
| 58 | `Recommended next` rows | `Word problems level 2` | title | No recommendation engine, no assignable-item endpoint for a parent (`/api/items` is admin-only, §3.2). | **BLOCKED** |

### 2.6 Portal forms, notifications and billing (spec 03 §7.1)

| # | Metric label | Design example | Format | Endpoint + field(s) / derivation | Verdict |
|---|---|---|---|---|---|
| 59 | `Step {n} of 5` | `Step 1 of 5` | `{int} of 5` | Client wizard state; `WIZARD_STEP_COUNT` already exists in `student-wizard/constants`. | **SERVABLE** (client) |
| 60 | wizard step 5 `Adding a third child…` ordinal | `a third` | English ordinal word | `#1` → `meta.pagination.total + 1`, rendered through `t()` with an ordinal plural rule. | **SERVABLE** |
| 61 | wizard step 5 `A$9/month`, `A$45`, `12 Aug` | prices + date | currency + `D MMM` | No billing model (row 14). Design is also internally inconsistent — wizard says A$9/child, billing says A$18 each (spec 03 UNKNOWN 7). Drop the whole cost notice. | **BLOCKED** |
| 62 | notifications subtitle `{n} unread` | `2 unread` | `{int} unread` | `#14` → `meta.unreadCount` (the caller's total `readAt IS NULL`, independent of filters, `services/notification.ts:106`), or `#15` → `data.count`. | **SERVABLE** |
| 63 | notification row timestamp | `2 hours ago` / `Monday` / `12 July` | 3-tier relative | `#14` → `data[].createdAt` (in the 10-key whitelist). The Today/Earlier grouping boundary is undefined in the design (spec 03 UNKNOWN 12) — `notification-grouping.ts` already exists in the `notifications` module. | **SERVABLE** |
| 64 | notification title + body (`Scored B1 · 74% — up 6% since May.`) | server string | server string | `#14` → `data[].title` / `data[].body`, composed server-side by `src/services/notifications/format-event.ts`. **The client must render them verbatim and must not compose them** — any client-side score/delta composition would re-introduce rows 16/43. | **SERVABLE** (verbatim only) |
| 65 | notification glyph (`B1`, `!`, `A`, `$`, `5`) | 1-2 chars | text token | The design's glyphs need `notification.data` (holds `studentDocumentId` etc.), which is deliberately withheld (`services/notification.ts:15-18`, G13). Servable substitute: an icon + tint derived from `category` (5 values) and `eventType` (9 values, `notification/schema.json:20-34`), both exposed. `NotificationCategoryIcon` already exists. | **BLOCKED** (as designed) / **SERVABLE** (category-derived) |
| 66 | per-child unread attribution | — | — | No per-child unread count; `data` is withheld and attribution requires string-parsing `linkUrl` (`/dashboard/children/<documentId>`, `format-event.ts:32-35`), which is `null` on some account/security paths (G13). | **BLOCKED** |
| 67 | unread-per-category | — | integer | `#14` with `?category=<c>&read=false&pageSize=1` → `meta.pagination.total`; the service `$and`s both filters (`services/notification.ts:92-95`). Valid for all 5 categories. Not in the design; useful for the settings screen. | **SERVABLE** (design gap) |
| 68 | settings `Last changed 4 months ago · two-step sign-in on` | relative + on/off | 2 facts | `#23 GET /api/users/me` returns no password-changed timestamp and no 2FA flag (full field list in api-inventory #23). No 2FA action exists in the parent grant list. | **BLOCKED** |
| 69 | settings account avatar `M` + `maria.r@gmail.com · +61 4 1234 5678` | `M`, email, phone | initial + email + phone | `#23` → `first_name`, `last_name`, `email`, `phone` — all present on the extended user schema and returned by the wrap (`strapi-server.ts:151-159`). | **SERVABLE** |
| 70 | settings onboarding completeness | — | boolean | `#23` → `profileCompleted` (computed over 10 required fields, `profile-completion.ts:12-37`). Not in the design; it is the only servable "completeness" metric and `ChildHeroCompletion` already exists in code. | **SERVABLE** (design gap) |
| 71 | billing header / plan card / payment method / 4 invoice rows | `A$36`, `Visa ending 4242`, `A$36.00`… | currency / card / date | Row 14. Every value on `portal--billing.html` is unbacked. | **BLOCKED** |

### 2.7 Roll-up

| Verdict | Count | Consequence |
|---|---|---|
| **SERVABLE** | 22 rows (6, 9, 10, 12, 13, 15, 20, 27, 28-school, 29, 35, 38-bare, 40, 41, 46, 48, 49-status, 53-complete, 59, 60, 62, 63, 64, 65-derived, 67, 69, 70 — counting split rows once) | Build these now. |
| **NEEDS-BACKEND** | 7 rows (1, 3, 4, 5, 7, 24/32, 26, 44) | Collapses into **one** new endpoint: `GET /api/my/progress` (household + per-child) carrying `{ completedSessions, practiceMinutes, practiceMinutesByDay[], practiceStreakDays, latestBySkill{}, previousResult stub }` over `sessions` + `results`. All source columns already exist. Not in this repo's scope — `schooltest-api` change. |
| **BLOCKED** | 27 rows | Do not invent. Every one needs an explicit honest state (see Wave 18). |

**The single most consequential finding:** the design's parent dashboard is built on an average-score /
percent-progress / credits / scheduling model that SchoolTest does not have and, for the score parts,
explicitly forbids. The hero panel can ship with 1 of its 3 stats today; the rest of the surface must be
re-expressed in the sanctioned vocabulary (`display_label`, `cefr_band`, `readiness`, `attribute_status`,
`not_assessed`, evidence counts) — docs-constraints §2, §3.

---

## ANIMATION SYSTEM

Consolidated and deduplicated across all six design specs. No new dependency is permitted;
`tw-animate-css ^1.4.0` (`package.json:46`) and Tailwind v4 (`package.json:65`) are already imported at
`src/app/globals.css:1-2`, and `@keyframes st-shimmer` + `@utility shimmer-sweep` already exist in
`globals.css` (web-inventory §5).

### 3.1 Keyframes — the complete set (6)

All declared once at `dashbaord-design/SchoolTest Design System.dc.html:19-24`; `st-shimmer` is mirrored at
`SchoolTest App Screens.dc.html:20`. The Landing document declares none.

| Keyframe | Definition | Duration | Easing | Iterations | Applies to |
|---|---|---|---|---|---|
| `st-toast-in` | `opacity 0→1; translateY 12px→0` | `250ms` | `ease` (design) | once | Live toast, fixed `right:24px; bottom:24px; z-index:95`, auto-dismiss **4000ms** (`SchoolTest Design System.dc.html:1527,1724`) |
| `st-fade-in` | `opacity 0→1` | `180ms` | `ease` | once | Dialog scrim `rgba(10,26,60,.45)` (`ds--dark-mode.html:34`) |
| `st-pop-in` | `opacity 0→1; scale .96→1` | `180ms` | `ease` | once | Dialog panel (`ds--dark-mode.html:35`); also the recommended entry for the forgot-password success alert (spec 06 §6.1) |
| `st-spin` | `rotate 0→360deg` | `700ms` | `linear` | infinite | Button loading spinner: 14×14, `border:2px solid rgba(255,255,255,.35)`, `border-top-color:#fff` (`ds--buttons.html:28`) |
| `st-shimmer` | `background-position −400px→+400px` | `1400ms` | `linear` (App Screens) / `ease` (DS) — **pick `linear`** | infinite | Every skeleton shape. Two paints: light `linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%)` on white, dark `…#E9EEF6/#E3E8F0/#E9EEF6` on `#F7F9FC`; `background-size:800px 100%` (spec 06 §2.1). Rule: shimmer base is one step darker than its surface. |
| `st-rec-pulse` | `box-shadow 0→16px halo, rgba(220,38,38,.35)→0` | `1500ms` | `ease-out` | infinite | Record button — **Electron student runner only**, out of scope here. |

### 3.2 Transitions — deduplicated (11 distinct declarations)

| Transition | Duration | Easing | Applies to | Source |
|---|---|---|---|---|
| `background` | `120ms` | `ease` | table body row hover → `#F8FAFD`; sidebar inactive nav hover → `#F1F5F9` | `ds--table.html:13`, `ds--navigation.html:8-13` |
| `background` | `150ms` | `ease` | all 8 button variants (primary/navy/accent/secondary/outline/ghost/destructive/link) | `ds--buttons.html:8-14` |
| `color` | `150ms` | `ease` | underline tabs (active `#2563EB` ↔ inactive `#64748B`; **the 2px border colour is NOT transitioned** in the design) | `ds--tabs.html:8-10` |
| `all` | `150ms` | `ease` | segmented-control segment (bg + colour + `0 1px 3px rgba(14,35,80,.12)` shadow) | `ds--tabs.html:17-19` |
| `all` | `150ms` | `ease` | checkbox box (18px, r5, 1.5px border) and radio ring + 8px dot | `ds--forms.html:47,53,66,70` |
| `border-color, box-shadow` | `150ms` | `ease` | text input / search input / textarea / auth inputs / dashboard search / newsletter — focus → `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` | `ds--forms.html:8,25,39`; `ds--footers.html:95-96`; `ds--dashboard-components.html:8`; `ds--dark-mode.html:16` (dark ring `rgba(59,130,246,.22)`) |
| `border-color, background` | `150ms` | `ease` | dropzone card hover → `border-color:#2563EB; background:#FBFCFE` (the only card in the export with a hover transition on its own shell) | `ds--dashboard-components.html:81` |
| `background` + `transform` | `180ms` | `ease` | DS switch: 40×22 track `#CBD5E1↔#2563EB`, 18px knob `translateX(0→18px)` | `ds--forms.html:77,81` |
| `background` + `left` | `200ms` | `ease` | **Portal** settings toggle: 46×27 track `#D8DFEA↔#0E2350`, 21px knob `left 3px↔22px` — the only motion the portal export commits to | `Parent Portal.dc.html:658-659` |
| `box-shadow, transform` | `200ms` | `ease` | landing feature card hover lift → `translateY(-3px)` + `0 16px 40px rgba(14,35,80,.10)` (navy card `.28`) | `landing--features.html:8,13,18` |
| `transform` | `200ms` | `ease` | FAQ chevron `rotate(0deg) ↔ rotate(180deg)`, single-open accordion | `landing--faq.html:10`; `ds--landing-components.html:118` |

**Timing vocabulary:** `120 / 150 / 180 / 200 / 250 / 700 / 1400 / 1500` ms. Every non-linear timing uses the
CSS default `ease`; only `st-spin` and `st-shimmer` are `linear` and only `st-rec-pulse` is `ease-out`.
**No exit animation exists anywhere** — `sc-if` unmounts nodes instantly (spec 05 ANIMATIONS).

### 3.3 Un-transitioned hover states that must gain one

The export declares hover *values* via the non-standard `style-hover` attribute, which
`dashbaord-design/support.js` does not implement (grep count 0 in spec 01 §11.3, spec 03 §A.2 and spec 05).
They are declarative intent with **no duration and no easing**. Every one of the following must gain
`transition: background-color 150ms, color 150ms, border-color 150ms, box-shadow 150ms`:

- Portal: "See details →", "Full calendar →", Search button, "All filters", "Show N schools",
  "Add a child", ChildCard shell (`0 1px 2px rgba(14,35,80,.04)` → `0 10px 32px rgba(14,35,80,.10)`),
  AddChildTile (border + colour + SVG stroke in one step), back link, "Share with teacher",
  "Assign practice", "All reports →", Edit/Manage ghost buttons, Pause, "Download all",
  every `PortalInput` focus, `PortalDropzone` hover — 13 catalogued as H-1…H-13 in spec 02.
- App/DS: every button with `style-hover` in Cards, Table toolbar and pagination, Overlays (dialog buttons,
  dropdown items, tooltip trigger, popover copy), Topbar links and bell, Footer links and social tiles,
  cookie banner, 404 buttons, auth buttons, command-palette rows, "View all activity", Add-filter chip
  (spec 05 §ANIMATIONS "Elements that hover but do NOT transition").
- Global anchors: portal `a` `#0E2350→#2563EB`; app/DS `a` `#2563EB→#1D4ED8`.

### 3.4 Motion the design does not have and the build must originate

Zero of the following exist in any export (spec 01 §11.5, spec 03 §A.4, spec 05 UNKNOWNS, spec 06 §6.4):
view/route transitions, wizard step enter/exit, step-rail dot fill, chip select/deselect, modal and
dropdown **exit**, notification mark-as-read transition, toast stacking/exit, upload progress,
bar-chart grow-in, donut sweep-in, polyline draw-on, number count-up, scroll reveal, and any
`prefers-reduced-motion` handling. The design also has **zero `@media` queries in every source file**.

Concrete motion hooks the markup makes obvious (spec 02 ANIMATIONS): progress-bar fills are separate
children of their tracks at three deliberate heights (6px portal skills / 7px app subjects / 8px result
topics) so `width: 0 → pct` is clean; the result donut is a `conic-gradient` stop (needs
`@property --p { syntax:'<percentage>' }` since conic stops do not interpolate); the score-history
`polyline` supports `stroke-dasharray`/`stroke-dashoffset` draw-on; the level-journey connector animates
left-to-right and the 6px current-step pip is the natural scale-in.

### 3.5 Repo-rule reconciliation (binding)

`.claude/rules/tailwind.md:19-21` allows animating **`transform` and `opacity` only** and mandates
exponential easings; `:11` bans raw hex. Consequences, already scoped by spec 04 §I:

1. `st-toast-in`, `st-fade-in`, `st-pop-in`, `st-spin` are already compliant.
2. `st-shimmer` animates `background-position` → reimplement as a `transform: translateX()` overlay
   (`@utility shimmer-sweep` in `globals.css` is the existing hook).
3. The portal toggle animates `left` → reimplement as `transform: translateX(0→19px)`; visually identical,
   compositor-only.
4. `st-rec-pulse` animates `box-shadow` → out of scope (Electron), do not port.
5. `background` / `border-color` / `box-shadow` transitions on buttons, inputs, chips and rows are outside
   the allow-list. They are the design's entire micro-interaction language; they must ship as a
   **documented, single, explicit exception** recorded in `.qa/DECISIONS.md`, not silently.
6. Easing: emit both `--ease-design: ease` (what the HTML uses) and the exponential set. `globals.css`
   already declares `--ease-out-expo`. Recommended duration tokens (spec 04 §I):
   `--duration-fast:150ms`, `--duration-row:120ms`, `--duration-switch:180ms`, `--duration-enter:180ms`,
   `--duration-toast:250ms`, `--duration-spin:700ms`, `--duration-shimmer:1400ms`.

### 3.6 `prefers-reduced-motion` — required, absent from every design file

The design has no reduced-motion rule anywhere. The repo already ships exactly one block, in the Leaflet
skin section of `globals.css` (web-inventory §5), and `school-map.spec.ts` already asserts
"reduced-motion snap". Required variant:

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```
plus three targeted overrides that must not merely be shortened:
- `st-shimmer` → replace with a **static** `--color-skeleton-base` fill (an infinite animation truncated to
  1ms still repaints); `--color-skeleton-base` / `--color-skeleton-sheen` already exist in `globals.css`.
- feature-card hover lift → drop the `translateY(-3px)`, keep the shadow change.
- FAQ chevron → keep the rotation instant; it is a state indicator, not decoration.
Colour/opacity state changes must remain visible under reduced motion so that state is never conveyed by
motion alone.

---

## COSMETIC-VS-FUNCTIONAL

Source: `.qa/intake/web-inventory.md` §6, corroborated by a live `git status --short` (219 entries:
101 modified, 35 deleted, 83 untracked including `.qa/design/`, `.qa/intake/`, `dashbaord-design/`,
`.qa/archive-mission2-20260722/`, `.qa/tasks`, `.qa/watchdog.lock`).
`git diff --stat`: **136 files changed, 3340 insertions, 3321 deletions**. Nothing is staged.
HEAD is `3ad82d8 feat(ui): canonical contrast system, and fix the type scale that never rendered`.

### 4.1 Hard guarantee — the entire network and auth layer is untouched

No file under `src/lib/axios/**`, no file under any `*/queries/**`, and no file in `src/modules/auth` is
modified or deleted. All 33 query/mutation hooks, `src/lib/axios/strapi.ts` (token key `app.auth.token`,
Bearer interceptor, 401 wipe), `ParentGuard`, `useRequireParent` and `useAuthStore` are exactly as
committed. **The redesign cannot have broken data fetching, auth or route guarding.**

### 4.2 PURELY COSMETIC — safe to be superseded by the new design

| Group | Files |
|---|---|
| New design-system components (28, untracked) | `design-system/components/{activity-feed-row, avatar-stack, bar-chart, bordered-callout, choice-pill-group, completion-cell, field-shell, filter-rail, filter-rail-section, glass-stat-tile, key-value-row, map-panel-frame, media-card, media-cover, navy-panel, navy-promo-card, notes-card, panel-header-row, rank-row, row-actions-cluster, score-progress-row, segmented-choice, select-field, select-row, selection-card, skeleton-card, skill-breakdown-row, sparkline, tint-tile, upcoming-event-row}.tsx` |
| New showcase files (9, untracked) | `design-system/components/showcase/{choice-cards-demo, choice-fields-demo, choices-section, filter-rail-demo, media-section, record-charts, record-rows, records-section, scroll-affordance-demo}.tsx` |
| Modified showcase/DS chrome | `design-system/components/segmented-control.tsx`, `design-system/components/showcase/index.ts`, `design-system/types/metrics.types.ts`, `src/app/[locale]/design-system/page.tsx` |
| Presentational rewrites | `children/components/{ChildProfileHeader, ChildProfileScreen, ChildProfileSkeleton, ChildResults, ChildSkillBreakdown}.tsx` + new `{ChildHeroCompletion, ChildProfileTabs, ChildRecordPanel}.tsx`; `dashboard/components/{DashboardChildSummaryCard, DashboardFamilySummary, DashboardGreeting, DashboardProfileRosterItem, DashboardRecentProfiles, DashboardScreen, DashboardSkeleton}.tsx` + new `{DashboardPromo, DashboardRecentActivity}.tsx`; `notifications/components/{NotificationDigestField, NotificationPreferenceFields, NotificationPreferenceLockedGroup, …}`; `agent-search/components/{AgentCard, AgentCardMeta, AgentsPane}.tsx` + new `{AgentFilterControls, AgentFilterRail, AgentResults, AgentSortMenu}.tsx`; `school-search` new `{SchoolFilterRail, SchoolResults, SchoolSortMenu}.tsx`; `search-shared` new `{SearchCardSkeletonList, SearchFilterSheet, SearchResultsPanel, SearchSortMenu}.tsx`; `settings/components` new `{AccountIdentityPanel, SearchPreferenceChoiceField, SearchPreferenceFeeFields}.tsx`; `student-wizard/components` new `{ReviewMedia, ReviewPanel, WizardChoiceField}.tsx` |
| The 35 deleted files | Every one is a presentation component or a class-variant helper (full list in web-inventory §6c). **No query, schema, store, guard or axios file was deleted.** Safe. |

### 4.3 COSMETIC BUT COUPLED — supersede only with a matching change elsewhere

| File | Why it is coupled |
|---|---|
| `src/app/globals.css` (+164) | New `@theme` tokens and utilities. Renaming or removing a token silently breaks `cn()` merging unless `src/lib/utils.ts` `THEME_CLASS_GROUPS` is updated in the same commit, and `design-tokens.spec.ts` asserts that parity in the real DOM. Wave 1 rewrites this file; the utils registration must move with it. |
| `src/lib/utils.ts` (one line) | Registers the `segment` + `selection` radii with `tailwind-merge`. Without it those classes are dropped by `cn()` at runtime. **Functional in effect.** |
| `src/modules/design-system/index.ts` (+82 exports) | Cross-module imports are barrel-only (`.claude/rules/module-pattern.md:12`). Removing an export breaks the consuming module's compile, not just its looks. |
| All six i18n catalogs `src/i18n/messages/{en,ko,ms,th,vi,zh}.json` (+~170 lines each) | Copy is cosmetic; **key shape is not**. `.claude/rules/i18n.md:18` requires identical key shape across all locales, `landing.spec.ts` / `design-system-zh.spec.ts` / `locale-routing.spec.ts` render from the catalogues, and every user-facing string must come from `t()`. Deleting a key used by a kept component is a runtime crash, not a visual regression. |

### 4.4 FUNCTIONAL WIRING — must be preserved

| # | File(s) | What is functional about it |
|---|---|---|
| 1 | `src/modules/agent-search/stores/use-agent-search-store.ts` | `toggleCountry/toggleLanguage/toggleService` were **replaced** by `setCountries/setLanguages/setServices` (whole-selection setters for `ChoicePillGroup`). `storeToRequest` and the barrel now export the new shape; `agent-search-polish.spec.ts` and `unified-search-states.spec.ts` drive it. The `POST /api/search/agents` request shape is unchanged — do not "fix" it back. |
| 2 | `src/modules/school-search/stores/use-school-search-store.ts` | `toggleState/toggleSector/toggleSchoolType/setToggle` → `setStates/setSectors/setSchoolTypes/setToggles(keys)`; the `ToggleKey` type was dropped. Request shape unchanged. `school-filter-panel.spec.ts` asserts the filter change reaches the real request. |
| 3 | `src/modules/dashboard/lib/dashboard-overview.ts` (+72) | The **only** place dashboard metrics are derived today: `getPlanBoardStats`, activity-entry mapping (`ACTIVITY_ROWS_LIMIT`), avatar-stack mapping — all from `GET /api/my/students` rows, no new endpoint. `DashboardScreen`, `DashboardFamilySummary` and `DashboardRecentActivity` depend on it. This file is the seam where §DASHBOARD METRICS lands. |
| 4 | `src/modules/school-search/hooks/use-school-search-pane.ts` (new) | Hosts the `useSchoolSearchQuery` call site (web-inventory cites `use-school-search-pane.ts:57`). A component-level query call would violate `.claude/rules/state-data.md:33`; this hook is the compliant home. Preserve. |
| 5 | `src/modules/school-search/lib/active-filter-count.ts` (new) | `countActiveSchoolFilters` is barrel-exported and drives the filter badge and the Filters sheet trigger asserted by `unified-search.spec.ts` at 375px. |
| 6 | `src/modules/children/lib/child-profile-tab.ts` + `children/constants/child-profile.constants.ts` (new) | Tab-state derivation for `ChildProfileTabs`. **Note the design has no tabs on the child detail screen** (spec 02 §B) — if the tabs are removed, this logic and its `?tab` handling must be removed deliberately, not orphaned. |
| 7 | `src/modules/children/lib/child-learning-progress.ts`, `children/types/children.types.ts`, `dashboard/types/dashboard-overview.types.ts`, `settings/types/settings.types.ts`, `search-shared/types/search-shared.types.ts`, `student-wizard/types/student-wizard.types.ts` | View-model types — the contract between the zod-parsed API payloads and the components. Reshaping them again is fine; **losing** them decouples the UI from the validated payloads. |
| 8 | Barrels: `agent-search/index.ts`, `school-search/index.ts`, `search-shared/index.ts`, `student-wizard/index.ts`, `design-system/index.ts` | Cross-module import surface (F14). Functional by rule. |
| 9 | `src/modules/student-wizard/constants/wizard-control.constants.ts` (new) | Control constants consumed by `WizardChoiceField`; `053-wizard-controls.spec.ts` asserts the resulting radiogroup semantics (one tab stop, arrow keys, 44px targets). |
| 10 | 13 e2e specs — 10 modified + 3 new (`tests/e2e/053-wizard-controls.spec.ts`, `zz-hit.spec.ts`, `zz-probe.spec.ts`) | The regression net for the redesign: pointer hit areas, probe density and clickability, wizard control geometry. These must be **re-targeted** at the new markup, never deleted. 56 spec files total. |

### 4.5 Not source

`dashbaord-design/` (the design export) and `.qa/design/` (slices + index) are untracked **inputs**.
`.qa/intake/`, `.qa/archive-mission2-20260722/`, `.qa/tasks`, `.qa/watchdog.lock` are mission bookkeeping.
None of them ship.

---

## RECOMMENDED WAVE PLAN

Dependency-ordered vertical slices. Each slice cuts tokens → component → wiring → e2e for one screen or one
component family. Counts are atomic tasks (one task = one file or one tightly-scoped edit, sized to keep
components ≤120 lines and files ≤200 lines per `CLAUDE.md:136`). **Total 294.**

| # | Wave | Rationale (one line) | Tasks |
|---|---|---|---|
| **W0** | Guardrails & contract freeze | Record the BLOCKED list, the OKLCH/hex exception, the animation-property exception and the portal-vs-app canonical ruling in `.qa/DECISIONS.md` before any code moves, so no later wave re-litigates them. | 6 |
| **W1** | Token layer (`globals.css` `@theme`) | Everything downstream reads these: 21 board swatches + 13 untokenised extras + 9 portal-local neutrals converted to OKLCH, 4+7 shadows, 10 radii, 16 type steps, containers; `src/lib/utils.ts` `THEME_CLASS_GROUPS` updated in lockstep. Depends on W0. | 18 |
| **W2** | Motion system | The 6 keyframes (5 in scope), 11 transitions, duration/easing tokens, `shimmer-sweep` retargeted to `transform`, and the global `prefers-reduced-motion` block — built once so no later wave invents timings. Depends on W1. | 10 |
| **W3** | Primitives: buttons, forms, badges, alerts | 8 button variants × 5 sizes + disabled/loading/focus-visible; input/search/select/textarea with default/focus/error/disabled; checkbox/radio/switch; 9+3 badges, tag, count; 4 alerts + 2 toasts + the live toast host. Wraps `src/components/ui/*`, never edits it (F2). Depends on W1, W2. | 24 |
| **W4** | Surfaces: cards, table, tabs, overlays, avatars | Base card shell, 4 card types, table + pagination, underline tabs + 2 segmented sizes, dialog/dropdown/tooltip/popover with enter animations and the missing **exit** animations, 5 avatar sizes + presence + stack. Depends on W3. | 18 |
| **W5** | App shell | Detached 248px rounded sidebar with 2 groups, active/inactive/hover/focus states, topbar with search + bell + user card, breadcrumbs, 375px Sheet nav. Re-skins `shell` without touching `ParentGuard`. Depends on W4. | 16 |
| **W6** | States kit | Shimmer skeleton catalogue (11 shapes), empty-state pattern (96px chip → 27/700 headline → 15/1.6 body → inline action → "or" → text link), `QueryErrorFallback`, 404 (full + compact), toast host. Every later screen consumes these. Depends on W3, W4. | 12 |
| **W7** | Auth | `/sign-in` split 560px navy panel, `/sign-up` role cards + form card, `/forgot-password` + sent state + cooldown, `/reset-password`, google-callback error. **Adds the error/loading/disabled states the design never drew** (spec 06 UNKNOWNS). Zero API change. Depends on W3, W6. | 20 |
| **W8** | Landing | 12 sections + announcement bar + sticky blurred nav + navy footer, `showAnnouncement`/`showPricing` flags, FAQ accordion (single-open, chevron `.2s`), feature-card hover lift. Static, zero API. Depends on W3, W4. | 18 |
| **W9** | Dashboard overview | The mission's centre: navy hero with **only** the servable stats, per-skill CEFR rails, notifications-derived activity, honest placeholders for rows 2-5. Wires `#1` + `#3` + `#15` through `dashboard-overview.ts`. Depends on W5, W6. | 22 |
| **W10** | Children list | ChildCard grid (auto-fit 360px), metric strip rebuilt on servable fields only, dashed AddChildTile, archive/unarchive dialog, zero-children empty state. Wires `#1`, `#6`, `#7`. Depends on W9. | 12 |
| **W11** | Child detail | Header, KPI strip rebuilt on `metrics` + `student`, per-skill level journey, readiness/band skill rows, recent-results list with `scoring`/`partial_pending` states, tabs removed to match the design. Wires `#2`, `#3`. Depends on W10. | 16 |
| **W12** | Add-child wizard | 230px rail + 5 step cards, 19 fields mapped 1:1 onto `parentStudentCreateSchema`, dropzones with the filled/progress/remove states the design omits, review table, edit mode. Wires `#26`, `#4`, `#5`. Depends on W3, W6. | 18 |
| **W13** | Settings | 4 stacked cards (tabs removed), account identity, language chips persisted through `PUT /api/users/me.preferences`, 4 notification toggles, password card; search-preferences and push retained as extra cards. Wires `#23`, `#24`, `#25`, `#18`, `#19`, `#12`, `#13`, `#20`-`#22`. Depends on W3, W5. | 14 |
| **W14** | Notifications | Today/Earlier feed, unread/read tiles with the transparent-spacer dot, category-derived glyphs, mark-one and mark-all, bell dropdown panel, `>100 unread` remainder handling (G15). Wires `#14`-`#17`. Depends on W5, W6. | 12 |
| **W15** | Search: schools, agents, map | 340px rail + fluid map, filters modal, applied-filter chips, cluster/pin modes, selected-school card, plus the **undesigned agent pane** extended from the same language. Wires `#10`, `#11`, `#9`. Depends on W4, W5. | 18 |
| **W16** | Responsive + accessibility | The design has zero `@media` queries — this wave owns every breakpoint: wizard `230px 1fr` collapse, login `560px 1fr` collapse, fixed 3-col grids, 1440px artboards. Plus focus-visible rings everywhere (undeclared in the design), 44px targets, `role="switch"`/`aria-checked`, `radiogroup` semantics, real `<button>`/`<label for>` for the export's `<div onClick>` patterns. Depends on W7-W15. | 16 |
| **W17** | E2E re-targeting + gates | Re-point the 56 specs at the new markup, keep the 3 new probe specs, add reduced-motion and skeleton assertions, run `pnpm tsc --noEmit && pnpm lint && pnpm test --run && pnpm exec playwright test`. Depends on W16. | 16 |
| **W18** | Blocked-surface honesty pass | Ship an explicit, translated "not available" / `not_assessed` state for all 27 BLOCKED metrics and remove the Billing rail entry, credits pill, Assign actions and result-detail links, so nothing renders invented data. Runs last so it can see every surface. Depends on W17. | 8 |

**Critical path:** W0 → W1 → W2 → W3 → W4 → W5 → W9 → W10 → W11 → W16 → W17 → W18.
**Parallelisable after W4:** W6, W7, W8, W12, W13, W14, W15.
**Not in this repo:** the single `GET /api/my/progress` aggregate that unblocks all 7 NEEDS-BACKEND rows is a
`schooltest-api` change and must be a separate mission with its own contract entry.

---

## UNKNOWNS

1. **17 of the 112 index entries were never opened by any extractor**, so their verdicts above rest on the
   `label` in `screens-index.json` plus the API inventory, not on slice content:
   `app--admissions-profile`, `app--glance-report`, `app--progress-report`, `app--progress-report-2`,
   `app--export-preview`, `app--assign-test`, `app--all-results`, `app--not-enough-credits`,
   `app--payment-failed`, `app--invite-co-parent`, `app--remove-child`, `app--receipt`,
   `app--auto-top-up`, `app--buy-credits`, `app--checkout`, `app--payment-success`, `app--test-catalog`,
   plus `app--billing`, `ds--test-components` and `ds--pte-task-library`. The BLOCKED verdicts for the
   billing/credits set are safe (no backing content-type exists regardless of what the slice draws); the
   REDESIGN verdict on `app--remove-child` is the one that could change on reading.
2. **Which portal composition is canonical is asserted, not marked.** Spec 01 §1.4 and spec 03 §1.1 both
   name `portal--*` canonical and `app--parent-overview`/`app--parent-settings`/`app--add-child`
   reference-only, but spec 01 UNKNOWNS records that "the files carry no priority marker, date, or
   'current' flag" and spec 03 UNKNOWN 18 calls the two add-child designs "mutually incompatible".
   This document follows the extractors' ruling. A design owner must confirm it.
3. **Parent permission scope is undefined in the product docs.** `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:54-58`
   defines only Student/Teacher/Admin; there is no parent role, no parent journey and no statement of which
   result fields a parent may see (docs-constraints UNKNOWN 1). Every "BLOCKED by product rule" verdict in
   §DASHBOARD METRICS therefore applies the teacher/student vocabulary by default. If a product decision
   grants parents result access, rows 37, 43, 54, 55 change from BLOCKED to NEEDS-BACKEND — but rows 16,
   23, 30, 31, 50, 57 stay BLOCKED, because no cross-skill composite or overall score may exist for anyone.
4. **The plain-language attribute descriptors and the display-label qualifier rules are not in any doc.**
   They are deferred to the Crosswalk seed and a "reporting spec" that does not exist in
   `/home/hnr/Code/schooltest/docs/` (docs-constraints UNKNOWNS 3 and 4). Parent-readable wording for
   `attribute_status` and for qualifiers like "(B1 vocabulary gap)" cannot be authored from what exists.
5. **Whether practice sessions may be shown to a parent at all.** `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:207`
   says practice results are transient and "never visible to teachers"; it says nothing about parents. Rows
   3, 4, 5 and 24 all depend on this and are marked NEEDS-BACKEND on the assumption that practice *time*
   (not practice *results*) is permissible. That assumption is unverified.
6. **The design's 6-step CEFR ladder cannot be reconciled with the API enum without a decision.** Design:
   `A1 A2 B1 B2 C1 C2`. API/docs: `pre_A1 A1 A2 B1 B2 C1`. Both are six values; neither is a subset of the
   other. Which ladder ships is a product call, not a derivable one.
7. **Whether `id` (numeric) appears in `GET /api/my/students` items** is unverified (api-inventory
   UNKNOWNS) — irrelevant to rendering, relevant if any list key is derived from it.
8. **Anonymous request status (401 vs 403)** on parent-only routes was not confirmed from code
   (api-inventory UNKNOWNS). The client already wipes the token on any 401 (`strapi.ts:45-53`), so a 403
   path would leave a stale token; W7 must test both.
9. **`schooltest-web/AGENTS.md` was not read** by the docs-constraints extractor (its UNKNOWN 5) and was
   not read here. Any rule unique to it is unrepresented in this reconciliation.
10. **Task counts in the wave plan are estimates.** They are sized to the file/component line limits and to
    the surface inventory above; they are not derived from a decomposed backlog, and no wave has been
    task-listed. The 294 total is a planning figure, not a commitment.
11. **`tests/e2e/auth-logo.spec.ts` contents are unknown** (web-inventory UNKNOWNS — the title grep matched
    nothing). W17's re-targeting scope for that file cannot be sized.
12. **Dark mode**: `tokens.css` and `globals.css` both carry a complete `.dark` set, and spec 05 §8 specs
    dark buttons, badges, one input, one stat card and one alert — but no design file renders a dark
    version of any parent screen, and `forcedTheme="light"` is a standing decision. Whether the dark tokens
    are dead weight or a staged future is not determinable from any file read.
