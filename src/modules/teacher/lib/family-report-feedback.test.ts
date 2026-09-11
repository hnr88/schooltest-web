import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { classifyRestFailure } from '@schooltest/ops-contracts';

import { resultReleaseOutcomeSchema } from '@/modules/results';
import recallEmpty400 from '@/modules/results/schemas/__fixtures__/t2-recall-empty-400.json';
import recallHeld409 from '@/modules/results/schemas/__fixtures__/t2-recall-held-409.json';
import release200 from '@/modules/results/schemas/__fixtures__/t2-release-200.json';
import { failureReasonKey, releaseBatchSummary } from '@/modules/teacher/lib/family-report-feedback';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { familyReportRow } from '@/modules/teacher/lib/v2/family-reports';

// The failures carry the recorded error bodies, classified the way the strapi
// interceptor classifies them; the outcomes are the recorded release body.
function failure(status: number | null, body: unknown): AxiosError {
  const error = new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST);
  return Object.assign(error, { restFailure: classifyRestFailure({ status, body, tokenWasAttached: true, writeSent: true }) });
}

const rows = t2Roster.map(familyReportRow);
const scored = rows.flatMap((row) => (row.resultDocumentId === null ? [] : [{ id: row.resultDocumentId, name: row.name }]));
const recorded = resultReleaseOutcomeSchema.parse(release200.body);
const releasedAs = (id: string) => ({ ...recorded, document_id: id });

describe('failureReasonKey', () => {
  it('reads the recorded 409 as "not complete yet"', () => {
    expect(failureReasonKey(failure(recallHeld409.status, recallHeld409.body))).toBe('errors.notReady');
  });

  it('reads the recorded 400 and a non-HTTP error as the generic refusal', () => {
    expect(failureReasonKey(failure(recallEmpty400.status, recallEmpty400.body))).toBe('errors.generic');
    expect(failureReasonKey(new Error('parse'))).toBe('errors.generic');
  });

  it('reads a request that never got a response as a dropped connection', () => {
    expect(failureReasonKey(failure(null, undefined))).toBe('errors.transport');
  });
});

describe('releaseBatchSummary', () => {
  it('every held report released: ok, counts from the outcomes', () => {
    const summary = releaseBatchSummary({ released: [releasedAs(scored[0].id), releasedAs(scored[1].id)], failed: [] }, rows);
    expect(summary).toEqual({ tone: 'ok', released: 2, total: 2, failures: [] });
  });

  it('some refused with 409: warn, the refused students named under their reason', () => {
    const summary = releaseBatchSummary(
      {
        released: [releasedAs(scored[0].id)],
        failed: [
          { resultDocumentId: scored[1].id, error: failure(recallHeld409.status, recallHeld409.body) },
          { resultDocumentId: scored[2].id, error: failure(recallHeld409.status, recallHeld409.body) },
        ],
      },
      rows,
    );
    expect(summary.tone).toBe('warn');
    expect(summary.released).toBe(1);
    expect(summary.total).toBe(3);
    expect(summary.failures).toEqual([{ reasonKey: 'errors.notReady', names: [scored[1].name, scored[2].name] }]);
  });

  it('nothing released: error', () => {
    const summary = releaseBatchSummary(
      { released: [], failed: [{ resultDocumentId: scored[0].id, error: new Error('parse') }] },
      rows,
    );
    expect(summary).toEqual({
      tone: 'error',
      released: 0,
      total: 1,
      failures: [{ reasonKey: 'errors.generic', names: [scored[0].name] }],
    });
  });
});
