import { describe, expect, test } from 'vitest';

import { isStaleWrite, serverIssues } from '@/lib/form-errors';

// school-admin/04 — U-19 (SHARED-LAYER.md §F-server-errors). The server's field
// errors are PARSED against the contracted envelope, never walked.

function httpError(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data } };
}

function envelope(errors: unknown[]) {
  return {
    data: null,
    error: { status: 400, name: 'ValidationError', message: 'invalid', details: { errors } },
  };
}

describe('serverIssues', () => {
  test('a contracted 400 yields its field issues, with (root) and If-Match dropped', () => {
    const issues = serverIssues(
      httpError(
        400,
        envelope([
          { path: 'name', message: 'Required' },
          { path: '(root)', message: 'Form-level' },
          { path: 'If-Match', message: 'Missing' },
          { path: 'contact_email', message: 'Invalid email' },
        ]),
      ),
    );
    expect(issues).toEqual([
      { path: 'name', message: 'Required' },
      { path: 'contact_email', message: 'Invalid email' },
    ]);
  });

  test('anything that is not a contracted 400 yields []', () => {
    expect(serverIssues(httpError(409, envelope([{ path: 'name', message: 'Taken' }])))).toEqual([]);
    expect(serverIssues(httpError(500, envelope([{ path: 'name', message: 'Boom' }])))).toEqual([]);
    expect(serverIssues(httpError(400, { error: 'not an envelope' }))).toEqual([]);
    expect(serverIssues(new Error('network down'))).toEqual([]);
    expect(serverIssues(undefined)).toEqual([]);
    expect(serverIssues(null)).toEqual([]);
  });

  test('a payload the old optional-chain walk accepted, but fieldIssueSchema refuses, is rejected', () => {
    // An array `path` plus an extra key: the walk stringified it into a usable
    // issue; the strict fieldIssueSchema refuses it, so no issue is invented.
    const walkable = httpError(
      400,
      envelope([{ path: ['name'], message: 'Required', name: 'ValidationError' }]),
    );
    expect(serverIssues(walkable)).toEqual([]);
  });
});

describe('isStaleWrite', () => {
  test('is true only for HTTP 412 — a 409 is not a stale write', () => {
    expect(isStaleWrite(httpError(412, {}))).toBe(true);
    expect(isStaleWrite(httpError(409, {}))).toBe(false);
    expect(isStaleWrite(httpError(400, envelope([])))).toBe(false);
    expect(isStaleWrite(new Error('network down'))).toBe(false);
    expect(isStaleWrite(undefined)).toBe(false);
  });
});
