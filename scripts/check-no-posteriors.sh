#!/usr/bin/env bash
# check-no-posteriors.sh — data contract §8 / dashboard §7 grep guard (task 38).
#
# `prob`, `prob_se` and `theta` are AUDIT fields. They are permitted ONLY in
# node_modules and in (multi-line) type imports/re-exports from
# @schooltest/scoring-contracts — the contract legitimately carries them, so a
# naive "no prob anywhere" guard fails on honest type imports and gets deleted
# within a week. Permit the type import, forbid the value: anywhere else under
# src/ they are a rendered-surface leak and this exits non-zero.
#
# Test files (*.test.ts(x), *.spec.ts) are excluded: they assert the ABSENCE of
# these fields, so their source must be allowed to name them.
#
# A guard that cries wolf gets edited until it stops crying — so this scans
# comment lines too (commented-out posterior code is exactly what must not
# resurface), and the allowed vocabulary for prose is "posterior", not the
# field names.
set -uo pipefail
cd "$(dirname "$0")/.."

violations=$(grep -RniE '\b(prob|prob_se|theta)\b' src \
  --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  | grep -vE '\.test\.tsx?:|\.spec\.tsx?:' \
  | awk '
      /from ["'"'"']@schooltest\/scoring-contracts["'"'"']/ { in_block = 0; next }
      in_block { next }
      (/^[[:space:]]*import\b/ || /^[[:space:]]*export type\b/) && !/from/ { in_block = 1; next }
      { print }
    ')

if [ -n "$violations" ]; then
  echo "check-no-posteriors: posterior fields outside the contract allow-list:"
  echo "$violations"
  echo "prob/prob_se/theta are audit fields — render nothing from them (data contract §8)."
  exit 1
fi
echo "check-no-posteriors: clean"
