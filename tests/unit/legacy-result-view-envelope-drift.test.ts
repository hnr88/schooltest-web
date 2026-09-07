import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from 'vitest';

import { legacyResultViewSchema } from '@/modules/report/schemas/result-view.schema';
import { resultViewBaseSchema } from '../../../schooltest-api/src/contracts/results';

/**
 * DRIFT GUARD for the web legacy envelope — this file does NOT touch
 * `report/schemas/result-view.schema.ts` (task 36's file; its design stands).
 * It only pins its ENVELOPE keys against the server contract, because the app's
 * hand-written v1 mirror drifted exactly this way once: it never learned
 * `model_version`/`legacy_caveat`, and being strict it ended up parsing NOTHING
 * the server could send — every untagged/legacy/combined/listening C-4 response
 * threw in the client while every hand-written fixture stayed green. Web is
 * currently correct by accident of timing; this guard makes it correct on
 * purpose.
 *
 * DELIBERATE DIFFERENCE, ALLOWED AND NOT A DRIFT: web's attribute MEMBER is
 * non-strict and UNdeclares `prob`/`prob_se` so posterior audit fields are
 * STRIPPED at this teacher surface (data contract §8, task 36) — the server and
 * the shared package both declare them because the student side reads them.
 * Strict on the envelope, stripping on the audit member: that asymmetry is the
 * design. The guard therefore compares the ENVELOPE key sets only.
 */
const here = dirname(fileURLToPath(import.meta.url));

/** The server contract's base keys, read straight off the authority. */
const serverKeys = Object.keys(resultViewBaseSchema.shape).sort();

test('the web legacy envelope mirrors the server contract key-for-key', () => {
  const webKeys = Object.keys(legacyResultViewSchema.shape).sort();
  // The one legal addition: web's schema folds `combined_children` (the server
  // keeps it on the parent `resultViewSchema` via `.extend`) so a strict parse
  // of a placement parent cannot fall into the error fallback.
  expect(webKeys.filter((key) => !serverKeys.includes(key))).toEqual(['combined_children']);
  expect(serverKeys.filter((key) => !webKeys.includes(key))).toEqual([]);
});

test('the two keys whose drift broke the desktop are pinned on the web envelope', () => {
  const webKeys = Object.keys(legacyResultViewSchema.shape);
  for (const key of ['model_version', 'legacy_caveat']) {
    expect(webKeys, `web envelope carries ${key}`).toContain(key);
    expect(serverKeys, `server carries ${key}`).toContain(key);
  }
});

/** Guard the guard: the cross-repo import resolves to the real server file. */
test('the authority import is the real server contract, not a stale copy', () => {
  const source = readFileSync(
    join(here, '../../../schooltest-api/src/contracts/results.ts'),
    'utf8',
  );
  expect(source).toContain('legacy_caveat: z.literal');
  expect(source).toContain('model_version: z.string().min(1).nullish()');
});
