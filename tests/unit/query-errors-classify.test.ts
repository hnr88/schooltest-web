import { AxiosError } from 'axios';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { useQueryErrorReport } from '@/modules/query-errors/hooks/useQueryErrorReport';
import { classifyQueryError } from '@/modules/query-errors/lib/classify-query-error';

// teacher/04 — D-04. The classifier's 403 branch flips `gone` -> `forbidden`,
// which is what makes the kit's restricted arm reachable and the twelve
// already-translated `QueryError.forbidden*` strings render for the first
// time. Every OTHER outcome is untouched — this file pins all of them so the
// one-line flip cannot widen silently.

function axiosError(status?: number): AxiosError {
  return new AxiosError(
    'request failed',
    status === undefined ? 'ERR_NETWORK' : 'ERR_BAD_REQUEST',
    undefined,
    undefined,
    status === undefined ? undefined : ({ status } as never),
  );
}

describe('classifyQueryError — D-04 and the untouched outcomes', () => {
  test('403 is forbidden (the fix — was `{ kind: "gone" }` before teacher/04)', () => {
    expect(classifyQueryError(axiosError(403))).toEqual({ kind: 'forbidden' });
  });

  test('400 and 404 stay gone', () => {
    expect(classifyQueryError(axiosError(400))).toEqual({ kind: 'gone' });
    expect(classifyQueryError(axiosError(404))).toEqual({ kind: 'gone' });
  });

  test('a ZodError is broken/contract', () => {
    expect(classifyQueryError(new z.ZodError([]))).toEqual({
      kind: 'broken',
      cause: 'contract',
    });
  });

  test('an axios error without a response is broken/network', () => {
    expect(classifyQueryError(axiosError())).toEqual({ kind: 'broken', cause: 'network' });
  });

  test('any other axios status is broken/http carrying the status', () => {
    expect(classifyQueryError(axiosError(500))).toEqual({
      kind: 'broken',
      cause: 'http',
      status: 500,
    });
    expect(classifyQueryError(axiosError(429))).toEqual({
      kind: 'broken',
      cause: 'http',
      status: 429,
    });
  });

  test('a plain value is broken/unknown — the default is broken, never gone', () => {
    expect(classifyQueryError(new Error('unexpected'))).toEqual({
      kind: 'broken',
      cause: 'unknown',
    });
    expect(classifyQueryError('string failure')).toEqual({ kind: 'broken', cause: 'unknown' });
  });
});

describe('useQueryErrorReport — gone/forbidden stay quiet, broken leaves a trace', () => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (root && container) {
      act(() => {
        root?.unmount();
      });
    }
    root = null;
    container = null;
    vi.restoreAllMocks();
  });

  function mountWith(state: Parameters<typeof useQueryErrorReport>[0], error: unknown): void {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    function Probe(): null {
      useQueryErrorReport(state, error);
      return null;
    }
    act(() => {
      root?.render(createElement(Probe));
    });
  }

  test('broken logs once with its cause and status', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mountWith({ kind: 'broken', cause: 'http', status: 500 }, axiosError(500));
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain('http 500');
  });

  test('gone and forbidden are expected states and never log', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mountWith({ kind: 'gone' }, axiosError(404));
    mountWith({ kind: 'forbidden' }, axiosError(403));
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
