---
id: 04
title: design-system module — form primitives (barrel re-exports + Field demo wiring)
layer: ui
kind: build
slice: form primitives re-exported through the design-system barrel
target: src/modules/design-system/index.ts, src/modules/design-system/components/form-field.tsx
contract: C-DS
status: DONE
depends_on: [01]
---
## Objective
Give the design-system module its forms surface: re-export the existing ui form primitives
through the barrel (single import surface for consumers, zero edits to ui/*), and add one
small composite the spec needs: a labeled `SwitchField`/`CheckboxField` row pattern is NOT
needed — instead ship a single `FieldRow`? NO — keep it minimal: pure re-exports plus typed
barrel. The showcase (task 07) composes Field/Input/Checkbox/Switch demos from these.

## Contract (C-DS re-export list — forms subset)
Re-export from their ui paths via the design-system barrel ONLY:
- `@/components/ui/input` → Input
- `@/components/ui/textarea` → Textarea
- `@/components/ui/label` → Label
- `@/components/ui/checkbox` → Checkbox
- `@/components/ui/radio-group` → RadioGroup, RadioGroupItem
- `@/components/ui/switch` → Switch
- `@/components/ui/select` → Select family (exact named exports as ui file)
- `@/components/ui/native-select` → NativeSelect family
- `@/components/ui/field` → Field family (exact named exports as ui file)
- `@/components/ui/input-group` → InputGroup family
First READ each ui file and mirror its EXACT named exports (they vary; e.g. select.tsx
exports Select, SelectContent, SelectItem, SelectTrigger, SelectValue, …). Do not invent
names. Do not re-export `Form` (react-hook-form form wrapper) — forms belong to feature
modules per state-data.md.

## Files
- EDIT src/modules/design-system/index.ts (add the re-exports; keep task-03 exports intact)

## Steps
1. Read the 10 ui files; list their named exports. 2. Add `export { X, Y } from
   '@/components/ui/<name>'` lines grouped under a comment `// forms`. 3. tsc+lint.

## Project rules
module-pattern (barrel only), imports.md (@/ alias), law 11 (no ui edits).

## Done criteria
- Barrel compiles; every listed family importable from '@/modules/design-system';
  no ui/* file modified (git diff --stat shows only the barrel); tsc+lint zero errors.

## Assumptions
- Re-export ≠ wrapper: styling comes from tokens (task 01). Variant-level changes for forms
  are not in the spec beyond what tokens already deliver.
## Evidence
PASS (independent verifier, 2026-07-17): 10 form families re-exported with exact ui names; barrel import probe typechecks; tsc 0, lint 0 errors; ui/* untouched.
(filled by builder/verifier)
