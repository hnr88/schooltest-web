#!/usr/bin/env bash
# check-no-posteriors.sh — data contract §8 / dashboard §7 grep guard (task 38).
#
# `prob`, `prob_se`, `theta`, `likelihood` (= round(prob*100) — the same
# posterior in display units) and `map_posterior` are AUDIT fields. Permitted ONLY in
# node_modules, in (multi-line) type imports/re-exports from
# @schooltest/scoring-contracts, and on the KNOWN_LEGACY inventory below —
# the contract legitimately carries them, so a naive "no prob anywhere" guard
# fails on honest type imports and gets deleted within a week. Permit the type
# import, forbid the value.
#
# THREE TIERS:
#   1. KNOWN_LEGACY — inventoried file|task|snippet entries, each annotated
#      with the task that retires it; the guard passes over them.
#   2. EVERYTHING ELSE — any occurrence outside the allow-list fails, exit 1:
#      the guard catching the NEXT leak, from today.
#   3. STALENESS — an entry whose snippet no longer appears in its file FAILS,
#      naming it: the inventory must not outlive the problem it inventories.
#
# Test files (*.test.ts(x), *.spec.ts) are excluded: they assert the ABSENCE of
# these fields, so their source must be allowed to name them. Comments are
# scanned too — commented-out posterior code is exactly what resurfaces later.
set -uo pipefail
cd "$(dirname "$0")/.."

# file | retiring task | distinctive snippet (content-anchored: line numbers drift).
# NOTE: the attribute-view-model/attribute.types/mastery.constants(report) entries
# from the first inventory were RETIRED via the staleness check — kimi's task-36
# re-point removed them mid-run, which is the tier-3 check working as designed.
# Task 36 then retired the diagnostic-bundle.schema (task-25) and attribute.types
# (task-36) entries: the schema field is gone and the comment was reworded.
KNOWN_LEGACY=(
  'src/modules/teach/schemas/diagnostic.schema.ts|task-24|prob: z.number().nullable(),'
  'src/modules/teach/types/diagnostic.types.ts|task-24|task 50 sentinel semantics: null prob stays'
  'src/modules/teach/types/diagnostic.types.ts|task-24|prob: number | null;'
  'src/modules/teach/components/StudentMasteryDrilldown.tsx|task-24|A null prob renders as "not yet assessed"'
  'src/modules/teacher/schemas/teacher.schema.ts|task-24|DERIVED SERVER-SIDE from `prob`'
  'src/modules/teacher/schemas/teacher.schema.ts|task-24|`Math.round(prob * 100)`'
  'src/modules/teacher/schemas/teacher.schema.ts|task-24|round(mean(prob) * 100)'
  'src/modules/teacher/lib/student-drill-down.ts|task-24|by `mastery_band(prob)` before `status` was ever sent'
  'src/modules/teacher/constants/drill-down.constants.ts|task-24|which `mastery_band(prob)`'
  'src/modules/teacher/constants/mastery.constants.ts|task-24|`mastery_band(prob)` applies it SERVER-SIDE'

  # --- task-38 inventory of the `likelihood` needle's first sweep -------------
  # Closing the needle hole surfaced 27 occurrences the guard could not see.
  # NONE is a live posterior render: the SubskillTile/SubskillPill/MasteryLegend/
  # SubskillDeltaLine tree is task-30 residue with NO page importer (traced:
  # teacher/StudentTestCard and teacher/CollapsedTestSummary have zero importers,
  # and each file below them has exactly one — its own dead parent). The schema,
  # types and lib lines are the wire-level passthrough the portal prints
  # verbatim; the rest are prose comments ASSERTING the absence of thresholding.
  # Expiry task-30: it deletes the six dead components and drops likelihoodSchema
  # from teacher.schema.ts / teacher-result.schema.ts, at which point tier-3
  # fails every entry here and they must be removed. Three UNPARKED specs
  # (teacher-drilldown, teacher-exports, teacher-results) assert the dead
  # components' data-slots, so task-30 must re-sequence them in the same slice.
  'src/modules/teacher/hooks/useDrillDownComparison.ts|task-30|it never compares a likelihood to a mastery cut'
  'src/modules/teacher/schemas/teacher-result.schema.ts|task-30|prints `likelihood` as-is'
  'src/modules/teacher/schemas/teacher-result.schema.ts|task-30|likelihood: likelihoodSchema,'
  'src/modules/teacher/schemas/teacher.schema.ts|task-30|it never re-thresholds a likelihood'
  'src/modules/teacher/types/student-drill-down.types.ts|task-30|`likelihood: null` with `status:'
  'src/modules/teacher/types/student-drill-down.types.ts|task-30|carries the server'
  'src/modules/teacher/types/student-drill-down.types.ts|task-30|{ measured: true; likelihood: number; status: MasteryBand };'
  'src/modules/teacher/types/student-drill-down.types.ts|task-30|nothing subtracts one likelihood from another to invent it'
  'src/modules/teacher/components/SubskillTile.tsx|task-30|big LIKELIHOOD percentage'
  'src/modules/teacher/components/SubskillTile.tsx|task-30|printed as it arrived'
  'src/modules/teacher/components/SubskillTile.tsx|task-30|data-slot="subskill-tile-likelihood"'
  'src/modules/teacher/components/SubskillTile.tsx|task-30|, { likelihood: view.likelihood })}'
  'src/modules/teacher/components/MasteryLegend.tsx|task-30|"Mastery likelihood: >=80% mastered'
  'src/modules/teacher/components/MasteryLegend.tsx|task-30|compares a likelihood to them'
  'src/modules/teacher/components/SubskillDeltaLine.tsx|task-30|TEXT: the earlier likelihood'
  'src/modules/teacher/components/SubskillDeltaLine.tsx|task-30|Nothing here subtracts one likelihood from another'
  'src/modules/teacher/components/SubskillPill.tsx|task-30|data-slot="subskill-pill-likelihood"'
  'src/modules/teacher/components/SubskillPill.tsx|task-30|, { likelihood: view.likelihood })}'
  'src/modules/teacher/lib/student-drill-down.ts|task-30|PRESENCE test, never a threshold'
  'src/modules/teacher/lib/student-drill-down.ts|task-30|integer `likelihood` and the server'
  'src/modules/teacher/lib/student-drill-down.ts|task-30|C-TR-2 echoes for the legend'
  'src/modules/teacher/lib/student-drill-down.ts|task-30|if (subskill.likelihood === null) return { measured: false'
  'src/modules/teacher/lib/student-drill-down.ts|task-30|return { measured: true, likelihood: subskill.likelihood'
  'src/modules/teacher/lib/student-drill-down.ts|task-30|is forbidden here, because a'
  'src/modules/teacher/constants/drill-down.constants.ts|task-30|sees a likelihood number at all'
  'src/modules/teacher/constants/mastery.constants.ts|task-30|prints `likelihood` verbatim'
  'src/modules/teacher/constants/mastery.constants.ts|task-30|It never compares a likelihood to 80'
)

raw=$(grep -RniE '\b(prob|prob_se|theta|likelihood|map_posterior)\b' src \
  --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  | grep -vE '\.test\.tsx?:|\.spec\.tsx?:' \
  | awk '
      /from ["'"'"']@schooltest\/scoring-contracts["'"'"']/ { in_block = 0; next }
      in_block { next }
      (/^[[:space:]]*import\b/ || /^[[:space:]]*export type\b/) && !/from/ { in_block = 1; next }
      { print }
    ')

new_leaks=""
declare -A seen_known=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  file="${line%%:*}"
  known="no"
  for entry in "${KNOWN_LEGACY[@]}"; do
    IFS='|' read -r efile etask esnippet <<< "$entry"
    if [ "$file" = "$efile" ] && [[ "$line" == *"$esnippet"* ]]; then
      known="yes"
      seen_known["$entry"]=1
      break
    fi
  done
  if [ "$known" = "no" ]; then
    new_leaks+="  $line"$'\n'
  fi
done <<< "$raw"

stale=""
for entry in "${KNOWN_LEGACY[@]}"; do
  IFS='|' read -r efile etask esnippet <<< "$entry"
  if [ -z "${seen_known[$entry]:-}" ]; then
    stale+="  $efile no longer carries: $esnippet — the leak is gone, retire this entry (was: $etask)"$'\n'
  fi
done

fail=0
if [ -n "$new_leaks" ]; then
  echo "check-no-posteriors: NEW leaks outside the contract allow-list and the KNOWN_LEGACY inventory:"
  echo "$new_leaks"
  fail=1
fi
if [ -n "$stale" ]; then
  echo "check-no-posteriors: STALE KNOWN_LEGACY entries — retire them from this script:"
  echo "$stale"
  fail=1
fi
if [ "$fail" = 0 ]; then
  echo "check-no-posteriors: clean (${#seen_known[@]} of ${#KNOWN_LEGACY[@]} known legacy entries still present)"
fi
exit "$fail"
