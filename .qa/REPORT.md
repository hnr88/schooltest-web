# REPORT — mission st-portal-fixes (Agent G, 2026-07-24)

Operator spec (9 demands, verbatim typos preserved in intake) — all delivered and proven
against the live stack (web :3110, api :5510, postgres :5550 `st-portal-*`).

## Delivered, per demand

1. **Wizard step gating** ("can just go to step 2 without finishing the first").
   Continue runs `form.trigger(STEP_FIELDS[step])` and advances only when valid; rail
   steps beyond the furthest validly-completed step are `disabled` + `aria-disabled`.
   Edit mode starts fully reachable (record was valid at creation). Web `2366c4b`.
   Proof: `020-wizard-skip-e2e.spec.ts` (inverted), `027` §5, `054` — green.

2. **Everything mandatory incl. both uploads** ("audio upload video upload … mandatory").
   The form's two uploads are `photo` + `voice_intro` — there is NO video field in the
   data model (D-G-1); both are now required, plus every other rendered field
   (family_name, email, dob, gender, passport, current_school, current_year_level,
   guardian email; only year_level + guardian wechat stay optional).
   Client: wizard Zod schema + required markers + 10 new `StudentWizardSchema` i18n
   keys ×6 catalogs. Server: `parentStudentCreateSchema` + `assertStudentMedia({requireAll})`
   400s on any miss (api `51d759f`). Update path untouched (partial + null-clear).
   Proof: live `POST /api/students` minus media → 400 `["photo","voice_intro"]`;
   `054-wizard-required-media.spec.ts` — photo-only blocked, voice-only blocked,
   full valid create persists and survives reload.

3. **School search fixed + compact cards + images in Strapi.**
   Root cause of "no results": the `st-portal` DB had **0 schools / 0 agents** — data,
   not code. Seeded 312 + 8 via `strapi console` (never SEED=true, OP-35). Live:
   total 312, `q=Paterson` → 1. Cards: grid `sm:2 xl:3`, map default closed, tighter
   padding (web in auto-commit `1202d02`). Images: 312 branded 1200×675 PNGs generated
   (deterministic per school, D-G-6) and uploaded through the REAL upload service +
   `school.coverImage` link (api `4a9dfa3`); `files` +312, all 312 search hits carry
   `coverImage.url`, covers serve `200 image/png`.
   Proof: `unified-search*`, `school-search-presentation` (3-column assertion + every
   card renders a real cover), `school-map`, `school-filter-panel` — green twice.

4. **Agent search fixed** — same data root cause; 8 verified agents live. Grid now
   `sm:2 xl:3`. Proof: `unified-search-states`, `agent-search-polish` (q + service
   round-trip) — green twice.

5. **Children settings removed** — tab, union member, panel mapping, 2 components
   deleted, dead i18n pruned ×6; `?tab=children` coerces to default. Web `35a5cd9`.
   Proof: `settings-tabs.spec.ts`.

6. **Search settings rewritten** — was a write-only form nothing consumed. Now:
   default states / default sort / results-per-page, and the school-search store
   HYDRATES from them (per-field `defaultsTouched` guards — user choices never
   clobbered; re-saves re-apply in-session; Reset returns to saved defaults).
   Proof: `settings-search-defaults.spec.ts` asserts the saved defaults reach the
   live search POST body, and A→B re-save re-applies over SPA navigation.

7. **Notifications tested + toggles verified** — all 7 toggles + digest round-trip
   save → GET → reload. The historical sms flake was a cross-spec full-row restore
   clobber (test-layer, fixed via delta restores). Dispatch coverage: all 5 categories
   seeded through the REAL dispatch service, filter pills, mark-all-read, `inAppEnabled`
   mute semantics (contract-real). Bonus root-cause fix: `use-me` retry storm
   (~400 req/s on expired JWT blanking the dashboard) — `retryOnMount:false`
   (web `af4b392`, `7ecea77`). Proof: notification+push group 25/25 green twice.

8. **Settings moved left** — from the bottom-pinned "Account" group into the primary
   nav list with the other items (group 'system' retired). Web `35a5cd9`.
   Proof: `shell.spec.ts`.

## Gates

- `pnpm tsc --noEmit` + `pnpm lint`: 0 errors both repos (1 pre-existing warning,
  `articles/CreateArticleForm.tsx`, untouched).
- E2E: every mission-owned suite green at `--workers=1` (wizard 25, search 21,
  settings/shell 23, notifications+push 25×2, triage batches). Full-suite at
  `--workers=2` trips the API's 120 req/min limiter — cascade documented; pacing
  helpers (`tests/e2e/helpers/pace.ts`) keep single-worker runs safe.
- Critic: pass 1 → 2 FIXes (both shipped: stale 027 spec; defaults re-apply) + NITs;
  pass 2 → NITs only (dead flag since removed); pass 3 → **CLEAN**. Two consecutive
  clean passes + banned-pattern scans clean in both repos.

## Known reds (pre-existing, NOT this mission)

- Teacher-portal family (teacher-report, supplementary-strand, attribute-bars,
  teaching-observations, household-progress-contract — 21 tests): the `st-portal`
  DB has **0 labelled results** (`results.display_label` empty; teacher owns no
  official result). Another mission's fixtures — proven via psql, not rebuilt.

## Assumptions / decisions (`.qa/DECISIONS.md` D-G-1..8)

- "audio + video" = the form's two real uploads (photo + voice_intro); no video field invented.
- "add more notifications" = more coverage, not new backend event types.
- School covers are generated brand art (seed content), not photography.
- Infra: api :5510 / web :3110 / postgres :5550, docker context `default`; E2E via `E2E_PORT=3110`.

## Security notes for humans

- VAPID dev keypair generated into `schooltest-api/.env` only (uncommitted) — regenerate
  if the instance is rebuilt, else push specs fail on `publicKey: null`.
- `parent-t06` fixture user exists DB-only (SEED=false); a reseed must recreate it.
- A probe user `probe-onb-1784959017@schooltest.test` remains in the dev DB (harmless).
- Rate limiter (120 req/min global, 20/min auth) is the binding constraint for parallel
  e2e; consider a higher limit for the e2e profile.

## Commits (main, never a new branch)

- web: `2366c4b` wizard gating + mandatory · `ac57a00` wizard e2e · `1202d02`+`4d4435d`
  (auto-swept) cards/covers/search e2e · `a0873ff` pacing · `35a5cd9` settings/shell ·
  `0e33754`+`af4b392` notifications · `4abd9c4` (auto-swept) + `7ecea77` triage fixes ·
  `655177c` dead-flag cleanup
- api: `51d759f` parent-create validation · `4a9dfa3` cover generation scripts
