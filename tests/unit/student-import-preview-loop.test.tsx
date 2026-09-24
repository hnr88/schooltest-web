import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { classifyRestFailure } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { useStudentImport } from '@/modules/ops/hooks/use-student-import';
import type { StudentImportApi } from '@/modules/ops/types/import.types';

// The auto-preview loop guard: the modal validates the moment a csv AND a
// class are set, with no "Preview" click. A failed (e.g. HTTP 400) preview
// leaves `preview` null and `isPending` false, so without the
// `previewMutation.isError` early-return the effect would refire on that
// transition and retry the same doomed request forever. And the guard must
// be liftable: `invalidate()` calls `previewMutation.reset()`, so changing
// the file or the class re-arms auto-preview for the NEW input. This file
// pins both halves so neither can regress.

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/modules/ops/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/ops/actions')>();
  return {
    ...actual,
    showOpsToast: vi.fn(),
    useOpsWriteGate: () => ({
      blockedReason: () => null,
      retryWhenBlocked: false,
      retryLabel: 'Retry',
      readOnly: false,
    }),
  };
});

// The template's own bytes — content is irrelevant to the transport mock; the
// hook only checks that it is non-empty.
const CSV = 'given_name,family_name,birth_date,year_level,language\r\nSample,Student,2013-03-04,8,english\r\n';

/** A 400 exactly as the axios boundary delivers one: AxiosError + restFailure. */
function badRequest(): AxiosError {
  const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 400,
  } as never);
  // The strapi axios response interceptor attaches this before rejecting.
  (error as AxiosError & { restFailure?: unknown }).restFailure = classifyRestFailure({
    status: 400,
    body: null,
    tokenWasAttached: true,
  });
  return error;
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let queryClient: QueryClient | null = null;
let latest: StudentImportApi | null = null;
let postSpy: ReturnType<typeof vi.spyOn>;

function Harness({ initialClass }: { initialClass: string }) {
  const api = useStudentImport('school-1', { initialClassDocumentId: initialClass });
  useEffect(() => {
    latest = api;
  });
  return (
    <div>
      <p data-testid="card">{api.card}</p>
      <p data-testid="error">{api.errorMessage}</p>
      <button
        type="button"
        data-testid="load-csv"
        onClick={() => api.onCsvChange(CSV)}
      >
        load-csv
      </button>
      <button
        type="button"
        data-testid="change-class"
        onClick={() => api.onClassChange('class-2')}
      >
        change-class
      </button>
    </div>
  );
}

function mountHarness(initialClass: string) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient = client;
  act(() => {
    root!.render(
      <QueryClientProvider client={client}>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <Harness initialClass={initialClass} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
}

async function click(testId: string) {
  const button = document.body.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`);
  expect(button).not.toBeNull();
  await act(async () => {
    button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** Drain every pending microtask and let react-query settle across renders. */
async function settle() {
  for (let i = 0; i < 10; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  await act(async () => {
    await new Promise((resolveTimer) => setTimeout(resolveTimer, 25));
  });
}

beforeEach(() => {
  postSpy = vi.spyOn(strapi, 'post').mockImplementation(() => Promise.reject(badRequest()));
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  queryClient?.clear();
  queryClient = null;
  latest = null;
  document.body.innerHTML = '';
  postSpy.mockRestore();
});

describe('useStudentImport auto-preview loop guard', () => {
  test('a 400 preview fires exactly ONE request — the failure never auto-retries', async () => {
    mountHarness('class-1');
    // No csv yet — the effect must not have fired on mount.
    expect(postSpy).not.toHaveBeenCalled();

    await click('load-csv');
    await settle();

    // The preview ran and failed with the simulated 400...
    expect(postSpy).toHaveBeenCalledTimes(1);
    const [url, body] = postSpy.mock.calls[0] as [string, { csv: string; class_documentId: string }];
    expect(url).toBe('/api/ops/schools/school-1/import-students/preview');
    expect(body.csv).toBe(CSV);
    expect(body.class_documentId).toBe('class-1');
    expect(latest?.card).toBe('failed');
    expect(latest?.errorMessage).not.toBeNull();

    // ...and the loop is dead: everything settles again, still one request.
    await settle();
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  test('changing the class re-arms the preview after a 400 (reset cleared the error)', async () => {
    mountHarness('class-1');
    await click('load-csv');
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);

    await click('change-class');
    await settle();

    // Without `previewMutation.reset()` in `invalidate()`, the effect's
    // `isError` guard would still hold and no second request would fire.
    expect(postSpy).toHaveBeenCalledTimes(2);
    const [url, body] = postSpy.mock.calls[1] as [string, { csv: string; class_documentId: string }];
    expect(url).toBe('/api/ops/schools/school-1/import-students/preview');
    expect(body.class_documentId).toBe('class-2');
    expect(body.csv).toBe(CSV);

    // The second attempt fails too and must not loop either.
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(2);
  });
});
