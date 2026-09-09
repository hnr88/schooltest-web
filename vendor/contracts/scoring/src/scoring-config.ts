/**
 * Scoring configuration keys (task 05, spec v2 §8) — the tunables Strapi owns
 * as reporting/measurement policy and reads off the ACTIVE `api::config.config`
 * row. ONE contract in three places (house rule 2): the seeder writes them,
 * `r-scoring.loaders.ts loadScoringConfig` validates the row through
 * `scoringConfigSchema`, and later tasks (16 storage, 17 bands, 22 growth)
 * consume the parsed object rather than re-reading Config ad hoc.
 *
 * Deliberately ABSENT here: the overall transform `a`/`b`, the Section 3
 * `cut` and the reference pools (memo §9) — those live in the anchor registry
 * (task 06), never in Config, never invented in code.
 */
import { z } from 'zod';

/**
 * The seven keys and their seeded defaults (spec v2 §8 table):
 *   model_version 'reading-3model/1' · reliable_change_z 1.5 · coarse_step 5 ·
 *   min_items_per_skill 4 · min_errors_for_patterns 4 · anchored_skills [] ·
 *   low_confidence_se_threshold 1.5.
 *
 * `low_confidence_se_threshold` shares the reliable-change yardstick — the data
 * contract §2.3 SE rule (`|Δ| ≥ Z·se_diff`, "Z default = 1.5") is the only SE
 * rule the contract defines, so the interim default IS that Z. Like every
 * standard-setting-adjacent number it is PROVISIONAL until calibration lands;
 * a consumer must treat it as a tunable, never as a derived constant.
 *
 * Every key is REQUIRED: `loadScoringConfig` faults naming the missing key
 * rather than falling back to a literal in code (task 05 fail-loud rule).
 *
 * `low_confidence_se_threshold` is typed `null` ON PURPOSE (orchestrator
 * ruling, task 05): spec v2 line 252 sources low_confidence from "the SE
 * thresholds in the data contract", but the data contract never specifies an
 * absolute single-estimate SE cut — §2.3's Z (1.5) is the reliable-change
 * multiplier on a DIFFERENCE, not this quantity. The seeded value is an
 * explicit unknown pending standard setting, and task 20 (which owns
 * low_confidence) must NOT emit `false` while it is null. Widening this to a
 * number is a deliberate contract change once standard setting lands.
 */
export const scoringConfigSchema = z.object({
  model_version: z.string().min(1),
  reliable_change_z: z.number(),
  coarse_step: z.number().int().positive(),
  min_items_per_skill: z.number().int().positive(),
  min_errors_for_patterns: z.number().int().positive(),
  anchored_skills: z.array(z.string()),
  low_confidence_se_threshold: z.null(),
});

/** The parsed scoring-keys object `loadScoringConfig` returns. */
export type ScoringConfigKeys = z.infer<typeof scoringConfigSchema>;
