/**
 * Primitives shared by every module in this package.
 *
 * Keep this file FREE of local imports. When the primitives lived in index.ts
 * and each module imported back from './core', the sibling ops-contracts package
 * formed a CommonJS import cycle that resolved to `undefined` during Strapi's
 * synchronous config load. Same rule here.
 *
 * `zod@4`'s `z.number()` already rejects `NaN` and `±Infinity`, which is spec v2
 * §4.2's "all values finite" — no `.finite()` needed.
 */
import { z } from 'zod';

export const nonEmptyString = z.string().min(1);

/** Marginal posterior P(alpha_k = 1). spec v2 §4.2: every `prob` in [0,1]. */
export const probSchema = z.number().min(0).max(1);

/** Any posterior SD / standard error. spec v2 §4.2: every `se` >= 0. */
export const standardErrorSchema = z.number().min(0);

/**
 * The ONE currency of score (spec v2 §6.1, data contract §2.1): an expected
 * domain score on 0-100. Integer — the SE carries the precision (spec v2 §2.3).
 */
export const domainScoreSchema = z.number().int().min(0).max(100);

/** A latent ability estimate. Audit-only on the wire; no client renders it. */
export const thetaSchema = z.number();

/** memo §7: `items_seen` is the ONLY evidence-count name. `items` is retired. */
export const itemsSeenSchema = z.number().int().min(0);

/** A count of items scored (spec v2 §2.6 echoes). */
export const itemCountSchema = z.number().int().min(0);

/** A 0/1 attribute indicator — profiles and Q-vectors are binary, never `true`. */
export const binaryIndicatorSchema = z.literal([0, 1]);

/** An item response: dichotomous, 0 or 1 (spec v2 §3.1). */
export const itemScoreSchema = z.literal([0, 1]);

/**
 * NOT-ASSESSED IS ALWAYS THIS OBJECT (memo §7, spec v2 §3.1.6, §5.3). The bare
 * string `"not_assessed"` that `resultAttributeEntrySchema` still accepts in the
 * API's v1 contract does not exist anywhere in this package: a sentinel string
 * cannot carry the evidence count that makes the claim honest.
 *
 * `insufficient_evidence` is optional because it distinguishes two different
 * absences: `true` means items were seen but fewer than `MIN_ITEMS_PER_SKILL`
 * (§5.3); absent means zero items were reached at all (§3.1.6).
 */
export const notAssessedSchema = z.strictObject({
  status: z.literal('not_assessed'),
  insufficient_evidence: z.boolean().optional(),
  items_seen: itemsSeenSchema,
});
export type NotAssessed = z.infer<typeof notAssessedSchema>;

/**
 * How a growth delta is RENDERED (spec v2 §6.2, data contract D7). Strapi
 * decides; no client re-derives it (dashboard D3).
 * - `"steady"` — the change did not clear `RELIABLE_CHANGE_Z * se_diff`.
 * - `"band_movement"` — the skill is not in `ANCHORED_SKILLS`, so a point delta
 *   would be a false claim (data contract D2); the bands moved instead.
 * - `"+15"` / `"-10"` — a reliable change, coarsened to `COARSE_STEP`.
 */
export const deltaDisplaySchema = z.union([
  z.enum(['steady', 'band_movement']),
  z.string().regex(/^[+-]\d+$/, 'a coarse delta is a signed integer, e.g. "+15"'),
]);
export type DeltaDisplay = z.infer<typeof deltaDisplaySchema>;

/** Tolerance for the "profile posterior sums to 1" rule (spec v2 §4.2). */
export const PROFILE_POSTERIOR_SUM_TOLERANCE = 1e-6;
