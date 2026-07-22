# docs-constraints.md — BINDING constraints extracted from workspace docs and rule files

Read-only intake. Every claim below is quoted or paraphrased from a file I actually read.
Sources read in full or in cited part:

- `/home/hnr/Code/schooltest/docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md`
- `/home/hnr/Code/schooltest/docs/SCHOOLTEST_DOC0A_USER_JOURNEYS_V2.md`
- `/home/hnr/Code/schooltest/docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md`
- `/home/hnr/Code/schooltest/docs/DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md` (v2.1 — the newer of the two)
- `/home/hnr/Code/schooltest/docs/DIAGNOSTIQ_CONSTRUCT_MAPPING_V2.md` (v2 — superseded header only)
- `/home/hnr/Code/schooltest/docs/SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md` (v2.1)
- `/home/hnr/Code/schooltest/docs/SCHOOLTEST_API_CHANGE_NOTE_V2_1.md`
- `/home/hnr/Code/schooltest/docs/SCHOOLTEST_ONSHORE_HANDOFF.md`
- `/home/hnr/Code/schooltest/schooltest-web/CLAUDE.md`
- `/home/hnr/Code/schooltest/schooltest-web/.claude/rules/{i18n,imports,module-pattern,nextjs-patterns,quality,state-data,tailwind,testing}.md`
- `/home/hnr/Code/schooltest/schooltest-api/CLAUDE.md`
- `/home/hnr/Code/schooltest/schooltest-api/.claude/rules/{scaffolding,typescript,document-service,controllers,rest-api,services,routes,lifecycles,document-middleware,policies,middlewares,plugins}.md`
- `/home/hnr/Code/schooltest/.qa/RULES.md`
- `/home/hnr/Code/schooltest/schooltest-web/.qa/RULES.md` (found while listing; in scope as a rules file)

Not read (exist but outside the named scope): `docs/SCHOOLTEST_DOC3_ITEM_CONTENT_CONTRACT_V2.md`,
`docs/SCHOOLTEST_DOC4_FIELD_TEST_PLAN_V2.md`, `docs/SCHOOLTEST_Q_MATRICES.md`,
`docs/diagnostiq_reading_listening_items.md`, `/home/hnr/Code/schooltest/AGENTS-COORDINATION.md`.

---

## PRODUCT — PARENT-FACING TRUTH

### 0. The product docs define NO parent role and NO parent portal

This is the single most load-bearing fact in this section, so it is stated first.

`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:54-58` is the complete role table. It has exactly three rows:

> | Student | Takes tests | Start/resume sessions in permitted modes; view own results where the mode permits |
> | Teacher | Monitors learners | View progress and placement reports and analytics for their own students; assign progress/placement sessions; proctor in-class; export diagnostic bundles for their own students |
> | Admin | Manages the bank and psychometrics | CRUD the item bank; view/manage all sessions, responses, scores; run/trigger calibration; manage forms, anchor blocks, and item status |

`SCHOOLTEST_DOC0A_USER_JOURNEYS_V2.md:16-21` lists actors: Student, Teacher, Admin, System. There is no
parent/guardian journey. A grep for `parent|guardian|caregiver|family|portal|parent-facing` across
`/home/hnr/Code/schooltest/docs/*.md` returns only (a) `parent_session` / "placement parent" — the
parent-of-child *Session* record (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:25,109,115,283`), and
(b) one marketing bullet, `SCHOOLTEST_ONSHORE_HANDOFF.md:45`, listing "Parent conversations" as an
example of what a *teacher* does with an exported profile.

**Consequence for labelling:** there is no separate parent vocabulary to obey. Anything shown to a
parent must use the one reporting vocabulary the docs define (below), which the docs frame as
teacher/student-facing. Do not invent a softened parent scale. See `## CONFLICTS` C1 and `## UNKNOWNS`.

### 1. What a "result" contains (normative: Doc 1 §10)

`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:281-304` — the Result record fields:

| Field | Meaning per Doc 1 |
|---|---|
| `scope` | `skill` or `combined` |
| `skill` | null when scope = combined |
| `attributes` | per attribute `{ status, prob, prob_se?, items, delta }`; `status = not_assessed` when `items = 0`; `delta` = prob change vs `previous_result` (null on first sitting) |
| `display_label` | Crosswalk-derived, e.g. "Gist Reader (vocabulary gap)" |
| `acara_phase` | Crosswalk-derived |
| `cefr_band` | Crosswalk-derived |
| `readiness` | per-skill mainstream-readiness indicator |
| `low_confidence` | MAP posterior below Config threshold |
| `effort_valid` | session-level rapid-guess screen |
| `previous_result` | most recent official, same student + skill |
| `productive_scores` | Speaking / Writing engine outputs |
| `status` | scoring / partial_pending / complete |
| `destination` | transient / official |
| `published_at` | datetime |

`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:135` restates the same set and adds: label, phase, CEFR band and
readiness are "all derived in Strapi via the Crosswalk, **never modelled**".

### 2. The controlled reporting vocabulary (verbatim enums, Doc 1 §3)

`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`:

- `cefr_band` (3.9): `pre_A1, A1, A2, B1, B2, C1`
- `attribute_status` (3.16): **`mastered, emerging, not_mastered, not_assessed`**
- `readiness` (3.18): **`met, approaching, not_yet, not_assessed`**
- `result_status` (3.8): `scoring, partial_pending, complete`
- `mode` (3.5): `practice, progress, placement`
- `result_destination` (3.19): `transient, official`

Attribute names (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:44-47`):
- reading: `R1 decoding, R2 vocabulary, R3 grammar, R4 gist, R5 detail, R6 inference, R7 critical`
- listening: `L1 decoding, L2 vocabulary, L3 grammar, L4 gist, L5 detail, L6 inference, L7 pragmatic`
- speaking: `S1 segmental, S2 prosody, S3 lexicogrammar, S4 fluency, S5 pragmatics`
- writing levels: `W1 orthographic, W2 word, W3 sentence, W4 text, W5 communicative, W6 rhetorical`

`SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:30` renames the R6/L6 **display name** to
"Propositional Inference" (codes unchanged, no data migration).

Plain-English subskill names approved for public/non-specialist surfaces
(`SCHOOLTEST_ONSHORE_HANDOFF.md:159-167`, "The specific subskills per skill are real and should be
preserved exactly"):

- Reading (7): Decoding, Vocabulary, Grammar, Gist, Detail, Inference, Critical
- Listening (7): Sound decoding, Vocabulary, Grammar, Gist, Detail, Inference, Attitude
- Speaking (6): Pronunciation, Stress & rhythm, Grammar & vocab, Fluency, Pragmatics, Interaction
- Writing (5): Spelling, Vocabulary, Grammar, Organisation, Register

### 3. Score / level / CEFR / readiness concepts — the hard rules

**3a. Probability is the datum; the level is a display derivation.**
`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:45`:

> **Mastery probability is the primary result**; binary mastered/not-mastered is a display derivation
> at a config threshold (0.65 provisional).

`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:30`:

> the binary mastered/not-mastered flag is a **display-layer derivation** (threshold 0.65, revisable
> after pilot), never the primary datum. Progress is tracked on the probability scale.

**3b. The status bands (Config-driven, not hardcoded).**
`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:300`: "**mastered >= 0.65; emerging 0.35-0.65; not_mastered < 0.35** (Config)."
`SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:151`: same, plus "no items → not_assessed. (Config.)"
`SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:186` names the config keys: `mastered_cut / emerging_cut = 0.65 / 0.35`.

**3c. There is no overall score, no cut line, no cross-skill composite.**
`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25`: "There are **no cut scores and no admit/reject decision**".
`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:46`: "Per-skill **mainstream-readiness indicators** replace any
overall pass line. There is **no cross-skill composite score** anywhere in the system."
`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:193`: "Do not build a CEFR scorer; do not build any cross-skill composite."
`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:304`: "**There are no cross-skill composite fields.** The combined
placement report renders the four skill Results side by side."
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:394`: the v1 cross-skill comparison schema "is deleted. It
averaged probabilities from different models and thresholds into numbers that looked precise and
meant little."

**3d. CEFR is a lookup, never a computed score.**
`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:192`: "label, ACARA phase, CEFR, and readiness are **not** computed
by R. R returns probabilities; Strapi derives display values via the versioned Crosswalk. Keeps every
teacher-facing value a lookup, not a model."
CEFR rule (`SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:153`, restated `SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:92`):
R7/L7 mastered → B2; any of R4-R6 → B1; R2 or R3 → A2; R1 → A1; else Pre-A1.
`SCHOOLTEST_ONSHORE_HANDOFF.md:152`: "CEFR levels (A1-C1) always alongside plain meaning."

**3e. ACARA phase is the shared display currency across all four skills.**
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:64`: "The ACARA EAL/D phase is the shared display currency
across all four skills (fixing v1's four-different-scales problem): every skill report resolves to a
phase plus attribute detail."
Phase values (`SCHOOLTEST_ONSHORE_HANDOFF.md:151`): **Beginning, Emerging, Developing, Consolidating**.
Per-attribute phase mappings are in the attribute tables, e.g.
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:100-106` (Reading) and `:198-204` (Listening).

**3f. Readiness — the only "are they there yet" indicator.**
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:79-88`: "There is no pass/fail. Instead each skill defines
**readiness indicators**… The report shows readiness per skill as met / approaching / not yet, with the
evidence behind it. The decision to mainstream remains the teacher's."
Rule (`SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:155`, restated `SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:93`):
met = R7/L7 mastered AND Stage 3 completed; approaching = Stage 3 reached with R7/L7 emerging; else not_yet.
Mainstream readiness is ~B2 (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:26`).

**3g. `not_assessed` is a first-class value and must be shown as such.**
`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:14`: "any attribute without administered evidence stores the string
`not_assessed` in reporting fields - never null, never 0.5."
`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:167`: "reported **`not_assessed`** - never null, never 0.5, never
silently carried forward."
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:406`: "Unmeasured attributes show as `not_assessed`, never as
zero or unchanged." `:350`: Writing Level 6 for Years 7-9 shows "`not_assessed`, never as a low score."

**3h. Evidence counts and caveats travel with every claim.**
`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:356`: "evidence counts travel with every claim; `not_assessed` is
explicit; … the caveat block is always present."
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:514`: "Evidence counts travel with every claim, so thin evidence
is visibly thin."
`Result.attributes.items` is the evidence count (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:287`).

**3i. Never render false precision.**
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:383`: `vocab_size_estimate` "is reported as a **band** (e.g.,
'2K-3K'), never an integer - a false-precision number is exactly what gets over-trusted downstream."

**3j. Quality flags that must be surfaceable.**
`low_confidence` (MAP posterior < 0.30 provisional, `SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:156`),
`effort_valid` (rapid-guess screen, `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:234`), and attribute bars carry
"probability with confidence shading" (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:201`).

### 4. Display labels (the human-readable headline per skill)

`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:164-179` — Reading primary labels with a jaggedness qualifier:

| Primary label | Rule |
|---|---|
| Pre-Reader | P(R1) < 0.5 |
| Decoder | R1 mastered, R2 and R3 not |
| Word-Level Reader | R1 + R2 mastered, comprehension layer not |
| Sentence Reader | R1 + R3 mastered, comprehension layer not |
| Gist Reader | R4 mastered, R5/R6 not |
| Detail Reader | R5 mastered, R6 not |
| Inferential Reader | R6 mastered, R7 not |
| Critical Reader | R7 mastered |

Qualifier examples: "Gist Reader (vocabulary gap)", "Inferential Reader (misses stated detail)"
(`:179`); v2.1 qualifiers reference the B1 vocab strand, e.g. "Gist Reader (B1 vocabulary gap)"
(`SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:152`, `SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:95`).

Listening labels (`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:251`): Pre-Listener, Sound Mapper,
Word-Level Listener, Sentence Listener, Gist Listener, Detail Listener, Inferential Listener,
Pragmatic Listener.
Speaking labels (`:322`): Emerging Speaker, Sound Producer, Rhythm Builder, Sentence Speaker,
Fluent Speaker, Interactive Speaker.
Writing (`:388`): resolves to an ACARA phase plus the sub-skill evidence map — no bespoke label list.

### 5. The three report views (one underlying record)

`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:197-207` and `DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:392-406`:

1. **Admissions Profile** (placement, first sitting) — one page per student, four skill panels, each
   with display label, ACARA phase, attribute bars (probability with confidence shading), and 2-3
   plain-language observations, e.g. "Reads for gist at B1 but misses stated detail; vocabulary is the
   bottleneck, not grammar". "No overall score, no cut line."
2. **Glance report** (any official sitting) — four labels + four phases + top 2 strengths and top 2
   gaps. "One screen, readable in ten seconds."
3. **Progress report** (progress mode) — per-attribute **transition statements** ("detail: emerging →
   mastered"), probability deltas vs the previous sitting, time between sittings, and the per-skill
   readiness indicator (met / approaching / not yet). `not_assessed` shown explicitly.
   `DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:72`: "The progress report states transitions … not raw
   probability arithmetic."

**Partial publishing** (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:205`): receptive scores appear immediately;
Speaking/Writing are flagged "pending" and filled in when scoring completes. A failed skill renders as
"scoring" (`SCHOOLTEST_DOC0A_USER_JOURNEYS_V2.md:130`); an exported partial marks pending skills
`not_assessed` with reason "scoring" (`SCHOOLTEST_DOC0A_USER_JOURNEYS_V2.md:242`).

**Practice results are transient** — item-level feedback only, "no official record, never visible to
teachers" (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:207`; `SCHOOLTEST_DOC0A_USER_JOURNEYS_V2.md:172`
"Practice results never appear here").

### 6. The language the product uses (copy law)

`SCHOOLTEST_ONSHORE_HANDOFF.md:142-153`, headed "Copy rules (do not edit copy without checking these)":

- Product name: **SchoolTest** — "one word, capital S, capital T. Never 'School Test' or 'Schooltest'"
- **Australian English spelling** (recognise, colour, organisation)
- **Never use em dashes. Use hyphens instead**
- No hype words: revolutionary, game-changing, cutting-edge, unleash, supercharge
- **No psychometric jargon on the public page: no "G-DINA", "Q-matrix", "attribute", "mastery probability"**
- Claim discipline: "designed to" / "built on" / "developed with" — **never "validated", "proven", "calibrated"**
- "Mainstream-ready" / "mainstream readiness" is a key product phrase
- ACARA EAL/D phases: Beginning, Emerging, Developing, Consolidating
- CEFR levels (A1-C1) always alongside plain meaning
- The teacher is always the hero

Pre-launch claim constraint (`SCHOOLTEST_ONSHORE_HANDOFF.md:13-18`): no "validated"/"proven"/
"calibrated"/"trusted by X schools" claims anywhere; all capability claims use "designed to"/"built on".
Sample data disclaimer (`:159`): all profile numbers in the prototype are illustrative and fictional.

Proficiency-bar colour semantics the handoff calls "critical - do not change"
(`SCHOOLTEST_ONSHORE_HANDOFF.md:91-98`): Mastered = teal `#2a9d8f`, Developing = blue `#5ba8d9`,
Emerging = amber `#f4a261`, Beginning = orange `#e76f51`. (Implementation colour-space conflict: see C4.)

### 7. Privacy constraints that bind any reporting surface

- `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:11`: "**PII boundary (hard rule):** real student identity never
  leaves Strapi. All R calls and all exports carry only an opaque `student_key`."
- `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:174`: `given_name`, `family_name` — "**Never exported**".
- `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:236`: "the diagnostic export contains no name, no raw transcripts,
  and no student writing by default".
- `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:186`: background fields are quasi-identifiers — "excluded from
  public reporting, small-cell suppression on aggregate dashboards".
- `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:367` / `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:232`: role-scoped
  access, teachers see only their own students; minors' data.

---

## FRONTEND BINDING RULES

Source precedence (stated in `schooltest-web/CLAUDE.md:9`): "`.claude/rules/` … Binding rules. In any
conflict, the rule file wins over this guide."

### Hard bans (violating any is a task failure)

| # | Ban | Source |
|---|---|---|
| F1 | **No relative `../` imports.** Always the `@/` alias. Relative only within the same module directory. | `.claude/rules/imports.md:6,12` |
| F2 | **Never edit `src/components/ui/*`** (shadcn primitives). Wrap them in module components; never replace or duplicate. | `CLAUDE.md:46`; `.claude/rules/state-data.md:14-15` |
| F3 | **Never use `any`.** Use `unknown` and narrow. TypeScript only for new files — no `.js`/`.jsx`. | `CLAUDE.md:42,49` |
| F4 | **No arbitrary Tailwind values.** No `p-[23px]`, `w-[347px]`, `text-[17px]`. "Square brackets `[]` = wrong." Every value from the default scale or an `@theme` token. | `.claude/rules/tailwind.md:13,15,22` |
| F5 | **OKLCH colours ONLY.** "Never raw hex, HSL, `#000`, `#fff`. Always tint." | `.claude/rules/tailwind.md:11`; `CLAUDE.md:154` |
| F6 | **File limits: 200 lines max; components 120 lines max.** | `CLAUDE.md:136` |
| F7 | **Module folder placement law:** ALL custom code lives in `src/modules/[name]/`; "Code outside modules is a structural violation." Types → `types/x.types.ts`; Zod → `schemas/x.schema.ts`; `useQuery`/`useMutation` → `queries/use-x.query.ts`; custom hooks → `hooks/useX.ts`; `'use server'` → `actions/x.action.ts`; stores → `stores/use-x-store.ts`; constants → `constants/x.constants.ts`; pure utils → `lib/x.ts`. | `.claude/rules/module-pattern.md:8,18-27` |
| F8 | **Never `fetch`/`axios` in components.** Typed Axios instances live only in `src/lib/axios/`; go through TanStack Query hooks in `queries/`. | `CLAUDE.md:44`; `.claude/rules/state-data.md:33,38-39` |
| F9 | **next-intl for every string.** "**Never hardcode user-facing strings.** Every string goes through `t()`." All locale files must have identical key shape. | `.claude/rules/i18n.md:16,18`; `CLAUDE.md:153` |
| F10 | **Server Components by default.** `'use client'` only for state/effects/browser APIs/event handlers, and only as the very first line. | `CLAUDE.md:43`; `.claude/rules/nextjs-patterns.md:12,22` |
| F11 | **pnpm ONLY** — npm/yarn/bun = failure. | `CLAUDE.md:41` |
| F12 | **App Router ONLY.** No `pages/`, no `getServerSideProps`/`getStaticProps`. | `CLAUDE.md:45,147` |
| F13 | **No unsolicited comments or docs in code.** No secrets committed. | `CLAUDE.md:48,50` |
| F14 | Cross-module imports go **through the barrel `index.ts` only**; never reach into another module's internals. Within the same module, import direct from source, never the barrel. | `.claude/rules/module-pattern.md:12-13`; `.claude/rules/imports.md:14` |
| F15 | **Banned fonts:** Inter, Roboto, Arial, Open Sans, Lato, Montserrat. Use Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, Urbanist, DM Sans. | `.claude/rules/tailwind.md:18` |
| F16 | **Banned visual patterns:** glassmorphism, gradient text on headings, neon-on-dark. Animate `transform`/`opacity` ONLY. Exponential easings only. | `.claude/rules/tailwind.md:19-21` |
| F17 | **Never `<div onClick>`** — `<button>` for actions, `<a>`/`<Link>` for navigation. `<Link>` from `next-intl/navigation` for internal nav, never raw `<a>`. | `.claude/rules/quality.md:44`; `CLAUDE.md:155` |
| F18 | **Components are dumb.** No business logic, no calculations/transformations, no >3 `useState`, no complex `useEffect`, no non-hook helper functions. "Remove the JSX `return` — if >15 lines of logic remain, the component does too much." | `.claude/rules/module-pattern.md:38-46` |
| F19 | **Never `process.env` outside `src/lib/env.ts`** (`@t3-oss/env-nextjs` + Zod). | `.claude/rules/quality.md:53` |
| F20 | **4pt spacing scale only** (`p-1,2,3,4,6,8,12,16,24`); max `p-24`; no `px-80`/`py-96`; `gap-*` for sibling spacing, never margin. | `.claude/rules/tailwind.md:12,14,16` |

### Non-negotiable positives

- **Stack is fixed** (`CLAUDE.md:78-93`): Next.js 16 App Router + React 19 + Turbopack, TS 5.6+ strict,
  Tailwind v4 CSS-first OKLCH, shadcn/ui, next-intl, Zustand, TanStack Query v5, Axios, react-hook-form
  + Zod, sonner, lucide-react/@heroicons, Splide, Vitest + RTL + Playwright, pnpm. New libraries require
  user confirmation. Extended approved/banned list: `.claude/rules/module-pattern.md:52-69`
  (charts: Recharts or Tremor; banned Chart.js/Victory/Nivo. Animation: Framer Motion; banned
  react-spring/GSAP. Tables: @tanstack/react-table + shadcn Table).
- **Next 16 async APIs**: `cookies()`/`headers()`/`searchParams`/`params` are async — `await` them
  (`CLAUDE.md:145`). `revalidateTag` requires a cacheLife profile second arg (`CLAUDE.md:149`).
  Parallel-route slots require `default.tsx` (`CLAUDE.md:160`). `error.tsx` uses `unstable_retry()`,
  not `reset()` (`CLAUDE.md:162`; `.claude/rules/nextjs-patterns.md:66`). `experimental.ppr` removed →
  `cacheComponents: true` (`CLAUDE.md:161`).
- **Server Actions are not a security boundary** — re-check auth inside every action
  (`.claude/rules/nextjs-patterns.md:39-40`). Validate all input with Zod server-side (`:34`).
- **Forms**: always `useForm` + `zodResolver` + shadcn Form primitives + `defaultValues`; the same Zod
  schema validates client and Server Action (`.claude/rules/state-data.md:46-50`).
- **Zustand**: one store per concern, always selectors, never imported in a Server Component
  (`.claude/rules/state-data.md:20-25`).
- **Accessibility**: WCAG AA contrast (4.5:1 body, 3:1 large), keyboard reachable, visible focus rings,
  alt text on every image, `<Label>` on every input, modals trap focus + ESC closes
  (`.claude/rules/quality.md:40-47`).
- **SEO**: every page exports `metadata`/`generateMetadata`; title ≤60, description ≤160; one `<h1>`
  (`.claude/rules/quality.md:27-32`).
- **Performance**: `next/image` for all images with width/height or fill; `next/font` for all fonts;
  Core Web Vitals LCP < 2.5s, INP < 200ms, CLS < 0.1 (`.claude/rules/quality.md:12-20`).
- **TDD is "non-negotiable"**: red → green → refactor; "Never write tests after implementation"; every
  new feature ships with at least one test (`.claude/rules/testing.md:7-13,23`). Server Components
  cannot render in JSDOM — test via extracted pure functions or Playwright (`:19`).
- **Theme is forced light** (`src/components/providers.tsx`, `forcedTheme="light"`) — a deliberate prior
  decision, do not revert (`/home/hnr/Code/schooltest/.qa/RULES.md:90-91`).

---

## BACKEND BINDING RULES

Source precedence (`schooltest-api/CLAUDE.md:5`): "Before editing any file, read the matching rule file.
In any conflict, the rule file wins."

### Hard bans (CLAUDE.md §2 "Violating any of these is a task failure")

| # | Ban / law | Source |
|---|---|---|
| B1 | **NEVER `strapi.entityService`.** Use `strapi.documents()` exclusively. | `CLAUDE.md:41`; `.claude/rules/document-service.md:8` |
| B2 | **NEVER numeric `id` — always `documentId`** (24-char string). Routes use `:documentId`, filters use `documentId`, responses expose `documentId`. | `CLAUDE.md:42,172`; `.claude/rules/rest-api.md` ("URL uses `:documentId`, NEVER numeric `id`") |
| B3 | **NEVER `populate: '*'`** in any code path, "even 'just for testing'". Always an explicit populate shape with `fields`. | `CLAUDE.md:47-48`; `.claude/rules/document-service.md:13` |
| B4 | **NEVER skip sanitization** in controller overrides: `sanitizeQuery`, `sanitizeOutput`, `transformResponse` (+ `validateQuery`, `sanitizeInput`). | `CLAUDE.md:46`; `.claude/rules/controllers.md` ("CRITICAL — never skip on replaced actions") |
| B5 | **Custom route files MUST be `01-custom-<name>.ts` / `02-…`** — files load alphabetically and the core `/:documentId` wildcard otherwise swallows them. | `CLAUDE.md:53,170`; `.claude/rules/routes.md` |
| B6 | **`auth: true` is INVALID** in route config — use `false` or `{ scope: [...] }`; omit to require auth. | `CLAUDE.md:52,169`; `.claude/rules/routes.md` |
| B7 | **Schema.json is the single source of truth, written by hand** — never the admin Content-Type Builder. | `schooltest-api/CLAUDE.md:124` ("content-types/<name>/schema.json # single source of truth"); `/home/hnr/Code/schooltest/schooltest-web/.qa/RULES.md:10-11` |
| B8 | **After any schema change run `pnpm strapi ts:generate-types`.** | `CLAUDE.md:184,236`; `.claude/rules/typescript.md` |
| B9 | **TypeScript only.** No `.js`, no `require()`, no `module.exports`; always `export default`. Never JSDoc-as-types. | `CLAUDE.md:43`; `.claude/rules/typescript.md` |
| B10 | **pnpm only** — never npm/yarn/bun/**npx**. | `CLAUDE.md:26,44` |
| B11 | **Never throw bare `Error`** — use `@strapi/utils` classes (`ValidationError` 400, `NotFoundError` 404, `ForbiddenError` 403, `UnauthorizedError` 401, `PolicyError` 403, `PaginationError` 400, `PayloadTooLargeError` 413, `RateLimitError` 429, `NotImplementedError` 501, `ApplicationError` 500). | `CLAUDE.md:57,148-163` |
| B12 | **Document Service middleware must `return next()`** on every path, including early-exit branches. | `CLAUDE.md:50`; `.claude/rules/document-middleware.md` |
| B13 | **Never call `strapi.documents(uid)` inside that same uid's own middleware** (infinite recursion) — use `strapi.db.query(uid)` to bypass. | `CLAUDE.md:51,176` |
| B14 | **Never mutate `ctx.request.body`** — build a new object. | `CLAUDE.md:58` |
| B15 | **Never hardcode a content-type UID twice in one file** — `const UID = 'api::x.x' as const`. | `CLAUDE.md:55`; `.claude/rules/typescript.md` |
| B16 | **Never commit `.env`.** Secrets in `.env.local` / `.env.production`, never tracked. `.env.example` is committed. | `CLAUDE.md:54,141` |
| B17 | **Do NOT hand-edit `tsconfig.json`** — never change `module`, `target`, `moduleResolution`, `noEmit`, `include`. | `.claude/rules/typescript.md`; `.claude/rules/scaffolding.md:§9` |
| B18 | **`pnpm tsc --noEmit` must pass before declaring done** (zero errors). | `CLAUDE.md:59,229` |
| B19 | **Never `await` inside a for loop** where `Promise.all()` works (except ordering-sensitive writes). No native bulk ops. | `CLAUDE.md:56,188` |
| B20 | **Every edit reversible** — no destructive migration without a `down()`. Enum changes require a knex migration. | `CLAUDE.md:61,179` |

### Structural laws

- **Every content-type needs 4 files**: `content-types/<singular>/schema.json` + `controllers/<singular>.ts`
  + `services/<singular>.ts` + `routes/<singular>.ts`, all named after the **singularName**, not the api
  folder (`.claude/rules/scaffolding.md:§4,§5`). UID = `api::<apiFolder>.<singularName>`
  (`.claude/rules/scaffolding.md:§3`; `api::settings.setting`, never `api::settings.settings`).
- **Components live only in `src/components/<category>/<name>.json`**; refs are `<category>.<name>`
  (`.claude/rules/scaffolding.md:§1,§2`). Dynamic zones cannot nest inside components (`CLAUDE.md:182`).
- **No empty content-types** — `"attributes": {}` crashes the admin panel; pure logic belongs in
  `src/utils/` or a service (`.claude/rules/scaffolding.md:§11`).
- **Naming scopes**: `src/middlewares/` → `global::<name>`; `src/api/<api>/middlewares/` →
  `api::<api>.<name>`; plugin → `plugin::<plugin>.<name>`. Never bare names
  (`.claude/rules/middlewares.md`, `.claude/rules/policies.md`).
- **Thin controllers, logic in services** (`factories.createCoreService`)
  (`.claude/rules/services.md`; `schooltest-web/.qa/RULES.md:16-17`).
- **Roles/permissions/seed users only in code** (`src/bootstrap/roles.ts`, `permissions-actions.ts`,
  seed files) — never the admin UI (`/home/hnr/Code/schooltest/schooltest-web/.qa/RULES.md:18-19`).
- **`createCoreController` must be `export default` directly** — no intermediate `const`
  (`CLAUDE.md:187`; `.claude/rules/controllers.md`).
- **Relation filters use nested objects**: `filters: { author: { documentId: 'xyz' } }`, never a bare id
  (`.claude/rules/document-service.md`).
- **Draft & publish**: REST returns published by default; core services default to `status: 'published'`
  (`CLAUDE.md:178`; `.claude/rules/services.md`).
- **`import type { Core } from '@strapi/strapi'`** — `Strapi` is not exported
  (`.claude/rules/scaffolding.md:§6`; `.claude/rules/typescript.md`).
- **Definition of Done checklist**: `schooltest-api/CLAUDE.md:222-237`.

---

## COMMAND POLICY

### `schooltest-web` (Next.js)

**FORBIDDEN** — `schooltest-web/CLAUDE.md:47,169`, `/home/hnr/Code/schooltest/.qa/RULES.md:87-88`:
- `pnpm dev`
- `pnpm build`
- `pnpm start`
- destructive git commands (revert, `reset --hard`, `push --force`, rebase, amending commits not
  authored this session, committing unless asked) — `CLAUDE.md:176`
- `npm`, `yarn`, `bun` — `CLAUDE.md:41`

**ALLOWED** — `CLAUDE.md:170`:
- `pnpm tsc --noEmit`
- `pnpm lint`
- `pnpm test --run`
- `pnpm exec playwright test`
- `git status` / `git log` / `git diff`
- file reads / greps
- `pnpm add <pkg>` only after confirming the library with the user (`CLAUDE.md:95`)
- `pnpm dlx shadcn@latest add <component>` for shadcn primitives (`.claude/rules/state-data.md:15`)

**Required before reporting completion:** `pnpm tsc --noEmit && pnpm lint` (`CLAUDE.md:182`).

### `schooltest-api` (Strapi)

**FORBIDDEN** — `schooltest-api/CLAUDE.md:45`:
- `pnpm dev`, `pnpm develop`, `pnpm start`, `pnpm build` ("NEVER START THE SERVER")
- `npm`, `yarn`, `bun`, `npx` (`CLAUDE.md:26,44`)
- committing `.env` (`CLAUDE.md:54`)

**ALLOWED** — `schooltest-api/CLAUDE.md:45,196-205`:
- `pnpm strapi generate`
- `pnpm strapi routes:list`
- `pnpm strapi content-types:list`
- `pnpm strapi console`
- `pnpm strapi ts:generate-types`
- `pnpm tsc --noEmit`
- read-only git/bash
- `pnpm lint` (added by `/home/hnr/Code/schooltest/.qa/RULES.md:52`)

**Required before done:** `pnpm tsc --noEmit` with zero errors (`CLAUDE.md:59,229`).

### `schooltest-app` (Electron; out of this task's edit scope, listed for completeness)

`/home/hnr/Code/schooltest/.qa/RULES.md:124-126`: "Allowed freely: `pnpm check`, `typecheck`, `lint`,
`test`, `build*`, `dist:*`, `icon`, `infra`, `pnpm exec playwright test`. Avoid long-running `pnpm dev`
unless needed (mission: the orchestrator owns it). Never destructive git."

### Repo-wide

`/home/hnr/Code/schooltest/.qa/RULES.md:15-17`: "pnpm ONLY, everywhere. Never npm/yarn/bun/npx." and
"Work on `main` in each of the three git repos. Never branch, never revert, never force-push, never
rewrite history. Commit per wave, referencing task ids."

Note the orchestration exception, `/home/hnr/Code/schooltest/.qa/RULES.md:52`: "(Mission: the
orchestrator runs servers — see DECISIONS OP-3.)" and `schooltest-web/.qa/RULES.md:6-7`: the API
"already runs on :5500; restarts only via the run task."

---

## CONFLICTS

Resolution principle, stated in `/home/hnr/Code/schooltest/.qa/RULES.md:4-5`: "Each package's
`.claude/rules/<topic>.md` wins over its `CLAUDE.md`, which wins over this summary. Never cross-apply
one package's rules to another." Both package CLAUDE.md files say the same
(`schooltest-web/CLAUDE.md:9`, `schooltest-api/CLAUDE.md:5,11`).

**C1 — "teacher portal" vs "parent portal" for `schooltest-web` (unresolved by precedence).**
`/home/hnr/Code/schooltest/.qa/RULES.md:61` heads the section
"`schooltest-web` — Next.js 16 **teacher portal** + marketing site".
`/home/hnr/Code/schooltest/schooltest-web/.qa/RULES.md:22` heads its section
"[schooltest-web] Next.js 16 **parent portal**".
The product docs support neither: `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:54-58` defines only Student,
Teacher and Admin. Resolution by the stated precedence rule: neither `.qa/RULES.md` is a package
`.claude/rules/` file, so neither overrides the other; the more specific/local file is
`schooltest-web/.qa/RULES.md` (it sits inside the package). **It is also the one corroborated by the
shipped app** (`schooltest-web/src/i18n/messages/en.json:188` — "Sign in to your SchoolTest parent
account to manage your students"; routes `src/app/[locale]/dashboard/children`). Treat schooltest-web as
the parent-facing surface, but note that **no product doc specifies parent-facing reporting**, so the
reporting vocabulary above (teacher/student-facing) is the only sanctioned vocabulary. Flagged in
UNKNOWNS.

**C2 — Lifecycle hooks: banned vs prescribed (backend).**
`schooltest-api/CLAUDE.md:49`: "**NEVER USE LIFECYCLE HOOKS FOR NEW LOGIC.** Use **Document Service
Middleware** in `src/index.ts`. Lifecycle hooks are legacy."
`.claude/rules/document-service.md`: "Use for cross-cutting concerns (audit, global validation). **Use
lifecycle hooks for per-content-type business logic.**"
`.claude/rules/document-middleware.md`: "For per-content-type business logic, prefer lifecycle hooks."
`.claude/rules/lifecycles.md`: "Lifecycle hooks: per-content-type business logic. Document Service
middleware (src/index.ts): cross-cutting concerns across content-types."
`/home/hnr/Code/schooltest/.qa/RULES.md:40` restates the CLAUDE.md ban.
**Resolution:** the rule files win over CLAUDE.md and over `.qa/RULES.md`. Doc Service middleware for
cross-cutting concerns; lifecycle hooks are permitted for per-content-type business logic. In practice
prefer Doc Service middleware where either would work, since three sources push that way.

**C3 — `populate: '*'`: absolute ban vs "avoid in prod".**
`schooltest-api/CLAUDE.md:47-48`: never, "even 'just for testing'".
`.claude/rules/document-service.md:13`: "NEVER populate `'*'` in **production paths**".
`.claude/rules/rest-api.md`: "`?populate=*` (**avoid in prod**)".
**Resolution:** the rest-api.md/document-service.md wording is about documenting REST query syntax and
carves out non-production usage; CLAUDE.md is absolute for code paths. Apply the strictest reading —
never write `populate: '*'` in any committed code path; the caveat only describes what a client *can*
send, not what we write.

**C4 — Product design-system hex colours vs OKLCH-only frontend rule.**
`SCHOOLTEST_ONSHORE_HANDOFF.md:71-98` specifies raw hex CSS custom properties (`--navy: #1a2744`,
`--teal: #2a9d8f`, …) and calls the proficiency bar colour mapping "critical - do not change".
`schooltest-web/.claude/rules/tailwind.md:11`: "**OKLCH colors ONLY.** Never raw hex, HSL, `#000`,
`#fff`." `schooltest-web/CLAUDE.md:154` bans pure `#000`/`#fff`.
**Resolution:** the package rule file governs implementation (colour space and token mechanism); the
handoff governs *semantics* (which proficiency level maps to which hue, and the fixed level names).
Convert every hex to an OKLCH `@theme` token and preserve the Mastered→teal / Developing→blue /
Emerging→amber / Beginning→orange mapping.

**C5 — Proficiency scale: 4-level marketing scale vs 4-value data enum (labelling hazard).**
`SCHOOLTEST_ONSHORE_HANDOFF.md:39,91-98` uses **Mastered / Developing / Emerging / Beginning** for the
profile bars.
`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:50` defines `attribute_status` as **mastered / emerging /
not_mastered / not_assessed**.
`SCHOOLTEST_ONSHORE_HANDOFF.md:151` defines the ACARA EAL/D phases as **Beginning / Emerging /
Developing / Consolidating**.
These are three different vocabularies that share words. **Resolution:** Doc 1 is normative for data
("Full field tables, types, and constraints are in Doc 1", `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:120`), so
a per-attribute status chip must render one of the four `attribute_status` values; an ACARA phase badge
must render one of the four ACARA phases; the handoff's bar wording is prototype/marketing copy for the
public landing page and must not be reused as an attribute-status label without a Crosswalk mapping.
`not_mastered` and `not_assessed` have no equivalent in the marketing scale and must never be collapsed
into "Beginning".

**C6 — Doc set version skew: v2 vs v2.1.**
`SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:3`: "the updated docs (Doc 2a fully revised; Docs 0, 1, 3, 4
patched) are the post-change source of truth."
But the on-disk Doc 0 and Doc 1 still carry v2 content: `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:44` says
"The valid latent space is **68** attribute patterns"; `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:72,150,206`
still define `coloads_detail` and the R1-only hierarchy. v2.1 supersedes all of these:
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:3` and `SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:70` — **38** valid
patterns, `coloads_detail` deleted, `supplementary` added (Item/Response/Result), task type `2E` added
to both receptive enums, R6/L6 display name "Propositional Inference", simplified CEFR lookup, revised
readiness rule.
**Resolution:** where v2.1 (the change note, construct mapping v2.1, Doc 2a v2.1 — all dated Jul 19)
speaks, it wins over the Jul 14 Doc 0/Doc 1 text. Doc 1 remains normative for everything v2.1 does not
touch (`SCHOOLTEST_API_CHANGE_NOTE_V2_1.md:106-108` lists what is explicitly unchanged).
Duplicate files: `DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md` is v2.1 and
`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2.md` is v2 (headers at line 1 of each); likewise
`SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md` is v2.1 and `…_V2.md` is v2. Use the `(1)` copies.

**C7 — Barrel imports: "always" vs "never" (same file family, not actually contradictory).**
`.claude/rules/module-pattern.md:12`: "Cross-module imports MUST go through the barrel `index.ts`."
`.claude/rules/imports.md:14`: "Never import from barrel index files **in the same module** — import
directly from the source file."
**Resolution:** not a conflict — cross-module = barrel; intra-module = direct source import.

**C8 — Web allowed-command list: CLAUDE.md §0 vs §6.**
`schooltest-web/CLAUDE.md:47` says "Allowed: `pnpm tsc --noEmit`, `pnpm lint`"; `:170` adds
`pnpm test --run`, `pnpm exec playwright test`, `git status/log/diff`, file reads/greps.
**Resolution:** §6 is the fuller enumeration of the same policy and `/home/hnr/Code/schooltest/.qa/RULES.md:87-88`
corroborates it. Use the §6 list. The forbidden set (`dev`/`build`/`start`) is identical in both.

**C9 — i18n locale set.**
`/home/hnr/Code/schooltest/schooltest-web/.qa/RULES.md:31-32`: "everything via messages/{en,de}.json,
identical key shape". The repo actually contains `en, vi, ms, zh, th, ko` message files
(`/home/hnr/Code/schooltest/schooltest-web/src/i18n/messages/`). `.claude/rules/i18n.md:13,18` states
the binding form neutrally: "one JSON per locale… ALL locale files MUST have the same key shape."
**Resolution:** the rule file wins — the `{en,de}` enumeration in `.qa/RULES.md` is stale; the binding
constraint is identical key shape across whatever locales exist.

---

## UNKNOWNS

1. **What a parent is supposed to see is not specified anywhere in `/home/hnr/Code/schooltest/docs/`.**
   The product docs define three roles (Student, Teacher, Admin —
   `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:54-58`) and three report views, all scoped to student and
   teacher visibility (`SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:88` "Who can view result | Student | Student
   + teacher | Student + teacher"). No doc states which fields a parent may see, whether a parent may
   see attribute probabilities, or whether parents get the diagnostic export (which is explicitly
   "Teacher role, own students only", `SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:182`). I cannot determine the
   parent permission scope from the docs.
2. **Whether the marketing 4-colour bar scale is intended for the authenticated portal at all.**
   `SCHOOLTEST_ONSHORE_HANDOFF.md` covers a single-page public landing page only (`:5`), and its own
   sample data is declared fictional (`:159`). No doc extends its bar vocabulary to the product UI.
3. **The plain-language attribute descriptors** (e.g. "recognises written English words reliably",
   `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:338`) are stated to come from the Crosswalk seed
   (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:356,376`; "Full rule table in the Crosswalk seed",
   `SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:152`). The Crosswalk seed values are listed as open item
   #3 in `SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:376` — they are not in any doc I read, so the exact
   parent-readable wording per attribute is undetermined.
4. **The display-label qualifier rule set** is deferred: "The qualifier rule set lives in the reporting
   spec" (`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2 (1).md:179`). No reporting spec file exists in
   `/home/hnr/Code/schooltest/docs/`.
5. **`schooltest-web/AGENTS.md`** is referenced by `/home/hnr/Code/schooltest/.qa/RULES.md:61` as a
   source for the web package; I did not read it (not named in my task scope), so any rules unique to it
   are not represented here.
6. **`prob_se`** is an open item — "confirm R-side computation (posterior spread) or leave null for the
   field test" (`SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:377`). Whether confidence intervals can be rendered
   is therefore undetermined.
