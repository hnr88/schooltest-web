import { describe, expect, test } from 'vitest';

import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';

import { classifyImportFailure } from '@/modules/student-import/lib/classify-import-failure';

/**
 * THE shared import-failure classifier — every surface (Students page, class
 * detail, ops) maps a refused preview/commit through it before showing
 * anything. The pinned rule: a refusal that carries a server code or a
 * server-shaped message surfaces THAT, never the generic "try again". The
 * seat-cap case is the one that burned a client demo: the batch precheck
 * refuses with 403 + `SEAT_CAP`, the same shape the per-create middleware
 * throws, and the classifier keys on the CODE so the two gates can never
 * drift apart in what the admin is told.
 */

/** A wire-shaped AxiosError with the given status and Strapi envelope. */
function refusalOf(status: number, details: Record<string, unknown>, message: string): AxiosError {
  const response = {
    status,
    data: { data: null, error: { status, name: 'Error', message, details } },
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

describe('classifyImportFailure', () => {
  test('a lost connection (no response) is generic — the receipt layer owns the truth', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(classifyImportFailure(error)).toEqual({ kind: 'generic' });
  });

  test('a non-axios error is generic', () => {
    expect(classifyImportFailure(new Error('boom'))).toEqual({ kind: 'generic' });
  });

  test('the seat cap is recognised by its CODE, whatever the status', () => {
    const error = refusalOf(403, { code: 'SEAT_CAP' }, 'Contact SchoolTest to add seats');
    expect(classifyImportFailure(error)).toEqual({ kind: 'seatCap' });
  });

  test('an inactive school is recognised by its code', () => {
    const error = refusalOf(403, { code: 'SCHOOL_INACTIVE' }, 'SCHOOL_INACTIVE');
    expect(classifyImportFailure(error)).toEqual({ kind: 'schoolInactive' });
  });

  test('a bare 403 with no code is a permission refusal', () => {
    const error = refusalOf(403, {}, 'Forbidden');
    expect(classifyImportFailure(error)).toEqual({ kind: 'forbidden' });
  });

  test('an oversize file is its own kind, not a generic failure', () => {
    const error = refusalOf(413, {}, 'csv exceeds the 5242880-byte limit');
    expect(classifyImportFailure(error)).toEqual({ kind: 'tooBig' });
  });

  test('a header-only file is reported as no rows, not "try again"', () => {
    const error = refusalOf(
      400,
      { code: 'NO_ROWS', errors: [{ path: 'csv', message: 'csv has no data rows' }] },
      'csv has no data rows',
    );
    expect(classifyImportFailure(error)).toEqual({ kind: 'noRows' });
  });

  test('other server refusals surface the server message verbatim — the corresponding error', () => {
    const error = refusalOf(
      400,
      { code: 'MISSING_COLUMNS', errors: [{ path: 'email', message: 'column is required' }] },
      'csv is missing template columns: email',
    );
    const failure = classifyImportFailure(error);
    expect(failure.kind).toBe('server');
    expect(failure.serverMessage).toBe('csv is missing template columns: email');
  });

  test('a 400 with no message has nothing specific to show', () => {
    const error = refusalOf(400, {}, '');
    expect(classifyImportFailure(error)).toEqual({ kind: 'generic' });
  });
});
