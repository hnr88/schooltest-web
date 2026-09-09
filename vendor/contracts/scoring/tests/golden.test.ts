/**
 * The 20 frozen golden fixtures (memo §10), parsed by the shared schemas.
 *
 * This is the TypeScript half of the mission rule that R's real output must
 * parse under `scoreResponseSchema`: the R suite proves the scorer is correct on
 * its own terms, and R tests cannot know what TypeScript accepts. A shape R was
 * happy with went unnoticed for four tasks precisely because nothing checked it
 * from this side. These fixtures are also what the worker and API tests score
 * against, so if they stop parsing here, those suites are building on sand.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { scoreRequestSchema, scoreResponseSchema } from '../src/index';

const GOLDEN_DIR = join(__dirname, '..', 'fixtures', 'golden');

type Golden = {
  _note: string;
  generator_version: string;
  generator_seed: number;
  frozen_at: string;
  matrix: 1 | 2;
  generating_profile: number[];
  generating_profile_index: number;
  expected_domain_scores: Record<string, number>;
  request: unknown;
  frozen_response: Record<string, any>;
};

const files = readdirSync(GOLDEN_DIR).filter((f) => f.endsWith('.json')).sort();
const golden: [string, Golden][] = files.map((f) => [
  f,
  JSON.parse(readFileSync(join(GOLDEN_DIR, f), 'utf8')) as Golden,
]);

describe('golden fixtures', () => {
  it('there are 20, four for Matrix 1 and sixteen for Matrix 2', () => {
    expect(golden).toHaveLength(20);
    expect(golden.filter(([, g]) => g.matrix === 1)).toHaveLength(4);
    expect(golden.filter(([, g]) => g.matrix === 2)).toHaveLength(16);
  });

  it.each(golden)('%s request parses under score-req/1', (_name, g) => {
    const parsed = scoreRequestSchema.safeParse(g.request);
    expect(parsed.error?.issues ?? []).toEqual([]);
    expect(parsed.success).toBe(true);
  });

  it.each(golden)('%s frozen response parses under score-resp/1', (_name, g) => {
    const parsed = scoreResponseSchema.safeParse(g.frozen_response);
    expect(parsed.error?.issues ?? []).toEqual([]);
    expect(parsed.success).toBe(true);
  });

  it.each(golden)('%s recovers its generating profile', (_name, g) => {
    const block = g.matrix === 1 ? g.frozen_response.matrix_1 : g.frozen_response.matrix_2;
    expect(block.map_profile).toEqual(g.generating_profile);
  });

  it.each(golden)('%s domain scores are within +/-3 of the analytic expectation', (_name, g) => {
    for (const [skill, expected] of Object.entries(g.expected_domain_scores)) {
      const got = g.frozen_response.attribute_scores[skill].domain_score;
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(3);
    }
  });

  it.each(golden)('%s records its seed, generator version and freeze date', (_name, g) => {
    expect(g.generator_version).toMatch(/^golden\/\d+$/);
    expect(Number.isInteger(g.generator_seed)).toBe(true);
    expect(g.frozen_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // The header must say the parameters are placeholders, not real ones.
    expect(g._note).toContain('SEEDED PLACEHOLDER');
    expect(g._note).toContain('not standard-setting values');
  });
});
