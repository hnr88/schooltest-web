import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ClassLiveCodeBar } from '@/modules/teacher/components/ClassLiveCodeBar';
import t2Open from '@/modules/teacher/lib/__fixtures__/test-sessions-open.t2.json';
import { teacherTestSessionsResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { TeacherTestSessionsResponse } from '@/modules/teacher/types/teacher-session.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// The sticky join code over the class detail. Its rows are GET
// /api/teacher/test-sessions?status=open&class=<id> as it was RECORDED live for
// t2@ (2026-09-11) — three sittings open at once on one class — parsed by the
// same contract the query parses, and seeded into the cache under the key the
// Live tab's own read already uses. Nothing is faked and nothing is re-shaped:
// the bar sees exactly the server's answer.
const CLASS = 'qves8wrtl7r9ctw49jivm8gl';
const live = teacherTestSessionsResponseSchema.parse(t2Open);
const none = teacherTestSessionsResponseSchema.parse({ sessions: [] });
const [first, second] = live.sessions;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(element: ReactElement, sessions: TeacherTestSessionsResponse): HTMLDivElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnMount: false } },
  });
  client.setQueryData(['teacher', 'test-sessions', { status: 'open', class: CLASS }], sessions);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        <QueryClientProvider client={client}>{element}</QueryClientProvider>
      </NextIntlClientProvider>,
    );
  });
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.restoreAllMocks();
});

const bar = (view: HTMLElement) => view.querySelector('[data-slot="class-live-code-bar"]');
const code = (view: HTMLElement) =>
  view.querySelector('[data-slot="class-live-code"]')?.textContent;
const copyButton = (view: HTMLElement) =>
  view.querySelector<HTMLButtonElement>('[data-slot="class-live-copy"]');

describe('the class detail live code bar', () => {
  test('prints the served join code of the live sitting, with the LIVE chip and the test', () => {
    const view = mount(
      <ClassLiveCodeBar classDocumentId={CLASS} sessionId={null} onSelectSitting={vi.fn()} />,
      live,
    );
    expect(bar(view)?.getAttribute('data-sitting-id')).toBe(first?.sitting_document_id);
    expect(code(view)).toBe(first?.code);
    expect(bar(view)?.textContent).toContain('LIVE');
    expect(bar(view)?.textContent).toContain(first?.form?.label);
  });

  test('draws nothing at all when the class has no sitting open', () => {
    const view = mount(
      <ClassLiveCodeBar classDocumentId={CLASS} sessionId={null} onSelectSitting={vi.fn()} />,
      none,
    );
    expect(bar(view)).toBeNull();
    expect(view.textContent).toBe('');
  });

  test('Copy code writes the real code to the clipboard and reads Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const view = mount(
      <ClassLiveCodeBar classDocumentId={CLASS} sessionId={null} onSelectSitting={vi.fn()} />,
      live,
    );
    expect(copyButton(view)?.textContent).toContain('Copy code');
    await act(async () => {
      copyButton(view)?.click();
    });
    expect(writeText).toHaveBeenCalledWith(first?.code);
    expect(copyButton(view)?.textContent).toContain('Copied');
  });

  test('concurrent sittings each get a chip; picking one asks for that sitting', () => {
    const onSelectSitting = vi.fn();
    const view = mount(
      <ClassLiveCodeBar
        classDocumentId={CLASS}
        sessionId={null}
        onSelectSitting={onSelectSitting}
      />,
      live,
    );
    const chips = [
      ...view.querySelectorAll<HTMLButtonElement>('[data-slot="class-live-code-switch"] button'),
    ];
    expect(chips).toHaveLength(live.sessions.length);
    expect(chips.map((chip) => chip.getAttribute('data-sitting-id'))).toEqual(
      live.sessions.map((session) => session.sitting_document_id),
    );
    expect(chips[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(chips[1]?.textContent).toContain(second?.code);
    act(() => chips[1]?.click());
    expect(onSelectSitting).toHaveBeenCalledWith(second?.sitting_document_id);
  });

  test('the sitting named by ?session= is the one the bar shows and copies', () => {
    const view = mount(
      <ClassLiveCodeBar
        classDocumentId={CLASS}
        sessionId={second?.sitting_document_id ?? null}
        onSelectSitting={vi.fn()}
      />,
      live,
    );
    expect(code(view)).toBe(second?.code);
    expect(bar(view)?.getAttribute('data-sitting-id')).toBe(second?.sitting_document_id);
  });
});
