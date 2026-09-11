/**
 * Every fixture parses under its schema. `fixtures/*.json` is the one valid
 * example per schema that every consumer's tests reuse (task 01), so if one of
 * these stops parsing, an eleven-task-deep contract has moved.
 */
import { describe, expect, it } from 'vitest';

import {
  diagnosticExportSchema,
  errorPatternSchema,
  resultHistoryPointSchema,
  resultViewSchema,
  scoreRequestSchema,
  scoreResponseSchema,
  storedResultSchema,
} from '../src/index';

import diagnosticExportFixture from '../fixtures/diagnostic-export.json';
import errorPatternFixture from '../fixtures/error-pattern.json';
import resultHistoryPointFixture from '../fixtures/result-history-point.json';
import resultViewFixture from '../fixtures/result-view.json';
import scoreReqFixture from '../fixtures/score-req.json';
import scoreRespFixture from '../fixtures/score-resp.json';
import storedResultFixture from '../fixtures/stored-result.json';

const cases = [
  ['score-req.json', scoreRequestSchema, scoreReqFixture],
  ['score-resp.json', scoreResponseSchema, scoreRespFixture],
  ['stored-result.json', storedResultSchema, storedResultFixture],
  ['result-view.json', resultViewSchema, resultViewFixture],
  ['result-history-point.json', resultHistoryPointSchema, resultHistoryPointFixture],
  ['error-pattern.json', errorPatternSchema, errorPatternFixture],
  ['diagnostic-export.json', diagnosticExportSchema, diagnosticExportFixture],
] as const;

describe('fixtures', () => {
  it.each(cases)('%s parses', (_name, schema, fixture) => {
    const parsed = schema.safeParse(fixture);
    expect(parsed.error?.issues ?? []).toEqual([]);
    expect(parsed.success).toBe(true);
  });
});
