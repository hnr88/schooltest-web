import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
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
