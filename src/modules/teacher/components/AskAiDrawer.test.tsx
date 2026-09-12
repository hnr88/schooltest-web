import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ClassAskAiDrawer } from '@/modules/teacher/components/ClassAskAiDrawer';
import { StudentAskAiDrawer } from '@/modules/teacher/components/StudentAskAiDrawer';
import { t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// The two scopes of the ONE drawer. Nothing here asks C-TA-1: an answer is a live
// model reply and belongs to `tests/e2e/teacher-v2/ask-ai.spec.ts`, which runs
// against the real endpoint. What is asserted here is everything the drawer decides
// on its own — which scope's request it answers to, whose copy it prints, and that
// a question is never answered from the browser (no router, no canned reply: the
// thread carries the question and the pending state, and nothing else).

const STUDENT = 'student-dilnoza';
const CLASS = 'qves8wrtl7r9ctw49jivm8gl';
const view = studentDetail(t2ResultDilnoza);

/** The t2 class the recorded fixture belongs to, as GET /api/teacher/dashboard returns it. */
const classCard = {
  class_document_id: CLASS,
  name: 'Reading 8B — Alvarez',
  year_level: null,
  student_count: 20,
  status: 'complete',
  latest_average: null,
  live_sitting: null,
} as unknown as DashboardClass;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(element: React.ReactElement): void {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        <QueryClientProvider client={client}>{element}</QueryClientProvider>
      </NextIntlClientProvider>,
    );
  });
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  act(() => useClassOverlaysStore.getState().close());
});

const drawer = () => document.body.querySelector('[data-slot="ask-ai-drawer"]');
const chips = () =>
  [...document.body.querySelectorAll('[data-slot="ask-ai-suggestion"]')].map((chip) => chip.textContent);
const bubbles = () =>
  [...document.body.querySelectorAll('[data-slot="ask-ai-message"]')].map((bubble) => ({
    role: bubble.getAttribute('data-role'),
    tone: bubble.getAttribute('data-tone'),
  }));

describe('the student Ask AI drawer', () => {
  test('stays closed until the student target is opened, then shows the grounding note', () => {
    mount(<StudentAskAiDrawer view={view} firstName="Dilnoza" classDocumentId={CLASS} studentDocumentId={STUDENT} />);
    expect(drawer()).toBeNull();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'class' }));
    expect(drawer()).toBeNull();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    expect(drawer()?.textContent).toContain('Ask about Dilnoza’s reading');
    expect(drawer()?.textContent).toContain('Answers are grounded only in the 8 forms Dilnoza has sat this year.');
    expect(chips()).toEqual([
      'What changed in Dilnoza’s score?',
      'What should I focus on next?',
      'How is Dilnoza’s vocabulary?',
    ]);
  });

  test('a suggestion posts the question and waits for the endpoint — it is never answered here', () => {
    mount(<StudentAskAiDrawer view={view} firstName="Dilnoza" classDocumentId={CLASS} studentDocumentId={STUDENT} />);
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    act(() => {
      document.body.querySelector<HTMLButtonElement>('[data-slot="ask-ai-suggestion"][data-intent="focus"]')?.click();
    });
    expect(bubbles()).toEqual([{ role: 'teacher', tone: 'answer' }]);
    expect(document.body.querySelector('[data-role="teacher"]')?.textContent).toBe(
      'What should I focus on with Dilnoza next?',
    );
    expect(document.body.querySelector('[data-slot="ask-ai-pending"]')?.textContent).toBe('Reading the results…');
  });

  test('leaving the page closes the drawer', () => {
    mount(<StudentAskAiDrawer view={view} firstName="Dilnoza" classDocumentId={CLASS} studentDocumentId={STUDENT} />);
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    act(() => root?.unmount());
    root = null;
    expect(useClassOverlaysStore.getState().askAiOpen).toBe(false);
  });
});

describe('the class Ask AI drawer', () => {
  test('answers the class-scope request only, and prints the class copy and chips', () => {
    mount(<ClassAskAiDrawer classCard={classCard} />);
    expect(drawer()).toBeNull();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    expect(drawer()).toBeNull();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'class' }));
    expect(drawer()?.textContent).toContain('Ask about Reading 8B — Alvarez');
    expect(drawer()?.textContent).toContain('Grounded in Reading 8B — Alvarez’s reading data');
    expect(drawer()?.textContent).toContain(
      'Ask anything about Reading 8B — Alvarez. Answers are grounded only in this class’s reading results.',
    );
    expect(chips()).toEqual([
      'What should I teach next?',
      'How has the class moved?',
      'How is the class’s vocabulary?',
    ]);
  });
});
