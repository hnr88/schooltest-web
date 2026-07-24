---
id: 002
title: Gate wizard navigation — step N+1 unreachable until step N valid
layer: frontend
kind: fix
slice: add-child wizard step gating
target: schooltest-web/src/modules/student-wizard
contract: n/a
status: DONE
depends_on: []
---
## Objective
User: "i can just [go] to step 2 without finishing the first — this is so bad." Today
Continue calls `next()` unconditionally (WizardScreen.tsx:56-62) and the rail jumps freely
(WizardStepRail.tsx:32-35 -> goToStep). Gate both.
## Files
- src/modules/student-wizard/components/WizardScreen.tsx (handleContinue: await
  form.trigger(STEP_FIELDS[step]) before next(); block on invalid)
- src/modules/student-wizard/hooks/use-student-wizard.ts (goToStep: only allow targets that
  are reachable — target <= furthest completed step + 1; needs a completed-steps notion)
- src/modules/student-wizard/components/WizardStepRail.tsx (disable/aria-disable unreached steps)
- src/modules/student-wizard/schemas/student-wizard.schema.ts (STEP_FIELDS already exists, lines 111-123)
## Steps
1. Continue: validate current step fields via form.trigger; advance only when valid; focus first error otherwise.
2. Rail: a step button is enabled only for steps already reached (visited) or the next step after the furthest valid one; track furthest reached index in the wizard hook state.
3. Keep edit mode working (same WizardScreen).
4. i18n: add any needed a11y labels in all 6 catalogs.
## Project rules
schooltest-web/CLAUDE.md + .claude/rules/{module-pattern,state-data,i18n,quality}. <=200 lines/file. No edits to src/components/ui.
## Done criteria
- Clicking Continue with empty step 1 does NOT advance (validation errors shown).
- Rail button for step 2+ cannot be activated before step 1 is valid.
- Completing step 1 unlocks step 2; pnpm tsc --noEmit + pnpm lint clean.
## Verification evidence
Builder: tsc/lint 0 errors both repos. Orchestrator: rail gating code reviewed in diff;
e2e proof delegated to task 005 specs. Committed web 2366c4b.
