import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { PendingExitRequestsPanel } from '@/modules/teacher/components/live/PendingExitRequestsPanel';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// The wire is mocked at the strapi seam: the queue GET and the decision POST.
// The real module keeps its other exports — the auth store subscribes to
// `onAuthInvalid` at import time.
const strapi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
vi.mock('@/lib/axios/strapi', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  strapi,
}));

const SITTING = 'sitting-doc-1';
const REQUEST = {
  id: 'req-1',
  studentName: 'Dilnoza Karimova',
  sittingDocumentId: SITTING,
  testLabel: 'Reading A',
  reason: 'I feel sick and need to go to the office',
  createdAt: '2026-09-16T09:00:00.000Z',
};
const QUEUE = [REQUEST];

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(element: ReactElement, getAnswer: unknown): HTMLDivElement {
  strapi.get.mockResolvedValue({ data: getAnswer });
  strapi.post.mockResolvedValue({ data: { id: REQUEST.id, status: 'approved' } });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        <QueryClientProvider client={client}>{element}</QueryClientProvider>
      </NextIntlClientProvider>,
    );
  });
  return host;
}

async function flushUntil(check: () => boolean): Promise<void> {
  for (let i = 0; i < 50 && !check(); i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  strapi.get.mockReset();
  strapi.post.mockReset();
});

describe('the live tab pending-exit-requests panel', () => {
  test('renders the pending queue: student, test, time and reason', async () => {
    await act(async () => {
      mount(<PendingExitRequestsPanel sittingDocumentId={SITTING} />, QUEUE);
    });
    await flushUntil(
      () => (host as HTMLDivElement).querySelectorAll('[data-slot="pending-exit-request"]').length > 0,
    );
    const view = host as HTMLDivElement;

    expect(view.querySelectorAll('[data-slot="pending-exit-request"]')).toHaveLength(1);
    expect(view.textContent).toContain('Dilnoza Karimova');
    expect(view.textContent).toContain('Reading A');
    expect(view.textContent).toContain(REQUEST.reason);
    // The queue rides the sitting-scoped teacher read.
    expect(strapi.get).toHaveBeenCalledWith('/api/exit-requests/pending', {
      params: { sitting: SITTING },
    });
  });

  test('an empty queue says so instead of drawing rows', async () => {
    await act(async () => {
      mount(<PendingExitRequestsPanel sittingDocumentId={SITTING} />, []);
    });
    await flushUntil(
      () => (host as HTMLDivElement).querySelector('[data-slot="pending-exit-requests-empty"]') !== null,
    );
    const view = host as HTMLDivElement;

    expect(view.querySelector('[data-slot="pending-exit-requests-empty"]')?.textContent).toContain(
      'No student is waiting',
    );
    expect(view.querySelectorAll('[data-slot="pending-exit-request"]')).toHaveLength(0);
  });

  test('Approve POSTs the approve decision for that request id and refreshes the queue', async () => {
    await act(async () => {
      mount(<PendingExitRequestsPanel sittingDocumentId={SITTING} />, QUEUE);
    });
    await flushUntil(
      () => (host as HTMLDivElement).querySelectorAll('[data-slot="pending-exit-request"]').length > 0,
    );
    const row = (host as HTMLDivElement).querySelector('[data-request-id="req-1"]');
    const approve = row?.querySelector<HTMLButtonElement>('button:first-of-type');

    await act(async () => {
      approve?.click();
    });

    expect(strapi.post).toHaveBeenCalledWith('/api/exit-requests/req-1/approve');
  });

  test('Deny POSTs the deny decision for that request id', async () => {
    await act(async () => {
      mount(<PendingExitRequestsPanel sittingDocumentId={SITTING} />, QUEUE);
    });
    await flushUntil(
      () => (host as HTMLDivElement).querySelectorAll('[data-slot="pending-exit-request"]').length > 0,
    );
    const row = (host as HTMLDivElement).querySelector('[data-request-id="req-1"]');
    const buttons = row?.querySelectorAll<HTMLButtonElement>('button');
    const deny = buttons?.[1];

    await act(async () => {
      deny?.click();
    });

    expect(strapi.post).toHaveBeenCalledWith('/api/exit-requests/req-1/deny');
  });
});
