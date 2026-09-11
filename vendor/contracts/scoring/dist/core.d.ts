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
export declare const nonEmptyString: z.ZodString;
/** Marginal posterior P(alpha_k = 1). spec v2 §4.2: every `prob` in [0,1]. */
export declare const probSchema: z.ZodNumber;
/** Any posterior SD / standard error. spec v2 §4.2: every `se` >= 0. */
export declare const standardErrorSchema: z.ZodNumber;
/**
 * The ONE currency of score (spec v2 §6.1, data contract §2.1): an expected
 * domain score on 0-100. Integer — the SE carries the precision (spec v2 §2.3).
 */
export declare const domainScoreSchema: z.ZodNumber;
/** A latent ability estimate. Audit-only on the wire; no client renders it. */
export declare const thetaSchema: z.ZodNumber;
/** memo §7: `items_seen` is the ONLY evidence-count name. `items` is retired. */
export declare const itemsSeenSchema: z.ZodNumber;
/** A count of items scored (spec v2 §2.6 echoes). */
export declare const itemCountSchema: z.ZodNumber;
/** A 0/1 attribute indicator — profiles and Q-vectors are binary, never `true`. */
export declare const binaryIndicatorSchema: z.ZodLiteral<0 | 1>;
/** An item response: dichotomous, 0 or 1 (spec v2 §3.1). */
export declare const itemScoreSchema: z.ZodLiteral<0 | 1>;
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
export declare const notAssessedSchema: z.ZodObject<{
    status: z.ZodLiteral<"not_assessed">;
    insufficient_evidence: z.ZodOptional<z.ZodBoolean>;
    items_seen: z.ZodNumber;
}, z.core.$strict>;
export type NotAssessed = z.infer<typeof notAssessedSchema>;
/**
 * How a growth delta is RENDERED (spec v2 §6.2, data contract D7). Strapi
 * decides; no client re-derives it (dashboard D3).
 * - `"steady"` — the change did not clear `RELIABLE_CHANGE_Z * se_diff`.
 * - `"band_movement"` — the skill is not in `ANCHORED_SKILLS`, so a point delta
 *   would be a false claim (data contract D2); the bands moved instead.
 * - `"+15"` / `"-10"` — a reliable change, coarsened to `COARSE_STEP`.
 */
export declare const deltaDisplaySchema: z.ZodUnion<readonly [z.ZodEnum<{
    steady: "steady";
    band_movement: "band_movement";
}>, z.ZodString]>;
export type DeltaDisplay = z.infer<typeof deltaDisplaySchema>;
/** Tolerance for the "profile posterior sums to 1" rule (spec v2 §4.2). */
export declare const PROFILE_POSTERIOR_SUM_TOLERANCE = 0.000001;
