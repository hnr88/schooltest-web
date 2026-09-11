import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { StudentAskAiDrawer } from '@/modules/teacher/components/StudentAskAiDrawer';
import { t2ResultDilnoza } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const STUDENT = 'student-dilnoza';
const view = studentDetail(t2ResultDilnoza);
let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(): void {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        <StudentAskAiDrawer view={view} firstName="Dilnoza" studentDocumentId={STUDENT} />
      </NextIntlClientProvider>,
    );
  });
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const drawer = () => document.body.querySelector('[data-slot="student-ask-ai"]');
const bubbles = () =>
  [...document.body.querySelectorAll('[data-slot="student-ask-message"]')].map((bubble) => ({
    role: bubble.getAttribute('data-role'),
    title: bubble.querySelector('[data-slot="student-ask-answer-title"]')?.textContent ?? null,
  }));

describe('student Ask AI drawer', () => {
  test('stays closed until the student target is opened, then shows the grounding note', () => {
    mount();
    expect(drawer()).toBeNull();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'class' }));
    expect(drawer()).toBeNull();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    expect(drawer()?.textContent).toContain('Ask about Dilnoza’s reading');
    expect(drawer()?.textContent).toContain('Answers are grounded only in the 8 forms Dilnoza has sat this year.');
  });

  test('a suggestion asks its question and answers it under the topic title', () => {
    mount();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    const focus = document.body.querySelector<HTMLButtonElement>('[data-slot="student-ask-suggestion"][data-intent="focus"]');
    act(() => focus?.click());
    expect(bubbles()).toEqual([
      { role: 'teacher', title: null },
      { role: 'ai', title: 'Where to focus next' },
    ]);
    expect(document.body.querySelector('[data-role="teacher"]')?.textContent).toBe(
      'What should I focus on with Dilnoza next?',
    );
  });

  test('a typed question is sent on submit and routed by its words', () => {
    mount();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    const input = document.body.querySelector<HTMLInputElement>('[data-slot="student-ask-ai"] input');
    act(() => {
      if (input === null) return;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, 'Which words does she know?');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => document.body.querySelector<HTMLButtonElement>('[data-slot="student-ask-send"]')?.click());
    expect(bubbles().at(-1)).toEqual({ role: 'ai', title: 'Vocabulary picture' });
    expect(input?.value).toBe('');
  });

  test('leaving the page closes the drawer', () => {
    mount();
    act(() => useClassOverlaysStore.getState().openAskAi({ scope: 'student', studentDocumentId: STUDENT }));
    act(() => root?.unmount());
    root = null;
    expect(useClassOverlaysStore.getState().askAiOpen).toBe(false);
  });
});
