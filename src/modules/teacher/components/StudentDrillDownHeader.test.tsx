import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { StudentComingSoon } from '@/modules/teacher/components/StudentComingSoon';
import { StudentDrillDownHeader } from '@/modules/teacher/components/StudentDrillDownHeader';
import { t2ResultDilnoza, t2Row } from '@/modules/teacher/lib/v2/__fixtures__/t2';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import type { StudentDetailActions } from '@/modules/teacher/types/student-drill-down.types';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(ui: ReactElement): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  host = container;
  root = createRoot(container);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>,
    );
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const view = studentDetail(t2ResultDilnoza);
const name = t2Row('Dilnoza').student.name;
const button = (page: HTMLElement, label: string) =>
  [...page.querySelectorAll('button')].find((element) => element.textContent === label);
const handlers = (overrides: Partial<StudentDetailActions> = {}): StudentDetailActions => ({
  exportPending: false,
  exportFailed: false,
  exportMarkdown: vi.fn(),
  askAiOpen: false,
  askAi: vi.fn(),
  copy: vi.fn(),
  ...overrides,
});

function header(
  actions: StudentDetailActions | null,
  onValueChange = vi.fn(),
  overall: StudentDetailView['overall'] | null = view.overall,
) {
  return render(
    <StudentDrillDownHeader
      studentName={name}
      className="7A EAL/D"
      overall={overall}
      actions={actions}
      skill="reading"
      onValueChange={onValueChange}
    />,
  );
}

describe('student page header', () => {
  test('name, class, the overall chip with the server step, and the two actions', () => {
    const actions = handlers();
    const page = header(actions);
    expect(page.querySelector('h1')?.textContent).toBe(name);
    expect(page.querySelector('[data-slot="student-meta"]')?.textContent).toBe('7A EAL/D · Reading');
    expect(page.querySelector('[data-slot="student-overall-score"]')?.textContent).toBe('41%');
    expect(page.querySelector('[data-slot="student-overall-delta"]')?.textContent).toBe('↓ −45 pts');
    const exportButton = button(page, 'Export for LLM');
    expect(exportButton?.getAttribute('title')).toBe('Download a de-identified data file for your AI assistant');
    act(() => exportButton?.click());
    expect(actions.exportMarkdown).toHaveBeenCalledTimes(1);
    act(() => button(page, 'Ask AI')?.click());
    expect(actions.askAi).toHaveBeenCalledTimes(1);
    expect(page.querySelector('[role="alert"]')).toBeNull();
  });

  test('the skill select lists Reading and three coming-soon skills, and reports a pick', () => {
    const onValueChange = vi.fn();
    const page = header(handlers(), onValueChange);
    const select = page.querySelector('select');
    expect(select?.getAttribute('aria-label')).toBe('Skill');
    expect([...(select?.options ?? [])].map((option) => option.textContent)).toEqual([
      'Reading',
      'Listening — coming soon',
      'Writing — coming soon',
      'Speaking — coming soon',
    ]);
    act(() => {
      if (select === null) return;
      select.value = 'listening';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onValueChange).toHaveBeenCalledWith('listening');
  });

  test('a refused export is said in text beside the actions', () => {
    const page = header(handlers({ exportFailed: true }));
    expect(page.querySelector('[role="alert"]')?.textContent).toBe(enMessages.Teacher.results.export.failed);
  });

  test('no scored result: no overall chip and no actions', () => {
    const page = header(null, vi.fn(), null);
    expect(page.querySelector('[data-slot="student-overall"]')).toBeNull();
    expect(button(page, 'Export for LLM')).toBeUndefined();
    expect(button(page, 'Ask AI')).toBeUndefined();
  });
});

describe('student page coming-soon block', () => {
  test('names the skill and the student, and Back to Reading returns to Reading', () => {
    const onValueChange = vi.fn();
    const page = render(<StudentComingSoon skill="writing" onValueChange={onValueChange} firstName="Dilnoza" />);
    expect(page.querySelector('h2')?.textContent).toBe('Writing is coming soon');
    expect(page.querySelector('[data-slot="coming-soon-panel"] p')?.textContent).toContain('Dilnoza’s Writing profile');
    expect(page.querySelector('select')?.value).toBe('writing');
    act(() => button(page, 'Back to Reading')?.click());
    expect(onValueChange).toHaveBeenCalledWith('reading');
  });
});
